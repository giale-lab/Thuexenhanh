import React, { Component } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter as Router } from 'react-router-dom';
import "./styles.css";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fatal-error" style={{ padding: 20, maxWidth: 600, margin: '40px auto', background: '#fef2f2', borderRadius: 8, border: '1px solid #f87171', color: '#991b1b', fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ fontSize: 20, marginTop: 0 }}>Ứng dụng đang gặp sự cố</h1>
          <p style={{ fontWeight: 'bold' }}>{this.state.error.toString()}</p>
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Chi tiết lỗi (Copy đoạn này gửi cho Admin):</label>
            <textarea 
              readOnly 
              value={this.state.error.stack || this.state.error.message} 
              style={{ width: '100%', height: 200, padding: 12, fontFamily: 'monospace', fontSize: 12, border: '1px solid #fca5a5', borderRadius: 4, background: '#fff', color: '#7f1d1d' }}
              onClick={(e) => e.target.select()}
            />
          </div>
          <button 
            style={{ marginTop: 20, padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
            onClick={() => {
              localStorage.removeItem("web-thue-xe-cars");
              window.location.reload();
            }}>
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Router>
        <App />
      </Router>
    </ErrorBoundary>
  </React.StrictMode>
);
