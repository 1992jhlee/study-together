import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { issuesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/CreateIssuePage.css';

const CreateIssuePage = () => {
  const { studyId, issueId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!!issueId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studyId) {
      navigate('/');
      return;
    }

    if (issueId) {
      loadIssue();
    }
  }, [studyId, issueId, navigate]);

  const loadIssue = async () => {
    setLoading(true);
    try {
      const response = await issuesAPI.getIssueDetail(issueId);
      setTitle(response.data.title);
      setDescription(response.data.description || '');
      setStartDate(response.data.start_date || '');
      setEndDate(response.data.end_date || '');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load issue');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.warning('제목을 입력해주세요.');
      return;
    }

    // 날짜 유효성 검사
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.warning('종료일은 시작일보다 이후여야 합니다.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await issuesAPI.updateIssue(issueId, title, description, startDate, endDate);
        toast.success('이슈가 수정되었습니다.');
      } else {
        await issuesAPI.createIssue(studyId, title, description, startDate, endDate);
        toast.success('이슈가 생성되었습니다.');
      }
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || '이슈 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  // 상태 미리보기 계산
  const getPreviewStatus = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!startDate && !endDate) {
      return { status: 'In Progress', label: '진행중' };
    }

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && today < start) {
      return { status: 'Scheduled', label: '예정' };
    }

    if (end && today > end) {
      return { status: 'Closed', label: '완료' };
    }

    return { status: 'In Progress', label: '진행중' };
  };

  const previewStatus = getPreviewStatus();

  if (loading && isEditing) {
    return (
      <div className="create-issue-page">
        <LoadingSpinner message="이슈를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="create-issue-page">
      <div className="page-header">
        <h1>{isEditing ? 'Edit Issue' : 'New Issue'}</h1>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <form className="create-issue-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">제목</label>
          <input
            id="title"
            type="text"
            placeholder="이슈 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-control"
            disabled={loading}
            maxLength="255"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">설명 (선택사항, 마크다운 지원)</label>
          <textarea
            id="description"
            placeholder="이슈에 대한 상세 설명"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-control"
            disabled={loading}
            rows="6"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">시작일</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-control"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">종료일</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-control"
              disabled={loading}
            />
          </div>
        </div>

        <div className="status-preview">
          <span className="status-preview-label">상태 미리보기:</span>
          <span className={`status-badge status-${previewStatus.status.toLowerCase().replace(' ', '-')}`}>
            {previewStatus.label}
          </span>
          <span className="status-hint">
            (날짜에 따라 자동으로 변경됩니다)
          </span>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !title.trim()}
          >
            {loading ? '저장 중...' : isEditing ? '수정' : '생성'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateIssuePage;
