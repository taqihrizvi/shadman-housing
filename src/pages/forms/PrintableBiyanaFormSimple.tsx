import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import html2pdf from "html2pdf.js";

interface PrintableBiyanaFormProps {
  data: {
    formNumber?: string;
    customerName: string;
    fatherName: string;
    cnic: string;
    phone: string;
    address: string;
    plot: {
      plotNo: string;
      project: string;
      size: string;
      block: string;
      price: number;
    };
    biyanaAmount: number;
    paymentMethod: string;
    chequeNumber?: string;
    bankName?: string;
    transactionId?: string;
    date: string;
    remarks?: string;
    status?: string;
    approvedBy?: {
      name: string;
      signature?: string;
    };
  };
  onClose?: () => void;
}

export default function PrintableBiyanaForm({ data, onClose }: PrintableBiyanaFormProps) {
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
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatEnum = (value: string) => {
    if (!value) return "";
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;

    const plotNumber = data.plot.plotNo.replace(/[^a-zA-Z0-9]/g, '-');
    const fileName = `Biyana-Receipt-${data.formNumber || plotNumber}.pdf`;

    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: fileName,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
      },
      jsPDF: { 
        unit: 'mm' as const, 
        format: 'a4', 
        orientation: 'portrait' as const,
      },
    };

    try {
      const controls = document.querySelectorAll('.print\\:hidden');
      controls.forEach(el => (el as HTMLElement).style.display = 'none');
      await html2pdf().set(opt).from(contentRef.current).save();
      controls.forEach(el => (el as HTMLElement).style.display = '');
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mb-4 print:hidden">
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button onClick={handleDownloadPDF} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        {onClose && (
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        )}
      </div>

      {/* Printable Content */}
      <div ref={contentRef} className="bg-white p-8 print:p-6">
        <div className="border-4 border-black p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">BIYANA RECEIPT</h1>
            <p className="text-lg font-semibold">Token Money / Advance Payment</p>
            {data.formNumber && (
              <p className="text-sm mt-2 font-mono">Receipt No: {data.formNumber}</p>
            )}
            <p className="text-sm">Date: {formatDate(data.date)}</p>
          </div>

          <div className="border-t-2 border-black my-4"></div>

          {/* Customer Information */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 bg-gray-100 p-2">CUSTOMER INFORMATION</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold">Name:</p>
                <p className="text-base">{data.customerName}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Father's Name:</p>
                <p className="text-base">{data.fatherName}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">CNIC:</p>
                <p className="text-base font-mono">{data.cnic}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Phone:</p>
                <p className="text-base">{data.phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-semibold">Address:</p>
                <p className="text-base">{data.address}</p>
              </div>
            </div>
          </div>

          {/* Plot Information */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 bg-gray-100 p-2">PLOT INFORMATION</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold">Plot No:</p>
                <p className="text-base font-bold">{data.plot.plotNo}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Project:</p>
                <p className="text-base">{formatEnum(data.plot.project)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Block:</p>
                <p className="text-base">{data.plot.block}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Plot Size:</p>
                <p className="text-base">{data.plot.size}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-semibold">Total Plot Price:</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(data.plot.price)}</p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 bg-gray-100 p-2">PAYMENT DETAILS</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold">Biyana Amount:</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(data.biyanaAmount)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Payment Method:</p>
                <p className="text-base">{formatEnum(data.paymentMethod)}</p>
              </div>
              {data.paymentMethod === 'CHEQUE' && data.chequeNumber && (
                <>
                  <div>
                    <p className="text-sm font-semibold">Cheque Number:</p>
                    <p className="text-base font-mono">{data.chequeNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Bank Name:</p>
                    <p className="text-base">{data.bankName}</p>
                  </div>
                </>
              )}
              {data.paymentMethod === 'BANK_TRANSFER' && data.transactionId && (
                <div className="col-span-2">
                  <p className="text-sm font-semibold">Transaction ID:</p>
                  <p className="text-base font-mono">{data.transactionId}</p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-sm font-semibold">Remaining Balance:</p>
                <p className="text-xl font-bold text-red-700">{formatCurrency(data.plot.price - data.biyanaAmount)}</p>
              </div>
            </div>
          </div>

          {data.remarks && (
            <div className="mb-6">
              <p className="text-sm font-semibold">Remarks:</p>
              <p className="text-sm italic">{data.remarks}</p>
            </div>
          )}

          <div className="border-t-2 border-black my-6"></div>

          {/* Important Note */}
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 p-4">
            <p className="text-sm font-bold mb-2">IMPORTANT NOTICE:</p>
            <ul className="text-xs space-y-1 list-disc pl-5">
              <li>This receipt confirms the payment of token/advance money (Biyana) only.</li>
              <li>Full sales agreement will be executed after completing all formalities.</li>
              <li>Plot will be reserved for 15 days from the date of this receipt.</li>
              <li>This amount will be adjusted in the final payment as per agreement terms.</li>
              <li>This receipt is subject to approval by management.</li>
            </ul>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div className="text-center">
              {data.status === 'APPROVED' && data.approvedBy?.signature ? (
                <div className="flex flex-col items-center">
                  <div className="w-full border-b-2 border-black h-16 mb-2 flex items-center justify-center">
                    <img 
                      src={`http://localhost:5000${data.approvedBy.signature}`} 
                      alt="Authorized Signature" 
                      className="max-h-14 max-w-full object-contain"
                    />
                  </div>
                  <p className="font-bold text-sm">Authorized Signature</p>
                  <p className="text-xs mt-1">({data.approvedBy.name})</p>
                </div>
              ) : (
                <>
                  <div className="border-b-2 border-black h-16 mb-2"></div>
                  <p className="font-bold text-sm">Authorized Signature</p>
                  <p className="text-xs mt-1">(Company Representative)</p>
                </>
              )}
            </div>
            <div className="text-center">
              <div className="border-b-2 border-black h-16 mb-2"></div>
              <p className="font-bold text-sm">Customer Signature</p>
              <p className="text-xs mt-1">({data.customerName})</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-xs text-gray-600">
            <p>This is a computer-generated receipt and requires authorized signature for validity.</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
