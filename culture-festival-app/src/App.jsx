// src/App.jsx
// ログイン状態とユーザーレベルを管理し、アクセス権限を制御します。

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Register from './Register';
import Kitchen from './Kitchen';
import Darts from './Darts';
import ScoreEntry from './ScoreEntry';
import Admin from './Admin';
import Login from './Login';

export default function App() {
  const [userLevel, setUserLevel] = useState(1); // 1:未ログイン, 2:スタッフ, 3:管理者
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 初回読み込み時に現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      determineUserLevel(session?.user);
      setIsChecking(false);
    });

    // ログイン・ログアウトなどの状態変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      determineUserLevel(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ユーザーのメールアドレスからレベルを判定する関数
  const determineUserLevel = (user) => {
    if (!user) {
      setUserLevel(1); // 未ログイン
    } else if (
      // 管理者（レベル3）にしたい人のメールアドレスをここで指定します（複数いる場合は || で繋ぎます）
      user.email === 'kimura@fes.com' || 
      user.email === 'x23u021@mitsuhashi.ac.jp'
    ) {
      setUserLevel(3);
    } else {
      // リストに指定されていないログイン済みユーザーはすべて一般スタッフ（レベル2）になります
      setUserLevel(2); 
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 読み込み中は何も表示しない
  if (isChecking) return null;

  return (
    <Router>
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        
        {/* ナビゲーションメニュー。レベルに応じて表示するリンクを変えます */}
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ul style={{ display: 'flex', gap: '20px', listStyle: 'none', padding: 0 }}>
            <li><Link to="/darts">ダーツランキング (Lv1~)</Link></li>
            {userLevel >= 2 && <li><Link to="/register">レジ画面 (Lv2~)</Link></li>}
            {userLevel >= 2 && <li><Link to="/kitchen">調理場画面 (Lv2~)</Link></li>}
            {userLevel >= 2 && <li><Link to="/admin">管理画面 (Lv2~)</Link></li>}
          </ul>
          <div>
            {userLevel === 1 ? (
              <Link to="/login" style={{ padding: '8px', background: '#ccc', textDecoration: 'none', color: 'black' }}>スタッフログイン</Link>
            ) : (
              <button onClick={handleLogout} style={{ padding: '8px', cursor: 'pointer' }}>ログアウト (Lv{userLevel})</button>
            )}
          </div>
        </nav>
        <hr style={{ margin: '20px 0' }} />
        
        <Routes>
          <Route path="/" element={<Navigate to="/darts" replace />} />
          <Route path="/login" element={userLevel > 1 ? <Navigate to="/register" replace /> : <Login />} />
          
          {/* レベル1: 誰でもアクセス可能 */}
          <Route path="/darts" element={<Darts />} />
          <Route path="/score-entry" element={<ScoreEntry />} />
          
          {/* レベル2以上: スタッフと管理者のみアクセス可能。未ログインは /login へ弾く */}
          <Route path="/register" element={userLevel >= 2 ? <Register /> : <Navigate to="/login" replace />} />
          <Route path="/kitchen" element={userLevel >= 2 ? <Kitchen /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={userLevel >= 2 ? <Admin userLevel={userLevel} /> : <Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}