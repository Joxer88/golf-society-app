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
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [verifierName, setVerifierName] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  const handleLogout = useCallback(() => { localStorage.clear(); window.location.reload(); }, []);

  const loadSocietyData = useCallback(async () => {
    const { data: users } = await supabase.from('users').select('name').neq('name', player.name);
    setAllPlayers(users || []);
    const { data: pending } = await supabase.from('rounds').select('*').eq('verifier', player.name).eq('status', 'pending');
    setPendingApprovals(pending || []);
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
    const pops = Math.floor(player.handicap / 18) + (player.handicap % 18 >= si ? 1 : 0);
    return Math.max(0, p - (s - pops) + 2);
  };

  const totalPoints = scores.slice(0, currentHole + 1).reduce((acc, s, i) => acc + calcPoints(s, courseData[i].par, courseData[i].si), 0);

  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: '#1A4D3A', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
        <h1 style={{ color: '#C9A66B', textAlign: 'center' }}>EGS SCORING</h1>
        <input type="text" placeholder="3-DIGIT CODE" value={loginCode} onChange={e => setLoginCode(e.target.value)} style={{ padding: '20px', fontSize: '24px', textAlign: 'center', borderRadius: '10px', marginBottom: '10px' }} />
        <button onClick={handleLogin} style={{ padding: '20px', backgroundColor: '#C9A66B', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>LOG IN</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#1A4D3A', minHeight: '100vh', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {!showSummary ? (
        <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          {/* Header */}
          <div style={{ backgroundColor: 'white', padding: '15px', textAlign: 'center', borderBottom: '2px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: '#333', fontSize: '24px', fontWeight: '900' }}>{player.name}</h2>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#C9A66B', fontWeight: 'bold' }}>HCAP</div>
                <div style={{ fontSize: '24px', color: '#333', fontWeight: '900' }}>{player.handicap}</div>
              </div>
            </div>
          </div>

          {/* Hole Info Bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #eee', textAlign: 'center' }}>
            <div style={{ flex: 1, padding: '10px', borderRight: '1px solid #eee' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#888' }}>HOLE</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#333' }}>{currentHole + 1}</div>
            </div>
            <div style={{ flex: 1, padding: '10px', borderRight: '1px solid #eee' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#888' }}>PAR</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#333' }}>{courseData[currentHole].par}</div>
            </div>
            <div style={{ flex: 1, padding: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#888' }}>S.I.</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#333' }}>{courseData[currentHole].si}</div>
            </div>
          </div>

          {/* Main Scoring Section */}
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#888', marginBottom: '10px' }}>STROKES</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
              <button onClick={() => { const n = [...scores]; n[currentHole]--; setScores(n); }} style={{ width: '70px', height: '70px', borderRadius: '15px', backgroundColor: '#ff4d4d', color: 'white', border: 'none', fontSize: '40px', fontWeight: 'bold' }}>−</button>
              <span style={{ fontSize: '100px', fontWeight: '900', color: '#1A4D3A' }}>{scores[currentHole]}</span>
              <button onClick={() => { const n = [...scores]; n[currentHole]++; setScores(n); }} style={{ width: '70px', height: '70px', borderRadius: '15px', backgroundColor: '#2ecc71', color: 'white', border: 'none', fontSize: '40px', fontWeight: 'bold' }}>+</button>
            </div>
          </div>

          {/* Points Footer */}
          <div style={{ display: 'flex', backgroundColor: '#f9fcfb', borderTop: '1px solid #eee', textAlign: 'center' }}>
            <div style={{ flex: 1, padding: '15px', borderRight: '1px solid #eee' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2ecc71' }}>POINTS</div>
              <div style={{ fontSize: '36px', fontWeight: '900', color: '#333' }}>{calcPoints(scores[currentHole], courseData[currentHole].par, courseData[currentHole].si)}</div>
            </div>
            <div style={{ flex: 1, padding: '15px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2ecc71' }}>TOTAL</div>
              <div style={{ fontSize: '36px', fontWeight: '900', color: '#333' }}>{totalPoints}</div>
            </div>
          </div>

          <button onClick={() => currentHole < 17 ? setCurrentHole(currentHole+1) : setShowSummary(true)} style={{ width: '90%', margin: '20px 5%', padding: '20px', backgroundColor: '#C9A66B', color: 'white', border: 'none', borderRadius: '10px', fontSize: '20px', fontWeight: 'bold' }}>
            {currentHole < 17 ? 'NEXT HOLE' : 'FINISH'}
          </button>
        </div>
      ) : (
        /* Summary Screen Remains as added before for verification */
        <div style={{ width: '100%', maxWidth: '400px', color: 'white', padding: '20px' }}>
          <h2>Round Complete</h2>
          <p>Final Points: {totalPoints}</p>
          <select value={verifierName} onChange={e => setVerifierName(e.target.value)} style={{ width: '100%', padding: '15px', marginBottom: '20px' }}>
            <option value="">-- Select Marker --</option>
            {allPlayers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          <button onClick={handleLogout} style={{ width: '100%', padding: '15px', backgroundColor: '#C9A66B', border: 'none', borderRadius: '10px' }}>SUBMIT & EXIT</button>
        </div>
      )}
      <button onClick={handleLogout} style={{ marginTop: '20px', background: 'none', color: 'white', border: 'none', opacity: 0.5 }}>LOGOUT / RESET</button>
    </div>
  );
}