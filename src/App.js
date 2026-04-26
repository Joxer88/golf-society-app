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
    if (s === 0) return 0;
    const pops = Math.floor(player.handicap / 18) + (player.handicap % 18 >= si ? 1 : 0);
    return Math.max(0, p - (s - pops) + 2);
  };

  const totalPoints = scores.reduce((acc, s, i) => acc + calcPoints(s, courseData[i].par, courseData[i].si), 0);

  const handleSubmitScore = async () => {
    if (!verifierName) return alert("Please select an Attester/Verifier.");
    const { error } = await supabase.from('rounds').insert([{
      player_name: player.name,
      handicap: player.handicap,
      scores: scores,
      total_points: totalPoints,
      verifier: verifierName,
      date: new Date().toISOString()
    }]);
    if (!error) { alert("Score Submitted!"); handleLogout(); }
    else { alert("Error submitting score."); }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: '#063020', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px' }}>
        <h1 style={{ color: 'white', textAlign: 'center', fontWeight: '900', fontSize: '45px' }}>LOGIN</h1>
        <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="000" style={{ padding: '20px', fontSize: '30px', textAlign: 'center', borderRadius: '15px', marginBottom: '15px', border: 'none' }} />
        <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: '#C9A66B', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '24px' }}>ENTER</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#ffffff', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      {!showSummary ? (
        <div style={{ width: '100%', maxWidth: '450px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          <div style={{ padding: '10px 5px', backgroundColor: '#063020', color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '34px', fontWeight: '900', lineHeight: '1.1' }}>{player.name.toUpperCase()}</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#C9A66B' }}>HCAP: {player.handicap}</div>
          </div>

          <div style={{ display: 'flex', backgroundColor: '#F1F3F5', borderBottom: '2px solid #DEE2E6', alignItems: 'center' }}>
              <div style={{ flex: 1.2, textAlign: 'center', padding: '4px 0', borderRight: '2px solid #DEE2E6', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ color: '#000', fontWeight: '900', fontSize: '18px' }}>HOLE</div>
                  <div style={{ backgroundColor: '#FFD700', color: '#000', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '45px', fontWeight: '900', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', margin: '2px 0' }}>
                    {currentHole + 1}
                  </div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '4px 0', borderRight: '2px solid #DEE2E6' }}>
                  <div style={{ color: '#000', fontWeight: '900', fontSize: '18px' }}>PAR</div>
                  <div style={{ fontSize: '50px', fontWeight: '900', lineHeight: '1.4' }}>{courseData[currentHole].par}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '4px 0' }}>
                  <div style={{ color: '#000', fontWeight: '900', fontSize: '18px' }}>S.I.</div>
                  <div style={{ fontSize: '50px', fontWeight: '900', lineHeight: '1.4' }}>{courseData[currentHole].si}</div>
              </div>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button onClick={() => { if(scores[currentHole] > 1){const n=[...scores]; n[currentHole]--; setScores(n);}}} style={{ width: '85px', height: '110px', borderRadius: '20px', backgroundColor: '#e63946', color: 'white', border: 'none', fontSize: '65px', fontWeight: '900' }}>-</button>
                <div style={{ textAlign: 'center', minWidth: '100px' }}>
                    <div style={{ fontSize: '140px', fontWeight: '900', color: '#063020', lineHeight: '0.8' }}>{scores[currentHole] === 0 ? "X" : scores[currentHole]}</div>
                    <div style={{ fontWeight: '900', color: '#495057', fontSize: '18px' }}>STROKES</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <button onClick={() => { const n = [...scores]; n[currentHole] = 0; setScores(n); }} style={{ width: '85px', height: '52px', borderRadius: '15px', backgroundColor: '#495057', color: 'white', border: 'none', fontSize: '36px', fontWeight: '900' }}>PU</button>
                    <button onClick={() => { const n = [...scores]; if(n[currentHole] === 0) n[currentHole] = courseData[currentHole].par; else n[currentHole]++; setScores(n); }} style={{ width: '85px', height: '110px', borderRadius: '20px', backgroundColor: '#2a9d8f', color: 'white', border: 'none', fontSize: '65px', fontWeight: '900' }}>+</button>
                </div>
             </div>
          </div>

          <div style={{ borderTop: '3px solid #F1F3F5', padding: '5px 15px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '5px', backgroundColor: '#d1fae5', borderRadius: '12px', border: '2px solid #10b981' }}>
                    <div style={{ fontWeight: '900', color: '#064e3b', fontSize: '18px' }}>POINTS</div>
                    <div style={{ fontSize: '50px', fontWeight: '900', lineHeight: '1', color: '#064e3b' }}>{calcPoints(scores[currentHole], courseData[currentHole].par, courseData[currentHole].si)}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '5px', backgroundColor: '#d1fae5', borderRadius: '12px', border: '2px solid #10b981' }}>
                    <div style={{ fontWeight: '900', color: '#064e3b', fontSize: '18px' }}>TOTAL</div>
                    <div style={{ fontSize: '50px', fontWeight: '900', lineHeight: '1', color: '#064e3b' }}>{totalPoints}</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', paddingBottom: '8px' }}>
                <button onClick={() => currentHole > 0 && setCurrentHole(currentHole - 1)} style={{ flex: 1, padding: '20px', borderRadius: '15px', background: '#E9ECEF', border: 'none', fontWeight: '900', color: '#495057', fontSize: '22px' }}>PREV</button>
                <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole+1) : setShowSummary(true)} style={{ flex: 2, padding: '20px', borderRadius: '15px', background: '#063020', color: 'white', border: 'none', fontWeight: '900', fontSize: '24px' }}>NEXT</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F8F9FA', padding: '15px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
             <h2 style={{ fontSize: '30px', fontWeight: '900', color: '#063020', margin: '0' }}>ROUND SUMMARY</h2>
             <div style={{ fontSize: '60px', fontWeight: '900', color: '#10b981' }}>{totalPoints} PTS</div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #063020' }}>
                    <th>HOLE</th><th>PAR</th><th>SI</th><th>SCR</th><th>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {courseData.map((h, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee', backgroundColor: i === currentHole ? '#fff9db' : 'transparent' }}>
                      <td style={{ fontWeight: 'bold', padding: '5px' }}>{i+1}</td>
                      <td>{h.par}</td>
                      <td>{h.si}</td>
                      <td style={{ fontWeight: '900' }}>{scores[i] === 0 ? 'X' : scores[i]}</td>
                      <td style={{ fontWeight: '900', color: '#10b981' }}>{calcPoints(scores[i], h.par, h.si)}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>

          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '15px', marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '900', marginBottom: '10px', fontSize: '18px' }}>ATTESTER / VERIFIER:</label>
            <select 
              value={verifierName} 
              onChange={(e) => setVerifierName(e.target.value)} 
              style={{ width: '100%', padding: '15px', borderRadius: '10px', fontSize: '18px', border: '2px solid #063020' }}
            >
              <option value="">-- SELECT PLAYER --</option>
              {allPlayers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingBottom: '30px' }}>
            <button onClick={() => setShowSummary(false)} style={{ flex: 1, padding: '20px', borderRadius: '12px', border: 'none', background: '#E9ECEF', fontWeight: '900' }}>EDIT SCORES</button>
            <button onClick={handleSubmitScore} style={{ flex: 2, padding: '20px', borderRadius: '12px', border: 'none', background: '#10b981', color: 'white', fontWeight: '900', fontSize: '18px' }}>SUBMIT CARD</button>
          </div>
        </div>
      )}
    </div>
  );
}