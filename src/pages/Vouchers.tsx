import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { voucherAPI } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toTitleCase } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, Search, Printer, Eye, CheckCircle, Clock, XCircle, FilterX } from "lucide-react";
import { useTranslation } from "react-i18next";


export default function Vouchers() {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch vouchers
  const { data: vouchersData, isLoading } = useQuery({
    queryKey: ['vouchers'],
    queryFn: async () => {
      const response = await voucherAPI.getAll({ type: 'RECEIPT' });
      return response.data;
    },
  });

  const vouchers = vouchersData || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatEnum = (value: string) => {
    if (!value) return "";
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatPaymentMethod = (method: string) => {
    if (!method) return "";
    return t(`payments.paymentMethods.${method}`) || formatEnum(method);
  };

  const formatPaymentType = (type: string) => {
    if (!type) return "";
    if (type === 'BIYANA') return 'Biyana Payment';
    if (type === 'INSTALLMENT') return 'Installment';
    if (type === 'QUARTERLY') return 'Quarterly Payment';
    if (type === 'SALES_AGREEMENT') return 'Sales Agreement';
    return t(`payments.paymentTypes.${type}`) || formatEnum(type);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate status counts
  const pendingCount = vouchers.filter((v: any) => v.status === 'PENDING').length;
  const approvedCount = vouchers.filter((v: any) => v.status === 'APPROVED').length;
  const rejectedCount = vouchers.filter((v: any) => v.status === 'REJECTED').length;

  const filteredVouchers = vouchers.filter((voucher: any) => {
    // Tab filter
    let matchesTab = true;
    if (activeTab === 'approved') matchesTab = voucher.status === 'APPROVED';
    else if (activeTab === 'pending') matchesTab = voucher.status === 'PENDING';
    else if (activeTab === 'rejected') matchesTab = voucher.status === 'REJECTED';
    
    // Search filter
    const matchesSearch = 
      voucher.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.plot?.plotNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.voucherNo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Payment type filter
    const matchesPaymentType = paymentTypeFilter === "ALL" || voucher.formType === paymentTypeFilter;
    
    // Payment method filter
    const matchesPaymentMethod = paymentMethodFilter === "ALL" || voucher.paymentMethod === paymentMethodFilter;
    
    // Date range filter
    let matchesDateRange = true;
    if (startDate || endDate) {
      const voucherDate = new Date(voucher.date);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (voucherDate < start) matchesDateRange = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (voucherDate > end) matchesDateRange = false;
      }
    }
    
    return matchesTab && matchesSearch && matchesPaymentType && matchesPaymentMethod && matchesDateRange;
  });

  // Total amount only for APPROVED vouchers
  const totalAmount = vouchers
    .filter((v: any) => v.status === 'APPROVED')
    .reduce((sum: number, v: any) => sum + v.amount, 0);

  const handlePrint = (voucherId: string) => {
    navigate(`/vouchers/print/${voucherId}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" dir={isUrdu ? 'rtl' : 'ltr'}>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Receipt className="h-8 w-8" />
              {t('vouchers.title')}
            </h1>
          </div>
          <Button onClick={() => navigate('/payments/record')}>
            <Receipt className="h-4 w-4 mr-2" />
            {t('payments.recordPayment')}
          </Button>
        </div>
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card 
            className={`border-l-4 border-l-primary cursor-pointer transition-all hover:shadow-lg ${activeTab === 'all' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">All Vouchers</p>
                  <p className="text-3xl font-bold">{vouchers.length}</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`border-l-4 border-l-green-500 cursor-pointer transition-all hover:shadow-lg ${activeTab === 'approved' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved Vouchers</p>
                  <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                </div>
                <div className="rounded-xl bg-green-100 p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`border-l-4 border-l-yellow-500 cursor-pointer transition-all hover:shadow-lg ${activeTab === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Vouchers</p>
                  <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <div className="rounded-xl bg-yellow-100 p-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`border-l-4 border-l-red-500 cursor-pointer transition-all hover:shadow-lg ${activeTab === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected Vouchers</p>
                  <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
                </div>
                <div className="rounded-xl bg-red-100 p-3">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-success">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-end gap-3 justify-between">
              {/* Search on the left */}
              <div className="w-80">
                <Label htmlFor="search" className="text-xs">{t('common.search')}</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder={t('common.search')}
                    className="pl-8 h-9 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Filters on the right */}
              <div className="flex items-end gap-3">
                {/* Payment Type Filter */}
                <div className="w-44">
                  <Label htmlFor="payment-type-filter" className="text-xs">Payment Type</Label>
                  <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                    <SelectTrigger id="payment-type-filter" className="mt-1 h-9 text-sm">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Types</SelectItem>
                      <SelectItem value="BIYANA">Biyana Payment</SelectItem>
                      <SelectItem value="INSTALLMENT">Installment</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly Payment</SelectItem>
                      <SelectItem value="SALES_AGREEMENT">Sales Agreement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Method Filter */}
                <div className="w-44">
                  <Label htmlFor="payment-method-filter" className="text-xs">Payment Method</Label>
                  <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                    <SelectTrigger id="payment-method-filter" className="mt-1 h-9 text-sm">
                      <SelectValue placeholder="All Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Methods</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="ONLINE">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div className="w-40">
                  <Label htmlFor="start-date" className="text-xs">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    className="mt-1 h-9 text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                {/* End Date */}
                <div className="w-40">
                  <Label htmlFor="end-date" className="text-xs">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    className="mt-1 h-9 text-sm"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                {/* Clear Filters Button */}
                <Button 
                  size="sm"
                  className="h-9 text-white px-3"
                  style={{ backgroundColor: 'rgb(28, 84, 65)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(20, 65, 50)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(28, 84, 65)'}
                  onClick={() => {
                    setSearchTerm("");
                    setPaymentTypeFilter("ALL");
                    setPaymentMethodFilter("ALL");
                    setStartDate("");
                    setEndDate("");
                  }}
                  title="Clear Filters"
                >
                  <FilterX className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receipts Table with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="all" className="px-6 py-3">
              All Vouchers
              <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold">
                {vouchers.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="approved" className="px-6 py-3">
              Approved
              <span className="ml-2 rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs font-semibold">
                {approvedCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="px-6 py-3">
              Pending
              <span className="ml-2 rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs font-semibold">
                {pendingCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="px-6 py-3">
              Rejected
              <span className="ml-2 rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-xs font-semibold">
                {rejectedCount}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>{t('vouchers.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">{t('common.loading')}</div>
                ) : filteredVouchers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('vouchers.noVouchers')}
                  </div>
                ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('vouchers.voucherNo')}</TableHead>
                    <TableHead>{t('forms.customerName')}</TableHead>
                    <TableHead>{t('inventory.plotNo')}</TableHead>
                    <TableHead>{t('Payment Type')}</TableHead>
                    <TableHead>{t('payments.amount')}</TableHead>
                    <TableHead>{t('payments.date')}</TableHead>
                    <TableHead>{t('payments.paymentMethod')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVouchers.map((voucher: any) => (
                    <TableRow key={voucher.id}>
                      <TableCell className="font-medium">{voucher.voucherNo}</TableCell>
                      <TableCell>{toTitleCase(voucher.customer?.name || t('payments.notAvailable'))}</TableCell>
                      <TableCell>{voucher.plot?.plotNo || t('payments.notAvailable')}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs font-medium">
                          {formatPaymentType(voucher.formType)}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(voucher.amount)}
                      </TableCell>
                      <TableCell>{formatDate(voucher.date)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                          {formatPaymentMethod(voucher.paymentMethod)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {voucher.status === 'APPROVED' ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2.5 py-0.5 text-xs font-semibold">
                            {t('status.approved')}
                          </span>
                        ) : voucher.status === 'REJECTED' ? (
                          <span className="inline-flex items-center rounded-full bg-red-100 text-red-800 px-2.5 py-0.5 text-xs font-semibold">
                            {t('status.rejected')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-2.5 py-0.5 text-xs font-semibold">
                            {t('status.pending')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handlePrint(voucher.id)}
                            title="View Receipt"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {voucher.status !== 'REJECTED' && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handlePrint(voucher.id)}
                              title="Print Receipt"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
