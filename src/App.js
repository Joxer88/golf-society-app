import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const calculatePoints = (strokes, par, si, handicap) => {
  if (!strokes || strokes === 0) return 0;
  const pops = Math.floor(handicap / 18) + (handicap % 18 >= si ? 1 : 0);
  const netScore = strokes - pops;
  return Math.max(0, par - netScore + 2);
};

const GolfApp = () => {
  const [player] = useState({ name: "MARK KENNEDY", handicap: 14 });
  const [verifierName, setVerifierName] = useState("");
  const [currentHole, setCurrentHole] = useState(0);
  const [scores, setScores] = useState(new Array(18).fill(0));
  const [showSummary, setShowSummary] = useState(false);
  
  const course = [
    { par: 4, si: 7 }, { par: 5, si: 1 }, { par: 3, si: 15 },
    { par: 4, si: 9 }, { par: 4, si: 3 }, { par: 4, si: 11 },
    { par: 5, si: 5 }, { par: 3, si: 17 }, { par: 4, si: 13 },
    { par: 4, si: 8 }, { par: 4, si: 2 }, { par: 3, si: 16 },
    { par: 5, si: 10 }, { par: 4, si: 4 }, { par: 4, si: 12 },
    { par: 4, si: 6 }, { par: 3, si: 18 }, { par: 5, si: 14 }
  ];

  const updateScore = (val) => {
    const newScores = [...scores];
    const currentVal = newScores[currentHole] || course[currentHole].par;
    newScores[currentHole] = Math.max(1, currentVal + val);
    setScores(newScores);
  };

  const getAccumulatedPoints = (limitIndex) => {
    return scores.slice(0, limitIndex + 1).reduce((acc, s, i) => 
      acc + calculatePoints(s || course[i].par, course[i].par, course[i].si, player.handicap), 0);
  };

  const finalTotalPoints = getAccumulatedPoints(17);

  const handleFinalSubmit = async () => {
    if (!verifierName) {
      alert("Please have the Marker sign their name on this screen before you can submit.");
      return;
    }
    const { error } = await supabase.from('rounds').insert([{ 
      player_name: player.name, 
      handicap: player.handicap,
      total_points: finalTotalPoints, 
      verifier: verifierName, 
      scores: scores 
    }]);
    if (error) alert("Error: " + error.message);
    else {
      alert("Round submitted!");
      window.location.reload();
    }
  };

  if (showSummary) {
    return (
      <div className="min-h-screen bg-[#1A4D3A] text-white p-4 flex flex-col items-center">
        <div className="w-full max-w-md bg-white text-gray-900 rounded-[3rem] p-8 shadow-2xl mt-4">
          <h1 className="text-xl font-bold text-center text-[#1A4D3A] mb-4">EGAN'S GOLF SOCIETY</h1>
          <div className="max-h-[40vh] overflow-y-auto mb-6 border-b-2">
            {course.map((hole, i) => (
              <div key={i} className="flex justify-between py-4 border-b text-2xl font-black">
                <span>Hole {i + 1}</span>
                <span>{scores[i] || '-'}</span>
                <span className="text-green-700">{calculatePoints(scores[i], hole.par, hole.si, player.handicap)} pts</span>
              </div>
            ))}
          </div>
          <div className="bg-[#1A4D3A] text-white p-6 rounded-2xl text-center mb-6">
            <p className="text-7xl font-black">{finalTotalPoints} PTS</p>
          </div>
          <input 
            type="text" placeholder="MARKER NAME" 
            className="w-full p-4 border-4 rounded-xl text-2xl font-black text-center mb-4 uppercase"
            value={verifierName} onChange={(e) => setVerifierName(e.target.value)}
          />
          <button onClick={handleFinalSubmit} className="w-full bg-green-600 text-white py-6 rounded-2xl text-3xl font-black uppercase mb-4">SUBMIT</button>
          <button onClick={() => setShowSummary(false)} className="w-full text-red-500 font-bold">← EDIT SCORES</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A4D3A] text-white flex flex-col items-center p-4">
      <h1 className="text-lg font-bold text-[#C9A66B] mb-2">EGAN'S GOLF SOCIETY</h1>
      
      {/* Header (RED: BIGGER) */}
      <div className="w-full max-w-md bg-white/10 p-6 rounded-3xl border-2 border-white/20 mb-4 flex justify-between">
        <div><p className="text-xs opacity-60">PLAYER</p><p className="text-4xl font-black">{player.name}</p></div>
        <div className="text-right"><p className="text-xs opacity-60">HANDICAP</p><p className="text-6xl font-black">{player.handicap}</p></div>
      </div>

      <div className="w-full max-w-sm bg-white text-gray-900 rounded-[3rem] p-8 shadow-2xl">
        {/* Hole Info (RED: BIGGER) */}
        <div className="grid grid-cols-3 gap-2 text-center bg-gray-100 rounded-2xl p-4 mb-6">
          <div><p className="text-xs font-bold text-gray-400">HOLE</p><p className="text-6xl font-black">{currentHole + 1}</p></div>
          <div><p className="text-xs font-bold text-gray-400">PAR</p><p className="text-6xl font-black">{course[currentHole].par}</p></div>
          <div><p className="text-xs font-bold text-gray-400">SI</p><p className="text-6xl font-black">{course[currentHole].si}</p></div>
        </div>

        {/* Strokes (BLUE: REDUCED + GREEN: CIRCLES) */}
        <div className="flex flex-col items-center py-2">
          <p className="font-bold text-gray-400 uppercase">Strokes</p>
          <div className="flex items-center justify-between w-full">
            <button onClick={() => updateScore(-1)} className="w-20 h-20 bg-red-500 rounded-full text-white text-6xl font-bold flex items-center justify-center shadow-lg active:bg-red-700">—</button>
            <span className="text-[10rem] font-black text-green-900 leading-none">{scores[currentHole] || course[currentHole].par}</span>
            <button onClick={() => updateScore(1)} className="w-20 h-20 bg-green-500 rounded-full text-white text-6xl font-bold flex items-center justify-center shadow-lg active:bg-green-700">+</button>
          </div>
        </div>

        {/* Points (RED: BIGGER) */}
        <div className="flex justify-between bg-green-50 p-6 rounded-3xl border-2 border-green-100">
          <div className="text-center flex-1">
            <p className="text-xs font-bold text-green-600">HOLE PTS</p>
            <p className="text-6xl font-black">{calculatePoints(scores[currentHole] || course[currentHole].par, course[currentHole].par, course[currentHole].si, player.handicap)}</p>
          </div>
          <div className="w-px bg-green-200 mx-2"></div>
          <div className="text-center flex-1">
            <p className="text-xs font-bold text-green-600">ROUND TOTAL</p>
            <p className="text-6xl font-black">{getAccumulatedPoints(currentHole)}</p>
          </div>
        </div>
      </div>

      {/* Nav (BLUE: REDUCED) */}
      <div className="fixed bottom-6 w-full max-w-md flex gap-4 px-6">
        <button onClick={() => setCurrentHole(Math.max(0, currentHole - 1))} className={`flex-1 bg-white/10 py-6 rounded-2xl text-2xl font-black ${currentHole === 0 ? 'invisible' : ''}`}>BACK</button>
        {currentHole < 17 ? (
          <button onClick={() => setCurrentHole(currentHole + 1)} className="flex-[2] bg-[#C9A66B] py-6 rounded-2xl text-white text-3xl font-black shadow-xl">NEXT</button>
        ) : (
          <button onClick={() => setShowSummary(true)} className="flex-[2] bg-green-600 py-6 rounded-2xl text-white text-3xl font-black shadow-xl">REVIEW</button>
        )}
      </div>
    </div>
  );
};

export default GolfApp;