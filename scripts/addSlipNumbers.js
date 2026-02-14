import prisma from '../shadman-housing-backend/config/database.js';

async function addSlipNumbers() {
  try {
    console.log('Adding slip numbers to existing vouchers...\n');

    // Get all vouchers without slip numbers that have bank information
    const vouchersWithoutSlip = await prisma.voucher.findMany({
      where: {
        slipNumber: null,
        bankName: {
          not: null
        }
      },
      select: {
        id: true,
        voucherNo: true,
        bankName: true,
      }
    });

    console.log(`Found ${vouchersWithoutSlip.length} vouchers without slip numbers\n`);

    // Update each voucher with a default slip number
    for (const voucher of vouchersWithoutSlip) {
      const slipNumber = `SLIP-${voucher.voucherNo.replace('RV-', '')}`;
      
      await prisma.voucher.update({
        where: { id: voucher.id },
        data: { slipNumber }
      });

      console.log(`✅ ${voucher.voucherNo} → Slip Number: ${slipNumber}`);
    }

    // Show updated vouchers
    console.log('\n📋 Updated vouchers:');
    const updatedVouchers = await prisma.voucher.findMany({
      where: {
        slipNumber: {
          not: null
        }
      },
      select: {
        voucherNo: true,
        bankName: true,
        accountNumber: true,
        slipNumber: true,
        amount: true,
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.table(updatedVouchers);

    console.log('\n✅ Slip numbers added successfully!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding slip numbers:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

addSlipNumbers();
