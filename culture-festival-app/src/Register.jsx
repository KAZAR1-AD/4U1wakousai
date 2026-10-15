// src/Register.jsx
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

export default function Register() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [tenderedAmount, setTenderedAmount] = useState(''); 
  const [ticketNumber, setTicketNumber] = useState('');
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
    setTicketNumber('');
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const change = tenderedAmount ? parseInt(tenderedAmount, 10) - totalAmount : 0;

  const requiresTicket = cart.some(item => item.category !== 'ダーツ');
  const isSubmitDisabled = isSubmitting || cart.length === 0 || change < 0 || (requiresTicket && !ticketNumber);

  const submitOrder = async () => {
    if (isSubmitDisabled) return;
    setIsSubmitting(true);

    const hasFood = cart.some(item => item.category === 'フード');
    const hasDrink = cart.some(item => item.category === 'ドリンク');

    const { error } = await supabase.from('orders').insert([{ 
      items: cart, 
      status: 'pending',
      food_status: hasFood ? 'pending' : 'none',
      drink_status: hasDrink ? 'pending' : 'none',
      ticket_number: requiresTicket ? ticketNumber : null
    }]);

    if (error) {
      alert('エラーが発生しました: ' + error.message);
    } else {
      const ticketMsg = requiresTicket ? ` / 整理券: ${ticketNumber}番` : '';
      alert(`【お釣り: ${change}円】${ticketMsg}\nオーダーを確定しました！`);
      clearCart();
    }
    
    setIsSubmitting(false);
  };

  const categories = Array.from(new Set(products.map(p => p.category || '未分類')));

  return (
    <div className="app-container">
      
      {/* 左側：商品タップエリア */}
      <div className="register-left">
        <h2 style={{ fontSize: '1.8rem', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>レジ 商品一覧</h2>
        {categories.map(category => (
          <div key={category} style={{ marginBottom: '40px' }}>
            <h3 style={{ borderBottom: '4px solid #1976d2', paddingBottom: '10px', color: '#1976d2', fontSize: '1.6rem' }}>
              {category}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px', marginTop: '20px' }}>
              {products.filter(p => (p.category || '未分類') === category).map((p) => (
                <button 
                  key={p.id} 
                  onClick={() => addToCart(p)}
                  style={{ 
                    padding: '20px 10px', 
                    background: '#fff', 
                    border: '3px solid #1976d2', 
                    borderRadius: '12px', 
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  {/* 商品名を大きく、黒色でハッキリと */}
                  <div style={{ fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '12px', color: '#000', wordBreak: 'break-all' }}>
                    {p.name}
                  </div>
                  {/* 価格を大きく、赤色で目立たせる */}
                  <div style={{ color: '#d32f2f', fontSize: '1.3rem', fontWeight: 'bold' }}>
                    {p.price} 円
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 右側：計算・カートエリア */}
      <div className="register-right" style={{ background: '#f5f5f5', padding: '25px', borderRadius: '12px', border: '1px solid #ccc', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.5rem', margin: '0 0 15px 0' }}>🛒 現在のカート</h3>
        
        {/* カートの中身をレシート風に白背景で区切る */}
        <ul style={{ listStyle: 'none', padding: 0, minHeight: '120px', borderBottom: '3px solid #ccc', paddingBottom: '15px' }}>
          {cart.map((item, index) => (
            <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.4rem', marginBottom: '10px', background: '#fff', padding: '12px 15px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <span>
                {item.name} 
                <strong style={{ color: '#1976d2', marginLeft: '15px', fontSize: '1.5rem' }}>× {item.quantity}</strong>
              </span>
              <span style={{ fontWeight: 'bold' }}>{item.price * item.quantity} 円</span>
            </li>
          ))}
        </ul>
        
        <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <span>合計:</span>
          <span style={{ color: '#d32f2f' }}>{totalAmount} 円</span>
        </div>
        
        <div style={{ marginTop: '25px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', fontSize: '1.3rem' }}>預り金 (円)</label>
          <input 
            type="number" 
            value={tenderedAmount} 
            onChange={(e) => setTenderedAmount(e.target.value)} 
            style={{ width: '100%', padding: '15px', fontSize: '2rem', boxSizing: 'border-box', textAlign: 'right', borderRadius: '8px', border: '2px solid #aaa' }} 
          />
        </div>
        
        <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginTop: '15px', display: 'flex', justifyContent: 'space-between', color: change < 0 ? 'red' : 'green' }}>
          <span>お釣り:</span>
          <span>{tenderedAmount ? change : 0} 円</span>
        </div>

        {/* 整理券番号 */}
        {cart.length > 0 && requiresTicket ? (
          <div style={{ marginTop: '25px', background: '#e8f5e9', padding: '20px', borderRadius: '12px', border: '3px solid #4caf50' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#2e7d32', fontSize: '1.3rem' }}>🎫 整理券番号 (必須)</label>
            <input 
              type="text" 
              value={ticketNumber} 
              onChange={(e) => setTicketNumber(e.target.value)} 
              placeholder="番号を入力"
              style={{ width: '100%', padding: '15px', fontSize: '2rem', boxSizing: 'border-box', textAlign: 'center', border: '2px solid #4caf50', borderRadius: '8px', fontWeight: 'bold' }} 
              required
            />
          </div>
        ) : cart.length > 0 && !requiresTicket ? (
          <div style={{ marginTop: '25px', padding: '20px', color: '#333', textAlign: 'center', background: '#e0e0e0', borderRadius: '12px', fontSize: '1.3rem', fontWeight: 'bold' }}>
            ※ダーツのみのご注文は整理券不要です
          </div>
        ) : null}

        {/* ボタンも大きく押しやすく */}
        <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
          <button 
            onClick={clearCart} 
            style={{ flex: 1, padding: '20px', background: '#9e9e9e', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.4rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            クリア
          </button>
          <button 
            onClick={submitOrder} 
            disabled={isSubmitDisabled} 
            style={{ flex: 2, padding: '20px', background: isSubmitDisabled ? '#ccc' : '#e53935', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.6rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: isSubmitDisabled ? 'none' : '0 4px 0 #b71c1c' }}
          >
            注文確定
          </button>
        </div>
      </div>

    </div>
  );
}