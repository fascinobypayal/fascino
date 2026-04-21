import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { Bell, Package, Tag, Heart, MessageCircle } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationsContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationsPage = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_ORDER':
      case 'ORDER_STATUS_CHANGE':
        return <Package className="h-5 w-5" />;
      case 'OFFER':
        return <Tag className="h-5 w-5" />;
      case 'WISHLIST':
        return <Heart className="h-5 w-5" />;
      default:
        return <MessageCircle className="h-5 w-5" />;
    }
  };

  const handleTap = async (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.related_id) {
      if (notification.type === 'NEW_ORDER' || notification.type === 'ORDER_STATUS_CHANGE') {
        navigate(`/order/${notification.related_id}`);
      }
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Notifications" showBack />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Notifications" showBack />
        <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
          <Bell className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="font-serif text-xl mb-2">No notifications</h2>
          <p className="text-sm text-muted-foreground">
            We'll notify you about orders and offers
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader
        title="Notifications"
        showBack
        rightElement={
          unreadCount > 0 ? (
            <button onClick={markAllAsRead} className="text-xs text-accent">
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div className="divide-y divide-border">
        {notifications.map((notification) => (
          <button
            key={notification.id}
            onClick={() => handleTap(notification)}
            className={`w-full flex gap-4 p-4 text-left transition-colors ${
              !notification.is_read ? 'bg-accent/5' : ''
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                !notification.is_read
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''}`}>
                  {notification.title}
                </p>
                {!notification.is_read && (
                  <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatTime(notification.created_at)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
