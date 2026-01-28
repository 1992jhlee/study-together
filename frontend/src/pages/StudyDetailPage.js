import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { studiesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/StudyDetailPage.css';

const StudyDetailPage = () => {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [study, setStudy] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!studyId) {
      navigate('/');
      return;
    }
    fetchStudyDetail();
  }, [studyId, navigate]);

  const fetchStudyDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const studyRes = await studiesAPI.getDetail(studyId);
      setStudy(studyRes.data);
      setEditName(studyRes.data.name);
      setEditDescription(studyRes.data.description || '');

      const membersRes = await studiesAPI.getMembers(studyId);
      setMembers(membersRes.data.items || membersRes.data);

      // 관리자인 경우 가입 요청 조회
      if (studyRes.data.creator_id === user?.id) {
        fetchJoinRequests();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load study details');
    } finally {
      setLoading(false);
    }
  };

  const fetchJoinRequests = async () => {
    try {
      const res = await studiesAPI.getJoinRequests(studyId);
      setJoinRequests(res.data.items || []);
    } catch (err) {
      // 권한 없으면 무시
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await studiesAPI.approveJoinRequest(studyId, requestId);
      toast.success('가입 요청을 승인했습니다.');
      fetchStudyDetail();
    } catch (err) {
      toast.error(err.response?.data?.detail || '승인에 실패했습니다.');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await studiesAPI.rejectJoinRequest(studyId, requestId);
      toast.success('가입 요청을 거절했습니다.');
      fetchJoinRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || '거절에 실패했습니다.');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) {
      toast.warning('이메일을 입력해주세요.');
      return;
    }

    setIsAddingMember(true);
    try {
      await studiesAPI.addMember(studyId, newMemberEmail);
      setNewMemberEmail('');
      setShowAddMemberForm(false);
      fetchStudyDetail();
      toast.success('멤버가 추가되었습니다.');
    } catch (err) {
      toast.error(err.response?.data?.detail || '멤버 추가에 실패했습니다.');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId, memberUsername) => {
    if (!window.confirm(`정말 ${memberUsername}님을 스터디에서 제외하시겠습니까?`)) {
      return;
    }

    try {
      await studiesAPI.removeMember(studyId, memberId);
      fetchStudyDetail();
      toast.success('멤버가 삭제되었습니다.');
    } catch (err) {
      toast.error(err.response?.data?.detail || '멤버 삭제에 실패했습니다.');
    }
  };

  const handleEditStart = () => {
    setEditName(study.name);
    setEditDescription(study.description || '');
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditName(study.name);
    setEditDescription(study.description || '');
  };

  const handleEditSave = async () => {
    if (!editName.trim()) {
      toast.warning('스터디 이름은 필수입니다.');
      return;
    }

    setIsSaving(true);
    try {
      await studiesAPI.updateStudy(studyId, editName, editDescription);
      setIsEditing(false);
      fetchStudyDetail();
      toast.success('스터디 정보가 수정되었습니다.');
    } catch (err) {
      toast.error(err.response?.data?.detail || '스터디 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleDeleteStudy = async () => {
    if (deleteConfirmText !== study.name) {
      toast.warning('스터디 이름을 정확히 입력해주세요.');
      return;
    }

    setIsDeleting(true);
    try {
      await studiesAPI.deleteStudy(studyId);
      toast.success('스터디가 삭제되었습니다.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || '스터디 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="study-detail-page">
        <div className="study-detail-header">
          <button className="back-btn" onClick={handleBack}>← 돌아가기</button>
        </div>
        <LoadingSpinner message="스터디 정보를 불러오는 중..." />
      </div>
    );
  }

  if (!study) {
    return (
      <div className="study-detail-page">
        <div className="study-detail-header">
          <button className="back-btn" onClick={handleBack}>← 돌아가기</button>
        </div>
        <div className="error-message">{error || 'Study not found'}</div>
      </div>
    );
  }

  const isCreator = user?.id === study.creator_id;

  return (
    <div className="study-detail-page">
      <div className="study-detail-header">
        <button className="back-btn" onClick={handleBack}>← 돌아가기</button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="study-info-card">
        {isEditing ? (
          <div className="study-edit-form">
            <div className="form-group">
              <label>스터디 이름</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="스터디 이름"
                disabled={isSaving}
              />
            </div>
            <div className="form-group">
              <label>설명 (마크다운 지원)</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="스터디 설명을 입력하세요. 마크다운을 지원합니다."
                rows="6"
                disabled={isSaving}
              />
            </div>
            <div className="edit-actions">
              <button
                className="btn btn-primary"
                onClick={handleEditSave}
                disabled={isSaving || !editName.trim()}
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleEditCancel}
                disabled={isSaving}
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="study-title-row">
              <h1>{study.name}</h1>
              {isCreator && (
                <button className="btn btn-edit" onClick={handleEditStart}>
                  ✏️ 수정
                </button>
              )}
            </div>
            <div className="study-description markdown-content">
              <ReactMarkdown>{study.description || '설명이 없습니다.'}</ReactMarkdown>
            </div>
            <div className="study-meta">
              <span className="creator-info">
                👤 Created by <strong>{study.creator?.username || 'Unknown'}</strong>
              </span>
              <span className="create-date">
                📅 {new Date(study.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </>
        )}
      </div>

      <section className="members-section">
        <div className="members-header">
          <h2>Members ({members.length})</h2>
          {isCreator && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddMemberForm(!showAddMemberForm)}
            >
              {showAddMemberForm ? '취소' : '+ 멤버 추가'}
            </button>
          )}
        </div>

        {showAddMemberForm && isCreator && (
          <form className="add-member-form" onSubmit={handleAddMember}>
            <input
              type="email"
              placeholder="추가할 멤버의 이메일"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              disabled={isAddingMember}
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isAddingMember || !newMemberEmail.trim()}
            >
              {isAddingMember ? '추가 중...' : '추가'}
            </button>
          </form>
        )}

        <div className="members-list">
          {members.length === 0 ? (
            <p className="empty-message">멤버가 없습니다.</p>
          ) : (
            members.map(member => (
              <div key={member.id} className="member-card">
                <div className="member-info">
                  <span className="member-username">👤 {member.username}</span>
                  <span className={`member-role ${member.role.toLowerCase()}`}>
                    {member.role === 'admin' ? '👑 Admin' : '👥 Member'}
                  </span>
                </div>
                <div className="member-actions">
                  <span className="join-date">
                    Joined {new Date(member.joined_at).toLocaleDateString('ko-KR')}
                  </span>
                  {isCreator && member.user_id !== user?.id && (
                    <button
                      className="btn btn-remove"
                      onClick={() => handleRemoveMember(member.user_id, member.username)}
                      title="멤버 삭제"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Join Requests Section - Only visible to creator/admin */}
      {isCreator && joinRequests.length > 0 && (
        <section className="join-requests-section">
          <h2>가입 요청 ({joinRequests.length})</h2>
          <div className="join-requests-list">
            {joinRequests.map(req => (
              <div key={req.id} className="join-request-card">
                <div className="join-request-info">
                  <span className="join-request-username">👤 {req.username}</span>
                  <span className="join-request-email">{req.email}</span>
                  <span className="join-request-date">
                    {new Date(req.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="join-request-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleApproveRequest(req.id)}
                  >
                    승인
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRejectRequest(req.id)}
                  >
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Delete Study Section - Only visible to creator */}
      {isCreator && (
        <section className="danger-zone">
          <h2>Danger Zone</h2>
          {!showDeleteConfirm ? (
            <div className="danger-zone-content">
              <p>스터디를 삭제하면 모든 포스트, 이슈, 멤버 정보가 함께 삭제됩니다.</p>
              <button
                className="btn btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                🗑️ 스터디 삭제
              </button>
            </div>
          ) : (
            <div className="delete-confirm-form">
              <p className="warning-text">
                ⚠️ 이 작업은 되돌릴 수 없습니다. 정말 삭제하시려면 스터디 이름을 입력하세요:
              </p>
              <p className="study-name-hint">
                <strong>{study.name}</strong>
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="스터디 이름을 입력하세요"
                disabled={isDeleting}
              />
              <div className="delete-confirm-actions">
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteStudy}
                  disabled={isDeleting || deleteConfirmText !== study.name}
                >
                  {isDeleting ? '삭제 중...' : '영구 삭제'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={isDeleting}
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default StudyDetailPage;
