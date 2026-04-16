import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL || '', process.env.REACT_APP_SUPABASE_ANON_KEY || '');

// --- ADMIN SETTINGS ---
const compSettings = {
  courseName: "CO. LONGFORD GOLF CLUB",
  date: "2026-04-16", // ISO Format YYYY-MM-DD
  firstTeeTime: "10:00", // 24hr format
  adminCode: "999"      // Master override
};

const course = [
  { par: 4, si: 7 }, { par: 5, si: 1 }, { par: 3, si: 15 }, { par: 4, si: 9 }, { par: 4, si: 3 }, { par: 4, si: 11 },
  { par: 5, si: 5 }, { par: 3, si: 17 }, { par: 4, si: 13 }, { par: 4, si: 8 }, { par: 4, si: 2 }, { par: 3, si: 16 },
  { par: 5, si: 10 }, { par: 4, si: 4 }, { par: 4, si: 12 }, { par: 4, si: 6 }, { par: 3, si: 18 }, { par: 5, si: 14 }
];

const GolfApp = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginCode, setLoginCode] = useState("");
  const [player, setPlayer] = useState({ name: "", handicap: 0 });
  
  // Scoring State
  const [currentHole, setCurrentHole] = useState(0);
  const [scores, setScores] = useState(course.map(h => h.par));
  const [showSummary, setShowSummary] = useState(false);
  const [verifierName, setVerifierName] = useState("");

  const checkAccessTime = () => {
    const now = new Date();
    const compDate = new Date(`${compSettings.date}T${compSettings.firstTeeTime}`);
    
    // Window: 1 hour before first tee to 10 hours after (Adjusted from 5hr post-last-tee for safety)
    const startTime = new Date(compDate.getTime() - (60 * 60 * 1000)); 
    const endTime = new Date(compDate.getTime() + (10 * 60 * 60 * 1000));

    return now >= startTime && now <= endTime;
  };

  const handleLogin = async () => {
    // 1. Admin Override
    if (loginCode === compSettings.adminCode) {
      setPlayer({ name: "ADMIN", handicap: 0 });
      setIsLoggedIn(true);
      return;
    }

    // 2. Check Time Constraint for regular users
    if (!checkAccessTime()) {
        alert("Access denied. Login is only available on the day of competition.");
        return;
    }

    // 3. Verify 3-Digit Code in Supabase
    const { data, error } = await supabase
      .from('users')
      .select('name, handicap')
      .eq('access_code', loginCode)
      .single();

    if (data) {
      setPlayer({ name: data.name, handicap: data.handicap });
      setIsLoggedIn(true);
    } else {
      alert("Invalid Code. Please see the Admin.");
    }
  };

  // Logic Helpers
  const calcHolePoints = (s, p, si) => {
    if (s === 0) return 0;
    const pops = Math.floor(player.handicap / 18) + (player.handicap % 18 >= si ? 1 : 0);
    return Math.max(0, p - (s - pops) + 2);
  };
  const updateScore = (val) => {
    const newScores = [...scores];
    newScores[currentHole] = Math.max(0, newScores[currentHole] + val);
    setScores(newScores);
  };
  const pickUp = () => {
    const newScores = [...scores];
    newScores[currentHole] = 0;
    setScores(newScores);
  };
  const runningTotal = scores.reduce((acc, s, i) => i <= currentHole ? acc + calcHolePoints(s, course[i].par, course[i].si) : acc, 0);
  const finalTotal = scores.reduce((acc, s, i) => acc + calcHolePoints(s, course[i].par, course[i].si), 0);

  const handleSubmit = async () => {
    if (!verifierName) return alert("Marker must sign!");
    await supabase.from('rounds').insert([{ player_name: player.name, handicap: player.handicap, total_points: finalTotal, verifier: verifierName, scores: scores }]);
    window.location.reload();
  };

  const containerStyle = {
    height: '100vh', width: '100%', maxWidth: '450px', margin: '0 auto', backgroundColor: '#1A4D3A', color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden'
  };

  // --- LOGIN SCREEN ---
  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: '#0e2b20', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={containerStyle}>
          <div style={{ padding: '40px 20px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ fontSize: '28px', color: '#C9A66B', marginBottom: '10px' }}>EGAN'S GOLF SOCIETY</h1>
            <h2 style={{ fontSize: '22px', margin: '0' }}>{compSettings.courseName}</h2>
            <p style={{ fontSize: '18px', color: '#C9A66B', marginBottom: '40px' }}>{compSettings.date}</p>
            
            <p style={{ fontSize: '14px', marginBottom: '10px' }}>ENTER YOUR 3-DIGIT CODE</p>
            <input 
              type="password" 
              inputMode="numeric"
              maxLength="3"
              value={loginCode}
              onChange={(e) => setLoginCode(e.target.value)}
              style={{ width: '100%', padding: '20px', fontSize: '40px', textAlign: 'center', borderRadius: '15px', border: 'none', color: '#1A4D3A', fontWeight: '900', marginBottom: '20px' }}
            />
            <button 
              onClick={handleLogin}
              style={{ width: '100%', padding: '20px', backgroundColor: '#C9A66B', color: 'white', fontSize: '24px', fontWeight: '900', border: 'none', borderRadius: '15px' }}
            >
              SIGN IN
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- SCORECARD SCREENS (Existing Logic) ---
  if (showSummary) {
    return (
      <div style={{ backgroundColor: '#0e2b20', minHeight: '100vh' }}>
        <div style={containerStyle}>
            <div style={{ flex: 1, backgroundColor: 'white', color: '#111', borderRadius: '10px', padding: '5px', display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: '2px' }}>
            <h2 style={{ textAlign: 'center', margin: '0', fontSize: '24px', fontWeight: '900' }}>SUMMARY</h2>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {course.map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #eee', fontWeight: '900', fontSize: '26px' }}>
                    <span style={{ color: '#bbb' }}>H{i+1}</span> <span>{scores[i] === 0 ? 'PU' : scores[i]}</span>
                    <span style={{ color: '#1A4D3A' }}>{calcHolePoints(scores[i], h.par, h.si)}p</span>
                </div>
                ))}
            </div>
            <div style={{ textAlign: 'center', borderTop: '4px solid #1A4D3A' }}>
                <p style={{ fontSize: '55px', fontWeight: '900', margin: '0' }}>TOTAL: {finalTotal}</p>
            </div>
            <input type="text" placeholder="MARKER NAME" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '3px solid #ddd', textAlign: 'center', fontSize: '24px', marginBottom: '4px' }} value={verifierName} onChange={(e)=>setVerifierName(e.target.value.toUpperCase())} />
            <button onClick={handleSubmit} style={{ width: '100%', backgroundColor: '#16a34a', color: 'white', padding: '15px', borderRadius: '8px', fontSize: '28px', fontWeight: '900', border: 'none' }}>SUBMIT</button>
            <button onClick={() => setShowSummary(false)} style={{ width: '100%', color: '#ef4444', background: 'none', border: 'none', fontWeight: 'bold', padding: '5px' }}>← EDIT</button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0e2b20', minHeight: '100vh' }}>
        <div style={containerStyle}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '6px 15px', backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center' }}>
                <p style={{ fontSize: '32px', fontWeight: '900', margin: 0, lineHeight: 1 }}>{player.name}</p>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', fontWeight: '900', margin: 0, color: '#C9A66B', lineHeight: 1 }}>HANDICAP</p>
                    <p style={{ fontSize: '44px', fontWeight: '900', margin: 0, lineHeight: 1 }}>{player.handicap}</p>
                </div>
            </div>

            <div style={{ width: '100%', backgroundColor: 'white', color: '#333', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', backgroundColor: '#eee', padding: '2px 0' }}>
                    <div><p style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: '#666' }}>HOLE</p><p style={{ fontSize: '85px', fontWeight: '900', lineHeight: 0.8, margin: 0 }}>{currentHole + 1}</p></div>
                    <div><p style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: '#666' }}>PAR</p><p style={{ fontSize: '85px', fontWeight: '900', lineHeight: 0.8, margin: 0 }}>{course[currentHole].par}</p></div>
                    <div><p style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: '#666' }}>S.I.</p><p style={{ fontSize: '85px', fontWeight: '900', lineHeight: 0.8, margin: 0 }}>{course[currentHole].si}</p></div>
                </div>

                <div style={{ textAlign: 'center', padding: '5px 0' }}>
                    <p style={{ fontSize: '24px', fontWeight: '900', color: '#999', margin: '0 0 5px 0' }}>STROKES TAKEN</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                        <button onClick={() => updateScore(-1)} style={{ width: '90px', height: '90px', backgroundColor: '#ef4444', color: 'white', borderRadius: '15px', fontSize: '70px', fontWeight: 'bold', border: 'none' }}>—</button>
                        <span style={{ fontSize: '180px', fontWeight: '900', color: '#1A4D3A', lineHeight: 0.75 }}>{scores[currentHole] === 0 ? "X" : scores[currentHole]}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <button onClick={pickUp} style={{ width: '90px', height: '50px', backgroundColor: '#666', color: 'white', borderRadius: '10px', fontSize: '30px', fontWeight: '900', border: 'none' }}>PU</button>
                            <button onClick={() => updateScore(1)} style={{ width: '90px', height: '90px', backgroundColor: '#22c55e', color: 'white', borderRadius: '15px', fontSize: '70px', fontWeight: 'bold', border: 'none' }}>+</button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', backgroundColor: '#e8f5e9', padding: '2px 0' }}>
                    <div style={{ textAlign: 'center' }}><p style={{ fontSize: '22px', color: '#16a34a', fontWeight: '900', margin: 0 }}>PTS</p><p style={{ fontSize: '85px', fontWeight: '900', lineHeight: 0.8, margin: 0 }}>{calcHolePoints(scores[currentHole], course[currentHole].par, course[currentHole].si)}</p></div>
                    <div style={{ borderLeft: '4px solid #c8e6c9' }}></div>
                    <div style={{ textAlign: 'center' }}><p style={{ fontSize: '22px', color: '#16a34a', fontWeight: '900', margin: 0 }}>TOTAL</p><p style={{ fontSize: '85px', fontWeight: '900', lineHeight: 0.8, margin: 0 }}>{runningTotal}</p></div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '4px', padding: '2px 4px 45px 4px' }}>
                    <button onClick={() => setCurrentHole(Math.max(0, currentHole - 1))} style={{ flex: 1, padding: '10px 0', backgroundColor: '#666', color: 'white', fontSize: '24px', fontWeight: 'bold', border: 'none', borderRadius: '10px', visibility: currentHole === 0 ? 'hidden' : 'visible' }}>BACK</button>
                    {currentHole < 17 ? (
                        <button onClick={() => setCurrentHole(currentHole + 1)} style={{ flex: 2, padding: '10px 0', backgroundColor: '#C9A66B', color: 'white', fontSize: '32px', fontWeight: '900', border: 'none', borderRadius: '10px' }}>NEXT HOLE</button>
                    ) : (
                        <button onClick={() => setShowSummary(true)} style={{ flex: 2, padding: '10px 0', backgroundColor: '#2563eb', color: 'white', fontSize: '32px', fontWeight: '900', border: 'none', borderRadius: '10px' }}>REVIEW</button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default GolfApp;