import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
// Socket instance (singleton)
let socket: Socket | null = null;
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
  Menu,
  X,
  LogOut,
  User,
  ClipboardList,
  Tag,
  Navigation,
  MessageSquare,
  KeyRound,
  ShoppingBag,
  Bell,
} from 'lucide-react';
import { getAdminData, getUserRole, clearAuthData, apiFetch } from '../../lib/api';
import { useNotifications } from '../../contexts/notifications';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';

interface AdminLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function AdminLayout({ children, onLogout }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isStoreMappingRoute = location.pathname.startsWith('/store-mapping');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>(['inventory']);
  const [adminName, setAdminName] = useState('Admin User');
  const [userRole, setUserRole] = useState('admin');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  // Use notification context
  const { unreadCount, setNotifications, setUnreadCount, addNotification } = useNotifications();

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

  // Set document title based on user role
  useEffect(() => {
    if (userRole === 'subadmin') {
      document.title = 'Fisho | Store Manager';
    } else {
      document.title = 'Fisho | Admin Dashboard';
    }
  }, [userRole]);

  // Fetch notifications on mount and set up socket for real-time updates
  useEffect(() => {
    const isTestNotification = (notification: any) => {
      const title = String(notification?.title || '').toLowerCase();
      const description = String(notification?.description || '').toLowerCase();
      return title.includes('test notification') || description.includes('test notification sound trigger');
    };

    const fetchNotifications = async () => {
      try {
        const response = await apiFetch<{
          success: boolean;
          message: string;
          notifications: any[];
        }>('/api/admin/notification/get-all');

        if (response.success && response.notifications) {
          const filteredNotifications = response.notifications.filter((notification: any) => !isTestNotification(notification));
          setNotifications(filteredNotifications);
          const unread = filteredNotifications.filter((n: any) => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();

    // Setup socket connection and event listeners
    if (!socket) {
      socket = io(import.meta.env.VITE_BASE_URL || window.location.origin, {
        transports: ['websocket'],
        withCredentials: true
      });
    }

    // Handler for new notification event
    const handleNewNotification = (notification: any) => {
      addNotification(notification);
    };

    // Listen for the correct event based on userRole
    if (userRole === 'subadmin') {
      socket.on('new_store_notification', handleNewNotification);
    } else {
      socket.on('new_admin_notification', handleNewNotification);
    }

    // Cleanup
    return () => {
      if (socket) {
        socket.off('new_admin_notification', handleNewNotification);
        socket.off('new_store_notification', handleNewNotification);
      }
    };
  }, [setNotifications, setUnreadCount, userRole, addNotification]);

  const handleConfirmLogout = () => {
    setShowLogoutDialog(false);
    onLogout();
    navigate('/login');
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
      label: 'Users',
      icon: Users,
      path: '/user-management',
      roles: ['admin']
    },
    {
      id: 'inventory',
      label: 'Inventory',
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
      roles: ['admin', 'subadmin']
    },
    {
      id: 'Bulk Orders',
      label: 'Bulk Orders',
      icon: ShoppingBag,
      path: '/bulk-orders',
      roles: ['admin']
    },
    {
      id: 'pre-purchase',
      label: 'Pre Purchase Orders',
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
      label: 'Transactions',
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
    },
    {
      id:'inventory-alerts',
      label: 'Inventory Alerts',
      icon: Package,
      path: '/inventory-alerts',
      roles: ['subadmin']

    }
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(
    (item: any) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <div className={isStoreMappingRoute ? 'flex h-[100dvh] overflow-hidden bg-gray-50' : 'flex h-screen bg-gray-50'}>
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
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-4">
            {/* Notification Icon */}
            <button 
              onClick={() => navigate('/notifications')}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {/* Red dot indicator - always show */}
              <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full z-10 animate-pulse"></div>
              {unreadCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 px-1 text-xs bg-red-500 hover:bg-red-600"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </button>

            {/* Profile Dropdown */}
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-2 rounded-lg border border-transparent hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{adminName}</span>
                  <span className="text-xs text-gray-500 capitalize">
                    {userRole === 'subadmin' ? 'Sub Admin' : 'Admin'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={() => navigate('/profile')}>
                <User className="w-4 h-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/change-password')}>
                <KeyRound className="w-4 h-4" />
                <span>Change Password</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setShowLogoutDialog(true)}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <main
          className={
            isStoreMappingRoute
              ? 'flex-1 min-h-0 overflow-hidden'
              : 'flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6'
          }
        >
          {isStoreMappingRoute ? (
            <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden p-6 pr-5 overscroll-contain">
              {children}
            </div>
          ) : (
            children
          )}
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