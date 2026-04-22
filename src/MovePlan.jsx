import React, { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, PROGRESS_DOC_PATH } from "./firebase";

// ===== DATA =====
const STREAMS = {
  stuff:  { name: "Stuff",        color: "#FF1744", accent: "rgba(255,23,68"   }, // neon red
  job:    { name: "Job + Health", color: "#FF4D6D", accent: "rgba(255,77,109"  }, // crimson rose
  cats:   { name: "Cats",         color: "#FF6B9D", accent: "rgba(255,107,157" }, // hot pink
  people: { name: "People",       color: "#FF3EA5", accent: "rgba(255,62,165"  }, // neon pink
  admin:  { name: "Admin",        color: "#E91E63", accent: "rgba(233,30,99"   }, // magenta pink
};

const PHASES = [
  {
    id: 1,
    code: "01",
    label: "Foundation",
    name: "Low-stakes starts, high-leverage asks",
    dates: "Now – May 14",
    energy: "Low move-load",
    color: "#DC143C",
    start: "2026-04-22",
    end:   "2026-05-14",
    intent: "Only the things that cannot wait or that buy time for later. No packing. No sorting. Just conversations, questions, and the cat appointment.",
  },
  {
    id: 2,
    code: "02",
    label: "Focus Hold",
    name: "Conference sprint · work takes the room",
    dates: "May 15 – May 31",
    energy: "Maintenance only",
    color: "#FF1744",
    start: "2026-05-15",
    end:   "2026-05-31",
    intent: "Cutting EDGE (May 19–20), OLC deadline (May 20), LXDCON prep, pilot close (May 22). This phase exists to protect your professional work.",
  },
  {
    id: 3,
    code: "03",
    label: "Build",
    name: "Decisions, not actions (mostly)",
    dates: "June 1 – June 30",
    energy: "Moderate",
    color: "#FF4D6D",
    start: "2026-06-01",
    end:   "2026-06-30",
    intent: "The month of figuring out how. How are you moving stuff? What's staying, going, selling? Who's helping? Answers this month, execution next.",
  },
  {
    id: 4,
    code: "04",
    label: "Execute",
    name: "The real month · do the things",
    dates: "July 1 – July 31",
    energy: "Heavy",
    color: "#FF3EA5",
    start: "2026-07-01",
    end:   "2026-07-31",
    intent: "This is the big work month. Selling, donating, booking the mover, finalizing logistics. July is where you earn August's calm.",
  },
  {
    id: 5,
    code: "05",
    label: "Land",
    name: "Pack, go, breathe",
    dates: "August 1 – August 31",
    energy: "Intense → Calm",
    color: "#FF6BBF",
    start: "2026-08-01",
    end:   "2026-08-31",
    intent: "The plan is already built. You're not figuring things out anymore — you're executing. This is the month you'll thank April, June, and July.",
  },
];

