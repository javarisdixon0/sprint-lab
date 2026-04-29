"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// SPRINT LAB — paste this file into src/App.jsx
// Required dependency: npm install recharts
// ─────────────────────────────────────────────────────────────────────────────

const STORE_KEYS = {
  intake: "sprint_lab_intake_v2",
  post: "sprint_lab_post_v2",
  baselines: "sprint_lab_baselines_v2",
};

const SORENESS_SPOTS = [
  "Hamstrings",
  "Achilles",
  "Lower Back",
  "Quads",
  "Calves",
  "Hip Flexors",
  "Glutes",
  "Knees",
  "Ankles",
  "Shins",
  "Upper Back",
  "Shoulders",
  "Groin",
  "IT Band",
  "Feet",
];

const MOVEMENTS_POOL = [
  "Trap-Bar Deadlift",
  "Back Squat",
  "Front Squat",
  "Romanian Deadlift",
  "Bulgarian Split Squat",
  "Hip Thrust",
  "GHR",
  "Nordic Curl",
  "Bench Press",
  "Pull-Ups",
  "Dips",
  "Landmine Squat",
  "10m Starts",
  "20m Acceleration",
  "30m Acceleration",
  "Flying 10m",
  "Flying 20m",
  "Hill Sprints",
  "Sled Sprints",
  "Curve Sprints",
  "A-March",
  "A-Skip",
  "B-Skip",
  "Wall Drives",
  "Wicket Runs",
  "Dribbles",
  "Straight-Leg Bounds",
  "Pogo Jumps",
  "Drop Jumps",
  "Bounds",
  "Hurdle Hops",
  "Box Jumps",
  "Depth Jumps",
  "Broad Jumps",
  "Hang Power Clean",
  "Jump Squat",
  "Med Ball Throws",
  "Takeoff Drills",
  "Penultimate Drills",
];

const BASELINE_GROUPS = {
  Anthropometry: [
    { key: "wingspan", label: "Wingspan", unit: "cm" },
    { key: "inseam", label: "Inseam", unit: "cm" },
  ],
  Jumps: [
    { key: "standingVertical", label: "Standing Vertical Jump", unit: "in" },
    { key: "standingBroad", label: "Standing Broad Jump", unit: "m" },
    { key: "singleLegVertL", label: "Single-Leg Vertical (Left)", unit: "in" },
    { key: "singleLegVertR", label: "Single-Leg Vertical (Right)", unit: "in" },
    { key: "singleLegBroadL", label: "Single-Leg Broad (Left)", unit: "m" },
    { key: "singleLegBroadR", label: "Single-Leg Broad (Right)", unit: "m" },
    { key: "tripleBroad", label: "Triple Broad Jump", unit: "m" },
    { key: "rsi", label: "Reactive Strength Index", unit: "" },
  ],
  "Sprint Times": [
    { key: "sprint10m", label: "10m Sprint", unit: "s" },
    { key: "sprint20m", label: "20m Sprint", unit: "s" },
    { key: "sprint30m", label: "30m Sprint", unit: "s" },
    { key: "sprint50m", label: "50m Sprint", unit: "s" },
    { key: "flying10m", label: "Flying 10m", unit: "s" },
    { key: "flying20m", label: "Flying 20m", unit: "s" },
    { key: "sprint150m", label: "150m Time Trial", unit: "s" },
    { key: "sprint300m", label: "300m Time Trial", unit: "s" },
    { key: "maxVelocity", label: "Max Velocity", unit: "m/s" },
    { key: "reactionTime", label: "Reaction Time", unit: "s" },
  ],
  Strength: [
    { key: "backSquat3rm", label: "Back Squat 3RM", unit: "lb" },
    { key: "trapDL3rm", label: "Trap-Bar Deadlift 3RM", unit: "lb" },
    { key: "benchPress3rm", label: "Bench Press 3RM", unit: "lb" },
    { key: "hipThrust5rm", label: "Hip Thrust 5RM", unit: "lb" },
    { key: "rdl5rm", label: "Romanian Deadlift 5RM", unit: "lb" },
    { key: "bssL5rm", label: "Bulgarian Split Squat 5RM (Left)", unit: "lb" },
    { key: "bssR5rm", label: "Bulgarian Split Squat 5RM (Right)", unit: "lb" },
  ],
  "Bodyweight Strength": [
    { key: "pullUpMax", label: "Pull-Ups Max Reps", unit: "reps" },
    { key: "pushUpMax", label: "Push-Ups Max", unit: "reps" },
    { key: "dipMax", label: "Dip Max Reps", unit: "reps" },
    { key: "nordicReps", label: "Nordic Hamstring Reps", unit: "reps" },
    { key: "hangingKneeRaise", label: "Hanging Knee Raise Max", unit: "reps" },
  ],
  Core: [
    { key: "plankHold", label: "Plank Max Hold", unit: "s" },
    { key: "sidePlankR", label: "Side Plank (Right)", unit: "s" },
    { key: "sidePlankL", label: "Side Plank (Left)", unit: "s" },
    { key: "copenhagR", label: "Copenhagen Plank (Right)", unit: "s" },
    { key: "copenhagL", label: "Copenhagen Plank (Left)", unit: "s" },
    { key: "backExtHold", label: "Back Extension Hold", unit: "s" },
  ],
  "Calf & Ankle": [
    { key: "calfRaiseL", label: "Single-Leg Calf Raise (Left)", unit: "reps" },
    { key: "calfRaiseR", label: "Single-Leg Calf Raise (Right)", unit: "reps" },
    { key: "soleusRaise", label: "Seated Soleus Raise", unit: "reps" },
  ],
  Power: [
    { key: "pogoCount10s", label: "10-Second Pogo Jump Count", unit: "reps" },
    { key: "medBallChest", label: "Med Ball Chest Throw", unit: "m" },
  ],
};

const LOWER_IS_BETTER = new Set([
  "sprint10m",
  "sprint20m",
  "sprint30m",
  "sprint50m",
  "flying10m",
  "flying20m",
  "sprint150m",
  "sprint300m",
  "reactionTime",
]);

const ALL_METRICS = Object.values(BASELINE_GROUPS).flat();

// ── HELPERS ──────────────────────────────────────────────────────────────────
function dateOnly(date = new Date()) {
  const copy = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return copy.toISOString().slice(0, 10);
}

function timeOnly(date = new Date()) {
  return date.toTimeString().slice(0, 5);
}

