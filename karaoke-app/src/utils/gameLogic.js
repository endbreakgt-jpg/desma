export const generateTurnConditions = (players, settings, hasPreviousTurns, excludedTypes = []) => {
  const conditions = {};

  // 1. Theme count (1 to themeMax)
  conditions.themeCount = Math.floor(Math.random() * settings.themeMax) + 1;

  // 2. Rank points
  const allRanks = Array.from({ length: players.length }, (_, i) => i + 1);
  const shuffledRanks = [...allRanks].sort(() => 0.5 - Math.random());
  conditions.targetRanks = shuffledRanks.slice(0, settings.rankTargets);

  // 3. Sashiuma (random 2 players)
  const shuffledPlayers = [...players].sort(() => 0.5 - Math.random());
  conditions.sashiumaPairs = [];
  for (let i = 0; i < settings.sashiumaPairs; i++) {
    if (i * 2 + 1 < shuffledPlayers.length) {
      conditions.sashiumaPairs.push([shuffledPlayers[i * 2], shuffledPlayers[i * 2 + 1]]);
    }
  }

  // 4. Score points
  // type 7/8 (today's max/min) require previous turn data
  const availableTypes = hasPreviousTurns
    ? [0, 1, 2, 3, 4, 5, 6, 7, 8]
    : [0, 1, 2, 3, 4, 5, 6];
  // Keep only positively weighted conditions. For consecutive-turn prevention,
  // first exclude both the previous turn and the current reroll (when possible).
  const configured = availableTypes.map(type => {
    const rawWeight = settings.scoreConditionWeights?.[type] ?? (type < 7 ? 2 : 1);
    const weight = Number(rawWeight);
    return { type, weight: Number.isFinite(weight) && weight > 0 ? weight : 0 };
  }).filter(candidate => candidate.weight > 0);
  // Malformed stored settings should never prevent a turn from starting.
  const pool = configured.length > 0
    ? configured
    : availableTypes.map(type => ({ type, weight: 1 }));
  const excluded = [...new Set(excludedTypes.filter(type => Number.isInteger(type)))];
  let candidates = pool.filter(candidate => !excluded.includes(candidate.type));
  if (candidates.length === 0 && excluded.length > 1) {
    // Prioritize the previous completed turn over avoiding the current reroll.
    candidates = pool.filter(candidate => candidate.type !== excluded[0]);
  }
  // A single enabled condition is unavoidable, so allow it as a final fallback.
  if (candidates.length === 0) candidates = pool;
  const weightTotal = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  let selection = Math.random() * weightTotal;
  const scoreType = candidates.find(candidate => {
    selection -= candidate.weight;
    return selection < 0;
  })?.type ?? candidates[candidates.length - 1].type;
  conditions.scorePoint = { type: scoreType };

  const minTarget = settings.scoreTargetMin ?? 85;
  const maxTarget = settings.scoreTargetMax ?? 95;
  const range = maxTarget - minTarget + 1;

  if (scoreType === 0) conditions.scorePoint.target = (Math.floor(Math.random() * range) + minTarget);
  if (scoreType === 1) conditions.scorePoint.target = (Math.floor(Math.random() * range) + minTarget - 5);
  if (scoreType === 2) {
    conditions.scorePoint.target = (Math.floor(Math.random() * range) + minTarget);
    conditions.scorePoint.margin = settings.scoreMargin ?? 5;
  }
  if (scoreType === 3 || scoreType === 4) {
    conditions.scorePoint.targetPlayer = players[Math.floor(Math.random() * players.length)];
  }
  // 5-8 are calculated at the end of the turn

  return conditions;
};

