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

const salesData = [
  { month: "Jan", sales: 12, revenue: 240000 },
  { month: "Feb", sales: 19, revenue: 380000 },
  { month: "Mar", sales: 15, revenue: 300000 },
  { month: "Apr", sales: 22, revenue: 440000 },
  { month: "May", sales: 28, revenue: 560000 },
  { month: "Jun", sales: 24, revenue: 480000 },
];

const inventoryData = [
  { name: "Sold", value: 156, color: "hsl(142, 76%, 36%)" },
  { name: "Unsold", value: 44, color: "hsl(38, 92%, 50%)" },
];

const recentTransactions = [
  { id: 1, customer: "Ahmed Khan", plot: "A-123", amount: 2500000, date: "2024-01-15", status: "completed" },
  { id: 2, customer: "Sara Ali", plot: "B-456", amount: 3200000, date: "2024-01-14", status: "pending" },
  { id: 3, customer: "Usman Malik", plot: "C-789", amount: 1800000, date: "2024-01-13", status: "completed" },
  { id: 4, customer: "Fatima Zahra", plot: "D-012", amount: 2100000, date: "2024-01-12", status: "completed" },
];

const paymentTrend = [
  { day: "Mon", amount: 450000 },
  { day: "Tue", amount: 620000 },
  { day: "Wed", amount: 380000 },
  { day: "Thu", amount: 750000 },
  { day: "Fri", amount: 520000 },
  { day: "Sat", amount: 890000 },
  { day: "Sun", amount: 340000 },
];

const Index = () => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
            title="Total Inventory"
            value="200"
            subtitle="Total plots available"
            icon={Building2}
            variant="primary"
          />
          <StatCard
            title="Sold Units"
            value="156"
            icon={CheckCircle2}
            trend={{ value: 12, positive: true }}
            variant="success"
          />
          <StatCard
            title="Unsold Units"
            value="44"
            icon={XCircle}
            variant="warning"
          />
          <StatCard
            title="Monthly Sales"
            value={formatCurrency(4800000)}
            icon={TrendingUp}
            trend={{ value: 8.5, positive: true }}
            variant="accent"
          />
          <StatCard
            title="Pending Payments"
            value={formatCurrency(1250000)}
            subtitle="5 customers"
            icon={Clock}
            variant="warning"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sales Chart */}
          <Card variant="elevated" className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sales Overview</CardTitle>
                <p className="text-sm text-muted-foreground">Monthly sales performance</p>
              </div>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Inventory Distribution */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <p className="text-sm text-muted-foreground">Current distribution</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={inventoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
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

        {/* Payment Trend & Recent Transactions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Payment Trend */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Payment Trend</CardTitle>
              <p className="text-sm text-muted-foreground">This week's collection</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={paymentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Amount"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--accent))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--accent))", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <p className="text-sm text-muted-foreground">Latest sales activity</p>
              </div>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-semibold text-primary">
                          {transaction.customer.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{transaction.customer}</p>
                        <p className="text-sm text-muted-foreground">
                          Plot {transaction.plot} • {transaction.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(transaction.amount)}</p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          transaction.status === "completed"
                            ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>
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
