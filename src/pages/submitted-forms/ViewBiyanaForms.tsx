import { useState, useMemo } from "react";
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
import { FileText, Loader2, Eye, Printer } from "lucide-react";
import PrintableBiyanaFormSimple from "@/pages/forms/PrintableBiyanaFormSimple";
import { getUserData, isManager } from "@/lib/rbac";

const ViewBiyanaForms = () => {
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const userData = getUserData();
  const isManagerUser = isManager();
  
  const { data: forms, isLoading } = useQuery({
    queryKey: ['biyanaForms'],
    queryFn: async () => {
      const response = await formsAPI.getBiyanaForms();
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
  });

  // Filter forms based on user role
  const filteredForms = useMemo(() => {
    if (!forms) return [];
    
    // If manager, only show forms they created
    if (isManagerUser && userData) {
      return forms.filter((form: any) => form.createdById === userData.id);
    }
    
    // Admin sees all forms
    return forms;
  }, [forms, isManagerUser, userData]);

  const formatCurrency = (value: number) => {
    if (!value || isNaN(value)) return "Rs 0";
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

  const handlePrintForm = (form: any) => {
    const data = {
      customerName: form.customer?.name || "",
      fatherName: form.customer?.fatherName || "",
      cnic: form.customer?.cnic || "",
      phone: form.customer?.phone || "",
      address: form.customer?.address || "",
      plot: {
        plotNo: form.plot?.plotNo || "",
        project: form.plot?.project || "",
        size: formatSize(form.plot?.size || ""),
        block: form.plot?.block || "",
        price: form.plot?.price || 0,
      },
      biyanaAmount: form.biyanaAmount || 0,
      paymentMethod: form.paymentMethod || "",
      date: form.date || new Date().toISOString(),
      agreementNumber: form.id,
      status: form.status,
      approvedBy: form.approvedBy,
    };
    setPrintData(data);
    setIsPrintOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Biyana Forms
            </h1>
            <p className="text-muted-foreground">
              View all submitted Biyana forms
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
            ) : !filteredForms || filteredForms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No Biyana forms submitted yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form No</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>CNIC</TableHead>
                      <TableHead>Plot No</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredForms.map((form: any) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">{form.formNumber}</TableCell>
                        <TableCell>{form.customer?.name || 'N/A'}</TableCell>
                        <TableCell>{form.customer?.cnic || 'N/A'}</TableCell>
                        <TableCell>{form.plot?.plotNo || 'N/A'}</TableCell>
                        <TableCell>{form.plot?.project || 'N/A'}</TableCell>
                        <TableCell>{formatCurrency(form.biyanaAmount)}</TableCell>
                        <TableCell>{formatDate(form.date)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              form.status === 'APPROVED' ? 'default' : 
                              form.status === 'REJECTED' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {form.status || 'PENDING'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(form)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {form.status === 'APPROVED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrintForm(form)}
                                title="Print Form"
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
              <DialogTitle>Biyana Form Details</DialogTitle>
              <DialogDescription>Complete information about the submitted form</DialogDescription>
            </DialogHeader>
            {selectedForm && (
              <div className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Form Number</label>
                      <p className="text-base font-semibold">{selectedForm.formNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date</label>
                      <p className="text-base">{formatDate(selectedForm.date)}</p>
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
                    <h3 className="font-semibold mb-3">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
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
                        <label className="text-sm font-medium text-muted-foreground">Biyana Amount</label>
                        <p className="text-base font-semibold text-green-600">{formatCurrency(selectedForm.biyanaAmount)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                        <p className="text-base">{formatEnum(selectedForm.paymentMethod || '')}</p>
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
              <DialogTitle className="sr-only">Print Biyana Form</DialogTitle>
              <PrintableBiyanaFormSimple 
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

export default ViewBiyanaForms;
