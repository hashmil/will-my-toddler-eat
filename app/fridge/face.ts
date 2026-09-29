import { isFeared, isLoved, predict, type Conditions, type Mood, type Prediction, type Reaction } from "@/lib/predict";
import { tone, wait } from "@/lib/sfx";

export interface Face {
  live(c: Conditions): void;
  react(r: Prediction): Promise<void>;
  reset(): void;
  dispose(): void;
}

type Skin = "hatch" | "hatchRed" | "hatchGreen";
interface Look {
  curve: number; open: number; brow: number; browLift: number; lookX: number; lookY: number; cheeks: number;
  lids: boolean; stars: boolean; skin: Skin; tears: boolean; oneBrow: number;
}
const NUMERIC = ["curve", "open", "brow", "browLift", "lookX", "lookY", "cheeks"] as const;

const MOOD_LOOK: Record<Mood, Partial<Look>> = {
  adventurous: { curve: 22, brow: -6, browLift: 6, cheeks: 0.8 },
  picky: { curve: 0, brow: 8, browLift: 0, oneBrow: 10, cheeks: 0.3, lids: true },
  hangry: { curve: -16, brow: 22, browLift: -4, cheeks: 0.2, skin: "hatchRed" },
  sleepy: { curve: 2, brow: -8, browLift: -2, cheeks: 0.4, lids: true },
};

function mouthPath(c: number, o: number) {
  if (o > 0.05) {
    const h = 8 + o * 34;
    return `M125 ${210 - h * 0.3} Q160 ${210 - h * 0.6} 195 ${210 - h * 0.3} Q200 ${210 + h * 0.6} 160 ${210 + h} Q120 ${210 + h * 0.6} 125 ${210 - h * 0.3}Z`;
  }
  return `M125 210 Q160 ${210 + c} 195 210`;
}

