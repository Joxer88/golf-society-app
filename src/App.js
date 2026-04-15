import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const course = [
  { par: 4, si: 7 }, { par: 5, si: 1 }, { par: 3, si: 15 }, { par: 4, si: 9 }, { par: 4, si: 3 }, { par: 4, si: 11 },
  { par: 5, si: 5 }, { par: 3, si: 17 }, { par: 4, si: 13 }, { par: 4, si: 8 }, { par: 4, si: 2 }, { par: 3, si: 16 },
  { par: 5, si: 10 }, { par: 4, si: 4 }, { par: 4, si: 12 }, { par: 4, si: 6 }, { par: 3, si: 18 }, { par: 5, si: 14 }
];

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL || '', process.env.REACT_APP_SUPABASE_ANON_KEY || '');

const GolfApp = () => {
  const [player] = useState({ name: "MARK KENNEDY", handicap: 14 });
  const [verifierName, setVerifierName] = useState("");
  const [currentHole, setCurrentHole] = useState(0);
  const [scores, setScores] = useState(course.map(h => h.par));
  const [showSummary, setShowSummary] = useState(false);

  const calcHolePoints = (s, p, si) => {
    const pops = Math.floor(player.handicap / 18) + (player.handicap % 18 >= si ? 1 : 0);
    return Math.max(0, p - (s - pops) + 2);
  };

  const updateScore = (val) => {
    const newScores = [...scores];
    newScores[currentHole] = Math.max(1, newScores[currentHole] + val);
    setScores(newScores);
  };

  const totalPoints = scores.reduce((acc, s, i) => acc + calcHolePoints(s, course[i].par, course[i].si), 0);

  const handleSubmit = async () => {
    if (!verifierName) return alert("Marker must sign!");
    await supabase.from('rounds').insert([{ player_name: player.name, handicap: player.handicap, total_points: totalPoints, verifier: verifierName, scores: scores }]);
    window.location.reload();
  };

  if (showSummary) {
    return (
      <div style={{ height: '100vh', backgroundColor: '#1A4D3A', color: 'white', padding: '5px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, backgroundColor: 'white', color: '#111', borderRadius: '15px', padding: '10px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h2 style={{ textAlign: 'center', margin: '0', fontSize: '20px', fontWeight: '900' }}>SUMMARY</h2>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {course.map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee', fontWeight: '900', fontSize: '22px' }}>
                <span style={{ color: '#bbb' }}>H{i+1}</span> <span>{scores[i]}</span>
                <span style={{ color: '#1A4D3A' }}>{calcHolePoints(scores[i], h.par, h.si)}pts</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', borderTop: '4px solid #1A4D3A', paddingTop: '5px' }}>
            <p style={{ fontSize: '10px', margin: 0 }}>TOTAL</p>
            <p style={{ fontSize: '50px', fontWeight: '900', lineHeight: '1', margin: '0 0 5px 0' }}>{totalPoints}</p>
          </div>
          <input type="text" placeholder="MARKER NAME" style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '3px solid #ddd', textAlign: 'center', fontSize: '24px', marginBottom: '5px' }} value={verifierName} onChange={(e)=>setVerifierName(e.target.value.toUpperCase())} />
          <button onClick={handleSubmit} style={{ width: '100%', backgroundColor: '#16a34a', color: 'white', padding: '20px', borderRadius: '10px', fontSize: '28px', fontWeight: '900', border: 'none' }}>SUBMIT</button>
          <button onClick={() => setShowSummary(false)} style={{ width: '100%', color: '#ef4444', background: 'none', border: 'none', fontWeight: 'bold', padding: '10px' }}>← EDIT</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', backgroundColor: '#1A4D3A', color: 'white', padding: '5px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      {/* Tiny Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '5px 10px', opacity: 0.8 }}>
        <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0 }}>{player.name}</p>
        <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0 }}>HCP: {player.handicap}</p>
      </div>

      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', color: '#333', borderRadius: '25px', padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginBottom: '75px' }}>
        
        {/* LARGE Hole Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', backgroundColor: '#f0f0f0', borderRadius: '15px', padding: '5px' }}>
          <div><p style={{ fontSize: '10px', margin: 0 }}>HOLE</p><p style={{ fontSize: '45px', fontWeight: '900', lineHeight: 1, margin: 0 }}>{currentHole + 1}</p></div>
          <div><p style={{ fontSize: '10px', margin: 0 }}>PAR</p><p style={{ fontSize: '45px', fontWeight: '900', lineHeight: 1, margin: 0 }}>{course[currentHole].par}</p></div>
          <div><p style={{ fontSize: '10px', margin: 0 }}>S.I.</p><p style={{ fontSize: '45px', fontWeight: '900', lineHeight: 1, margin: 0 }}>{course[currentHole].si}</p></div>
        </div>

        {/* JUMBO Strokes */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }}>
            <button onClick={() => updateScore(-1)} style={{ width: '70px', height: '70px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', fontSize: '40px', fontWeight: 'bold', border: 'none' }}>—</button>
            <span style={{ fontSize: '130px', fontWeight: '900', color: '#1A4D3A', lineHeight: 1 }}>{scores[currentHole]}</span>
            <button onClick={() => updateScore(1)} style={{ width: '70px', height: '70px', backgroundColor: '#22c55e', color: 'white', borderRadius: '50%', fontSize: '40px', fontWeight: 'bold', border: 'none' }}>+</button>
          </div>
        </div>

        {/* LARGE Points */}
        <div style={{ display: 'flex', justifyContent: 'space-around', backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '15px' }}>
          <div style={{ textAlign: 'center' }}><p style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold', margin: 0 }}>HOLE PTS</p><p style={{ fontSize: '45px', fontWeight: '900', lineHeight: 1, margin: 0 }}>{calcHolePoints(scores[currentHole], course[currentHole].par, course[currentHole].si)}</p></div>
          <div style={{ textAlign: 'center' }}><p style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold', margin: 0 }}>TOTAL</p><p style={{ fontSize: '45px', fontWeight: '900', lineHeight: 1, margin: 0 }}>{totalPoints}</p></div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: '10px', width: '95%', display: 'flex', gap: '10px' }}>
        <button onClick={() => setCurrentHole(Math.max(0, currentHole - 1))} style={{ flex: 1, padding: '20px', borderRadius: '15px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '20px', fontWeight: 'bold', border: '1px solid white', visibility: currentHole === 0 ? 'hidden' : 'visible' }}>BACK</button>
        {currentHole < 17 ? (
          <button onClick={() => setCurrentHole(currentHole + 1)} style={{ flex: 2, padding: '20px', borderRadius: '15px', backgroundColor: '#C9A66B', color: 'white', fontSize: '25px', fontWeight: '900', border: 'none' }}>NEXT HOLE</button>
        ) : (
          <button onClick={() => setShowSummary(true)} style={{ flex: 2, padding: '20px', borderRadius: '15px', backgroundColor: '#2563eb', color: 'white', fontSize: '25px', fontWeight: '900', border: 'none' }}>REVIEW</button>
        )}
      </div>
    </div>
  );
};

export default GolfApp;