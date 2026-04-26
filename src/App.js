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

  // LOG IN SCREEN (Now Orange/Brown for visual change)
  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: '#EAD7BB', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
        <h1 style={{ color: '#603125', textAlign: 'center' }}>EG SCORING</h1>
        <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="000" style={{ padding: '20px', borderRadius: '10px', border: 'none', marginBottom: '10px' }} />
        <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: '#603125', color: 'white', borderRadius: '10px' }}>LOG IN</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#EAD7BB', minHeight: '100vh', padding: '15px', color: '#603125', fontFamily: 'sans-serif' }}>
      {!showSummary ? (
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          
          {/* HEADER: NAME & HCAP */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{player.name}</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>HCAP: {player.handicap}</span>
          </div>

          {/* STAT BOXES (No borders, just blocks) */}
          <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
            {[ 
              {label: 'HOLE', val: currentHole + 1}, 
              {label: 'PAR', val: courseData[currentHole].par}, 
              {label: 'S.I.', val: courseData[currentHole].si} 
            ].map(item => (
              <div key={item.label} style={{ flex: 1, backgroundColor: '#FFF2D8', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px' }}>{item.label}</div>
                <div style={{ fontSize: '32px', fontWeight: '900' }}>{item.val}</div>
              </div>
            ))}
          </div>

          {/* STROKE DISPLAY */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '100px', fontWeight: '900' }}>{scores[currentHole] === 0 ? "X" : scores[currentHole]}</div>
            <div>STROKES</div>
          </div>

          {/* THE THREE ACTION BUTTONS (Horizontal Row - CANNOT OVERLAP) */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button onClick={() => { if(scores[currentHole] > 1){const n=[...scores]; n[currentHole]--; setScores(n);}}} style={{ flex: 1, height: '80px', backgroundColor: '#B06161', color: 'white', border: 'none', borderRadius: '15px', fontSize: '40px' }}>-</button>
            <button onClick={() => { const n = [...scores]; if(n[currentHole] === 0) n[currentHole] = courseData[currentHole].par; else n[currentHole]++; setScores(n); }} style={{ flex: 1, height: '80px', backgroundColor: '#603125', color: 'white', border: 'none', borderRadius: '15px', fontSize: '40px' }}>+</button>
            <button onClick={() => { const n = [...scores]; n[currentHole] = 0; setScores(n); }} style={{ flex: 1, height: '80px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '15px', fontSize: '14px', fontWeight: 'bold' }}>PICK UP</button>
          </div>

          {/* POINTS ROW */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <div style={{ flex: 1, backgroundColor: '#FFF2D8', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                <small>PTS</small><br/><span style={{ fontSize: '30px', fontWeight: 'bold' }}>{calcPoints(scores[currentHole], courseData[currentHole].par, courseData[currentHole].si)}</span>
            </div>
            <div style={{ flex: 1, backgroundColor: '#FFF2D8', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                <small>TOTAL</small><br/><span style={{ fontSize: '30px', fontWeight: 'bold' }}>{totalPoints}</span>
            </div>
          </div>

          {/* NEXT/PREV NAVIGATION */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => currentHole > 0 && setCurrentHole(currentHole - 1)} style={{ flex: 1, padding: '20px', borderRadius: '10px', border: '1px solid #603125', background: 'none' }}>PREV</button>
            <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole+1) : setShowSummary(true)} style={{ flex: 2, padding: '20px', borderRadius: '10px', backgroundColor: '#603125', color: 'white', border: 'none', fontWeight: 'bold' }}>NEXT HOLE</button>
          </div>

        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>ROUND OVER</h2>
          <button onClick={handleLogout} style={{ padding: '20px', backgroundColor: '#603125', color: 'white', border: 'none', borderRadius: '10px' }}>RESTART</button>
        </div>
      )}
    </div>
  );
}