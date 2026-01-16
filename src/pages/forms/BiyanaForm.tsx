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
import { FileText, Save } from "lucide-react";
import { inventoryAPI, customerAPI, formsAPI } from "@/lib/api";
import { useTranslation } from "react-i18next";

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
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    customerName: "",
    fatherHusbandName: "",
    cnic: "",
    phone: "",
    plotId: "",
    pricePerMarla: "",
    totalAmount: "",
    biyanaAmount: "",
    totalRemaining: "",
    lastInstallmentDate: "",
    monthlyInstallments: "",
    quarterlyInstallments: "",
    agreementDuration: "",
    monthlyInstallmentAmount: "",
    quarterlyInstallmentAmount: "",
    installmentType: "MONTHLY_ONLY", // MONTHLY_ONLY or MONTHLY_AND_QUARTERLY
    date: new Date().toISOString().split("T")[0],
  });
  const [selectedPlot, setSelectedPlot] = useState<any>(null);

  // Auto-calculate monthly installment amount when relevant fields change
  useEffect(() => {
    const remaining = parseFloat(formData.totalRemaining) || 0;
    const months = parseInt(formData.monthlyInstallments) || 0;
    
    if (remaining > 0 && months > 0 && formData.installmentType === "MONTHLY_ONLY") {
      const monthlyAmount = (remaining / months).toFixed(2);
      // Only update if different to avoid infinite loop
      if (formData.monthlyInstallmentAmount !== monthlyAmount) {
        setFormData(prev => ({
          ...prev,
          monthlyInstallmentAmount: monthlyAmount,
        }));
      }
    }
  }, [formData.totalRemaining, formData.monthlyInstallments, formData.installmentType]);

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
            fatherName: data.fatherHusbandName,
            cnic: data.cnic,
            phone: data.phone,
            address: "N/A", // Not required in new format
          });
          customerId = customerResponse.data.id;
        }
      } catch (error) {
        throw new Error('Failed to create/find customer');
      }

      // Create biyana form
      const biyanaData: any = {
        customerId,
        plotId: data.plotId,
        biyanaAmount: parseFloat(data.biyanaAmount),
        paymentMethod: "CASH", // Default value - using valid enum value
        date: new Date(data.date).toISOString(),
        // Additional fields for new format
        pricePerMarla: parseFloat(data.pricePerMarla) || 0,
        totalAmount: parseFloat(data.totalAmount) || 0,
        totalRemaining: parseFloat(data.totalRemaining) || 0,

        lastInstallmentDate: data.lastInstallmentDate || null,
        agreementDuration: data.agreementDuration || "",
        installmentType: data.installmentType || "MONTHLY_ONLY",
      };

      // Add monthly installment fields if monthly installments are used
      if (data.installmentType === "MONTHLY_ONLY" || data.installmentType === "MONTHLY_AND_QUARTERLY") {
        biyanaData.monthlyInstallments = parseInt(data.monthlyInstallments) || 0;
        biyanaData.monthlyInstallmentAmount = parseFloat(data.monthlyInstallmentAmount) || 0;
      }

      // Add quarterly installment fields only if quarterly installments are used
      if (data.installmentType === "MONTHLY_AND_QUARTERLY") {
        biyanaData.quarterlyInstallments = parseInt(data.quarterlyInstallments) || 0;
        biyanaData.quarterlyInstallmentAmount = parseFloat(data.quarterlyInstallmentAmount) || 0;
      }

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
      console.error("Biyana submission error details:", error);
      const errorMessage = error.message || "Failed to submit Biyana form";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handlePlotSelect = (plotId: string) => {
    const plot = availablePlots?.find((p: any) => p.id === plotId);
    setSelectedPlot(plot);
    
    if (plot) {
      // Get marla value from size
      const sizeInMarla = getSizeInMarla(plot.size);
      const pricePerMarla = sizeInMarla > 0 ? (plot.price / sizeInMarla).toFixed(2) : "0";
      const totalAmount = plot.price.toString();
      
      // Calculate remaining if biyana already entered
      const biyanaAmount = parseFloat(formData.biyanaAmount) || 0;
      const totalRemaining = (plot.price - biyanaAmount).toString();
      
      setFormData({ 
        ...formData, 
        plotId,
        pricePerMarla,
        totalAmount,
        totalRemaining: biyanaAmount > 0 ? totalRemaining : ""
      });
    } else {
      setFormData({ ...formData, plotId });
    }
  };
  
  // Convert plot size enum to marla number
  const getSizeInMarla = (size: string): number => {
    const sizeMap: { [key: string]: number } = {
      'FIVE_MARLA': 5,
      'SEVEN_MARLA': 7,
      'TEN_MARLA': 10,
      'ONE_KANAL': 20, // 1 Kanal = 20 Marla
      'TWO_KANAL': 40, // 2 Kanal = 40 Marla
    };
    return sizeMap[size] || 0;
  };
  
  // Calculate months between two dates
  const calculateMonthsBetween = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    
    return Math.max(0, months);
  };
  
  // Handle last installment date change and auto-calculate months
  const handleLastInstallmentDateChange = (lastDate: string) => {
    const months = calculateMonthsBetween(formData.date, lastDate);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    let duration = "";
    if (years > 0) {
      duration = `${years} ${years === 1 ? t('printableForms.year') : t('printableForms.years')}`;
      if (remainingMonths > 0) {
        duration += ` ${remainingMonths} ${remainingMonths === 1 ? t('printableForms.month') : t('printableForms.months')}`;
      }
    } else {
      duration = `${months} ${months === 1 ? t('printableForms.month') : t('printableForms.months')}`;
    }
    
    // Calculate installments based on type
    let updatedData = {
      ...formData,
      lastInstallmentDate: lastDate,
      monthlyInstallments: months.toString(),
      agreementDuration: duration,
    };
    
    // Auto-calculate installment amounts
    if (formData.installmentType === "MONTHLY_ONLY") {
      const remaining = parseFloat(formData.totalRemaining) || 0;
      const monthlyAmount = months > 0 ? (remaining / months).toFixed(2) : "0";
      updatedData = {
        ...updatedData,
        monthlyInstallmentAmount: monthlyAmount,
        quarterlyInstallments: "0",
        quarterlyInstallmentAmount: "0",
      };
    } else {
      // For MONTHLY_AND_QUARTERLY, recalculate based on current quarterly amount
      const remaining = parseFloat(formData.totalRemaining) || 0;
      const quarters = Math.floor(months / 3);
      const quarterlyAmount = parseFloat(formData.quarterlyInstallmentAmount) || 0;
      const totalQuarterlyPayments = quarters * quarterlyAmount;
      const remainingAfterQuarterly = remaining - totalQuarterlyPayments;
      const monthlyAmount = months > 0 ? (remainingAfterQuarterly / months).toFixed(2) : "0";
      
      updatedData = {
        ...updatedData,
        quarterlyInstallments: quarters.toString(),
        monthlyInstallmentAmount: monthlyAmount,
      };
    }
    
    setFormData(updatedData);
  };
  
  // Handle installment type change
  const handleInstallmentTypeChange = (type: string) => {
    const months = parseInt(formData.monthlyInstallments) || 0;
    const remaining = parseFloat(formData.totalRemaining) || 0;
    
    let updatedData = { ...formData, installmentType: type };
    
    if (type === "MONTHLY_ONLY") {
      // Calculate monthly-only installment
      const monthlyAmount = months > 0 ? (remaining / months).toFixed(2) : "0";
      updatedData = {
        ...updatedData,
        monthlyInstallmentAmount: monthlyAmount,
        quarterlyInstallments: "0",
        quarterlyInstallmentAmount: "0",
      };
    } else {
      // For MONTHLY_AND_QUARTERLY, initialize quarterly installments
      const quarters = Math.floor(months / 3);
      updatedData = {
        ...updatedData,
        quarterlyInstallments: quarters.toString(),
        quarterlyInstallmentAmount: "0",
      };
    }
    
    setFormData(updatedData);
  };
  
  // Handle quarterly installment amount change (bidirectional calculation)
  const handleQuarterlyAmountChange = (quarterlyAmount: string) => {
    const months = parseInt(formData.monthlyInstallments) || 0;
    const remaining = parseFloat(formData.totalRemaining) || 0;
    const quarters = parseInt(formData.quarterlyInstallments) || 0;
    const qAmount = parseFloat(quarterlyAmount) || 0;
    
    const totalQuarterlyPayments = quarters * qAmount;
    const remainingAfterQuarterly = remaining - totalQuarterlyPayments;
    const monthlyAmount = months > 0 ? (remainingAfterQuarterly / months).toFixed(2) : "0";
    
    setFormData({
      ...formData,
      quarterlyInstallmentAmount: quarterlyAmount,
      monthlyInstallmentAmount: monthlyAmount,
    });
  };
  
  // Handle monthly installment amount change (bidirectional calculation)
  const handleMonthlyAmountChange = (monthlyAmount: string) => {
    if (formData.installmentType === "MONTHLY_ONLY") {
      // In monthly-only mode, just update the value
      setFormData({
        ...formData,
        monthlyInstallmentAmount: monthlyAmount,
      });
      return;
    }
    
    // For MONTHLY_AND_QUARTERLY, recalculate quarterly amount
    const months = parseInt(formData.monthlyInstallments) || 0;
    const remaining = parseFloat(formData.totalRemaining) || 0;
    const quarters = parseInt(formData.quarterlyInstallments) || 0;
    const mAmount = parseFloat(monthlyAmount) || 0;
    
    const totalMonthlyPayments = months * mAmount;
    const remainingForQuarterly = remaining - totalMonthlyPayments;
    const quarterlyAmount = quarters > 0 ? (remainingForQuarterly / quarters).toFixed(2) : "0";
    
    setFormData({
      ...formData,
      monthlyInstallmentAmount: monthlyAmount,
      quarterlyInstallmentAmount: quarterlyAmount,
    });
  };
  
  // Handle biyana amount change and auto-calculate remaining
  const handleBiyanaAmountChange = (value: string) => {
    const biyanaAmount = parseFloat(value) || 0;
    const totalAmount = parseFloat(formData.totalAmount) || 0;
    const totalRemaining = totalAmount > 0 ? (totalAmount - biyanaAmount).toString() : "";
    
    // Recalculate installments if we have a last installment date
    let updatedData = { 
      ...formData, 
      biyanaAmount: value,
      totalRemaining 
    };
    
    if (formData.lastInstallmentDate) {
      const months = parseInt(formData.monthlyInstallments) || 0;
      const remaining = parseFloat(totalRemaining) || 0;
      
      if (formData.installmentType === "MONTHLY_ONLY") {
        const monthlyAmount = months > 0 ? (remaining / months).toFixed(2) : "0";
        updatedData = {
          ...updatedData,
          monthlyInstallmentAmount: monthlyAmount,
        };
      } else {
        const quarters = parseInt(formData.quarterlyInstallments) || 0;
        const quarterlyAmount = parseFloat(formData.quarterlyInstallmentAmount) || 0;
        const totalQuarterlyPayments = quarters * quarterlyAmount;
        const remainingAfterQuarterly = remaining - totalQuarterlyPayments;
        const monthlyAmount = months > 0 ? (remainingAfterQuarterly / months).toFixed(2) : "0";
        
        updatedData = {
          ...updatedData,
          monthlyInstallmentAmount: monthlyAmount,
        };
      }
    }
    
    setFormData(updatedData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBiyanaMutation.mutate(formData);
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
          <h1 className="text-3xl font-bold tracking-tight">{t('forms.biyanaForm')}</h1>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>{t('forms.biyanaForm')}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  {isUrdu ? 'خریدار کی معلومات' : 'Buyer Information'}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">
                      {isUrdu ? 'نام خریدار' : 'Buyer Name'} *
                    </Label>
                    <Input
                      id="customerName"
                      placeholder={isUrdu ? 'خریدار کا نام درج کریں' : 'Enter buyer name'}
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherHusbandName">
                      {isUrdu ? 'ولدیت/زوجیت' : 'Father/Husband Name'} *
                    </Label>
                    <Input
                      id="fatherHusbandName"
                      placeholder={isUrdu ? 'والد/شوہر کا نام درج کریں' : 'Enter father/husband name'}
                      value={formData.fatherHusbandName}
                      onChange={(e) => setFormData({ ...formData, fatherHusbandName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnic">
                      {isUrdu ? 'شناختی کارڈ نمبر' : 'CNIC Number'} *
                    </Label>
                    <Input
                      id="cnic"
                      placeholder={isUrdu ? 'شناختی کارڈ نمبر درج کریں' : 'Enter CNIC number'}
                      value={formData.cnic}
                      onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      {isUrdu ? 'موبائل نمبر' : 'Mobile Number'} *
                    </Label>
                    <Input
                      id="phone"
                      placeholder={isUrdu ? 'موبائل نمبر درج کریں' : 'Enter mobile number'}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Property Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  {isUrdu ? 'پلاٹ کی تفصیلات' : 'Plot Details'}
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="plotId">
                      {isUrdu ? 'پلاٹ نمبر' : 'Plot Number'} *
                    </Label>
                    <Select
                      value={formData.plotId}
                      onValueChange={handlePlotSelect}
                      disabled={plotsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={plotsLoading ? (isUrdu ? 'لوڈ ہو رہا ہے...' : 'Loading...') : (isUrdu ? 'پلاٹ منتخب کریں' : 'Select Plot')} />
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
                        <Label>{isUrdu ? 'مرلے' : 'Marla (Size)'}</Label>
                        <Input value={formatSize(selectedPlot.size)} disabled className="bg-muted" />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="pricePerMarla">
                      {isUrdu ? 'فی مرلہ' : 'Price per Marla'} *
                    </Label>
                    <Input
                      id="pricePerMarla"
                      type="number"
                      placeholder={isUrdu ? 'فی مرلہ قیمت' : 'Price per marla'}
                      value={formData.pricePerMarla}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  {isUrdu ? 'ادائیگی کی تفصیلات' : 'Payment Details'}
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="totalAmount">
                      {isUrdu ? 'ٹوٹل رقم' : 'Total Amount'} *
                    </Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      placeholder={isUrdu ? 'کل رقم' : 'Total amount'}
                      value={formData.totalAmount}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="biyanaAmount">
                      {isUrdu ? 'بیانہ ادائیگی' : 'Biyana Payment'} *
                    </Label>
                    <Input
                      id="biyanaAmount"
                      type="number"
                      placeholder={isUrdu ? 'بیانہ رقم درج کریں' : 'Enter biyana amount'}
                      value={formData.biyanaAmount}
                      onChange={(e) => handleBiyanaAmountChange(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalRemaining">
                      {isUrdu ? 'ٹوٹل بقایا' : 'Total Remaining'} *
                    </Label>
                    <Input
                      id="totalRemaining"
                      type="number"
                      placeholder={isUrdu ? 'کل بقایا رقم' : 'Total remaining'}
                      value={formData.totalRemaining}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">
                      {isUrdu ? 'معاہدہ کی تاریخ' : 'Agreement Date'} *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastInstallmentDate">
                      {isUrdu ? 'آخری قسط ادائیگی تاریخ' : 'Last Installment Date'} *
                    </Label>
                    <Input
                      id="lastInstallmentDate"
                      type="date"
                      value={formData.lastInstallmentDate}
                      onChange={(e) => handleLastInstallmentDateChange(e.target.value)}
                      min={formData.date}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agreementDuration">
                      {isUrdu ? 'معاہدہ مدت' : 'Agreement Duration'}
                    </Label>
                    <Input
                      id="agreementDuration"
                      placeholder={isUrdu ? 'خودکار حساب' : 'Auto calculated'}
                      value={formData.agreementDuration}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>

              {/* Installment Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  {isUrdu ? 'اقساط کی تفصیلات' : 'Installment Details'}
                </h3>
                
                {/* Installment Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="installmentType">
                    {isUrdu ? 'قسط کی قسم' : 'Installment Type'} *
                  </Label>
                  <Select
                    value={formData.installmentType}
                    onValueChange={handleInstallmentTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY_ONLY">
                        {isUrdu ? 'صرف ماہانہ اقساط' : 'Monthly Installments Only'}
                      </SelectItem>
                      <SelectItem value="MONTHLY_AND_QUARTERLY">
                        {isUrdu ? 'ماہانہ + سہ ماہی اقساط' : 'Monthly + Quarterly Installments'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyInstallments">
                      {isUrdu ? 'ماہانہ اقساط' : 'Monthly Installments'}
                    </Label>
                    <Input
                      id="monthlyInstallments"
                      type="number"
                      placeholder={isUrdu ? 'خودکار حساب' : 'Auto calculated'}
                      value={formData.monthlyInstallments}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  
                  {formData.installmentType === "MONTHLY_AND_QUARTERLY" && (
                    <div className="space-y-2">
                      <Label htmlFor="quarterlyInstallments">
                        {isUrdu ? 'سہ ماہی اقساط' : 'Quarterly Installments'}
                      </Label>
                      <Input
                        id="quarterlyInstallments"
                        type="number"
                        placeholder={isUrdu ? 'خودکار حساب' : 'Auto calculated'}
                        value={formData.quarterlyInstallments}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="monthlyInstallmentAmount">
                      {isUrdu ? 'ماہانہ قسط رقم' : 'Monthly Installment Amount'}
                    </Label>
                    <Input
                      id="monthlyInstallmentAmount"
                      type="number"
                      placeholder={isUrdu ? formData.installmentType === "MONTHLY_ONLY" ? 'خودکار حساب' : 'رقم درج کریں' : formData.installmentType === "MONTHLY_ONLY" ? 'Auto calculated' : 'Enter amount'}
                      value={formData.monthlyInstallmentAmount}
                      onChange={(e) => handleMonthlyAmountChange(e.target.value)}
                      disabled={formData.installmentType === "MONTHLY_ONLY"}
                      className={formData.installmentType === "MONTHLY_ONLY" ? "bg-muted" : ""}
                    />
                  </div>
                  
                  {formData.installmentType === "MONTHLY_AND_QUARTERLY" && (
                    <div className="space-y-2">
                      <Label htmlFor="quarterlyInstallmentAmount">
                        {isUrdu ? 'سہ ماہی قسط رقم' : 'Quarterly Installment Amount'} *
                      </Label>
                      <Input
                        id="quarterlyInstallmentAmount"
                        type="number"
                        placeholder={isUrdu ? 'سہ ماہی قسط کی رقم' : 'Enter quarterly amount'}
                        value={formData.quarterlyInstallmentAmount}
                        onChange={(e) => handleQuarterlyAmountChange(e.target.value)}
                        required={formData.installmentType === "MONTHLY_AND_QUARTERLY"}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={createBiyanaMutation.isPending || plotsLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {createBiyanaMutation.isPending ? (isUrdu ? 'جمع ہو رہا ہے...' : 'Submitting...') : (isUrdu ? 'فارم جمع کروائیں' : 'Submit Form')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
