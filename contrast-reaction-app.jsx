import { useState } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: "#080d18", surface: "#0f1624", surfaceAlt: "#151e2e", surfaceHover: "#1a2540",
  border: "#1d2b42", borderLight: "#243352",
  accent: "#e63946", accentSoft: "rgba(230,57,70,0.14)",
  yellow: "#f4a261", yellowSoft: "rgba(244,162,97,0.13)",
  green: "#2dc653",
  blue: "#4cc9f0", blueSoft: "rgba(76,201,240,0.11)",
  purple: "#a78bfa",
  text: "#eef2f7", textMuted: "#7a8fa8", textDim: "#3d5066",
  emergency: "#ff3b30", emergencySoft: "rgba(255,59,48,0.16)",
};

// ─── PEDIATRIC VITAL SIGNS ───────────────────────────────────────────────────
// Source: Cleveland Clinic Health. "Pediatric Vital Signs Chart."
// https://health.clevelandclinic.org/pediatric-vital-signs
const PEDS_VITALS = [
  { age: "0–3 mo",   bp: "65–85 / 45–55",   hr: "110–160", rr: "30–60" },
  { age: "3–6 mo",   bp: "70–90 / 50–65",   hr: "100–150", rr: "30–45" },
  { age: "6–12 mo",  bp: "80–100 / 55–65",  hr: "90–130",  rr: "25–40" },
  { age: "1–3 yr",   bp: "90–105 / 55–70",  hr: "80–125",  rr: "20–30" },
  { age: "3–6 yr",   bp: "95–110 / 60–75",  hr: "70–115",  rr: "20–25" },
  { age: "6–12 yr",  bp: "100–120 / 60–75", hr: "60–100",  rr: "14–22" },
  { age: "12–18 yr", bp: "100–120 / 70–80", hr: "60–100",  rr: "12–18" },
];

