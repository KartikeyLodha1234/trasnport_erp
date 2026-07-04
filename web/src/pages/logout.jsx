import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Logout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Apne token ya state clear karein (Clear storage configs)
    localStorage.clear();
    sessionStorage.clear();
    
    // 2. Redirect back to login screen "/"
    navigate('/');
  };

  const handleCancel = () => {
    // Redirect back to main terminal/dashboard panel
    navigate('/dashboard');
  };

  // Fixed Deep Theme Inline Styles Configuration
  const styles = {
    wrapper: {
      backgroundColor: '#f1f5f9',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'sans-serif',
      width: '100%'
    },
    modalBox: {
      backgroundColor: '#ffffff',
      border: '2px solid #cbd5e1',
      borderRadius: '16px',
      padding: '32px',
      maxWidth: '420px',
      width: '100%',
      textAlign: 'center',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    },
    icon: {
      fontSize: '48px',
      marginBottom: '16px',
      display: 'inline-block'
    },
    title: {
      color: '#0f172a',
      fontSize: '22px',
      fontWeight: '900',
      margin: '0 0 10px 0'
    },
    description: {
      color: '#475569',
      fontSize: '14px',
      fontWeight: '600',
      lineHeight: '1.5',
      margin: '0 0 24px 0'
    },
    btnContainer: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'center'
    },
    btnLogout: {
      backgroundColor: '#dc2626',
      color: '#ffffff',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '10px',
      fontWeight: '800',
      fontSize: '14px',
      cursor: 'pointer',
      flex: 1,
      boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
    },
    btnCancel: {
      backgroundColor: '#f1f5f9',
      color: '#334155',
      border: '1px solid #cbd5e1',
      padding: '12px 24px',
      borderRadius: '10px',
      fontWeight: '800',
      fontSize: '14px',
      cursor: 'pointer',
      flex: 1
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.modalBox}>
        {/* Visual Prompt Indicator */}
        <div style={styles.icon}>🚪</div>
        
        <h2 style={styles.title}>Confirm System Logout</h2>
        <p style={styles.description}>
          Are you sure you want to terminate your current administrative shift session? Unsaved routing manifest changes will be cleared.
        </p>
        
        {/* Action Commands */}
        <div style={styles.btnContainer}>
          <button style={styles.btnCancel} onClick={handleCancel}>
            Cancel
          </button>
          <button style={styles.btnLogout} onClick={handleLogout}>
            Yes, Logout
          </button>
        </div>
      </div>
    </div>
  );
}