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

const paymentMethods = ["CASH", "BANK_TRANSFER", "CHEQUE", "ONLINE"];

export default function RecordPayment() {
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
      
      // Auto-fill customer if not already set
      if (!formData.customerId && agreement.customerId) {
        setFormData(prev => ({ ...prev, customerId: agreement.customerId }));
      }
    }
  }, [agreements]);

  // Load plot and customer details when IDs are set
  useEffect(() => {
    if (formData.plotId && plotsData) {
      const plot = plotsData.find((p: any) => p.id === formData.plotId);
      setSelectedPlot(plot);
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

    if (parseFloat(formData.amount) > pendingAmount) {
      toast({
        title: "Error",
        description: "Payment amount cannot exceed pending amount",
        variant: "destructive",
      });
      return;
    }

    const paymentData = {
      customerId: formData.customerId,
      plotId: formData.plotId,
      amount: parseFloat(formData.amount),
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
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Record Payment</h1>
            <p className="text-muted-foreground">
              Add installment or payment against a plot
            </p>
          </div>
        </div>

        {pendingAmount > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Pending Amount: <strong>{formatCurrency(pendingAmount)}</strong>
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
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>Enter payment information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Plot and Customer Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Plot & Customer</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="plotId">Select Plot *</Label>
                    <Select
                      value={formData.plotId}
                      onValueChange={(value) => setFormData({ ...formData, plotId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plot" />
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
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Select Customer *</Label>
                    <Select
                      value={formData.customerId}
                      onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customersData?.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} - {customer.cnic}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Show selected plot and customer details */}
                {(selectedPlot || selectedCustomer) && (
                  <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted rounded-lg">
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
                        <Label className="text-muted-foreground">Customer Details</Label>
                        <p className="text-sm">
                          <strong>{selectedCustomer.name}</strong> - {selectedCustomer.cnic}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Payment Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Payment Amount (PKR) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="Enter amount"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                    {pendingAmount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Maximum: {formatCurrency(pendingAmount)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
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
                      <Label htmlFor="chequeNumber">Cheque Number</Label>
                      <Input
                        id="chequeNumber"
                        placeholder="Enter cheque number"
                        value={formData.chequeNumber}
                        onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        placeholder="Enter bank name"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {(formData.paymentMethod === 'BANK_TRANSFER' || formData.paymentMethod === 'ONLINE') && (
                  <div className="space-y-2">
                    <Label htmlFor="transactionId">Transaction ID</Label>
                    <Input
                      id="transactionId"
                      placeholder="Enter transaction ID"
                      value={formData.transactionId}
                      onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="date">Payment Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description/Remarks</Label>
                  <Textarea
                    id="description"
                    placeholder="Add any notes or remarks..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={createPaymentMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/payments/pending')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
