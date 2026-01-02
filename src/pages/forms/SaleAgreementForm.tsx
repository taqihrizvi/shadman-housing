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
import { FileSignature, Save, Printer } from "lucide-react";

const projects = ["Green Valley", "Lake View", "Palm Heights", "Sunset Gardens"];
const paymentPlans = ["Full Payment", "Installment - 12 Months", "Installment - 24 Months", "Installment - 36 Months"];

export default function SaleAgreementForm() {
  const [formData, setFormData] = useState({
    customerName: "",
    fatherName: "",
    cnic: "",
    phone: "",
    address: "",
    plotNo: "",
    project: "",
    plotSize: "",
    totalPrice: "",
    downPayment: "",
    paymentPlan: "",
    agreementDate: new Date().toISOString().split("T")[0],
    terms: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Sale Agreement Created",
      description: `Agreement for ${formData.customerName} - Plot ${formData.plotNo} has been created.`,
    });
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
                <CardDescription>Complete all sections to generate the sale agreement</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
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

              {/* Property Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Property Details</h3>
                <div className="grid gap-4 md:grid-cols-3">
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
                  <div className="space-y-2">
                    <Label htmlFor="plotSize">Plot Size *</Label>
                    <Input
                      id="plotSize"
                      placeholder="e.g., 5 Marla"
                      value={formData.plotSize}
                      onChange={(e) => setFormData({ ...formData, plotSize: e.target.value })}
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
                            {plan}
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
                <Button type="submit" className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  Create Sale Agreement
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
