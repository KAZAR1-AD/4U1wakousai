// src/Admin.jsx
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import AccountingModal from './AccountingModal';

export default function Admin({ userLevel }) {
  const [scores, setScores] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [closings, setClosings] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('ダーツ');

  const [actualCashInput, setActualCashInput] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState('0');

  useEffect(() => {
    fetchData();
  }, [userLevel]);

  const fetchData = async () => {
    const { data: scoreData } = await supabase.from('darts_scores').select('*').order('score', { ascending: false });
    if (scoreData) setScores(scoreData);

    if (userLevel === 3) {
      const { data: orderData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (orderData) setOrders(orderData);

      const { data: productData } = await supabase.from('products').select('*').order('created_at', { ascending: true });
      if (productData) setProducts(productData);

      const { data: closingData } = await supabase.from('register_closings').select('*').order('created_at', { ascending: false });
      if (closingData) setClosings(closingData);
    }
  };

  const deleteScore = async (id) => {
    if (!window.confirm('本当にこのスコアを削除しますか？')) return;
    await supabase.from('darts_scores').delete().eq('id', id);
    fetchData();
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('本当にこの注文を削除しますか？')) return;
    await supabase.from('orders').delete().eq('id', id);
    fetchData();
  };

  const addProduct = async () => {
    if (!newProductName || !newProductPrice || !newProductCategory) return;
    await supabase.from('products').insert([{ 
      name: newProductName, 
      price: parseInt(newProductPrice, 10),
      category: newProductCategory
    }]);
    setNewProductName('');
    setNewProductPrice('');
    setNewCostPrice('');
    fetchData();
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('本当にこの商品をメニューから削除しますか？')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchData();
  };

  const updatePassword = async () => {
    if (!newPassword || newPassword.length < 6) return alert('パスワードは6文字以上で入力してください');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) alert('エラーが発生しました: ' + error.message);
    else {
      alert('パスワードを変更しました。');
      setNewPassword('');
    }
  };

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
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>管理画面 {userLevel === 3 ? '(管理者)' : '(一般スタッフ)'}</h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {userLevel === 3 && (
            <button 
              onClick={() => setIsModalOpen(true)} 
              style={{ padding: '8px 16px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              💵 会計集計ポップアップを開く
            </button>
          )}
          <button onClick={fetchData} style={{ padding: '8px 16px', cursor: 'pointer' }}>最新データを再取得</button>
        </div>
      </div>
      
      <AccountingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        orders={orders} 
        products={products} 
        closings={closings} 
        fetchData={fetchData} 
      />
      
      <div style={{ display: 'flex', gap: '30px', marginTop: '20px', flexWrap: 'wrap' }}>
        
        {userLevel === 3 && (
          <div style={{ flex: 1, minWidth: '350px', background: '#fff9c4', padding: '20px', borderRadius: '8px' }}>
            <h3>レジ メニュー設定</h3>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px', flexWrap: 'wrap' }}>
              <select 
                value={newProductCategory} 
                onChange={e => setNewProductCategory(e.target.value)} 
                style={{ flex: 1, padding: '8px' }}
              >
                <option value="ダーツ">ダーツ</option>
                <option value="フード">フード</option>
                <option value="ドリンク">ドリンク</option>
              </select>
              <input type="text" placeholder="商品名" value={newProductName} onChange={e => setNewProductName(e.target.value)} style={{ flex: 2, padding: '8px' }} />
              <input type="number" placeholder="価格" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} style={{ flex: 1, padding: '8px' }} />
              <button onClick={addProduct} style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '0 15px', cursor: 'pointer' }}>追加</button>
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {products.map(p => (
                <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', background: 'white', padding: '10px', borderRadius: '4px' }}>
                  <span>[{p.category || '未分類'}] {p.name} - {p.price}円</span>
                  <button onClick={() => deleteProduct(p.id)} style={{ background: '#d32f2f', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>削除</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ flex: 1, minWidth: '300px', background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
          <h3>ダーツ スコア管理</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {scores.map(s => (
              <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', background: 'white', padding: '10px', borderRadius: '4px' }}>
                <span>{s.player_name} : {s.score}点</span>
                <button onClick={() => deleteScore(s.id)} style={{ background: '#d32f2f', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>削除</button>
              </li>
            ))}
          </ul>
        </div>

        {userLevel === 3 && (
          <div style={{ flex: 1, minWidth: '300px', background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
            <h3>レジ 注文履歴</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {orders.map(o => (
                <li key={o.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', background: 'white', padding: '10px', borderRadius: '4px' }}>
                  <span>[{o.status === 'completed' ? '提供済' : '未調理'}] {new Date(o.created_at).toLocaleTimeString()}</span>
                  <button onClick={() => deleteOrder(o.id)} style={{ background: '#d32f2f', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>削除</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ flex: 1, minWidth: '300px', background: '#e3f2fd', padding: '20px', borderRadius: '8px' }}>
          <h3>アカウント設定</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="password" placeholder="新しいパスワード (6文字以上)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ flex: 1, padding: '8px' }} />
            <button onClick={updatePassword} disabled={!newPassword || newPassword.length < 6} style={{ padding: '8px 16px', background: '#1976d2', color: 'white', border: 'none' }}>変更</button>
          </div>
        </div>

      </div>
    </div>
  );
}