function safeNumber(value) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function readStore(key, fallback) {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`Could not read ${key}`, error);
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not save ${key}`, error);
  }
}

async function copyText(text) {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  }
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getMetricLabel(key) {
  return ALL_METRICS.find((m) => m.key === key)?.label || key;
}

function getMetricUnit(key) {
  return ALL_METRICS.find((m) => m.key === key)?.unit || "";
}

function fmtIntake(f = {}) {
  return [
    `=== DAILY INTAKE — ${f.date || "No date"} @ ${f.time || "--:--"} ===`,
    `Date: ${f.date || "—"}`,
    `Time: ${f.time || "—"}`,
    `Body Weight (fasted): ${f.bodyWeight || "—"} lb`,
    `CNS / Readiness: ${f.cnsScore ?? "—"}/10`,
    `Sleep Last Night: ${f.sleepHours || "—"} hrs`,
    `Soreness: ${f.soreness?.length ? f.soreness.join(", ") : "None"}`,
    f.sorenessNotes ? `Soreness Notes: ${f.sorenessNotes}` : null,
    `Track Workout: ${f.trackWorkout || "None"}`,
    `Sprint Work: ${f.sprintWork || "None"}`,
    `Track Drills: ${f.trackDrills || "None"}`,
    `Spike Usage: ${f.spikeUsage || "No"}`,
    `New Measurements: ${f.newMeasurements || "None"}`,
    `Movements Used This Week: ${f.movementsUsed?.length ? f.movementsUsed.join(", ") : "None"}`,
    f.notes ? `Notes: ${f.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function fmtPost(p = {}) {
  return [
    `=== POST-WORKOUT REPORT CARD — ${p.date || "No date"} ===`,
    `1. LIFTS`,
    `   Main Lift 1:     ${p.lift1 || "N/A"}`,
    `   Main Lift 2:     ${p.lift2 || "N/A"}`,
    `   Power Movement:  ${p.powerMovement || "N/A"}`,
    `   Accessories:     ${p.accessories || "N/A"}`,
    `2. RPE:  Lift 1: ${p.rpe1 ?? "—"}/10  |  Lift 2: ${p.rpe2 ?? "—"}/10`,
    `3. Failed Reps: ${p.failedReps || "No"}`,
    `4. Post-Workout Fatigue: ${p.postFatigue ?? "—"}/10`,
    `   New Soreness: ${p.newSoreness?.length ? p.newSoreness.join(", ") : "None"}`,
    `5. Post Body Weight: ${p.postBodyWeight || "Not measured"} lb`,
    `6. Vertical Jump: ${p.verticalJump || "Not tested"}`,
    `   Broad Jump: ${p.broadJump || "Not tested"}`,
    `7. Sprint Timing: ${p.sprintTiming || "Not tested"}`,
    `8. PBs / Notes / Concerns: ${p.concerns || "None"}`,
    `Nutrition Met: ${p.nutritionMet || "—"}`,
    `Phase Status: ${p.phaseStatus || "—"}`,
  ].join("\n");
}

function fmtMemory(intake, post, selectedDate = "") {
  const i = intake || {};
  const p = post || {};
  const date = i.date || p.date || selectedDate || "[Not set]";
  const movementPreview = i.movementsUsed?.length ? i.movementsUsed.slice(0, 4).join(", ") : "None";

  return `SESSION MEMORY BLOCK
Date: ${date}
Body Weight: ${i.bodyWeight || "—"} lb fasted
CNS/Readiness: ${i.cnsScore ?? "?"}/10 pre → ${p.postFatigue ?? "?"}/10 post
Sleep Last Night: ${i.sleepHours || "?"} hours
Soreness Flags: ${i.soreness?.length ? i.soreness.join(", ") : "None"}
Main Lift 1: ${p.lift1 || "[Awaiting report]"}
Main Lift 2: ${p.lift2 || "[Awaiting report]"}
Power Movement: ${p.powerMovement || "[Awaiting report]"}
Sprint Work: ${i.sprintWork || "[Awaiting report]"}
Track Drills: ${i.trackDrills || "[Awaiting report]"}
Vertical Jump: ${p.verticalJump || "Not tested"}
Broad Jump: ${p.broadJump || "Not tested"}
Movements This Week: ${movementPreview}
Nutrition Met: ${p.nutritionMet || "[Awaiting report]"}
Flags/Concerns: ${p.concerns || i.notes || "None"}
Phase Status: ${p.phaseStatus || "[Awaiting report]"}

Copy this into your notes app or AI coach chat.`;
}

function createInitialIntake() {
  return {
    date: dateOnly(),
    time: timeOnly(),
    bodyWeight: "",
    sleepHours: "",
    cnsScore: 7,
    soreness: [],
    sorenessNotes: "",
    trackWorkout: "",
    sprintWork: "",
    trackDrills: "",
    spikeUsage: "No",
    newMeasurements: "",
    movementsUsed: [],
    notes: "",
  };
}

function createInitialPost() {
  return {
    date: dateOnly(),
    lift1: "",
    lift2: "",
    powerMovement: "",
    accessories: "",
    rpe1: 7,
    rpe2: 7,
    failedReps: "No",
    postFatigue: 5,
    newSoreness: [],
    postBodyWeight: "",
    verticalJump: "",
    broadJump: "",
    sprintTiming: "",
    concerns: "",
    nutritionMet: "Yes",
    phaseStatus: "Progressing",
  };
}

function buildPbMap(records) {
  const pb = {};
  records.forEach((record) => {
    Object.entries(record.metrics || {}).forEach(([key, value]) => {
      const n = safeNumber(value);
      if (n === null) return;
      if (pb[key] === undefined) {
        pb[key] = n;
      } else if (LOWER_IS_BETTER.has(key)) {
        pb[key] = Math.min(pb[key], n);
      } else {
        pb[key] = Math.max(pb[key], n);
      }
    });
  });
  return pb;
}

// ── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  card: {
    background: "linear-gradient(180deg, #151a2c 0%, #101523 100%)",
    border: "1px solid #222a40",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.28)",
  },
  input: {
    background: "#121a2c",
    border: "1px solid #2a3652",
    borderRadius: 12,
    color: "#F0F0F0",
    padding: "13px 14px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  },
  label: {
    color: "#777",
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 5,
    display: "block",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #b48cff, #7f71ff)",
    color: "#fff",
    border: "none",
    minHeight: 48,
    padding: "12px 20px",
    borderRadius: 12,
    cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  btnOutline: {
    background: "transparent",
    color: "#c4ccff",
    border: "1px solid #586794",
    minHeight: 48,
    padding: "12px 16px",
    borderRadius: 12,
    cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  sectionTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 30,
    color: "#d7deff",
    letterSpacing: 3,
    marginBottom: 18,
  },
  subTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 17,
    color: "#C8FF00",
    letterSpacing: 2,
    marginBottom: 14,
  },
};

