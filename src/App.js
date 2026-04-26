import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const sbUrl = process.env.REACT_APP_SUPABASE_URL || '';
const sbKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(sbUrl, sbKey);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('egs_isLoggedIn') === 'true');
  const [player, setPlayer] = useState(() => JSON.parse(localStorage.getItem('egs_player')) || { name: "", handicap: 0 });
  const [isVerified, setIsVerified] = useState(false);
  const [currentHole, setCurrentHole] = useState(0);
  const [scores, setScores] = useState(Array(18).fill(4));
  
  const [loginCode, setLoginCode] = useState("");
  const [allPlayers, setAllPlayers] = useState([]); // For the Attester Dropdown
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [verifierName, setVerifierName] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // 1. Fetch Players and Pending Approvals on Login
  useEffect(() => {
    if (isLoggedIn) {
      loadSocietyData();
    }
  }, [isLoggedIn]);

  const loadSocietyData = async () => {
    // Get all players for the attester list
    const { data: users } = await supabase.from('users').select('name').neq('name', player.name);
    setAllPlayers(users || []);

    // Check if anyone has named THIS player as their marker
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

  const handleApprove = async (roundId) => {
    await supabase.from('rounds').update({ status: 'approved' }).eq('id', roundId);
    alert("Round Verified!");
    loadSocietyData();
  };

  const handleSubmit = async () => {
    if (!verifierName) return alert("Please select an Attester (Marker)");

    // Check for existing approved score
    const { data: existing } = await supabase.from('rounds')
        .select('id')
        .eq('player_name', player.name)
        .eq('status', 'approved');

    if (existing?.length > 0) {
        alert("You have already submitted an approved score for this event.");
        return;
    }

    const finalTotal = 36; // Placeholder for your calc logic
    await supabase.from('rounds').insert([{ 
      player_name: player.name, 
      handicap: player.handicap, 
      total_points: finalTotal, 
      verifier: verifierName, 
      status: 'pending' 
    }]);

    alert("Score submitted! It will appear on the leaderboard once " + verifierName + " approves it.");
    handleLogout();
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  // --- UI RENDER LOGIC ---

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#1A4D3A', color: 'white', minHeight: '100vh' }}>
        <h2>EGAN'S GOLF SOCIETY</h2>
        <input type="text" placeholder="CODE" value={loginCode} onChange={e=>setLoginCode(e.target.value)} style={{padding:'15px', fontSize:'20px', textAlign:'center'}} />
        <button onClick={handleLogin} style={{display:'block', width:'100%', marginTop:'10px', padding:'15px', backgroundColor:'#C9A66B', border:'none', fontWeight:'bold'}}>LOG IN</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#1A4D3A', color: 'white', minHeight: '100vh' }}>
      <h1>Hello, {player.name}</h1>

      {/* NOTIFICATION SECTION */}
      {pendingApprovals.length > 0 && (
        <div style={{ backgroundColor: '#C9A66B', padding: '15px', borderRadius: '10px', marginBottom: '20px', color: '#1A4D3A' }}>
          <h3 style={{margin:0}}>Verify Scores:</h3>
          {pendingApprovals.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '10px' }}>
              <span>{r.player_name}: <b>{r.total_points} pts</b></span>
              <button onClick={() => handleApprove(r.id)} style={{ backgroundColor: '#1A4D3A', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px' }}>APPROVE</button>
            </div>
          ))}
        </div>
      )}

      {/* ATTESTER DROPDOWN (In the Summary Screen) */}
      <div style={{ marginTop: '20px' }}>
        <p>Select Marker (Attester):</p>
        <select 
          value={verifierName} 
          onChange={(e) => setVerifierName(e.target.value)}
          style={{ width: '100%', padding: '15px', fontSize: '18px', borderRadius: '10px' }}
        >
          <option value="">-- Select Player --</option>
          {allPlayers.map(p => (
            <option key={p.name} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>

      <button onClick={handleSubmit} style={{ width: '100%', marginTop: '20px', padding: '20px', backgroundColor: '#22c55e', border: 'none', fontWeight: 'bold', borderRadius: '10px' }}>SUBMIT TO MARKER</button>
      
      <button onClick={handleLogout} style={{ marginTop: '40px', opacity: 0.5 }}>LOGOUT</button>
    </div>
  );
}