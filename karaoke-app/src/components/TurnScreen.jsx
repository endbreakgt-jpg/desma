import React, { useState, useEffect } from 'react';
import { useGameContext } from '../store/GameContext';
import { generateTurnConditions, calculateTurnResults } from '../utils/gameLogic';
import { Dice5, Target, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';

const TurnScreen = () => {
  const { players, settings, addTurnResult, turns } = useGameContext();
  const [conditions, setConditions] = useState(null);
  
  // State for inputs
  const [scores, setScores] = useState({});
  const [penalties, setPenalties] = useState({});
  const [themes, setThemes] = useState([]);
  const [songs, setSongs] = useState({});
  
  // Parent calculation
  const turnIndex = turns.length;
  const parentPlayer = players[turnIndex % players.length];

  const getPlayerHighestScore = (playerId) => {
    let max = 0;
    turns.forEach(t => {
      if (t.scores[playerId]) {
        if (t.scores[playerId].raw > max) max = t.scores[playerId].raw;
      }
    });
    return max;
  };

  const getPlayerLowestScore = (playerId) => {
    let min = Infinity;
    turns.forEach(t => {
      if (t.scores[playerId]) {
        if (t.scores[playerId].raw < min) min = t.scores[playerId].raw;
      }
    });
    return min === Infinity ? 0 : min;
  };

  useEffect(() => {
    const hasPreviousTurns = turns.length > 0;
    const conds = generateTurnConditions(players, settings, hasPreviousTurns);
    setConditions(conds);
    setThemes(Array(conds.themeCount).fill(''));

    // Initialize inputs
    const initialScores = {};
    const initialPenalties = {};
    const initialSongs = {};
    players.forEach(p => {
      initialScores[p.id] = '';
      initialPenalties[p.id] = { themeMisses: 0, timeout: false };
      initialSongs[p.id] = '';
    });
    setScores(initialScores);
    setPenalties(initialPenalties);
    setSongs(initialSongs);
  }, []);

  const handleScoreChange = (id, value) => {
    // Regex for up to 3 decimals
    if (value === '' || /^\d{0,3}(\.\d{0,3})?$/.test(value)) {
      setScores({ ...scores, [id]: value });
    }
  };

  const toggleTimeout = (id) => {
    setPenalties({
      ...penalties,
      [id]: { ...penalties[id], timeout: !penalties[id].timeout }
    });
  };

  const addThemeMiss = (id, delta) => {
    const current = penalties[id].themeMisses;
    const next = Math.max(0, current + delta);
    setPenalties({
      ...penalties,
      [id]: { ...penalties[id], themeMisses: next }
    });
  };

  const handleSubmit = () => {
    // Validate all scores are filled
    const allFilled = players.every(p => scores[p.id] !== '' && !isNaN(parseFloat(scores[p.id])));
    if (!allFilled) {
      alert('全員の点数を入力してください。');
      return;
    }

    // Convert scores to int (x1000) for exact calculation
    const processedScores = {};
    players.forEach(p => {
      const raw = parseFloat(scores[p.id]);
      processedScores[p.id] = {
        raw: raw,
        int: Math.round(raw * 1000)
      };
    });

    // Calculate results
    const { results, avg } = calculateTurnResults(players, processedScores, penalties, conditions, turns);

    addTurnResult({
      turnIndex,
      parent: parentPlayer,
      conditions,
      themes,
      songs,
      scores: processedScores,
      avg,
      penalties: results
    });
  };

  if (!conditions) return <div className="text-center text-muted p-4">Loading...</div>;

  const renderConditionText = () => {
    const sp = conditions.scorePoint;

    switch(sp.type) {
      case 0: return `${sp.target}点 以上`;
      case 1: return `${sp.target}点 以下`;
      case 2: return `${sp.target}点 ±${sp.margin}`;
      case 3: return `${sp.targetPlayer.name}より 上`;
      case 4: return `${sp.targetPlayer.name}より 下`;
      case 5: return `本ターンの平均点 以上`;
      case 6: return `本ターンの平均点 以下`;
      case 7: return `自己最高得点 以上`;
      case 8: return `自己最低得点 以下`;
      default: return '';
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h2 className="subtitle" style={{ margin: 0 }}>ターン {turnIndex + 1}</h2>
        <div className="badge badge-warning" style={{ fontSize: '1.1rem', padding: '8px 16px' }}>
          親: {parentPlayer.name}
        </div>
      </div>

      <div className="grid-cols-2" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>
            <Dice5 /> 発生条件
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>テーマ数:</strong> {conditions.themeCount}個</li>
            <li><strong>順位点:</strong> {conditions.targetRanks.join(', ')}位</li>
            <li><strong>差しウマ:</strong> {conditions.sashiumaPairs.map(p => `${p[0].name} vs ${p[1].name}`).join(' / ')}</li>
          </ul>

          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>テーマ内容（任意）</strong>
            {themes.map((t, i) => (
              <input 
                key={i}
                type="text" 
                placeholder={`テーマ ${i + 1} (スキップ可)`} 
                value={themes[i]} 
                onChange={(e) => {
                  const newThemes = [...themes];
                  newThemes[i] = e.target.value;
                  setThemes(newThemes);
                }}
                style={{ marginBottom: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', padding: '0.5rem' }}
              />
            ))}
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--danger)' }}>
            <Target /> 点数条件
          </h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
            {renderConditionText()}
          </div>
          { (conditions.scorePoint.type === 7 || conditions.scorePoint.type === 8) && (
            <div style={{ marginTop: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 'bold' }}>各プレイヤーの必要点数:</div>
              {players.map(p => {
                const targetScore = conditions.scorePoint.type === 7 ? getPlayerHighestScore(p.id) : getPlayerLowestScore(p.id);
                return (
                  <div key={p.id} className="flex-between" style={{ fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                    <span>{p.name}</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: conditions.scorePoint.type === 7 ? 'var(--accent)' : 'var(--danger)' }}>
                      {targetScore.toFixed(3)} 点 {conditions.scorePoint.type === 7 ? '以上' : '以下'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="text-muted" style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            最下位は無条件で罰点1
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(0,0,0,0.5)' }}>
            <tr>
              <th style={{ padding: '1rem', width: '15%' }}>プレイヤー</th>
              <th style={{ padding: '1rem', width: '30%' }}>曲名(任意)</th>
              <th style={{ padding: '1rem', width: '18%' }}>点数入力</th>
              <th style={{ padding: '1rem', width: '22%' }}>テーマミス</th>
              <th style={{ padding: '1rem', width: '15%', textAlign: 'center' }}>時間切れ</th>
            </tr>
          </thead>
          <tbody>
            {players.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.name}</td>
                <td style={{ padding: '1rem' }}>
                  <input 
                    type="text"
                    placeholder="曲名"
                    value={songs[p.id] || ''}
                    onChange={(e) => setSongs({ ...songs, [p.id]: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)' }}
                  />
                </td>
                <td style={{ padding: '1rem' }}>
                  <input 
                    type="number"
                    step="0.001"
                    placeholder="00.000"
                    value={scores[p.id]}
                    onChange={(e) => handleScoreChange(p.id, e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)' }}
                  />
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', borderRadius: '4px' }} onClick={() => addThemeMiss(p.id, -1)}>-</button>
                    <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>
                      {penalties[p.id]?.themeMisses || 0}
                    </span>
                    <button className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', borderRadius: '4px' }} onClick={() => addThemeMiss(p.id, 1)}>+</button>
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <button 
                    className={`btn ${penalties[p.id]?.timeout ? 'btn-danger' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem', borderRadius: '4px', width: '100%' }}
                    onClick={() => toggleTimeout(p.id)}
                  >
                    {penalties[p.id]?.timeout ? 'タイムアウト' : 'OK'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex-center" style={{ marginTop: '2rem' }}>
        <button className="btn btn-primary animate-pulse-glow" onClick={handleSubmit} style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}>
          <CheckCircle2 size={24} />
          ターン終了・判定
        </button>
      </div>
    </div>
  );
};

export default TurnScreen;
