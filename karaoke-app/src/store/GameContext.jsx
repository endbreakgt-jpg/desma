import React, { createContext, useContext, useState, useEffect } from 'react';

const DEFAULT_SCORE_WEIGHTS = [2, 2, 2, 2, 2, 2, 2, 1, 1];

const DEFAULT_SETTINGS = {
  themeMax: 3,
  rankTargets: 1,
  sashiumaPairs: 1,
  scoreMargin: 5,
  scoreTargetMin: 85,
  scoreTargetMax: 95,
  scoreConditionWeights: DEFAULT_SCORE_WEIGHTS
};

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
    if (!saved) return { ...DEFAULT_SETTINGS };
    const previous = JSON.parse(saved);
    // Migrate the former untouched defaults without overwriting customized settings.
    const legacyWeights = previous.scoreConditionWeights;
    const isLegacyWeights = Array.isArray(legacyWeights) &&
      legacyWeights.length === 9 && legacyWeights.every(weight => weight === 1);
    const isUntouchedLegacy = isLegacyWeights && previous.scoreMargin === 2;
    return {
      ...DEFAULT_SETTINGS,
      ...previous,
      scoreMargin: isUntouchedLegacy ? 5 : (previous.scoreMargin ?? 5),
      scoreConditionWeights: isLegacyWeights
        ? [...DEFAULT_SCORE_WEIGHTS]
        : DEFAULT_SCORE_WEIGHTS.map((weight, i) => previous.scoreConditionWeights?.[i] ?? weight)
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
