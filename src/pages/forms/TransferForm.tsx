import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { FileOutput, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryAPI, customerAPI, formsAPI } from "@/lib/api";
import { voucherAPI } from "@/lib/api";
import { useTranslation } from 'react-i18next';
import { toTitleCase } from "@/lib/utils";

export default function TransferForm() {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [fromCustomerId, setFromCustomerId] = useState("");
  const [toCustomerId, setToCustomerId] = useState("");
  const [totalPaidAmount, setTotalPaidAmount] = useState<number>(0);
  const [validationError, setValidationError] = useState<string>("");

  const [formData, setFormData] = useState({
    // Property
    plotId: "",
    // Transfer Details
    transferType: "GENERAL",
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

  // Fetch vouchers for selected plot
  const { data: vouchersData } = useQuery({
    queryKey: ['vouchers', selectedPlot?.id],
    queryFn: async () => {
      if (!selectedPlot?.id) return [];
      const response = await voucherAPI.getAll({ plotId: selectedPlot.id });
      return response.data;
    },
    enabled: !!selectedPlot?.id,
  });

  // Fetch biyana forms
  const { data: biyanaForms } = useQuery({
    queryKey: ['biyanaForms'],
    queryFn: async () => {
      const response = await formsAPI.getBiyanaForms();
      return response.data;
    },
  });

  // Fetch sale agreements to get down payment
  const { data: saleAgreements } = useQuery({
    queryKey: ['saleAgreements'],
    queryFn: async () => {
      const response = await formsAPI.getSaleAgreements();
      // Filter out archived agreements
      return response.data.filter((agreement: any) => !agreement.isArchived);
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

    // Calculate total paid amount (biyana token + down payment + approved installment vouchers)
    if (plot) {
      let totalPaid = 0;

      // Get biyana token amount for this plot (approved only)
      const plotBiyana = biyanaForms?.find((b: any) =>
        b.plotId === plotId &&
        b.status === 'APPROVED'
      );
      const biyanaTokenAmount = plotBiyana?.tokenAmount || 0;

      // Get sale agreement down payment (approved only)
      const plotAgreement = saleAgreements?.find((a: any) =>
        a.plotId === plotId &&
        a.isActive &&
        a.status === 'APPROVED'
      );

      // Validate that plot has an approved sale agreement
      if (!plotAgreement) {
        toast({
          title: "Cannot Transfer Plot",
          description: "This plot does not have an approved sale agreement. A sale agreement must be created and approved before the plot can be transferred.",
          variant: "destructive",
        });
        setSelectedPlot(null);
        setFormData({ ...formData, plotId: "" });
        return;
      }

      const downPayment = plotAgreement?.downPayment || 0;

      // Get approved installment vouchers for this plot (INSTALLMENT or QUARTERLY formType only)
      const plotVouchers = vouchersData || [];
      const approvedInstallmentVouchers = plotVouchers.filter((v: any) =>
        v.status === 'APPROVED' &&
        (v.formType === 'INSTALLMENT' || v.formType === 'QUARTERLY')
      );
      const installmentTotal = approvedInstallmentVouchers.reduce((sum: number, v: any) => sum + (v.amount || 0), 0);

      totalPaid = biyanaTokenAmount + downPayment + installmentTotal;
      setTotalPaidAmount(totalPaid);

      console.log('Total Paid Calculation:', {
        biyanaToken: biyanaTokenAmount,
        downPayment: downPayment,
        installmentVouchers: installmentTotal,
        voucherCount: approvedInstallmentVouchers.length,
        total: totalPaid,
        hasSaleAgreement: !!plotAgreement,
        hasBiyana: !!plotBiyana
      });
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

  // Auto-fill transfer amount when totalPaidAmount is calculated
  useEffect(() => {
    if (totalPaidAmount > 0 && !formData.transferAmount) {
      setFormData(prev => ({ ...prev, transferAmount: totalPaidAmount.toString() }));
    }
  }, [totalPaidAmount]);

  // Create transfer mutation
  const createTransferMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await formsAPI.createTransfer(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferForms'] });
      queryClient.invalidateQueries({ queryKey: ['soldPlots'] });
      setValidationError(""); // Clear any previous errors
      toast({
        title: "Transfer Form Submitted",
        description: "Transfer form has been submitted successfully and is pending approval.",
      });

      // Reset form
      setFormData({
        plotId: "",
        transferType: "GENERAL",
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

      // Redirect to approvals page
      navigate('/approvals');
    },
    onError: (error: any) => {
      const errorMessage = error.message || error.response?.data?.message || "Failed to submit transfer form";
      setValidationError(errorMessage);
      toast({
        title: "Error Submitting Transfer Form",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(""); // Clear previous errors

    if (!fromCustomerId) {
      const errorMsg = "Please select a plot with a current owner";
      setValidationError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // Validate CNIC format
    if (!/^\d{13}$/.test(newOwnerData.cnic)) {
      const errorMsg = "CNIC must be exactly 13 digits";
      setValidationError(errorMsg);
      toast({
        title: "Invalid CNIC",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // Validate phone format
    if (!/^\d{1,11}$/.test(newOwnerData.phone)) {
      const errorMsg = "Phone number must be 1-11 digits only";
      setValidationError(errorMsg);
      toast({
        title: "Invalid Phone Number",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // Check if trying to transfer to same person
    if (currentOwner && currentOwner.cnic === newOwnerData.cnic) {
      const errorMsg = "Transferor and Transferee cannot be the same person";
      setValidationError(errorMsg);
      toast({
        title: "Invalid Transfer",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // Validate transfer amount equals total paid amount
    const transferAmount = parseFloat(formData.transferAmount) || 0;
    if (transferAmount !== totalPaidAmount) {
      const errorMsg = `Transfer amount (Rs ${transferAmount.toLocaleString()}) must exactly equal the total amount paid for this plot (Rs ${totalPaidAmount.toLocaleString()})`;
      setValidationError(errorMsg);
      toast({
        title: "Invalid Transfer Amount",
        description: errorMsg,
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
        transferType: formData.transferType,
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

  const formatSize = (size: string) => {
    if (!size) return "";
    const sizeMap: Record<string, string> = {
      FIVE_MARLA: "5 Marla",
      SEVEN_MARLA: "7 Marla",
      TEN_MARLA: "10 Marla",
      ONE_KANAL: "1 Kanal",
      TWO_KANAL: "2 Kanal",
    };
    return sizeMap[size] || formatEnum(size);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl" dir={isUrdu ? 'rtl' : 'ltr'}>
        {/* Info Alert */}
        <div className="bg-blue-50 text-blue-900 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <div className="mt-0.5">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm">
            {isUrdu ? 'فارم جمع کروانے سے پہلے تمام معلومات کی درستگی کی تصدیق یقینی بنائیں' : 'Please ensure to verify all information before submitting the form'}
          </p>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('forms.transferForm')}</h1>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Only SOLD plots with approved sale agreements can be transferred. The plot must have a completed sale agreement before transfer can be initiated.
          </AlertDescription>
        </Alert>

        {/* Validation Error Display */}
        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {validationError}
            </AlertDescription>
          </Alert>
        )}

        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-warning/10 p-3">
                <FileOutput className="h-6 w-6 text-warning" />
              </div>
              <div>
                <CardTitle>{t('forms.transferForm')}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Property Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">{t('forms.propertyDetails')}</h3>
                <div className="grid gap-4 md:grid-cols-1">
                  <div className="space-y-2">
                    <Label htmlFor="plotId">{t('inventory.plotNo')} *</Label>
                    <Select
                      value={formData.plotId}
                      onValueChange={handlePlotSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('forms.selectPlot')} />
                      </SelectTrigger>
                      <SelectContent>
                        {plotsData?.map((plot: any) => (
                          <SelectItem key={plot.id} value={plot.id}>
                            {plot.plotNo} - {formatEnum(plot.project)} - {formatSize(plot.size)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedPlot && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">{t('forms.plotDetails')}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">{t('inventory.plotNo')}:</span> {selectedPlot.plotNo}</div>
                        <div><span className="text-muted-foreground">{t('inventory.project')}:</span> {formatEnum(selectedPlot.project)}</div>
                        <div><span className="text-muted-foreground">{t('inventory.block')}:</span> {selectedPlot.block}</div>
                        <div><span className="text-muted-foreground">{t('inventory.size')}:</span> {formatSize(selectedPlot.size)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Owner - Auto-populated */}
              {currentOwner && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">{t('forms.currentOwner')}</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label className="text-muted-foreground">{t('forms.customerName')}</Label>
                        <p className="font-medium">{currentOwner.name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t('forms.fatherName')}</Label>
                        <p className="font-medium">{currentOwner.fatherName}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t('forms.cnicNumber')}</Label>
                        <p className="font-medium">{currentOwner.cnic}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t('forms.phoneNumber')}</Label>
                        <p className="font-medium">{currentOwner.phone}</p>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-muted-foreground">{t('forms.address')}</Label>
                        <p className="font-medium">{currentOwner.address}</p>
                      </div>
                      {totalPaidAmount > 0 && (
                        <div className="md:col-span-2 mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <Label className="text-sm font-semibold text-blue-900">Total Amount Paid by Current Owner</Label>
                          <p className="text-2xl font-bold text-blue-600 mt-1">Rs {totalPaidAmount.toLocaleString()}</p>
                          <p className="text-xs text-blue-700 mt-2">Transfer amount must equal this exact amount</p>

                          {/* Payment Breakdown */}
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs font-semibold text-blue-900 mb-2">Payment Breakdown:</p>
                            <div className="space-y-1 text-xs text-blue-800">
                              {(() => {
                                const plotBiyana = biyanaForms?.find((b: any) =>
                                  b.plotId === formData.plotId && b.status === 'APPROVED'
                                );
                                const plotAgreement = saleAgreements?.find((a: any) =>
                                  a.plotId === formData.plotId && a.isActive && a.status === 'APPROVED'
                                );
                                const plotVouchers = vouchersData || [];
                                const approvedInstallmentVouchers = plotVouchers.filter((v: any) =>
                                  v.status === 'APPROVED' &&
                                  (v.formType === 'INSTALLMENT' || v.formType === 'QUARTERLY')
                                );
                                const installmentTotal = approvedInstallmentVouchers.reduce((sum: number, v: any) => sum + (v.amount || 0), 0);

                                return (
                                  <>
                                    <div className="flex justify-between">
                                      <span>• Biyana Token:</span>
                                      <span className="font-medium">Rs {(plotBiyana?.tokenAmount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>• Down Payment:</span>
                                      <span className="font-medium">Rs {(plotAgreement?.downPayment || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>• Installments Paid ({approvedInstallmentVouchers.length} vouchers):</span>
                                      <span className="font-medium">Rs {installmentTotal.toLocaleString()}</span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* New Owner */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">{t('forms.newOwner')}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newOwnerName">{t('forms.customerName')} *</Label>
                    <Input
                      id="newOwnerName"
                      placeholder={t('forms.customerName')}
                      value={newOwnerData.name}
                      onChange={(e) => setNewOwnerData({ ...newOwnerData, name: toTitleCase(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newOwnerFatherName">{t('forms.fatherName')} *</Label>
                    <Input
                      id="newOwnerFatherName"
                      placeholder={t('forms.fatherName')}
                      value={newOwnerData.fatherName}
                      onChange={(e) => setNewOwnerData({ ...newOwnerData, fatherName: toTitleCase(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newOwnerCnic">{t('forms.cnicNumber')} *</Label>
                    <Input
                      id="newOwnerCnic"
                      placeholder="0000000000000 (13 digits)"
                      value={newOwnerData.cnic}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                        if (value.length <= 13) {
                          setNewOwnerData({ ...newOwnerData, cnic: value });
                        }
                      }}
                      className={newOwnerData.cnic && !/^\d{13}$/.test(newOwnerData.cnic) ? "border-red-500" : ""}
                      required
                    />
                    {newOwnerData.cnic && !/^\d{13}$/.test(newOwnerData.cnic) && (
                      <p className="text-xs text-red-500">CNIC must be exactly 13 digits</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newOwnerPhone">{t('forms.phoneNumber')} *</Label>
                    <Input
                      id="newOwnerPhone"
                      placeholder="03001234567 (max 11 digits)"
                      value={newOwnerData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                        if (value.length <= 11) {
                          setNewOwnerData({ ...newOwnerData, phone: value });
                        }
                      }}
                      className={newOwnerData.phone && !/^\d{1,11}$/.test(newOwnerData.phone) ? "border-red-500" : ""}
                      required
                    />
                    {newOwnerData.phone && !/^\d{1,11}$/.test(newOwnerData.phone) && (
                      <p className="text-xs text-red-500">Phone number must be 1-11 digits only</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="newOwnerAddress">{t('forms.address')} *</Label>
                    <Textarea
                      id="newOwnerAddress"
                      placeholder={t('forms.address')}
                      value={newOwnerData.address}
                      onChange={(e) => setNewOwnerData({ ...newOwnerData, address: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Transfer Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">{t('forms.transferDetails')}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="transferType">{t('forms.transferType')} *</Label>
                    <Select
                      value={formData.transferType}
                      onValueChange={(value) => setFormData({ ...formData, transferType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('forms.selectTransferType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL">{t('forms.generalTransfer')}</SelectItem>
                        <SelectItem value="DEATH">{t('forms.deathTransfer')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transferAmount">{t('forms.transferAmount')} (PKR) *</Label>
                    <Input
                      id="transferAmount"
                      type="number"
                      placeholder={totalPaidAmount > 0 ? `Required: ${totalPaidAmount}` : t('forms.transferAmount')}
                      value={formData.transferAmount || (totalPaidAmount > 0 ? totalPaidAmount.toString() : "")}
                      onChange={(e) => {
                        setFormData({ ...formData, transferAmount: e.target.value });
                        setValidationError(""); // Clear error on change
                      }}
                      required
                      className={totalPaidAmount > 0 && parseFloat(formData.transferAmount || "0") !== totalPaidAmount ? "border-red-500" : ""}
                    />
                    {totalPaidAmount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Required amount: Rs {totalPaidAmount.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transferFee">{t('forms.transferFee')} (PKR) *</Label>
                    <Input
                      id="transferFee"
                      type="number"
                      placeholder={t('forms.transferFee')}
                      value={formData.transferFee}
                      onChange={(e) => setFormData({ ...formData, transferFee: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">{t('forms.transferDate')} *</Label>
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
                  <Label htmlFor="remarks">{t('forms.remarks')}</Label>
                  <Textarea
                    id="remarks"
                    placeholder={t('forms.remarks')}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={createTransferMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createTransferMutation.isPending ? t('common.loading') : t('forms.submitForm')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
