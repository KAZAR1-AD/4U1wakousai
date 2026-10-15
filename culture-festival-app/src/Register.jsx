// src/Register.jsx
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

export default function Register() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [tenderedAmount, setTenderedAmount] = useState(''); 
  const [ticketNumber, setTicketNumber] = useState(''); // 整理券番号の状態を追加
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: true });
      if (data) setProducts(data);
    };
    fetchProducts();
  }, []);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const clearCart = () => {
    setCart([]);
    setTenderedAmount('');
    setTicketNumber(''); // クリア時に整理券番号もリセット
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const change = tenderedAmount ? parseInt(tenderedAmount, 10) - totalAmount : 0;

  const submitOrder = async () => {
    // 整理券番号が未入力の場合は送信しない
    if (cart.length === 0 || change < 0 || !ticketNumber) return;
    setIsSubmitting(true);

    const hasFood = cart.some(item => item.category === 'フード');
    const hasDrink = cart.some(item => item.category === 'ドリンク');

    const { error } = await supabase.from('orders').insert([{ 
      items: cart, 
      status: 'pending',
      food_status: hasFood ? 'pending' : 'none',
      drink_status: hasDrink ? 'pending' : 'none',
      ticket_number: ticketNumber // 整理券番号をデータベースに送信
    }]);

    if (error) {
      alert('エラーが発生しました: ' + error.message);
    } else {
      alert(`お釣り: ${change}円 / 整理券番号: ${ticketNumber}\nオーダーを送信しました！`);
      clearCart();
    }
    
    setIsSubmitting(false);
  };

  const categories = Array.from(new Set(products.map(p => p.category || '未分類')));

  return (
    <div style={{ display: 'flex', gap: '30px', fontFamily: 'sans-serif' }}>
      
      {/* 左側：商品タップエリア */}
      <div style={{ flex: 2, height: '85vh', overflowY: 'auto', paddingRight: '10px' }}>
        <h2>レジ 商品一覧</h2>
        {categories.map(category => (
          <div key={category} style={{ marginBottom: '30px' }}>
            <h3 style={{ borderBottom: '3px solid #1976d2', paddingBottom: '8px', color: '#333' }}>{category}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px', marginTop: '15px' }}>
              {products.filter(p => (p.category || '未分類') === category).map((p) => (
                <button 
                  key={p.id} 
                  onClick={() => addToCart(p)}
                  style={{ padding: '15px', fontSize: '1.1rem', background: '#e3f2fd', border: '2px solid #1976d2', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{p.name}</div>
                  <div style={{ color: '#555' }}>{p.price}円</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 右側：計算・カートエリア */}
      <div style={{ flex: 1, background: '#f5f5f5', padding: '20px', borderRadius: '12px', minWidth: '300px', height: 'fit-content' }}>
        <h3>現在のカート</h3>
        <ul style={{ listStyle: 'none', padding: 0, minHeight: '150px', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
          {cart.map((item, index) => (
            <li key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', marginBottom: '10px' }}>
              <span>{item.name} <strong style={{ color: 'blue' }}>×{item.quantity}</strong></span>
              <span>{item.price * item.quantity}円</span>
            </li>
          ))}
        </ul>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
          <span>合計:</span><span>{totalAmount} 円</span>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>預り金 (円)</label>
          <input type="number" value={tenderedAmount} onChange={(e) => setTenderedAmount(e.target.value)} style={{ width: '100%', padding: '12px', fontSize: '1.5rem', boxSizing: 'border-box', textAlign: 'right' }} />
        </div>
        
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '10px', display: 'flex', justifyContent: 'space-between', color: change < 0 ? 'red' : 'green' }}>
          <span>お釣り:</span><span>{tenderedAmount ? change : 0} 円</span>
        </div>

        {/* 整理券番号の入力エリアを追加 */}
        <div style={{ marginTop: '20px', background: '#e8f5e9', padding: '15px', borderRadius: '8px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#2e7d32' }}>整理券番号 (必須)</label>
          <input 
            type="text" 
            value={ticketNumber} 
            onChange={(e) => setTicketNumber(e.target.value)} 
            placeholder="番号を入力"
            style={{ width: '100%', padding: '12px', fontSize: '1.5rem', boxSizing: 'border-box', textAlign: 'center', border: '2px solid #4caf50', borderRadius: '6px' }} 
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={clearCart} style={{ flex: 1, padding: '15px', background: '#ccc', border: 'none', borderRadius: '8px', fontSize: '1.1rem', cursor: 'pointer' }}>クリア</button>
          <button 
            onClick={submitOrder} 
            disabled={isSubmitting || cart.length === 0 || change < 0 || !ticketNumber} 
            style={{ flex: 2, padding: '15px', background: (cart.length === 0 || change < 0 || !ticketNumber) ? '#aaa' : '#e53935', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            注文確定
          </button>
        </div>
      </div>

    </div>
  );
}