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
import { FileOutput, Loader2, Eye } from "lucide-react";

const ViewTransferForms = () => {
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { data: forms, isLoading } = useQuery({
    queryKey: ['transferForms'],
    queryFn: async () => {
      const response = await formsAPI.getTransferForms();
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileOutput className="h-8 w-8" />
              Transfer Forms
            </h1>
            <p className="text-muted-foreground">
              View all submitted Transfer forms
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
                No Transfer forms submitted yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transfer No</TableHead>
                      <TableHead>From (Seller)</TableHead>
                      <TableHead>To (Buyer)</TableHead>
                      <TableHead>Plot No</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Transfer Fee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forms.map((form: any) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">{form.transferNumber}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{form.fromCustomer?.name || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">{form.fromCustomer?.cnic || ''}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{form.toCustomer?.name || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">{form.toCustomer?.cnic || ''}</div>
                          </div>
                        </TableCell>
                        <TableCell>{form.plot?.plotNo || 'N/A'}</TableCell>
                        <TableCell>{form.plot?.project || 'N/A'}</TableCell>
                        <TableCell>{formatCurrency(form.transferFee)}</TableCell>
                        <TableCell>{formatDate(form.date)}</TableCell>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(form)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
              <DialogTitle>Transfer Form Details</DialogTitle>
              <DialogDescription>Complete information about the transfer form</DialogDescription>
            </DialogHeader>
            {selectedForm && (
              <div className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Transfer Number</label>
                      <p className="text-base font-semibold">{selectedForm.transferNumber}</p>
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
                    <h3 className="font-semibold mb-3">Seller Information (From)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Seller Name</label>
                        <p className="text-base">{selectedForm.fromCustomer?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Father's Name</label>
                        <p className="text-base">{selectedForm.fromCustomer?.fatherName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">CNIC</label>
                        <p className="text-base">{selectedForm.fromCustomer?.cnic || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="text-base">{selectedForm.fromCustomer?.phone || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">Address</label>
                        <p className="text-base">{selectedForm.fromCustomer?.address || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Buyer Information (To)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Buyer Name</label>
                        <p className="text-base">{selectedForm.toCustomer?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Father's Name</label>
                        <p className="text-base">{selectedForm.toCustomer?.fatherName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">CNIC</label>
                        <p className="text-base">{selectedForm.toCustomer?.cnic || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="text-base">{selectedForm.toCustomer?.phone || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">Address</label>
                        <p className="text-base">{selectedForm.toCustomer?.address || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Transfer Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Transfer Fee</label>
                        <p className="text-base font-semibold text-green-600">{formatCurrency(selectedForm.transferFee)}</p>
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
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ViewTransferForms;
