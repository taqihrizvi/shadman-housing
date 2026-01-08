import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import html2pdf from "html2pdf.js";

interface PrintableBiyanaFormProps {
  data: {
    customerName: string;
    fatherName: string;
    cnic: string;
    phone: string;
    address: string;
    permanentAddress?: string;
    currentAddress?: string;
    plot: {
      plotNo: string;
      project: string;
      size: string;
      block: string;
      price: number;
    };
    biyanaAmount: number;
    paymentMethod: string;
    date: string;
    agreementNumber?: string;
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
    return new Date(dateString).toLocaleDateString("en-PK");
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
    const fileName = `Biyana-Form-Plot-${plotNumber}.pdf`;

    const opt = {
      margin: [5, 5, 5, 5] as [number, number, number, number],
      filename: fileName,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: { 
        unit: 'mm' as const, 
        format: 'legal', 
        orientation: 'portrait' as const,
        compress: true
      },
      pagebreak: { mode: ['css', 'legacy'], before: '.page-break-before', after: '.page-break-after', avoid: ['tr', 'td'] }
    };

    try {
      const controls = document.querySelectorAll('.print\\:hidden');
      controls.forEach(el => (el as HTMLElement).style.display = 'none');

      await html2pdf().set(opt).from(contentRef.current).save();

      controls.forEach(el => (el as HTMLElement).style.display = '');
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const tenPercentAmount = data.plot.price * 0.10;

  return (
    <div className="bg-gray-50 max-h-screen overflow-auto">
      {/* Print Controls - Hidden during print */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Biyana Agreement Form</h2>
          <div className="flex gap-2">
            {onClose && (
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            )}
            <Button onClick={handleDownloadPDF} variant="default">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button onClick={handlePrint} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Printable Content */}
      <div ref={contentRef} className="bg-white max-w-full">
          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
              <h1 className="text-3xl font-bold mb-2">BIYANA AGREEMENT FORM</h1>
              <p className="text-base">Shadman Greens Housing - Phase I & Phase II</p>
              <p className="text-sm mt-2">Agreement Date: {formatDate(data.date)}</p>
            </div>

            <div className="relative">
              {/* Photo Box */}
              <div className="absolute right-0 top-0 border-2 border-black w-40 h-48 flex items-center justify-center p-2">
                <p className="text-center text-sm">Passport Size Photograph</p>
              </div>

              {/* Main Content */}
              <div className="ml-0 mr-44">
                {/* Customer Info */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-baseline gap-3">
                    <span className="font-semibold whitespace-nowrap w-40">Buyer Name:</span>
                    <div className="border-b-2 border-black px-3 py-1 flex-1">{data.customerName}</div>
                  </div>
                  
                  <div className="flex items-baseline gap-3">
                    <span className="font-semibold whitespace-nowrap w-40">Father's Name:</span>
                    <div className="border-b-2 border-black px-3 py-1 flex-1">{data.fatherName}</div>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="font-semibold whitespace-nowrap w-40">CNIC:</span>
                    <div className="border-b-2 border-black px-3 py-1 flex-1">{data.cnic}</div>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="font-semibold whitespace-nowrap w-40">Permanent Address:</span>
                    <div className="border-b-2 border-black px-3 py-1 flex-1">{data.permanentAddress || data.address}</div>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="font-semibold whitespace-nowrap w-40">Current Address:</span>
                    <div className="border-b-2 border-black px-3 py-1 flex-1">{data.currentAddress || data.permanentAddress || data.address}</div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6 text-sm leading-relaxed text-justify">
                  <p>
                    This agreement is made between Party A and Party B, where both parties have mutually agreed 
                    without any coercion or duress, with their free consent. Party B agrees to purchase a plot 
                    of land with the following details through cash and easy installments.
                  </p>
                </div>

                {/* Plot Details */}
                <h2 className="text-xl font-bold text-center mb-4">PLOT DETAILS</h2>

                <div className="border-2 border-black mb-6">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b-2 border-black">
                        <td className="border-r-2 border-black p-3 font-semibold w-1/2">Plot Number</td>
                        <td className="p-3">{data.plot.plotNo}</td>
                      </tr>
                      <tr className="border-b-2 border-black">
                        <td className="border-r-2 border-black p-3 font-semibold">Block</td>
                        <td className="p-3">{data.plot.block}</td>
                      </tr>
                      <tr className="border-b-2 border-black">
                        <td className="border-r-2 border-black p-3 font-semibold">Phase</td>
                        <td className="p-3">{formatEnum(data.plot.project)}</td>
                      </tr>
                      <tr className="border-b-2 border-black">
                        <td className="border-r-2 border-black p-3 font-semibold">Category</td>
                        <td className="p-3">Residential</td>
                      </tr>
                      <tr className="border-b-2 border-black">
                        <td className="border-r-2 border-black p-3 font-semibold">Plot Size</td>
                        <td className="p-3">{data.plot.size}</td>
                      </tr>
                      <tr className="border-b-2 border-black">
                        <td className="border-r-2 border-black p-3 font-semibold">Additional Park Fee (10%)</td>
                        <td className="p-3">{formatCurrency(tenPercentAmount)}</td>
                      </tr>
                      <tr className="border-b-2 border-black">
                        <td className="border-r-2 border-black p-3 font-bold">Total Price</td>
                        <td className="p-3 font-bold">{formatCurrency(data.plot.price)}</td>
                      </tr>
                      <tr className="border-b-2 border-black">
                        <td className="border-r-2 border-black p-3 font-bold">Advance Payment</td>
                        <td className="p-3 font-bold">{formatCurrency(data.biyanaAmount)}</td>
                      </tr>
                      <tr className="border-b-2 border-black">
                        <td className="border-r-2 border-black p-3 font-semibold">Total Installments</td>
                        <td className="p-3">_______________</td>
                      </tr>
                      <tr className="border-b-2 border-black">
                        <td className="border-r-2 border-black p-3 font-semibold">Monthly Installment</td>
                        <td className="p-3">_______________</td>
                      </tr>
                      <tr>
                        <td className="border-r-2 border-black p-3 font-semibold">Remaining Balance</td>
                        <td className="p-3">_______________</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <h2 className="text-xl font-bold text-center mt-6 mb-4">TERMS & CONDITIONS</h2>
            
            <div className="space-y-2 text-sm leading-relaxed">
              <p className="break-inside-avoid">1. Plot size will be 270 square feet minimum, additional charges apply for larger plots.</p>
              <p className="break-inside-avoid">2. Electricity, water, gas and other facilities will be provided as per government regulations.</p>
              <p className="break-inside-avoid">3. Possession will be given after full payment, while in Phase I, 75% payment allows possession.</p>
              <p className="break-inside-avoid">4. Party B shall be responsible for timely payment of installments.</p>
              <p className="break-inside-avoid">5. Allotment may be cancelled in case of non-payment of installments.</p>
              <p className="break-inside-avoid">6. Party B cannot transfer the plot to another person without permission.</p>
              <p className="break-inside-avoid">7. Transfer fee will be applicable as per the policy.</p>
              <p className="break-inside-avoid">8. In case of any legal dispute, the decision of Shadman Greens management will be final.</p>
              <p className="break-inside-avoid">9. Penalty will be imposed in case of delay.</p>
              <p className="break-inside-avoid">10. Party B shall comply with all society rules and regulations.</p>
              <p className="break-inside-avoid">11. Construction without society permission is prohibited.</p>
              <p className="break-inside-avoid">12. Construction without approved map will be considered illegal.</p>
              <p className="break-inside-avoid">13. Infrastructure charges will be collected separately.</p>
              <p className="break-inside-avoid">14. Party A has the right to cancel allotment in case of non-payment of all dues by Party B.</p>
              <p className="break-inside-avoid">15. Party B will be eligible to apply for possession after 75% payment.</p>
              <p className="break-inside-avoid">16. The agreement will be effective after signatures of both parties.</p>
              <p className="break-inside-avoid">17. This agreement is made under Punjab Private Housing Society Rules 2010.</p>
              <p className="break-inside-avoid">18. NOC will be required for mortgaging the plot or any legal proceedings.</p>
              <p className="break-inside-avoid">19. Society has the right to take legal action in case of any violation.</p>
              <p className="break-inside-avoid">20. In case of dispute, only the relevant court will have jurisdiction.</p>
              <p className="break-inside-avoid">21. Plot transfer will only be accepted after registration in society records.</p>
              <p className="break-inside-avoid">22. Party B will be responsible for all municipal, development and other government dues.</p>
            </div>

            {/* Affidavit */}
            <h2 className="text-lg font-bold text-center mt-6 mb-3 break-after-avoid">AFFIDAVIT</h2>
            
            <div className="mb-4 text-sm leading-relaxed text-justify break-inside-avoid">
              <p>
                I solemnly declare that the said plot is located in Shadman Greens Housing Phase {formatEnum(data.plot.project)} 
                and I accept all terms and conditions of this agreement.
              </p>
            </div>

            {/* Signatures */}
            <h2 className="text-lg font-bold text-center mt-6 mb-4 break-after-avoid">SIGNATURES</h2>

            <div className="grid grid-cols-2 gap-8 mb-4 break-inside-avoid">
              <div className="text-center">
                {data.status === 'APPROVED' && data.approvedBy?.signature ? (
                  <div className="flex flex-col items-center">
                    <div className="w-full border-b-2 border-black h-16 mb-2 flex items-center justify-center">
                      <img 
                        src={`http://localhost:5000${data.approvedBy.signature}`} 
                        alt="Admin Signature" 
                        className="max-h-14 max-w-full object-contain"
                        onLoad={() => console.log('✅ Signature loaded:', `http://localhost:5000${data.approvedBy.signature}`)}
                        onError={(e) => {
                          console.error('❌ Signature failed to load:', `http://localhost:5000${data.approvedBy.signature}`);
                          console.error('Error details:', e);
                        }}
                      />
                    </div>
                    <p className="font-bold text-sm">Signature of Party A</p>
                    <p className="text-xs mt-1">(Seller - {data.approvedBy.name})</p>
                  </div>
                ) : (
                  <>
                    <div className="border-b-2 border-black h-16 mb-2"></div>
                    <p className="font-bold text-sm">Signature of Party A</p>
                    <p className="text-xs mt-1">(Seller{data.approvedBy?.name ? ` - ${data.approvedBy.name}` : ''})</p>
                  </>
                )}
              </div>
              <div className="text-center">
                <div className="border-b-2 border-black h-16 mb-2"></div>
                <p className="font-bold text-sm">Signature of Party B</p>
                <p className="text-xs mt-1">(Buyer - {data.customerName})</p>
              </div>
            </div>

            {/* Witnesses */}
            <div className="border-2 border-black p-4 mt-4 break-inside-avoid">
              <h3 className="text-base font-bold text-center mb-4">WITNESSES</h3>
              <div className="grid grid-cols-2 gap-6">
                {/* Witness 1 */}
                <div className="space-y-3">
                  <h4 className="font-bold text-center text-sm">Witness 1</h4>
                  <div>
                    <p className="mb-1 font-semibold text-xs">Name:</p>
                    <div className="border-b-2 border-black h-8"></div>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold text-xs">CNIC:</p>
                    <div className="border-b-2 border-black h-8"></div>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold text-xs">Signature:</p>
                    <div className="border-b-2 border-black h-12"></div>
                  </div>
                </div>

                {/* Witness 2 */}
                <div className="space-y-3">
                  <h4 className="font-bold text-center text-sm">Witness 2</h4>
                  <div>
                    <p className="mb-1 font-semibold text-xs">Name:</p>
                    <div className="border-b-2 border-black h-8"></div>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold text-xs">CNIC:</p>
                    <div className="border-b-2 border-black h-8"></div>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold text-xs">Signature:</p>
                    <div className="border-b-2 border-black h-12"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: legal;
            margin: 10mm;
          }

          html, body {
            height: auto;
            overflow: visible;
          }

          * {
            box-shadow: none !important;
            border-color: #000 !important;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            margin: 0;
            padding: 0;
            background: white;
          }

          p {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          h2 {
            page-break-after: avoid;
            break-after: avoid;
          }

          .print\\:hidden {
            display: none !important;
          }
        }

        p {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      `}</style>
    </div>
  );
}
