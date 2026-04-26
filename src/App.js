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
  const [rounds, setRounds] = useState([]); // For Admin View
  const [verifierName, setVerifierName] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [adminView, setAdminView] = useState('menu'); // 'menu', 'players', 'results'

  const handleLogout = useCallback(() => { localStorage.clear(); window.location.reload(); }, []);

  const loadSocietyData = useCallback(async () => {
    try {
      const { data: users } = await supabase.from('users').select('*').order('name');
      const { data: r } = await supabase.from('rounds').select('*').order('created_at', { ascending: false });
      setAllPlayers(users || []);
      setRounds(r || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    localStorage.setItem('egs_isLoggedIn', isLoggedIn);
    localStorage.setItem('egs_player', JSON.stringify(player));
    localStorage.setItem('egs_currentHole', currentHole);
    localStorage.setItem('egs_scores', JSON.stringify(scores));
    if (isLoggedIn) loadSocietyData();
  }, [isLoggedIn, player, currentHole, scores, loadSocietyData]);

  const handleLogin = async () => {
    const { data } = await supabase.from('users').select('*').eq('access_code', loginCode).single();
    if (data) { 
      const pData = { name: data.name, handicap: data.handicap, deduction: data.deduction || 0, isAdmin: data.show_leaderboard === true };
      setPlayer(pData); 
      setIsLoggedIn(true); 
    } else { alert("Login failed."); }
  };

  const updateDeduction = async (id, val) => {
    await supabase.from('users').update({ deduction: parseInt(val) || 0 }).eq('id', id);
    loadSocietyData();
  };

  const calcPoints = (s, p, si) => {
    if (s === 0) return 0;
    const pops = Math.floor(player.handicap / 18) + (player.handicap % 18 >= si ? 1 : 0);
    return Math.max(0, p - (s - pops) + 2);
  };

  const f9Points = scores.slice(0, 9).reduce((acc, s, i) => acc + calcPoints(s, courseData[i].par, courseData[i].si), 0);
  const b9Points = scores.slice(9, 18).reduce((acc, s, i) => acc + calcPoints(s, courseData[i + 9].par, courseData[i + 9].si), 0);
  const finalScore = (f9Points + b9Points) - (Number(player.deduction) || 0);

  const handleSubmitScore = async () => {
    if (!verifierName && !player.isAdmin) return alert("Select Attester.");
    const { error } = await supabase.from('rounds').insert([{
      player_name: player.name,
      handicap: player.handicap,
      total_points: finalScore,
      verifier: player.isAdmin ? "ADMIN_PROXY" : verifierName,
      scores: scores,
      created_at: new Date().toISOString()
    }]);
    if (!error) { alert("Submitted!"); handleLogout(); }
  };

  const ScoreTable = ({ startIndex }) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
      <tbody>
        {courseData.slice(startIndex, startIndex + 9).map((h, i) => {
          const idx = startIndex + i;
          return (
            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ fontWeight: '800', padding: '1px 0', background: '#f8f9fa', fontSize: '11px', width: '20%' }}>{idx + 1}</td>
              <td style={{ fontWeight: '900', fontSize: '18px', width: '40%' }}>{scores[idx] === 0 ? 'X' : scores[idx]}</td>
              <td style={{ fontWeight: '900', color: '#10b981', fontSize: '18px', width: '40%' }}>{calcPoints(scores[idx], h.par, h.si)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: '#063020', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px' }}>
        <h1 style={{ color: 'white', textAlign: 'center', fontWeight: '900', fontSize: '45px' }}>LOGIN</h1>
        <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="000" style={{ padding: '20px', fontSize: '30px', textAlign: 'center', borderRadius: '15px', marginBottom: '15px', border: 'none' }} />
        <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: '#C9A66B', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '24px' }}>ENTER</button>
      </div>
    );
  }

  // --- ADMIN VIEW (Kept Clean and Isolated) ---
  if (player.isAdmin && !showSummary && adminView !== 'scoring') {
    return (
      <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: '#063020', fontWeight: '900' }}>ADMIN: {player.name}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setAdminView('players')} style={{ padding: '15px', background: '#063020', color: 'white', fontWeight: '800', borderRadius: '10px', border: 'none' }}>DEDUCTIONS</button>
          <button onClick={() => setAdminView('results')} style={{ padding: '15px', background: '#C9A66B', color: 'white', fontWeight: '800', borderRadius: '10px', border: 'none' }}>RESULTS</button>
        </div>
        {adminView === 'players' && allPlayers.map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'white', borderRadius: '10px', marginBottom: '8px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <span style={{fontWeight:'700'}}>{p.name}</span>
            <div style={{display:'flex', gap:'5px', alignItems:'center'}}>
              <input type="number" defaultValue={p.deduction} onBlur={(e) => updateDeduction(p.id, e.target.value)} style={{ width: '40px', padding:'5px', textAlign:'center' }} />
              <button onClick={() => { setPlayer({...p, isAdmin:true}); setScores(courseData.map(h=>h.par)); setAdminView('scoring'); }} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px' }}>SCORE</button>
            </div>
          </div>
        ))}
        {adminView === 'results' && rounds.map(r => (
          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #ddd' }}>
            <span>{r.player_name}: <b>{r.total_points}</b></span>
            <button onClick={async () => { if(window.confirm("Delete?")){ await supabase.from('rounds').delete().eq('id', r.id); loadSocietyData(); }}} style={{ color: 'red', border: 'none', background: 'none' }}>DEL</button>
          </div>
        ))}
        <button onClick={handleLogout} style={{ width: '100%', marginTop: '20px', padding: '15px', background: '#333', color: 'white', borderRadius: '10px', border: 'none' }}>LOGOUT</button>
      </div>
    );
  }

  // --- MAIN SCORECARD UI (YOUR ORIGINAL GRAPHICS) ---
  return (
    <div style={{ backgroundColor: '#ffffff', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      {!showSummary ? (
        <div style={{ width: '100%', maxWidth: '450px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '10px 5px', backgroundColor: '#063020', color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '34px', fontWeight: '900', lineHeight: '1.1' }}>{player.name.toUpperCase()}</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#C9A66B' }}>HCAP: {player.handicap}</div>
          </div>
          <div style={{ display: 'flex', backgroundColor: '#F1F3F5', borderBottom: '2px solid #DEE2E6', alignItems: 'center' }}>
              <div style={{ flex: 1.2, textAlign: 'center', padding: '4px 0', borderRight: '2px solid #DEE2E6' }}>
                  <div style={{ color: '#000', fontWeight: '900', fontSize: '18px' }}>HOLE</div>
                  <div style={{ backgroundColor: '#FFD700', margin: '2px auto', width: '55px', height: '55px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: '900' }}>{currentHole + 1}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}><div style={{ color: '#000', fontWeight: '900', fontSize: '16px' }}>PAR</div><div style={{ fontSize: '45px', fontWeight: '900' }}>{courseData[currentHole].par}</div></div>
              <div style={{ flex: 1, textAlign: 'center' }}><div style={{ color: '#000', fontWeight: '900', fontSize: '16px' }}>S.I.</div><div style={{ fontSize: '45px', fontWeight: '900' }}>{courseData[currentHole].si}</div></div>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button onClick={() => { if(scores[currentHole] > 1){const n=[...scores]; n[currentHole]--; setScores(n);}}} style={{ width: '80px', height: '100px', borderRadius: '20px', backgroundColor: '#e63946', color: 'white', border: 'none', fontSize: '60px', fontWeight: '900' }}>-</button>
                <div style={{ textAlign: 'center', minWidth: '90px' }}>
                    <div style={{ fontSize: '120px', fontWeight: '900', color: '#063020', lineHeight: '0.8' }}>{scores[currentHole] === 0 ? "X" : scores[currentHole]}</div>
                    <div style={{ fontWeight: '900', color: '#495057', fontSize: '16px' }}>STROKES</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <button onClick={() => { const n = [...scores]; n[currentHole] = 0; setScores(n); }} style={{ width: '80px', height: '48px', borderRadius: '15px', backgroundColor: '#495057', color: 'white', border: 'none', fontSize: '28px', fontWeight: '900' }}>PU</button>
                    <button onClick={() => { const n = [...scores]; if(n[currentHole] === 0) n[currentHole] = courseData[currentHole].par; else n[currentHole]++; setScores(n); }} style={{ width: '80px', height: '100px', borderRadius: '20px', backgroundColor: '#2a9d8f', color: 'white', border: 'none', fontSize: '60px', fontWeight: '900' }}>+</button>
                </div>
             </div>
          </div>
          <div style={{ borderTop: '3px solid #F1F3F5', padding: '8px 15px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '5px', backgroundColor: '#d1fae5', borderRadius: '12px', border: '2px solid #10b981' }}>
                    <div style={{ fontWeight: '900', fontSize: '14px' }}>PTS</div>
                    <div style={{ fontSize: '40px', fontWeight: '900', color: '#064e3b' }}>{calcPoints(scores[currentHole], courseData[currentHole].par, courseData[currentHole].si)}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '5px', backgroundColor: '#d1fae5', borderRadius: '12px', border: '2px solid #10b981' }}>
                    <div style={{ fontWeight: '900', fontSize: '14px' }}>TOTAL</div>
                    <div style={{ fontSize: '40px', fontWeight: '900', color: '#064e3b' }}>{f9Points + b9Points}</div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', paddingBottom: '8px' }}>
                <button onClick={() => currentHole > 0 && setCurrentHole(currentHole - 1)} style={{ flex: 1, padding: '15px', borderRadius: '15px', background: '#E9ECEF', border: 'none', fontWeight: '900', fontSize: '18px' }}>PREV</button>
                <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole+1) : setShowSummary(true)} style={{ flex: 2, padding: '15px', borderRadius: '15px', background: '#063020', color: 'white', border: 'none', fontWeight: '900', fontSize: '20px' }}>
                    {currentHole < 17 ? 'NEXT' : 'SUMMARY'}
                </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', padding: '2px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ background: '#063020', color: 'white', textAlign: 'center', fontWeight: '900', fontSize: '18px', padding: '6px' }}>FRONT 9</div>
                  <ScoreTable startIndex={0} />
                  <div style={{ padding: '8px 0', textAlign: 'center', background: '#f1f3f5', fontSize: '28px', fontWeight: '900', color: '#063020', borderTop: '1px solid #ddd' }}>{f9Points} PTS</div>
              </div>
              <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ background: '#063020', color: 'white', textAlign: 'center', fontWeight: '900', fontSize: '18px', padding: '6px' }}>BACK 9</div>
                  <ScoreTable startIndex={9} />
                  <div style={{ padding: '8px 0', textAlign: 'center', background: '#f1f3f5', fontSize: '28px', fontWeight: '900', color: '#063020', borderTop: '1px solid #ddd' }}>{b9Points} PTS</div>
              </div>
          </div>
          <div style={{ display: 'flex', gap: '5px', padding: '5px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', fontWeight: '900' }}>ATTESTER</label>
                <select value={verifierName} onChange={(e) => setVerifierName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '16px', border: '2px solid #063020' }}>
                  <option value="">-- SELECT --</option>
                  {allPlayers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ textAlign: 'center', padding: '2px 10px', backgroundColor: '#fff5f5', borderRadius: '8px', border: '1px solid #feb2b2' }}>
                <div style={{ fontSize: '10px', fontWeight: '900', color: '#c53030' }}>DEDUCT</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#c53030' }}>-{player.deduction || 0}</div>
              </div>
          </div>
          <div style={{ margin: '5px', background: '#d1fae5', padding: '8px', borderRadius: '12px', border: '3px solid #10b981', display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: '900', color: '#064e3b' }}>FINAL:</span>
              <span style={{ fontSize: '38px', fontWeight: '900', color: '#064e3b', lineHeight: '1' }}>{finalScore}</span>
              <span style={{ fontSize: '18px', fontWeight: '900', color: '#064e3b' }}>PTS</span>
          </div>
          <div style={{ display: 'flex', gap: '5px', padding: '5px' }}>
            <button onClick={() => setShowSummary(false)} style={{ flex: 1, padding: '15px', borderRadius: '10px', border: 'none', background: '#E9ECEF', fontWeight: '900' }}>EDIT</button>
            <button onClick={handleSubmitScore} style={{ flex: 2, padding: '15px', borderRadius: '10px', border: 'none', background: '#10b981', color: 'white', fontWeight: '900', fontSize: '20px' }}>SUBMIT CARD</button>
          </div>
        </div>
      )}
    </div>
  );
}