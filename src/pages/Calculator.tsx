import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Calculator as CalcIcon, RefreshCw } from "lucide-react";
import { inventoryAPI } from "@/lib/api";
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

export default function Calculator() {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  
  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [plotId, setPlotId] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [remainingAmount, setRemainingAmount] = useState("");
  
  // Payment plan options
  const [paymentDuration, setPaymentDuration] = useState(""); // months
  const [paymentFrequency, setPaymentFrequency] = useState<"monthly" | "quarterly">("monthly");
  const [quarterlyExtra, setQuarterlyExtra] = useState(""); // Extra amount for quarterly
  
  // Calculated results
  const [monthlyInstallment, setMonthlyInstallment] = useState("");
  const [quarterlyInstallment, setQuarterlyInstallment] = useState("");
  const [totalMonthlyPayments, setTotalMonthlyPayments] = useState("");
  const [totalQuarterlyPayments, setTotalQuarterlyPayments] = useState("");

  // Fetch available plots
  const { data: availablePlots, isLoading: plotsLoading } = useQuery({
    queryKey: ['allPlots'],
    queryFn: async () => {
      const response = await inventoryAPI.getAll();
      return response.data;
    },
  });

  // Handle plot selection
  const handlePlotSelect = (plotId: string) => {
    const plot = availablePlots?.find((p: any) => p.id === plotId);
    setSelectedPlot(plot);
    setPlotId(plotId);
    
    if (plot) {
      setTotalPrice(plot.price.toString());
      // Reset calculations
      resetCalculations();
    }
  };

  // Calculate remaining amount when down payment changes
  useEffect(() => {
    if (totalPrice && downPayment) {
      const total = parseFloat(totalPrice) || 0;
      const down = parseFloat(downPayment) || 0;
      const remaining = total - down;
      setRemainingAmount(remaining > 0 ? remaining.toString() : "0");
    } else {
      setRemainingAmount("");
    }
  }, [totalPrice, downPayment]);

  // Calculate installments
  const calculateInstallments = () => {
    const remaining = parseFloat(remainingAmount) || 0;
    const months = parseInt(paymentDuration) || 0;
    const extraPerQuarter = parseFloat(quarterlyExtra) || 0;

    if (remaining <= 0 || months <= 0) {
      return;
    }

    if (paymentFrequency === "monthly") {
      // Simple monthly installment
      const monthly = remaining / months;
      setMonthlyInstallment(monthly.toFixed(2));
      setTotalMonthlyPayments(months.toString());
      
      // Clear quarterly
      setQuarterlyInstallment("");
      setTotalQuarterlyPayments("");
    } else if (paymentFrequency === "quarterly") {
      // Complex calculation: Monthly + Quarterly extra
      const numberOfQuarters = Math.ceil(months / 3);
      const totalQuarterlyAmount = extraPerQuarter * numberOfQuarters;
      const totalToPayMonthly = remaining - totalQuarterlyAmount;
      
      if (totalToPayMonthly < 0) {
        alert(isUrdu 
          ? "سہ ماہی رقم بہت زیادہ ہے! براہ کرم کم کریں۔" 
          : "Quarterly amount is too high! Please reduce it."
        );
        return;
      }
      
      const monthly = totalToPayMonthly / months;
      setMonthlyInstallment(monthly.toFixed(2));
      setQuarterlyInstallment(extraPerQuarter.toFixed(2));
      setTotalMonthlyPayments(months.toString());
      setTotalQuarterlyPayments(numberOfQuarters.toString());
    }
  };

  const resetCalculations = () => {
    setDownPayment("");
    setRemainingAmount("");
    setPaymentDuration("");
    setQuarterlyExtra("");
    setMonthlyInstallment("");
    setQuarterlyInstallment("");
    setTotalMonthlyPayments("");
    setTotalQuarterlyPayments("");
  };

  const resetAll = () => {
    setPlotId("");
    setSelectedPlot(null);
    setTotalPrice("");
    resetCalculations();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-5xl" dir={isUrdu ? 'rtl' : 'ltr'}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isUrdu ? 'قسط کیلکولیٹر' : 'Installment Calculator'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isUrdu 
              ? 'پلاٹ منتخب کریں اور ماہانہ اقساط کا حساب لگائیں' 
              : 'Select a plot and calculate monthly installment amounts'}
          </p>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-3">
                  <CalcIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{isUrdu ? 'قسط کیلکولیٹر' : 'Payment Calculator'}</CardTitle>
                  <CardDescription>
                    {isUrdu 
                      ? 'مختلف منصوبوں کے ساتھ اقساط کا حساب لگائیں' 
                      : 'Calculate installments with different plans'}
                  </CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={resetAll}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {isUrdu ? 'ری سیٹ' : 'Reset'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Plot Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                {isUrdu ? 'پلاٹ کی معلومات' : 'Plot Information'}
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="plotId">
                    {isUrdu ? 'پلاٹ منتخب کریں' : 'Select Plot'} *
                  </Label>
                  <Select value={plotId} onValueChange={handlePlotSelect} disabled={plotsLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={plotsLoading ? (isUrdu ? 'لوڈ ہو رہا ہے...' : 'Loading...') : (isUrdu ? 'پلاٹ منتخب کریں' : 'Select Plot')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlots?.map((plot: any) => (
                        <SelectItem key={plot.id} value={plot.id}>
                          {plot.plotNo} - {formatEnum(plot.project)} ({formatSize(plot.size)}) - Rs {plot.price.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedPlot && (
                  <>
                    <div className="space-y-2">
                      <Label>{isUrdu ? 'پراجیکٹ' : 'Project'}</Label>
                      <Input value={formatEnum(selectedPlot.project)} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>{isUrdu ? 'سائز' : 'Size'}</Label>
                      <Input value={formatSize(selectedPlot.size)} disabled className="bg-muted" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Price Information */}
            {selectedPlot && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  {isUrdu ? 'قیمت کی تفصیلات' : 'Price Details'}
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="totalPrice">
                      {isUrdu ? 'کل قیمت' : 'Total Price'}
                    </Label>
                    <Input
                      id="totalPrice"
                      type="number"
                      value={totalPrice}
                      disabled
                      className="bg-muted font-semibold text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="downPayment">
                      {isUrdu ? 'ڈاؤن پیمنٹ' : 'Down Payment'}
                    </Label>
                    <Input
                      id="downPayment"
                      type="number"
                      placeholder={isUrdu ? 'ڈاؤن پیمنٹ درج کریں' : 'Enter down payment'}
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remainingAmount">
                      {isUrdu ? 'باقی رقم' : 'Remaining Amount'}
                    </Label>
                    <Input
                      id="remainingAmount"
                      type="number"
                      value={remainingAmount}
                      disabled
                      className="bg-muted font-semibold text-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Plan */}
            {remainingAmount && parseFloat(remainingAmount) > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  {isUrdu ? 'ادائیگی کا منصوبہ' : 'Payment Plan'}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="paymentDuration">
                      {isUrdu ? 'مدت (مہینے)' : 'Duration (Months)'} *
                    </Label>
                    <Input
                      id="paymentDuration"
                      type="number"
                      placeholder={isUrdu ? 'مہینوں میں مدت درج کریں' : 'Enter duration in months'}
                      value={paymentDuration}
                      onChange={(e) => setPaymentDuration(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentFrequency">
                      {isUrdu ? 'ادائیگی کی قسم' : 'Payment Type'}
                    </Label>
                    <Select 
                      value={paymentFrequency} 
                      onValueChange={(value: "monthly" | "quarterly") => {
                        setPaymentFrequency(value);
                        if (value === "monthly") {
                          setQuarterlyExtra("");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">
                          {isUrdu ? 'صرف ماہانہ' : 'Monthly Only'}
                        </SelectItem>
                        <SelectItem value="quarterly">
                          {isUrdu ? 'ماہانہ + سہ ماہی اضافی' : 'Monthly + Quarterly Extra'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {paymentFrequency === "quarterly" && (
                  <div className="space-y-2">
                    <Label htmlFor="quarterlyExtra">
                      {isUrdu ? 'سہ ماہی اضافی رقم' : 'Quarterly Extra Amount'}
                    </Label>
                    <Input
                      id="quarterlyExtra"
                      type="number"
                      placeholder={isUrdu ? 'ہر سہ ماہی اضافی رقم درج کریں' : 'Enter extra amount per quarter'}
                      value={quarterlyExtra}
                      onChange={(e) => setQuarterlyExtra(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {isUrdu 
                        ? 'یہ رقم ہر 3 ماہ میں ادا کی جائے گی (ماہانہ قسط کے علاوہ)' 
                        : 'This amount will be paid every 3 months (in addition to monthly installment)'}
                    </p>
                  </div>
                )}

                <Button 
                  onClick={calculateInstallments} 
                  className="w-full"
                  disabled={!paymentDuration || (paymentFrequency === "quarterly" && !quarterlyExtra)}
                >
                  <CalcIcon className="mr-2 h-4 w-4" />
                  {isUrdu ? 'حساب لگائیں' : 'Calculate'}
                </Button>
              </div>
            )}

            {/* Results */}
            {monthlyInstallment && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  {isUrdu ? 'نتائج' : 'Calculation Results'}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-900 text-base">
                        {isUrdu ? 'ماہانہ قسط' : 'Monthly Installment'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-700">
                        Rs {parseFloat(monthlyInstallment).toLocaleString()}
                      </p>
                      <p className="text-sm text-green-600 mt-2">
                        {isUrdu 
                          ? `کل ${totalMonthlyPayments} اقساط` 
                          : `Total ${totalMonthlyPayments} payments`}
                      </p>
                    </CardContent>
                  </Card>

                  {quarterlyInstallment && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-blue-900 text-base">
                          {isUrdu ? 'سہ ماہی اضافی' : 'Quarterly Extra'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-blue-700">
                          Rs {parseFloat(quarterlyInstallment).toLocaleString()}
                        </p>
                        <p className="text-sm text-blue-600 mt-2">
                          {isUrdu 
                            ? `کل ${totalQuarterlyPayments} سہ ماہی ادائیگیاں` 
                            : `Total ${totalQuarterlyPayments} quarterly payments`}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Summary */}
                <Card className="bg-purple-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-purple-900">
                      {isUrdu ? 'ادائیگی کا خلاصہ' : 'Payment Summary'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-purple-700">{isUrdu ? 'کل قیمت:' : 'Total Price:'}</span>
                      <span className="font-semibold">Rs {parseFloat(totalPrice).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">{isUrdu ? 'ڈاؤن پیمنٹ:' : 'Down Payment:'}</span>
                      <span className="font-semibold">Rs {parseFloat(downPayment).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-purple-700 font-semibold">{isUrdu ? 'باقی رقم:' : 'Remaining Amount:'}</span>
                      <span className="font-bold">Rs {parseFloat(remainingAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">{isUrdu ? 'مدت:' : 'Duration:'}</span>
                      <span className="font-semibold">{paymentDuration} {isUrdu ? 'مہینے' : 'months'}</span>
                    </div>
                    {quarterlyInstallment && (
                      <>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-purple-700">{isUrdu ? 'ہر ماہ ادا کریں:' : 'Pay Monthly:'}</span>
                          <span className="font-bold text-green-700">Rs {parseFloat(monthlyInstallment).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">{isUrdu ? 'ہر سہ ماہ اضافی:' : 'Plus Quarterly:'}</span>
                          <span className="font-bold text-blue-700">Rs {parseFloat(quarterlyInstallment).toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
