// src/Darts.jsx
// お客様が自分のスマホや会場のモニターで見るための、ランキング専用画面です。

import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function Darts() {
  const [scores, setScores] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchScores();

    // リアルタイム更新の監視
    const channel = supabase
      .channel('public:darts_scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'darts_scores' }, () => {
        fetchScores();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchScores = async () => {
    try {
      const { data, error } = await supabase
        .from('darts_scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(10); // 上位10名を表示
      
      if (error) throw error;
      if (data) setScores(data);
    } catch (err) {
      setErrorMsg('スコア取得エラー: ' + err.message);
    }
  };

  if (errorMsg) {
    return (
      <div style={{ padding: '20px', color: 'red', fontWeight: 'bold', textAlign: 'center' }}>
        <h2>システムエラーが発生しました</h2>
        <p>{errorMsg}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', fontSize: '2rem', borderBottom: '3px solid #333', paddingBottom: '10px' }}>
        🎯 ダーツ ランキング
      </h2>
      
      <ol style={{ padding: '20px', listStylePosition: 'inside' }}>
        {scores && Array.isArray(scores) && scores.map((s, index) => (
          <li 
            key={s.id} 
            style={{ 
              fontSize: index < 3 ? '2rem' : '1.5rem', 
              margin: '20px 0', 
              fontWeight: index < 3 ? 'bold' : 'normal',
              background: index === 0 ? '#fff9c4' : index === 1 ? '#f5f5f5' : index === 2 ? '#ffe0b2' : 'transparent',
              padding: '15px',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>
              {index === 0 && '🥇 '}
              {index === 1 && '🥈 '}
              {index === 2 && '🥉 '}
              {s.player_name}
            </span>
            <span style={{ color: '#d32f2f' }}>{s.score} 点</span>
          </li>
        ))}
        {(!scores || scores.length === 0) && <p style={{ textAlign: 'center', fontSize: '1.2rem' }}>まだスコアがありません。</p>}
      </ol>
    </div>
  );
}