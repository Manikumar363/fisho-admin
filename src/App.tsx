import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import OTPVerification from './components/auth/OTPVerification';
import ResetPassword from './components/auth/ResetPassword';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './components/modules/Dashboard';
import UserManagement from './components/modules/UserManagement';
import InventoryManagement from './components/modules/InventoryManagement';
import AddInventoryItem from './components/modules/inventory/AddInventoryItem';
import OrdersManagement from './components/modules/OrdersManagement';
import OrderDetails from './components/modules/OrderDetails';
import Transactions from './components/modules/Transactions';
import StoreBilling from './components/modules/StoreBilling';
import WasteManagement from './components/modules/WasteManagement';
import StoreMapping from './components/modules/StoreMapping';
import AddStore from './components/modules/store/AddStore';
import EditStore from './components/modules/store/EditStore';
import PrePurchaseOrders from './components/modules/PrePurchaseOrders';
import Offers from './components/modules/Offers';
import DeliveryLocations from './components/modules/DeliveryLocations';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<OTPVerification />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected Routes */}
        {isAuthenticated ? (
          <Route
            path="/*"
            element={
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/user-management" element={<UserManagement />} />
                  <Route path="/inventory-management" element={<InventoryManagement />} />
                  <Route path="/inventory/add" element={<AddInventoryItem />} />
                  <Route path="/orders" element={<OrdersManagement />} />
                  <Route path="/orders/:orderId" element={<OrderDetails />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/store-billing" element={<StoreBilling />} />
                  <Route path="/waste-management" element={<WasteManagement />} />
                  <Route path="/store-mapping" element={<StoreMapping />} />
                  <Route path="/store-mapping/add" element={<AddStore onBack={() => window.history.back()} />} />
                  <Route path="/store-mapping/edit/:storeId" element={<EditStore />} />
                  <Route path="/pre-purchase-orders" element={<PrePurchaseOrders />} />
                   <Route path="/offers" element={<Offers />} />
                  <Route path="/delivery-locations" element={<DeliveryLocations />} />
                </Routes>
              </AdminLayout>
            }
          />
        ) : (
          <Route path="/*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}
