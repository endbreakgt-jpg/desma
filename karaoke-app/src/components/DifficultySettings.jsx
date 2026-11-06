import React, { useState } from 'react';
import { useGameContext } from '../store/GameContext';

const SCORE_CONDITIONS = [
  '指定点数以上', '指定点数以下', '指定点数±マージン以内',
  '指定プレイヤーより上', '指定プレイヤーより下',
  '本ターン平均点以上', '本ターン平均点以下',
  '自己最高得点以上', '自己最低得点以下'
];

// Shared difficulty controls for setup, active turns, and results.
const DifficultySettings = ({ duringTurn = false }) => {
  const { settings, setSettings } = useGameContext();
  const [minInput, setMinInput] = useState(String(settings.scoreTargetMin ?? 85));
  const [maxInput, setMaxInput] = useState(String(settings.scoreTargetMax ?? 95));
  const [marginInput, setMarginInput] = useState(String(settings.scoreMargin ?? 2));
  const weights = SCORE_CONDITIONS.map((_, i) => settings.scoreConditionWeights?.[i] ?? 1);
  const totalWeight = weights.reduce((sum, weight) => sum + (Number.isFinite(Number(weight)) && Number(weight) > 0 ? Number(weight) : 0), 0);
  const [weightDrafts, setWeightDrafts] = useState(() => SCORE_CONDITIONS.map((_, i) => String(settings.scoreConditionWeights?.[i] ?? 1)));
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

  const commitMargin = () => {
    const value = marginInput.trim() === '' ? NaN : Number(marginInput);
    if (Number.isFinite(value) && value >= 0 && value <= 100 && Math.round(value * 1000) === value * 1000) {
      update('scoreMargin', value);
      setMarginInput(String(value));
    } else {
      setMarginInput(String(settings.scoreMargin ?? 2));
    }
  };

  const commitWeight = (index) => {
    const draft = weightDrafts[index];
    const value = draft.trim() === '' ? NaN : Number(draft);
    const next = [...weights];
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      setWeightDrafts(prev => prev.map((v, i) => i === index ? String(weights[index]) : v));
      return;
    }
    next[index] = value;
    // Always leave at least one enabled condition for both first and later turns.
    if (next.slice(0, 7).every(w => w === 0)) {
      setWeightDrafts(prev => prev.map((v, i) => i === index ? String(weights[index]) : v));
      return;
    }
    update('scoreConditionWeights', next);
    setWeightDrafts(prev => prev.map((v, i) => i === index ? String(value) : v));
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
      <div style={{ marginTop: '1.5rem' }}>
        <label className="text-muted" htmlFor="score-margin" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>±条件のマージン値（点）</label>
        <input id="score-margin" type="number" min="0" max="100" step="0.001" value={marginInput}
          onChange={e => setMarginInput(e.target.value)} onBlur={commitMargin}
          style={{ padding: '0.5rem', maxWidth: '160px' }} />
        <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>
          例：2なら「90点±2点」（88.000〜92.000点）。変更後の抽選から適用されます。
        </div>
      </div>
      <div style={{ marginTop: '1.5rem' }}>
        <h4 style={{ marginBottom: '0.5rem', color: 'var(--accent)' }}>点数条件の出現重み</h4>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          0は出現なし、1〜100で設定。各条件の出現確率は「重み ÷ 有効な条件の重み合計」です。初期値はすべて1（均等）。
          初回ターンは自己最高・自己最低条件を抽選しません。最初の7条件はすべて0にできません。
        </p>
        <div style={{ display: 'grid', gap: '0.65rem' }}>
          {SCORE_CONDITIONS.map((label, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <label htmlFor={`condition-weight-${i}`} style={{ fontSize: '0.9rem', flex: 1 }}>
                {label}{i >= 7 && <span className="text-muted">（2ターン目以降）</span>}
              </label>
              <input id={`condition-weight-${i}`} aria-label={`${label}の重み`} type="number" min="0" max="100" step="1"
                value={weightDrafts[i]} onChange={e => setWeightDrafts(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                onBlur={() => commitWeight(i)}
                style={{ width: '75px', padding: '0.45rem', flexShrink: 0 }} />
              <span className="text-muted" style={{ width: '54px', fontSize: '0.8rem', textAlign: 'right' }}>
                {totalWeight > 0 ? `${((Number(weights[i]) || 0) / totalWeight * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          ))}
        </div>
        <button className="btn btn-secondary" style={{ marginTop: '0.9rem', padding: '0.5rem 0.8rem' }}
          onClick={() => {
            update('scoreConditionWeights', SCORE_CONDITIONS.map(() => 1));
            setWeightDrafts(SCORE_CONDITIONS.map(() => '1'));
          }}>重みを均等に戻す</button>
      </div>
    </div>
  );
};

export default DifficultySettings;
