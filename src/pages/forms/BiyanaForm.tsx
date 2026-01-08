import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "@/hooks/use-toast";
import { FileText, Save, Printer } from "lucide-react";
import { inventoryAPI, customerAPI, formsAPI } from "@/lib/api";

const paymentMethods = ["CASH", "BANK_TRANSFER", "CHEQUE", "ONLINE"];

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

export default function BiyanaForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    customerName: "",
    fatherName: "",
    cnic: "",
    phone: "",
    permanentAddress: "",
    currentAddress: "",
    plotId: "",
    biyanaAmount: "",
    paymentMethod: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [selectedPlot, setSelectedPlot] = useState<any>(null);

  // Fetch available plots
  const { data: availablePlots, isLoading: plotsLoading } = useQuery({
    queryKey: ['availablePlots'],
    queryFn: async () => {
      const response = await inventoryAPI.getAll({ status: 'AVAILABLE' });
      return response.data;
    },
  });

  // Create biyana mutation
  const createBiyanaMutation = useMutation({
    mutationFn: async (data: any) => {
      // First, create or get customer
      let customerId;
      try {
        // Try to find existing customer by CNIC
        const customersResponse = await customerAPI.getAll({ search: data.cnic });
        const existingCustomer = customersResponse.data.find((c: any) => c.cnic === data.cnic);
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create new customer
          const customerResponse = await customerAPI.create({
            name: data.customerName,
            fatherName: data.fatherName,
            cnic: data.cnic,
            phone: data.phone,
            address: data.permanentAddress || data.currentAddress,
          });
          customerId = customerResponse.data.id;
        }
      } catch (error) {
        throw new Error('Failed to create/find customer');
      }

      // Create biyana form
      const biyanaData = {
        customerId,
        plotId: data.plotId,
        biyanaAmount: parseFloat(data.biyanaAmount),
        paymentMethod: data.paymentMethod,
        date: new Date(data.date).toISOString(),
      };

      const response = await formsAPI.createBiyana(biyanaData);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Biyana Form Submitted",
        description: `Biyana recorded successfully. Plot status updated to Reserved.`,
      });
      queryClient.invalidateQueries({ queryKey: ['availablePlots'] });
      queryClient.invalidateQueries({ queryKey: ['unsoldInventory'] });
      queryClient.invalidateQueries({ queryKey: ['soldInventory'] });
      navigate('/inventory/unsold');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to submit Biyana form",
        variant: "destructive",
      });
    },
  });

  const handlePlotSelect = (plotId: string) => {
    const plot = availablePlots?.find((p: any) => p.id === plotId);
    setSelectedPlot(plot);
    setFormData({ ...formData, plotId });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBiyanaMutation.mutate(formData);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Biyana Form</h1>
            <p className="text-muted-foreground">
              Record advance payment and update inventory status
            </p>
          </div>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Form
          </Button>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Biyana Details</CardTitle>
                <CardDescription>This will automatically update inventory status to reserved</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Property Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Property Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="plotId">Plot Number *</Label>
                    <Select
                      value={formData.plotId}
                      onValueChange={handlePlotSelect}
                      disabled={plotsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={plotsLoading ? "Loading plots..." : "Select available plot"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlots?.map((plot: any) => (
                          <SelectItem key={plot.id} value={plot.id}>
                            {plot.plotNo} - {formatEnum(plot.project)} ({formatSize(plot.size)})
                          </SelectItem>
                        ))}
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
                        <Label>Price (PKR)</Label>
                        <Input value={selectedPlot.price.toLocaleString()} disabled className="bg-muted" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Customer Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input
                      id="customerName"
                      placeholder="Full name"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father's Name *</Label>
                    <Input
                      id="fatherName"
                      placeholder="Father's name"
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
                    <Label htmlFor="permanentAddress">Permanent Address *</Label>
                    <Input
                      id="permanentAddress"
                      placeholder="Complete permanent address"
                      value={formData.permanentAddress}
                      onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="currentAddress">Current Address</Label>
                    <Input
                      id="currentAddress"
                      placeholder="Current address (if different)"
                      value={formData.currentAddress}
                      onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Payment Information</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="biyanaAmount">Biyana Amount (PKR) *</Label>
                    <Input
                      id="biyanaAmount"
                      type="number"
                      placeholder="Amount in PKR"
                      value={formData.biyanaAmount}
                      onChange={(e) => setFormData({ ...formData, biyanaAmount: e.target.value })}
                      required
                    />
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
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={createBiyanaMutation.isPending || plotsLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {createBiyanaMutation.isPending ? "Submitting..." : "Submit Biyana Form"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
