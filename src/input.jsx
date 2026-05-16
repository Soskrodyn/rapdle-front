import React, { useState, useEffect } from 'react';
import './input.css'

function Input({ playlist, onSelect , clearSignal}) {

  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    setQuery("");   
    setFiltered([]);     
  }, [clearSignal]);


  function handleInput(e) {
    const value = e.target.value;
    setQuery(value);

    const results = playlist.filter(song =>
      song.title.toLowerCase().includes(value.toLowerCase()) ||     song.artist?.name.toLowerCase().includes(value.toLowerCase())
    );

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
