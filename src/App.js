import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const sbUrl = process.env.REACT_APP_SUPABASE_URL || '';
const sbKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(sbUrl, sbKey);

const compSettings = { courseName: "CO. LONGFORD GOLF CLUB", date: "2026-04-16", adminCode: "999" };
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
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [verifierName, setVerifierName] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);

  const handleLogout = useCallback(() => { 
    localStorage.clear(); 
    window.location.reload(); 
  }, []);

  const loadSocietyData = useCallback(async () => {
    const { data: users } = await supabase.from('users').select('name').neq('name', player.name);
    setAllPlayers(users || []);
    const { data: pending } = await supabase.from('rounds').select('*').eq('verifier', player.name).eq('status', 'pending');
    setPendingApprovals(pending || []);
  }, [player.name]);

  useEffect(() => {
    localStorage.setItem('egs_isLoggedIn', isLoggedIn);
    localStorage.setItem('egs_player', JSON.stringify(player));
    localStorage.setItem('egs_currentHole', currentHole);
    localStorage.setItem('egs_scores', JSON.stringify(scores));
    if (isLoggedIn) loadSocietyData();
  }, [isLoggedIn, player, currentHole, scores, loadSocietyData]);

  const handleLogin = async () => {
    if (loginCode === compSettings.adminCode) { setPlayer({ name: "ADMIN", handicap: 0 }); setIsLoggedIn(true); return; }
    const { data } = await supabase.from('users').select('*').eq('access_code', loginCode).single();
    if (data) { setPlayer({ name: data.name, handicap: data.handicap }); setIsLoggedIn(true); } 
    else { alert("Invalid Code."); }
  };

  const handleApprove = async (id) => {
    await supabase.from('rounds').update({ status: 'approved' }).eq('id', id);
    alert("Round Verified!");
    loadSocietyData();
  };

  const calcPoints = (s, p, si) => {
    if (s === 0) return 0;
    const pops = Math.floor(player.handicap / 18) + (player.handicap % 18 >= si ? 1 : 0);
    return Math.max(0, p - (s - pops) + 2);
  };

  const finalTotal = scores.reduce((a, s, i) => a + calcPoints(s, courseData[i].par, courseData[i].si), 0);

  const handleSubmit = async () => {
    if (!verifierName) return alert("Please select a Marker from the list.");
    const { data: existing } = await supabase.from('rounds').select('id').eq('player_name', player.name).eq('status', 'approved');
    if (existing?.length > 0) return alert("An approved score already exists for your name.");
    await supabase.from('rounds').insert([{ player_name: player.name, handicap: player.handicap, total_points: finalTotal, verifier: verifierName, status: 'pending', scores: scores }]);
    alert("Score sent to " + verifierName + " for approval.");
    handleLogout();
  };

  if (showLeaderboard) {
    return (
      <div style={{ backgroundColor: '#1A4D3A', minHeight: '100vh', color: 'white', padding: '20px' }}>
        <h2 style={{ textAlign: 'center', color: '#C9A66B' }}>LIVE LEADERBOARD</h2>
        {leaderboardData.map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #333' }}>
            <span>{i+1}. {r.player_name}</span><span>{r.total_points} pts</span>
          </div>
        ))}
        <button onClick={() => setShowLeaderboard(false)} style={{ width: '100%', padding: '15px', marginTop: '20px' }}>CLOSE</button>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: '#1A4D3A', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
        <h1 style={{ color: '#C9A66B', textAlign: 'center' }}>EGS SCORING</h1>
        <input type="text" placeholder="3-DIGIT CODE" value={loginCode} onChange={e => setLoginCode(e.target.value)} style={{ padding: '20px', fontSize: '24px', textAlign: 'center', borderRadius: '10px', marginBottom: '10px' }} />
        <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: '#C9A66B', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>LOG IN</button>
        <button onClick={async () => { 
          const { data } = await supabase.from('rounds').select('*').eq('status', 'approved').order('total_points', { ascending: false });
          setLeaderboardData(data || []); setShowLeaderboard(true);
        }} style={{ marginTop: '20px', background: 'none', border: '1px solid #C9A66B', color: '#C9A66B', padding: '10px' }}>VIEW LEADERBOARD</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#1A4D3A', minHeight: '100vh', color: 'white', padding: '20px' }}>
      <h2>Hello, {player.name}</h2>
      {pendingApprovals.length > 0 && (
        <div style={{ backgroundColor: '#C9A66B', color: '#1A4D3A', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
          <p><b>Verify for others:</b></p>
          {pendingApprovals.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
              <span>{r.player_name}: {r.total_points}pts</span>
              <button onClick={() => handleApprove(r.id)} style={{ background: '#1A4D3A', color: 'white', border: 'none', padding: '5px' }}>APPROVE</button>
            </div>
          ))}
        </div>
      )}
      {!showSummary ? (
        <div>
          <h3>Hole {currentHole + 1} (Par {courseData[currentHole].par})</h3>
          <h1 style={{ fontSize: '100px', textAlign: 'center' }}>{scores[currentHole]}</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { const n = [...scores]; n[currentHole]++; setScores(n); }} style={{ flex: 1, padding: '30px', fontSize: '30px' }}>+</button>
            <button onClick={() => { const n = [...scores]; n[currentHole]--; setScores(n); }} style={{ flex: 1, padding: '30px', fontSize: '30px' }}>-</button>
          </div>
          <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole+1) : setShowSummary(true)} style={{ width: '100%', marginTop: '20px', padding: '20px', backgroundColor: '#C9A66B' }}>{currentHole < 17 ? 'NEXT HOLE' : 'FINISH'}</button>
        </div>
      ) : (
        <div>
          <h3>Final Total: {finalTotal} pts</h3>
          <p>Select your Marker:</p>
          <select value={verifierName} onChange={e => setVerifierName(e.target.value)} style={{ width: '100%', padding: '15px', marginBottom: '10px', color: 'black' }}>
            <option value="">-- Choose Player --</option>
            {allPlayers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          <button onClick={handleSubmit} style={{ width: '100%', padding: '20px', backgroundColor: '#22c55e', border: 'none', color: 'white', fontWeight: 'bold' }}>SUBMIT SCORE</button>
          <button onClick={() => setShowSummary(false)} style={{ width: '100%', marginTop: '10px', background: 'none', color: 'white', border: 'none' }}>Back to Holes</button>
        </div>
      )}
      <button onClick={handleLogout} style={{ marginTop: '50px', opacity: 0.5, width: '100%' }}>LOGOUT / RESET</button>
    </div>
  );
}