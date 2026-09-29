import * as THREE from "three";
import { isFeared, isLoved, type FoodLook, type Meal, type Mood, type Prediction, type Reaction } from "@/lib/predict";
import { noise, tone, vibrate, wait } from "@/lib/sfx";

export interface HighChairScene {
  setMood(m: Mood): void;
  setMeal(m: Meal): void;
  setPlate(color: string): void;
  typing(food: string): void;
  serve(r: Prediction): Promise<void>;
  reset(): void;
  dispose(): void;
}

const sfx = {
  pop: () => tone(500, 900, 0.08, "sine", 0.08),
  drop: () => tone(300, 80, 0.25, "sine", 0.2),
  chomp: () => noise(0.09, 1200, 0.25),
  whoosh: () => { tone(200, 1400, 0.35, "sawtooth", 0.04); noise(0.35, 2000, 0.1); },
  splat: () => { noise(0.5, 500, 0.6); tone(160, 40, 0.3, "sine", 0.3); },
  wah: () => { tone(520, 300, 0.5, "triangle", 0.12); tone(480, 220, 0.8, "triangle", 0.12, 0.45); },
  hmm: () => tone(220, 260, 0.4, "triangle", 0.1),
  tada: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.18, "square", 0.05, i * 0.09)),
  giggle: () => tone(700, 1100, 0.15, "sine", 0.1),
};

const MEAL_LIGHT: Record<Meal, { hemi: number; hi: number; sun: number; si: number; wall: number; lamp: number }> = {
  breakfast: { hemi: 0xfff1d6, hi: 1.25, sun: 0xffd9a0, si: 1.8, wall: 0xffffff, lamp: 0 },
  lunch: { hemi: 0xffffff, hi: 1.4, sun: 0xffffff, si: 2.0, wall: 0xffffff, lamp: 0 },
  dinner: { hemi: 0xd9ccf5, hi: 1.05, sun: 0xffb27a, si: 1.4, wall: 0xd2daf0, lamp: 12 },
  snack: { hemi: 0xffffff, hi: 1.3, sun: 0xfff4e0, si: 1.8, wall: 0xffffff, lamp: 0 },
};

