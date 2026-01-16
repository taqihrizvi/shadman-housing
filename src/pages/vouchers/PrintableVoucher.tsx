import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { voucherAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PrintableVoucher() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const voucherId = id || searchParams.get('id');

  const { data: voucher, isLoading } = useQuery({
    queryKey: ['voucher', voucherId],
    queryFn: async () => {
      if (!voucherId) return null;
      const response = await voucherAPI.getById(voucherId);
      return response.data;
    },
    enabled: !!voucherId,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatEnum = (value: string) => {
    if (!value) return "";
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const handlePrint = () => {
    window.print();
  };

  const renderReceiptContent = (copyLabel: string) => (
    <div className="receipt-copy" style={{ position: 'relative' }}>
      {/* Logo Watermark */}
      <div className="watermark-logo" style={{ 
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.15,
        zIndex: 0,
        pointerEvents: 'none',
        width: '600px',
        height: '600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <img src="/Logo.png" alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </div>
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Voucher Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 uppercase" style={{ fontFamily: isUrdu ? "'Noto Nastaliq Urdu', serif" : "'Outfit', sans-serif" }}>
            {t('vouchers.paymentReceipt')}
          </h2>
          <div className="mt-2 inline-block bg-gray-800 text-white px-4 py-1 text-sm font-semibold">
            {voucher.voucherNo}
          </div>
        </div>

        {/* Date */}
        <div className={`mb-6 ${isUrdu ? 'text-left' : 'text-right'}`}>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">{t('vouchers.date')}:</span> {formatDate(voucher.date)}
          </p>
        </div>

        {/* Received From Section */}
        <div className="mb-6 border border-gray-300 p-4 rounded bg-transparent">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">{t('vouchers.name')}</p>
              <p className="font-semibold text-gray-800">{voucher.customer?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('vouchers.cnic')}</p>
              <p className="font-semibold text-gray-800">{voucher.customer?.cnic || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('vouchers.phone')}</p>
              <p className="font-semibold text-gray-800">{voucher.customer?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('vouchers.address')}</p>
              <p className="font-semibold text-gray-800">{voucher.customer?.address || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Property Details */}
        {voucher.plot && (
          <div className="mb-6 border border-gray-300 p-4 rounded bg-transparent">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2" style={{ fontFamily: isUrdu ? "'Noto Nastaliq Urdu', serif" : "'Outfit', sans-serif" }}>
              {t('vouchers.propertyDetails')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">{t('vouchers.plotNumber')}</p>
                <p className="font-semibold text-gray-800">{voucher.plot.plotNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('vouchers.project')}</p>
                <p className="font-semibold text-gray-800">{formatEnum(voucher.plot.project)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="mb-6 border-2 border-gray-800 p-4 rounded bg-transparent">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b-2 border-gray-800 pb-2" style={{ fontFamily: isUrdu ? "'Noto Nastaliq Urdu', serif" : "'Outfit', sans-serif" }}>
            {t('vouchers.paymentDetails')}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">{t('vouchers.amountReceived')}</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(voucher.amount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('vouchers.paymentMethod')}</p>
              <p className="font-semibold text-gray-800">{formatEnum(voucher.paymentMethod)}</p>
            </div>
          </div>

          {/* Additional Payment Details */}
          {(voucher.chequeNumber || voucher.bankName || voucher.transactionId) && (
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-300">
              {voucher.chequeNumber && (
                <div>
                  <p className="text-sm text-gray-600">{t('vouchers.chequeNumber')}</p>
                  <p className="font-semibold text-gray-800">{voucher.chequeNumber}</p>
                </div>
              )}
              {voucher.bankName && (
                <div>
                  <p className="text-sm text-gray-600">{t('vouchers.bankName')}</p>
                  <p className="font-semibold text-gray-800">{voucher.bankName}</p>
                </div>
              )}
              {voucher.transactionId && (
                <div>
                  <p className="text-sm text-gray-600">{t('vouchers.transactionId')}</p>
                  <p className="font-semibold text-gray-800">{voucher.transactionId}</p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {voucher.description && (
            <div className="mt-4 pt-3 border-t border-gray-300">
              <p className="text-sm text-gray-600">{t('vouchers.description')}</p>
              <p className="text-gray-800">{voucher.description}</p>
            </div>
          )}
        </div>

        {/* Amount in Words */}
        <div className="mb-6 p-4 border border-gray-300 rounded bg-transparent">
          <p className="text-sm text-gray-600 mb-1">{t('vouchers.amountInWords')}:</p>
          <p className="font-semibold text-gray-800 italic">
            {formatCurrency(voucher.amount)} {t('vouchers.only')}
          </p>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t-2 border-gray-300">
          <div>
            {voucher.status === 'APPROVED' ? (
              <div className="flex flex-col items-center">
                <div className="w-full border-b-2 border-gray-800 h-16 mb-2 flex items-center justify-center">
                  <img 
                    src={voucher.approvedBy?.signature ? `http://localhost:5000${voucher.approvedBy.signature}` : 'http://localhost:5000/signatures/admin-signature.png'}
                    alt="Authorized Signature" 
                    className="max-h-12 object-contain"
                    onLoad={() => console.log('✅ Signature loaded')}
                    onError={(e) => {
                      console.error('❌ Signature failed to load');
                      e.currentTarget.src = 'http://localhost:5000/signatures/admin-signature.png';
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">{t('vouchers.receivedBy')}</p>
                <p className="text-xs text-gray-500 text-center mt-1">{voucher.approvedBy?.name || 'Admin'}</p>
              </div>
            ) : (
              <div>
                <div className="border-b-2 border-gray-800 h-16 mb-2 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">{t('printableForms.unsigned')}</span>
                </div>
                <p className="text-sm text-gray-600 text-center">{t('vouchers.receivedBy')}</p>
                <p className="text-xs text-gray-500 text-center mt-1">{voucher.approvedBy?.name || 'Admin'}</p>
              </div>
            )}
          </div>
          <div>
            <div className="border-b-2 border-gray-800 h-16 mb-2"></div>
            <p className="text-sm text-gray-600 text-center">{t('vouchers.customerSignature')}</p>
            <p className="text-xs text-gray-500 text-center mt-1">{voucher.customer?.name}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-300 text-center">
          <p className="text-xs text-gray-500">
            {t('vouchers.computerGenerated')}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {t('vouchers.contactOffice')}
          </p>
        </div>

        {/* Copy Indicator */}
        <div className="mt-8 text-center border-t-2 border-dashed border-gray-400 pt-4">
          <p className="text-sm text-gray-500 font-semibold">{copyLabel}</p>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading voucher...</div>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Voucher not found</div>
      </div>
    );
  }

  return (
    <>
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden bg-gray-100 p-4 sticky top-0 z-10 border-b">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate('/payments/pending')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('vouchers.backToPayments')}
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            {t('vouchers.printReceipt')}
          </Button>
        </div>
      </div>

      {/* Printable Voucher */}
      <div className="receipts-container bg-white print:p-0" dir={isUrdu ? 'rtl' : 'ltr'} lang={isUrdu ? 'ur' : 'en'}>
        {/* Letterhead Header - Screen only */}
        <div className="letterhead-header w-full print:hidden" style={{ marginBottom: '20px' }}>
          <img src="/letterhead header.png" alt="Header" className="w-full" style={{ display: 'block', width: '100%', maxWidth: '100%' }} />
        </div>
        
        <div className="p-6 print:p-4 page-content">
          {/* Customer Copy */}
          {renderReceiptContent(t('vouchers.customerCopy'))}
          
          {/* Seller Copy - Hidden on screen, visible on print */}
          <div className="hidden print:block mt-8 print:mt-0">
            {renderReceiptContent(isUrdu ? 'فروخت کنندہ کی کاپی' : 'SELLER COPY')}
          </div>
        </div>
        
        {/* Letterhead Footer - Screen only */}
        <div className="letterhead-footer w-full print:hidden">
          <img src="/letterhead footer.png" alt="Footer" className="w-full" style={{ display: 'block', width: '100%', maxWidth: '100%' }} />
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }

          body, html {
            width: 100%;
            height: 100%;
          }

          /* 2x2 grid layout - receipts in 2 of 4 sections */
          .receipts-container {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            grid-template-rows: auto auto !important;
            width: 100% !important;
            height: auto !important;
            min-height: 48vh !important;
            gap: 10px !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
            overflow: visible !important;
            padding: 5px !important;
            box-sizing: border-box !important;
          }

          .page-content {
            display: contents !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .receipt-copy {
            page-break-inside: avoid;
            width: 100% !important;
            height: auto !important;
            min-height: 48vh !important;
            padding: 12px !important;
            box-sizing: border-box !important;
            border: 1px solid #ddd !important;
            overflow: visible !important;
            display: flex !important;
            flex-direction: column !important;
          }

          .receipt-copy:not(:last-child) {
            border-right: 2px dashed #999 !important;
          }

          .letterhead-header {
            display: none !important;
          }

          .letterhead-footer {
            display: none !important;
          }

          .watermark-logo {
            width: 180px !important;
            height: 180px !important;
            opacity: 0.06 !important;
          }

          /* Reduce all text sizes for compact receipt */
          h2 {
            font-size: 13px !important;
            margin-bottom: 5px !important;
          }

          h3 {
            font-size: 11px !important;
            margin-bottom: 4px !important;
            padding-bottom: 2px !important;
          }

          p, div {
            font-size: 9px !important;
            line-height: 1.25 !important;
          }

          .text-2xl {
            font-size: 13px !important;
          }

          .text-xs {
            font-size: 6.5px !important;
          }

          .text-sm {
            font-size: 7px !important;
          }

          .grid {
            gap: 6px !important;
          }

          .mb-6, .mt-6 {
            margin-top: 5px !important;
            margin-bottom: 5px !important;
          }

          .mb-4, .mt-4 {
            margin-top: 3px !important;
            margin-bottom: 3px !important;
          }

          .mt-12 {
            margin-top: 15px !important;
          }

          .mt-16 {
            margin-top: 20px !important;
          }

          .p-4 {
            padding: 6px !important;
          }

          .pt-8 {
            padding-top: 12px !important;
          }

          .border-2 {
            border-width: 1px !important;
          }

          html, body {
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          * {
            box-shadow: none !important;
            border-color: #000 !important;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            margin: 0 !important;
            padding: 0 !important;
            background: white;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }

          img {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .print\\:hidden {
            display: none !important;
          }

          .hidden {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
