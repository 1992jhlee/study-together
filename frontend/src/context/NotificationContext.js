import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { notificationsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const response = await notificationsAPI.getNotifications(0, 20);
      setNotifications(response.data.items);
      setUnreadCount(response.data.unread_count);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data.unread_count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationIds = null) => {
    try {
      await notificationsAPI.markAsRead(notificationIds);

      if (notificationIds) {
        setNotifications(prev =>
          prev.map(n =>
            notificationIds.includes(n.id) ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);

      setNotifications(prev => {
        const deleted = prev.find(n => n.id === notificationId);
        if (deleted && !deleted.is_read) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(n => n.id !== notificationId);
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await notificationsAPI.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  }, []);

  // 폴링: 10초마다 읽지 않은 알림 개수 확인
  useEffect(() => {
    if (user) {
      fetchNotifications();

      intervalRef.current = setInterval(() => {
        fetchUnreadCount();
      }, 10000);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, fetchNotifications, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