const ease = {
  io: (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  in: (t: number) => t * t * t,
  lin: (t: number) => t,
  bounce: (t: number) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function createScene(stage: HTMLDivElement, bubble: HTMLDivElement, splatEl: HTMLDivElement): HighChairScene {
  let mood: Mood = "picky";
  let food = "";
  let busy = false;
  let disposed = false;

  // ---------- renderer, camera, lights ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 3.0, 6.9);
  camera.lookAt(0, 2.3, 0);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xf5d7a1, 1.3);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1.8);
  sun.position.set(3, 7, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 5, bottom: -2 });
  sun.shadow.radius = 6;
  scene.add(sun);
  const lamp = new THREE.PointLight(0xffb070, 0, 12);
  lamp.position.set(-2, 5, 2);
  scene.add(lamp);

  // ---------- room ----------
  const tileCanvas = document.createElement("canvas");
  tileCanvas.width = tileCanvas.height = 256;
  const tg = tileCanvas.getContext("2d")!;
  tg.fillStyle = "#BFE6F5";
  tg.fillRect(0, 0, 256, 256);
  tg.strokeStyle = "#E3F4FB";
  tg.lineWidth = 6;
  for (let i = 0; i <= 256; i += 64) {
    tg.beginPath(); tg.moveTo(i, 0); tg.lineTo(i, 256); tg.stroke();
    tg.beginPath(); tg.moveTo(0, i); tg.lineTo(256, i); tg.stroke();
  }
  const tileTex = new THREE.CanvasTexture(tileCanvas);
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
  tileTex.repeat.set(5, 4);
  tileTex.colorSpace = THREE.SRGBColorSpace;
  const wallMat = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.6 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), wallMat);
  wall.position.set(0, 5, -2.5);
  wall.receiveShadow = true;
  scene.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: 0xf5d7a1, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const mat = (color: number, rough = 0.45) => new THREE.MeshStandardMaterial({ color, roughness: rough });
  const mesh = (geo: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D, pos: [number, number, number] = [0, 0, 0]) => {
    const x = new THREE.Mesh(geo, m);
    x.position.set(...pos);
    x.castShadow = true;
    x.receiveShadow = true;
    parent.add(x);
    return x;
  };

  // ---------- high chair ----------
  const chair = new THREE.Group();
  scene.add(chair);
  const red = mat(0xe63b2e), yellow = mat(0xffc72c), blue = mat(0x1e6fd9);
  for (const [x, z] of [[-0.7, -0.5], [0.7, -0.5], [-0.75, 0.55], [0.75, 0.55]]) {
    const leg = mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.45, 12), red, chair, [x, 0.72, z]);
    leg.rotation.z = x > 0 ? -0.08 : 0.08;
  }
  mesh(new THREE.BoxGeometry(1.5, 0.16, 1.2), yellow, chair, [0, 1.45, 0]);
  const back = mesh(new THREE.CapsuleGeometry(0.7, 0.5, 8, 16), yellow, chair, [0, 2.2, -0.6]);
  back.scale.z = 0.18;
  mesh(new THREE.BoxGeometry(2.3, 0.12, 1.0), blue, chair, [0, 1.95, 0.95]);
  mesh(new THREE.TorusGeometry(1.1, 0.06, 8, 40, Math.PI), blue, chair, [0, 2.0, 0.95]).rotation.x = -Math.PI / 2;
  const plateMat = mat(0xef4444, 0.3);
  mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.07, 36), plateMat, chair, [0, 2.05, 1.05]);

  // ---------- toddler ----------
  const kid = new THREE.Group();
  kid.position.set(0, 1.5, -0.05);
  scene.add(kid);
  const skinMat = mat(0xf6c9a5, 0.55);
  const onesie = mat(0x2ba84a, 0.5);
  const body = mesh(new THREE.CapsuleGeometry(0.45, 0.35, 8, 20), onesie, kid, [0, 0.55, 0]);
  mesh(new THREE.CircleGeometry(0.34, 32), mat(0xffffff, 0.8), kid, [0, 0.62, 0.43]);
  const head = new THREE.Group();
  head.position.set(0, 1.42, 0.05);
  kid.add(head);
  mesh(new THREE.SphereGeometry(0.66, 40, 32), skinMat, head);
  mesh(new THREE.SphereGeometry(0.16, 16, 12), skinMat, head, [-0.64, 0, 0]);
  mesh(new THREE.SphereGeometry(0.16, 16, 12), skinMat, head, [0.64, 0, 0]);
  const curl = mesh(new THREE.TorusGeometry(0.12, 0.035, 8, 20, Math.PI * 1.6), mat(0x6b3e26), head, [0.05, 0.7, 0.1]);
  curl.rotation.y = 0.4;
  const black = mat(0x1b1b2f, 0.2), white = mat(0xffffff, 0.2);
  const eyes = [-0.22, 0.22].map((x) => {
    const e = mesh(new THREE.SphereGeometry(0.09, 20, 16), black, head, [x, 0.1, 0.6]);
    e.scale.z = 0.6;
    mesh(new THREE.SphereGeometry(0.028, 8, 8), white, e, [0.03, 0.035, 0.07]);
    return e;
  });
  const brows = [-0.22, 0.22].map((x) => {
    const b = mesh(new THREE.CapsuleGeometry(0.025, 0.14, 4, 8), mat(0x6b3e26), head, [x, 0.28, 0.6]);
    b.rotation.z = Math.PI / 2;
    return b;
  });
  const cheekMat = new THREE.MeshStandardMaterial({ color: 0xff7f8a, transparent: true, opacity: 0.5, roughness: 0.8 });
  for (const x of [-0.38, 0.38]) {
    const c = mesh(new THREE.SphereGeometry(0.11, 16, 12), cheekMat, head, [x, -0.1, 0.5]);
    c.scale.z = 0.3;
    c.castShadow = false;
  }
  const smile = mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 24, Math.PI), black, head, [0, -0.2, 0.62]);
  smile.rotation.z = Math.PI;
  const mouth = mesh(new THREE.SphereGeometry(0.14, 24, 16), mat(0x7a1f2b, 0.4), head, [0, -0.25, 0.58]);
  mouth.scale.set(1, 0.05, 0.4);
  mouth.visible = false;
  const arms = [-1, 1].map((s) => {
    const p = new THREE.Group();
    p.position.set(0.5 * s, 0.85, 0.05);
    kid.add(p);
    mesh(new THREE.CapsuleGeometry(0.12, 0.42, 6, 12), skinMat, p, [0, -0.3, 0]);
    p.rotation.set(-1.05, 0, 0.25 * s);
    return p;
  });
  const feet = [-0.22, 0.22].map((x) => mesh(new THREE.SphereGeometry(0.16, 16, 12), onesie, kid, [x, -0.25, 0.6]));

  // mood accessories: cowboy hat, monocle, nightcap
  const acc: Record<Mood, THREE.Group> = { adventurous: new THREE.Group(), picky: new THREE.Group(), hangry: new THREE.Group(), sleepy: new THREE.Group() };
  Object.values(acc).forEach((g) => head.add(g));
  // head radius 0.66; at the brim height (0.4) the head is 0.52 wide, so the crown starts wider than that
  mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.05, 40), mat(0x8b5a2b), acc.adventurous, [0, 0.4, 0]);
  mesh(new THREE.CylinderGeometry(0.46, 0.56, 0.52, 32), mat(0x8b5a2b), acc.adventurous, [0, 0.67, 0]);
  mesh(new THREE.CylinderGeometry(0.565, 0.565, 0.09, 32), mat(0xe63b2e), acc.adventurous, [0, 0.48, 0]);
  acc.adventurous.rotation.z = 0.08;
  // monocle: ring and lens tilted to sit flush on the face over the right eye
  const gold = new THREE.MeshStandardMaterial({ color: 0xf7c948, roughness: 0.25, metalness: 0.6 });
  const monocle = new THREE.Group();
  monocle.position.set(0.22, 0.1, 0.63);
  monocle.rotation.set(-0.15, 0.34, 0);
  acc.picky.add(monocle);
  mesh(new THREE.TorusGeometry(0.14, 0.022, 12, 40), gold, monocle);
  const lens = mesh(new THREE.CircleGeometry(0.135, 32), new THREE.MeshStandardMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.22, roughness: 0.05 }), monocle, [0, 0, -0.005]);
  lens.castShadow = false;
  // cord from the ring's lower edge, hugging the cheek, dropping below the chin
  const cord = new THREE.CatmullRomCurve3([
    [0.33, 0.01, 0.6], [0.42, -0.16, 0.53], [0.44, -0.36, 0.43], [0.36, -0.56, 0.33], [0.24, -0.72, 0.3],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  mesh(new THREE.TubeGeometry(cord, 40, 0.009, 6), gold, acc.picky);
  const cap = new THREE.Group();
  cap.position.set(0, 0.42, 0);
  cap.rotation.z = -0.15;
  acc.sleepy.add(cap);
  mesh(new THREE.ConeGeometry(0.56, 1.1, 32), mat(0x1e6fd9), cap, [0, 0.55, 0]);
  mesh(new THREE.TorusGeometry(0.56, 0.08, 12, 40), mat(0xffffff, 0.9), cap).rotation.x = Math.PI / 2;
  mesh(new THREE.SphereGeometry(0.13, 16, 12), mat(0xffffff, 0.9), cap, [0, 1.12, 0]);

  // ---------- food + particles ----------
  const texCache: Record<string, THREE.CanvasTexture> = {};
  function emojiTex(e: string) {
    if (texCache[e]) return texCache[e];
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    g.font = "200px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(e, 128, 140);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return (texCache[e] = t);
  }
  const foodSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex("🍲") }));
  foodSprite.scale.set(0.6, 0.6, 1);
  foodSprite.visible = false;
  scene.add(foodSprite);
  const FOOD_HOME = new THREE.Vector3(0, 2.3, 1.1);

  type Part = { s: THREE.Sprite; v: THREE.Vector3; life: number; max: number; grav: number };
  const parts: Part[] = [];
  function puff(emoji: string, pos: THREE.Vector3, { vel = [0, 1, 0], life = 1.2, size = 0.35, grav = 0 }: { vel?: number[]; life?: number; size?: number; grav?: number } = {}) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(emoji), transparent: true }));
    s.position.copy(pos);
    s.scale.setScalar(size);
    scene.add(s);
    parts.push({ s, v: new THREE.Vector3(vel[0], vel[1], vel[2]), life, max: life, grav });
  }

  // ---------- expressions ----------
  const skinTarget = new THREE.Color(0xf6c9a5);
  function setBrows(tilt = 0, lift = 0) {
    brows[0].rotation.z = Math.PI / 2 + tilt;
    brows[1].rotation.z = Math.PI / 2 - tilt;
    brows.forEach((b) => (b.position.y = 0.28 + lift));
  }
  function setEyes(open = 1) { eyes.forEach((e) => (e.scale.y = Math.max(0.08, open))); }
  function setMouth(mode: "smile" | "frown" | "flat" | "open", amt = 1) {
    smile.visible = mode !== "open";
    mouth.visible = mode === "open";
    if (mode === "smile") { smile.rotation.z = Math.PI; smile.scale.set(amt, amt, 1); smile.position.y = -0.2; }
    if (mode === "frown") { smile.rotation.z = 0; smile.scale.set(amt * 0.8, amt * 0.6, 1); smile.position.y = -0.3; }
    if (mode === "flat") { smile.rotation.z = Math.PI; smile.scale.set(0.8, 0.15, 1); smile.position.y = -0.24; }
    if (mode === "open") mouth.scale.set(1, 0.05 + amt * 0.9, 0.4);
  }
  function applyMood() {
    (Object.keys(acc) as Mood[]).forEach((k) => (acc[k].visible = k === mood));
    curl.visible = mood !== "adventurous" && mood !== "sleepy";
    skinTarget.set(mood === "hangry" ? 0xf08a7a : 0xf6c9a5);
    if (mood === "adventurous") { setBrows(0.05, 0.06); setEyes(1.1); setMouth("smile", 1.2); }
    if (mood === "picky") { setBrows(-0.1, 0); brows[1].position.y = 0.34; setEyes(0.75); setMouth("flat"); }
    if (mood === "hangry") { setBrows(-0.45, -0.03); setEyes(0.9); setMouth("frown", 1); }
    if (mood === "sleepy") { setBrows(0.2, -0.02); setEyes(0.25); setMouth("flat"); }
  }
  // mood face, then a live reaction to whatever is typed so far
  function expression() {
    if (busy) return;
    applyMood();
    if (isLoved(food)) { setBrows(0.25, 0.06); setMouth("smile", 1.2); }
    else if (isFeared(food)) { setBrows(-0.35, 0.05); setMouth("frown", 1); }
  }

  // ---------- tweening ----------
  type Tween = { t0: number; ms: number; fn: (t: number) => void; e: (t: number) => number; res: () => void };
  const tweens = new Set<Tween>();
  const tween = (ms: number, fn: (t: number) => void, e = ease.io) => new Promise<void>((res) => tweens.add({ t0: performance.now(), ms, fn, e, res }));

  // ---------- speech bubble ----------
  let sayTimer: ReturnType<typeof setTimeout> | undefined;
  function say(text: string, ms = 1800) {
    bubble.textContent = text;
    bubble.classList.add("show");
    placeBubble();
    clearTimeout(sayTimer);
    if (ms) sayTimer = setTimeout(() => bubble.classList.remove("show"), ms);
  }
  function placeBubble() {
    const p = new THREE.Vector3();
    head.getWorldPosition(p);
    p.x += 0.45;
    p.y += 0.75;
    p.project(camera);
    bubble.style.left = Math.min(((p.x + 1) / 2) * stage.clientWidth, stage.clientWidth - bubble.offsetWidth - 8) + "px";
    bubble.style.top = ((-p.y + 1) / 2) * stage.clientHeight + "px";
  }
  const headWorld = (o: [number, number, number] = [0, -0.25, 0.6]) => head.localToWorld(new THREE.Vector3(...o));

  // ---------- splat on the glass ----------
  let splatDone: Promise<void> | null = null;
  let splatResolve: (() => void) | null = null;
  let splatTimer: ReturnType<typeof setTimeout> | undefined;
  function splat(look: FoodLook) {
    sfx.splat();
    stage.classList.remove("shake");
    void stage.offsetWidth;
    stage.classList.add("shake");
    vibrate(120);
    const W = window.innerWidth, H = window.innerHeight, cx = W * (0.4 + Math.random() * 0.2), cy = H * 0.3;
    const blob = (x: number, y: number, r: number, n = 14) => {
      let d = "";
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2, rr = r * (0.7 + Math.random() * 0.5);
        d += (i ? "L" : "M") + (x + Math.cos(a) * rr).toFixed(1) + "," + (y + Math.sin(a) * rr).toFixed(1);
      }
      return d + "Z";
    };
    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs><filter id="goo"><feGaussianBlur stdDeviation="6"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 22 -9"/></filter></defs><g filter="url(#goo)" fill="${look.color}">`;
    svg += `<path d="${blob(cx, cy, 110, 18)}"/>`;
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 120;
      svg += `<circle cx="${cx + Math.cos(a) * d}" cy="${cy + Math.sin(a) * d}" r="${6 + Math.random() * 18}"/>`;
    }
    for (let i = 0; i < 6; i++) {
      const x = cx - 80 + Math.random() * 160, w = 10 + Math.random() * 16, h = 120 + Math.random() * (H * 0.5);
      svg += `<rect class="drip" style="transform-origin:${x}px ${cy}px;animation-delay:${Math.random() * 0.4}s" x="${x - w / 2}" y="${cy}" width="${w}" height="${h}" rx="${w / 2}"/>`;
    }
    svg += `</g><g fill="#fff" opacity=".35"><ellipse cx="${cx - 40}" cy="${cy - 45}" rx="26" ry="12" transform="rotate(-25 ${cx - 40} ${cy - 45})"/></g>`;
    for (let i = 0; i < 4; i++) svg += `<text x="${cx - 70 + Math.random() * 140}" y="${cy - 40 + Math.random() * 90}" font-size="${28 + Math.random() * 18}" transform="rotate(${Math.random() * 360} ${cx} ${cy})">${look.emoji}</text>`;
    svg += `</svg><div class="hint">Tap to wipe the screen</div>`;
    splatEl.innerHTML = svg;
    splatEl.className = "splat on";
    splatDone = new Promise((res) => { splatResolve = res; splatTimer = setTimeout(wipeSplat, 3200); });
  }
  function wipeSplat() {
    clearTimeout(splatTimer);
    if (!splatEl.classList.contains("on")) return;
    splatEl.className = "splat on wipe";
    sfx.whoosh();
    setTimeout(() => (splatEl.className = "splat"), 650);
    splatResolve?.();
  }
  splatEl.addEventListener("click", wipeSplat);

  // ---------- reactions ----------
  async function dropFood(look: FoodLook) {
    foodSprite.material.map = emojiTex(look.emoji);
    foodSprite.material.rotation = 0;
    foodSprite.visible = true;
    foodSprite.scale.set(0.6, 0.6, 1);
    foodSprite.position.set(0, 6, FOOD_HOME.z);
    await tween(750, (t) => (foodSprite.position.y = lerp(6, FOOD_HOME.y, t)), ease.bounce);
    sfx.drop();
  }
  async function consider() {
    sfx.hmm();
    await tween(500, (t) => { head.rotation.x = lerp(0, 0.35, t); head.rotation.z = lerp(0, 0.18, t); eyes.forEach((e) => (e.position.y = lerp(0.1, 0.02, t))); });
    await wait(450);
    await tween(250, (t) => (head.rotation.z = lerp(0.18, -0.18, t)));
    await wait(350);
  }
  async function straighten(ms = 350) {
    const rx = head.rotation.x, rz = head.rotation.z, ry = head.rotation.y;
    await tween(ms, (t) => {
      head.rotation.x = lerp(rx, 0, t); head.rotation.z = lerp(rz, 0, t); head.rotation.y = lerp(ry, 0, t);
      eyes.forEach((e) => (e.position.y = lerp(e.position.y, 0.1, t)));
    });
  }
  async function gobble(r: Prediction, dance: boolean) {
    setBrows(0.25, 0.06); setEyes(1.15); setMouth("open", 0.1);
    await straighten(250);
    await tween(250, (t) => setMouth("open", t));
    const from = foodSprite.position.clone(), to = headWorld([0, -0.25, 0.75]);
    await tween(420, (t) => { foodSprite.position.lerpVectors(from, to, t); foodSprite.position.y += Math.sin(t * Math.PI) * 0.8; foodSprite.scale.setScalar(lerp(0.6, 0.25, t)); }, ease.in);
    foodSprite.visible = false;
    for (let i = 0; i < 5; i++) {
      sfx.chomp();
      await tween(110, (t) => setMouth("open", 1 - Math.sin(t * Math.PI) * 0.9));
      head.rotation.x = (i % 2) * 0.08;
    }
    setMouth("smile", 1.4); sfx.tada(); say(r.says, 2200);
    for (let i = 0; i < 8; i++) puff("💖", headWorld([0, 0.5, 0.2]), { vel: [(Math.random() - 0.5) * 2, 1.5 + Math.random(), 0.5], life: 1.4, size: 0.3 });
    if (dance) await tween(1600, (t) => { kid.rotation.z = Math.sin(t * Math.PI * 6) * 0.12; arms.forEach((a, i) => (a.rotation.x = -1.05 - Math.abs(Math.sin(t * Math.PI * 6 + i)) * 1.6)); }, ease.lin);
    else await tween(1400, (t) => (head.rotation.z = Math.sin(t * Math.PI * 4) * 0.12), ease.lin);
  }
  const REACT: Record<Reaction, (r: Prediction) => Promise<void>> = {
    gobble: (r) => gobble(r, false),
    dance: (r) => gobble(r, true),
    async suspicious(r) {
      setBrows(-0.15, 0); brows[1].position.y = 0.36; setEyes(0.5); setMouth("flat");
      await tween(500, (t) => { head.position.z = lerp(0.05, 0.3, t); head.rotation.x = lerp(head.rotation.x, 0.45, t); });
      puff("❓", headWorld([0.5, 0.7, 0]), { vel: [0.2, 0.6, 0], life: 1.6, size: 0.45 });
      await tween(900, (t) => (foodSprite.material.rotation = Math.sin(t * Math.PI * 6) * 0.3), ease.lin);
      arms[1].rotation.x = -1.5;
      await tween(300, (t) => (foodSprite.position.x = lerp(0, 0.15, t)));
      say(r.says, 2000);
      await tween(1200, (t) => (head.rotation.y = Math.sin(t * Math.PI * 3) * 0.3), ease.lin);
      await tween(300, (t) => (head.position.z = lerp(0.3, 0.05, t)));
    },
    async negotiate(r) {
      setBrows(0.1, 0.05); setEyes(1); setMouth("smile", 0.7);
      await straighten();
      puff("🍪", headWorld([0.7, 0.8, 0]), { vel: [0.1, 0.4, 0], life: 2.2, size: 0.5 });
      say(r.says, 2400);
      await tween(1200, (t) => { arms[1].rotation.x = -1.05 - Math.sin(t * Math.PI) * 0.9; arms[1].rotation.z = lerp(0.25, -0.3, t); head.rotation.z = Math.sin(t * Math.PI * 2) * 0.15; });
      await wait(700);
    },
    async throw(r) {
      setBrows(-0.45, -0.03); setEyes(1); setMouth("frown", 1);
      await straighten(250);
      await tween(350, (t) => { arms[1].rotation.x = lerp(-1.05, 0.9, t); head.rotation.y = lerp(0, -0.3, t); });
      await wait(150);
      sfx.whoosh();
      const from = foodSprite.position.clone(), to = camera.position.clone().add(new THREE.Vector3(0.1, -0.2, -0.6));
      const swing = tween(160, (t) => { arms[1].rotation.x = lerp(0.9, -2.4, t); head.rotation.y = lerp(-0.3, 0.2, t); }, ease.in);
      await tween(560, (t) => {
        foodSprite.position.lerpVectors(from, to, t);
        foodSprite.position.y += Math.sin(t * Math.PI) * 1.4;
        foodSprite.material.rotation = t * 9;
        foodSprite.scale.setScalar(lerp(0.6, 2.4, t));
      }, ease.in);
      await swing;
      foodSprite.visible = false;
      splat(r.look);
      setMouth("open", 0.7); say(r.says, 2200);
      await tween(1400, (t) => { head.rotation.x = Math.sin(t * Math.PI * 8) * 0.06; arms[1].rotation.x = lerp(-2.4, -1.05, Math.min(1, t * 2)); }, ease.lin);
      setMouth("smile", 1.3);
      await wait(900);
    },
    async cry(r) {
      setBrows(0.4, 0.05); setEyes(0.1); setMouth("open", 1);
      await straighten(250);
      sfx.wah(); say(r.says, 2400);
      const tick = setInterval(() => eyes.forEach((e) => puff("💧", e.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, -0.05, 0.2)), { vel: [e.position.x * 6, 0.8, 1], life: 1, size: 0.18, grav: 5 })), 120);
      await tween(2200, (t) => (head.rotation.y = Math.sin(t * Math.PI * 8) * 0.25), ease.lin);
      clearInterval(tick);
      const from = foodSprite.position.clone();
      await tween(700, (t) => { foodSprite.position.x = lerp(from.x, 1.6, t); foodSprite.position.y = t < 0.5 ? from.y : lerp(from.y, 0.3, (t - 0.5) * 2); foodSprite.material.rotation = t * 4; }, ease.in);
      sfx.drop();
    },
    async gag(r) {
      setBrows(0.3, 0.06); setEyes(0.3); setMouth("open", 0.5);
      skinTarget.set(0xb8d99a);
      await tween(400, (t) => { head.rotation.x = lerp(head.rotation.x, -0.35, t); head.position.z = lerp(0.05, -0.2, t); });
      say(r.says, 2200);
      for (let i = 0; i < 3; i++) await tween(220, (t) => (head.position.y = 1.42 + Math.sin(t * Math.PI) * 0.08));
      arms[0].rotation.x = -1.6;
      const from = foodSprite.position.clone();
      await tween(700, (t) => { foodSprite.position.x = lerp(from.x, -1.7, t); foodSprite.position.y = t < 0.5 ? from.y : lerp(from.y, 0.3, (t - 0.5) * 2); }, ease.in);
      sfx.drop();
      await tween(400, (t) => { head.rotation.x = lerp(-0.35, 0, t); head.position.z = lerp(-0.2, 0.05, t); });
    },
    async sleep(r) {
      setEyes(0.08); setMouth("flat"); acc.sleepy.visible = true; curl.visible = false;
      await tween(1600, (t) => { head.rotation.x = lerp(head.rotation.x, 0.9, t); head.position.z = lerp(0.05, 0.55, t); head.position.y = lerp(1.42, 1.1, t); }, ease.in);
      sfx.splat();
      for (let i = 0; i < 4; i++) setTimeout(() => puff("💤", headWorld([0.4, 0.5, 0]), { vel: [0.4, 0.7, 0], life: 1.8, size: 0.35 }), i * 400);
      say(r.says, 2200);
      await wait(1800);
    },
  };

  // ---------- idle + render loop ----------
  const pointer = new THREE.Vector2();
  const onPointerMove = (e: PointerEvent) => { pointer.x = (e.clientX / window.innerWidth) * 2 - 1; pointer.y = -(e.clientY / window.innerHeight) * 2 + 1; };
  window.addEventListener("pointermove", onPointerMove);
  const ray = new THREE.Raycaster();
  renderer.domElement.addEventListener("pointerdown", (e) => {
    if (busy) return;
    const r = renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    if (ray.intersectObject(kid, true).length) {
      say(["hee hee!", "BOOP", "again!", "no tickle!"][Math.floor(Math.random() * 4)], 1000);
      sfx.giggle();
      void tween(500, (t) => (head.rotation.z = Math.sin(t * Math.PI * 4) * 0.15 * (1 - t)), ease.lin);
    }
  });

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 40 : 34;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  let last = performance.now(), nextBlink = 2000, raf = 0;
  function loop(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (const tw of tweens) {
      const t = Math.min(1, (now - tw.t0) / tw.ms);
      tw.fn(tw.e(t));
      if (t >= 1) { tweens.delete(tw); tw.res(); }
    }
    body.scale.y = 1 + Math.sin(now / 600) * 0.02;
    feet.forEach((f, i) => (f.position.z = 0.6 + Math.sin(now / 250 + i * Math.PI) * (busy ? 0.02 : 0.08)));
    if (!busy) {
      head.rotation.y = lerp(head.rotation.y, pointer.x * 0.35, 0.08);
      head.rotation.x = lerp(head.rotation.x, -pointer.y * 0.15, 0.08);
    }
    skinMat.color.lerp(skinTarget, 0.08);
    if (mood === "hangry" && !busy && Math.random() < 0.06) {
      const s = Math.random() < 0.5 ? -1 : 1;
      puff("💨", head.localToWorld(new THREE.Vector3(0.7 * s, 0.1, 0)), { vel: [s * 0.8, 0.9, 0], life: 0.8, size: 0.25 });
    }
    if (mood === "sleepy" && !busy && Math.random() < 0.012) puff("💤", headWorld([0.5, 0.6, 0]), { vel: [0.3, 0.5, 0], life: 2, size: 0.3 });
    if (now > nextBlink && !busy && mood !== "sleepy") {
      const o = eyes[0].scale.y;
      eyes.forEach((e) => (e.scale.y = 0.08));
      setTimeout(() => eyes.forEach((e) => (e.scale.y = o)), 120);
      nextBlink = now + 2200 + Math.random() * 2500;
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt;
      p.v.y -= p.grav * dt;
      p.s.position.addScaledVector(p.v, dt);
      p.s.material.opacity = Math.min(1, (p.life / p.max) * 2);
      if (p.life <= 0) { scene.remove(p.s); p.s.material.dispose(); parts.splice(i, 1); }
    }
    if (bubble.classList.contains("show")) placeBubble();
    renderer.render(scene, camera);
    if (!disposed) raf = requestAnimationFrame(loop);
  }
  applyMood();
  raf = requestAnimationFrame(loop);

  return {
    setMood(m) { mood = m; expression(); },
    setMeal(m) {
      const L = MEAL_LIGHT[m];
      hemi.color.set(L.hemi); hemi.intensity = L.hi;
      sun.color.set(L.sun); sun.intensity = L.si;
      wallMat.color.set(L.wall); lamp.intensity = L.lamp;
    },
    setPlate(color) { plateMat.color.set(color); },
    typing(f) { food = f; expression(); },
    async serve(r) {
      busy = true;
      applyMood();
      await dropFood(r.look);
      await consider();
      await REACT[r.reaction](r);
      if (splatDone) { await splatDone; splatDone = null; }
    },
    reset() {
      splatEl.className = "splat";
      bubble.classList.remove("show");
      foodSprite.visible = false;
      kid.rotation.set(0, 0, 0);
      head.position.set(0, 1.42, 0.05);
      head.rotation.set(0, 0, 0);
      arms.forEach((a, i) => a.rotation.set(-1.05, 0, 0.25 * (i ? 1 : -1)));
      busy = false;
      food = "";
      applyMood();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      clearTimeout(splatTimer);
      clearTimeout(sayTimer);
      window.removeEventListener("pointermove", onPointerMove);
      splatEl.removeEventListener("click", wipeSplat);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose(); }
      });
      Object.values(texCache).forEach((t) => t.dispose());
      tileTex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
