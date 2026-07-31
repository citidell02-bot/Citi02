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
      desc: "FNF-style arrow battle with music, holds, combos, and stage flair.",
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

  // Original arcade funk bed + SFX for Funk Night (Web Audio synthesis)
  function createFunkAudio(bpm) {
    const ctx = getAudioContext();
    if (!ctx) {
      return {
        startTrack() {},
        stop() {},
        playHit() {},
        playCountdown() {},
        playResult() {},
        playHold() {},
      };
    }

    const master = ctx.createGain();
    master.gain.value = 0.3;
    master.connect(ctx.destination);

    const music = ctx.createGain();
    music.gain.value = 0.8;
    music.connect(master);

    const sfx = ctx.createGain();
    sfx.gain.value = 1;
    sfx.connect(master);

    const noiseBuffer = createNoiseBuffer(ctx, 0.3);
    const beatDur = 60 / bpm;

    function playOsc({
      type = "square",
      freq = 440,
      t,
      dur = 0.1,
      peak = 0.1,
      dest = music,
      slideTo = null,
    }) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo != null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
      }
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peak, t + Math.min(0.02, dur * 0.25));
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    }

    function playNoise({ t, dur = 0.1, peak = 0.2, hp = 800, dest = music }) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = hp;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peak, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      src.start(t);
      src.stop(t + dur + 0.02);
    }

    function kick(t) {
      playOsc({ type: "sine", freq: 160, slideTo: 42, t, dur: 0.16, peak: 0.85, dest: music });
      playNoise({ t, dur: 0.04, peak: 0.12, hp: 80, dest: music });
    }

    function snare(t) {
      playNoise({ t, dur: 0.12, peak: 0.32, hp: 1400, dest: music });
      playOsc({ type: "triangle", freq: 210, t, dur: 0.08, peak: 0.14, dest: music });
    }

    function hat(t, open = false) {
      playNoise({
        t,
        dur: open ? 0.14 : 0.045,
        peak: open ? 0.12 : 0.08,
        hp: open ? 6000 : 7500,
        dest: music,
      });
    }

    function clap(t) {
      playNoise({ t, dur: 0.09, peak: 0.28, hp: 1800, dest: sfx });
      playNoise({ t: t + 0.015, dur: 0.07, peak: 0.18, hp: 2200, dest: sfx });
    }

    function bass(t, freq) {
      playOsc({ type: "sawtooth", freq, t, dur: 0.22, peak: 0.16, dest: music });
      playOsc({ type: "square", freq: freq * 0.5, t, dur: 0.2, peak: 0.1, dest: music });
    }

    function chord(t, freqs) {
      freqs.forEach((freq, i) => {
        playOsc({
          type: "square",
          freq,
          t: t + i * 0.005,
          dur: 0.28,
          peak: 0.045,
          dest: music,
        });
      });
    }

    function lead(t, freq) {
      playOsc({ type: "square", freq, t, dur: 0.14, peak: 0.08, dest: music });
      playOsc({ type: "triangle", freq: freq * 2, t, dur: 0.1, peak: 0.03, dest: music });
    }

    function startTrack(totalBeats, countdownBeats) {
      const t0 = ctx.currentTime + 0.06;
      music.gain.cancelScheduledValues(t0);
      music.gain.setValueAtTime(0.0001, t0);
      music.gain.exponentialRampToValueAtTime(0.8, t0 + 0.12);

      const bassLine = [82.41, 82.41, 98.0, 82.41, 73.42, 73.42, 65.41, 98.0];
      const chords = [
        [196.0, 246.94, 293.66],
        [174.61, 220.0, 261.63],
        [146.83, 185.0, 220.0],
        [164.81, 196.0, 246.94],
      ];
      const melody = [392.0, 440.0, 493.88, 523.25, 493.88, 440.0, 392.0, 349.23, 329.63, 392.0, 440.0, 523.25];

      for (let beat = 0; beat < totalBeats; beat += 1) {
        const t = t0 + beat * beatDur;
        const inCount = beat < countdownBeats;
        const barBeat = beat % 4;
        const step8 = t + beatDur * 0.5;

        if (inCount) {
          if (barBeat === 0) kick(t);
          hat(t, false);
          continue;
        }

        if (barBeat === 0) kick(t);
        if (barBeat === 2) snare(t);
        if (beat % 8 === 4) snare(t + beatDur * 0.75);
        if (beat % 8 === 6) kick(t + beatDur * 0.5);
        hat(t, beat % 4 === 3);
        hat(step8, false);

        const bassFreq = bassLine[beat % bassLine.length];
        if (beat % 2 === 0) bass(t, bassFreq);
        else bass(t, bassFreq * 0.75);

        if (beat % 4 === 0) {
          chord(t, chords[Math.floor(beat / 4) % chords.length]);
        }

        if (beat % 2 === 0) {
          lead(t + beatDur * 0.25, melody[beat % melody.length]);
        }
        if (beat % 8 === 6) {
          lead(t + beatDur * 0.5, melody[(beat + 3) % melody.length] * 1.5);
        }
      }

      // Soft ending hit
      const end = t0 + totalBeats * beatDur;
      kick(end);
      chord(end, [196, 246.94, 311.13]);
    }

    function stop() {
      const now = ctx.currentTime;
      music.gain.cancelScheduledValues(now);
      music.gain.setTargetAtTime(0.0001, now, 0.05);
    }

    function playHit(quality) {
      const t = ctx.currentTime + 0.001;
      if (quality === "sick") {
        clap(t);
        playOsc({ type: "square", freq: 988, t, dur: 0.06, peak: 0.12, dest: sfx });
        playOsc({ type: "square", freq: 1480, t: t + 0.04, dur: 0.09, peak: 0.1, dest: sfx });
      } else if (quality === "good") {
        clap(t);
        playOsc({ type: "triangle", freq: 740, t, dur: 0.08, peak: 0.11, dest: sfx });
      } else if (quality === "bad") {
        playOsc({ type: "sawtooth", freq: 280, t, dur: 0.1, peak: 0.08, dest: sfx });
        playNoise({ t, dur: 0.08, peak: 0.1, hp: 900, dest: sfx });
      } else {
        playOsc({ type: "sawtooth", freq: 90, slideTo: 50, t, dur: 0.16, peak: 0.12, dest: sfx });
        playNoise({ t, dur: 0.14, peak: 0.14, hp: 400, dest: sfx });
      }
    }

    function playHold() {
      const t = ctx.currentTime + 0.001;
      playOsc({ type: "square", freq: 660, t, dur: 0.08, peak: 0.08, dest: sfx });
      playOsc({ type: "triangle", freq: 990, t: t + 0.05, dur: 0.1, peak: 0.07, dest: sfx });
    }

    function playCountdown(n) {
      const t = ctx.currentTime + 0.001;
      if (n <= 0) {
        playOsc({ type: "square", freq: 523.25, t, dur: 0.08, peak: 0.12, dest: sfx });
        playOsc({ type: "square", freq: 784, t: t + 0.08, dur: 0.14, peak: 0.12, dest: sfx });
        return;
      }
      const freq = 320 + (4 - n) * 90;
      playOsc({ type: "square", freq, t, dur: 0.1, peak: 0.13, dest: sfx });
    }

    function playResult(cleared) {
      const t = ctx.currentTime + 0.02;
      if (cleared) {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          playOsc({
            type: "square",
            freq,
            t: t + i * 0.09,
            dur: 0.14,
            peak: 0.12,
            dest: sfx,
          });
        });
        clap(t + 0.35);
      } else {
        playOsc({ type: "sawtooth", freq: 220, slideTo: 80, t, dur: 0.35, peak: 0.12, dest: sfx });
        playNoise({ t, dur: 0.3, peak: 0.12, hp: 500, dest: sfx });
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
    const BPM = 150;
    const BEAT_MS = 60000 / BPM;
    const SCROLL_BEATS = 3.4;
    const HIT_WINDOW = { sick: 65, good: 115, bad: 165 };
    const COUNTDOWN_BEATS = 4;
    const SONG_BEATS = 64;

    const chart = [];
    const pushNote = (beat, dir, holdBeats = 0) => {
      chart.push({ beat, dir, holdBeats });
    };
    for (let beat = 0; beat < SONG_BEATS; beat += 1) {
      const section = Math.floor(beat / 16);
      if (section === 0) {
        if (beat % 2 === 0) pushNote(beat, DIRS[(beat / 2) % 4]);
        if (beat % 8 === 4) pushNote(beat + 0.5, DIRS[(beat + 1) % 4]);
      } else if (section === 1) {
        if (beat % 2 === 0) pushNote(beat, DIRS[beat % 4]);
        if (beat % 4 === 0) pushNote(beat + 0.5, DIRS[(beat + 2) % 4], 0.75);
        if (beat % 8 === 6) pushNote(beat + 0.25, DIRS[(beat + 3) % 4]);
      } else if (section === 2) {
        pushNote(beat, DIRS[beat % 4]);
        if (beat % 2 === 1) pushNote(beat + 0.5, DIRS[(beat + 2) % 4]);
        if (beat % 8 === 0) {
          pushNote(beat + 0.25, DIRS[(beat + 1) % 4]);
          pushNote(beat + 0.75, DIRS[(beat + 3) % 4], 1);
        }
      } else {
        if (beat % 2 === 0) {
          pushNote(beat, DIRS[(beat / 2) % 4]);
          pushNote(beat + 0.5, DIRS[(beat / 2 + 2) % 4]);
        }
        if (beat % 4 === 3) pushNote(beat + 0.25, DIRS[(beat + 1) % 4]);
      }
    }

    let running = false;
    let finished = false;
    let startTime = 0;
    let score = 0;
    let combo = 0;
    let maxCombo = 0;
    let health = 50;
    let hits = { sick: 0, good: 0, bad: 0, miss: 0 };
    let rafId = 0;
    let lastBeat = -1;
    let lastCountdown = null;
    let countdownDone = false;
    const funkAudio = createFunkAudio(BPM);

    const root = document.createElement("div");
    root.className = "funk-game";

    const stage = document.createElement("div");
    stage.className = "funk-stage";
    stage.innerHTML = `
      <div class="funk-stage-glow"></div>
      <div class="funk-crowd"></div>
      <div class="funk-dancer funk-dancer-left" aria-hidden="true">
        <span class="funk-dancer-head"></span>
        <span class="funk-dancer-body"></span>
        <span class="funk-dancer-legs"></span>
      </div>
      <div class="funk-dancer funk-dancer-right" aria-hidden="true">
        <span class="funk-dancer-head"></span>
        <span class="funk-dancer-body"></span>
        <span class="funk-dancer-legs"></span>
      </div>
      <div class="funk-stage-floor"></div>
    `;

    const trackMeta = document.createElement("div");
    trackMeta.className = "funk-track-meta";
    trackMeta.innerHTML = `
      <div class="funk-track-title">Break Beat Rumble</div>
      <div class="funk-track-sub">150 BPM · Arcade Mix</div>
    `;

    const hud = document.createElement("div");
    hud.className = "funk-hud";
    const scoreEl = document.createElement("div");
    scoreEl.className = "funk-score";
    const comboEl = document.createElement("div");
    comboEl.className = "funk-combo";
    const accEl = document.createElement("div");
    accEl.className = "funk-acc";
    hud.append(scoreEl, comboEl, accEl);

    const statsRow = document.createElement("div");
    statsRow.className = "funk-stats";
    statsRow.innerHTML = `
      <span data-stat="sick">SICK 0</span>
      <span data-stat="good">GOOD 0</span>
      <span data-stat="bad">BAD 0</span>
      <span data-stat="miss">MISS 0</span>
    `;

    const healthWrap = document.createElement("div");
    healthWrap.className = "funk-health";
    healthWrap.innerHTML = `
      <span class="funk-health-label funk-health-enemy">RIVAL</span>
      <div class="funk-health-track"><div class="funk-health-fill"></div></div>
      <span class="funk-health-label funk-health-you">YOU</span>
    `;
    const healthFill = healthWrap.querySelector(".funk-health-fill");

    const progressWrap = document.createElement("div");
    progressWrap.className = "funk-progress";
    const progressFill = document.createElement("div");
    progressFill.className = "funk-progress-fill";
    progressWrap.appendChild(progressFill);

    const boardWrap = document.createElement("div");
    boardWrap.className = "funk-board-wrap";
    const board = document.createElement("div");
    board.className = "funk-board";
    const judgeEl = document.createElement("div");
    judgeEl.className = "funk-judge";
    const countdownEl = document.createElement("div");
    countdownEl.className = "funk-countdown";
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
      receptor.dataset.dir = dir;
      receptor.setAttribute("aria-label", dir);
      receptor.innerHTML = `<span class="funk-receptor-glow"></span><span class="funk-receptor-icon">${ARROWS[dir]}</span>`;
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
    startBtn.textContent = "Start Track";

    const hint = document.createElement("p");
    hint.className = "funk-hint";
    hint.textContent = "Keys: ←↓↑→ or A S W D · hold through long notes · click receptors";

    root.append(stage, trackMeta, hud, statsRow, healthWrap, progressWrap, boardWrap, results, startBtn, hint);
    els.gameStage.appendChild(root);
    els.gameStatus.textContent = "Hit arrows on beat. Keep health above zero to clear the track.";
    els.gameModal.querySelector(".game-modal-card")?.classList.add("is-funk");

    const noteEls = chart.map((note) => {
      const el = document.createElement("div");
      el.className = `funk-note funk-note-${note.dir}${note.holdBeats > 0 ? " is-hold" : ""}`;
      el.innerHTML = `
        <span class="funk-note-head">${ARROWS[note.dir]}</span>
        ${note.holdBeats > 0 ? '<span class="funk-note-tail"></span>' : ""}
      `;
      el.hidden = true;
      if (note.holdBeats > 0) {
        const tail = el.querySelector(".funk-note-tail");
        const holdPx = Math.max(36, note.holdBeats * 42);
        tail.style.height = `${holdPx}px`;
      }
      lanes[note.dir].appendChild(el);
      return {
        ...note,
        el,
        hit: false,
        missed: false,
        holding: false,
        holdDone: false,
        time: (note.beat + COUNTDOWN_BEATS) * BEAT_MS,
        holdEnd: (note.beat + COUNTDOWN_BEATS + note.holdBeats) * BEAT_MS,
      };
    });

    function accuracyPct() {
      const total = hits.sick + hits.good + hits.bad + hits.miss;
      if (!total) return 100;
      return Math.round(((hits.sick + hits.good * 0.75 + hits.bad * 0.35) / total) * 100);
    }

    function gradeFor(acc, cleared) {
      if (!cleared) return "F";
      if (acc >= 97 && hits.miss === 0) return "S";
      if (acc >= 90) return "A";
      if (acc >= 80) return "B";
      if (acc >= 70) return "C";
      return "D";
    }

    function updateHud(judgeText) {
      scoreEl.textContent = `Score ${score.toLocaleString()}`;
      comboEl.textContent = combo > 1 ? `${combo} COMBO` : combo === 1 ? "COMBO" : "";
      comboEl.classList.toggle("is-hot", combo >= 10);
      accEl.textContent = `${accuracyPct()}%`;
      healthFill.style.width = `${Math.max(0, Math.min(100, health))}%`;
      healthWrap.classList.toggle("is-low", health < 30);
      statsRow.querySelector('[data-stat="sick"]').textContent = `SICK ${hits.sick}`;
      statsRow.querySelector('[data-stat="good"]').textContent = `GOOD ${hits.good}`;
      statsRow.querySelector('[data-stat="bad"]').textContent = `BAD ${hits.bad}`;
      statsRow.querySelector('[data-stat="miss"]').textContent = `MISS ${hits.miss}`;
      if (judgeText !== undefined) {
        judgeEl.textContent = judgeText;
        judgeEl.className = `funk-judge${judgeText ? ` is-${String(judgeText).toLowerCase()}` : ""}`;
        if (judgeText) {
          judgeEl.classList.remove("is-pop");
          void judgeEl.offsetWidth;
          judgeEl.classList.add("is-pop");
        }
      }
    }

    function spawnSplash(dir, quality) {
      const splash = document.createElement("span");
      splash.className = `funk-splash funk-splash-${dir} is-${quality || "miss"}`;
      lanes[dir].appendChild(splash);
      setTimeout(() => splash.remove(), 320);
    }

    function judgeHit(delta) {
      const abs = Math.abs(delta);
      if (abs <= HIT_WINDOW.sick) return "sick";
      if (abs <= HIT_WINDOW.good) return "good";
      if (abs <= HIT_WINDOW.bad) return "bad";
      return null;
    }

    function applyJudge(quality, dir) {
      if (quality === "sick") {
        score += 350 + Math.min(combo, 25) * 8;
        combo += 1;
        health = Math.min(100, health + 5);
        hits.sick += 1;
      } else if (quality === "good") {
        score += 200 + Math.min(combo, 15) * 4;
        combo += 1;
        health = Math.min(100, health + 2);
        hits.good += 1;
      } else if (quality === "bad") {
        score += 50;
        combo = 0;
        health = Math.max(0, health - 5);
        hits.bad += 1;
      } else {
        combo = 0;
        health = Math.max(0, health - 9);
        hits.miss += 1;
        stage.classList.add("is-shake");
        setTimeout(() => stage.classList.remove("is-shake"), 180);
      }
      maxCombo = Math.max(maxCombo, combo);
      if (quality === "sick" && combo > 0 && combo % 10 === 0) {
        stage.classList.add("is-flash");
        setTimeout(() => stage.classList.remove("is-flash"), 220);
      }
      updateHud(quality ? quality.toUpperCase() : "MISS");
      funkAudio.playHit(quality || "miss");
      if (dir) spawnSplash(dir, quality || "miss");
    }

    function tryHit(dir) {
      if (!running || finished || !countdownDone) return;
      const now = performance.now() - startTime;
      const receptor = receptors[dir];
      receptor.classList.add("is-pressed");
      setTimeout(() => receptor.classList.remove("is-pressed"), 90);

      let best = null;
      let bestDelta = Infinity;
      noteEls.forEach((note) => {
        if (note.dir !== dir || note.hit || note.missed) return;
        const delta = now - note.time;
        if (Math.abs(delta) < Math.abs(bestDelta) && Math.abs(delta) <= HIT_WINDOW.bad) {
          best = note;
          bestDelta = delta;
        }
      });

      if (!best) return;
      const quality = judgeHit(bestDelta);
      if (!quality) return;
      best.hit = true;
      best.holding = best.holdBeats > 0;
      best.el.classList.add("is-hit");
      if (best.holding) best.el.classList.add("is-holding");
      applyJudge(quality, dir);
      if (health <= 0) endSong(false);
    }

    function showResults(cleared) {
      const acc = accuracyPct();
      const grade = gradeFor(acc, cleared);
      results.hidden = false;
      results.innerHTML = `
        <div class="funk-results-grade is-${grade.toLowerCase()}">${grade}</div>
        <div class="funk-results-title">${cleared ? "Track Cleared!" : "Health Drained"}</div>
        <div class="funk-results-grid">
          <div><span>Score</span><strong>${score.toLocaleString()}</strong></div>
          <div><span>Accuracy</span><strong>${acc}%</strong></div>
          <div><span>Max Combo</span><strong>${maxCombo}</strong></div>
          <div><span>Sick</span><strong>${hits.sick}</strong></div>
          <div><span>Good</span><strong>${hits.good}</strong></div>
          <div><span>Bad</span><strong>${hits.bad}</strong></div>
          <div><span>Miss</span><strong>${hits.miss}</strong></div>
        </div>
      `;
    }

    function endSong(cleared) {
      if (finished) return;
      finished = true;
      running = false;
      cancelAnimationFrame(rafId);
      const acc = accuracyPct();
      els.gameStatus.textContent = cleared
        ? `Cleared Break Beat Rumble · ${acc}% · Grade ${gradeFor(acc, true)}`
        : `Failed Break Beat Rumble · ${acc}% · Grade F`;
      startBtn.hidden = false;
      startBtn.textContent = "Play Again";
      updateHud(cleared ? "CLEAR" : "FAIL");
      funkAudio.stop();
      funkAudio.playResult(cleared);
      showResults(cleared);
      progressFill.style.width = "100%";
    }

    function frame(now) {
      if (!running) return;
      const t = now - startTime;
      const travelPx = board.clientHeight - 70;
      const songStart = COUNTDOWN_BEATS * BEAT_MS;
      const songDur = SONG_BEATS * BEAT_MS;

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

      const progress = Math.max(0, Math.min(1, (t - songStart) / songDur));
      progressFill.style.width = `${progress * 100}%`;

      noteEls.forEach((note) => {
        if (note.hit && !note.holding) {
          note.el.hidden = true;
          return;
        }
        const appear = note.time - SCROLL_BEATS * BEAT_MS;
        const progressNote = (t - appear) / (SCROLL_BEATS * BEAT_MS);
        if (progressNote < 0 || (progressNote > 1.35 && !note.holding)) {
          note.el.hidden = true;
        } else {
          note.el.hidden = false;
          const y = Math.min(progressNote, 1) * travelPx;
          note.el.style.transform = `translateY(${y}px)`;
        }

        if (note.holding && note.hit && !note.holdDone) {
          if (t >= note.holdEnd) {
            note.holding = false;
            note.holdDone = true;
            note.el.classList.remove("is-holding");
            note.el.hidden = true;
            score += 120;
            health = Math.min(100, health + 2);
            updateHud("HOLD");
            funkAudio.playHold();
          } else if (
            pressedDirs.size > 0 &&
            !pressedDirs.has(note.dir) &&
            t > note.time + HIT_WINDOW.good
          ) {
            // Only break holds when keyboard input is active and the lane key was released early.
            note.holding = false;
            note.holdDone = true;
            note.el.classList.remove("is-holding");
            applyJudge(null, note.dir);
          }
        }

        if (!note.missed && !note.hit && t - note.time > HIT_WINDOW.bad) {
          note.missed = true;
          note.el.classList.add("is-miss");
          applyJudge(null, note.dir);
          if (health <= 0) endSong(false);
        }
      });

      const beat = Math.floor(t / BEAT_MS);
      if (beat !== lastBeat && beat >= 0 && beat < COUNTDOWN_BEATS + SONG_BEATS) {
        lastBeat = beat;
        stage.classList.toggle("is-beat", beat % 2 === 0);
        board.classList.toggle("is-beat", beat % 2 === 0);
        root.querySelectorAll(".funk-dancer").forEach((dancer, i) => {
          dancer.classList.toggle("is-step", (beat + i) % 2 === 0);
        });
      }

      if (t > songStart + songDur + BEAT_MS * 1.5) {
        endSong(true);
        return;
      }

      rafId = requestAnimationFrame(frame);
    }

    const pressedDirs = new Set();

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
      health = 50;
      hits = { sick: 0, good: 0, bad: 0, miss: 0 };
      finished = false;
      running = true;
      countdownDone = false;
      lastBeat = -1;
      lastCountdown = null;
      pressedDirs.clear();
      results.hidden = true;
      results.innerHTML = "";
      startBtn.hidden = true;
      countdownEl.hidden = false;
      countdownEl.textContent = "4";
      progressFill.style.width = "0%";
      updateHud("");
      els.gameStatus.textContent = "Countdown… then keep the beat!";
      getAudioContext()?.resume?.();
      funkAudio.stop();
      funkAudio.startTrack(COUNTDOWN_BEATS + SONG_BEATS, COUNTDOWN_BEATS);
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
