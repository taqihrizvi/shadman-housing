import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, FileCheck, Wallet } from "lucide-react";
import { useState } from "react";

const API_URL = "http://localhost:5000/api";

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
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approvalType, setApprovalType] = useState<'biyana' | 'payment' | 'agreement'>('biyana');

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

  const handleApprove = (item: any, type: 'biyana' | 'payment' | 'agreement') => {
    setSelectedItem(item);
    setApprovalType(type);
    setShowDialog(true);
  };

  const handleReject = (item: any, type: 'biyana' | 'payment' | 'agreement') => {
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
          <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
          <p className="text-muted-foreground">Review and approve pending forms and payments</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-3">
            {/* Form Approvals Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Biyana Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm font-medium">Pending</p>
                    </div>
                    <p className="text-2xl font-bold mt-1">{stats.forms.pending}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium">Approved</p>
                    </div>
                    <p className="text-2xl font-bold mt-1">{stats.forms.approved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agreement Approvals Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agreement Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm font-medium">Pending</p>
                    </div>
                    <p className="text-2xl font-bold mt-1">{stats.agreements?.pending || 0}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium">Approved</p>
                    </div>
                    <p className="text-2xl font-bold mt-1">{stats.agreements?.approved || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Approvals Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm font-medium">Pending</p>
                    </div>
                    <p className="text-2xl font-bold mt-1">{stats.payments.pending}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium">Approved</p>
                    </div>
                    <p className="text-2xl font-bold mt-1">{stats.payments.approved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs for Biyana Forms, Agreements, and Payments */}
        <Tabs defaultValue="forms" className="space-y-4">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="forms">
              <FileCheck className="mr-2 h-4 w-4" />
              Biyana Forms
            </TabsTrigger>
            <TabsTrigger value="agreements">
              <FileCheck className="mr-2 h-4 w-4" />
              Sale Agreements
            </TabsTrigger>
            <TabsTrigger value="payments">
              <Wallet className="mr-2 h-4 w-4" />
              Payment Approvals
            </TabsTrigger>
          </TabsList>

          {/* Forms Tab */}
          <TabsContent value="forms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Biyana Forms</CardTitle>
                <CardDescription>Review and approve Biyana forms submitted by managers</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBiyanas ? (
                  <div className="text-center py-8">Loading...</div>
                ) : !pendingBiyanas || pendingBiyanas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending form approvals
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Form #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Plot</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingBiyanas.map((biyana: any) => (
                        <TableRow key={biyana.id}>
                          <TableCell className="font-medium">{biyana.formNumber}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{biyana.customer.name}</p>
                              <p className="text-sm text-muted-foreground">{biyana.customer.cnic}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{biyana.plot.plotNo}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatEnum(biyana.plot.project)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(biyana.biyanaAmount)}
                          </TableCell>
                          <TableCell>{formatEnum(biyana.paymentMethod)}</TableCell>
                          <TableCell>
                            <div>
                              <p>{biyana.createdBy.name}</p>
                              <p className="text-sm text-muted-foreground">{biyana.createdBy.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(biyana.date)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(biyana, 'biyana')}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(biyana, 'biyana')}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
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
                <CardTitle>Pending Sale Agreements</CardTitle>
                <CardDescription>Review and approve sale agreements submitted by managers</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAgreements ? (
                  <div className="text-center py-8">Loading...</div>
                ) : !pendingAgreements || pendingAgreements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending agreement approvals
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agreement #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Plot</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Down Payment</TableHead>
                        <TableHead>Installments</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingAgreements.map((agreement: any) => (
                        <TableRow key={agreement.id}>
                          <TableCell className="font-medium">{agreement.agreementNumber}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{agreement.customer.name}</div>
                              <div className="text-sm text-muted-foreground">{agreement.customer.cnic}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{agreement.plot.plotNo}</div>
                              <div className="text-sm text-muted-foreground">{formatEnum(agreement.plot.project)} - Block {agreement.plot.block}</div>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(agreement.totalAmount)}</TableCell>
                          <TableCell>{formatCurrency(agreement.downPayment)}</TableCell>
                          <TableCell>
                            {agreement.installmentMonths > 0 ? (
                              <div>
                                <div>{agreement.installmentMonths} months</div>
                                <div className="text-sm text-muted-foreground">{formatCurrency(agreement.monthlyAmount)}/mo</div>
                              </div>
                            ) : (
                              <Badge variant="secondary">Full Payment</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{agreement.createdBy.name}</div>
                              <div className="text-muted-foreground">{agreement.createdBy.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(agreement.agreementDate)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(agreement, 'agreement')}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(agreement, 'agreement')}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
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

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Payment Vouchers</CardTitle>
                <CardDescription>Review and approve payment vouchers submitted by managers</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPayments ? (
                  <div className="text-center py-8">Loading...</div>
                ) : !pendingPayments || pendingPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending payment approvals
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Voucher #</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Plot</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.voucherNo}</TableCell>
                          <TableCell>
                            <Badge variant={payment.type === 'RECEIPT' ? 'default' : 'secondary'}>
                              {formatEnum(payment.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payment.customer.name}</p>
                              <p className="text-sm text-muted-foreground">{payment.customer.cnic}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {payment.plot ? (
                              <div>
                                <p className="font-medium">{payment.plot.plotNo}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatEnum(payment.plot.project)}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>{formatEnum(payment.paymentMethod)}</TableCell>
                          <TableCell>
                            <div>
                              <p>{payment.createdBy.name}</p>
                              <p className="text-sm text-muted-foreground">{payment.createdBy.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(payment.date)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(payment, 'payment')}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(payment, 'payment')}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
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
              <DialogTitle>Approve {approvalType === 'biyana' ? 'Biyana Form' : 'Payment Voucher'}</DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this {approvalType === 'biyana' ? 'Biyana form' : 'payment voucher'}?
              </DialogDescription>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">{approvalType === 'biyana' ? 'Form Number' : 'Voucher Number'}</p>
                    <p className="text-sm text-muted-foreground">
                      {approvalType === 'biyana' ? selectedItem.formNumber : selectedItem.voucherNo}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Customer</p>
                    <p className="text-sm text-muted-foreground">{selectedItem.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Amount</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(approvalType === 'biyana' ? selectedItem.biyanaAmount : selectedItem.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedItem.date)}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmApprove}>
                Confirm Approval
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject {approvalType === 'biyana' ? 'Biyana Form' : 'Payment Voucher'}</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this {approvalType === 'biyana' ? 'Biyana form' : 'payment voucher'}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="reason">Rejection Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowRejectDialog(false);
                setRejectReason("");
              }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmReject}>
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
