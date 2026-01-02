import { useState } from "react";
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

const projects = ["Green Valley", "Lake View", "Palm Heights", "Sunset Gardens"];
const transferReasons = ["Sale to Third Party", "Inheritance", "Gift", "Court Order", "Other"];

export default function TransferForm() {
  const [formData, setFormData] = useState({
    // Current Owner
    currentOwnerName: "",
    currentOwnerCnic: "",
    currentOwnerPhone: "",
    // New Owner
    newOwnerName: "",
    newOwnerFatherName: "",
    newOwnerCnic: "",
    newOwnerPhone: "",
    newOwnerAddress: "",
    // Property
    plotNo: "",
    project: "",
    // Transfer Details
    transferReason: "",
    transferAmount: "",
    transferDate: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Transfer Form Submitted",
      description: `Transfer initiated for Plot ${formData.plotNo} to ${formData.newOwnerName}.`,
    });
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
              {/* Current Owner */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Current Owner Information</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="currentOwnerName">Owner Name *</Label>
                    <Input
                      id="currentOwnerName"
                      placeholder="Current owner's name"
                      value={formData.currentOwnerName}
                      onChange={(e) => setFormData({ ...formData, currentOwnerName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentOwnerCnic">CNIC *</Label>
                    <Input
                      id="currentOwnerCnic"
                      placeholder="00000-0000000-0"
                      value={formData.currentOwnerCnic}
                      onChange={(e) => setFormData({ ...formData, currentOwnerCnic: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentOwnerPhone">Phone *</Label>
                    <Input
                      id="currentOwnerPhone"
                      placeholder="+92 300 0000000"
                      value={formData.currentOwnerPhone}
                      onChange={(e) => setFormData({ ...formData, currentOwnerPhone: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Property */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Property Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="project">Project *</Label>
                    <Select
                      value={formData.project}
                      onValueChange={(value) => setFormData({ ...formData, project: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project} value={project}>
                            {project}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plotNo">Plot Number *</Label>
                    <Input
                      id="plotNo"
                      placeholder="e.g., A-101"
                      value={formData.plotNo}
                      onChange={(e) => setFormData({ ...formData, plotNo: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* New Owner */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">New Owner Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newOwnerName">New Owner Name *</Label>
                    <Input
                      id="newOwnerName"
                      placeholder="New owner's full name"
                      value={formData.newOwnerName}
                      onChange={(e) => setFormData({ ...formData, newOwnerName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newOwnerFatherName">Father's Name *</Label>
                    <Input
                      id="newOwnerFatherName"
                      placeholder="Father's name"
                      value={formData.newOwnerFatherName}
                      onChange={(e) => setFormData({ ...formData, newOwnerFatherName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newOwnerCnic">CNIC *</Label>
                    <Input
                      id="newOwnerCnic"
                      placeholder="00000-0000000-0"
                      value={formData.newOwnerCnic}
                      onChange={(e) => setFormData({ ...formData, newOwnerCnic: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newOwnerPhone">Phone *</Label>
                    <Input
                      id="newOwnerPhone"
                      placeholder="+92 300 0000000"
                      value={formData.newOwnerPhone}
                      onChange={(e) => setFormData({ ...formData, newOwnerPhone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="newOwnerAddress">Complete Address *</Label>
                    <Textarea
                      id="newOwnerAddress"
                      placeholder="New owner's complete address"
                      value={formData.newOwnerAddress}
                      onChange={(e) => setFormData({ ...formData, newOwnerAddress: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Transfer Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Transfer Details</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="transferReason">Reason for Transfer *</Label>
                    <Select
                      value={formData.transferReason}
                      onValueChange={(value) => setFormData({ ...formData, transferReason: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {transferReasons.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transferAmount">Transfer Amount (PKR)</Label>
                    <Input
                      id="transferAmount"
                      type="number"
                      placeholder="Amount if applicable"
                      value={formData.transferAmount}
                      onChange={(e) => setFormData({ ...formData, transferAmount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transferDate">Transfer Date *</Label>
                    <Input
                      id="transferDate"
                      type="date"
                      value={formData.transferDate}
                      onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
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
                <Button type="submit" className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  Submit Transfer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