// ─── LOGIC MAP ────────────────────────────────────────────────────────────────
// Primary source: ACR Manual on Contrast Media (2020)
// Quick-reference cards: ACR Contrast Cards (Adult & Pediatric)
// Differences noted: Cards simplify severity into single protocols per reaction.
// App follows the full ACR Manual for completeness. No clinical contradictions found.
// Contrast Extravasation: consistent across both sources.
const REACTIONS = {
  hives: {
    id: "hives", label: "Hives / Urticaria", icon: "🔴",
    severities: {
      mild: {
        label: "Mild", sublabel: "Scattered and/or transient",
        steps: [{ type: "obs", text: "Observe until hives resolving (≥ 20–30 min). Monitor vitals q 15 min." }],
        drugs: {
          adult: [
            { name: "Diphenhydramine (Benadryl®)", dose: "25–50 mg PO", note: "Can cause drowsiness" },
            { name: "Fexofenadine (Allegra®)", dose: "180 mg PO", note: "Less drowsy — better if patient is driving" },
            { name: "Cetirizine (Zyrtec®)", dose: "— confirm institutional dose", note: "Placeholder — add your institutional dose", placeholder: true },
          ],
          child: [
            { name: "Diphenhydramine (Benadryl®)", dose: "1 mg/kg (max 50 mg) PO / IM / IV", note: "IV: administer slowly over 1–2 min. May worsen hypotension." },
            { name: "Cetirizine (Zyrtec®)", dose: "— confirm institutional dose", note: "Placeholder — add your institutional dose", placeholder: true },
          ],
        },
        call911: false,
      },
      moderate: {
        label: "Moderate", sublabel: "More numerous / bothersome",
        steps: [
          { type: "action", text: "Monitor vitals q 15 min" },
          { type: "action", text: "Preserve IV access" },
        ],
        drugs: {
          adult: [
            { name: "Diphenhydramine (Benadryl®)", dose: "25–50 mg PO, IM, or IV", note: "IV: administer slowly over 1–2 min" },
            { name: "Fexofenadine (Allegra®)", dose: "180 mg PO", note: "Alternative; less drowsy" },
            { name: "Cetirizine (Zyrtec®)", dose: "— confirm institutional dose", note: "Placeholder — add your institutional dose", placeholder: true },
          ],
          child: [
            { name: "Diphenhydramine (Benadryl®)", dose: "1 mg/kg (max 50 mg) PO / IM / IV", note: "IV: administer slowly over 1–2 min" },
            { name: "Cetirizine (Zyrtec®)", dose: "— confirm institutional dose", note: "Placeholder — add your institutional dose", placeholder: true },
          ],
        },
        call911: false,
      },
      severe: {
        label: "Severe", sublabel: "Widespread and/or progressive",
        steps: [
          { type: "action", text: "Monitor vitals q 15 min" },
          { type: "action", text: "Preserve IV access" },
          { type: "obs", text: "If associated with hypotension or respiratory distress → treat as Anaphylaxis" },
        ],
        drugs: {
          adult: [
            { name: "Diphenhydramine (Benadryl®)", dose: "50 mg PO, IM, or IV", note: "IV: slowly over 1–2 min. May cause or worsen hypotension." },
          ],
          child: [
            { name: "Diphenhydramine (Benadryl®)", dose: "1 mg/kg (max 50 mg) PO / IM / IV", note: "IV: slowly over 1–2 min. May worsen hypotension." },
          ],
        },
        call911: false,
      },
    },
  },

  erythema: {
    id: "erythema", label: "Diffuse Erythema", icon: "🟠",
    severities: {
      normotensive: {
        label: "Normotensive", sublabel: "BP stable",
        steps: [
          { type: "action", text: "Preserve IV access" },
          { type: "action", text: "Monitor vitals + pulse ox" },
          { type: "action", text: "O₂ by mask 6–10 L/min" },
          { type: "obs",    text: "No other treatment usually needed" },
        ],
        drugs: { adult: [], child: [] }, call911: false,
      },
      hypotensive: {
        label: "Hypotensive", sublabel: "BP low — treat as Anaphylaxis",
        steps: [
          { type: "action", text: "Preserve IV access" },
          { type: "action", text: "Monitor vitals + pulse ox" },
          { type: "action", text: "O₂ by mask 6–10 L/min" },
          { type: "action", text: "Elevate legs > 60°" },
        ],
        drugs: {
          adult: [
            { name: "Normal Saline 0.9% OR Lactated Ringer's", dose: "1,000 mL rapidly (wide open)", note: "First line" },
            { name: "Epinephrine (IV) — if profound or unresponsive to fluids", dose: "1 mL of 1:10,000 (0.1 mg) slowly into running IV; repeat q few min up to 10 mL (1 mg) total", note: "Preferred over IM in hypotensive patient" },
            { name: "Epinephrine (IM) — if no IV access", dose: "0.3 mL of 1:1,000 (0.3 mg); repeat q 5–15 min up to 1 mg total", note: "" },
            { name: "Epinephrine auto-injector (EpiPen®)", dose: "0.3 mg fixed; repeat q 5–15 min up to 3×", note: "" },
          ],
          child: [
            { name: "Normal Saline 0.9% OR Lactated Ringer's", dose: "10–20 mL/kg (max 500–1,000 mL) wide open", note: "First line" },
            { name: "Epinephrine (IV)", dose: "0.1 mL/kg of 1:10,000 (0.01 mg/kg) slowly; max single dose 1 mL (0.1 mg); repeat q 5–15 min up to 1 mg total", note: "Preferred over IM in hypotensive patient" },
            { name: "Epinephrine (IM) — if no IV access", dose: "0.01 mL/kg of 1:1,000 (0.01 mg/kg); max 0.30 mL (0.30 mg); repeat q 5–15 min up to 1 mg total", note: "" },
            { name: "Epinephrine auto-injector", dose: "15–30 kg → EpiPen Jr® 0.15 mg | >30 kg → EpiPen® 0.30 mg | <15 kg → follow institutional guidelines", note: "" },
          ],
        },
        call911: true,
      },
    },
  },

  bronchospasm: {
    id: "bronchospasm", label: "Bronchospasm", icon: "🫁",
    severities: {
      mild: {
        label: "Mild", sublabel: "Expiratory wheeze, responds to inhaler",
        steps: [
          { type: "action", text: "Preserve IV access" },
          { type: "action", text: "Monitor vitals + pulse ox" },
          { type: "action", text: "O₂ by mask 6–10 L/min" },
        ],
        drugs: {
          adult: [{ name: "Albuterol inhaler (Beta-2 agonist)", dose: "2 puffs (90 mcg/puff = 180 mcg total); repeat up to 3×", note: "" }],
          child: [{ name: "Albuterol inhaler or nebulizer (Beta-2 agonist)", dose: "2 puffs (180 mcg total); repeat up to 3×", note: "" }],
        },
        call911: false, callNote: "Consider 911 based on completeness of response",
      },
      severeOrNonResponding: {
        label: "Severe / Not responding", sublabel: "Significant hypoxia or no response to inhaler",
        steps: [
          { type: "action", text: "Preserve IV access" },
          { type: "action", text: "Monitor vitals + pulse ox" },
          { type: "action", text: "O₂ by mask 6–10 L/min" },
        ],
        drugs: {
          adult: [
            { name: "Epinephrine (IM)", dose: "0.3 mL of 1:1,000 (0.3 mg); repeat q 5–15 min up to 1 mg total", note: "First line if not hypotensive" },
            { name: "Epinephrine auto-injector (EpiPen®)", dose: "0.3 mg fixed; repeat q 5–15 min up to 3×", note: "Alternative to IM" },
            { name: "Epinephrine (IV) — if hypotensive", dose: "1 mL of 1:10,000 (0.1 mg) slowly into running IV; repeat q few min up to 1 mg total", note: "Preferred route if hypotensive" },
            { name: "Albuterol inhaler (synergistic)", dose: "2 puffs (180 mcg total); repeat up to 3×", note: "Use WITH epinephrine" },
          ],
          child: [
            { name: "Epinephrine (IM)", dose: "0.01 mL/kg of 1:1,000 (0.01 mg/kg); max 0.30 mg; repeat q 5–15 min up to 1 mg total", note: "" },
            { name: "Epinephrine auto-injector", dose: "15–30 kg → EpiPen Jr® 0.15 mg | >30 kg → EpiPen® 0.30 mg | <15 kg → follow institutional guidelines", note: "" },
            { name: "Epinephrine (IV) — if hypotensive", dose: "0.1 mL/kg of 1:10,000 (0.01 mg/kg); slowly; max single 1 mL; repeat q 5–15 min up to 1 mg", note: "Preferred route if hypotensive" },
            { name: "Albuterol inhaler or nebulizer (synergistic)", dose: "2 puffs (180 mcg total); repeat up to 3×", note: "Use WITH epinephrine" },
          ],
        },
        call911: true,
      },
    },
  },

  laryngeal: {
    id: "laryngeal", label: "Laryngeal Edema", icon: "🚨",
    severities: {
      all: {
        label: "Inspiratory Stridor", sublabel: "Hoarseness / stridor / dyspnea",
        steps: [
          { type: "action", text: "Preserve IV access" },
          { type: "action", text: "Monitor vitals + pulse ox" },
          { type: "action", text: "O₂ by mask 6–10 L/min" },
        ],
        drugs: {
          adult: [
            { name: "Epinephrine (IM)", dose: "0.3 mL of 1:1,000 (0.3 mg); repeat q 5–15 min up to 1 mg total", note: "" },
            { name: "Epinephrine auto-injector (EpiPen®)", dose: "0.3 mg fixed; repeat q 5–15 min up to 3×", note: "" },
            { name: "Epinephrine (IV) — if hypotensive", dose: "1 mL of 1:10,000 (0.1 mg) slowly into running IV; repeat q few min up to 1 mg total", note: "Preferred if hypotensive" },
          ],
          child: [
            { name: "Epinephrine (IV or IM or auto-injector)", dose: "IV: 0.1 mL/kg of 1:10,000 slowly; max single 1 mL | IM: 0.01 mL/kg of 1:1,000; max 0.30 mg | Auto: 15–30 kg → 0.15 mg, >30 kg → 0.30 mg, <15 kg → institutional", note: "Preferred if hypotensive: IV" },
          ],
        },
        call911: true,
      },
    },
  },

  hypotension: {
    id: "hypotension", label: "Hypotension", icon: "📉",
    showPedsVitals: true,
    severities: {
      vagal: {
        label: "Vasovagal", sublabel: "Hypotension + Bradycardia (HR below normal for age)",
        steps: [
          { type: "action", text: "Preserve IV access; monitor vitals q 15 min" },
          { type: "action", text: "O₂ by mask 6–10 L/min" },
          { type: "action", text: "Elevate legs > 60°" },
          { type: "drug",   text: "IVF 0.9% NS wide open — adult: 1,000 mL | child: 10–20 mL/kg (max 500–1,000 mL)" },
          { type: "obs",    text: "If mild → no further treatment usually needed" },
        ],
        drugs: {
          adult: [
            { name: "Atropine (IV) — if refractory", dose: "0.6–1.0 mg into running IV; repeat up to 3 mg total", note: "" },
          ],
          child: [
            { name: "Atropine (IV) — if refractory", dose: "0.02 mg/kg IV; min 0.1 mg; max 1 mg (infants/children), 2 mg (adolescents)", note: "" },
          ],
        },
        call911: false, callNote: "Consider calling 911 if severe or unresponsive",
      },
      anaphylactoid: {
        label: "Anaphylactoid", sublabel: "Hypotension + Tachycardia (HR above normal for age)",
        steps: [
          { type: "action", text: "Preserve IV access; monitor vitals q 15 min" },
          { type: "action", text: "O₂ by mask 6–10 L/min" },
          { type: "action", text: "Elevate legs > 60°" },
          { type: "drug",   text: "IVF 0.9% NS wide open — adult: 1,000 mL | child: 10–20 mL/kg (max 500–1,000 mL)" },
        ],
        drugs: {
          adult: [
            { name: "Epinephrine (IM)", dose: "0.3 mL of 1:1,000 (0.3 mg); repeat q 5–15 min up to 1 mg total", note: "" },
            { name: "Epinephrine auto-injector (EpiPen®)", dose: "0.3 mg fixed; repeat q 5–15 min up to 3×", note: "" },
            { name: "Epinephrine (IV) — if profound hypotension", dose: "1 mL of 1:10,000 (0.1 mg) slowly into running IV; repeat q few min up to 1 mg total", note: "Preferred route if hypotensive" },
          ],
          child: [
            { name: "Epinephrine (IV or IM or auto-injector)", dose: "IV: 0.1 mL/kg of 1:10,000 slowly; max single 1 mL | IM: 0.01 mL/kg of 1:1,000; max 0.30 mg | Auto: 15–30 kg → 0.15 mg, >30 kg → 0.30 mg, <15 kg → institutional", note: "Can repeat q 5–15 min. IV preferred if hypotensive." },
          ],
        },
        call911: true,
      },
    },
  },

  arrest: {
    id: "arrest", label: "Unresponsive / Pulseless", icon: "🆘",
    severities: {
      all: {
        label: "CARDIAC ARREST", sublabel: "No pulse / unresponsive",
        steps: [
          { type: "emergency", text: "CALL 911 / ACTIVATE EMERGENCY RESPONSE NOW" },
          { type: "emergency", text: "START CPR IMMEDIATELY" },
          { type: "action",   text: "Get defibrillator / AED — apply ASAP; shock as indicated" },
        ],
        drugs: {
          adult: [{ name: "Epinephrine (IV) — between 2-min CPR cycles", dose: "1 mg IV push with flush", note: "Follow AHA ACLS guidelines" }],
          child: [{ name: "Epinephrine (IV) — between 2-min CPR cycles", dose: "0.1 mL/kg of 1:10,000 (0.01 mg/kg); max 10 mL (1 mg)", note: "Follow AHA PALS guidelines" }],
        },
        call911: true,
      },
    },
  },

  hypertension: {
    id: "hypertension", label: "Hypertensive Crisis", icon: "📈",
    severities: {
      all: {
        label: "Hypertensive Emergency", sublabel: "DBP > 120 or SBP > 200 + end-organ symptoms",
        steps: [
          { type: "action", text: "Preserve IV access" },
          { type: "action", text: "Monitor vitals + pulse ox" },
          { type: "action", text: "O₂ by mask 6–10 L/min" },
        ],
        drugs: {
          adult: [
            { name: "Labetalol (IV)", dose: "20 mg IV slowly over 2 min; double q 10 min (→ 40 → 80 mg)", note: "First line" },
            { name: "Nitroglycerin (SL) — if labetalol unavailable", dose: "0.4 mg tablet; repeat q 5–10 min", note: "Combine with Furosemide" },
            { name: "Furosemide (Lasix®) (IV)", dose: "20–40 mg IV slowly over 2 min", note: "Combine with NTG" },
          ],
          child: [{ name: "Consult pediatric hypertensive emergency protocol", dose: "—", note: "Call emergency response immediately" }],
        },
        call911: true,
      },
    },
  },

  pulmonary: {
    id: "pulmonary", label: "Pulmonary Edema", icon: "🫧",
    severities: {
      all: {
        label: "All Presentations", sublabel: "Hypoxia + crackles / frothy sputum",
        steps: [
          { type: "action", text: "Preserve IV access" },
          { type: "action", text: "Monitor vitals + pulse ox" },
          { type: "action", text: "O₂ by mask 6–10 L/min" },
          { type: "action", text: "Elevate head of bed" },
        ],
        drugs: {
          adult: [{ name: "Furosemide (Lasix®) (IV)", dose: "20–40 mg IV slowly over 2 min", note: "" }],
          child: [{ name: "Furosemide (Lasix®) (IV)", dose: "0.5–1.0 mg/kg IV over 2 min; max 40 mg", note: "" }],
        },
        call911: true,
      },
    },
  },

  seizure: {
    id: "seizure", label: "Seizure / Convulsion", icon: "⚡",
    severities: {
      all: {
        label: "All Presentations", sublabel: "",
        steps: [
          { type: "action", text: "Observe and protect patient" },
          { type: "action", text: "Turn patient on side (aspiration prevention)" },
          { type: "action", text: "Suction airway as needed" },
          { type: "action", text: "Preserve IV access; monitor vitals + pulse ox" },
          { type: "action", text: "O₂ by mask 6–10 L/min" },
        ],
        drugs: {
          adult: [{ name: "Lorazepam (IV) — if unremitting", dose: "2–4 mg IV slowly; max 4 mg", note: "" }],
          child: [{ name: "Call emergency response if unremitting", dose: "—", note: "" }],
        },
        call911: false, callNote: "Call 911 if seizure is unremitting",
      },
    },
  },

  extravasation: {
    id: "extravasation", label: "Contrast Extravasation", icon: "💉",
    showDischarge: true,
    severities: {
      all: {
        label: "Extravasation", sublabel: "Contrast outside the vein at injection site",
        steps: [
          { type: "action",    text: "Stop injection immediately" },
          { type: "action",    text: "Elevate the affected arm above heart level" },
          { type: "action",    text: "Apply cold compress / ice pack to site — cold preferred over warm (ACR 2024)" },
          { type: "action",    text: "Remove rings and any constrictive items from the arm and hand" },
          { type: "obs",       text: "Examine: tenderness, swelling, erythema, paresthesia, capillary refill, and active/passive finger & wrist ROM" },
          { type: "obs",       text: "Most extravasations resolve without complication — observe patient" },
          { type: "emergency", text: "Surgical consult if: severe or progressive pain/swelling, ↓ capillary refill, change in sensation, worsening ROM at elbow/wrist/fingers, or skin blistering/ulceration. Do NOT use volume alone as the trigger." },
        ],
        drugs: { adult: [], child: [] },
        call911: false,
      },
    },
  },
};

