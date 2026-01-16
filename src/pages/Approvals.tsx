import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, FileCheck, Wallet } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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

  // Helper function to format project names
  const formatProjectName = (value: string) => {
    if (value === 'SHADMAN_GREENS') {
      return t('projects.shadmanGreens');
    }
    return value;
  };

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approvalType, setApprovalType] = useState<'biyana' | 'payment' | 'agreement' | 'transfer'>('biyana');

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
        title: "Success",
        description: "Transfer form approved successfully",
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
                    <span className="text-xs text-muted-foreground">{t('status.pending')}</span>
                    <span className="text-sm font-semibold">{stats.forms.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t('status.approved')}</span>
                    <span className="text-sm font-semibold text-green-600">{stats.forms.approved}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t('status.rejected')}</span>
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
                    <span className="text-xs text-muted-foreground">{t('status.pending')}</span>
                    <span className="text-sm font-semibold">{stats.agreements?.pending || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t('status.approved')}</span>
                    <span className="text-sm font-semibold text-green-600">{stats.agreements?.approved || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t('status.rejected')}</span>
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
                    <span className="text-xs text-muted-foreground">{t('status.pending')}</span>
                    <span className="text-sm font-semibold">{stats.transfers?.pending || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t('status.approved')}</span>
                    <span className="text-sm font-semibold text-green-600">{stats.transfers?.approved || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t('status.rejected')}</span>
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
                    <span className="text-xs text-muted-foreground">{t('status.pending')}</span>
                    <span className="text-sm font-semibold">{stats.payments.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t('status.approved')}</span>
                    <span className="text-sm font-semibold text-green-600">{stats.payments.approved}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t('status.rejected')}</span>
                    <span className="text-sm font-semibold text-red-600">{stats.payments.rejected}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs for Biyana Forms, Agreements, Transfers, and Payments */}
        <Tabs defaultValue="forms" className="space-y-4">
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
                        <TableHead>{t('payments.paymentMethod')}</TableHead>
                        <TableHead>{t('approvals.submittedBy')}</TableHead>
                        <TableHead>{t('forms.date')}</TableHead>
                        <TableHead>{t('common.actions')}</TableHead>
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
                          <TableCell>{formatCurrency(biyana.biyanaAmount)}</TableCell>
                          <TableCell>{formatEnum(biyana.paymentMethod)}</TableCell>
                          <TableCell>
                            <div>{biyana.createdBy?.name || '-'}</div>
                            <div className="text-xs text-muted-foreground">{biyana.createdBy?.email || '-'}</div>
                          </TableCell>
                          <TableCell>{formatDate(biyana.date)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(biyana, 'biyana')}
                              >
                                {t('approvals.approve')}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(biyana, 'biyana')}
                              >
                                {t('approvals.reject')}
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
                        <TableHead>Actions</TableHead>
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
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(agreement, 'agreement')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(agreement, 'agreement')}
                              >
                                {t('approvals.reject')}
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
                          <TableHead>{t('common.actions')}</TableHead>
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
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(transfer, 'transfer')}
                                >
                                  {t('approvals.approve')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(transfer, 'transfer')}
                                >
                                  {t('approvals.reject')}
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
                        <TableHead>{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.voucherNo}</TableCell>
                          <TableCell>{formatEnum(payment.type)}</TableCell>
                          <TableCell>
                            <div>{payment.customer?.name || '-'}</div>
                            <div className="text-xs text-muted-foreground">{payment.customer?.cnic || '-'}</div>
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
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(payment, 'payment')}
                              >
                                {t('approvals.approve')}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(payment, 'payment')}
                              >
                                {t('approvals.reject')}
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
              <DialogTitle>{t('approvals.approve')} {approvalType === 'biyana' ? t('forms.biyanaForm') : t('vouchers.title')}</DialogTitle>
              <DialogDescription>
                {t('approvals.confirmApprove')}
              </DialogDescription>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium">{approvalType === 'biyana' ? t('forms.formNumber') : t('vouchers.voucherNo')}</div>
                  <div className="text-sm text-muted-foreground">{approvalType === 'biyana' ? selectedItem.formNumber : selectedItem.voucherNo}</div>
                </div>
                {selectedItem.customer && (
                  <div>
                    <div className="text-sm font-medium">{t('forms.customer')}</div>
                    <div className="text-sm text-muted-foreground">{selectedItem.customer?.name}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium">{t('payments.amount')}</div>
                  <div className="text-sm text-muted-foreground">{formatCurrency(approvalType === 'biyana' ? selectedItem.biyanaAmount : selectedItem.amount)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">{t('forms.date')}</div>
                  <div className="text-sm text-muted-foreground">{formatDate(selectedItem.date)}</div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                {t('common.cancel')}
              </Button>
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
              <DialogTitle>{t('approvals.reject')} {approvalType === 'biyana' ? t('forms.biyanaForm') : t('vouchers.title')}</DialogTitle>
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
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason("");
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" onClick={confirmReject}>
                {t('approvals.confirmRejection')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}