import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toTitleCase } from "@/lib/utils";
import {
  formatCurrency,
  formatDate as formatDateUtil,
  formatEnum,
  formatProjectName as formatProjectNameUtil,
  formatSize as formatSizeUtil
} from "@/utils/formatters";

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

interface PrintableSaleAgreementFormProps {
  data: {
    customer: {
      name: string;
      fatherName: string;
      cnic: string;
      phone: string;
      address: string;
    };
    plot: {
      plotNo: string;
      project: string;
      size: string;
      price: number;
    };
    totalAmount: number;
    downPayment: number;
    installmentMonths: number;
    monthlyAmount: number;
    agreementDate: string;
    possessionDate?: string;
    agreementNumber: string;
    status?: string;
    biyanaAmount?: number;
    createdBy?: {
      name: string;
      signature?: string;
    };
    witnesses?: Array<{
      name: string;
      cnic: string;
    }>;
    terms?: string;
    biyana?: {
      tokenAmount?: number;
      totalAmount?: number;
      pricePerMarla?: number;
      totalRemaining?: number;
      monthlyInstallments?: number;
      quarterlyInstallments?: number;
      monthlyInstallmentAmount?: number;
      quarterlyInstallmentAmount?: number;
      agreementDuration?: string;
      lastInstallmentDate?: string;
      installmentType?: string;
    };
  };
  onClose?: () => void;
  hidePrintButton?: boolean;
}