// ─── PREMEDICATION DATA ────────────────────────────────────────────────────────
const PREMED = {
  adult: [
    { label: "Standard PO Regimen", dose: "Methylprednisolone 32 mg PO at 12 hrs and 2 hrs prior\n+/- Diphenhydramine 50 mg PO 1 hr prior" },
    { label: "Alternative PO", dose: "Prednisone 50 mg PO at 13, 7, and 1 hr prior\n+/- Diphenhydramine 50 mg PO 1 hr prior" },
    { label: "Urgent IV (NPO / ER / Inpatient)", dose: "Hydrocortisone 200 mg IV at 5 hrs and 1 hr prior\n+ Diphenhydramine 50 mg IV 1 hr prior" },
  ],
  child: [
    { label: "Standard PO Regimen", dose: "Prednisone 0.5–0.7 mg/kg PO (max 50 mg) at 13, 7, and 1 hr prior\n+ Diphenhydramine 1 mg/kg PO (max 50 mg) 1 hr prior" },
    { label: "Urgent IV (NPO / ER / Inpatient)", dose: "Hydrocortisone 2 mg/kg IV (max 200 mg) at 5 hrs and 1 hr prior\n+ Diphenhydramine 1 mg/kg IV/IM/PO (max 50 mg) 1 hr prior" },
  ],
};

