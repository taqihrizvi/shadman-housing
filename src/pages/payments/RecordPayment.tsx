import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Receipt, Save, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryAPI, customerAPI, formsAPI, voucherAPI } from "@/lib/api";
import { useTranslation } from 'react-i18next';

const paymentMethods = ["CASH", "BANK_TRANSFER", "CHEQUE", "ONLINE"];
const paymentTypes = ["INSTALLMENT", "QUARTERLY", "BIYANA", "SALES_AGREEMENT"];

export default function RecordPayment() {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    plotId: searchParams.get('plotId') || "",
    customerId: searchParams.get('customerId') || "",
    paymentType: "INSTALLMENT",
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
  const [autoFilledAmount, setAutoFilledAmount] = useState<number | null>(null);

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

  // Fetch sale agreement for selected plot
  const { data: agreements } = useQuery({
    queryKey: ['saleAgreements', formData.plotId],
    queryFn: async () => {
      if (!formData.plotId) return null;
      const response = await formsAPI.getSaleAgreements();
      return response.data.filter((a: any) => a.plotId === formData.plotId && a.status === 'ACTIVE');
    },
    enabled: !!formData.plotId,
  });

  // Fetch Biyana forms for selected plot
  const { data: biyanaForms } = useQuery({
    queryKey: ['biyanaForms', formData.plotId],
    queryFn: async () => {
      if (!formData.plotId) return null;
      const response = await formsAPI.getBiyanaForms();
      return response.data.filter((b: any) => b.plotId === formData.plotId && b.status === 'APPROVED');
    },
    enabled: !!formData.plotId && (formData.paymentType === 'BIYANA'),
  });

  // Calculate pending amount and handle auto-fill based on payment type
  useEffect(() => {
    if (agreements && agreements.length > 0) {
      const agreement = agreements[0]; // Latest active agreement
      
      // Calculate pending amount
      const pending = agreement.pendingAmount !== undefined 
        ? agreement.pendingAmount 
        : agreement.totalAmount - (agreement.totalPaid || agreement.downPayment || 0);
      setPendingAmount(pending);
      
      // Auto-fill customer from agreement
      if (!formData.customerId && agreement.customerId) {
        setFormData(prev => ({ ...prev, customerId: agreement.customerId }));
      }

      // Auto-fill amount based on payment type
      if (formData.paymentType === 'SALES_AGREEMENT') {
        const downPaymentAmount = agreement.downPayment || 0;
        setAutoFilledAmount(downPaymentAmount);
        setFormData(prev => ({ 
          ...prev, 
          amount: downPaymentAmount.toString(),
          description: `Sales Agreement Down Payment - ${agreement.agreementNumber}`
        }));
      }
    }
  }, [agreements, formData.paymentType]);

  // Handle Biyana payment type
  useEffect(() => {
    if (formData.paymentType === 'BIYANA' && biyanaForms && biyanaForms.length > 0) {
      // Get the latest biyana form
      const latestBiyana = biyanaForms.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      
      const biyanaAmount = latestBiyana.biyanaAmount || 0;
      setAutoFilledAmount(biyanaAmount);
      setFormData(prev => ({ 
        ...prev, 
        amount: biyanaAmount.toString(),
        description: `Biyana Payment - ${latestBiyana.formNumber}`
      }));
    }
  }, [biyanaForms, formData.paymentType]);

  // Reset amount when payment type changes to manual entry types
  useEffect(() => {
    if (formData.paymentType === 'INSTALLMENT' || formData.paymentType === 'QUARTERLY') {
      setAutoFilledAmount(null);
      if (formData.amount && (formData.description?.includes('Biyana Payment') || formData.description?.includes('Sales Agreement'))) {
        setFormData(prev => ({ ...prev, amount: "", description: "" }));
      }
    }
  }, [formData.paymentType]);

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
      queryClient.invalidateQueries({ queryKey: ['saleAgreements'] });
      queryClient.invalidateQueries({ queryKey: ['biyanaForms'] });
      toast({
        title: t('payments.recordPayment'),
        description: t('payments.paymentRecorded'),
      });
      // Redirect to printable voucher
      navigate(`/vouchers/print/${voucher.id}`);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('payments.paymentFailed'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.plotId || !formData.customerId) {
      toast({
        title: t('common.error'),
        description: t('payments.selectPlotCustomer'),
        variant: "destructive",
      });
      return;
    }

    if (!formData.paymentType) {
      toast({
        title: t('common.error'),
        description: "Please select a payment type",
        variant: "destructive",
      });
      return;
    }

    const paymentAmount = parseFloat(formData.amount);

    // Validation for INSTALLMENT and QUARTERLY payments against pending amount
    if ((formData.paymentType === 'INSTALLMENT' || formData.paymentType === 'QUARTERLY') && 
        pendingAmount > 0 && paymentAmount > (pendingAmount + 0.01)) {
      toast({
        title: t('common.error'),
        description: `${t('payments.amountExceedsLimit')} (${formatCurrency(paymentAmount)}) ${t('payments.cannotExceedPending')} (${formatCurrency(pendingAmount)})`,
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
      formType: formData.paymentType,
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

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      INSTALLMENT: "Monthly Installment",
      QUARTERLY: "Quarterly Payment",
      BIYANA: "Biyana Payment",
      SALES_AGREEMENT: "Sales Agreement Down Payment"
    };
    return labels[type] || type;
  };

  const isAmountReadOnly = formData.paymentType === 'BIYANA' || formData.paymentType === 'SALES_AGREEMENT';

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl" dir={isUrdu ? 'rtl' : 'ltr'}>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('payments.recordPayment')}</h1>
          </div>
        </div>

        {pendingAmount > 0 && (formData.paymentType === 'INSTALLMENT' || formData.paymentType === 'QUARTERLY') && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('payments.pendingAmount')}: <strong>{formatCurrency(pendingAmount)}</strong>
            </AlertDescription>
          </Alert>
        )}

        {autoFilledAmount !== null && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Amount auto-filled from {formData.paymentType === 'BIYANA' ? 'Biyana Form' : 'Sales Agreement'}: <strong>{formatCurrency(autoFilledAmount)}</strong>
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
              {/* Payment Type Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Payment Type</h3>
                <div className="space-y-2">
                  <Label htmlFor="paymentType">Select Payment Type *</Label>
                  <Select
                    value={formData.paymentType}
                    onValueChange={(value) => setFormData({ ...formData, paymentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getPaymentTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formData.paymentType === 'INSTALLMENT' && "Record a monthly installment payment"}
                    {formData.paymentType === 'QUARTERLY' && "Record a quarterly payment (recurring every 3 months)"}
                    {formData.paymentType === 'BIYANA' && "Auto-fetches amount from approved Biyana form"}
                    {formData.paymentType === 'SALES_AGREEMENT' && "Auto-fetches down payment from active Sales Agreement"}
                  </p>
                </div>
              </div>

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
                      readOnly={isAmountReadOnly}
                      disabled={isAmountReadOnly}
                      className={isAmountReadOnly ? "bg-muted cursor-not-allowed" : ""}
                    />
                    {pendingAmount > 0 && (formData.paymentType === 'INSTALLMENT' || formData.paymentType === 'QUARTERLY') && (
                      <p className="text-xs text-muted-foreground">
                        {t('payments.maximum')}: {formatCurrency(pendingAmount)}
                      </p>
                    )}
                    {isAmountReadOnly && (
                      <p className="text-xs text-amber-600">
                        Amount is auto-filled and cannot be modified
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
                  <Label htmlFor="description">{t('forms.remarks')}</Label>
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
                <Button type="button" variant="outline" onClick={() => navigate('/vouchers')}>
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
