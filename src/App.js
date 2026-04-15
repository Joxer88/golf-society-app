import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. COURSE DATA - Defined outside to prevent re-render loops
const course = [
  { par: 4, si: 7 }, { par: 5, si: 1 }, { par: 3, si: 15 }, { par: 4, si: 9 }, { par: 4, si: 3 }, { par: 4, si: 11 },
  { par: 5, si: 5 }, { par: 3, si: 17 }, { par: 4, si: 13 }, { par: 4, si: 8 }, { par: 4, si: 2 }, { par: 3, si: 16 },
  { par: 5, si: 10 }, { par: 4, si: 4 }, { par: 4, si: 12 }, { par: 4, si: 6 }, { par: 3, si: 18 }, { par: 5, si: 14 }
];

// 2. DATABASE CONNECTION
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

const GolfApp = () => {
  // CONFIG: Change these per player if needed
  const [player] = useState({ name: "ANDREAS DOLAN", handicap: 14 });
  
  const [verifierName, setVerifierName] = useState("");
  const [currentHole, setCurrentHole] = useState(0);
  const [scores, setScores] = useState(course.map(h => h.par));
  const [showSummary, setShowSummary] = useState(false);

  // STABLEFORD CALCULATION
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
        player_name: player.name, 
        handicap: player.handicap, 
        total_points: totalPoints, 
        verifier: verifierName, 
        scores: scores 
    }]);
    if (!error) { 
        alert("Round Submitted Successfully!"); 
        window.location.reload(); 
    } else { 
        alert("Error: " + error.message); 
    }
  };

  // --- SUMMARY SCREEN (NO SCROLL) ---
  if (showSummary) {
    return (
      <div className="h-screen bg-[#1A4D3A] text-white p-2 flex flex-col overflow-hidden">
        <div className="flex-1 bg-white text-gray-900 rounded-3xl p-4 shadow-2xl flex flex-col overflow-hidden">
          <h1 className="text-lg font-black text-center text-[#1A4D3A] mb-2 uppercase underline">Summary</h1>
          <div className="flex-1 overflow-y-auto mb-2 border-b-2">
            {course.map((h, i) => (
              <div key={i} className="flex justify-between py-2 border-b text-xl font-black px-2">
                <span className="text-gray-400 w-10">H{i+1}</span> 
                <span className="w-10 text-center">{scores[i]}</span>
                <span className="text-green-700 w-20 text-right">{calcHolePoints(scores[i], h.par, h.si)} pts</span>
              </div>
            ))}
          </div>
          <div className="bg-gray-100 p-2 rounded-xl mb-2 text-center">
             <p className="