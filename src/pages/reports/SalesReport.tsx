import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Download, TrendingUp, DollarSign, Users, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const monthlyData = [
  { month: "Jul", sales: 8, revenue: 16000000 },
  { month: "Aug", sales: 12, revenue: 24000000 },
  { month: "Sep", sales: 15, revenue: 30000000 },
  { month: "Oct", sales: 10, revenue: 20000000 },
  { month: "Nov", sales: 18, revenue: 36000000 },
  { month: "Dec", sales: 22, revenue: 44000000 },
  { month: "Jan", sales: 24, revenue: 48000000 },
];

const salesDetails = [
  { id: 1, date: "2024-01-15", plot: "A-101", customer: "Ahmed Khan", agent: "Ali Hassan", amount: 2500000, commission: 50000 },
  { id: 2, date: "2024-01-14", plot: "B-202", customer: "Sara Ali", agent: "Usman Shah", amount: 4500000, commission: 90000 },
  { id: 3, date: "2024-01-12", plot: "C-301", customer: "Imran Qureshi", agent: "Ali Hassan", amount: 5100000, commission: 102000 },
  { id: 4, date: "2024-01-10", plot: "A-102", customer: "Fatima Zahra", agent: "Kamran Iqbal", amount: 2300000, commission: 46000 },
  { id: 5, date: "2024-01-08", plot: "D-401", customer: "Usman Malik", agent: "Usman Shah", amount: 3200000, commission: 64000 },
];

const periods = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];
const years = ["2024", "2023", "2022"];

export default function SalesReport() {
  const [selectedPeriod, setSelectedPeriod] = useState("Monthly");
  const [selectedYear, setSelectedYear] = useState("2024");

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `PKR ${(value / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalSales = salesDetails.reduce((sum, item) => sum + item.amount, 0);
  const totalCommission = salesDetails.reduce((sum, item) => sum + item.commission, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Report</h1>
            <p className="text-muted-foreground">
              Comprehensive sales analytics and performance metrics
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period} value={period}>
                    {period}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">{salesDetails.length}</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-success">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
                </div>
                <div className="rounded-xl bg-success/10 p-3">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-accent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Commissions</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalCommission)}</p>
                </div>
                <div className="rounded-xl bg-accent/20 p-3">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-info">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Sale Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalSales / salesDetails.length)}</p>
                </div>
                <div className="rounded-xl bg-info/10 p-3">
                  <Calendar className="h-5 w-5 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Sales Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
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

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v / 1000000}M`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--success))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--success))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Sales Table */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Plot</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesDetails.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.date}</TableCell>
                    <TableCell className="font-medium">{sale.plot}</TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell>{sale.agent}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(sale.amount)}</TableCell>
                    <TableCell className="text-success">{formatCurrency(sale.commission)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
