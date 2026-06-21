'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useUserSocket } from '@/hooks/useUserSocket';

type NotificationItem = {
  _id: string;
  type: 'new_request' | 'accepted_request' | 'rejected_request' | 'general';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationCenter({
  userId,
  professional = false,
}: {
  userId?: string;
  professional?: boolean;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useUserSocket(userId, {
    'notification:new': fetchNotifications,
    'notification:read': fetchNotifications,
    'mentorship:created': fetchNotifications,
    'mentorship:accepted': fetchNotifications,
    'mentorship:rejected': fetchNotifications,
    'mentorship:completed': fetchNotifications,
    'mentorship:feedback': fetchNotifications,
  });

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);

  const visibleNotifications = professional
    ? notifications.filter((item) => ['new_request', 'accepted_request', 'rejected_request'].includes(item.type))
    : notifications;

  const markAsRead = async (notificationId?: string) => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationId ? { notificationId } : { all: true }),
    });
    fetchNotifications();
  };

  return (
    <div style={{ background: '#0B0D10', border: '1px solid #1E2229', borderRadius: 8, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <h2 style={{ color: '#f5f5f5', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={18} style={{ color: '#FDD458' }} />
          Notifications
          {unreadCount > 0 && (
            <span style={{ background: '#FF495B', color: '#fff', borderRadius: 999, padding: '2px 8px', fontSize: 11 }}>
              {unreadCount}
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={() => markAsRead()}
            style={{ background: 'transparent', border: '1px solid #30333A', color: '#CCDADC', borderRadius: 6, padding: '7px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: '#FDD458' }} />
      ) : visibleNotifications.length === 0 ? (
        <p style={{ color: '#9095A1', fontSize: 13 }}>No notifications yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visibleNotifications.map((notification) => (
            <button
              key={notification._id}
              onClick={() => !notification.isRead && markAsRead(notification._id)}
              style={{
                textAlign: 'left',
                background: notification.isRead ? '#040507' : 'rgba(253,212,88,0.08)',
                border: notification.isRead ? '1px solid #212328' : '1px solid rgba(253,212,88,0.25)',
                borderRadius: 8,
                padding: 12,
                cursor: notification.isRead ? 'default' : 'pointer',
              }}
            >
              <strong style={{ color: '#CCDADC', fontSize: 13, display: 'block' }}>{notification.title}</strong>
              <span style={{ color: '#9095A1', fontSize: 12, display: 'block', marginTop: 4 }}>{notification.message}</span>
              <span style={{ color: '#525866', fontSize: 11, display: 'block', marginTop: 6 }}>
                {new Date(notification.createdAt).toLocaleString('en-IN')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