// ── SMALL COMPONENTS ─────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <span style={S.label}>{label}</span>
      {children}
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder = "", type = "text", step, style }) {
  return (
    <Field label={label}>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{ ...S.input, ...style }}
      />
    </Field>
  );
}

function TextArea({ label, value, onChange, placeholder = "", rows = 3 }) {
  return (
    <Field label={label}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ ...S.input, resize: "vertical" }}
      />
    </Field>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={S.input}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

function RangeSlider({ label, value, onChange, min = 1, max = 10, color = "#C8FF00" }) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={S.label}>{label}</span>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color, lineHeight: 1 }}>
          {value}
          <span style={{ fontSize: 12, color: "#666" }}>/{max}</span>
        </span>
      </div>
      <div style={{ position: "relative", height: 5, background: "#2A2A2A", borderRadius: 999 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 999,
          }}
        />
      </div>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ width: "100%", marginTop: 8, accentColor: color, cursor: "pointer" }}
      />
    </div>
  );
}

function CopyBtn({ text, label, copied, onCopy, children }) {
  const active = copied === label;
  return (
    <button
      type="button"
      onClick={() => onCopy(text, label)}
      style={{
        ...S.btnOutline,
        ...(active ? { background: "#212d4b", color: "#f5f7ff", borderColor: "#8598d3" } : {}),
      }}
    >
      {active ? "✅ COPIED" : children || "📋 COPY"}
    </button>
  );
}

function Tag({ label, active, onClick, activeColor = "#C8FF00" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 11px",
        borderRadius: 20,
        cursor: "pointer",
        border: active ? `1px solid ${activeColor}` : "1px solid #2A2A2A",
        background: active ? "#192200" : "#181818",
        color: active ? activeColor : "#777",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      }}
    >
      {label}
    </button>
  );
}

function SorenessGrid({ selected, onToggle }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8 }}>
      {SORENESS_SPOTS.map((spot) => {
        const active = selected.includes(spot);
        return (
          <Tag
            key={spot}
            label={spot}
            active={active}
            activeColor="#FF6B6B"
            onClick={() => onToggle(spot)}
          />
        );
      })}
    </div>
  );
}

function EmptyState({ text = "Log more sessions to see data." }) {
  return (
    <div style={{ color: "#444", fontSize: 11, padding: "24px 0", textAlign: "center", letterSpacing: 1 }}>
      {text.toUpperCase()}
    </div>
  );
}

