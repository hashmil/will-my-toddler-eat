"use client";

import { useEffect, useRef, useState } from "react";
import { MEALS, MOODS, PLATES, foodLook, predict, type Meal, type Mood, type PlateId, type Prediction } from "@/lib/predict";
import { share } from "@/lib/share";
import { tone } from "@/lib/sfx";
import { useTodaysPlates } from "@/lib/use-todays-plates";
import { VersionNav } from "@/components/version-nav";
import { createFace, type Face } from "./face";

const COLORS = ["#E5383B", "#2F6FDE", "#38A33C", "#F6893B", "#F7C948", "#A855F7"];
const TITLE = "WILL MY TODDLER EAT THIS?".split(" ");
const VERDICT = { yes: "YUM. They'll eat it.", maybe: "Hmm. Maybe.", no: "NOPE." };
const clack = () => tone(900, 300, 0.06, "square", 0.05);

function Sticker({ verdict }: { verdict: Prediction["verdict"] }) {
  if (verdict === "yes")
    return (
      <svg className="sticker" viewBox="0 0 100 100">
        <path d="M50 4 l13 28 30 3 -23 20 7 30 -27 -16 -27 16 7 -30 -23 -20 30 -3z" fill="#F7C948" stroke="#E0A800" strokeWidth="4" />
        <text x="50" y="62" fontFamily="var(--font-baloo)" fontWeight="800" fontSize="15" textAnchor="middle" fill="#8A5A3B">GOOD</text>
      </svg>
    );
  if (verdict === "maybe")
    return (
      <svg className="sticker" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="44" fill="#F6893B" />
        <text x="50" y="68" fontFamily="var(--font-baloo)" fontWeight="800" fontSize="52" textAnchor="middle" fill="#fff">?</text>
      </svg>
    );
  return (
    <svg className="sticker" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="42" fill="none" stroke="#E5383B" strokeWidth="7" />
      <text x="50" y="62" fontFamily="var(--font-baloo)" fontWeight="800" fontSize="30" textAnchor="middle" fill="#E5383B">NO</text>
    </svg>
  );
}

