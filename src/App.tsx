import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import SoldInventory from "./pages/inventory/SoldInventory";
import UnsoldInventory from "./pages/inventory/UnsoldInventory";
import AddInventory from "./pages/inventory/AddInventory";
import BiyanaForm from "./pages/forms/BiyanaForm";
import SaleAgreementForm from "./pages/forms/SaleAgreementForm";
import TransferForm from "./pages/forms/TransferForm";
import ViewBiyanaForms from "./pages/submitted-forms/ViewBiyanaForms";
import ViewSaleAgreements from "./pages/submitted-forms/ViewSaleAgreements";
import ViewTransferForms from "./pages/submitted-forms/ViewTransferForms";
import PendingPayments from "./pages/payments/PendingPayments";
import RecordPayment from "./pages/payments/RecordPayment";
import PrintableVoucher from "./pages/vouchers/PrintableVoucher";
import SalesReport from "./pages/reports/SalesReport";
import PaymentReport from "./pages/reports/PaymentReport";
import ComparisonReport from "./pages/reports/ComparisonReport";
import Vouchers from "./pages/Vouchers";
import Approvals from "./pages/Approvals";
import AdminSettings from "./pages/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Index />} />
          <Route path="/inventory/sold" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><SoldInventory /></ProtectedRoute>} />
          <Route path="/inventory/unsold" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><UnsoldInventory /></ProtectedRoute>} />
          <Route path="/inventory/add" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><AddInventory /></ProtectedRoute>} />
          <Route path="/forms/biyana" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><BiyanaForm /></ProtectedRoute>} />
          <Route path="/forms/sale-agreement" element={<ProtectedRoute allowedRoles={['ADMIN']}><SaleAgreementForm /></ProtectedRoute>} />
          <Route path="/forms/transfer" element={<ProtectedRoute allowedRoles={['ADMIN']}><TransferForm /></ProtectedRoute>} />
          <Route path="/submitted-forms/biyana" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><ViewBiyanaForms /></ProtectedRoute>} />
          <Route path="/submitted-forms/sale-agreement" element={<ProtectedRoute allowedRoles={['ADMIN']}><ViewSaleAgreements /></ProtectedRoute>} />
          <Route path="/submitted-forms/transfer" element={<ProtectedRoute allowedRoles={['ADMIN']}><ViewTransferForms /></ProtectedRoute>} />
          <Route path="/payments/pending" element={<ProtectedRoute allowedRoles={['ADMIN']}><PendingPayments /></ProtectedRoute>} />
          <Route path="/payments/record" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><RecordPayment /></ProtectedRoute>} />
          <Route path="/vouchers/print/:id" element={<PrintableVoucher />} />
          <Route path="/reports/sales" element={<ProtectedRoute allowedRoles={['ADMIN']}><SalesReport /></ProtectedRoute>} />
          <Route path="/reports/payment" element={<ProtectedRoute allowedRoles={['ADMIN']}><PaymentReport /></ProtectedRoute>} />
          <Route path="/reports/comparison" element={<ProtectedRoute allowedRoles={['ADMIN']}><ComparisonReport /></ProtectedRoute>} />
          <Route path="/vouchers" element={<ProtectedRoute allowedRoles={['ADMIN']}><Vouchers /></ProtectedRoute>} />
          <Route path="/approvals" element={<ProtectedRoute allowedRoles={['ADMIN']}><Approvals /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminSettings /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
