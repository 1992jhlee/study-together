import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import '../styles/Notification.css';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, deleteNotification, clearAll, fetchNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notification) => {
    // 읽음 처리
    if (!notification.is_read) {
      markAsRead([notification.id]);
    }

    // 관련 페이지로 이동
    if (notification.post_id && notification.study_id) {
      navigate(`/study/${notification.study_id}/posts/${notification.post_id}`);
    } else if (notification.issue_id && notification.study_id) {
      navigate(`/study/${notification.study_id}/issues/${notification.issue_id}`);
    }

    setIsOpen(false);
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    markAsRead();
  };

  const handleDelete = (e, notificationId) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    clearAll();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button className="bell-button" onClick={handleToggle}>
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>알림</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={handleMarkAllRead}>
                모두 읽음
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">알림이 없습니다</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">{formatTime(notification.created_at)}</span>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDelete(e, notification.id)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="dropdown-footer">
              <button className="clear-all" onClick={handleClearAll}>
                모든 알림 삭제
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
