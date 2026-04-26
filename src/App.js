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

  // Styling Variables - Play with these!
  const theme = {
    darkGreen: '#063020',
    gold: '#C9A66B',
    lightGrey: '#f4f4f4',
    white: '#ffffff',
    red: '#e63946',
    green: '#2a9d8f',
    charcoal: '#333333'
  };

  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: theme.darkGreen, height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
        <h1 style={{ color: theme.gold, textAlign: 'center', fontWeight: '900', letterSpacing: '2px' }}>EGS SCORING</h1>
        <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="ENTER CODE" style={{ padding: '20px', fontSize: '24px', textAlign: 'center', borderRadius: '12px', marginBottom: '10px', border: `3px solid ${theme.gold}` }} />
        <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: theme.gold, color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '18px' }}>LOG IN</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: theme.darkGreen, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px' }}>
      {!showSummary ? (
        <div style={{ width: '100%', maxWidth: '420px', backgroundColor: theme.white, borderRadius: '15px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
          
          {/* Top Bar: Name & Hcap */}
          <div style={{ padding: '25px 20px', background: theme.white, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: theme.darkGreen, fontFamily: 'serif' }}>{player.name.toUpperCase()}</h2>
            <div style={{ textAlign: 'center', backgroundColor: theme.darkGreen, color: theme.white, padding: '5px 15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: theme.gold }}>HCAP</div>
              <div style={{ fontSize: '28px', fontWeight: '900' }}>{player.handicap}</div>
            </div>
          </div>

          {/* Stats Bar: +30% size increase */}
          <div style={{ display: 'flex', backgroundColor: theme.lightGrey, borderTop: `1px solid #ddd`, borderBottom: `1px solid #ddd` }}>
            {[ {label: 'HOLE', val: currentHole + 1}, {label: 'PAR', val: courseData[currentHole].par}, {label: 'S.I.', val: courseData[currentHole].si} ].map((stat, i) => (
              <div key={i} style={{ flex: 1, padding: '15px 0', textAlign: 'center', borderRight: i < 2 ? '1px solid #ddd' : 'none' }}>
                <div style={{ fontSize: '12px', fontWeight: '900', color: '#777' }}>{stat.label}</div>
                <div style={{ fontSize: '48px', fontWeight: '900', color: theme.charcoal }}>{stat.val}</div>
              </div>
            ))}
          </div>

          {/* Scoring Area */}
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '900', color: theme.gold, letterSpacing: '3px', marginBottom: '10px' }}>STROKES</div>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              <button onClick={() => { if(scores[currentHole] > 1){const n=[...scores]; n[currentHole]--; setScores(n);}}} style={{ width: '85px', height: '85px', borderRadius: '50%', backgroundColor: theme.red, color: 'white', border: 'none', fontSize: '40px', fontWeight: '900', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>-</button>
              
              <span style={{ fontSize: '130px', fontWeight: '900', color: theme.darkGreen, lineHeight: '1' }}>{scores[currentHole] === 0 ? "X" : scores[currentHole]}</span>
              
              <div style={{ position: 'relative' }}>
                {/* Pick Up Button - Oversized Square */}
                <button onClick={() => { const n = [...scores]; n[currentHole] = 0; setScores(n); }} style={{ position: 'absolute', top: '-100px', left: '0', width: '85px', height: '85px', borderRadius: '12px', backgroundColor: theme.charcoal, color: theme.white, border: 'none', fontWeight: '900', fontSize: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>PICK<br/>UP</button>
                <button onClick={() => { const n = [...scores]; if(n[currentHole] === 0) n[currentHole] = courseData[currentHole].par; else n[currentHole]++; setScores(n); }} style={{ width: '85px', height: '85px', borderRadius: '50%', backgroundColor: theme.green, color: 'white', border: 'none', fontSize: '40px', fontWeight: '900', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>+</button>
              </div>
            </div>
          </div>

          {/* Points Footer: +30% size increase */}
          <div style={{ display: 'flex', backgroundColor: theme.darkGreen, color: 'white' }}>
            <div style={{ flex: 1, padding: '20px', textAlign: 'center', borderRight: `1px solid ${theme.gold}` }}>
              <div style={{ fontSize: '12px', fontWeight: '900', color: theme.gold }}>POINTS</div>
              <div style={{ fontSize: '58px', fontWeight: '900' }}>{calcPoints(scores[currentHole], courseData[currentHole].par, courseData[currentHole].si)}</div>
            </div>
            <div style={{ flex: 1, padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: '900', color: theme.gold }}>TOTAL</div>
              <div style={{ fontSize: '58px', fontWeight: '900' }}>{totalPoints}</div>
            </div>
          </div>
          
          {/* Side-by-Side Nav */}
          <div style={{ padding: '20px', display: 'flex', gap: '15px', backgroundColor: theme.white }}>
            <button onClick={() => currentHole > 0 && setCurrentHole(currentHole - 1)} disabled={currentHole === 0} style={{ flex: 1, padding: '20px', borderRadius: '12px', backgroundColor: theme.lightGrey, color: theme.charcoal, border: '1px solid #ddd', fontWeight: '900', fontSize: '16px', opacity: currentHole === 0 ? 0.5 : 1 }}>PREV</button>
            <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole+1) : setShowSummary(true)} style={{ flex: 2, padding: '20px', borderRadius: '12px', backgroundColor: theme.gold, color: 'white', border: 'none', fontWeight: '900', fontSize: '20px', boxShadow: '0 4px 15px rgba(201, 166, 107, 0.4)' }}>{currentHole < 17 ? 'NEXT HOLE' : 'VIEW SUMMARY'}</button>
          </div>
        </div>
      ) : (
        /* Summary Screen - High Contrast */
        <div style={{ padding: '30px', color: 'white', textAlign: 'center', width: '100%', maxWidth: '420px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '20px', backdropFilter: 'blur(10px)' }}>
          <h2 style={{ fontWeight: '900', letterSpacing: '1px' }}>ROUND COMPLETE</h2>
          <div style={{ fontSize: '80px', fontWeight: '900', color: theme.gold, margin: '10px 0' }}>{totalPoints}</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '30px' }}>TOTAL STABLEFORD POINTS</div>
          
          <p style={{ fontWeight: '900', color: theme.gold }}>SELECT ATTESTER (MARKER):</p>
          <select value={verifierName} onChange={e => setVerifierName(e.target.value)} style={{ width: '100%', padding: '20px', borderRadius: '12px', fontSize: '18px', marginBottom: '20px', border: 'none' }}>
            <option value="">-- Select Player --</option>
            {allPlayers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          
          <button onClick={async () => {
            if(!verifierName) return alert("Please select a marker to attest your score.");
            await supabase.from('rounds').insert([{ player_name: player.name, total_points: totalPoints, verifier: verifierName, status: 'pending' }]);
            alert("Score submitted for verification!"); handleLogout();
          }} style={{ width: '100%', padding: '25px', backgroundColor: theme.green, color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '22px' }}>SUBMIT CARD</button>
          <button onClick={() => setShowSummary(false)} style={{ marginTop: '20px', background: 'none', color: 'white', border: 'none', textDecoration: 'underline', opacity: 0.7 }}>Edit Hole Scores</button>
        </div>
      )}
      <button onClick={handleLogout} style={{ marginTop: '40px', background: 'none', color: theme.gold, border: `1px solid ${theme.gold}`, padding: '10px 20px', borderRadius: '20px', fontSize: '12px', fontWeight: '900' }}>LOGOUT / SYSTEM RESET</button>
    </div>
  );
}