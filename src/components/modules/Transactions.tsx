import React, { useState } from 'react';
import { Search, Filter, Download, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';

export default function Transactions() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const transactions = [
    {
      id: 'TXN-98765',
      orderId: 'ORD-2345',
      user: 'Rajesh Kumar',
      amountIn: 1250,
      amountOut: 0,
      paymentMethod: 'UPI',
      status: 'Completed',
      date: '2025-11-29',
      settlementRef: 'SET-1001'
    },
    {
      id: 'TXN-98766',
      orderId: 'ORD-2346',
      user: 'Priya Sharma',
      amountIn: 890,
      amountOut: 0,
      paymentMethod: 'Credit Card',
      status: 'Completed',
      date: '2025-11-29',
      settlementRef: 'SET-1001'
    },
    {
      id: 'TXN-98767',
      orderId: 'BULK-101',
      user: 'Restaurant ABC',
      amountIn: 12500,
      amountOut: 0,
      paymentMethod: 'Bank Transfer',
      status: 'Pending',
      date: '2025-11-29',
      settlementRef: '-'
    },
    {
      id: 'TXN-98768',
      orderId: 'ORD-2344',
      user: 'Amit Patel',
      amountIn: 0,
      amountOut: 250,
      paymentMethod: 'Refund',
      status: 'Completed',
      date: '2025-11-28',
      settlementRef: 'REF-2001'
    },
    {
      id: 'TXN-98769',
      orderId: 'ORD-2348',
      user: 'Sneha Reddy',
      amountIn: 650,
      amountOut: 0,
      paymentMethod: 'UPI',
      status: 'Completed',
      date: '2025-11-28',
      settlementRef: 'SET-1000'
    }
  ];

  const totalIn = transactions.reduce((sum, t) => sum + t.amountIn, 0);
  const totalOut = transactions.reduce((sum, t) => sum + t.amountOut, 0);
  const netAmount = totalIn - totalOut;

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
            <p className="text-green-600">₹{totalIn.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-2">Total Amount Out</p>
            <p className="text-red-600">₹{totalOut.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-2">Net Amount</p>
            <p className="text-blue-600">₹{netAmount.toLocaleString()}</p>
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
              />
            </div>
            <div>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Payment Method</option>
                <option value="upi">UPI</option>
                <option value="card">Credit/Debit Card</option>
                <option value="bank">Bank Transfer</option>
                <option value="cod">Cash on Delivery</option>
              </select>
            </div>
            <div>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
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
                  <th className="text-left py-3 px-4">Settlement Ref</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-blue-600">{txn.id}</td>
                    <td className="py-3 px-4 text-blue-600">{txn.orderId}</td>
                    <td className="py-3 px-4">{txn.user}</td>
                    <td className="py-3 px-4 text-green-600">
                      {txn.amountIn > 0 ? `₹${txn.amountIn}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-red-600">
                      {txn.amountOut > 0 ? `₹${txn.amountOut}` : '-'}
                    </td>
                    <td className="py-3 px-4">{txn.paymentMethod}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={txn.status === 'Completed' ? 'default' : 'secondary'}
                      >
                        {txn.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{txn.date}</td>
                    <td className="py-3 px-4 text-blue-600">{txn.settlementRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}