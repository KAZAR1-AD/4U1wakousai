// src/Kitchen.jsx
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function Kitchen() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchPendingOrders();

    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        // 新しいオーダーが届いたら追加
        setOrders((current) => [payload.new, ...current]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        // 提供完了になったら消す
        if (payload.new.status === 'completed') {
          setOrders((current) => current.filter(o => o.id !== payload.new.id));
        }
      })
      // ★ここを追加：管理画面で削除されたら、調理場の画面からも消す
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((current) => current.filter(o => o.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data);
  };

  const markAsCompleted = async (orderId) => {
    await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId);
  };

  return (
    <div>
      <h2>調理場画面 (リアルタイム)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {orders.length === 0 && <p>現在オーダーはありません。</p>}
        {orders.map((order) => (
          <div key={order.id} style={{ border: '2px solid red', padding: '10px' }}>
            <p><strong>時間:</strong> {new Date(order.created_at).toLocaleTimeString()}</p>
            <ul>
              {order.items.map((item, i) => (
                <li key={i}>{item.name}</li>
              ))}
            </ul>
            <button 
              onClick={() => markAsCompleted(order.id)}
              style={{ padding: '5px 10px', background: 'green', color: 'white', cursor: 'pointer' }}
            >
              提供完了
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}