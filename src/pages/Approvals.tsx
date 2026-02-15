import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, FileCheck, Wallet, Eye, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import PrintableBiyanaFormSimple from "@/pages/forms/PrintableBiyanaFormSimple";
import PrintableSaleAgreementForm from "@/pages/forms/PrintableSaleAgreementForm";
import PrintableTransferForm from "@/pages/forms/PrintableTransferForm";
import { voucherAPI } from "@/lib/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatEnum = (value: string) => {
  if (!value) return "";
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

export default function Approvals() {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get initial tab from URL or default to 'forms'
  const initialTab = searchParams.get('tab') || 'forms';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Update active tab when URL changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['forms', 'agreements', 'transfers', 'payments'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Helper function to format project names
  const formatProjectName = (value: string) => {
    if (!value) return "";
    // Check for translation first
    if (value === 'SHADMAN_GREENS') {
      const translated = t('projects.shadmanGreens');
      if (translated && !translated.startsWith('projects.')) return translated;
    }
    // Fallback to formatting the enum value
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper function to format payment method
  const formatPaymentMethod = (method: string) => {
    if (!method) return "";
    return t(`payments.paymentMethods.${method}`) || formatEnum(method);
  };

  // Helper function to format payment type
  const formatPaymentType = (type: string) => {
    if (!type) return "";
    return t(`payments.paymentTypes.${type}`) || formatEnum(type);
  };

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approvalType, setApprovalType] = useState<'biyana' | 'payment' | 'agreement' | 'transfer'>('biyana');
  
  // Print dialog states
  const [isPrintBiyanaOpen, setIsPrintBiyanaOpen] = useState(false);
  const [isPrintAgreementOpen, setIsPrintAgreementOpen] = useState(false);
  const [isPrintTransferOpen, setIsPrintTransferOpen] = useState(false);
  const [isPrintPaymentOpen, setIsPrintPaymentOpen] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  // Helper function to format size
  const formatSize = (value: string) => {
    if (!value) return "";
    const sizeMap: { [key: string]: string } = {
      'FIVE_MARLA': t('plotSizes.fiveMarla'),
      'SEVEN_MARLA': t('plotSizes.sevenMarla'),
      'TEN_MARLA': t('plotSizes.tenMarla'),
      'ONE_KANAL': t('plotSizes.oneKanal'),
      'TWO_KANAL': t('plotSizes.twoKanal'),
    };
    return sizeMap[value] || value;
  };

  // Print handler functions
  const handlePrintBiyana = (biyana: any) => {
    const data = {
      customerName: biyana.customer?.name || "",
      fatherHusbandName: biyana.fatherHusbandName || biyana.customer?.fatherName || "",
      cnic: biyana.customer?.cnic || "",
      phone: biyana.customer?.phone || "",
      plot: {
        plotNo: biyana.plot?.plotNo || "",
        project: biyana.plot?.project || "",
        size: formatSize(biyana.plot?.size || ""),
        block: biyana.plot?.block || "",
        price: biyana.plot?.price || 0,
      },
      pricePerMarla: biyana.pricePerMarla,
      totalAmount: biyana.totalAmount,
      tokenAmount: biyana.tokenAmount || 0,
      totalRemaining: biyana.totalRemaining,
      firstInstallmentRemaining: biyana.firstInstallmentRemaining,
      lastInstallmentDate: biyana.lastInstallmentDate,
      monthlyInstallments: biyana.monthlyInstallments,
      quarterlyInstallments: biyana.quarterlyInstallments,
      agreementDuration: biyana.agreementDuration,
      monthlyInstallmentAmount: biyana.monthlyInstallmentAmount,
      quarterlyInstallmentAmount: biyana.quarterlyInstallmentAmount,
      date: biyana.date || new Date().toISOString(),
      agreementNumber: biyana.id,
      status: biyana.status,
      approvedBy: biyana.approvedBy,
    };
    setPrintData(data);
    setIsPrintBiyanaOpen(true);
  };

  const handlePrintPayment = async (payment: any) => {
    try {
      setSelectedPaymentId(payment.id);
      setIsPrintPaymentOpen(true);
    } catch (error) {
      console.error('Error loading payment voucher:', error);
      toast({
        title: "Error",
        description: "Failed to load payment voucher",
        variant: "destructive",
      });
    }
  };

  const handlePrintAgreement = (agreement: any) => {
    // Extract biyana data from plot.biyanaForms array
    const biyanaData = agreement.plot?.biyanaForms?.[0];
    
    // Add biyana amount to the agreement data for printable form
    const enrichedData = {
      ...agreement,
      biyanaAmount: biyanaData?.tokenAmount || 0,
      biyana: biyanaData || null,
    };
    
    setPrintData(enrichedData);
    setIsPrintAgreementOpen(true);
  };

  const handlePrintTransfer = (transfer: any) => {
    setPrintData(transfer);
    setIsPrintTransferOpen(true);
  };

  // Fetch voucher data for print dialog
  const { data: voucherData } = useQuery({
    queryKey: ['voucher', selectedPaymentId],
    queryFn: async () => {
      if (!selectedPaymentId) return null;
      const response = await voucherAPI.getById(selectedPaymentId);
      return response.data;
    },
    enabled: !!selectedPaymentId && isPrintPaymentOpen,
  });

  // Fetch pending Biyana forms
  const { data: pendingBiyanas, isLoading: loadingBiyanas } = useQuery({
    queryKey: ['pendingBiyanas'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/approvals/biyana`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  // Fetch pending Sale Agreements
  const { data: pendingAgreements, isLoading: loadingAgreements } = useQuery({
    queryKey: ['pendingAgreements'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/approvals/sale-agreement`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  // Fetch pending Payments
  const { data: pendingPayments, isLoading: loadingPayments } = useQuery({
    queryKey: ['pendingPayments'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/approvals/payments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  // Fetch pending Transfer forms
  const { data: pendingTransfers, isLoading: loadingTransfers } = useQuery({
    queryKey: ['pendingTransfers'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/approvals/transfer`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  // Fetch approval stats
  const { data: stats } = useQuery({
    queryKey: ['approvalStats'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/approvals/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
  });

  // Approve Biyana mutation
  const approveBiyanaMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/approvals/biyana/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Biyana form approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['pendingBiyanas'] });
      queryClient.invalidateQueries({ queryKey: ['approvalStats'] });
      queryClient.invalidateQueries({ queryKey: ['biyanaForms'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setShowDialog(false);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve Payment mutation
  const approvePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/approvals/payments/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment voucher approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
      queryClient.invalidateQueries({ queryKey: ['approvalStats'] });
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setShowDialog(false);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve Transfer mutation
  const approveTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/approvals/transfer/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      toast({
        title: "Transfer Approved",
        description: "Transfer form approved successfully. Now create a Sale Agreement for the new owner to complete the transfer.",
        duration: 8000, // Show longer to ensure user sees the instruction
      });
      queryClient.invalidateQueries({ queryKey: ['pendingTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['approvalStats'] });
      queryClient.invalidateQueries({ queryKey: ['transferForms'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setShowDialog(false);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject Biyana mutation
  const rejectBiyanaMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/approvals/biyana/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Biyana form rejected",
      });
      queryClient.invalidateQueries({ queryKey: ['pendingBiyanas'] });
      queryClient.invalidateQueries({ queryKey: ['approvalStats'] });
      queryClient.invalidateQueries({ queryKey: ['biyanaForms'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setShowRejectDialog(false);
      setSelectedItem(null);
      setRejectReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject Payment mutation
  const rejectPaymentMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/approvals/payments/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment voucher rejected",
      });
      queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
      queryClient.invalidateQueries({ queryKey: ['approvalStats'] });
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setShowRejectDialog(false);
      setSelectedItem(null);
      setRejectReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve Agreement mutation
  const approveAgreementMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/approvals/sale-agreement/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sale Agreement approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['pendingAgreements'] });
      queryClient.invalidateQueries({ queryKey: ['approvalStats'] });
      queryClient.invalidateQueries({ queryKey: ['saleAgreements'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setShowDialog(false);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject Agreement mutation
  const rejectAgreementMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/approvals/sale-agreement/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sale Agreement rejected",
      });
      queryClient.invalidateQueries({ queryKey: ['pendingAgreements'] });
      queryClient.invalidateQueries({ queryKey: ['approvalStats'] });
      queryClient.invalidateQueries({ queryKey: ['saleAgreements'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setShowRejectDialog(false);
      setSelectedItem(null);
      setRejectReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject Transfer mutation
  const rejectTransferMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/approvals/transfer/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transfer form rejected",
      });
      queryClient.invalidateQueries({ queryKey: ['pendingTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['approvalStats'] });
      queryClient.invalidateQueries({ queryKey: ['transferForms'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setShowRejectDialog(false);
      setSelectedItem(null);
      setRejectReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (item: any, type: 'biyana' | 'payment' | 'agreement' | 'transfer') => {
    setSelectedItem(item);
    setApprovalType(type);
    setShowDialog(true);
  };

  const handleReject = (item: any, type: 'biyana' | 'payment' | 'agreement' | 'transfer') => {
    setSelectedItem(item);
    setApprovalType(type);
    setShowRejectDialog(true);
  };

  const confirmApprove = () => {
    if (selectedItem) {
      if (approvalType === 'biyana') {
        approveBiyanaMutation.mutate(selectedItem.id);
      } else if (approvalType === 'payment') {
        approvePaymentMutation.mutate(selectedItem.id);
      } else if (approvalType === 'transfer') {
        approveTransferMutation.mutate(selectedItem.id);
      } else {
        approveAgreementMutation.mutate(selectedItem.id);
      }
    }
  };

  const confirmReject = () => {
    if (selectedItem && rejectReason.trim()) {
      if (approvalType === 'biyana') {
        rejectBiyanaMutation.mutate({ id: selectedItem.id, reason: rejectReason });
      } else if (approvalType === 'payment') {
        rejectPaymentMutation.mutate({ id: selectedItem.id, reason: rejectReason });
      } else if (approvalType === 'transfer') {
        rejectTransferMutation.mutate({ id: selectedItem.id, reason: rejectReason });
      } else {
        rejectAgreementMutation.mutate({ id: selectedItem.id, reason: rejectReason });
      }
    } else {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('approvals.title')}</h1>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {/* Biyana Form Approvals */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('approvals.biyanaApprovals')}
                </CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-500" title={t('status.pending')} />
                      <span className="text-xs text-muted-foreground">{t('status.pending')}</span>
                    </div>
                    <span className="text-sm font-semibold">{stats.forms.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" title={t('status.approved')} />
                      <span className="text-xs text-muted-foreground">{t('status.approved')}</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">{stats.forms.approved}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" title={t('status.rejected')} />
                      <span className="text-xs text-muted-foreground">{t('status.rejected')}</span>
                    </div>
                    <span className="text-sm font-semibold text-red-600">{stats.forms.rejected}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agreement Approvals */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('approvals.agreementApprovals')}
                </CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-500" title={t('status.pending')} />
                      <span className="text-xs text-muted-foreground">{t('status.pending')}</span>
                    </div>
                    <span className="text-sm font-semibold">{stats.agreements?.pending || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" title={t('status.approved')} />
                      <span className="text-xs text-muted-foreground">{t('status.approved')}</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">{stats.agreements?.approved || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" title={t('status.rejected')} />
                      <span className="text-xs text-muted-foreground">{t('status.rejected')}</span>
                    </div>
                    <span className="text-sm font-semibold text-red-600">{stats.agreements?.rejected || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transfer Form Approvals */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('approvals.transferApprovals')}
                </CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-500" title={t('status.pending')} />
                      <span className="text-xs text-muted-foreground">{t('status.pending')}</span>
                    </div>
                    <span className="text-sm font-semibold">{stats.transfers?.pending || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" title={t('status.approved')} />
                      <span className="text-xs text-muted-foreground">{t('status.approved')}</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">{stats.transfers?.approved || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" title={t('status.rejected')} />
                      <span className="text-xs text-muted-foreground">{t('status.rejected')}</span>
                    </div>
                    <span className="text-sm font-semibold text-red-600">{stats.transfers?.rejected || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Approvals */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('approvals.paymentApprovals')}
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-500" title={t('status.pending')} />
                      <span className="text-xs text-muted-foreground">{t('status.pending')}</span>
                    </div>
                    <span className="text-sm font-semibold">{stats.payments.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" title={t('status.approved')} />
                      <span className="text-xs text-muted-foreground">{t('status.approved')}</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">{stats.payments.approved}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" title={t('status.rejected')} />
                      <span className="text-xs text-muted-foreground">{t('status.rejected')}</span>
                    </div>
                    <span className="text-sm font-semibold text-red-600">{stats.payments.rejected}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs for Biyana Forms, Agreements, Transfers, and Payments */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="forms" className="px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
              {t('approvals.biyanaForms')}
              {pendingBiyanas && pendingBiyanas.length > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-500 rounded-full"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value="agreements" className="px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
              {t('approvals.saleAgreement')}
              {pendingAgreements && pendingAgreements.length > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-500 rounded-full"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value="transfers" className="px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
              {t('approvals.transferForms')}
              {pendingTransfers && pendingTransfers.length > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-500 rounded-full"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value="payments" className="px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
              {t('approvals.paymentApprovals')}
              {pendingPayments && pendingPayments.length > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-500 rounded-full"></span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Forms Tab */}
          <TabsContent value="forms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('approvals.pendingBiyanaForms')}</CardTitle>
                <CardDescription>{t('approvals.reviewBiyanaForms')}</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBiyanas ? (
                  <div className="text-center py-8">{t('common.loading')}</div>
                ) : !pendingBiyanas || pendingBiyanas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('approvals.noPendingForms')}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('forms.formNumber')}</TableHead>
                        <TableHead>{t('forms.customer')}</TableHead>
                        <TableHead>{t('inventory.plotNo')}</TableHead>
                        <TableHead>{t('payments.amount')}</TableHead>
                        <TableHead>{t('approvals.submittedBy')}</TableHead>
                        <TableHead>{t('forms.date')}</TableHead>
                        <TableHead className="text-center">{t('common.view')}</TableHead>
                        <TableHead className="w-32">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingBiyanas.map((biyana: any) => (
                        <TableRow key={biyana.id}>
                          <TableCell>{biyana.formNumber}</TableCell>
                          <TableCell>
                            <div>{biyana.customer?.name || '-'}</div>
                            <div className="text-xs text-muted-foreground">{biyana.customer?.cnic || '-'}</div>
                          </TableCell>
                          <TableCell>
                            <div>{biyana.plot?.plotNo || '-'}</div>
                            <div className="text-xs text-muted-foreground">{biyana.plot?.project ? formatProjectName(biyana.plot.project) : '-'}</div>
                          </TableCell>
                          <TableCell>{formatCurrency(biyana.tokenAmount)}</TableCell>
                          <TableCell>
                            <div>{biyana.createdBy?.name || '-'}</div>
                            <div className="text-xs text-muted-foreground">{biyana.createdBy?.email || '-'}</div>
                          </TableCell>
                          <TableCell>{formatDate(biyana.date)}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePrintBiyana(biyana)}
                              className="h-8 w-8 p-0"
                              title="View Print Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(biyana, 'biyana')}
                                className="h-8 w-8 p-0"
                                title={t('approvals.approve')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(biyana, 'biyana')}
                                className="h-8 w-8 p-0"
                                title={t('approvals.reject')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agreements Tab */}
          <TabsContent value="agreements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('approvals.pendingSaleAgreements')}</CardTitle>
                <CardDescription>{t('approvals.reviewSaleAgreements')}</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAgreements ? (
                  <div className="text-center py-8">{t('common.loading')}</div>
                ) : !pendingAgreements || pendingAgreements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('approvals.noPendingAgreements')}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('forms.agreementNumber')}</TableHead>
                        <TableHead>{t('forms.customer')}</TableHead>
                        <TableHead>{t('inventory.plotNo')}</TableHead>
                        <TableHead>{t('forms.totalPrice')}</TableHead>
                        <TableHead>{t('forms.downPayment')}</TableHead>
                        <TableHead>{t('forms.installmentMonths')}</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-center">{t('common.view')}</TableHead>
                        <TableHead className="w-32">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingAgreements.map((agreement: any) => (
                        <TableRow key={agreement.id}>
                          <TableCell>{agreement.agreementNumber}</TableCell>
                          <TableCell>
                            <div>{agreement.customer?.name || '-'}</div>
                            <div className="text-xs text-muted-foreground">{agreement.customer?.cnic || '-'}</div>
                          </TableCell>
                          <TableCell>
                            <div>{agreement.plot?.plotNo || '-'}</div>
                            <div className="text-xs text-muted-foreground">{agreement.plot?.project ? `${formatProjectName(agreement.plot.project)} - Block ${agreement.plot.block}` : '-'}</div>
                          </TableCell>
                          <TableCell>{formatCurrency(agreement.totalAmount)}</TableCell>
                          <TableCell>{formatCurrency(agreement.downPayment)}</TableCell>
                          <TableCell>
                            {agreement.installmentMonths > 0 ? (
                              <div>
                                <div>{agreement.installmentMonths} months</div>
                                <div className="text-xs text-muted-foreground">{formatCurrency(agreement.monthlyAmount)}/mo</div>
                              </div>
                            ) : (
                              <span>Full Payment</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>{agreement.createdBy?.name || '-'}</div>
                            <div className="text-xs text-muted-foreground">{agreement.createdBy?.email || '-'}</div>
                          </TableCell>
                          <TableCell>{formatDate(agreement.agreementDate)}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePrintAgreement(agreement)}
                              className="h-8 w-8 p-0"
                              title="View Print Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(agreement, 'agreement')}
                                className="h-8 w-8 p-0"
                                title={t('approvals.approve')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(agreement, 'agreement')}
                                className="h-8 w-8 p-0"
                                title={t('approvals.reject')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transfer Forms Tab */}
          <TabsContent value="transfers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('approvals.pendingTransferForms')}</CardTitle>
                <CardDescription>{t('approvals.reviewTransferForms')}</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTransfers ? (
                  <div className="text-center py-8">{t('common.loading')}</div>
                ) : !pendingTransfers || pendingTransfers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('approvals.noPendingTransfers')}
                  </div>
                ) : (
                  <div className="overflow-x-auto" dir={isUrdu ? 'rtl' : 'ltr'}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('forms.transferNumber')}</TableHead>
                          <TableHead>{t('forms.fromCustomer')}</TableHead>
                          <TableHead>{t('forms.toCustomer')}</TableHead>
                          <TableHead>{t('inventory.plotNo')}</TableHead>
                          <TableHead>{t('forms.transferFee')}</TableHead>
                          <TableHead>{t('forms.transferReason')}</TableHead>
                          <TableHead>{t('approvals.submittedBy')}</TableHead>
                          <TableHead>{t('forms.date')}</TableHead>
                          <TableHead className="text-center">{t('common.view')}</TableHead>
                          <TableHead className="w-32">{t('common.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingTransfers.map((transfer: any) => (
                          <TableRow key={transfer.id}>
                            <TableCell>{transfer.transferNumber}</TableCell>
                            <TableCell>
                              <div>{transfer.fromCustomer?.name || '-'}</div>
                              <div className="text-xs text-muted-foreground">{transfer.fromCustomer?.cnic || '-'}</div>
                            </TableCell>
                            <TableCell>
                              <div>{transfer.toCustomer?.name || '-'}</div>
                              <div className="text-xs text-muted-foreground">{transfer.toCustomer?.cnic || '-'}</div>
                            </TableCell>
                            <TableCell>
                              <div>{transfer.plot?.plotNo || '-'}</div>
                              <div className="text-xs text-muted-foreground">{transfer.plot?.project ? formatProjectName(transfer.plot.project) : '-'}</div>
                            </TableCell>
                            <TableCell>{formatCurrency(transfer.transferFee)}</TableCell>
                            <TableCell>{transfer.transferReason}</TableCell>
                            <TableCell>
                              <div>{transfer.createdBy?.name || '-'}</div>
                              <div className="text-xs text-muted-foreground">{transfer.createdBy?.email || '-'}</div>
                            </TableCell>
                            <TableCell>{formatDate(transfer.transferDate)}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlePrintTransfer(transfer)}
                                className="h-8 w-8 p-0"
                                title="View Print Preview"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(transfer, 'transfer')}
                                  className="h-8 w-8 p-0"
                                  title={t('approvals.approve')}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(transfer, 'transfer')}
                                  className="h-8 w-8 p-0"
                                  title={t('approvals.reject')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
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
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('approvals.pendingPayments')}</CardTitle>
                <CardDescription>{t('approvals.reviewPayments')}</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPayments ? (
                  <div className="text-center py-8">{t('common.loading')}</div>
                ) : !pendingPayments || pendingPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('approvals.noPendingPayments')}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('vouchers.voucherNo')}</TableHead>
                        <TableHead>{t('vouchers.type')}</TableHead>
                        <TableHead>{t('forms.customer')}</TableHead>
                        <TableHead>{t('inventory.plotNo')}</TableHead>
                        <TableHead>{t('payments.amount')}</TableHead>
                        <TableHead>{t('payments.paymentMethod')}</TableHead>
                        <TableHead>{t('approvals.submittedBy')}</TableHead>
                        <TableHead>{t('forms.date')}</TableHead>
                        <TableHead className="text-center">{t('common.view')}</TableHead>
                        <TableHead className="w-32">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.voucherNo}</TableCell>
                          <TableCell>{formatEnum(payment.type)}</TableCell>
                          <TableCell>
                            <div>{payment.plot?.customer?.name || payment.customer?.name || '-'}</div>
                            <div className="text-xs text-muted-foreground">{payment.plot?.customer?.cnic || payment.customer?.cnic || '-'}</div>
                          </TableCell>
                          <TableCell>
                            {payment.plot ? (
                              <div>
                                <div>{payment.plot.plotNo}</div>
                                <div className="text-xs text-muted-foreground">{formatProjectName(payment.plot.project)}</div>
                              </div>
                            ) : (
                              <span>-</span>
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{formatEnum(payment.paymentMethod)}</TableCell>
                          <TableCell>
                            <div>{payment.createdBy?.name || '-'}</div>
                            <div className="text-xs text-muted-foreground">{payment.createdBy?.email || '-'}</div>
                          </TableCell>
                          <TableCell>{formatDate(payment.date)}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePrintPayment(payment)}
                              className="h-8 w-8 p-0"
                              title="View Print Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(payment, 'payment')}
                                className="h-8 w-8 p-0"
                                title={t('approvals.approve')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(payment, 'payment')}
                                className="h-8 w-8 p-0"
                                title={t('approvals.reject')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Approve Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t('approvals.approve')}{' '}
                {approvalType === 'biyana' 
                  ? t('forms.biyanaForm') 
                  : approvalType === 'transfer' 
                  ? t('forms.transferForm') 
                  : approvalType === 'agreement'
                  ? t('forms.saleAgreement')
                  : t('vouchers.title')}
              </DialogTitle>
              <DialogDescription>
                {t('approvals.confirmApprove')}
              </DialogDescription>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium">
                    {approvalType === 'biyana' 
                      ? t('forms.formNumber') 
                      : approvalType === 'transfer'
                      ? t('forms.transferNumber')
                      : approvalType === 'agreement'
                      ? t('forms.agreementNumber')
                      : t('vouchers.voucherNo')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {approvalType === 'biyana' 
                      ? selectedItem.formNumber 
                      : approvalType === 'transfer'
                      ? selectedItem.transferNumber
                      : approvalType === 'agreement'
                      ? selectedItem.agreementNumber
                      : selectedItem.voucherNo}
                  </div>
                </div>
                {approvalType === 'transfer' ? (
                  <>
                    <div>
                      <div className="text-sm font-medium">{t('forms.fromCustomer')}</div>
                      <div className="text-sm text-muted-foreground">{selectedItem.fromCustomer?.name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">{t('forms.toCustomer')}</div>
                      <div className="text-sm text-muted-foreground">{selectedItem.toCustomer?.name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">{t('inventory.plotNo')}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedItem.plot?.plotNo} - {selectedItem.plot?.project ? formatProjectName(selectedItem.plot.project) : ''}
                      </div>
                    </div>
                  </>
                ) : selectedItem.customer && (
                  <div>
                    <div className="text-sm font-medium">{t('forms.customer')}</div>
                    <div className="text-sm text-muted-foreground">{selectedItem.customer?.name}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium">
                    {approvalType === 'transfer' ? t('forms.transferFee') : t('payments.amount')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(
                      approvalType === 'biyana' 
                        ? selectedItem.biyanaAmount 
                        : approvalType === 'transfer'
                        ? selectedItem.transferFee
                        : approvalType === 'agreement'
                        ? selectedItem.downPayment
                        : selectedItem.amount
                    )}
                  </div>
                </div>
                {approvalType === 'payment' && (
                  <>
                    {selectedItem.formType && (
                      <div>
                        <div className="text-sm font-medium">{t('payments.paymentType')}</div>
                        <div className="text-sm text-muted-foreground">{formatPaymentType(selectedItem.formType)}</div>
                      </div>
                    )}
                    {selectedItem.paymentMethod === 'BANK_DEPOSIT' && (
                      <>
                        {selectedItem.bankName && (
                          <div>
                            <div className="text-sm font-medium">{t('vouchers.bankName')}</div>
                            <div className="text-sm text-muted-foreground">{formatEnum(selectedItem.bankName)}</div>
                          </div>
                        )}
                        {selectedItem.accountNumber && (
                          <div>
                            <div className="text-sm font-medium">Account Number</div>
                            <div className="text-sm text-muted-foreground">{selectedItem.accountNumber}</div>
                          </div>
                        )}
                        {selectedItem.slipNumber && (
                          <div>
                            <div className="text-sm font-medium">Slip Number</div>
                            <div className="text-sm text-muted-foreground">{selectedItem.slipNumber}</div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
                <div>
                  <div className="text-sm font-medium">{t('forms.date')}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(
                      approvalType === 'transfer' 
                        ? selectedItem.transferDate
                        : approvalType === 'agreement'
                        ? selectedItem.agreementDate
                        : selectedItem.date
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={confirmApprove}>
                {t('approvals.confirmApproval')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t('approvals.reject')}{' '}
                {approvalType === 'biyana' 
                  ? t('forms.biyanaForm') 
                  : approvalType === 'transfer' 
                  ? t('forms.transferForm') 
                  : approvalType === 'agreement'
                  ? t('forms.saleAgreement')
                  : t('vouchers.title')}
              </DialogTitle>
              <DialogDescription>
                {t('approvals.provideReason')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejectReason">{t('approvals.rejectionReason')}</Label>
                <Textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="destructive" onClick={confirmReject}>
                {t('approvals.confirmRejection')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Biyana Print Dialog */}
        <Dialog open={isPrintBiyanaOpen} onOpenChange={setIsPrintBiyanaOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <VisuallyHidden>
              <DialogTitle>Biyana Form Preview</DialogTitle>
              <DialogDescription>Print preview of Biyana form</DialogDescription>
            </VisuallyHidden>
            {printData && (
              <PrintableBiyanaFormSimple 
                data={printData}
                onClose={() => setIsPrintBiyanaOpen(false)}
                hidePrintButton={true}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Sale Agreement Print Dialog */}
        <Dialog open={isPrintAgreementOpen} onOpenChange={setIsPrintAgreementOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <VisuallyHidden>
              <DialogTitle>Sale Agreement Preview</DialogTitle>
              <DialogDescription>Print preview of sale agreement</DialogDescription>
            </VisuallyHidden>
            {printData && (
              <PrintableSaleAgreementForm 
                data={printData}
                onClose={() => setIsPrintAgreementOpen(false)}
                hidePrintButton={true}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Transfer Print Dialog */}
        <Dialog open={isPrintTransferOpen} onOpenChange={setIsPrintTransferOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <VisuallyHidden>
              <DialogTitle>Transfer Form Preview</DialogTitle>
              <DialogDescription>Print preview of transfer form</DialogDescription>
            </VisuallyHidden>
            {printData && (
              <PrintableTransferForm 
                data={printData}
                onClose={() => setIsPrintTransferOpen(false)}
                hidePrintButton={true}
                isApprovalView={true}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Payment Voucher Print Dialog */}
        <Dialog open={isPrintPaymentOpen} onOpenChange={(open) => {
          setIsPrintPaymentOpen(open);
          if (!open) setSelectedPaymentId(null);
        }}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
            <VisuallyHidden>
              <DialogTitle>Payment Voucher Preview</DialogTitle>
              <DialogDescription>Print preview of payment voucher</DialogDescription>
            </VisuallyHidden>
            {voucherData && (
              <div className="p-6">
                <PrintableVoucherContent voucher={voucherData} onClose={() => {
                  setIsPrintPaymentOpen(false);
                  setSelectedPaymentId(null);
                }} />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

// Separate component for printable voucher content
function PrintableVoucherContent({ voucher, onClose }: { voucher: any; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

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
      month: "long",
      day: "numeric",
    });
  };

  const formatEnum = (value: string) => {
    if (!value) return "";
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatProjectName = (value: string) => {
    if (!value) return "";
    // Check for translation first
    if (value === 'SHADMAN_GREENS') {
      const translated = t('projects.shadmanGreens');
      if (translated && !translated.startsWith('projects.')) return translated;
    }
    // Fallback to formatting the enum value
    return formatEnum(value);
  };

  const formatPaymentMethod = (method: string) => {
    if (!method) return "";
    return t(`payments.paymentMethods.${method}`) || formatEnum(method);
  };

  const formatPaymentType = (type: string) => {
    if (!type) return "";
    return t(`payments.paymentTypes.${type}`) || formatEnum(type);
  };

  const renderReceiptContent = () => (
    <div className="receipt-copy" style={{ position: 'relative', padding: '40px 60px' }}>
      {/* Logo Watermark */}
      <div className="watermark-logo" style={{ 
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.08,
        zIndex: 0,
        pointerEvents: 'none',
        width: '500px',
        height: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <img 
          src="/Logo.png" 
          alt="Watermark" 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }} dir={isUrdu ? 'rtl' : 'ltr'}>
        {/* Header Section with Logo and Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', borderBottom: '3px solid #000', paddingBottom: '20px' }}>
          <div>
            <img src="/Logo.png" alt="Logo" style={{ height: '80px', width: 'auto' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, fontFamily: "'Outfit', sans-serif", letterSpacing: '2px' }}>
              PAYMENT RECEIPT
            </h1>
            <div style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#000', color: '#fff', display: 'inline-block' }}>
              <strong>{voucher.voucherNo}</strong>
            </div>
          </div>
        </div>

        {/* Basic Information Section */}
        <div style={{ marginBottom: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', width: '25%', fontWeight: '600' }}>Name:</td>
                <td style={{ padding: '8px 0', borderBottom: '1px solid #ccc' }}>
                  {voucher.customer?.name || voucher.plot?.buyer?.name || ''}
                </td>
                <td style={{ padding: '8px 0', width: '15%', textAlign: 'right', fontWeight: '600' }}>Date:</td>
                <td style={{ padding: '8px 0', width: '25%', borderBottom: '1px solid #ccc', textAlign: 'right' }}>
                  {formatDate(voucher.date)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: '600' }}>ID/Document:</td>
                <td colSpan={3} style={{ padding: '8px 0', borderBottom: '1px solid #ccc' }}>
                  {voucher.customer?.cnic || voucher.plot?.buyer?.cnic || ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Project Details Section */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{ backgroundColor: '#f5f5f5', padding: '8px 12px', fontWeight: 'bold', border: '1px solid #000', marginBottom: '2px' }}>
            Project Details
          </div>
          <table style={{ width: '100%', border: '1px solid #000', borderTop: 'none' }}>
            <tbody>
              <tr>
                <td style={{ padding: '10px', width: '30%', borderRight: '1px solid #ddd', fontWeight: '600' }}>Project Name:</td>
                <td style={{ padding: '10px' }}>{formatProjectName(voucher.plot?.project || 'SHADMAN_GREENS')}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', borderTop: '1px solid #ddd', borderRight: '1px solid #ddd', fontWeight: '600' }}>Plot No:</td>
                <td style={{ padding: '10px', borderTop: '1px solid #ddd' }}>{voucher.plot?.plotNo || ''}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Details Section */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ backgroundColor: '#f5f5f5', padding: '8px 12px', fontWeight: 'bold', border: '1px solid #000', marginBottom: '2px' }}>
            Payment Details
          </div>
          <table style={{ width: '100%', border: '1px solid #000', borderTop: 'none' }}>
            <tbody>
              <tr>
                <td style={{ padding: '12px', width: '30%', borderRight: '1px solid #ddd', fontWeight: '600' }}>Payment Type:</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>
                  {voucher.formType === 'BIYANA' ? 'Biyana Payment' :
                   voucher.formType === 'INSTALLMENT' ? 'Installment' :
                   voucher.formType === 'QUARTERLY' ? 'Quarterly Payment' :
                   voucher.formType === 'SALES_AGREEMENT' ? 'Sales Agreement Payment' :
                   formatPaymentType(voucher.formType)}
                </td>
              </tr>
              <tr style={{ backgroundColor: '#fff9e6' }}>
                <td style={{ padding: '12px', borderTop: '1px solid #ddd', borderRight: '1px solid #ddd', fontWeight: '600' }}>Amount:</td>
                <td style={{ padding: '12px', borderTop: '1px solid #ddd', fontSize: '20px', fontWeight: 'bold', color: '#0a5c0a' }}>
                  {formatCurrency(voucher.amount)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '12px', borderTop: '1px solid #ddd', borderRight: '1px solid #ddd', fontWeight: '600' }}>Payment Method:</td>
                <td style={{ padding: '12px', borderTop: '1px solid #ddd' }}>{formatPaymentMethod(voucher.paymentMethod)}</td>
              </tr>
              {voucher.chequeNumber && (
                <tr>
                  <td style={{ padding: '12px', borderTop: '1px solid #ddd', borderRight: '1px solid #ddd', fontWeight: '600' }}>Cheque Number:</td>
                  <td style={{ padding: '12px', borderTop: '1px solid #ddd' }}>{voucher.chequeNumber}</td>
                </tr>
              )}
              {voucher.bankName && (
                <tr>
                  <td style={{ padding: '12px', borderTop: '1px solid #ddd', borderRight: '1px solid #ddd', fontWeight: '600' }}>Bank Name:</td>
                  <td style={{ padding: '12px', borderTop: '1px solid #ddd' }}>{formatEnum(voucher.bankName)}</td>
                </tr>
              )}
              {voucher.accountNumber && (
                <tr>
                  <td style={{ padding: '12px', borderTop: '1px solid #ddd', borderRight: '1px solid #ddd', fontWeight: '600' }}>Account Number:</td>
                  <td style={{ padding: '12px', borderTop: '1px solid #ddd' }}>{voucher.accountNumber}</td>
                </tr>
              )}
              {voucher.slipNumber && (
                <tr>
                  <td style={{ padding: '12px', borderTop: '1px solid #ddd', borderRight: '1px solid #ddd', fontWeight: '600' }}>Slip Number:</td>
                  <td style={{ padding: '12px', borderTop: '1px solid #ddd' }}>{voucher.slipNumber}</td>
                </tr>
              )}
              {voucher.description && (
                <tr>
                  <td style={{ padding: '12px', borderTop: '1px solid #ddd', borderRight: '1px solid #ddd', fontWeight: '600', verticalAlign: 'top' }}>Description/Remarks:</td>
                  <td style={{ padding: '12px', borderTop: '1px solid #ddd' }}>{voucher.description}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Signatures Section */}
        <div style={{ marginTop: '80px', borderTop: '2px solid #000', paddingTop: '40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '2px solid #000', paddingTop: '8px', minHeight: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              </div>
              <p style={{ fontWeight: 'bold', marginTop: '8px', fontSize: '14px' }}>Customer Signature</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              {voucher.approvedBy?.signature ? (
                <div>
                  <div style={{ borderTop: '2px solid #000', paddingTop: '8px', minHeight: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <img 
                      src={voucher.approvedBy.signature.startsWith('http') ? voucher.approvedBy.signature : `${API_BASE_URL}${voucher.approvedBy.signature}`}
                      alt="Signature" 
                      style={{ maxHeight: '50px', maxWidth: '140px', objectFit: 'contain' }}
                    />
                  </div>
                  <p style={{ fontWeight: 'bold', marginTop: '8px', fontSize: '14px' }}>{voucher.approvedBy?.name}</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>Authorized Signature</p>
                </div>
              ) : (
                <div>
                  <div style={{ borderTop: '2px solid #000', paddingTop: '8px', minHeight: '60px' }}></div>
                  <p style={{ fontWeight: 'bold', marginTop: '8px', fontSize: '14px' }}>Authorized Signature</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px dotted #ccc', textAlign: 'center', fontSize: '11px', color: '#666' }}>
          <p style={{ margin: 0 }}>This is a computer-generated receipt and does not require a physical signature for validation.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Print Controls */}
      <div className="print:hidden mb-4 flex justify-between items-center border-b pb-4">
        <h2 className="text-lg font-semibold">{t('vouchers.paymentReceipt')} - {voucher.voucherNo}</h2>
        <div className="flex gap-2">
        </div>
      </div>

      {/* Printable Content */}
      <div className="bg-white">
        {renderReceiptContent()}
      </div>
    </div>
  );
}