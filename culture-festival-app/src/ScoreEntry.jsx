// src/ScoreEntry.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from './lib/supabase';

export default function ScoreEntry() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [score, setScore] = useState('');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      // トークンがデータベースに存在し（最新）、かつ現在時刻が有効期限内かチェック
      const { data, error } = await supabase
        .from('qr_tokens')
        .select('*')
        .eq('token', token)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (data && !error) {
        setIsValid(true);
      }
      setIsLoading(false);
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!playerName || !score) return;

    // 不正な値が送信されないよう送信前にもチェックを追加
    const parsedScore = parseInt(score, 10);
    if (parsedScore < 0 || parsedScore > 1440) {
      alert('スコアは0から1440の間で入力してください。');
      return;
    }

    const { error } = await supabase
      .from('darts_scores')
      .insert([{ player_name: playerName, score: parsedScore }]);

    if (!error) {
      alert('スコアを登録しました！');
      navigate('/darts');
    } else {
      alert('エラーが発生しました: ' + error.message);
    }
  };

  if (isLoading) return <div style={{ padding: '20px', textAlign: 'center' }}>確認中...</div>;

  // 期限切れ、または古いQRコード（データベースから削除済み）の場合は入力画面をブロックする
  if (!isValid) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', color: '#d32f2f' }}>
        <h2>無効なQRコードです</h2>
        <p>このQRコードは期限切れ、または古いコードです。<br/>受付画面にある最新のQRコードを再度読み取ってください。</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>カウントアップのスコアを入力してください</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>プレイヤー名</label>
          <input 
            type="text" 
            value={playerName} 
            onChange={(e) => setPlayerName(e.target.value)} 
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', fontSize: '1.1rem' }} 
            required 
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>スコア</label>
          <input 
            type="number" 
            min="0"
            max="1440"
            value={score} 
            onChange={(e) => {
              let val = e.target.value;
              // 空欄の場合はそのまま反映
              if (val === '') {
                setScore('');
                return;
              }
              
              // 入力値が1440を超えたら1440に、0未満なら0に自動補正
              let num = parseInt(val, 10);
              if (num > 1440) num = 1440;
              if (num < 0) num = 0;
              
              setScore(num.toString());
            }} 
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', fontSize: '1.1rem' }} 
            required 
          />
        </div>
        <button type="submit" style={{ padding: '15px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.2rem', cursor: 'pointer', marginTop: '10px' }}>
          登録する
        </button>
      </form>
    </div>
  );
}