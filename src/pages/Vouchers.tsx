import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Receipt, Plus, Search, Printer, Eye, Download } from "lucide-react";

const receipts = [
  { id: 1, voucherNo: "RV-2024-001", customerName: "Ahmed Khan", plotId: "A-101", amount: 250000, date: "2024-01-15", paymentMethod: "Bank Transfer" },
  { id: 2, voucherNo: "RV-2024-002", customerName: "Sara Ali", plotId: "B-202", amount: 4500000, date: "2024-01-14", paymentMethod: "Cheque" },
  { id: 3, voucherNo: "RV-2024-003", customerName: "Imran Qureshi", plotId: "C-301", amount: 212500, date: "2024-01-12", paymentMethod: "Cash" },
  { id: 4, voucherNo: "RV-2024-004", customerName: "Fatima Zahra", plotId: "D-401", amount: 191667, date: "2024-01-10", paymentMethod: "Bank Transfer" },
  { id: 5, voucherNo: "RV-2024-005", customerName: "Usman Malik", plotId: "A-102", amount: 266667, date: "2024-01-08", paymentMethod: "Online" },
];

const paymentMethods = ["Cash", "Bank Transfer", "Cheque", "Online"];

export default function Vouchers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReceipt, setNewReceipt] = useState({
    customerName: "",
    plotId: "",
    amount: "",
    paymentMethod: "",
    date: new Date().toISOString().split("T")[0],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const filteredReceipts = receipts.filter(
    (receipt) =>
      receipt.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.plotId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.voucherNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Receipt Created",
      description: `Receipt for ${newReceipt.customerName} has been created successfully.`,
    });
    setIsDialogOpen(false);
    setNewReceipt({
      customerName: "",
      plotId: "",
      amount: "",
      paymentMethod: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vouchers & Receipts</h1>
            <p className="text-muted-foreground">
              Manage payment receipts and vouchers
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export All
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Receipt
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Receipt</DialogTitle>
                  <DialogDescription>
                    Generate a payment receipt voucher
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateReceipt} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      placeholder="Enter customer name"
                      value={newReceipt.customerName}
                      onChange={(e) =>
                        setNewReceipt({ ...newReceipt, customerName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plotId">Plot / Property ID</Label>
                    <Input
                      id="plotId"
                      placeholder="e.g., A-101"
                      value={newReceipt.plotId}
                      onChange={(e) =>
                        setNewReceipt({ ...newReceipt, plotId: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (PKR)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={newReceipt.amount}
                      onChange={(e) =>
                        setNewReceipt({ ...newReceipt, amount: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newReceipt.date}
                      onChange={(e) =>
                        setNewReceipt({ ...newReceipt, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      value={newReceipt.paymentMethod}
                      onValueChange={(value) =>
                        setNewReceipt({ ...newReceipt, paymentMethod: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1">
                      Create Receipt
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Receipts</p>
                  <p className="text-3xl font-bold">{receipts.length}</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-success">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-accent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{receipts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by customer, plot, or voucher number..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Receipts Table */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Recent Receipts</CardTitle>
            <CardDescription>All payment vouchers and receipts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voucher No.</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Plot ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium">{receipt.voucherNo}</TableCell>
                    <TableCell>{receipt.customerName}</TableCell>
                    <TableCell>{receipt.plotId}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(receipt.amount)}
                    </TableCell>
                    <TableCell>{receipt.date}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                        {receipt.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
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