// Calculate all penalties at the end of the turn
export const calculateTurnResults = (players, scores, penaltiesInput, conditions, turns) => {
  // scores: { playerId: { raw: number (e.g. 90.125), int: number (90125) } }
  // penaltiesInput: { playerId: { themeMisses: number, timeout: boolean } }
  
  const results = {};
  players.forEach(p => {
    results[p.id] = { totalPenalty: 0, details: [] };
    
    // Manual inputs
    if (penaltiesInput[p.id].themeMisses > 0) {
      results[p.id].totalPenalty += penaltiesInput[p.id].themeMisses;
      results[p.id].details.push(`テーマミス x${penaltiesInput[p.id].themeMisses}`);
    }
    if (penaltiesInput[p.id].timeout) {
      results[p.id].totalPenalty += 1;
      results[p.id].details.push(`時間切れ`);
    }
  });

  // Calculate ranks
  const sortedPlayers = [...players].sort((a, b) => scores[b.id].int - scores[a.id].int);
  
  // Assign ranks with ties
  const ranks = {}; // playerId -> rank
  let currentRank = 1;
  let currentScore = -1;
  let tieCount = 0;
  
  sortedPlayers.forEach((p, index) => {
    if (scores[p.id].int !== currentScore) {
      currentRank = index + 1;
      currentScore = scores[p.id].int;
    }
    ranks[p.id] = currentRank;
  });

  // 1. Last place penalty
  const lastRank = Math.max(...Object.values(ranks));
  players.forEach(p => {
    if (ranks[p.id] === lastRank) {
      results[p.id].totalPenalty += 1;
      results[p.id].details.push('最下位（同点含む）');
    }
  });

  // 2. Rank points
  conditions.targetRanks.forEach(targetRank => {
    players.forEach(p => {
      if (ranks[p.id] === targetRank) {
        results[p.id].totalPenalty += 1;
        results[p.id].details.push(`${targetRank}位`);
      }
    });
  });

  // 3. Sashiuma
  conditions.sashiumaPairs.forEach(pair => {
    const score0 = scores[pair[0].id].int;
    const score1 = scores[pair[1].id].int;
    if (score0 < score1) {
      results[pair[0].id].totalPenalty += 1;
      results[pair[0].id].details.push(`${pair[1].name}に敗北`);
    } else if (score1 < score0) {
      results[pair[1].id].totalPenalty += 1;
      results[pair[1].id].details.push(`${pair[0].name}に敗北`);
    }
    // Tie is draw, no penalty
  });

  // 4. Score points
  const avg = Object.values(scores).reduce((sum, s) => sum + s.int, 0) / players.length;
  const sp = conditions.scorePoint;
  
  // Helpers to get player's historical min/max from turns list
  const getPlayerMaxInt = (playerId) => {
    let max = 0;
    turns.forEach(t => {
      if (t.scores[playerId]) {
        if (t.scores[playerId].int > max) max = t.scores[playerId].int;
      }
    });
    return max;
  };

  const getPlayerMinInt = (playerId) => {
    let min = Infinity;
    turns.forEach(t => {
      if (t.scores[playerId]) {
        if (t.scores[playerId].int < min) min = t.scores[playerId].int;
      }
    });
    return min === Infinity ? 0 : min;
  };

  players.forEach(p => {
    let failed = false;
    let reason = '';
    const myScore = scores[p.id].int;

    switch (sp.type) {
      case 0:
        if (myScore < sp.target * 1000) { failed = true; reason = `${sp.target}点以上 出せず`; }
        break;
      case 1:
        if (myScore > sp.target * 1000) { failed = true; reason = `${sp.target}点以下 出せず`; }
        break;
      case 2:
        const targetInt = sp.target * 1000;
        const marginInt = sp.margin * 1000;
        if (myScore < targetInt - marginInt || myScore > targetInt + marginInt) {
          failed = true; reason = `${sp.target}点±${sp.margin} 出せず`;
        }
        break;
      case 3: // Over Player C
        if (p.id !== sp.targetPlayer.id) {
          if (myScore < scores[sp.targetPlayer.id].int) { failed = true; reason = `${sp.targetPlayer.name}より上 出せず`; }
        } else {
          const others = players.filter(other => other.id !== p.id);
          const allOthersPassed = others.every(other => scores[other.id].int > myScore);
          if (allOthersPassed) {
            failed = true; reason = `全員に負けた`;
          }
        }
        break;
      case 4: // Under Player C
        if (p.id !== sp.targetPlayer.id) {
          if (myScore > scores[sp.targetPlayer.id].int) { failed = true; reason = `${sp.targetPlayer.name}より下 出せず`; }
        } else {
          const others = players.filter(other => other.id !== p.id);
          const allOthersPassed = others.every(other => scores[other.id].int < myScore);
          if (allOthersPassed) {
            failed = true; reason = `全員に勝ってしまった`;
          }
        }
        break;
      case 5:
        if (myScore < avg) { failed = true; reason = `平均点以上 出せず`; }
        break;
      case 6:
        if (myScore > avg) { failed = true; reason = `平均点以下 出せず`; }
        break;
      case 7:
        const myMax = getPlayerMaxInt(p.id);
        if (myScore < myMax) { failed = true; reason = `自己最高得点 (${(myMax/1000).toFixed(3)}) 出せず`; }
        break;
      case 8:
        const myMin = getPlayerMinInt(p.id);
        if (myScore > myMin) { failed = true; reason = `自己最低得点 (${(myMin/1000).toFixed(3)}) 出せず`; }
        break;
      default: break;
    }

    if (failed) {
      results[p.id].totalPenalty += 1;
      results[p.id].details.push(reason);
    }
  });

  return { results, avg };
};
