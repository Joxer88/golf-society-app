import React, { useState, useEffect } from 'react';
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
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [verifierName, setVerifierName] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  // Load society data once logged in
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('egs_isLoggedIn', 'true');
      localStorage.setItem('egs_player', JSON.stringify(player));
      localStorage.setItem('egs_currentHole', currentHole.toString());
      localStorage.setItem('egs_scores', JSON.stringify(scores));
      loadSocietyData();
    }
  }, [isLoggedIn, player, currentHole, scores]);

  const loadSocietyData = async () => {
    // Get list of other players for the Attester dropdown
    const { data: users } = await supabase.from('users').select('name').neq('name', player.name);
    setAllPlayers(users || []);

    // Check if this player needs to verify someone else's score
    const { data: pending } = await supabase.from('rounds')
      .select('*')
      .eq('verifier', player.name)
      .eq('status', 'pending');
    setPendingApprovals(pending || []);
  };

  const handleLogin = async () => {
    const { data } = await supabase.from('users').select('*').eq('access_code', loginCode).single();
    if (data) {
      setPlayer({ name: data.name, handicap: data.handicap });
      setIsLoggedIn(true);
    } else {
      alert("Invalid Code.");
    }
  };

  const handleApprove = async (id) => {
    await supabase.from('rounds').update({ status: 'approved' }).eq('id', id);
    alert("Round Verified!");
    loadSocietyData();
  };

  const calcPoints = (s, p, si) => {
    const pops = Math.floor(player.handicap / 18) + (player.handicap % 18 >= si ? 1 : 0);
    return Math.max(0, p - (s - pops) + 2);
  };

  const handleSubmit = async () => {
    if (!verifierName) return alert("Please select a Marker from the list.");
    
    // Final points calculation
    const finalTotal = scores.reduce((a, s, i) => a + calcPoints(s, courseData[i].par, courseData[i].si), 0);

    const { error } = await supabase.from('rounds').insert([{ 
      player_name: player.name, 
      total_points: finalTotal, 
      verifier: verifierName, 
      status: 'pending' 
    }]);

    if (error) {
      alert("Error submitting score. You may have already submitted one.");
    } else {
      alert("Score sent to " + verifierName + " for approval.");
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: '#1A4D3A', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
        <h1 style={{ color: '#C9A66B', textAlign: 'center' }}>EGS SCORING</h1>
        <input type="text" placeholder="ENTER CODE" value={loginCode} onChange={e => setLoginCode(e.target.value)} style={{ padding: '20px', fontSize: '24px', textAlign: 'center', borderRadius: '10px', marginBottom: '10px' }} />
        <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: '#C9A66B', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>LOG IN</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#1A4D3A', minHeight: '100vh', color: 'white', padding: '20px' }}>
      <h2>Hello, {player.name}</h2>
      
      {/* Verification Notification */}
      {pendingApprovals.length > 0 && (
        <div style={{ backgroundColor: '#C9A66B', color: '#1A4D3A', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
          <p style={{ margin: 0 }}><b>Pending Approvals:</b></p>
          {pendingApprovals.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
              <span>{r.player_name}: {r.total_points}pts</span>
              <button onClick={() => handleApprove(r.id)} style={{ background: '#1A4D3A', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px' }}>VERIFY</button>
            </div>
          ))}
        </div>
      )}

      {!showSummary ? (
        <div>
          <h3>Hole {currentHole + 1} (Par {courseData[currentHole].par})</h3>
          <h1 style={{ fontSize: '80px', textAlign: 'center' }}>{scores[currentHole]}</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { const n = [...scores]; n[currentHole]++; setScores(n); }} style={{ flex: 1, padding: '30px', fontSize: '30px' }}>+</button>
            <button onClick={() => { const n = [...scores]; n[currentHole]--; setScores(n); }} style={{ flex: 1, padding: '30px', fontSize: '30px' }}>-</button>
          </div>
          <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole+1) : setShowSummary(true)} style={{ width: '100%', marginTop: '20px', padding: '20px', backgroundColor: '#C9A66B', color: 'white', border: 'none', borderRadius: '10px' }}>
            {currentHole < 17 ? 'NEXT HOLE' : 'FINISH'}
          </button>
        </div>
      ) : (
        <div>
          <h3>Round Complete</h3>
          <p>Select your Marker (Attester):</p>
          <select value={verifierName} onChange={e => setVerifierName(e.target.value)} style={{ width: '100%', padding: '15px', fontSize: '18px', borderRadius: '10px', marginBottom: '20px' }}>
            <option value="">-- Choose Player --</option>
            {allPlayers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          <button onClick={handleSubmit} style={{ width: '100%', padding: '20px', backgroundColor: '#22c55e', border: 'none', color: 'white', fontWeight: 'bold', borderRadius: '10px' }}>SUBMIT SCORE</button>
        </div>
      )}
      <button onClick={handleLogout} style={{ marginTop: '50px', width: '100%', background: 'none', color: '#666', border: 'none' }}>LOGOUT</button>
    </div>
  );
}