import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import '../styles/Auth.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const toast = useToast();

  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      toast.error('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword && !currentPassword) {
      toast.error('현재 비밀번호를 입력해주세요.');
      return;
    }

    const data = {};
    if (username !== user?.username) {
      data.username = username;
    }
    if (newPassword) {
      data.current_password = currentPassword;
      data.new_password = newPassword;
    }

    if (Object.keys(data).length === 0) {
      toast.warning('변경할 내용이 없습니다.');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.updateProfile(data);
      // localStorage 업데이트
      const updatedUser = response.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('프로필이 업데이트되었습니다.');

      if (newPassword) {
        toast.success('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
        await logout();
        navigate('/login');
      } else {
        // 페이지 새로고침으로 user 상태 반영
        window.location.reload();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || '프로필 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Profile Settings</h2>
        <form onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              style={{ backgroundColor: '#f5f5f5', color: '#888' }}
            />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={100}
              required
            />
          </div>
          <hr style={{ margin: '1.5rem 0', borderColor: '#eee' }} />
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Change Password (optional)
          </p>
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 8 chars)"
              minLength={8}
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              minLength={8}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
        <div className="auth-link">
          <a href="/">Back to Home</a>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
