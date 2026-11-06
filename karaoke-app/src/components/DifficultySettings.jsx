import React, { useState } from 'react';
import { useGameContext } from '../store/GameContext';

// Shared difficulty controls for setup, active turns, and results.
const DifficultySettings = ({ duringTurn = false }) => {
  const { settings, setSettings } = useGameContext();
  const [minInput, setMinInput] = useState(String(settings.scoreTargetMin ?? 85));
  const [maxInput, setMaxInput] = useState(String(settings.scoreTargetMax ?? 95));
  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const commit = (key, draft, setter) => {
    const value = draft.trim() === '' ? NaN : Number(draft);
    const otherKey = key === 'scoreTargetMin' ? 'scoreTargetMax' : 'scoreTargetMin';
    const other = settings[otherKey] ?? (otherKey === 'scoreTargetMin' ? 85 : 95);
    const valid = Number.isInteger(value) && value >= 0 && value <= 100 &&
      (key === 'scoreTargetMin' ? value <= other : value >= other);
    if (valid) {
      update(key, value);
      setter(String(value));
    } else {
      setter(String(settings[key] ?? (key === 'scoreTargetMin' ? 85 : 95)));
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ marginBottom: '2rem', background: 'rgba(0,0,0,0.3)' }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>GM用 難易度調整</h3>
      <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
        {duringTurn ? '変更は次のターン、または現在のターンで条件を再抽選したときに反映されます。' : '変更は次に生成されるターンの条件から反映されます。'}
      </p>
      <div className="grid-cols-2">
        <div>
          <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>最大テーマ数</label>
          <select value={settings.themeMax} onChange={e => update('themeMax', Number(e.target.value))}>
            <option value={1}>1個 (Easy)</option>
            <option value={2}>2個 (Normal)</option>
            <option value={3}>3個 (Hard)</option>
          </select>
        </div>
        <div>
          <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>順位点 対象者数</label>
          <select value={settings.rankTargets} onChange={e => update('rankTargets', Number(e.target.value))}>
            <option value={1}>1人</option><option value={2}>2人</option>
          </select>
        </div>
        <div>
          <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>差しウマ 発生組数</label>
          <select value={settings.sashiumaPairs} onChange={e => update('sashiumaPairs', Number(e.target.value))}>
            <option value={1}>1組</option><option value={2}>2組</option>
          </select>
        </div>
        <div>
          <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>点数条件 範囲</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input aria-label="点数条件の下限" type="number" min="0" max="100" value={minInput}
              onChange={e => setMinInput(e.target.value)}
              onBlur={() => commit('scoreTargetMin', minInput, setMinInput)} style={{ padding: '0.5rem', minWidth: 0 }} />
            <span>〜</span>
            <input aria-label="点数条件の上限" type="number" min="0" max="100" value={maxInput}
              onChange={e => setMaxInput(e.target.value)}
              onBlur={() => commit('scoreTargetMax', maxInput, setMaxInput)} style={{ padding: '0.5rem', minWidth: 0 }} />
          </div>
          <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>0〜100点、下限は上限以下にしてください。</div>
        </div>
      </div>
    </div>
  );
};

export default DifficultySettings;
