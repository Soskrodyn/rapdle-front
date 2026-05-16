import { useEffect, useState } from 'react'
import Music from './music'
import Input from './Input'
import './App.css'
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import seedrandom from "seedrandom";

// Hash-Funktion für deterministische Seeds
String.prototype.hashCode = function () {
  var hash = 0, i, chr;
  for (i = 0; i < this.length; i++) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
};

function App() {
  const [song, setSong] = useState(null);
  const [playlistOptions, setPlaylistOptions] = useState([]);
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [alertMessage, setAlertMessage] = useState("");
  const [history, setHistory] = useState({});
  const [days, setDays] = useState([]);
  const [dayIndex, setDayIndex] = useState(0); // 0 = heute
  const [userId] = useState(() => {
    let id = localStorage.getItem("rapdle-userId");
    if (!id) {
      id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("rapdle-userId", id);
    }
    return id;
  });

  const API_BASE = "http://localhost:5095/api/song";

  // Load playlist
  useEffect(() => {
    fetch(`${API_BASE}/playlist`)
      .then(res => res.json())
      .then(data => setPlaylistOptions(data));
  }, []);

  // Load user history from backend
  useEffect(() => {
    if (!userId) return;
    
    // Generiere alle Tage ab 01.04.2026 bis heute
    function generateAllDays(startDate, endDate) {
      const days = [];
      const current = new Date(startDate);
      
      while (current <= endDate) {
        days.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
      }
      
      return days.sort((a, b) => new Date(b) - new Date(a)); // Neuester zuerst
    }

    const startDate = new Date("2026-04-01");
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Mitternacht
    
    const allDays = generateAllDays(startDate, today);
    
    fetch(`${API_BASE}/history/${userId}`)
      .then(res => res.json())
      .then(guessArray => {
        const historyObj = {};
        guessArray.forEach(g => {
          historyObj[g.date] = {
            guesses: g.guesses,
            won: g.won,
            solution: g.solution
          };
        });
        setHistory(historyObj);
        setDays(allDays);
        setDayIndex(0);
      })
      .catch(() => {
        // Fallback: zeige alle Tage ab 01.04.2026
        setDays(allDays);
        setHistory({});
      });
  }, [userId]);

  // Auto-hide alert
  useEffect(() => {
    if (!alertMessage) return;
    const timer = setTimeout(() => setAlertMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [alertMessage]);

  // Calculate song for selected day
  useEffect(() => {
    if (!playlistOptions.length || !days.length) return;

    const date = days[dayIndex];
    const seed = date.hashCode();
    const rng = seedrandom(seed);
    const index = Math.floor(rng() * playlistOptions.length);

    setSong(playlistOptions[index]);

    if (history[date]) {
      setGuesses(history[date].guesses);
    } else {
      setGuesses([]);
    }
  }, [dayIndex, playlistOptions, days]);

  // Confirm guess
  function handleConfirm() {
    const selectedDate = days[dayIndex];
    const newGuesses = [...guesses, guess];
    const correct = guess === `${song?.title} – ${song?.artist?.name}`;

    if (correct) {
      setAlertMessage("Correct!");
    } else if (guesses.length >= 5) {
      setAlertMessage("Loser: " + `${song?.title} – ${song?.artist?.name}`);
    } else {
      setAlertMessage("Wrong guess!");
    }

    const newHistory = { ...history };
    newHistory[selectedDate] = {
      guesses: newGuesses,
      won: correct,
      solution: `${song?.title} – ${song?.artist?.name}`
    };

    // Save to backend
    fetch(`${API_BASE}/guess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        date: selectedDate,
        guesses: newGuesses,
        won: correct,
        solution: `${song?.title} – ${song?.artist?.name}`
      })
    }).catch(err => console.error("Failed to save guess:", err));

    setHistory(newHistory);
    setGuesses(newGuesses);
    setGuess("");
  }

  return (
    <div className="pageLayout">

      {/* LEFT PANEL — DATE + ✔/✘ */}
      <div className="leftPanel">
        <h3>History</h3>

        <div className="historyList">
          {days.map((date, i) => (
            <div 
              key={date} 
              className={`historyItem ${dayIndex === i ? "active" : ""}`}
              onClick={() => setDayIndex(i)}
            >
              <span>{date}</span>
              <span className="historyStatus">
                {history[date]?.won ? "✔" : history[date] ? "✘" : "•"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER */}
      <div className="centerContent">
        <label>Rapdle</label>

        <Music
          previewUrl={song?.preview}
          quessCounter={guesses.length}
          onPrevDay={() => {
            if (dayIndex < days.length - 1) setDayIndex(dayIndex + 1);
          }}
          onNextDay={() => {
            if (dayIndex > 0) setDayIndex(dayIndex - 1);
          }}
          disableNext={dayIndex === 0 || days.length === 0}
          disablePrev={dayIndex === days.length - 1 || days.length === 0}
        />

        <Input
          playlist={playlistOptions}
          onSelect={(title, artist) => setGuess(`${title} – ${artist}`)}
          clearSignal={guesses.length}
        />

        <button onClick={handleConfirm}>Confirm</button>

        {alertMessage && (
          <div className="custom-alert">{alertMessage}</div>
        )}

        <div className="animationContainer">
          <DotLottieReact className='rightDino' src="/intro-animation.lottie" loop autoplay />
          <DotLottieReact className='leftDino' src="/intro-animation.lottie" loop autoplay />
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="rightPanel">
       <h3> Attempts</h3>
        <div className="attempts">
          {guesses.map((guess, index) => (
            <div key={index} className="attempt">
              {index + 1}. {guess}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default App;
