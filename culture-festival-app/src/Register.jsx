// src/Register.jsx
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

export default function Register() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [tenderedAmount, setTenderedAmount] = useState(''); // 預り金
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 画面を開いた時にメニューを読み込む
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: true });
      if (data) setProducts(data);
    };
    fetchProducts();
  }, []);

  // カートに商品を追加（タップ回数＝数量）
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        // 既にカートにあれば数量+1
        return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      // なければ数量1で追加
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // カートを空にする
  const clearCart = () => {
    setCart([]);
    setTenderedAmount('');
  };

  // 合計金額とお釣りの計算
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const change = tenderedAmount ? parseInt(tenderedAmount, 10) - totalAmount : 0;

  // 注文を送信
  const submitOrder = async () => {
    if (cart.length === 0 || change < 0) return;
    setIsSubmitting(true);

    const { error } = await supabase.from('orders').insert([{ items: cart, status: 'pending' }]);

    if (error) {
      alert('エラーが発生しました: ' + error.message);
    } else {
      alert(`お釣りは ${change}円 です。オーダーを調理場へ送信しました！`);
      clearCart();
    }
    
    setIsSubmitting(false);
  };

  return (
    <div style={{ display: 'flex', gap: '30px', fontFamily: 'sans-serif' }}>
      
      {/* 左側：商品タップエリア */}
      <div style={{ flex: 2 }}>
        <h2>レジ 商品一覧</h2>
        {products.length === 0 && <p>※管理画面から商品を登録してください</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
          {products.map((p) => (
            <button 
              key={p.id} 
              onClick={() => addToCart(p)}
              style={{ padding: '20px', fontSize: '1.1rem', background: '#e3f2fd', border: '2px solid #1976d2', borderRadius: '8px', cursor: 'pointer', textAlign: 'center' }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{p.name}</div>
              <div style={{ color: '#555' }}>{p.price}円</div>
            </button>
          ))}
        </div>
      </div>

      {/* 右側：計算・カートエリア */}
      <div style={{ flex: 1, background: '#f5f5f5', padding: '20px', borderRadius: '12px', minWidth: '300px' }}>
        <h3>現在のカート</h3>
        <ul style={{ listStyle: 'none', padding: 0, minHeight: '150px', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
          {cart.length === 0 && <p style={{ color: '#888' }}>商品はまだありません</p>}
          {cart.map((item, index) => (
            <li key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', marginBottom: '10px' }}>
              <span>{item.name} <strong style={{ color: 'blue' }}>×{item.quantity}</strong></span>
              <span>{item.price * item.quantity}円</span>
            </li>
          ))}
        </ul>

        {/* 計算表示 */}
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
          <span>合計:</span>
          <span>{totalAmount} 円</span>
        </div>

        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>預り金 (円)</label>
          <input 
            type="number" 
            value={tenderedAmount} 
            onChange={(e) => setTenderedAmount(e.target.value)} 
            placeholder="例: 1000"
            style={{ width: '100%', padding: '12px', fontSize: '1.5rem', boxSizing: 'border-box', textAlign: 'right' }} 
          />
        </div>

        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '15px', display: 'flex', justifyContent: 'space-between', color: change < 0 ? 'red' : 'green' }}>
          <span>お釣り:</span>
          <span>{tenderedAmount ? change : 0} 円</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
          <button onClick={clearCart} style={{ flex: 1, padding: '15px', background: '#ccc', border: 'none', borderRadius: '8px', fontSize: '1.1rem', cursor: 'pointer' }}>
            クリア
          </button>
          <button 
            onClick={submitOrder} 
            disabled={isSubmitting || cart.length === 0 || change < 0}
            style={{ flex: 2, padding: '15px', background: (cart.length === 0 || change < 0) ? '#aaa' : '#e53935', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            注文確定
          </button>
        </div>
      </div>

    </div>
  );
}