const TASKS = [
  // Phase 1 — Foundation
  { id: "p1-j-1", phase: 1, stream: "job",    text: "Get concrete answers on the job situation — is it staying, changing, ending?", note: "Whatever the answer is, you can plan around it. Not knowing is worse than bad news." },
  { id: "p1-j-2", phase: 1, stream: "job",    text: "Ask NEU HR: what changes about my benefits when I move to SC?", note: "One email. They've answered this a hundred times." },
  { id: "p1-j-3", phase: 1, stream: "job",    text: "List every current provider (PCP, dentist, specialists, cat vet) with visit frequency.", note: "Baseline for transition research later." },
  { id: "p1-pe-1", phase: 1, stream: "people", text: "Confirm with Abby: lease takeover locked in writing with landlord.", note: "Not a verbal yes. The actual paperwork started." },
  { id: "p1-pe-2", phase: 1, stream: "people", text: "Walk-through with Christian and Liz: tag anything they'd want.", note: "Low pressure, no decisions yet." },
  { id: "p1-pe-3", phase: 1, stream: "people", text: "Text Vinny and parents a rough August week.", note: "Early heads-up protects their calendars." },
  { id: "p1-c-1", phase: 1, stream: "cats",   text: "Book vet visit for both cats in late April / early May.", note: "Behavioral questions + baseline health. Bring the list of weird behaviors." },
  { id: "p1-c-2", phase: 1, stream: "cats",   text: "Ask vet: does my membership transfer? SC-area equivalent they recommend?" },
  { id: "p1-s-1", phase: 1, stream: "stuff",  text: "30-minute walk-through: photo every room, closet, and bin.", note: "You can't plan what you can't see." },
  { id: "p1-s-2", phase: 1, stream: "stuff",  text: "Designate a yard-sale corner. Obvious stuff goes there when you notice it.", note: "No sorting sessions yet." },

  // Phase 2 — Focus Hold
  { id: "p2-a-1", phase: 2, stream: "admin",  text: "Start a Notes doc: 'Things to change address on.'", note: "Add to it when you notice mail arrive." },
  { id: "p2-a-2", phase: 2, stream: "admin",  text: "Catch-up on any April task that slipped — after May 22 only." },
  { id: "p2-pe-1", phase: 2, stream: "people", text: "By Memorial Day: lock actual August move date with Vinny.", note: "Pilot + conferences done, so you know your real calendar." },

  // Phase 3 — Build
  { id: "p3-s-1", phase: 3, stream: "stuff",  text: "Two sorting sessions per week, 45 min each, one room at a time.", note: "Keep, sell, donate, toss. Tag it — don't move it yet." },
  { id: "p3-s-2", phase: 3, stream: "stuff",  text: "By June 30: rough volume estimate ('X boxes + Y furniture pieces').", note: "This drives July's moving-logistics decision." },
  { id: "p3-s-3", phase: 3, stream: "stuff",  text: "List higher-value items on Facebook Marketplace.", note: "Low pressure, long runway." },
  { id: "p3-j-1", phase: 3, stream: "job",    text: "Research SC providers near Vinny: PCP, dentist, specialists.", note: "Don't commit yet. Just build the shortlist." },
  { id: "p3-j-2", phase: 3, stream: "job",    text: "If NEU insurance confirmed: get exact process + timing for SC coverage change.", note: "Some plans require the change on/before move." },
  { id: "p3-j-3", phase: 3, stream: "job",    text: "Prescription refills: get 90-day supplies where possible before the move." },
  { id: "p3-c-1", phase: 3, stream: "cats",   text: "Start any behavior interventions the vet recommended.", note: "Behavior work takes weeks, not days." },
  { id: "p3-c-2", phase: 3, stream: "cats",   text: "Decide: cats flying or driving? Book early if flying." },
  { id: "p3-pe-1", phase: 3, stream: "people", text: "Concrete asks to family + Vinny: specific dates, specific help.", note: "'Help me move' → 'Drive down with me Aug 29th.'" },
  { id: "p3-pe-2", phase: 3, stream: "people", text: "Confirm internet bill takeover — name the switchover date." },

  // Phase 4 — Execute
  { id: "p4-s-1", phase: 4, stream: "stuff",  text: "Yard sale weekend — aim mid-July.", note: "Whatever doesn't sell gets relisted or donated. No holding." },
  { id: "p4-s-2", phase: 4, stream: "stuff",  text: "Schedule donation pickups for the week after yard sale.", note: "Habitat ReStore, Goodwill, Buy Nothing." },
  { id: "p4-s-3", phase: 4, stream: "stuff",  text: "Book moving method by July 15 — U-Haul, PODS, movers, or Vinny's truck.", note: "Decide based on June's volume estimate." },
  { id: "p4-s-4", phase: 4, stream: "stuff",  text: "Start packing non-essentials: books, off-season clothes, decor." },
  { id: "p4-a-1", phase: 4, stream: "admin",  text: "Set up USPS mail forwarding to start the week of the move.", note: "Forwarding takes ~15 days to activate." },
  { id: "p4-a-2", phase: 4, stream: "admin",  text: "Notify banks, credit cards, subscriptions of address change.", note: "The Notes doc from May pays off here." },
  { id: "p4-a-3", phase: 4, stream: "admin",  text: "Research SC car registration requirements — don't do it early.", note: "SC gives 45 days after residency. Needs SC proof of residency first." },
  { id: "p4-j-1", phase: 4, stream: "job",    text: "Book 'last' appointments with current PCP and dentist if you want them." },
  { id: "p4-j-2", phase: 4, stream: "job",    text: "Request medical records transfer or portal access for SC providers." },
  { id: "p4-c-1", phase: 4, stream: "cats",   text: "Vet pre-move check-in — records, any final treatments, travel meds if needed." },
  { id: "p4-c-2", phase: 4, stream: "cats",   text: "Cancel MA vet membership effective after move date." },

  // Phase 5 — Land
  { id: "p5-s-1", phase: 5, stream: "stuff",  text: "Weeks 1–2: heavy packing. Everything but what you use daily." },
  { id: "p5-s-2", phase: 5, stream: "stuff",  text: "Week 3: finish packing. Essentials box + drive-day travel bag." },
  { id: "p5-s-3", phase: 5, stream: "stuff",  text: "Move week: load, drive, unload. Return U-Haul / close out service." },
  { id: "p5-a-1", phase: 5, stream: "admin",  text: "Stop/transfer utilities (electric, internet, apartment accounts) effective 8/31." },
  { id: "p5-a-2", phase: 5, stream: "admin",  text: "Walk-through with Abby and landlord. Keys handed off. Security deposit paperwork." },
  { id: "p5-c-1", phase: 5, stream: "cats",   text: "Execute cat travel plan — carriers, calm-down meds if prescribed, comfort items." },
  { id: "p5-c-2", phase: 5, stream: "cats",   text: "First 72 hours at Vinny's: one small room with their stuff. Slow intro.", note: "Cats decompress before exploring." },
  { id: "p5-pe-1", phase: 5, stream: "people", text: "Confirmed help arrives on confirmed dates.", note: "Because you asked specifically in June." },
  { id: "p5-pe-2", phase: 5, stream: "people", text: "Say actual goodbyes — Christian, Liz, anyone who matters.", note: "The part nobody puts on the list and everyone wishes they had." },
];

const TODAY = new Date("2026-04-22");
const MOVE_DATE = new Date("2026-08-31");

const getDaysUntilMove = () => {
  const now = new Date();
  const diff = Math.max(0, Math.ceil((MOVE_DATE - now) / (1000 * 60 * 60 * 24)));
  return diff || Math.ceil((MOVE_DATE - TODAY) / (1000 * 60 * 60 * 24));
};

const getCurrentPhase = () => {
  const now = new Date();
  const ref = isNaN(now) ? TODAY : now;
  for (const p of PHASES) {
    const start = new Date(p.start);
    const end = new Date(p.end);
    if (ref >= start && ref <= end) return p;
  }
  if (ref < new Date(PHASES[0].start)) return PHASES[0];
  return PHASES[PHASES.length - 1];
};

// ===== STORAGE (Firestore — syncs across devices) =====
const progressDocRef = doc(db, PROGRESS_DOC_PATH.collection, PROGRESS_DOC_PATH.doc);

