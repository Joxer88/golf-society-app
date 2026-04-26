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
        <h1 style={{ color: 'white', textAlign: 'center', fontWeight: '900', fontSize: '45px' }}>LOGIN</h1>
        <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="000" style={{ padding: '20px', fontSize: '30px', textAlign: 'center', borderRadius: '15px', marginBottom: '15px', border: 'none' }} />
        <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: '#C9A66B', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '24px' }}>ENTER</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#ffffff', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      {!showSummary ? (
        <div style={{ width: '100%', maxWidth: '450px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* HEADER - TIGHTENED */}
          <div style={{ padding: '15px 10px', backgroundColor: '#063020', color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '900' }}>{player.name.toUpperCase()}</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#C9A66B' }}>HCAP: {player.handicap}</div>
          </div>

          {/* STATS BAR - REDUCED VERTICAL WHITE SPACE */}
          <div style={{ display: 'flex', backgroundColor: '#F1F3F5', borderBottom: '2px solid #DEE2E6' }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRight: '2px solid #DEE2E6' }}>
                  <div style={{ color: '#000', fontWeight: '900', fontSize: '16px' }}>HOLE</div>
                  <div style={{ fontSize: '40px', fontWeight: '900', lineHeight: '1' }}>{currentHole + 1}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRight: '2px solid #DEE2E6' }}>
                  <div style={{ color: '#000', fontWeight: '900', fontSize: '16px' }}>PAR</div>
                  <div style={{ fontSize: '40px', fontWeight: '900', lineHeight: '1' }}>{courseData[currentHole].par}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ color: '#000', fontWeight: '900', fontSize: '16px' }}>S.I.</div>
                  <div style={{ fontSize: '40px', fontWeight: '900', lineHeight: '1' }}>{courseData[currentHole].si}</div>
              </div>
          </div>

          {/* SCORE AREA - CENTERED BUT COMPACT */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button onClick={() => { if(scores[currentHole] > 1){const n=[...scores]; n[currentHole]--; setScores(n);}}} style={{ width: '85px', height: '85px', borderRadius: '20px', backgroundColor: '#e63946', color: 'white', border: 'none', fontSize: '60px', fontWeight: '900' }}>-</button>
                
                <div style={{ textAlign: 'center', minWidth: '100px' }}>
                    <div style={{ fontSize: '130px', fontWeight: '900', color: '#063020', lineHeight: '0.85' }}>{scores[currentHole] === 0 ? "X" : scores[currentHole]}</div>
                    <div style={{ fontWeight: '900', color: '#495057', fontSize: '16px' }}>STROKES</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => { const n = [...scores]; n[currentHole] = 0; setScores(n); }} style={{ width: '85px', height: '55px', borderRadius: '15px', backgroundColor: '#495057', color: 'white', border: 'none', fontSize: '32px', fontWeight: '900' }}>PU</button>
                    <button onClick={() => { const n = [...scores]; if(n[currentHole] === 0) n[currentHole] = courseData[currentHole].par; else n[currentHole]++; setScores(n); }} style={{ width: '85px', height: '85px', borderRadius: '20px', backgroundColor: '#2a9d8f', color: 'white', border: 'none', fontSize: '60px', fontWeight: '900' }}>+</button>
                </div>
             </div>
          </div>

          {/* FOOTER - TIGHTENED PADDING AND GAPS */}
          <div style={{ borderTop: '3px solid #F1F3F5', padding: '10px 15px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '8px', backgroundColor: '#F8F9FA', borderRadius: '12px', border: '1px solid #DEE2E6' }}>
                    <div style={{ fontWeight: '900', color: '#063020', fontSize: '16px' }}>POINTS</div>
                    <div style={{ fontSize: '45px', fontWeight: '900', lineHeight: '1' }}>{calcPoints(scores[currentHole], courseData[currentHole].par, courseData[currentHole].si)}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '8px', backgroundColor: '#F8F9FA', borderRadius: '12px', border: '1px solid #DEE2E6' }}>
                    <div style={{ fontWeight: '900', color: '#063020', fontSize: '16px' }}>TOTAL</div>
                    <div style={{ fontSize: '45px', fontWeight: '900', lineHeight: '1' }}>{totalPoints}</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', paddingBottom: '10px' }}>
                <button onClick={() => currentHole > 0 && setCurrentHole(currentHole - 1)} style={{ flex: 1, padding: '18px', borderRadius: '15px', background: '#E9ECEF', border: 'none', fontWeight: '900', color: '#495057', fontSize: '20px' }}>PREV</button>
                <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole+1) : setShowSummary(true)} style={{ flex: 2, padding: '18px', borderRadius: '15px', background: '#063020', color: 'white', border: 'none', fontWeight: '900', fontSize: '22px' }}>NEXT</button>
            </div>
          </div>

        </div>
      ) : (
        <div style={{ padding: '40px 20px', textAlign: 'center', height: '100vh' }}>
          <h2 style={{ fontSize: '45px', fontWeight: '900', color: '#063020' }}>FINISHED</h2>
          <div style={{ fontSize: '140px', fontWeight: '900', color: '#C9A66B' }}>{totalPoints}</div>
          <button onClick={handleLogout} style={{ padding: '25px 50px', backgroundColor: '#063020', color: 'white', borderRadius: '15px', border: 'none', fontWeight: '900', fontSize: '24px' }}>SUBMIT</button>
        </div>
      )}
    </div>
  );
}