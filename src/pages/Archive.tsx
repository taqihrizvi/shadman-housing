import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formsAPI, voucherAPI } from "@/lib/api";
import { Archive as ArchiveIcon, Loader2, Eye, Printer, Search, ArrowRightLeft, Receipt, FileText } from "lucide-react";
import PrintableSaleAgreementForm from "@/pages/forms/PrintableSaleAgreementForm";
import { useTranslation } from 'react-i18next';
import { toTitleCase } from "@/lib/utils";
import {
  formatCurrency,
  formatDate as formatDateUtil,
  formatPaymentPlan as formatPaymentPlanUtil,
  formatSize as formatSizeUtil,
  formatProjectName as formatProjectNameUtil,
  formatEnum as formatEnumUtil,
} from "@/utils/formatters";

const Archive = () => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("agreements");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgreement, setSelectedAgreement] = useState<any>(null);
  const [selectedBiyana, setSelectedBiyana] = useState<any>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [isAgreementDetailsOpen, setIsAgreementDetailsOpen] = useState(false);
  const [isBiyanaDetailsOpen, setIsBiyanaDetailsOpen] = useState(false);
  const [isVoucherDetailsOpen, setIsVoucherDetailsOpen] = useState(false);
  const [isTransferDetailsOpen, setIsTransferDetailsOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  const formatDate = (dateString: string) => formatDateUtil(dateString, 'en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatProjectName = (value: string) => formatProjectNameUtil(value, t);
  const formatPaymentPlan = (installmentMonths: number) => formatPaymentPlanUtil(installmentMonths, t);
  const formatSize = (value: string) => formatSizeUtil(value, t);
  const formatEnum = (value: string) => formatEnumUtil(value, t);

  const { data: archivedAgreements, isLoading: loadingAgreements } = useQuery({
    queryKey: ['archivedSaleAgreements'],
    queryFn: async () => {
      const response = await formsAPI.getSaleAgreements();
      return response.data.filter((agreement: any) => agreement.isArchived === true);
    },
  });

  const { data: archivedBiyana, isLoading: loadingBiyana } = useQuery({
    queryKey: ['archivedBiyanaForms'],
    queryFn: async () => {
      const response = await formsAPI.getArchivedBiyanaForms();
      return response.data;
    },
    enabled: activeTab === 'biyana',
  });

  const { data: archivedVouchersData, isLoading: loadingVouchers } = useQuery({
    queryKey: ['archivedVouchers'],
    queryFn: async () => {
      const response = await voucherAPI.getArchived();
      return response.data;
    },
    enabled: activeTab === 'vouchers',
  });

  const { data: archivedTransfersData, isLoading: loadingTransfers } = useQuery({
    queryKey: ['archivedTransferForms'],
    queryFn: async () => {
      const response = await formsAPI.getArchivedTransferForms();
      return response.data;
    },
    enabled: activeTab === 'transfers',
  });

  const archivedVouchers = archivedVouchersData ?? [];
  const archivedTransfers = archivedTransfersData ?? [];

  const filterBySearch = (items: any[], keys: string[]) => {
    if (!searchTerm) return items;
    const search = searchTerm.toLowerCase();
    return items.filter((item: any) =>
      keys.some((key) => {
        const val = key.split('.').reduce((o: any, k) => o?.[k], item);
        return String(val || '').toLowerCase().includes(search);
      })
    );
  };

  const filteredAgreements = filterBySearch(archivedAgreements || [], [
    'agreementNumber', 'customer.name', 'customer.cnic', 'plot.plotNo'
  ]);
  const filteredBiyana = filterBySearch(archivedBiyana || [], [
    'formNumber', 'customer.name', 'customer.cnic', 'plot.plotNo'
  ]);
  const filteredVouchers = filterBySearch(archivedVouchers, [
    'voucherNo', 'description', 'customer.name', 'plot.plotNo'
  ]);
  const filteredTransfers = filterBySearch(archivedTransfers, [
    'transferNumber', 'plot.plotNo', 'fromCustomer.name', 'toCustomer.name'
  ]);

  const handleViewAgreement = (form: any) => {
    setSelectedAgreement(form);
    setIsAgreementDetailsOpen(true);
  };

  const handlePrintAgreement = async (form: any) => {
    try {
      const response = await formsAPI.getSaleAgreementById(form.id);
      setPrintData(response.data);
      setIsPrintOpen(true);
    } catch (error) {
      console.error('Error fetching form details:', error);
    }
  };

  const handleViewBiyana = (form: any) => {
    setSelectedBiyana(form);
    setIsBiyanaDetailsOpen(true);
  };

  const handleViewVoucher = (v: any) => {
    setSelectedVoucher(v);
    setIsVoucherDetailsOpen(true);
  };

  const handlePrintVoucher = (id: string) => {
    navigate(`/vouchers/print/${id}`);
  };

  const handleViewTransfer = (form: any) => {
    setSelectedTransfer(form);
    setIsTransferDetailsOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" dir={isUrdu ? 'rtl' : 'ltr'}>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ArchiveIcon className="h-8 w-8" />
              Archive
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View archived sale agreements, Biyana forms, transfer forms, and vouchers (e.g. when plot moved from Reserved or Sold to Available)
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="agreements" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Sale Agreements
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {archivedAgreements?.length ?? 0}
              </span>
            </TabsTrigger>
            <TabsTrigger value="biyana" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Biyana Forms
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {activeTab === 'biyana' ? (archivedBiyana?.length ?? 0) : '...'}
              </span>
            </TabsTrigger>
            <TabsTrigger value="transfers" className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Transfer Forms
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {activeTab === 'transfers' ? archivedTransfers.length : '...'}
              </span>
            </TabsTrigger>
            <TabsTrigger value="vouchers" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Vouchers
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {activeTab === 'vouchers' ? archivedVouchers.length : '...'}
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tab: Sale Agreements */}
          <TabsContent value="agreements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Archived Sale Agreements</CardTitle>
                <CardDescription>Agreements superseded by plot transfers or status changes</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAgreements ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !filteredAgreements?.length ? (
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
                            <TableCell>{toTitleCase(form.customer?.name || t('payments.notAvailable'))}</TableCell>
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
                                <Button variant="outline" size="sm" onClick={() => handleViewAgreement(form)}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handlePrintAgreement(form)}>
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
          </TabsContent>

          {/* Tab: Biyana Forms */}
          <TabsContent value="biyana" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Archived Biyana Forms</CardTitle>
                <CardDescription>Biyana forms archived when plot status changed from Reserved to Available</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBiyana ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !filteredBiyana?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No archived Biyana forms match your search" : "No archived Biyana forms found"}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Form No</TableHead>
                          <TableHead>{t('forms.customerName')}</TableHead>
                          <TableHead>{t('customers.cnic')}</TableHead>
                          <TableHead>{t('inventory.plotNo')}</TableHead>
                          <TableHead>{t('inventory.project')}</TableHead>
                          <TableHead>Token Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">{t('common.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBiyana.map((form: any) => (
                          <TableRow key={form.id}>
                            <TableCell className="font-medium">{form.formNumber}</TableCell>
                            <TableCell>{toTitleCase(form.customer?.name || '-')}</TableCell>
                            <TableCell>{form.customer?.cnic || '-'}</TableCell>
                            <TableCell>{form.plot?.plotNo || '-'}</TableCell>
                            <TableCell>{formatProjectName(form.plot?.project) || '-'}</TableCell>
                            <TableCell>{formatCurrency(form.tokenAmount)}</TableCell>
                            <TableCell>{formatDate(form.date)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                <ArchiveIcon className="mr-1 h-3 w-3" />
                                Archived
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => handleViewBiyana(form)}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Transfer Forms */}
          <TabsContent value="transfers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Archived Transfer Forms</CardTitle>
                <CardDescription>Transfer forms archived when plot status changed from Sold to Available</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTransfers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !filteredTransfers?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No archived transfer forms match your search" : "No archived transfer forms found"}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transfer No</TableHead>
                          <TableHead>{t('inventory.plotNo')}</TableHead>
                          <TableHead>From (Seller)</TableHead>
                          <TableHead>To (Buyer)</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Fee</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">{t('common.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransfers.map((form: any) => (
                          <TableRow key={form.id}>
                            <TableCell className="font-medium">{form.transferNumber}</TableCell>
                            <TableCell>{form.plot?.plotNo || '-'}</TableCell>
                            <TableCell>{toTitleCase(form.fromCustomer?.name || '-')}</TableCell>
                            <TableCell>{toTitleCase(form.toCustomer?.name || '-')}</TableCell>
                            <TableCell>{formatCurrency(form.transferAmount)}</TableCell>
                            <TableCell>{formatCurrency(form.transferFee || 0)}</TableCell>
                            <TableCell>{formatDate(form.transferDate)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                <ArchiveIcon className="mr-1 h-3 w-3" />
                                Archived
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => handleViewTransfer(form)}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Vouchers */}
          <TabsContent value="vouchers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Archived Vouchers</CardTitle>
                <CardDescription>Payment vouchers archived when plot status changed from Reserved or Sold to Available</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingVouchers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !filteredVouchers?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No archived vouchers match your search" : "No archived vouchers found"}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Voucher No</TableHead>
                          <TableHead>{t('forms.customerName')}</TableHead>
                          <TableHead>{t('inventory.plotNo')}</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">{t('common.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVouchers.map((v: any) => (
                          <TableRow key={v.id}>
                            <TableCell className="font-medium">{v.voucherNo}</TableCell>
                            <TableCell>{toTitleCase(v.customer?.name || '-')}</TableCell>
                            <TableCell>{v.plot?.plotNo || '-'}</TableCell>
                            <TableCell>{formatCurrency(v.amount)}</TableCell>
                            <TableCell>{formatEnum(v.formType || '')}</TableCell>
                            <TableCell>{formatDate(v.date)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                <ArchiveIcon className="mr-1 h-3 w-3" />
                                Archived
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleViewVoucher(v)}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handlePrintVoucher(v.id)}>
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
          </TabsContent>
        </Tabs>

        {/* Agreement Details Dialog */}
        <Dialog open={isAgreementDetailsOpen} onOpenChange={setIsAgreementDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Archived Agreement Details</DialogTitle>
              <DialogDescription>
                {t('payments.agreementNumber')}: {selectedAgreement?.agreementNumber}
              </DialogDescription>
            </DialogHeader>
            {selectedAgreement && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                    <p className="font-semibold">{selectedAgreement.customer?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Father/Husband Name</p>
                    <p className="font-semibold">{selectedAgreement.customer?.fatherName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CNIC</p>
                    <p className="font-semibold">{selectedAgreement.customer?.cnic}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-semibold">{selectedAgreement.customer?.phone}</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Plot Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Plot Number</p>
                      <p className="font-semibold">{selectedAgreement.plot?.plotNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Project</p>
                      <p className="font-semibold">{formatProjectName(selectedAgreement.plot?.project)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="font-semibold">{formatSize(selectedAgreement.plot?.size)}</p>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Payment Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-semibold">{formatCurrency(selectedAgreement.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Down Payment</p>
                      <p className="font-semibold">{formatCurrency(selectedAgreement.downPayment)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Plan</p>
                      <p className="font-semibold">{formatPaymentPlan(selectedAgreement.installmentMonths)}</p>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-900 border-amber-200">
                    <ArchiveIcon className="mr-1 h-3 w-3" />
                    This agreement was archived (e.g. plot transfer or status change)
                  </Badge>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Biyana Details Dialog */}
        <Dialog open={isBiyanaDetailsOpen} onOpenChange={setIsBiyanaDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Archived Biyana Form Details</DialogTitle>
              <DialogDescription>Form No: {selectedBiyana?.formNumber}</DialogDescription>
            </DialogHeader>
            {selectedBiyana && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                    <p className="font-semibold">{selectedBiyana.customer?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Father/Husband Name</p>
                    <p className="font-semibold">{selectedBiyana.customer?.fatherName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CNIC</p>
                    <p className="font-semibold">{selectedBiyana.customer?.cnic}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-semibold">{selectedBiyana.customer?.phone}</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Plot Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Plot Number</p>
                      <p className="font-semibold">{selectedBiyana.plot?.plotNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Project</p>
                      <p className="font-semibold">{formatProjectName(selectedBiyana.plot?.project)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="font-semibold">{formatSize(selectedBiyana.plot?.size)}</p>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Payment Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Token Amount</p>
                      <p className="font-semibold">{formatCurrency(selectedBiyana.tokenAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-semibold">{formatDate(selectedBiyana.date)}</p>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-900 border-amber-200">
                    <ArchiveIcon className="mr-1 h-3 w-3" />
                    This Biyana form was archived when plot status changed to Available
                  </Badge>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Voucher Details Dialog */}
        <Dialog open={isVoucherDetailsOpen} onOpenChange={setIsVoucherDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Archived Voucher Details</DialogTitle>
              <DialogDescription>Voucher No: {selectedVoucher?.voucherNo}</DialogDescription>
            </DialogHeader>
            {selectedVoucher && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-semibold">{selectedVoucher.customer?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plot</p>
                    <p className="font-semibold">{selectedVoucher.plot?.plotNo} - {formatProjectName(selectedVoucher.plot?.project)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-semibold">{formatCurrency(selectedVoucher.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-semibold">{formatEnum(selectedVoucher.formType || '')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold">{formatDate(selectedVoucher.date)}</p>
                  </div>
                  {selectedVoucher.description && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="font-semibold">{selectedVoucher.description}</p>
                    </div>
                  )}
                </div>
                <div className="border-t pt-4">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-900 border-amber-200">
                    <ArchiveIcon className="mr-1 h-3 w-3" />
                    This voucher was archived when plot status changed to Available
                  </Badge>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Transfer Details Dialog */}
        <Dialog open={isTransferDetailsOpen} onOpenChange={setIsTransferDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Archived Transfer Form Details</DialogTitle>
              <DialogDescription>Transfer No: {selectedTransfer?.transferNumber}</DialogDescription>
            </DialogHeader>
            {selectedTransfer && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Plot</h4>
                  <p className="font-semibold">{selectedTransfer.plot?.plotNo} - {formatProjectName(selectedTransfer.plot?.project)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">From (Seller)</p>
                    <p className="font-semibold">{toTitleCase(selectedTransfer.fromCustomer?.name || '-')}</p>
                    <p className="text-xs text-muted-foreground">{selectedTransfer.fromCustomer?.cnic}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">To (Buyer)</p>
                    <p className="font-semibold">{toTitleCase(selectedTransfer.toCustomer?.name || '-')}</p>
                    <p className="text-xs text-muted-foreground">{selectedTransfer.toCustomer?.cnic}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Transfer Amount</p>
                    <p className="font-semibold">{formatCurrency(selectedTransfer.transferAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transfer Fee</p>
                    <p className="font-semibold">{formatCurrency(selectedTransfer.transferFee || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold">{formatDate(selectedTransfer.transferDate)}</p>
                  </div>
                  {selectedTransfer.reason && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Reason</p>
                      <p className="font-semibold">{selectedTransfer.reason}</p>
                    </div>
                  )}
                </div>
                <div className="border-t pt-4">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-900 border-amber-200">
                    <ArchiveIcon className="mr-1 h-3 w-3" />
                    This transfer form was archived when plot status changed to Available
                  </Badge>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

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
