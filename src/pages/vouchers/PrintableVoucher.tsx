import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { voucherAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrintableVoucher() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const voucherId = id || searchParams.get('id');

  const { data: voucher, isLoading } = useQuery({
    queryKey: ['voucher', voucherId],
    queryFn: async () => {
      if (!voucherId) return null;
      const response = await voucherAPI.getById(voucherId);
      return response.data;
    },
    enabled: !!voucherId,
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
      month: "long",
      day: "numeric",
    });
  };

  const formatEnum = (value: string) => {
    if (!value) return "";
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading voucher...</div>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Voucher not found</div>
      </div>
    );
  }

  return (
    <>
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden bg-gray-100 p-4 sticky top-0 z-10 border-b">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate('/payments/pending')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </div>

      {/* Printable Voucher */}
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto bg-white border-2 border-gray-800 p-8">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-800">SHADMAN HOUSING</h1>
            <p className="text-sm text-gray-600 mt-1">Real Estate & Property Management</p>
            <p className="text-xs text-gray-500 mt-1">Phone: +92 300 0000000 | Email: info@shadmanhousing.com</p>
          </div>

          {/* Voucher Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 uppercase">Payment Receipt</h2>
            <div className="mt-2 inline-block bg-gray-800 text-white px-4 py-1 text-sm font-semibold">
              {voucher.voucherNo}
            </div>
          </div>

          {/* Date */}
          <div className="text-right mb-6">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Date:</span> {formatDate(voucher.date)}
            </p>
          </div>

          {/* Received From Section */}
          <div className="mb-6 border border-gray-300 p-4 rounded">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Received From</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold text-gray-800">{voucher.customer?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">CNIC</p>
                <p className="font-semibold text-gray-800">{voucher.customer?.cnic || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-semibold text-gray-800">{voucher.customer?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-semibold text-gray-800">{voucher.customer?.address || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Property Details */}
          {voucher.plot && (
            <div className="mb-6 border border-gray-300 p-4 rounded">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Property Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plot Number</p>
                  <p className="font-semibold text-gray-800">{voucher.plot.plotNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Project</p>
                  <p className="font-semibold text-gray-800">{formatEnum(voucher.plot.project)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="mb-6 border-2 border-gray-800 p-4 rounded bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b-2 border-gray-800 pb-2">Payment Details</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Amount Received</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(voucher.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-semibold text-gray-800">{formatEnum(voucher.paymentMethod)}</p>
              </div>
            </div>

            {/* Additional Payment Details */}
            {(voucher.chequeNumber || voucher.bankName || voucher.transactionId) && (
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-300">
                {voucher.chequeNumber && (
                  <div>
                    <p className="text-sm text-gray-600">Cheque Number</p>
                    <p className="font-semibold text-gray-800">{voucher.chequeNumber}</p>
                  </div>
                )}
                {voucher.bankName && (
                  <div>
                    <p className="text-sm text-gray-600">Bank Name</p>
                    <p className="font-semibold text-gray-800">{voucher.bankName}</p>
                  </div>
                )}
                {voucher.transactionId && (
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <p className="font-semibold text-gray-800">{voucher.transactionId}</p>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {voucher.description && (
              <div className="mt-4 pt-3 border-t border-gray-300">
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-gray-800">{voucher.description}</p>
              </div>
            )}
          </div>

          {/* Amount in Words */}
          <div className="mb-6 p-4 bg-gray-100 rounded">
            <p className="text-sm text-gray-600 mb-1">Amount in Words:</p>
            <p className="font-semibold text-gray-800 italic">
              {/* You can implement number-to-words conversion here */}
              {formatCurrency(voucher.amount)} Only
            </p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t-2 border-gray-300">
            <div>
              <div className="border-t-2 border-gray-800 pt-2 mt-16">
                <p className="text-sm text-gray-600 text-center">Received By</p>
                <p className="text-xs text-gray-500 text-center mt-1">Authorized Signature</p>
              </div>
            </div>
            <div>
              <div className="border-t-2 border-gray-800 pt-2 mt-16">
                <p className="text-sm text-gray-600 text-center">Customer Signature</p>
                <p className="text-xs text-gray-500 text-center mt-1">{voucher.customer?.name}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-300 text-center">
            <p className="text-xs text-gray-500">
              This is a computer-generated receipt and is valid without signature.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              For any queries, please contact our office.
            </p>
          </div>

          {/* Duplicate Copy Indicator */}
          <div className="mt-8 text-center border-t-2 border-dashed border-gray-400 pt-4">
            <p className="text-sm text-gray-500 font-semibold">CUSTOMER COPY</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </>
  );
}
