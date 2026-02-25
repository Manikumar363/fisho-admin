import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Trash2 } from 'lucide-react';
import { useNotifications } from '../../contexts/notifications';
import { apiFetch } from '../../lib/api';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, setNotifications, setUnreadCount, markAsRead, clearAll } = useNotifications();

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read when clicked
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    // Navigate based on order type
    if (notification.orderId) {
      navigate(`/orders/${notification.orderId}`);
    } else if (notification.bulkOrderId) {
      navigate(`/bulk-orders/${notification.bulkOrderId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await apiFetch<{
        success: boolean;
        message: string;
        modifiedCount: number;
      }>('/api/admin/notification/mark-all-as-read', {
        method: 'PATCH',
      });

      if (response.success) {
        // Update local state
        const updatedNotifications = notifications.map((n: any) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString()
        }));
        setNotifications(updatedNotifications);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      const response = await apiFetch<{
        success: boolean;
        message: string;
      }>('/api/admin/notification/delete-all', {
        method: 'DELETE',
      });

      if (response.success) {
        clearAll();
      }
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await apiFetch<{
        success: boolean;
        message: string;
        notification: any;
      }>(`/api/admin/notification/mark-as-read/${notificationId}`, {
        method: 'PATCH',
      });

      if (response.success) {
        markAsRead(notificationId);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await apiFetch<{
        success: boolean;
        message: string;
      }>(`/api/admin/notification/delete/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.success) {
        const notification = notifications.find((n: any) => n._id === notificationId);
        const newList = notifications.filter((n: any) => n._id !== notificationId);
        setNotifications(newList);
        
        if (notification && !notification.isRead) {
          setUnreadCount(Math.max(0, unreadCount - 1));
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 hover:bg-red-600 text-white px-3 py-1">
              {unreadCount} unread
            </Badge>
          )}
          {unreadCount === 0 && <div className="w-24"></div>}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[calc(100vh-280px)]">
          {notifications.length === 0 ? (
            <div className="p-16 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification, index) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-4 px-6 py-5 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50/30' : 'bg-white'
                  }`}
                >
                  {/* Unread Indicator */}
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-black rounded-full flex-shrink-0 mt-2" />
                  )}
                  {notification.isRead && (
                    <div className="w-2 h-2 flex-shrink-0 mt-2" />
                  )}

                  {/* Bell Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Bell className="w-6 h-6 text-gray-600" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatNotificationTime(notification.createdAt)}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteNotification(notification._id, e)}
                    className="flex-shrink-0 p-2 hover:bg-red-50 rounded-lg transition-colors group"
                  >
                    <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
                  </button>
                </div>
              ))}
              
              {/* End Message */}
              {notifications.length > 0 && (
                <div className="py-8 text-center">
                  <p className="text-gray-400 text-sm">No more notifications</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Action Buttons */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-4 px-6 py-4 border-t bg-gray-50">
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="flex-1 py-3 px-4 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark all read
            </button>
            <button
              onClick={handleClearAll}
              className="flex-1 py-3 px-4 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
