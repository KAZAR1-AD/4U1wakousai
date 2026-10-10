// src/ScoreEntry.jsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from './lib/supabase';

export default function ScoreEntry() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [isValidToken, setIsValidToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [score, setScore] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    checkToken();
  }, [token]);

  // アクセスしてきたURLのトークンが有効（5分以内）かチェックする
  const checkToken = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from('qr_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (data) {
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      if (now <= expiresAt) {
        setIsValidToken(true); // 期限内なら入力画面を表示
      }
    }
    setIsLoading(false);
  };

  const submitScore = async () => {
    if (!playerName || !score) return;

    const { error } = await supabase
      .from('darts_scores')
      .insert([{ player_name: playerName, score: parseInt(score, 10) }]);

    if (!error) {
      setIsSubmitted(true);
    } else {
      alert('登録に失敗しました。');
    }
  };

  if (isLoading) return <div style={{ padding: '20px' }}>確認中...</div>;
  
  if (!isValidToken && !isSubmitted) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3 style={{ color: 'red' }}>無効または期限切れのQRコードです。</h3>
        <p>モニターに表示されている新しいQRコードを再度読み取ってください。</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3 style={{ color: 'green' }}>スコアの登録が完了しました！</h3>
        <p>モニターのランキング画面を確認してください。</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center' }}>ダーツ スコア登録</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>プレイヤー名 (ニックネーム)</label>
        <input 
          type="text" 
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="例: たろう"
          style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>スコア</label>
        <input 
          type="number" 
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="例: 450"
          style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>
      
      <button 
        onClick={submitScore}
        disabled={!playerName || !score}
        style={{ width: '100%', padding: '15px', background: (!playerName || !score) ? '#ccc' : '#1976d2', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1.2rem', cursor: 'pointer' }}
      >
        登録する
      </button>
    </div>
  );
}