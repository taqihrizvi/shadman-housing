import express from 'express';
import prisma from '../config/database.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Generate form numbers
const generateFormNumber = async (prefix) => {
  const year = new Date().getFullYear();
  const lastForm = await (
    prefix === 'BF' ? prisma.biyana :
    prefix === 'SA' ? prisma.saleAgreement :
    prisma.transferForm
  ).findFirst({
    orderBy: { createdAt: 'desc' },
  });
  
  let number = 1;
  if (lastForm) {
    const lastNumber = parseInt(lastForm[
      prefix === 'BF' ? 'formNumber' :
      prefix === 'SA' ? 'agreementNumber' :
      'transferNumber'
    ].split('-')[2]);
    number = lastNumber + 1;
  }
  
  return `${prefix}-${year}-${String(number).padStart(4, '0')}`;
};

// ============ BIYANA ROUTES ============

// @route   GET /api/forms/biyana
// @desc    Get all biyana forms
// @access  Private
router.get('/biyana', protect, async (req, res) => {
  try {
    const biyanas = await prisma.biyana.findMany({
      include: {
        customer: { select: { name: true, fatherName: true, cnic: true, phone: true, address: true } },
        plot: { select: { plotNo: true, project: true, size: true, block: true, price: true } },
        createdBy: { select: { name: true } },
        approvedBy: { select: { name: true, signature: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: biyanas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/forms/biyana
// @desc    Create biyana form
// @access  Private
router.post('/biyana', protect, async (req, res) => {
  try {
    const formNumber = await generateFormNumber('BF');
    
    const biyanaData = {
      ...req.body,
      formNumber,
      status: 'PENDING', // Set status as PENDING for approval
      createdById: req.user.id,
    };

    const biyana = await prisma.biyana.create({
      data: biyanaData,
    });

    // Update plot status to PENDING when form is submitted
    await prisma.inventory.update({
      where: { id: req.body.plotId },
      data: { status: 'PENDING' },
    });

    res.status(201).json({
      success: true,
      data: biyana,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ============ SALE AGREEMENT ROUTES ============

// @route   GET /api/forms/sale-agreement
// @desc    Get all sale agreements
// @access  Private
router.get('/sale-agreement', protect, async (req, res) => {
  try {
    const agreements = await prisma.saleAgreement.findMany({
      include: {
        customer: { select: { name: true, fatherName: true, cnic: true, phone: true, address: true } },
        plot: { select: { plotNo: true, project: true, size: true, block: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate total paid (downPayment + biyana + vouchers) for each agreement
    const agreementsWithPayments = await Promise.all(
      agreements.map(async (agreement) => {
        // Get vouchers
        const vouchers = await prisma.voucher.findMany({
          where: {
            plotId: agreement.plotId,
            customerId: agreement.customerId,
            type: 'RECEIPT',
          },
        });
        
        // Get biyana
        const biyana = await prisma.biyana.findFirst({
          where: {
            plotId: agreement.plotId,
          },
        });
        
        const vouchersTotal = vouchers.reduce((sum, v) => sum + v.amount, 0);
        const biyanaAmount = biyana?.biyanaAmount || 0;
        const totalPaid = agreement.downPayment + biyanaAmount + vouchersTotal;
        
        return {
          ...agreement,
          totalPaid,
          vouchersTotal,
          biyanaAmount,
          pendingAmount: agreement.totalAmount - totalPaid,
        };
      })
    );

    res.json({
      success: true,
      data: agreementsWithPayments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/forms/sale-agreement/:id
// @desc    Get sale agreement by ID
// @access  Private
router.get('/sale-agreement/:id', protect, async (req, res) => {
  try {
    const agreement = await prisma.saleAgreement.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        plot: true,
        createdBy: { select: { name: true, signature: true } },
        witnesses: true,
      },
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: 'Sale agreement not found',
      });
    }

    // Get vouchers and biyana for payment calculations
    const vouchers = await prisma.voucher.findMany({
      where: {
        plotId: agreement.plotId,
        customerId: agreement.customerId,
        type: 'RECEIPT',
      },
    });
    
    const biyana = await prisma.biyana.findFirst({
      where: {
        plotId: agreement.plotId,
      },
    });
    
    const vouchersTotal = vouchers.reduce((sum, v) => sum + v.amount, 0);
    const biyanaAmount = biyana?.biyanaAmount || 0;
    const totalPaid = agreement.downPayment + biyanaAmount + vouchersTotal;

    res.json({
      success: true,
      data: {
        ...agreement,
        totalPaid,
        vouchersTotal,
        biyanaAmount,
        pendingAmount: agreement.totalAmount - totalPaid,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/forms/sale-agreement
// @desc    Create sale agreement
// @access  Private
router.post('/sale-agreement', protect, async (req, res) => {
  try {
    const agreementNumber = await generateFormNumber('SA');
    
    // Convert paymentPlan to installmentMonths
    let installmentMonths = null;
    let monthlyAmount = null;
    
    if (req.body.paymentPlan) {
      const plan = req.body.paymentPlan;
      if (plan === 'INSTALLMENT_12') {
        installmentMonths = 12;
      } else if (plan === 'INSTALLMENT_24') {
        installmentMonths = 24;
      } else if (plan === 'INSTALLMENT_36') {
        installmentMonths = 36;
      } else if (plan === 'FULL_PAYMENT') {
        installmentMonths = 0;
      }
      
      // Calculate monthly amount if installments
      if (installmentMonths > 0) {
        const remainingAmount = req.body.totalAmount - req.body.downPayment;
        monthlyAmount = remainingAmount / installmentMonths;
      }
    }
    
    const agreementData = {
      customerId: req.body.customerId,
      plotId: req.body.plotId,
      totalAmount: req.body.totalAmount,
      downPayment: req.body.downPayment,
      installmentMonths,
      monthlyAmount,
      agreementDate: req.body.agreementDate,
      possessionDate: req.body.possessionDate || null,
      terms: req.body.terms,
      agreementNumber,
      status: 'PENDING', // Set to PENDING, will be APPROVED by admin later
      createdById: req.user.id,
    };

    const agreement = await prisma.saleAgreement.create({
      data: agreementData,
    });

    // Update inventory status to RESERVED (not SOLD until approval)
    await prisma.inventory.update({
      where: { id: req.body.plotId },
      data: {
        status: 'RESERVED',
        buyerId: req.body.customerId,
      },
    });

    // Don't update customer's total investment until approval

    res.status(201).json({
      success: true,
      data: agreement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ============ TRANSFER FORM ROUTES ============

// @route   GET /api/forms/transfer
// @desc    Get all transfer forms
// @access  Private
router.get('/transfer', protect, async (req, res) => {
  try {
    const transfers = await prisma.transferForm.findMany({
      include: {
        plot: { select: { plotNo: true, project: true, size: true, block: true } },
        fromCustomer: { select: { name: true, fatherName: true, cnic: true, phone: true, address: true } },
        toCustomer: { select: { name: true, fatherName: true, cnic: true, phone: true, address: true } },
        createdBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: transfers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/forms/transfer
// @desc    Create transfer form
// @access  Private
router.post('/transfer', protect, async (req, res) => {
  try {
    const transferNumber = await generateFormNumber('TF');
    
    const transferData = {
      plotId: req.body.plotId,
      fromCustomerId: req.body.fromCustomerId,
      toCustomerId: req.body.toCustomerId,
      transferAmount: req.body.transferAmount,
      transferFee: req.body.transferFee,
      transferDate: new Date(req.body.date),
      reason: req.body.remarks,
      transferNumber,
      status: 'PENDING',
      createdById: req.user.id,
    };

    const transfer = await prisma.transferForm.create({
      data: transferData,
    });

    res.status(201).json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/forms/transfer/:id/approve
// @desc    Approve transfer form
// @access  Private
router.put('/transfer/:id/approve', protect, async (req, res) => {
  try {
    const transfer = await prisma.transferForm.findUnique({
      where: { id: req.params.id },
    });
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer form not found',
      });
    }

    const updatedTransfer = await prisma.transferForm.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approvedById: req.user.id,
      },
    });

    // Update inventory buyer
    await prisma.inventory.update({
      where: { id: transfer.plotId },
      data: {
        buyerId: transfer.toCustomerId,
      },
    });

    // Update customers' total investment
    await prisma.customer.update({
      where: { id: transfer.fromCustomerId },
      data: {
        totalInvestment: { decrement: transfer.transferFee || 0 },
      },
    });

    await prisma.customer.update({
      where: { id: transfer.toCustomerId },
      data: {
        totalInvestment: { increment: transfer.transferFee || 0 },
      },
    });

    res.json({
      success: true,
      data: updatedTransfer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
