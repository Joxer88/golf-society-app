import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. DATA (Foundation) - Now safely outside the app
const course = [
  { par: 4, si: 7 }, { par: 5, si: 1 }, { par: 3, si: 15 }, { par: 4, si: 9 }, { par: 4, si: 3 }, { par: 4, si: 11 },
  { par: 5, si: 5 }, { par: 3, si: 17 }, { par: 4, si: 13 }, { par: 4, si: 8 }, { par: 4, si: 2 }, { par: 3, si: 16 },
  { par: 5, si: 10 }, { par: 4, si: 4 }, { par: 4, si: 12 }, { par: 4, si: 6 }, { par: 3, si: 18 }, { par: 5, si: 14 }
];

// 2. DATABASE CONNECTION
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

// 3. THE APP (Logic & Design)
const GolfApp = () => {
  const [player] = useState({ name: "MARK KENNEDY", handicap: 14 });
  const [verifierName, setVerifierName] = useState("");
  const [currentHole, setCurrentHole] = useState(0);
  
  // This line now uses the 'course' data correctly to default to Par
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
    const { error } = await supabase.from('rounds').insert([{ 
        player_name: player.name, handicap: player.handicap, total_points: totalPoints, verifier: verifierName, scores: scores 
    }]);
    if (!error) { alert("Round Submitted Successfully!"); window.location.reload(); }
    else { alert("Error: " + error.message); }
  };

  if (showSummary) {
    return (
      <div className="min-h-screen bg-[#1A4D3A] text-white p-4 flex flex-col items-center">
        <div className="w-full max-w-md bg-white text-gray-900 rounded-[3rem] p-8 shadow-2xl mt-4">
          <h1 className="text-xl font-black text-center text-[#1A4D3A] mb-4 uppercase underline">Summary</h1>
          <div className="max-h-[40vh] overflow-y-auto mb-6 border-b-4">
            {course.map((h, i) => (
              <div key={i} className="flex justify-between py-4 border-b-2 text-3xl font-black">
                <span className="text-gray-400">H{i+1}</span> <span>{scores[i]}</span>
                <span className="text-green-700">{calcHolePoints(scores[i], h.par, h.si)} pts</span>
              </div>
            ))}
          </div>
          <div className="bg-gray-100 p-4 rounded-2xl mb-4 text-center">
             <p className="text-sm font-bold text-gray-500 uppercase">Total Stableford</p>
             <p className="text-6xl font-black text-[#1A4D3A]">{totalPoints}</p>
          </div>
          <input type="text" placeholder="MARKER NAME" className="w-full p-6 border-4 rounded-2xl text-3xl font-black text-center mb-4 uppercase" value={verifierName} onChange={(e)=>setVerifierName(e.target.value)} />
          <button onClick={handleSubmit} className="w-full bg-green-600 text-white py-8 rounded-3xl text-4xl font-black uppercase mb-4">SUBMIT</button>
          <button onClick={() => setShowSummary(false)} className="w-full text-red-500 text-2xl font-black italic">← EDIT SCORES</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A4D3A] text-white flex flex-col items-center p-4">
      <h1 className="text-xl font-bold text-[#C9A66B] mb-4 uppercase tracking-tighter">Egan's Golf Society</h1>
      
      <div className="w-full max-w-md bg-white/10 p-8 rounded-[2.5rem] border-2 border-white/20 mb-4 flex justify-between items-center">
        <div><p className="text-sm font-bold text-[#C9A66B]">PLAYER</p><p className="text-4xl font-black uppercase">{player.name}</p></div>
        <div className="text-right"><p className="text-sm font-bold text-[#C9A66B]">HCP</p><p className="text-7xl font-black">{player.handicap}</p></div>
      </div>

      <div className="w-full max-w-sm bg-white text-gray-900 rounded-[4rem] shadow-2xl p-8">
        <div className="grid grid-cols-3 gap-4 text-center bg-gray-50 rounded-[2rem] p-6 mb-4">
          <div><p className="text-sm font-black text-gray-400">Hole</p><p className="text-6xl font-black">{currentHole + 1}</p></div>
          <div><p className="text-sm font-black text-gray-400">Par</p><p className="text-6xl font-black">{course[currentHole].par}</p></div>
          <div><p className="text-sm font-black text-gray-400">SI</p><p className="text-6xl font-black">{course[currentHole].si}</p></div>
        </div>

        <div className="flex flex-col items-center py-2">
          <p className="text-lg font-black text-gray-300 uppercase">Strokes</p>
          <div className="flex items-center justify-between w-full">
            <button onClick={() => updateScore(-1)} className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-white text-7xl font-bold shadow-lg active:scale-95">—</button>
            <span className="text-[10rem] font-black text-green-900 leading-none">{scores[currentHole]}</span>
            <button onClick={() => updateScore(1)} className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white text-7xl font-bold shadow-lg active:scale-95">+</button>
          </div>
        </div>

        <div className="flex justify-between items-center bg-green-50 p-6 rounded-[2.5rem] border-2 border-green-100">
          <div className="text-center flex-1">
            <p className="text-sm font-black text-green-600">HOLE PTS</p>
            <p className="text-6xl font-black">{calcHolePoints(scores[currentHole], course[currentHole].par, course[currentHole].si)}</p>
          </div>
          <div className="w-1 h-16 bg-green-200 mx-4"></div>
          <div className="text-center flex-1">
            <p className="text-sm font-black text-green-600">TOTAL</p>
            <p className="text-6xl font-black">{totalPoints}</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 w-full max-w-md flex gap-4 px-6">
        <button onClick={() => setCurrentHole(Math.max(0, currentHole - 1))} className={`flex-1 bg-white/10 py-8 rounded-2xl text-2xl font-black ${currentHole === 0 ? 'invisible' : ''}`}>BACK</button>
        {currentHole < 17 ? (
          <button onClick={() => setCurrentHole(currentHole + 1)} className="flex-[2] bg-[#C9A66B] py-8 rounded-2xl text-white text-3xl font-black uppercase shadow-2xl">NEXT HOLE</button>
        ) : (
          <button onClick={() => setShowSummary(true)} className="flex-[2] bg-blue-600 py-8 rounded-2xl text-white text-3xl font-black uppercase shadow-2xl">REVIEW</button>
        )}
      </div>
    </div>
  );
};

export default GolfApp;