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
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('egs_user')) || null);
  const [activeEntry, setActiveEntry] = useState(null); 
  const [currentHole, setCurrentHole] = useState(0);
  const [scores, setScores] = useState(courseData.map(h => h.par));
  const [loginCode, setLoginCode] = useState("");
  const [allPlayers, setAllPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [verifierName, setVerifierName] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [adminMode, setAdminMode] = useState('menu'); 

  const handleLogout = useCallback(() => { 
    localStorage.clear(); 
    window.location.reload(); 
  }, []);

  const loadData = useCallback(async () => {
    try {
      const { data: u } = await supabase.from('users').select('*').order('name');
      const { data: r } = await supabase.from('rounds').select('*').order('total_points', { ascending: false });
      setAllPlayers(u || []);
      setRounds(r || []);
    } catch (err) {
      console.error("Data Load Error:", err);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn, loadData]);

  const handleLogin = async () => {
    const { data, error } = await supabase.from('users').select('*').eq('access_code', loginCode).single();
    if (data) {
      const userData = { ...data, isAdmin: data.show_leaderboard === true };
      setUser(userData);
      localStorage.setItem('egs_user', JSON.stringify(userData));
      localStorage.setItem('egs_isLoggedIn', 'true');
      setIsLoggedIn(true);
      if (!userData.isAdmin) setActiveEntry(userData);
    } else { 
      alert("Invalid Code. " + (error ? error.message : "")); 
    }
  };

  const updateDeduction = async (id, val) => {
    await supabase.from('users').update({ deduction: parseInt(val) || 0 }).eq('id', id);
    loadData();
  };

  const calcPoints = (s, p, si, hcap) => {
    if (s === 0) return 0;
    const pops = Math.floor(hcap / 18) + (hcap % 18 >= si ? 1 : 0);
    return Math.max(0, p - (s - pops) + 2);
  };

  const getTotals = () => {
    if (!activeEntry) return 0;
    const pts = scores.reduce((acc, s, i) => acc + calcPoints(s, courseData[i].par, courseData[i].si, activeEntry.handicap), 0);
    return pts - (activeEntry.deduction || 0);
  };

  const submitCard = async () => {
    if (!verifierName && !user.isAdmin) return alert("Select Attester");
    const { error } = await supabase.from('rounds').insert([{
      player_name: activeEntry.name,
      handicap: activeEntry.handicap,
      total_points: getTotals(),
      verifier: user.isAdmin ? "ADMIN_ENTRY" : verifierName,
      scores: scores,
      created_at: new Date().toISOString()
    }]);
    if (!error) {
      alert("Submitted Successfully");
      user.isAdmin ? setAdminMode('menu') : handleLogout();
      setShowSummary(false);
    } else { alert(error.message); }
  };

  // --- LOGIN SCREEN ---
  if (!isLoggedIn) return (
    <div style={{ backgroundColor: '#063020', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px' }}>
      <h1 style={{ color: 'white', textAlign: 'center', fontWeight: '900' }}>LOGIN</h1>
      <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="000" style={{ padding: '20px', fontSize: '24px', textAlign: 'center', borderRadius: '15px', border: 'none', marginBottom: '10px' }} />
      <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: '#C9A66B', color: 'white', borderRadius: '15px', fontWeight: '900', border: 'none' }}>ENTER</button>
    </div>
  );

  // --- ADMIN VIEW ---
  if (user?.isAdmin && adminMode !== 'scoring') return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontWeight: '900', color: '#063020' }}>ADMIN: {user.name}</h2>
      <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setAdminMode('players')} style={{ padding: '15px', background: '#063020', color: 'white', fontWeight: '800', borderRadius: '10px' }}>DEDUCTIONS / PROXY SCORE</button>
        <button onClick={() => setAdminMode('results')} style={{ padding: '15px', background: '#C9A66B', color: 'white', fontWeight: '800', borderRadius: '10px' }}>RESULTS / DELETE</button>
        <button onClick={handleLogout} style={{ padding: '15px', background: '#eee', fontWeight: '800', borderRadius: '10px' }}>LOGOUT</button>
      </div>
      {adminMode === 'players' && allPlayers.map(p => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #ddd', alignItems: 'center' }}>
          <span>{p.name} (H:{p.handicap})</span>
          <div style={{ display: 'flex', gap: '5px' }}>
            <input type="number" defaultValue={p.deduction} onBlur={(e) => updateDeduction(p.id, e.target.value)} style={{ width: '45px', textAlign: 'center' }} />
            <button onClick={() => { setActiveEntry(p); setScores(courseData.map(h => h.par)); setAdminMode('scoring'); }} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', padding: '5px' }}>SCORE</button>
          </div>
        </div>
      ))}
      {adminMode === 'results' && rounds.map(r => (
        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #ddd' }}>
          <span>{r.player_name}: <b>{r.total_points}</b></span>
          <button onClick={async () => { if(window.confirm("Delete?")){ await supabase.from('rounds').delete().eq('id', r.id); loadData(); }}} style={{ color: 'red', border: 'none', background: 'none' }}>DEL</button>
        </div>
      ))}
    </div>
  );

  // --- SCORECARD UI ---
  return (
    <div style={{ fontFamily: 'sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '15px', background: '#063020', color: 'white', textAlign: 'center' }}>
        <h2 style={{ margin: 0 }}>{activeEntry?.name}</h2>
        <small>HCAP: {activeEntry?.handicap} | DEDUCTION: {activeEntry?.deduction}</small>
      </div>
      {!showSummary ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '800' }}>HOLE {currentHole + 1}</div>
          <div style={{ fontSize: '100px', fontWeight: '900' }}>{scores[currentHole] === 0 ? "X" : scores[currentHole]}</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button onClick={() => { const n = [...scores]; if (n[currentHole] > 1) n[currentHole]--; setScores(n); }} style={{ padding: '20px 40px', fontSize: '30px' }}>-</button>
            <button onClick={() => { const n = [...scores]; n[currentHole]++; setScores(n); }} style={{ padding: '20px 40px', fontSize: '30px', background: '#10b981', color: 'white' }}>+</button>
          </div>
          <div style={{ marginTop: '40px', width: '100%', display: 'flex', gap: '10px', padding: '0 20px' }}>
            <button onClick={() => currentHole > 0 && setCurrentHole(currentHole - 1)} style={{ flex: 1, padding: '15px' }}>PREV</button>
            <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole + 1) : setShowSummary(true)} style={{ flex: 2, padding: '15px', background: '#063020', color: 'white' }}>NEXT</button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px' }}>
          <h3>Review</h3>
          <div style={{ fontSize: '30px', fontWeight: '900', color: '#10b981' }}>TOTAL: {getTotals()} PTS</div>
          {!user?.isAdmin && (
            <select onChange={(e) => setVerifierName(e.target.value)} style={{ width: '100%', padding: '15px', margin: '15px 0' }}>
              <option value="">Select Verifier</option>
              {allPlayers.filter(p => p.name !== user?.name).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          )}
          <button onClick={submitCard} style={{ width: '100%', padding: '20px', background: '#10b981', color: 'white', fontWeight: '900' }}>SUBMIT</button>
          <button onClick={() => setShowSummary(false)} style={{ width: '100%', marginTop: '10px' }}>EDIT</button>
        </div>
      )}
    </div>
  );
}