// src/Darts.jsx
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';

export default function Darts() {
  const [scores, setScores] = useState([]);
  const [qrUrl, setQrUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchScores();
    generateQrToken();

    const interval = setInterval(() => {
      generateQrToken();
    }, 300000);

    const channel = supabase
      .channel('public:darts_scores')
      // ★ event: 'INSERT' を event: '*' に変更し、追加・更新・削除のすべてを監視します
      .on('postgres_changes', { event: '*', schema: 'public', table: 'darts_scores' }, () => {
        fetchScores();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchScores = async () => {
    try {
      const { data, error } = await supabase
        .from('darts_scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      if (data) setScores(data);
    } catch (err) {
      setErrorMsg('スコア取得エラー: ' + err.message);
    }
  };

  const generateQrToken = async () => {
    try {
      const expiresAt = new Date(Date.now() + 5 * 60000).toISOString();
      const { data, error } = await supabase
        .from('qr_tokens')
        .insert([{ expires_at: expiresAt }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setQrUrl(`${window.location.origin}/score-entry?token=${data.token}`);
      }
    } catch (err) {
      setErrorMsg('QRコード生成エラー: ' + err.message);
    }
  };

  if (errorMsg) {
    return (
      <div style={{ padding: '20px', color: 'red', fontWeight: 'bold' }}>
        <h2>システムエラーが発生しました</h2>
        <p>{errorMsg}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '40px' }}>
      <div style={{ flex: 1 }}>
        <h2>ダーツ ランキング (カウントアップ)</h2>
        <ol style={{ paddingLeft: '20px' }}>
          {scores && Array.isArray(scores) && scores.map((s, index) => (
            <li key={s.id} style={{ fontSize: '1.5rem', margin: '15px 0', fontWeight: index < 3 ? 'bold' : 'normal' }}>
              {s.player_name} : {s.score} 点
            </li>
          ))}
          {(!scores || scores.length === 0) && <p>まだスコアがありません。</p>}
        </ol>
      </div>
      
      <div style={{ flex: 1, textAlign: 'center', background: '#f5f5f5', padding: '30px', borderRadius: '12px' }}>
        <h3>スコア登録用QRコード</h3>
        <p style={{ color: '#d32f2f', fontWeight: 'bold' }}>※不正防止のため5分ごとに自動更新されます</p>
        <div style={{ background: 'white', display: 'inline-block', padding: '20px', borderRadius: '8px' }}>
          {qrUrl ? (
            <>
              <QRCodeCanvas value={qrUrl} size={250} />
              <div style={{ marginTop: '20px' }}>
                <a href={qrUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline', fontSize: '1.2rem' }}>
                  PCでテスト画面を開く
                </a>
              </div>
            </>
          ) : (
            <p>QRコード生成中...</p>
          )}
        </div>
      </div>
    </div>
  );
}