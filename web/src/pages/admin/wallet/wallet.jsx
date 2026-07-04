import React from 'react';

export default function AdminWallet() {
  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', background: '#fff', padding: 24, borderRadius: 12 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Admin Wallet</h1>
        <p style={{ color: '#64748b' }}>This is a placeholder wallet page for admin. Replace with real implementation.</p>

        <div style={{ marginTop: 18 }}>
          <div style={{ marginBottom: 8 }}><strong>Balance:</strong> ₹ 0.00</div>
          <button style={{ background: '#2563eb', color: 'white', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>Top Up</button>
        </div>
      </div>
    </div>
  );
}
