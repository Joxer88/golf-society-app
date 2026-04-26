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
      <div style={{ backgroundColor: '#063020', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px' }}>
        <h1 style={{ color: 'white', textAlign: 'center', fontWeight: '900', fontSize: '40px' }}>EGS LOGIN</h1>
        <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="ENTER CODE" style={{ padding: '25px', fontSize: '24px', textAlign: 'center', borderRadius: '15px', marginBottom: '15px', border: 'none' }} />
        <button onClick={handleLogin} style={{ padding: '25px', backgroundColor: '#C9A66B', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '20px' }}>LOG IN</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fdfdfd', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'sans-serif' }}>
      {!showSummary ? (
        <div style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'white' }}>
          
          {/* 1. DARK GREEN HEADER - LARGE TEXT */}
          <div style={{ padding: '25px 20px', backgroundColor: '#063020', color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '1px' }}>{player.name.toUpperCase()}</div>
            <div style={{ marginTop: '5px', fontSize: '18px', fontWeight: '700', color: '#C9A66B' }}>HANDICAP: {player.handicap}</div>
          </div>

          {/* 2. SHADED STATS BAR - INCREASED FONT */}
          <div style={{ display: 'flex', backgroundColor: '#F1F3F5', borderBottom: '2px solid #DEE2E6' }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '15px', borderRight: '1px solid #DEE2E6' }}>
                  <small style={{ color: '#000', fontWeight: '800', fontSize: '14px' }}>HOLE</small><br/>
                  <span style={{ fontSize: '38px', fontWeight: '900' }}>{currentHole + 1}</span>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '15px', borderRight: '1px solid #DEE2E6' }}>
                  <small style={{ color: '#000', fontWeight: '800', fontSize: '14px' }}>PAR</small><br/>
                  <span style={{ fontSize: '38px', fontWeight: '900' }}>{courseData[currentHole].par}</span>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '15px' }}>
                  <small style={{ color: '#000', fontWeight: '800', fontSize: '14px' }}>S.I.</small><br/>
                  <span style={{ fontSize: '38px', fontWeight: '900' }}>{courseData[currentHole].si}</span>
              </div>
          </div>

          {/* 3. MAIN SCORE AREA - GIANT NUMBER */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '30px 10px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* Minus */}
                <button onClick={() => { if(scores[currentHole] > 1){const n=[...scores]; n[currentHole]--; setScores(n);}}} style={{ width: '85px', height: '85px', borderRadius: '20px', backgroundColor: '#e63946', color: 'white', border: 'none', fontSize: '50px', fontWeight: '900' }}>-</button>
                
                {/* Huge Number */}
                <div style={{ textAlign: 'center', minWidth: '110px' }}>
                    <div style={{ fontSize: '140px', fontWeight: '900', color: '#063020', lineHeight: '0.9' }}>{scores[currentHole] === 0 ? "X" : scores[currentHole]}</div>
                    <div style={{ fontWeight: '900', color: '#495057', marginTop: '5px', fontSize: '14px' }}>STROKES</div>
                </div>

                {/* Vertical Stack: Pick Up & Plus */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <button onClick={() => { const n = [...scores]; n[currentHole] = 0; setScores(n); }} style={{ width: '85px', height: '50px', borderRadius: '12px', backgroundColor: '#495057', color: 'white', border: 'none', fontSize: '14px', fontWeight: '900' }}>PICK UP</button>
                    <button onClick={() => { const n = [...scores]; if(n[currentHole] === 0) n[currentHole] = courseData[currentHole].par; else n[currentHole]++; setScores(n); }} style={{ width: '85px', height: '85px', borderRadius: '20px', backgroundColor: '#2a9d8f', color: 'white', border: 'none', fontSize: '50px', fontWeight: '900' }}>+</button>
                </div>
             </div>
          </div>

          {/* 4. FOOTER POINTS & NAVIGATION - VERY LARGE */}
          <div style={{ borderTop: '4px solid #F1F3F5', padding: '20px', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '15px', backgroundColor: '#F8F9FA', borderRadius: '15px', border: '1px solid #DEE2E6' }}>
                    <small style={{ fontWeight: '900', color: '#063020', fontSize: '14px' }}>HOLE POINTS</small><br/>
                    <span style={{ fontSize: '42px', fontWeight: '900' }}>{calcPoints(scores[currentHole], courseData[currentHole].par, courseData[currentHole].si)}</span>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '15px', backgroundColor: '#F8F9FA', borderRadius: '15px', border: '1px solid #DEE2E6' }}>
                    <small style={{ fontWeight: '900', color: '#063020', fontSize: '14px' }}>ROUND TOTAL</small><br/>
                    <span style={{ fontSize: '42px', fontWeight: '900' }}>{totalPoints}</span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', paddingBottom: '20px' }}>
                <button onClick={() => currentHole > 0 && setCurrentHole(currentHole - 1)} style={{ flex: 1, padding: '20px', borderRadius: '15px', background: '#E9ECEF', border: 'none', fontWeight: '900', color: '#495057', fontSize: '18px' }}>PREV</button>
                <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole+1) : setShowSummary(true)} style={{ flex: 2, padding: '20px', borderRadius: '15px', background: '#063020', color: 'white', border: 'none', fontWeight: '900', fontSize: '20px' }}>NEXT HOLE</button>
            </div>
          </div>

        </div>
      ) : (
        <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'white', minHeight: '100vh', width: '100%' }}>
          <h2 style={{ fontSize: '40px', fontWeight: '900', color: '#063020' }}>ROUND COMPLETE</h2>
          <div style={{ fontSize: '120px', fontWeight: '900', margin: '40px 0', color: '#C9A66B' }}>{totalPoints}</div>
          <button onClick={handleLogout} style={{ padding: '25px 50px', backgroundColor: '#063020', color: 'white', borderRadius: '15px', border: 'none', fontWeight: '900', fontSize: '22px' }}>SUBMIT CARD</button>
        </div>
      )}
    </div>
  );
}