import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { studiesAPI, issuesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/MainPage.css';

export const MainPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const [studies, setStudies] = useState([]);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [issues, setIssues] = useState([]);
  const [statusFilter, setStatusFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newStudyName, setNewStudyName] = useState('');
  const [newStudyDesc, setNewStudyDesc] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joiningStudy, setJoiningStudy] = useState(false);

  // 스터디 목록 조회
  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    setLoading(true);
    try {
      const response = await studiesAPI.getStudies();
      setStudies(response.data.items);
    } catch (err) {
      console.error('Failed to fetch studies:', err);
    } finally {
      setLoading(false);
    }
  };

  // 스터디 선택 시 이슈 조회 (멤버만)
  useEffect(() => {
    if (selectedStudy && selectedStudy.is_member) {
      fetchIssues();
    } else {
      setIssues([]);
    }
  }, [selectedStudy, statusFilter]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const response = await issuesAPI.getIssues(selectedStudy.id, statusFilter);
      setIssues(response.data.items);
    } catch (err) {
      console.error('Failed to fetch issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudy = async (e) => {
    e.preventDefault();
    if (!newStudyName.trim()) {
      toast.warning('스터디 이름을 입력해주세요.');
      return;
    }

    try {
      await studiesAPI.createStudy(newStudyName, newStudyDesc);
      setNewStudyName('');
      setNewStudyDesc('');
      setShowCreateForm(false);
      fetchStudies();
      toast.success('스터디가 생성되었습니다.');
    } catch (err) {
      toast.error('스터디 생성에 실패했습니다.');
    }
  };

  const handleJoinRequest = async () => {
    if (!selectedStudy) return;
    setJoiningStudy(true);
    try {
      await studiesAPI.createJoinRequest(selectedStudy.id);
      toast.success('가입 요청이 전송되었습니다.');
      setSelectedStudy({ ...selectedStudy, has_pending_request: true });
      // 스터디 목록도 갱신
      fetchStudies();
    } catch (err) {
      toast.error(err.response?.data?.detail || '가입 요청에 실패했습니다.');
    } finally {
      setJoiningStudy(false);
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (!window.confirm('이슈를 삭제하시겠습니까?')) return;

    try {
      await issuesAPI.deleteIssue(issueId);
      fetchIssues();
      toast.success('이슈가 삭제되었습니다.');
    } catch (err) {
      toast.error(err.response?.data?.detail || '이슈 삭제에 실패했습니다.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="welcome-section">
        <h2>Welcome to Study Together</h2>
        <p>로그인하여 스터디 자료를 공유하고 함께 배워보세요!</p>
        <a href="/login" className="btn btn-primary">Login</a>
      </div>
    );
  }

  return (
    <div className="main-page">
      <div className="page-header">
        <h1>📚 Study Board</h1>
        {isAuthenticated && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : '+ New Study'}
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="create-study-form">
          <form onSubmit={handleCreateStudy}>
            <input
              type="text"
              placeholder="Study Name"
              value={newStudyName}
              onChange={(e) => setNewStudyName(e.target.value)}
              required
            />
            <textarea
              placeholder="Study Description (optional)"
              value={newStudyDesc}
              onChange={(e) => setNewStudyDesc(e.target.value)}
              rows="3"
            />
            <button type="submit" className="btn btn-primary">Create Study</button>
          </form>
        </div>
      )}

      <div className="content-wrapper">
        <div className="studies-sidebar">
          <h3>Studies</h3>
          <div className="studies-list">
            {loading ? (
              <LoadingSpinner size="small" message="" />
            ) : studies.length === 0 ? (
              <p className="empty-message">No studies yet</p>
            ) : (
              studies.map(study => (
                <div
                  key={study.id}
                  className={`study-item ${selectedStudy?.id === study.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedStudy(study);
                    setStatusFilter(null);
                  }}
                >
                  <h4>{study.name}</h4>
                  <p>{study.member_count} members</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="issues-main">
          {selectedStudy ? (
            <>
              <div className="study-header">
                <h2>{selectedStudy.name}</h2>
                <div className="study-description markdown-content">
                  <ReactMarkdown>{selectedStudy.description || ''}</ReactMarkdown>
                </div>
                <div className="study-actions">
                  <button
                    className={`btn btn-secondary ${!selectedStudy.is_member ? 'btn-disabled' : ''}`}
                    onClick={() => selectedStudy.is_member && navigate(`/study/${selectedStudy.id}/posts`)}
                    disabled={!selectedStudy.is_member}
                    title={!selectedStudy.is_member ? '멤버만 볼 수 있습니다' : ''}
                  >
                    📝 View Posts
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/study/${selectedStudy.id}`)}
                  >
                    👥 Study Info
                  </button>
                  {!selectedStudy.is_member && (
                    <button
                      className="btn btn-join"
                      onClick={handleJoinRequest}
                      disabled={joiningStudy || selectedStudy.has_pending_request}
                    >
                      {selectedStudy.has_pending_request ? '⏳ 요청 대기 중' : '✋ 가입 요청'}
                    </button>
                  )}
                </div>
              </div>

              {selectedStudy.is_member ? (
                <>
                  <div className="issues-header">
                    <div className="issues-filter">
                      <button
                        className={`filter-btn ${statusFilter === null ? 'active' : ''}`}
                        onClick={() => setStatusFilter(null)}
                      >
                        All
                      </button>
                      <button
                        className={`filter-btn ${statusFilter === 'Scheduled' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('Scheduled')}
                      >
                        Scheduled
                      </button>
                      <button
                        className={`filter-btn ${statusFilter === 'In Progress' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('In Progress')}
                      >
                        In Progress
                      </button>
                      <button
                        className={`filter-btn ${statusFilter === 'Closed' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('Closed')}
                      >
                        Closed
                      </button>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/study/${selectedStudy.id}/issues/create`)}
                    >
                      + New Issue
                    </button>
                  </div>

                  <div className="issues-list">
                    {loading ? (
                      <LoadingSpinner size="small" message="" />
                    ) : issues.length === 0 ? (
                      <p className="empty-message">No issues in this status</p>
                    ) : (
                      issues.map(issue => (
                        <div
                          key={issue.id}
                          className={`issue-card status-${issue.status.replace(' ', '-').toLowerCase()}`}
                          onClick={() => navigate(`/study/${selectedStudy.id}/issues/${issue.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="issue-content">
                            <h4>{issue.title}</h4>
                            <div className="issue-meta">
                              <span className="status-badge">{issue.status}</span>
                              <span className="author">by {issue.author.username}</span>
                              <span className="date">{new Date(issue.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {user?.id === issue.author.id && (
                            <div className="issue-actions">
                              <button
                                className="btn-icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/study/${selectedStudy.id}/issues/${issue.id}/edit`);
                                }}
                                title="Edit"
                              >
                                Edit
                              </button>
                              <button
                                className="btn-icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteIssue(issue.id);
                                }}
                                title="Delete"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <p>스터디 멤버만 이슈와 게시물을 볼 수 있습니다.</p>
                  {selectedStudy.has_pending_request ? (
                    <p>가입 요청이 대기 중입니다. 관리자의 승인을 기다려주세요.</p>
                  ) : (
                    <p>위의 "가입 요청" 버튼을 눌러 멤버 가입을 요청하세요.</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>Select a study to view issues</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
