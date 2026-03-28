"use client";

import { useEffect, useRef } from "react";

interface Customer {
  x: number;
  speed: number;
  color: string;
  height: number;
  hat: "none" | "beanie" | "tophat" | "cap";
  hasScarf: boolean;
  armSwing: number;
  served: boolean;
  leaving: boolean;
  holdingCup: boolean;
  waitX: number;
  sittingAt: number;
  sitTimer: number;
  sitChair: 0 | 1;
  seated: boolean;
  isWerewolf: boolean;
  // bench sitting
  benchAt: number; // -1 = not on bench, 0/1 = bench index
  benchSeat: 0 | 1;
  onBench: boolean;
}

interface TableState {
  x: number;
  chairs: [Customer | null, Customer | null];
}

// Barista states
type BaristaState = "idle" | "tamping" | "pulling" | "sliding" | "wiping";

interface CatState {
  x: number;
  speed: number;
  phase: number; // leg animation
  sitting: boolean;
  sitTimer: number;
  sitX: number; // where it decided to sit
}

interface BirdState {
  x: number;
  y: number;
  state: "arriving" | "landed" | "leaving";
  landTimer: number;
  bobPhase: number;
  flyDir: 1 | -1; // leaving direction
  targetX: number; // where to land on the sign
  targetY: number;
  startX: number;
  startY: number;
  arriveProgress: number;
}

interface SplatState {
  x: number;
  life: number;
}

interface SquirrelState {
  postIndex: number; // which LIGHT_POSTS index (start)
  destPostIndex: number; // which post to descend
  y: number;
  phase: "climbing" | "sitting" | "onwire" | "descending" | "running";
  timer: number;
  runX: number;
  wireX: number; // current x when on wire
  tailPhase: number;
}

interface CupSteam {
  x: number;
  y: number;
  life: number;
  dx: number;
}

interface BenchState {
  x: number;
  seats: [Customer | null, Customer | null];
}

// Bench positions — to the right of tables, with tree after
const BENCH_X = [440, 500];
const TREE_X = 540;

interface BikerState {
  x: number;
  color: string;
  height: number;
  speed: number;
  phase: "riding-in" | "dismount" | "walking-to-counter" | "waiting" | "walking-to-bench" | "sitting" | "walking-to-bike" | "mount" | "riding-out";
  timer: number;
  armSwing: number;
  bikeX: number; // where bike is parked
  benchIdx: number; // which bench to sit near
  holdingCup: boolean;
  pedalPhase: number;
}

const CUP_W = 5;
const CUP_H = 6;
const CAFE_X = 90;
const MAX_CUSTOMERS = 10; // hard cap on total customers alive

const COLORS = [
  "#7eb8da", "#a8d8a8", "#d4a8d4", "#f0c860", "#e8a87c",
  "#82c4c4", "#c4a6e0", "#e0c4a6", "#a6c4e0", "#d4c4a8",
];
const HATS: Customer["hat"][] = ["none", "none", "none", "beanie", "tophat", "cap"];

