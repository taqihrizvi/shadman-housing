import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SoldInventory from "./pages/inventory/SoldInventory";
import UnsoldInventory from "./pages/inventory/UnsoldInventory";
import AddInventory from "./pages/inventory/AddInventory";
import BiyanaForm from "./pages/forms/BiyanaForm";
import SaleAgreementForm from "./pages/forms/SaleAgreementForm";
import TransferForm from "./pages/forms/TransferForm";
import SalesReport from "./pages/reports/SalesReport";
import PaymentReport from "./pages/reports/PaymentReport";
import ComparisonReport from "./pages/reports/ComparisonReport";
import Vouchers from "./pages/Vouchers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/inventory/sold" element={<SoldInventory />} />
          <Route path="/inventory/unsold" element={<UnsoldInventory />} />
          <Route path="/inventory/add" element={<AddInventory />} />
          <Route path="/forms/biyana" element={<BiyanaForm />} />
          <Route path="/forms/sale-agreement" element={<SaleAgreementForm />} />
          <Route path="/forms/transfer" element={<TransferForm />} />
          <Route path="/reports/sales" element={<SalesReport />} />
          <Route path="/reports/payment" element={<PaymentReport />} />
          <Route path="/reports/comparison" element={<ComparisonReport />} />
          <Route path="/vouchers" element={<Vouchers />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