export default function PrintableSaleAgreementForm({ data, onClose, hidePrintButton }: PrintableSaleAgreementFormProps) {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const contentRef = useRef<HTMLDivElement>(null);

  // Local wrappers for formatters
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return formatDateUtil(dateString, 'en-PK');
  };
  const formatProjectName = (value: string) => formatProjectNameUtil(value, t);
  const formatPlotSize = (value: string) => formatSizeUtil(value, t);

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
          <title>Sale Agreement - ${data.agreementNumber}</title>
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

  // Use biyana data if available, otherwise fall back to sale agreement data
  const totalAmount = data.biyana?.totalAmount || data.totalAmount;
  const biyanaAmount = data.biyana?.tokenAmount || data.biyanaAmount || 0;
  const installmentMonths = data.biyana?.monthlyInstallments || data.installmentMonths;
  const quarterlyInstallments = data.biyana?.quarterlyInstallments || 0;
  const installmentType = data.biyana?.installmentType || 'MONTHLY_ONLY';
  const tenPercentAmount = data.plot.price * 0.10;
  
  // Calculate due payment (same as SaleAgreementForm)
  const duePayment = totalAmount - data.downPayment - biyanaAmount;
  
  // Calculate installments using the same logic as SaleAgreementForm
  let calculatedMonthlyAmount = 0;
  let calculatedQuarterlyAmount = 0;
  
  if (duePayment > 0 && installmentMonths > 0) {
    if (installmentType === 'MONTHLY_ONLY') {
      // Monthly only: divide due payment by number of months and round up
      calculatedMonthlyAmount = Math.ceil(duePayment / installmentMonths);
    } else if (installmentType === 'MONTHLY_AND_QUARTERLY' && quarterlyInstallments > 0) {
      // Monthly + Quarterly: calculate using original ratio from Biyana form
      const originalQuarterlyAmt = data.biyana?.quarterlyInstallmentAmount || 0;
      const originalMonthlyAmt = data.biyana?.monthlyInstallmentAmount || 0;
      
      if (originalMonthlyAmt > 0 && originalQuarterlyAmt > 0) {
        const originalMonthlyTotal = originalMonthlyAmt * installmentMonths;
        const originalQuarterlyTotal = originalQuarterlyAmt * quarterlyInstallments;
        const originalTotal = originalMonthlyTotal + originalQuarterlyTotal;
        
        // Calculate ratio and apply to new due payment
        const monthlyRatio = originalMonthlyTotal / originalTotal;
        const newMonthlyTotal = duePayment * monthlyRatio;
        calculatedMonthlyAmount = Math.ceil(newMonthlyTotal / installmentMonths);
        
        // Quarterly gets the remainder
        const remainingForQuarterly = duePayment - newMonthlyTotal;
        calculatedQuarterlyAmount = Math.ceil(remainingForQuarterly / quarterlyInstallments);
      } else {
        // Fallback if no original amounts
        calculatedMonthlyAmount = Math.ceil(duePayment / installmentMonths);
      }
    }
  }
  
  // Use calculated amounts or fall back to data amounts
  const monthlyAmount = calculatedMonthlyAmount || data.biyana?.monthlyInstallmentAmount || data.monthlyAmount;
  const quarterlyAmount = calculatedQuarterlyAmount || data.biyana?.quarterlyInstallmentAmount || 0;
  
  // Calculate remaining balance for display
  const remainingBalance = duePayment;

  return (
    <div className="bg-gray-50 max-h-screen overflow-auto print:max-h-none print:overflow-visible">
      {/* Print Controls - Hidden during print */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('printableForms.saleAgreementDeed')} - {data.agreementNumber}</h2>
          <div className="flex gap-2">
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
            
            <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Form Title */}
            <div className="mb-8 print:mb-4" style={{ textAlign: 'center' }}>
              <h1 className="text-3xl print:text-2xl font-bold mb-2 print:mb-1" style={{ textAlign: 'center', fontFamily: isUrdu ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" : "'Outfit', sans-serif" }}>{t('printableForms.saleAgreementDeed')}</h1>
              <p className="text-sm print:text-xs mt-2 print:mt-1" style={{ textAlign: 'center' }}>{t('printableForms.agreementNo')}: {data.agreementNumber}</p>
              <p className="text-sm print:text-xs" style={{ textAlign: 'center' }}>{t('printableForms.date')}: {formatDate(data.agreementDate)}</p>
            </div>

            <div className="relative">
              {/* Photo Box - Left in RTL (Urdu), Right in LTR (English) */}
              <div className={`absolute top-0 border-2 border-black w-40 h-48 flex items-center justify-center p-2 ${isUrdu ? 'left-0' : 'right-0'}`}>
                <p className="text-center text-sm">{t('printableForms.passportPhoto')}</p>
              </div>

              {/* Main Content */}
              <div className={isUrdu ? 'mr-0 ml-44' : 'ml-0 mr-44'}>
                {/* Customer Info */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-baseline gap-3">
                    <span className="font-semibold whitespace-nowrap w-40">{t('printableForms.receivedFrom')}:</span>
                    <div className="border-b-2 border-black px-3 py-1 flex-1">{data.customer.name}</div>
                  </div>
                  
                  <div className="flex items-baseline gap-3">
                    <span className="font-semibold whitespace-nowrap w-40">{t('printableForms.sonOf')}:</span>
                    <div className="border-b-2 border-black px-3 py-1 flex-1">{data.customer.fatherName}</div>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="font-semibold whitespace-nowrap w-40">{t('printableForms.cnicNo')}:</span>
                    <div className="border-b-2 border-black px-3 py-1 flex-1">{data.customer.cnic}</div>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="font-semibold whitespace-nowrap w-40">{t('printableForms.contactNo')}:</span>
                    <div className="border-b-2 border-black px-3 py-1 flex-1">{data.customer.phone}</div>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="font-semibold whitespace-nowrap w-40">{t('printableForms.residentialAddress')}:</span>
                    <div className="border-b-2 border-black px-3 py-1 flex-1">{data.customer.address}</div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6 text-sm leading-relaxed text-justify">
                  <p>
                    {t('printableForms.thisAgreement')} {toTitleCase(data.customer.name)} {t('printableForms.witnessedBy')}
                  </p>
                </div>

                {/* Plot Details & Payment Details in 2 Columns */}
                <h2 className="text-xl print:text-lg font-bold mb-2 print:mb-1.5" style={{ textAlign: 'center', fontFamily: isUrdu ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" : "'Outfit', sans-serif" }}>
                  {isUrdu ? 'پلاٹ اور ادائیگی کی تفصیلات' : 'Plot Details & Payment Details'}
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
                          <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.phase')}</td>
                          <td className="p-2 print:p-1.5">{formatProjectName(data.plot.project)}</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.category')}</td>
                          <td className="p-2 print:p-1.5">{t('printableForms.residential')}</td>
                        </tr>
                        <tr>
                          <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.plotSize')}</td>
                          <td className="p-2 print:p-1.5">{formatPlotSize(data.plot.size)}</td>
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
                          <td className="border-r border-black p-2 print:p-1.5 font-bold bg-gray-100">{t('printableForms.totalAmount')}</td>
                          <td className="p-2 print:p-1.5 font-bold">{formatCurrency(totalAmount)}</td>
                        </tr>
                        {biyanaAmount > 0 && (
                          <tr className="border-b border-black">
                            <td className="border-r border-black p-2 print:p-1.5 font-bold bg-gray-100">{t('forms.biyanaAmount')}</td>
                            <td className="p-2 print:p-1.5 font-bold">{formatCurrency(biyanaAmount)}</td>
                          </tr>
                        )}
                        <tr className="border-b border-black">
                          <td className="border-r border-black p-2 print:p-1.5 font-bold bg-gray-100">{t('printableForms.downPayment')}</td>
                          <td className="p-2 print:p-1.5 font-bold">{formatCurrency(data.downPayment)}</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.installmentPlan')}</td>
                          <td className="p-2 print:p-1.5">{installmentMonths > 0 ? `${installmentMonths} ${t('printableForms.months')}` : t('printableForms.fullPayment')}</td>
                        </tr>
                        <tr className={installmentType === 'MONTHLY_AND_QUARTERLY' && quarterlyInstallments > 0 ? "border-b border-black" : ""}>
                          <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.monthlyInstallment')}</td>
                          <td className="p-2 print:p-1.5">{monthlyAmount > 0 ? formatCurrency(monthlyAmount) : t('payments.notAvailable')}</td>
                        </tr>
                        {installmentType === 'MONTHLY_AND_QUARTERLY' && quarterlyInstallments > 0 && (
                          <>
                            <tr className="border-b border-black">
                              <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.quarterlyInstallments')}</td>
                              <td className="p-2 print:p-1.5">{quarterlyInstallments}</td>
                            </tr>
                            <tr className="border-b border-black">
                              <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.quarterlyInstallmentAmount')}</td>
                              <td className="p-2 print:p-1.5">{formatCurrency(quarterlyAmount)}</td>
                            </tr>
                            <tr className="border-b border-black">
                              <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.remainingBalance')}</td>
                              <td className="p-2 print:p-1.5">{formatCurrency(remainingBalance)}</td>
                            </tr>
                          </>
                        )}
                        {!(installmentType === 'MONTHLY_AND_QUARTERLY' && quarterlyInstallments > 0) && (
                          <tr className="border-b border-black">
                            <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.remainingBalance')}</td>
                            <td className="p-2 print:p-1.5">{formatCurrency(remainingBalance)}</td>
                          </tr>
                        )}
                        <tr>
                          <td className="border-r border-black p-2 print:p-1.5 font-semibold bg-gray-100">{t('printableForms.possessionDate')}</td>
                          <td className="p-2 print:p-1.5">{data.possessionDate ? formatDate(data.possessionDate) : t('printableForms.afterFullPayment')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <h2 className="text-xl print:text-lg font-bold mt-6 print:mt-3 mb-4 print:mb-2" style={{ textAlign: 'center', fontFamily: isUrdu ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" : "'Outfit', sans-serif" }}>{t('printableForms.termsConditions')}</h2>
            <div className="space-y-3 print:space-y-2 text-sm print:text-xs leading-relaxed print:leading-normal">
              {data.terms ? (
                <div className="whitespace-pre-wrap break-words">{data.terms}</div>
              ) : isUrdu ? (
                <>
                  <p className="break-inside-avoid">1. پلاٹ کا سائز 270 مربع فٹ ہوگا، اور 270 مربع فٹ سے زائد رقبہ کی صورت میں اضافی رقم لاگو ہوگی۔</p>
                  <p className="break-inside-avoid">2. بجلی، پانی، گیس اور دیگر سہولیات کی فراہمی متعلقہ سرکاری اداروں کے قوانین کے مطابق ہوگی۔</p>
                  <p className="break-inside-avoid">3. قبضہ فریق دوم کو مکمل ادائیگی کے بعد دیا جائے گا، جبکہ فیز اول میں 75٪ ادائیگی پر قبضہ دیا جا سکتا ہے۔</p>
                  <p className="break-inside-avoid">4. فریق دوم اقساط کی بروقت ادائیگی کا پابند ہوگا۔</p>
                  <p className="break-inside-avoid">5. اقساط کی عدم ادائیگی کی صورت میں الاٹمنٹ منسوخ کی جا سکتی ہے۔</p>
                  <p className="break-inside-avoid">6. فریق دوم بغیر اجازت پلاٹ کسی دوسرے شخص کو منتقل نہیں کر سکے گا۔</p>
                  <p className="break-inside-avoid">7. ٹرانسفر فیس متعلقہ پالیسی کے مطابق لاگو ہوگی۔</p>
                  <p className="break-inside-avoid">8. کسی بھی قانونی تنازعہ کی صورت میں فیصلہ شادمان گرینز انتظامیہ کا حتمی ہوگا۔</p>
                  <p className="break-inside-avoid">9. تاخیر کی صورت میں جرمانہ لاگو ہوگا۔</p>
                  <p className="break-inside-avoid">10. فریق دوم سوسائٹی کے تمام قوانین و ضوابط کا پابند ہوگا۔</p>
                  <p className="break-inside-avoid">11. سوسائٹی کی اجازت کے بغیر تعمیر ممنوع ہوگی۔</p>
                  <p className="break-inside-avoid">12. نقشہ منظوری کے بغیر تعمیر غیر قانونی سمجھی جائے گی۔</p>
                  <p className="break-inside-avoid">13. انفراسٹرکچر چارجز علیحدہ سے وصول کیے جائیں گے۔</p>
                  <p className="break-inside-avoid">14. فریق دوم کی طرف سے تمام واجبات کی عدم ادائیگی پر فریق اول کو الاٹمنٹ منسوخ کرنے کا حق حاصل ہوگا۔</p>
                  <p className="break-inside-avoid">15. فریق دوم 75٪ ادائیگی کے بعد پلاٹ کے قبضہ کی درخواست دینے کا اہل ہوگا۔</p>
                  <p className="break-inside-avoid">16. معاہدہ فریقین کے دستخط کے بعد قابل عمل ہوگا۔</p>
                  <p className="break-inside-avoid">17. سال 2010 کے پنجاب پرائیویٹ ہاؤسنگ سوسائٹی رولز کے تحت یہ معاہدہ کیا گیا ہے۔</p>
                  <p className="break-inside-avoid">18. پلاٹ رہن رکھوانے یا کسی بھی قسم کی قانونی کارروائی کے لیے این او سی درکار ہوگا۔</p>
                  <p className="break-inside-avoid">19. کسی بھی خلاف ورزی کی صورت میں سوسائٹی کو قانونی کارروائی کا حق حاصل ہوگا۔</p>
                  <p className="break-inside-avoid">20. کسی تنازعہ کی صورت میں عدالتی اختیار صرف متعلقہ عدالت کو ہوگا۔</p>
                  <p className="break-inside-avoid">21. پلاٹ کی منتقلی صرف سوسائٹی ریکارڈ میں اندراج کے بعد قابل قبول ہوگی۔</p>
                  <p className="break-inside-avoid">22. فریق دوم تمام بلدیاتی، ترقیاتی اور دیگر سرکاری واجبات کا ذمہ دار ہوگا۔</p>
                </>
              ) : (
                <>
                  <p className="break-inside-avoid">1. Plot size will be 270 square feet minimum, additional charges apply for larger plots.</p>
                  <p className="break-inside-avoid">2. Electricity, water, gas and other facilities will be provided as per government regulations.</p>
                  <p className="break-inside-avoid">3. Possession will be given after full payment, while in Phase I, 75% payment allows possession.</p>
                  <p className="break-inside-avoid">4. Party B shall be responsible for timely payment of installments.</p>
                  <p className="break-inside-avoid">5. Allotment may be cancelled in case of non-payment of installments.</p>
                  <p className="break-inside-avoid">6. Party B cannot transfer the plot to another person without permission.</p>
                  <p className="break-inside-avoid page-break-after">7. Transfer fee will be applicable as per the policy.</p>
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
                </>
              )}
            </div>

            {/* Affidavit */}
            <h2 className="text-lg print:text-base font-bold mt-6 print:mt-3 mb-3 print:mb-2 break-after-avoid" style={{ textAlign: 'center', fontFamily: isUrdu ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" : "'Outfit', sans-serif" }}>{t('printableForms.affidavit')}</h2>
            
            <div className="mb-4 print:mb-2 text-sm print:text-xs leading-relaxed print:leading-snug text-justify break-inside-avoid">
              <p>
                {isUrdu ? (
                  <>میں حلفاً بیان کرتا / کرتی ہوں کہ مذکورہ پلاٹ ہاؤسنگ شادمان گرینز فیز میں واقع ہے اور میں اس معاہدہ کے تمام قوانین و شرائط کو تسلیم کرتا / کرتی ہوں۔</>
                ) : (
                  <>I solemnly declare that the said plot is located in Shadman Greens Housing and I accept all terms and conditions of this agreement.</>
                )}
              </p>
            </div>

            {/* Signatures */}
            <h2 className="text-lg print:text-base font-bold mt-6 print:mt-3 mb-4 print:mb-2 break-after-avoid" style={{ textAlign: 'center', fontFamily: isUrdu ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" : "'Outfit', sans-serif" }}>{t('printableForms.partySignatures')}</h2>

            <div className="grid grid-cols-2 gap-8 print:gap-4 mb-4 print:mb-2 break-inside-avoid">
              <div className="text-center">
                {data.status === 'APPROVED' ? (
                  <div className="flex flex-col items-center">
                    <div className="w-full border-b-2 border-black h-16 print:h-12 mb-2 print:mb-1 flex items-center justify-center">
                      <img 
                        src={data.createdBy?.signature ? `${API_BASE_URL}${data.createdBy.signature}` : `${API_BASE_URL}/signatures/admin-signature.png`} 
                        alt={t('printableForms.firstParty')} 
                        className="max-h-12 print:max-h-8 max-w-[120px] print:max-w-[100px] object-contain"
                        onLoad={() => console.log('✅ Signature loaded')}
                        onError={(e) => {
                          console.error('❌ Signature failed to load');
                          e.currentTarget.src = `${API_BASE_URL}/signatures/admin-signature.png`;
                        }}
                      />
                    </div>
                    <p className="font-bold text-sm print:text-xs">{t('printableForms.firstParty')}</p>
                    <p className="text-xs print:text-[10px] mt-1 print:mt-0">({data.createdBy?.name || 'Admin'})</p>
                  </div>
                ) : (
                  <>
                    <div className="border-b-2 border-black h-16 print:h-12 mb-2 print:mb-1 flex items-center justify-center">
                      <span className="text-gray-500 text-sm print:text-xs"></span>
                    </div>
                    <p className="font-bold text-sm print:text-xs">{t('printableForms.firstParty')}</p>
                    <p className="text-xs print:text-[10px] mt-1 print:mt-0">({data.createdBy?.name || 'Admin'})</p>
                  </>
                )}
              </div>
              <div className="text-center">
                <div className="border-b-2 border-black h-16 print:h-12 mb-2 print:mb-1"></div>
                <p className="font-bold text-sm print:text-xs">{t('printableForms.secondParty')}</p>
                <p className="text-xs print:text-[10px] mt-1 print:mt-0">({toTitleCase(data.customer.name)})</p>
              </div>
            </div>

            {/* Witnesses */}
            <div className="border-2 border-black p-4 print:p-2 mt-4 print:mt-2 break-inside-avoid">
              <h3 className="text-base print:text-sm font-bold mb-4 print:mb-2" style={{ textAlign: 'center', fontFamily: isUrdu ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" : "'Outfit', sans-serif" }}>{t('printableForms.witness')}</h3>
              <div className="grid grid-cols-2 gap-6 print:gap-3">
                {/* Witness 1 */}
                <div className="space-y-3 print:space-y-2">
                  <h4 className="font-bold text-sm print:text-xs" style={{ textAlign: 'center', fontFamily: isUrdu ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" : "'Outfit', sans-serif" }}>{t('printableForms.witness')} 1</h4>
                  <div>
                    <p className="mb-1 print:mb-0.5 font-semibold text-xs print:text-[10px]">{t('printableForms.witnessName')}:</p>
                    <div className="border-b-2 border-black h-8 print:h-6 px-2 print:px-1 flex items-center text-sm print:text-xs">
                      {data.witnesses && data.witnesses[0] ? data.witnesses[0].name : ''}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 print:mb-0.5 font-semibold text-xs print:text-[10px]">{t('printableForms.witnessCNIC')}:</p>
                    <div className="border-b-2 border-black h-8 print:h-6 px-2 print:px-1 flex items-center text-sm print:text-xs">
                      {data.witnesses && data.witnesses[0] ? data.witnesses[0].cnic : ''}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 print:mb-0.5 font-semibold text-xs print:text-[10px]">{t('printableForms.witnessSignature')}:</p>
                    <div className="border-b-2 border-black h-12 print:h-8"></div>
                  </div>
                </div>

                {/* Witness 2 */}
                <div className="space-y-3 print:space-y-2">
                  <h4 className="font-bold text-sm print:text-xs" style={{ textAlign: 'center', fontFamily: isUrdu ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" : "'Outfit', sans-serif" }}>{t('printableForms.witness')} 2</h4>
                  <div>
                    <p className="mb-1 print:mb-0.5 font-semibold text-xs print:text-[10px]">{t('printableForms.witnessName')}:</p>
                    <div className="border-b-2 border-black h-8 print:h-6 px-2 print:px-1 flex items-center text-sm print:text-xs">
                      {data.witnesses && data.witnesses[1] ? data.witnesses[1].name : ''}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 print:mb-0.5 font-semibold text-xs print:text-[10px]">{t('printableForms.witnessCNIC')}:</p>
                    <div className="border-b-2 border-black h-8 print:h-6 px-2 print:px-1 flex items-center text-sm print:text-xs">
                      {data.witnesses && data.witnesses[1] ? data.witnesses[1].cnic : ''}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 print:mb-0.5 font-semibold text-xs print:text-[10px]">{t('printableForms.witnessSignature')}:</p>
                    <div className="border-b-2 border-black h-12 print:h-8"></div>
                  </div>
                </div>
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
            position: relative !important;
            top: auto !important;
            left: auto !important;
            right: auto !important;
            width: 100% !important;
            height: auto !important;
            z-index: 1 !important;
            page-break-inside: avoid !important;
            margin-bottom: 0 !important;
          }

          .letterhead-header img {
            width: 100% !important;
            height: auto !important;
            display: block !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            opacity: 1 !important;
            visibility: visible !important;
          }

          .letterhead-footer {
            position: relative !important;
            bottom: auto !important;
            left: auto !important;
            right: auto !important;
            width: 100% !important;
            height: auto !important;
            z-index: 1 !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            display: block !important;
            page-break-inside: avoid !important;
            margin-top: 0 !important;
          }

          .letterhead-footer img {
            width: 100% !important;
            height: auto !important;
            display: block !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            opacity: 1 !important;
            visibility: visible !important;
          }

          .page-content {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            padding-left: 10px;
            padding-right: 10px;
            padding-top: 20px;
            padding-bottom: 20px;
          }

          .watermark-logo {
            position: fixed !important;
            display: block !important;
          }

          .watermark-logo img {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
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

          /* Page break after condition 7 */
          .page-break-after {
            page-break-after: always !important;
            break-after: page !important;
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