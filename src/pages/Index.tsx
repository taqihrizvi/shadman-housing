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
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { reportsAPI, inventoryAPI, formsAPI } from "@/lib/api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const navigate = useNavigate();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  
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
            <Button variant="outline">{t('reports.exportPDF')}</Button>
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
          <div onClick={() => setSelectedCard('pending')} className="cursor-pointer transition-transform hover:scale-105">
            <StatCard
              title={t('dashboard.pendingPayments')}
              value={isLoading ? "..." : formatCurrency(dashboardStats?.pendingPayments?.amount || 0)}
              subtitle={`${dashboardStats?.pendingPayments?.customers || 0} customers`}
              icon={Clock}
              variant="warning"
            />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6">
          {/* Inventory Distribution */}
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{selectedCard ? getCardTitle(selectedCard) : 'Inventory Status'}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedCard ? 'Detailed view' : 'Current distribution'}
                </p>
              </div>
              {selectedCard && (
                <Button variant="outline" size="sm" onClick={() => setSelectedCard(null)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Graph
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
                      <Tooltip />
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
      </div>
    </DashboardLayout>
  );

  function getCardTitle(cardType: string) {
    switch (cardType) {
      case 'available': return t('dashboard.availablePlots');
      case 'reserved': return t('dashboard.reservedPlots');
      case 'sold': return t('dashboard.soldPlots');
      case 'salesMonth': return t('dashboard.salesThisMonth');
      case 'pending': return t('dashboard.pendingPayments');
      default: return 'Details';
    }
  }

  function renderCardTable(cardType: string) {
    let data: any[] = [];

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

      case 'sold':
        data = (inventoryData || [])
          .filter((plot: any) => plot.status === 'SOLD')
          .map((plot: any) => ({
            plotNo: plot.plotNo,
            customer: plot.buyer?.name || 'N/A',
            totalAmount: formatCurrency(plot.price),
            date: plot.soldDate ? formatDate(plot.soldDate) : 'N/A',
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
            const totalPaid = agreement.totalPaid || agreement.downPayment || 0;
            const pending = agreement.totalAmount - totalPaid;
            return {
              customer: agreement.customer?.name || 'N/A',
              plotNo: agreement.plot?.plotNo || 'N/A',
              dueAmount: formatCurrency(pending > 0 ? pending : 0),
              dueDate: 'As per schedule',
            };
          })
          .filter((item: any) => item.dueAmount !== formatCurrency(0));
        break;
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

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function getTableHeaders(cardType: string) {
    switch (cardType) {
      case 'available':
        return ['Plot No', 'Phase', 'Block', 'Size', 'Price'];
      case 'reserved':
        return ['Plot No', 'Customer', 'Biyana Amount', 'Date'];
      case 'sold':
        return ['Plot No', 'Customer', 'Total Amount', 'Date'];
      case 'salesMonth':
        return ['Date', 'Plot No', 'Customer', 'Amount'];
      case 'pending':
        return ['Customer', 'Plot No', 'Due Amount', 'Due Date'];
      default:
        return [];
    }
  }
};

export default Index;
