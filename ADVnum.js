// ====== Estado do jogo ======
const state = {
  level: 1,
  min: 1,
  max: 50,
  secret: null,
  tries: 0,
  bestByLevel: JSON.parse(localStorage.getItem("numeria_best")) || {},
  rank: JSON.parse(localStorage.getItem("numeria_rank")) || []
};

// ====== Elementos ======
const el = {
  level: document.getElementById("level"),
  range: document.getElementById("range"),
  tries: document.getElementById("tries"),
  best: document.getElementById("best"),
  hint: document.getElementById("hint"),
  guess: document.getElementById("guess"),
  btnGuess: document.getElementById("btnGuess"),
  btnReset: document.getElementById("btnReset"),
  btnGiveUp: document.getElementById("btnGiveUp"),
  log: document.getElementById("log"),
  rank: document.getElementById("rank"),
  toast: document.getElementById("toast"),
  confetti: document.getElementById("confetti")
};

// Guarda erro se algo faltar no HTML
for (const [k, v] of Object.entries(el)) {
  if (!v) console.warn(`Elemento não encontrado: ${k}`);
}

// ====== Sons (MP3 externos) ======
// Dica: coloque os arquivos na mesma pasta do HTML
const soundSuccessSrc = "YTDown.com_YouTube_Fahh-Sound-Effect_Media_QGm7W0KZen4_008_128k.mp3";
const soundErrorSrc   = "YTDown.com_YouTube_lobotomy-sound-effect_Media_iIeajyim5eU_006_128k.mp3";

// Para permitir toques em sequência sem travar o mesmo <audio>, usamos clones
function playAudio(src, volume = 1.0) {
  const a = new Audio(src);
  a.volume = volume;
  // Evita bloqueio em alguns navegadores caso não haja gesto do usuário
  a.play().catch(() => { /* silencia erro de autoplay */ });
}

// ====== Utilidades ======
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const save = () => {
  localStorage.setItem("numeria_best", JSON.stringify(state.bestByLevel));
  localStorage.setItem("numeria_rank", JSON.stringify(state.rank.slice(0, 10)));
};
const toast = (msg) => {
  if (!el.toast) return;
  el.toast.textContent = msg;
  el.toast.classList.add("show");
  setTimeout(() => el.toast.classList.remove("show"), 1800);
};

