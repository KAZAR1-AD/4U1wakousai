// src/DartsQR.jsx
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';

export default function DartsQR() {
  const [qrUrl, setQrUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    generateQrToken();

    // 3分（180000ミリ秒）ごとにQRコードを更新する
    const interval = setInterval(() => {
      generateQrToken();
    }, 180000);

    return () => clearInterval(interval);
  }, []);

  const generateQrToken = async () => {
    try {
      // 過去のトークンをすべて削除し、最新のQRコードのみを有効にする
      await supabase.from('qr_tokens').delete().not('token', 'is', null);

      // 新しいトークンの有効期限を3分後に設定
      const expiresAt = new Date(Date.now() + 3 * 60000).toISOString();
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
      <div style={{ padding: '20px', color: 'red', fontWeight: 'bold', textAlign: 'center' }}>
        <h2>システムエラーが発生しました</h2>
        <p>{errorMsg}</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '50px', background: '#f5f5f5', borderRadius: '12px', maxWidth: '500px', margin: '40px auto' }}>
      <h2>スコア登録用QRコード</h2>
      <p style={{ color: '#d32f2f', fontWeight: 'bold', marginBottom: '20px' }}>
        ※不正防止のため3分ごとに自動更新され、過去のQRコードは無効になります
      </p>
      
      <div style={{ background: 'white', display: 'inline-block', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        {qrUrl ? (
          <>
            <QRCodeCanvas value={qrUrl} size={300} />
            <div style={{ marginTop: '20px' }}>
              <a href={qrUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'underline', fontSize: '1.2rem' }}>
                PCでテスト画面を開く
              </a>
            </div>
          </>
        ) : (
          <p style={{ fontSize: '1.2rem' }}>QRコード生成中...</p>
        )}
      </div>
    </div>
  );
}