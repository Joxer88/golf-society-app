import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

const GolfApp = () => {
  const [player] = useState({ name: "MARK KENNEDY", handicap: 14 });
  const [verifierName, setVerifierName] = useState("");
  const [currentHole, setCurrentHole] = useState(0);
  const [scores, setScores] = useState(course.map(hole => hole.par));
  const [showSummary, setShowSummary] = useState(false);
  
  const course = [
    { par: 4, si: 7 }, { par: 5, si: 1 }, { par: 3, si: 15 }, { par: 4, si: 9 }, { par: 4, si: 3 }, { par: 4, si: 11 },
    { par: 5, si: 5 }, { par: 3, si: 17 }, { par: 4, si: 13 }, { par: 4, si: 8 }, { par: 4, si: 2 }, { par: 3, si: 16 },
    { par: 5, si: 10 }, { par: 4, si: 4 }, { par: 4, si: 12 }, { par: 4, si: 6 }, { par: 3, si: 18 }, { par: 5, si: 14 }
  ];

  const calcHolePoints = (s, p, si) => {
    if (!s) return 0;
    const pops = Math.floor(player.handicap / 18) + (player.handicap % 18 >= si ? 1 : 0);
    return Math.max(0, p - (s - pops) + 2);
  };

  const updateScore = (val) => {
    const newScores = [...scores];
    const currentVal = newScores[currentHole] || course[currentHole].par;
    newScores[currentHole] = Math.max(1, currentVal + val);
    setScores(newScores);
  };

  const totalPoints = scores.reduce((acc, s, i) => acc + calcHolePoints(s, course[i].par, course[i].si), 0);

  const handleSubmit = async () => {
    if (!verifierName) return alert("Marker must sign!");
    const { error } = await supabase.from('rounds').insert([{ 
        player_name: player.name, total_points: totalPoints, verifier: verifierName, scores: scores 
    }]);
    if (!error) { alert("Submitted!"); window.location.reload(); }
  };

  if (showSummary) {
    return (
      <div className="min-h-screen bg-[#1A4D3A] text-white p-4 flex flex-col items-center">
        <div className="w-full max-w-md bg-white text-gray-900 rounded-[3rem] p-8 shadow-2xl mt-4">
          <h1 className="text-xl font-black text-center text-[#1A4D3A] mb-4 uppercase">Egan's Golf Society</h1>
          <div className="max-h-[40vh] overflow-y-auto mb-6 border-b-4">
            {course.map((h, i) => (
              <div key={i} className="flex justify-between py-4 border-b-2 text-3xl font-black">
                <span className="text-gray-400">H{i+1}</span> <span>{scores[i] || '-'}</span>
                <span className="text-green-700">{calcHolePoints(scores[i], h.par, h.si)} pts</span>
              </div>
            ))}
          </div>
          <input type="text" placeholder="MARKER NAME" className="w-full p-6 border-4 rounded-2xl text-3xl font-black text-center mb-4 uppercase" value={verifierName} onChange={(e)=>setVerifierName(e.target.value)} />
          <button onClick={handleSubmit} className="w-full bg-green-600 text-white py-8 rounded-3xl text-4xl font-black uppercase mb-4 shadow-xl">Confirm & Submit</button>
          <button onClick={() => setShowSummary(false)} className="w-full text-red-500 text-2xl font-black italic">← CORRECT SCORES</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A4D3A] text-white flex flex-col items-center p-4">
      <h1 className="text-xl font-serif text-[#C9A66B] font-bold mb-4 uppercase tracking-widest">Egan's Golf Society</h1>
      
      {/* RED CIRCLE: JUMBO HEADER */}
      <div className="w-full max-w-md bg-white/10 p-8 rounded-[2.5rem] border-2 border-white/20 mb-4 flex justify-between items-center">
        <div><p className="text-sm font-bold text-[#C9A66B]">PLAYER</p><p className="text-4xl font-black uppercase">{player.name}</p></div>
        <div className="text-right"><p className="text-sm font-bold text-[#C9A66B]">HCP</p><p className="text-7xl font-black">{player.handicap}</p></div>
      </div>

      <div className="w-full max-w-sm bg-white text-gray-900 rounded-[4rem] shadow-2xl p-8">
        {/* RED CIRCLE: JUMBO HOLE INFO */}
        <div className="grid grid-cols-3 gap-4 text-center bg-gray-50 rounded-[2rem] p-6 mb-4">
          <div><p className="text-sm font-black text-gray-400 uppercase">Hole</p><p className="text-6xl font-black">{currentHole + 1}</p></div>
          <div><p className="text-sm font-black text-gray-400 uppercase">Par</p><p className="text-6xl font-black">{course[currentHole].par}</p></div>
          <div><p className="text-sm font-black text-gray-400 uppercase">SI</p><p className="text-6xl font-black">{course[currentHole].si}</p></div>
        </div>

        {/* BLUE CIRCLE: REDUCED STROKES + GREEN CIRCLE: COLORED BUTTONS */}
        <div className="flex flex-col items-center py-2">
          <p className="text-lg font-black text-gray-300 uppercase">Strokes</p>
          <div className="flex items-center justify-between w-full">
            <button onClick={() => updateScore(-1)} className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-white text-7xl font-bold shadow-lg">—</button>
            <span className="text-[10rem] font-black text-green-900 leading-none">{scores[currentHole] || course[currentHole].par}</span>
            <button onClick={() => updateScore(1)} className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white text-7xl font-bold shadow-lg">+</button>
          </div>
        </div>

        {/* RED CIRCLE: JUMBO POINTS */}
        <div className="flex justify-between items-center bg-green-50 p-6 rounded-[2.5rem] border-2 border-green-100">
          <div className="text-center flex-1">
            <p className="text-sm font-black text-green-600">HOLE PTS</p>
            <p className="text-6xl font-black">{calcHolePoints(scores[currentHole] || course[currentHole].par, course[currentHole].par, course[currentHole].si)}</p>
          </div>
          <div className="w-1 h-16 bg-green-200 mx-4"></div>
          <div className="text-center flex-1">
            <p className="text-sm font-black text-green-600">TOTAL</p>
            <p className="text-6xl font-black">{totalPoints}</p>
          </div>
        </div>
      </div>

      {/* BLUE CIRCLE: COMPACT NAV */}
      <div className="fixed bottom-6 w-full max-w-md flex gap-4 px-6">
        <button onClick={() => setCurrentHole(Math.max(0, currentHole - 1))} className={`flex-1 bg-white/10 py-8 rounded-2xl text-2xl font-black ${currentHole === 0 ? 'invisible' : ''}`}>BACK</button>
        {currentHole < 17 ? (
          <button onClick={() => setCurrentHole(currentHole + 1)} className="flex-[2] bg-[#C9A66B] py-8 rounded-2xl text-white text-3xl font-black uppercase shadow-2xl">NEXT</button>
        ) : (
          <button onClick={() => setShowSummary(true)} className="flex-[2] bg-green-600 py-8 rounded-2xl text-white text-3xl font-black uppercase shadow-2xl">REVIEW</button>
        )}
      </div>
    </div>
  );
};

export default GolfApp;