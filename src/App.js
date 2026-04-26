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
    if (s === 0) return 0; // Pick Up logic
    const pops = Math.floor(player.handicap / 18) + (player.handicap % 18 >= si ? 1 : 0);
    return Math.max(0, p - (s - pops) + 2);
  };

  const totalPoints = scores.reduce((acc, s, i) => acc + calcPoints(s, courseData[i].par, courseData[i].si), 0);

  const handlePickUp = () => {
    const newScores = [...scores];
    newScores[currentHole] = 0;
    setScores(newScores);
  };

  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: '#063020', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
        <h1 style={{ color: '#C9A66B', textAlign: 'center', fontWeight: '900' }}>EGS SCORING</h1>
        <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="3-DIGIT CODE" style={{ padding: '20px', fontSize: '24px', textAlign: 'center', borderRadius: '10px', marginBottom: '10px', border: 'none' }} />
        <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: '#C9A66B', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '18px' }}>LOG IN</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#063020', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      {!showSummary ? (
        <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', borderRadius: '4px', overflow: 'hidden' }}>
          {/* Header Area */}
          <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#063020', letterSpacing: '-1px' }}>{player.name.toUpperCase()}</h2>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', color: '#C9A66B' }}>HCAP</div>
              <div style={{ fontSize: '32px', fontWeight: '900', lineHeight: '0.8' }}>{player.handicap}</div>
            </div>
          </div>

          {/* Sub-Header Stats */}
          <div style={{ display: 'flex', borderTop: '4px solid #eee', borderBottom: '4px solid #eee', textAlign: 'center' }}>
            <div style={{ flex: 1, padding: '10px', borderRight: '1px solid #eee' }}>
              <small style={{ fontWeight: '900', color: '#888' }}>HOLE</small><br/>
              <span style={{ fontSize: '42px', fontWeight: '900' }}>{currentHole + 1}</span>
            </div>
            <div style={{ flex: 1, padding: '10px', borderRight: '1px solid #eee' }}>
              <small style={{ fontWeight: '900', color: '#888' }}>PAR</small><br/>
              <span style={{ fontSize: '42px', fontWeight: '900' }}>{courseData[currentHole].par}</span>
            </div>
            <div style={{ flex: 1, padding: '10px' }}>
              <small style={{ fontWeight: '900', color: '#888' }}>S.I.</small><br/>
              <span style={{ fontSize: '42px', fontWeight: '900' }}>{courseData[currentHole].si}</span>
            </div>
          </div>

          {/* Main Score Entry */}
          <div style={{ padding: '20px', textAlign: 'center', position: 'relative' }}>
            <small style={{ fontWeight: '900', color: '#888', letterSpacing: '2px' }}>STROKES</small>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
              <button onClick={() => { if(scores[currentHole] > 1){const n=[...scores]; n[currentHole]--; setScores(n);}}} style={{ width: '70px', height: '70px', borderRadius: '15px', backgroundColor: '#ff4444', border: 'none', color: 'white', fontSize: '50px', fontWeight: '900' }}>-</button>
              <span style={{ fontSize: '120px', fontWeight: '900', color: '#063020', minWidth: '100px' }}>{scores[currentHole] === 0 ? "X" : scores[currentHole]}</span>
              <div style={{ position: 'relative' }}>
                <button onClick={handlePickUp} style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#666', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '900', zIndex: 2 }}>PICK UP</button>
                <button onClick={() => { const n = [...scores]; if(n[currentHole] === 0) n[currentHole] = courseData[currentHole].par; else n[currentHole]++; setScores(n); }} style={{ width: '70px', height: '70px', borderRadius: '15px', backgroundColor: '#00c851', border: 'none', color: 'white', fontSize: '50px', fontWeight: '900' }}>+</button>
              </div>
            </div>
          </div>

          {/* Points Display */}
          <div style={{ display: 'flex', borderTop: '1px solid #eee', textAlign: 'center', backgroundColor: '#f9f9f9' }}>
            <div style={{ flex: 1, padding: '15px', borderRight: '1px solid #eee' }}>
              <div style={{ color: '#00c851', fontWeight: '900', fontSize: '14px' }}>POINTS</div>
              <div style={{ fontSize: '48px', fontWeight: '900' }}>{calcPoints(scores[currentHole], courseData[currentHole].par, courseData[currentHole].si)}</div>
            </div>
            <div style={{ flex: 1, padding: '15px' }}>
              <div style={{ color: '#00c851', fontWeight: '900', fontSize: '14px' }}>TOTAL</div>
              <div style={{ fontSize: '48px', fontWeight: '900' }}>{totalPoints}</div>
            </div>
          </div>
          
          <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole+1) : setShowSummary(true)} style={{ width: '90%', margin: '20px 5%', padding: '25px', borderRadius: '10px', backgroundColor: '#C9A66B', border: 'none', color: 'white', fontWeight: '900', fontSize: '24px' }}>NEXT HOLE</button>
        </div>
      ) : (
        <div style={{ padding: '20px', color: 'white', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ fontWeight: '900' }}>ROUND COMPLETE</h2>
          <div style={{ fontSize: '64px', fontWeight: '900', margin: '20px 0' }}>{totalPoints} <small style={{ fontSize: '20px' }}>PTS</small></div>
          <p style={{ fontWeight: '900', color: '#C9A66B' }}>SELECT MARKER (ATTESTER):</p>
          <select value={verifierName} onChange={e => setVerifierName(e.target.value)} style={{ width: '100%', padding: '20px', borderRadius: '10px', fontSize: '18px', marginBottom: '20px' }}>
            <option value="">-- Choose Player --</option>
            {allPlayers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          <button onClick={async () => {
            if(!verifierName) return alert("Select a marker.");
            await supabase.from('rounds').insert([{ player_name: player.name, total_points: totalPoints, verifier: verifierName, status: 'pending' }]);
            alert("Score submitted!"); handleLogout();
          }} style={{ width: '100%', padding: '25px', backgroundColor: '#00c851', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '20px' }}>SUBMIT SCORE</button>
        </div>
      )}
      <button onClick={handleLogout} style={{ marginTop: '30px', background: 'none', color: 'white', border: 'none', opacity: 0.4, fontWeight: '900' }}>LOGOUT / RESET</button>
    </div>
  );
}