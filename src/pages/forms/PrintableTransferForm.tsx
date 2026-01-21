import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toTitleCase } from "@/lib/utils";

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

interface PrintableTransferFormProps {
  data: {
    transferNumber: string;
    transferType: string;
    plot: {
      plotNo: string;
      project: string;
      size: string;
      price: number;
    };
    fromCustomer: {
      name: string;
      fatherName: string;
      cnic: string;
      phone: string;
      address: string;
    };
    toCustomer: {
      name: string;
      fatherName: string;
      cnic: string;
      phone: string;
      address: string;
    };
    transferAmount: number;
    transferFee: number;
    transferDate: string;
    remarks?: string;
    status: string;
    createdBy?: {
      name: string;
    };
    approvedBy?: {
      name: string;
      signature?: string;
    };
    approvedAt?: string;
  };
  onClose?: () => void;
  hidePrintButton?: boolean;
}

export default function PrintableTransferForm({ data, onClose, hidePrintButton }: PrintableTransferFormProps) {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const contentRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
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

  const formatProjectName = (value: string) => {
    if (!value) return "";
    if (isUrdu) {
      if (value === 'SHADMAN_GREENS') return 'شادمان گرینز';
      return formatEnum(value);
    }
    return formatEnum(value);
  };

  const formatPlotSize = (value: string) => {
    if (!value) return "";
    if (isUrdu) {
      const sizeMap: { [key: string]: string } = {
        'FIVE_MARLA': 'پانچ مرلہ',
        'SEVEN_MARLA': 'سات مرلہ',
        'TEN_MARLA': 'دس مرلہ',
        'ONE_KANAL': 'ایک کنال',
        'TWO_KANAL': 'دو کنال',
      };
      return sizeMap[value] || formatEnum(value);
    }
    
    const sizeMap: { [key: string]: string } = {
      'FIVE_MARLA': '5 Marla',
      'SEVEN_MARLA': '7 Marla',
      'TEN_MARLA': '10 Marla',
      'ONE_KANAL': '1 Kanal',
      'TWO_KANAL': '2 Kanal',
    };
    return sizeMap[value] || formatEnum(value);
  };

  const formatTransferType = (type: string) => {
    if (!type) return "";
    if (isUrdu) {
      return type === 'DEATH' ? 'موت کی منتقلی' : 'عام منتقلی';
    }
    return type === 'DEATH' ? 'Death Transfer' : 'General Transfer';
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
          <title>Transfer Form - ${data.transferNumber}</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            ${styles}
            
            body {
              margin: 0;
              padding: 0;
              font-family: ${isUrdu ? "'Noto Nastaliq Urdu', serif" : "'Outfit', sans-serif"};
              background: white;
            }
            
            @page {
              size: A4 portrait;
              margin: 8mm 12mm;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
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

    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  };

  const renderContent = () => (
    <div className="relative" style={{ fontFamily: isUrdu ? "'Noto Nastaliq Urdu', serif" : "'Outfit', sans-serif" }}>
      <div className="relative z-10 p-4 max-w-4xl mx-auto">
        {/* Office Copy */}
        {renderCopy('OFFICE COPY', 'دفتری کاپی')}
        
        {/* Divider with scissors line */}
        <div className="my-3 border-t-2 border-dashed border-gray-400 relative">
          <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-gray-500 text-[10px]">
            ✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ✂
          </div>
        </div>

        {/* Customer Copy */}
        {renderCopy('CUSTOMER COPY', 'کسٹمر کاپی')}
      </div>
    </div>
  );

  const renderCopy = (copyLabel: string, urduLabel: string) => (
    <div className="mb-2 print:mb-1.5 relative">
      {/* Logo Watermark for this copy */}
      <div className="watermark-logo" style={{ 
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.12,
        zIndex: 0,
        pointerEvents: 'none',
        width: '450px',
        height: '450px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <img src="/Logo.png" alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </div>

      <div className="relative z-10">
      {/* Header */}
      <div className="text-center mb-1.5">
        <h1 className="text-base font-bold text-gray-800 uppercase border-b-2 border-gray-800 inline-block pb-0.5 px-3">
          TRANSFER FORM
        </h1>
        <p className="text-[10px] text-gray-600 mt-0.5">Shadman Greens</p>
        <div className="mt-1.5 inline-block bg-gray-800 text-white px-3 py-0.5 text-[10px] font-semibold rounded">
          {copyLabel}
        </div>
      </div>

      {/* Form Number and Date */}
      <div className="flex justify-between items-start mb-2 text-xs">
        <div>
          <span className="font-semibold">Form No:</span> {data.transferNumber}
        </div>
        <div className="text-right">
          <span className="font-semibold">Date:</span> {formatDate(data.transferDate)}
        </div>
      </div>

      {/* Transfer Type */}
      <div className="mb-2 text-xs">
        <span className="font-semibold">Type of Transfer:</span> 
        <span className="ml-2 font-bold">{formatTransferType(data.transferType)}</span>
      </div>

      {/* Property Details */}
      <div className="border-2 border-gray-900 mb-1.5">
        <div className="bg-gray-50 px-2 py-0.5 border-b border-gray-900">
          <h3 className="text-xs font-bold text-gray-900">PROPERTY DETAILS</h3>
        </div>
        <div className="p-1.5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div>
              <span className="text-gray-600">Plot No:</span>
              <span className="font-semibold ml-2">{data.plot.plotNo}</span>
            </div>
            <div>
              <span className="text-gray-600">Project:</span>
              <span className="font-semibold ml-2">{formatProjectName(data.plot.project)}</span>
            </div>
            <div>
              <span className="text-gray-600">Size:</span>
              <span className="font-semibold ml-2">{formatPlotSize(data.plot.size)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Owner (From) */}
      <div className="border-2 border-gray-900 mb-1.5">
        <div className="bg-gray-50 px-2 py-0.5 border-b border-gray-900">
          <h3 className="text-xs font-bold text-gray-900">CURRENT OWNER (TRANSFEROR)</h3>
        </div>
        <div className="p-1.5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="font-semibold ml-2">{toTitleCase(data.fromCustomer.name)}</span>
            </div>
            <div>
              <span className="text-gray-600">Father Name:</span>
              <span className="font-semibold ml-2">{toTitleCase(data.fromCustomer.fatherName)}</span>
            </div>
            <div>
              <span className="text-gray-600">CNIC:</span>
              <span className="font-semibold ml-2">{data.fromCustomer.cnic}</span>
            </div>
            <div>
              <span className="text-gray-600">Phone:</span>
              <span className="font-semibold ml-2">{data.fromCustomer.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* New Owner (To) */}
      <div className="border-2 border-gray-900 mb-1.5">
        <div className="bg-gray-50 px-2 py-0.5 border-b border-gray-900">
          <h3 className="text-xs font-bold text-gray-900">NEW OWNER (TRANSFEREE)</h3>
        </div>
        <div className="p-1.5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="font-semibold ml-2">{toTitleCase(data.toCustomer.name)}</span>
            </div>
            <div>
              <span className="text-gray-600">Father Name:</span>
              <span className="font-semibold ml-2">{toTitleCase(data.toCustomer.fatherName)}</span>
            </div>
            <div>
              <span className="text-gray-600">CNIC:</span>
              <span className="font-semibold ml-2">{data.toCustomer.cnic}</span>
            </div>
            <div>
              <span className="text-gray-600">Phone:</span>
              <span className="font-semibold ml-2">{data.toCustomer.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Details */}
      <div className="border-2 border-gray-900 mb-2">
        <div className="bg-gray-50 px-2 py-0.5 border-b border-gray-900">
          <h3 className="text-xs font-bold text-gray-900">FINANCIAL DETAILS</h3>
        </div>
        <div className="p-1.5">
          <div className="grid grid-cols-2 gap-x-6 text-xs">
            <div>
              <span className="text-gray-600">Transfer Amount:</span>
              <span className="font-semibold ml-2">{formatCurrency(data.transferAmount)}</span>
            </div>
            <div>
              <span className="text-gray-600">Transfer Fee:</span>
              <span className="font-semibold ml-2">{formatCurrency(data.transferFee)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-6 mt-3 mb-2">
        <div>
          {(data.status === 'APPROVED' || data.status === 'COMPLETED') && data.approvedBy ? (
            <div>
              <div className="w-full border-b-2 border-gray-900 h-12 mb-1.5 flex items-center justify-center">
                <img
                  src={data.approvedBy.signature 
                    ? `${API_BASE_URL}${data.approvedBy.signature}` 
                    : `${API_BASE_URL}/signatures/admin-signature.png`}
                  alt="Signature"
                  className="max-h-10 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = `${API_BASE_URL}/signatures/admin-signature.png`;
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-600 text-center">Approved By</p>
              <p className="text-xs font-semibold text-center">{data.approvedBy.name}</p>
            </div>
          ) : (
            <div>
              <div className="border-b-2 border-gray-900 h-12 mb-1.5"></div>
              <p className="text-[10px] text-gray-600 text-center">Approved By</p>
              <p className="text-xs font-semibold text-center">Admin User</p>
            </div>
          )}
        </div>
        <div>
          <div className="border-b-2 border-gray-900 h-12 mb-1.5"></div>
          <p className="text-[10px] text-gray-600 text-center">Transferor Signature</p>
          <p className="text-xs font-semibold text-center">{toTitleCase(data.fromCustomer.name)}</p>
        </div>
      </div>

      {/* Notes Section */}
      {copyLabel === 'OFFICE COPY' && (
        <div className="border-t-2 border-gray-900 pt-2">
          <h4 className="text-xs font-bold mb-1">Notes:</h4>
          <ul className="text-[10px] space-y-0.5 list-none">
            <li>a. NOC will be prepared within 48 hours.</li>
            <li>b. Photo copy of current ID card to be attached with NOC issuance request.</li>
            <li>c. N.D.C can only be applied by allottee.</li>
            <li>d. Please collect Transfer Check List before proceeding for the Transfer.</li>
          </ul>
        </div>
      )}
      </div>
    </div>
  );

  return (
    <>
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden bg-gray-100 p-4 sticky top-0 z-50 border-b">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isUrdu ? 'واپس' : 'Back'}
          </Button>
          {!hidePrintButton && (
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              {isUrdu ? 'پرنٹ کریں' : 'Print'}
            </Button>
          )}
        </div>
      </div>

      {/* Printable Content */}
      <div ref={contentRef} className="print-container" dir={isUrdu ? 'rtl' : 'ltr'} lang={isUrdu ? 'ur' : 'en'}>
        {/* Letterhead Header - Screen only */}
        <div className="letterhead-header w-full print:hidden" style={{ marginBottom: '20px' }}>
          <img src="/letterhead header.png" alt="Header" className="w-full" style={{ display: 'block', width: '100%', maxWidth: '100%' }} />
        </div>

        {renderContent()}

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
            margin: 4mm 8mm;
          }

          html, body {
            height: auto !important;
            overflow: visible !important;
          }

          * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
            font-size: 9px !important;
          }

          .print-container {
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 0 !important;
          }

          .letterhead-header,
          .letterhead-footer {
            display: none !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .watermark-logo {
            position: absolute !important;
            opacity: 0.1 !important;
            width: 350px !important;
            height: 350px !important;
          }

          /* Ensure both copies fit on one page */
          .relative {
            min-height: auto !important;
            height: auto !important;
          }

          .relative.z-10 {
            padding: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
          }

          /* Prevent page breaks within copies */
          .mb-8, .mb-4, .mb-3 {
            page-break-inside: avoid;
          }

          /* Compact all elements */
          * {
            line-height: 1.1 !important;
          }

          h1, h2, h3, h4, p {
            margin: 0 !important;
          }

          .border-2 {
            border-width: 1px !important;
          }

          img {
            max-width: 100% !important;
            height: auto !important;
          }

          /* Specific print adjustments */
          .grid {
            gap: 0.25rem !important;
          }

          .border {
            border-width: 0.5px !important;
          }
        }

        @media screen {
          .print-container {
            background: white;
            min-height: 100vh;
          }
        }
      `}</style>
    </>
  );
}
