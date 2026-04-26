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

  const handleLogout = useCallback(() => { localStorage.clear(); window.location.reload(); }, []);

  const loadData = useCallback(async () => {
    const { data: u } = await supabase.from('users').select('*').order('name');
    const { data: r } = await supabase.from('rounds').select('*').order('total_points', { ascending: false });
    setAllPlayers(u || []);
    setRounds(r || []);
  }, []);

  useEffect(() => {
    localStorage.setItem('egs_isLoggedIn', isLoggedIn);
    localStorage.setItem('egs_player', JSON.stringify(player));
    localStorage.setItem('egs_currentHole', currentHole);
    localStorage.setItem('egs_scores', JSON.stringify(scores));
    if (isLoggedIn) loadData();
  }, [isLoggedIn, player, currentHole, scores, loadData]);

  const handleLogin = async () => {
    const { data } = await supabase.from('users').select('*').eq('access_code', loginCode).single();
    if (data) { 
      setPlayer({ ...data, isAdmin: data.show_leaderboard === true }); 
      setIsLoggedIn(true); 
    } else { alert("Login failed."); }
  };

  const calcPoints = (s, p, si, hcap) => {
    if (s === 0) return 0;
    const pops = Math.floor(hcap / 18) + (hcap % 18 >= si ? 1 : 0);
    return Math.max(0, p - (s - pops) + 2);
  };

  const f9Pts = scores.slice(0, 9).reduce((acc, s, i) => acc + calcPoints(s, courseData[i].par, courseData[i].si, player.handicap), 0);
  const b9Pts = scores.slice(9, 18).reduce((acc, s, i) => acc + calcPoints(s, courseData[i+9].par, courseData[i+9].si, player.handicap), 0);
  const finalScore = (f9Pts + b9Pts) - (player.deduction || 0);

  const handleSubmitScore = async () => {
    if (!verifierName) return alert("Select Attester.");
    
    // FIX: Removed 'date' column which caused the error. Using 'created_at' (Supabase default)
    const { error } = await supabase.from('rounds').insert([{
      player_name: player.name,
      handicap: player.handicap,
      total_points: finalScore,
      verifier: verifierName,
      scores: scores,
      f9: f9Pts,
      b9: b9Pts,
      status: 'pending' 
    }]);

    if (!error) { 
      alert("Submitted Successfully!"); 
      handleLogout(); 
    } else { 
      alert("Error: " + error.message); 
    }
  };

  const ScoreTable = ({ startIndex }) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
      <tbody>
        {courseData.slice(startIndex, startIndex + 9).map((h, i) => {
          const idx = startIndex + i;
          return (
            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ fontWeight: '800', padding: '4px 0', background: '#f8f9fa', fontSize: '12px', width: '25%' }}>H{idx + 1}</td>
              <td style={{ fontWeight: '900', fontSize: '20px', width: '35%' }}>{scores[idx] === 0 ? 'X' : scores[idx]}</td>
              <td style={{ fontWeight: '900', color: '#10b981', fontSize: '20px', width: '40%' }}>{calcPoints(scores[idx], h.par, h.si, player.handicap)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  if (!isLoggedIn) return (
    <div style={{ backgroundColor: '#063020', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px' }}>
      <h1 style={{ color: 'white', textAlign: 'center', fontWeight: '900', fontSize: '45px' }}>LOGIN</h1>
      <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="Access Code" style={{ padding: '20px', fontSize: '24px', textAlign: 'center', borderRadius: '15px', marginBottom: '15px', border: 'none' }} />
      <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: '#C9A66B', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '24px' }}>ENTER</button>
    </div>
  );

  if (player.isAdmin) return (
    <div style={{ backgroundColor: '#f4f4f4', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#063020', color: 'white', padding: '20px', textAlign: 'center' }}>
        <h2 style={{ margin: 0 }}>SOCIETY ADMIN</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
          <button onClick={() => setAdminTab('codes')} style={{ padding: '10px', background: adminTab === 'codes' ? '#C9A66B' : 'white', color: adminTab === 'codes' ? 'white' : 'black', border: 'none', borderRadius: '5px', fontWeight: '800' }}>ACCESS CODES</button>
          <button onClick={() => setAdminTab('leaderboard')} style={{ padding: '10px', background: adminTab === 'leaderboard' ? '#C9A66B' : 'white', color: adminTab === 'leaderboard' ? 'white' : 'black', border: 'none', borderRadius: '5px', fontWeight: '800' }}>LEADERBOARD</button>
          <button onClick={handleLogout} style={{ padding: '10px', background: '#e63946', color: 'white', border: 'none', borderRadius: '5px' }}>LOGOUT</button>
        </div>
      </div>
      <div style={{ padding: '15px' }}>
        {adminTab === 'codes' ? (
          allPlayers.map(p => (
            <div key={p.id} style={{ background: 'white', padding: '12px', marginBottom: '5px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '700' }}>{p.name}</span>
              <span style={{ color: '#C9A66B', fontWeight: '900', fontSize: '20px' }}>{p.access_code}</span>
            </div>
          ))
        ) : (
          rounds.map((r, i) => (
             <div key={r.id} style={{ background: '#fff', padding: '12px', marginBottom: '8px', borderRadius: '8px', borderLeft: '5px solid #C9A66B' }}>
               <div style={{fontWeight:'800'}}>{i + 1}. {r.player_name}</div>
               <div style={{fontSize: '14px', color: '#666'}}>Score: <b>{r.total_points} pts</b> | F9: {r.f9} | B9: {r.b9}</div>
             </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#ffffff', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      {!showSummary ? (
        <div style={{ width: '100%', maxWidth: '450px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '10px 5px', backgroundColor: '#063020', color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '900' }}>{player.name}</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#C9A66B' }}>HCAP: {player.handicap} | DEDUCT: {player.deduction || 0}</div>
          </div>

          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '22px', fontWeight: '900', marginBottom: '5px' }}>HOLE {currentHole + 1} (PAR {courseData[currentHole].par})</div>
            <div style={{ fontSize: '120px', fontWeight: '900', color: '#063020', lineHeight: '1' }}>{scores[currentHole] === 0 ? "X" : scores[currentHole]}</div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
              <button onClick={() => { if(scores[currentHole] > 1){const n=[...scores]; n[currentHole]--; setScores(n);}}} style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#e63946', color: 'white', border: 'none', fontSize: '40px', fontWeight: '900' }}>-</button>
              <button onClick={() => { const n = [...scores]; if(n[currentHole] === 0) n[currentHole] = courseData[currentHole].par; else n[currentHole]++; setScores(n); }} style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#2a9d8f', color: 'white', border: 'none', fontSize: '40px', fontWeight: '900' }}>+</button>
            </div>
            <button onClick={() => { const n = [...scores]; n[currentHole] = 0; setScores(n); }} style={{ marginTop: '15px', padding: '8px 20px', borderRadius: '10px', background: '#495057', color: 'white', border: 'none', fontWeight: '700' }}>PICK UP (X)</button>
          </div>

          <div style={{ marginTop: 'auto', padding: '15px', borderTop: '2px solid #eee' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => currentHole > 0 && setCurrentHole(currentHole - 1)} style={{ flex: 1, padding: '20px', borderRadius: '15px', background: '#E9ECEF', border: 'none', fontWeight: '900', fontSize: '18px' }}>PREV</button>
              <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole+1) : setShowSummary(true)} style={{ flex: 2, padding: '20px', borderRadius: '15px', background: '#063020', color: 'white', border: 'none', fontWeight: '900', fontSize: '18px' }}>{currentHole < 17 ? 'NEXT' : 'VIEW SUMMARY'}</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', padding: '5px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ background: '#063020', color: 'white', textAlign: 'center', fontWeight: '900', padding: '8px' }}>FRONT 9</div>
                  <ScoreTable startIndex={0} />
                  <div style={{ padding: '10px', textAlign: 'center', background: '#f1f3f5', fontSize: '24px', fontWeight: '900' }}>{f9Pts} PTS</div>
              </div>
              <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ background: '#063020', color: 'white', textAlign: 'center', fontWeight: '900', padding: '8px' }}>BACK 9</div>
                  <ScoreTable startIndex={9} />
                  <div style={{ padding: '10px', textAlign: 'center', background: '#f1f3f5', fontSize: '24px', fontWeight: '900' }}>{b9Pts} PTS</div>
              </div>
          </div>

          <div style={{ padding: '10px' }}>
            <div style={{ background: '#d1fae5', padding: '15px', borderRadius: '12px', border: '2px solid #10b981', textAlign: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '20px', fontWeight: '900' }}>FINAL SCORE: {finalScore} PTS</span>
            </div>
            
            <select value={verifierName} onChange={(e) => setVerifierName(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '10px', marginBottom: '10px', fontSize: '16px', border: '2px solid #063020' }}>
              <option value="">-- SELECT ATTESTER --</option>
              {allPlayers.filter(p => p.name !== player.name).map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowSummary(false)} style={{ flex: 1, padding: '15px', borderRadius: '10px', border: 'none', background: '#E9ECEF', fontWeight: '900' }}>EDIT</button>
              <button onClick={handleSubmitScore} style={{ flex: 2, padding: '15px', borderRadius: '10px', border: 'none', background: '#10b981', color: 'white', fontWeight: '900', fontSize: '18px' }}>SUBMIT CARD</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}