// Subscribe to real-time updates. Returns an unsubscribe function.
const subscribeChecks = (onUpdate, onError) => {
  return onSnapshot(
    progressDocRef,
    (snap) => {
      const data = snap.exists() ? snap.data() : {};
      onUpdate(data.checks || {});
    },
    (err) => {
      console.error("Firestore subscribe error:", err);
      if (onError) onError(err);
    }
  );
};

const saveChecks = async (checks) => {
  try {
    await setDoc(progressDocRef, { checks, updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    console.error("Firestore save error:", err);
  }
};

// ===== APP =====
export default function MovePlan() {
  const [view, setView] = useState("dashboard"); // dashboard | phase | stream
  const [activePhaseId, setActivePhaseId] = useState(null);
  const [activeStreamId, setActiveStreamId] = useState(null);
  const [checks, setChecks] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [displayChecks, setDisplayChecks] = useState({});
  const [syncStatus, setSyncStatus] = useState("connecting"); // connecting | synced | error

  useEffect(() => {
    const unsubscribe = subscribeChecks(
      (remoteChecks) => {
        setChecks(remoteChecks);
        setDisplayChecks(remoteChecks);
        setLoaded(true);
        setSyncStatus("synced");
      },
      () => {
        setLoaded(true);
        setSyncStatus("error");
      }
    );
    return () => unsubscribe();
  }, []);

  // Delay the sort-ordering so the check animation is visible before the row moves
  useEffect(() => {
    const t = setTimeout(() => setDisplayChecks(checks), 500);
    return () => clearTimeout(t);
  }, [checks]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [view, activePhaseId, activeStreamId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggle = (id) => {
    const next = { ...checks, [id]: !checks[id] };
    if (!next[id]) delete next[id];
    setChecks(next);
    saveChecks(next);
  };

  const reset = () => {
    setChecks({});
    setDisplayChecks({});
    saveChecks({});
    setResetConfirm(false);
  };

  const currentPhase = getCurrentPhase();
  const daysLeft = getDaysUntilMove();
  const totalTasks = TASKS.length;
  const doneTasks = Object.values(checks).filter(Boolean).length;
  const pct = Math.round((doneTasks / totalTasks) * 100);

  const currentPhaseTasks = TASKS.filter((t) => t.phase === currentPhase.id);
  const currentDone = currentPhaseTasks.filter((t) => checks[t.id]).length;
  const currentPct = Math.round((currentDone / currentPhaseTasks.length) * 100);
  // Sort by displayChecks (delayed state) so the checkbox animates in before the row moves.
  // Each row renders its actual checked state immediately from `checks`.
  const sortedPhaseTasks = [...currentPhaseTasks].sort((a, b) => {
    const aDone = displayChecks[a.id] ? 1 : 0;
    const bDone = displayChecks[b.id] ? 1 : 0;
    return aDone - bDone;
  });
  const nextUp = sortedPhaseTasks;

  const openPhase = (id) => { setActivePhaseId(id); setView("phase"); };
  const openStream = (id) => { setActiveStreamId(id); setView("stream"); };
  const goDashboard = () => { setView("dashboard"); setActivePhaseId(null); setActiveStreamId(null); };

  return (
    <div style={styles.app}>
      <div style={styles.leftGradient} />
      <div style={styles.container} className="mp-container">
        <Header
          view={view}
          onDashboard={goDashboard}
          onReset={() => setResetConfirm(true)}
          syncStatus={syncStatus}
        />

        {resetConfirm && (
          <ResetModal onCancel={() => setResetConfirm(false)} onConfirm={reset} />
        )}

        {!loaded ? (
          <div style={styles.loading}>Loading…</div>
        ) : view === "dashboard" ? (
          <Dashboard
            daysLeft={daysLeft}
            currentPhase={currentPhase}
            currentPct={currentPct}
            totalPct={pct}
            doneTasks={doneTasks}
            totalTasks={totalTasks}
            nextUp={nextUp}
            checks={checks}
            onToggle={toggle}
            onOpenPhase={openPhase}
            onOpenStream={openStream}
          />
        ) : view === "phase" ? (
          <PhaseView
            phase={PHASES.find((p) => p.id === activePhaseId)}
            checks={checks}
            onToggle={toggle}
          />
        ) : (
          <StreamView
            streamId={activeStreamId}
            checks={checks}
            onToggle={toggle}
          />
        )}
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={styles.scrollTopBtn}
          aria-label="Jump to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}

// ===== HEADER =====
function Header({ view, onDashboard, onReset, syncStatus }) {
  const statusColor =
    syncStatus === "synced" ? "#FF3EA5" :
    syncStatus === "error"  ? "#FF1744" :
                              "rgba(248,250,252,.4)";
  const statusLabel =
    syncStatus === "synced" ? "Synced" :
    syncStatus === "error"  ? "Offline" :
                              "Connecting";

  return (
    <div style={styles.header}>
      <div>
        <div style={styles.headerLabel}>Personal Design Doc</div>
        <div style={styles.headerTitle}>
          Boston <span style={styles.headerArrow}>→</span> SC
        </div>
        <div style={styles.syncRow} title={statusLabel}>
          <span style={{
            ...styles.syncDot,
            background: statusColor,
            boxShadow: syncStatus === "synced" ? `0 0 6px ${statusColor}` : "none",
          }} />
          <span style={styles.syncLabel}>{statusLabel}</span>
        </div>
      </div>
      <div style={styles.headerActions}>
        {view !== "dashboard" && (
          <button style={styles.ghostBtn} onClick={onDashboard}>← Dashboard</button>
        )}
        <button style={styles.ghostBtn} onClick={onReset}>Reset</button>
      </div>
    </div>
  );
}

// ===== DASHBOARD =====
function Dashboard({
  daysLeft, currentPhase, currentPct, totalPct, doneTasks, totalTasks,
  nextUp, checks, onToggle, onOpenPhase, onOpenStream,
}) {
  return (
    <>
      {/* TOP STAT BAR */}
      <div style={styles.statRow} className="mp-stat-row">
        <DaysCountdownCard daysLeft={daysLeft} />
        <ProgressDonutCard
          totalPct={totalPct}
          doneTasks={doneTasks}
          totalTasks={totalTasks}
        />
        <div className="mp-phase-stepper-wrap">
          <PhaseSteppedCard
            currentPhase={currentPhase}
            currentPct={currentPct}
            checks={checks}
          />
        </div>
      </div>

      {/* CURRENT PHASE CARD */}
      <div style={{ ...styles.bigCard, borderTop: `3px solid ${currentPhase.color}` }}>
        <div style={styles.phaseMetaRow}>
          <div>
            <div style={{ ...styles.phaseLabel, color: currentPhase.color }}>
              ACTIVE PHASE · {currentPhase.label.toUpperCase()}
            </div>
            <div style={styles.phaseHeadline}>{currentPhase.name}</div>
            <div style={styles.phaseDates}>{currentPhase.dates} · {currentPhase.energy}</div>
          </div>
          <button
            style={{ ...styles.primaryBtn, borderColor: currentPhase.color, color: currentPhase.color }}
            onClick={() => onOpenPhase(currentPhase.id)}
          >
            Open full phase →
          </button>
        </div>

        <div style={{ ...styles.intent, borderLeft: `3px solid ${currentPhase.color}` }}>
          {currentPhase.intent}
        </div>

        {/* progress bar */}
        <div style={styles.progressWrap}>
          <div style={styles.progressLabel}>
            <span>This phase</span>
            <span>{currentPct}%</span>
          </div>
          <div style={styles.progressTrack}>
            <div style={{
              ...styles.progressFill,
              width: `${currentPct}%`,
              background: `linear-gradient(90deg, ${currentPhase.color}, ${currentPhase.color}AA)`,
            }} />
          </div>
        </div>

        {/* next up */}
        <div style={styles.nextUpHeader}>
          <div style={styles.nextUpLabel}>THIS PHASE</div>
          <div style={styles.nextUpHint}>
            {currentPhaseTasksLeft(currentPhase.id, checks) === 0
              ? "Phase complete. Take a breath."
              : `${currentPhaseTasksLeft(currentPhase.id, checks)} of ${nextUp.length} left`}
          </div>
        </div>
        {nextUp.length === 0 ? (
          <div style={styles.emptyPhase}>Nothing queued in this phase.</div>
        ) : (
          nextUp.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              checked={!!checks[t.id]}
              onToggle={() => onToggle(t.id)}
            />
          ))
        )}
      </div>

      {/* PHASES NAV */}
      <div style={styles.sectionLabel}>PHASES</div>
      <div style={styles.phaseGrid}>
        {PHASES.map((p) => {
          const phaseTasks = TASKS.filter((t) => t.phase === p.id);
          const done = phaseTasks.filter((t) => checks[t.id]).length;
          const pPct = Math.round((done / phaseTasks.length) * 100);
          const isCurrent = p.id === currentPhase.id;
          return (
            <button
              key={p.id}
              onClick={() => onOpenPhase(p.id)}
              style={{
                ...styles.phaseCard,
                borderTop: `3px solid ${p.color}`,
                boxShadow: isCurrent ? `0 0 0 1px ${p.color}55` : "none",
              }}
            >
              <div style={{ ...styles.phaseCardCode, color: p.color }}>{p.code}</div>
              <div style={styles.phaseCardName}>{p.label}</div>
              <div style={styles.phaseCardDates}>{p.dates}</div>
              <div style={styles.phaseCardProgress}>
                <div style={styles.progressTrackSmall}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${pPct}%`,
                    background: p.color,
                  }} />
                </div>
                <div style={styles.phaseCardPct}>{done}/{phaseTasks.length}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* STREAMS NAV */}
      <div style={styles.sectionLabel}>WORKSTREAMS</div>
      <div style={styles.streamGrid}>
        {Object.entries(STREAMS).map(([id, s]) => {
          const streamTasks = TASKS.filter((t) => t.stream === id);
          const done = streamTasks.filter((t) => checks[t.id]).length;
          const sPct = Math.round((done / streamTasks.length) * 100);
          return (
            <button
              key={id}
              onClick={() => onOpenStream(id)}
              style={{ ...styles.streamCard, borderTop: `3px solid ${s.color}` }}
            >
              <div style={{ ...styles.streamCardName, color: s.color }}>{s.name}</div>
              <div style={styles.streamCardCount}>{done}/{streamTasks.length}</div>
              <div style={styles.progressTrackSmall}>
                <div style={{
                  ...styles.progressFill,
                  width: `${sPct}%`,
                  background: s.color,
                }} />
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function currentPhaseTasksLeft(phaseId, checks) {
  return TASKS.filter((t) => t.phase === phaseId && !checks[t.id]).length;
}

// ===== PHASE VIEW =====
function PhaseView({ phase, checks, onToggle }) {
  const phaseTasks = TASKS.filter((t) => t.phase === phase.id);
  const done = phaseTasks.filter((t) => checks[t.id]).length;
  const pct = Math.round((done / phaseTasks.length) * 100);

  // group by stream
  const grouped = {};
  phaseTasks.forEach((t) => {
    if (!grouped[t.stream]) grouped[t.stream] = [];
    grouped[t.stream].push(t);
  });

  return (
    <>
      <div style={{ ...styles.bigCard, borderTop: `3px solid ${phase.color}` }}>
        <div style={{ ...styles.phaseLabel, color: phase.color, fontSize: "1rem" }}>
          PHASE {phase.code} · {phase.label.toUpperCase()}
        </div>
        <div style={{ ...styles.phaseHeadline, fontSize: "2rem", marginTop: 8 }}>
          {phase.name}
        </div>
        <div style={styles.phaseDates}>{phase.dates} · {phase.energy}</div>
        <div style={{ ...styles.intent, borderLeft: `3px solid ${phase.color}`, marginTop: 20 }}>
          {phase.intent}
        </div>
        <div style={styles.progressWrap}>
          <div style={styles.progressLabel}>
            <span>Phase progress</span>
            <span>{pct}% · {done}/{phaseTasks.length}</span>
          </div>
          <div style={styles.progressTrack}>
            <div style={{
              ...styles.progressFill,
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${phase.color}, ${phase.color}AA)`,
            }} />
          </div>
        </div>
      </div>

      {Object.entries(grouped).map(([streamId, tasks]) => {
        const s = STREAMS[streamId];
        return (
          <div key={streamId} style={styles.streamBlock}>
            <div style={styles.streamHeaderRow}>
              <span style={{ ...styles.streamDot, background: s.color }} />
              <span style={{ ...styles.streamHeaderName, color: s.color }}>
                {s.name.toUpperCase()}
              </span>
              <span style={styles.streamHeaderCount}>
                {tasks.filter((t) => checks[t.id]).length}/{tasks.length}
              </span>
            </div>
            {tasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                checked={!!checks[t.id]}
                onToggle={() => onToggle(t.id)}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}

// ===== STREAM VIEW =====
function StreamView({ streamId, checks, onToggle }) {
  const s = STREAMS[streamId];
  const streamTasks = TASKS.filter((t) => t.stream === streamId);
  const done = streamTasks.filter((t) => checks[t.id]).length;
  const pct = Math.round((done / streamTasks.length) * 100);

  // group by phase
  const grouped = {};
  streamTasks.forEach((t) => {
    if (!grouped[t.phase]) grouped[t.phase] = [];
    grouped[t.phase].push(t);
  });

  return (
    <>
      <div style={{ ...styles.bigCard, borderTop: `3px solid ${s.color}` }}>
        <div style={{ ...styles.phaseLabel, color: s.color, fontSize: "1rem" }}>
          WORKSTREAM
        </div>
        <div style={{ ...styles.phaseHeadline, fontSize: "2rem", marginTop: 8 }}>
          {s.name}
        </div>
        <div style={styles.progressWrap}>
          <div style={styles.progressLabel}>
            <span>Stream progress</span>
            <span>{pct}% · {done}/{streamTasks.length}</span>
          </div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${pct}%`, background: s.color }} />
          </div>
        </div>
      </div>

      {Object.entries(grouped).map(([phaseId, tasks]) => {
        const phase = PHASES.find((p) => p.id === Number(phaseId));
        return (
          <div key={phaseId} style={styles.streamBlock}>
            <div style={styles.streamHeaderRow}>
              <span style={{ ...styles.streamDot, background: phase.color }} />
              <span style={{ ...styles.streamHeaderName, color: phase.color }}>
                PHASE {phase.code} · {phase.label.toUpperCase()}
              </span>
              <span style={styles.streamHeaderCount}>
                {tasks.filter((t) => checks[t.id]).length}/{tasks.length}
              </span>
            </div>
            {tasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                checked={!!checks[t.id]}
                onToggle={() => onToggle(t.id)}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}

// ===== TASK ROW =====
function TaskRow({ task, checked, onToggle }) {
  const s = STREAMS[task.stream];
  return (
    <div
      onClick={onToggle}
      style={{
        ...styles.taskRow,
        background: checked ? "rgba(255,255,255,.015)" : "rgba(255,255,255,.03)",
        borderColor: checked ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.07)",
        opacity: checked ? 0.55 : 1,
      }}
    >
      <div
        style={{
          ...styles.checkbox,
          background: checked ? s.color : "transparent",
          borderColor: checked ? s.color : s.color + "88",
        }}
      >
        {checked && <span style={styles.checkmark}>✓</span>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          ...styles.taskText,
          textDecoration: checked ? "line-through" : "none",
          textDecorationThickness: checked ? "2.5px" : undefined,
          textDecorationColor: checked ? s.color : undefined,
          color: checked ? "rgba(248,250,252,.5)" : "rgba(248,250,252,.92)",
        }}>
          {task.text}
        </div>
        {task.note && (
          <div style={styles.taskNote}>{task.note}</div>
        )}
      </div>
      <div style={{ ...styles.streamTag, color: s.color, borderColor: s.color + "55" }}>
        {s.name}
      </div>
    </div>
  );
}

// ===== STAT BLOCK (legacy, kept for other views) =====
function StatBlock({ label, value, sub, color }) {
  return (
    <div style={styles.statBlock}>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
      {sub && <div style={styles.statSub}>{sub}</div>}
    </div>
  );
}

// ===== DAYS COUNTDOWN CARD (radial arc, pure SVG) =====
function DaysCountdownCard({ daysLeft }) {
  const TOTAL = 131;
  const elapsed = TOTAL - daysLeft;
  const pct = elapsed / TOTAL;

  const size = 160;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <div style={styles.chartCard} className="mp-chart-card">
      <div style={styles.chartCardLabel} className="mp-chart-label">Days to move-out</div>
      <div style={styles.chartBody}>
        <div style={{ ...styles.chartWrap, width: size, height: size }} className="mp-chart-wrap">
          <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,.07)"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="#FF1744"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c}`}
              style={{
                filter: "drop-shadow(0 0 6px rgba(255,23,68,.5))",
                transition: "stroke-dasharray .6s ease",
              }}
            />
          </svg>
          <div style={styles.chartCenterText}>
            <div style={{ ...styles.chartCenterValue, color: "#FF1744" }} className="mp-chart-center-value">{daysLeft}</div>
            <div style={styles.chartCenterSub}>of {TOTAL}</div>
          </div>
        </div>
      </div>
      <div style={styles.chartFooter}>{elapsed} days in</div>
    </div>
  );
}

// ===== OVERALL PROGRESS CARD (donut, pure SVG) =====
function ProgressDonutCard({ totalPct, doneTasks, totalTasks }) {
  const remaining = totalTasks - doneTasks;
  const pct = totalTasks > 0 ? doneTasks / totalTasks : 0;

  const size = 160;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <div style={styles.chartCard} className="mp-chart-card">
      <div style={styles.chartCardLabel} className="mp-chart-label">Overall progress</div>
      <div style={styles.chartBody}>
        <div style={{ ...styles.chartWrap, width: size, height: size }} className="mp-chart-wrap">
          <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,.07)"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="#FF3EA5"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c}`}
              style={{
                filter: "drop-shadow(0 0 6px rgba(255,62,165,.5))",
                transition: "stroke-dasharray .6s ease",
              }}
            />
          </svg>
          <div style={styles.chartCenterText}>
            <div style={{ ...styles.chartCenterValue, color: "#FF3EA5" }} className="mp-chart-center-value">{totalPct}%</div>
            <div style={styles.chartCenterSub}>{doneTasks} / {totalTasks}</div>
          </div>
        </div>
      </div>
      <div style={styles.chartFooter}>{remaining} tasks remaining</div>
    </div>
  );
}

// ===== PHASE STEPPER CARD =====
function PhaseSteppedCard({ currentPhase, currentPct, checks }) {
  return (
    <div style={styles.chartCard} className="mp-chart-card">
      <div style={styles.chartCardLabel} className="mp-chart-label">Phase progress</div>
      <div style={styles.chartBody}>
        <div style={styles.stepperWrap}>
          {PHASES.map((p, i) => {
            const phaseTasks = TASKS.filter((t) => t.phase === p.id);
            const done = phaseTasks.filter((t) => checks[t.id]).length;
            const pPct = Math.round((done / phaseTasks.length) * 100);
            const isCurrent = p.id === currentPhase.id;
            const isPast = p.id < currentPhase.id;
            return (
              <div key={p.id} style={styles.stepperRow}>
                <div style={styles.stepperLabelRow}>
                  <div style={{
                    ...styles.stepperCode,
                    color: isCurrent ? p.color : isPast ? "rgba(248,250,252,.6)" : "rgba(248,250,252,.35)",
                    fontWeight: isCurrent ? 800 : 600,
                  }}>
                    {p.code}
                  </div>
                  <div style={{
                    ...styles.stepperName,
                    color: isCurrent ? "#F8FAFC" : "rgba(248,250,252,.5)",
                    fontWeight: isCurrent ? 700 : 500,
                  }}>
                    {p.label}
                  </div>
                  <div style={{
                    ...styles.stepperPct,
                    color: isCurrent ? p.color : "rgba(248,250,252,.4)",
                  }}>
                    {pPct}%
                  </div>
                </div>
                <div style={styles.stepperTrack}>
                  <div style={{
                    ...styles.stepperFill,
                    width: `${pPct}%`,
                    background: p.color,
                    opacity: isCurrent ? 1 : isPast ? 0.6 : 0.4,
                    boxShadow: isCurrent ? `0 0 8px ${p.color}80` : "none",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={styles.chartFooter}>
        Active: <span style={{ color: currentPhase.color, fontWeight: 700 }}>{currentPhase.label}</span> · {currentPct}%
      </div>
    </div>
  );
}

// ===== RESET MODAL =====
function ResetModal({ onCancel, onConfirm }) {
  return (
    <div style={styles.modalBackdrop} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalTitle}>Reset all progress?</div>
        <div style={styles.modalBody}>
          This will uncheck every task across all phases. Can't be undone.
        </div>
        <div style={styles.modalActions}>
          <button style={styles.ghostBtn} onClick={onCancel}>Cancel</button>
          <button style={styles.dangerBtn} onClick={onConfirm}>Reset everything</button>
        </div>
      </div>
    </div>
  );
}

// ===== STYLES =====
const styles = {
  app: {
    minHeight: "100vh",
    background: "#050505",
    color: "rgba(248,250,252,.85)",
    fontFamily: "'Karla', system-ui, sans-serif",
    position: "relative",
    overflowX: "hidden",
  },
  leftGradient: {
    position: "fixed",
    top: 0,
    left: 0,
    width: 200,
    height: "100vh",
    background: "linear-gradient(180deg, rgba(220,20,60,.22) 0%, rgba(255,23,68,.22) 20%, rgba(255,77,109,.22) 40%, rgba(255,62,165,.22) 60%, rgba(255,107,191,.22) 80%, rgba(220,20,60,.22) 100%)",
    WebkitMaskImage: "linear-gradient(90deg, black 0%, transparent 100%)",
    maskImage: "linear-gradient(90deg, black 0%, transparent 100%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  container: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "40px 40px 120px",
    position: "relative",
    zIndex: 1,
  },
  loading: {
    padding: 40,
    textAlign: "center",
    color: "rgba(248,250,252,.5)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 40,
    gap: 16,
    flexWrap: "wrap",
  },
  headerLabel: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: ".78rem",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#F8FAFC",
    marginBottom: 10,
  },
  headerTitle: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontWeight: 800,
    fontSize: "2.4rem",
    lineHeight: 1,
    color: "#F8FAFC",
    letterSpacing: "-.02em",
  },
  headerArrow: {
    background: "linear-gradient(135deg, #FF1744, #FF3EA5, #FF6BBF)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    margin: "0 .1em",
  },
  syncRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    transition: "background .3s ease, box-shadow .3s ease",
  },
  syncLabel: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontSize: ".68rem",
    fontWeight: 600,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "rgba(248,250,252,.5)",
  },
  headerActions: {
    display: "flex",
    gap: 10,
  },
  ghostBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,.15)",
    color: "rgba(248,250,252,.75)",
    padding: "8px 14px",
    borderRadius: 2,
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontSize: ".82rem",
    fontWeight: 500,
    letterSpacing: ".5px",
    cursor: "pointer",
    transition: "all .2s",
  },
  primaryBtn: {
    background: "transparent",
    border: "1px solid #FF1744",
    color: "#FF1744",
    padding: "10px 16px",
    borderRadius: 2,
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontSize: ".85rem",
    fontWeight: 700,
    letterSpacing: ".5px",
    cursor: "pointer",
    transition: "all .2s",
  },
  dangerBtn: {
    background: "rgba(239,68,68,.15)",
    border: "1px solid rgba(239,68,68,.5)",
    color: "#FCA5A5",
    padding: "8px 14px",
    borderRadius: 2,
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontSize: ".82rem",
    fontWeight: 600,
    cursor: "pointer",
  },

  statRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
    marginBottom: 24,
  },
  statBlock: {
    padding: "20px 24px",
    background: "rgba(255,255,255,.03)",
    border: "1px solid rgba(255,255,255,.07)",
    borderRadius: 2,
  },
  statValue: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontWeight: 800,
    fontSize: "2.6rem",
    lineHeight: 1,
    marginBottom: 8,
  },
  statLabel: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontWeight: 500,
    fontSize: ".78rem",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "rgba(248,250,252,.55)",
  },
  statSub: {
    fontSize: ".82rem",
    color: "rgba(248,250,252,.48)",
    marginTop: 4,
  },

  // Chart card styles
  chartCard: {
    padding: "18px 20px 14px",
    background: "rgba(255,255,255,.03)",
    border: "1px solid rgba(255,255,255,.07)",
    borderRadius: 2,
    display: "flex",
    flexDirection: "column",
    minHeight: 260,
  },
  chartCardLabel: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: ".72rem",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(248,250,252,.65)",
    marginBottom: 4,
    textAlign: "center",
  },
  chartBody: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 0 4px",
  },
  chartWrap: {
    position: "relative",
    width: 160,
    height: 160,
  },
  chartCenterText: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  chartCenterValue: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontWeight: 800,
    fontSize: "2.4rem",
    lineHeight: 1,
    letterSpacing: "-.02em",
  },
  chartCenterSub: {
    fontFamily: "'Karla', sans-serif",
    fontSize: ".78rem",
    color: "rgba(248,250,252,.55)",
    marginTop: 4,
  },
  chartFooter: {
    fontFamily: "'Karla', sans-serif",
    fontSize: ".82rem",
    color: "rgba(248,250,252,.55)",
    textAlign: "center",
    paddingTop: 8,
    borderTop: "1px solid rgba(255,255,255,.05)",
    marginTop: 12,
  },

  // Phase stepper
  stepperWrap: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  stepperRow: {},
  stepperLabelRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 4,
  },
  stepperCode: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontSize: ".78rem",
    fontWeight: 700,
    width: 22,
    flexShrink: 0,
    letterSpacing: ".5px",
  },
  stepperName: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontSize: ".82rem",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  stepperPct: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontSize: ".72rem",
    fontWeight: 700,
    letterSpacing: ".5px",
  },
  stepperTrack: {
    height: 5,
    background: "rgba(255,255,255,.05)",
    borderRadius: 1,
    overflow: "hidden",
  },
  stepperFill: {
    height: "100%",
    transition: "width .3s ease, opacity .3s ease",
  },

  bigCard: {
    padding: 28,
    background: "rgba(255,255,255,.03)",
    border: "1px solid rgba(255,255,255,.07)",
    borderRadius: 2,
    marginBottom: 32,
  },
  phaseMetaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  phaseLabel: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: ".78rem",
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  phaseHeadline: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontWeight: 800,
    fontSize: "1.4rem",
    color: "#F8FAFC",
    marginTop: 6,
    marginBottom: 4,
    letterSpacing: "-.01em",
  },
  phaseDates: {
    fontFamily: "'Karla', sans-serif",
    fontStyle: "italic",
    fontSize: ".95rem",
    color: "rgba(248,250,252,.55)",
  },
  intent: {
    padding: "12px 18px",
    fontSize: "1rem",
    fontStyle: "italic",
    color: "rgba(248,250,252,.78)",
    marginBottom: 20,
    lineHeight: 1.6,
  },
  progressWrap: { marginBottom: 28 },
  progressLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontSize: ".78rem",
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(248,250,252,.6)",
    marginBottom: 8,
  },
  progressTrack: {
    height: 6,
    background: "rgba(255,255,255,.05)",
    borderRadius: 1,
    overflow: "hidden",
  },
  progressTrackSmall: {
    height: 4,
    background: "rgba(255,255,255,.05)",
    borderRadius: 1,
    overflow: "hidden",
    flex: 1,
  },
  progressFill: {
    height: "100%",
    transition: "width .3s ease",
  },
  nextUpHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid rgba(255,255,255,.07)",
  },
  nextUpLabel: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: ".78rem",
    letterSpacing: 2.5,
    color: "#F8FAFC",
    textTransform: "uppercase",
  },
  nextUpHint: {
    fontSize: ".82rem",
    color: "rgba(248,250,252,.5)",
    fontStyle: "italic",
  },
  emptyPhase: {
    padding: "20px 0",
    textAlign: "center",
    color: "rgba(248,250,252,.5)",
    fontStyle: "italic",
  },

  sectionLabel: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: ".8rem",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#F8FAFC",
    marginTop: 40,
    marginBottom: 16,
  },
  phaseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 10,
    marginBottom: 24,
  },
  phaseCard: {
    padding: 16,
    background: "rgba(255,255,255,.03)",
    border: "1px solid rgba(255,255,255,.07)",
    borderRadius: 2,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    color: "inherit",
    transition: "all .2s",
  },
  phaseCardCode: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontWeight: 800,
    fontSize: "1.5rem",
    lineHeight: 1,
    marginBottom: 8,
  },
  phaseCardName: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: ".88rem",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  phaseCardDates: {
    fontSize: ".75rem",
    color: "rgba(248,250,252,.5)",
    marginBottom: 10,
    fontStyle: "italic",
  },
  phaseCardProgress: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  phaseCardPct: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontSize: ".72rem",
    fontWeight: 700,
    color: "rgba(248,250,252,.6)",
    letterSpacing: ".5px",
  },

  streamGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 10,
  },
  streamCard: {
    padding: 16,
    background: "rgba(255,255,255,.03)",
    border: "1px solid rgba(255,255,255,.07)",
    borderRadius: 2,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    color: "inherit",
    transition: "all .2s",
  },
  streamCardName: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: ".95rem",
    marginBottom: 6,
  },
  streamCardCount: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: "1.1rem",
    color: "#F8FAFC",
    marginBottom: 10,
  },

  streamBlock: {
    marginBottom: 28,
  },
  streamHeaderRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 0 12px",
    borderBottom: "1px solid rgba(255,255,255,.07)",
    marginBottom: 10,
  },
  streamDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  streamHeaderName: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: ".78rem",
    letterSpacing: 2,
    flex: 1,
  },
  streamHeaderCount: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontSize: ".78rem",
    fontWeight: 700,
    color: "rgba(248,250,252,.55)",
  },

  taskRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    padding: "14px 16px",
    marginBottom: 8,
    border: "1px solid rgba(255,255,255,.07)",
    borderRadius: 2,
    cursor: "pointer",
    transition: "background .35s ease, border-color .35s ease, opacity .35s ease",
  },
  checkbox: {
    width: 20,
    height: 20,
    border: "2px solid",
    borderRadius: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
    transition: "background .35s ease, border-color .35s ease",
  },
  checkmark: {
    color: "#050505",
    fontSize: ".9rem",
    fontWeight: 800,
    lineHeight: 1,
  },
  taskText: {
    fontFamily: "'Karla', sans-serif",
    fontSize: "1rem",
    lineHeight: 1.5,
    transition: "all .2s",
  },
  taskNote: {
    fontFamily: "'Karla', sans-serif",
    fontStyle: "italic",
    fontSize: ".88rem",
    color: "rgba(248,250,252,.5)",
    marginTop: 4,
    lineHeight: 1.5,
  },
  streamTag: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontSize: ".68rem",
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    padding: "4px 8px",
    border: "1px solid",
    borderRadius: 2,
    flexShrink: 0,
    whiteSpace: "nowrap",
    marginTop: 2,
  },

  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(5,5,5,.85)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 20,
  },
  modal: {
    maxWidth: 420,
    width: "100%",
    padding: 28,
    background: "#0A0A0A",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 2,
  },
  modalTitle: {
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontWeight: 800,
    fontSize: "1.3rem",
    color: "#F8FAFC",
    marginBottom: 10,
  },
  modalBody: {
    fontSize: ".95rem",
    color: "rgba(248,250,252,.7)",
    marginBottom: 20,
    lineHeight: 1.5,
  },
  modalActions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
  },

  scrollTopBtn: {
    position: "fixed",
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "rgba(255,23,68,.12)",
    border: "1px solid rgba(255,23,68,.4)",
    color: "#F8FAFC",
    fontFamily: "'Albert Sans', system-ui, sans-serif",
    fontSize: "1.8rem",
    fontWeight: 600,
    cursor: "pointer",
    zIndex: 50,
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    boxShadow: "0 8px 32px rgba(255,23,68,.35), inset 0 1px 0 rgba(255,255,255,.15)",
    transition: "all .25s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    padding: 0,
  },
};

// ===== RESPONSIVE =====
if (typeof document !== "undefined") {
  const id = "move-plan-responsive";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Albert+Sans:wght@300;400;500;700;800&family=Karla:ital,wght@0,300;0,400;0,500;0,700;0,800;1,400&display=swap');
      @media (max-width: 768px) {
        .mp-container {
          padding: 24px 16px 100px !important;
        }
        .mp-stat-row {
          grid-template-columns: 1fr 1fr !important;
          gap: 8px !important;
        }
        .mp-phase-stepper-wrap {
          grid-column: 1 / -1 !important;
        }
        .mp-chart-card {
          padding: 14px 10px 12px !important;
          min-height: 200px !important;
        }
        .mp-chart-wrap {
          width: 120px !important;
          height: 120px !important;
        }
        .mp-chart-center-value {
          font-size: 1.7rem !important;
        }
        .mp-chart-label {
          font-size: .62rem !important;
          letter-spacing: 1px !important;
        }
        div[style*="grid-template-columns: repeat(5, 1fr)"] {
          grid-template-columns: repeat(2, 1fr) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
