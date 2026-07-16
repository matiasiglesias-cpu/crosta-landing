"use client";

// TEMPORARY dev-only tuning UI for the hero 3D composition — gated out of
// production via NODE_ENV in ChipVisual.tsx. Remove this file (and the wiring
// in ChipVisual.tsx) once the numbers below are finalized and baked back into
// the real constants.
import { useState } from "react";

export interface Tune {
  chip: { scale: number; x: number; y: number; z: number };
  galaxy: { z: number; scale: number; rx: number; ry: number; rz: number };
  labels: { dx: number; dy: number }[];
}

// Mirrors the values currently baked into ChipVisual.tsx — leaving every
// slider untouched reproduces the committed look exactly. (These are
// Matias's hand-tuned 2026-07-16 values; label nudges were folded back
// into HIGHLIGHTS[].pos so they reset to zero here.)
export const DEFAULT_TUNE: Tune = {
  chip: { scale: 0.57, x: 0, y: 0, z: -1.07 },
  galaxy: { z: 1, scale: 0.855, rx: -0.87, ry: -0.05, rz: -0.35 },
  labels: [
    { dx: 0, dy: 0 },
    { dx: 0, dy: 0 },
    { dx: 0, dy: 0 },
    { dx: 0, dy: 0 },
    { dx: 0, dy: 0 },
    { dx: 0, dy: 0 },
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
      <span className="w-9 shrink-0 text-[10px] uppercase tracking-wide text-white/50">{label}</span>
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

  const patchChip = (k: keyof Tune["chip"], v: number) =>
    setTune({ ...tune, chip: { ...tune.chip, [k]: v } });
  const patchGalaxy = (k: keyof Tune["galaxy"], v: number) =>
    setTune({ ...tune, galaxy: { ...tune.galaxy, [k]: v } });
  const patchLabel = (i: number, k: "dx" | "dy", v: number) => {
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
    <div className="fixed right-3 top-3 z-[9999] w-[280px] rounded-xl border border-white/15 bg-black/85 p-3 font-mono text-white shadow-2xl backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wide text-[#e8cd8a]">
          Hero Visual Tuning
        </span>
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-white/70 hover:bg-white/10"
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open && (
        <div className="max-h-[75vh] space-y-3 overflow-y-auto pr-1">
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Chip
            </div>
            <div className="space-y-1">
              <Row label="Scale" value={tune.chip.scale} min={0.4} max={1.1} step={0.005} onChange={(v) => patchChip("scale", v)} />
              <Row label="X" value={tune.chip.x} min={-1} max={1} step={0.01} onChange={(v) => patchChip("x", v)} />
              <Row label="Y" value={tune.chip.y} min={-1} max={1} step={0.01} onChange={(v) => patchChip("y", v)} />
              <Row label="Z (depth)" value={tune.chip.z} min={-1.5} max={1.5} step={0.01} onChange={(v) => patchChip("z", v)} />
            </div>
          </div>

          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Galaxy
            </div>
            <div className="space-y-1">
              <Row label="Z" value={tune.galaxy.z} min={-2} max={2} step={0.01} onChange={(v) => patchGalaxy("z", v)} />
              <Row label="Scale" value={tune.galaxy.scale} min={0.3} max={1.5} step={0.005} onChange={(v) => patchGalaxy("scale", v)} />
              <Row label="RotX" value={tune.galaxy.rx} min={-1.5} max={0.5} step={0.01} onChange={(v) => patchGalaxy("rx", v)} />
              <Row label="RotY" value={tune.galaxy.ry} min={-1} max={1} step={0.01} onChange={(v) => patchGalaxy("ry", v)} />
              <Row label="RotZ" value={tune.galaxy.rz} min={-1} max={1} step={0.01} onChange={(v) => patchGalaxy("rz", v)} />
            </div>
          </div>

          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Labels (px nudge)
            </div>
            <div className="space-y-2">
              {labelNames.map((name, i) => (
                <div key={name}>
                  <div className="mb-0.5 truncate text-[10px] text-white/60">{name}</div>
                  <div className="space-y-1">
                    <Row label="dX" value={tune.labels[i].dx} min={-200} max={200} step={1} onChange={(v) => patchLabel(i, "dx", v)} />
                    <Row label="dY" value={tune.labels[i].dy} min={-200} max={200} step={1} onChange={(v) => patchLabel(i, "dy", v)} />
                  </div>
                </div>
              ))}
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
