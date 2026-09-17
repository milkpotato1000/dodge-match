import { dogMotion, happyFrame, COLLISION_MS } from "./dog-motion";
import {
  isMovementCode,
  keyboardVector,
  type KeyboardLayout,
} from "./keyboard";
import { Game, Scene, AUTO, Scale, GameObjects } from "phaser";
import { Engine, COLORS, GLYPHS, NAMES, STEP, type Chart } from "./core";
import {
  settings,
  saveSettings,
  rankedForChart,
  recordRun,
  storageUnavailable,
  type Settings,
} from "./storage";
import { preload } from "./preload";
import { AudioBus } from "./audio";
import "./style.css";
const overlay = document.querySelector<HTMLDivElement>("#overlay")!,
  pauseButton = document.querySelector<HTMLButtonElement>("#pause")!;
const prefs = settings(),
  audio = new AudioBus();
document.documentElement.dataset.reduced = String(prefs.reduced);
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const clock = (ms: number) =>
  `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${(Math.floor(ms / 1000) % 60).toString().padStart(2, "0")}.${Math.floor(
    ms % 1000,
  )
    .toString()
    .padStart(3, "0")}`;
let chart: Chart,
  scene: PlayScene,
  game: Game,
  dogImage: HTMLImageElement,
  loadingImage: HTMLImageElement,
  cryImage: HTMLImageElement;
let collisionStarted = -Infinity;
let state:
    | "setup"
    | "playing"
    | "paused"
    | "countdown"
    | "result"
    | "board"
    | "ending" = "setup",
  resumeAt = 0,
  accumulator = 0,
  lastGradeCount = 0;
