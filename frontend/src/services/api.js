import axios from 'axios';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthEndpoint) {
      // 인증 오류 시 로그아웃 (로그인/회원가입 요청 제외)
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== 인증 API ====================

export const authAPI = {
  register: (email, username, password) =>
    api.post('/auth/register', { email, username, password }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  logout: () =>
    api.post('/auth/logout'),

  getCurrentUser: () =>
    api.get('/auth/me'),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token, newPassword) =>
    api.post('/auth/reset-password', { token, new_password: newPassword }),
};

// ==================== 스터디 API ====================

export const studiesAPI = {
  getStudies: (skip = 0, limit = 10) =>
    api.get('/studies', { params: { skip, limit } }),
  
  getDetail: (studyId) =>
    api.get(`/studies/${studyId}`),
  
  createStudy: (name, description) =>
    api.post('/studies', { name, description }),
  
  updateStudy: (studyId, name, description) =>
    api.put(`/studies/${studyId}`, { name, description }),
  
  deleteStudy: (studyId) =>
    api.delete(`/studies/${studyId}`),
  
  addMember: (studyId, email) =>
    api.post(`/studies/${studyId}/members`, { email }),
  
  getMembers: (studyId, skip = 0, limit = 10) =>
    api.get(`/studies/${studyId}/members`, { params: { skip, limit } }),

  removeMember: (studyId, userId) =>
    api.delete(`/studies/${studyId}/members/${userId}`),

  // 가입 요청
  createJoinRequest: (studyId) =>
    api.post(`/studies/${studyId}/join-requests`),

  getJoinRequests: (studyId) =>
    api.get(`/studies/${studyId}/join-requests`),

  approveJoinRequest: (studyId, requestId) =>
    api.put(`/studies/${studyId}/join-requests/${requestId}/approve`),

  rejectJoinRequest: (studyId, requestId) =>
    api.put(`/studies/${studyId}/join-requests/${requestId}/reject`),
};

// ==================== 게시물 API ====================

export const postsAPI = {
  listByStudy: (studyId, skip = 0, limit = 10) =>
    api.get(`/posts/study/${studyId}`, { params: { skip, limit } }),
  
  getDetail: (postId) =>
    api.get(`/posts/${postId}`),
  
  create: (studyId, title, content) =>
    api.post('/posts', { title, content }, { params: { study_id: studyId } }),
  
  update: (postId, title, content) =>
    api.put(`/posts/${postId}`, { title, content }),
  
  delete: (postId) =>
    api.delete(`/posts/${postId}`),
};

// ==================== 댓글 API ====================

export const commentsAPI = {
  // 포스트 댓글
  create: (postId, content) =>
    api.post('/comments', { content }, { params: { post_id: postId } }),

  // 이슈 댓글
  createForIssue: (issueId, content) =>
    api.post('/comments', { content }, { params: { issue_id: issueId } }),

  update: (commentId, content) =>
    api.put(`/comments/${commentId}`, { content }),

  delete: (commentId) =>
    api.delete(`/comments/${commentId}`),
};

// ==================== 이슈 API ====================

export const issuesAPI = {
  getIssues: (studyId, statusFilter = null, skip = 0, limit = 100) => {
    const params = { skip, limit };
    if (statusFilter) params.status_filter = statusFilter;
    return api.get(`/issues/study/${studyId}`, { params });
  },

  getIssueDetail: (issueId) =>
    api.get(`/issues/${issueId}`),

  createIssue: (studyId, title, description, startDate, endDate) =>
    api.post('/issues', {
      title,
      description,
      start_date: startDate || null,
      end_date: endDate || null
    }, { params: { study_id: studyId } }),

  updateIssue: (issueId, title, description, startDate, endDate) =>
    api.put(`/issues/${issueId}`, {
      title,
      description,
      start_date: startDate || null,
      end_date: endDate || null
    }),

  deleteIssue: (issueId) =>
    api.delete(`/issues/${issueId}`),
};

// ==================== 알림 API ====================

export const notificationsAPI = {
  getNotifications: (skip = 0, limit = 20, unreadOnly = false) =>
    api.get('/notifications', { params: { skip, limit, unread_only: unreadOnly } }),

  getUnreadCount: () =>
    api.get('/notifications/unread-count'),

  markAsRead: (notificationIds = null) =>
    api.put('/notifications/read', { notification_ids: notificationIds }),

  deleteNotification: (notificationId) =>
    api.delete(`/notifications/${notificationId}`),

  deleteAllNotifications: () =>
    api.delete('/notifications'),
};

export default api;
