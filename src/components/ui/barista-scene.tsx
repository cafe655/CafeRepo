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
}

interface TableState {
  x: number;
  chairs: [Customer | null, Customer | null];
}

// Barista states
type BaristaState = "idle" | "tamping" | "pulling" | "sliding" | "wiping";

const CUP_W = 5;
const CUP_H = 6;
const CAFE_X = 90;
const MAX_CUSTOMERS = 8; // hard cap on total customers alive

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

      if (forceSit || Math.random() > 0.4) {
        const shuffled = [0, 1, 2].sort(() => Math.random() - 0.5);
        for (const ti of shuffled) {
          if (!s.tables[ti].chairs[0]) { sittingAt = ti; sitChair = 0; break; }
          else if (!s.tables[ti].chairs[1]) { sittingAt = ti; sitChair = 1; break; }
        }
      }

      return {
        x: -20, speed: 0.4 + Math.random() * 0.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        height: ht,
        hat: HATS[Math.floor(Math.random() * HATS.length)],
        hasScarf: Math.random() > 0.7, armSwing: 0,
        served: false, leaving: false, holdingCup: false,
        waitX: CAFE_X + 20 + Math.random() * 20,
        sittingAt, sitTimer: 0, sitChair, seated: false,
      } as Customer;
    };

    const drawStickFigure = (
      x: number, baseY: number, ht: number, color: string,
      hat: Customer["hat"], hasScarf: boolean, armPhase: number,
      walking: boolean, holdingCup: boolean, facingRight: boolean, sitting: boolean
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
      ctx.fillStyle = color;
      ctx.fillRect(x + eyeDir * headR * 0.3 - 0.5, headY - 1, 1.5, 1.5);

      // hat
      if (hat === "beanie") {
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

    // Phase durations (in frames)
    const TAMP = 50;
    const PULL = 60;
    const SLIDE = 40;
    const WIPE = 80;

    const tick = () => {
      const s = stateRef.current;
      s.baristaTimer++;

      ctx.clearRect(0, 0, w, h);

      const by = ground();

      // ground line
      ctx.strokeStyle = "#262626"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(w, by); ctx.stroke();

      // tables
      for (const table of s.tables) drawTable(table.x, by);

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
          if (s.servingCustomer.sittingAt >= 0) {
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

        if (c.seated) {
          c.sitTimer--;
          if (c.sitTimer <= 0) {
            c.seated = false;
            c.leaving = true;
            if (c.sittingAt >= 0) s.tables[c.sittingAt].chairs[c.sitChair] = null;
            c.sittingAt = -1;
          } else {
            const table = s.tables[c.sittingAt];
            const seatX = c.sitChair === 0 ? table.x - 18 : table.x + 18;
            drawStickFigure(seatX, by, c.height, c.color, c.hat, c.hasScarf, 0,
              false, false, c.sitChair === 0, true);
            if (c.holdingCup) {
              const tableTopY = by - 12;
              const cupX = c.sitChair === 0 ? table.x - 5 : table.x + 1;
              drawCup(cupX, tableTopY - CUP_H);
            }
            return true;
          }
        }

        if (!c.leaving && !c.seated) {
          if (!c.served && c.x < c.waitX) {
            c.x += c.speed;
          } else if (c.served && c.sittingAt >= 0) {
            const table = s.tables[c.sittingAt];
            const targetX = c.sitChair === 0 ? table.x - 18 : table.x + 18;
            if (c.x < targetX - 1) {
              c.x += c.speed;
            } else {
              c.seated = true;
              c.x = targetX;
              c.sitTimer = 300 + Math.floor(Math.random() * 600);
              s.tables[c.sittingAt].chairs[c.sitChair] = c;
            }
          }
          // if served with no table, leaving is already true
        }

        if (c.leaving) c.x += c.speed * 0.8;

        if (!c.seated) {
          const isWalking = c.leaving || (!c.served && c.x < c.waitX) || (c.served && c.sittingAt >= 0 && !c.seated);
          const facingRight = !c.leaving;
          drawStickFigure(c.x, by, c.height, c.color, c.hat, c.hasScarf, c.armSwing,
            isWalking, c.holdingCup, facingRight, false);
        }

        return c.x < w + 30 || c.seated;
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
