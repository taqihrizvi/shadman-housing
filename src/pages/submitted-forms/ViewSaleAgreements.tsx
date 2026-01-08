import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formsAPI } from "@/lib/api";
import { FileSignature, Loader2, Eye, Printer } from "lucide-react";
import PrintableSaleAgreementForm from "@/pages/forms/PrintableSaleAgreementForm";

const ViewSaleAgreements = () => {
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const { data: forms, isLoading } = useQuery({
    queryKey: ['saleAgreements'],
    queryFn: async () => {
      const response = await formsAPI.getSaleAgreements();
      return response.data;
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPaymentPlan = (installmentMonths: number) => {
    if (installmentMonths === 0) return "Full Payment";
    return `${installmentMonths} Months Installment`;
  };

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

  const handleViewDetails = (form: any) => {
    setSelectedForm(form);
    setIsDetailsOpen(true);
  };

  const handlePrintForm = async (form: any) => {
    try {
      const response = await formsAPI.getSaleAgreementById(form.id);
      setPrintData(response.data);
      setIsPrintOpen(true);
    } catch (error) {
      console.error('Error fetching form details:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileSignature className="h-8 w-8" />
              Sale Agreements
            </h1>
            <p className="text-muted-foreground">
              View all submitted Sale Agreement forms
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submitted Forms</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !forms || forms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No Sale Agreement forms submitted yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agreement No</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>CNIC</TableHead>
                      <TableHead>Plot No</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Down Payment</TableHead>
                      <TableHead>Payment Plan</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forms.map((form: any) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">{form.agreementNumber}</TableCell>
                        <TableCell>{form.customer?.name || 'N/A'}</TableCell>
                        <TableCell>{form.customer?.cnic || 'N/A'}</TableCell>
                        <TableCell>{form.plot?.plotNo || 'N/A'}</TableCell>
                        <TableCell>{form.plot?.project || 'N/A'}</TableCell>
                        <TableCell>{formatCurrency(form.totalAmount)}</TableCell>
                        <TableCell>{formatCurrency(form.downPayment)}</TableCell>
                        <TableCell>{formatPaymentPlan(form.installmentMonths)}</TableCell>
                        <TableCell>{formatDate(form.agreementDate)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              form.status === 'APPROVED'
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200"
                            }
                          >
                            {form.status === 'APPROVED' ? 'Approved' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(form)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {form.status === 'APPROVED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrintForm(form)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sale Agreement Details</DialogTitle>
              <DialogDescription>Complete information about the sale agreement</DialogDescription>
            </DialogHeader>
            {selectedForm && (
              <div className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Agreement Number</label>
                      <p className="text-base font-semibold">{selectedForm.agreementNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date</label>
                      <p className="text-base">{formatDate(selectedForm.agreementDate)}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Property Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Plot Number</label>
                        <p className="text-base">{selectedForm.plot?.plotNo || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Project</label>
                        <p className="text-base">{formatEnum(selectedForm.plot?.project || '')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Block</label>
                        <p className="text-base">{selectedForm.plot?.block || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Size</label>
                        <p className="text-base">{formatSize(selectedForm.plot?.size || '')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Buyer Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Buyer Name</label>
                        <p className="text-base">{selectedForm.customer?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Father's Name</label>
                        <p className="text-base">{selectedForm.customer?.fatherName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">CNIC</label>
                        <p className="text-base">{selectedForm.customer?.cnic || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="text-base">{selectedForm.customer?.phone || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">Address</label>
                        <p className="text-base">{selectedForm.customer?.address || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Payment Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                        <p className="text-base font-semibold">{formatCurrency(selectedForm.totalAmount)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Down Payment</label>
                        <p className="text-base">{formatCurrency(selectedForm.downPayment)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Payment Plan</label>
                        <p className="text-base">{formatPaymentPlan(selectedForm.installmentMonths)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <Badge 
                          variant="outline" 
                          className={
                            selectedForm.status === 'APPROVED'
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200"
                          }
                        >
                          {selectedForm.status === 'APPROVED' ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {selectedForm.remarks && (
                    <div className="border-t pt-4">
                      <label className="text-sm font-medium text-muted-foreground">Remarks</label>
                      <p className="text-base">{selectedForm.remarks}</p>
                    </div>
                  )}

                  <div className="border-t pt-4 flex gap-2">
                    <Button onClick={() => handlePrintForm(selectedForm)} className="flex-1">
                      <Printer className="mr-2 h-4 w-4" />
                      Print Form
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Print Dialog */}
        {isPrintOpen && printData && (
          <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
              <DialogTitle className="sr-only">Print Sale Agreement</DialogTitle>
              <PrintableSaleAgreementForm 
                data={printData} 
                onClose={() => setIsPrintOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewSaleAgreements;
