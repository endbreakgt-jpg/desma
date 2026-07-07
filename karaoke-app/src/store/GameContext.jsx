import React, { createContext, useContext, useState, useEffect } from 'react';

const GameContext = createContext();

export const useGameContext = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  // App State
  const [currentScreen, setCurrentScreen] = useState('setup'); // setup, turn, result
  
  // Game Data
  const [players, setPlayers] = useState(() => {
    const saved = localStorage.getItem('kd_players');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [turns, setTurns] = useState(() => {
    const saved = localStorage.getItem('kd_turns');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [penalties, setPenalties] = useState(() => {
    const saved = localStorage.getItem('kd_penalties');
    // penalties format: { playerId: number }
    return saved ? JSON.parse(saved) : {};
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('kd_settings');
    return saved ? JSON.parse(saved) : {
      themeMax: 3,
      rankTargets: 1, // How many ranks to target
      sashiumaPairs: 1, // How many pairs for sashiuma
      scoreMargin: 2, // ±2 for range target
      scoreTargetMin: 85,
      scoreTargetMax: 95
    };
  });

  // Persist to LocalStorage
  useEffect(() => {
    localStorage.setItem('kd_players', JSON.stringify(players));
    localStorage.setItem('kd_turns', JSON.stringify(turns));
    localStorage.setItem('kd_penalties', JSON.stringify(penalties));
    localStorage.setItem('kd_settings', JSON.stringify(settings));
  }, [players, turns, penalties, settings]);

  // Actions
  const startGame = (activePlayers) => {
    setPlayers(activePlayers);
    // Initialize penalties if not exist
    const newPenalties = { ...penalties };
    activePlayers.forEach(p => {
      if (newPenalties[p.id] === undefined) newPenalties[p.id] = 0;
    });
    setPenalties(newPenalties);
    setCurrentScreen('turn');
  };

  const addTurnResult = (turnData) => {
    setTurns([...turns, turnData]);
    
    // Update Penalties
    const newPenalties = { ...penalties };
    Object.keys(turnData.penalties).forEach(pid => {
      const prev = parseInt(newPenalties[pid]) || 0;
      newPenalties[pid] = prev + turnData.penalties[pid].totalPenalty;
    });
    setPenalties(newPenalties);
    
    setCurrentScreen('result');
  };
  
  const nextTurn = () => {
    setCurrentScreen('turn');
  };

  const resetGame = () => {
    if (confirm("ゲームデータをリセットしますか？")) {
      setTurns([]);
      setPenalties({});
      setCurrentScreen('setup');
    }
  };

  const getHighestScore = () => {
    let max = 0;
    turns.forEach(t => {
      Object.values(t.scores).forEach(score => {
        if (score.raw > max) max = score.raw;
      });
    });
    return max;
  };

  const getLowestScore = () => {
    let min = 100000;
    turns.forEach(t => {
      Object.values(t.scores).forEach(score => {
        if (score.raw < min) min = score.raw;
      });
    });
    return min === 100000 ? 0 : min;
  };

  const value = {
    currentScreen, setCurrentScreen,
    players, setPlayers,
    turns,
    penalties,
    settings, setSettings,
    startGame,
    addTurnResult,
    nextTurn,
    resetGame,
    getHighestScore,
    getLowestScore
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
