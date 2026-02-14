import prisma from '../shadman-housing-backend/config/database.js';

async function updateVoucherAccountNumbers() {
  try {
    console.log('Starting to update voucher account numbers...');

    // Update Faysal Bank vouchers
    const faysalBankUpdate = await prisma.voucher.updateMany({
      where: {
        bankName: 'FAYSAL_BANK',
        accountNumber: null,
      },
      data: {
        accountNumber: '3163301000004759',
      },
    });

    console.log(`✅ Updated ${faysalBankUpdate.count} Faysal Bank vouchers`);

    // Update Meezan Bank vouchers
    const meezanBankUpdate = await prisma.voucher.updateMany({
      where: {
        bankName: 'MEEZAN_BANK',
        accountNumber: null,
      },
      data: {
        accountNumber: '005920012951826',
      },
    });

    console.log(`✅ Updated ${meezanBankUpdate.count} Meezan Bank vouchers`);

    // Update Soneri Bank vouchers
    const soneriBankUpdate = await prisma.voucher.updateMany({
      where: {
        bankName: 'SONERI_BANK',
      },
      data: {
        accountNumber: '005920012951826',
      },
    });

    console.log(`✅ Updated ${soneriBankUpdate.count} Soneri Bank vouchers`);

    // Show sample of updated records
    const sampleVouchers = await prisma.voucher.findMany({
      where: {
        OR: [
          { bankName: 'FAYSAL_BANK' },
          { bankName: 'MEEZAN_BANK' },
          { bankName: 'SONERI_BANK' },
        ],
      },
      select: {
        voucherNo: true,
        bankName: true,
        accountNumber: true,
        amount: true,
      },
      take: 5,
    });

    console.log('\n📋 Sample updated vouchers:');
    console.table(sampleVouchers);

    console.log('\n✅ Account numbers updated successfully!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating account numbers:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

updateVoucherAccountNumbers();