let engine: Engine;
const keys = new Set<string>();
const roles = new Map<number, "move" | "match">();
let pad = { x: 0, y: 0 };
const playing = () => state === "playing";
function clearInput() {
  keys.clear();
  roles.clear();
  pad = { x: 0, y: 0 };
  if (engine) engine.move = { x: 0, y: 0 };
}
function shell(content: string) {
  overlay.innerHTML = content;
  overlay.hidden = false;
}
function keyboardForm() {
  return `<fieldset class="keyboard-setting"><legend>PC 이동 키</legend><div class="segmented" role="group" aria-label="PC 이동 키"><button type="button" data-keyboard="wasd" aria-pressed="${prefs.keyboardLayout === "wasd"}" class="${prefs.keyboardLayout === "wasd" ? "selected" : ""}">WASD</button><button type="button" data-keyboard="arrows" aria-pressed="${prefs.keyboardLayout === "arrows"}" class="${prefs.keyboardLayout === "arrows" ? "selected" : ""}">방향키 ↑ ↓ ← →</button></div><small>선택한 키만 이동에 사용됩니다 · 자동 저장</small></fieldset>`;
}
function bindKeyboard() {
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-keyboard]"),
  );
  for (const button of buttons)
    button.onclick = () => {
      clearInput();
      prefs.keyboardLayout = button.dataset.keyboard as KeyboardLayout;
      saveSettings(prefs);
      for (const item of buttons) {
        const active = item.dataset.keyboard === prefs.keyboardLayout;
        item.setAttribute("aria-pressed", String(active));
        item.classList.toggle("selected", active);
      }
    };
}
function isEditing(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.matches("input, textarea, select") || target.isContentEditable)
  );
}
function musicForm() {
  return `<label class="toggle"><input id="music" type="checkbox" ${prefs.music ? "checked" : ""}> MUSIC <span>120 BPM 테스트 클릭</span></label><label class="range">음악 음량<input id="volume" type="range" min="0" max="1" step=".05" value="${prefs.volume}"></label><label class="range">효과음<input id="sfx" type="range" min="0" max="1" step=".05" value="${prefs.sfx}"></label>`;
}
function bindMusic() {
  for (const id of ["music", "volume", "sfx"])
    document.getElementById(id)?.addEventListener("input", (e) => {
      const el = e.target as HTMLInputElement;
      if (id === "music") prefs.music = el.checked;
      else prefs[id as "volume" | "sfx"] = Number(el.value);
      saveSettings(prefs);
    });
}
function setup() {
  state = "setup";
  pauseButton.hidden = true;
  clearInput();
  shell(
    `<section class="menu"><div class="intro"><div class="eyebrow"><i></i> NEON ORBIT ARCADE <span>01 / FIRST ORBIT</span></div><div class="intro-title"><h1>DODGE<span> / </span><br>MATCH<span class="period">.</span></h1><img class="intro-dog" src="/assets/dog.png" alt="게임의 주인공 강아지"></div><p class="tagline">두 가지 본능. 하나의 리듬.</p><p class="description">야구공을 피하며, 링이 닿는 순간 색을 맞추세요.<br>같은 색 발판으로 이동해 누르면 점수 2배!</p><div class="instructions"><div><b>01</b><strong>MOVE</strong><span>선택한 PC 이동 키 · D-pad</span></div><div><b>02</b><strong>MATCH</strong><span>링이 닿으면 탭 / 같은 색 발판은 ×2</span></div><div><b>03</b><strong>SURVIVE</strong><span>${chart.durationMs / 1000}초 · 한 번의 충돌로 종료</span></div></div><div class="menu-foot">${chart.durationMs / 1000} SEC <span>×</span> ${chart.targets.length} TARGETS <span>×</span> 7 COLORS</div></div><div class="launch"><form id="setup-form"><label class="field">PLAYER NAME<input id="name" maxlength="16" value="${esc(prefs.name)}" required autocomplete="nickname"></label><div class="layout-label">PLAYFIELD ORDER</div><div class="segmented"><button type="button" id="normal" class="${prefs.swapped ? "" : "selected"}">DODGE / MATCH</button><button type="button" id="swapped" class="${prefs.swapped ? "selected" : ""}">MATCH / DODGE</button></div>${keyboardForm()}<details><summary>사운드 · 접근성 설정 <span>＋</span></summary>${musicForm()}<label class="toggle"><input id="reduced" type="checkbox" ${prefs.reduced ? "checked" : ""}> Reduced Effects</label><label class="toggle"><input id="vibration" type="checkbox" ${prefs.vibration ? "checked" : ""}> 진동</label><label class="range">오디오 보정 (ms)<input id="offset" type="number" min="-300" max="300" value="${prefs.offset}"></label><div class="legend">${GLYPHS.map((g, i) => `<span style="color:#${COLORS[i].toString(16)}">${g} ${NAMES[i]}</span>`).join("")}</div></details><button class="primary" type="submit">플레이 시작 <span>↗</span></button><button type="button" class="text-button" id="board">로컬 기록 보기 <span>→</span></button></form><small>최고 기록 ${rankedForChart(chart)[0]?.total.toLocaleString() ?? "—"} <span> / </span> 이 기기에 저장</small></div></section>`,
  );
  bindMusic();
  bindKeyboard();
  document.getElementById("normal")!.onclick = () => {
    prefs.swapped = false;
    saveSettings(prefs);
    setup();
  };
  document.getElementById("swapped")!.onclick = () => {
    prefs.swapped = true;
    saveSettings(prefs);
    setup();
  };
  document.getElementById("board")!.onclick = () => board();
  for (const id of ["reduced", "vibration"])
    document.getElementById(id)!.onchange = (e) => {
      prefs[id as "reduced" | "vibration"] = (
        e.target as HTMLInputElement
      ).checked;
      document.documentElement.dataset.reduced = String(prefs.reduced);
      saveSettings(prefs);
    };
  document.getElementById("setup-form")!.onsubmit = (e) => {
    e.preventDefault();
    prefs.name =
      (document.getElementById("name") as HTMLInputElement).value
        .trim()
        .slice(0, 16) || "PLAYER";
    prefs.offset = Math.max(
      -300,
      Math.min(
        300,
        Number((document.getElementById("offset") as HTMLInputElement).value) ||
          0,
      ),
    );
    saveSettings(prefs);
    start();
  };
}
function start(seed = crypto.getRandomValues(new Uint32Array(1))[0]) {
  if (innerHeight > innerWidth) return;
  audio.unlock();
  audio.lastBeat = -1;
  engine = new Engine(chart, seed);
  lastGradeCount = 0;
  countdown();
}
function countdown() {
  if (overlay.contains(document.activeElement))
    (document.activeElement as HTMLElement | null)?.blur();
  state = "countdown";
  clearInput();
  accumulator = 0;
  resumeAt = performance.now() + 3000;
  pauseButton.hidden = false;
  shell(
    '<div class="countdown"><div class="eyebrow">FIND YOUR RHYTHM</div><strong id="count">3</strong><p>같은 색 발판으로 이동 · 클릭하면 ×2</p></div>',
  );
}
function pause() {
  if (state !== "playing" && state !== "countdown") return;
  state = "paused";
  clearInput();
  accumulator = 0;
  shell(
    `<section class="modal"><div class="eyebrow">TAKE A BREATH</div><h2>PAUSED<span>.</span></h2><p>시계가 멈췄어요. 준비되면 다시 시작하세요.</p>${keyboardForm()}${musicForm()}<button class="primary" id="resume">계속하기 <span>→</span></button><button class="text-button" id="quit">시작 화면으로</button></section>`,
  );
  bindMusic();
  bindKeyboard();
  document.getElementById("resume")!.onclick = () => {
    audio.unlock();
    countdown();
  };
  document.getElementById("quit")!.onclick = setup;
}
function result() {
  state = "result";
  clearInput();
  pauseButton.hidden = true;
  recordRun(engine, prefs.name);
  const s = engine.score;
  const clear = engine.end === "chart_complete";
  shell(
    `<section class="modal result"><div class="eyebrow">${clear ? `${chart.durationMs / 1000} SECONDS. YOU MADE IT.` : "ONE MORE ORBIT?"}</div><h2>${clear ? "TRACK CLEAR" : "GAME OVER"}<span>.</span></h2><p>${clear ? "두 가지 리듬을 끝까지 지켰어요." : engine.end === "dodge_collision" ? "야구공과 충돌했어요. 다음에는 조금 더 멀리." : "Match 생명이 소진됐어요. 모든 원을 타이밍에 맞춰 누르세요."}</p><div class="final-score">${s.total(engine.time).toLocaleString()}<small> / ${chart.maxScore.toLocaleString()} 이론상</small></div><div class="score-split"><span>DODGE <b>${(Math.floor(engine.time / 1000) * 100).toLocaleString()}</b></span><span>MATCH <b>${s.match.toLocaleString()}</b></span><span>TIME <b>${clock(engine.time)}</b></span></div><div class="grade-grid">${Object.entries(
      s.counts,
    )
      .map(([g, n]) => `<div><b>${n}</b><span>${g.toUpperCase()}</span></div>`)
      .join(
        "",
      )}</div><p class="muted">MAX COMBO ×${s.maxCombo} · SEED ${engine.seed}</p>${storageUnavailable ? "<p>저장 공간에 접근할 수 없어 기록을 저장하지 못했어요.</p>" : ""}<div class="actions"><button class="primary" id="again">다시 도전 ↗</button><button class="secondary" id="same">같은 시드</button></div><button class="text-button" id="board">로컬 기록 →</button><button class="text-button" id="home">시작 화면</button></section>`,
  );
  document.getElementById("again")!.onclick = () => start();
  document.getElementById("same")!.onclick = () => start(engine.seed);
  document.getElementById("board")!.onclick = board;
  document.getElementById("home")!.onclick = setup;
}
function board() {
  state = "board";
  pauseButton.hidden = true;
  const rows = rankedForChart(chart);
  shell(
    `<section class="modal leaderboard"><div class="eyebrow">YOUR PERSONAL BEST</div><h2>LOCAL RECORDS<span>.</span></h2><p>이 기기의 First Orbit 기록 · 높은 점수 순</p><div class="table-scroll"><table><thead><tr><th>#</th><th>PLAYER</th><th>SCORE</th><th>TIME</th><th>P / G / G / M</th></tr></thead><tbody>${rows.length ? rows.map((r, i) => `<tr><td>${String(i + 1).padStart(2, "0")}</td><td>${esc(r.name)}</td><td>${r.total.toLocaleString()}<small>D ${r.dodge} / M ${r.match}</small></td><td>${clock(r.survival)}</td><td>${Object.values(r.counts).join(" / ")}</td></tr>`).join("") : '<tr><td colspan="5">아직 기록이 없어요. 첫 번째 도전을 시작하세요.</td></tr>'}</tbody></table></div><button class="primary" id="home">시작 화면으로 →</button></section>`,
  );
  document.getElementById("home")!.onclick = setup;
}
class PlayScene extends Scene {
  g!: GameObjects.Graphics;
  dog!: GameObjects.Image;
  texts: GameObjects.Text[] = [];
  used = 0;
  create() {
    scene = this;
    this.textures.addImage("dog", dogImage);
    this.textures.addImage("dog-cry", cryImage);
    const frame = happyFrame(loadingImage);
    this.textures
      .addImage("dog-loading", loadingImage)!
      .add("happy", 0, frame.x, frame.y, frame.width, frame.height);
    this.g = this.add.graphics();
    this.dog = this.add.image(0, 0, "dog").setDepth(2);
    this.input.addPointer(4);
    this.input.on("pointerdown", (p: any) => {
      if (!playing()) return;
      const dp = this.padCenter();
      if (
        Math.abs(p.x - dp.x) <= 56 * this.padScale() &&
        Math.abs(p.y - dp.y) <= 56 * this.padScale() &&
        ![...roles.values()].includes("move")
      ) {
        roles.set(p.id, "move");
        this.updatePad(p);
      } else if ((prefs.swapped ? p.x < 800 : p.x >= 800) && p.button === 0) {
        roles.set(p.id, "match");
        const x = (p.x - this.matchX()) / 7.44,
          y = (p.y - 120) / 7.44;
        const t = engine.targets
          .filter((t) => !t.judged && Math.hypot(t.x - x, t.y - y) <= 12.5)
          .sort(
            (a, b) =>
              Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
          )[0];
        if (t) engine.tap(t.id, engine.time + accumulator);
      }
    });
    this.input.on("pointermove", (p: any) => {
      if (roles.get(p.id) === "move") this.updatePad(p);
    });
    const release = (p: any) => {
      if (roles.get(p.id) === "move") pad = { x: 0, y: 0 };
      roles.delete(p.id);
    };
    this.input.on("pointerup", release);
    this.input.on("pointerupoutside", release);
    setup();
    document.getElementById("boot")!.hidden = true;
  }
  dodgeX() {
    return prefs.swapped ? 828 : 28;
  }
  matchX() {
    return prefs.swapped ? 28 : 828;
  }
  padScale() {
    return 1600 / this.game.canvas.getBoundingClientRect().width;
  }
  padCenter() {
    const inset = 72 * this.padScale();
    return { x: prefs.swapped ? 1600 - inset : inset, y: 900 - inset };
  }
  updatePad(p: any) {
    const c = this.padCenter(),
      x = p.x - c.x,
      y = p.y - c.y;
    if (
      Math.abs(x) > 56 * this.padScale() ||
      Math.abs(y) > 56 * this.padScale() ||
      Math.hypot(x, y) < 8 * this.padScale()
    ) {
      pad = { x: 0, y: 0 };
      return;
    }
    const a = (Math.round(Math.atan2(y, x) / (Math.PI / 4)) * Math.PI) / 4;
    pad = { x: Math.round(Math.cos(a)), y: Math.round(Math.sin(a)) };
  }
  label(
    x: number,
    y: number,
    s: string,
    size = 24,
    color = "#eff4ff",
    align = "left",
    alpha = 1,
  ) {
    let t = this.texts[this.used++];
    if (!t) {
      t = this.add
        .text(x, y, s, {
          fontFamily: "Arial, sans-serif",
          fontSize: size,
          color,
        })
        .setDepth(3);
      this.texts.push(t);
    }
    t.setPosition(x, y)
      .setText(s)
      .setFontSize(size)
      .setColor(color)
      .setOrigin(align === "center" ? 0.5 : 0, 0)
      .setAlpha(alpha)
      .setVisible(true);
  }
  update(_t: number, delta: number) {
    if (state === "countdown") {
      const remaining = resumeAt - performance.now();
      const count = document.getElementById("count");
      if (count)
        count.textContent = String(Math.max(1, Math.ceil(remaining / 1000)));
      if (remaining <= 0) {
        state = "playing";
        overlay.hidden = true;
        accumulator = 0;
      }
    }
    if (playing()) {
      const movement = isEditing(document.activeElement)
        ? { x: 0, y: 0 }
        : keyboardVector(keys, prefs.keyboardLayout);
      engine.move = { x: pad.x + movement.x, y: pad.y + movement.y };
      accumulator += Math.min(delta, 100);
      while (accumulator >= STEP && !engine.end) {
        engine.step();
        accumulator -= STEP;
      }
      audio.update(engine.time, prefs);
      const count = Object.values(engine.score.counts).reduce(
        (a, b) => a + b,
        0,
      );
      if (count !== lastGradeCount) {
        const g = engine.feedback.at(-1)?.grade;
        audio.tone(g === "Miss" ? 150 : 1000, prefs.sfx);
        if (prefs.vibration && g === "Miss") navigator.vibrate?.(40);
        lastGradeCount = count;
      }
      if (engine.end === "dodge_collision") {
        state = "ending";
        collisionStarted = performance.now();
        clearInput();
        pauseButton.hidden = true;
      } else if (engine.end) result();
    }
    if (
      state === "ending" &&
      performance.now() - collisionStarted >= COLLISION_MS
    )
      result();
    this.draw();
  }
  draw() {
    const g = this.g;
    g.clear();
    this.used = 0;
    this.dog.setVisible(!!engine && state !== "setup" && state !== "board");
    g.fillStyle(0x080d1b).fillRect(0, 0, 1600, 900);
    if (!engine || state === "setup" || state === "board") {
      this.texts.forEach((t) => t.setVisible(false));
      return;
    }
    const e = engine,
      dx = this.dodgeX(),
      mx = this.matchX(),
      size = 744,
      u = 7.44;
    g.fillStyle(0x0e1628).fillRoundedRect(mx, 120, size, size, 12);
    for (let i = 0; i < 16; i++) {
      const width = size / 4,
        x = dx + (i % 4) * width,
        y = 120 + Math.floor(i / 4) * width;
      const rgb = e.zones.display(i, e.time).map((v) => Math.floor(v * 0.24));
      g.fillStyle((rgb[0] << 16) | (rgb[1] << 8) | rgb[2]).fillRect(
        x,
        y,
        width,
        width,
      );
      e.zones.glyphs(i, e.time).forEach((weight, color) => {
        if (weight > 0.001)
          this.label(
            x + width / 2,
            y + width / 2 - 35,
            GLYPHS[color],
            70,
            "#c5d4eb",
            "center",
            0.06 * weight,
          );
      });
      const pulse = Math.max(0, 1 - (e.time - e.zones.zones[i].changed) / 350);
      if (pulse > 0) {
        g.fillStyle(0xdbfff2, 0.14 * pulse).fillRect(x, y, width, width);
        g.lineStyle(3, 0xb9ffe7, pulse).strokeRect(
          x + 2,
          y + 2,
          width - 4,
          width - 4,
        );
      }
    }
    g.lineStyle(0.93, 0x050914);
    for (let i = 1; i < 4; i++) {
      g.lineBetween(dx + (i * size) / 4, 120, dx + (i * size) / 4, 864);
      g.lineBetween(dx, 120 + (i * size) / 4, dx + size, 120 + (i * size) / 4);
    }
    const pc = COLORS[e.zones.zones[Math.max(0, e.zones.current)].color];
    const px = dx + e.player.x * u,
      py = 120 + e.player.y * u;
    g.fillStyle(pc, 0.23).fillCircle(px, py, 24);
    g.lineStyle(1.5, pc, 0.7).strokeCircle(px, py, 24);
    const motion = dogMotion(
      e.time,
      e.successAt,
      e.end,
      performance.now() - collisionStarted,
      prefs.reduced,
    );
    this.dog
      .setTexture(
        motion.kind === "happy"
          ? "dog-loading"
          : motion.kind === "cry"
            ? "dog-cry"
            : "dog",
        motion.kind === "happy" ? "happy" : undefined,
      )
      .setOrigin(0.5, 1);
    const spriteScale =
      (4.4 * u) / Math.max(this.dog.frame.width, this.dog.frame.height);
    this.dog
      .setScale(spriteScale)
      .setPosition(px, py - motion.lift * u)
      .setRotation(
        motion.kind === "happy" || prefs.reduced ? 0 : e.move.x * 0.1,
      );
    g.fillStyle(0xd8faff).fillCircle(px, py, 2);
    this.label(
      px,
      py - 48,
      GLYPHS[e.zones.zones[Math.max(0, e.zones.current)].color],
      23,
      "#" + pc.toString(16),
      "center",
    );
    const padPos = this.padCenter(),
      ps = this.padScale();
    g.fillStyle(0x080d1b, 0.5)
      .fillRoundedRect(
        padPos.x - 22 * ps,
        padPos.y - 56 * ps,
        44 * ps,
        112 * ps,
        6 * ps,
      )
      .fillRoundedRect(
        padPos.x - 56 * ps,
        padPos.y - 22 * ps,
        112 * ps,
        44 * ps,
        6 * ps,
      );
    for (const [ox, oy, s] of [
      [0, -34, "↑"],
      [-34, 0, "←"],
      [34, 0, "→"],
      [0, 34, "↓"],
    ] as const)
      this.label(
        padPos.x + ox * ps,
        padPos.y + (oy - 11) * ps,
        s,
        20 * ps,
        "#8091ae",
        "center",
      );
    for (const b of e.balls) {
      const x = dx + b.x * u,
        y = 120 + b.y * u,
        r = 1.6 * u;
      if (b.activeAt > e.time) {
        g.lineStyle(2, 0xffde99, 0.7).strokeCircle(x, y, r + 6);
        continue;
      }
      g.fillStyle(0xf3ecd9).fillCircle(x, y, r);
      g.lineStyle(1.5, 0x465773);
      g.beginPath();
      g.arc(x - r * 0.7, y, r * 0.85, -1.1, 1.1);
      g.strokePath();
      g.beginPath();
      g.arc(x + r * 0.7, y, r * 0.85, Math.PI - 1.1, Math.PI + 1.1);
      g.strokePath();
    }
    for (const t of e.targets) {
      if (t.judged) continue;
      const x = mx + t.x * u,
        y = 120 + t.y * u,
        c = COLORS[t.color],
        r = 10.5 * u,
        progress = Math.min(1, Math.max(0, (e.time - t.spawn) / t.approach)),
        ring = r + (1 - progress) * 8 * u;
      g.fillStyle(c, 0.08).fillCircle(x, y, r);
      g.lineStyle(t.locked ? 4 : 2, c, 0.95).strokeCircle(x, y, r);
      g.lineStyle(2, c, 0.55).strokeCircle(x, y, ring);
      this.label(
        x,
        y - 26,
        GLYPHS[t.color],
        47,
        "#" + c.toString(16),
        "center",
      );
      this.label(
        x,
        y + r + 7,
        String(t.id + 1).padStart(3, "0"),
        15,
        "#7e8ca7",
        "center",
      );
      if (t.color === e.zones.zones[e.zones.current].color) {
        g.lineStyle(8, 0xe4eaff, 0.7).strokeCircle(x, y, r + 9);
        this.label(x, y + r - 26, "×2", 19, "#f8faff", "center");
      }
    }
    for (const f of e.feedback) {
      const matched = f.reason === "COLOR MATCH ×2";
      const age = Math.max(0, e.time - f.time),
        progress = Math.min(1, age / 700);
      const alpha = 1 - progress;
      const pop =
        matched && !prefs.reduced
          ? 1 + 0.18 * Math.sin(Math.min(1, age / 220) * Math.PI)
          : 1;
      const fx = matched
        ? Math.max(mx + 220, Math.min(mx + size - 220, mx + f.x * u))
        : mx + f.x * u;
      const fy =
        Math.max(145, Math.min(800, 120 + f.y * u - 16)) -
        (matched && !prefs.reduced ? progress * 24 : 0);
      if (matched && !prefs.reduced) {
        g.lineStyle(3 * alpha, 0x8ef5de, alpha * 0.55).strokeCircle(
          mx + f.x * u,
          120 + f.y * u,
          70 + progress * 65,
        );
      }
      this.label(
        fx,
        fy,
        f.grade.toUpperCase() + (matched ? " × MATCH!!!" : ""),
        (matched ? 28 : 26) * pop,
        f.grade === "Miss" ? "#ffb1be" : "#8ef5de",
        "center",
        alpha,
      );
      this.label(
        fx,
        fy + 44,
        matched ? "SCORE ×2" : f.reason,
        14,
        matched ? "#f8da72" : "#b7c3d8",
        "center",
        alpha,
      );
    }
    g.lineStyle(1, 0x263146).lineBetween(0, 96, 1600, 96);
    this.label(32, 20, "SCORE", 14, "#8291aa");
    this.label(
      32,
      44,
      e.score.total(e.time).toLocaleString().padStart(6, "0"),
      32,
    );
    this.label(
      245,
      20,
      `TIME / ${clock(chart.durationMs).slice(0, 5)}`,
      14,
      "#8291aa",
    );
    this.label(245, 46, clock(e.time), 25);
    this.label(458, 20, "COMBO", 14, "#8291aa");
    this.label(458, 46, "×" + e.score.combo, 27, "#bfa4ff");
    this.label(585, 20, "MATCH LIFE", 14, "#8291aa");
    g.fillStyle(0x202c40).fillRoundedRect(585, 55, 210, 10, 5);
    g.fillStyle(e.score.life < 25 ? 0xff7588 : 0x7be1cb).fillRoundedRect(
      585,
      55,
      Math.max(1, e.score.life * 2.1),
      10,
      5,
    );
    this.label(805, 47, String(e.score.life), 22);
    const id = Math.max(0, e.zones.current);
    this.label(880, 20, "CURRENT TILE", 14, "#8291aa");
    this.label(
      880,
      46,
      `${GLYPHS[e.zones.zones[id].color]} ${NAMES[e.zones.zones[id].color]}`,
      25,
      "#" + pc.toString(16),
    );
    this.label(1130, 20, "COLOR MATCH", 14, "#8291aa");
    this.label(1130, 46, "SCORE ×2", 25, "#a6efd5");
    this.label(
      32,
      875,
      prefs.keyboardLayout === "wasd" ? "WASD" : "↑↓←→",
      13,
      "#596c89",
    );
    this.label(800, 875, "FIRST ORBIT · 120 BPM", 13, "#596c89", "center");
    this.label(1310, 875, "ESC · PAUSE", 13, "#596c89");
    for (let i = this.used; i < this.texts.length; i++)
      this.texts[i].setVisible(false);
  }
}
window.addEventListener("keydown", (e) => {
  if (e.code === "Escape") {
    pause();
    return;
  }
  if (isEditing(e.target) || isEditing(document.activeElement)) {
    clearInput();
    return;
  }
  if (!playing() || !isMovementCode(e.code, prefs.keyboardLayout)) return;
  e.preventDefault();
  // A held key after pause/layout change must be released and pressed again.
  if (e.repeat && !keys.has(e.code)) return;
  keys.add(e.code);
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
document.addEventListener("focusin", (e) => {
  if (isEditing(e.target)) clearInput();
});
window.addEventListener("blur", pause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
window.addEventListener("resize", () => {
  if (innerHeight > innerWidth) pause();
});
pauseButton.onclick = pause;
document
  .getElementById("game")!
  .addEventListener("contextmenu", (e) => e.preventDefault());
async function boot() {
  const detail = document.getElementById("loading-detail")!,
    fill = document.getElementById("load-fill")!,
    runner = document.getElementById("runner")!,
    label = document.getElementById("load-label")!;
  let failed = false;
  const timeout = setTimeout(() => (detail.hidden = false), 150);
  try {
    const assets = await preload((n) => {
      if (failed) return;
      fill.style.width = n + "%";
      runner.style.left = n + "%";
      label.textContent = Math.floor(n) + "%";
    });
    chart = assets.chart;
    dogImage = assets.dog;
    loadingImage = assets.loading;
    cryImage = assets.cry;
    clearTimeout(timeout);
    game = new Game({
      type: AUTO,
      parent: "game",
      width: 1600,
      height: 900,
      backgroundColor: "#080d1b",
      scale: { mode: Scale.FIT, autoCenter: Scale.CENTER_BOTH },
      scene: PlayScene,
      input: { activePointers: 5 },
    });
    if ("serviceWorker" in navigator && import.meta.env.PROD)
      void navigator.serviceWorker.register("/sw.js");
  } catch (error) {
    failed = true;
    clearTimeout(timeout);
    detail.hidden = false;
    label.textContent =
      "LOAD FAILED · " +
      (error instanceof Error ? error.message : "다시 시도하세요");
    const retry = document.createElement("button");
    retry.className = "primary";
    retry.textContent = "RETRY";
    retry.onclick = () => location.reload();
    detail.append(retry);
  }
}
void boot();
// Read-only diagnostics are available only on the development server.
if (import.meta.env.DEV)
  Object.defineProperty(window, "__dodge", {
    get: () => ({ state, engine, settings: { ...prefs }, scene, game }),
  });