// Drives the crayon face drawn in fridge.tsx. Everything is found by id inside `root`.
export function createFace(root: HTMLElement): Face {
  const q = <T extends Element>(sel: string) => root.querySelector(sel) as T;
  const svg = q<SVGSVGElement>("#face"), head = q<SVGGElement>("#head"), mouth = q<SVGPathElement>("#mouth");
  const browL = q<SVGPathElement>("#browL"), browR = q<SVGPathElement>("#browR"), cheeks = q<SVGGElement>("#cheeks");
  const skin = q<SVGCircleElement>("#skin"), tears = q<SVGGElement>("#tears"), wobble = q<SVGElement>("#wobble");
  const foodFly = q<SVGTextElement>("#foodFly"), zzz = q<SVGTextElement>("#zzz");
  const say = q<HTMLDivElement>(".say"), sayText = q<HTMLSpanElement>(".say span"), sheet = q<HTMLDivElement>(".sheet"), door = q<HTMLDivElement>(".door");
  const pupils = [...root.querySelectorAll<SVGCircleElement>(".pupil")];
  const stars = [...root.querySelectorAll<SVGPathElement>(".star")];
  const lids = [...root.querySelectorAll<SVGPathElement>(".lid")];
  const hats = { adventurous: q<SVGGElement>("#hat-adventurous"), sleepy: q<SVGGElement>("#hat-sleepy"), picky: q<SVGGElement>("#hat-picky"), hangry: q<SVGGElement>("#hat-hangry") };

  let busy = false, hasFood = false, mood: Mood = "picky";
  const face: Look = { curve: 10, open: 0, brow: 0, browLift: 0, lookX: 0, lookY: 0, cheeks: 0.5, lids: false, stars: false, skin: "hatch", tears: false, oneBrow: 0 };
  const target: Look = { ...face };

  function render() {
    for (const k of NUMERIC) face[k] += (target[k] - face[k]) * 0.18;
    mouth.setAttribute("d", mouthPath(face.curve, face.open));
    mouth.setAttribute("fill", face.open > 0.05 ? "#8A1C2B" : "none");
    browL.style.transform = `translateY(${-face.browLift}px) rotate(${face.brow}deg)`;
    browR.style.transform = `translateY(${-face.browLift - target.oneBrow}px) rotate(${-face.brow}deg)`;
    pupils.forEach((p, i) => { p.setAttribute("cx", String((i ? 198 : 122) + face.lookX)); p.setAttribute("cy", String(150 + face.lookY)); p.style.display = target.stars ? "none" : ""; });
    cheeks.setAttribute("opacity", String(face.cheeks));
    stars.forEach((s) => (s.style.display = target.stars ? "" : "none"));
    lids.forEach((s) => (s.style.display = target.lids ? "" : "none"));
    skin.setAttribute("fill", `url(#${target.skin})`);
    tears.style.display = target.tears ? "" : "none";
  }

  function moodFace() {
    Object.assign(target, { stars: false, lids: false, tears: false, oneBrow: 0, open: 0, skin: "hatch", lookX: 0, lookY: 4 }, MOOD_LOOK[mood]);
    (Object.keys(hats) as Mood[]).forEach((k) => (hats[k].style.display = k === mood ? "" : "none"));
    zzz.style.display = mood === "sleepy" ? "" : "none";
  }

  // the boiling crayon line: swap the turbulence seed a few times a second
  let seed = 1;
  const boil = setInterval(() => { seed = (seed % 3) + 1; wobble.setAttribute("seed", String(seed)); }, 140);
  const blink = setInterval(() => {
    if (busy || target.lids || target.stars) return;
    target.lids = true;
    setTimeout(() => (target.lids = mood === "picky" || mood === "sleepy"), 130);
  }, 3300);
  const onMove = (e: PointerEvent) => {
    if (busy || hasFood) return;
    const r = svg.getBoundingClientRect();
    target.lookX = Math.max(-8, Math.min(8, (e.clientX - r.left - r.width / 2) / 20));
    target.lookY = Math.max(-8, Math.min(10, (e.clientY - r.top - r.height / 2) / 20));
  };
  window.addEventListener("pointermove", onMove);
  let raf = requestAnimationFrame(function loop() { render(); raf = requestAnimationFrame(loop); });

  let sayTimer: ReturnType<typeof setTimeout> | undefined;
  function speak(text: string, ms = 2600) {
    sayText.textContent = text;
    say.classList.add("show");
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => say.classList.remove("show"), ms);
  }
  function flyFood(emoji: string, frames: Keyframe[], ms: number) {
    foodFly.textContent = emoji;
    foodFly.style.display = "";
    return foodFly.animate(frames, { duration: ms, fill: "forwards", easing: "cubic-bezier(.4,0,.6,1)" }).finished;
  }

  const REACT: Record<Reaction, (r: Prediction) => Promise<void>> = {
    async gobble(r) {
      Object.assign(target, { stars: true, lids: false, open: 1, brow: -10, browLift: 8, lookY: 14 });
      await flyFood(r.look.emoji, [{ transform: "translate(0,0) scale(1)" }, { transform: "translate(0,-140px) scale(.5)", opacity: 1 }, { transform: "translate(0,-120px) scale(.2)", opacity: 0 }], 700);
      for (let i = 0; i < 5; i++) { target.open = 0.1; tone(200, 120, 0.06, "square", 0.06); await wait(110); target.open = 0.8; await wait(110); }
      Object.assign(target, { open: 0, curve: 34, cheeks: 1 });
      speak(r.says);
      [523, 659, 784].forEach((f, i) => tone(f, f, 0.15, "triangle", 0.08, i * 0.09));
      head.animate([{ transform: "rotate(0)" }, { transform: "rotate(-8deg)" }, { transform: "rotate(8deg)" }, { transform: "rotate(0)" }], { duration: 500, iterations: 3 });
      await wait(1600);
    },
    dance: (r) => REACT.gobble(r),
    async suspicious(r) {
      Object.assign(target, { lids: true, oneBrow: 14, brow: 10, curve: -2, lookY: 16 });
      await wait(500);
      for (const x of [-10, 10, -10, 0]) { target.lookX = x; await wait(330); }
      speak(r.says);
      tone(300, 420, 0.3, "triangle", 0.08);
      await wait(1600);
    },
    async negotiate(r) {
      Object.assign(target, { curve: 12, brow: -4, lookX: 10, lookY: -6, oneBrow: 8 });
      speak(r.says, 3000);
      tone(440, 520, 0.2, "triangle", 0.08);
      await wait(2400);
    },
    async throw(r) {
      Object.assign(target, { brow: 26, browLift: -6, curve: -20, lookY: 16, lids: false });
      await wait(500);
      const box = svg.getBoundingClientRect();
      tone(300, 1500, 0.3, "sawtooth", 0.04);
      await flyFood(r.look.emoji, [{ transform: "translate(0,0) rotate(0)" }, { transform: "translate(120px,-360px) rotate(540deg) scale(1.6)" }], 500);
      foodFly.style.display = "none";
      // it sticks to the drawing and slides down
      const s = document.createElement("div");
      s.className = "stuck";
      s.textContent = r.look.emoji;
      s.style.left = box.width * 0.72 + "px";
      s.style.top = "40px";
      door.appendChild(s);
      tone(160, 50, 0.3, "sine", 0.25);
      s.animate([{ transform: "scale(2.2)" }, { transform: "scale(1.2)", offset: 0.1 }, { transform: "translateY(260px) scale(1.2) rotate(20deg)" }], { duration: 2600, easing: "ease-in", fill: "forwards" });
      sheet.classList.add("shake");
      setTimeout(() => sheet.classList.remove("shake"), 500);
      Object.assign(target, { curve: 28, brow: 14 });
      speak(r.says);
      await wait(1800);
    },
    async cry(r) {
      Object.assign(target, { lids: true, open: 1, brow: -18, browLift: 6, tears: true, cheeks: 1 });
      speak(r.says);
      tone(520, 300, 0.5, "triangle", 0.1);
      tone(480, 220, 0.8, "triangle", 0.1, 0.45);
      const a = sheet.animate([{ transform: "rotate(-1.5deg)" }, { transform: "rotate(-3deg) translateX(-4px)" }, { transform: "rotate(0deg) translateX(4px)" }], { duration: 160, iterations: 12 });
      root.querySelectorAll(".tear").forEach((t) => t.animate([{ strokeDasharray: "0 80" }, { strokeDasharray: "80 0" }], { duration: 500, iterations: 4 }));
      await a.finished;
    },
    async gag(r) {
      Object.assign(target, { skin: "hatchGreen", lids: true, open: 0.5, brow: -14 });
      speak(r.says);
      head.animate([{ transform: "none" }, { transform: "translateY(-6px) rotate(-6deg)" }, { transform: "none" }], { duration: 300, iterations: 4 });
      await wait(1800);
    },
    async sleep(r) {
      Object.assign(target, { lids: true, curve: 4, brow: -8 });
      zzz.style.display = "";
      speak(r.says);
      await head.animate([{ transform: "none" }, { transform: "rotate(18deg) translateY(10px)" }], { duration: 1400, fill: "forwards", easing: "ease-in" }).finished;
      await wait(900);
    },
  };

  return {
    // every keystroke and every magnet makes the drawing reconsider
    live(c) {
      mood = c.mood;
      hasFood = !!c.food.trim();
      if (busy) return;
      moodFace();
      if (!hasFood) return;
      const r = predict(c);
      target.curve = (r.pct - 50) * 0.7;
      target.brow = r.pct < 35 ? 18 : r.pct > 65 ? -8 : 4;
      target.lookY = 14;
      target.lookX = Math.sin(c.food.length) * 6;
      if (isLoved(c.food)) Object.assign(target, { stars: true, lids: false, cheeks: 1, curve: Math.max(target.curve, 24) });
      if (isFeared(c.food)) Object.assign(target, { skin: "hatchGreen", lids: true });
    },
    async react(r) {
      busy = true;
      await wait(500);
      await REACT[r.reaction](r);
    },
    reset() {
      busy = false;
      head.getAnimations().forEach((a) => a.cancel());
      foodFly.style.display = "none";
      door.querySelectorAll(".stuck").forEach((s) => s.remove());
      say.classList.remove("show");
      moodFace();
    },
    dispose() {
      cancelAnimationFrame(raf);
      clearInterval(boil);
      clearInterval(blink);
      clearTimeout(sayTimer);
      window.removeEventListener("pointermove", onMove);
    },
  };
}
