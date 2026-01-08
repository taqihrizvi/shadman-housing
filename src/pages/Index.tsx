import {
  Building2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
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
import { reportsAPI } from "@/lib/api";
import { useEffect } from "react";

const Index = () => {
  // Fetch dashboard stats from API
  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await reportsAPI.getDashboardStats();
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

  // Update inventory data when stats are loaded
  const inventoryData = dashboardStats ? [
    { name: "Available", value: dashboardStats.inventory?.available || 0, color: "hsl(217, 91%, 60%)" },
    { name: "Reserved", value: dashboardStats.inventory?.reserved || 0, color: "hsl(38, 92%, 50%)" },
    { name: "Sold", value: dashboardStats.inventory?.sold || 0, color: "hsl(142, 76%, 36%)" },
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your properties.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">Export Report</Button>
            <Button>Add New Plot</Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Available Inventory"
            value={isLoading ? "..." : String(dashboardStats?.inventory?.available || 0)}
            subtitle="Ready to sell"
            icon={Building2}
            variant="primary"
          />
          <StatCard
            title="Reserved Plots"
            value={isLoading ? "..." : String(dashboardStats?.inventory?.reserved || 0)}
            subtitle="With Biyana"
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Sold Units"
            value={isLoading ? "..." : String(dashboardStats?.inventory?.sold || 0)}
            icon={CheckCircle2}
            trend={{ value: dashboardStats?.sales?.growth || 0, positive: (dashboardStats?.sales?.growth || 0) > 0 }}
            variant="success"
          />
          <StatCard
            title="Monthly Sales"
            value={isLoading ? "..." : formatCurrency(dashboardStats?.revenue?.monthly || 0)}
            icon={TrendingUp}
            trend={{ value: dashboardStats?.revenue?.growth || 0, positive: (dashboardStats?.revenue?.growth || 0) > 0 }}
            variant="accent"
          />
          <StatCard
            title="Pending Payments"
            value={isLoading ? "..." : formatCurrency(dashboardStats?.pendingPayments?.amount || 0)}
            subtitle={`${dashboardStats?.pendingPayments?.customers || 0} customers`}
            icon={Clock}
            variant="warning"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6">
          {/* Inventory Distribution */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <p className="text-sm text-muted-foreground">Current distribution</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={inventoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex justify-center gap-6">
                {inventoryData.map((item) => (
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
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
