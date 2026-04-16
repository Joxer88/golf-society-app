import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const sbUrl = process.env.REACT_APP_SUPABASE_URL || '';
const sbKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(sbUrl, sbKey);

const compSettings = {
  courseName: "CO. LONGFORD GOLF CLUB",
  date: "2026-04-16", 
  firstTeeTime: "10:00",
  adminCode: "999"
};

const courseData = [
  { par: 4, si: 7 }, { par: 5, si: 1 }, { par: 3, si: 15 }, { par: 4, si: 9 }, { par: 4, si: 3 }, { par: 4, si: 11 },
  { par: 5, si: 5 }, { par: 3, si: 17 }, { par: 4, si: 13 }, { par: 4, si: 8 }, { par: 4, si: 2 }, { par: 3, si: 16 },
  { par: 5, si: 10 }, { par: 4, si: 4 }, { par: 4, si: 12 }, { par: 4, si: 6 }, { par: 3, si: 18 }, { par: 5, si: 14 }
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginCode, setLoginCode] = useState("");
  const [player, setPlayer] = useState({ name: "", handicap: 0 });
  const [currentHole, setCurrentHole] = useState(0);
  const [scores, setScores] = useState(courseData.map(h => h.par));
  const [showSummary, setShowSummary] = useState(false);
  const [verifierName, setVerifierName] = useState("");

  const checkAccessTime = () => {
    const now = new Date();
    const compDate = new Date(`${compSettings.date}T${compSettings.firstTeeTime}`);
    const start = new Date(compDate.getTime() - (60 * 60 * 1000)); 
    const end = new Date(compDate.getTime() + (12 * 60 * 60 * 1000));
    return now >= start && now <= end;
  };

  const handleLogin = async () => {
    if (loginCode === compSettings.adminCode) {
      setPlayer({ name: "ADMIN", handicap: 0 });
      setIsLoggedIn(true);
      return;
    }
    if (!checkAccessTime()) {
      alert("Access denied. Login opens 1hr before tee time.");
      return;
    }
    const { data } = await supabase.from('users').select('*').eq('access_code', loginCode).single();
    if (data) {
      setPlayer({ name: data.name, handicap: data.handicap });
      setIsLoggedIn(true);
    } else {
      alert("Invalid Code.");
    }
  };

  const calcPoints = (s, p, si) => {
    if (s === 0) return 0;
    const pops = Math.floor(player.handicap / 18) + (player.handicap % 18 >= si ? 1 : 0);
    return Math.max(0, p - (s - pops) + 2);
  };

  const updateScore = (val) => {
    const n = [...scores];
    n[currentHole] = Math.max(0, n[currentHole] + val);
    setScores(n);
  };

  const runningTotal = scores.reduce((a, s, i) => i <= currentHole ? a + calcPoints(s, courseData[i].par, courseData[i].si) : a, 0);
  const finalTotal = scores.reduce((a, s, i) => a + calcPoints(s, courseData[i].par, courseData[i].si), 0);

  const handleSubmit = async () => {
    if (!verifierName) return alert("Marker name required");
    await supabase.from('rounds').insert([{ player_name: player.name, handicap: player.handicap, total_points: finalTotal, verifier: verifierName, scores: scores }]);
    window.location.reload();
  };

  const containerStyle = { height: '100vh', width: '100%', maxWidth: '450px', margin: '0 auto', backgroundColor: '#1A4D3A', color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' };

  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: '#0e2b20', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
        <div style={containerStyle}>
          <div style={{ padding: '20px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ fontSize: '24px', color: '#C9A66B' }}>EGAN'S GOLF SOCIETY</h1>
            <p>{compSettings.courseName} | {compSettings.date}</p>
            <input type="password" placeholder="3-DIGIT CODE" value={loginCode} onChange={(e) => setLoginCode(e.target.value)} style={{ width: '100%', padding: '15px', fontSize: '30px', textAlign: 'center', borderRadius: '10px', margin: '20px 0', border: 'none' }} />
            <button onClick={handleLogin} style={{ width: '100%', padding: '15px', backgroundColor: '#C9A66B', color: 'white', fontSize: '20px', fontWeight: 'bold', border: 'none', borderRadius: '10px' }}>SIGN IN</button>
          </div>
        </div>
      </div>
    );
  }

  if (showSummary) {
    return (
      <div style={{ backgroundColor: '#0e2b20', minHeight: '100vh' }}>
        <div style={containerStyle}>
          <div style={{ flex: 1, backgroundColor: 'white', color: '#111', margin: '5px', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <h2 style={{ textAlign: 'center' }}>SUMMARY</h2>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {courseData.map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', fontSize: '20px', padding: '5px 0' }}>
                  <span>H{i+1} ({scores[i] || 'PU'})</span><span>{calcPoints(scores[i], h.par, h.si)} pts</span>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', borderTop: '2px solid #1A4D3A', padding: '10px' }}>
              <h1 style={{ margin: 0 }}>TOTAL: {finalTotal}</h1>
            </div>
            <input type="text" placeholder="MARKER NAME" value={verifierName} onChange={(e)=>setVerifierName(e.target.value.toUpperCase())} style={{ width: '100%', padding: '10px', marginBottom: '5px' }} />
            <button onClick={handleSubmit} style={{ width: '100%', padding: '15px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '10px' }}>SUBMIT SCORE</button>
            <button onClick={() => setShowSummary(false)} style={{ color: 'red', background: 'none', border: 'none', marginTop: '5px' }}>BACK</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0e2b20', minHeight: '100vh' }}>
      <div style={containerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <span>{player.name}</span><span>HCAP: {player.handicap}</span>
        </div>
        <div style={{ flex: 1, backgroundColor: 'white', color: '#333', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', background: '#eee', padding: '10px' }}>
            <div>HOLE<br/><b>{currentHole + 1}</b></div>
            <div>PAR<br/><b>{courseData[currentHole].par}</b></div>
            <div>SI<br/><b>{courseData[currentHole].si}</b></div>
          </div>
          <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              <button onClick={() => updateScore(-1)} style={{ width: '60px', height: '60px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontSize: '30px' }}>-</button>
              <span style={{ fontSize: '100px', fontWeight: 'bold' }}>{scores[currentHole] || 'X'}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <button onClick={() => { const n = [...scores]; n[currentHole] = 0; setScores(n); }} style={{ padding: '5px', background: '#666', color: 'white', border: 'none', borderRadius: '5px' }}>PU</button>
                <button onClick={() => updateScore(1)} style={{ width: '60px', height: '60px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', fontSize: '30px' }}>+</button>
              </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '40px' }}>
                <div>PTS: <b>{calcPoints(scores[currentHole], courseData[currentHole].par, courseData[currentHole].si)}</b></div>
                <div>TOTAL: <b>{runningTotal}</b></div>
            </div>
          </div>
          <div style={{ padding: '10px 10px 40px 10px', display: 'flex', gap: '5px' }}>
            <button onClick={() => setCurrentHole(Math.max(0, currentHole - 1))} style={{ flex: 1, padding: '15px', background: '#ccc' }}>BACK</button>
            {currentHole < 17 ? (
              <button onClick={() => setCurrentHole(currentHole + 1)} style={{ flex: 2, padding: '15px', background: '#C9A66B', color: 'white' }}>NEXT HOLE</button>
            ) : (
              <button onClick={() => setShowSummary(true)} style={{ flex: 2, padding: '15px', background: '#2563eb', color: 'white' }}>REVIEW</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}