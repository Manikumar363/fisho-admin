
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

const Transactions: React.FC = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<{ moneyIn: number; moneyOut: number; netAmount: number }>({ moneyIn: 0, moneyOut: 0, netAmount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [txnType, setTxnType] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = '/api/transactions/get-all?status=completed';
        if (paymentMethod) url += `&paymentMethod=${encodeURIComponent(paymentMethod)}`;
        if (txnType) url += `&type=${encodeURIComponent(txnType)}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (fromDate) url += `&fromDate=${encodeURIComponent(fromDate)}`;
        if (toDate) url += `&toDate=${encodeURIComponent(toDate)}`;
        const res = await apiFetch(url);
        if (!res.success) throw new Error(res.message || 'Failed to fetch transactions');
        setTransactions(res.transactions || []);
        setStats(res.stats || { moneyIn: 0, moneyOut: 0, netAmount: 0 });
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [paymentMethod, txnType, search, fromDate, toDate]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-600">Loading transactions...</div>
    );
  }

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
          <Button className="bg-blue-600 hover:bg-blue-700">
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
            <p className="text-green-600"><span className="dirham-symbol mr-2">&#xea;</span>{stats.moneyIn?.toLocaleString?.() ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-2">Total Amount Out</p>
            <p className="text-red-600"><span className="dirham-symbol mr-2">&#xea;</span>{stats.moneyOut?.toLocaleString?.() ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-2">Net Amount</p>
            <p className="text-blue-600"><span className="dirham-symbol mr-2">&#xea;</span>{stats.netAmount?.toLocaleString?.() ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search transactions..."
                className="pl-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              >
                <option value="">Payment Method</option>
                <option value="wallet">Wallet</option>
                <option value="cod">Cash on Delivery</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div>
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
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
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
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      {paymentMethod === 'online' ? 'No online transactions.' :
                        paymentMethod === 'cod' ? 'Currently no COD orders.' :
                        paymentMethod === 'wallet' ? 'No wallet transactions.' :
                        txnType === 'out' ? 'No amount out transactions.' :
                        txnType === 'in' ? 'No amount in transactions.' :
                        'No transactions found.'}
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => (
                    <tr key={txn._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-blue-600 cursor-pointer hover:underline" title={txn._id} onClick={() => handleCopy(txn._id, 'Transaction ID')}>
                        {shortId(txn._id)}
                      </td>
                      <td className="py-3 px-4 text-blue-600 cursor-pointer hover:underline" title={txn.order} onClick={() => txn.order && handleCopy(txn.order, 'Order ID')}>
                        {txn.order ? shortId(txn.order) : '-'}
                      </td>
                      <td className="py-3 px-4">{txn.user ? `${txn.user.firstName} ${txn.user.lastName}` : '-'}</td>
                      <td className="py-3 px-4 text-green-600">{txn.type === 'in' ? (<><span className="dirham-symbol mr-2">&#xea;</span>{txn.amount}</>) : '-'}</td>
                      <td className="py-3 px-4 text-red-600">{txn.type === 'out' ? (<><span className="dirham-symbol mr-2">&#xea;</span>{txn.amount}</>) : '-'}</td>
                      <td className="py-3 px-4">{txn.paymentMethod}</td>
                      <td className="py-3 px-4">
                        <Badge variant={txn.status === 'completed' ? 'default' : 'secondary'}>
                          {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{new Date(txn.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td className="py-3 px-4">{txn.store?.name || '-'}</td>
                    </tr>
                  ))
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