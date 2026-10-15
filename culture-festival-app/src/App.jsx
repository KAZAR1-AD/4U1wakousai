// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Register from './Register';
import Kitchen from './Kitchen';
import Darts from './Darts';
import ScoreEntry from './ScoreEntry';
import Admin from './Admin';
import Login from './Login';
import DartsQR from './DartsQR';
import './App.css';

export default function App() {
  const [userLevel, setUserLevel] = useState(1);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      determineUserLevel(session?.user);
      setIsChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      determineUserLevel(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const determineUserLevel = (user) => {
    if (!user) {
      setUserLevel(1);
    } else if (user.email === 'kimura@fes.com' || user.email === 'teacher@fes.com') { 
      setUserLevel(3);
    } else {
      setUserLevel(2);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isChecking) return null;

  return (
    <Router>
      <div style={{ padding: '10px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        
        {userLevel >= 2 && (
          <>
            {/* ★ flexWrap: 'wrap' を追加してメニューがスマホではみ出さないように設定 */}
            <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center' }}>
              <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', listStyle: 'none', padding: 0, margin: 0 }}>
                <li><Link to="/darts" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'bold' }}>ダーツランキング</Link></li>
                <li><Link to="/darts-qr" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'bold' }}>受付QR表示</Link></li>
                <li><Link to="/register" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'bold' }}>レジ画面</Link></li>
                <li><Link to="/kitchen" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'bold' }}>調理場画面</Link></li>
                <li><Link to="/admin" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'bold' }}>管理画面</Link></li>
              </ul>
              
              <div>
                <button onClick={handleLogout} style={{ padding: '8px 12px', background: '#333', color: 'white', cursor: 'pointer', border: 'none', borderRadius: '4px' }}>
                  ログアウト (Lv{userLevel})
                </button>
              </div>
            </nav>
            <hr style={{ margin: '15px 0' }} />
          </>
        )}
        
        <Routes>
          <Route path="/" element={<Navigate to="/darts" replace />} />
          <Route path="/login" element={userLevel > 1 ? <Navigate to="/register" replace /> : <Login />} />
          
          <Route path="/darts" element={<Darts />} />
          <Route path="/darts-qr" element={<DartsQR />} />
          <Route path="/score-entry" element={<ScoreEntry />} />
          
          <Route path="/register" element={userLevel >= 2 ? <Register /> : <Navigate to="/login" replace />} />
          <Route path="/kitchen" element={userLevel >= 2 ? <Kitchen /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={userLevel >= 2 ? <Admin userLevel={userLevel} /> : <Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}