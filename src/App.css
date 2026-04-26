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
      <div style={{ backgroundColor: '#F8FAFC', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
        <h1 style={{ color: '#0F172A', textAlign: 'center', fontWeight: '900', letterSpacing: '-1px' }}>EGS LOGIN</h1>
        <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="ENTER CODE" style={{ padding: '20px', fontSize: '20px', textAlign: 'center', borderRadius: '12px', marginBottom: '10px', border: '2px solid #E2E8F0' }} />
        <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: '#0F172A', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900' }}>ACCESS CARD</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F1F5F9', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'system-ui, sans-serif' }}>
      {!showSummary ? (
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', height: '100vh' }}>
          
          {/* TOP SECTION: PLAYER INFO */}
          <div style={{ padding: '20px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>{player.name}</span>
                <span style={{ backgroundColor: '#F1F5F9', padding: '5px 12px', borderRadius: '20px', fontWeight: '700', fontSize: '14px' }}>HCAP: {player.handicap}</span>
            </div>
          </div>

          {/* MIDDLE SECTION: HOLE DATA */}
          <div style={{ flex: 1, padding: '20px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '20px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <div style={{ display: 'flex', textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}><small style={{ color: '#64748B', fontWeight: '700' }}>HOLE</small><div style={{ fontSize: '40px', fontWeight: '900' }}>{currentHole + 1}</div></div>
                    <div style={{ flex: 1 }}><small style={{ color: '#64748B', fontWeight: '700' }}>PAR</small><div style={{ fontSize: '40px', fontWeight: '900' }}>{courseData[currentHole].par}</div></div>
                    <div style={{ flex: 1 }}><small style={{ color: '#64748B', fontWeight: '700' }}>S.I.</small><div style={{ fontSize: '40px', fontWeight: '900' }}>{courseData[currentHole].si}</div></div>
                </div>
                
                <div style={{ textAlign: 'center', padding: '40px 0', borderTop: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: '120px', fontWeight: '900', color: '#0F172A', lineHeight: '1' }}>{scores[currentHole] === 0 ? "X" : scores[currentHole]}</div>
                    <div style={{ color: '#64748B', fontWeight: '700', marginTop: '10px' }}>STROKES ON THIS HOLE</div>
                </div>
            </div>

            {/* LIVE POINTS TICKET */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <div style={{ flex: 1, backgroundColor: '#0F172A', color: 'white', padding: '15px', borderRadius: '16px', textAlign: 'center' }}>
                    <small style={{ opacity: 0.7 }}>HOLE POINTS</small>
                    <div style={{ fontSize: '24px', fontWeight: '800' }}>{calcPoints(scores[currentHole], courseData[currentHole].par, courseData[currentHole].si)}</div>
                </div>
                <div style={{ flex: 1, backgroundColor: '#0F172A', color: 'white', padding: '15px', borderRadius: '16px', textAlign: 'center' }}>
                    <small style={{ opacity: 0.7 }}>TOTAL SCORE</small>
                    <div style={{ fontSize: '24px', fontWeight: '800' }}>{totalPoints}</div>
                </div>
            </div>
          </div>

          {/* BOTTOM DOCK: CONTROLS (Always at the bottom) */}
          <div style={{ backgroundColor: 'white', padding: '20px', borderTop: '1px solid #E2E8F0', paddingBottom: '40px' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <button onClick={() => { if(scores[currentHole] > 1){const n=[...scores]; n[currentHole]--; setScores(n);}}} style={{ flex: 1, height: '80px', borderRadius: '16px', backgroundColor: '#F1F5F9', border: 'none', color: '#0F172A', fontSize: '40px', fontWeight: '800' }}>-</button>
                <button onClick={() => { const n = [...scores]; if(n[currentHole] === 0) n[currentHole] = courseData[currentHole].par; else n[currentHole]++; setScores(n); }} style={{ flex: 1, height: '80px', borderRadius: '16px', backgroundColor: '#0F172A', border: 'none', color: 'white', fontSize: '40px', fontWeight: '800' }}>+</button>
                <button onClick={() => { const n = [...scores]; n[currentHole] = 0; setScores(n); }} style={{ flex: 1, height: '80px', borderRadius: '16px', backgroundColor: '#EF4444', border: 'none', color: 'white', fontSize: '14px', fontWeight: '800' }}>PICK UP</button>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => currentHole > 0 && setCurrentHole(currentHole - 1)} style={{ flex: 1, padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', fontWeight: '700' }}>PREV</button>
                <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole+1) : setShowSummary(true)} style={{ flex: 2, padding: '18px', borderRadius: '12px', background: '#0F172A', color: 'white', fontWeight: '700' }}>NEXT HOLE</button>
            </div>
          </div>

        </div>
      ) : (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900' }}>FINISHED</h2>
          <div style={{ fontSize: '80px', fontWeight: '900', margin: '20px 0' }}>{totalPoints}</div>
          <button onClick={handleLogout} style={{ padding: '20px 40px', backgroundColor: '#0F172A', color: 'white', borderRadius: '12px', border: 'none', fontWeight: '800' }}>SUBMIT CARD</button>
        </div>
      )}
    </div>
  );
}