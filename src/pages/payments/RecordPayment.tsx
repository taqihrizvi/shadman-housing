import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Receipt, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryAPI, customerAPI, formsAPI, voucherAPI } from "@/lib/api";
import { useTranslation } from 'react-i18next';

const paymentMethods = ["CASH", "BANK_TRANSFER", "CHEQUE", "ONLINE"];

export default function RecordPayment() {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    plotId: searchParams.get('plotId') || "",
    customerId: searchParams.get('customerId') || "",
    amount: "",
    paymentMethod: "",
    chequeNumber: "",
    bankName: "",
    transactionId: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [pendingAmount, setPendingAmount] = useState(0);

  // Fetch sold plots
  const { data: plotsData } = useQuery({
    queryKey: ['soldPlots'],
    queryFn: async () => {
      const response = await inventoryAPI.getAll({ status: 'SOLD' });
      return response.data;
    },
  });

  // Fetch customers
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await customerAPI.getAll();
      return response.data;
    },
  });

  // Fetch sale agreement for selected plot to calculate pending amount
  const { data: agreements } = useQuery({
    queryKey: ['saleAgreements', formData.plotId],
    queryFn: async () => {
      if (!formData.plotId) return null;
      const response = await formsAPI.getSaleAgreements();
      return response.data.filter((a: any) => a.plotId === formData.plotId && a.status === 'ACTIVE');
    },
    enabled: !!formData.plotId,
  });

  // Calculate pending amount when agreement is loaded
  useEffect(() => {
    if (agreements && agreements.length > 0) {
      const agreement = agreements[0];
      // Use backend-calculated pending amount if available
      const pending = agreement.pendingAmount !== undefined 
        ? agreement.pendingAmount 
        : agreement.totalAmount - (agreement.totalPaid || agreement.downPayment || 0);
      setPendingAmount(pending);
      
      // Auto-fill customer from agreement only if not already set
      if (!formData.customerId && agreement.customerId) {
        setFormData(prev => ({ ...prev, customerId: agreement.customerId }));
      }
    }
  }, [agreements, formData.customerId]);

  // Load plot and customer details when IDs are set
  useEffect(() => {
    if (formData.plotId && plotsData) {
      const plot = plotsData.find((p: any) => p.id === formData.plotId);
      setSelectedPlot(plot);
      
      // Auto-fill customer from plot's current owner (buyer)
      if (plot && plot.buyerId) {
        setFormData(prev => ({ ...prev, customerId: plot.buyerId }));
      }
    }
  }, [formData.plotId, plotsData]);

  useEffect(() => {
    if (formData.customerId && customersData) {
      const customer = customersData.find((c: any) => c.id === formData.customerId);
      setSelectedCustomer(customer);
    }
  }, [formData.customerId, customersData]);

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await voucherAPI.create(data);
      return response.data;
    },
    onSuccess: (voucher) => {
      queryClient.invalidateQueries({ queryKey: ['activeAgreements'] });
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast({
        title: "Payment Recorded",
        description: "Payment has been recorded successfully. Opening receipt...",
      });
      // Redirect to printable voucher
      navigate(`/vouchers/print/${voucher.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.plotId || !formData.customerId) {
      toast({
        title: "Error",
        description: "Please select both plot and customer",
        variant: "destructive",
      });
      return;
    }

    const paymentAmount = parseFloat(formData.amount);
    
    // Only validate against pending amount if it's greater than 0
    // Add small tolerance for floating point precision (0.01)
    if (pendingAmount > 0 && paymentAmount > (pendingAmount + 0.01)) {
      toast({
        title: "Error",
        description: `Payment amount (${formatCurrency(paymentAmount)}) cannot exceed pending amount (${formatCurrency(pendingAmount)})`,
        variant: "destructive",
      });
      return;
    }

    const paymentData = {
      customerId: formData.customerId,
      plotId: formData.plotId,
      amount: paymentAmount,
      paymentMethod: formData.paymentMethod,
      chequeNumber: formData.chequeNumber || undefined,
      bankName: formData.bankName || undefined,
      transactionId: formData.transactionId || undefined,
      date: new Date(formData.date).toISOString(),
      description: formData.description,
      type: 'RECEIPT',
      formType: 'INSTALLMENT',
    };

    createPaymentMutation.mutate(paymentData);
  };

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

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl" dir={isUrdu ? 'rtl' : 'ltr'}>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('payments.recordPayment')}</h1>
          </div>
        </div>

        {pendingAmount > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('payments.pendingAmount')}: <strong>{formatCurrency(pendingAmount)}</strong>
            </AlertDescription>
          </Alert>
        )}

        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-success/10 p-3">
                <Receipt className="h-6 w-6 text-success" />
              </div>
              <div>
                <CardTitle>{t('payments.paymentDetails')}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Plot and Customer Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">{t('payments.plotAndCustomer')}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="plotId">{t('inventory.plotNo')} *</Label>
                    <Select
                      value={formData.plotId}
                      onValueChange={(value) => setFormData({ ...formData, plotId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('forms.selectPlot')} />
                      </SelectTrigger>
                      <SelectContent>
                        {plotsData?.map((plot: any) => (
                          <SelectItem key={plot.id} value={plot.id}>
                            {plot.plotNo} - {formatEnum(plot.project)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Show selected plot and customer details */}
                {(selectedPlot || selectedCustomer) && (
                  <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted rounded-lg mt-4">
                    {selectedPlot && (
                      <div>
                        <Label className="text-muted-foreground">Plot Details</Label>
                        <p className="text-sm">
                          <strong>{selectedPlot.plotNo}</strong> - {formatEnum(selectedPlot.project)}, Block {selectedPlot.block}
                        </p>
                      </div>
                    )}
                    {selectedCustomer && (
                      <div>
                        <Label className="text-muted-foreground">Owner Details</Label>
                        <p className="text-sm">
                          <strong>{selectedCustomer.name}</strong> - {selectedCustomer.cnic}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Phone: {selectedCustomer.phone}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">{t('payments.paymentInformation')}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">{t('payments.paymentAmount')} (PKR) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder={t('forms.enterAmount')}
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                    {pendingAmount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t('payments.maximum')}: {formatCurrency(pendingAmount)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">{t('payments.paymentMethod')} *</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('forms.selectOption')} />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {formatEnum(method)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Conditional fields based on payment method */}
                {formData.paymentMethod === 'CHEQUE' && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="chequeNumber">{t('forms.chequeNumber')}</Label>
                      <Input
                        id="chequeNumber"
                        placeholder={t('forms.enterCheque')}
                        value={formData.chequeNumber}
                        onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankName">{t('forms.bankName')}</Label>
                      <Input
                        id="bankName"
                        placeholder={t('forms.enterBank')}
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {(formData.paymentMethod === 'BANK_TRANSFER' || formData.paymentMethod === 'ONLINE') && (
                  <div className="space-y-2">
                    <Label htmlFor="transactionId">{t('forms.transactionId')}</Label>
                    <Input
                      id="transactionId"
                      placeholder={t('forms.enterTransaction')}
                      value={formData.transactionId}
                      onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="date">{t('payments.date')} *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('forms.description')}/{t('forms.remarks')}</Label>
                  <Textarea
                    id="description"
                    placeholder={t('forms.enterRemarks')}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={createPaymentMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createPaymentMutation.isPending ? t('common.loading') : t('payments.recordPayment')}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/payments/pending')}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
