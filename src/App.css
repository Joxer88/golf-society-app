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

  // Theme Definition: High-Tech Stealth
  const theme = {
    bg: '#0F172A',         // Slate blue-black
    card: '#1E293B',       // Lighter slate
    accent: '#38BDF8',     // Electric blue
    success: '#4ADE80',    // Neon green
    danger: '#F87171',     // Soft red
    text: '#F8FAFC'        // Off-white
  };

  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: theme.bg, height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
        <h1 style={{ color: theme.accent, textAlign: 'center', fontWeight: '900', letterSpacing: '4px' }}>STEALTH SCORING</h1>
        <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="000" style={{ padding: '20px', fontSize: '24px', textAlign: 'center', borderRadius: '8px', marginBottom: '10px', background: theme.card, color: 'white', border: `1px solid ${theme.accent}` }} />
        <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: theme.accent, color: theme.bg, border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '18px' }}>START SESSION</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px', color: theme.text, fontFamily: 'sans-serif' }}>
      {!showSummary ? (
        <div style={{ width: '100%', maxWidth: '400px', backgroundColor: theme.card, borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          
          {/* Header */}
          <div style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: theme.accent, fontWeight: 'bold' }}>PLAYER</div>
              <div style={{ fontSize: '28px', fontWeight: '900' }}>{player.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: theme.accent, fontWeight: 'bold' }}>HCAP</div>
              <div style={{ fontSize: '28px', fontWeight: '900' }}>{player.handicap}</div>
            </div>
          </div>

          {/* Stats Grid - Large Impact Numbers */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '15px 0' }}>
            {[ {l: 'HOLE', v: currentHole + 1}, {l: 'PAR', v: courseData[currentHole].par}, {l: 'S.I.', v: courseData[currentHole].si} ].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>{s.l}</div>
                <div style={{ fontSize: '38px', fontWeight: '900', color: theme.accent }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Scoring Controls */}
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
              <button onClick={() => { if(scores[currentHole] > 1){const n=[...scores]; n[currentHole]--; setScores(n);}}} style={{ width: '70px', height: '70px', borderRadius: '20px', backgroundColor: 'rgba(248, 113, 113, 0.2)', color: theme.danger, border: `1px solid ${theme.danger}`, fontSize: '40px', fontWeight: 'bold' }}>-</button>
              
              <div style={{ minWidth: '110px' }}>
                <div style={{ fontSize: '100px', fontWeight: '900', lineHeight: '1' }}>{scores[currentHole] === 0 ? "X" : scores[currentHole]}</div>
              </div>
              
              <div style={{ position: 'relative' }}>
                <button onClick={() => { const n = [...scores]; n[currentHole] = 0; setScores(n); }} style={{ position: 'absolute', top: '-85px', width: '70px', height: '70px', borderRadius: '20px', backgroundColor: '#475569', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '14px' }}>PICK<br/>UP</button>
                <button onClick={() => { const n = [...scores]; if(n[currentHole] === 0) n[currentHole] = courseData[currentHole].par; else n[currentHole]++; setScores(n); }} style={{ width: '70px', height: '70px', borderRadius: '20px', backgroundColor: 'rgba(74, 222, 128, 0.2)', color: theme.success, border: `1px solid ${theme.success}`, fontSize: '40px', fontWeight: 'bold' }}>+</button>
              </div>
            </div>
          </div>

          {/* Dynamic Points Footer */}
          <div style={{ display: 'flex', padding: '20px', gap: '20px' }}>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>HOLE PTS</div>
              <div style={{ fontSize: '44px', fontWeight: '900', color: theme.success }}>{calcPoints(scores[currentHole], courseData[currentHole].par, courseData[currentHole].si)}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>TOTAL</div>
              <div style={{ fontSize: '44px', fontWeight: '900', color: theme.accent }}>{totalPoints}</div>
            </div>
          </div>
          
          {/* Navigation */}
          <div style={{ padding: '20px', display: 'flex', gap: '10px' }}>
            <button onClick={() => currentHole > 0 && setCurrentHole(currentHole - 1)} disabled={currentHole === 0} style={{ flex: 1, padding: '18px', borderRadius: '12px', backgroundColor: 'transparent', color: '#94A3B8', border: '1px solid #475569', fontWeight: 'bold' }}>PREV</button>
            <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole+1) : setShowSummary(true)} style={{ flex: 2, padding: '18px', borderRadius: '12px', backgroundColor: theme.accent, color: theme.bg, border: 'none', fontWeight: '900', fontSize: '18px' }}>
              {currentHole < 17 ? 'NEXT HOLE' : 'FINISH'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '30px', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ color: theme.accent }}>ROUND COMPLETE</h2>
          <div style={{ fontSize: '100px', fontWeight: '900', margin: '20px 0' }}>{totalPoints}</div>
          <p style={{ color: '#94A3B8' }}>STABLEFORD POINTS</p>
          
          <div style={{ marginTop: '40px' }}>
            <select value={verifierName} onChange={e => setVerifierName(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '8px', background: theme.card, color: 'white', border: `1px solid ${theme.accent}`, marginBottom: '20px' }}>
              <option value="">SELECT MARKER</option>
              {allPlayers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
            <button onClick={async () => {
              if(!verifierName) return alert("Select a marker.");
              await supabase.from('rounds').insert([{ player_name: player.name, total_points: totalPoints, verifier: verifierName, status: 'pending' }]);
              alert("Score submitted!"); handleLogout();
            }} style={{ width: '100%', padding: '20px', backgroundColor: theme.success, color: theme.bg, border: 'none', borderRadius: '8px', fontWeight: '900' }}>SUBMIT CARD</button>
          </div>
        </div>
      )}
      <button onClick={handleLogout} style={{ marginTop: 'auto', padding: '20px', color: '#475569', background: 'none', border: 'none', fontSize: '10px' }}>RESET SESSION</button>
    </div>
  );
}