import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/Auth.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.forgotPassword(email);
      setSubmitted(true);
      if (response.data.reset_link) {
        setResetLink(response.data.reset_link);
      }
    } catch (err) {
      setError(err.response?.data?.detail || '요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>이메일을 확인해주세요</h2>
          <p className="success-message">
            비밀번호 재설정 링크가 생성되었습니다.
            {resetLink ? (
              <><br />아래 링크를 클릭하여 비밀번호를 재설정하세요.</>
            ) : (
              <><br />등록된 이메일로 재설정 링크가 전송되었습니다.</>
            )}
          </p>
          {resetLink && (
            <p style={{ textAlign: 'center', margin: '1rem 0' }}>
              <a href={resetLink} style={{ color: '#007bff' }}>
                비밀번호 재설정하기
              </a>
            </p>
          )}
          <p className="auth-link">
            <Link to="/login">로그인으로 돌아가기</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>비밀번호 찾기</h2>

        {error && <div className="error-message">{error}</div>}

        <p className="form-description">
          등록된 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '전송 중...' : '재설정 링크 보내기'}
          </button>
        </form>

        <p className="auth-link">
          비밀번호가 기억나셨나요? <Link to="/login">로그인하기</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