// ─── SHARED UI PRIMITIVES (hoisted outside main component) ──────────────────

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.11em", textTransform: "uppercase",
      color: C.textMuted, marginBottom: 8, marginTop: 18 }}>
      {children}
    </div>
  );
}

function StepItem({ s }) {
  const map = {
    emergency: { bg: C.emergencySoft, border: C.emergency, dot: C.emergency },
    action:    { bg: C.blueSoft,      border: C.blue,      dot: C.blue      },
    drug:      { bg: "rgba(244,162,97,0.13)", border: C.yellow, dot: C.yellow },
    obs:       { bg: C.surfaceAlt,    border: C.border,    dot: C.textMuted },
  };
  const col = map[s.type] || map.obs;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10,
      padding: "11px 13px", borderRadius: 9, marginBottom: 7,
      background: col.bg, border: `1px solid ${col.border}` }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", marginTop: 5, flexShrink: 0, background: col.dot }} />
      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45, color: C.text }}>{s.text}</div>
    </div>
  );
}

function DrugCard({ d }) {
  const iph = d.placeholder;
  return (
    <div style={{
      padding: "13px 14px", borderRadius: 10, marginBottom: 8,
      background: iph ? "rgba(167,139,250,0.1)" : C.surfaceAlt,
      border: `1px solid ${iph ? C.purple : C.borderLight}`,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: iph ? C.purple : C.yellow, marginBottom: 5 }}>{d.name}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.45 }}>{d.dose}</div>
      {d.note ? (
        <div style={{ fontSize: 11, color: iph ? C.purple : C.textMuted, marginTop: 5, fontStyle: "italic" }}>
          {iph ? "✏ " : "⚠ "}{d.note}
        </div>
      ) : null}
    </div>
  );
}