export default function Fridge() {
  const rootRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<Face | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const [food, setFood] = useState("");
  const [mood, setMood] = useState<Mood>("picky");
  const [plate, setPlate] = useState<PlateId>("red");
  const [meal, setMeal] = useState<Meal>("dinner");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Prediction | null>(null);
  const [shared, setShared] = useState("");
  const plates = useTodaysPlates();

  useEffect(() => {
    const f = createFace(rootRef.current!);
    faceRef.current = f;
    return () => f.dispose();
  }, []);
  useEffect(() => faceRef.current?.live({ food, mood, plate, meal }), [food, mood, plate, meal]);

  const emoji = food.trim() ? foodLook(food).emoji : "";

  async function ask() {
    if (busy || !food.trim() || !faceRef.current) return;
    setBusy(true);
    setResult(null);
    inputRef.current?.blur();
    rootRef.current?.querySelector(".sheet")?.scrollIntoView({ behavior: "smooth", block: "start" });
    const r = predict({ food, mood, plate, meal });
    await faceRef.current.react(r);
    setResult(r);
    setBusy(false);
    tone(180, 90, 0.12, "square", 0.08);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
  }

  function again() {
    setResult(null);
    setShared("");
    setFood("");
    faceRef.current?.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
    inputRef.current?.focus();
  }

  return (
    <div className="fr" ref={rootRef}>
      <div className="door">
        <div className="handle" />
        <h1 className="title" aria-label="Will my toddler eat this?">
          {TITLE.map((w, wi) => (
            <span className="w" key={w} aria-hidden>
              {[...w].map((c, i) => (
                <span key={i} className="mag" style={{ color: COLORS[(wi * 3 + i * 5) % COLORS.length], transform: `rotate(${((wi * 7 + i * 13) % 17) - 8}deg) translateY(${((i * 11) % 5) - 2}px)` }}>{c}</span>
              ))}
            </span>
          ))}
        </h1>

        <div className="sheet">
          <span className="pin" style={{ left: 18, background: "var(--crayon-blue)" }} />
          <span className="pin" style={{ right: 18, background: "var(--crayon-green)" }} />
          <div className="face-wrap">
            <svg id="face" viewBox="0 0 320 290" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A crayon drawing of the toddler">
              <defs>
                <filter id="crayon" x="-10%" y="-10%" width="120%" height="120%">
                  <feTurbulence id="wobble" type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={1} result="n" />
                  <feDisplacementMap in="SourceGraphic" in2="n" scale={5} result="d" />
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={4} result="g" />
                  <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.9" result="ga" />
                  <feComposite in="d" in2="ga" operator="in" />
                </filter>
                {([["hatch", "#FBD9BE", "#F6B98E"], ["hatchRed", "#F9B3A6", "#EF8573"], ["hatchGreen", "#D5E9B8", "#A9D07C"]] as const).map(([id, bg, line]) => (
                  <pattern key={id} id={id} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                    <rect width="7" height="7" fill={bg} />
                    <line x1="0" y1="0" x2="0" y2="7" stroke={line} strokeWidth="3.5" />
                  </pattern>
                ))}
              </defs>
              <g filter="url(#crayon)" strokeLinecap="round" strokeLinejoin="round">
                <g id="head" style={{ transformOrigin: "160px 160px" }}>
                  <circle cx="62" cy="160" r="20" fill="url(#hatch)" stroke="#8A5A3B" strokeWidth="5" />
                  <circle cx="258" cy="160" r="20" fill="url(#hatch)" stroke="#8A5A3B" strokeWidth="5" />
                  <circle id="skin" cx="160" cy="160" r="100" fill="url(#hatch)" stroke="#8A5A3B" strokeWidth="6" />
                  <path d="M120 70 q10 -30 30 -12 q10 -34 32 -6 q16 -24 26 8" fill="none" stroke="#8A5A3B" strokeWidth="6" />
                  <g id="cheeks" opacity=".5">
                    <circle cx="100" cy="190" r="17" fill="#E5383B" opacity=".45" />
                    <circle cx="220" cy="190" r="17" fill="#E5383B" opacity=".45" />
                  </g>
                  {[122, 198].map((x) => (
                    <g key={x}>
                      <ellipse cx={x} cy="148" rx="22" ry="24" fill="#fff" stroke="#222" strokeWidth="5" />
                      <circle className="pupil" cx={x} cy="150" r="10" fill="#222" />
                      <path className="star" d={`M${x} 136 l4 9 10 1 -7 7 2 10 -9 -5 -9 5 2 -10 -7 -7 10 -1z`} fill="#F6893B" stroke="#E5383B" strokeWidth="2" style={{ display: "none" }} />
                      <path className="lid" d={`M${x - 24} 148 Q${x} 136 ${x + 24} 148`} fill="url(#hatch)" stroke="#222" strokeWidth="5" style={{ display: "none" }} />
                    </g>
                  ))}
                  <path id="browL" d="M102 112 L142 112" stroke="#8A5A3B" strokeWidth="7" style={{ transformOrigin: "122px 112px" }} />
                  <path id="browR" d="M178 112 L218 112" stroke="#8A5A3B" strokeWidth="7" style={{ transformOrigin: "198px 112px" }} />
                  <path id="mouth" d="M125 210 Q160 225 195 210" fill="none" stroke="#222" strokeWidth="6" />
                  <g id="tears" stroke="#2F6FDE" strokeWidth="6" fill="none" style={{ display: "none" }}>
                    <path d="M112 172 q-4 30 2 60" className="tear" />
                    <path d="M208 172 q4 30 -2 60" className="tear" />
                  </g>
                  <g id="hat-adventurous" style={{ display: "none" }}>
                    <path d="M100 72 L160 10 L220 72 Z" fill="#F6893B" stroke="#E5383B" strokeWidth="5" />
                    <circle cx="160" cy="10" r="10" fill="#E5383B" />
                    <path d="M125 50 l10 10 M150 36 l10 10 M175 48 l10 10" stroke="#fff" strokeWidth="4" />
                  </g>
                  <g id="hat-sleepy" style={{ display: "none" }}>
                    <path d="M78 88 Q160 20 244 88 Q250 70 280 110 L300 150" fill="#2F6FDE" stroke="#1d4fa8" strokeWidth="5" />
                    <circle cx="300" cy="150" r="13" fill="#fff" stroke="#1d4fa8" strokeWidth="4" />
                  </g>
                  <g id="hat-picky" style={{ display: "none" }}>
                    <circle cx="198" cy="148" r="30" fill="none" stroke="#F6893B" strokeWidth="5" />
                    <path d="M226 158 q20 40 -8 80" fill="none" stroke="#F6893B" strokeWidth="3" />
                  </g>
                  <g id="hat-hangry" style={{ display: "none" }} stroke="#9aa3ad" strokeWidth="5" fill="none">
                    <path d="M40 140 q-12 -12 0 -24 q12 -12 0 -24" />
                    <path d="M280 140 q12 -12 0 -24 q-12 -12 0 -24" />
                  </g>
                </g>
                <text id="foodFly" x="160" y="330" fontSize="52" textAnchor="middle" style={{ display: "none" }} />
                <text id="zzz" x="250" y="70" fontSize="30" fill="#2F6FDE" fontFamily="var(--font-gochi)" style={{ display: "none" }}>z z Z</text>
              </g>
            </svg>
            <div className="say" aria-live="polite">
              <svg viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden>
                <path d="M6 8 Q50 0 94 8 Q100 30 94 46 Q60 52 30 48 L14 60 L18 46 Q2 40 6 8Z" fill="#fff" stroke="#2F6FDE" strokeWidth="2.5" filter="url(#crayon)" />
              </svg>
              <span />
            </div>
          </div>
          <div className="caption">&quot;me&quot; by Toddler, age 2</div>
        </div>

        <div className="note">
          <label htmlFor="food">Tonight we are trying...</label>
          <input id="food" ref={inputRef} value={food} autoComplete="off" placeholder="write a food" disabled={busy}
            onChange={(e) => setFood(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} />
          <span key={emoji} className="emo">{emoji}</span>
        </div>

        <div className="label">Their mood</div>
        <div className="magnets">
          {MOODS.map((m) => (
            <button key={m.id} className={`magnet${mood === m.id ? " on" : ""}`} disabled={busy} onClick={() => { setMood(m.id); clack(); }}>
              <b>{m.emoji}</b>{m.label}
            </button>
          ))}
        </div>
        <div className="label">Plate <em>{plates && `👑 ${plates.fav.name.split(" ")[1].toLowerCase()} is today's favourite`}</em></div>
        <div className="magnets">
          {PLATES.map((p) => (
            <button key={p.id} className={`plate${plate === p.id ? " on" : ""}`} style={{ background: p.color }} aria-label={p.name} disabled={busy} onClick={() => { setPlate(p.id); clack(); }}>
              {plates?.fav.id === p.id && <i>👑</i>}
              {plates?.cursed.id === p.id && <i>💀</i>}
            </button>
          ))}
        </div>
        <div className="label">Meal</div>
        <div className="magnets meals">
          {MEALS.map((m) => (
            <button key={m.id} className={`magnet${meal === m.id ? " on" : ""}`} disabled={busy} onClick={() => { setMeal(m.id); clack(); }}>
              <b>{m.emoji}</b>{m.label}
            </button>
          ))}
        </div>

        <button className="ask" disabled={!food.trim() || busy} onClick={ask}>ASK THE TODDLER</button>

        {result && (
          <div className={`result ${result.verdict}`} ref={resultRef} aria-live="polite">
            <span className="pin" style={{ left: "46%", background: COLORS[result.pct % COLORS.length] }} />
            <Sticker verdict={result.verdict} />
            <div className="big">{result.pct}%</div>
            <div className="v">{VERDICT[result.verdict]}</div>
            <p className="line">{result.line}</p>
            <ul>
              {result.factors.filter(([, d]) => d).map(([l, d]) => (
                <li key={l}><span>{l}</span><span className={d > 0 ? "up" : "down"}>{d > 0 ? "+" : ""}{d}</span></li>
              ))}
            </ul>
            <div className="btns">
              <button className="again" onClick={again}>TRY ANOTHER FOOD</button>
              <button className="again" onClick={async () => setShared((await share(result)) === "copied" ? "COPIED!" : "")}>{shared || "SHARE"}</button>
            </div>
          </div>
        )}

        <VersionNav current="/fridge" />
      </div>
    </div>
  );
}
