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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formsAPI } from "@/lib/api";
import { Archive as ArchiveIcon, Loader2, Eye, Printer, Search, ArrowRightLeft } from "lucide-react";
import PrintableSaleAgreementForm from "@/pages/forms/PrintableSaleAgreementForm";
import { useTranslation } from 'react-i18next';

const Archive = () => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Helper function to format project names
  const formatProjectName = (value: string) => {
    if (value === 'SHADMAN_GREENS') {
      return t('projects.shadmanGreens');
    }
    return value;
  };

  // Helper function to format status
  const formatStatus = (status: string) => {
    const statusLower = status?.toLowerCase() || 'pending';
    return t(`status.${statusLower}`);
  };

  const { data: archivedAgreements, isLoading } = useQuery({
    queryKey: ['archivedSaleAgreements'],
    queryFn: async () => {
      const response = await formsAPI.getSaleAgreements();
      // Filter only archived agreements
      return response.data.filter((agreement: any) => agreement.isArchived === true);
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

  // Filter agreements based on search term
  const filteredAgreements = archivedAgreements?.filter((agreement: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      agreement.agreementNumber?.toLowerCase().includes(search) ||
      agreement.customer?.name?.toLowerCase().includes(search) ||
      agreement.customer?.cnic?.toLowerCase().includes(search) ||
      agreement.plot?.plotNo?.toLowerCase().includes(search)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" dir={isUrdu ? 'rtl' : 'ltr'}>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ArchiveIcon className="h-8 w-8" />
              Archived Sale Agreements
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View sale agreements that were superseded by plot transfers
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle>Archived Agreements</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by agreement, customer, or plot..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !filteredAgreements || filteredAgreements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No archived agreements match your search" : "No archived agreements found"}
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
                      <TableHead>{t('payments.totalAmount')}</TableHead>
                      <TableHead>{t('payments.downPayment')}</TableHead>
                      <TableHead>{t('payments.agreementDate')}</TableHead>
                      <TableHead>{t('inventory.status')}</TableHead>
                      <TableHead className="text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgreements.map((form: any) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">{form.agreementNumber}</TableCell>
                        <TableCell>{form.customer?.name || t('payments.notAvailable')}</TableCell>
                        <TableCell>{form.customer?.cnic || t('payments.notAvailable')}</TableCell>
                        <TableCell>{form.plot?.plotNo || t('payments.notAvailable')}</TableCell>
                        <TableCell>{formatProjectName(form.plot?.project) || t('payments.notAvailable')}</TableCell>
                        <TableCell>{formatCurrency(form.totalAmount)}</TableCell>
                        <TableCell>{formatCurrency(form.downPayment)}</TableCell>
                        <TableCell>{formatDate(form.agreementDate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              <ArchiveIcon className="mr-1 h-3 w-3" />
                              Archived
                            </Badge>
                            {form.isLocked && (
                              <Badge variant="outline" className="bg-purple-50">
                                <ArrowRightLeft className="mr-1 h-3 w-3" />
                                Transferred
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(form)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintForm(form)}
                            >
                              <Printer className="h-4 w-4 mr-1" />
                              Print
                            </Button>
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Archived Agreement Details</DialogTitle>
              <DialogDescription>
                {t('payments.agreementNumber')}: {selectedForm?.agreementNumber}
              </DialogDescription>
            </DialogHeader>

            {selectedForm && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                    <p className="font-semibold">{selectedForm.customer?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Father/Husband Name</p>
                    <p className="font-semibold">{selectedForm.customer?.fatherName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CNIC</p>
                    <p className="font-semibold">{selectedForm.customer?.cnic}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-semibold">{selectedForm.customer?.phone}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Plot Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Plot Number</p>
                      <p className="font-semibold">{selectedForm.plot?.plotNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Project</p>
                      <p className="font-semibold">{formatProjectName(selectedForm.plot?.project)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="font-semibold">{formatSize(selectedForm.plot?.size)}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Payment Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-semibold">{formatCurrency(selectedForm.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Down Payment</p>
                      <p className="font-semibold">{formatCurrency(selectedForm.downPayment)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Plan</p>
                      <p className="font-semibold">{formatPaymentPlan(selectedForm.installmentMonths)}</p>
                    </div>
                    {selectedForm.monthlyAmount && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t('payments.monthlyInstallment')}</p>
                        <p className="font-semibold">{formatCurrency(selectedForm.monthlyAmount)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Agreement Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Agreement Date</p>
                      <p className="font-semibold">{formatDate(selectedForm.agreementDate)}</p>
                    </div>
                    {selectedForm.possessionDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Possession Date</p>
                        <p className="font-semibold">{formatDate(selectedForm.possessionDate)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Created By</p>
                      <p className="font-semibold">{selectedForm.createdBy?.name}</p>
                    </div>
                    {selectedForm.approvedBy && (
                      <div>
                        <p className="text-sm text-muted-foreground">Approved By</p>
                        <p className="font-semibold">{selectedForm.approvedBy?.name}</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedForm.remarks && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground">Remarks</p>
                    <p className="font-semibold">{selectedForm.remarks}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-900 border-amber-200">
                    <ArchiveIcon className="mr-1 h-3 w-3" />
                    This agreement was archived due to plot transfer
                  </Badge>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Print Dialog */}
        {isPrintOpen && printData && (
          <PrintableSaleAgreementForm
            data={printData}
            onClose={() => {
              setIsPrintOpen(false);
              setPrintData(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Archive;
