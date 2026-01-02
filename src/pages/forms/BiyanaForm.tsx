import { useState } from "react";
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

const projects = ["Green Valley", "Lake View", "Palm Heights", "Sunset Gardens"];
const paymentMethods = ["Cash", "Bank Transfer", "Cheque", "Online"];

export default function BiyanaForm() {
  const [formData, setFormData] = useState({
    customerName: "",
    fatherName: "",
    cnic: "",
    phone: "",
    address: "",
    plotNo: "",
    project: "",
    biyanaAmount: "",
    paymentMethod: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Biyana Form Submitted",
      description: `Biyana recorded for ${formData.customerName} - Plot ${formData.plotNo}`,
    });
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
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      placeholder="Complete address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Property Information */}
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
                            {method}
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
                <Button type="submit" className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  Submit Biyana Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
