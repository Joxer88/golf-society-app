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
    const pops = Math.floor(player.handicap / 18) + (player.handicap % 18 >= si ? 1 : 0);
    return Math.max(0, p - (s - pops) + 2);
  };

  const totalPoints = scores.reduce((acc, s, i) => acc + calcPoints(s, courseData[i].par, courseData[i].si), 0);

  const handleSubmit = async () => {
    if (!verifierName) return alert("Please select a Marker.");
    await supabase.from('rounds').insert([{ player_name: player.name, total_points: totalPoints, verifier: verifierName, status: 'pending' }]);
    alert("Score submitted!");
    handleLogout();
  };

  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: '#1A4D3A', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
        <h1 style={{ color: '#C9A66B', textAlign: 'center' }}>EGS SCORING</h1>
        <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="3-DIGIT CODE" style={{ padding: '20px', fontSize: '24px', textAlign: 'center', borderRadius: '10px', marginBottom: '10px' }} />
        <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: '#C9A66B', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>LOG IN</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#063020', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px' }}>
      {!showSummary ? (
        <div style={{ width: '100%', maxWidth: '450px', backgroundColor: '#f5f5f5', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900' }}>{player.name}</h2>
            <div style={{ textAlign: 'right' }}><small>HCAP</small><br/><b style={{ fontSize: '24px' }}>{player.handicap}</b></div>
          </div>

          <div style={{ display: 'flex', background: '#eee', textAlign: 'center', fontWeight: '900' }}>
            <div style={{ flex: 1, padding: '10px' }}>HOLE<br/><span style={{ fontSize: '32px' }}>{currentHole + 1}</span></div>
            <div style={{ flex: 1, padding: '10px' }}>PAR<br/><span style={{ fontSize: '32px' }}>{courseData[currentHole].par}</span></div>
            <div style={{ flex: 1, padding: '10px' }}>S.I.<br/><span style={{ fontSize: '32px' }}>{courseData[currentHole].si}</span></div>
          </div>

          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <small style={{ fontWeight: 'bold', color: '#999' }}>STROKES</small>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', marginTop: '10px' }}>
              <button onClick={() => { const n = [...scores]; n[currentHole]--; setScores(n); }} style={{ width: '80px', height: '80px', borderRadius: '20px', backgroundColor: '#ff4444', border: 'none', color: 'white', fontSize: '40px' }}>-</button>
              <span style={{ fontSize: '110px', fontWeight: '900', color: '#063020' }}>{scores[currentHole]}</span>
              <button onClick={() => { const n = [...scores]; n[currentHole]++; setScores(n); }} style={{ width: '80px', height: '80px', borderRadius: '20px', backgroundColor: '#00c851', border: 'none', color: 'white', fontSize: '40px' }}>+</button>
            </div>
          </div>

          <div style={{ display: 'flex', borderTop: '1px solid #ddd', textAlign: 'center' }}>
            <div style={{ flex: 1, padding: '15px' }}><b style={{ color: '#00c851' }}>POINTS</b><br/><span style={{ fontSize: '36px', fontWeight: '900' }}>{calcPoints(scores[currentHole], courseData[currentHole].par, courseData[currentHole].si)}</span></div>
            <div style={{ flex: 1, padding: '15px' }}><b style={{ color: '#00c851' }}>TOTAL</b><br/><span style={{ fontSize: '36px', fontWeight: '900' }}>{totalPoints}</span></div>
          </div>
          
          <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole+1) : setShowSummary(true)} style={{ width: '90%', margin: '20px 5%', padding: '25px', borderRadius: '15px', backgroundColor: '#C9A66B', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '20px' }}>NEXT HOLE</button>
        </div>
      ) : (
        <div style={{ padding: '20px', color: 'white', textAlign: 'center' }}>
          <h3>Round Complete: {totalPoints} pts</h3>
          <select value={verifierName} onChange={e => setVerifierName(e.target.value)} style={{ width: '100%', padding: '20px', borderRadius: '10px', margin: '20px 0' }}>
            <option value="">-- Choose Marker --</option>
            {allPlayers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          <button onClick={handleSubmit} style={{ width: '100%', padding: '20px', backgroundColor: '#00c851', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>SUBMIT SCORE</button>
        </div>
      )}
      <button onClick={handleLogout} style={{ marginTop: 'auto', background: 'none', color: 'white', border: 'none', opacity: 0.4 }}>LOGOUT / RESET</button>
    </div>
  );
}