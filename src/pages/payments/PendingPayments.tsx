import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formsAPI } from "@/lib/api";
import { DollarSign, Loader2, Search, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const PendingPayments = () => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: agreements, isLoading } = useQuery({
    queryKey: ['activeAgreements'],
    queryFn: async () => {
      const response = await formsAPI.getSaleAgreements();
      // Filter only active agreements
      return response.data.filter((agreement: any) => agreement.status === 'ACTIVE');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatEnum = (value: string) => {
    if (!value) return "";
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const calculatePendingAmount = (agreement: any) => {
    // Use backend-calculated pending amount if available
    if (agreement.pendingAmount !== undefined) {
      return agreement.pendingAmount;
    }
    // Fallback calculation (should not be needed)
    const totalPaid = (agreement.downPayment || 0) + (agreement.vouchersTotal || 0);
    const totalAmount = agreement.totalAmount || 0;
    return totalAmount - totalPaid;
  };

  const getTotalPaid = (agreement: any) => {
    // Use backend-calculated total paid if available
    if (agreement.totalPaid !== undefined) {
      return agreement.totalPaid;
    }
    // Fallback calculation
    return (agreement.downPayment || 0) + (agreement.vouchersTotal || 0);
  };

  const filteredAgreements = agreements?.filter((agreement: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      agreement.customer?.name?.toLowerCase().includes(search) ||
      agreement.plot?.plotNo?.toLowerCase().includes(search) ||
      agreement.agreementNumber?.toLowerCase().includes(search)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6" dir={isUrdu ? 'rtl' : 'ltr'}>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <DollarSign className="h-8 w-8" />
              {t('payments.pendingPayments')}
            </h1>
          </div>
          <Button onClick={() => navigate('/payments/record')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('payments.recordPayment')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('payments.outstandingPayments')}</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('common.search')}
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !filteredAgreements || filteredAgreements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('payments.noPending')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('forms.agreementNumber')}</TableHead>
                      <TableHead>{t('forms.customerName')}</TableHead>
                      <TableHead>{t('inventory.plotNo')}</TableHead>
                      <TableHead>{t('inventory.project')}</TableHead>
                      <TableHead>{t('payments.totalAmount')}</TableHead>
                      <TableHead>{t('payments.paidAmount')}</TableHead>
                      <TableHead>{t('payments.pendingAmount')}</TableHead>
                      <TableHead>{t('payments.paymentPlan')}</TableHead>
                      <TableHead>{t('payments.agreementDate')}</TableHead>
                      <TableHead>{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgreements.map((agreement: any) => {
                      const pendingAmount = calculatePendingAmount(agreement);
                      const totalPaid = getTotalPaid(agreement);
                      const paidPercentage = ((totalPaid / agreement.totalAmount) * 100).toFixed(1);
                      
                      return (
                        <TableRow key={agreement.id}>
                          <TableCell className="font-medium">{agreement.agreementNumber}</TableCell>
                          <TableCell>{agreement.customer?.name || 'N/A'}</TableCell>
                          <TableCell>{agreement.plot?.plotNo || 'N/A'}</TableCell>
                          <TableCell>{formatEnum(agreement.plot?.project || '')}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(agreement.totalAmount)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(totalPaid)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-red-600">{formatCurrency(pendingAmount)}</span>
                              <span className="text-xs text-muted-foreground">{paidPercentage}% paid</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {agreement.installmentMonths === 0 
                              ? t('payments.fullPayment')
                              : `${agreement.installmentMonths} ${t('payments.months')}`}
                          </TableCell>
                          <TableCell>{formatDate(agreement.agreementDate)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/payments/record?agreementId=${agreement.id}&plotId=${agreement.plotId}&customerId=${agreement.customerId}`)}
                            >
                              {t('payments.addPayment')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {filteredAgreements && filteredAgreements.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">{t('payments.totalAgreements')}</div>
                <div className="text-2xl font-bold">{filteredAgreements.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">{t('payments.totalAmount')}</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(filteredAgreements.reduce((sum: number, a: any) => sum + a.totalAmount, 0))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">{t('payments.pendingAmount')}</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(filteredAgreements.reduce((sum: number, a: any) => sum + calculatePendingAmount(a), 0))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PendingPayments;
