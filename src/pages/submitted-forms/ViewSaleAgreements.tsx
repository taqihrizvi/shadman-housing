import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formsAPI } from "@/lib/api";
import { FileSignature, Loader2, Eye, Printer, CheckCircle, XCircle, Clock } from "lucide-react";
import PrintableSaleAgreementForm from "@/pages/forms/PrintableSaleAgreementForm";
import { useTranslation } from 'react-i18next';
import { toTitleCase } from "@/lib/utils";

const ViewSaleAgreements = () => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  // Helper function to format project names
  const formatProjectName = (value: string) => {
    if (!value) return "";
    // Check for translation first
    if (value === 'SHADMAN_GREENS') {
      const translated = t('projects.shadmanGreens');
      if (translated && !translated.startsWith('projects.')) return translated;
    }
    // Fallback to formatting the enum value
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper function to format status
  const formatStatus = (status: string) => {
    const statusLower = status?.toLowerCase() || 'pending';
    return t(`status.${statusLower}`);
  };

  const { data: forms, isLoading } = useQuery({
    queryKey: ['saleAgreements'],
    queryFn: async () => {
      const response = await formsAPI.getSaleAgreements();
      // Filter out archived agreements
      return response.data.filter((agreement: any) => !agreement.isArchived);
    },
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
      month: "short",
      day: "numeric",
    });
  };

  const formatPaymentPlan = (installmentMonths: number) => {
    if (installmentMonths === 0) return t('payments.fullPayment');
    return `${installmentMonths} Months Installment`;
  };

  const formatEnum = (value: string) => {
    if (!value) return "";
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatSize = (value: string) => {
    if (!value) return "";
    const sizeMap: { [key: string]: string } = {
      'FIVE_MARLA': t('plotSizes.fiveMarla'),
      'SEVEN_MARLA': t('plotSizes.sevenMarla'),
      'TEN_MARLA': t('plotSizes.tenMarla'),
      'ONE_KANAL': t('plotSizes.oneKanal'),
      'TWO_KANAL': t('plotSizes.twoKanal'),
    };
    return sizeMap[value] || formatEnum(value);
  };

  const handleViewDetails = (form: any) => {
    setSelectedForm(form);
    setIsDetailsOpen(true);
  };

  const handlePrintForm = async (form: any) => {
    try {
      const response = await formsAPI.getSaleAgreementById(form.id);
      setPrintData(response.data);
      setIsPrintOpen(true);
    } catch (error) {
      console.error('Error fetching form details:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" dir={isUrdu ? 'rtl' : 'ltr'}>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileSignature className="h-8 w-8" />
              {t('forms.saleAgreement')}
            </h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('forms.submittedForms')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !forms || forms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('forms.noSaleAgreements')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('forms.agreementNo')}</TableHead>
                      <TableHead>{t('forms.customerName')}</TableHead>
                      <TableHead>{t('customers.cnic')}</TableHead>
                      <TableHead>{t('inventory.plotNo')}</TableHead>
                      <TableHead>{t('inventory.project')}</TableHead>
                      <TableHead>{t('forms.totalAmount')}</TableHead>
                      <TableHead>{t('forms.downPayment')}</TableHead>
                      <TableHead>{t('forms.paymentPlan')}</TableHead>
                      <TableHead>{t('forms.date')}</TableHead>
                      <TableHead>{t('forms.status')}</TableHead>
                      <TableHead>{t('forms.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forms.map((form: any) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">{form.agreementNumber}</TableCell>
                        <TableCell>{toTitleCase(form.customer?.name || 'N/A')}</TableCell>
                        <TableCell>{form.customer?.cnic || 'N/A'}</TableCell>
                        <TableCell>{form.plot?.plotNo || 'N/A'}</TableCell>
                        <TableCell>{formatProjectName(form.plot?.project || 'N/A')}</TableCell>
                        <TableCell>{formatCurrency(form.totalAmount)}</TableCell>
                        <TableCell>{formatCurrency(form.downPayment)}</TableCell>
                        <TableCell>{formatPaymentPlan(form.biyana?.monthlyInstallments || form.installmentMonths)}</TableCell>
                        <TableCell>{formatDate(form.agreementDate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {form.status === 'APPROVED' ? (
                              <CheckCircle 
                                className="w-4 h-4 text-green-600"
                                title={t('status.approved')}
                              />
                            ) : form.status === 'REJECTED' ? (
                              <XCircle 
                                className="w-4 h-4 text-red-600"
                                title={t('status.rejected')}
                              />
                            ) : (
                              <Clock 
                                className="w-4 h-4 text-yellow-500"
                                title={t('status.pending')}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(form)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {form.status === 'APPROVED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrintForm(form)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir={isUrdu ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle>{t('forms.saleAgreementDetails')}</DialogTitle>
              <DialogDescription>{t('forms.completeInfoAgreement')}</DialogDescription>
            </DialogHeader>
            {selectedForm && (
              <div className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('payments.agreementNumber')}</label>
                      <p className="text-base font-semibold">{selectedForm.agreementNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date</label>
                      <p className="text-base">{formatDate(selectedForm.agreementDate)}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Property Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Plot Number</label>
                        <p className="text-base">{selectedForm.plot?.plotNo || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Project</label>
                        <p className="text-base">{formatProjectName(selectedForm.plot?.project || '')}</p>
                      </div>
                      <div>

                        <label className="text-sm font-medium text-muted-foreground">Size</label>
                        <p className="text-base">{formatSize(selectedForm.plot?.size || '')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Buyer Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Buyer Name</label>
                        <p className="text-base">{selectedForm.customer?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Father's Name</label>
                        <p className="text-base">{selectedForm.customer?.fatherName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">CNIC</label>
                        <p className="text-base">{selectedForm.customer?.cnic || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="text-base">{selectedForm.customer?.phone || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">Address</label>
                        <p className="text-base">{selectedForm.customer?.address || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Payment Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('payments.totalAmount')}</label>
                        <p className="text-base font-semibold">{formatCurrency(selectedForm.totalAmount)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Down Payment</label>
                        <p className="text-base">{formatCurrency(selectedForm.downPayment)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Payment Plan</label>
                        <p className="text-base">{formatPaymentPlan(selectedForm.biyana?.monthlyInstallments || selectedForm.installmentMonths)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div className="flex items-center gap-2 mt-1">
                          {selectedForm.status === 'APPROVED' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : selectedForm.status === 'REJECTED' ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          )}
                          <span className="text-base">{formatStatus(selectedForm.status)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedForm.remarks && (
                    <div className="border-t pt-4">
                      <label className="text-sm font-medium text-muted-foreground">Remarks</label>
                      <p className="text-base">{selectedForm.remarks}</p>
                    </div>
                  )}

                  <div className="border-t pt-4 flex gap-2">
                    <Button onClick={() => handlePrintForm(selectedForm)} className="flex-1">
                      <Printer className="mr-2 h-4 w-4" />
                      Print Form
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Print Dialog */}
        {isPrintOpen && printData && (
          <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
              <DialogTitle className="sr-only">Print Sale Agreement</DialogTitle>
              <PrintableSaleAgreementForm 
                data={printData} 
                onClose={() => setIsPrintOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewSaleAgreements;
