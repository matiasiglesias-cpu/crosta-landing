"use client";

// TEMPORARY dev-only tuning UI for the hero 3D composition — gated out of
// production via NODE_ENV in ChipVisual.tsx. Remove this file (and the wiring
// in ChipVisual.tsx) once the numbers below are finalized and baked back into
// the real constants.
//
// Every field defaults to the value already baked into the scene, so leaving
// the panel untouched (or hitting Reset) reproduces the committed look exactly.
// See the label under each Row in the panel for exactly which scene value it
// drives (documented per-section in ChipVisual.tsx where the value is read).
import { useState } from "react";

export interface LabelTune {
  // Whole label (dot + word) nudge, in px, applied on top of HIGHLIGHTS[].pos.
  dx: number;
  dy: number;
  // The dot only — px offset relative to the word, plus its diameter in px.
  // Applies from sm: up only; phones keep the stock 6px inline dot.
  dotDx: number;
  dotDy: number;
  dotSize: number;
  // The connector filament for this label: whole-curve offset in px (converted
  // to viewBox units internally, ÷4.3 at the 430px desktop container), stroke
  // thickness in screen px (non-scaling-stroke), and a 0–1 opacity multiplier
  // layered on top of the shimmer animation.
  lineDx: number;
  lineDy: number;
  lineWidth: number;
  lineOpacity: number;
}

export interface Tune {
  // Hero chip. x/y/z nudge the rig position; rx/ry/rz add to the mesh's base
  // diamond rotation [0.1, 0, PI/4 + 0.05]; scale is the mesh scale.
  chip: { scale: number; x: number; y: number; z: number; rx: number; ry: number; rz: number };
  // The whole galaxy group transform (dust + minis + stars move together).
  galaxy: { x: number; y: number; z: number; scale: number; rx: number; ry: number; rz: number };
  // Dust disc point materials (fine + coarse layers): grain size + opacity.
  // Dust has no position of its own — it moves with the galaxy group.
  dust: { fineSize: number; fineOpacity: number; coarseSize: number; coarseOpacity: number };
  // The orbiting mini crisps: global scale + orbit-radius multipliers, and an
  // x/y/z offset on top of their base nested depth (0, 0, -0.5).
  minis: { scale: number; radius: number; x: number; y: number; z: number };
  // The backdrop star specks: point size + opacity, and an x/y/z offset on
  // top of their base nested depth (0, 0, -1).
  stars: { size: number; opacity: number; x: number; y: number; z: number };
  // One entry per nutrient label (index-matched to HIGHLIGHTS).
  labels: LabelTune[];
}

const DEFAULT_LABEL: LabelTune = {
  dx: 0,
  dy: 0,
  dotDx: 0,
  dotDy: 0,
  dotSize: 6, // h-1.5 = 0.375rem = 6px
  lineDx: 0,
  lineDy: 0,
  lineWidth: 1.3, // matches ConnectorLines strokeWidth
  lineOpacity: 1,
};

// Mirrors the values currently baked into ChipVisual.tsx — leaving every
// slider untouched reproduces the committed look exactly. (Matias's
// hand-tuned 2026-07-16 second-pass values. Position nudges — label dx/dy
// and line dx/dy — were folded back into HIGHLIGHTS[].pos and the desktop
// conn.d/from/to, so they reset to zero here; absolute values like dot
// offsets/sizes and line widths live here as the committed numbers.
// lineOpacity >1 clamps to 1 in CSS, so 1 is the effective maximum.)
export const DEFAULT_TUNE: Tune = {
  chip: { scale: 0.58, x: 0, y: 0, z: -0.97, rx: 0.0884, ry: 0, rz: 0 },
  galaxy: { x: -0.1, y: 0.14, z: -0.93, scale: 0.91, rx: -0.87, ry: -0.05, rz: -0.35 },
  dust: { fineSize: 0.027, fineOpacity: 0.92, coarseSize: 0.055, coarseOpacity: 0.79 },
  minis: { scale: 1.24, radius: 1.25, x: -0.28, y: 0.32, z: 0.24 },
  stars: { size: 0.046, opacity: 0.92, x: 0, y: 0, z: 0 },
  labels: [
    /* Rich in BCAAs */ { ...DEFAULT_LABEL, dotDx: 60, dotDy: 20, lineWidth: 1.9 },
    /* High in Leucine */ { ...DEFAULT_LABEL, dotDx: -4, dotDy: 1 },
    /* Essential Amino Acids */ { ...DEFAULT_LABEL, dotDx: 112, dotDy: 20, dotSize: 7, lineWidth: 2 },
    /* Vitamin B12 */ { ...DEFAULT_LABEL, lineWidth: 1.9 },
    /* Calcium */ { ...DEFAULT_LABEL, dotDx: 99 },
    /* Phosphorus */ { ...DEFAULT_LABEL, dotDx: -3 },
  ],
};

function cloneTune(t: Tune): Tune {
  return JSON.parse(JSON.stringify(t));
}

