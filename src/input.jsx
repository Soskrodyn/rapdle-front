import React, { useState, useEffect } from 'react';
import './input.css'

function Input({ playlist, onSelect , clearSignal, history = {}, selectedDate }) {

  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    setQuery("");   
    setFiltered([]);     
  }, [clearSignal]);

  // Get excluded songs and artists based on cooldown periods
  function getExcludedSongsAndArtists() {
    const excludedSongs = new Set();
    const excludedArtists = new Set();
    
    if (!selectedDate || !history) return { excludedSongs, excludedArtists };

    const selectedDateObj = new Date(selectedDate);
    
    // Get all dates in history
    Object.keys(history).forEach(date => {
      const historyDateObj = new Date(date);
      const daysDiff = Math.floor((selectedDateObj - historyDateObj) / (1000 * 60 * 60 * 24));
      
      const entry = history[date];
      if (!entry || !entry.solution) return;
      
      // Parse "Title – Artist" format
      const [title, artist] = entry.solution.split(" – ");
      
      // Check 100-day cooldown for songs
      if (daysDiff >= 0 && daysDiff < 100) {
        excludedSongs.add(entry.solution.toLowerCase());
      }
      
      // Check 20-day cooldown for artists
      if (daysDiff >= 0 && daysDiff < 20) {
        if (artist && artist.trim()) {
          excludedArtists.add(artist.trim().toLowerCase());
        }
      }
    });
    
    return { excludedSongs, excludedArtists };
  }

  function handleInput(e) {
    const value = e.target.value;
    setQuery(value);

    const { excludedSongs, excludedArtists } = getExcludedSongsAndArtists();

    const results = playlist
      .filter(song => {
        const songFullName = `${song.title} – ${song.artist?.name}`;
        
        // Filter by query text
        const matchesQuery = song.title.toLowerCase().includes(value.toLowerCase()) ||     
                           song.artist?.name.toLowerCase().includes(value.toLowerCase());
        
        if (!matchesQuery) return false;
        
        // Exclude songs in 100-day cooldown
        if (excludedSongs.has(songFullName.toLowerCase())) return false;
        
        // Exclude songs with artists in 20-day cooldown
        if (song.artist?.name && excludedArtists.has(song.artist.name.trim().toLowerCase())) {
          return false;
        }
        
        return true;
      });

    setFiltered(results);
  }

  function handleSelect(song) {
    setQuery(song.title);
    setFiltered([]);

    onSelect(song.title, song.artist?.name);
  }

  return (
    <>
      <input className='inputText'
        value={query}
        onChange={handleInput}
        placeholder="Guess the song..."
      />

      {query.length > 0 && filtered.length > 0 && (
        <div className="dropdown">
          {filtered.map(song => (
            <div
              key={song.id}
              className="dropdown-item"
              onClick={() => handleSelect(song)}
            >
               <span className="dropdown-text">
    {song.title} – {song.artist?.name}
  </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default Input;
