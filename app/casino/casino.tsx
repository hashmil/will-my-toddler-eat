"use client";

import { useEffect, useRef, useState } from "react";
import { MEALS, MOODS, PLATES, foodLook, predict, type Meal, type Mood, type PlateId, type Prediction, type Reaction } from "@/lib/predict";
import { share } from "@/lib/share";
import { tone, vibrate, wait } from "@/lib/sfx";
import { useTodaysPlates } from "@/lib/use-todays-plates";
import { VersionNav } from "@/components/version-nav";

const FILL = ["😋", "🍽️", "🤔", "🍪", "💥", "😭", "🐶", "🤢", "😴", "🥄", "⭐"];
const SYM = 64;
const OUTCOME: Record<Reaction, { reels: [string, string, string]; big: string; small: string; win?: boolean; bust?: boolean }> = {
  gobble: { reels: ["😋", "😋", "😋"], big: "JACKPOT!", small: "Pays: one full toddler", win: true },
  dance: { reels: ["🍽️", "🍽️", "🍽️"], big: "CLEAN PLATE!", small: "Pays: chair dance, film it", win: true },
  suspicious: { reels: ["🤔", "🤔", "🥄"], big: "TWO OF A KIND", small: "Pays: exactly one bite" },
  negotiate: { reels: ["🍪", "🍪", "🥄"], big: "PUSH", small: "They want a biscuit to continue" },
  throw: { reels: ["💥", "💥", "💥"], big: "BUST!", small: "Food on floor. Dog wins.", bust: true },
  cry: { reels: ["😭", "😭", "😭"], big: "BUST!", small: "Tears on the table", bust: true },
  gag: { reels: ["🤢", "🤢", "🤢"], big: "BUST!", small: "Dramatic gagging. No refunds.", bust: true },
  sleep: { reels: ["😴", "😴", "😴"], big: "TABLE CLOSED", small: "Dealer fell asleep in the food", bust: true },
};
const STAKES: Record<Mood, string> = { adventurous: "Low stakes", picky: "House edge", hangry: "High stakes", sleepy: "Closing soon" };
const IDLE = { big: "TYPE A FOOD, PULL THE LEVER", small: "The house always wins. The house is 2." };

const sfx = {
  click: () => tone(1200, 800, 0.05, "square", 0.04),
  clunk: () => tone(140, 60, 0.12, "square", 0.12),
  jackpot: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, f, 0.14, "square", 0.06, i * 0.1)),
  trombone: () => [392, 370, 349, 294].forEach((f, i) => tone(f, f * 0.97, i === 3 ? 1.0 : 0.38, "sawtooth", 0.06, i * 0.42)),
  meh: () => { tone(330, 330, 0.2, "triangle", 0.08); tone(311, 300, 0.4, "triangle", 0.08, 0.22); },
};

// Bulbs around the marquee, walking the perimeter of a box roughly 1 wide by 0.55 tall.
const BULBS = Array.from({ length: 38 }, (_, i) => {
  const d = (i / 38) * 3.1;
  const [x, y] = d < 1 ? [d, 0] : d < 1.55 ? [1, (d - 1) / 0.55] : d < 2.55 ? [1 - (d - 1.55), 1] : [0, 1 - (d - 2.55) / 0.55];
  return { left: `calc(${x * 100}% - ${x * 7}px)`, top: `calc(${y * 100}% - ${y * 7}px)` };
});

const randomSym = () => FILL[Math.floor(Math.random() * FILL.length)];

function fillStrip(strip: HTMLElement, final: string, n: number) {
  const syms = [randomSym()];
  for (let i = 0; i < n; i++) syms.push(randomSym());
  syms.push(final, randomSym());
  strip.innerHTML = syms.map((s) => `<div class="sym">${s}</div>`).join("");
  return syms.length - 2;
}