function ReboundBox() {
  return (
    <div style={{ marginTop: 18, padding: "13px 14px", borderRadius: 10, background: C.surfaceAlt, border: `1px solid ${C.blue}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.blue, marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Rebound Prevention (before ED transfer only)
      </div>
      <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.65 }}>
        IV corticosteroids may prevent short-term recurrence.{" "}
        <span style={{ color: C.text, fontWeight: 700 }}>Not for acute treatment.</span>
        {"\n\n"}
        <span style={{ color: C.yellow, fontWeight: 700 }}>Adult: </span>
        Hydrocortisone 5 mg/kg IV over 1–2 min, OR Methylprednisolone 1 mg/kg IV over 1–2 min{"\n"}
        <span style={{ color: C.yellow, fontWeight: 700 }}>Child: </span>
        Hydrocortisone 5 mg/kg IV (max 200 mg), OR Methylprednisolone 1 mg/kg IV (max 40 mg)
      </div>
    </div>
  );
}

// ─── PEDS VITALS MODAL ────────────────────────────────────────────────────────
function PedsVitalsModal({ onClose }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.78)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 480,
        background: C.surface,
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        border: `1px solid ${C.border}`,
        maxHeight: "88vh", overflowY: "auto",
        paddingBottom: 32,
      }}>
        <div style={{ padding: "14px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: C.border }} />
        </div>
        <div style={{ padding: "12px 18px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Pediatric Normal Vital Signs</div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
            Source: Cleveland Clinic Health · health.clevelandclinic.org/pediatric-vital-signs{"\n"}
            Use HR and BP values to classify bradycardia vs tachycardia by age
          </div>

          <div style={{ padding: "11px 13px", borderRadius: 10, marginBottom: 14, background: C.blueSoft, border: `1px solid ${C.blue}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>Key Branch Point</div>
            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.65 }}>
              <span style={{ color: C.yellow, fontWeight: 700 }}>Vasovagal: </span>Hypotension + HR below normal → Atropine{"\n"}
              <span style={{ color: C.accent, fontWeight: 700 }}>Anaphylactoid: </span>Hypotension + HR above normal → Epinephrine
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "68px 1fr 68px 50px", gap: 4, marginBottom: 6 }}>
            {["Age", "BP (mmHg)", "HR (bpm)", "RR"].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", color: C.textMuted, textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>
          {PEDS_VITALS.map((row, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "68px 1fr 68px 50px",
              gap: 4, padding: "9px 0",
              borderBottom: i < PEDS_VITALS.length - 1 ? `1px solid ${C.border}` : "none",
              alignItems: "center",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{row.age}</div>
              <div style={{ fontSize: 12, color: C.text }}>{row.bp}</div>
              <div style={{ fontSize: 12, color: C.text }}>{row.hr}</div>
              <div style={{ fontSize: 12, color: C.text }}>{row.rr}</div>
            </div>
          ))}
          <div style={{ marginTop: 14, fontSize: 11, color: C.textDim, textAlign: "center" }}>Tap outside or × to close</div>
        </div>
      </div>
    </div>
  );
}

