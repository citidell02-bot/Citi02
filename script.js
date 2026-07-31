(() => {
  "use strict";

  const STORAGE_KEY = "study-quest-state-v1";
  const XP_PER_FOCUS = 25;
  const XP_PER_LEVEL = 100;
  const MAX_LEVEL = 100;
  const TOKENS_PER_LEVEL = 10;
  const STREAK_GOAL = 7;
  const RANK_TIERS = [
    { max: 10, name: "Beginner" },
    { max: 20, name: "Amateur" },
    { max: 30, name: "Novice" },
    { max: 40, name: "Apprentice" },
    { max: 50, name: "Expert" },
  ];
  const DIFFICULTY = {
    easy: { label: "Easy", xp: 10 },
    medium: { label: "Medium", xp: 20 },
    hard: { label: "Hard", xp: 30 },
  };
  const THEMES = [
    {
      id: "neon",
      name: "Neon Night",
      cost: 0,
      desc: "Default cyan & magenta HUD.",
      swatch: "linear-gradient(90deg, #00e5ff, #ff2bd6)",
    },
    {
      id: "sports",
      name: "Sports Arena",
      cost: 20,
      desc: "Sky-blue stadium day with a green pitch below.",
      swatch: "linear-gradient(90deg, #2ecc71, #e74c3c)",
    },
    {
      id: "forest",
      name: "Forest Circuit",
      cost: 20,
      desc: "Mountain ridges, pine treeline, and cool alpine light.",
      swatch: "linear-gradient(90deg, #3dff9a, #d4ff5a)",
    },
    {
      id: "aurora",
      name: "Aurora Drift",
      cost: 30,
      desc: "Night drift track with lane marks and tire smoke.",
      swatch: "linear-gradient(90deg, #5adcff, #ff6bb5)",
    },
    {
      id: "goldrush",
      name: "Sonic Theme",
      cost: 40,
      desc: "Speed-zone blue skies, green hills, rings, and checkered loops.",
      swatch: "linear-gradient(90deg, #1a9fff, #3dff6a 50%, #f2be37)",
    },
  ];
  const GAMES = [
    {
      id: "reaction",
      name: "Reaction Dash",
      cost: 15,
      desc: "Tap the moment it turns green.",
    },
    {
      id: "memory",
      name: "Funk Night",
      cost: 25,
      desc: "Simple 4-lane rhythm game — hit the arrows on beat.",
    },
    {
      id: "numbers",
      name: "Number Rush",
      cost: 20,
      desc: "Hit 1–9 in order as fast as you can.",
    },
  ];

  const els = {
    questForm: document.getElementById("quest-form"),
    questInput: document.getElementById("quest-input"),
    questList: document.getElementById("quest-list"),
    questEmpty: document.getElementById("quest-empty"),
    questCount: document.getElementById("quest-count"),
    timerTime: document.getElementById("timer-time"),
    timerMinutes: document.getElementById("timer-minutes"),
    timerSeconds: document.getElementById("timer-seconds"),
    timerDisplay: document.querySelector(".timer-display"),
    timerMode: document.getElementById("timer-mode"),
    timerToggle: document.getElementById("timer-toggle"),
    timerReset: document.getElementById("timer-reset"),
    timerHint: document.getElementById("timer-hint"),
    modeButtons: [...document.querySelectorAll(".mode-btn")],
    levelLabel: document.getElementById("level-label"),
    totalXp: document.getElementById("total-xp"),
    questsCleared: document.getElementById("quests-cleared"),
    sessionsDone: document.getElementById("sessions-done"),
    focusTimeMeta: document.getElementById("focus-time-meta"),
    focusTimeBar: document.getElementById("focus-time-bar"),
    focusTimeFill: document.getElementById("focus-time-fill"),
    questsMeta: document.getElementById("quests-meta"),
    questsBar: document.getElementById("quests-bar"),
    questsFill: document.getElementById("quests-fill"),
    sessionsMeta: document.getElementById("sessions-meta"),
    sessionsBar: document.getElementById("sessions-bar"),
    sessionsFill: document.getElementById("sessions-fill"),
    xpCurrent: document.getElementById("xp-current"),
    xpNeeded: document.getElementById("xp-needed"),
    xpBar: document.getElementById("xp-bar"),
    xpBarFill: document.getElementById("xp-bar-fill"),
    maxLevelToggle: document.getElementById("max-level-toggle"),
    goMaxLevel: document.getElementById("go-max-level"),
    resetLevel: document.getElementById("reset-level"),
    tokenCount: document.getElementById("token-count"),
    themeShop: document.getElementById("theme-shop"),
    gameShop: document.getElementById("game-shop"),
    gameModal: document.getElementById("game-modal"),
    gameTitle: document.getElementById("game-title"),
    gameStatus: document.getElementById("game-status"),
    gameStage: document.getElementById("game-stage"),
    statsMeta: document.getElementById("stats-meta"),
    streakLabel: document.getElementById("streak-label"),
    streakDays: document.getElementById("streak-days"),
    streakCurrent: document.getElementById("streak-current"),
    streakGoal: document.getElementById("streak-goal"),
    streakBar: document.getElementById("streak-bar"),
    streakBarFill: document.getElementById("streak-bar-fill"),
    streakHint: document.getElementById("streak-hint"),
    streakPanel: document.querySelector(".streak-panel"),
    toast: document.getElementById("toast"),
  };

  const defaultState = () => ({
    quests: [],
    totalXp: 0,
    questsCleared: 0,
    sessionsDone: 0,
    focusMinutes: 0,
    maxLevelEnabled: false,
    tokens: 0,
    ownedThemes: ["neon"],
    ownedGames: [],
    activeTheme: "neon",
    studyDates: [],
  });

  let state = loadState();
  let timer = {
    mode: "focus",
    minutes: 0,
    customDurationSeconds: 0,
    remaining: 0,
    running: false,
    intervalId: null,
    suppressInputCommit: false,
  };
  let toastTimer = null;
  let gameCleanup = null;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const base = defaultState();
      const ownedThemes = Array.isArray(parsed.ownedThemes)
        ? [...new Set(["neon", ...parsed.ownedThemes.map((id) => (id === "ember" ? "sports" : id))])]
        : base.ownedThemes;
      const ownedGames = Array.isArray(parsed.ownedGames) ? parsed.ownedGames : [];
      let activeTheme = parsed.activeTheme === "ember" ? "sports" : parsed.activeTheme;
      activeTheme = ownedThemes.includes(activeTheme) ? activeTheme : "neon";
      return {
        ...base,
        ...parsed,
        quests: Array.isArray(parsed.quests) ? parsed.quests : [],
        tokens: Number.isFinite(parsed.tokens) ? parsed.tokens : 0,
        focusMinutes: Number.isFinite(parsed.focusMinutes) ? parsed.focusMinutes : 0,
        ownedThemes,
        ownedGames,
        activeTheme,
        studyDates: Array.isArray(parsed.studyDates)
          ? [...new Set(parsed.studyDates.filter((d) => typeof d === "string"))]
          : [],
      };
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function xpForLevel(_level) {
    return XP_PER_LEVEL;
  }

  function rankForLevel(level) {
    for (const tier of RANK_TIERS) {
      if (level <= tier.max) return tier.name;
    }
    return null;
  }

  function getLevelInfo(totalXp) {
    let level = 1;
    let remaining = totalXp;
    let need = xpForLevel(level);
    const capEnabled = Boolean(state.maxLevelEnabled);

    while ((!capEnabled || level < MAX_LEVEL) && remaining >= need) {
      remaining -= need;
      level += 1;
      need = xpForLevel(level);
    }

    if (capEnabled && level >= MAX_LEVEL) {
      return {
        level: MAX_LEVEL,
        current: remaining,
        needed: need,
        percent: 100,
        isMax: true,
        rank: rankForLevel(MAX_LEVEL),
      };
    }

    return {
      level,
      current: remaining,
      needed: need,
      percent: Math.min(100, Math.round((remaining / need) * 100)),
      isMax: false,
      rank: rankForLevel(level),
    };
  }

  function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  let audioCtx = null;

  function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  // Synthesized Mario-style power-up: rising major-triad square-wave arpeggio
  function playLevelUpSound() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      523.25, 659.25, 783.99, 1046.5, 1318.51,
      1567.98, 2093.0, 2637.02, 3135.96, 4186.01,
    ];
    const noteDuration = 0.075;
    const startAt = ctx.currentTime + 0.02;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;

      const t0 = startAt + index * noteDuration;
      const t1 = t0 + noteDuration;

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t1 + 0.02);
    });
  }

  // Synthesized Pokémon-style item pickup: short bright ascending chirp
  function playXpSound() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { freq: 987.77, start: 0, dur: 0.07 },
      { freq: 1318.51, start: 0.07, dur: 0.09 },
      { freq: 1760.0, start: 0.14, dur: 0.14 },
    ];
    const startAt = ctx.currentTime + 0.01;

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;

      const t0 = startAt + start;
      const t1 = t0 + dur;

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.1, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t1 + 0.02);
    });
  }

  // Synthesized Pokémon-style save jingle for button presses
  function playSaveSound() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { freq: 523.25, start: 0, dur: 0.06 },
      { freq: 659.25, start: 0.06, dur: 0.06 },
      { freq: 783.99, start: 0.12, dur: 0.06 },
      { freq: 1046.5, start: 0.18, dur: 0.08 },
      { freq: 1318.51, start: 0.26, dur: 0.16 },
    ];
    const startAt = ctx.currentTime + 0.005;

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;

      const t0 = startAt + start;
      const t1 = t0 + dur;
      const peak = start === 0.26 ? 0.11 : 0.08;

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t1 + 0.02);
    });
  }

  function playToneNotes(notes, wave = "triangle", volume = 0.1) {
    const ctx = getAudioContext();
    if (!ctx) return;

    const startAt = ctx.currentTime + 0.01;
    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.value = freq;

      const t0 = startAt + start;
      const t1 = t0 + dur;

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t1 + 0.03);
    });
  }

  function createNoiseBuffer(ctx, duration = 0.2) {
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Minimal funk bed + SFX for Funk Night
  function createFunkAudio(bpm) {
    const ctx = getAudioContext();
    const beatDur = 60 / Math.max(1, bpm || 120);
    if (!ctx) {
      return {
        startTrack() {},
        stop() {},
        playHit() {},
        playCountdown() {},
        playResult() {},
        playHold() {},
        beatDur,
      };
    }

    const master = ctx.createGain();
    master.gain.value = 0.28;
    master.connect(ctx.destination);
    const music = ctx.createGain();
    music.gain.value = 0.75;
    music.connect(master);
    const sfx = ctx.createGain();
    sfx.gain.value = 1;
    sfx.connect(master);
    const noiseBuffer = createNoiseBuffer(ctx, 0.25);
    let trackToken = 0;

    function tone(type, freq, t, dur, peak, dest, slideTo = null) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(1, freq), t);
      if (slideTo != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    function noise(t, dur, peak, hp) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = hp;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(music);
      src.start(t);
      src.stop(t + dur + 0.02);
    }

    function startTrack(totalBeats, countdownBeats) {
      trackToken += 1;
      const token = trackToken;
      const t0 = ctx.currentTime + 0.04;
      music.gain.setValueAtTime(0.0001, t0);
      music.gain.exponentialRampToValueAtTime(0.75, t0 + 0.1);
      const roots = [82.41, 98.0, 73.42, 110.0];

      for (let beat = 0; beat < totalBeats; beat += 1) {
        if (token !== trackToken) break;
        const t = t0 + beat * beatDur;
        const barBeat = beat % 4;
        if (beat < countdownBeats) {
          if (barBeat === 0) tone("sine", 160, t, 0.12, 0.45, music, 45);
          tone("square", barBeat === 0 ? 880 : 660, t, 0.04, 0.06, sfx);
          continue;
        }
        if (barBeat === 0) tone("sine", 160, t, 0.16, 0.7, music, 42);
        if (barBeat === 2) noise(t, 0.1, 0.22, 1400);
        noise(t, 0.03, 0.06, 7000);
        if (barBeat === 0 || barBeat === 2) {
          const root = roots[((beat - countdownBeats) >> 2) % roots.length];
          tone("sawtooth", root, t, 0.22, 0.14, music, root * 0.95);
        }
        if ((beat - countdownBeats) % 2 === 0) {
          tone("square", 392 + ((beat - countdownBeats) % 8) * 20, t + beatDur * 0.25, 0.1, 0.05, music);
        }
      }
    }

    function stop() {
      trackToken += 1;
      const now = ctx.currentTime;
      music.gain.cancelScheduledValues(now);
      music.gain.setTargetAtTime(0.0001, now, 0.04);
    }

    function playHit(quality) {
      const t = ctx.currentTime + 0.001;
      if (quality === "perfect" || quality === "sick" || quality === "good") {
        tone("square", quality === "perfect" ? 1200 : 880, t, 0.06, 0.1, sfx);
      } else {
        tone("sawtooth", 120, t, 0.12, 0.1, sfx, 60);
      }
    }

    function playHold() {
      tone("triangle", 720, ctx.currentTime + 0.001, 0.08, 0.07, sfx);
    }

    function playCountdown(n) {
      const t = ctx.currentTime + 0.001;
      tone("square", n <= 0 ? 784 : 400 + (4 - Math.min(4, n)) * 80, t, 0.09, 0.11, sfx);
    }

    function playResult(cleared) {
      const t = ctx.currentTime + 0.02;
      if (cleared) {
        [523, 659, 784].forEach((f, i) => tone("square", f, t + i * 0.08, 0.12, 0.1, sfx));
      } else {
        tone("sawtooth", 200, t, 0.28, 0.1, sfx, 70);
      }
    }

    return { startTrack, stop, playHit, playCountdown, playResult, playHold, beatDur };
  }

  // Focus/study cue — firm ascending chime
  function playStudySound(kind = "start") {
    if (kind === "complete") {
      playToneNotes(
        [
          { freq: 392.0, start: 0, dur: 0.12 },
          { freq: 523.25, start: 0.12, dur: 0.12 },
          { freq: 659.25, start: 0.24, dur: 0.14 },
          { freq: 783.99, start: 0.38, dur: 0.22 },
        ],
        "triangle",
        0.12
      );
      return;
    }

    playToneNotes(
      [
        { freq: 440.0, start: 0, dur: 0.14 },
        { freq: 554.37, start: 0.14, dur: 0.18 },
      ],
      "triangle",
      0.11
    );
  }

  // Break cue — softer descending / gentle wake chime
  function playBreakSound(kind = "start") {
    if (kind === "complete") {
      playToneNotes(
        [
          { freq: 523.25, start: 0, dur: 0.12 },
          { freq: 659.25, start: 0.14, dur: 0.12 },
          { freq: 783.99, start: 0.28, dur: 0.2 },
        ],
        "sine",
        0.1
      );
      return;
    }

    playToneNotes(
      [
        { freq: 659.25, start: 0, dur: 0.14 },
        { freq: 523.25, start: 0.14, dur: 0.18 },
      ],
      "sine",
      0.09
    );
  }

  function playTimerModeSound(kind = "start") {
    if (timer.mode === "focus") playStudySound(kind);
    else playBreakSound(kind);
  }

  function showToast(message) {
    els.toast.hidden = false;
    els.toast.textContent = message;
    requestAnimationFrame(() => els.toast.classList.add("is-visible"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.classList.remove("is-visible");
      setTimeout(() => {
        els.toast.hidden = true;
      }, 250);
    }, 2200);
  }

  function addXp(amount, reason) {
    const before = getLevelInfo(state.totalXp);
    state.totalXp += amount;
    const after = getLevelInfo(state.totalXp);
    const levelsGained = Math.max(0, after.level - before.level);

    if (levelsGained > 0) {
      const tokensEarned = levelsGained * TOKENS_PER_LEVEL;
      state.tokens += tokensEarned;
      saveState();
      renderXp();
      renderTokens();
      renderShop();
      playLevelUpSound();
      if (after.isMax) {
        showToast(`Max level! +${tokensEarned} tokens`);
      } else if (after.rank && after.rank !== before.rank) {
        showToast(`Rank up! ${after.rank} · +${tokensEarned} tokens`);
      } else {
        showToast(`Level ${after.level}! +${tokensEarned} tokens`);
      }
    } else {
      saveState();
      renderXp();
      playXpSound();
      showToast(`+${amount} XP — ${reason}`);
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function renderQuests() {
    const active = state.quests.filter((q) => !q.done).length;
    els.questCount.textContent = `${active} active`;
    els.questEmpty.hidden = state.quests.length > 0;
    els.questList.innerHTML = "";

    state.quests.forEach((quest) => {
      const li = document.createElement("li");
      li.className = `quest-item${quest.done ? " is-done" : ""}`;
      li.dataset.id = quest.id;

      const check = document.createElement("button");
      check.type = "button";
      check.className = "quest-check";
      check.setAttribute("aria-label", quest.done ? "Mark quest incomplete" : "Complete quest");
      check.addEventListener("click", () => toggleQuest(quest.id));

      const text = document.createElement("span");
      text.className = "quest-text";
      text.textContent = quest.text;

      const difficulty = normalizeDifficulty(quest.difficulty);
      const badge = document.createElement("span");
      badge.className = `quest-badge ${difficulty}`;
      badge.textContent = `${DIFFICULTY[difficulty].label} · ${questXp(quest)} XP`;

      const del = document.createElement("button");
      del.type = "button";
      del.className = "quest-delete";
      del.setAttribute("aria-label", "Delete quest");
      del.textContent = "×";
      del.addEventListener("click", () => deleteQuest(quest.id));

      li.append(check, text, badge, del);
      els.questList.appendChild(li);
    });
  }

  function normalizeDifficulty(value) {
    return DIFFICULTY[value] ? value : "medium";
  }

  function questXp(quest) {
    if (typeof quest.xp === "number") return quest.xp;
    return DIFFICULTY[normalizeDifficulty(quest.difficulty)].xp;
  }

  function nextStatGoal(value, base) {
    if (value < base) return base;
    return Math.ceil((value + 1) / base) * base;
  }

  function updateStatBar(fillEl, barEl, metaEl, value, goal, unitLabel) {
    const safeGoal = Math.max(1, goal);
    const percent = Math.min(100, Math.round((value / safeGoal) * 100));
    fillEl.style.width = `${percent}%`;
    barEl.setAttribute("aria-valuemax", String(safeGoal));
    barEl.setAttribute("aria-valuenow", String(Math.min(value, safeGoal)));
    barEl.setAttribute("aria-valuetext", `${value} of ${safeGoal} ${unitLabel}`);
    metaEl.textContent = `${value} / ${safeGoal} ${unitLabel}`;
  }

  function renderStatBars() {
    const focusGoal = nextStatGoal(state.focusMinutes, 60);
    const questGoal = nextStatGoal(state.questsCleared, 10);
    const sessionGoal = nextStatGoal(state.sessionsDone, 8);

    updateStatBar(
      els.focusTimeFill,
      els.focusTimeBar,
      els.focusTimeMeta,
      state.focusMinutes,
      focusGoal,
      "min"
    );
    updateStatBar(
      els.questsFill,
      els.questsBar,
      els.questsMeta,
      state.questsCleared,
      questGoal,
      "quests"
    );
    updateStatBar(
      els.sessionsFill,
      els.sessionsBar,
      els.sessionsMeta,
      state.sessionsDone,
      sessionGoal,
      "sessions"
    );

    if (els.statsMeta) {
      els.statsMeta.textContent = `${state.focusMinutes} min focused`;
    }
  }

  function renderXp() {
    const info = getLevelInfo(state.totalXp);
    if (info.isMax) {
      els.levelLabel.textContent = info.rank
        ? `${info.rank} · Level ${MAX_LEVEL} · MAX`
        : `Level ${MAX_LEVEL} · MAX`;
    } else if (info.rank) {
      els.levelLabel.textContent = `${info.rank} · Level ${info.level}`;
    } else {
      els.levelLabel.textContent = `Level ${info.level}`;
    }
    els.totalXp.textContent = String(state.totalXp);
    els.questsCleared.textContent = String(state.questsCleared);
    els.sessionsDone.textContent = String(state.sessionsDone);
    els.xpCurrent.textContent = `${info.current} XP`;
    els.xpNeeded.textContent = info.isMax
      ? "Max level reached"
      : `${info.needed} XP to Level ${info.level + 1}`;
    els.xpBarFill.style.width = `${info.percent}%`;
    els.xpBar.setAttribute("aria-valuenow", String(info.percent));
    els.xpBar.setAttribute(
      "aria-valuetext",
      info.isMax ? "Max level reached" : `${info.current} of ${info.needed} XP`
    );
    renderStatBars();
    renderMaxLevelToggle();
  }

  function renderMaxLevelToggle() {
    const on = Boolean(state.maxLevelEnabled);
    els.maxLevelToggle.textContent = on ? "Max Level 100: On" : "Max Level 100: Off";
    els.maxLevelToggle.setAttribute("aria-pressed", on ? "true" : "false");
    els.maxLevelToggle.classList.toggle("is-on", on);
  }

  function toggleMaxLevel() {
    state.maxLevelEnabled = !state.maxLevelEnabled;
    saveState();
    renderXp();
    showToast(
      state.maxLevelEnabled
        ? "Max level 100 enabled"
        : "Max level disabled — unlimited leveling"
    );
  }

  function xpToReachLevel(targetLevel) {
    let total = 0;
    for (let level = 1; level < targetLevel; level += 1) {
      total += xpForLevel(level);
    }
    return total;
  }

  function goMaxLevel() {
    const before = getLevelInfo(state.totalXp);
    state.maxLevelEnabled = true;
    state.totalXp = Math.max(state.totalXp, xpToReachLevel(MAX_LEVEL));
    const after = getLevelInfo(state.totalXp);
    const levelsGained = Math.max(0, after.level - before.level);
    const tokensEarned = levelsGained * TOKENS_PER_LEVEL;
    if (tokensEarned > 0) state.tokens += tokensEarned;
    saveState();
    renderXp();
    renderTokens();
    renderShop();

    if (levelsGained > 0) {
      playLevelUpSound();
      showToast(`Max level! +${tokensEarned} tokens`);
    } else {
      showToast(`Already at Level ${MAX_LEVEL}`);
    }
  }

  function resetLevel() {
    state.totalXp = 0;
    saveState();
    renderXp();
    showToast("Level reset — back to Beginner");
  }

  function renderTimer() {
    const mins = Math.floor(timer.remaining / 60);
    const secs = timer.remaining % 60;
    if (document.activeElement !== els.timerMinutes) {
      els.timerMinutes.value = String(mins);
    }
    if (document.activeElement !== els.timerSeconds) {
      els.timerSeconds.value = String(secs).padStart(2, "0");
    }
    els.timerDisplay.classList.toggle("is-running", timer.running);
    els.timerToggle.textContent = timer.running ? "Pause" : "Start";
    document.title = timer.running
      ? `${formatTime(timer.remaining)} · Study Quest`
      : "Study Quest";
  }

  function forceTimerInputs() {
    const mins = Math.floor(timer.remaining / 60);
    const secs = timer.remaining % 60;
    els.timerMinutes.value = String(mins);
    els.timerSeconds.value = String(secs).padStart(2, "0");
  }

  function clampInt(value, min, max, fallback) {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function applyManualTime({ commitDuration = true } = {}) {
    if (timer.running || timer.suppressInputCommit) return;

    const minutes = clampInt(els.timerMinutes.value, 0, 180, 0);
    const seconds = clampInt(els.timerSeconds.value, 0, 59, 0);
    let total = minutes * 60 + seconds;

    if (total <= 0) {
      timer.remaining = 0;
      if (commitDuration) {
        timer.customDurationSeconds = 0;
        timer.minutes = 0;
      }
      forceTimerInputs();
      els.timerToggle.textContent = "Start";
      document.title = "Study Quest";
      return;
    }

    timer.remaining = total;

    if (commitDuration) {
      const changed = total !== timer.customDurationSeconds;
      timer.customDurationSeconds = total;
      timer.minutes = Math.max(1, Math.round(total / 60));
      if (changed) {
        showToast(`Custom time set · ${formatTime(total)}`);
      }
    }

    forceTimerInputs();
    els.timerToggle.textContent = "Start";
    document.title = "Study Quest";
  }

  function selectedDifficulty() {
    const checked = els.questForm.querySelector('input[name="difficulty"]:checked');
    return normalizeDifficulty(checked ? checked.value : "medium");
  }

  function addQuest(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const difficulty = selectedDifficulty();

    state.quests.unshift({
      id: uid(),
      text: trimmed,
      difficulty,
      xp: DIFFICULTY[difficulty].xp,
      done: false,
      createdAt: Date.now(),
    });
    saveState();
    renderQuests();
    els.questInput.value = "";
    els.questInput.focus();
  }

  function toggleQuest(id) {
    const quest = state.quests.find((q) => q.id === id);
    if (!quest) return;
    const xp = questXp(quest);

    if (!quest.done) {
      quest.done = true;
      state.questsCleared += 1;
      saveState();
      renderQuests();
      const study = recordStudyDay();
      addXp(xp, `${DIFFICULTY[normalizeDifficulty(quest.difficulty)].label} quest complete`);
      if (study.isNewDay && study.streak >= 2) {
        setTimeout(() => showToast(`${study.streak}-day study streak!`), 2400);
      }
    } else {
      quest.done = false;
      state.questsCleared = Math.max(0, state.questsCleared - 1);
      state.totalXp = Math.max(0, state.totalXp - xp);
      saveState();
      renderQuests();
      renderXp();
    }
  }

  function deleteQuest(id) {
    state.quests = state.quests.filter((q) => q.id !== id);
    saveState();
    renderQuests();
  }

  function setMode(mode, presetMinutes) {
    const wasRunning = timer.running;
    stopTimer(false);
    timer.mode = mode;

    els.modeButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.mode === mode);
    });

    const labels = { focus: "Focus", short: "Short Break", long: "Long Break" };
    els.timerMode.textContent = labels[mode] || "Focus";

    if (Number.isFinite(presetMinutes) && presetMinutes > 0) {
      const total = Math.round(presetMinutes) * 60;
      timer.customDurationSeconds = total;
      timer.minutes = Math.round(presetMinutes);
      timer.remaining = total;
      forceTimerInputs();
      showToast(`${labels[mode] || "Timer"} · ${formatTime(total)}`);
    } else if (wasRunning && timer.customDurationSeconds > 0) {
      // Keep the user's custom time; restore it if they switched modes mid-run
      timer.remaining = timer.customDurationSeconds;
    }

    els.timerHint.textContent =
      mode === "focus"
        ? "Set a custom study time, then Start. Focus sessions earn +25 XP."
        : mode === "short"
          ? "Short break set to 5:00. Press Start when you're ready."
          : mode === "long"
            ? "Long break set to 15:00. Press Start when you're ready."
            : "Break mode — set a custom time or keep your saved time, then Start.";

    renderTimer();
  }

  function tick() {
    if (timer.remaining <= 0) {
      completeSession();
      return;
    }
    timer.remaining -= 1;
    renderTimer();
  }

  function startTimer() {
    if (timer.running) return;

    if (timer.customDurationSeconds <= 0) {
      showToast("Enter a custom time first");
      els.timerMinutes.focus();
      return;
    }

    if (timer.remaining <= 0) {
      timer.remaining = timer.customDurationSeconds;
      forceTimerInputs();
    }

    timer.running = true;
    timer.intervalId = setInterval(tick, 1000);
    playTimerModeSound("start");
    renderTimer();
  }

  function stopTimer(resetToggle = true) {
    timer.running = false;
    if (timer.intervalId) {
      clearInterval(timer.intervalId);
      timer.intervalId = null;
    }
    if (resetToggle) renderTimer();
  }

  function toggleTimer() {
    if (timer.running) {
      stopTimer();
    } else {
      startTimer();
    }
  }

  function resetTimer() {
    timer.suppressInputCommit = true;
    stopTimer(false);

    if (timer.customDurationSeconds <= 0) {
      timer.remaining = 0;
      forceTimerInputs();
      els.timerDisplay.classList.remove("is-running");
      els.timerToggle.textContent = "Start";
      document.title = "Study Quest";
      showToast("Set a custom time first");
      window.setTimeout(() => {
        timer.suppressInputCommit = false;
      }, 0);
      return;
    }

    timer.remaining = timer.customDurationSeconds;
    forceTimerInputs();
    els.timerDisplay.classList.remove("is-running");
    els.timerToggle.textContent = "Start";
    document.title = "Study Quest";
    showToast(`Reset to ${formatTime(timer.customDurationSeconds)}`);
    window.setTimeout(() => {
      timer.suppressInputCommit = false;
    }, 0);
  }

  function completeSession() {
    const completedSeconds = timer.customDurationSeconds || 0;
    const completedMinutes = Math.max(1, Math.round(completedSeconds / 60));
    stopTimer(false);
    timer.remaining = 0;
    renderTimer();
    playTimerModeSound("complete");

    if (timer.mode === "focus") {
      state.sessionsDone += 1;
      state.focusMinutes += completedMinutes;
      saveState();
      const study = recordStudyDay();
      addXp(XP_PER_FOCUS, "Focus session complete");
      if (study.isNewDay && study.streak >= 2) {
        setTimeout(() => showToast(`${study.streak}-day study streak!`), 2400);
      }
    } else {
      showToast("Break complete — back to quests");
    }

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("Study Quest", {
        body:
          timer.mode === "focus"
            ? "Focus session complete! +25 XP earned."
            : "Break over — ready for the next quest?",
      });
    }

    timer.remaining = timer.customDurationSeconds || 0;
    renderTimer();
  }

  function requestNotifyPermission() {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }

  function renderTokens() {
    els.tokenCount.textContent = String(state.tokens);
  }

  function dateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function shiftDateKey(key, deltaDays) {
    const [y, m, d] = key.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + deltaDays);
    return dateKey(date);
  }

  function getStudyStreak() {
    const studied = new Set(state.studyDates);
    let cursor = dateKey();
    if (!studied.has(cursor)) {
      cursor = shiftDateKey(cursor, -1);
      if (!studied.has(cursor)) return 0;
    }

    let streak = 0;
    while (studied.has(cursor)) {
      streak += 1;
      cursor = shiftDateKey(cursor, -1);
    }
    return streak;
  }

  function recordStudyDay() {
    const today = dateKey();
    const already = state.studyDates.includes(today);
    if (!already) {
      state.studyDates.push(today);
      saveState();
    }
    const streak = getStudyStreak();
    renderStreak();
    return { isNewDay: !already, streak };
  }

  function renderStreak() {
    const streak = getStudyStreak();
    const studied = new Set(state.studyDates);
    const today = dateKey();
    const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    els.streakDays.innerHTML = "";
    for (let offset = -6; offset <= 0; offset += 1) {
      const key = shiftDateKey(today, offset);
      const [y, m, d] = key.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      const cell = document.createElement("div");
      cell.className = "streak-day";
      if (studied.has(key)) cell.classList.add("is-done");
      if (key === today) cell.classList.add("is-today");

      const label = document.createElement("span");
      label.className = "streak-day-label";
      label.textContent = weekday[date.getDay()];

      const dot = document.createElement("span");
      dot.className = "streak-day-dot";

      cell.append(label, dot);
      els.streakDays.appendChild(cell);
    }

    const progress = Math.min(STREAK_GOAL, streak);
    const percent = Math.round((progress / STREAK_GOAL) * 100);

    if (streak >= 2) {
      els.streakLabel.textContent = `${streak}-day streak`;
      els.streakCurrent.textContent = `${streak} day streak`;
      els.streakHint.textContent =
        streak >= STREAK_GOAL
          ? "Amazing run — keep studying daily to hold your streak."
          : `Keep it going — ${STREAK_GOAL - streak} more day${STREAK_GOAL - streak === 1 ? "" : "s"} to hit the weekly goal.`;
      els.streakPanel.classList.add("is-hot");
    } else if (streak === 1) {
      els.streakLabel.textContent = "Studied today";
      els.streakCurrent.textContent = "1 day started";
      els.streakHint.textContent = "Come back tomorrow to build a multi-day streak.";
      els.streakPanel.classList.remove("is-hot");
    } else {
      els.streakLabel.textContent = "No streak yet";
      els.streakCurrent.textContent = "0 day streak";
      els.streakHint.textContent = "Complete a quest or focus session today to start tracking.";
      els.streakPanel.classList.remove("is-hot");
    }

    els.streakGoal.textContent = `Goal: ${STREAK_GOAL} days`;
    els.streakBarFill.style.width = `${percent}%`;
    els.streakBar.setAttribute("aria-valuenow", String(progress));
    els.streakBar.setAttribute("aria-valuetext", `${streak} day streak`);
  }

  function applyTheme(themeId) {
    if (!themeId || themeId === "neon") {
      document.body.removeAttribute("data-theme");
    } else {
      document.body.dataset.theme = themeId;
    }
  }

  function ownsTheme(id) {
    return state.ownedThemes.includes(id);
  }

  function ownsGame(id) {
    return state.ownedGames.includes(id);
  }

  function buyTheme(id) {
    const theme = THEMES.find((t) => t.id === id);
    if (!theme || ownsTheme(id)) return;
    if (state.tokens < theme.cost) {
      showToast("Not enough tokens");
      return;
    }
    state.tokens -= theme.cost;
    state.ownedThemes.push(id);
    state.activeTheme = id;
    saveState();
    applyTheme(id);
    renderTokens();
    renderShop();
    showToast(`Unlocked ${theme.name}`);
  }

  function equipTheme(id) {
    if (!ownsTheme(id)) return;
    state.activeTheme = id;
    saveState();
    applyTheme(id);
    renderShop();
    showToast(`Theme equipped`);
  }

  function buyGame(id) {
    const game = GAMES.find((g) => g.id === id);
    if (!game || ownsGame(id)) return;
    if (state.tokens < game.cost) {
      showToast("Not enough tokens");
      return;
    }
    state.tokens -= game.cost;
    state.ownedGames.push(id);
    saveState();
    renderTokens();
    renderShop();
    showToast(`Unlocked ${game.name}`);
  }

  function renderShop() {
    els.themeShop.innerHTML = "";
    THEMES.forEach((theme) => {
      const owned = ownsTheme(theme.id);
      const active = state.activeTheme === theme.id;
      const card = document.createElement("article");
      card.className = `shop-card${active ? " is-active" : ""}`;

      const swatch = document.createElement("div");
      swatch.className = "theme-swatch";
      swatch.style.background = theme.swatch;

      const title = document.createElement("h4");
      title.className = "shop-card-title";
      title.textContent = theme.name;

      const desc = document.createElement("p");
      desc.className = "shop-card-desc";
      desc.textContent = theme.desc;

      const meta = document.createElement("div");
      meta.className = "shop-card-meta";
      meta.textContent = owned
        ? active
          ? "Equipped"
          : "Owned"
        : theme.cost === 0
          ? "Free"
          : `${theme.cost} tokens`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = owned ? "btn btn-ghost" : "btn btn-primary";
      if (owned && active) {
        btn.textContent = "Equipped";
        btn.disabled = true;
      } else if (owned) {
        btn.textContent = "Equip";
        btn.addEventListener("click", () => equipTheme(theme.id));
      } else {
        btn.textContent = theme.cost === 0 ? "Unlock" : `Buy · ${theme.cost}`;
        btn.addEventListener("click", () => buyTheme(theme.id));
      }

      card.append(swatch, title, desc, meta, btn);
      els.themeShop.appendChild(card);
    });

    els.gameShop.innerHTML = "";
    GAMES.forEach((game) => {
      const owned = ownsGame(game.id);
      const card = document.createElement("article");
      card.className = "shop-card";

      const title = document.createElement("h4");
      title.className = "shop-card-title";
      title.textContent = game.name;

      const desc = document.createElement("p");
      desc.className = "shop-card-desc";
      desc.textContent = game.desc;

      const meta = document.createElement("div");
      meta.className = "shop-card-meta";
      meta.textContent = owned ? "Unlocked · Break ready" : `${game.cost} tokens`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = owned ? "btn btn-primary" : "btn btn-ghost";
      if (owned) {
        btn.textContent = "Play";
        btn.addEventListener("click", () => openGame(game.id));
      } else {
        btn.textContent = `Buy · ${game.cost}`;
        btn.addEventListener("click", () => buyGame(game.id));
      }

      card.append(title, desc, meta, btn);
      els.gameShop.appendChild(card);
    });
  }

  function closeGame() {
    if (typeof gameCleanup === "function") {
      gameCleanup();
      gameCleanup = null;
    }
    els.gameModal.hidden = true;
    els.gameStage.innerHTML = "";
    els.gameStatus.textContent = "";
  }

  function openGame(id) {
    if (!ownsGame(id)) return;
    const game = GAMES.find((g) => g.id === id);
    if (!game) return;

    closeGame();
    els.gameModal.hidden = false;
    els.gameTitle.textContent = game.name;

    if (id === "reaction") startReactionGame();
    else if (id === "memory") startFunkGame();
    else if (id === "numbers") startNumberGame();
  }

  function startReactionGame() {
    let phase = "idle";
    let startTime = 0;
    let timeoutId = null;

    const pad = document.createElement("button");
    pad.type = "button";
    pad.className = "reaction-pad is-idle";
    pad.textContent = "Tap to start";
    els.gameStatus.textContent = "Wait for green, then tap as fast as you can.";

    const arm = () => {
      phase = "wait";
      pad.className = "reaction-pad is-wait";
      pad.textContent = "Wait…";
      const delay = 1200 + Math.random() * 2200;
      timeoutId = setTimeout(() => {
        phase = "go";
        startTime = performance.now();
        pad.className = "reaction-pad is-go";
        pad.textContent = "TAP!";
      }, delay);
    };

    pad.addEventListener("click", () => {
      if (phase === "idle") {
        arm();
        return;
      }
      if (phase === "wait") {
        clearTimeout(timeoutId);
        phase = "idle";
        pad.className = "reaction-pad is-idle";
        pad.textContent = "Too soon — tap to retry";
        els.gameStatus.textContent = "False start! Wait for green.";
        return;
      }
      if (phase === "go") {
        const ms = Math.round(performance.now() - startTime);
        phase = "idle";
        pad.className = "reaction-pad is-idle";
        pad.textContent = "Tap to play again";
        els.gameStatus.textContent = `Nice! Reaction time: ${ms} ms`;
      }
    });

    els.gameStage.appendChild(pad);
    gameCleanup = () => clearTimeout(timeoutId);
  }

  function startFunkGame() {
    const DIRS = ["left", "down", "up", "right"];
    const ARROWS = { left: "←", down: "↓", up: "↑", right: "→" };
    const KEY_MAP = {
      ArrowLeft: "left",
      ArrowDown: "down",
      ArrowUp: "up",
      ArrowRight: "right",
      a: "left",
      s: "down",
      w: "up",
      d: "right",
      A: "left",
      S: "down",
      W: "up",
      D: "right",
    };
    const BPM = 140;
    const BEAT_MS = 60000 / BPM;
    const SCROLL_BEATS = 2.8;
    const HIT_WINDOW = { perfect: 40, good: 100, bad: 150 };
    const COUNTDOWN_BEATS = 4;
    const SONG_BEATS = 32;

    const chart = [];
    for (let beat = 0; beat < SONG_BEATS; beat += 1) {
      chart.push({ beat, dir: DIRS[beat % 4] });
      if (beat % 4 === 0) chart.push({ beat: beat + 0.5, dir: DIRS[(beat + 2) % 4] });
      if (beat % 8 === 4) chart.push({ beat: beat + 0.5, dir: DIRS[(beat + 1) % 4], holdBeats: 0.75 });
    }
    chart.sort((a, b) => a.beat - b.beat || a.dir.localeCompare(b.dir));

    let running = false;
    let finished = false;
    let startTime = 0;
    let score = 0;
    let combo = 0;
    let maxCombo = 0;
    let health = 70;
    let hits = { perfect: 0, good: 0, bad: 0, miss: 0 };
    let rafId = 0;
    let lastCountdown = null;
    let countdownDone = false;
    let travelPx = 220;
    const funkAudio = createFunkAudio(BPM);
    const pressedDirs = new Set();

    const root = document.createElement("div");
    root.className = "funk-game";

    const hud = document.createElement("div");
    hud.className = "funk-hud";
    const scoreEl = document.createElement("div");
    scoreEl.className = "funk-score";
    const comboEl = document.createElement("div");
    comboEl.className = "funk-combo";
    const accEl = document.createElement("div");
    accEl.className = "funk-acc";
    hud.append(scoreEl, comboEl, accEl);

    const healthWrap = document.createElement("div");
    healthWrap.className = "funk-health";
    healthWrap.innerHTML = `<div class="funk-health-track"><div class="funk-health-fill"></div></div>`;
    const healthFill = healthWrap.querySelector(".funk-health-fill");

    const board = document.createElement("div");
    board.className = "funk-board";
    const judgeEl = document.createElement("div");
    judgeEl.className = "funk-judge";
    const countdownEl = document.createElement("div");
    countdownEl.className = "funk-countdown";
    const boardWrap = document.createElement("div");
    boardWrap.className = "funk-board-wrap";
    boardWrap.append(board, judgeEl, countdownEl);

    const receptors = {};
    const lanes = {};
    DIRS.forEach((dir) => {
      const lane = document.createElement("div");
      lane.className = `funk-lane funk-lane-${dir}`;
      const receptor = document.createElement("button");
      receptor.type = "button";
      receptor.className = `funk-receptor funk-receptor-${dir}`;
      receptor.dataset.silent = "1";
      receptor.setAttribute("aria-label", dir);
      receptor.textContent = ARROWS[dir];
      receptor.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        tryHit(dir);
      });
      lane.appendChild(receptor);
      board.appendChild(lane);
      receptors[dir] = receptor;
      lanes[dir] = lane;
    });

    const results = document.createElement("div");
    results.className = "funk-results";
    results.hidden = true;

    const startBtn = document.createElement("button");
    startBtn.type = "button";
    startBtn.className = "btn btn-primary funk-start";
    startBtn.dataset.silent = "1";
    startBtn.textContent = "Start";

    const hint = document.createElement("p");
    hint.className = "funk-hint";
    hint.textContent = "←↓↑→ or A S W D";

    root.append(hud, healthWrap, boardWrap, results, startBtn, hint);
    els.gameStage.appendChild(root);
    els.gameStatus.textContent = "Funk Night — hit arrows when they reach the bottom.";
    els.gameModal.querySelector(".game-modal-card")?.classList.add("is-funk");

    const noteEls = chart.map((note) => {
      const el = document.createElement("div");
      el.className = `funk-note funk-note-${note.dir}${note.holdBeats ? " is-hold" : ""}`;
      el.innerHTML = `<span class="funk-note-head">${ARROWS[note.dir]}</span>${
        note.holdBeats ? '<span class="funk-note-tail"></span>' : ""
      }`;
      el.hidden = true;
      if (note.holdBeats) {
        el.querySelector(".funk-note-tail").style.height = `${Math.max(28, note.holdBeats * 40)}px`;
      }
      lanes[note.dir].appendChild(el);
      return {
        ...note,
        holdBeats: note.holdBeats || 0,
        el,
        hit: false,
        missed: false,
        holding: false,
        holdDone: false,
        time: (note.beat + COUNTDOWN_BEATS) * BEAT_MS,
        holdEnd: (note.beat + COUNTDOWN_BEATS + (note.holdBeats || 0)) * BEAT_MS,
      };
    });

    function accuracyPct() {
      const total = hits.perfect + hits.good + hits.bad + hits.miss;
      if (!total) return 100;
      return Math.round(((hits.perfect + hits.good * 0.7 + hits.bad * 0.3) / total) * 100);
    }

    function updateHud(text) {
      scoreEl.textContent = `Score ${score}`;
      comboEl.textContent = combo > 1 ? `${combo}x` : "";
      accEl.textContent = `${accuracyPct()}%`;
      healthFill.style.width = `${Math.max(0, Math.min(100, health))}%`;
      if (text !== undefined) {
        judgeEl.textContent = text;
        judgeEl.className = `funk-judge${text ? ` is-${String(text).toLowerCase()}` : ""}`;
        if (text) {
          judgeEl.classList.remove("is-pop");
          void judgeEl.offsetWidth;
          judgeEl.classList.add("is-pop");
        }
      }
    }

    function judgeHit(delta) {
      const abs = Math.abs(delta);
      if (abs <= HIT_WINDOW.perfect) return "perfect";
      if (abs <= HIT_WINDOW.good) return "good";
      if (abs <= HIT_WINDOW.bad) return "bad";
      return null;
    }

    function applyJudge(quality) {
      if (quality === "perfect") {
        score += 300 + Math.min(combo, 20) * 8;
        combo += 1;
        health = Math.min(100, health + 4);
        hits.perfect += 1;
      } else if (quality === "good") {
        score += 160 + Math.min(combo, 12) * 4;
        combo += 1;
        health = Math.min(100, health + 2);
        hits.good += 1;
      } else if (quality === "bad") {
        score += 40;
        combo = 0;
        health = Math.max(0, health - 4);
        hits.bad += 1;
      } else {
        combo = 0;
        health = Math.max(0, health - 10);
        hits.miss += 1;
      }
      maxCombo = Math.max(maxCombo, combo);
      updateHud(quality ? quality.toUpperCase() : "MISS");
      funkAudio.playHit(quality || "miss");
    }

    function tryHit(dir) {
      if (!running || finished || !countdownDone) return;
      const now = performance.now() - startTime;
      receptors[dir].classList.add("is-pressed");
      setTimeout(() => receptors[dir].classList.remove("is-pressed"), 70);

      let best = null;
      let bestDelta = Infinity;
      for (let i = 0; i < noteEls.length; i += 1) {
        const note = noteEls[i];
        if (note.dir !== dir || note.hit || note.missed) continue;
        const delta = now - note.time;
        if (Math.abs(delta) < Math.abs(bestDelta) && Math.abs(delta) <= HIT_WINDOW.bad) {
          best = note;
          bestDelta = delta;
        }
      }
      if (!best) return;
      const quality = judgeHit(bestDelta);
      if (!quality) return;
      best.hit = true;
      best.holding = best.holdBeats > 0;
      best.el.classList.add("is-hit");
      if (best.holding) best.el.classList.add("is-holding");
      applyJudge(quality);
      if (health <= 0) endSong(false);
    }

    function endSong(cleared) {
      if (finished) return;
      finished = true;
      running = false;
      cancelAnimationFrame(rafId);
      const acc = accuracyPct();
      els.gameStatus.textContent = cleared
        ? `Cleared · ${acc}% · Score ${score}`
        : `Failed · ${acc}% · Score ${score}`;
      startBtn.hidden = false;
      startBtn.textContent = "Again";
      updateHud(cleared ? "CLEAR" : "FAIL");
      funkAudio.stop();
      funkAudio.playResult(cleared);
      results.hidden = false;
      results.innerHTML = `
        <div class="funk-results-title">${cleared ? "Clear!" : "Fail"}</div>
        <div class="funk-results-grid">
          <div><span>Score</span><strong>${score}</strong></div>
          <div><span>Acc</span><strong>${acc}%</strong></div>
          <div><span>Max</span><strong>${maxCombo}</strong></div>
          <div><span>Perfect</span><strong>${hits.perfect}</strong></div>
        </div>
      `;
      if (cleared) addXp(12, "Funk Night clear");
    }

    function frame(now) {
      if (!running) return;
      const t = now - startTime;
      const songStart = COUNTDOWN_BEATS * BEAT_MS;
      const songDur = SONG_BEATS * BEAT_MS;
      const appearWindow = SCROLL_BEATS * BEAT_MS;

      if (t < songStart) {
        const remain = Math.ceil((songStart - t) / BEAT_MS);
        countdownEl.hidden = false;
        countdownEl.textContent = remain > 0 ? String(remain) : "GO";
        countdownDone = false;
        if (remain !== lastCountdown) {
          lastCountdown = remain;
          funkAudio.playCountdown(remain);
        }
      } else if (!countdownDone) {
        countdownDone = true;
        countdownEl.hidden = true;
        updateHud("GO");
        if (lastCountdown !== 0) {
          lastCountdown = 0;
          funkAudio.playCountdown(0);
        }
      }

      for (let i = 0; i < noteEls.length; i += 1) {
        const note = noteEls[i];
        if ((note.hit && !note.holding) || note.missed) {
          if (!note.el.hidden) note.el.hidden = true;
          continue;
        }
        const appear = note.time - appearWindow;
        if (t < appear || (t > note.holdEnd + HIT_WINDOW.bad && !note.holding)) {
          if (!note.el.hidden) note.el.hidden = true;
        } else {
          note.el.hidden = false;
          const p = Math.min(1, Math.max(0, (t - appear) / appearWindow));
          note.el.style.transform = `translateY(${p * travelPx}px)`;
        }

        if (note.holding && note.hit && !note.holdDone) {
          if (t >= note.holdEnd) {
            note.holding = false;
            note.holdDone = true;
            note.el.classList.remove("is-holding");
            note.el.hidden = true;
            score += 80;
            updateHud("HOLD");
            funkAudio.playHold();
          } else if (pressedDirs.size && !pressedDirs.has(note.dir) && t > note.time + HIT_WINDOW.good) {
            note.holding = false;
            note.holdDone = true;
            note.el.classList.remove("is-holding");
            applyJudge(null);
          }
        }

        if (!note.missed && !note.hit && t - note.time > HIT_WINDOW.bad) {
          note.missed = true;
          note.el.classList.add("is-miss");
          applyJudge(null);
          if (health <= 0) endSong(false);
        }
      }

      if (t > songStart + songDur + BEAT_MS) {
        endSong(true);
        return;
      }
      rafId = requestAnimationFrame(frame);
    }

    function startTrack() {
      noteEls.forEach((note) => {
        note.hit = false;
        note.missed = false;
        note.holding = false;
        note.holdDone = false;
        note.el.hidden = true;
        note.el.classList.remove("is-hit", "is-miss", "is-holding");
        note.el.style.transform = "translateY(0)";
      });
      score = 0;
      combo = 0;
      maxCombo = 0;
      health = 70;
      hits = { perfect: 0, good: 0, bad: 0, miss: 0 };
      finished = false;
      running = true;
      countdownDone = false;
      lastCountdown = null;
      pressedDirs.clear();
      results.hidden = true;
      results.innerHTML = "";
      startBtn.hidden = true;
      countdownEl.hidden = false;
      countdownEl.textContent = String(COUNTDOWN_BEATS);
      updateHud("");
      els.gameStatus.textContent = "Get ready…";
      getAudioContext()?.resume?.();
      funkAudio.stop();
      funkAudio.startTrack(COUNTDOWN_BEATS + SONG_BEATS, COUNTDOWN_BEATS);
      travelPx = Math.max(160, board.clientHeight - 70);
      startTime = performance.now();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(frame);
    }

    const onKeyDown = (e) => {
      const dir = KEY_MAP[e.key];
      if (!dir) return;
      e.preventDefault();
      if (e.repeat) {
        pressedDirs.add(dir);
        return;
      }
      pressedDirs.add(dir);
      tryHit(dir);
    };
    const onKeyUp = (e) => {
      const dir = KEY_MAP[e.key];
      if (!dir) return;
      pressedDirs.delete(dir);
    };

    startBtn.addEventListener("click", startTrack);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    updateHud("");

    gameCleanup = () => {
      running = false;
      finished = true;
      cancelAnimationFrame(rafId);
      funkAudio.stop();
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      els.gameModal.querySelector(".game-modal-card")?.classList.remove("is-funk");
    };
  }

  function startNumberGame() {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = values.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }

    let next = 1;
    const startedAt = performance.now();
    const grid = document.createElement("div");
    grid.className = "number-grid";
    els.gameStatus.textContent = "Tap numbers in order from 1 to 9.";

    values.forEach((value) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "number-btn";
      btn.textContent = String(value);
      btn.addEventListener("click", () => {
        if (value !== next) {
          els.gameStatus.textContent = `Need ${next} next — keep going.`;
          return;
        }
        btn.classList.add("is-done");
        next += 1;
        if (next > 9) {
          const ms = Math.round(performance.now() - startedAt);
          els.gameStatus.textContent = `Cleared in ${(ms / 1000).toFixed(2)}s!`;
        } else {
          els.gameStatus.textContent = `Next: ${next}`;
        }
      });
      grid.appendChild(btn);
    });

    els.gameStage.appendChild(grid);
    gameCleanup = null;
  }

  els.questForm.addEventListener("submit", (e) => {
    e.preventDefault();
    playSaveSound();
    addQuest(els.questInput.value);
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn || btn.disabled || btn.dataset.silent === "1") return;
    playSaveSound();
  });

  els.timerToggle.addEventListener("click", () => {
    requestNotifyPermission();
    toggleTimer();
  });

  els.timerReset.addEventListener("click", resetTimer);

  [els.timerMinutes, els.timerSeconds].forEach((input) => {
    input.addEventListener("focus", () => {
      if (timer.running) {
        stopTimer();
        showToast("Timer paused — edit the clock, then Start");
      }
      input.select();
    });
    input.addEventListener("change", () => applyManualTime({ commitDuration: true }));
    input.addEventListener("blur", () => applyManualTime({ commitDuration: true }));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyManualTime({ commitDuration: true });
        input.blur();
      }
    });
  });

  els.maxLevelToggle.addEventListener("click", toggleMaxLevel);
  els.goMaxLevel.addEventListener("click", goMaxLevel);
  els.resetLevel.addEventListener("click", resetLevel);

  els.gameModal.querySelectorAll("[data-close-game]").forEach((el) => {
    el.addEventListener("click", closeGame);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.gameModal.hidden) closeGame();
  });

  els.modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = Number(btn.dataset.minutes);
      setMode(btn.dataset.mode, Number.isFinite(preset) && preset > 0 ? preset : undefined);
    });
  });

  applyTheme(state.activeTheme);
  renderQuests();
  renderXp();
  renderTokens();
  renderShop();
  renderStreak();
  renderTimer();
})();
