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
}

const COLORS = [
  "#7eb8da", "#a8d8a8", "#d4a8d4", "#f0c860", "#e8a87c",
  "#82c4c4", "#c4a6e0", "#e0c4a6", "#a6c4e0", "#d4c4a8",
];

const HATS: Customer["hat"][] = ["none", "none", "none", "beanie", "tophat", "cap"];

export function BaristaScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    customers: [] as Customer[],
    baristaFrame: 0,
    frameCount: 0,
    nextSpawn: 60,
    steam: [] as { x: number; y: number; life: number; dx: number }[],
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

    const spawnCustomer = () => {
      const ht = 18 + Math.random() * 10;
      return {
        x: -20,
        speed: 0.4 + Math.random() * 0.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        height: ht,
        hat: HATS[Math.floor(Math.random() * HATS.length)],
        hasScarf: Math.random() > 0.7,
        armSwing: 0,
        served: false,
        leaving: false,
        holdingCup: false,
        waitX: 70 + Math.random() * 30,
      } as Customer;
    };

    const drawStickFigure = (
      x: number,
      baseY: number,
      ht: number,
      color: string,
      hat: Customer["hat"],
      hasScarf: boolean,
      armPhase: number,
      walking: boolean,
      holdingCup: boolean,
      facingRight: boolean
    ) => {
      const headR = ht * 0.18;
      const bodyLen = ht * 0.4;
      const legLen = ht * 0.35;
      const armLen = ht * 0.3;

      const headY = baseY - ht + headR;
      const neckY = headY + headR;
      const hipY = neckY + bodyLen;

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
      const legSwing = walking ? Math.sin(armPhase) * 6 : 0;
      ctx.beginPath();
      ctx.moveTo(x, hipY);
      ctx.lineTo(x - 4 + legSwing, baseY);
      ctx.moveTo(x, hipY);
      ctx.lineTo(x + 4 - legSwing, baseY);
      ctx.stroke();

      // arms
      const shoulderY = neckY + 4;
      if (holdingCup) {
        const cupDir = facingRight ? 1 : -1;
        // one arm holds cup out
        ctx.beginPath();
        ctx.moveTo(x, shoulderY);
        ctx.lineTo(x + cupDir * armLen * 0.8, shoulderY + 2);
        ctx.stroke();
        // other arm relaxed
        const swing2 = walking ? Math.sin(armPhase + Math.PI) * 4 : 0;
        ctx.beginPath();
        ctx.moveTo(x, shoulderY);
        ctx.lineTo(x - cupDir * 5 + swing2, shoulderY + armLen * 0.8);
        ctx.stroke();
        // cup
        ctx.strokeStyle = "#E31837";
        ctx.strokeRect(x + cupDir * armLen * 0.8 - 2, shoulderY - 2, 5, 6);
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
      const mx = 72; // machine center x
      const counterY = by - 10;
      const machineBottom = counterY;
      const machineH = 22;
      const machineW = 16;
      const machineTop = machineBottom - machineH;

      // machine body
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 1.5;
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(mx - machineW / 2, machineTop, machineW, machineH);
      ctx.strokeRect(mx - machineW / 2, machineTop, machineW, machineH);

      // top dome
      ctx.beginPath();
      ctx.arc(mx, machineTop, machineW / 2.5, Math.PI, 0);
      ctx.fillStyle = "#222";
      ctx.fill();
      ctx.strokeStyle = "#555";
      ctx.stroke();

      // group head (where portafilter goes)
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mx - 3, machineBottom - 6);
      ctx.lineTo(mx - 3, machineBottom - 2);
      ctx.lineTo(mx + 3, machineBottom - 2);
      ctx.lineTo(mx + 3, machineBottom - 6);
      ctx.stroke();

      // drip tray
      ctx.strokeStyle = "#444";
      ctx.strokeRect(mx - 5, machineBottom - 1, 10, 2);

      // gauge circle
      ctx.strokeStyle = "#E31837";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(mx, machineTop + 6, 3, 0, Math.PI * 2);
      ctx.stroke();
      // gauge needle
      ctx.beginPath();
      ctx.moveTo(mx, machineTop + 6);
      ctx.lineTo(mx + 2, machineTop + 4);
      ctx.stroke();

      return { mx, machineBottom, machineTop };
    };

    const drawSign = (by: number) => {
      const signX = 55;
      const signY = by - 70;
      // pole
      ctx.strokeStyle = "#444";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(signX, signY + 27);
      ctx.lineTo(signX, signY + 40);
      ctx.stroke();
      // sign board
      ctx.fillStyle = "#111";
      ctx.strokeStyle = "#E31837";
      ctx.lineWidth = 1.2;
      const sw = 120;
      const sh = 27;
      ctx.fillRect(signX - sw / 2, signY, sw, sh);
      ctx.strokeRect(signX - sw / 2, signY, sw, sh);
      // text
      ctx.fillStyle = "#E31837";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("The Cafe", signX, signY + sh / 2);
      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";
    };

    const drawBarista = (frame: number) => {
      const bx = 50;
      const by = ground();
      const ht = 26;
      const headR = ht * 0.18;
      const headY = by - ht + headR;
      const neckY = headY + headR;
      const shoulderY = neckY + 4;
      const hipY = neckY + ht * 0.4;
      const counterY = by - 10;

      // counter/bar
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(25, counterY);
      ctx.lineTo(115, counterY);
      ctx.stroke();
      // counter thickness
      ctx.fillStyle = "#181818";
      ctx.fillRect(25, counterY, 90, 3);
      ctx.lineWidth = 1.5;

      // espresso machine (on counter, behind barista)
      drawEspressoMachine(by);

      // sign above
      drawSign(by);

      ctx.strokeStyle = "#E31837";
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";

      // head
      ctx.beginPath();
      ctx.arc(bx, headY, headR, 0, Math.PI * 2);
      ctx.stroke();

      // eyes
      ctx.fillStyle = "#E31837";
      ctx.fillRect(bx + headR * 0.2, headY - 1, 1.5, 1.5);

      // apron
      ctx.strokeStyle = "#ff4060";
      ctx.beginPath();
      ctx.moveTo(bx - 3, neckY + 2);
      ctx.lineTo(bx - 3, hipY);
      ctx.lineTo(bx + 3, hipY);
      ctx.lineTo(bx + 3, neckY + 2);
      ctx.stroke();
      ctx.strokeStyle = "#E31837";

      // body
      ctx.beginPath();
      ctx.moveTo(bx, neckY);
      ctx.lineTo(bx, hipY);
      ctx.stroke();

      // legs
      ctx.beginPath();
      ctx.moveTo(bx, hipY);
      ctx.lineTo(bx - 4, by);
      ctx.moveTo(bx, hipY);
      ctx.lineTo(bx + 4, by);
      ctx.stroke();

      // arms — 4-phase coffee making
      const cycle = frame % 240;
      const machineX = 72;
      const cupOnCounter = counterY - 6;

      if (cycle < 50) {
        // Phase 1: grab portafilter from machine, tamp grounds
        const t = cycle / 50;
        // right arm reaches toward machine then tamps down
        const rArmX = bx + 10 + t * 8;
        const rArmY = shoulderY - 4 + Math.sin(t * Math.PI * 3) * 2;
        ctx.beginPath();
        ctx.moveTo(bx, shoulderY);
        ctx.lineTo(rArmX, rArmY);
        ctx.stroke();
        // left arm holds portafilter
        ctx.beginPath();
        ctx.moveTo(bx, shoulderY);
        ctx.lineTo(bx + 8, shoulderY + 4);
        ctx.stroke();
        // portafilter in hand
        ctx.strokeStyle = "#888";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx + 6, shoulderY + 4);
        ctx.lineTo(bx + 14, shoulderY + 4);
        ctx.lineTo(bx + 14, shoulderY + 7);
        ctx.lineTo(bx + 8, shoulderY + 7);
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#E31837";
      } else if (cycle < 100) {
        // Phase 2: lock portafilter into machine, pull shot
        const t = (cycle - 50) / 50;
        // right arm up at machine lever
        const leverPull = Math.sin(Math.min(t * 2, 1) * Math.PI * 0.5) * 6;
        ctx.beginPath();
        ctx.moveTo(bx, shoulderY);
        ctx.lineTo(machineX - 2, shoulderY - 10 + leverPull);
        ctx.stroke();
        // left arm holds cup under group head
        ctx.beginPath();
        ctx.moveTo(bx, shoulderY);
        ctx.lineTo(machineX - 4, cupOnCounter + 4);
        ctx.stroke();
        // cup under machine
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(machineX - 5, cupOnCounter, 5, 6);
        ctx.lineWidth = 1.5;
        // espresso dripping
        if (t > 0.3) {
          ctx.fillStyle = "#8B4513";
          const dripProgress = ((t - 0.3) * 50) % 8;
          ctx.fillRect(machineX - 3, cupOnCounter - 4 + dripProgress, 1.5, 2);
          ctx.fillRect(machineX - 1, cupOnCounter - 3 + (dripProgress + 2) % 8, 1.5, 2);
        }
        ctx.strokeStyle = "#E31837";
      } else if (cycle < 160) {
        // Phase 3: pick up cup, slide it across counter toward customer
        const t = (cycle - 100) / 60;
        const cupSlideX = machineX - 5 + t * 35;
        // right arm pushes cup along counter
        ctx.beginPath();
        ctx.moveTo(bx, shoulderY);
        ctx.lineTo(Math.min(bx + 12 + t * 20, bx + 28), shoulderY + 2 - t * 4);
        ctx.stroke();
        // left arm relaxed
        ctx.beginPath();
        ctx.moveTo(bx, shoulderY);
        ctx.lineTo(bx - 5, shoulderY + 8);
        ctx.stroke();
        // cup sliding on counter
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(cupSlideX, cupOnCounter, 5, 6);
        // coffee fill
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(cupSlideX + 1, cupOnCounter + 2, 3, 3);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#E31837";
      } else {
        // Phase 4: idle / wipe counter
        const t = (cycle - 160) / 80;
        const wipe = Math.sin(t * Math.PI * 2) * 8;
        // right arm wiping counter
        ctx.beginPath();
        ctx.moveTo(bx, shoulderY);
        ctx.lineTo(bx + 10 + wipe, counterY - 4);
        ctx.stroke();
        // left arm on hip
        ctx.beginPath();
        ctx.moveTo(bx, shoulderY);
        ctx.lineTo(bx - 6, hipY - 2);
        ctx.stroke();
        // rag
        ctx.fillStyle = "#444";
        ctx.fillRect(bx + 8 + wipe, counterY - 4, 6, 2);
      }
    };

    const drawSteam = () => {
      const s = stateRef.current;
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      s.steam.forEach((p) => {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.quadraticCurveTo(p.x + p.dx * 2, p.y - 3, p.x + p.dx * 4, p.y - 6);
        ctx.stroke();
      });
    };

    const tick = () => {
      const s = stateRef.current;
      s.frameCount++;
      s.baristaFrame++;

      ctx.clearRect(0, 0, w, h);

      // ground line
      ctx.strokeStyle = "#262626";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, ground());
      ctx.lineTo(w, ground());
      ctx.stroke();

      // barista
      drawBarista(s.baristaFrame);

      // steam from machine area (during shot pulling phase)
      const machineCycle = s.baristaFrame % 240;
      if (s.baristaFrame % 6 === 0 && machineCycle > 50 && machineCycle < 100) {
        s.steam.push({
          x: 70 + Math.random() * 4,
          y: ground() - 34,
          life: 25,
          dx: (Math.random() - 0.5) * 1,
        });
      }
      s.steam = s.steam.filter((p) => {
        p.y -= 0.4;
        p.life--;
        return p.life > 0;
      });
      drawSteam();

      // spawn customers
      s.nextSpawn--;
      if (s.nextSpawn <= 0) {
        s.customers.push(spawnCustomer());
        s.nextSpawn = 90 + Math.floor(Math.random() * 180);
      }

      // update and draw customers
      s.customers = s.customers.filter((c) => {
        c.armSwing += c.speed * 0.15;

        if (!c.leaving) {
          if (c.x < c.waitX && !c.served) {
            c.x += c.speed;
          } else if (!c.served) {
            // waiting at counter — served when cup slides over
            const barCycle = s.baristaFrame % 240;
            if (barCycle > 145 && barCycle < 165) {
              c.served = true;
              c.holdingCup = true;
              c.leaving = true;
            }
          }
        } else {
          c.x += c.speed * 0.8;
        }

        const atGround = ground();
        drawStickFigure(
          c.x, atGround, c.height, c.color,
          c.hat, c.hasScarf, c.armSwing,
          c.leaving || c.x < c.waitX,
          c.holdingCup,
          !c.leaving
        );

        return c.x < w + 30;
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="w-full h-28 overflow-hidden pointer-events-none select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        aria-hidden="true"
      />
    </div>
  );
}
