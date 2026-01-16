import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { voucherAPI } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Receipt, Search, Printer, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";


export default function Vouchers() {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredVouchers = vouchers.filter(
    (voucher: any) =>
      voucher.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.plot?.plotNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.voucherNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = vouchers.reduce((sum: number, v: any) => sum + v.amount, 0);

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
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('vouchers.totalVouchers')}</p>
                  <p className="text-3xl font-bold">{vouchers.length}</p>
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
                  <p className="text-2xl font-bold">{vouchers.filter((v: any) => {
                    const vDate = new Date(v.date);
                    const now = new Date();
                    return vDate.getMonth() === now.getMonth() && vDate.getFullYear() === now.getFullYear();
                  }).length}</p>
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
                placeholder={t('common.search')}
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
                    <TableHead>{t('payments.amount')}</TableHead>
                    <TableHead>{t('payments.date')}</TableHead>
                    <TableHead>{t('payments.paymentMethod')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVouchers.map((voucher: any) => (
                    <TableRow key={voucher.id}>
                      <TableCell className="font-medium">{voucher.voucherNo}</TableCell>
                      <TableCell>{voucher.customer?.name || 'N/A'}</TableCell>
                      <TableCell>{voucher.plot?.plotNo || 'N/A'}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(voucher.amount)}
                      </TableCell>
                      <TableCell>{formatDate(voucher.date)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                          {formatEnum(voucher.paymentMethod)}
                        </span>
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
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handlePrint(voucher.id)}
                            title="Print Receipt"
                          >
                            <Printer className="h-4 w-4" />
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
      </div>
    </DashboardLayout>
  );
}
