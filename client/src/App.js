import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { validateWord } from './services/dictionary.js';
import { loadState, saveState } from './services/storage.js';

const TURN_SECONDS = 30;

function useCountdown(seconds, isRunning, onExpire) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }
    setRemaining(seconds);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [seconds, isRunning, onExpire]);

  return remaining;
}

export default function App() {
  const [players] = useState(["Player 1", "Player 2"]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [usedWords, setUsedWords] = useState([]);
  const [lastLetter, setLastLetter] = useState(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [running, setRunning] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [consecutiveTimeouts, setConsecutiveTimeouts] = useState(0);

  useEffect(() => {
    const s = loadState();
    if (s) {
      setCurrentPlayerIndex(s.currentPlayerIndex ?? 0);
      setScores(s.scores ?? [0, 0]);
      setUsedWords(s.usedWords ?? []);
      setLastLetter(s.lastLetter ?? null);
      setGameOver(!!s.gameOver);
      setConsecutiveTimeouts(s.consecutiveTimeouts ?? 0);
    }
  }, []);

  useEffect(() => {
    saveState({ currentPlayerIndex, scores, usedWords, lastLetter, gameOver, consecutiveTimeouts });
  }, [currentPlayerIndex, scores, usedWords, lastLetter, gameOver, consecutiveTimeouts]);

  const switchPlayer = useCallback(() => {
    if (gameOver) return;
    setRunning(false);
    setTimeout(() => {
      setCurrentPlayerIndex((i) => (i + 1) % players.length);
      setFeedback("");
      setInput("");
      setRunning(true);
    }, 300);
  }, [players.length, gameOver]);

  const onExpire = useCallback(() => {
    if (gameOver) return;
    setFeedback(`${players[currentPlayerIndex]} ran out of time. -1 point.`);
    setScores((prev) => prev.map((v, i) => (i === currentPlayerIndex ? v - 1 : v)));
    setConsecutiveTimeouts((prev) => {
      const next = prev + 1;
      if (next >= 2) {
        setGameOver(true);
        setRunning(false);
        setFeedback('Both players timed out. Game over.');
        return 0;
      }
      switchPlayer();
      return next;
    });
  }, [players, currentPlayerIndex, switchPlayer, gameOver]);

  const remaining = useCountdown(TURN_SECONDS, running && !gameOver, onExpire);


  const usedSet = useMemo(() => new Set(usedWords.map((w) => w.word.toLowerCase())), [usedWords]);

  async function handleSubmit(e) {
    e?.preventDefault?.();
    const raw = input.trim();
    const word = raw.toLowerCase();

    if (word.length < 4) {
      penalize(`Word must be at least 4 letters.`);
      return;
    }
    if (usedSet.has(word)) {
      penalize(`Word already used.`);
      return;
    }
    if (lastLetter && word[0] !== lastLetter) {
      penalize(`Word must start with '${lastLetter}'.`);
      return;
    }

    const valid = await validateWord(word);
    if (!valid) {
      penalize(`Not a valid English word.`);
      return;
    }

    const by = players[currentPlayerIndex];
    setUsedWords((prev) => [...prev, { word, by }]);
    setLastLetter(word[word.length - 1]);
    setConsecutiveTimeouts(0);
    setFeedback(`Accepted: ${word}`);
    setInput("");
    switchPlayer();
  }

  function penalize(msg) {
    setFeedback(`Invalid: ${msg} -1 point.`);
    setScores((prev) => prev.map((v, i) => (i === currentPlayerIndex ? v - 1 : v)));
    setConsecutiveTimeouts(0);
    switchPlayer();
  }

  function resetGame() {
    setCurrentPlayerIndex(0);
    setScores([0, 0]);
    setUsedWords([]);
    setLastLetter(null);
    setFeedback("");
    setInput("");
    setRunning(true);
    setGameOver(false);
    setConsecutiveTimeouts(0);
  }

  return (
    <div className="container">
      <h1>Shiritori</h1>
      <div className="top-bar">
        <TurnIndicator players={players} currentIndex={currentPlayerIndex} />
        <Timer remaining={remaining} total={TURN_SECONDS} />
      </div>
      <Scoreboard players={players} scores={scores} />

      <form className="input-row" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={lastLetter ? `Start with '${lastLetter}'` : 'Type a word (≥ 4 letters)'}
          autoFocus
          disabled={gameOver}
        />
        <button type="submit" disabled={gameOver}>Submit</button>
        <button type="button" className="secondary" onClick={resetGame}>Reset</button>
      </form>

      {feedback && <div className="feedback">{feedback}</div>}

      {gameOver && (
        <div className="feedback" style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' }}>
          <strong>Game Over.</strong> Final Scores — {players[0]}: {scores[0]}, {players[1]}: {scores[1]}
        </div>
      )}

      <WordHistory items={usedWords} />
    </div>
  );
}

function Timer({ remaining, total }) {
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
  return (
    <div className="timer">
      <div className="timer-bar" style={{ width: `${pct}%` }} />
      <span className="timer-text">{remaining}s</span>
    </div>
  );
}

function Scoreboard({ players, scores }) {
  return (
    <div className="scoreboard">
      {players.map((p, i) => (
        <div key={p} className="score">
          <div className="name">{p}</div>
          <div className="value">{scores[i]}</div>
        </div>
      ))}
    </div>
  );
}

function WordHistory({ items }) {
  return (
    <div className="history">
      <h2>Word History</h2>
      <div className="history-list">
        {items.length === 0 && <div className="muted">No words yet.</div>}
        {items.map((it, idx) => (
          <div className="history-item" key={`${it.word}-${idx}`}>
            <span className="by">{it.by}:</span>
            <span className="word">{it.word}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TurnIndicator({ players, currentIndex }) {
  return (
    <div className="turn-indicator">
      <span>Turn:</span>
      <strong>{players[currentIndex]}</strong>
    </div>
  );
}


