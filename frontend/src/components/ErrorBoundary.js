import React, { Component } from 'react';
import '../styles/ErrorBoundary.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log error to console (can be replaced with error reporting service)
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h1>문제가 발생했습니다</h1>
            <p className="error-message">
              예기치 않은 오류가 발생했습니다. 불편을 드려 죄송합니다.
            </p>

            <div className="error-actions">
              <button className="btn btn-primary" onClick={this.handleReload}>
                🔄 페이지 새로고침
              </button>
              <button className="btn btn-secondary" onClick={this.handleGoHome}>
                🏠 홈으로 이동
              </button>
            </div>

            {this.state.error && (
              <details className="error-details">
                <summary>오류 상세 정보</summary>
                <div className="error-stack">
                  <h4>Error:</h4>
                  <pre>{this.state.error.toString()}</pre>
                  {this.state.errorInfo && (
                    <>
                      <h4>Component Stack:</h4>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
