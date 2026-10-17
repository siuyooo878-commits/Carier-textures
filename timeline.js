// timeline.js — deterministic, side-effect-free state model for
// "How Does an Aircraft Carrier Launch a Jet in Seconds?"
// Every value returned here is a pure function of the timeline time t (seconds).
// Lane coordinates: s = along the catapult lane toward the bow (m), u = to starboard (m),
// h = height above the flight deck (m).  Origin = nose-wheel contact point at the launch start.

export const DURATION = 82;

export const SCENES = [
  { id: 1, t0: 0, t1: 8, title: 'A RUNWAY THAT IS TOO SHORT',
    text: 'An F/A-18 needs a lot of speed to take off. But an aircraft carrier gives it only a few hundred feet of runway. So how does it get airborne in seconds?' },
  { id: 2, t0: 8, t1: 16, title: 'THE AIRCRAFT CONNECTS TO THE CATAPULT',
    text: 'First, the jet rolls into position. Its nose-wheel launch bar locks onto a shuttle hidden in the catapult track.' },
  { id: 3, t0: 16, t1: 24, title: 'RESTRAIN IT BEFORE FIRING',
    text: 'A holdback attachment keeps the aircraft from moving while its engines build power. It must release when the catapult launches.' },
  { id: 4, t0: 24, t1: 32, title: 'RAISE THE JET-BLAST DEFLECTOR',
    text: 'Behind the jet, a heavy jet-blast deflector rises. It redirects the engine exhaust away from the deck crew and equipment.' },
  { id: 5, t0: 32, t1: 40, title: 'PREPARE THE LAUNCH',
    text: "The jet increases power, and the launch system is prepared. But the aircraft's engines alone aren't doing the whole job." },
  { id: 6, t0: 40, t1: 49, title: 'REVEAL THE HIDDEN STEAM CATAPULT',
    text: 'Below the deck, high-pressure steam enters the catapult cylinders. The pressure drives pistons connected to the shuttle above.' },
  { id: 7, t0: 49, t1: 57, title: 'THE LAUNCH BEGINS',
    text: 'When the launch is authorised, the catapult releases its stored energy. The shuttle surges forward, and the nose gear transmits that force to the jet.' },
  { id: 8, t0: 57, t1: 65, title: 'HUNDREDS OF FEET IN SECONDS',
    text: 'Within seconds, the catapult has accelerated the aircraft across the deck to the required launch speed. Then the jet separates and flies away.' },
  { id: 9, t0: 65, t1: 73, title: 'THE SHUTTLE STOPS AND RESETS',
    text: 'But the shuttle is still racing along the track. A water-brake system absorbs its energy, slows it down, and helps prepare the catapult for the next launch.' },
  { id: 10, t0: 73, t1: 82, title: 'THE COMPLETE LAUNCH SYSTEM',
    text: "The steam catapult supplies the extra acceleration, the shuttle transfers it through the launch bar, and the jet's own engines provide thrust. That's how a fighter takes off from a ship in seconds." },
];
export const END_CAPTION = 'STEAM. SHUTTLE. THRUST. LIFTOFF.';
export const END_CAPTION_T = 79.2;

