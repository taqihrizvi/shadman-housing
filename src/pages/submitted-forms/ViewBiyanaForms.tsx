import { useState, useMemo } from "react";
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
import { toTitleCase } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formsAPI } from "@/lib/api";
import { FileText, Loader2, Eye, Printer, CheckCircle, XCircle, Clock } from "lucide-react";
import PrintableBiyanaFormSimple from "@/pages/forms/PrintableBiyanaFormSimple";
import { getUserData, isManager } from "@/lib/rbac";
import { useTranslation } from 'react-i18next';

const ViewBiyanaForms = () => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const userData = getUserData();
  const isManagerUser = isManager();

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
    queryKey: ['biyanaForms'],
    queryFn: async () => {
      const response = await formsAPI.getBiyanaForms();
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
  });

  // Filter forms based on user role
  const filteredForms = useMemo(() => {
    if (!forms) return [];
    
    // If manager, only show forms they created
    if (isManagerUser && userData) {
      return forms.filter((form: any) => form.createdById === userData.id);
    }
    
    // Admin sees all forms
    return forms;
  }, [forms, isManagerUser, userData]);

  const formatCurrency = (value: number) => {
    if (!value || isNaN(value)) return "Rs 0";
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

  const formatEnum = (value: string) => {
    if (!value) return "";
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatPaymentMethod = (method: string) => {
    if (!method) return "";
    return t(`payments.paymentMethods.${method}`) || formatEnum(method);
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

  const handlePrintForm = (form: any) => {
    const data = {
      customerName: form.customer?.name || "",
      fatherHusbandName: form.fatherHusbandName || form.customer?.fatherName || "",
      cnic: form.customer?.cnic || "",
      phone: form.customer?.phone || "",
      plot: {
        plotNo: form.plot?.plotNo || "",
        project: form.plot?.project || "",
        size: formatSize(form.plot?.size || ""),
        block: form.plot?.block || "",
        price: form.plot?.price || 0,
      },
      pricePerMarla: form.pricePerMarla,
      totalAmount: form.totalAmount,
      tokenAmount: form.tokenAmount || 0,
      totalRemaining: form.totalRemaining,
      firstInstallmentRemaining: form.firstInstallmentRemaining,
      lastInstallmentDate: form.lastInstallmentDate,
      monthlyInstallments: form.monthlyInstallments,
      quarterlyInstallments: form.quarterlyInstallments,
      agreementDuration: form.agreementDuration,
      monthlyInstallmentAmount: form.monthlyInstallmentAmount,
      quarterlyInstallmentAmount: form.quarterlyInstallmentAmount,
      date: form.date || new Date().toISOString(),
      agreementNumber: form.id,
      status: form.status,
      approvedBy: form.approvedBy,
    };
    setPrintData(data);
    setIsPrintOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" dir={isUrdu ? 'rtl' : 'ltr'}>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-8 w-8" />
              {t('forms.biyanaForm')}
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
            ) : !filteredForms || filteredForms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('forms.noBiyanaForms')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('forms.formNo')}</TableHead>
                      <TableHead>{t('forms.customerName')}</TableHead>
                      <TableHead>{t('customers.cnic')}</TableHead>
                      <TableHead>{t('inventory.plotNo')}</TableHead>
                      <TableHead>{t('inventory.project')}</TableHead>
                      <TableHead>{t('forms.amount')}</TableHead>
                      <TableHead>{t('forms.date')}</TableHead>
                      <TableHead>{t('forms.status')}</TableHead>
                      <TableHead>{t('forms.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredForms.map((form: any) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">{form.formNumber}</TableCell>
                        <TableCell>{toTitleCase(form.customer?.name || 'N/A')}</TableCell>
                        <TableCell>{form.customer?.cnic || 'N/A'}</TableCell>
                        <TableCell>{form.plot?.plotNo || 'N/A'}</TableCell>
                        <TableCell>{formatProjectName(form.plot?.project || 'N/A')}</TableCell>
                        <TableCell>{formatCurrency(form.tokenAmount)}</TableCell>
                        <TableCell>{formatDate(form.date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {form.status === 'APPROVED' ? (
                              <CheckCircle 
                                className="w-4 h-4 text-green-600"
                                title={formatStatus(form.status)}
                              />
                            ) : form.status === 'REJECTED' ? (
                              <XCircle 
                                className="w-4 h-4 text-red-600"
                                title={formatStatus(form.status)}
                              />
                            ) : (
                              <Clock 
                                className="w-4 h-4 text-yellow-500"
                                title={formatStatus(form.status)}
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
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {form.status === 'APPROVED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrintForm(form)}
                                title="Print Form"
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
              <DialogTitle>{t('forms.biyanaFormDetails')}</DialogTitle>
              <DialogDescription>{t('forms.completeInfo')}</DialogDescription>
            </DialogHeader>
            {selectedForm && (
              <div className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('forms.formNumber')}</label>
                      <p className="text-base font-semibold">{selectedForm.formNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('forms.date')}</label>
                      <p className="text-base">{formatDate(selectedForm.date)}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">{t('forms.propertyInfo')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('inventory.plotNo')}</label>
                        <p className="text-base">{selectedForm.plot?.plotNo || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('inventory.project')}</label>
                        <p className="text-base">{formatEnum(selectedForm.plot?.project || '')}</p>
                      </div>
                      <div>

                        <label className="text-sm font-medium text-muted-foreground">{t('inventory.size')}</label>
                        <p className="text-base">{formatSize(selectedForm.plot?.size || '')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">{t('forms.customerInfo')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('forms.customerName')}</label>
                        <p className="text-base">{toTitleCase(selectedForm.customer?.name || 'N/A')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('forms.fatherName')}</label>
                        <p className="text-base">{selectedForm.customer?.fatherName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('customers.cnic')}</label>
                        <p className="text-base">{selectedForm.customer?.cnic || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('customers.phone')}</label>
                        <p className="text-base">{selectedForm.customer?.phone || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">{t('forms.address')}</label>
                        <p className="text-base">{selectedForm.customer?.address || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">{t('forms.paymentInfo')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('forms.biyanaAmount')}</label>
                        <p className="text-base font-semibold text-green-600">{formatCurrency(selectedForm.tokenAmount)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('forms.paymentMethod')}</label>
                        <p className="text-base">{formatPaymentMethod(selectedForm.paymentMethod || '')}</p>
                      </div>
                    </div>
                  </div>

                  {selectedForm.remarks && (
                    <div className="border-t pt-4">
                      <label className="text-sm font-medium text-muted-foreground">{t('forms.remarks')}</label>
                      <p className="text-base">{selectedForm.remarks}</p>
                    </div>
                  )}

                  <div className="border-t pt-4 flex gap-2">
                    <Button onClick={() => handlePrintForm(selectedForm)} className="flex-1">
                      <Printer className="mr-2 h-4 w-4" />
                      {t('forms.printForm')}
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
              <DialogTitle className="sr-only">Print Biyana Form</DialogTitle>
              <PrintableBiyanaFormSimple 
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

export default ViewBiyanaForms;
