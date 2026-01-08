import { useState, useEffect } from "react";
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
import { FileOutput, Save, Printer, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryAPI, customerAPI, formsAPI } from "@/lib/api";

const transferReasons = ["Sale to Third Party", "Inheritance", "Gift", "Court Order", "Other"];

export default function TransferForm() {
  const queryClient = useQueryClient();
  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [fromCustomerId, setFromCustomerId] = useState("");
  const [toCustomerId, setToCustomerId] = useState("");
  
  const [formData, setFormData] = useState({
    // Property
    plotId: "",
    // Transfer Details
    transferReason: "",
    transferAmount: "",
    transferFee: "",
    date: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  // New owner form data
  const [newOwnerData, setNewOwnerData] = useState({
    name: "",
    fatherName: "",
    cnic: "",
    phone: "",
    address: "",
  });

  // Fetch sold plots (plots that have owners)
  const { data: plotsData } = useQuery({
    queryKey: ['soldPlots'],
    queryFn: async () => {
      const response = await inventoryAPI.getAll({ status: 'SOLD' });
      return response.data;
    },
  });

  // Handle plot selection
  const handlePlotSelect = async (plotId: string) => {
    setFormData({ ...formData, plotId });
    
    const plot = plotsData?.find((p: any) => p.id === plotId);
    setSelectedPlot(plot);
    
    // Fetch current owner (buyer) details
    if (plot?.buyerId) {
      setFromCustomerId(plot.buyerId);
    }
  };

  // Fetch current owner details
  const { data: currentOwner } = useQuery({
    queryKey: ['customer', fromCustomerId],
    queryFn: async () => {
      if (!fromCustomerId) return null;
      const response = await customerAPI.getById(fromCustomerId);
      return response.data;
    },
    enabled: !!fromCustomerId,
  });

  // Create transfer mutation
  const createTransferMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await formsAPI.createTransfer(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferForms'] });
      queryClient.invalidateQueries({ queryKey: ['soldPlots'] });
      toast({
        title: "Transfer Form Submitted",
        description: "Transfer form has been submitted successfully and is pending approval.",
      });
      // Reset form
      setFormData({
        plotId: "",
        transferReason: "",
        transferAmount: "",
        transferFee: "",
        date: new Date().toISOString().split("T")[0],
        remarks: "",
      });
      setNewOwnerData({
        name: "",
        fatherName: "",
        cnic: "",
        phone: "",
        address: "",
      });
      setSelectedPlot(null);
      setFromCustomerId("");
      setToCustomerId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit transfer form",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromCustomerId) {
      toast({
        title: "Error",
        description: "Please select a plot with a current owner",
        variant: "destructive",
      });
      return;
    }

    // First, create or find the new owner customer
    try {
      let newOwnerId = toCustomerId;
      
      // Check if customer exists by CNIC
      const existingCustomers = await customerAPI.getAll({ search: newOwnerData.cnic });
      const existingCustomer = existingCustomers.data.find((c: any) => c.cnic === newOwnerData.cnic);
      
      if (existingCustomer) {
        newOwnerId = existingCustomer.id;
        setToCustomerId(existingCustomer.id);
      } else {
        // Create new customer
        const newCustomer = await customerAPI.create(newOwnerData);
        newOwnerId = newCustomer.data.id;
        setToCustomerId(newCustomer.data.id);
      }

      // Create transfer form
      const transferData = {
        plotId: formData.plotId,
        fromCustomerId: fromCustomerId,
        toCustomerId: newOwnerId,
        transferAmount: parseFloat(formData.transferAmount) || 0,
        transferFee: parseFloat(formData.transferFee) || 0,
        date: formData.date,
        remarks: formData.remarks,
      };

      createTransferMutation.mutate(transferData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to process transfer",
        variant: "destructive",
      });
    }
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
            <h1 className="text-3xl font-bold tracking-tight">Transfer Form</h1>
            <p className="text-muted-foreground">
              Transfer property ownership from one party to another
            </p>
          </div>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Form
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This form will update ownership records. Please ensure all information is accurate before submission.
          </AlertDescription>
        </Alert>

        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-warning/10 p-3">
                <FileOutput className="h-6 w-6 text-warning" />
              </div>
              <div>
                <CardTitle>Transfer Details</CardTitle>
                <CardDescription>Complete all sections for property transfer</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Property Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Property Information</h3>
                <div className="grid gap-4 md:grid-cols-1">
                  <div className="space-y-2">
                    <Label htmlFor="plotId">Select Plot *</Label>
                    <Select
                      value={formData.plotId}
                      onValueChange={handlePlotSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a sold plot to transfer" />
                      </SelectTrigger>
                      <SelectContent>
                        {plotsData?.map((plot: any) => (
                          <SelectItem key={plot.id} value={plot.id}>
                            {plot.plotNo} - {formatEnum(plot.project)} - {formatEnum(plot.size)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedPlot && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Plot Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Plot No:</span> {selectedPlot.plotNo}</div>
                        <div><span className="text-muted-foreground">Project:</span> {formatEnum(selectedPlot.project)}</div>
                        <div><span className="text-muted-foreground">Block:</span> {selectedPlot.block}</div>
                        <div><span className="text-muted-foreground">Size:</span> {formatEnum(selectedPlot.size)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Owner - Auto-populated */}
              {currentOwner && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Current Owner Information</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label className="text-muted-foreground">Owner Name</Label>
                        <p className="font-medium">{currentOwner.name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Father's Name</Label>
                        <p className="font-medium">{currentOwner.fatherName}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">CNIC</Label>
                        <p className="font-medium">{currentOwner.cnic}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Phone</Label>
                        <p className="font-medium">{currentOwner.phone}</p>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-muted-foreground">Address</Label>
                        <p className="font-medium">{currentOwner.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* New Owner */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">New Owner Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newOwnerName">New Owner Name *</Label>
                    <Input
                      id="newOwnerName"
                      placeholder="New owner's full name"
                      value={newOwnerData.name}
                      onChange={(e) => setNewOwnerData({ ...newOwnerData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newOwnerFatherName">Father's Name *</Label>
                    <Input
                      id="newOwnerFatherName"
                      placeholder="Father's name"
                      value={newOwnerData.fatherName}
                      onChange={(e) => setNewOwnerData({ ...newOwnerData, fatherName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newOwnerCnic">CNIC *</Label>
                    <Input
                      id="newOwnerCnic"
                      placeholder="00000-0000000-0"
                      value={newOwnerData.cnic}
                      onChange={(e) => setNewOwnerData({ ...newOwnerData, cnic: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newOwnerPhone">Phone *</Label>
                    <Input
                      id="newOwnerPhone"
                      placeholder="+92 300 0000000"
                      value={newOwnerData.phone}
                      onChange={(e) => setNewOwnerData({ ...newOwnerData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="newOwnerAddress">Complete Address *</Label>
                    <Textarea
                      id="newOwnerAddress"
                      placeholder="New owner's complete address"
                      value={newOwnerData.address}
                      onChange={(e) => setNewOwnerData({ ...newOwnerData, address: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Transfer Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Transfer Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="transferAmount">Transfer Amount (PKR) *</Label>
                    <Input
                      id="transferAmount"
                      type="number"
                      placeholder="Enter transfer/sale amount"
                      value={formData.transferAmount}
                      onChange={(e) => setFormData({ ...formData, transferAmount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transferFee">Transfer Fee (PKR) *</Label>
                    <Input
                      id="transferFee"
                      type="number"
                      placeholder="Enter transfer fee"
                      value={formData.transferFee}
                      onChange={(e) => setFormData({ ...formData, transferFee: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Transfer Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Any additional remarks..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={createTransferMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createTransferMutation.isPending ? "Submitting..." : "Submit Transfer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
