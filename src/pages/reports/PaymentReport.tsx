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
import { Download, Search, DollarSign, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/formatters";

const paymentData = [
  {
    id: 1,
    customer: "Ahmed Khan",
    plot: "A-101",
    totalAmount: 2500000,
    paidAmount: 1500000,
    pendingAmount: 1000000,
    lastPayment: "2024-01-10",
    nextDue: "2024-02-10",
    status: "on-track",
    installments: { paid: 6, total: 12 },
  },
  {
    id: 2,
    customer: "Sara Ali",
    plot: "B-202",
    totalAmount: 4500000,
    paidAmount: 4500000,
    pendingAmount: 0,
    lastPayment: "2024-01-08",
    nextDue: null,
    status: "completed",
    installments: { paid: 1, total: 1 },
  },
  {
    id: 3,
    customer: "Imran Qureshi",
    plot: "C-301",
    totalAmount: 5100000,
    paidAmount: 2550000,
    pendingAmount: 2550000,
    lastPayment: "2024-01-05",
    nextDue: "2024-02-05",
    status: "on-track",
    installments: { paid: 12, total: 24 },
  },
  {
    id: 4,
    customer: "Fatima Zahra",
    plot: "D-401",
    totalAmount: 2300000,
    paidAmount: 575000,
    pendingAmount: 1725000,
    lastPayment: "2023-12-15",
    nextDue: "2024-01-15",
    status: "overdue",
    installments: { paid: 3, total: 12 },
  },
  {
    id: 5,
    customer: "Usman Malik",
    plot: "A-102",
    totalAmount: 3200000,
    paidAmount: 1600000,
    pendingAmount: 1600000,
    lastPayment: "2024-01-12",
    nextDue: "2024-02-12",
    status: "on-track",
    installments: { paid: 6, total: 12 },
  },
];

const statusColors = {
  "on-track": "bg-success/10 text-success",
  completed: "bg-primary/10 text-primary",
  overdue: "bg-destructive/10 text-destructive",
};

export default function PaymentReport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = paymentData.filter((item) => {
    const matchesSearch =
      item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.plot.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalReceived = paymentData.reduce((sum, item) => sum + item.paidAmount, 0);
  const totalPending = paymentData.reduce((sum, item) => sum + item.pendingAmount, 0);
  const overdueCount = paymentData.filter((item) => item.status === "overdue").length;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Report</h1>
            <p className="text-muted-foreground">
              Track customer payments and installment schedules
            </p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-success">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Received</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalReceived)}</p>
                </div>
                <div className="rounded-xl bg-success/10 p-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-warning">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pending</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
                </div>
                <div className="rounded-xl bg-warning/10 p-3">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold">{overdueCount}</p>
                </div>
                <div className="rounded-xl bg-destructive/10 p-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Customers</p>
                  <p className="text-2xl font-bold">{paymentData.length}</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by customer or plot..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="on-track">On Track</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Input type="month" placeholder="Select month" />
            </div>
          </CardContent>
        </Card>

        {/* Payment Table */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plot</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.customer}</TableCell>
                    <TableCell>{payment.plot}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress
                          value={(payment.paidAmount / payment.totalAmount) * 100}
                          className="h-2"
                        />
                        <span className="text-xs text-muted-foreground">
                          {payment.installments.paid}/{payment.installments.total} installments
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-success font-medium">
                      {formatCurrency(payment.paidAmount)}
                    </TableCell>
                    <TableCell className="text-warning font-medium">
                      {formatCurrency(payment.pendingAmount)}
                    </TableCell>
                    <TableCell>{payment.nextDue || "—"}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[payment.status as keyof typeof statusColors]}>
                        {payment.status.replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </TableCell>
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
