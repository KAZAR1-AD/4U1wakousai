// src/Kitchen.jsx
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function Kitchen() {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .or('food_status.eq.pending,drink_status.eq.pending')
      .order('created_at', { ascending: true });
    
    if (data) setOrders(data);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const foodQueue = orders.filter(o => o.food_status === 'pending');
  const drinkQueue = orders.filter(o => o.drink_status === 'pending');

  const completeFood = async (orderId) => {
    await supabase.from('orders').update({ food_status: 'completed' }).eq('id', orderId);
  };

  const completeDrink = async (orderId) => {
    await supabase.from('orders').update({ drink_status: 'completed' }).eq('id', orderId);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '1' || e.key === '１') {
        if (foodQueue.length > 0) completeFood(foodQueue[0].id);
      }
      if (e.key === '2' || e.key === '２') {
        if (drinkQueue.length > 0) completeDrink(drinkQueue[0].id);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [foodQueue, drinkQueue]);

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>👨‍🍳 調理場 KDS</h2>
      
      <div style={{ display: 'flex', gap: '30px' }}>
        
        {/* 左側：フード専用列 */}
        <div style={{ flex: 1, background: '#ffebee', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ borderBottom: '3px solid #d32f2f', paddingBottom: '10px' }}>
            🍔 フード <span style={{ fontSize: '1rem', color: '#555', fontWeight: 'normal' }}>(キー [1] で上から完了)</span>
          </h3>
          {foodQueue.length === 0 && <p>フードの注文はありません</p>}
          {foodQueue.map((order, index) => (
            <div key={`food-${order.id}`} style={{ background: index === 0 ? '#ffcdd2' : 'white', padding: '15px', marginBottom: '15px', borderRadius: '8px', border: index === 0 ? '3px solid #d32f2f' : '1px solid #ccc', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              
              {/* 整理券番号を大きく表示 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', color: '#555' }}>
                <strong style={{ minWidth: '70px' }}>{index === 0 ? '▶ 最優先' : ''}</strong>
                <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#d32f2f', border: '2px solid #d32f2f', padding: '2px 10px', borderRadius: '4px', background: '#fff' }}>
                  番号: {order.ticket_number || 'なし'}
                </span>
                <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <ul style={{ fontSize: '1.3rem', fontWeight: 'bold', listStyle: 'none', padding: 0 }}>
                {order.items.filter(item => item.category === 'フード').map((item, i) => (
                  <li key={i} style={{ marginBottom: '8px' }}>{item.name} <span style={{ color: '#d32f2f', marginLeft: '10px' }}>× {item.quantity}</span></li>
                ))}
              </ul>
              <button onClick={() => completeFood(order.id)} style={{ width: '100%', padding: '12px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1.2rem', cursor: 'pointer', marginTop: '10px' }}>
                提供完了 (1)
              </button>
            </div>
          ))}
        </div>

        {/* 右側：ドリンク専用列 */}
        <div style={{ flex: 1, background: '#e3f2fd', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ borderBottom: '3px solid #1976d2', paddingBottom: '10px' }}>
            🥤 ドリンク <span style={{ fontSize: '1rem', color: '#555', fontWeight: 'normal' }}>(キー [2] で上から完了)</span>
          </h3>
          {drinkQueue.length === 0 && <p>ドリンクの注文はありません</p>}
          {drinkQueue.map((order, index) => (
            <div key={`drink-${order.id}`} style={{ background: index === 0 ? '#bbdefb' : 'white', padding: '15px', marginBottom: '15px', borderRadius: '8px', border: index === 0 ? '3px solid #1976d2' : '1px solid #ccc', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              
              {/* 整理券番号を大きく表示 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', color: '#555' }}>
                <strong style={{ minWidth: '70px' }}>{index === 0 ? '▶ 最優先' : ''}</strong>
                <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1976d2', border: '2px solid #1976d2', padding: '2px 10px', borderRadius: '4px', background: '#fff' }}>
                  番号: {order.ticket_number || 'なし'}
                </span>
                <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <ul style={{ fontSize: '1.3rem', fontWeight: 'bold', listStyle: 'none', padding: 0 }}>
                {order.items.filter(item => item.category === 'ドリンク').map((item, i) => (
                  <li key={i} style={{ marginBottom: '8px' }}>{item.name} <span style={{ color: '#1976d2', marginLeft: '10px' }}>× {item.quantity}</span></li>
                ))}
              </ul>
              <button onClick={() => completeDrink(order.id)} style={{ width: '100%', padding: '12px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1.2rem', cursor: 'pointer', marginTop: '10px' }}>
                提供完了 (2)
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}