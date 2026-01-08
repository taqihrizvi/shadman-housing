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
import { Search, Filter, Download, Eye, FileText, Receipt, DollarSign, ChevronDown, ChevronUp, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { inventoryAPI, formsAPI, voucherAPI } from "@/lib/api";
import PrintableBiyanaForm from "@/pages/forms/PrintableBiyanaForm";

const projects = ["All Projects", "GREEN_VALLEY", "LAKE_VIEW", "PALM_HEIGHTS", "SUNSET_GARDENS"];

export default function SoldInventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("All Projects");
  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showBiyanaDetails, setShowBiyanaDetails] = useState(true);
  const [showSaleAgreementDetails, setShowSaleAgreementDetails] = useState(true);
  const [showPaymentDetails, setShowPaymentDetails] = useState(true);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  // Fetch sold inventory from API
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['soldInventory', selectedProject, searchTerm],
    queryFn: async () => {
      const params: any = { status: 'SOLD' };
      if (selectedProject !== "All Projects") params.project = selectedProject;
      if (searchTerm) params.search = searchTerm;
      const response = await inventoryAPI.getAll(params);
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
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
      return response.data;
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

  const handlePrintBiyanaForm = (plot: any) => {
    const biyana = getPlotBiyana(plot.id);
    if (!biyana) {
      alert("No Biyana form found for this plot");
      return;
    }
    
    const data = {
      customerName: plot.buyer?.name || "",
      fatherName: plot.buyer?.fatherName || "",
      cnic: plot.buyer?.cnic || "",
      phone: plot.buyer?.phone || "",
      address: plot.buyer?.address || "",
      plot: {
        plotNo: plot.plotNo || "",
        project: plot.project || "",
        size: formatSize(plot.size || ""),
        block: plot.block || "",
        price: plot.price || 0,
      },
      biyanaAmount: biyana.biyanaAmount || 0,
      paymentMethod: biyana.paymentMethod || "",
      date: biyana.date || new Date().toISOString(),
      agreementNumber: biyana.id,
      status: biyana.status,
      approvedBy: biyana.approvedBy,
    };
    setPrintData(data);
    setIsPrintOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-PK");
  };

  const formatEnum = (value: string) => {
    if (!value) return "";
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatSize = (value: string) => {
    if (!value) return "";
    const sizeMap: { [key: string]: string } = {
      'FIVE_MARLA': '5 Marla',
      'SEVEN_MARLA': '7 Marla',
      'TEN_MARLA': '10 Marla',
      'ONE_KANAL': '1 Kanal',
      'TWO_KANAL': '2 Kanal',
    };
    return sizeMap[value] || formatEnum(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sold Inventory</h1>
            <p className="text-muted-foreground">
              View and manage all sold properties ({inventoryData?.length || 0} properties)
            </p>
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
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by plot or buyer..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {formatEnum(project)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Sold Properties</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !inventoryData || inventoryData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No sold properties found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plot No.</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Sold Date</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryData.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.plotNo}</TableCell>
                      <TableCell>{formatEnum(item.project)}</TableCell>
                      <TableCell>{formatSize(item.size)}</TableCell>
                      <TableCell>{item.buyer?.name || "N/A"}</TableCell>
                      <TableCell>{item.agent?.name || "N/A"}</TableCell>
                      <TableCell>{formatDate(item.soldDate)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewDetails(item)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Plot Details - {selectedPlot?.plotNo}</DialogTitle>
              <DialogDescription>
                Complete transaction history and payment details
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
                      <p className="font-semibold">{formatSize(selectedPlot.size)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-semibold">{formatCurrency(selectedPlot.price)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Buyer</p>
                      <p className="font-semibold">{selectedPlot.buyer?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sold Date</p>
                      <p className="font-semibold">{formatDate(selectedPlot.soldDate)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

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
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintBiyanaForm(selectedPlot);
                              }}
                            >
                              <Printer className="h-4 w-4 mr-2" />
                              Print
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
                              <p className="font-semibold">{biyana.customer?.name || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Amount</p>
                              <p className="font-semibold text-green-600">{formatCurrency(biyana.biyanaAmount)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Date</p>
                              <p className="font-semibold">{formatDate(biyana.date)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Payment Method</p>
                              <p className="font-semibold">{formatEnum(biyana.paymentMethod)}</p>
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
                  const calculatedTotalPaid = downPayment + biyanaAmount + paymentsTotal;
                  const calculatedPending = saleAgreement?.totalAmount ? saleAgreement.totalAmount - calculatedTotalPaid : 0;
                  
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
                        {showSaleAgreementDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                      {showSaleAgreementDetails && (
                        saleAgreement ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground">Agreement Number</p>
                              <p className="font-semibold">{saleAgreement.agreementNumber}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Customer</p>
                              <p className="font-semibold">{saleAgreement.customer?.name || "N/A"}</p>
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
                              <p className="text-sm text-muted-foreground">Total Paid</p>
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
                                (saleAgreement.installmentMonths === 0 ? 'Full Payment' : 
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
                          Payment History
                          <Badge variant="outline">{payments.length} payments</Badge>
                        </h3>
                        {showPaymentDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                      {showPaymentDetails && (
                        payments.length > 0 ? (
                          <div className="space-y-3">
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700">Total Paid (Installments)</p>
                            <p className="text-2xl font-bold text-green-700">{formatCurrency(totalPaid)}</p>
                          </div>
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Voucher No</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Amount</TableHead>
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
                                      <Badge variant="outline">{formatEnum(payment.paymentMethod)}</Badge>
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
                        <p className="text-sm text-muted-foreground p-4 border rounded-lg">No payments recorded</p>
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
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
              <DialogTitle className="sr-only">Print Biyana Form</DialogTitle>
              <PrintableBiyanaForm 
                data={printData} 
                onClose={() => setIsPrintOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
