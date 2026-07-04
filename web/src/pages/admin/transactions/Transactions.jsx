import React from 'react';

export default function Transactions() {
  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', background: '#fff', padding: 24, borderRadius: 12 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Transactions</h1>
        <p style={{ color: '#64748b' }}>Placeholder transactions list. Replace with real implementation.</p>

        <div style={{ marginTop: 18 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '8px 6px' }}>Date</th>
                <th style={{ padding: '8px 6px' }}>Reference</th>
                 <th style={{ padding: '8px 6px' }}>Name</th>
                <th style={{ padding: '8px 6px' }}>Amount</th>
                <th style={{ padding: '8px 6px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px 6px' }}>—</td>
                <td style={{ padding: '8px 6px' }}>—</td>
                <td style={{ padding: '8px 6px' }}>—</td>
                <td style={{ padding: '8px 6px' }}>—</td>
                <td style={{ padding: '8px 6px' }}>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
