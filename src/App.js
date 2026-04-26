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
  const [adminTab, setAdminTab] = useState('codes'); // 'codes' or 'leaderboard'

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

  const getF9 = (sArr, hcap) => sArr.slice(0, 9).reduce((acc, s, i) => acc + calcPoints(s, courseData[i].par, courseData[i].si, hcap), 0);
  const getB9 = (sArr, hcap) => sArr.slice(9, 18).reduce((acc, s, i) => acc + calcPoints(s, courseData[i+9].par, courseData[i+9].si, hcap), 0);
  
  const f9Pts = getF9(scores, player.handicap);
  const b9Pts = getB9(scores, player.handicap);
  const finalScore = (f9Pts + b9Pts) - (player.deduction || 0);

  const handleSubmitScore = async () => {
    if (!verifierName) return alert("Select Attester.");
    const { error } = await supabase.from('rounds').insert([{
      player_name: player.name,
      handicap: player.handicap,
      total_points: finalScore,
      verifier: verifierName,
      scores: scores,
      f9: f9Pts,
      b9: b9Pts,
      created_at: new Date().toISOString()
    }]);
    if (!error) { alert("Submitted!"); handleLogout(); }
  };

  // Helper for Category Filter
  const getCat = (hcap) => {
    if (hcap <= 9) return 1;
    if (hcap <= 18) return 2;
    if (hcap <= 27) return 3;
    return 4;
  };

  if (!isLoggedIn) return (
    <div style={{ backgroundColor: '#063020', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px' }}>
      <h1 style={{ color: 'white', textAlign: 'center', fontWeight: '900', fontSize: '45px' }}>LOGIN</h1>
      <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="000" style={{ padding: '20px', fontSize: '30px', textAlign: 'center', borderRadius: '15px', marginBottom: '15px', border: 'none' }} />
      <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: '#C9A66B', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '24px' }}>ENTER</button>
    </div>
  );

  // --- ADMIN VIEW ---
  if (player.isAdmin) return (
    <div style={{ backgroundColor: '#f4f4f4', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#063020', color: 'white', padding: '20px', textAlign: 'center' }}>
        <h2 style={{ margin: 0 }}>SOCIETY ADMIN</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
          <button onClick={() => setAdminTab('codes')} style={{ padding: '10px', background: adminTab === 'codes' ? '#C9A66B' : 'white', color: adminTab === 'codes' ? 'white' : 'black', border: 'none', borderRadius: '5px', fontWeight: '800' }}>ACCESS CODES</button>
          <button onClick={() => setAdminTab('leaderboard')} style={{ padding: '10px', background: adminTab === 'leaderboard' ? '#C9A66B' : 'white', color: adminTab === 'leaderboard' ? 'white' : 'black', border: 'none', borderRadius: '5px', fontWeight: '800' }}>LEADERBOARD</button>
          <button onClick={handleLogout} style={{ padding: '10px', background: '#e63946', color: 'white', border: 'none', borderRadius: '5px' }}>OUT</button>
        </div>
      </div>

      <div style={{ padding: '15px' }}>
        {adminTab === 'codes' ? (
          <div>
            <h3 style={{ borderBottom: '2px solid #063020' }}>Player Directory</h3>
            {allPlayers.map(p => (
              <div key={p.id} style={{ background: 'white', padding: '12px', marginBottom: '5px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700' }}>{p.name}</span>
                <span style={{ color: '#C9A66B', fontWeight: '900', fontSize: '20px' }}>{p.access_code}</span>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <h3 style={{ borderBottom: '2px solid #063020' }}>Top Overall</h3>
            {rounds.slice(0, 3).map((r, i) => (
               <div key={r.id} style={{ background: '#fff', padding: '10px', marginBottom: '5px', borderRadius: '8px', borderLeft: '5px solid #C9A66B' }}>
                 <b>{i + 1}. {r.player_name}</b> — {r.total_points} pts <small>(F9: {r.f9} B9: {r.b9})</small>
               </div>
            ))}

            <h3 style={{ borderBottom: '2px solid #063020', marginTop: '20px' }}>By Category</h3>
            {[1, 2, 3, 4].map(cat => (
              <div key={cat} style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800' }}>CATEGORY {cat}</div>
                {rounds.filter(r => getCat(r.handicap) === cat).slice(0, 1).map(r => (
                  <div key={r.id} style={{ background: '#d1fae5', padding: '8px', borderRadius: '5px' }}>Winner: {r.player_name} ({r.total_points} pts)</div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // --- STANDARD SCORECARD (PLAYER VIEW) ---
  return (
    <div style={{ backgroundColor: '#ffffff', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      {!showSummary ? (
        <div style={{ width: '100%', maxWidth: '450px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '10px 5px', backgroundColor: '#063020', color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '34px', fontWeight: '900', lineHeight: '1.1' }}>{player.name.toUpperCase()}</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#C9A66B' }}>HCAP: {player.handicap}</div>
          </div>
          {/* HOLE INFO */}
          <div style={{ display: 'flex', backgroundColor: '#F1F3F5', borderBottom: '2px solid #DEE2E6', alignItems: 'center' }}>
            <div style={{ flex: 1.2, textAlign: 'center', padding: '4px 0', borderRight: '2px solid #DEE2E6' }}>
                <div style={{ color: '#000', fontWeight: '900', fontSize: '18px' }}>HOLE</div>
                <div style={{ backgroundColor: '#FFD700', margin: '2px auto', width: '55px', height: '55px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: '900' }}>{currentHole + 1}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}><div style={{ color: '#000', fontWeight: '900', fontSize: '16px' }}>PAR</div><div style={{ fontSize: '45px', fontWeight: '900' }}>{courseData[currentHole].par}</div></div>
            <div style={{ flex: 1, textAlign: 'center' }}><div style={{ color: '#000', fontWeight: '900', fontSize: '16px' }}>S.I.</div><div style={{ fontSize: '45px', fontWeight: '900' }}>{courseData[currentHole].si}</div></div>
          </div>
          {/* STROKE SELECTOR */}
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
          {/* NAV */}
          <div style={{ borderTop: '3px solid #F1F3F5', padding: '8px 15px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '5px', backgroundColor: '#d1fae5', borderRadius: '12px', border: '2px solid #10b981' }}>
                    <div style={{ fontWeight: '900', fontSize: '14px' }}>PTS</div>
                    <div style={{ fontSize: '40px', fontWeight: '900', color: '#064e3b' }}>{calcPoints(scores[currentHole], courseData[currentHole].par, courseData[currentHole].si, player.handicap)}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '5px', backgroundColor: '#d1fae5', borderRadius: '12px', border: '2px solid #10b981' }}>
                    <div style={{ fontWeight: '900', fontSize: '14px' }}>TOTAL</div>
                    <div style={{ fontSize: '40px', fontWeight: '900', color: '#064e3b' }}>{f9Pts + b9Pts}</div>
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', padding: '10px', overflowY: 'auto' }}>
           <h2 style={{ textAlign: 'center', margin: '10px 0' }}>REVIEW SCORECARD</h2>
           <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{ textAlign: 'center' }}><b>FRONT 9</b><div style={{fontSize:'24px'}}>{f9Pts}</div></div>
              <div style={{ textAlign: 'center' }}><b>BACK 9</b><div style={{fontSize:'24px'}}>{b9Pts}</div></div>
              <div style={{ textAlign: 'center' }}><b>FINAL</b><div style={{fontSize:'24px', color:'#10b981'}}>{finalScore}</div></div>
           </div>
           <select onChange={(e) => setVerifierName(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '10px', marginBottom: '10px' }}>
              <option value="">SELECT ATTESTER</option>
              {allPlayers.filter(p => p.name !== player.name).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
           </select>
           <button onClick={handleSubmitScore} style={{ width: '100%', padding: '20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '900' }}>SUBMIT CARD</button>
           <button onClick={() => setShowSummary(false)} style={{ width: '100%', marginTop: '10px', padding: '10px', background: 'none', border: 'none', color: '#666' }}>Go Back</button>
        </div>
      )}
    </div>
  );
}