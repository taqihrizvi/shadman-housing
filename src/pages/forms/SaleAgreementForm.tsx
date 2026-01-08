import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { FileSignature, Save, Printer } from "lucide-react";
import { inventoryAPI, customerAPI, formsAPI } from "@/lib/api";

const paymentPlans = ["FULL_PAYMENT", "INSTALLMENT_12", "INSTALLMENT_24", "INSTALLMENT_36"];

const formatEnum = (value: string) => {
  if (!value) return "";
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const formatSize = (value: string) => {
  if (!value) return "";
  const sizeMap: { [key: string]: string } = {
    'FIVE_MARLA': '5 Marla',
    'SEVEN_MARLA': '7 Marla',
    'TEN_MARLA': '10 Marla',
    'ONE_KANAL': '1 Kanal',
    'TWO_KANAL': '2 Kanal',
  };
  return sizeMap[value] || formatEnum(value);
};

export default function SaleAgreementForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    customerName: "",
    fatherName: "",
    cnic: "",
    phone: "",
    address: "",
    plotId: "",
    totalPrice: "",
    downPayment: "",
    paymentPlan: "",
    agreementDate: new Date().toISOString().split("T")[0],
    terms: "",
  });
  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [biyanaAmount, setBiyanaAmount] = useState<number>(0);
  const [duePayment, setDuePayment] = useState<number>(0);
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(0);

  // Fetch reserved plots
  const { data: reservedPlots, isLoading: plotsLoading } = useQuery({
    queryKey: ['reservedPlots'],
    queryFn: async () => {
      const response = await inventoryAPI.getAll({ status: 'RESERVED' });
      return response.data;
    },
  });

  // Create sale agreement mutation
  const createAgreementMutation = useMutation({
    mutationFn: async (data: any) => {
      // First, create or get customer
      let customerId;
      try {
        const customersResponse = await customerAPI.getAll({ search: data.cnic });
        const existingCustomer = customersResponse.data.find((c: any) => c.cnic === data.cnic);
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const customerResponse = await customerAPI.create({
            name: data.customerName,
            fatherName: data.fatherName,
            cnic: data.cnic,
            phone: data.phone,
            address: data.address,
          });
          customerId = customerResponse.data.id;
        }
      } catch (error) {
        throw new Error('Failed to create/find customer');
      }

      // Create sale agreement
      const agreementData = {
        customerId,
        plotId: data.plotId,
        totalAmount: parseFloat(data.totalPrice),
        downPayment: parseFloat(data.downPayment),
        paymentPlan: data.paymentPlan,
        agreementDate: new Date(data.agreementDate),
        terms: data.terms,
      };

      const response = await formsAPI.createSaleAgreement(agreementData);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Sale Agreement Created",
        description: "Sale agreement created successfully. Plot status updated to Sold.",
      });
      queryClient.invalidateQueries({ queryKey: ['reservedPlots'] });
      queryClient.invalidateQueries({ queryKey: ['unsoldInventory'] });
      queryClient.invalidateQueries({ queryKey: ['soldInventory'] });
      navigate('/inventory/sold');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to create sale agreement",
        variant: "destructive",
      });
    },
  });

  const handlePlotSelect = (plotId: string) => {
    const plot = reservedPlots?.find((p: any) => p.id === plotId);
    setSelectedPlot(plot);
    const biyana = plot?.biyanaForms?.[0]?.biyanaAmount || 0;
    const customer = plot?.biyanaForms?.[0]?.customer;
    setBiyanaAmount(biyana);
    
    // Auto-populate buyer information from Biyana form
    setFormData({ 
      ...formData, 
      plotId, 
      totalPrice: plot?.price.toString() || "",
      customerName: customer?.name || "",
      fatherName: customer?.fatherName || "",
      cnic: customer?.cnic || "",
      phone: customer?.phone || "",
      address: customer?.address || "",
    });
  };

  // Calculate due payment whenever totalPrice, downPayment, or biyanaAmount changes
  useEffect(() => {
    const total = parseFloat(formData.totalPrice) || 0;
    const down = parseFloat(formData.downPayment) || 0;
    const due = total - down - biyanaAmount;
    setDuePayment(due > 0 ? due : 0);
  }, [formData.totalPrice, formData.downPayment, biyanaAmount]);

  // Calculate monthly installment based on payment plan and due payment
  useEffect(() => {
    if (!formData.paymentPlan || duePayment <= 0) {
      setMonthlyInstallment(0);
      return;
    }

    let months = 0;
    if (formData.paymentPlan === "INSTALLMENT_12") months = 12;
    else if (formData.paymentPlan === "INSTALLMENT_24") months = 24;
    else if (formData.paymentPlan === "INSTALLMENT_36") months = 36;

    if (months > 0) {
      setMonthlyInstallment(duePayment / months);
    } else {
      setMonthlyInstallment(0);
    }
  }, [formData.paymentPlan, duePayment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAgreementMutation.mutate(formData);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sale Agreement Form</h1>
            <p className="text-muted-foreground">
              Create a formal sale agreement for property transactions
            </p>
          </div>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Agreement
          </Button>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-success/10 p-3">
                <FileSignature className="h-6 w-6 text-success" />
              </div>
              <div>
                <CardTitle>Agreement Details</CardTitle>
                <CardDescription>This will automatically update plot status from Reserved to Sold</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Property Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Property Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="plotId">Reserved Plot *</Label>
                    <Select
                      value={formData.plotId}
                      onValueChange={handlePlotSelect}
                      disabled={plotsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={plotsLoading ? "Loading reserved plots..." : "Select reserved plot"} />
                      </SelectTrigger>
                      <SelectContent>
                        {reservedPlots && reservedPlots.length > 0 ? (
                          reservedPlots.map((plot: any) => (
                            <SelectItem key={plot.id} value={plot.id}>
                              {plot.plotNo} - {formatEnum(plot.project)} ({formatSize(plot.size)})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-plots" disabled>No reserved plots available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedPlot && (
                    <>
                      <div className="space-y-2">
                        <Label>Project</Label>
                        <Input value={formatEnum(selectedPlot.project)} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Size</Label>
                        <Input value={formatSize(selectedPlot.size)} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input value={selectedPlot.block} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Plot Price (PKR)</Label>
                        <Input value={selectedPlot.price.toLocaleString()} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Current Buyer</Label>
                        <Input value={selectedPlot.buyer?.name || "N/A"} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Biyana Amount (PKR)</Label>
                        <Input value={biyanaAmount.toLocaleString()} disabled className="bg-green-50 font-semibold" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Buyer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Buyer Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Buyer Name *</Label>
                    <Input
                      id="customerName"
                      placeholder="Full legal name"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father's/Husband's Name *</Label>
                    <Input
                      id="fatherName"
                      placeholder="Father's/Husband's name"
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnic">CNIC *</Label>
                    <Input
                      id="cnic"
                      placeholder="00000-0000000-0"
                      value={formData.cnic}
                      onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="+92 300 0000000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Complete Address *</Label>
                    <Textarea
                      id="address"
                      placeholder="Complete residential address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Payment Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="totalPrice">Total Price (PKR) *</Label>
                    <Input
                      id="totalPrice"
                      type="number"
                      placeholder="Total amount in PKR"
                      value={formData.totalPrice}
                      onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="downPayment">Down Payment (PKR) *</Label>
                    <Input
                      id="downPayment"
                      type="number"
                      placeholder="Down payment amount"
                      value={formData.downPayment}
                      onChange={(e) => setFormData({ ...formData, downPayment: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentPlan">Payment Plan *</Label>
                    <Select
                      value={formData.paymentPlan}
                      onValueChange={(value) => setFormData({ ...formData, paymentPlan: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentPlans.map((plan) => (
                          <SelectItem key={plan} value={plan}>
                            {formatEnum(plan)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agreementDate">Agreement Date *</Label>
                    <Input
                      id="agreementDate"
                      type="date"
                      value={formData.agreementDate}
                      onChange={(e) => setFormData({ ...formData, agreementDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-base font-semibold">Due Payment (PKR)</Label>
                    <div className="text-2xl font-bold text-primary bg-primary/5 p-4 rounded-lg border-2 border-primary/20">
                      PKR {duePayment.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total Price - Down Payment - Biyana Amount = Due Payment (PKR)
                    </p>
                  </div>
                  {formData.paymentPlan && formData.paymentPlan !== "FULL_PAYMENT" && monthlyInstallment > 0 && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-base font-semibold">Monthly Installment (PKR)</Label>
                      <div className="text-2xl font-bold text-success bg-success/5 p-4 rounded-lg border-2 border-success/20">
                        PKR {monthlyInstallment.toLocaleString(undefined, { maximumFractionDigits: 0 })} / month
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Terms & Conditions</h3>
                <div className="space-y-2">
                  <Label htmlFor="terms">Additional Terms</Label>
                  <Textarea
                    id="terms"
                    placeholder="Any additional terms and conditions..."
                    rows={4}
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={createAgreementMutation.isPending || plotsLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {createAgreementMutation.isPending ? "Creating..." : "Create Sale Agreement"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
