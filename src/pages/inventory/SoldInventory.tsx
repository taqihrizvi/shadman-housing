import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, Download, Eye, FileText, Receipt, DollarSign, ChevronDown, ChevronUp, Printer, ArrowRightLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { inventoryAPI, formsAPI, voucherAPI } from "@/lib/api";
import PrintableBiyanaFormSimple from "@/pages/forms/PrintableBiyanaFormSimple";
import PrintableSaleAgreementForm from "@/pages/forms/PrintableSaleAgreementForm";
import PrintableTransferForm from "@/pages/forms/PrintableTransferForm";
import { useTranslation } from "react-i18next";
import { toTitleCase } from "@/lib/utils";
import { 
  formatCurrency, 
  formatDate, 
  formatEnum, 
  formatPaymentMethod, 
  formatSize, 
  formatPlotType 
} from "@/utils/formatters";

const statusOptions = ["All Status", "SOLD", "TRANSFERRED"];
const sizeOptions = ["All Sizes", "FIVE_MARLA", "SEVEN_MARLA", "TEN_MARLA", "ONE_KANAL", "TWO_KANAL"];

export default function SoldInventory() {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  
  // Local wrappers for formatters that need translation context
  const formatSizeLocal = (value: string) => formatSize(value, t);
  const formatPaymentMethodLocal = (method: string) => formatPaymentMethod(method, t);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedSize, setSelectedSize] = useState("All Sizes");
  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showBiyanaDetails, setShowBiyanaDetails] = useState(true);
  const [showSaleAgreementDetails, setShowSaleAgreementDetails] = useState(true);
  const [showPaymentDetails, setShowPaymentDetails] = useState(true);
  const [showTransferDetails, setShowTransferDetails] = useState(true);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const [formType, setFormType] = useState<'biyana' | 'saleAgreement' | 'transfer'>('biyana');

  // Fetch sold inventory from API
  // Fetch sold and transferred inventory from API
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['soldInventory', searchTerm],
    queryFn: async () => {
      // Fetch both SOLD and TRANSFERRED plots
      const soldParams: any = { status: 'SOLD' };
      const transferredParams: any = { status: 'TRANSFERRED' };
      
      if (searchTerm) {
        soldParams.search = searchTerm;
        transferredParams.search = searchTerm;
      }
      
      const [soldResponse, transferredResponse] = await Promise.all([
        inventoryAPI.getAll(soldParams),
        inventoryAPI.getAll(transferredParams)
      ]);
      
      // Combine both results
      return [...soldResponse.data, ...transferredResponse.data];
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Fetch Biyana forms
  const { data: biyanaData } = useQuery({
    queryKey: ['biyanaForms'],
    queryFn: async () => {
      const response = await formsAPI.getBiyanaForms();
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch Sale Agreements
  const { data: saleAgreementsData } = useQuery({
    queryKey: ['saleAgreements'],
    queryFn: async () => {
      const response = await formsAPI.getSaleAgreements();
      // Filter out archived agreements
      return response.data.filter((agreement: any) => !agreement.isArchived);
    },
  });

  // Fetch Vouchers
  const { data: vouchersData } = useQuery({
    queryKey: ['vouchers'],
    queryFn: async () => {
      const response = await voucherAPI.getAll({ type: 'RECEIPT' });
      return response.data;
    },
  });

  // Fetch Transfer Forms
  const { data: transfersData } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      const response = await formsAPI.getTransferForms();
      return response.data;
    },
  });

  const handleViewDetails = (plot: any) => {
    setSelectedPlot(plot);
    setIsDetailOpen(true);
  };

  const getPlotBiyana = (plotId: string) => {
    return biyanaData?.find((b: any) => b.plotId === plotId);
  };

  const getPlotSaleAgreement = (plotId: string, customerId: string) => {
    return saleAgreementsData?.find((s: any) => s.plotId === plotId && s.customerId === customerId);
  };

  const getPlotPayments = (plotId: string, customerId: string) => {
    return vouchersData?.filter((v: any) => v.plotId === plotId && v.customerId === customerId) || [];
  };

  const getPlotTransfer = (plotId: string) => {
    // Get the most recent transfer for this plot (any status)
    return transfersData?.filter((t: any) => t.plotId === plotId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  };

  // Get plot status (SOLD or TRANSFERRED)
  const getPlotStatus = (plot: any) => {
    if (plot.status === 'TRANSFERRED') {
      return 'TRANSFERRED';
    }
    
    // Check if this is a recently transferred plot that's now SOLD
    const transfer = getPlotTransfer(plot.id);
    if (transfer && transfer.status === 'COMPLETED') {
      return 'SOLD (Transferred)';
    }
    
    return 'SOLD';
  };

  const handlePrintBiyanaForm = (plot: any) => {
    const biyana = getPlotBiyana(plot.id);
    if (!biyana) {
      alert("No Biyana form found for this plot");
      return;
    }
    
    const data = {
      customerName: plot.buyer?.name || "",
      fatherHusbandName: biyana.fatherHusbandName || plot.buyer?.fatherName || "",
      cnic: plot.buyer?.cnic || "",
      phone: plot.buyer?.phone || "",
      plot: {
        plotNo: plot.plotNo || "",
        project: plot.project || "",
        size: formatSizeLocal(plot.size || ""),
        block: plot.block || "",
        price: plot.price || 0,
        isCornerPlot: plot.isCornerPlot || false,
      },
      pricePerMarla: biyana.pricePerMarla,
      totalAmount: biyana.totalAmount,
      biyanaAmount: biyana.biyanaAmount || 0,
      totalRemaining: biyana.totalRemaining,
      firstInstallmentRemaining: biyana.firstInstallmentRemaining,
      lastInstallmentDate: biyana.lastInstallmentDate,
      monthlyInstallments: biyana.monthlyInstallments,
      quarterlyInstallments: biyana.quarterlyInstallments,
      agreementDuration: biyana.agreementDuration,
      monthlyInstallmentAmount: biyana.monthlyInstallmentAmount,
      quarterlyInstallmentAmount: biyana.quarterlyInstallmentAmount,
      date: biyana.date || new Date().toISOString(),
      agreementNumber: biyana.id,
      status: biyana.status,
      approvedBy: biyana.approvedBy,
    };
    setPrintData(data);
    setFormType('biyana');
    setIsPrintOpen(true);
  };

  const handleViewSaleAgreement = (plot: any) => {
    const saleAgreement = getPlotSaleAgreement(plot.id, plot.buyerId);
    if (!saleAgreement) {
      alert("No Sale Agreement found for this plot");
      return;
    }
    
    const biyana = getPlotBiyana(plot.id);
    const data = {
      customer: {
        name: plot.buyer?.name || "",
        fatherName: saleAgreement.customer?.fatherName || plot.buyer?.fatherName || "",
        cnic: plot.buyer?.cnic || "",
        phone: plot.buyer?.phone || "",
        address: plot.buyer?.address || "",
      },
      plot: {
        plotNo: plot.plotNo || "",
        project: plot.project || "",
        size: formatSizeLocal(plot.size || ""),
        block: plot.block || "",
        price: plot.price || 0,
      },
      totalAmount: saleAgreement.totalAmount,
      downPayment: saleAgreement.downPayment,
      installmentMonths: saleAgreement.installmentMonths,
      monthlyAmount: saleAgreement.monthlyAmount,
      agreementDate: saleAgreement.agreementDate,
      possessionDate: saleAgreement.possessionDate,
      agreementNumber: saleAgreement.agreementNumber,
      status: saleAgreement.status,
      createdBy: saleAgreement.createdBy,
      witnesses: saleAgreement.witnesses,
      terms: saleAgreement.terms,
      biyana: biyana ? {
        totalAmount: biyana.totalAmount,
        pricePerMarla: biyana.pricePerMarla,
        totalRemaining: biyana.totalRemaining,
        monthlyInstallments: biyana.monthlyInstallments,
        quarterlyInstallments: biyana.quarterlyInstallments,
        monthlyInstallmentAmount: biyana.monthlyInstallmentAmount,
        quarterlyInstallmentAmount: biyana.quarterlyInstallmentAmount,
        agreementDuration: biyana.agreementDuration,
        lastInstallmentDate: biyana.lastInstallmentDate,
      } : undefined,
    };
    setPrintData(data);
    setFormType('saleAgreement');
    setIsPrintOpen(true);
  };

  const handleViewTransfer = (plot: any) => {
    const transfer = getPlotTransfer(plot.id);
    if (!transfer) {
      alert("No Transfer form found for this plot");
      return;
    }
    
    const data = {
      transferNumber: transfer.transferNumber,
      transferDate: transfer.transferDate,
      transferType: transfer.transferType || 'GENERAL',
      fromCustomer: transfer.fromCustomer,
      toCustomer: transfer.toCustomer,
      plot: {
        plotNo: plot.plotNo || "",
        project: plot.project || "",
        size: plot.size || "",
        block: plot.block || "",
        price: plot.price || 0,
      },
      transferAmount: transfer.transferAmount,
      transferFee: transfer.transferFee || 0,
      remarks: transfer.remarks,
      status: transfer.status,
      approvedBy: transfer.approvedBy,
      approvedAt: transfer.approvedAt,
      completedAt: transfer.completedAt,
    };
    setPrintData(data);
    setFormType('transfer');
    setIsPrintOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" dir={isUrdu ? 'rtl' : 'ltr'}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('inventory.soldInventory')}</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="relative md:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by plot or buyer..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === "All Status" ? "All Status" : status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Size" />
                </SelectTrigger>
                <SelectContent>
                  {sizeOptions.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size === "All Sizes" ? "All Sizes" : formatSizeLocal(size)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card variant="elevated">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : !inventoryData || inventoryData.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <p className="text-muted-foreground">No sold inventory found</p>
              </div>
            ) : (() => {
              // Apply client-side filters
              const filteredData = inventoryData.filter((item: any) => {
                const matchesStatus = selectedStatus === "All Status" || item.status === selectedStatus;
                const matchesSize = selectedSize === "All Sizes" || item.size === selectedSize;
                return matchesStatus && matchesSize;
              });

              if (filteredData.length === 0) {
                return (
                  <div className="flex justify-center items-center py-12">
                    <p className="text-muted-foreground">No inventory matches the selected filters</p>
                  </div>
                );
              }

              return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('inventory.plotNo')}</TableHead>
                    <TableHead>{t('inventory.project')}</TableHead>
                    <TableHead>{t('inventory.size')}</TableHead>
                    <TableHead>Plot Type</TableHead>
                    <TableHead>{t('customers.buyer')}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>{t('inventory.soldDate')}</TableHead>
                    <TableHead>{t('inventory.price')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item: any) => {
                    const plotStatus = getPlotStatus(item);
                    const isTransferred = item.status === 'TRANSFERRED';
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.plotNo}</TableCell>
                        <TableCell>{formatEnum(item.project)}</TableCell>
                        <TableCell>{formatSizeLocal(item.size)}</TableCell>
                        <TableCell>
                          <Badge variant={item.isCornerPlot ? "secondary" : "outline"}>
                            {formatPlotType(item.isCornerPlot)}
                          </Badge>
                        </TableCell>
                        <TableCell>{toTitleCase(item.buyer?.name || "N/A")}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={isTransferred ? "secondary" : "default"}
                            className={isTransferred ? "bg-purple-100 text-purple-800" : ""}
                          >
                            {plotStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(item.soldDate)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(item.price)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleViewDetails(item);
                            }}
                            title="View Details"
                            className="cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              );
            })()}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('inventory.details')} - {selectedPlot?.plotNo}</DialogTitle>
              <DialogDescription>
                {t('inventory.transactionHistory')}
              </DialogDescription>
            </DialogHeader>

            {selectedPlot && (
              <div className="space-y-6">
                {/* Plot Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Plot Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Plot Number</p>
                      <p className="font-semibold">{selectedPlot.plotNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Project</p>
                      <p className="font-semibold">{formatEnum(selectedPlot.project)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="font-semibold">{formatSizeLocal(selectedPlot.size)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Plot Type</p>
                      <p className="font-semibold">
                        <Badge variant={selectedPlot.isCornerPlot ? "secondary" : "outline"}>
                          {formatPlotType(selectedPlot.isCornerPlot)}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-semibold">{formatCurrency(selectedPlot.price)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Buyer</p>
                      <p className="font-semibold">{toTitleCase(selectedPlot.buyer?.name || "N/A")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Agent</p>
                      <p className="font-semibold">{selectedPlot.agent?.name || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Transfer Details (if plot has been transferred) */}
                {(() => {
                  const transfer = getPlotTransfer(selectedPlot.id);
                  const isTransferred = selectedPlot.status === 'TRANSFERRED';
                  
                  return transfer ? (
                    <>
                      <div>
                        <div 
                          className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-lg -m-2 mb-3"
                          onClick={() => setShowTransferDetails(!showTransferDetails)}
                        >
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <ArrowRightLeft className="h-5 w-5 text-purple-600" />
                            Plot Transfer
                            <Badge variant={isTransferred ? "secondary" : "default"} 
                              className={isTransferred ? "bg-purple-100 text-purple-800" : ""}>
                              {isTransferred ? "TRANSFERRED" : "COMPLETED"}
                            </Badge>
                          </h3>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTransfer(selectedPlot);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {showTransferDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </div>
                        </div>
                        {showTransferDetails && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 p-4 border border-purple-200 rounded-lg bg-purple-50/50">
                              <div>
                                <p className="text-sm text-muted-foreground">Transfer Number</p>
                                <p className="font-semibold">{transfer.transferNumber}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Transfer Date</p>
                                <p className="font-semibold">{formatDate(transfer.transferDate)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">From (Previous Owner)</p>
                                <p className="font-semibold">{toTitleCase(transfer.fromCustomer?.name || "N/A")}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">To</p>
                                <p className="font-semibold text-green-600">{toTitleCase(transfer.toCustomer?.name || "N/A")}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Transfer Amount</p>
                                <p className="font-semibold text-blue-600">{formatCurrency(transfer.transferAmount)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Transfer Fee</p>
                                <p className="font-semibold">{formatCurrency(transfer.transferFee || 0)}</p>
                              </div>
                              {transfer.reason && (
                                <div className="col-span-2">
                                  <p className="text-sm text-muted-foreground">Reason</p>
                                  <p className="text-sm">{transfer.reason}</p>
                                </div>
                              )}
                              <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">Status</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={transfer.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                    {transfer.status}
                                  </Badge>
                                  {transfer.approvedAt && (
                                    <p className="text-xs text-muted-foreground">
                                      Approved on {formatDate(transfer.approvedAt)}
                                    </p>
                                  )}
                                  {transfer.completedAt && (
                                    <p className="text-xs text-muted-foreground">
                                      • Completed on {formatDate(transfer.completedAt)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {isTransferred ? (
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-800">
                                  <strong>⚠️ Transfer In Progress:</strong> This plot has been transferred to {transfer.toCustomer?.name}. 
                                  A new sale agreement must be created and approved for the new owner to complete the transfer and change status to SOLD.
                                </p>
                              </div>
                            ) : (
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800">
                                  <strong>✓ Transfer Completed:</strong> This plot was transferred from {transfer.fromCustomer?.name} to {transfer.toCustomer?.name}. 
                                  {t('payments.saleAgreementDetails')}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <Separator />
                    </>
                  ) : null;
                })()}

                {/* Biyana Form */}
                {(() => {
                  const biyana = getPlotBiyana(selectedPlot.id);
                  return (
                    <div>
                      <div 
                        className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-lg -m-2 mb-3"
                        onClick={() => setShowBiyanaDetails(!showBiyanaDetails)}
                      >
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          Biyana Form
                          {biyana && <Badge variant={biyana.status === 'APPROVED' ? 'default' : 'secondary'}>{biyana.status}</Badge>}
                        </h3>
                        <div className="flex items-center gap-2">
                          {biyana && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintBiyanaForm(selectedPlot);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          )}
                          {showBiyanaDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                      </div>
                      {showBiyanaDetails && (
                        biyana ? (
                          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground">Customer</p>
                              <p className="font-semibold">{toTitleCase(biyana.customer?.name || "N/A")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">{t('payments.amount')}</p>
                              <p className="font-semibold text-green-600">{formatCurrency(biyana.biyanaAmount)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Date</p>
                              <p className="font-semibold">{formatDate(biyana.date)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">{t('payments.paymentMethod')}</p>
                              <p className="font-semibold">{formatPaymentMethod(biyana.paymentMethod)}</p>
                            </div>
                          {biyana.remarks && (
                            <div className="col-span-2">
                              <p className="text-sm text-muted-foreground">Remarks</p>
                              <p className="text-sm">{biyana.remarks}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground p-4 border rounded-lg">No Biyana form found</p>
                      ))}
                    </div>
                  );
                })()}

                <Separator />

                {/* Sale Agreement */}
                {(() => {
                  const saleAgreement = getPlotSaleAgreement(selectedPlot.id, selectedPlot.buyerId);
                  const biyana = getPlotBiyana(selectedPlot.id);
                  const payments = getPlotPayments(selectedPlot.id, selectedPlot.buyerId);
                  const paymentsTotal = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
                  const biyanaAmount = biyana?.biyanaAmount || 0;
                  const downPayment = saleAgreement?.downPayment || 0;
                  // Total Paid should only show installment payments (not biyana or down payment)
                  const calculatedTotalPaid = paymentsTotal;
                  // Pending calculation should subtract all payments (biyana + down payment + installments)
                  const totalReceived = downPayment + biyanaAmount + paymentsTotal;
                  const calculatedPending = saleAgreement?.totalAmount ? saleAgreement.totalAmount - totalReceived : 0;
                  
                  return (
                    <div>
                      <div 
                        className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-lg -m-2 mb-3"
                        onClick={() => setShowSaleAgreementDetails(!showSaleAgreementDetails)}
                      >
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <FileText className="h-5 w-5 text-purple-600" />
                          Sale Agreement
                          {saleAgreement && <Badge variant={saleAgreement.status === 'APPROVED' ? 'default' : 'secondary'}>{saleAgreement.status}</Badge>}
                        </h3>
                        <div className="flex items-center gap-2">
                          {saleAgreement && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewSaleAgreement(selectedPlot);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          )}
                          {showSaleAgreementDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                      </div>
                      {showSaleAgreementDetails && (
                        saleAgreement ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground">{t('payments.agreementNumber')}</p>
                              <p className="font-semibold">{saleAgreement.agreementNumber}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Customer</p>
                              <p className="font-semibold">{toTitleCase(saleAgreement.customer?.name || "N/A")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Amount</p>
                              <p className="font-semibold text-blue-600">{formatCurrency(saleAgreement.totalAmount)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Down Payment</p>
                              <p className="font-semibold text-green-600">{formatCurrency(saleAgreement.downPayment)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Paid (Installments)</p>
                              <p className="font-semibold text-green-600">
                                {formatCurrency(calculatedTotalPaid)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Pending Amount</p>
                              <p className="font-semibold text-orange-600">
                                {formatCurrency(calculatedPending)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Date</p>
                              <p className="font-semibold">{saleAgreement.agreementDate ? formatDate(saleAgreement.agreementDate) : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Payment Plan</p>
                              <p className="font-semibold">{saleAgreement.installmentMonths !== null ? 
                                (saleAgreement.installmentMonths === 0 ? t('payments.fullPayment') : 
                                 `${saleAgreement.installmentMonths} Months Installment`) 
                                : 'N/A'}</p>
                            </div>
                            {saleAgreement.remarks && (
                              <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">Remarks</p>
                                <p className="text-sm">{saleAgreement.remarks}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground p-4 border rounded-lg">No Sale Agreement found</p>
                      ))}
                    </div>
                  );
                })()}

                <Separator />

                {/* Payment History */}
                {(() => {
                  const payments = getPlotPayments(selectedPlot.id, selectedPlot.buyerId);
                  const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
                  return (
                    <div>
                      <div 
                        className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-lg -m-2 mb-3"
                        onClick={() => setShowPaymentDetails(!showPaymentDetails)}
                      >
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          {t('payments.paymentHistory')}
                          <Badge variant="outline">{payments.length} payments</Badge>
                        </h3>
                        {showPaymentDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                      {showPaymentDetails && (
                        payments.length > 0 ? (
                          <div className="space-y-3">
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700">{t('payments.totalPaidInstallments')}</p>
                            <p className="text-2xl font-bold text-green-700">{formatCurrency(totalPaid)}</p>
                          </div>
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{t('vouchers.voucherNo')}</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>{t('payments.amount')}</TableHead>
                                  <TableHead>Method</TableHead>
                                  <TableHead>Description</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {payments.map((payment: any) => (
                                  <TableRow key={payment.id}>
                                    <TableCell className="font-medium">{payment.voucherNo}</TableCell>
                                    <TableCell>{formatDate(payment.date)}</TableCell>
                                    <TableCell className="font-semibold text-green-600">
                                      {formatCurrency(payment.amount)}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{formatPaymentMethod(payment.paymentMethod)}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {payment.description || "N/A"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground p-4 border rounded-lg">{t('payments.noPaymentsRecorded')}</p>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Print Dialog */}
        {isPrintOpen && printData && (
          <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-y-auto">
              <DialogTitle className="sr-only">
                {formType === 'biyana' ? 'Print Biyana Form' : 
                 formType === 'saleAgreement' ? 'Print Sale Agreement' : 
                 'Print Transfer Form'}
              </DialogTitle>
              {formType === 'biyana' && (
                <PrintableBiyanaFormSimple 
                  data={printData} 
                  onClose={() => setIsPrintOpen(false)}
                />
              )}
              {formType === 'saleAgreement' && (
                <PrintableSaleAgreementForm 
                  data={printData} 
                  onClose={() => setIsPrintOpen(false)}
                />
              )}
              {formType === 'transfer' && (
                <PrintableTransferForm 
                  data={printData} 
                  onClose={() => setIsPrintOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
