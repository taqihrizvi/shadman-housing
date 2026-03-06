import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toTitleCase } from "@/lib/utils";
import { useFormatters } from "@/hooks/useFormatters";

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

interface PrintableBiyanaFormProps {
  data: {
    formNumber?: string;
    customerName: string;
    fatherHusbandName: string;
    cnic: string;
    phone?: string;
    plot: {
      plotNo: string;
      project: string;
      size: string;
      price: number;
      isCornerPlot?: boolean;
    };
    pricePerMarla?: number;
    totalAmount?: number;
    tokenAmount: number;
    totalRemaining?: number;
    monthlyInstallments?: number;
    agreementDuration?: string;
    monthlyInstallmentAmount?: number;
    quarterlyInstallmentAmount?: number;
    date: string;
    remarks?: string;
    status?: string;
    approvedBy?: {
      name: string;
      signature?: string;
    };
    createdBy?: {
      name: string;
    };
  };
  onClose?: () => void;
  hidePrintButton?: boolean;
}

export default function PrintableBiyanaForm({ data, onClose, hidePrintButton }: PrintableBiyanaFormProps) {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const contentRef = useRef<HTMLDivElement>(null);

  // Debug: Log the data to check status and signature
  console.log('Printable Form Data:', {
    status: data.status,
    approvedBy: data.approvedBy,
    createdBy: data.createdBy,
    hasSignature: !!data.approvedBy?.signature,
    signaturePath: data.approvedBy?.signature
  });

  const { formatCurrency, formatEnum } = useFormatters();

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Helper function to translate duration string
  const translateDuration = (duration: string) => {
    if (!duration) return duration;

    // Parse the duration string (e.g., "1 year", "2 years", "6 months", "1 year 3 months")
    let translated = duration;

    // Replace year/years
    translated = translated.replace(/(\d+)\s+year(?!s)/g, (match, num) =>
      `${num} ${t('printableForms.year')}`
    );
    translated = translated.replace(/(\d+)\s+years/g, (match, num) =>
      `${num} ${t('printableForms.years')}`
    );

    // Replace month/months
    translated = translated.replace(/(\d+)\s+month(?!s)/g, (match, num) =>
      `${num} ${t('printableForms.month')}`
    );
    translated = translated.replace(/(\d+)\s+months/g, (match, num) =>
      `${num} ${t('printableForms.months')}`
    );

    return translated;
  };

  const handlePrint = () => {
    if (!contentRef.current) return;

    // Create a new window
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      alert('Please allow pop-ups for this website to print the form.');
      return;
    }

    // Get all styles from the current document
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          // Handle cross-origin stylesheets
          const link = styleSheet.href;
          return link ? `@import url("${link}");` : '';
        }
      })
      .join('\n');

    // Write the content to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="${isUrdu ? 'ur' : 'en'}" dir="${isUrdu ? 'rtl' : 'ltr'}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Biyana Form - ${data.formNumber || data.plot.plotNo}</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            ${styles}
            
            body {
              margin: 0;
              padding: 20px;
              font-family: ${isUrdu ? "'Noto Nastaliq Urdu', serif" : "'Outfit', sans-serif"};
              background: white;
            }
            
            [lang="ur"],
            [lang="ur"] * {
              font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif !important;
            }
            
            @media print {
              body {
                padding: 0;
              }
              @page {
                size: legal;
                margin: 10mm 5mm;
              }
            }
          </style>
        </head>
        <body>
          ${contentRef.current.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content and fonts to load, then trigger print dialog
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  return (
    <div className={`bg-gray-50 print:max-h-none print:overflow-visible print:bg-white ${hidePrintButton ? '' : 'max-h-screen overflow-auto'}`}>
      {/* Print Controls - Hidden during print */}
      <div className="print:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('printableForms.biyanaReceipt')} - {data.formNumber || data.plot.plotNo}</h2>
          <div className="flex gap-2 items-center">
            {!hidePrintButton && (
              <Button onClick={handlePrint} variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                {t('printableForms.printDocument')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Printable Content */}
      <div ref={contentRef} className="bg-white print:p-0" dir={isUrdu ? 'rtl' : 'ltr'} lang={isUrdu ? 'ur' : 'en'}>
        {/* Letterhead Header */}
        <div className="letterhead-header w-full" style={{ marginBottom: '20px' }}>
          <img src="/letterhead header.png" alt="Header" className="w-full" style={{ display: 'block', width: '100%', maxWidth: '100%' }} />
        </div>

        <div className="p-6 print:p-4 page-content" style={{ position: 'relative' }}>
          {/* Logo Watermark */}
          <div className="watermark-logo" style={{
            position: 'fixed',
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

          <div style={{ position: 'relative', zIndex: 1 }}>{/* Content area with margins for header/footer */}
            {/* Form Title */}
            <div className="mb-6 print:mb-4" style={{ textAlign: 'center' }}>
              <h1 className="text-4xl print:text-3xl font-bold mb-2 print:mb-1" style={{ textAlign: 'center', fontFamily: isUrdu ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" : "'Outfit', sans-serif" }}>{t('printableForms.biyanaReceipt')}</h1>
              {data.formNumber && (
                <p className="text-sm print:text-xs" style={{ textAlign: 'center' }}>{t('printableForms.receiptNo')}: {data.formNumber}</p>
              )}
              <p className="text-sm print:text-xs" style={{ textAlign: 'center' }}>{t('printableForms.date')}: {formatDate(data.date)}</p>
              <p className="text-sm print:text-xs text-muted-foreground mt-1" style={{ textAlign: 'center' }}>Created by: {data.createdBy?.name || 'System'}</p>
            </div>

            <div>
              {/* Customer Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="font-semibold whitespace-nowrap w-40">{t('printableForms.buyerName')}:</span>
                  <div className="border-b-2 border-black px-3 py-1 flex-1">{toTitleCase(data.customerName)}</div>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="font-semibold whitespace-nowrap w-40">{t('printableForms.fatherHusbandName')}:</span>
                  <div className="border-b-2 border-black px-3 py-1 flex-1">{data.fatherHusbandName}</div>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="font-semibold whitespace-nowrap w-40">{t('printableForms.cnicNo')}:</span>
                  <div className="border-b-2 border-black px-3 py-1 flex-1">{data.cnic}</div>
                </div>

                {data.phone && (
                  <div className="flex items-baseline gap-3">
                    <span className="font-semibold whitespace-nowrap w-40">{t('Phone Number')}:</span>
                    <div className="border-b-2 border-black px-3 py-1 flex-1">{data.phone}</div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-6 text-sm leading-relaxed text-justify">
                <p>
                  {t('printableForms.receiptConfirmation', {
                    customerName: data.customerName,
                    amount: formatCurrency(data.tokenAmount)
                  })}
                </p>
              </div>

              {/* Plot Details & Payment Details */}
              <h2 className="text-xl print:text-lg font-bold mb-2 print:mb-1.5" style={{ textAlign: 'center', fontFamily: isUrdu ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" : "'Outfit', sans-serif" }}>
                {isUrdu ? 'پلاٹ اور ادائیگی کی تفصیلات' : 'Plot & Payment Details'}
              </h2>

              <div className="grid grid-cols-2 gap-4 print:gap-3 mb-4 print:mb-3 items-start">
                {/* Plot Details Column */}
                <div className="border-2 border-black h-fit">
                  <div className="bg-gray-100 border-b-2 border-black p-2 print:p-1.5 text-center font-bold text-sm print:text-xs" style={{ fontFamily: isUrdu ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" : "'Outfit', sans-serif" }}>
                    {t('printableForms.plotDetails')}
                  </div>
                  <table className="w-full text-sm print:text-xs">
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.plotNumber')}</td>
                        <td className="p-2 print:p-1.5">{data.plot.plotNo}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.marla')}</td>
                        <td className="p-2 print:p-1.5">{data.plot.size}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.plotType')}</td>
                        <td className="p-2 print:p-1.5">
                          <span className={data.plot.isCornerPlot ? "font-semibold text-orange-600" : ""}>
                            {data.plot.isCornerPlot ? t('printableForms.cornerPlot') : t('printableForms.regularPlot')}
                          </span>
                        </td>
                      </tr>
                      {data.plot.isCornerPlot && (
                        <tr className="border-b border-black bg-orange-50">
                          <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-orange-100 text-orange-700">{t('printableForms.cornerPlotPremium')}</td>
                          <td className="p-2 print:p-1.5 font-semibold text-orange-700">+10%</td>
                        </tr>
                      )}
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.ratePerMarla')}</td>
                        <td className="p-2 print:p-1.5">{data.pricePerMarla ? formatCurrency(data.pricePerMarla) : formatCurrency(500000)}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-2 print:p-1.5 font-bold bg-gray-100">{t('printableForms.totalAmount')}</td>
                        <td className="p-2 print:p-1.5 font-bold">{formatCurrency(data.totalAmount || data.plot.price)}</td>
                      </tr>
                      <tr>
                        <td className="border-r border-black p-2 print:p-1.5 font-bold bg-gray-100">{t('printableForms.tokenAmount')}</td>
                        <td className="p-2 print:p-1.5 font-bold">{formatCurrency(data.tokenAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Payment Details Column */}
                <div className="border-2 border-black h-fit">
                  <div className="bg-gray-100 border-b-2 border-black p-2 print:p-1.5 text-center font-bold text-sm print:text-xs" style={{ fontFamily: isUrdu ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" : "'Outfit', sans-serif" }}>
                    {t('printableForms.paymentDetails')}
                  </div>
                  <table className="w-full text-sm print:text-xs">
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('Biyana Amount Date')}</td>
                        <td className="p-2 print:p-1.5">{formatDate(data.date)}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.remainingInstallments')}</td>
                        <td className="p-2 print:p-1.5">{formatCurrency(data.totalRemaining || ((data.totalAmount || data.plot.price) - data.tokenAmount))}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.agreementDuration')}</td>
                        <td className="p-2 print:p-1.5">{translateDuration(data.agreementDuration || '1 year')}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.monthlyInstallments')}</td>
                        <td className="p-2 print:p-1.5">{data.monthlyInstallments || '12'}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.monthlyInstallment')}</td>
                        <td className="p-2 print:p-1.5">{data.monthlyInstallmentAmount ? formatCurrency(data.monthlyInstallmentAmount) : formatCurrency(204166.67)}</td>
                      </tr>
                      <tr>
                        <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.quarterlyInstallment')}</td>
                        <td className="p-2 print:p-1.5">{data.quarterlyInstallmentAmount ? formatCurrency(data.quarterlyInstallmentAmount) : 'Rs 0'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Disclaimer Text */}
            <div className="mt-6 print:mt-4 mb-6 print:mb-4 p-4 print:p-3 bg-yellow-200 bg-opacity-50 border border-yellow-300 rounded-lg break-inside-avoid" style={{ fontFamily: isUrdu ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" : "'Outfit', sans-serif" }}>
              <div className="text-xs print:text-[10px] leading-relaxed print:leading-snug space-y-2 print:space-y-1">
                <p className="text-right" dir="rtl">میں بحیثیت خریدار اوپر دیئے گئے تمام کوائف کو درست تسلیم کرتا ہوں۔</p>
                <p className="text-right" dir="rtl"><strong>نوٹ:</strong> پیمانہ فارم پر شادمان گریز کی مر اور ڈاکر یک شرط شادمان گریز کے محقق ہونا لازم ہے ورنہ محاہدہ قابل قبول نہ ہوگا۔</p>
                <p className="text-right" dir="rtl">فریق دوئم پر لازم ہے کہ 3 پاسپورٹ سائز تصاویر معاہدے کے لیے مہیا کرتے۔</p>
              </div>
            </div>

            {/* Signatures */}
            <h2 className="text-3xl print:text-2xl font-bold mt-6 print:mt-3 mb-4 print:mb-2 break-after-avoid" style={{ textAlign: 'center', fontFamily: isUrdu ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" : "'Outfit', sans-serif" }}>{t('printableForms.signatures')}</h2>

            <div className="grid grid-cols-2 gap-6 print:gap-16 mb-4 print:mb-2 break-inside-avoid px-8">
              <div className="text-center">
                <div className="w-full h-16 print:h-12 mb-2 print:mb-1 border-b-2 border-black"></div>
                <p className="font-bold text-sm print:text-xs">{t('printableForms.buyerSignature')}</p>
                <p className="text-xs print:text-[10px] mt-1 print:mt-0">({toTitleCase(data.customerName || '')})</p>
              </div>
              <div className="text-center">
                {data.status === 'APPROVED' ? (
                  <div className="flex flex-col items-center">
                    <div className="w-full h-16 print:h-12 mb-2 print:mb-1 border-b-2 border-black flex items-end justify-center pb-1">
                      <img
                        src={data.approvedBy?.signature
                          ? (data.approvedBy.signature.startsWith('http')
                            ? data.approvedBy.signature
                            : `${API_BASE_URL}${data.approvedBy.signature.startsWith('/') ? '' : '/'}${data.approvedBy.signature}`)
                          : `${API_BASE_URL}/signatures/admin-signature.png`
                        }
                        alt={t('printableForms.directorSignature')}
                        className="max-h-12 print:max-h-8 max-w-[120px] print:max-w-[100px] object-contain"
                        onError={(e) => {
                          console.error('Signature image failed to load:', data.approvedBy?.signature);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <p className="font-bold text-sm print:text-xs">{t('printableForms.directorSignature')}</p>
                    <p className="text-xs print:text-[10px] mt-1 print:mt-0">({data.approvedBy?.name || 'Admin'})</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-full h-16 print:h-12 mb-2 print:mb-1 border-b-2 border-black flex items-center justify-center">
                      <p className="text-red-500 font-semibold text-sm print:text-xs">{isUrdu ? 'غیر دستخط شدہ' : 'Unsigned'}</p>
                    </div>
                    <p className="font-bold text-sm print:text-xs">{t('printableForms.directorSignature')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Letterhead Footer */}
        <div className="letterhead-footer w-full">
          <img src="/letterhead footer.png" alt="Footer" className="w-full" style={{ display: 'block', width: '100%', maxWidth: '100%' }} />
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          .letterhead-header {
            position: relative;
            width: 100%;
            page-break-inside: avoid;
          }

          .letterhead-header img {
            width: 100%;
            height: auto;
            display: block;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .letterhead-footer {
            position: relative;
            width: 100%;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            display: block;
            page-break-inside: avoid;
          }

          .letterhead-footer img {
            width: 100%;
            height: auto;
            display: block;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .page-content {
            margin-top: 0;
            margin-bottom: 0;
            padding: 20px 10px;
          }

          .page-content::before {
            content: '';
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            height: 600px;
            background-image: url('/Logo.png');
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
            opacity: 0.15;
            z-index: 0;
            pointer-events: none;
          }

          html, body {
            height: auto !important;
            overflow: visible !important;
            max-height: none !important;
          }

          * {
            box-shadow: none !important;
            border-color: #000 !important;
            overflow: visible !important;
            max-height: none !important;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            margin: 0 !important;
            padding: 0 !important;
            background: white;
          }

          img {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          /* Urdu font rendering for print */
          [lang="ur"] h1,
          [lang="ur"] h2,
          [lang="ur"] h3,
          [lang="ur"] h4,
          [lang="ur"] * {
            font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif !important;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }

          p {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          h2, h3 {
            page-break-after: avoid;
            break-after: avoid;
          }

          .print\\:hidden {
            display: none !important;
          }
          
          .bg-gray-50, .max-h-screen {
            max-height: none !important;
            overflow: visible !important;
          }
          
          /* Ensure proper spacing and visibility */
          .p-6 {
            padding: 0.5rem !important;
          }
        }

        /* Urdu font rendering for screen */
        [lang="ur"] h1,
        [lang="ur"] h2,
        [lang="ur"] h3,
        [lang="ur"] h4 {
          font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif !important;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          font-weight: bold !important;
          letter-spacing: 0.05em;
        }

        [lang="ur"] * {
          font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif !important;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        p {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      `}</style>
    </div>
  );
}
