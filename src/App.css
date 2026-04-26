import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const sbUrl = process.env.REACT_APP_SUPABASE_URL || '';
const sbKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(sbUrl, sbKey);

const courseData = [
  { par: 4, si: 7 }, { par: 5, si: 1 }, { par: 3, si: 15 }, { par: 4, si: 9 }, { par: 4, si: 3 }, { par: 4, si: 11 },
  { par: 5, si: 5 }, { par: 3, si: 17 }, { par: 4, si: 13 }, { par: 4, si: 8 }, { par: 4, si: 2 }, { par: 3, si: 16 },
  { par: 5, si: 10 }, { par: 4, si: 4 }, { par: 4, si: 12 }, { par: 4, si: 6 }, { par: 3, si: 18 }, { par: 5, si: 14 }
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('egs_isLoggedIn') === 'true');
  const [player, setPlayer] = useState(() => JSON.parse(localStorage.getItem('egs_player')) || { name: "", handicap: 0 });
  const [currentHole, setCurrentHole] = useState(() => parseInt(localStorage.getItem('egs_currentHole')) || 0);
  const [scores, setScores] = useState(() => JSON.parse(localStorage.getItem('egs_scores')) || courseData.map(h => h.par));
  const [loginCode, setLoginCode] = useState("");
  const [allPlayers, setAllPlayers] = useState([]); 
  const [verifierName, setVerifierName] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  const handleLogout = useCallback(() => { localStorage.clear(); window.location.reload(); }, []);

  const loadSocietyData = useCallback(async () => {
    const { data: users } = await supabase.from('users').select('name').neq('name', player.name);
    setAllPlayers(users || []);
  }, [player.name]);

  useEffect(() => {
    localStorage.setItem('egs_isLoggedIn', isLoggedIn);
    localStorage.setItem('egs_player', JSON.stringify(player));
    localStorage.setItem('egs_currentHole', currentHole);
    localStorage.setItem('egs_scores', JSON.stringify(scores));
    if (isLoggedIn) loadSocietyData();
  }, [isLoggedIn, player, currentHole, scores, loadSocietyData]);

  const handleLogin = async () => {
    const { data } = await supabase.from('users').select('*').eq('access_code', loginCode).single();
    if (data) { setPlayer({ name: data.name, handicap: data.handicap }); setIsLoggedIn(true); } 
    else { alert("Invalid Code."); }
  };

  const calcPoints = (s, p, si) => {
    if (s === 0) return 0;
    const pops = Math.floor(player.handicap / 18) + (player.handicap % 18 >= si ? 1 : 0);
    return Math.max(0, p - (s - pops) + 2);
  };

  const totalPoints = scores.reduce((acc, s, i) => acc + calcPoints(s, courseData[i].par, courseData[i].si), 0);

  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: '#063020', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
        <h1 style={{ color: '#C9A66B', textAlign: 'center', fontWeight: '900' }}>EGS SCORING</h1>
        <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="000" style={{ padding: '20px', fontSize: '24px', textAlign: 'center', borderRadius: '10px', marginBottom: '10px' }} />
        <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: '#C9A66B', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '900' }}>LOG IN</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#063020', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px' }}>
      {!showSummary ? (
        <div style={{ width: '100%', maxWidth: '420px', backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden' }}>
          
          {/* 1. Header Area */}
          <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#063020' }}>{player.name}</h2>
            <div style={{ textAlign: 'right' }}>
              <small style={{ fontWeight: '900', color: '#C9A66B' }}>HCAP</small>
              <div style={{ fontSize: '24px', fontWeight: '900' }}>{player.handicap}</div>
            </div>
          </div>

          {/* 2. Stats Row (Hole, Par, SI) */}
          <div style={{ display: 'flex', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', textAlign: 'center', backgroundColor: '#fcfcfc' }}>
            {['HOLE', 'PAR', 'S.I.'].map((label, i) => (
              <div key={label} style={{ flex: 1, padding: '10px 0' }}>
                <small style={{ fontWeight: '900', color: '#888' }}>{label}</small><br/>
                <span style={{ fontSize: '32px', fontWeight: '900' }}>{i === 0 ? currentHole + 1 : i === 1 ? courseData[currentHole].par : courseData[currentHole].si}</span>
              </div>
            ))}
          </div>

          {/* 3. The Large Stroke Display */}
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
             <div style={{ fontSize: '120px', fontWeight: '900', color: '#063020', lineHeight: '1' }}>
                {scores[currentHole] === 0 ? "X" : scores[currentHole]}
             </div>
             <small style={{ fontWeight: '900', color: '#999', letterSpacing: '2px' }}>STROKES</small>
          </div>

          {/* 4. THE ACTION ROW - All buttons side-by-side to prevent overlapping */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '0 15px 30px 15px' }}>
            
            {/* Minus Button */}
            <button onClick={() => { if(scores[currentHole] > 1){const n=[...scores]; n[currentHole]--; setScores(n);}}} style={{ flex: 1, height: '70px', borderRadius: '12px', backgroundColor: '#ff4444', border: 'none', color: 'white', fontSize: '40px', fontWeight: '900' }}>-</button>
            
            {/* Plus Button */}
            <button onClick={() => { const n = [...scores]; if(n[currentHole] === 0) n[currentHole] = courseData[currentHole].par; else n[currentHole]++; setScores(n); }} style={{ flex: 1, height: '70px', borderRadius: '12px', backgroundColor: '#00c851', border: 'none', color: 'white', fontSize: '40px', fontWeight: '900' }}>+</button>
            
            {/* Pick Up Button */}
            <button onClick={() => { const n = [...scores]; n[currentHole] = 0; setScores(n); }} style={{ flex: 1, height: '70px', borderRadius: '12px', backgroundColor: '#444', color: 'white', border: 'none', fontSize: '14px', fontWeight: '900', textTransform: 'uppercase' }}>
              Pick<br/>Up
            </button>
          </div>

          {/* 5. Points Footer */}
          <div style={{ display: 'flex', borderTop: '1px solid #eee', textAlign: 'center' }}>
            <div style={{ flex: 1, padding: '15px' }}>
              <small style={{ color: '#00c851', fontWeight: '900' }}>HOLE PTS</small>
              <div style={{ fontSize: '40px', fontWeight: '900' }}>{calcPoints(scores[currentHole], courseData[currentHole].par, courseData[currentHole].si)}</div>
            </div>
            <div style={{ flex: 1, padding: '15px', borderLeft: '1px solid #eee' }}>
              <small style={{ color: '#00c851', fontWeight: '900' }}>TOTAL</small>
              <div style={{ fontSize: '40px', fontWeight: '900' }}>{totalPoints}</div>
            </div>
          </div>
          
          {/* 6. Navigation */}
          <div style={{ padding: '15px', display: 'flex', gap: '10px' }}>
            <button onClick={() => currentHole > 0 && setCurrentHole(currentHole - 1)} disabled={currentHole === 0} style={{ flex: 1, padding: '15px', borderRadius: '10px', backgroundColor: '#eee', color: '#666', border: 'none', fontWeight: '900' }}>PREV</button>
            <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole+1) : setShowSummary(true)} style={{ flex: 2, padding: '15px', borderRadius: '10px', backgroundColor: '#C9A66B', color: 'white', border: 'none', fontWeight: '900', fontSize: '18px' }}>NEXT HOLE</button>
          </div>
        </div>
      ) : (
        /* Summary View... */
        <div style={{ color: 'white', textAlign: 'center' }}>
          <h2>DONE</h2>
          <button onClick={handleLogout}>RESET</button>
        </div>
      )}
    </div>
  );
}