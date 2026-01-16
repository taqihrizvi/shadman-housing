import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Notification {
  id: string;
  type: 'APPROVAL_PENDING' | 'APPROVED' | 'REJECTED';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: 'BIYANA' | 'SALE_AGREEMENT' | 'PAYMENT' | 'TRANSFER';
}

const getAuthToken = () => localStorage.getItem('authToken');

interface NotificationBellProps {
  sidebarOpen?: boolean;
}

export function NotificationBell({ sidebarOpen = true }: NotificationBellProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });
      const result = await response.json();
      return result.data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to relevant page
    if (notification.type === 'APPROVAL_PENDING') {
      navigate('/approvals');
    } else if (notification.type === 'APPROVED' || notification.type === 'REJECTED') {
      // Navigate to submitted forms
      if (notification.relatedType === 'BIYANA') {
        navigate('/submitted-forms/biyana');
      } else if (notification.relatedType === 'SALE_AGREEMENT') {
        navigate('/submitted-forms/sale-agreement');
      } else if (notification.relatedType === 'PAYMENT') {
        navigate('/payments/pending');
      } else if (notification.relatedType === 'TRANSFER') {
        navigate('/submitted-forms/transfer');
      }
    }

    setOpen(false);
  };

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPROVAL_PENDING':
        return '🔔';
      case 'APPROVED':
        return '✅';
      case 'REJECTED':
        return '❌';
      default:
        return '📄';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.justNow') || 'Just now';
    if (diffMins < 60) return `${diffMins}${t('notifications.minutesAgo') || 'm ago'}`;
    if (diffHours < 24) return `${diffHours}${t('notifications.hoursAgo') || 'h ago'}`;
    if (diffDays < 7) return `${diffDays}${t('notifications.daysAgo') || 'd ago'}`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground overflow-hidden">
          <Bell className="h-5 w-5 flex-shrink-0" />
          <span className={cn(
            "transition-all duration-200 whitespace-nowrap",
            sidebarOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          )}>
            {t('notifications.title') || 'Notifications'}
          </span>
          {unreadCount > 0 && (
            <Badge 
              className={cn(
                "h-5 min-w-5 flex items-center justify-center px-1.5 text-xs",
                sidebarOpen ? "ml-auto" : "absolute -top-1 -right-1"
              )}
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t('notifications.title') || 'Notifications'}</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-1 text-xs"
              onClick={handleMarkAllRead}
            >
              {t('notifications.markAllRead') || 'Mark all as read'}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {notifications.filter(n => !n.read).length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t('notifications.noNotifications') || 'No notifications'}
            </div>
          ) : (
            notifications.filter(n => !n.read).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 cursor-pointer",
                  !notification.read && "bg-accent/50"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2 w-full">
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none mb-1">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
