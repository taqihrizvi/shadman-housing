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
import { useTranslation } from 'react-i18next';

const ViewTransferForms = () => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Helper function to format project names
  const formatProjectName = (value: string) => {
    if (value === 'SHADMAN_GREENS') {
      return t('projects.shadmanGreens');
    }
    return value;
  };

  // Helper function to get status display and styling
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return {
          label: t('status.approved'),
          className: "bg-blue-50 text-blue-700 border-blue-200"
        };
      case 'COMPLETED':
        return {
          label: t('status.completed') || 'Completed',
          className: "bg-green-50 text-green-700 border-green-200"
        };
      case 'REJECTED':
        return {
          label: t('status.rejected') || 'Rejected',
          className: "bg-red-50 text-red-700 border-red-200"
        };
      case 'PENDING':
      default:
        return {
          label: t('status.pending'),
          className: "bg-yellow-50 text-yellow-700 border-yellow-200"
        };
    }
  };
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
      <div className="space-y-6" dir={isUrdu ? 'rtl' : 'ltr'}>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileOutput className="h-8 w-8" />
              {t('forms.transferForm')}
            </h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('forms.submittedForms')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !forms || forms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('forms.noTransferForms')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('forms.transferNo')}</TableHead>
                      <TableHead>{t('forms.from')}</TableHead>
                      <TableHead>{t('forms.to')}</TableHead>
                      <TableHead>{t('inventory.plotNo')}</TableHead>
                      <TableHead>{t('inventory.project')}</TableHead>
                      <TableHead>{t('forms.transferFee')}</TableHead>
                      <TableHead>{t('forms.date')}</TableHead>
                      <TableHead>{t('forms.status')}</TableHead>
                      <TableHead>{t('forms.actions')}</TableHead>
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
                        <TableCell>{formatProjectName(form.plot?.project || 'N/A')}</TableCell>
                        <TableCell>{formatCurrency(form.transferFee)}</TableCell>
                        <TableCell>{formatDate(form.transferDate)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getStatusInfo(form.status).className}
                          >
                            {getStatusInfo(form.status).label}
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
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir={isUrdu ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle>{t('forms.transferFormDetails')}</DialogTitle>
              <DialogDescription>{t('forms.completeInfoTransfer')}</DialogDescription>
            </DialogHeader>
            {selectedForm && (
              <div className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('forms.transferNumber')}</label>
                      <p className="text-base font-semibold">{selectedForm.transferNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('forms.date')}</label>
                      <p className="text-base">{formatDate(selectedForm.transferDate)}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">{t('forms.propertyInfo')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('inventory.plotNo')}</label>
                        <p className="text-base">{selectedForm.plot?.plotNo || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('inventory.project')}</label>
                        <p className="text-base">{formatProjectName(selectedForm.plot?.project || '')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('inventory.block')}</label>
                        <p className="text-base">{selectedForm.plot?.block || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('inventory.size')}</label>
                        <p className="text-base">{formatSize(selectedForm.plot?.size || '')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">{t('forms.fromCustomerInfo')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('forms.customerName')}</label>
                        <p className="text-base">{selectedForm.fromCustomer?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('forms.fatherName')}</label>
                        <p className="text-base">{selectedForm.fromCustomer?.fatherName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('customers.cnic')}</label>
                        <p className="text-base">{selectedForm.fromCustomer?.cnic || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('customers.phone')}</label>
                        <p className="text-base">{selectedForm.fromCustomer?.phone || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">{t('forms.address')}</label>
                        <p className="text-base">{selectedForm.fromCustomer?.address || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">{t('forms.toCustomerInfo')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('forms.customerName')}</label>
                        <p className="text-base">{selectedForm.toCustomer?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('forms.fatherName')}</label>
                        <p className="text-base">{selectedForm.toCustomer?.fatherName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('customers.cnic')}</label>
                        <p className="text-base">{selectedForm.toCustomer?.cnic || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('customers.phone')}</label>
                        <p className="text-base">{selectedForm.toCustomer?.phone || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">{t('forms.address')}</label>
                        <p className="text-base">{selectedForm.toCustomer?.address || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">{t('forms.transferDetails')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('forms.transferFee')}</label>
                        <p className="text-base font-semibold text-green-600">{formatCurrency(selectedForm.transferFee)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('forms.status')}</label>
                        <Badge 
                          variant="outline" 
                          className={getStatusInfo(selectedForm.status).className}
                        >
                          {getStatusInfo(selectedForm.status).label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {selectedForm.remarks && (
                    <div className="border-t pt-4">
                      <label className="text-sm font-medium text-muted-foreground">{t('forms.remarks')}</label>
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