// ---------------------------------------------------------------- math helpers
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, x) => a + (b - a) * x;
export const ss = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const win = (t, a, b) => ss((t - a) / (b - a));           // 0->1 between a and b
export const pulse = (t, a, b, c, d) => win(t, a, b) * (1 - win(t, c, d));
export function hash1(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
export function noise1(x) { const i = Math.floor(x), f = x - i; return lerp(hash1(i), hash1(i + 1), f * f * (3 - 2 * f)) * 2 - 1; }

// ---------------------------------------------------------------- geometry constants
export const C = {
  IN: 0.0254,                         // carrier model units are inches
  deckY_in: 802.2958,                 // measured flight-deck height in the supplied carrier model
  // launch lane (carrier-model coordinates, inches) — derived from the dashed catapult marking
  // on the starboard bow, offset 2.0 m starboard so the jet's left main gear clears the raised deck box.
  lane: { x0_in: 8700, z0_in: 9.4, yawDeg: -2.875 },
  L: 80,              // power-stroke length (m): schematic, not a claim about a specific catapult
  SH_OFF: 1.95,       // tow point of the shuttle ahead of the nose-wheel contact patch
  PIS_OFF: 0.4,       // piston head sits this far behind the shuttle neck
  SPEAR: 6.5,         // water-brake spear (plunger) length ahead of the piston head
  BRAKE: 11,          // water-brake stopping distance
  JBD_HINGE: -19.0,   // jet-blast-deflector hinge line (m behind the nose-wheel start point)
  JBD_LEN: 5.2, JBD_W: 6.0, JBD_MAX: 50 * Math.PI / 180,
  HB_DECK: -2.05,     // deck holdback fitting
  NOSE_TIP: 5.54, TAIL: -12.75, NOZZLE_S: -11.93, NOZZLE_U: 0.43, NOZZLE_H: 2.38,
  GROUND_PITCH: -1.445 * Math.PI / 180,
  SHIP_SPEED: 15.4,   // m/s (~30 kt) — ocean pattern scrolls past the fixed hull
  VEND_KT: 0,
};
C.TREAL = 2.4;                        // real duration of the stroke (s)
C.VEND = 2 * C.L / C.TREAL;           // m/s at end of stroke (~133 kt for L=80)
C.VEND_KT = C.VEND * 1.94384;

// ---------------------------------------------------------------- key times (video seconds)
export const K = {
  taxi0: 8.0, taxi1: 13.2, taxiFrom: -14,
  bar0: 12.2, bar1: 13.6, latch0: 13.9, latch1: 14.6,
  hb0: 16.2, hb1: 18.0,
  spool0: 17.5, spool1: 23.5, power2_0: 32.5, power2_1: 38.0,
  jbd0: 24.6, jbd1: 29.8, jbdDown0: 74.0, jbdDown1: 78.5,
  steam0: 41.0, steam1: 47.4,
  cutA0: 40.2, cutA1: 41.8, cutA2: 48.0, cutA3: 49.4,
  ab0: 48.6, ab1: 49.3,
  tension0: 49.6,
  rel: 50.4,                      // holdback releases, shuttle starts to accelerate
  D: 8.0,                         // video seconds for the power stroke (real ~2.4 s => slow motion)
  sep: 58.4,                      // end of stroke: launch bar releases, jet separates from shuttle
  replay0: 65.6, replay1: 69.6,   // slow-motion replay of the water-brake stop
  ret0: 69.8, ret1: 73.6,         // shuttle return stroke
  cutB0: 65.2, cutB1: 66.6, cutB2: 72.0, cutB3: 73.4,
  abOff0: 66.4, abOff1: 67.9,
};
export const RATE0 = C.TREAL / K.D;   // slow-motion factor during the stroke (0.3)
const RATE1 = 0.55, RATE_W = 6.0;
const BRAKE_T = 2 * C.BRAKE / (2 * C.L / K.D);   // video-time duration of the water-brake stop

// effective flight time after separation (integral of the slow-motion rate)
export function flightTime(t) {
  const dt = Math.max(0, t - K.sep);
  const x = dt / RATE_W;
  const extra = x <= 1 ? RATE_W * (x * x * x - x * x * x * x / 2) : RATE_W * 0.5 + (dt - RATE_W);
  return RATE0 * dt + (RATE1 - RATE0) * extra;
}

// ---------------------------------------------------------------- flight path table (deterministic)
const FT = (() => {
  const step = 0.02, N = 3200;
  const S = new Float64Array(N + 1), U = new Float64Array(N + 1), H = new Float64Array(N + 1);
  const PI = new Float64Array(N + 1), YA = new Float64Array(N + 1), RO = new Float64Array(N + 1);
  let s = C.L, u = 0, h = 0;
  for (let i = 0; i <= N; i++) {
    const e = i * step;
    const gam = 11.5 * Math.PI / 180 * ss((e - 0.35) / 3.5);
    const del = -7 * Math.PI / 180 * ss((e - 4) / 8);
    const v = C.VEND + 2.5 * e;
    S[i] = s; U[i] = u; H[i] = h;
    PI[i] = gam + 3.0 * Math.PI / 180 * ss((e - 0.2) / 1.2) + C.GROUND_PITCH * (1 - ss((e - 0.1) / 1.0));
    YA[i] = del;
    RO[i] = -9 * Math.PI / 180 * Math.sin(Math.PI * clamp((e - 4) / 10)) ;
    s += v * Math.cos(gam) * Math.cos(del) * step;
    u += v * Math.cos(gam) * Math.sin(del) * step;
    h += v * Math.sin(gam) * step;
  }
  return { step, N, S, U, H, PI, YA, RO };
})();
function ft(e) {
  const f = clamp(e / FT.step, 0, FT.N - 1), i = Math.floor(f), x = f - i;
  const g = (a) => lerp(a[i], a[i + 1], x);
  return { s: g(FT.S), u: g(FT.U), h: g(FT.H), pitch: g(FT.PI), yaw: g(FT.YA), roll: g(FT.RO) };
}

// ---------------------------------------------------------------- shuttle / jet kinematics
// Shuttle tow-point station vs. time (before replay mapping).
function shuttleTrue(t) {
  const v0 = 2 * C.L / K.D;                    // video-time speed at end of stroke
  if (t < K.rel) return { s: C.SH_OFF, v: 0, mode: t < K.tension0 ? 'park' : 'loaded' };
  if (t < K.sep) {
    const tau = (t - K.rel) / K.D;
    return { s: C.SH_OFF + C.L * tau * tau, v: 2 * C.L * tau / K.D, mode: 'power' };
  }
  const dt = t - K.sep;
  const s0 = C.SH_OFF + C.L;
  if (dt < BRAKE_T) {
    const a = v0 / BRAKE_T;
    return { s: s0 + v0 * dt - 0.5 * a * dt * dt, v: v0 - a * dt, mode: 'brake' };
  }
  return { s: s0 + C.BRAKE, v: 0, mode: 'stopped' };
}
export function replayMap(t) {            // maps scene-9 time onto the brake stop at 0.5x speed
  if (t < K.replay0 || t > K.replay1) return t;
  return (K.sep - 0.7) + (t - K.replay0) * 0.5;
}
export function shuttleAt(t) {
  const inReplay = t >= K.replay0 && t <= K.replay1;
  if (t >= K.ret0) {
    const x = win(t, K.ret0, K.ret1);
    const sFrom = C.SH_OFF + C.L + C.BRAKE;
    return { s: lerp(sFrom, C.SH_OFF, x), v: 0, mode: x >= 1 ? 'ready' : 'return', replay: false };
  }
  const r = shuttleTrue(inReplay ? replayMap(t) : t);
  r.replay = inReplay;
  return r;
}

export function jetAt(t) {
  const o = { s: 0, u: 0, h: 0, pitch: C.GROUND_PITCH, yaw: 0, roll: 0, gearDown: true, onDeck: true, squat: 0, v: 0, e: 0 };
  if (t < K.taxi0) { o.s = K.taxiFrom; return o; }
  if (t < K.taxi1) { const x = win(t, K.taxi0, K.taxi1); o.s = K.taxiFrom * (1 - x); o.v = 2.5 * (1 - x) * (x < 1 ? 1 : 0); return o; }
  if (t < K.rel) {
    o.s = 0;
    o.squat = 0.07 * win(t, K.tension0, K.rel) * pulse(t, K.tension0, K.rel - 0.05, K.rel - 0.02, K.rel);
    o.squat = 0.07 * win(t, K.tension0, K.rel - 0.05);
    return o;
  }
  if (t < K.sep) {
    const tau = (t - K.rel) / K.D;
    o.s = C.L * tau * tau; o.v = C.VEND * tau;
    o.squat = 0.07 * (1 - win(t, K.rel, K.rel + 0.5)) * -0.4;   // slight strut extension after release
    return o;
  }
  const e = flightTime(t);
  const f = ft(e);
  o.s = f.s; o.u = f.u; o.h = f.h; o.pitch = f.pitch; o.yaw = f.yaw; o.roll = f.roll;
  o.v = C.VEND + 2.5 * e; o.e = e; o.onDeck = f.s < 103 && f.h < 0.05;
  o.gearDown = e < 3.0;
  return o;
}

// ---------------------------------------------------------------- subsystem states
export function engineAt(t) {
  const abRamp = win(t, K.ab0, K.ab1) * (1 - win(t, K.abOff0, K.abOff1));
  let pwr = 0.30 + 0.45 * win(t, K.spool0, K.spool1) + 0.17 * win(t, K.power2_0, K.power2_1) + 0.08 * abRamp;
  if (t > K.abOff0) pwr -= 0.06 * win(t, K.abOff0, K.abOff1);
  return { pwr, ab: abRamp };
}

export function steamAt(t) {
  let p = win(t, K.steam0, K.steam1);
  const tau = clamp((t - K.rel) / K.D);
  if (t >= K.rel) p *= 1 - 0.25 * tau;
  if (t >= K.sep) p *= 1 - win(t, K.sep, K.sep + 3.0);
  const flow = t < K.steam0 ? 0 : t < K.rel ? 0.25 + 0.35 * win(t, K.steam0, K.steam1) * (1 - win(t, K.steam1, K.steam1 + 1.5) * 0.7)
    : t < K.sep ? 1.0 : 0.6 * (1 - win(t, K.sep, K.sep + 2.5));
  return { p, flow };
}

export function barAt(t) {
  // deploy: 0 = stowed (raised against gear), 1 = lowered onto the shuttle
  let d = win(t, K.bar0, K.bar1);
  if (t >= K.sep) {
    d = 1 - 0.55 * win(t, K.sep + 0.1, K.sep + 0.9);
    if (t > K.sep + 2.0) d = 0.45 * (1 - win(t, K.sep + 2.0, K.sep + 4.5));
  }
  const latch = t < K.sep ? win(t, K.latch0, K.latch1) : 1 - win(t, K.sep, K.sep + 0.35);
  return { deploy: d, latch };
}

export function holdbackAt(t) {
  const install = win(t, K.hb0, K.hb1);
  const tension = win(t, K.tension0, K.rel);
  const sep = win(t, K.rel, K.rel + 0.7);
  return { install, tension, sep, broke: t >= K.rel ? 1 : 0 };
}

export function jbdAt(t) {
  const up = win(t, K.jbd0, K.jbd1);
  const down = win(t, K.jbdDown0, K.jbdDown1);
  return { angle: C.JBD_MAX * up * (1 - down) };
}

export function pistonAt(t) {
  const sh = shuttleAt(t);
  const head = sh.s - C.PIS_OFF;
  return { head, tip: head + C.SPEAR, neck: sh.s, v: sh.v };
}

export function cutAt(t) {
  const A = pulse(t, K.cutA0, K.cutA1, K.cutA2, K.cutA3);
  const B = pulse(t, K.cutB0, K.cutB1, K.cutB2, K.cutB3);
  return {
    A, B, open: Math.max(A, B),
    s0: A >= B ? 0.55 : C.L + 2.0,
    s1: A >= B ? 30 : C.L + C.BRAKE + 9.5,
    halfW: 1.45 * Math.max(A, B),
  };
}

export function brakeAt(t) {
  const sh = shuttleAt(t);
  const tip = sh.s - C.PIS_OFF + C.SPEAR;
  const mouth = C.L + C.SH_OFF - C.PIS_OFF + C.SPEAR;
  const depth = clamp((tip - mouth) / C.BRAKE);
  return { depth, active: depth > 0 && depth < 0.999 && sh.mode !== 'return' };
}

export function realSpeedKt(t) {
  const j = jetAt(t);
  if (t >= K.rel && t < K.sep) return C.VEND * ((t - K.rel) / K.D) * 1.94384;
  if (t >= K.sep) return j.v * 1.94384;
  return 0;
}

export function sceneIndex(t) {
  for (let i = SCENES.length - 1; i >= 0; i--) if (t >= SCENES[i].t0) return i;
  return 0;
}

export function stateAt(t) {
  t = clamp(t, 0, DURATION);
  return {
    t, scene: sceneIndex(t),
    jet: jetAt(t), engine: engineAt(t), steam: steamAt(t), bar: barAt(t),
    holdback: holdbackAt(t), jbd: jbdAt(t), shuttle: shuttleAt(t), piston: pistonAt(t),
    cut: cutAt(t), brake: brakeAt(t), speedKt: realSpeedKt(t),
    waterPhase: t,                  // ocean is evaluated purely from t
  };
}

// ---------------------------------------------------------------- camera
// keyframes: p/l are offsets in lane coordinates [s,u,h]; pr/lr select the reference frame.
const KF = [
  // SCENE 1 — waterline approach, rise over the bow, run down the catapult lane toward the jet
  { t: 0.0, p: [158, -4, -16.0], pr: 'lane', l: [60, 0, 3], lr: 'lane', fov: 52 },
  { t: 3.2, p: [118, 1.5, -2.0], pr: 'lane', l: [40, 0, 2.2], lr: 'lane', fov: 50 },
  { t: 6.0, p: [58, 3.2, 3.2], pr: 'lane', l: [-8, 0, 1.8], lr: 'lane', fov: 46 },
  // SCENE 2 — roll into position, close to the nose gear and launch bar
  { t: 8.0, p: [30, 3.5, 2.8], pr: 'lane', l: [-6, 0, 1.6], lr: 'lane', fov: 44 },
  { t: 11.5, p: [9.5, 3.8, 1.6], pr: 'jet', l: [1.0, 0, 0.6], lr: 'jet', fov: 40 },
  { t: 14.5, p: [4.4, 2.4, 0.95], pr: 'jet', l: [1.0, 0, 0.42], lr: 'jet', fov: 36 },
  { t: 16.0, p: [3.9, 2.2, 0.85], pr: 'jet', l: [0.4, 0, 0.45], lr: 'jet', fov: 36 },
  // SCENE 3 — holdback bar and deck fitting
  { t: 20.0, p: [-0.4, 2.6, 0.95], pr: 'jet', l: [-1.0, 0, 0.45], lr: 'jet', fov: 36 },
  { t: 24.0, p: [-9.5, 5.6, 2.1], pr: 'jet', l: [-12.5, 0, 1.6], lr: 'jet', fov: 42 },
  // SCENE 4 — behind the jet: jet-blast deflector rising
  { t: 27.0, p: [-30, 9.5, 3.2], pr: 'lane', l: [-17, 0, 1.6], lr: 'lane', fov: 46 },
  { t: 31.0, p: [-26, 7.5, 2.8], pr: 'lane', l: [-16, 0, 1.8], lr: 'lane', fov: 46 },
  // SCENE 5 — from the engines forward to the nose gear
  { t: 34.0, p: [-14.5, 5.2, 1.9], pr: 'lane', l: [-12, 0, 1.4], lr: 'lane', fov: 44 },
  { t: 37.0, p: [-5.5, 4.4, 1.5], pr: 'lane', l: [-3, 0, 1.0], lr: 'lane', fov: 40 },
  { t: 40.0, p: [2.4, 3.6, 1.35], pr: 'lane', l: [1.9, 0, 0.35], lr: 'lane', fov: 38 },
  // SCENE 6 — under-deck cutaway
  { t: 42.5, p: [6.5, 5.0, 3.3], pr: 'lane', l: [5.0, 0, -0.9], lr: 'lane', fov: 42 },
  { t: 45.5, p: [11.5, 4.6, 4.3], pr: 'lane', l: [8.5, 0, -1.2], lr: 'lane', fov: 42 },
  { t: 48.2, p: [10.5, 5.6, 4.8], pr: 'lane', l: [5.0, 0, 0.0], lr: 'lane', fov: 42 },
  // SCENE 7 — launch: track alongside the nose-gear connection
  { t: 49.0, p: [6.0, 4.2, 1.5], pr: 'lane', l: [0.8, 0, 0.55], lr: 'lane', fov: 40 },
  { t: 53.0, p: [5.0, 4.6, 1.5], pr: 'jet', l: [0.8, 0, 0.55], lr: 'jet', fov: 42 },
  { t: 57.0, p: [5.6, 5.4, 1.9], pr: 'jet', l: [0.4, 0, 0.7], lr: 'jet', fov: 44 },
  // SCENE 8 — separation and flight
  { t: 59.2, p: [10.0, 6.4, 2.3], pr: 'jet', l: [-2.0, 0, 1.2], lr: 'jet', fov: 44 },
  { t: 62.0, p: [90, 11.5, 4.5], pr: 'lane', l: [20, 0, 1.0], lr: 'jet', fov: 40 },
  { t: 65.0, p: [88, 12.0, 6.5], pr: 'lane', l: [30, 0, 0.0], lr: 'jet', fov: 36 },
  // SCENE 9 — water brake and return stroke
  { t: 67.0, p: [L_END(-6), 5.2, 3.0], pr: 'lane', l: [L_END(2), 0, -1.2], lr: 'lane', fov: 40 },
  { t: 69.6, p: [L_END(-1), 4.4, 2.2], pr: 'lane', l: [L_END(4), 0, -1.0], lr: 'lane', fov: 38 },
  { t: 71.6, p: [60, 5.6, 3.6], pr: 'lane', l: [0, 0, 0], lr: 'shuttle', fov: 42 },
  // SCENE 10 — wide aerial reveal
  { t: 73.4, p: [20, 12, 9], pr: 'lane', l: [20, 0, 0], lr: 'shuttle', fov: 46 },
  { t: 77.5, p: [-35, 75, 45], pr: 'lane', l: [80, -4, 10], lr: 'lane', fov: 52 },
  { t: 82.0, p: [-215, 135, 110], pr: 'lane', l: [160, -10, 35], lr: 'lane', fov: 54 },
];
function L_END(d) { return 80 + 11 + 3 + d; }
export const CAMERA_KEYS = KF;

function refPoint(ref, off, st) {
  if (ref === 'jet') return [st.jet.s + off[0], st.jet.u + off[1], st.jet.h + off[2]];
  if (ref === 'shuttle') return [st.shuttle.s + off[0], off[1], off[2]];
  return off;
}
function cr(p0, p1, p2, p3, x) {
  const x2 = x * x, x3 = x2 * x;
  return 0.5 * ((2 * p1) + (-p0 + p2) * x + (2 * p0 - 5 * p1 + 4 * p2 - p3) * x2 + (-p0 + 3 * p1 - 3 * p2 + p3) * x3);
}
export function cameraAt(t, st = stateAt(t)) {
  t = clamp(t, 0, DURATION);
  let i = 0;
  while (i < KF.length - 2 && t > KF[i + 1].t) i++;
  const k0 = KF[Math.max(0, i - 1)], k1 = KF[i], k2 = KF[i + 1], k3 = KF[Math.min(KF.length - 1, i + 2)];
  const x = clamp((t - k1.t) / (k2.t - k1.t));
  const pos = [0, 0, 0], tgt = [0, 0, 0];
  const P = [k0, k1, k2, k3].map((k) => refPoint(k.pr, k.p, st));
  const T = [k0, k1, k2, k3].map((k) => refPoint(k.lr, k.l, st));
  for (let a = 0; a < 3; a++) {
    pos[a] = cr(P[0][a], P[1][a], P[2][a], P[3][a], x);
    tgt[a] = cr(T[0][a], T[1][a], T[2][a], T[3][a], x);
  }
  const fov = cr(k0.fov, k1.fov, k2.fov, k3.fov, x);
  // restrained engine/launch vibration (deterministic)
  const shake = 0.004 * st.engine.pwr * (t > 16 && t < 49 ? 1 : 0.4) + (t >= K.rel && t < K.sep ? 0.010 : 0);
  pos[0] += shake * noise1(t * 31.7); pos[1] += shake * noise1(t * 27.3 + 9); pos[2] += shake * noise1(t * 23.9 + 4);
  return { pos, tgt, fov };
}

// ---------------------------------------------------------------- captions and labels
export function captionAt(t) {
  const sc = SCENES[sceneIndex(t)];
  const parts = sc.text.match(/[^.?!]+[.?!]+/g).map((s) => s.trim());
  const total = parts.reduce((a, s) => a + s.length, 0);
  let a = sc.t0 + 0.25; const span = (sc.t1 - sc.t0) - 0.7;
  for (const p of parts) {
    const d = span * p.length / total;
    if (t < a + d + 0.12 || p === parts[parts.length - 1]) return { text: p, progress: clamp((t - a) / (d * 0.92)), scene: sc };
    a += d;
  }
  return { text: parts[parts.length - 1], progress: 1, scene: sc };
}

// anchors: jet-relative ('jet'), lane ('lane'), shuttle ('shuttle'), piston ('piston')
export const LABELS = [
  { id: 'jet', text: 'F/A-18 SUPER HORNET', t0: 1.0, t1: 6.8, ref: 'jet', off: [0, 0, 3.2], side: 'R' },
  { id: 'run', text: 'LAUNCH RUN ≈ 260 ft (80 m)', t0: 3.0, t1: 7.8, ref: 'lane', off: [40, 0, 0.3], side: 'L' },
  { id: 'ng', text: 'NOSE GEAR', t0: 9.0, t1: 12.6, ref: 'jet', off: [0, 0, 0.9], side: 'L' },
  { id: 'lb', text: 'LAUNCH BAR', t0: 12.6, t1: 16.0, ref: 'jet', off: [1.0, 0, 0.35], side: 'R' },
  { id: 'sh', text: 'SHUTTLE (in the track)', t0: 13.4, t1: 16.0, ref: 'shuttle', off: [0, 0, 0.05], side: 'L' },
  { id: 'hb', text: 'HOLDBACK BAR', t0: 17.0, t1: 23.5, ref: 'jet', off: [-0.8, 0, 0.5], side: 'L' },
  { id: 'hbf', text: 'DECK FITTING', t0: 18.2, t1: 23.5, ref: 'lane', off: [-2.05, 0, 0.05], side: 'R' },
  { id: 'jbd', text: 'JET-BLAST DEFLECTOR', t0: 25.0, t1: 31.6, ref: 'lane', off: [-21.5, 0, 2.4], side: 'R' },
  { id: 'act', text: 'HYDRAULIC ACTUATORS', t0: 27.5, t1: 31.6, ref: 'lane', off: [-23.0, 1.6, 1.2], side: 'L' },
  { id: 'eng', text: 'ENGINES: LAUNCH POWER', t0: 32.4, t1: 37.0, ref: 'lane', off: [-12, 0, 2.4], side: 'R' },
  { id: 'ngb', text: 'NOSE GEAR + LAUNCH BAR', t0: 37.2, t1: 40.4, ref: 'lane', off: [1.0, 0, 0.5], side: 'L' },
  { id: 'cyl', text: 'STEAM CYLINDERS', t0: 41.6, t1: 48.6, ref: 'lane', off: [12, 0.58, -1.2], side: 'R' },
  { id: 'pis', text: 'PISTON', t0: 42.4, t1: 48.6, ref: 'piston', off: [0, -0.58, -1.2], side: 'L' },
  { id: 'lnk', text: 'SHUTTLE LINK', t0: 43.6, t1: 48.6, ref: 'shuttle', off: [0, 0, -0.45], side: 'L' },
  { id: 'edu', text: 'EDUCATIONAL SCHEMATIC CUTAWAY', t0: 40.8, t1: 48.8, ref: 'lane', off: [20, 0, -3.4], side: 'R' },
  { id: 'rel', text: 'HOLDBACK RELEASES', t0: 50.2, t1: 52.8, ref: 'jet', off: [-0.8, 0, 0.5], side: 'L' },
  { id: 'sh2', text: 'SHUTTLE + LAUNCH BAR', t0: 52.8, t1: 57.0, ref: 'shuttle', off: [0, 0, 0.1], side: 'R' },
  { id: 'sepl', text: 'LAUNCH BAR RELEASES', t0: 58.4, t1: 61.0, ref: 'shuttle', off: [0, 0, 0.3], side: 'L' },
  { id: 'wb', text: 'WATER BRAKE', t0: 65.8, t1: 72.0, ref: 'lane', off: [96, 0, -1.4], side: 'R' },
  { id: 'spr', text: 'SPEAR ENTERS WATER', t0: 66.6, t1: 69.4, ref: 'lane', off: [92, 0.6, -1.0], side: 'L' },
  { id: 'ret', text: 'RETURN STROKE', t0: 70.2, t1: 73.0, ref: 'shuttle', off: [0, 0, 0.1], side: 'L' },
  { id: 'jetf', text: 'F/A-18', t0: 73.4, t1: 82.0, ref: 'jet', off: [0, 0, 0], side: 'R' },
];

export function labelAlpha(L, t) {
  return Math.min(win(t, L.t0, L.t0 + 0.5), 1 - win(t, L.t1 - 0.5, L.t1));
}

// Audio / HUD events (one-shot) — fired only on forward playback, never on seek.
export const EVENTS = [
  { t: 13.9, id: 'latch' }, { t: 17.2, id: 'holdback' }, { t: 29.9, id: 'jbdlock' },
  { t: 41.0, id: 'valve' }, { t: 48.6, id: 'afterburner' }, { t: K.rel, id: 'launch' },
  { t: K.sep, id: 'separate' }, { t: K.sep + 0.05, id: 'brake' },
  { t: K.ret0, id: 'return' }, { t: 73.5, id: 'ready' },
];
