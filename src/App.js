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
  const [player, setPlayer] = useState(() => JSON.parse(localStorage.getItem('egs_player')) || { name: "", handicap: 0, deduction: 0, isAdmin: false });
  const [currentHole, setCurrentHole] = useState(() => parseInt(localStorage.getItem('egs_currentHole')) || 0);
  const [scores, setScores] = useState(() => JSON.parse(localStorage.getItem('egs_scores')) || courseData.map(h => h.par));
  const [loginCode, setLoginCode] = useState("");
  const [allPlayers, setAllPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [verifierName, setVerifierName] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [adminTab, setAdminTab] = useState('codes');
  const [isLocked, setIsLocked] = useState(false);

  const handleLogout = useCallback(() => { localStorage.clear(); window.location.reload(); }, []);

  const loadData = useCallback(async () => {
    const { data: u } = await supabase.from('users').select('*').order('name');
    const { data: r } = await supabase.from('rounds').select('*').order('created_at', { ascending: false });
    setAllPlayers(u || []);
    setRounds(r || []);
    if (player.name) {
      const existing = r?.find(round => round.player_name === player.name);
      if (existing) { 
        setScores(existing.scores); 
        setIsLocked(true); 
        setShowSummary(true); 
      }
    }
  }, [player.name]);

  useEffect(() => {
    localStorage.setItem('egs_isLoggedIn', isLoggedIn);
    localStorage.setItem('egs_player', JSON.stringify(player));
    localStorage.setItem('egs_currentHole', currentHole);
    localStorage.setItem('egs_scores', JSON.stringify(scores));
    if (isLoggedIn) loadData();
  }, [isLoggedIn, player, currentHole, scores, loadData]);

  const handleLogin = async () => {
    const { data } = await supabase.from('users').select('*').eq('access_code', loginCode.trim().toUpperCase()).single();
    if (data) { setPlayer({ ...data, isAdmin: data.show_leaderboard === true }); setIsLoggedIn(true); } else { alert("Invalid Code"); }
  };

  const calcPoints = (s, p, si, hcap) => {
    if (s === 0) return 0;
    const pops = Math.floor(hcap / 18) + (hcap % 18 >= si ? 1 : 0);
    return Math.max(0, p - (s - pops) + 2);
  };

  const f9Pts = scores.slice(0, 9).reduce((acc, s, i) => acc + calcPoints(s, courseData[i].par, courseData[i].si, player.handicap), 0);
  const b9Pts = scores.slice(9, 18).reduce((acc, s, i) => acc + calcPoints(s, courseData[i+9].par, courseData[i+9].si, player.handicap), 0);
  const finalScore = (f9Pts + b9Pts) - (player.deduction || 0);

  const ScoreTable = ({ start }) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '14px' }}>
      <thead><tr style={{ background: '#eee' }}><th>H</th><th>S</th><th>P</th></tr></thead>
      <tbody>
        {courseData.slice(start, start + 9).map((h, i) => (
          <tr key={start + i} style={{ borderBottom: '1px solid #ddd' }}>
            <td style={{ padding: '8px', fontWeight: 'bold' }}>{start + i + 1}</td>
            <td>{scores[start + i] === 0 ? 'X' : scores[start + i]}</td>
            <td style={{ color: '#2d9a83', fontWeight: '900' }}>{calcPoints(scores[start + i], h.par, h.si, player.handicap)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (!isLoggedIn) return (
    <div style={{ backgroundColor: '#063020', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px' }}>
      <h1 style={{ color: 'white', textAlign: 'center', fontWeight: '900', fontSize: '45px' }}>LOGIN</h1>
      <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="ENTER CODE" style={{ padding: '20px', fontSize: '24px', textAlign: 'center', borderRadius: '15px', marginBottom: '15px', border: 'none', textTransform: 'uppercase' }} />
      <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: '#C9A66B', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '24px' }}>ENTER</button>
    </div>
  );

  if (player.isAdmin) return (
    <div style={{ backgroundColor: '#f4f4f4', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#063020', color: 'white', padding: '20px', textAlign: 'center' }}>
        <h2 style={{ margin: 0 }}>ADMIN PANEL</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
          <button onClick={() => setAdminTab('codes')} style={{ padding: '10px', background: adminTab === 'codes' ? '#C9A66B' : 'white', borderRadius: '5px', border: 'none' }}>CODES</button>
          <button onClick={() => setAdminTab('leaderboard')} style={{ padding: '10px', background: adminTab === 'leaderboard' ? '#C9A66B' : 'white', borderRadius: '5px', border: 'none' }}>RESULTS</button>
          <button onClick={handleLogout} style={{ padding: '10px', background: '#e63946', color: 'white', borderRadius: '5px', border: 'none' }}>LOGOUT</button>
        </div>
      </div>
      <div style={{ padding: '15px' }}>
        {adminTab === 'codes' ? allPlayers.map(p => (<div key={p.id} style={{ background: 'white', padding: '12px', marginBottom: '5px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}><b>{p.name}</b><span style={{ color: '#C9A66B', fontWeight: '900' }}>{p.access_code}</span></div>)) : 
          rounds.map((r) => (<div key={r.id} style={{ background: '#fff', padding: '10px', marginBottom: '5px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><b>{r.player_name}</b> — {r.total_points} pts</div><button onClick={async () => { if(window.confirm("Unlock?")){ await supabase.from('rounds').delete().eq('id', r.id); loadData(); } }} style={{ background: '#e63946', color: 'white', border: 'none', padding: '8px', borderRadius: '5px' }}>UNLOCK</button></div>))
        }
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#ffffff', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      {!showSummary ? (
        <div style={{ width: '100%', maxWidth: '450px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ backgroundColor: '#063020', color: 'white', textAlign: 'center', padding: '10px' }}>
            <div style={{ fontSize: '28px', fontWeight: '900' }}>{player.name}</div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#C9A66B' }}>HCAP: {player.handicap}</div>
          </div>
          <div style={{ display: 'flex', backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: '800' }}>HOLE</div>
              <div style={{ background: '#FFD700', width: '30px', height: '30px', borderRadius: '50%', margin: '5px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>{currentHole+1}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '10px' }}><div style={{ fontSize: '10px', fontWeight: '800' }}>PAR</div><div style={{ fontSize: '22px', fontWeight: '900' }}>{courseData[currentHole].par}</div></div>
            <div style={{ flex: 1, textAlign: 'center', padding: '10px' }}><div style={{ fontSize: '10px', fontWeight: '800' }}>S.I.</div><div style={{ fontSize: '22px', fontWeight: '900' }}>{courseData[currentHole].si}</div></div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
              <button onClick={() => {if(scores[currentHole]>1){const n=[...scores]; n[currentHole]--; setScores(n);}}} style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#ef4444', color: 'white', border: 'none', fontSize: '50px', fontWeight: '900' }}>-</button>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: '120px', fontWeight: '900', color: '#063020', lineHeight: '1' }}>{scores[currentHole] === 0 ? "X" : scores[currentHole]}</div><div style={{ fontSize: '14px', fontWeight: '800' }}>STROKES</div></div>
              <button onClick={() => {const n=[...scores]; if(n[currentHole]===0) n[currentHole]=courseData[currentHole].par; else n[currentHole]++; setScores(n);}} style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#2d9a83', color: 'white', border: 'none', fontSize: '50px', fontWeight: '900' }}>+</button>
            </div>
            <button onClick={() => {const n=[...scores]; n[currentHole]=0; setScores(n);}} style={{ marginTop: '30px', padding: '12px 40px', background: '#4b5563', color: 'white', borderRadius: '10px', fontWeight: '900' }}>PICK UP (X)</button>
          </div>
          <div style={{ display: 'flex', padding: '15px', gap: '10px', background: '#063020' }}>
            <button onClick={() => currentHole > 0 && setCurrentHole(currentHole - 1)} style={{ flex: 1, padding: '18px', borderRadius: '10px', background: '#E9ECEF', fontWeight: '900' }}>PREV</button>
            <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole+1) : setShowSummary(true)} style={{ flex: 2, padding: '18px', borderRadius: '10px', background: '#C9A66B', color: 'white', fontWeight: '900' }}>{currentHole < 17 ? 'NEXT' : 'SUMMARY'}</button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '10px', overflowY: 'auto', flex: 1 }}>
          <div style={{ background: '#063020', color: 'white', padding: '15px', borderRadius: '10px', textAlign: 'center', marginBottom: '10px' }}>
            <h2 style={{ margin: 0 }}>{finalScore} POINTS</h2>
            {player.deduction > 0 && <small>Incl. {player.deduction} pt deduction</small>}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '8px' }}><ScoreTable start={0} /></div>
            <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '8px' }}><ScoreTable start={9} /></div>
          </div>
          {!isLocked ? (
            <>
              <select value={verifierName} onChange={(e) => setVerifierName(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '10px', marginBottom: '10px', fontSize: '16px' }}>
                <option value="">-- ATTESTER --</option>
                {allPlayers.filter(p => p.name !== player.name).map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
              <button onClick={async () => {
                if(!verifierName) return alert("Select Attester");
                const { error } = await supabase.from('rounds').insert([{ player_name: player.name, handicap: player.handicap, total_points: finalScore, verifier: verifierName, scores: scores, f9: f9Pts, b9: (finalScore-f9Pts) }]);
                if(!error){ alert("Success!"); handleLogout(); }
              }} style={{ width: '100%', padding: '20px', background: '#10b981', color: 'white', borderRadius: '10px', fontWeight: '900', fontSize: '18px' }}>SUBMIT SCORECARD</button>
              <button onClick={() => setShowSummary(false)} style={{ width: '100%', marginTop: '10px', padding: '10px', background: 'none', border: 'none', color: '#666' }}>Back to Edit</button>
            </>
          ) : <button onClick={handleLogout} style={{ width: '100%', padding: '20px', background: '#063020', color: 'white', borderRadius: '10px', fontWeight: '900' }}>LOGOUT</button>}
        </div>
      )}
    </div>
  );
}