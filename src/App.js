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
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('egs_user')) || null);
  const [currentHole, setCurrentHole] = useState(0);
  const [scores, setScores] = useState(courseData.map(h => h.par));
  const [loginCode, setLoginCode] = useState("");
  const [allPlayers, setAllPlayers] = useState([]);
  const [verifierName, setVerifierName] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    async function loadPlayers() {
      const { data } = await supabase.from('users').select('*').order('name');
      setAllPlayers(data || []);
    }
    if (isLoggedIn) loadPlayers();
  }, [isLoggedIn]);

  const handleLogin = async () => {
    const { data } = await supabase.from('users').select('*').eq('access_code', loginCode).single();
    if (data) {
      setUser(data);
      localStorage.setItem('egs_user', JSON.stringify(data));
      localStorage.setItem('egs_isLoggedIn', 'true');
      setIsLoggedIn(true);
    } else { alert("Invalid Code"); }
  };

  const calcPoints = (s, p, si, hcap) => {
    if (s === 0) return 0;
    const pops = Math.floor(hcap / 18) + (hcap % 18 >= si ? 1 : 0);
    return Math.max(0, p - (s - pops) + 2);
  };

  const getTotals = () => {
    const pts = scores.reduce((acc, s, i) => acc + calcPoints(s, courseData[i].par, courseData[i].si, user.handicap), 0);
    return pts - (user.deduction || 0);
  };

  const submitCard = async () => {
    if (!verifierName) return alert("Please select a verifier");
    const { error } = await supabase.from('rounds').insert([{
      player_name: user.name,
      handicap: user.handicap,
      total_points: getTotals(),
      verifier: verifierName,
      scores: scores,
      created_at: new Date().toISOString()
    }]);
    if (!error) {
      alert("Submitted Successfully");
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!isLoggedIn) return (
    <div style={{ backgroundColor: '#063020', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: 'white', textAlign: 'center', fontWeight: '900', fontSize: '32px', marginBottom: '20px' }}>SOCIETY LOGIN</h1>
      <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="ENTER CODE" style={{ padding: '20px', fontSize: '24px', textAlign: 'center', borderRadius: '12px', border: 'none', marginBottom: '10px' }} />
      <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: '#C9A66B', color: 'white', borderRadius: '12px', fontWeight: '900', border: 'none' }}>ENTER</button>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#ffffff', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      {/* HEADER SECTION */}
      <div style={{ padding: '10px 0', backgroundColor: '#063020', color: 'white', textAlign: 'center' }}>
        <div style={{ color: '#C9A66B', fontWeight: '800', fontSize: '14px' }}>HCAP: {user.handicap} | DEDUCT: {user.deduction || 0}</div>
        <div style={{ fontSize: '28px', fontWeight: '900' }}>{user.name.toUpperCase()}</div>
      </div>

      {!showSummary ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#063020' }}>HOLE {currentHole + 1} (PAR {courseData[currentHole].par})</div>
          <div style={{ fontSize: '140px', fontWeight: '900', color: '#063020', lineHeight: '1' }}>{scores[currentHole]}</div>
          
          <div style={{ display: 'flex', gap: '30px' }}>
            <button onClick={() => { const n = [...scores]; if (n[currentHole] > 1) n[currentHole]--; setScores(n); }} 
              style={{ width: '80px', height: '80px', borderRadius: '50%', fontSize: '40px', background: '#ef4444', color: 'white', border: 'none', fontWeight: '900' }}>-</button>
            <button onClick={() => { const n = [...scores]; n[currentHole]++; setScores(n); }} 
              style={{ width: '80px', height: '80px', borderRadius: '50%', fontSize: '40px', background: '#10b981', color: 'white', border: 'none', fontWeight: '900' }}>+</button>
          </div>

          <div style={{ marginTop: '50px', width: '100%', display: 'flex', gap: '10px', padding: '0 20px' }}>
            <button onClick={() => currentHole > 0 && setCurrentHole(currentHole - 1)} style={{ flex: 1, padding: '15px', borderRadius: '10px', background: '#E9ECEF', border: 'none', fontWeight: '800' }}>PREV</button>
            <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole + 1) : setShowSummary(true)} 
              style={{ flex: 2, padding: '15px', borderRadius: '10px', background: '#063020', color: 'white', border: 'none', fontWeight: '800' }}>
              {currentHole < 17 ? "NEXT" : "SUMMARY"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px' }}>
          <div style={{ background: '#d1fae5', padding: '20px', borderRadius: '20px', textAlign: 'center', border: '3px solid #10b981', marginBottom: '20px' }}>
            <div style={{ fontWeight: '900', fontSize: '18px' }}>FINAL SCORE</div>
            <div style={{ fontSize: '60px', fontWeight: '900', color: '#064e3b' }}>{getTotals()} PTS</div>
          </div>
          <select onChange={(e) => setVerifierName(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '2px solid #063020', marginBottom: '15px', fontSize: '16px', fontWeight: '700' }}>
            <option value="">SELECT VERIFIER</option>
            {allPlayers.filter(p => p.name !== user.name).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <button onClick={submitCard} style={{ width: '100%', padding: '20px', background: '#10b981', color: 'white', fontWeight: '900', borderRadius: '10px', border: 'none', fontSize: '18px' }}>SUBMIT CARD</button>
          <button onClick={() => setShowSummary(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', color: '#666', fontWeight: '800' }}>EDIT SCORES</button>
        </div>
      )}
    </div>
  );
}