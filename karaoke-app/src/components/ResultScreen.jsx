import React, { useState } from 'react';
import { useGameContext } from '../store/GameContext';
import DifficultySettings from './DifficultySettings';
import { Download, ArrowRight, RotateCcw, Trophy, Skull, Settings2 } from 'lucide-react';

const getConditionCategory = (condition) => {
  if (condition === '最下位（同点含む）') return '最下位';
  if (/^\d+位$/.test(condition)) return '順位点';
  if (condition.includes('に敗北')) return '差しウマ';
  if (condition === '全員に負けた' || condition === '全員に勝ってしまった') return '点数条件';
  if (condition.includes('出せず')) return '点数条件';
  if (condition.startsWith('テーマミス')) return 'テーマミス';
  if (condition === '時間切れ') return '時間切れ';
  return '';
};

const CONDITION_ORDER = ['点数条件', '最下位', '順位点', '差しウマ', 'テーマミス', '時間切れ'];

const conditionSortOrder = (condition) => {
  const cat = getConditionCategory(condition);
  const idx = CONDITION_ORDER.indexOf(cat);
  return idx === -1 ? 99 : idx;
};

const ResultScreen = () => {
  const { players, turns, penalties, nextTurn, resetGame } = useGameContext();
  const [showSettings, setShowSettings] = useState(false);
  
  if (turns.length === 0) return null;
  
  const lastTurn = turns[turns.length - 1];
  
  // Sort players by score in the last turn
  const sortedByScore = [...players].sort((a, b) => 
    lastTurn.scores[b.id].int - lastTurn.scores[a.id].int
  );

  // Sort players by total penalties
  const sortedByPenalty = [...players].sort((a, b) => 
    penalties[b.id] - penalties[a.id]
  );

  // Group penalties by condition
  const penaltiesByCondition = {};
  players.forEach(p => {
    const pData = lastTurn.penalties[p.id];
    pData.details.forEach(detail => {
      if (!penaltiesByCondition[detail]) {
        penaltiesByCondition[detail] = [];
      }
      penaltiesByCondition[detail].push(p.name);
    });
  });

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // Header
    csvContent += "ターン,親,テーマ,プレイヤー,曲名,点数,ペナルティ詳細,合計罰点(ターン)\n";
    
    turns.forEach((t, i) => {
      const themeString = t.themes && t.themes.some(th => th.trim() !== '') ? t.themes.filter(th => th.trim() !== '').join(' / ') : '未入力';
      players.forEach(p => {
        const songName = t.songs && t.songs[p.id] ? t.songs[p.id] : '';
        const score = t.scores[p.id].raw;
        const details = t.penalties[p.id].details.join(' / ');
        const turnPenalty = t.penalties[p.id].totalPenalty;
        csvContent += `${i + 1},${t.parent.name},${themeString},${p.name},${songName},${score},${details || 'なし'},${turnPenalty}\n`;
      });
    });

    // Add Totals row
    csvContent += "\n最終結果\nプレイヤー,累計罰点\n";
    players.forEach(p => {
      csvContent += `${p.name},${penalties[p.id]}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `karaoke_deathmatch_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2 className="title" style={{ margin: 0, fontSize: '2.5rem' }}>ターン {turns.length} 結果</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowSettings(!showSettings)}>
            <Settings2 size={18} /> 設定
          </button>
          <button className="btn btn-secondary" onClick={exportCSV}>
            <Download size={18} /> CSV出力
          </button>
          <button className="btn btn-danger" onClick={resetGame}>
            <RotateCcw size={18} /> リセット
          </button>
        </div>
      </div>

      {showSettings && <DifficultySettings />}

      <div className="grid-cols-2" style={{ marginBottom: '2rem' }}>
        {/* Turn Scores & Penalties */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: lastTurn.conditions?.scorePoint?.type === 5 || lastTurn.conditions?.scorePoint?.type === 6 ? '0.75rem' : '1.5rem', color: 'var(--accent)' }}>
            <Trophy /> 今回のスコア
          </h3>
          {(lastTurn.conditions?.scorePoint?.type === 5 || lastTurn.conditions?.scorePoint?.type === 6) && lastTurn.avg && (
            <div style={{ marginBottom: '1rem', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', fontSize: '0.95rem', color: 'var(--accent)' }}>
              平均点: <strong>{(lastTurn.avg / 1000).toFixed(3)}点</strong>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {sortedByScore.map((p, index) => {
              const score = lastTurn.scores[p.id];
              const pData = lastTurn.penalties[p.id];
              return (
                <div key={p.id} style={{ 
                  display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem',
                  background: 'rgba(0,0,0,0.3)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)'
                }}>
                  <span style={{ 
                    width: '24px', textAlign: 'center', fontWeight: 'bold', flexShrink: 0,
                    color: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#cd7f32' : 'var(--text-muted)'
                  }}>
                    {index + 1}
                  </span>
                  <span style={{ fontWeight: 'bold', flex: 1 }}>{p.name}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: 'var(--accent)', flexShrink: 0 }}>
                    {score.raw.toFixed(3)}
                  </span>
                  <span className={`badge ${pData.totalPenalty > 0 ? 'badge-danger' : 'badge-success'}`} style={{ flexShrink: 0, minWidth: '40px', textAlign: 'center' }}>
                    +{pData.totalPenalty}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total Penalties Standings */}
        <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--danger)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--danger)' }}>
            <Skull /> 累計罰点
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {sortedByPenalty.map((p, index) => (
              <div key={p.id} style={{ 
                display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.75rem',
                background: index === 0 && penalties[p.id] > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0,0,0,0.3)', 
                padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)',
                border: index === 0 && penalties[p.id] > 0 ? '1px solid var(--danger)' : 'none'
              }}>
                <span style={{ fontWeight: 'bold', flex: 1 }}>{p.name}</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)', flexShrink: 0 }}>
                  {penalties[p.id]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>ペナルティ詳細（本ターン）</h3>
        
        {Object.keys(penaltiesByCondition).length > 0 && (
          <div style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ color: 'var(--text-main)', marginBottom: '0.8rem', fontSize: '1rem' }}>条件別の該当者</h4>
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              {Object.entries(penaltiesByCondition)
                .sort((a, b) => conditionSortOrder(a[0]) - conditionSortOrder(b[0]))
                .map(([condition, names]) => (
                <div key={condition} style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', minWidth: '72px', flexShrink: 0 }}>{getConditionCategory(condition)}</span>
                  <span style={{ color: 'var(--danger)', minWidth: '180px', flexShrink: 0 }}>{condition}</span>
                  <span style={{ color: 'var(--text-main)' }}>{names.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {players.map((p, i) => {
            const pData = lastTurn.penalties[p.id];
            if (pData.totalPenalty === 0) return null;
            return (
              <div key={p.id} style={{ 
                display: 'flex', alignItems: 'flex-start', gap: '1rem',
                padding: '0.8rem 0.5rem',
                borderBottom: i < players.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none'
              }}>
                <strong style={{ minWidth: '120px', flexShrink: 0 }}>{p.name}</strong>
                <span style={{ color: 'var(--danger)' }}>{pData.details.join(', ')}</span>
              </div>
            );
          })}
          {players.every(p => lastTurn.penalties[p.id].totalPenalty === 0) && (
            <div className="text-center text-muted">罰点発生なし</div>
          )}
        </div>
      </div>

      <div className="flex-center">
        <button className="btn btn-primary animate-pulse-glow" onClick={nextTurn} style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}>
          <span>次のターンへ</span>
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
};

export default ResultScreen;
