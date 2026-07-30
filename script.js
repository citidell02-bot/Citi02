(() => {
  "use strict";

  const QUEST_XP = 15;
  const FOCUS_XP = 25;
  const STORAGE_KEY = "study-quest-save";
  const RING = 2 * Math.PI * 54;

  const RANKS = [
    "Novice Scholar",
    "Apprentice Learner",
    "Focus Cadet",
    "Knowledge Seeker",
    "Study Knight",
    "Mind Mage",
    "Focus Champion",
    "Wisdom Hunter",
    "Grand Scholar",
    "Study Legend",
  ];

  const els = {
    form: document.getElementById("quest-form"),
    input: document.getElementById("quest-input"),
    list: document.getElementById("quest-list"),
    empty: document.getElementById("empty-quests"),
    questCount: document.getElementById("quest-count"),
    timerMinutes: document.getElementById("timer-minutes"),
    timerSeconds: document.getElementById("timer-seconds"),
    timerToggle: document.getElementById("timer-toggle"),
    timerReset: document.getElementById("timer-reset"),
    sessionLabel: document.getElementById("session-label"),
    ring: document.getElementById("ring-progress"),
    modeBtns: document.querySelectorAll(".mode-btn"),
    levelNumber: document.getElementById("level-number"),
    rankTitle: document.getElementById("rank-title"),
    xpToNext: document.getElementById("xp-to-next"),
    xpFill: document.getElementById("xp-fill"),
    xpLabel: document.getElementById("xp-label"),
    xpTotal: document.getElementById("xp-total"),
    xpBar: document.querySelector(".xp-bar"),
    questsDone: document.getElementById("quests-done"),
    statSessions: document.getElementById("stat-sessions"),
    statStreak: document.getElementById("stat-streak"),
    statFocus: document.getElementById("stat-focus"),
    toast: document.getElementById("toast"),
  };

  const state = {
    quests: [],
    totalXp: 0,
    questsCleared: 0,
    sessions: 0,
    streak: 0,
    focusMinutes: 0,
    mode: "focus",
    duration: 25 * 60,
    remaining: 25 * 60,
    running: false,
    intervalId: null,
  };

  function xpForLevel(level) {
    return 100 + (level - 1) * 25;
  }

  function getLevelInfo(totalXp) {
    let level = 1;
    let remaining = totalXp;
    let needed = xpForLevel(level);

    while (remaining >= needed) {
      remaining -= needed;
      level += 1;
      needed = xpForLevel(level);
    }

    return {
      level,
      currentXp: remaining,
      needed,
      progress: Math.round((remaining / needed) * 100),
      rank: RANKS[Math.min(level - 1, RANKS.length - 1)],
    };
  }

  function save() {
    const payload = {
      quests: state.quests,
      totalXp: state.totalXp,
      questsCleared: state.questsCleared,
      sessions: state.sessions,
      streak: state.streak,
      focusMinutes: state.focusMinutes,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota errors */
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      state.quests = Array.isArray(data.quests) ? data.quests : [];
      state.totalXp = Number(data.totalXp) || 0;
      state.questsCleared = Number(data.questsCleared) || 0;
      state.sessions = Number(data.sessions) || 0;
      state.streak = Number(data.streak) || 0;
      state.focusMinutes = Number(data.focusMinutes) || 0;
    } catch {
      /* ignore corrupt saves */
    }
  }

  function showToast(message, isLevelUp = false) {
    els.toast.hidden = false;
    els.toast.textContent = message;
    els.toast.classList.toggle("level-up", isLevelUp);
    requestAnimationFrame(() => els.toast.classList.add("show"));
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2200);
  }

  function addXp(amount, reason) {
    const before = getLevelInfo(state.totalXp);
    state.totalXp += amount;
    const after = getLevelInfo(state.totalXp);
    renderLevel();
    save();

    if (after.level > before.level) {
      showToast(`Level Up! Now LVL ${after.level}`, true);
    } else {
      showToast(`+${amount} XP — ${reason}`);
    }
  }

  function renderQuests() {
    els.list.innerHTML = "";
    const active = state.quests.filter((q) => !q.done).length;

    els.questCount.textContent = `${active} active`;
    els.empty.classList.toggle("visible", state.quests.length === 0);

    state.quests.forEach((quest) => {
      const li = document.createElement("li");
      li.className = `quest-item${quest.done ? " completed" : ""}`;
      li.dataset.id = quest.id;

      const check = document.createElement("button");
      check.type = "button";
      check.className = `quest-check${quest.done ? " done" : ""}`;
      check.setAttribute("aria-label", quest.done ? "Mark incomplete" : "Complete quest");
      check.addEventListener("click", () => toggleQuest(quest.id));

      const text = document.createElement("span");
      text.className = "quest-text";
      text.textContent = quest.text;

      const xp = document.createElement("span");
      xp.className = "quest-xp";
      xp.textContent = `+${QUEST_XP} XP`;

      const del = document.createElement("button");
      del.type = "button";
      del.className = "quest-delete";
      del.setAttribute("aria-label", "Delete quest");
      del.textContent = "×";
      del.addEventListener("click", () => deleteQuest(quest.id));

      li.append(check, text, xp, del);
      els.list.appendChild(li);
    });
  }

  function renderLevel() {
    const info = getLevelInfo(state.totalXp);
    els.levelNumber.textContent = String(info.level);
    els.rankTitle.textContent = info.rank;
    els.xpToNext.textContent = `${info.needed - info.currentXp} XP to next level`;
    els.xpFill.style.width = `${info.progress}%`;
    els.xpLabel.textContent = `${info.currentXp} / ${info.needed} XP`;
    els.xpTotal.textContent = `${state.totalXp} XP total`;
    els.xpBar.setAttribute("aria-valuenow", String(info.progress));
    els.questsDone.textContent = `${state.questsCleared} quests cleared`;
    els.statSessions.textContent = String(state.sessions);
    els.statStreak.textContent = String(state.streak);
    els.statFocus.textContent =
      state.focusMinutes >= 60
        ? `${Math.floor(state.focusMinutes / 60)}h ${state.focusMinutes % 60}m`
        : `${state.focusMinutes}m`;
  }

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return {
      minutes: String(m).padStart(2, "0"),
      seconds: String(s).padStart(2, "0"),
    };
  }

  function renderTimer() {
    const { minutes, seconds } = formatTime(state.remaining);
    els.timerMinutes.textContent = minutes;
    els.timerSeconds.textContent = seconds;

    const progress = state.duration === 0 ? 0 : 1 - state.remaining / state.duration;
    els.ring.style.strokeDasharray = String(RING);
    els.ring.style.strokeDashoffset = String(RING * (1 - progress));
    els.ring.classList.toggle("break", state.mode !== "focus");

    els.timerToggle.textContent = state.running ? "Pause" : "Start";

    const labels = {
      focus: "Focus Session",
      short: "Short Break",
      long: "Long Break",
    };
    els.sessionLabel.textContent = labels[state.mode];
  }

  function addQuest(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    state.quests.unshift({
      id: crypto.randomUUID(),
      text: trimmed,
      done: false,
    });
    renderQuests();
    save();
  }

  function toggleQuest(id) {
    const quest = state.quests.find((q) => q.id === id);
    if (!quest) return;

    if (!quest.done) {
      quest.done = true;
      state.questsCleared += 1;
      state.streak += 1;
      renderQuests();
      addXp(QUEST_XP, "Quest complete");
    } else {
      quest.done = false;
      state.questsCleared = Math.max(0, state.questsCleared - 1);
      state.streak = Math.max(0, state.streak - 1);
      state.totalXp = Math.max(0, state.totalXp - QUEST_XP);
      renderQuests();
      renderLevel();
      save();
    }
  }

  function deleteQuest(id) {
    state.quests = state.quests.filter((q) => q.id !== id);
    renderQuests();
    save();
  }

  function setMode(mode, minutes) {
    pauseTimer();
    state.mode = mode;
    state.duration = minutes * 60;
    state.remaining = state.duration;

    els.modeBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });

    renderTimer();
  }

  function tick() {
    if (state.remaining <= 0) {
      completeSession();
      return;
    }
    state.remaining -= 1;
    renderTimer();
  }

  function startTimer() {
    if (state.running) return;
    if (state.remaining <= 0) {
      state.remaining = state.duration;
    }
    state.running = true;
    state.intervalId = setInterval(tick, 1000);
    renderTimer();
  }

  function pauseTimer() {
    state.running = false;
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    renderTimer();
  }

  function resetTimer() {
    pauseTimer();
    state.remaining = state.duration;
    renderTimer();
  }

  function completeSession() {
    pauseTimer();
    state.remaining = 0;
    renderTimer();

    if (state.mode === "focus") {
      state.sessions += 1;
      state.focusMinutes += 25;
      addXp(FOCUS_XP, "Focus session cleared");
    } else {
      showToast("Break complete — back to the quest!");
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Study Quest", {
        body:
          state.mode === "focus"
            ? "Focus session complete! +25 XP earned."
            : "Break over. Time to focus again.",
      });
    }
  }

  function requestNotifyPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    addQuest(els.input.value);
    els.input.value = "";
    els.input.focus();
  });

  els.timerToggle.addEventListener("click", () => {
    requestNotifyPermission();
    if (state.running) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  els.timerReset.addEventListener("click", resetTimer);

  els.modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      setMode(btn.dataset.mode, Number(btn.dataset.minutes));
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.running) {
      /* keep ticking via interval — no change needed */
    }
  });

  load();
  els.ring.style.strokeDasharray = String(RING);
  els.ring.style.strokeDashoffset = "0";
  renderQuests();
  renderLevel();
  renderTimer();
})();
