
import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { apiFetch } from '../../lib/api';
import { toast } from 'react-toastify';
  // Helper to shorten IDs
  const shortId = (id: string) => id?.length > 8 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id;

  // Copy to clipboard and show toast
  const handleCopy = (id: string, label: string) => {
    navigator.clipboard.writeText(id);
    toast.success(`${label} copied!`);
  };

  const formatAmount = (value: unknown) => {
    const numeric = typeof value === 'number' ? value : parseFloat(String(value ?? 0));
    if (!Number.isFinite(numeric)) return '0.00';
    return numeric.toFixed(2);
  };

const Transactions: React.FC = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<{ moneyIn: number; moneyOut: number; netAmount: number }>({ moneyIn: 0, moneyOut: 0, netAmount: 0 });
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [txnType, setTxnType] = useState('');
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'orders' | 'bulk'>('all');

  // Export handler
  const handleExport = async () => {
    try {
      const params = [
        fromDate ? `startDate=${encodeURIComponent(fromDate)}` : '',
        toDate ? `endDate=${encodeURIComponent(toDate)}` : ''
      ].filter(Boolean).join('&');
      const res = await apiFetch<{
        success: boolean;
        data?: { csv: string; filename: string };
        message?: string;
      }>(`/api/transactions/export-all?${params}`);
      if (!res.success || !res.data?.csv) throw new Error(res.message || 'Export failed');
      // Decode base64 CSV
      const csvContent = atob(res.data.csv);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.data.filename || 'transactions.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Transactions exported!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to export transactions');
    }
  };

  const filteredTransactions = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = transactions.filter((txn) => {
      const orderObj = typeof txn.order === 'object' ? txn.order : null;
      const orderId = orderObj ? (orderObj._id || orderObj.id || '') : (txn.order || '');
      const storeId = txn.store?._id || txn.store?.id || txn.storeId || '';
      const isBulkOrder = !orderId && !storeId;
      const storeName = txn.store?.name || '';
      const txnId = txn._id || '';
      const userName = txn.user
        ? `${txn.user.firstName || ''} ${txn.user.lastName || ''}`.trim()
        : (orderObj?.shippingAddress?.name || '');
      const payment = txn.paymentMethod || '';
      const status = txn.status || '';
      const amount = String(txn.amount ?? '');

      const matchesStore = !selectedStoreId || String(storeId) === String(selectedStoreId);
      const matchesPaymentMethod = !paymentMethod || String(payment).toLowerCase() === String(paymentMethod).toLowerCase();
      const matchesStatus = !statusFilter || String(status).toLowerCase() === String(statusFilter).toLowerCase();
      const matchesTxnType = !txnType || String(txn.type || '').toLowerCase() === String(txnType).toLowerCase();
      const matchesOrderFilter =
        orderFilter === 'all' ||
        (orderFilter === 'orders' && !isBulkOrder) ||
        (orderFilter === 'bulk' && isBulkOrder);

      const matchesSearch =
        !query ||
        [txnId, orderId, userName, payment, status, storeName, amount]
          .join(' ')
          .toLowerCase()
          .includes(query);

      return matchesStore && matchesPaymentMethod && matchesStatus && matchesTxnType && matchesOrderFilter && matchesSearch;
    });

    return filtered;
  }, [transactions, search, paymentMethod, statusFilter, txnType, selectedStoreId, orderFilter]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await apiFetch<{ success: boolean; stores?: any[]; message?: string }>('/api/stores/');
        if (!res.success) throw new Error(res.message || 'Failed to fetch stores');
        const mapped = (res.stores || [])
          .map((store) => ({ id: String(store._id || store.id || ''), name: store.name || 'Unnamed Store' }))
          .filter((store) => store.id);
        setStores(mapped);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to fetch stores');
      }
    };
    fetchStores();
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `/api/transactions/get-all?page=${page}&limit=${limit}`;
        if (paymentMethod) url += `&paymentMethod=${encodeURIComponent(paymentMethod)}`;
        if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
        if (txnType) url += `&type=${encodeURIComponent(txnType)}`;
        if (selectedStoreId) url += `&storeId=${encodeURIComponent(selectedStoreId)}`;
        if (fromDate) url += `&fromDate=${encodeURIComponent(fromDate)}`;
        if (toDate) url += `&toDate=${encodeURIComponent(toDate)}`;

        const res = await apiFetch<{
          success: boolean;
          transactions?: any[];
          stats?: { moneyIn: number; moneyOut: number; netAmount: number };
          page?: number;
          limit?: number;
          total?: number;
          totalPages?: number;
          message?: string;
        }>(url);
        if (!res.success) throw new Error(res.message || 'Failed to fetch transactions');
        setTransactions(res.transactions || []);
        setStats(res.stats || { moneyIn: 0, moneyOut: 0, netAmount: 0 });
        setPage(res.page || page);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [paymentMethod, statusFilter, txnType, selectedStoreId, fromDate, toDate, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [paymentMethod, statusFilter, txnType, selectedStoreId, fromDate, toDate]);



  if (error) {
    return (
      <div className="p-8 text-center text-red-600">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="mb-2">Transactions & Settlements</h1>
          <p className="text-gray-600">Financial ledger and transaction history</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="fromDate" className="text-sm whitespace-nowrap">From:</Label>
            <Input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="toDate" className="text-sm whitespace-nowrap">To:</Label>
            <Input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-2">Total Amount In</p>
            <p className="text-green-600"><span className="dirham-symbol mr-2">&#xea;</span>{formatAmount(stats.moneyIn)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-2">Total Amount Out</p>
            <p className="text-red-600"><span className="dirham-symbol mr-2">&#xea;</span>{formatAmount(stats.moneyOut)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-2">Net Amount</p>
            <p className="text-blue-600"><span className="dirham-symbol mr-2">&#xea;</span>{formatAmount(stats.netAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap">
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search transactions..."
                className="pl-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="min-w-[180px]">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={selectedStoreId}
                onChange={e => setSelectedStoreId(e.target.value)}
              >
                <option value="">All Stores</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[180px]">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              >
                <option value="">Payment Method</option>
                <option value="wallet">Wallet</option>
                <option value="cod">Cash on Delivery</option>
                <option value="online">Online</option>
                <option value="pos">POS</option>
              </select>
            </div>
            <div className="min-w-[180px]">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">Status</option>
                <option value="completed">Completed</option>
                <option value="refunded">Refunded</option>
                <option value="partially_refunded">Partially Refunded</option>
              </select>
            </div>
            <div className="min-w-[180px]">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={txnType}
                onChange={e => setTxnType(e.target.value)}
              >
                <option value="">Transaction Type</option>
                <option value="in">Amount In</option>
                <option value="out">Amount Out</option>
              </select>
            </div>
            <div className="min-w-[180px]">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={orderFilter}
                onChange={e => setOrderFilter(e.target.value as 'all' | 'orders' | 'bulk')}
              >
                <option value="all">Order Type</option>
                <option value="orders">Orders</option>
                <option value="bulk">Bulk Orders</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between border-b pb-4">
            <p className="text-sm text-gray-600">
              Showing page {page} of {Math.max(totalPages, 1)} • Total records: {total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Transaction ID</th>
                  <th className="text-left py-3 px-4">Order ID</th>
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Amount In</th>
                  <th className="text-left py-3 px-4">Amount Out</th>
                  <th className="text-left py-3 px-4">Payment Method</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Store</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  // Show skeleton rows while loading
                  Array.from({ length: 8 }).map((_, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      {Array.from({ length: 9 }).map((_, colIdx) => (
                        <td key={colIdx} className="py-3 px-4">
                          <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      {orderFilter === 'bulk' ? 'No bulk order transactions found.' :
                        orderFilter === 'orders' ? 'No order transactions found.' :
                        'No transactions found.'}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((txn) => {
                    const orderObj = typeof txn.order === 'object' ? txn.order : null;
                    const orderId = orderObj ? (orderObj._id || orderObj.id || '') : (txn.order || '');
                    const storeId = txn.store?._id || txn.store?.id || txn.storeId || '';
                    const isBulkOrder = !orderId && !storeId;
                    const displayUserName = txn.user
                      ? `${txn.user.firstName || ''} ${txn.user.lastName || ''}`.trim()
                      : (orderObj?.shippingAddress?.name || '-');

                    return (
                    <tr key={txn._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-blue-600 cursor-pointer hover:underline" title={txn._id} onClick={() => handleCopy(txn._id, 'Transaction ID')}>
                        {shortId(txn._id)}
                      </td>
                      <td
                        className={isBulkOrder ? 'py-3 px-4 text-gray-500' : 'py-3 px-4 text-blue-600 cursor-pointer hover:underline'}
                        title={orderId || (isBulkOrder ? 'Bulk Order' : '-')}
                        onClick={() => {
                          if (!isBulkOrder && orderId) handleCopy(orderId, 'Order ID');
                        }}
                      >
                        {isBulkOrder ? (
                          <Badge className="bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-100">
                            Bulk Order
                          </Badge>
                        ) : (orderId ? shortId(orderId) : '-')}
                      </td>
                      <td className="py-3 px-4">{displayUserName || '-'}</td>
                      <td className="py-3 px-4 text-green-600">{txn.type === 'in' ? (<><span className="dirham-symbol mr-2">&#xea;</span>{formatAmount(txn.amount)}</>) : '-'}</td>
                      <td className="py-3 px-4 text-red-600">
                        {typeof txn.refundedAmount === 'number' && txn.refundedAmount > 0
                          ? (<><span className="dirham-symbol mr-2">&#xea;</span>{formatAmount(txn.refundedAmount)}</>)
                          : (txn.type === 'out' ? (<><span className="dirham-symbol mr-2">&#xea;</span>{formatAmount(txn.amount)}</>) : '-')}
                      </td>
                      <td className="py-3 px-4">{txn.paymentMethod}</td>
                      <td className="py-3 px-4">
                        <Badge variant={txn.status === 'completed' ? 'default' : 'secondary'}>
                          {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{new Date(txn.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td className="py-3 px-4">
                        {isBulkOrder ? (
                          <Badge className="bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-100">
                            Bulk Order
                          </Badge>
                        ) : (txn.store?.name || '-')}
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;