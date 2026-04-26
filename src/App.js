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
    const { data: u } = await supabase.from('users').select('*').order('name');
    const { data: r } = await supabase.from('rounds').select('*').order('created_at', { ascending: false });
    setAllPlayers(u || []);
    setRounds(r || []);
  }, []);

  useEffect(() => { if (isLoggedIn) loadData(); }, [isLoggedIn, loadData]);

  const handleLogin = async () => {
    const { data } = await supabase.from('users').select('*').eq('access_code', loginCode).single();
    if (data) {
      const userData = { ...data, isAdmin: data.show_leaderboard === true };
      setUser(userData);
      localStorage.setItem('egs_user', JSON.stringify(userData));
      localStorage.setItem('egs_isLoggedIn', 'true');
      setIsLoggedIn(true);
      if (!userData.isAdmin) setActiveEntry(userData);
    } else { alert("Invalid Code"); }
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
      verifier: user.isAdmin ? "ADMIN" : verifierName,
      scores: scores,
      created_at: new Date().toISOString()
    }]);
    if (!error) {
      alert("Submitted!");
      user.isAdmin ? setAdminMode('menu') : handleLogout();
    }
  };

  // --- 1. LOGIN SCREEN (Original Style) ---
  if (!isLoggedIn) return (
    <div style={{ backgroundColor: '#063020', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: 'white', textAlign: 'center', fontWeight: '900', fontSize: '42px', marginBottom: '30px' }}>SOCIETY LOGIN</h1>
      <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="000" style={{ padding: '20px', fontSize: '28px', textAlign: 'center', borderRadius: '15px', border: 'none', marginBottom: '15px' }} />
      <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: '#C9A66B', color: 'white', borderRadius: '15px', fontWeight: '900', fontSize: '24px', border: 'none' }}>ENTER</button>
    </div>
  );

  // --- 2. ADMIN CONSOLE (Kept Simple) ---
  if (user?.isAdmin && adminMode !== 'scoring') return (
    <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#063020', padding: '20px', borderRadius: '15px', color: 'white', marginBottom: '20px', textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontWeight: '900' }}>ADMIN PANEL</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setAdminMode('players')} style={{ padding: '15px', background: '#063020', color: 'white', fontWeight: '800', borderRadius: '10px', border: 'none' }}>PLAYERS</button>
        <button onClick={() => setAdminMode('results')} style={{ padding: '15px', background: '#C9A66B', color: 'white', fontWeight: '800', borderRadius: '10px', border: 'none' }}>RESULTS</button>
      </div>
      {adminMode === 'players' && allPlayers.map(p => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'white', borderRadius: '12px', marginBottom: '10px', alignItems: 'center' }}>
          <div style={{ fontWeight: '800' }}>{p.name}</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="number" defaultValue={p.deduction} onBlur={(e) => updateDeduction(p.id, e.target.value)} style={{ width: '40px', textAlign: 'center' }} />
            <button onClick={() => { setActiveEntry(p); setScores(courseData.map(h => h.par)); setAdminMode('scoring'); }} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '8px' }}>SCORE</button>
          </div>
        </div>
      ))}
      {adminMode === 'results' && rounds.map(r => (
        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'white', borderRadius: '12px', marginBottom: '10px' }}>
          <span><b>{r.player_name}</b>: {r.total_points}</span>
          <button onClick={async () => { if(window.confirm("Delete?")){ await supabase.from('rounds').delete().eq('id', r.id); loadData(); }}} style={{ color: 'red', border: 'none', background: 'none' }}>DEL</button>
        </div>
      ))}
      <button onClick={handleLogout} style={{ width: '100%', marginTop: '20px', padding: '15px', background: '#333', color: 'white', borderRadius: '12px', border: 'none' }}>LOGOUT</button>
    </div>
  );

  // --- 3. SCORECARD & SUMMARY (REVERTED TO ORIGINAL GRAPHICS) ---
  return (
    <div style={{ backgroundColor: '#ffffff', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      {/* Header with original Green/Gold theme */}
      <div style={{ padding: '10px 5px', backgroundColor: '#063020', color: 'white', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#C9A66B', fontWeight: '800' }}>HCAP: {activeEntry?.handicap} | DEDUCT: {activeEntry?.deduction || 0}</div>
        <div style={{ fontSize: '30px', fontWeight: '900' }}>{activeEntry?.name.toUpperCase()}</div>
      </div>

      {!showSummary ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#063020' }}>HOLE {currentHole + 1} (PAR {courseData[currentHole].par})</div>
          <div style={{ fontSize: '140px', fontWeight: '900', color: '#063020', lineHeight: '1' }}>{scores[currentHole] === 0 ? "X" : scores[currentHole]}</div>
          
          {/* Reverting to the Circular Red/Green buttons */}
          <div style={{ display: 'flex', gap: '25px', marginTop: '10px' }}>
            <button onClick={() => { const n = [...scores]; if (n[currentHole] > 1) n[currentHole]--; setScores(n); }} 
              style={{ width: '85px', height: '85px', borderRadius: '50%', fontSize: '45px', background: '#e63946', color: 'white', border: 'none', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>-</button>
            <button onClick={() => { const n = [...scores]; n[currentHole]++; setScores(n); }} 
              style={{ width: '85px', height: '85px', borderRadius: '50%', fontSize: '45px', background: '#10b981', color: 'white', border: 'none', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>+</button>
          </div>

          <div style={{ marginTop: '50px', width: '100%', display: 'flex', gap: '10px', padding: '0 20px' }}>
            <button onClick={() => currentHole > 0 && setCurrentHole(currentHole - 1)} style={{ flex: 1, padding: '20px', borderRadius: '10px', background: '#E9ECEF', border: 'none', fontWeight: '800', fontSize: '18px' }}>PREV</button>
            <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole + 1) : setShowSummary(true)} 
              style={{ flex: 2, padding: '20px', borderRadius: '10px', background: '#063020', color: 'white', border: 'none', fontWeight: '900', fontSize: '18px' }}>
              {currentHole < 17 ? "NEXT" : "SUMMARY"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: '#d1fae5', padding: '25px', borderRadius: '20px', textAlign: 'center', border: '4px solid #10b981', marginBottom: '20px' }}>
            <div style={{ fontWeight: '900', fontSize: '20px', color: '#064e3b' }}>TOTAL SCORE</div>
            <div style={{ fontSize: '70px', fontWeight: '900', color: '#064e3b' }}>{getTotals()} PTS</div>
          </div>
          {!user?.isAdmin && (
            <select onChange={(e) => setVerifierName(e.target.value)} style={{ width: '100%', padding: '18px', borderRadius: '15px', border: '3px solid #063020', marginBottom: '15px', fontSize: '18px', fontWeight: '800' }}>
              <option value="">SELECT ATTESTER</option>
              {allPlayers.filter(p => p.name !== user?.name).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          )}
          <button onClick={submitCard} style={{ width: '100%', padding: '22px', background: '#10b981', color: 'white', fontWeight: '900', borderRadius: '15px', border: 'none', fontSize: '22px' }}>SUBMIT CARD</button>
          <button onClick={() => setShowSummary(false)} style={{ width: '100%', marginTop: '15px', background: 'none', border: 'none', color: '#666', fontWeight: '800' }}>EDIT SCORES</button>
        </div>
      )}
    </div>
  );
}