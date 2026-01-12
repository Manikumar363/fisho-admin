import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  FileText,
  MapPin,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  User,
  ClipboardList,
  Tag,
  Navigation,
  MessageSquare
} from 'lucide-react';
import { getAdminData, getUserRole, clearAuthData } from '../../lib/api';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';

interface AdminLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function AdminLayout({ children, onLogout }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>(['inventory']);
  const [adminName, setAdminName] = useState('Admin User');
  const [userRole, setUserRole] = useState('admin');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    const adminData = getAdminData();
    const role = getUserRole();
    
    if (adminData?.name) {
      setAdminName(adminData.name);
    }
    if (role) {
      setUserRole(role);
    }
  }, []);

  const handleConfirmLogout = () => {
    setShowLogoutDialog(false);
    onLogout();
    navigate('/login');
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  interface MenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    path?: string;
    hasSubmenu?: boolean;
    submenu?: { label: string; path: string }[];
    roles?: string[];
  }

  const allMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      roles: ['admin', 'subadmin']
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: Users,
      path: '/user-management',
      roles: ['admin']
    },
    {
      id: 'inventory',
      label: 'Inventory Management',
      icon: Package,
      hasSubmenu: false,
      path: '/inventory-management',
      roles: ['admin']
      // Example: Uncomment and edit below if you want submenu
      // hasSubmenu: true,
      // submenu: [
      //   { label: 'Products', path: '/inventory-management/products' },
      //   { label: 'Categories', path: '/inventory-management/categories' }
      // ]
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingCart,
      path: '/orders',
      roles: ['admin']
    },
    {
      id: 'pre-purchase',
      label: 'Pre Purchase Order',
      icon: ClipboardList,
      path: '/pre-purchase-orders',
      roles: ['admin']
    },
     {
      id: 'offers',
      label: 'Offers',
      icon: Tag,
      path: '/offers',
      roles: ['admin']
    },
    {
      id: 'delivery-locations',
      label: 'Delivery Locations',
      icon: Navigation,
      path: '/delivery-locations',
      roles: ['admin']
    },
    {
      id: 'transactions',
      label: 'Transactions & Settlements',
      icon: CreditCard,
      path: '/transactions',
      roles: ['admin', 'subadmin']
    },
    {
      id: 'cms',
      label: 'CMS',
      icon: FileText,
      path: '/cms',
      roles: ['admin']
    },
    {
      id: 'enquiries',
      label: 'Enquiries',
      icon: MessageSquare,
      path: '/enquiries',
      roles: ['admin']
    },
    {
      id: 'mapping',
      label: userRole === 'subadmin' ? 'My Store' : 'Store Mapping',
      icon: MapPin,
      path: '/store-mapping',
      roles: ['admin', 'subadmin']
    }
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(
    (item: any) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-blue-600">Fisho Admin</h1>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.path || '#'}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.path || '')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{adminName}</span>
                <span className="text-xs text-gray-500 capitalize">{userRole === 'subadmin' ? 'Sub Admin' : 'Admin'}</span>
              </div>
            </div>
            <button 
              onClick={handleLogoutClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600 hover:text-red-600" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will need to login again to access the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}