// ====== Confetti ======
const confetti = {
  ctx: el.confetti ? el.confetti.getContext("2d") : null,
  parts: [],
  running: false,
  resize() {
    if (!el.confetti) return;
    el.confetti.width = window.innerWidth;
    el.confetti.height = window.innerHeight;
  },
  shoot(count = 120) {
    if (!this.ctx) return;
    this.resize();
    const colors = ["#7c5cff", "#ff5c9a", "#38d88b", "#f7b733", "#e7e9ff"];
    for (let i = 0; i < count; i++) {
      this.parts.push({
        x: Math.random() * el.confetti.width,
        y: -20,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: Math.random() * 80 + 60
      });
    }
    if (!this.running) {
      this.running = true;
      requestAnimationFrame(this.loop.bind(this));
      setTimeout(() => {
        this.parts = [];
        this.running = false;
        this.clear();
      }, 1500);
    }
  },
  loop() {
    if (!this.ctx) return;
    this.clear();
    for (const p of this.parts) {
      p.vy += 0.06;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
    }
    this.parts = this.parts.filter(p => p.life > 0 && p.y < (el.confetti ? el.confetti.height + 40 : 0));
    for (const p of this.parts) {
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    if (this.running) requestAnimationFrame(this.loop.bind(this));
  },
  clear() {
    if (!this.ctx || !el.confetti) return;
    this.ctx.clearRect(0, 0, el.confetti.width, el.confetti.height);
  }
};
window.addEventListener("resize", () => confetti.resize());

// ====== UI / Ranking ======
function setLevel(level) {
  state.level = level;
  state.min = 1;
  state.max = 50 + (level - 1) * 50;
  state.secret = randInt(state.min, state.max);
  state.tries = 0;
  updateUI(true);
  if (el.log) el.log.innerHTML = "";
  setHint("Novo número secreto gerado!", "cold");
  if (el.guess) {
    el.guess.value = "";
    el.guess.min = state.min;
    el.guess.max = state.max;
    el.guess.focus();
  }
}

function updateUI(resetHint = false) {
  if (el.level) el.level.textContent = state.level;
  if (el.range) el.range.textContent = `${state.min} – ${state.max}`;
  if (el.tries) el.tries.textContent = state.tries;
  const best = state.bestByLevel[state.level];
  if (el.best) el.best.textContent = (best || best === 0) ? best : "—";
  if (resetHint && el.hint) el.hint.setAttribute("data-type", "cold");
  renderRank();
}

function renderRank() {
  if (!el.rank) return;
  el.rank.innerHTML = "";
  const list = (state.rank || []).slice(0, 10);
  if (!list.length) {
    el.rank.innerHTML = `<div class="item"><div class="left"><div class="dot"></div><div>Ninguém no ranking ainda</div></div><div class="right">—</div></div>`;
    return;
  }
  list.forEach((r, i) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <div class="left"><div class="dot"></div>
        <div>#${i + 1} • Nível ${r.level} • ${r.tries} tentativa(s)</div>
      </div>
      <div class="right">${new Date(r.when).toLocaleString()}</div>`;
    el.rank.appendChild(item);
  });
}

function setHint(text, type = "cold") {
  if (!el.hint) return;
  el.hint.setAttribute("data-type", type);
  el.hint.innerHTML = `<span>${labelFor(type)}</span><div>${text}</div>`;
}
function labelFor(type) {
  switch (type) {
    case "cold": return "Aleatório:";
    case "warm": return "Aleatório:";
    case "hot": return "Aleatório:";
    case "win": return "Conseguiu!";
    case "give": return "Resposta:";
    default: return "Sistema:";
  }
}

function heatFeedback(guess) {
  const rangeSize = state.max - state.min;
  const diff = Math.abs(state.secret - guess);
  const ratio = diff / Math.max(1, rangeSize);
  if (diff === 0) return { type: "win", text: "🎉 Confetes digitais! Você decifrou o enigma." };
  if (ratio >= 0.20) return { type: "cold", text: "Está frio! Tente um número bem diferente." };
  if (ratio >= 0.10) return { type: "warm", text: "Quase lá… ajuste um pouco." };
  return { type: "hot", text: "Quente demais! Está muito perto." };
}

// ====== Palpite ======
function onGuess() {
  if (!el.guess) return;
  const value = parseInt(el.guess.value, 10);
  if (Number.isNaN(value)) {
    toast("Digite um número válido.");
    return;
  }
  const g = clamp(value, state.min, state.max);
  state.tries++;
  if (el.tries) el.tries.textContent = state.tries;

  const fb = heatFeedback(g);
  setHint(fb.text, fb.type);
  appendLog(`Palpite: ${g} → ${fb.text}`);

  if (g < state.secret) appendLog("Dica: tente maior.");
  else if (g > state.secret) appendLog("Dica: tente menor.");

  if (fb.type === "win") {
    playAudio(soundSuccessSrc, 0.9); // som de acerto
    confetti.shoot();
    const best = state.bestByLevel[state.level];
    if (!best || state.tries < best) {
      state.bestByLevel[state.level] = state.tries;
      toast("Novo recorde do nível!");
    } else {
      toast("Boa! Nível concluído.");
    }
    state.rank.unshift({ level: state.level, tries: state.tries, when: Date.now() });
    save();
    updateUI();
    setTimeout(() => setLevel(state.level + 1), 1200);
  } else {
    playAudio(soundErrorSrc, 0.9); // som de erro
  }
}

function appendLog(msg) {
  if (!el.log) return;
  const p = document.createElement("p");
  p.textContent = msg;
  el.log.prepend(p);
}

// ====== Desistir / Reset ======
function giveUp() {
  setHint(`O número era ${state.secret}.`, "give");
  appendLog(`Você desistiu. Número secreto: ${state.secret}`);
  toast("Tudo bem! Novo número foi gerado.");
  confetti.clear();
  setTimeout(() => setLevel(state.level), 700);
}

function resetGame() {
  state.bestByLevel = {};
  state.rank = [];
  save();
  setLevel(1);
  toast("Jogo reiniciado. Bons palpites!");
}

// ====== Eventos ======
if (el.btnGuess) el.btnGuess.addEventListener("click", onGuess);
if (el.btnGiveUp) el.btnGiveUp.addEventListener("click", giveUp);
if (el.btnReset) el.btnReset.addEventListener("click", resetGame);
if (el.guess) {
  el.guess.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onGuess();
  });
}

// ====== Start ======
setLevel(1);
