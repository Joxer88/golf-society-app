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
      <div style={{ height: '100vh', backgroundColor: '#1A4D3A', color: 'white', padding: '2px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, backgroundColor: 'white', color: '#111', borderRadius: '10px', padding: '5px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h2 style={{ textAlign: 'center', margin: '0', fontSize: '24px', fontWeight: '900' }}>SUMMARY</h2>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {course.map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #eee', fontWeight: '900', fontSize: '26px' }}>
                <span style={{ color: '#bbb' }}>H{i+1}</span> <span>{scores[i]}</span>
                <span style={{ color: '#1A4D3A' }}>{calcHolePoints(scores[i], h.par, h.si)}p</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', borderTop: '4px solid #1A4D3A' }}>
            <p style={{ fontSize: '55px', fontWeight: '900', margin: '0' }}>TOTAL: {totalPoints}</p>
          </div>
          <input type="text" placeholder="MARKER NAME" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '3px solid #ddd', textAlign: 'center', fontSize: '24px', marginBottom: '4px' }} value={verifierName} onChange={(e)=>setVerifierName(e.target.value.toUpperCase())} />
          <button onClick={handleSubmit} style={{ width: '100%', backgroundColor: '#16a34a', color: 'white', padding: '15px', borderRadius: '8px', fontSize: '28px', fontWeight: '900', border: 'none' }}>SUBMIT</button>
          <button onClick={() => setShowSummary(false)} style={{ width: '100%', color: '#ef4444', background: 'none', border: 'none', fontWeight: 'bold', padding: '5px' }}>← EDIT</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', backgroundColor: '#1A4D3A', color: 'white', padding: '0px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      
      {/* Header - Doubled Size as requested (approx 44px) */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '6px 15px', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <p style={{ fontSize: '44px', fontWeight: '900', margin: 0, lineHeight: 1 }}>{player.name}</p>
        <p style={{ fontSize: '44px', fontWeight: '900', margin: 0, lineHeight: 1 }}>{player.handicap}</p>
      </div>

      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: 'white', color: '#333', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', overflow: 'hidden' }}>
        
        {/* Hole Info Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', backgroundColor: '#eee', padding: '2px 0' }}>
          <div><p style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: '#666' }}>HOLE</p><p style={{ fontSize: '85px', fontWeight: '900', lineHeight: 0.8, margin: 0 }}>{currentHole + 1}</p></div>
          <div><p style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: '#666' }}>PAR</p><p style={{ fontSize: '85px', fontWeight: '900', lineHeight: 0.8, margin: 0 }}>{course[currentHole].par}</p></div>
          <div><p style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: '#666' }}>S.I.</p><p style={{ fontSize: '85px', fontWeight: '900', lineHeight: 0.8, margin: 0 }}>{course[currentHole].si}</p></div>
        </div>

        {/* Main Input Section */}
        <div style={{ textAlign: 'center', padding: '5px 0' }}>
          <p style={{ fontSize: '24px', fontWeight: '900', color: '#999', margin: '0 0 5px 0' }}>STROKES TAKEN</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <button onClick={() => updateScore(-1)} style={{ width: '90px', height: '90px', backgroundColor: '#ef4444', color: 'white', borderRadius: '15px', fontSize: '70px', fontWeight: 'bold', border: 'none' }}>—</button>
            <span style={{ fontSize: '180px', fontWeight: '900', color: '#1A4D3A', lineHeight: 0.75 }}>{scores[currentHole]}</span>
            <button onClick={() => updateScore(1)} style={{ width: '90px', height: '90px', backgroundColor: '#22c55e', color: 'white', borderRadius: '15px', fontSize: '70px', fontWeight: 'bold', border: 'none' }}>+</button>
          </div>
        </div>

        {/* Points Display - "PTS" label added */}
        <div style={{ display: 'flex', justifyContent: 'space-around', backgroundColor: '#e8f5e9', padding: '2px 0' }}>
          <div style={{ textAlign: 'center' }}><p style={{ fontSize: '22px', color: '#16a34a', fontWeight: '900', margin: 0 }}>PTS</p><p style={{ fontSize: '85px', fontWeight: '900', lineHeight: 0.8, margin: 0 }}>{calcHolePoints(scores[currentHole], course[currentHole].par, course[currentHole].si)}</p></div>
          <div style={{ borderLeft: '4px solid #c8e6c9' }}></div>
          <div style={{ textAlign: 'center' }}><p style={{ fontSize: '22px', color: '#16a34a', fontWeight: '900', margin: 0 }}>TOTAL</p><p style={{ fontSize: '85px', fontWeight: '900', lineHeight: 0.8, margin: 0 }}>{totalPoints}</p></div>
        </div>

        {/* Navigation - Shorter height, lifted slightly */}
        <div style={{ marginTop: 'auto', display: 'flex', gap: '4px', padding: '2px 4px 15px 4px' }}>
          <button onClick={() => setCurrentHole(Math.max(0, currentHole - 1))} style={{ flex: 1, padding: '15px 0', backgroundColor: '#666', color: 'white', fontSize: '24px', fontWeight: 'bold', border: 'none', borderRadius: '10px', visibility: currentHole === 0 ? 'hidden' : 'visible' }}>BACK</button>
          {currentHole < 17 ? (
            <button onClick={() => setCurrentHole(currentHole + 1)} style={{ flex: 2, padding: '15px 0', backgroundColor: '#C9A66B', color: 'white', fontSize: '32px', fontWeight: '900', border: 'none', borderRadius: '10px' }}>NEXT HOLE</button>
          ) : (
            <button onClick={() => setShowSummary(true)} style={{ flex: 2, padding: '15px 0', backgroundColor: '#2563eb', color: 'white', fontSize: '32px', fontWeight: '900', border: 'none', borderRadius: '10px' }}>REVIEW</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GolfApp;