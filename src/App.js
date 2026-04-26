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
  const [showSummary, setShowSummary] = useState(false);

  const handleLogout = useCallback(() => { localStorage.clear(); window.location.reload(); }, []);

  useEffect(() => {
    localStorage.setItem('egs_isLoggedIn', isLoggedIn);
    localStorage.setItem('egs_player', JSON.stringify(player));
    localStorage.setItem('egs_currentHole', currentHole);
    localStorage.setItem('egs_scores', JSON.stringify(scores));
  }, [isLoggedIn, player, currentHole, scores]);

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
        <h1 style={{ color: 'white', textAlign: 'center', fontWeight: '900' }}>EGS LOGIN</h1>
        <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="000" style={{ padding: '20px', fontSize: '20px', textAlign: 'center', borderRadius: '12px', marginBottom: '10px', border: 'none' }} />
        <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: '#C9A66B', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900' }}>ACCESS CARD</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f4f4f4', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'sans-serif' }}>
      {!showSummary ? (
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'white' }}>
          
          {/* 1. DARK GREEN HEADER */}
          <div style={{ padding: '20px', backgroundColor: '#063020', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '1px' }}>{player.name.toUpperCase()}</span>
                <div style={{ textAlign: 'right' }}>
                    <small style={{ display: 'block', fontSize: '10px', opacity: 0.8 }}>HCAP</small>
                    <span style={{ fontSize: '20px', fontWeight: '900' }}>{player.handicap}</span>
                </div>
            </div>
          </div>

          {/* 2. SHADED STATS BAR */}
          <div style={{ display: 'flex', backgroundColor: '#e9ecef', borderBottom: '1px solid #dee2e6' }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '10px', borderRight: '1px solid #dee2e6' }}>
                  <small style={{ color: '#495057', fontWeight: 'bold' }}>HOLE</small><br/>
                  <span style={{ fontSize: '28px', fontWeight: '900' }}>{currentHole + 1}</span>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '10px', borderRight: '1px solid #dee2e6' }}>
                  <small style={{ color: '#495057', fontWeight: 'bold' }}>PAR</small><br/>
                  <span style={{ fontSize: '28px', fontWeight: '900' }}>{courseData[currentHole].par}</span>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '10px' }}>
                  <small style={{ color: '#495057', fontWeight: 'bold' }}>S.I.</small><br/>
                  <span style={{ fontSize: '28px', fontWeight: '900' }}>{courseData[currentHole].si}</span>
              </div>
          </div>

          {/* 3. MAIN SCORE AREA */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                {/* Minus */}
                <button onClick={() => { if(scores[currentHole] > 1){const n=[...scores]; n[currentHole]--; setScores(n);}}} style={{ width: '75px', height: '75px', borderRadius: '15px', backgroundColor: '#e63946', color: 'white', border: 'none', fontSize: '40px', fontWeight: '900' }}>-</button>
                
                {/* Number */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '110px', fontWeight: '900', color: '#063020', lineHeight: '1' }}>{scores[currentHole] === 0 ? "X" : scores[currentHole]}</div>
                    <small style={{ fontWeight: 'bold', color: '#888' }}>STROKES</small>
                </div>

                {/* Stacked Plus/Pick Up */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => { const n = [...scores]; n[currentHole] = 0; setScores(n); }} style={{ width: '75px', height: '40px', borderRadius: '10px', backgroundColor: '#495057', color: 'white', border: 'none', fontSize: '11px', fontWeight: 'bold' }}>PICK UP</button>
                    <button onClick={() => { const n = [...scores]; if(n[currentHole] === 0) n[currentHole] = courseData[currentHole].par; else n[currentHole]++; setScores(n); }} style={{ width: '75px', height: '75px', borderRadius: '15px', backgroundColor: '#2a9d8f', color: 'white', border: 'none', fontSize: '40px', fontWeight: '900' }}>+</button>
                </div>
             </div>
          </div>

          {/* 4. FOOTER POINTS & NAVIGATION */}
          <div style={{ borderTop: '2px solid #f1f1f1', padding: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
                    <small style={{ fontWeight: 'bold', color: '#063020' }}>POINTS</small><br/>
                    <span style={{ fontSize: '32px', fontWeight: '900' }}>{calcPoints(scores[currentHole], courseData[currentHole].par, courseData[currentHole].si)}</span>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
                    <small style={{ fontWeight: 'bold', color: '#063020' }}>TOTAL</small><br/>
                    <span style={{ fontSize: '32px', fontWeight: '900' }}>{totalPoints}</span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => currentHole > 0 && setCurrentHole(currentHole - 1)} style={{ flex: 1, padding: '15px', borderRadius: '12px', background: '#e9ecef', border: 'none', fontWeight: 'bold', color: '#495057' }}>PREV</button>
                <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole+1) : setShowSummary(true)} style={{ flex: 2, padding: '15px', borderRadius: '12px', background: '#063020', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '16px' }}>NEXT HOLE</button>
            </div>
          </div>

        </div>
      ) : (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'white', minHeight: '100vh', width: '100%' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#063020' }}>ROUND COMPLETE</h2>
          <div style={{ fontSize: '100px', fontWeight: '900', margin: '30px 0', color: '#C9A66B' }}>{totalPoints}</div>
          <button onClick={handleLogout} style={{ padding: '20px 40px', backgroundColor: '#063020', color: 'white', borderRadius: '12px', border: 'none', fontWeight: '800' }}>SUBMIT CARD</button>
        </div>
      )}
    </div>
  );
}