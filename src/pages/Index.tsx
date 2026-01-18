import {
  Building2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  ArrowRightLeft,
  Eye,
  FileText,
  FileSignature,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Printer,
  Search,
  Download,
  Receipt,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { reportsAPI, inventoryAPI, formsAPI, voucherAPI } from "@/lib/api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import PrintableBiyanaFormSimple from "@/pages/forms/PrintableBiyanaFormSimple";
import html2pdf from "html2pdf.js";

const Index = () => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const navigate = useNavigate();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  
  // Sold inventory detail states
  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showBiyanaDetails, setShowBiyanaDetails] = useState(true);
  const [showSaleAgreementDetails, setShowSaleAgreementDetails] = useState(true);
  const [showPaymentDetails, setShowPaymentDetails] = useState(true);
  const [showTransferDetails, setShowTransferDetails] = useState(true);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const [soldSearchTerm, setSoldSearchTerm] = useState("");
  const [soldStatusFilter, setSoldStatusFilter] = useState("All Status");
  const [selectedPaymentPlot, setSelectedPaymentPlot] = useState<any>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  const projects = ["All Projects", "GREEN_VALLEY", "LAKE_VIEW", "PALM_HEIGHTS", "SUNSET_GARDENS"];
  const statusOptions = ["All Status", "SOLD", "TRANSFERRED"];
  
  // Fetch dashboard stats from API
  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await reportsAPI.getDashboardStats();
      return response.data;
    },
  });

  // Fetch inventory data for card details
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await inventoryAPI.getAll();
      return response.data;
    },
  });

  // Fetch biyana forms for reserved plots details
  const { data: biyanaForms } = useQuery({
    queryKey: ['biyanaForms'],
    queryFn: async () => {
      const response = await formsAPI.getBiyanaForms();
      return response.data;
    },
  });

  // Fetch sale agreements for sold plots and pending payments
  const { data: saleAgreements } = useQuery({
    queryKey: ['saleAgreements'],
    queryFn: async () => {
      const response = await formsAPI.getSaleAgreements();
      return response.data;
    },
  });

  // Fetch vouchers for payment history
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-PK");
  };

  const getPlotTransfer = (plotId: string) => {
    return transfersData?.filter((t: any) => t.plotId === plotId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  };

  const getPlotStatus = (plot: any) => {
    if (plot.status === 'TRANSFERRED') {
      return 'TRANSFERRED';
    }
    
    const transfer = getPlotTransfer(plot.id);
    if (transfer && transfer.status === 'COMPLETED') {
      return 'SOLD (Transferred)';
    }
    
    return 'SOLD';
  };

  // Helper functions for sold inventory details
  const handleViewDetails = (plot: any) => {
    console.log('View Details clicked for plot:', plot.plotNo);
    setSelectedPlot(plot);
    setIsDetailOpen(true);
  };

  const getPlotBiyana = (plotId: string) => {
    return biyanaForms?.find((b: any) => b.plotId === plotId);
  };

  const getPlotSaleAgreement = (plotId: string, customerId: string) => {
    return saleAgreements?.find((s: any) => s.plotId === plotId && s.customerId === customerId);
  };

  const getPlotPayments = (plotId: string, customerId: string) => {
    return vouchersData?.filter((v: any) => v.plotId === plotId && v.customerId === customerId) || [];
  };

  const getSizeInMarla = (size: string): number => {
    const sizeMap: { [key: string]: number } = {
      'FIVE_MARLA': 5,
      'SEVEN_MARLA': 7,
      'TEN_MARLA': 10,
      'ONE_KANAL': 20,
      'TWO_KANAL': 40,
    };
    return sizeMap[size] || 0;
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
        size: formatSize(plot.size || ""),
        block: plot.block || "",
        price: plot.price || 0,
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
    setIsPrintOpen(true);
  };

  const handleExportPDF = () => {
    const element = document.createElement('div');
    element.style.padding = '40px';
    element.style.backgroundColor = 'white';
    element.style.fontFamily = 'Arial, sans-serif';

    const today = new Date().toLocaleDateString("en-PK", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    element.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1e293b; margin-bottom: 10px;">Dashboard Report</h1>
        <p style="color: #64748b; font-size: 14px;">Generated on ${today}</p>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Inventory Summary</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px; background-color: #f1f5f9; border: 1px solid #e2e8f0; font-weight: bold;">Available Plots</td>
            <td style="padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0;">${dashboardStats?.inventory?.available || 0}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f1f5f9; border: 1px solid #e2e8f0; font-weight: bold;">Reserved Plots</td>
            <td style="padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0;">${dashboardStats?.inventory?.reserved || 0}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f1f5f9; border: 1px solid #e2e8f0; font-weight: bold;">Sold Plots</td>
            <td style="padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0;">${dashboardStats?.inventory?.sold || 0}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f1f5f9; border: 1px solid #e2e8f0; font-weight: bold;">Total Inventory</td>
            <td style="padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: bold;">${(dashboardStats?.inventory?.available || 0) + (dashboardStats?.inventory?.reserved || 0) + (dashboardStats?.inventory?.sold || 0)}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Financial Overview</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px; background-color: #f1f5f9; border: 1px solid #e2e8f0; font-weight: bold;">Sales This Month</td>
            <td style="padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0;">${formatCurrency(dashboardStats?.revenue?.monthly || 0)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f1f5f9; border: 1px solid #e2e8f0; font-weight: bold;">Revenue Growth</td>
            <td style="padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0;">${dashboardStats?.revenue?.growth || 0}%</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f1f5f9; border: 1px solid #e2e8f0; font-weight: bold;">Pending Payments</td>
            <td style="padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0;">${formatCurrency(dashboardStats?.pendingPayments?.amount || 0)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background-color: #f1f5f9; border: 1px solid #e2e8f0; font-weight: bold;">Customers with Pending Payments</td>
            <td style="padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0;">${dashboardStats?.pendingPayments?.customers || 0}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Inventory Distribution</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #1e293b; color: white;">
              <th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Status</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">Count</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${pieChartData.map((item: any, index: number) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f8fafc' : 'white'};">
                <td style="padding: 12px; border: 1px solid #e2e8f0;">
                  <span style="display: inline-block; width: 12px; height: 12px; background-color: ${item.color}; border-radius: 50%; margin-right: 8px;"></span>
                  ${item.name}
                </td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">${item.value}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">
                  ${((item.value / ((dashboardStats?.inventory?.available || 0) + (dashboardStats?.inventory?.reserved || 0) + (dashboardStats?.inventory?.sold || 0))) * 100).toFixed(1)}%
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;">
        <p>This report was automatically generated by Shadman Housing Management System</p>
        <p>© ${new Date().getFullYear()} All rights reserved</p>
      </div>
    `;

    const opt = {
      margin: 10,
      filename: `dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  // Update inventory data when stats are loaded
  const pieChartData = dashboardStats ? [
    { name: isUrdu ? "دستیاب" : "Available", value: dashboardStats.inventory?.available || 0, color: "hsl(217, 91%, 60%)" },
    { name: isUrdu ? "محفوظ شدہ" : "Reserved", value: dashboardStats.inventory?.reserved || 0, color: "hsl(38, 92%, 50%)" },
    { name: isUrdu ? "فروخت شدہ" : "Sold", value: dashboardStats.inventory?.sold || 0, color: "hsl(142, 76%, 36%)" },
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in" dir={isUrdu ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              {t('reports.exportPDF')}
            </Button>
            <Button onClick={() => navigate('/inventory/add')}>{t('inventory.addInventory')}</Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div onClick={() => setSelectedCard('available')} className="cursor-pointer transition-transform hover:scale-105">
            <StatCard
              title={t('dashboard.availablePlots')}
              value={isLoading ? "..." : String(dashboardStats?.inventory?.available || 0)}
              subtitle="Ready to sell"
              icon={Building2}
              variant="primary"
            />
          </div>
          <div onClick={() => setSelectedCard('reserved')} className="cursor-pointer transition-transform hover:scale-105">
            <StatCard
              title={t('dashboard.reservedPlots')}
              value={isLoading ? "..." : String(dashboardStats?.inventory?.reserved || 0)}
              subtitle="With Biyana"
              icon={Clock}
              variant="warning"
            />
          </div>
          <div onClick={() => setSelectedCard('sold')} className="cursor-pointer transition-transform hover:scale-105">
            <StatCard
              title={t('dashboard.soldPlots')}
              value={isLoading ? "..." : String(dashboardStats?.inventory?.sold || 0)}
              icon={CheckCircle2}
              trend={{ value: dashboardStats?.sales?.growth || 0, positive: (dashboardStats?.sales?.growth || 0) > 0 }}
              variant="success"
            />
          </div>
          <div onClick={() => setSelectedCard('salesMonth')} className="cursor-pointer transition-transform hover:scale-105">
            <StatCard
              title={t('dashboard.salesThisMonth')}
              value={isLoading ? "..." : formatCurrency(dashboardStats?.revenue?.monthly || 0)}
              icon={TrendingUp}
              trend={{ value: dashboardStats?.revenue?.growth || 0, positive: (dashboardStats?.revenue?.growth || 0) > 0 }}
              variant="accent"
            />
          </div>
          <div 
            onClick={() => setSelectedCard('payments')} 
            className="cursor-pointer transition-all hover:scale-105 group"
          >
            <Card className="border-l-4 border-l-accent card-hover h-full bg-gradient-to-br from-accent/5 to-transparent overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-accent/10 transition-all"></div>
              <CardContent className="p-4 h-full relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground line-clamp-2 min-h-[2rem]">{t('payments.paymentDetails')}</p>
                    <div className="flex items-center gap-1.5">
                      <Receipt className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
                      <span className="text-[10px] font-medium text-accent uppercase tracking-wider">{t('payments.viewRecords')}</span>
                    </div>
                    <div className="min-h-[1rem]">
                      <p className="text-xs text-muted-foreground">{t('payments.viewAllRecords')}</p>
                    </div>
                  </div>
                  <div className="rounded-full p-2 flex-shrink-0 mt-1 bg-accent/10 group-hover:bg-accent/20 transition-all">
                    <DollarSign className="h-4 w-4 text-accent" strokeWidth={2.5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6">
          {/* Inventory Distribution */}
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{selectedCard ? getCardTitle(selectedCard) : t('dashboard.inventoryStatus')}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedCard ? t('dashboard.detailedView') : t('dashboard.currentDistribution')}
                </p>
              </div>
              {selectedCard && (
                <Button variant="outline" size="sm" onClick={() => setSelectedCard(null)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('dashboard.backToGraph')}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {selectedCard ? (
                <div className="overflow-x-auto">
                  {renderCardTable(selectedCard)}
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 flex justify-center gap-6">
                    {pieChartData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {item.name}: {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details Dialog for Sold Inventory */}
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

                {/* Transfer Details (if plot has been transferred) */}
                {(() => {
                  const transfer = getPlotTransfer(selectedPlot.id);
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
                            <Badge variant="default">TRANSFERRED</Badge>
                          </h3>
                          {showTransferDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
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
                                <p className="font-semibold">{transfer.fromCustomer?.name || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">To (New Owner)</p>
                                <p className="font-semibold text-green-600">{transfer.toCustomer?.name || "N/A"}</p>
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
                            </div>
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-sm text-amber-800">
                                <strong>Note:</strong> This plot was transferred from {transfer.fromCustomer?.name} to {transfer.toCustomer?.name}. 
                                {t('payments.saleAgreementDetails')}
                              </p>
                            </div>
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
                              <p className="text-sm text-muted-foreground">{t('payments.amount')}</p>
                              <p className="font-semibold text-green-600">{formatCurrency(biyana.biyanaAmount)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Date</p>
                              <p className="font-semibold">{formatDate(biyana.date)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">{t('payments.paymentMethod')}</p>
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
                              <p className="text-sm text-muted-foreground">{t('payments.agreementNumber')}</p>
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
                              <p className="text-sm text-muted-foreground">{t('payments.downPayment')}</p>
                              <p className="font-semibold text-green-600">{formatCurrency(saleAgreement.downPayment)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">{t('payments.totalPaid')}</p>
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
                                  <TableHead>Voucher No</TableHead>
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
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
              <DialogTitle className="sr-only">Print Biyana Form</DialogTitle>
              <PrintableBiyanaFormSimple 
                data={printData} 
                onClose={() => setIsPrintOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Payment Details Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('payments.paymentDetails')} - {t('inventory.plotNo')} {selectedPaymentPlot?.plotNo}</DialogTitle>
              <DialogDescription>
                {t('payments.completePaymentHistory')}
              </DialogDescription>
            </DialogHeader>

            {selectedPaymentPlot && (() => {
              // Get the sale agreement for this plot
              const agreement = saleAgreements?.find((a: any) => a.plotId === selectedPaymentPlot.plotId);
              // Get biyana form for this plot
              const biyana = biyanaForms?.find((b: any) => b.plotId === selectedPaymentPlot.plotId);
              
              // Combine all payments: vouchers + biyana payment + down payment
              let allPayments = [...(selectedPaymentPlot.payments || [])];
              
              // Add down payment if it exists from sale agreement
              if (agreement && agreement.downPayment) {
                allPayments.push({
                  id: `downpayment-${agreement.id}`,
                  date: agreement.agreementDate,
                  description: 'Down Payment',
                  voucherNumber: agreement.agreementNumber,
                  bankSlipNumber: 'N/A',
                  paymentMethod: 'N/A',
                  amount: agreement.downPayment,
                  type: 'DOWN_PAYMENT'
                });
              }
              
              // Add biyana payment if it exists
              if (biyana && biyana.biyanaAmount) {
                allPayments.push({
                  id: `biyana-${biyana.id}`,
                  date: biyana.date || biyana.createdAt,
                  description: 'Biyana Payment',
                  voucherNumber: biyana.formNumber,
                  bankSlipNumber: 'N/A',
                  paymentMethod: biyana.paymentMethod || 'N/A',
                  amount: biyana.biyanaAmount,
                  type: 'BIYANA'
                });
              }
              
              // Sort all payments by date
              allPayments = allPayments.sort((a: any, b: any) => 
                new Date(a.date).getTime() - new Date(b.date).getTime()
              );
              
              // Calculate totals including biyana
              const totalPaid = allPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
              
              return (
                <div className="space-y-6">
                  {/* Sale Agreement Information */}
                  {agreement && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <FileSignature className="h-5 w-5" />
                        {t('payments.saleAgreementInformation')}
                      </h3>
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">{t('payments.agreementNumber')}</p>
                          <p className="font-semibold">{agreement.agreementNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('payments.agreementDate')}</p>
                          <p className="font-semibold">{formatDate(agreement.agreementDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('forms.customerName')}</p>
                          <p className="font-semibold">{agreement.customer?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Amount</p>
                          <p className="font-semibold">{formatCurrency(agreement.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Down Payment</p>
                          <p className="font-semibold">{formatCurrency(agreement.downPayment)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('payments.installmentPlan')}</p>
                          <p className="font-semibold">
                            {agreement.installmentMonths ? `${agreement.installmentMonths} ${t('common.months')}` : t('payments.fullPayment')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Biyana Information */}
                  {biyana && (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {t('payments.biyanaDetails')}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                          <div>
                            <p className="text-sm text-muted-foreground">{t('payments.formNumber')}</p>
                            <p className="font-semibold">{biyana.formNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{t('payments.biyanaAmount')}</p>
                            <p className="font-semibold text-green-600">{formatCurrency(biyana.biyanaAmount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="font-semibold">{formatCurrency(biyana.totalAmount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{t('payments.monthlyInstallment')}</p>
                            <p className="font-semibold">{formatCurrency(biyana.monthlyInstallmentAmount || 0)}</p>
                          </div>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Payment History */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      {t('payments.paymentHistory')}
                    </h3>
                    {allPayments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {t('payments.noPaymentsReceived')}
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('payments.dateOfPayment')}</TableHead>
                              <TableHead>{t('payments.paymentType')}</TableHead>
                              <TableHead>{t('payments.paymentMethod')}</TableHead>
                              <TableHead className="text-right">{t('payments.amount')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allPayments.map((payment: any) => (
                              <TableRow key={payment.id} className={payment.type === 'BIYANA' ? 'bg-blue-50' : payment.type === 'DOWN_PAYMENT' ? 'bg-green-50' : ''}>
                                <TableCell>{formatDate(payment.date)}</TableCell>
                                <TableCell>
                                  <div>
                                    {payment.type === 'BIYANA' ? (
                                      <Badge variant="default" className="bg-blue-600">{t('payments.biyana')}</Badge>
                                    ) : payment.type === 'DOWN_PAYMENT' ? (
                                      <Badge variant="default" className="bg-green-600">{t('payments.downPayment')}</Badge>
                                    ) : (
                                      payment.description || t('payments.installment')
                                    )}
                                    {(payment.voucherNo || payment.voucherNumber) && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {t('payments.voucher')}: {payment.voucherNo || payment.voucherNumber}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{formatEnum(payment.paymentMethod)}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold">{formatCurrency(payment.amount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Payment Summary */}
                  <div className="bg-muted/50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">{t('payments.paymentSummary')}</h3>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">{t('payments.totalPaymentsMade')}</p>
                        <p className="text-3xl font-bold text-blue-600">{allPayments.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">{t('payments.totalAmountReceived')}</p>
                        <p className="text-3xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">{t('payments.remainingAmount')}</p>
                        <p className="text-3xl font-bold text-orange-600">
                          {formatCurrency(selectedPaymentPlot.totalReceivable - totalPaid)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );

  function getCardTitle(cardType: string) {
    switch (cardType) {
      case 'available': return t('dashboard.availablePlots');
      case 'reserved': return t('dashboard.reservedPlots');
      case 'sold': return t('dashboard.soldPlots');
      case 'salesMonth': return t('dashboard.salesThisMonth');
      case 'payments': return t('payments.paymentDetails');
      default: return t('common.details');
    }
  }

  function renderCardTable(cardType: string) {
    let data: any[] = [];

    // Special handling for sold inventory - show full interface like SoldInventory page
    if (cardType === 'sold') {
      // Filter sold plots based on search and project
      const soldPlots = (inventoryData || [])
        .filter((plot: any) => plot.status === 'SOLD' || plot.status === 'TRANSFERRED')
        .filter((plot: any) => {
          const matchesSearch = !soldSearchTerm || 
            plot.plotNo?.toLowerCase().includes(soldSearchTerm.toLowerCase()) ||
            plot.buyer?.name?.toLowerCase().includes(soldSearchTerm.toLowerCase());
          const matchesStatus = soldStatusFilter === "All Status" || plot.status === soldStatusFilter;
          return matchesSearch && matchesStatus;
        });

      return (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by plot or buyer..."
                className="pl-10"
                value={soldSearchTerm}
                onChange={(e) => setSoldSearchTerm(e.target.value)}
              />
            </div>
            <Select value={soldStatusFilter} onValueChange={setSoldStatusFilter}>
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
          </div>

          {/* Sold Inventory Table */}
          {soldPlots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('inventory.noData')}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('inventory.plotNo')}</TableHead>
                    <TableHead>{t('inventory.project')}</TableHead>
                    <TableHead>{t('inventory.size')}</TableHead>
                    <TableHead>{t('customers.buyer')}</TableHead>
                    <TableHead>{t('inventory.status')}</TableHead>
                    <TableHead>{t('inventory.soldDate')}</TableHead>
                    <TableHead>{t('inventory.price')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {soldPlots.map((item: any) => {
                    const plotStatus = getPlotStatus(item);
                    const isTransferred = item.status === 'TRANSFERRED';
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.plotNo}</TableCell>
                        <TableCell>{formatEnum(item.project)}</TableCell>
                        <TableCell>{formatSize(item.size)}</TableCell>
                        <TableCell>{item.buyer?.name || "N/A"}</TableCell>
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
            </div>
          )}
        </div>
      );
    }

    switch (cardType) {
      case 'available':
        data = (inventoryData || [])
          .filter((plot: any) => plot.status === 'AVAILABLE')
          .map((plot: any) => ({
            plotNo: plot.plotNo,
            phase: formatEnum(plot.project),
            block: plot.block,
            size: formatEnum(plot.size),
            price: formatCurrency(plot.price),
          }));
        break;

      case 'reserved':
        data = (biyanaForms || [])
          .filter((form: any) => form.status === 'APPROVED')
          .map((form: any) => ({
            plotNo: form.plot?.plotNo || 'N/A',
            customer: form.customer?.name || 'N/A',
            biyanaAmount: formatCurrency(form.biyanaAmount || 0),
            date: formatDate(form.date),
          }));
        break;

      case 'salesMonth':
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        
        data = (inventoryData || [])
          .filter((plot: any) => {
            if (plot.status !== 'SOLD' || !plot.soldDate) return false;
            const soldDate = new Date(plot.soldDate);
            return soldDate >= currentMonth;
          })
          .map((plot: any) => ({
            date: formatDate(plot.soldDate),
            plotNo: plot.plotNo,
            customer: plot.buyer?.name || 'N/A',
            amount: formatCurrency(plot.price),
          }));
        break;

      case 'pending':
        // Get all approved sale agreements with pending amounts
        data = (saleAgreements || [])
          .filter((agreement: any) => agreement.status === 'APPROVED')
          .map((agreement: any) => {
            // Use totalPaid if available, otherwise calculate from downPayment
            const totalPaid = agreement.totalPaid || 0;
            const pending = agreement.totalAmount - totalPaid;
            // Show current plot owner (in case of transfer) - use currentOwner field from backend
            const ownerName = agreement.currentOwner?.name || agreement.customer?.name || 'N/A';
            return {
              customer: ownerName,
              plotNo: agreement.plot?.plotNo || 'N/A',
              dueAmount: formatCurrency(pending > 0 ? pending : 0),
              dueDate: 'As per schedule',
            };
          })
          .filter((item: any) => item.dueAmount !== formatCurrency(0));
        break;

      case 'payments':
        // Get all approved sale agreements with payment details
        // Group by plotId and only show the most recent active (non-archived) agreement per plot
        const activeAgreements = (saleAgreements || [])
          .filter((agreement: any) => agreement.status === 'APPROVED' && !agreement.isArchived)
          .reduce((acc: any, agreement: any) => {
            // If we already have an agreement for this plot, keep the most recent one
            if (!acc[agreement.plotId] || new Date(agreement.createdAt) > new Date(acc[agreement.plotId].createdAt)) {
              acc[agreement.plotId] = agreement;
            }
            return acc;
          }, {});
        
        const paymentData = Object.values(activeAgreements)
          .map((agreement: any) => {
            // Get voucher payments for this plot
            const plotPayments = (vouchersData || [])
              .filter((v: any) => v.plotId === agreement.plotId)
              .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            // Get biyana for this plot
            const plotBiyana = biyanaForms?.find((b: any) => b.plotId === agreement.plotId);
            
            // Calculate total received including biyana and down payment
            let totalReceived = plotPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
            if (plotBiyana && plotBiyana.biyanaAmount) {
              totalReceived += plotBiyana.biyanaAmount;
            }
            if (agreement.downPayment) {
              totalReceived += agreement.downPayment;
            }
            
            const totalReceivable = agreement.totalAmount || 0;
            
            return {
              id: agreement.id,
              plotId: agreement.plotId,
              plotNo: agreement.plot?.plotNo || 'N/A',
              customerName: agreement.customer?.name || 'N/A',
              agreementDate: formatDate(agreement.agreementDate),
              totalReceived: totalReceived,
              totalReceivable: totalReceivable,
              payments: plotPayments,
            };
          });

        return (
          <div className="space-y-3">
            {paymentData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('payments.noRecordsFound')}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('payments.agreementDate')}</TableHead>
                    <TableHead>{t('inventory.plotNo')}</TableHead>
                    <TableHead>{t('forms.customerName')}</TableHead>
                    <TableHead>{t('payments.totalReceived')}</TableHead>
                    <TableHead>{t('payments.totalReceivable')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentData.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.agreementDate}</TableCell>
                      <TableCell className="font-medium">{item.plotNo}</TableCell>
                      <TableCell>{item.customerName}</TableCell>
                      <TableCell className="text-green-600 font-semibold">{formatCurrency(item.totalReceived)}</TableCell>
                      <TableCell>{formatCurrency(item.totalReceivable)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedPaymentPlot(item);
                            setIsPaymentDialogOpen(true);
                          }}
                          className="cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        );
    }

    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {t('common.noData')}
        </div>
      );
    }

    return (
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {getTableHeaders(cardType).map((header, index) => (
              <th key={index} className="px-4 py-3 text-left text-sm font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, index) => (
            <tr key={index} className="border-b hover:bg-muted/50">
              {Object.values(row).map((value, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-sm">
                  {value as string}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function getTableHeaders(cardType: string) {
    switch (cardType) {
      case 'available':
        return [t('inventory.plotNo'), t('inventory.phase'), t('inventory.block'), t('inventory.size'), t('inventory.price')];
      case 'reserved':
        return [t('inventory.plotNo'), t('customers.customer'), t('payments.biyanaAmount'), t('payments.date')];
      case 'salesMonth':
        return [t('payments.date'), t('inventory.plotNo'), t('customers.customer'), t('payments.amount')];
      case 'pending':
        return [t('customers.customer'), t('inventory.plotNo'), t('payments.dueAmount'), t('payments.dueDate')];
      default:
        return [];
    }
  }
};

export default Index;