export function BaristaScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    customers: [] as Customer[],
    nextSpawn: 120,
    steam: [] as { x: number; y: number; life: number; dx: number }[],
    tables: [
      { x: 200, chairs: [null, null] },
      { x: 280, chairs: [null, null] },
      { x: 360, chairs: [null, null] },
    ] as TableState[],
    // Barista state machine
    baristaState: "idle" as BaristaState,
    baristaTimer: 0,
    servingCustomer: null as Customer | null,
    totalServed: 0,
    // Extras
    cat: null as CatState | null,
    nextCat: 600 + Math.floor(Math.random() * 1200),
    birds: [] as BirdState[],
    nextBird: 400 + Math.floor(Math.random() * 800),
    splats: [] as SplatState[],
    frameCount: 0,
    // String lights — fixed positions between tables
    lights: [] as { x: number; y: number; twinkleOffset: number }[],
    lightsInit: false,
    squirrel: null as SquirrelState | null,
    nextSquirrel: 900 + Math.floor(Math.random() * 1800),
    cupSteams: [] as CupSteam[],
    benches: [
      { x: BENCH_X[0], seats: [null, null] },
      { x: BENCH_X[1], seats: [null, null] },
    ] as BenchState[],
    biker: null as BikerState | null,
    nextBiker: 400 + Math.floor(Math.random() * 600),
    bikerSpawnChance: 0, // counts spawns, triggers ~1 in 30
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const ground = () => h - 6;
    const chairSeatY = (by: number) => by - 12 + 4;

    const drawCup = (cx: number, cy: number) => {
      ctx.strokeStyle = "#E31837";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, cy, CUP_W, CUP_H);
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(cx + 1, cy + 2, CUP_W - 2, CUP_H - 3);
    };

    const spawnCustomer = (forceSit: boolean) => {
      const s = stateRef.current;
      const ht = 18 + Math.random() * 10;
      let sittingAt = -1;
      let sitChair: 0 | 1 = 0;

      // check which chairs/bench seats are claimed
      const claimed = new Set<string>();
      const benchClaimed = new Set<string>();
      for (const c of s.customers) {
        if (c.sittingAt >= 0 && !c.leaving) claimed.add(`${c.sittingAt}-${c.sitChair}`);
        if (c.benchAt >= 0 && !c.leaving) benchClaimed.add(`${c.benchAt}-${c.benchSeat}`);
      }

      let benchAt = -1;
      let benchSeat: 0 | 1 = 0;

      if (forceSit || Math.random() > 0.4) {
        // 30% chance to pick a bench instead of a table
        if (Math.random() < 0.3) {
          const shuffled = [0, 1].sort(() => Math.random() - 0.5);
          for (const bi of shuffled) {
            if (!s.benches[bi].seats[0] && !benchClaimed.has(`${bi}-0`)) { benchAt = bi; benchSeat = 0; break; }
            else if (!s.benches[bi].seats[1] && !benchClaimed.has(`${bi}-1`)) { benchAt = bi; benchSeat = 1; break; }
          }
        }
        // if no bench, try a table
        if (benchAt < 0) {
          const shuffled = [0, 1, 2].sort(() => Math.random() - 0.5);
          for (const ti of shuffled) {
            if (!s.tables[ti].chairs[0] && !claimed.has(`${ti}-0`)) { sittingAt = ti; sitChair = 0; break; }
            else if (!s.tables[ti].chairs[1] && !claimed.has(`${ti}-1`)) { sittingAt = ti; sitChair = 1; break; }
          }
        }
      }

      const isWerewolf = Math.random() < 0.08;

      return {
        x: -20, speed: isWerewolf ? 0.55 + Math.random() * 0.3 : 0.4 + Math.random() * 0.5,
        color: isWerewolf ? "#8B6914" : COLORS[Math.floor(Math.random() * COLORS.length)],
        height: isWerewolf ? 24 + Math.random() * 6 : ht,
        hat: isWerewolf ? "none" as const : HATS[Math.floor(Math.random() * HATS.length)],
        hasScarf: isWerewolf ? false : Math.random() > 0.7, armSwing: 0,
        served: false, leaving: false, holdingCup: false,
        waitX: CAFE_X + 20 + Math.random() * 20,
        sittingAt, sitTimer: 0, sitChair, seated: false,
        isWerewolf,
        benchAt, benchSeat, onBench: false,
      } as Customer;
    };

    const drawStickFigure = (
      x: number, baseY: number, ht: number, color: string,
      hat: Customer["hat"], hasScarf: boolean, armPhase: number,
      walking: boolean, holdingCup: boolean, facingRight: boolean, sitting: boolean,
      isWerewolf = false
    ) => {
      const headR = ht * 0.18;
      const bodyLen = ht * 0.4;
      const armLen = ht * 0.3;
      let headY: number, neckY: number, hipY: number;

      if (sitting) {
        hipY = chairSeatY(baseY);
        neckY = hipY - bodyLen;
        headY = neckY - headR;
      } else {
        headY = baseY - ht + headR;
        neckY = headY + headR;
        hipY = neckY + bodyLen;
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";

      // head
      ctx.beginPath();
      ctx.arc(x, headY, headR, 0, Math.PI * 2);
      ctx.stroke();

      // eyes
      const eyeDir = facingRight ? 1 : -1;
      if (isWerewolf) {
        // glowing yellow eyes
        ctx.fillStyle = "#FFD700";
        ctx.fillRect(x + eyeDir * headR * 0.15 - 0.5, headY - 1.5, 2, 2);
        ctx.fillRect(x + eyeDir * headR * 0.55 - 0.5, headY - 1.5, 2, 2);
      } else {
        ctx.fillStyle = color;
        ctx.fillRect(x + eyeDir * headR * 0.3 - 0.5, headY - 1, 1.5, 1.5);
      }

      if (isWerewolf) {
        // pointy ears
        ctx.beginPath();
        ctx.moveTo(x - headR * 0.6, headY - headR);
        ctx.lineTo(x - headR * 0.3, headY - headR - 6);
        ctx.lineTo(x - headR * 0.0, headY - headR);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + headR * 0.0, headY - headR);
        ctx.lineTo(x + headR * 0.3, headY - headR - 6);
        ctx.lineTo(x + headR * 0.6, headY - headR);
        ctx.stroke();

        // snout
        ctx.beginPath();
        ctx.moveTo(x + eyeDir * headR, headY);
        ctx.lineTo(x + eyeDir * (headR + 4), headY + 1);
        ctx.lineTo(x + eyeDir * headR, headY + 3);
        ctx.stroke();
        // nose dot
        ctx.fillStyle = "#222";
        ctx.beginPath();
        ctx.arc(x + eyeDir * (headR + 4), headY + 1, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // hat
      if (isWerewolf) {
        // no hat — ears are the feature
      } else if (hat === "beanie") {
        ctx.beginPath();
        ctx.arc(x, headY - headR, headR * 1.1, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, headY - headR - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (hat === "tophat") {
        ctx.strokeRect(x - headR * 0.8, headY - headR - 8, headR * 1.6, 8);
        ctx.beginPath();
        ctx.moveTo(x - headR * 1.2, headY - headR);
        ctx.lineTo(x + headR * 1.2, headY - headR);
        ctx.stroke();
      } else if (hat === "cap") {
        ctx.beginPath();
        ctx.moveTo(x - headR, headY - headR + 1);
        ctx.lineTo(x + headR * 1.5 * eyeDir, headY - headR + 1);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, headY - headR + 1, headR, Math.PI, 0);
        ctx.stroke();
      }

      // scarf
      if (hasScarf) {
        ctx.strokeStyle = "#E31837";
        ctx.beginPath();
        ctx.moveTo(x - 3, neckY);
        ctx.lineTo(x + 3, neckY);
        ctx.moveTo(x + 2, neckY);
        ctx.lineTo(x + 4, neckY + 5);
        ctx.stroke();
        ctx.strokeStyle = color;
      }

      // body
      ctx.beginPath();
      ctx.moveTo(x, neckY);
      ctx.lineTo(x, hipY);
      ctx.stroke();

      // legs
      if (sitting) {
        const dir = facingRight ? 1 : -1;
        const kneeY = hipY + 2;
        ctx.beginPath();
        ctx.moveTo(x, hipY);
        ctx.lineTo(x + dir * 5, kneeY);
        ctx.lineTo(x + dir * 5, baseY);
        ctx.moveTo(x, hipY);
        ctx.lineTo(x + dir * 8, kneeY);
        ctx.lineTo(x + dir * 8, baseY);
        ctx.stroke();
      } else {
        const legSwing = walking ? Math.sin(armPhase) * 6 : 0;
        ctx.beginPath();
        ctx.moveTo(x, hipY);
        ctx.lineTo(x - 4 + legSwing, baseY);
        ctx.moveTo(x, hipY);
        ctx.lineTo(x + 4 - legSwing, baseY);
        ctx.stroke();
      }

      // werewolf tail
      if (isWerewolf) {
        const tailDir = facingRight ? -1 : 1;
        const tailWag = walking ? Math.sin(armPhase * 2) * 3 : Math.sin(armPhase * 0.5) * 1.5;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, hipY);
        ctx.quadraticCurveTo(
          x + tailDir * 10, hipY - 6 + tailWag,
          x + tailDir * 14, hipY - 10 + tailWag
        );
        ctx.stroke();
      }

      // arms
      const shoulderY = neckY + 4;
      if (sitting && holdingCup) {
        const tableDir = facingRight ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(x, shoulderY);
        ctx.lineTo(x + tableDir * 8, hipY - 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, shoulderY);
        ctx.lineTo(x - tableDir * 4, hipY);
        ctx.stroke();
      } else if (holdingCup) {
        const cupDir = facingRight ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(x, shoulderY);
        ctx.lineTo(x + cupDir * armLen * 0.8, shoulderY + 2);
        ctx.stroke();
        const swing2 = walking ? Math.sin(armPhase + Math.PI) * 4 : 0;
        ctx.beginPath();
        ctx.moveTo(x, shoulderY);
        ctx.lineTo(x - cupDir * 5 + swing2, shoulderY + armLen * 0.8);
        ctx.stroke();
        drawCup(x + cupDir * armLen * 0.8 - 2, shoulderY - 2);
        ctx.strokeStyle = color;
      } else {
        const swing1 = walking ? Math.sin(armPhase) * 5 : 0;
        const swing2 = walking ? Math.sin(armPhase + Math.PI) * 5 : 0;
        ctx.beginPath();
        ctx.moveTo(x, shoulderY);
        ctx.lineTo(x - 5 + swing1, shoulderY + armLen * 0.8);
        ctx.moveTo(x, shoulderY);
        ctx.lineTo(x + 5 + swing2, shoulderY + armLen * 0.8);
        ctx.stroke();
      }
    };

    const drawEspressoMachine = (by: number) => {
      const mx = CAFE_X + 22;
      const counterY = by - 10;
      const machineBottom = counterY;
      const machineH = 22;
      const machineW = 16;
      const machineTop = machineBottom - machineH;

      ctx.strokeStyle = "#555"; ctx.lineWidth = 1.5;
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(mx - machineW / 2, machineTop, machineW, machineH);
      ctx.strokeRect(mx - machineW / 2, machineTop, machineW, machineH);
      ctx.beginPath();
      ctx.arc(mx, machineTop, machineW / 2.5, Math.PI, 0);
      ctx.fillStyle = "#222"; ctx.fill();
      ctx.strokeStyle = "#555"; ctx.stroke();
      ctx.strokeStyle = "#666"; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mx - 3, machineBottom - 6);
      ctx.lineTo(mx - 3, machineBottom - 2);
      ctx.lineTo(mx + 3, machineBottom - 2);
      ctx.lineTo(mx + 3, machineBottom - 6);
      ctx.stroke();
      ctx.strokeStyle = "#444";
      ctx.strokeRect(mx - 5, machineBottom - 1, 10, 2);
      ctx.strokeStyle = "#E31837"; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(mx, machineTop + 6, 3, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mx, machineTop + 6); ctx.lineTo(mx + 2, machineTop + 4); ctx.stroke();
      return mx;
    };

    const drawSign = (by: number) => {
      const signX = CAFE_X;
      const signY = by - 70;
      ctx.strokeStyle = "#444"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(signX, signY + 27); ctx.lineTo(signX, signY + 40); ctx.stroke();
      ctx.fillStyle = "#111"; ctx.strokeStyle = "#E31837"; ctx.lineWidth = 1.2;
      const sw = 120; const sh = 27;
      ctx.fillRect(signX - sw / 2, signY, sw, sh);
      ctx.strokeRect(signX - sw / 2, signY, sw, sh);
      ctx.fillStyle = "#E31837"; ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("The Cafe", signX, signY + sh / 2);
      ctx.textAlign = "start"; ctx.textBaseline = "alphabetic";
    };

    const drawTable = (tx: number, by: number) => {
      const tableY = by - 12;
      ctx.strokeStyle = "#444"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(tx - 14, tableY); ctx.lineTo(tx + 14, tableY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx, tableY); ctx.lineTo(tx, by); ctx.stroke();
      ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
      // left chair
      ctx.beginPath(); ctx.moveTo(tx - 22, tableY + 4); ctx.lineTo(tx - 14, tableY + 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx - 22, tableY - 4); ctx.lineTo(tx - 22, tableY + 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx - 21, tableY + 4); ctx.lineTo(tx - 21, by); ctx.moveTo(tx - 15, tableY + 4); ctx.lineTo(tx - 15, by); ctx.stroke();
      // right chair
      ctx.beginPath(); ctx.moveTo(tx + 14, tableY + 4); ctx.lineTo(tx + 22, tableY + 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx + 22, tableY - 4); ctx.lineTo(tx + 22, tableY + 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx + 15, tableY + 4); ctx.lineTo(tx + 15, by); ctx.moveTo(tx + 21, tableY + 4); ctx.lineTo(tx + 21, by); ctx.stroke();
    };

    const drawBench = (bx: number, by: number) => {
      const seatY = by - 10;
      const backY = seatY - 8;
      // brown vertical supports (legs + back supports)
      ctx.strokeStyle = "#5a3a1a";
      ctx.lineWidth = 2;
      // left leg
      ctx.beginPath(); ctx.moveTo(bx - 14, seatY); ctx.lineTo(bx - 14, by); ctx.stroke();
      // right leg
      ctx.beginPath(); ctx.moveTo(bx + 14, seatY); ctx.lineTo(bx + 14, by); ctx.stroke();
      // back supports
      ctx.beginPath(); ctx.moveTo(bx - 14, backY); ctx.lineTo(bx - 14, seatY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + 14, backY); ctx.lineTo(bx + 14, seatY); ctx.stroke();
      // green slats — seat (3 slats)
      ctx.strokeStyle = "#2d6a2d";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(bx - 16, seatY - 1); ctx.lineTo(bx + 16, seatY - 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx - 16, seatY + 1); ctx.lineTo(bx + 16, seatY + 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx - 16, seatY + 3); ctx.lineTo(bx + 16, seatY + 3); ctx.stroke();
      // green slats — back (2 slats)
      ctx.beginPath(); ctx.moveTo(bx - 15, backY); ctx.lineTo(bx + 15, backY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx - 15, backY + 3); ctx.lineTo(bx + 15, backY + 3); ctx.stroke();
      // armrests
      ctx.strokeStyle = "#5a3a1a";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(bx - 16, seatY - 2); ctx.lineTo(bx - 16, backY + 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + 16, seatY - 2); ctx.lineTo(bx + 16, backY + 2); ctx.stroke();
    };

    const drawTree = (tx: number, by: number, frame: number) => {
      // trunk
      ctx.strokeStyle = "#5a3a1a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tx, by);
      ctx.lineTo(tx, by - 35);
      ctx.stroke();
      // branches
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tx, by - 25);
      ctx.lineTo(tx - 12, by - 32);
      ctx.moveTo(tx, by - 28);
      ctx.lineTo(tx + 10, by - 35);
      ctx.moveTo(tx, by - 32);
      ctx.lineTo(tx - 6, by - 40);
      ctx.stroke();
      // foliage (layered circles)
      const sway = Math.sin(frame * 0.008) * 1;
      ctx.fillStyle = "rgba(34, 90, 34, 0.7)";
      ctx.beginPath(); ctx.arc(tx + sway, by - 42, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(40, 110, 40, 0.6)";
      ctx.beginPath(); ctx.arc(tx - 6 + sway, by - 38, 10, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(tx + 8 + sway, by - 38, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(50, 120, 50, 0.5)";
      ctx.beginPath(); ctx.arc(tx + 2 + sway, by - 48, 8, 0, Math.PI * 2); ctx.fill();
    };

    const drawBarista = (bState: BaristaState, timer: number, phaseDuration: number) => {
      const bx = CAFE_X;
      const by = ground();
      const ht = 26;
      const headR = ht * 0.18;
      const headY = by - ht + headR;
      const neckY = headY + headR;
      const shoulderY = neckY + 4;
      const hipY = neckY + ht * 0.4;
      const counterY = by - 10;

      // counter
      ctx.strokeStyle = "#333"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(CAFE_X - 30, counterY); ctx.lineTo(CAFE_X + 60, counterY); ctx.stroke();
      ctx.fillStyle = "#181818"; ctx.fillRect(CAFE_X - 30, counterY, 90, 3);
      ctx.lineWidth = 1.5;

      const machineX = drawEspressoMachine(by);
      drawSign(by);

      ctx.strokeStyle = "#E31837"; ctx.lineWidth = 1.5; ctx.lineCap = "round";

      // head
      ctx.beginPath(); ctx.arc(bx, headY, headR, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#E31837"; ctx.fillRect(bx + headR * 0.2, headY - 1, 1.5, 1.5);

      // apron
      ctx.strokeStyle = "#ff4060";
      ctx.beginPath(); ctx.moveTo(bx - 3, neckY + 2); ctx.lineTo(bx - 3, hipY); ctx.lineTo(bx + 3, hipY); ctx.lineTo(bx + 3, neckY + 2); ctx.stroke();
      ctx.strokeStyle = "#E31837";

      // body
      ctx.beginPath(); ctx.moveTo(bx, neckY); ctx.lineTo(bx, hipY); ctx.stroke();
      // legs
      ctx.beginPath(); ctx.moveTo(bx, hipY); ctx.lineTo(bx - 4, by); ctx.moveTo(bx, hipY); ctx.lineTo(bx + 4, by); ctx.stroke();

      const t = phaseDuration > 0 ? timer / phaseDuration : 0;
      const cupOnCounter = counterY - CUP_H;

      if (bState === "tamping") {
        const rArmX = bx + 10 + t * 8;
        const rArmY = shoulderY - 4 + Math.sin(t * Math.PI * 3) * 2;
        ctx.beginPath(); ctx.moveTo(bx, shoulderY); ctx.lineTo(rArmX, rArmY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, shoulderY); ctx.lineTo(bx + 8, shoulderY + 4); ctx.stroke();
        ctx.strokeStyle = "#888"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bx + 6, shoulderY + 4); ctx.lineTo(bx + 14, shoulderY + 4); ctx.lineTo(bx + 14, shoulderY + 7); ctx.lineTo(bx + 8, shoulderY + 7); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.strokeStyle = "#E31837";
      } else if (bState === "pulling") {
        const leverPull = Math.sin(Math.min(t * 2, 1) * Math.PI * 0.5) * 6;
        ctx.beginPath(); ctx.moveTo(bx, shoulderY); ctx.lineTo(machineX - 2, shoulderY - 10 + leverPull); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, shoulderY); ctx.lineTo(machineX - 4, cupOnCounter + 4); ctx.stroke();
        drawCup(machineX - CUP_W / 2 - 1, cupOnCounter);
        if (t > 0.3) {
          ctx.fillStyle = "#8B4513";
          const drip = ((t - 0.3) * 50) % 8;
          ctx.fillRect(machineX - 1, cupOnCounter - 4 + drip, 1.5, 2);
        }
        ctx.strokeStyle = "#E31837";
      } else if (bState === "sliding") {
        const startX = machineX - CUP_W / 2 - 1;
        const endX = CAFE_X + 50;
        const cupSlideX = startX + t * (endX - startX);
        const armReach = Math.min(bx + 12 + t * 20, bx + 30);
        ctx.beginPath(); ctx.moveTo(bx, shoulderY); ctx.lineTo(armReach, shoulderY + 2 - t * 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, shoulderY); ctx.lineTo(bx - 5, shoulderY + 8); ctx.stroke();
        drawCup(cupSlideX, cupOnCounter);
      } else if (bState === "wiping") {
        const wipe = Math.sin(t * Math.PI * 2) * 8;
        ctx.beginPath(); ctx.moveTo(bx, shoulderY); ctx.lineTo(bx + 10 + wipe, counterY - 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, shoulderY); ctx.lineTo(bx - 6, hipY - 2); ctx.stroke();
        ctx.fillStyle = "#444"; ctx.fillRect(bx + 8 + wipe, counterY - 4, 6, 2);
      } else {
        // idle — arms relaxed
        ctx.beginPath(); ctx.moveTo(bx, shoulderY); ctx.lineTo(bx - 5, shoulderY + 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, shoulderY); ctx.lineTo(bx + 5, shoulderY + 8); ctx.stroke();
      }
    };

    const drawSteam = () => {
      const s = stateRef.current;
      ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1;
      s.steam.forEach((p) => {
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        ctx.quadraticCurveTo(p.x + p.dx * 2, p.y - 3, p.x + p.dx * 4, p.y - 6);
        ctx.stroke();
      });
    };

    // --- Draw cat ---
    const drawCat = (cat: CatState, by: number) => {
      const cx = cat.x;
      const cy = by;
      ctx.strokeStyle = "#a0825a";
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      // body (horizontal oval)
      const bodyY = cy - 5;
      ctx.beginPath();
      ctx.ellipse(cx, bodyY, 7, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      // head
      ctx.beginPath();
      ctx.arc(cx + 7, bodyY - 2, 3.5, 0, Math.PI * 2);
      ctx.stroke();
      // ears
      ctx.beginPath();
      ctx.moveTo(cx + 5, bodyY - 5);
      ctx.lineTo(cx + 6, bodyY - 9);
      ctx.lineTo(cx + 7.5, bodyY - 5);
      ctx.moveTo(cx + 7.5, bodyY - 5);
      ctx.lineTo(cx + 9, bodyY - 9);
      ctx.lineTo(cx + 10, bodyY - 5);
      ctx.stroke();
      // eyes
      ctx.fillStyle = "#5a5";
      ctx.fillRect(cx + 6, bodyY - 3, 1.2, 1.2);
      ctx.fillRect(cx + 8, bodyY - 3, 1.2, 1.2);
      // tail (curvy, up)
      const tailWave = Math.sin(cat.phase * 0.08) * 3;
      ctx.strokeStyle = "#a0825a";
      ctx.beginPath();
      ctx.moveTo(cx - 7, bodyY);
      ctx.quadraticCurveTo(cx - 12, bodyY - 8 + tailWave, cx - 10, bodyY - 14 + tailWave);
      ctx.stroke();
      // legs
      if (!cat.sitting) {
        const legAnim = Math.sin(cat.phase * 0.2) * 2;
        ctx.beginPath();
        ctx.moveTo(cx - 4, bodyY + 3); ctx.lineTo(cx - 4 - legAnim, cy);
        ctx.moveTo(cx - 1, bodyY + 3); ctx.lineTo(cx - 1 + legAnim, cy);
        ctx.moveTo(cx + 3, bodyY + 3); ctx.lineTo(cx + 3 - legAnim, cy);
        ctx.moveTo(cx + 6, bodyY + 3); ctx.lineTo(cx + 6 + legAnim, cy);
        ctx.stroke();
      } else {
        // tucked legs
        ctx.beginPath();
        ctx.moveTo(cx - 4, bodyY + 3); ctx.lineTo(cx - 3, cy);
        ctx.moveTo(cx + 5, bodyY + 3); ctx.lineTo(cx + 6, cy);
        ctx.stroke();
      }
    };

    // --- Draw bird ---
    const drawBird = (bird: BirdState) => {
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 1;
      if (bird.state === "landed") {
        // sitting bird
        const bx = bird.x;
        const by = bird.y;
        const bob = Math.sin(bird.bobPhase * 0.15) * 1;
        ctx.beginPath();
        ctx.ellipse(bx, by + bob, 3, 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(bx + 3, by - 1.5 + bob, 1.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "#d4a843";
        ctx.beginPath();
        ctx.moveTo(bx + 4.5, by - 1.5 + bob);
        ctx.lineTo(bx + 6.5, by - 1 + bob);
        ctx.stroke();
        ctx.strokeStyle = "#888";
        ctx.fillStyle = "#222";
        ctx.fillRect(bx + 3.2, by - 2 + bob, 0.8, 0.8);
      } else {
        // flying bird (arriving or leaving) — V wings
        const bx = bird.x;
        const by = bird.y + Math.sin(bird.bobPhase * 0.1) * 2;
        const wingPhase = Math.sin(bird.bobPhase * 0.3) * 4;
        ctx.beginPath();
        ctx.moveTo(bx - 5, by + wingPhase);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + 5, by + wingPhase);
        ctx.stroke();
      }
    };

    // --- Draw splat ---
    const drawSplat = (splat: SplatState, by: number) => {
      const alpha = Math.min(splat.life / 60, 1);
      ctx.fillStyle = `rgba(139, 69, 19, ${alpha * 0.6})`;
      // coffee puddle
      ctx.beginPath();
      ctx.ellipse(splat.x, by - 1, 6, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // droplets
      ctx.fillStyle = `rgba(139, 69, 19, ${alpha * 0.4})`;
      ctx.fillRect(splat.x - 8, by - 2, 2, 1.5);
      ctx.fillRect(splat.x + 5, by - 3, 1.5, 1.5);
      ctx.fillRect(splat.x - 3, by - 2, 1, 1);
    };

    // --- Draw string lights ---
    const LIGHT_POSTS = [170, 240, 320, 390]; // wooden post X positions
    const drawStringLights = (by: number, frame: number) => {
      const s = stateRef.current;
      const ropeY = by - 40;

      // wooden posts
      for (const px of LIGHT_POSTS) {
        ctx.strokeStyle = "#5a3a1a";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(px, by);
        ctx.lineTo(px, ropeY - 2);
        ctx.stroke();
        // post top cap
        ctx.strokeStyle = "#6b4423";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px - 3, ropeY - 2);
        ctx.lineTo(px + 3, ropeY - 2);
        ctx.stroke();
      }

      if (!s.lightsInit) {
        // generate lights along rope segments between posts
        for (let seg = 0; seg < LIGHT_POSTS.length - 1; seg++) {
          const x0 = LIGHT_POSTS[seg];
          const x1 = LIGHT_POSTS[seg + 1];
          for (let lx = x0; lx <= x1; lx += 10) {
            const segT = (lx - x0) / (x1 - x0);
            const sag = Math.sin(segT * Math.PI) * 5;
            s.lights.push({
              x: lx,
              y: ropeY + sag,
              twinkleOffset: Math.random() * 1000,
            });
          }
        }
        s.lightsInit = true;
      }

      // draw rope between posts
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 0.5;
      for (let seg = 0; seg < LIGHT_POSTS.length - 1; seg++) {
        const segLights = s.lights.filter(
          (l) => l.x >= LIGHT_POSTS[seg] && l.x <= LIGHT_POSTS[seg + 1]
        );
        if (segLights.length > 0) {
          ctx.beginPath();
          ctx.moveTo(segLights[0].x, segLights[0].y);
          for (let i = 1; i < segLights.length; i++) {
            ctx.lineTo(segLights[i].x, segLights[i].y);
          }
          ctx.stroke();
        }
      }

      // draw bulbs
      for (const light of s.lights) {
        const twinkle = Math.sin((frame + light.twinkleOffset) * 0.03);
        const brightness = 0.3 + twinkle * 0.15;
        const size = 1.2 + twinkle * 0.3;
        ctx.fillStyle = `rgba(255, 220, 140, ${brightness})`;
        ctx.beginPath();
        ctx.arc(light.x, light.y + 2, size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // --- Draw bike (standalone, leaning) ---
    const drawBikeLeaning = (bx: number, by: number) => {
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 1.2;
      // wheels
      ctx.beginPath(); ctx.arc(bx - 6, by - 5, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(bx + 6, by - 5, 5, 0, Math.PI * 2); ctx.stroke();
      // frame — leaning slightly right
      ctx.beginPath();
      ctx.moveTo(bx - 6, by - 5); ctx.lineTo(bx + 1, by - 14); // down tube
      ctx.lineTo(bx + 6, by - 5); // chain stay
      ctx.moveTo(bx + 1, by - 14); ctx.lineTo(bx - 2, by - 14); // top tube
      ctx.lineTo(bx - 6, by - 5); // seat tube
      ctx.stroke();
      // handlebars
      ctx.beginPath(); ctx.moveTo(bx + 1, by - 14); ctx.lineTo(bx + 3, by - 17); ctx.stroke();
      // seat
      ctx.beginPath(); ctx.moveTo(bx - 3, by - 15); ctx.lineTo(bx + 0, by - 15); ctx.stroke();
      // kickstand
      ctx.beginPath(); ctx.moveTo(bx, by - 8); ctx.lineTo(bx + 4, by); ctx.stroke();
    };

    // --- Draw biker on bike (riding) ---
    const drawBikerRiding = (bk: BikerState, by: number) => {
      const rx = bk.x;
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 1.2;
      // wheels with spinning spokes
      const spoke = bk.pedalPhase;
      for (let wh = -1; wh <= 1; wh += 2) {
        const wx = rx + wh * 8;
        ctx.beginPath(); ctx.arc(wx, by - 5, 5, 0, Math.PI * 2); ctx.stroke();
        // spokes
        for (let sp = 0; sp < 3; sp++) {
          const a = spoke + sp * (Math.PI * 2 / 3);
          ctx.beginPath();
          ctx.moveTo(wx, by - 5);
          ctx.lineTo(wx + Math.cos(a) * 4.5, by - 5 + Math.sin(a) * 4.5);
          ctx.stroke();
        }
      }
      // frame
      ctx.beginPath();
      ctx.moveTo(rx - 8, by - 5); ctx.lineTo(rx, by - 14);
      ctx.lineTo(rx + 8, by - 5);
      ctx.moveTo(rx, by - 14); ctx.lineTo(rx - 3, by - 14);
      ctx.lineTo(rx - 8, by - 5);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rx, by - 14); ctx.lineTo(rx + 2, by - 17); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rx - 4, by - 15); ctx.lineTo(rx - 1, by - 15); ctx.stroke();
      // rider on top
      const ht = bk.height;
      const headR = ht * 0.16;
      const seatY = by - 16;
      const hipY = seatY;
      const bodyLen = ht * 0.35;
      const neckY = hipY - bodyLen;
      const headY = neckY - headR;
      ctx.strokeStyle = bk.color;
      ctx.lineWidth = 1.5;
      // head
      ctx.beginPath(); ctx.arc(rx - 1, headY, headR, 0, Math.PI * 2); ctx.stroke();
      // eye
      ctx.fillStyle = bk.color;
      ctx.fillRect(rx - 1 + headR * 0.3, headY - 1, 1.5, 1.5);
      // body (leaning forward)
      ctx.beginPath(); ctx.moveTo(rx - 1, neckY + headR); ctx.lineTo(rx - 2, hipY); ctx.stroke();
      // arms to handlebars
      ctx.beginPath(); ctx.moveTo(rx - 1, neckY + headR + 3); ctx.lineTo(rx + 2, by - 17); ctx.stroke();
      // legs pedaling
      const pedal = Math.sin(bk.pedalPhase) * 4;
      ctx.beginPath();
      ctx.moveTo(rx - 2, hipY); ctx.lineTo(rx - 4 + pedal, by - 6);
      ctx.moveTo(rx - 2, hipY); ctx.lineTo(rx - 4 - pedal, by - 6);
      ctx.stroke();
    };

    // --- Draw squirrel ---
    const drawSquirrel = (sq: SquirrelState, by: number) => {
      const postX = LIGHT_POSTS[sq.postIndex];
      ctx.strokeStyle = "#8B6B3E";
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";

      if (sq.phase === "running" || sq.phase === "onwire") {
        // running horizontally (ground or wire)
        const rx = sq.phase === "onwire" ? sq.wireX : sq.runX;
        const ry = sq.phase === "onwire" ? sq.y + 8 : by;
        const legAnim = Math.sin(sq.tailPhase * 0.3) * 2;
        // body
        ctx.beginPath();
        ctx.ellipse(rx, ry - 4, 4, 2.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        // head
        ctx.beginPath();
        ctx.arc(rx + 4, ry - 5, 2, 0, Math.PI * 2);
        ctx.stroke();
        // ear
        ctx.beginPath();
        ctx.moveTo(rx + 4, ry - 7);
        ctx.lineTo(rx + 5, ry - 9);
        ctx.lineTo(rx + 6, ry - 7);
        ctx.stroke();
        // eye
        ctx.fillStyle = "#222";
        ctx.fillRect(rx + 4.5, ry - 5.5, 0.8, 0.8);
        // legs
        ctx.beginPath();
        ctx.moveTo(rx - 2, ry - 2); ctx.lineTo(rx - 2 - legAnim, ry);
        ctx.moveTo(rx + 2, ry - 2); ctx.lineTo(rx + 2 + legAnim, ry);
        ctx.stroke();
        // bushy tail
        const tailWave = Math.sin(sq.tailPhase * 0.15) * 2;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(rx - 4, ry - 4);
        ctx.quadraticCurveTo(rx - 8, ry - 10 + tailWave, rx - 5, ry - 14 + tailWave);
        ctx.stroke();
      } else if (sq.phase === "sitting") {
        // sitting on top of the post — horizontal body
        const sx = postX;
        const sy = sq.y;
        // body
        ctx.beginPath();
        ctx.ellipse(sx, sy - 4, 4, 2.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        // head
        ctx.beginPath();
        ctx.arc(sx + 4, sy - 5, 2, 0, Math.PI * 2);
        ctx.stroke();
        // ear
        ctx.beginPath();
        ctx.moveTo(sx + 4, sy - 7);
        ctx.lineTo(sx + 5, sy - 9);
        ctx.lineTo(sx + 6, sy - 7);
        ctx.stroke();
        // eye
        ctx.fillStyle = "#222";
        ctx.fillRect(sx + 4.5, sy - 5.5, 0.8, 0.8);
        // paws tucked
        ctx.beginPath();
        ctx.moveTo(sx - 2, sy - 2); ctx.lineTo(sx - 2, sy);
        ctx.moveTo(sx + 2, sy - 2); ctx.lineTo(sx + 2, sy);
        ctx.stroke();
        // bushy tail curled up
        const tailWave = Math.sin(sq.tailPhase * 0.1) * 2;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx - 4, sy - 4);
        ctx.quadraticCurveTo(sx - 8, sy - 10 + tailWave, sx - 5, sy - 14 + tailWave);
        ctx.stroke();
      } else {
        // on the post (climbing or descending) — vertical body gripping
        const sx = postX + 3;
        const sy = sq.y;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 2.5, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sx, sy - 5.5, 2, 0, Math.PI * 2);
        ctx.stroke();
        // ears
        ctx.beginPath();
        ctx.moveTo(sx - 1, sy - 7.5);
        ctx.lineTo(sx - 0.5, sy - 9.5);
        ctx.lineTo(sx + 0.5, sy - 7.5);
        ctx.moveTo(sx + 0.5, sy - 7.5);
        ctx.lineTo(sx + 1, sy - 9.5);
        ctx.lineTo(sx + 1.5, sy - 7.5);
        ctx.stroke();
        ctx.fillStyle = "#222";
        ctx.fillRect(sx + 1, sy - 6, 0.8, 0.8);
        // paws gripping post
        ctx.beginPath();
        ctx.moveTo(sx - 2, sy - 2); ctx.lineTo(postX, sy - 2);
        ctx.moveTo(sx - 2, sy + 2); ctx.lineTo(postX, sy + 2);
        ctx.stroke();
        // bushy tail
        const tailWave = Math.sin(sq.tailPhase * 0.1) * 3;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy + 3);
        ctx.quadraticCurveTo(sx + 6, sy + tailWave, sx + 4, sy - 4 + tailWave);
        ctx.stroke();
      }
    };

    // --- Draw cup steam (for table cups) ---
    const drawCupSteam = () => {
      const s = stateRef.current;
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 0.7;
      s.cupSteams = s.cupSteams.filter((p) => {
        p.y -= 0.3;
        p.x += p.dx * 0.3;
        p.life--;
        const alpha = Math.min(p.life / 20, 1) * 0.12;
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.quadraticCurveTo(p.x + p.dx * 2, p.y - 2, p.x + p.dx * 3, p.y - 4);
        ctx.stroke();
        return p.life > 0;
      });
    };

    // Phase durations (in frames)
    const TAMP = 50;
    const PULL = 60;
    const SLIDE = 40;
    const WIPE = 80;

    const tick = () => {
      const s = stateRef.current;
      s.baristaTimer++;
      s.frameCount++;

      ctx.clearRect(0, 0, w, h);

      const by = ground();

      // ground line
      ctx.strokeStyle = "#262626"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(w, by); ctx.stroke();

      // tables
      for (const table of s.tables) drawTable(table.x, by);

      // benches + tree
      for (const bench of s.benches) drawBench(bench.x, by);
      drawTree(TREE_X, by, s.frameCount);

      // --- Barista state machine ---
      const waitingAtCounter = s.customers.find(
        (c) => !c.served && !c.leaving && !c.seated && c.x >= c.waitX - 2
      );

      if (s.baristaState === "idle") {
        if (waitingAtCounter) {
          // start making coffee for this customer
          s.servingCustomer = waitingAtCounter;
          s.baristaState = "tamping";
          s.baristaTimer = 0;
        }
      } else if (s.baristaState === "tamping" && s.baristaTimer >= TAMP) {
        s.baristaState = "pulling";
        s.baristaTimer = 0;
      } else if (s.baristaState === "pulling" && s.baristaTimer >= PULL) {
        s.baristaState = "sliding";
        s.baristaTimer = 0;
      } else if (s.baristaState === "sliding" && s.baristaTimer >= SLIDE) {
        // serve the customer
        if (s.servingCustomer) {
          s.servingCustomer.served = true;
          s.servingCustomer.holdingCup = true;
          if (s.servingCustomer.sittingAt >= 0 || s.servingCustomer.benchAt >= 0) {
            s.servingCustomer.leaving = false;
          } else {
            s.servingCustomer.leaving = true;
          }
          s.totalServed++;
        }
        s.servingCustomer = null;
        s.baristaState = "wiping";
        s.baristaTimer = 0;
      } else if (s.baristaState === "wiping" && s.baristaTimer >= WIPE) {
        s.baristaState = "idle";
        s.baristaTimer = 0;
      }

      // get phase duration for drawing
      let phaseDuration = 1;
      if (s.baristaState === "tamping") phaseDuration = TAMP;
      else if (s.baristaState === "pulling") phaseDuration = PULL;
      else if (s.baristaState === "sliding") phaseDuration = SLIDE;
      else if (s.baristaState === "wiping") phaseDuration = WIPE;

      drawBarista(s.baristaState, s.baristaTimer, phaseDuration);

      // steam during pulling
      const machSteamX = CAFE_X + 22;
      if (s.baristaState === "pulling" && s.baristaTimer % 6 === 0) {
        s.steam.push({
          x: machSteamX - 2 + Math.random() * 4,
          y: by - 34, life: 25,
          dx: (Math.random() - 0.5) * 1,
        });
      }
      s.steam = s.steam.filter((p) => { p.y -= 0.4; p.life--; return p.life > 0; });
      drawSteam();

      // --- String lights over tables ---
      drawStringLights(by, s.frameCount);

      // --- Cat ---
      s.nextCat--;
      if (!s.cat && s.nextCat <= 0) {
        s.cat = {
          x: -15,
          speed: 0.3 + Math.random() * 0.2,
          phase: 0,
          sitting: false,
          sitTimer: 0,
          sitX: 160 + Math.random() * 380, // table area through bench area
        };
        s.nextCat = 1200 + Math.floor(Math.random() * 1800);
      }
      if (s.cat) {
        s.cat.phase++;
        if (!s.cat.sitting) {
          if (s.cat.x < s.cat.sitX && Math.random() > 0.002) {
            s.cat.x += s.cat.speed;
          } else if (s.cat.sitTimer === 0 && s.cat.x < w + 20) {
            // decide to sit for a bit or keep walking
            if (!s.cat.sitting && s.cat.x >= s.cat.sitX - 2 && s.cat.x < s.cat.sitX + 2) {
              s.cat.sitting = true;
              s.cat.sitTimer = 200 + Math.floor(Math.random() * 300);
            } else {
              s.cat.x += s.cat.speed;
            }
          } else {
            s.cat.x += s.cat.speed;
          }
        } else {
          s.cat.sitTimer--;
          if (s.cat.sitTimer <= 0) {
            s.cat.sitting = false;
            s.cat.sitX = w + 30; // walk off stage right
          }
        }
        drawCat(s.cat, by);
        if (s.cat.x > w + 20) s.cat = null;
      }

      // --- Birds ---
      s.nextBird--;
      if (s.nextBird <= 0 && s.birds.length < 2) {
        const signX = CAFE_X;
        const signY = by - 70;
        const fromLeft = Math.random() > 0.5;
        const startX = fromLeft ? -20 : w + 20;
        const targetX = signX - 20 + Math.random() * 40;
        s.birds.push({
          x: startX,
          y: signY - 30,
          state: "arriving",
          landTimer: 180 + Math.floor(Math.random() * 240),
          bobPhase: 0,
          flyDir: Math.random() > 0.5 ? 1 : -1,
          targetX,
          targetY: signY - 2,
          startX,
          startY: signY - 30,
          arriveProgress: 0,
        });
        s.nextBird = 600 + Math.floor(Math.random() * 1200);
      }
      s.birds = s.birds.filter((bird) => {
        bird.bobPhase++;
        if (bird.state === "arriving") {
          bird.arriveProgress += 0.004;
          const t = Math.min(bird.arriveProgress, 1);
          // ease-out curve toward landing spot
          const ease = 1 - (1 - t) * (1 - t);
          bird.x = bird.startX + (bird.targetX - bird.startX) * ease;
          bird.y = bird.startY + (bird.targetY - bird.startY) * ease;
          if (t >= 1) {
            bird.state = "landed";
            bird.x = bird.targetX;
            bird.y = bird.targetY;
          }
        } else if (bird.state === "landed") {
          bird.landTimer--;
          if (bird.landTimer <= 0) bird.state = "leaving";
        } else {
          bird.x += bird.flyDir * 1.5;
          bird.y -= 0.4;
        }
        drawBird(bird);
        return bird.x > -30 && bird.x < w + 30;
      });

      // --- Splats (coffee spills) ---
      s.splats = s.splats.filter((sp) => {
        sp.life--;
        drawSplat(sp, by);
        return sp.life > 0;
      });

      // --- Squirrel ---
      s.nextSquirrel--;
      if (!s.squirrel && s.nextSquirrel <= 0) {
        const postIdx = Math.floor(Math.random() * (LIGHT_POSTS.length - 1)); // not the last post
        // pick a destination post further right
        const destIdx = postIdx + 1 + Math.floor(Math.random() * (LIGHT_POSTS.length - 1 - postIdx));
        s.squirrel = {
          postIndex: postIdx,
          destPostIndex: Math.min(destIdx, LIGHT_POSTS.length - 1),
          y: by,
          phase: "climbing",
          timer: 0,
          runX: LIGHT_POSTS[postIdx],
          wireX: LIGHT_POSTS[postIdx],
          tailPhase: 0,
        };
        s.nextSquirrel = 1500 + Math.floor(Math.random() * 2400);
      }
      if (s.squirrel) {
        const sq = s.squirrel;
        sq.tailPhase++;
        const ropeY = by - 40;
        const postTopY = ropeY - 2;
        if (sq.phase === "climbing") {
          sq.y -= 0.4;
          if (sq.y <= postTopY) {
            sq.y = postTopY;
            sq.phase = "sitting";
            sq.timer = 80 + Math.floor(Math.random() * 120);
          }
        } else if (sq.phase === "sitting") {
          sq.timer--;
          if (sq.timer <= 0) {
            sq.phase = "onwire";
            sq.wireX = LIGHT_POSTS[sq.postIndex];
          }
        } else if (sq.phase === "onwire") {
          // run along the wire toward destination post
          const destX = LIGHT_POSTS[sq.destPostIndex];
          sq.wireX += 0.6;
          // follow the sag of the rope between posts
          // find which segment we're on
          let segStart = LIGHT_POSTS[sq.postIndex];
          let segEnd = destX;
          for (let i = 0; i < LIGHT_POSTS.length - 1; i++) {
            if (sq.wireX >= LIGHT_POSTS[i] && sq.wireX < LIGHT_POSTS[i + 1]) {
              segStart = LIGHT_POSTS[i];
              segEnd = LIGHT_POSTS[i + 1];
              break;
            }
          }
          const segT = (sq.wireX - segStart) / (segEnd - segStart);
          const sag = Math.sin(segT * Math.PI) * 5;
          sq.y = ropeY + sag - 4; // sit on top of the wire
          if (sq.wireX >= destX) {
            sq.wireX = destX;
            sq.y = postTopY;
            sq.postIndex = sq.destPostIndex;
            sq.phase = "descending";
          }
        } else if (sq.phase === "descending") {
          sq.y += 0.5;
          if (sq.y >= by - 2) {
            sq.phase = "running";
            sq.runX = LIGHT_POSTS[sq.destPostIndex];
          }
        } else if (sq.phase === "running") {
          sq.runX += 0.8;
          if (sq.runX > w + 20) {
            s.squirrel = null;
          }
        }
        if (s.squirrel) drawSquirrel(s.squirrel, by);
      }

      // --- Biker ---
      if (!s.biker) {
        s.nextBiker--;
        if (s.nextBiker <= 0) {
          s.bikerSpawnChance++;
          if (s.bikerSpawnChance % 30 === 0 || (s.bikerSpawnChance > 5 && Math.random() < 0.033)) {
            const benchIdx = Math.random() > 0.5 ? 0 : 1;
            s.biker = {
              x: -30,
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
              height: 22 + Math.random() * 6,
              speed: 1.2 + Math.random() * 0.4,
              phase: "riding-in",
              timer: 0,
              armSwing: 0,
              bikeX: 0,
              benchIdx,
              holdingCup: false,
              pedalPhase: 0,
            };
          }
          s.nextBiker = 300 + Math.floor(Math.random() * 400);
        }
      }
      if (s.biker) {
        const bk = s.biker;
        bk.armSwing += 0.12;
        const counterX = CAFE_X + 30;
        const benchX = s.benches[bk.benchIdx].x;

        if (bk.phase === "riding-in") {
          bk.pedalPhase += bk.speed * 0.15;
          bk.x += bk.speed;
          if (bk.x >= counterX - 20) {
            bk.phase = "dismount";
            bk.bikeX = bk.x;
            bk.timer = 30;
          }
          drawBikerRiding(bk, by);
        } else if (bk.phase === "dismount") {
          bk.timer--;
          drawBikeLeaning(bk.bikeX, by);
          drawStickFigure(bk.bikeX + 5, by, bk.height, bk.color, "none", false, 0, false, false, true, false);
          if (bk.timer <= 0) bk.phase = "walking-to-counter";
        } else if (bk.phase === "walking-to-counter") {
          bk.x += 0.5;
          drawBikeLeaning(bk.bikeX, by);
          if (bk.x >= counterX) {
            bk.phase = "waiting";
            bk.x = counterX;
          }
          drawStickFigure(bk.x, by, bk.height, bk.color, "none", false, bk.armSwing, true, false, true, false);
        } else if (bk.phase === "waiting") {
          drawBikeLeaning(bk.bikeX, by);
          // gets served by barista when idle
          if (s.baristaState === "idle") {
            // hijack barista to make coffee for biker
            s.baristaState = "tamping";
            s.baristaTimer = 0;
            s.servingCustomer = null; // biker is separate
            bk.timer = 230; // wait for full barista cycle
          }
          bk.timer--;
          if (bk.timer <= 0 && s.baristaState === "wiping") {
            bk.holdingCup = true;
            bk.phase = "walking-to-bench";
          }
          drawStickFigure(bk.x, by, bk.height, bk.color, "none", false, 0, false, bk.holdingCup, true, false);
        } else if (bk.phase === "walking-to-bench") {
          // push bike alongside
          bk.x += 0.4;
          bk.bikeX += 0.4;
          drawBikeLeaning(bk.bikeX, by);
          if (bk.x >= benchX - 20) {
            bk.phase = "sitting";
            bk.bikeX = benchX - 20;
            bk.timer = 300 + Math.floor(Math.random() * 400);
          }
          drawStickFigure(bk.x, by, bk.height, bk.color, "none", false, bk.armSwing, true, true, true, false);
        } else if (bk.phase === "sitting") {
          bk.timer--;
          drawBikeLeaning(bk.bikeX, by);
          // draw sitting on bench area
          drawStickFigure(benchX - 10, by, bk.height, bk.color, "none", false, 0, false, false, true, true);
          // cup in hand
          const benchSeatY = by - 10;
          drawCup(benchX - 4, benchSeatY - CUP_H - 2);
          // steam
          if (s.frameCount % 12 === 0) {
            s.cupSteams.push({
              x: benchX - 4 + CUP_W / 2 + (Math.random() - 0.5) * 2,
              y: benchSeatY - CUP_H - 3,
              life: 20 + Math.floor(Math.random() * 10),
              dx: (Math.random() - 0.5) * 1.5,
            });
          }
          if (bk.timer <= 0) bk.phase = "walking-to-bike";
        } else if (bk.phase === "walking-to-bike") {
          bk.x = benchX - 10;
          if (!bk.timer) bk.timer = 20;
          bk.timer--;
          drawBikeLeaning(bk.bikeX, by);
          drawStickFigure(bk.x - (20 - bk.timer) * 0.5, by, bk.height, bk.color, "none", false, bk.armSwing, true, false, true, false);
          if (bk.timer <= 0) {
            bk.phase = "mount";
            bk.x = bk.bikeX;
            bk.timer = 20;
          }
        } else if (bk.phase === "mount") {
          bk.timer--;
          drawBikeLeaning(bk.bikeX, by);
          drawStickFigure(bk.bikeX + 2, by, bk.height, bk.color, "none", false, 0, false, false, true, false);
          if (bk.timer <= 0) bk.phase = "riding-out";
        } else if (bk.phase === "riding-out") {
          bk.pedalPhase += bk.speed * 0.15;
          bk.x += bk.speed;
          drawBikerRiding(bk, by);
          if (bk.x > w + 40) s.biker = null;
        }
      }

      // --- Cup steam on tables and benches ---
      if (s.frameCount % 10 === 0) {
        for (const c of s.customers) {
          if (c.seated && c.holdingCup && c.sittingAt >= 0) {
            const table = s.tables[c.sittingAt];
            const tableTopY = by - 12;
            const cupX = c.sitChair === 0 ? table.x - 5 : table.x + 1;
            s.cupSteams.push({
              x: cupX + CUP_W / 2 + (Math.random() - 0.5) * 2,
              y: tableTopY - CUP_H - 1,
              life: 20 + Math.floor(Math.random() * 10),
              dx: (Math.random() - 0.5) * 1.5,
            });
          }
          if (c.onBench && c.holdingCup && c.benchAt >= 0) {
            const bench = s.benches[c.benchAt];
            const seatX = c.benchSeat === 0 ? bench.x - 7 : bench.x + 7;
            const benchSeatY = by - 10;
            s.cupSteams.push({
              x: seatX + 6 + CUP_W / 2 + (Math.random() - 0.5) * 2,
              y: benchSeatY - CUP_H - 3,
              life: 20 + Math.floor(Math.random() * 10),
              dx: (Math.random() - 0.5) * 1.5,
            });
          }
        }
      }
      drawCupSteam();

      // spawn — only if under cap and not too many waiting
      const totalAlive = s.customers.length;
      const numWaiting = s.customers.filter((c) => !c.served && !c.leaving && !c.seated).length;
      s.nextSpawn--;
      if (s.nextSpawn <= 0 && totalAlive < MAX_CUSTOMERS && numWaiting < 1) {
        s.customers.push(spawnCustomer(false));
        s.nextSpawn = 200 + Math.floor(Math.random() * 200);
      }

      // guarantee at least one seated after first serve
      const totalSeated = s.tables.reduce(
        (n, t) => n + (t.chairs[0] ? 1 : 0) + (t.chairs[1] ? 1 : 0), 0
      );
      if (s.totalServed > 0 && totalSeated === 0) {
        const enRoute = s.customers.some(
          (c) => c.served && c.sittingAt >= 0 && !c.seated && !c.leaving
        );
        if (!enRoute && totalAlive < MAX_CUSTOMERS) {
          s.customers.push(spawnCustomer(true));
          s.nextSpawn = 200 + Math.floor(Math.random() * 200);
        }
      }

      // update + draw customers
      s.customers = s.customers.filter((c) => {
        c.armSwing += c.speed * 0.15;

        // --- Seated at TABLE ---
        if (c.seated && c.sittingAt >= 0) {
          c.sitTimer--;
          if (c.sitTimer <= 0) {
            c.seated = false;
            c.leaving = true;
            s.tables[c.sittingAt].chairs[c.sitChair] = null;
            c.sittingAt = -1;
          } else {
            const table = s.tables[c.sittingAt];
            const seatX = c.sitChair === 0 ? table.x - 18 : table.x + 18;
            drawStickFigure(seatX, by, c.height, c.color, c.hat, c.hasScarf, 0,
              false, false, c.sitChair === 0, true, c.isWerewolf);
            if (c.holdingCup) {
              const tableTopY = by - 12;
              const cupX = c.sitChair === 0 ? table.x - 5 : table.x + 1;
              drawCup(cupX, tableTopY - CUP_H);
            }
            return true;
          }
        }

        // --- Seated on BENCH ---
        if (c.onBench && c.benchAt >= 0) {
          c.sitTimer--;
          if (c.sitTimer <= 0) {
            c.onBench = false;
            c.leaving = true;
            s.benches[c.benchAt].seats[c.benchSeat] = null;
            c.benchAt = -1;
          } else {
            const bench = s.benches[c.benchAt];
            const seatX = c.benchSeat === 0 ? bench.x - 7 : bench.x + 7;
            drawStickFigure(seatX, by, c.height, c.color, c.hat, c.hasScarf, 0,
              false, false, true, true, c.isWerewolf);
            // cup in hand while on bench (no table to set it on)
            if (c.holdingCup) {
              const benchSeatY = by - 10;
              const cupBenchX = seatX + 6;
              drawCup(cupBenchX, benchSeatY - CUP_H - 2);
            }
            return true;
          }
        }

        if (!c.leaving && !c.seated && !c.onBench) {
          if (!c.served && c.x < c.waitX) {
            c.x += c.speed;
          } else if (c.served && c.sittingAt >= 0) {
            // walk to table
            const table = s.tables[c.sittingAt];
            const targetX = c.sitChair === 0 ? table.x - 18 : table.x + 18;
            if (c.x < targetX - 1) {
              c.x += c.speed;
            } else {
              if (s.tables[c.sittingAt].chairs[c.sitChair] === null) {
                c.seated = true;
                c.x = targetX;
                c.sitTimer = 300 + Math.floor(Math.random() * 600);
                s.tables[c.sittingAt].chairs[c.sitChair] = c;
              } else {
                c.sittingAt = -1;
                c.leaving = true;
              }
            }
          } else if (c.served && c.benchAt >= 0) {
            // walk to bench
            const bench = s.benches[c.benchAt];
            const targetX = c.benchSeat === 0 ? bench.x - 7 : bench.x + 7;
            if (c.x < targetX - 1) {
              c.x += c.speed;
            } else {
              if (s.benches[c.benchAt].seats[c.benchSeat] === null) {
                c.onBench = true;
                c.x = targetX;
                c.sitTimer = 300 + Math.floor(Math.random() * 600);
                s.benches[c.benchAt].seats[c.benchSeat] = c;
              } else {
                c.benchAt = -1;
                c.leaving = true;
              }
            }
          }
        }

        if (c.leaving) {
          c.x += c.speed * 0.8;
          if (c.holdingCup && c.x > CAFE_X + 50 && c.x < CAFE_X + 70 && Math.random() < 0.002) {
            s.splats.push({ x: c.x, life: 180 });
            c.holdingCup = false;
            c.served = false;
            c.leaving = false;
            c.x = CAFE_X - 10;
            c.waitX = CAFE_X + 20 + Math.random() * 20;
          }
        }

        if (!c.seated && !c.onBench) {
          const isWalking = c.leaving || (!c.served && c.x < c.waitX)
            || (c.served && c.sittingAt >= 0 && !c.seated)
            || (c.served && c.benchAt >= 0 && !c.onBench);
          drawStickFigure(c.x, by, c.height, c.color, c.hat, c.hasScarf, c.armSwing,
            isWalking, c.holdingCup, true, false, c.isWerewolf);
        }

        return c.x < w + 30 || c.seated || c.onBench;
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div className="w-full h-28 overflow-hidden pointer-events-none select-none">
      <canvas ref={canvasRef} className="w-full h-full" aria-hidden="true" />
    </div>
  );
}