// ─── APP HEADER ───────────────────────────────────────────────────────────────
function AppHeader({ screen, onBack, onReset }) {
  return (
    <div style={{
      background: "linear-gradient(160deg, #0d1828 0%, #080d18 100%)",
      borderBottom: `1px solid ${C.border}`,
      padding: "16px 18px 10px",
      position: "sticky", top: 0, zIndex: 200,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.025em", color: C.text, lineHeight: 1 }}>ContrastRx</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>ACR Manual on Contrast Media · 2020</div>
        </div>
        {screen !== "patient" && (
          <button onClick={onReset} style={{
            background: C.accentSoft, border: `1px solid ${C.accent}`,
            color: C.accent, fontSize: 10, fontWeight: 800,
            padding: "5px 11px", borderRadius: 7, cursor: "pointer", letterSpacing: "0.08em",
          }}>RESET</button>
        )}
      </div>
      {screen !== "patient" && (
        <button onClick={onBack} style={{
          background: "none", border: "none", color: C.blue,
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          padding: "8px 0 0", display: "flex", alignItems: "center", gap: 4,
        }}>← Back</button>
      )}
    </div>
  );
}

// ─── SCREEN: PATIENT TYPE ────────────────────────────────────────────────────
function ScreenPatient({ onSelect }) {
  return (
    <>
      <SectionLabel>Step 1 — Patient type</SectionLabel>
      <div style={{ display: "flex", gap: 10 }}>
        {[
          { id: "adult", emoji: "🧑", label: "Adult",     sub: "≥ 18 years", color: C.accent },
          { id: "child", emoji: "👶", label: "Pediatric", sub: "< 18 years",  color: C.blue  },
        ].map(p => (
          <button key={p.id} onClick={() => onSelect(p.id)} style={{
            flex: 1, padding: "20px 12px", borderRadius: 14,
            border: `2px solid ${C.border}`, background: C.surface,
            color: C.textMuted, fontSize: 16, fontWeight: 700, cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; e.currentTarget.style.color = p.color; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
          >
            <span style={{ fontSize: 34 }}>{p.emoji}</span>
            <span>{p.label}</span>
            <span style={{ fontSize: 11, fontWeight: 400, color: C.textDim }}>{p.sub}</span>
          </button>
        ))}
      </div>

      <SectionLabel>Severity reference</SectionLabel>
      <div style={{ padding: "14px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
        {[
          { label: "Mild",     color: C.green,  desc: "Self-limited, no progression. Observe ≥ 20–30 min." },
          { label: "Moderate", color: C.yellow, desc: "More pronounced. Often requires treatment. Monitor for escalation." },
          { label: "Severe",   color: C.accent, desc: "Life-threatening. Treat promptly and aggressively." },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < 2 ? 10 : 0 }}>
            <span style={{ color: r.color, fontWeight: 800, fontSize: 12, minWidth: 60 }}>{r.label}</span>
            <span style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{r.desc}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: C.textDim, textAlign: "center", marginTop: 22, lineHeight: 1.6 }}>
        For licensed healthcare professionals only.{"\n"}Based on ACR Manual on Contrast Media (2020).{"\n"}Always apply clinical judgment.
      </div>
    </>
  );
}

// ─── SCREEN: REACTION TYPE ────────────────────────────────────────────────────
function ScreenReaction({ patientType, onSelect }) {
  return (
    <>
      <SectionLabel>Step 2 — {patientType === "adult" ? "Adult" : "Pediatric"} · What are you seeing?</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        {Object.values(REACTIONS).map(r => {
          const isFullWidth = r.id === "arrest";
          const isRed = r.id === "arrest" || r.id === "laryngeal";
          const isGreen = r.id === "extravasation";
          const borderCol = isRed ? C.accent : isGreen ? C.green : C.border;
          const bgCol = isRed ? C.accentSoft : isGreen ? "rgba(45,198,83,0.10)" : C.surface;
          const bgHover = isRed ? "rgba(230,57,70,0.24)" : isGreen ? "rgba(45,198,83,0.18)" : C.surfaceHover;
          return (
            <div key={r.id} onClick={() => onSelect(r.id)} style={{
              gridColumn: isFullWidth ? "1 / -1" : "auto",
              padding: "15px 13px", borderRadius: 12,
              border: `1px solid ${borderCol}`,
              background: bgCol,
              cursor: "pointer",
              display: "flex",
              flexDirection: isFullWidth ? "row" : "column",
              alignItems: isFullWidth ? "center" : "flex-start",
              gap: isFullWidth ? 12 : 7,
              transition: "background 0.12s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = bgHover; }}
              onMouseLeave={e => { e.currentTarget.style.background = bgCol; }}
            >
              <span style={{ fontSize: isFullWidth ? 28 : 22 }}>{r.icon}</span>
              <span style={{ fontSize: isFullWidth ? 16 : 13, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{r.label}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── SCREEN: SEVERITY ────────────────────────────────────────────────────────
function ScreenSeverity({ reaction, patientType, onSelect, onShowVitals }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
        padding: "13px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 24 }}>{reaction.icon}</span>
        <span style={{ fontSize: 17, fontWeight: 800 }}>{reaction.label}</span>
      </div>

      {reaction.showPedsVitals && patientType === "child" && (
        <button onClick={onShowVitals} style={{
          width: "100%", padding: "12px 14px", marginBottom: 14,
          borderRadius: 10, border: `1px solid ${C.blue}`,
          background: C.blueSoft, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>📋</span>
          <div style={{ textAlign: "left", flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>Pediatric Normal Vital Signs</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Tap to check HR & BP by age before selecting</div>
          </div>
          <span style={{ color: C.blue, fontSize: 18 }}>›</span>
        </button>
      )}

      <SectionLabel>Step 3 — Severity / presentation</SectionLabel>
      {Object.entries(reaction.severities).map(([id, sev]) => (
        <button key={id} onClick={() => onSelect(id)} style={{
          width: "100%", padding: "15px 16px", marginBottom: 9,
          borderRadius: 12, border: `2px solid ${C.border}`,
          background: C.surface, cursor: "pointer", textAlign: "left",
          transition: "all 0.12s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.yellow; e.currentTarget.style.background = C.surfaceHover; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{sev.label}</div>
          {sev.sublabel && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{sev.sublabel}</div>}
        </button>
      ))}
    </>
  );
}

// ─── SCREEN: TREATMENT ────────────────────────────────────────────────────────
function ScreenTreatment({ reaction, severity, patientType, onShowVitals }) {
  const drugs = patientType === "adult" ? severity.drugs.adult : severity.drugs.child;
  const isExtravasation = reaction.id === "extravasation";

  return (
    <>
      {severity.call911 && (
        <div style={{
          padding: "13px 15px", borderRadius: 12, marginBottom: 14,
          background: C.emergencySoft, border: `2px solid ${C.emergency}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.emergency, letterSpacing: "0.02em" }}>⚠ CALL 911 / EMERGENCY RESPONSE</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Activate immediately</div>
          </div>
          <span style={{ fontSize: 26 }}>📞</span>
        </div>
      )}
      {severity.callNote && !severity.call911 && (
        <div style={{ padding: "11px 14px", borderRadius: 10, marginBottom: 14, background: "rgba(244,162,97,0.13)", border: `1px solid ${C.yellow}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.yellow }}>⚠ {severity.callNote}</div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 24 }}>{reaction.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{reaction.label}</div>
          {severity.sublabel && <div style={{ fontSize: 12, color: C.textMuted }}>{severity.sublabel}</div>}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 800, padding: "4px 9px", borderRadius: 6, letterSpacing: "0.07em",
          background: patientType === "adult" ? C.accentSoft : C.blueSoft,
          color: patientType === "adult" ? C.accent : C.blue,
          border: `1px solid ${patientType === "adult" ? C.accent : C.blue}`,
        }}>
          {patientType === "adult" ? "ADULT" : "PEDIATRIC"}
        </span>
      </div>

      {reaction.showPedsVitals && patientType === "child" && (
        <button onClick={onShowVitals} style={{
          width: "100%", padding: "9px 13px", marginBottom: 10,
          borderRadius: 9, border: `1px solid ${C.blue}`,
          background: C.blueSoft, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 14, color: C.blue }}>📋</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.blue, flex: 1, textAlign: "left" }}>Reference pediatric vital signs by age</span>
          <span style={{ color: C.blue }}>›</span>
        </button>
      )}

      {severity.steps.length > 0 && (
        <>
          <SectionLabel>Immediate actions</SectionLabel>
          {severity.steps.map((s, i) => <StepItem key={i} s={s} />)}
        </>
      )}

      {drugs.length > 0 && (
        <>
          <SectionLabel>Medications</SectionLabel>
          {drugs.map((d, i) => <DrugCard key={i} d={d} />)}
        </>
      )}

      {/* Document reminder (from ACR cards) */}
      <div style={{ marginTop: 16, padding: "11px 13px", borderRadius: 9, background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em" }}>After treatment</div>
        <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.55 }}>
          Document the reaction and monitor for return of symptoms post-treatment.
        </div>
      </div>

      {/* Extravasation discharge instructions (ACR 2024 — injury can develop hours later) */}
      {isExtravasation && (
        <div style={{ marginTop: 14, padding: "13px 14px", borderRadius: 10, background: "rgba(244,162,97,0.10)", border: `1px solid ${C.yellow}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.yellow, marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            📋 Discharge Instructions — Give to Patient
          </div>
          <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7 }}>
            Severe injury can develop <span style={{ color: C.yellow, fontWeight: 700 }}>hours after</span> extravasation. Instruct patient to return immediately for:{"\n\n"}
            <span style={{ color: C.textMuted }}>• Worsening or severe pain at the site{"\n"}</span>
            <span style={{ color: C.textMuted }}>• Increasing swelling{"\n"}</span>
            <span style={{ color: C.textMuted }}>• Numbness, tingling, or paresthesia{"\n"}</span>
            <span style={{ color: C.textMuted }}>• Reduced ability to move fingers or wrist{"\n"}</span>
            <span style={{ color: C.textMuted }}>• New skin blistering or ulceration</span>
          </div>
        </div>
      )}

      {!isExtravasation && <ReboundBox />}

      <div style={{ fontSize: 11, color: C.textDim, textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
        Source: ACR Manual on Contrast Media (2024) · ACR Contrast Cards{"\n"}Clinical judgment must guide all treatment decisions.
      </div>
    </>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ContrastRxApp() {
  const [screen, setScreen]           = useState("patient");
  const [patientType, setPatientType] = useState(null);
  const [reactionId, setReactionId]   = useState(null);
  const [severityId, setSeverityId]   = useState(null);
  const [showVitals, setShowVitals]   = useState(false);

  const reaction = reactionId ? REACTIONS[reactionId] : null;
  const severity = reaction && severityId ? reaction.severities[severityId] : null;

  const reset = () => {
    setScreen("patient"); setPatientType(null); setReactionId(null); setSeverityId(null);
  };

  const back = () => {
    if (screen === "reaction")  { setScreen("patient"); setReactionId(null); }
    else if (screen === "severity") { setScreen("reaction"); setSeverityId(null); }
    else if (screen === "treatment") {
      const sevKeys = Object.keys(reaction.severities);
      if (sevKeys.length === 1) setScreen("reaction"); else setScreen("severity");
      setSeverityId(null);
    }
  };

  const selectReaction = (id) => {
    setReactionId(id);
    const sevs = REACTIONS[id].severities;
    if (Object.keys(sevs).length === 1) {
      setSeverityId(Object.keys(sevs)[0]);
      setScreen("treatment");
    } else {
      setScreen("severity");
    }
  };

  const selectSeverity = (id) => { setSeverityId(id); setScreen("treatment"); };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif",
      maxWidth: 480, margin: "0 auto" }}>

      <AppHeader screen={screen} onBack={back} onReset={reset} />

      <div style={{ padding: "12px 16px 80px" }}>
        {screen === "patient" && (
          <ScreenPatient onSelect={(type) => { setPatientType(type); setScreen("reaction"); }} />
        )}
        {screen === "reaction" && (
          <ScreenReaction patientType={patientType} onSelect={selectReaction} />
        )}
        {screen === "severity" && reaction && (
          <ScreenSeverity
            reaction={reaction}
            patientType={patientType}
            onSelect={selectSeverity}
            onShowVitals={() => setShowVitals(true)}
          />
        )}
        {screen === "treatment" && reaction && severity && (
          <ScreenTreatment
            reaction={reaction}
            severity={severity}
            patientType={patientType}
            onShowVitals={() => setShowVitals(true)}
          />
        )}
      </div>

      {showVitals && <PedsVitalsModal onClose={() => setShowVitals(false)} />}
    </div>
  );
}
