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
  const [duplicateVoucherWarning, setDuplicateVoucherWarning] = useState<string | null>(null);

  // Fetch sold plots
  const { data: plotsData } = useQuery({
    queryKey: ['soldPlots'],
    queryFn: async () => {
      const response = await inventoryAPI.getAll({ status: 'SOLD' });
      return response.data;
    },
  });

  // Fetch all sale agreements to filter completed plots
  const { data: allAgreementsData } = useQuery({
    queryKey: ['allSaleAgreements'],
    queryFn: async () => {
      const response = await formsAPI.getSaleAgreements();
      // Filter out archived agreements
      return response.data.filter((agreement: any) => !agreement.isArchived);
    },
  });

  // Filter out plots with completed payments
  const availablePlots = plotsData?.filter((plot: any) => {
    const agreement = allAgreementsData?.find((a: any) => 
      a.plotId === plot.id && a.status === 'ACTIVE'
    );
    
    if (!agreement) return true; // Include plots without agreements
    
    // Check if payment is completed (pendingAmount <= 0)
    const pendingAmount = agreement.pendingAmount !== undefined 
      ? agreement.pendingAmount 
      : 0;
    
    return pendingAmount > 0; // Only include plots with pending payments
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
  const { data: agreements, isLoading: agreementsLoading } = useQuery({
    queryKey: ['saleAgreements', formData.plotId],
    queryFn: async () => {
      if (!formData.plotId) return null;
      const response = await formsAPI.getSaleAgreements();
      console.log('All agreements from API:', response.data);
      // Filter out archived agreements and get agreements for this plot
      const filtered = response.data.filter((a: any) => !a.isArchived).filter((a: any) => {
        console.log('Checking agreement:', a.plotId, '===', formData.plotId, 'status:', a.status, 'isActive:', a.isActive);
        return a.plotId === formData.plotId && a.status === 'APPROVED' && a.isActive === true;
      });
      console.log('Agreements fetched for plot:', formData.plotId, 'Count:', filtered.length, 'Data:', filtered);
      return filtered;
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

  // Check for existing vouchers to prevent duplicates
  const { data: existingVouchers } = useQuery({
    queryKey: ['existingVouchers', formData.plotId, formData.paymentType],
    queryFn: async () => {
      if (!formData.plotId || (formData.paymentType !== 'BIYANA' && formData.paymentType !== 'SALES_AGREEMENT')) {
        return null;
      }
      const response = await voucherAPI.getAll();
      return response.data.filter((v: any) => 
        v.plotId === formData.plotId && 
        v.formType === formData.paymentType &&
        (v.status === 'PENDING' || v.status === 'APPROVED')
      );
    },
    enabled: !!formData.plotId && (formData.paymentType === 'BIYANA' || formData.paymentType === 'SALES_AGREEMENT'),
  });

  // Update duplicate warning based on existing vouchers
  useEffect(() => {
    if (existingVouchers && existingVouchers.length > 0) {
      const voucherType = formData.paymentType === 'BIYANA' ? 'Biyana' : 'Sales Agreement';
      setDuplicateVoucherWarning(`${voucherType} voucher for this plot already exists (${existingVouchers[0].voucherNo})`);
    } else {
      setDuplicateVoucherWarning(null);
    }
  }, [existingVouchers, formData.paymentType]);

  // Calculate pending amount and handle auto-fill based on payment type
  useEffect(() => {
    console.log('useEffect triggered - agreements:', agreements, 'paymentType:', formData.paymentType, 'agreementsLoading:', agreementsLoading);
    
    if (agreementsLoading) {
      console.log('Agreements still loading...');
      return;
    }
    
    if (agreements && agreements.length > 0) {
      const agreement = agreements[0]; // Latest active agreement
      console.log('Agreement found:', agreement);
      
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
        console.log('Setting Sales Agreement amount:', downPaymentAmount, typeof downPaymentAmount);
        setAutoFilledAmount(downPaymentAmount);
        if (downPaymentAmount > 0) {
          setFormData(prev => ({ 
            ...prev, 
            amount: String(downPaymentAmount),
            description: `Sales Agreement Down Payment - ${agreement.agreementNumber}`
          }));
        }
      }
    } else if (formData.paymentType === 'SALES_AGREEMENT') {
      // Reset if no agreement found
      console.log('No agreement found for SALES_AGREEMENT');
      setAutoFilledAmount(null);
      setFormData(prev => ({ ...prev, amount: "", description: "" }));
    }
  }, [agreements, formData.paymentType, formData.plotId, agreementsLoading]);

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
    if (formData.plotId && availablePlots) {
      const plot = availablePlots.find((p: any) => p.id === formData.plotId);
      setSelectedPlot(plot);
      
      // Auto-fill customer from plot's current owner (buyer)
      if (plot && plot.buyerId) {
        setFormData(prev => ({ ...prev, customerId: plot.buyerId }));
      }
    }
  }, [formData.plotId, availablePlots]);

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

    // Validate amount is a valid number
    if (!formData.amount || isNaN(paymentAmount) || paymentAmount <= 0) {
      toast({
        title: t('common.error'),
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

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
    const key = `payments.paymentTypes.${type}` as const;
    return t(key, type);
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

        {duplicateVoucherWarning && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{t('payments.duplicateWarning')}:</strong> {duplicateVoucherWarning}. {t('payments.cannotCreateDuplicate')}.
            </AlertDescription>
          </Alert>
        )}

        {autoFilledAmount !== null && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t('payments.autoFilledFrom')} {formData.paymentType === 'BIYANA' ? t('payments.biyanaForm') : t('payments.salesAgreement')}: <strong>{formatCurrency(autoFilledAmount)}</strong>
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
                    {formData.paymentType && t(`payments.paymentTypeHelp.${formData.paymentType}`, '')}
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
                        {availablePlots?.map((plot: any) => (
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
                          <strong>{selectedPlot.plotNo}</strong> - {formatEnum(selectedPlot.project)}
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
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={createPaymentMutation.isPending || !!duplicateVoucherWarning}
                >
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