function Alert({ tone = "warning", children }) {
  const color = tone === "danger" ? "#FF6B6B" : "#FFB800";
  const border = tone === "danger" ? "#FF453A" : "#FFB800";
  const background = tone === "danger" ? "#2A0000" : "#1a1400";

  return (
    <div style={{ background, border: `1px solid ${border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, color, fontSize: 11 }}>
      {children}
    </div>
  );
}

// ── INTAKE TAB ───────────────────────────────────────────────────────────────
function IntakeTab({ sessions, onSave, onCopy, copied }) {
  const last = sessions.at(-1);
  const [form, setForm] = useState(createInitialIntake);
  const [saved, setSaved] = useState(false);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleArray = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  };

  const movementCounts = useMemo(() => {
    const counts = {};
    sessions.slice(-7).forEach((session) => {
      (session.movementsUsed || []).forEach((movement) => {
        counts[movement] = (counts[movement] || 0) + 1;
      });
    });
    return counts;
  }, [sessions]);

  const overused = Object.entries(movementCounts)
    .filter(([, count]) => count >= 2)
    .map(([movement]) => movement);

  const handleSave = () => {
    onSave({ ...form, savedAt: new Date().toISOString(), id: crypto.randomUUID?.() || `${Date.now()}` });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const formatted = fmtIntake(form);

  return (
    <div>
      <div style={S.sectionTitle}>⚡ DAILY INTAKE</div>

      {Number(form.cnsScore) >= 8 && (
        <Alert tone="danger">⚠️ CNS / readiness score is high. Keep today controlled and avoid stacking extra high-intensity work.</Alert>
      )}
      {overused.length > 0 && (
        <Alert>⚡ Rotation flag: {overused.join(", ")} used 2+ times in recent logs. Consider rotating stress.</Alert>
      )}

      <div style={S.card}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
          <TextInput label="Date" type="date" value={form.date} onChange={(value) => update("date", value)} />
          <TextInput label="Time" type="time" value={form.time} onChange={(value) => update("time", value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 14, alignItems: "end" }}>
          <TextInput
            label="Fasted Body Weight (lb)"
            type="number"
            value={form.bodyWeight}
            onChange={(value) => update("bodyWeight", value)}
            placeholder="143"
          />
          {last?.bodyWeight && (
            <button
              type="button"
              onClick={() => update("bodyWeight", last.bodyWeight)}
              style={{ ...S.btnOutline, fontSize: 10, padding: "10px 12px", whiteSpace: "nowrap" }}
            >
              Same ({last.bodyWeight})
            </button>
          )}
        </div>
        <div style={{ marginBottom: 14 }}>
          <TextInput
            label="Sleep Last Night (hours)"
            type="number"
            step="0.1"
            value={form.sleepHours}
            onChange={(value) => update("sleepHours", value)}
            placeholder="8"
          />
        </div>
        <RangeSlider label="CNS / Readiness Score" value={form.cnsScore} onChange={(value) => update("cnsScore", value)} />
      </div>

      <div style={S.card}>
        <span style={S.label}>Soreness Locations</span>
        <SorenessGrid selected={form.soreness} onToggle={(spot) => toggleArray("soreness", spot)} />
        <div style={{ marginTop: 12 }}>
          <TextArea
            label="Soreness Notes"
            rows={2}
            value={form.sorenessNotes}
            onChange={(value) => update("sorenessNotes", value)}
            placeholder="e.g. Left hamstring tightness, 3/10 severity..."
          />
        </div>
      </div>

      <div style={S.card}>
        <TextArea
          label="Today's Track Workout"
          rows={3}
          value={form.trackWorkout}
          onChange={(value) => update("trackWorkout", value)}
          placeholder="e.g. 4x30m acceleration @ 95%, 3 min rest, no spikes. Felt sharp."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 12 }}>
          <TextInput
            label="Sprint Work Summary"
            value={form.sprintWork}
            onChange={(value) => update("sprintWork", value)}
            placeholder="e.g. 4x30m @ 95%"
          />
          <TextInput
            label="Track Drills"
            value={form.trackDrills}
            onChange={(value) => update("trackDrills", value)}
            placeholder="e.g. A-skip, wall drives"
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <SelectField
            label="Spike Usage"
            value={form.spikeUsage}
            onChange={(value) => update("spikeUsage", value)}
            options={["No", "Yes — Nike Air Zoom Maxfly 2", "Yes — Other Spike"]}
          />
        </div>
      </div>

      <div style={S.card}>
        <span style={S.label}>Movements Used This Week</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8 }}>
          {MOVEMENTS_POOL.map((movement) => (
            <Tag
              key={movement}
              label={movement}
              active={form.movementsUsed.includes(movement)}
              onClick={() => toggleArray("movementsUsed", movement)}
            />
          ))}
        </div>
      </div>

      <div style={S.card}>
        <TextArea
          label="New Measurements Available"
          rows={2}
          value={form.newMeasurements}
          onChange={(value) => update("newMeasurements", value)}
          placeholder="e.g. 10m: 1.72s, Standing vertical: 28in, Back squat 3RM: 185lb"
        />
        <div style={{ marginTop: 12 }}>
          <TextArea
            label="Additional Notes for AI Coach"
            rows={2}
            value={form.notes}
            onChange={(value) => update("notes", value)}
            placeholder="Anything else your coach should know..."
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <button type="button" onClick={handleSave} style={S.btnPrimary}>
          {saved ? "✅ SAVED" : "SAVE INTAKE"}
        </button>
        <CopyBtn text={formatted} label="intake" copied={copied} onCopy={onCopy}>
          📋 COPY FOR AI COACH
        </CopyBtn>
      </div>

      <div style={{ ...S.card, border: "1px solid #1E2E00" }}>
        <span style={S.label}>Formatted Output Preview</span>
        <pre style={{ color: "#777", fontSize: 10, whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.7 }}>{formatted}</pre>
      </div>
    </div>
  );
}

// ── POST-WORKOUT TAB ─────────────────────────────────────────────────────────
function PostWorkoutTab({ sessions, onSave, onCopy, copied }) {
  const [form, setForm] = useState(createInitialPost);
  const [saved, setSaved] = useState(false);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleSore = (spot) => {
    setForm((current) => ({
      ...current,
      newSoreness: current.newSoreness.includes(spot)
        ? current.newSoreness.filter((item) => item !== spot)
        : [...current.newSoreness, spot],
    }));
  };

  const rpeWarn = Number(form.rpe1) >= 9 || Number(form.rpe2) >= 9;
  const formatted = fmtPost(form);

  const handleSave = () => {
    onSave({ ...form, savedAt: new Date().toISOString(), id: crypto.randomUUID?.() || `${Date.now()}` });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div>
      <div style={S.sectionTitle}>📊 POST-WORKOUT REPORT CARD</div>
      <div style={S.card}>
        <TextInput label="Date" type="date" value={form.date} onChange={(value) => update("date", value)} />
      </div>

      <div style={S.card}>
        <div style={S.subTitle}>Lifts & RPE</div>
        <div style={{ display: "grid", gap: 12 }}>
          <TextInput label="Main Lift 1" value={form.lift1} onChange={(value) => update("lift1", value)} placeholder="e.g. Trap-Bar DL — 3x3 @ 185lb" />
          <TextInput label="Main Lift 2" value={form.lift2} onChange={(value) => update("lift2", value)} placeholder="e.g. Hip Thrust — 4x6 @ 155lb" />
          <TextInput label="Power Movement" value={form.powerMovement} onChange={(value) => update("powerMovement", value)} placeholder="e.g. Jump Squat — 4x4" />
          <TextInput label="Accessories" value={form.accessories} onChange={(value) => update("accessories", value)} placeholder="e.g. GHR 3x8, RDL 3x6 @ 95lb" />
        </div>

        <div style={{ marginTop: 14 }}>
          <RangeSlider label="RPE — Main Lift 1" value={form.rpe1} onChange={(value) => update("rpe1", value)} />
          <RangeSlider label="RPE — Main Lift 2" value={form.rpe2} onChange={(value) => update("rpe2", value)} />
        </div>

        {rpeWarn && <Alert tone="danger">⚠️ RPE 9+ logged. Next lift session should start conservative.</Alert>}

        <SelectField
          label="Failed Any Reps?"
          value={form.failedReps}
          onChange={(value) => update("failedReps", value)}
          options={["No", "Yes — Lift 1", "Yes — Lift 2", "Yes — Power Movement", "Yes — Multiple"]}
        />
      </div>

      <div style={S.card}>
        <RangeSlider label="Post-Workout Fatigue" value={form.postFatigue} onChange={(value) => update("postFatigue", value)} color="#FF6B6B" />
        <span style={S.label}>New Soreness</span>
        <SorenessGrid selected={form.newSoreness} onToggle={toggleSore} />
        <div style={{ marginTop: 14 }}>
          <TextInput
            label="Post Body Weight (lb)"
            type="number"
            value={form.postBodyWeight}
            onChange={(value) => update("postBodyWeight", value)}
            placeholder="143"
          />
        </div>
      </div>

      <div style={S.card}>
        <div style={S.subTitle}>Performance Data</div>
        <div style={{ display: "grid", gap: 12 }}>
          <TextInput label="Vertical Jump Result" value={form.verticalJump} onChange={(value) => update("verticalJump", value)} placeholder="e.g. 28.5 in" />
          <TextInput label="Broad Jump Result" value={form.broadJump} onChange={(value) => update("broadJump", value)} placeholder="e.g. 2.48 m" />
          <TextInput label="Sprint Timing Notes" value={form.sprintTiming} onChange={(value) => update("sprintTiming", value)} placeholder="e.g. 10m: 1.71s, 30m: 3.95s" />
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 14 }}>
          <SelectField label="Nutrition Met" value={form.nutritionMet} onChange={(value) => update("nutritionMet", value)} options={["Yes", "Partial", "No"]} />
          <SelectField label="Phase Status" value={form.phaseStatus} onChange={(value) => update("phaseStatus", value)} options={["Progressing", "Stagnant", "Overreaching"]} />
        </div>
        <TextArea
          label="PBs / Technique Notes / Concerns"
          value={form.concerns}
          onChange={(value) => update("concerns", value)}
          placeholder="New PBs, technique observations, pain signals, anything notable..."
        />
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <button type="button" onClick={handleSave} style={S.btnPrimary}>
          {saved ? "✅ SAVED" : "SAVE REPORT"}
        </button>
        <CopyBtn text={formatted} label="post" copied={copied} onCopy={onCopy}>
          📋 COPY FOR AI COACH
        </CopyBtn>
      </div>

      <div style={{ ...S.card, border: "1px solid #1E2E00" }}>
        <span style={S.label}>Formatted Output Preview</span>
        <pre style={{ color: "#777", fontSize: 10, whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.7 }}>{formatted}</pre>
      </div>
    </div>
  );
}

// ── MEMORY TAB ───────────────────────────────────────────────────────────────
function MemoryTab({ intakeSessions, postSessions, onCopy, copied }) {
  const allDates = useMemo(() => {
    return [...new Set([...intakeSessions.map((s) => s.date), ...postSessions.map((s) => s.date)])]
      .filter(Boolean)
      .sort()
      .reverse();
  }, [intakeSessions, postSessions]);

  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    if (!selectedDate && allDates[0]) setSelectedDate(allDates[0]);
  }, [allDates, selectedDate]);

  const intake = intakeSessions.filter((session) => session.date === selectedDate).at(-1);
  const post = postSessions.filter((session) => session.date === selectedDate).at(-1);
  const block = fmtMemory(intake, post, selectedDate);
  const combined = [intake ? fmtIntake(intake) : "", post ? fmtPost(post) : ""].filter(Boolean).join("\n\n");

  return (
    <div>
      <div style={S.sectionTitle}>📋 SESSION MEMORY BLOCK</div>
      <div style={S.card}>
        <SelectField label="Select Session Date" value={selectedDate} onChange={setSelectedDate} options={allDates.length ? allDates : [""]} />
        {!allDates.length ? (
          <EmptyState text="No sessions yet" />
        ) : (
          <>
            <pre
              style={{
                background: "#0A0A0A",
                border: "1px solid #2E3E00",
                borderRadius: 8,
                padding: 16,
                color: "#C8FF00",
                fontSize: 11,
                whiteSpace: "pre-wrap",
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.65,
                overflowX: "auto",
                marginTop: 16,
              }}
            >
              {block}
            </pre>
            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <button type="button" onClick={() => onCopy(block, "memory")} style={S.btnPrimary}>
                {copied === "memory" ? "✅ COPIED" : "📋 COPY MEMORY BLOCK"}
              </button>
              <CopyBtn text={combined || block} label="memfull" copied={copied} onCopy={onCopy}>
                📋 COPY FULL SESSION
              </CopyBtn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── BASELINES TAB ────────────────────────────────────────────────────────────
function BaselinesTab({ records, onSave, onCopy, copied }) {
  const [form, setForm] = useState({});
  const [date, setDate] = useState(dateOnly());
  const [expanded, setExpanded] = useState("Jumps");
  const [saved, setSaved] = useState(false);

  const pb = useMemo(() => buildPbMap(records), [records]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const currentNewPb = (key, value) => {
    const n = safeNumber(value);
    if (n === null || pb[key] === undefined) return false;
    return LOWER_IS_BETTER.has(key) ? n < pb[key] : n > pb[key];
  };

  const handleSave = () => {
    const metrics = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== "" && value !== null && value !== undefined));
    if (!Object.keys(metrics).length) return;

    onSave({ date, metrics, savedAt: new Date().toISOString(), id: crypto.randomUUID?.() || `${Date.now()}` });
    setForm({});
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const formatForCopy = () => {
    let out = `=== ATHLETIC BASELINE LOG — ${date} ===\n`;
    Object.entries(BASELINE_GROUPS).forEach(([group, metrics]) => {
      const lines = metrics
        .filter((metric) => form[metric.key])
        .map((metric) => `  ${metric.label}: ${form[metric.key]} ${metric.unit}`.trim());
      if (lines.length) out += `\n[${group}]\n${lines.join("\n")}\n`;
    });
    return out.trim();
  };

  return (
    <div>
      <div style={S.sectionTitle}>🎯 ATHLETIC BASELINES</div>

      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={S.label}>Test Date</span>
          <span style={{ color: "#666", fontSize: 10 }}>
            {records.length} record{records.length !== 1 ? "s" : ""} saved
          </span>
        </div>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} style={S.input} />
      </div>

      {Object.entries(BASELINE_GROUPS).map(([group, metrics]) => (
        <div key={group} style={S.card}>
          <button
            type="button"
            onClick={() => setExpanded(expanded === group ? "" : group)}
            style={{ background: "none", border: "none", cursor: "pointer", width: "100%", padding: 0, textAlign: "left" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: expanded === group ? "#C8FF00" : "#777" }}>{group}</span>
              <span style={{ color: "#C8FF00", fontSize: 12 }}>{expanded === group ? "▲" : "▼"}</span>
            </div>
          </button>

          {expanded === group && (
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
              {metrics.map((metric) => {
                const isNewPb = currentNewPb(metric.key, form[metric.key]);
                return (
                  <div key={metric.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5, gap: 8 }}>
                      <span style={{ ...S.label, margin: 0 }}>{metric.label}</span>
                      {pb[metric.key] !== undefined && (
                        <span style={{ fontSize: 9, color: "#555", whiteSpace: "nowrap" }}>
                          PB: {pb[metric.key]}{metric.unit}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="any"
                      value={form[metric.key] || ""}
                      onChange={(event) => update(metric.key, event.target.value)}
                      placeholder={metric.unit || "—"}
                      style={{ ...S.input, border: isNewPb ? "1px solid #C8FF00" : "1px solid #2A2A2A" }}
                    />
                    {isNewPb && <div style={{ color: "#C8FF00", fontSize: 9, marginTop: 4, letterSpacing: 1 }}>🏆 NEW PB</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button type="button" onClick={handleSave} style={S.btnPrimary}>
          {saved ? "✅ SAVED" : "SAVE BASELINES"}
        </button>
        <CopyBtn text={formatForCopy()} label="baselines" copied={copied} onCopy={onCopy}>
          📋 COPY BASELINE LOG
        </CopyBtn>
      </div>
    </div>
  );
}

// ── PROGRESS TAB ─────────────────────────────────────────────────────────────
function ProgressTab({ intakeSessions, postSessions, baselineRecords }) {
  const [selectedMetric, setSelectedMetric] = useState("standingVertical");
  const CHART = { grid: "#1A1A1A", tick: "#777", tooltip: "#1E1E1E", primary: "#C8FF00", red: "#FF453A" };

  const cnsTrend = intakeSessions.slice(-14).map((session) => ({
    day: session.date?.slice(5) || "—",
    CNS: Number(session.cnsScore) || 0,
  }));

  const bwVert = intakeSessions
    .slice(-14)
    .map((session) => {
      const post = postSessions.find((p) => p.date === session.date);
      return {
        day: session.date?.slice(5) || "—",
        "Weight (lb)": safeNumber(session.bodyWeight),
        "Vertical (in)": safeNumber(post?.verticalJump),
      };
    })
    .filter((row) => row["Weight (lb)"] !== null || row["Vertical (in)"] !== null);

  const metricChart = baselineRecords
    .filter((record) => record.metrics?.[selectedMetric])
    .map((record) => ({ date: record.date?.slice(5) || "—", value: safeNumber(record.metrics[selectedMetric]) }))
    .filter((row) => row.value !== null);

  const recentVerts = postSessions
    .map((session) => safeNumber(session.verticalJump))
    .filter((value) => value !== null)
    .slice(-4);
  const stagnant = recentVerts.length >= 4 && Math.max(...recentVerts) - Math.min(...recentVerts) < 0.5;

  const tooltip = <Tooltip contentStyle={{ background: CHART.tooltip, border: "1px solid #2A2A2A", color: "#F0F0F0", fontSize: 11 }} />;

  return (
    <div>
      <div style={S.sectionTitle}>📈 PROGRESS CHARTS</div>

      {stagnant && (
        <Alert tone="danger">⚠️ Stagnation detected: vertical jump has stayed within 0.5 inches across 4 recent logs.</Alert>
      )}

      <div style={S.card}>
        <div style={S.subTitle}>CNS / Readiness Trend</div>
        {cnsTrend.length > 1 ? (
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={cnsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="day" tick={{ fill: CHART.tick, fontSize: 10 }} />
              <YAxis domain={[0, 10]} tick={{ fill: CHART.tick, fontSize: 10 }} />
              {tooltip}
              <Line type="monotone" dataKey="CNS" stroke={CHART.primary} strokeWidth={2} dot={{ r: 3, fill: CHART.primary }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </div>

      <div style={S.card}>
        <div style={S.subTitle}>Body Weight vs Vertical Jump</div>
        <div style={{ color: "#555", fontSize: 10, letterSpacing: 1, marginBottom: 14 }}>POWER-TO-WEIGHT KPI</div>
        {bwVert.length > 1 ? (
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={bwVert}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="day" tick={{ fill: CHART.tick, fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fill: CHART.tick, fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: CHART.tick, fontSize: 10 }} />
              {tooltip}
              <Legend wrapperStyle={{ fontSize: 10, color: "#777" }} />
              <Line yAxisId="left" type="monotone" dataKey="Weight (lb)" stroke={CHART.red} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line yAxisId="right" type="monotone" dataKey="Vertical (in)" stroke={CHART.primary} strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </div>

      <div style={S.card}>
        <div style={S.subTitle}>Baseline Metric Progress</div>
        <div style={{ marginBottom: 14 }}>
          <SelectField
            label="Select Metric"
            value={selectedMetric}
            onChange={setSelectedMetric}
            options={ALL_METRICS.map((metric) => metric.key)}
          />
          <div style={{ color: "#555", fontSize: 10, marginTop: 6 }}>
            Showing: {getMetricLabel(selectedMetric)} {getMetricUnit(selectedMetric) ? `(${getMetricUnit(selectedMetric)})` : ""}
          </div>
        </div>
        {metricChart.length > 1 ? (
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={metricChart}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="date" tick={{ fill: CHART.tick, fontSize: 10 }} />
              <YAxis tick={{ fill: CHART.tick, fontSize: 10 }} />
              {tooltip}
              <Line type="monotone" dataKey="value" stroke={CHART.primary} strokeWidth={2} dot={{ r: 4, fill: CHART.primary }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

// ── WEEKLY VIEW TAB ──────────────────────────────────────────────────────────
function WeeklyTab({ intakeSessions, postSessions, onCopy, copied }) {
  const last7 = Array.from({ length: 7 }, (_, index) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + index);
    return dateOnly(d);
  });

  const blocks = last7.map((date) => ({
    date,
    dayName: new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    intake: intakeSessions.filter((session) => session.date === date).at(-1),
    post: postSessions.filter((session) => session.date === date).at(-1),
  }));

  const fullWeekText = blocks
    .map(({ date, intake, post }) => (intake || post ? fmtMemory(intake, post, date) : `=== ${date} — No data logged ===`))
    .join(`\n\n${"─".repeat(46)}\n\n`);

  const fullWeekAI = blocks
    .map(({ date, intake, post }) => {
      if (!intake && !post) return `=== ${date} — No data ===`;
      return [intake ? fmtIntake(intake) : "", post ? fmtPost(post) : ""].filter(Boolean).join("\n\n");
    })
    .join(`\n\n${"═".repeat(46)}\n\n`);

  return (
    <div>
      <div style={S.sectionTitle}>📅 WEEKLY VIEW</div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button type="button" onClick={() => onCopy(fullWeekText, "week-memory")} style={S.btnPrimary}>
          {copied === "week-memory" ? "✅ COPIED" : "📋 COPY FULL WEEK"}
        </button>
        <CopyBtn text={fullWeekAI} label="week-ai" copied={copied} onCopy={onCopy}>
          📋 COPY AI FORMAT
        </CopyBtn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
        {blocks.map(({ date, dayName, intake, post }) => {
          const hasData = intake || post;
          return (
            <div key={date} style={{ ...S.card, border: hasData ? "1px solid #2A2A2A" : "1px dashed #1A1A1A", marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: hasData ? "#C8FF00" : "#333", letterSpacing: 2 }}>{dayName}</span>
                <span style={{ fontSize: 10, color: "#555" }}>{date.slice(5)}</span>
              </div>

              {hasData ? (
                <div>
                  {intake && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, color: "#777" }}>CNS</span>
                        <span style={{ fontSize: 10, color: Number(intake.cnsScore) >= 8 ? "#FF453A" : "#C8FF00", fontWeight: "bold" }}>{intake.cnsScore}/10</span>
                        <span style={{ fontSize: 10, color: "#777", marginLeft: 6 }}>BW</span>
                        <span style={{ fontSize: 10, color: "#F0F0F0" }}>{intake.bodyWeight || "—"} lb</span>
                      </div>
                      {intake.soreness?.length > 0 && (
                        <div style={{ fontSize: 10, color: "#FF6B6B", marginTop: 2 }}>
                          ⚠ {intake.soreness.slice(0, 2).join(", ")}
                          {intake.soreness.length > 2 ? ` +${intake.soreness.length - 2}` : ""}
                        </div>
                      )}
                    </div>
                  )}

                  {post && (
                    <div style={{ borderTop: "1px solid #1E1E1E", paddingTop: 8, marginTop: 4 }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 10, color: "#777" }}>Fatigue</span>
                        <span style={{ fontSize: 10, color: Number(post.postFatigue) >= 8 ? "#FF453A" : "#F0F0F0" }}>{post.postFatigue}/10</span>
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: post.phaseStatus === "Progressing" ? "#C8FF00" : post.phaseStatus === "Overreaching" ? "#FF453A" : "#FFB800",
                          marginBottom: 3,
                        }}
                      >
                        {post.phaseStatus === "Progressing" ? "▲" : post.phaseStatus === "Overreaching" ? "⚠" : "—"} {post.phaseStatus}
                      </div>
                      {post.verticalJump && <div style={{ fontSize: 10, color: "#C8FF00" }}>VJ: {post.verticalJump}</div>}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onCopy(fmtMemory(intake, post, date), `day-${date}`)}
                    style={{ ...S.btnOutline, padding: "6px 10px", fontSize: 9, marginTop: 10, width: "100%", letterSpacing: 0 }}
                  >
                    {copied === `day-${date}` ? "✅ COPIED" : "📋 COPY DAY"}
                  </button>
                </div>
              ) : (
                <div style={{ color: "#333", fontSize: 11, paddingTop: 4 }}>No data logged</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── HISTORY TAB ──────────────────────────────────────────────────────────────
function HistoryTab({ intakeSessions, postSessions, baselineRecords, onDelete }) {
  const entries = useMemo(() => {
    return [
      ...intakeSessions.map((item, index) => ({ type: "intake", label: "Daily Intake", item, index, date: item.date, savedAt: item.savedAt })),
      ...postSessions.map((item, index) => ({ type: "post", label: "Post-Workout", item, index, date: item.date, savedAt: item.savedAt })),
      ...baselineRecords.map((item, index) => ({ type: "baselines", label: "Baseline", item, index, date: item.date, savedAt: item.savedAt })),
    ].sort((a, b) => new Date(b.savedAt || b.date) - new Date(a.savedAt || a.date));
  }, [intakeSessions, postSessions, baselineRecords]);

  return (
    <div>
      <div style={S.sectionTitle}>🗂 HISTORY</div>
      {!entries.length ? (
        <div style={S.card}>
          <EmptyState text="No saved records yet" />
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {entries.map((entry) => (
            <div key={`${entry.type}-${entry.index}-${entry.savedAt || entry.date}`} style={{ ...S.card, marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ color: "#C8FF00", fontSize: 12, fontWeight: "bold" }}>{entry.label}</div>
                  <div style={{ color: "#777", fontSize: 10, marginTop: 4 }}>
                    {entry.date || "No date"} • {entry.savedAt ? new Date(entry.savedAt).toLocaleString() : "Saved"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(entry.type, entry.index)}
                  style={{ ...S.btnOutline, color: "#FF6B6B", borderColor: "#FF453A", padding: "7px 10px", fontSize: 9 }}
                >
                  DELETE
                </button>
              </div>
              {entry.type === "baselines" && (
                <div style={{ color: "#777", fontSize: 10, marginTop: 10 }}>
                  {Object.keys(entry.item.metrics || {}).length} metric{Object.keys(entry.item.metrics || {}).length !== 1 ? "s" : ""} logged
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("intake");
  const [intakeSessions, setIntakeSessions] = useState([]);
  const [postSessions, setPostSessions] = useState([]);
  const [baselineRecords, setBaselineRecords] = useState([]);
  const [copied, setCopied] = useState("");
  const [pbAlerts, setPbAlerts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const importRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    setIntakeSessions(readStore(STORE_KEYS.intake, []));
    setPostSessions(readStore(STORE_KEYS.post, []));
    setBaselineRecords(readStore(STORE_KEYS.baselines, []));
    setLoaded(true);
  }, []);

  const handleCopy = async (text, label) => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(label);
      setCopyStatus("Copied full day.");
      setTimeout(() => setCopied(""), 2200);
      setTimeout(() => setCopyStatus(""), 2200);
    } else {
      window.prompt("Copy manually:", text);
    }
  };

  const buildFullDayText = (date) => {
    const intake = intakeSessions.filter((s) => s.date === date).at(-1) || {};
    const post = postSessions.filter((s) => s.date === date).at(-1) || {};
    return fmtMemory(intake, post, date || dateOnly());
  };

  const copyTodayFullDay = () => handleCopy(buildFullDayText(dateOnly()), "full-day");

  const saveIntake = (record) => {
    const updated = [...intakeSessions, record];
    setIntakeSessions(updated);
    writeStore(STORE_KEYS.intake, updated);
  };

  const savePost = (record) => {
    const updated = [...postSessions, record];
    setPostSessions(updated);
    writeStore(STORE_KEYS.post, updated);
  };

  const saveBaseline = (record) => {
    const alerts = [];
    const previousPb = buildPbMap(baselineRecords);

    Object.entries(record.metrics || {}).forEach(([key, value]) => {
      const current = safeNumber(value);
      if (current === null || previousPb[key] === undefined) return;
      const isPb = LOWER_IS_BETTER.has(key) ? current < previousPb[key] : current > previousPb[key];
      if (isPb) alerts.push(`🏆 NEW PB — ${getMetricLabel(key)}: ${current}${getMetricUnit(key)}`);
    });

    const updated = [...baselineRecords, record];
    setBaselineRecords(updated);
    writeStore(STORE_KEYS.baselines, updated);
    if (alerts.length) setPbAlerts(alerts);
  };

  const deleteRecord = (type, index) => {
    if (!window.confirm("Delete this record?")) return;
    if (type === "intake") {
      const updated = intakeSessions.filter((_, i) => i !== index);
      setIntakeSessions(updated);
      writeStore(STORE_KEYS.intake, updated);
    }
    if (type === "post") {
      const updated = postSessions.filter((_, i) => i !== index);
      setPostSessions(updated);
      writeStore(STORE_KEYS.post, updated);
    }
    if (type === "baselines") {
      const updated = baselineRecords.filter((_, i) => i !== index);
      setBaselineRecords(updated);
      writeStore(STORE_KEYS.baselines, updated);
    }
  };

  const exportData = () => {
    downloadJson(`sprint-lab-backup-${dateOnly()}.json`, {
      version: 2,
      exportedAt: new Date().toISOString(),
      intakeSessions,
      postSessions,
      baselineRecords,
    });
  };

  const importData = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const nextIntake = Array.isArray(data.intakeSessions) ? data.intakeSessions : [];
      const nextPost = Array.isArray(data.postSessions) ? data.postSessions : [];
      const nextBaselines = Array.isArray(data.baselineRecords) ? data.baselineRecords : [];

      setIntakeSessions(nextIntake);
      setPostSessions(nextPost);
      setBaselineRecords(nextBaselines);
      writeStore(STORE_KEYS.intake, nextIntake);
      writeStore(STORE_KEYS.post, nextPost);
      writeStore(STORE_KEYS.baselines, nextBaselines);
      setPbAlerts(["✅ Backup imported successfully."]);
    } catch (error) {
      console.error(error);
      setPbAlerts(["⚠️ Import failed. Make sure this is a Sprint Lab backup JSON file."]);
    } finally {
      event.target.value = "";
    }
  };

  const clearAllData = () => {
    if (!window.confirm("Clear all Sprint Lab data from this browser? Export a backup first if you need it.")) return;
    setIntakeSessions([]);
    setPostSessions([]);
    setBaselineRecords([]);
    writeStore(STORE_KEYS.intake, []);
    writeStore(STORE_KEYS.post, []);
    writeStore(STORE_KEYS.baselines, []);
    setPbAlerts(["All local data cleared."]);
  };

  const tabs = [
    { id: "intake", label: "Today" },
    { id: "post", label: "Log" },
    { id: "progress", label: "Trends" },
    { id: "history", label: "History" },
    { id: "memory", label: "Report" },
    { id: "baselines", label: "Baselines" },
    { id: "weekly", label: "Weekly" },
  ];

  if (!loaded) {
    return (
      <div style={{ background: "#080808", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#C8FF00", letterSpacing: 4 }}>LOADING...</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #070b14; overflow-x: hidden; }
        #root { overflow-x: hidden; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0A0A0A; }
        ::-webkit-scrollbar-thumb { background: #2A2A2A; border-radius: 999px; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { opacity: 0.4; }
        select option { background: #1E1E1E; color: #F0F0F0; }
        button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible {
          outline: 2px solid #b99aff;
          outline-offset: 2px;
        }
        .field-stack { display: grid; gap: 14px; }
        .section-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .desktop-nav { display: none; }
        .mobile-nav { position: fixed; left: 0; right: 0; bottom: 0; background: rgba(13,19,33,0.95); border-top: 1px solid #2a3652; display: grid; grid-template-columns: repeat(5, 1fr); z-index: 50; padding: 8px 8px calc(8px + env(safe-area-inset-bottom)); gap: 6px; backdrop-filter: blur(8px);}
        .mobile-nav button { min-height: 48px; border-radius: 12px; border: 1px solid #2a3652; background: #101828; color: #a9b8d8; font-size: 11px; font-weight: 700; }
        .mobile-nav button.active { background: #b48cff; color: #fff; border-color: #b48cff; }
        @media (min-width: 900px){ .desktop-nav{display:block;} .mobile-nav{display:none;} .section-grid{grid-template-columns: repeat(2,minmax(0,1fr));} }
      `}</style>

      <div style={{ background: "#070b14", minHeight: "100vh", color: "#F0F0F0", fontFamily: "'JetBrains Mono', monospace" }}>
        <header style={{ background: "#0d1321", borderBottom: "1px solid #2a3652", padding: "14px 16px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: "#d8deff", letterSpacing: 4, lineHeight: 1 }}>SPRINT LAB</div>
              <div style={{ fontSize: 9, color: "#666", letterSpacing: 2.5, marginTop: 2 }}>PERFORMANCE TRACKING SYSTEM</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "#777", letterSpacing: 1 }}>{intakeSessions.length} intake logs</div>
              <div style={{ fontSize: 10, color: "#777", letterSpacing: 1 }}>{postSessions.length} post logs</div>
              <div style={{ fontSize: 10, color: "#777", letterSpacing: 1 }}>{baselineRecords.length} baselines</div>
            </div>
          </div>
        </header>

        {pbAlerts.length > 0 && (
          <div style={{ background: "#0E1A00", borderBottom: "1px solid #C8FF00", padding: "10px 20px" }}>
            <div style={{ maxWidth: 960, margin: "0 auto" }}>
              {pbAlerts.map((alert, index) => (
                <div key={`${alert}-${index}`} style={{ color: alert.includes("⚠️") ? "#FFB800" : "#C8FF00", fontSize: 11, marginBottom: 2 }}>
                  {alert}
                </div>
              ))}
              <button type="button" onClick={() => setPbAlerts([])} style={{ ...S.btnOutline, fontSize: 9, padding: "4px 10px", marginTop: 6 }}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        <nav className="desktop-nav" style={{ borderBottom: "1px solid #1A1A1A", overflowX: "auto", background: "#0A0A0A" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", display: "flex" }}>
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                style={{
                  padding: "14px 16px",
                  background: tab === item.id ? "#b48cff" : "transparent",
                  color: tab === item.id ? "#fff" : "#9aa8c4",
                  border: "none",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fontWeight: "bold",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  letterSpacing: 1,
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <main style={{ padding: "16px", maxWidth: 960, margin: "0 auto", paddingBottom: "140px" }}>
          <div style={{ ...S.card, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" onClick={copyTodayFullDay} style={{ ...S.btnPrimary, minWidth: 180 }}>
              {copied === "full-day" ? "✅ COPIED FULL DAY" : "📋 COPY FULL DAY"}
            </button>
            <button type="button" onClick={exportData} style={S.btnPrimary}>
              EXPORT BACKUP
            </button>
            <button type="button" onClick={() => importRef.current?.click()} style={S.btnOutline}>
              IMPORT BACKUP
            </button>
            <button type="button" onClick={clearAllData} style={{ ...S.btnOutline, borderColor: "#FF453A", color: "#FF6B6B" }}>
              CLEAR DATA
            </button>
            <input ref={importRef} type="file" accept="application/json" onChange={importData} style={{ display: "none" }} />
          </div>
          {copyStatus && <div style={{ color: "#b8c6f5", marginBottom: 12, fontSize: 12 }}>{copyStatus}</div>}

          {tab === "intake" && <IntakeTab sessions={intakeSessions} onSave={saveIntake} onCopy={handleCopy} copied={copied} />}
          {tab === "post" && <PostWorkoutTab sessions={postSessions} onSave={savePost} onCopy={handleCopy} copied={copied} />}
          {tab === "memory" && <MemoryTab intakeSessions={intakeSessions} postSessions={postSessions} onCopy={handleCopy} copied={copied} />}
          {tab === "baselines" && <BaselinesTab records={baselineRecords} onSave={saveBaseline} onCopy={handleCopy} copied={copied} />}
          {tab === "progress" && <ProgressTab intakeSessions={intakeSessions} postSessions={postSessions} baselineRecords={baselineRecords} />}
          {tab === "weekly" && <WeeklyTab intakeSessions={intakeSessions} postSessions={postSessions} onCopy={handleCopy} copied={copied} />}
          {tab === "history" && <HistoryTab intakeSessions={intakeSessions} postSessions={postSessions} baselineRecords={baselineRecords} onDelete={deleteRecord} />}
        </main>
        <nav className="mobile-nav" aria-label="Primary">
          {tabs.slice(0, 5).map((item) => (
            <button key={item.id} type="button" className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
