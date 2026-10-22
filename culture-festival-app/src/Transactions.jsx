// src/Transactions.jsx
// 取引履歴専用のページコンポーネントです。
// 表形式（テーブル）で見やすく一覧表示し、削除やCSV出力を行う機能がまとまっています。

import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

export default function Transactions({ onClose }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      alert('エラーが発生しました: ' + error.message);
    } else if (data) {
      setOrders(data);
    }
    setIsLoading(false);
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('本当にこの取引記録を削除しますか？\n※レジ締めの売上計算からも除外されます。')) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      alert('削除エラー: ' + error.message);
    } else {
      fetchOrders();
    }
  };

  // CSV出力機能（一覧用）
  const exportCsv = () => {
    if (orders.length === 0) return alert('データがありません');
    
    const headers = ['注文ID', '日時', '整理券番号', '担当', 'ステータス', '注文内容', '合計金額'];
    const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    
    const rows = orders.map(o => {
      const items = Array.isArray(o.items) ? o.items : [];
      const itemsStr = items.map(i => `${i.name}×${i.quantity}`).join(' / ');
      const totalAmount = items.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.quantity || 0)), 0);
      const dateStr = o.created_at ? new Date(o.created_at).toLocaleString('ja-JP') : '';
      
      return [
        o.id,
        dateStr,
        o.ticket_number,
        o.created_by || '未記録',
        o.status === 'completed' ? '提供済' : '未調理',
        itemsStr,
        totalAmount
      ];
    });

    const csvStr = '\uFEFF' + [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\r\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `取引履歴_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div style={{ padding: '20px' }}>読み込み中...</div>;
  }

  return (
    <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>取引履歴 (全 {orders.length} 件)</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={exportCsv} 
            style={{ padding: '8px 16px', background: '#00838f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            📥 一覧をCSVで出力
          </button>
          <button 
            onClick={fetchOrders} 
            style={{ padding: '8px 16px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
          >
            🔄 更新
          </button>
          <button 
            onClick={onClose} 
            style={{ padding: '8px 16px', background: '#424242', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            戻る
          </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#e0e0e0' }}>
            <tr>
              <th style={{ padding: '12px', borderBottom: '2px solid #bdbdbd' }}>日時</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #bdbdbd' }}>整理券番号</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #bdbdbd' }}>注文内容</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #bdbdbd' }}>合計金額</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #bdbdbd' }}>ステータス</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #bdbdbd' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => {
              const items = Array.isArray(o.items) ? o.items : [];
              const totalAmount = items.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.quantity || 0)), 0);
              
              return (
                <tr key={o.id} style={{ borderBottom: '1px solid #eeeeee' }}>
                  <td style={{ padding: '12px' }}>{new Date(o.created_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#1565c0' }}>{o.ticket_number || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    {items.map((item, idx) => (
                      <div key={idx}>{item.name} × {item.quantity}</div>
                    ))}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>¥{totalAmount.toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      background: o.status === 'completed' ? '#c8e6c9' : '#ffcc80',
                      color: o.status === 'completed' ? '#2e7d32' : '#ef6c00'
                    }}>
                      {o.status === 'completed' ? '提供済' : '未調理'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button 
                      onClick={() => deleteOrder(o.id)}
                      style={{ padding: '6px 12px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#757575' }}>取引記録がありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}