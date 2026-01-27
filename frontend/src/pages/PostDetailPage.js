import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { postsAPI, commentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/PostDetailPage.css';

const PostDetailPage = () => {
  const { studyId, postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  useEffect(() => {
    if (!studyId || !postId) {
      navigate('/');
      return;
    }
    fetchPostDetail();
  }, [studyId, postId, navigate]);

  const fetchPostDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await postsAPI.getDetail(postId);
      setPost(response.data);
      setComments(response.data.comments || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.warning('댓글 내용을 입력해주세요.');
      return;
    }

    setSubmittingComment(true);
    try {
      await commentsAPI.create(postId, newComment);
      setNewComment('');
      fetchPostDetail();
      toast.success('댓글이 작성되었습니다.');
    } catch (err) {
      toast.error(err.response?.data?.detail || '댓글 작성에 실패했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await commentsAPI.delete(commentId);
      fetchPostDetail();
      toast.success('댓글이 삭제되었습니다.');
    } catch (err) {
      toast.error(err.response?.data?.detail || '댓글 삭제에 실패했습니다.');
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleUpdateComment = async (commentId) => {
    if (!editingContent.trim()) {
      toast.warning('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      await commentsAPI.update(commentId, editingContent);
      setEditingCommentId(null);
      setEditingContent('');
      fetchPostDetail();
      toast.success('댓글이 수정되었습니다.');
    } catch (err) {
      toast.error(err.response?.data?.detail || '댓글 수정에 실패했습니다.');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('포스트를 삭제하시겠습니까?')) return;

    try {
      await postsAPI.delete(postId);
      toast.success('포스트가 삭제되었습니다.');
      navigate(`/study/${studyId}/posts`);
    } catch (err) {
      toast.error(err.response?.data?.detail || '포스트 삭제에 실패했습니다.');
    }
  };

  const handleBack = () => {
    navigate(`/study/${studyId}/posts`);
  };

  if (loading) {
    return (
      <div className="post-detail-page">
        <div className="post-detail-header">
          <button className="back-btn" onClick={handleBack}>← 돌아가기</button>
        </div>
        <LoadingSpinner message="포스트를 불러오는 중..." />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-page">
        <div className="post-detail-header">
          <button className="back-btn" onClick={handleBack}>← 돌아가기</button>
        </div>
        <div className="error-message">{error || 'Post not found'}</div>
      </div>
    );
  }

  const isAuthor = user?.id === post.author?.id;

  return (
    <div className="post-detail-page">
      <div className="post-detail-header">
        <button className="back-btn" onClick={handleBack}>← 돌아가기</button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <article className="post-detail-content">
        <div className="post-header">
          <h1>{post.title}</h1>
          <div className="post-meta">
            <span className="author">✍️ {post.author?.username}</span>
            <span className="date">📅 {new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
            {post.updated_at && post.updated_at !== post.created_at && (
              <span className="updated">(수정됨)</span>
            )}
          </div>
        </div>

        <div className="post-body markdown-content">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        {isAuthor && (
          <div className="post-actions">
            <button 
              className="btn btn-warning"
              onClick={() => navigate(`/study/${studyId}/posts/${postId}/edit`)}
            >
              ✏️ Edit
            </button>
            <button 
              className="btn btn-danger"
              onClick={handleDeletePost}
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </article>

      <section className="comments-section">
        <h2>Comments ({comments.length})</h2>

        <form className="comment-form" onSubmit={handleAddComment}>
          <textarea
            className="comment-input"
            placeholder="댓글을 작성하세요..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows="3"
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={submittingComment || !newComment.trim()}
          >
            {submittingComment ? '게시 중...' : '댓글 작성'}
          </button>
        </form>

        <div className="comments-list">
          {comments.length === 0 ? (
            <p className="empty-comments">아직 댓글이 없습니다.</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">{comment.author?.username}</span>
                  <span className="comment-date">
                    {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                  </span>
                  {user?.id === comment.author?.id && editingCommentId !== comment.id && (
                    <div className="comment-actions">
                      <button
                        className="comment-edit-btn"
                        onClick={() => handleEditComment(comment)}
                        title="수정"
                      >
                        ✏️
                      </button>
                      <button
                        className="comment-delete-btn"
                        onClick={() => handleDeleteComment(comment.id)}
                        title="삭제"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                {editingCommentId === comment.id ? (
                  <div className="comment-edit-form">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows="3"
                    />
                    <div className="comment-edit-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleUpdateComment(comment.id)}
                      >
                        저장
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleCancelEdit}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="comment-body">
                    {comment.content}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default PostDetailPage;
