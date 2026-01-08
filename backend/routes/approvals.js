import express from 'express';
import prisma from '../config/database.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/approvals/biyana
// @desc    Get all pending Biyana forms for approval
// @access  Admin only
router.get('/biyana', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const pendingBiyanas = await prisma.biyana.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        customer: {
          select: {
            name: true,
            fatherName: true,
            cnic: true,
            phone: true,
          },
        },
        plot: {
          select: {
            plotNo: true,
            project: true,
            size: true,
            block: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: pendingBiyanas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/approvals/biyana/:id/approve
// @desc    Approve a Biyana form
// @access  Admin only
router.put('/biyana/:id/approve', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const biyana = await prisma.biyana.findUnique({
      where: { id },
    });

    if (!biyana) {
      return res.status(404).json({
        success: false,
        message: 'Biyana form not found',
      });
    }

    if (biyana.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This Biyana form has already been processed',
      });
    }

    // Update Biyana status to APPROVED
    const updatedBiyana = await prisma.biyana.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: req.user.id,
        approvedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            name: true,
            fatherName: true,
            cnic: true,
            phone: true,
          },
        },
        plot: {
          select: {
            plotNo: true,
            project: true,
            size: true,
            block: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
        approvedBy: {
          select: {
            name: true,
            signature: true,
          },
        },
      },
    });

    // Update inventory status to RESERVED after approval
    await prisma.inventory.update({
      where: { id: biyana.plotId },
      data: {
        status: 'RESERVED',
        buyerId: biyana.customerId,
      },
    });

    res.json({
      success: true,
      data: updatedBiyana,
      message: 'Biyana form approved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/approvals/biyana/:id/reject
// @desc    Reject a Biyana form
// @access  Admin only
router.put('/biyana/:id/reject', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const biyana = await prisma.biyana.findUnique({
      where: { id },
    });

    if (!biyana) {
      return res.status(404).json({
        success: false,
        message: 'Biyana form not found',
      });
    }

    if (biyana.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This Biyana form has already been processed',
      });
    }

    const updatedBiyana = await prisma.biyana.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: req.user.id,
        approvedAt: new Date(),
        remarks: reason || biyana.remarks,
      },
      include: {
        customer: {
          select: {
            name: true,
            fatherName: true,
            cnic: true,
            phone: true,
          },
        },
        plot: {
          select: {
            plotNo: true,
            project: true,
            size: true,
            block: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
        approvedBy: {
          select: {
            name: true,
          },
        },
      },
    });

    // Update inventory status back to AVAILABLE when rejected
    await prisma.inventory.update({
      where: { id: biyana.plotId },
      data: { status: 'AVAILABLE' },
    });

    res.json({
      success: true,
      data: updatedBiyana,
      message: 'Biyana form rejected',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/approvals/sale-agreement
// @desc    Get all pending Sale Agreements for approval
// @access  Admin only
router.get('/sale-agreement', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const pendingAgreements = await prisma.saleAgreement.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        customer: {
          select: {
            name: true,
            fatherName: true,
            cnic: true,
            phone: true,
          },
        },
        plot: {
          select: {
            plotNo: true,
            project: true,
            size: true,
            block: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: pendingAgreements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/approvals/sale-agreement/:id/approve
// @desc    Approve a Sale Agreement
// @access  Admin only
router.put('/sale-agreement/:id/approve', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const agreement = await prisma.saleAgreement.findUnique({
      where: { id },
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: 'Sale Agreement not found',
      });
    }

    if (agreement.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This Sale Agreement has already been processed',
      });
    }

    // Update Sale Agreement status to APPROVED
    const updatedAgreement = await prisma.saleAgreement.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: req.user.id,
        approvedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            name: true,
            fatherName: true,
            cnic: true,
            phone: true,
          },
        },
        plot: {
          select: {
            plotNo: true,
            project: true,
            size: true,
            block: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
        approvedBy: {
          select: {
            name: true,
          },
        },
      },
    });

    // Update inventory status to SOLD when approved
    await prisma.inventory.update({
      where: { id: agreement.plotId },
      data: {
        status: 'SOLD',
        soldDate: new Date(),
      },
    });

    // Update customer's total investment when approved
    await prisma.customer.update({
      where: { id: agreement.customerId },
      data: {
        totalInvestment: { increment: agreement.totalAmount },
      },
    });

    res.json({
      success: true,
      data: updatedAgreement,
      message: 'Sale Agreement approved',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/approvals/sale-agreement/:id/reject
// @desc    Reject a Sale Agreement
// @access  Admin only
router.put('/sale-agreement/:id/reject', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const agreement = await prisma.saleAgreement.findUnique({
      where: { id },
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: 'Sale Agreement not found',
      });
    }

    if (agreement.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This Sale Agreement has already been processed',
      });
    }

    const updatedAgreement = await prisma.saleAgreement.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: req.user.id,
        approvedAt: new Date(),
        terms: reason ? `${agreement.terms}\n\nRejection Reason: ${reason}` : agreement.terms,
      },
      include: {
        customer: {
          select: {
            name: true,
            fatherName: true,
            cnic: true,
            phone: true,
          },
        },
        plot: {
          select: {
            plotNo: true,
            project: true,
            size: true,
            block: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
        approvedBy: {
          select: {
            name: true,
          },
        },
      },
    });

    // Update inventory status back to AVAILABLE when rejected
    await prisma.inventory.update({
      where: { id: agreement.plotId },
      data: { status: 'AVAILABLE', buyerId: null },
    });

    res.json({
      success: true,
      data: updatedAgreement,
      message: 'Sale Agreement rejected',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/approvals/stats
// @desc    Get approval statistics
// @access  Admin only
router.get('/stats', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const [biyanasPending, biyanasApproved, biyanasRejected, agreementsPending, agreementsApproved, agreementsRejected, vouchersPending, vouchersApproved, vouchersRejected] = await Promise.all([
      prisma.biyana.count({ where: { status: 'PENDING' } }),
      prisma.biyana.count({ where: { status: 'APPROVED' } }),
      prisma.biyana.count({ where: { status: 'REJECTED' } }),
      prisma.saleAgreement.count({ where: { status: 'PENDING' } }),
      prisma.saleAgreement.count({ where: { status: 'APPROVED' } }),
      prisma.saleAgreement.count({ where: { status: 'REJECTED' } }),
      prisma.voucher.count({ where: { status: 'PENDING' } }),
      prisma.voucher.count({ where: { status: 'APPROVED' } }),
      prisma.voucher.count({ where: { status: 'REJECTED' } }),
    ]);

    res.json({
      success: true,
      data: {
        forms: {
          pending: biyanasPending,
          approved: biyanasApproved,
          rejected: biyanasRejected,
          total: biyanasPending + biyanasApproved + biyanasRejected,
        },
        agreements: {
          pending: agreementsPending,
          approved: agreementsApproved,
          rejected: agreementsRejected,
          total: agreementsPending + agreementsApproved + agreementsRejected,
        },
        payments: {
          pending: vouchersPending,
          approved: vouchersApproved,
          rejected: vouchersRejected,
          total: vouchersPending + vouchersApproved + vouchersRejected,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/approvals/payments
// @desc    Get all pending payment vouchers for approval
// @access  Admin only
router.get('/payments', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const pendingPayments = await prisma.voucher.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        customer: {
          select: {
            name: true,
            fatherName: true,
            cnic: true,
            phone: true,
          },
        },
        plot: {
          select: {
            plotNo: true,
            project: true,
            size: true,
            block: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: pendingPayments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/approvals/payments/:id/approve
// @desc    Approve a payment voucher
// @access  Admin only
router.put('/payments/:id/approve', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const voucher = await prisma.voucher.findUnique({
      where: { id },
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Payment voucher not found',
      });
    }

    if (voucher.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This payment voucher has already been processed',
      });
    }

    // Update voucher status to APPROVED
    const updatedVoucher = await prisma.voucher.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: req.user.id,
        approvedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            name: true,
            fatherName: true,
            cnic: true,
            phone: true,
          },
        },
        plot: {
          select: {
            plotNo: true,
            project: true,
            size: true,
            block: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
        approvedBy: {
          select: {
            name: true,
            signature: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedVoucher,
      message: 'Payment voucher approved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/approvals/payments/:id/reject
// @desc    Reject a payment voucher
// @access  Admin only
router.put('/payments/:id/reject', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const voucher = await prisma.voucher.findUnique({
      where: { id },
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Payment voucher not found',
      });
    }

    if (voucher.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This payment voucher has already been processed',
      });
    }

    const updatedVoucher = await prisma.voucher.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: req.user.id,
        approvedAt: new Date(),
        description: reason || voucher.description,
      },
      include: {
        customer: {
          select: {
            name: true,
            fatherName: true,
            cnic: true,
            phone: true,
          },
        },
        plot: {
          select: {
            plotNo: true,
            project: true,
            size: true,
            block: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
        approvedBy: {
          select: {
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedVoucher,
      message: 'Payment voucher rejected',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
