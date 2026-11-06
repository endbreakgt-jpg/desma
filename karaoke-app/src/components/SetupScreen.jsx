import React, { useState } from 'react';
import { useGameContext } from '../store/GameContext';
import { Play, User, UserPlus, X, Settings2, GripVertical, RotateCcw } from 'lucide-react';

const SetupScreen = () => {
  const { players, startGame, settings, setSettings, resetGame } = useGameContext();
  const [localPlayers, setLocalPlayers] = useState(players);
  const [showSettings, setShowSettings] = useState(false);
  const [scoreMinInput, setScoreMinInput] = useState(String(settings.scoreTargetMin ?? 85));
  const [scoreMaxInput, setScoreMaxInput] = useState(String(settings.scoreTargetMax ?? 95));

  // Keep the draft as text so users can clear and replace digits freely.
  const commitScoreTarget = (key, input, setInput) => {
    const value = input.trim() === '' ? NaN : Number(input);
    if (Number.isInteger(value) && value >= 0) {
      setSettings(prev => ({ ...prev, [key]: value }));
      setInput(String(value));
    } else {
      setInput(String(settings[key] ?? (key === 'scoreTargetMin' ? 85 : 95)));
    }
  };

  const togglePlayer = (id) => {
    setLocalPlayers(localPlayers.map(p =>
      p.id === id ? { ...p, active: !p.active } : p
    ));
  };

  const updatePlayerName = (id, newName) => {
    setLocalPlayers(localPlayers.map(p =>
      p.id === id ? { ...p, name: newName } : p
    ));
  };

  const removePlayer = (id) => {
    setLocalPlayers(localPlayers.filter(p => p.id !== id));
  };

  const addPlayer = () => {
    const newId = Date.now().toString();
    setLocalPlayers([...localPlayers, { id: newId, name: `ゲスト${localPlayers.length + 1}`, active: true }]);
  };

  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newPlayers = [...localPlayers];
    const temp = newPlayers[draggedIndex];
    newPlayers.splice(draggedIndex, 1);
    newPlayers.splice(index, 0, temp);
    setDraggedIndex(index);
    setLocalPlayers(newPlayers);
  };

  const handleStart = () => {
    const active = localPlayers.filter(p => p.active);
    if (active.length < 4) {
      alert('ゲームを開始するには最低4人のプレイヤーが必要です。');
      return;
    }
    startGame(active);
  };

  const firstActiveIndex = localPlayers.findIndex(p => p.active);

  return (
    <div className="glass-panel animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2 className="subtitle" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User color="var(--accent)" />
          参加プレイヤー設定
        </h2>
        <button className="btn btn-secondary" onClick={() => setShowSettings(!showSettings)} style={{ padding: '0.5rem' }}>
          <Settings2 size={20} />
        </button>
      </div>

      {showSettings && (
        <div className="glass-panel animate-fade-in" style={{ marginBottom: '2rem', background: 'rgba(0,0,0,0.3)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>GM用 難易度調整</h3>
          <div className="grid-cols-2">
            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>最大テーマ数</label>
              <select
                value={settings.themeMax}
                onChange={(e) => setSettings({ ...settings, themeMax: parseInt(e.target.value) })}
              >
                <option value={1}>1個 (Easy)</option>
                <option value={2}>2個 (Normal)</option>
                <option value={3}>3個 (Hard)</option>
              </select>
            </div>
            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>順位点 対象者数</label>
              <select
                value={settings.rankTargets}
                onChange={(e) => setSettings({ ...settings, rankTargets: parseInt(e.target.value) })}
              >
                <option value={1}>1人</option>
                <option value={2}>2人</option>
              </select>
            </div>
            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>差しウマ 発生組数</label>
              <select
                value={settings.sashiumaPairs}
                onChange={(e) => setSettings({ ...settings, sashiumaPairs: parseInt(e.target.value) })}
              >
                <option value={1}>1組</option>
                <option value={2}>2組</option>
              </select>
            </div>
            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>点数条件 範囲</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  value={scoreMinInput}
                  onChange={(e) => setScoreMinInput(e.target.value)}
                  onBlur={() => commitScoreTarget('scoreTargetMin', scoreMinInput, setScoreMinInput)}
                  style={{ padding: '0.5rem' }}
                />
                <span>〜</span>
                <input
                  type="number"
                  value={scoreMaxInput}
                  onChange={(e) => setScoreMaxInput(e.target.value)}
                  onBlur={() => commitScoreTarget('scoreTargetMax', scoreMaxInput, setScoreMaxInput)}
                  style={{ padding: '0.5rem' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {localPlayers.map((p, index) => (
          <div
            key={p.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={() => setDraggedIndex(null)}
            className="flex-between"
            style={{
              background: p.active ? 'rgba(255,255,255,0.05)' : 'transparent',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${p.active ? 'var(--primary-glow)' : 'var(--glass-border)'}`,
              transition: 'all 0.3s',
              opacity: draggedIndex === index ? 0.5 : 1,
              cursor: 'move'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
              <GripVertical size={20} color="var(--text-muted)" style={{ cursor: 'grab', flexShrink: 0 }} />
              <div
                style={{
                  width: '32px', height: '32px',
                  borderRadius: '50%',
                  background: p.active ? 'var(--primary)' : 'var(--glass-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}
              >
                {index + 1}
              </div>
              <input
                type="text"
                value={p.name}
                onChange={(e) => updatePlayerName(p.id, e.target.value)}
                style={{ flex: 1, maxWidth: '400px', background: 'transparent', border: 'none', padding: '0.5rem', fontSize: '1.2rem', color: p.active ? 'var(--text-main)' : 'var(--text-muted)' }}
              />
              {index === firstActiveIndex && (
                <span className="badge badge-warning" style={{ fontSize: '0.8rem', padding: '4px 8px', flexShrink: 0, marginLeft: '0.5rem' }}>
                  親
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={p.active}
                  onChange={() => togglePlayer(p.id)}
                  style={{ width: 'auto' }}
                />
                <span className="text-muted">参加</span>
              </label>
              <button className="btn btn-secondary" onClick={() => removePlayer(p.id)} style={{ padding: '0.5rem' }}>
                <X size={20} color="var(--danger)" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-between">
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={addPlayer}>
            <UserPlus size={20} />
            <span>追加</span>
          </button>
          <button className="btn btn-danger" onClick={resetGame}>
            <RotateCcw size={20} />
            <span>リセット</span>
          </button>
        </div>
        <button
          className="btn btn-primary animate-pulse-glow"
          onClick={handleStart}
          disabled={localPlayers.filter(p => p.active).length < 4}
        >
          <Play size={20} />
          <span>ゲーム開始</span>
        </button>
      </div>
    </div>
  );
};

export default SetupScreen;