function rain(emoji: string) {
  for (let i = 0; i < 36; i++) {
    const d = document.createElement("div");
    d.className = "ca-rain";
    d.textContent = i % 3 ? emoji : "🪙";
    d.style.left = Math.random() * 100 + "vw";
    document.body.appendChild(d);
    d.animate(
      [{ transform: "translateY(0) rotate(0)" }, { transform: `translateY(${window.innerHeight + 120}px) rotate(${Math.random() * 720 - 360}deg)` }],
      { duration: 1400 + Math.random() * 1400, delay: Math.random() * 800, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" },
    ).finished.then(() => d.remove());
  }
}

export default function Casino() {
  const stripsRef = useRef<(HTMLDivElement | null)[]>([]);
  const armRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ y: number; d: number } | null>(null);

  const [food, setFood] = useState("");
  const [mood, setMood] = useState<Mood>("picky");
  const [plate, setPlate] = useState<PlateId>("red");
  const [meal, setMeal] = useState<Meal>("dinner");
  const [busy, setBusy] = useState(false);
  const [payout, setPayout] = useState(IDLE);
  const [cab, setCab] = useState<"" | "fast" | "bust">("");
  const [win, setWin] = useState(false);
  const [ticket, setTicket] = useState<Prediction | null>(null);
  const [shared, setShared] = useState("");
  const plates = useTodaysPlates();

  useEffect(() => {
    stripsRef.current.forEach((s, i) => s && fillStrip(s, ["🍽️", "😋", "🍪"][i], 0));
  }, []);

  async function spinReels(targets: string[]) {
    const tick = setInterval(() => tone(1800, 1500, 0.02, "square", 0.02), 60);
    await Promise.all(
      stripsRef.current.map((strip, i) => {
        if (!strip) return Promise.resolve();
        const idx = fillStrip(strip, targets[i], 18 + i * 6);
        const end = -(idx - 1) * SYM; // final symbol lands on the middle row
        const anim = strip.animate(
          [
            { transform: "translateY(0)", filter: "blur(0)" },
            { transform: `translateY(${end * 0.2}px)`, filter: "blur(2px)", offset: 0.15 },
            { transform: `translateY(${end * 0.97}px)`, filter: "blur(1px)", offset: 0.85 },
            { transform: `translateY(${end + 10}px)`, filter: "blur(0)", offset: 0.93 },
            { transform: `translateY(${end}px)`, filter: "blur(0)" },
          ],
          { duration: 1300 + i * 550, easing: "cubic-bezier(.2,.6,.3,1)", fill: "forwards" },
        );
        return anim.finished.then(sfx.clunk);
      }),
    );
    clearInterval(tick);
  }

  async function spin() {
    if (busy) return;
    if (!food.trim()) {
      setPayout({ big: "NO BET, NO SPIN", small: "Type a food first" });
      inputRef.current?.focus();
      return;
    }
    setBusy(true);
    inputRef.current?.blur();
    setTicket(null);
    setShared("");
    setWin(false);
    setCab("fast");
    setPayout({ big: "SPINNING...", small: "No refunds. No substitutions." });
    const r = predict({ food, mood, plate, meal });
    const o = OUTCOME[r.reaction];
    await spinReels(o.reels);
    setCab(o.win ? "fast" : o.bust ? "bust" : "");
    setPayout({ big: o.big, small: o.small });
    if (o.win) { sfx.jackpot(); setWin(true); rain(r.look.emoji); }
    else if (o.bust) sfx.trombone();
    else sfx.meh();
    vibrate(o.win ? [60, 40, 60, 40, 200] : 150);
    await wait(700);
    setTicket(r);
    const printer = setInterval(() => tone(2400 + Math.random() * 400, 2000, 0.03, "square", 0.015), 70);
    setTimeout(() => clearInterval(printer), 1400);
    setTimeout(() => ticketRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
    setBusy(false);
  }

  function again() {
    setTicket(null);
    setFood("");
    setCab("");
    setWin(false);
    setPayout(IDLE);
    window.scrollTo({ top: 0, behavior: "smooth" });
    inputRef.current?.focus();
  }

  // lever: drag the knob down past halfway, or just tap it
  function pullAnim() {
    return armRef.current!.animate([{ transform: "none" }, { transform: "scaleY(.3)" }, { transform: "none" }], { duration: 500, easing: "ease-in-out" }).finished;
  }
  function setPull(d: number) {
    const arm = armRef.current!;
    arm.style.transform = d ? `scaleY(${1 - d / 170})` : "";
    (arm.firstElementChild as HTMLElement).style.transform = d ? `scaleY(${1 / (1 - d / 170)})` : "";
  }
  const lever = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      if (busy) return;
      dragRef.current = { y: e.clientY, d: 0 };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      drag.d = Math.max(0, Math.min(120, e.clientY - drag.y));
      setPull(drag.d);
    },
    onPointerUp: async () => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      const tapped = drag.d < 6;
      const pulled = drag.d > 60;
      setPull(0);
      armRef.current!.animate([{ transform: "scaleY(.5)" }, { transform: "scaleY(1.05)" }, { transform: "none" }], { duration: 400, easing: "ease-out" });
      if (tapped) { await pullAnim(); spin(); }
      else if (pulled) spin();
    },
  };

  const emoji = food.trim() ? foodLook(food).emoji : "";

  return (
    <div className="ca">
      <div className="wrap">
        <div className={`cabinet ${cab}`}>
          <div className="marquee">
            <div className="bulbs" aria-hidden>{BULBS.map((b, i) => <i key={i} style={b} />)}</div>
            <h1>MEALTIME<br />CASINO</h1>
            <p>WILL MY TODDLER EAT THIS?</p>
          </div>

          <div className="led">
            <label htmlFor="food">PLACE YOUR BET</label>
            <div className="row">
              <input id="food" ref={inputRef} value={food} placeholder="type a food" autoComplete="off" disabled={busy}
                onChange={(e) => setFood(e.target.value)} onKeyDown={(e) => e.key === "Enter" && spin()} />
              <span className="emo">{emoji}</span>
            </div>
          </div>

          <div className="machine">
            <div className={`window${win ? " win" : ""}`}>
              {[0, 1, 2].map((i) => (
                <div className="reel" key={i}><div className="strip" ref={(el) => { stripsRef.current[i] = el; }} /></div>
              ))}
              <div className="payline" />
            </div>
            <div className="lever" role="button" aria-label="Pull the lever" tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && pullAnim().then(spin)}>
              <div className="base" />
              <div className="arm" ref={armRef}>
                <div className="knob" {...lever} />
              </div>
              <div className="hint">PULL</div>
            </div>
          </div>

          <div className={`payout${payout === IDLE || payout.big.endsWith("...") ? " idle" : ""}`} aria-live="polite">
            <div className="big">{payout.big}</div>
            <div className="small">{payout.small}</div>
          </div>
        </div>

        <div className={`ticket${ticket ? " show" : ""}`} ref={ticketRef}>
          {ticket && (
            <>
              <h3>🎟 PAYOUT TICKET</h3>
              <div className="pct">{ticket.pct}%</div>
              <div className="odds">ODDS THEY EAT {ticket.look.emoji} {ticket.food.toUpperCase()}</div>
              <p className="line">{ticket.line}</p>
              {ticket.factors.filter(([, d]) => d).map(([l, d]) => (
                <div className="f" key={l}><span>{l}</span><span className={d > 0 ? "up" : "down"}>{d > 0 ? "+" : ""}{d}</span></div>
              ))}
              <div className="bar" />
              <div className="btns">
                <button onClick={again}>BET AGAIN</button>
                <button className="ghost" onClick={async () => setShared((await share(ticket)) === "copied" ? "COPIED!" : "")}>{shared || "SHARE"}</button>
              </div>
            </>
          )}
        </div>

        <div className="table">
          <h2>TABLE <em>{STAKES[mood]}</em></h2>
          <div className="signs">
            {MOODS.map((m) => (
              <button key={m.id} className={`sign${mood === m.id ? " on" : ""}`} disabled={busy} onClick={() => { setMood(m.id); sfx.click(); }}>
                <b>{m.emoji}</b>{m.label}<small>{STAKES[m.id]}</small>
              </button>
            ))}
          </div>
          <h2>YOUR CHIP (PLATE) <em>{plates && `👑 ${plates.fav.name.split(" ")[1]} pays double today`}</em></h2>
          <div className="chips">
            {PLATES.map((p) => (
              <button key={p.id} className={`chip${plate === p.id ? " on" : ""}`} style={{ background: p.color }} aria-label={p.name} disabled={busy} onClick={() => { setPlate(p.id); sfx.click(); }}>
                {plates?.fav.id === p.id && <i>👑</i>}
                {plates?.cursed.id === p.id && <i>💀</i>}
              </button>
            ))}
          </div>
          <h2>SESSION</h2>
          <div className="signs">
            {MEALS.map((m) => (
              <button key={m.id} className={`sign${meal === m.id ? " on" : ""}`} disabled={busy} onClick={() => { setMeal(m.id); sfx.click(); }}>
                <b>{m.emoji}</b>{m.label}
              </button>
            ))}
          </div>
        </div>

        <VersionNav current="/casino" />
      </div>
    </div>
  );
}
