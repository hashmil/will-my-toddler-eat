"use client";

import { useEffect, useRef, useState } from "react";
import { MEALS, MOODS, PLATES, foodLook, predict, type Meal, type Mood, type PlateId, type Prediction } from "@/lib/predict";
import { share } from "@/lib/share";
import { tone } from "@/lib/sfx";
import { useTodaysPlates } from "@/lib/use-todays-plates";
import { VersionNav } from "@/components/version-nav";
import { createScene, type HighChairScene } from "./scene";

const VERDICT = {
  yes: ["They'll eat it", "Clear the table for seconds"],
  maybe: ["Maybe. Maybe not.", "Proceed with snacks on standby"],
  no: ["Not a chance", "Have a backup ready"],
} as const;

export default function HighChair() {
  const stageRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const splatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sceneRef = useRef<HighChairScene | null>(null);

  const [food, setFood] = useState("");
  const [mood, setMood] = useState<Mood>("picky");
  const [plate, setPlate] = useState<PlateId>("red");
  const [meal, setMeal] = useState<Meal>("dinner");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Prediction | null>(null);
  const [shared, setShared] = useState("");
  const plates = useTodaysPlates();

  useEffect(() => {
    const s = createScene(stageRef.current!, bubbleRef.current!, splatRef.current!);
    sceneRef.current = s;
    return () => s.dispose();
  }, []);
  useEffect(() => sceneRef.current?.setMood(mood), [mood]);
  useEffect(() => sceneRef.current?.setMeal(meal), [meal]);
  useEffect(() => sceneRef.current?.setPlate(PLATES.find((p) => p.id === plate)!.color), [plate]);

  const emoji = food.trim() ? foodLook(food).emoji : "🍽️";

  async function serve() {
    if (busy || !food.trim() || !sceneRef.current) return;
    setBusy(true);
    inputRef.current?.blur();
    const r = predict({ food, mood, plate, meal });
    await sceneRef.current.serve(r);
    setResult(r);
  }

  function again() {
    setResult(null);
    setShared("");
    sceneRef.current?.reset();
    setFood("");
    setBusy(false);
    inputRef.current?.focus();
  }

  const click = () => tone(500, 900, 0.08, "sine", 0.08);

  return (
    <div className="hc">
      <div className="app">
        <div id="stage" ref={stageRef}>
          <div className="logo">
            Will my toddler
            <br />
            <span>eat this?</span>
          </div>
          <div className="bubble" ref={bubbleRef} />
        </div>

        <div className="sheet">
          <div className="food">
            <span key={emoji} className="emoji">{emoji}</span>
            <input
              ref={inputRef}
              value={food}
              placeholder="What's on the plate?"
              autoComplete="off"
              aria-label="Food"
              onChange={(e) => { setFood(e.target.value); sceneRef.current?.typing(e.target.value); }}
              onKeyDown={(e) => e.key === "Enter" && serve()}
            />
          </div>

          <div className="label">Mood <em>Tap to change their face</em></div>
          <div className="row">
            {MOODS.map((m) => (
              <button key={m.id} className={`chip${mood === m.id ? " on" : ""}`} disabled={busy} onClick={() => { setMood(m.id); click(); }}>
                <b>{m.emoji}</b>{m.label}
              </button>
            ))}
          </div>

          <div className="label">Plate <em>{plates && `👑 ${plates.fav.name.split(" ")[1]} is today's favourite`}</em></div>
          <div className="plates">
            {PLATES.map((p) => (
              <button key={p.id} className={`plate${plate === p.id ? " on" : ""}`} style={{ background: p.color }} aria-label={p.name} disabled={busy} onClick={() => { setPlate(p.id); click(); }}>
                {plates?.fav.id === p.id && <i>👑</i>}
                {plates?.cursed.id === p.id && <i>💀</i>}
              </button>
            ))}
          </div>

          <div className="label">Meal</div>
          <div className="row">
            {MEALS.map((m) => (
              <button key={m.id} className={`chip${meal === m.id ? " on" : ""}`} disabled={busy} onClick={() => { setMeal(m.id); click(); }}>
                <b>{m.emoji}</b>{m.label}
              </button>
            ))}
          </div>

          <button className="serve" disabled={!food.trim() || busy} onClick={serve}>SERVE IT</button>
          <VersionNav current="/high-chair" />
        </div>
      </div>

      <div className={`result ${result?.verdict ?? ""}${result ? " show" : ""}`} aria-live="polite">
        {result && (
          <>
            <div className="res-top">
              <div className="pct">{result.pct}%</div>
              <div className="verdict">{VERDICT[result.verdict][0]}<small>{VERDICT[result.verdict][1]}</small></div>
            </div>
            <p className="line">{result.line}</p>
            <div className="factors">
              {result.factors.filter(([, d]) => d).map(([l, d]) => (
                <div key={l}><span>{l}</span><span className={d > 0 ? "up" : "down"}>{d > 0 ? "+" : ""}{d}</span></div>
              ))}
            </div>
            <div className="res-btns">
              <button className="primary" onClick={again}>Try another food</button>
              <button onClick={async () => setShared((await share(result)) === "copied" ? "Copied!" : "")}>{shared || "Share"}</button>
            </div>
          </>
        )}
      </div>
      <div className="splat" ref={splatRef} />
    </div>
  );
}
