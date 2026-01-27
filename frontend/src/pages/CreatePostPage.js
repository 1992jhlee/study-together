import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/CreatePostPage.css';

const CreatePostPage = () => {
  const { studyId, postId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!!postId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studyId) {
      navigate('/');
      return;
    }

    // If postId exists, load post for editing
    if (postId) {
      loadPost();
    }
  }, [studyId, postId, navigate]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const response = await postsAPI.getDetail(postId);
      setTitle(response.data.title);
      setContent(response.data.content);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load post');
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

    if (!content.trim()) {
      toast.warning('내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await postsAPI.update(postId, title, content);
        toast.success('포스트가 수정되었습니다.');
        navigate(`/study/${studyId}/posts/${postId}`);
      } else {
        const response = await postsAPI.create(studyId, title, content);
        toast.success('포스트가 작성되었습니다.');
        navigate(`/study/${studyId}/posts/${response.data.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || '포스트 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      navigate(`/study/${studyId}/posts/${postId}`);
    } else {
      navigate(`/study/${studyId}/posts`);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="create-post-page">
        <LoadingSpinner message="포스트를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="create-post-page">
      <div className="page-header">
        <h1>{isEditing ? '✏️ 포스트 수정' : '📝 새 포스트 작성'}</h1>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <form className="create-post-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">제목</label>
          <input
            id="title"
            type="text"
            placeholder="포스트 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-control"
            disabled={loading}
            maxLength="200"
          />
          <span className="char-count">{title.length}/200</span>
        </div>

        <div className="form-group">
          <label htmlFor="content">내용</label>
          <textarea
            id="content"
            placeholder="포스트 내용을 입력하세요. 마크다운을 지원합니다."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="form-control"
            disabled={loading}
            rows="15"
          />
          <span className="hint">마크다운 형식을 지원합니다</span>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !title.trim() || !content.trim()}
          >
            {loading ? '저장 중...' : isEditing ? '수정하기' : '작성하기'}
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

export default CreatePostPage;