function Row({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-12 shrink-0 text-[10px] uppercase tracking-wide text-white/50">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 w-full accent-[#d8b55b]"
      />
      <input
        type="number"
        step={step}
        value={Math.round(value * 1000) / 1000}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v)) onChange(v);
        }}
        className="w-14 shrink-0 rounded border border-white/15 bg-white/5 px-1 py-0.5 text-right text-[10px] text-white/80 outline-none focus:border-[#d8b55b]/60"
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export default function DebugPanel({
  tune,
  setTune,
  labelNames,
}: {
  tune: Tune;
  setTune: (t: Tune) => void;
  labelNames: string[];
}) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [openLabel, setOpenLabel] = useState<number | null>(null);

  const patchChip = (k: keyof Tune["chip"], v: number) =>
    setTune({ ...tune, chip: { ...tune.chip, [k]: v } });
  const patchGalaxy = (k: keyof Tune["galaxy"], v: number) =>
    setTune({ ...tune, galaxy: { ...tune.galaxy, [k]: v } });
  const patchDust = (k: keyof Tune["dust"], v: number) =>
    setTune({ ...tune, dust: { ...tune.dust, [k]: v } });
  const patchMinis = (k: keyof Tune["minis"], v: number) =>
    setTune({ ...tune, minis: { ...tune.minis, [k]: v } });
  const patchStars = (k: keyof Tune["stars"], v: number) =>
    setTune({ ...tune, stars: { ...tune.stars, [k]: v } });
  const patchLabel = (i: number, k: keyof LabelTune, v: number) => {
    const labels = tune.labels.slice();
    labels[i] = { ...labels[i], [k]: v };
    setTune({ ...tune, labels });
  };

  const copy = async () => {
    const text = JSON.stringify(tune, null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard may be unavailable — values are still in the console
    }
    console.log("[ChipVisual tune]", tune);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed right-3 top-3 z-[9999] w-[300px] rounded-xl border border-white/15 bg-black/85 p-3 font-mono text-white shadow-2xl backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wide text-[#e8cd8a]">Hero Visual Tuning</span>
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-white/70 hover:bg-white/10"
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open && (
        <div className="max-h-[80vh] space-y-3 overflow-y-auto pr-1">
          <Section title="Chip (the crisp)">
            <Row label="Scale" value={tune.chip.scale} min={0.4} max={1.1} step={0.005} onChange={(v) => patchChip("scale", v)} />
            <Row label="Pos X" value={tune.chip.x} min={-1.5} max={1.5} step={0.01} onChange={(v) => patchChip("x", v)} />
            <Row label="Pos Y" value={tune.chip.y} min={-1.5} max={1.5} step={0.01} onChange={(v) => patchChip("y", v)} />
            <Row label="Pos Z" value={tune.chip.z} min={-2} max={1.5} step={0.01} onChange={(v) => patchChip("z", v)} />
            <Row label="Rot X" value={tune.chip.rx} min={-Math.PI} max={Math.PI} step={0.01} onChange={(v) => patchChip("rx", v)} />
            <Row label="Rot Y" value={tune.chip.ry} min={-Math.PI} max={Math.PI} step={0.01} onChange={(v) => patchChip("ry", v)} />
            <Row label="Rot Z" value={tune.chip.rz} min={-Math.PI} max={Math.PI} step={0.01} onChange={(v) => patchChip("rz", v)} />
          </Section>

          <Section title="Galaxy (whole disc group)">
            <Row label="Pos X" value={tune.galaxy.x} min={-2} max={2} step={0.01} onChange={(v) => patchGalaxy("x", v)} />
            <Row label="Pos Y" value={tune.galaxy.y} min={-2} max={2} step={0.01} onChange={(v) => patchGalaxy("y", v)} />
            <Row label="Pos Z" value={tune.galaxy.z} min={-2} max={2} step={0.01} onChange={(v) => patchGalaxy("z", v)} />
            <Row label="Scale" value={tune.galaxy.scale} min={0.3} max={1.5} step={0.005} onChange={(v) => patchGalaxy("scale", v)} />
            <Row label="Rot X" value={tune.galaxy.rx} min={-1.5} max={0.5} step={0.01} onChange={(v) => patchGalaxy("rx", v)} />
            <Row label="Rot Y" value={tune.galaxy.ry} min={-1} max={1} step={0.01} onChange={(v) => patchGalaxy("ry", v)} />
            <Row label="Rot Z" value={tune.galaxy.rz} min={-1} max={1} step={0.01} onChange={(v) => patchGalaxy("rz", v)} />
          </Section>

          <Section title="Dust (gold disc particles)">
            <Row label="Fine Sz" value={tune.dust.fineSize} min={0.005} max={0.12} step={0.001} onChange={(v) => patchDust("fineSize", v)} />
            <Row label="Fine Op" value={tune.dust.fineOpacity} min={0} max={1} step={0.01} onChange={(v) => patchDust("fineOpacity", v)} />
            <Row label="Crse Sz" value={tune.dust.coarseSize} min={0.005} max={0.15} step={0.001} onChange={(v) => patchDust("coarseSize", v)} />
            <Row label="Crse Op" value={tune.dust.coarseOpacity} min={0} max={1} step={0.01} onChange={(v) => patchDust("coarseOpacity", v)} />
          </Section>

          <Section title="Mini crisps (orbiting)">
            <Row label="Scale" value={tune.minis.scale} min={0.2} max={3} step={0.01} onChange={(v) => patchMinis("scale", v)} />
            <Row label="Radius" value={tune.minis.radius} min={0.3} max={2.5} step={0.01} onChange={(v) => patchMinis("radius", v)} />
            <Row label="Pos X" value={tune.minis.x} min={-2} max={2} step={0.01} onChange={(v) => patchMinis("x", v)} />
            <Row label="Pos Y" value={tune.minis.y} min={-2} max={2} step={0.01} onChange={(v) => patchMinis("y", v)} />
            <Row label="Pos Z" value={tune.minis.z} min={-2} max={2} step={0.01} onChange={(v) => patchMinis("z", v)} />
          </Section>

          <Section title="Stars (backdrop specks)">
            <Row label="Size" value={tune.stars.size} min={0.005} max={0.1} step={0.001} onChange={(v) => patchStars("size", v)} />
            <Row label="Opacity" value={tune.stars.opacity} min={0} max={1} step={0.01} onChange={(v) => patchStars("opacity", v)} />
            <Row label="Pos X" value={tune.stars.x} min={-2} max={2} step={0.01} onChange={(v) => patchStars("x", v)} />
            <Row label="Pos Y" value={tune.stars.y} min={-2} max={2} step={0.01} onChange={(v) => patchStars("y", v)} />
            <Row label="Pos Z" value={tune.stars.z} min={-2} max={2} step={0.01} onChange={(v) => patchStars("z", v)} />
          </Section>

          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Nutrition labels
            </div>
            <div className="space-y-1">
              {labelNames.map((name, i) => {
                const isOpen = openLabel === i;
                return (
                  <div key={name} className="rounded border border-white/10">
                    <button
                      onClick={() => setOpenLabel(isOpen ? null : i)}
                      className="flex w-full items-center justify-between px-1.5 py-1 text-left text-[10px] text-white/70 hover:bg-white/5"
                    >
                      <span className="truncate">{name}</span>
                      <span className="ml-1 shrink-0 text-white/40">{isOpen ? "–" : "+"}</span>
                    </button>
                    {isOpen && (
                      <div className="space-y-2 px-1.5 pb-2">
                        <div>
                          <div className="mb-0.5 text-[9px] uppercase tracking-wider text-[#e8cd8a]/70">Whole label</div>
                          <div className="space-y-1">
                            <Row label="Pos X" value={tune.labels[i].dx} min={-250} max={250} step={1} onChange={(v) => patchLabel(i, "dx", v)} />
                            <Row label="Pos Y" value={tune.labels[i].dy} min={-250} max={250} step={1} onChange={(v) => patchLabel(i, "dy", v)} />
                          </div>
                        </div>
                        <div>
                          <div className="mb-0.5 text-[9px] uppercase tracking-wider text-[#e8cd8a]/70">Dot</div>
                          <div className="space-y-1">
                            <Row label="Pos X" value={tune.labels[i].dotDx} min={-150} max={150} step={1} onChange={(v) => patchLabel(i, "dotDx", v)} />
                            <Row label="Pos Y" value={tune.labels[i].dotDy} min={-150} max={150} step={1} onChange={(v) => patchLabel(i, "dotDy", v)} />
                            <Row label="Size" value={tune.labels[i].dotSize} min={2} max={24} step={0.5} onChange={(v) => patchLabel(i, "dotSize", v)} />
                          </div>
                        </div>
                        <div>
                          <div className="mb-0.5 text-[9px] uppercase tracking-wider text-[#e8cd8a]/70">Connector line</div>
                          <div className="space-y-1">
                            <Row label="Pos X" value={tune.labels[i].lineDx} min={-250} max={250} step={1} onChange={(v) => patchLabel(i, "lineDx", v)} />
                            <Row label="Pos Y" value={tune.labels[i].lineDy} min={-250} max={250} step={1} onChange={(v) => patchLabel(i, "lineDy", v)} />
                            <Row label="Width" value={tune.labels[i].lineWidth} min={0.2} max={5} step={0.1} onChange={(v) => patchLabel(i, "lineWidth", v)} />
                            <Row label="Opacity" value={tune.labels[i].lineOpacity} min={0} max={1} step={0.01} onChange={(v) => patchLabel(i, "lineOpacity", v)} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={copy}
              className="flex-1 rounded border border-[#d8b55b]/40 bg-[#d8b55b]/10 px-2 py-1 text-[10px] font-medium text-[#e8cd8a] hover:bg-[#d8b55b]/20"
            >
              {copied ? "Copied!" : "Copy JSON"}
            </button>
            <button
              onClick={() => setTune(cloneTune(DEFAULT_TUNE))}
              className="flex-1 rounded border border-white/15 px-2 py-1 text-[10px] text-white/70 hover:bg-white/10"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
