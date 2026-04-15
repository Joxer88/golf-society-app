import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import logo from './EGSlogo.jpg';

const calculatePoints = (strokes, par, si, handicap) => {
  if (!strokes || strokes === 0) return 0;
  const pops = Math.floor(handicap / 18) + (handicap % 18 >= si ? 1 : 0);
  const netScore = strokes - pops;
  return Math.max(0, par - netScore + 2);
};

const GolfApp = () => {
  const [player] = useState({ name: "ANDREAS DOLAN", handicap: 14 });
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

  // --- SUMMARY PAGE (WITH ATTESTER ENTRY) ---
  if (showSummary) {
    return (
      <div className="min-h-screen bg-[#1A4D3A] text-white p-4 flex flex-col items-center pb-10">
        <div className="w-full max-w-md bg-white text-gray-900 rounded-[3rem] p-8 shadow-2xl mt-4">
          <h1 className="text-2xl font-serif text-center text-[#1A4D3A] font-black mb-2 uppercase">EGAN'S GOLF SOCIETY</h1>
          <h2 className="text-4xl font-black text-center border-b-8 border-gray-100 pb-4 mb-6 uppercase tracking-tighter text-gray-400">Final Summary</h2>
          
          <div className="max-h-[40vh] overflow-y-auto mb-6 border-b-4 border-gray-100 rounded-xl">
            {course.map((hole, i) => (
              <div key={i} className={`flex justify-between items-center py-5 px-6 border-b ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <div className="text-3xl font-black text-gray-400">H{i + 1}</div>
                <div className="text-4xl font-black">{scores[i] || '-'}</div>
                <div className="text-4xl font-black text-green-700">{calculatePoints(scores[i], hole.par, hole.si, player.handicap)} <span className="text-sm">PTS</span></div>
              </div>
            ))}
          </div>

          <div className="bg-[#1A4D3A] text-white p-6 rounded-[2rem] text-center mb-6">
            <p className="text-lg font-bold uppercase opacity-60">Total Points</p>
            <p className="text-7xl font-black">{finalTotalPoints}</p>
          </div>

          {/* Attester Section - Now on this screen */}
          <div className="mb-8 px-4 text-center border-t-4 border-gray-100 pt-6">
            <p className="text-sm font-black text-gray-400 uppercase mb-3">Marker / Attester Name</p>
            <input 
              type="text" 
              placeholder="SIGN HERE" 
              className="w-full p-6 rounded-2xl border-4 border-gray-200 text-3xl font-black text-center uppercase focus:border-green-500 outline-none shadow-inner mb-4"
              value={verifierName}
              onChange={(e) => setVerifierName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => verifierName ? alert("Submitted to Society Leaderboard!") : alert("Marker must sign before submitting")} 
              className="w-full bg-green-600 text-white py-6 rounded-2xl text-3xl font-black uppercase shadow-xl active:bg-green-700"
            >
              Confirm & Submit
            </button>
            <button onClick={() => setShowSummary(false)} className="w-full bg-white border-4 border-red-500 text-red-500 py-6 rounded-2xl text-2xl font-black uppercase shadow-lg">← Edit Scores</button>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN SCORING PAGE ---
  return (
    <div className="min-h-screen bg-[#1A4D3A] text-white flex flex-col items-center p-4 font-sans pb-40">
      
      <h1 className="text-xl font-serif uppercase tracking-[0.2em] text-[#C9A66B] font-bold mb-4">Egan's Golf Society</h1>

      {/* Header Info (RED CIRCLE: INCREASED SIZE) */}
      <div className="w-full max-w-md bg-white/10 p-8 rounded-[2.5rem] border-2 border-white/20 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-[#C9A66B] font-bold uppercase tracking-widest">Player</p>
            <p className="text-4xl font-black uppercase leading-none">{player.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#C9A66B] font-bold uppercase tracking-widest">Handicap</p>
            <p className="text-6xl font-black leading-none">{player.handicap}</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm bg-white text-gray-900 rounded-[3.5rem] shadow-2xl p-8 relative">
        
        {/* Hole Data (RED CIRCLE: INCREASED SIZE) */}
        <div className="grid grid-cols-3 gap-4 text-center bg-gray-50 rounded-[2rem] p-6 mb-4 border border-gray-100">
          <div><p className="text-sm font-black text-gray-400 uppercase">Hole</p><p className="text-6xl font-black">{currentHole + 1}</p></div>
          <div><p className="text-sm font-black text-gray-400 uppercase">Par</p><p className="text-6xl font-black">{course[currentHole].par}</p></div>
          <div><p className="text-sm font-black text-gray-400 uppercase">SI</p><p className="text-6xl font-black">{course[currentHole].si}</p></div>
        </div>

        {/* Counter Area (BLUE CIRCLE: REDUCED SIZE) */}
        <div className="flex flex-col items-center justify-center py-2">
           <p className="text-lg font-black text-gray-400 uppercase tracking-widest mb-2">Strokes</p>
           <div className="flex items-center justify-between w-full px-2">
              <button onClick={() => updateScore(-1)} className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-white text-7xl font-bold shadow-lg transition-colors">—</button>
              <span className="text-[11rem] leading-none font-black text-green-900 tracking-tighter">{scores[currentHole] || course[currentHole].par}</span>
              <button onClick={() => updateScore(1)} className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white text-7xl font-bold shadow-lg transition-colors">+</button>
           </div>
        </div>

        {/* Points/Total (RED CIRCLE: INCREASED SIZE) */}
        <div className="flex justify-between items-center bg-green-50 p-6 rounded-[2rem] border-2 border-green-100 mt-2">
           <div className="text-center flex-1">
             <p className="text-sm font-black text-green-600 uppercase mb-1">Hole Pts</p>
             <p className="text-6xl font-black">{calculatePoints(scores[currentHole] || course[currentHole].par, course[currentHole].par, course[currentHole].si, player.handicap)}</p>
           </div>
           <div className="w-1 h-16 bg-green-200 mx-4"></div>
           <div className="text-center flex-1">
             <p className="text-sm font-black text-green-600 uppercase mb-1">Total</p>
             <p className="text-6xl font-black">{getAccumulatedPoints(currentHole)}</p>
           </div>
        </div>
      </div>

      {/* Bottom Nav (BLUE CIRCLE: REDUCED SIZE) */}
      <div className="fixed bottom-6 w-full max-w-md flex gap-4 px-6">
        <button onClick={() => setCurrentHole(Math.max(0, currentHole - 1))} className={`flex-1 bg-white/10 py-8 rounded-2xl text-2xl font-black uppercase border-2 border-white/10 ${currentHole === 0 ? 'opacity-0 pointer-events-none' : ''}`}>Back</button>
        {currentHole < 17 ? (
          <button onClick={() => setCurrentHole(currentHole + 1)} className="flex-[2] bg-[#C9A66B] py-8 rounded-2xl text-white text-3xl font-black shadow-2xl uppercase tracking-widest">Next</button>
        ) : (
          <button onClick={() => setShowSummary(true)} className="flex-[2] bg-green-600 py-8 rounded-2xl text-white text-3xl font-black shadow-2xl uppercase tracking-widest">Review</button>
        )}
      </div>
    </div>
  );
};

export default GolfApp;