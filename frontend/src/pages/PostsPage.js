import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postsAPI, studiesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/PostsPage.css';

const PostsPage = () => {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [study, setStudy] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studyId) {
      navigate('/');
      return;
    }
    fetchData();
  }, [studyId, navigate]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const studyRes = await studiesAPI.getDetail(studyId);
      setStudy(studyRes.data);

      const postsRes = await postsAPI.listByStudy(studyId);
      setPosts(postsRes.data.items || postsRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/study/${studyId}/posts/${postId}`);
  };

  const handleCreatePost = () => {
    navigate(`/study/${studyId}/posts/create`);
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleDeletePost = async (e, postId) => {
    e.stopPropagation(); // Prevent card click
    if (!window.confirm('정말 이 포스트를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await postsAPI.delete(postId);
      fetchData(); // Refresh the list
      toast.success('포스트가 삭제되었습니다.');
    } catch (err) {
      toast.error(err.response?.data?.detail || '포스트 삭제에 실패했습니다.');
    }
  };

  const handleEditPost = (e, postId) => {
    e.stopPropagation(); // Prevent card click
    navigate(`/study/${studyId}/posts/${postId}/edit`);
  };

  if (loading) {
    return (
      <div className="posts-page">
        <div className="posts-header">
          <button className="back-btn" onClick={handleBack}>← 돌아가기</button>
        </div>
        <LoadingSpinner message="포스트를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="posts-page">
      <div className="posts-header">
        <button className="back-btn" onClick={handleBack}>← 돌아가기</button>
        <div className="posts-title-section">
          <h1>{study?.name}</h1>
          <button className="new-post-btn" onClick={handleCreatePost}>
            + 새 포스트
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="posts-list">
        {posts.length === 0 ? (
          <div className="empty-state">
            <p>아직 포스트가 없습니다.</p>
            <button className="new-post-btn-large" onClick={handleCreatePost}>
              첫 포스트 작성하기
            </button>
          </div>
        ) : (
          posts.map(post => (
            <div
              key={post.id}
              className="post-card"
              onClick={() => handlePostClick(post.id)}
            >
              <div className="post-card-content">
                <h2 className="post-title">{post.title}</h2>
                <div className="post-meta">
                  <span className="post-author">by {post.author?.username}</span>
                  <span className="post-date">
                    {new Date(post.created_at).toLocaleDateString('ko-KR')}
                  </span>
                  <span className="post-comments">
                    💬 {post.comment_count || 0}개 댓글
                  </span>
                </div>
              </div>
              {user?.id === post.author?.id && (
                <div className="post-card-actions">
                  <button
                    className="btn-icon btn-edit-post"
                    onClick={(e) => handleEditPost(e, post.id)}
                    title="수정"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-delete-post"
                    onClick={(e) => handleDeletePost(e, post.id)}
                    title="삭제"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PostsPage;
