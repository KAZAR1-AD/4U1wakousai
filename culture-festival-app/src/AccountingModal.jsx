// src/AccountingModal.jsx
import { useState } from 'react';
import { supabase } from './lib/supabase';

export default function AccountingModal({ isOpen, onClose, orders, products, closings, fetchData }) {
  const [actualCashInput, setActualCashInput] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState('0');

  if (!isOpen) return null;

  // --- 集計計算ロジック ---
  const lastClosingTime = closings.length > 0 ? new Date(closings[0].created_at) : new Date(0);
  const currentUnclosedOrders = orders.filter(o => new Date(o.created_at) > lastClosingTime);

  const currentSalesTotal = currentUnclosedOrders.reduce((sum, o) => {
    const orderTotal = o.items ? o.items.reduce((s, i) => s + (i.price * i.quantity), 0) : 0;
    return sum + orderTotal;
  }, 0);

  const currentItemSummary = {};
  const currentStaffSummary = {};

  currentUnclosedOrders.forEach(o => {
    const staff = o.created_by || '未記録';
    const orderTotal = o.items ? o.items.reduce((s, i) => s + (i.price * i.quantity), 0) : 0;
    currentStaffSummary[staff] = (currentStaffSummary[staff] || 0) + orderTotal;

    if (o.items) {
      o.items.forEach(item => {
        if (!currentItemSummary[item.name]) currentItemSummary[item.name] = { quantity: 0, amount: 0 };
        currentItemSummary[item.name].quantity += item.quantity;
        currentItemSummary[item.name].amount += item.price * item.quantity;
      });
    }
  });

  let grandTotalSales = 0;
  let grandTotalCost = 0;
  const grandItemSummary = {};

  orders.forEach(o => {
    if (o.items) {
      o.items.forEach(item => {
        const itemSales = item.price * item.quantity;
        const prodMatch = products.find(p => p.name === item.name);
        const unitCost = prodMatch ? (prodMatch.cost_price || 0) : 0;
        const itemCost = unitCost * item.quantity;

        grandTotalSales += itemSales;
        grandTotalCost += itemCost;

        if (!grandItemSummary[item.name]) grandItemSummary[item.name] = { quantity: 0, amount: 0 };
        grandItemSummary[item.name].quantity += item.quantity;
        grandItemSummary[item.name].amount += itemSales;
      });
    }
  });

  const grossProfit = grandTotalSales - grandTotalCost;
  const finalProfit = grossProfit - (parseInt(fixedExpenses, 10) || 0);

  const handleRegisterClose = async () => {
    if (actualCashInput === '') return alert('手元のレジ現金を入力してください。');

    const { data: { user } } = await supabase.auth.getUser();
    const actualCash = parseInt(actualCashInput, 10);
    const diff = actualCash - currentSalesTotal;

    const { error } = await supabase.from('register_closings').insert([{
      closed_by: user?.email || 'unknown',
      start_time: lastClosingTime.toISOString(),
      end_time: new Date().toISOString(),
      total_sales: currentSalesTotal,
      expected_cash: currentSalesTotal,
      actual_cash: actualCash,
      difference: diff
    }]);

    if (error) {
      alert('エラーが発生しました: ' + error.message);
    } else {
      alert(`レジ締めを記録しました！ (売上: ${currentSalesTotal}円 / 違算: ${diff}円)`);
      setActualCashInput('');
      fetchData();
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', padding: '30px', borderRadius: '12px',
        maxWidth: '800px', width: '90%', maxHeight: '85vh', overflowY: 'auto',
        position: 'relative', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', color: '#333'
      }}>
        {/* 閉じるボタン */}
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '15px', right: '20px', border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
        >
          ✖
        </button>

        <h2 style={{ borderBottom: '2px solid #2e7d32', paddingBottom: '10px', marginTop: 0, color: '#1b5e20' }}>
          💵 会計集計 & レジ締め
        </h2>

        {/* 1時間締めセクション */}
        <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>直近シフト（未締め）の状況</h3>
          <p><strong>対象時間:</strong> {lastClosingTime.toLocaleString()} ～ 現在</p>
          <p style={{ fontSize: '1.3rem', color: '#2e7d32', fontWeight: 'bold' }}>直近売上: {currentSalesTotal} 円</p>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <strong>担当者別売上:</strong>
              <ul>
                {Object.keys(currentStaffSummary).length === 0 && <li>注文なし</li>}
                {Object.entries(currentStaffSummary).map(([staff, amount]) => (
                  <li key={staff}>{staff}: {amount}円</li>
                ))}
              </ul>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <strong>商品別内訳:</strong>
              <ul>
                {Object.keys(currentItemSummary).length === 0 && <li>注文なし</li>}
                {Object.entries(currentItemSummary).map(([name, val]) => (
                  <li key={name}>{name}: {val.quantity}個 ({val.amount}円)</li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ marginTop: '15px', background: 'white', padding: '15px', borderRadius: '6px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>実際のレジ手元現金 (円)</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="number" 
                placeholder="例: 15000" 
                value={actualCashInput} 
                onChange={e => setActualCashInput(e.target.value)}
                style={{ flex: 1, padding: '8px', fontSize: '1.1rem' }}
              />
              <button onClick={handleRegisterClose} style={{ padding: '8px 15px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                締め実行
              </button>
            </div>
            {actualCashInput !== '' && (
              <p style={{ marginTop: '5px', fontWeight: 'bold', color: (parseInt(actualCashInput, 10) - currentSalesTotal) === 0 ? 'green' : 'red' }}>
                過不足(違算): {parseInt(actualCashInput, 10) - currentSalesTotal} 円
              </p>
            )}
          </div>
        </div>

        {/* 最終利益計算セクション */}
        <div style={{ background: '#fff3e0', padding: '15px', borderRadius: '8px' }}>
          <h3>📊 全体収支レポート</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            <div>総売上: <strong>{grandTotalSales}円</strong></div>
            <div>総原価: <strong>{grandTotalCost}円</strong></div>
            <div>粗利益: <strong style={{ color: 'green' }}>{grossProfit}円</strong></div>
            <div>純利益: <strong style={{ color: 'red' }}>{finalProfit}円</strong></div>
          </div>
          <div style={{ marginTop: '10px' }}>
            <label>固定費（出店料等）: </label>
            <input 
              type="number" 
              value={fixedExpenses} 
              onChange={e => setFixedExpenses(e.target.value)} 
              style={{ width: '100px', padding: '4px' }}
            /> 円
          </div>
        </div>

      </div>
    </div>
  );
}