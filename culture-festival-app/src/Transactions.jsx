// src/Transactions.jsx
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

export default function Transactions({ onClose }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list'(一覧) or 'summary'(集計)

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
    if (!window.confirm('本当にこの取引記録を削除しますか？\n（※売上からも除外されます）')) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      alert('削除エラー: ' + error.message);
    } else {
      fetchOrders();
    }
  };

  // -------------------------
  // 集計データの計算
  // -------------------------
  const itemSummaryMap = {};
  let totalSalesAmount = 0; // 全体の総売上
  let totalSalesItems = 0;  // 全体の総販売点数

  orders.forEach(o => {
    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach(item => {
      const name = item.name || '不明な商品';
      const qty = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      const subtotal = price * qty;

      if (!itemSummaryMap[name]) {
        itemSummaryMap[name] = { name, quantity: 0, amount: 0 };
      }
      itemSummaryMap[name].quantity += qty;
      itemSummaryMap[name].amount += subtotal;

      totalSalesItems += qty;
      totalSalesAmount += subtotal;
    });
  });

  // 販売数が多い順（降順）に並び替え
  const summaryRanking = Object.values(itemSummaryMap).sort((a, b) => b.quantity - a.quantity);

  // -------------------------
  // CSV出力機能（一覧用）
  // -------------------------
  const exportListCsv = () => {
    if (orders.length === 0) return alert('出力するデータがありません');
    
    const headers = ['注文ID', '整理券番号', '日時', '担当スタッフ', 'ステータス', '注文内容', '合計点数', '合計金額(円)'];
    const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    
    const rows = orders.map(o => {
      const items = Array.isArray(o.items) ? o.items : [];
      const itemsStr = items.map(i => `${i.name}×${i.quantity}`).join(' / ');
      const totalQty = items.reduce((sum, i) => sum + Number(i.quantity || 1), 0);
      const totalAmount = items.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
      const dateStr = o.created_at ? new Date(o.created_at).toLocaleString('ja-JP') : '';
      
      return [
        o.id, o.ticket_number || '', dateStr, o.created_by || '不明',
        o.status === 'completed' ? '提供済' : '未調理', itemsStr, totalQty, totalAmount
      ];
    });

    downloadCsv(headers, rows, '取引履歴一覧');
  };

  // -------------------------
  // CSV出力機能（集計用）
  // -------------------------
  const exportSummaryCsv = () => {
    if (summaryRanking.length === 0) return alert('出力するデータがありません');
    
    const headers = ['順位', '商品名', '販売数(個)', '売上金額(円)'];
    const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    
    const rows = summaryRanking.map((item, index) => [
      index + 1, item.name, item.quantity, item.amount
    ]);

    // 合計行を追加
    rows.push(['-', '【総合計】', totalSalesItems, totalSalesAmount]);

    downloadCsv(headers, rows, '商品別販売数集計');
  };

  // 共通のCSVダウンロード処理
  const downloadCsv = (headers, rows, filePrefix) => {
    const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvStr = '\uFEFF' + [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\r\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
      
      {/* 上部ヘッダーと操作ボタン */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0 }}>
          {viewMode === 'list' ? `取引履歴一覧 (全 ${orders.length} 件)` : `商品別 販売集計`}
        </h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* 表示切り替えボタン */}
          <div style={{ display: 'flex', background: '#e0e0e0', borderRadius: '4px', padding: '2px' }}>
            <button 
              onClick={() => setViewMode('list')} 
              style={{ padding: '8px 16px', background: viewMode === 'list' ? 'white' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: viewMode === 'list' ? 'bold' : 'normal' }}
            >
              📄 履歴一覧
            </button>
            <button 
              onClick={() => setViewMode('summary')} 
              style={{ padding: '8px 16px', background: viewMode === 'summary' ? 'white' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: viewMode === 'summary' ? 'bold' : 'normal' }}
            >
              📊 販売数・集計
            </button>
          </div>

          <button 
            onClick={viewMode === 'list' ? exportListCsv : exportSummaryCsv} 
            style={{ padding: '8px 16px', background: '#00838f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            📥 {viewMode === 'list' ? '一覧をCSV出力' : '集計をCSV出力'}
          </button>
          <button 
            onClick={fetchOrders} 
            style={{ padding: '8px 16px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
          >
            🔄 最新に更新
          </button>
          <button 
            onClick={onClose} 
            style={{ padding: '8px 16px', background: '#424242', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            戻る
          </button>
        </div>
      </div>

      {/* コンテンツエリア */}
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        
        {/* --- [モード1] 取引履歴一覧 --- */}
        {viewMode === 'list' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead style={{ background: '#e0e0e0' }}>
              <tr>
                <th style={{ padding: '12px', borderBottom: '2px solid #bdbdbd' }}>日時</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #bdbdbd' }}>整理券</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #bdbdbd' }}>担当スタッフ</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #bdbdbd' }}>ステータス</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #bdbdbd' }}>注文内容</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #bdbdbd' }}>金額</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #bdbdbd' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#757575' }}>取引記録がありません</td></tr>
              ) : (
                orders.map(o => {
                  const items = Array.isArray(o.items) ? o.items : [];
                  const totalAmount = items.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
                  const staffName = o.created_by ? o.created_by.split('@')[0] : '不明';

                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid #eeeeee' }}>
                      <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{new Date(o.created_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#1565c0' }}>{o.ticket_number || '-'}</td>
                      <td style={{ padding: '12px', color: '#555' }}><span title={o.created_by}>{staffName}</span></td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '12px', fontSize: '12px', whiteSpace: 'nowrap',
                          background: o.status === 'completed' ? '#c8e6c9' : '#ffcc80',
                          color: o.status === 'completed' ? '#2e7d32' : '#ef6c00'
                        }}>
                          {o.status === 'completed' ? '提供済' : '未調理'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {items.map((item, idx) => <div key={idx}>{item.name} × {item.quantity}</div>)}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>¥{totalAmount.toLocaleString()}</td>
                      <td style={{ padding: '12px' }}>
                        <button 
                          onClick={() => deleteOrder(o.id)}
                          style={{ padding: '6px 12px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {/* --- [モード2] 販売数集計（ランキング形式） --- */}
        {viewMode === 'summary' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#bbdefb' }}>
              <tr>
                <th style={{ padding: '12px', borderBottom: '2px solid #90caf9', width: '60px', textAlign: 'center' }}>順位</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #90caf9' }}>商品名</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #90caf9', textAlign: 'right' }}>販売数 (個)</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #90caf9', textAlign: 'right' }}>売上金額 (円)</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</td></tr>
              ) : summaryRanking.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#757575' }}>販売データがありません</td></tr>
              ) : (
                <>
                  {summaryRanking.map((item, index) => (
                    <tr key={item.name} style={{ borderBottom: '1px solid #eeeeee', background: index < 3 ? '#fffde7' : 'white' }}>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: index === 0 ? '#fbc02d' : index === 1 ? '#9e9e9e' : index === 2 ? '#a1887f' : '#757575' }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.name}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '18px', fontWeight: 'bold', color: '#d84315' }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>¥{item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {/* 合計行 */}
                  <tr style={{ background: '#f5f5f5', borderTop: '2px solid #bdbdbd' }}>
                    <td colSpan="2" style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>総販売点数・総売上</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '18px' }}>{totalSalesItems}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '18px', color: '#2e7d32' }}>¥{totalSalesAmount.toLocaleString()}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        )}

      </div>
    </div>
  );
}