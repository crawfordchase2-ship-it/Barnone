// ============================================================
// BAR NONE — THE PROGRAM
// v6.21 - assisted pull-ups rebuilt on EFFECTIVE load (bodyweight - assistance) reusing the normal engine; entered number = assistance for 1 rep; uses latest logged bodyweight; per-set assistance derived; setup/alert/friend/progress all converted; prompts if no bodyweight logged
// ======================================================================================

import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar } from "recharts";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tzbyqtcncrgaougrbbdk.supabase.co";
const SUPABASE_KEY = "sb_publishable_kojIVAb_sIhRYr4lEv2kFQ_7Vpc0KIz";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const COLORS = ["#e85d04","#3a86ff","#8338ec","#06d6a0","#f7b731","#ff006e","#00b4d8","#80b918"];
const MAIN_LIFT_OPTIONS = ["Bench","Deadlift","Military Press","Squat","Weighted Pull Up","Assisted Pull Up","Hip Thrust","Custom"];
const DEFAULT_LIFTS = [
  { id:"lift_1", name:"Bench",          mainLiftOption:"Bench",          color:"#e85d04", startingMax:0, trainingDays:[], isLower:false },
  { id:"lift_2", name:"Deadlift",       mainLiftOption:"Deadlift",       color:"#3a86ff", startingMax:0, trainingDays:[], isLower:true  },
  { id:"lift_3", name:"Military Press", mainLiftOption:"Military Press", color:"#8338ec", startingMax:0, trainingDays:[], isLower:false },
  { id:"lift_4", name:"Squat",          mainLiftOption:"Squat",          color:"#06d6a0", startingMax:0, trainingDays:[], isLower:true  },
];
const SUPPORT_LIFTS = {
  "Bench":          ["Incline Bench","Decline Bench","Close Grip Bench","Floor Press","Paused Bench","Reverse Grip Bench","Landmine Press","Dumbbell Press","Incline Dumbbell Press","Weighted Dips","Dips","Push Ups"],
  "Deadlift":       ["Romanian Deadlift","Stiff Leg Deadlift","Rack Pulls","Deficit Deadlift","Pause Deadlift","Sumo Deadlift","Trap Bar Deadlift","Good Mornings","Back Extensions","Hyperextensions","Cable Pull Through"],
  "Military Press": ["Arnold Press","Dumbbell Shoulder Press","Single Arm Dumbbell Press","Push Press","Behind The Neck Press","Z Press","Seated Barbell Press","Bradford Press","Machine Shoulder Press"],
  "Squat":          ["Front Squat","Box Squat","Pause Squat","Safety Bar Squat","Goblet Squat","Bulgarian Split Squat","Hack Squat","Zercher Squat","Split Squat","Sumo Squat","Sissy Squat","Leg Press","Step Ups"],
  "Weighted Pull Up":   ["Chin Up","Neutral Grip Pull Up","Scapular Pull Up","Negative Pull Ups","Lat Pull-Down","Close Grip Pulldown","Wide Grip Pulldown","Neutral Grip Pulldown","Inverted Row","Ring Rows"],
  "Hip Thrust":     ["Glute Bridge","Single Leg Hip Thrust","Cable Kickback","Donkey Kicks","Sumo Squat","Reverse Hyper","Bulgarian Split Squat"],
  "Assisted Pull Up": ["Negative Pull Ups","Scapular Pull Up","Dead Hang","Inverted Row","Ring Rows","Banded Pull Up","Lat Pull-Down","Straight Arm Pulldown"],
  "Custom":         ["Incline Bench","Romanian Deadlift","Dumbbell Press","Arnold Press","Front Squat","Lat Pull-Down"],
};
const ISOLATION_LIFTS = {
  "Chest":     ["Dumbbell Flys","Incline Dumbbell Fly","High Cable Fly","Low Cable Fly","Cable Crossover","Pec Deck","Chest Fly Machine"],
  "Back":      ["Dumbbell Row","Barbell Row","Seated Cable Row","T-Bar Row","Chest Supported Row","Single Arm Cable Row","Pendlay Row","Meadows Row","Kroc Row","Straight Arm Pulldown","Cable Row","Machine Row"],
  "Biceps":    ["Barbell Curls","Dumbbell Curls","Hammer Curls","Preacher Curls","Cable Curls","Incline Dumbbell Curls","Spider Curls","Concentration Curls","EZ Bar Curls","Reverse Curls","Rope Hammer Curls","Wrist Curls"],
  "Triceps":   ["Skull Crushers","Cable Tricep Extension","Overhead Tricep Extension","Tricep Pushdown","Tricep Rope Pushdown","Tricep Bar Pushdown","JM Press","Tate Press","Sven Press","Diamond Push Ups","Close Grip Push Up","Dumbbell Kickbacks"],
  "Shoulders": ["Lateral Raises","Leaning Lateral Raise","Front Raises","Barbell Front Raise","Cable Lateral Raise","Cable Front Raise","Plate Raises","Rear Delt Fly","Cable Rear Delt Fly","Reverse Fly","Face Pulls","Band Pull Apart","Upright Row","Shrugs"],
  "Legs":      ["Leg Extension","Lying Leg Curl","Seated Leg Curl","Single Leg Curl","Nordic Curl","Calf Raises","Seated Calf Raises","Leg Press Calf Raise","Hip Abductor","Hip Adductor","Walking Lunges","Lunges","Box Jumps"],
  "Glutes":    ["Hip Thrust","Glute Bridge","Cable Kickbacks","Donkey Kicks","Reverse Hyper"],
};
const AUX_LIFTS = {
  "Core":         ["Planks","Side Planks","Ab Roller","Ab Wheel","Hanging Leg Raises","Hanging Knee Raises","Cable Crunch","Decline Sit Ups","Russian Twists","Hollow Body Hold","Dragon Flag","Toes To Bar","Pallof Press"],
  "Conditioning": ["Farmers Walk","Sled Push","Sled Pull","Battle Ropes","Box Jumps","Burpees","Jump Rope","Rowing Machine","Assault Bike","Tire Flip","Sandbag Carry","KB Swings","Bear Crawl","Prowler Push"],
  "Mobility":     ["Dead Hang","Band Pull Apart","Face Pulls","Shoulder Dislocates","Hip Flexor Stretch","Pigeon Pose","Thoracic Rotation","Foam Rolling","Cat Cow"],
  "Olympic":      ["Power Clean","Hang Clean","Power Snatch","Hang Snatch","Clean & Jerk","Push Jerk","High Pull","Muscle Snatch"],
};
const ISOLATION_ORDER = {
  "Bench":          ["Triceps","Chest","Shoulders","Back","Biceps","Legs","Glutes"],
  "Military Press": ["Triceps","Shoulders","Chest","Back","Biceps","Legs","Glutes"],
  "Deadlift":       ["Biceps","Back","Triceps","Shoulders","Chest","Legs","Glutes"],
  "Squat":          ["Biceps","Legs","Glutes","Back","Triceps","Shoulders","Chest"],
  "Weighted Pull Up": ["Biceps","Back","Triceps","Shoulders","Chest","Legs","Glutes"],
  "Hip Thrust":     ["Glutes","Legs","Biceps","Back","Triceps","Shoulders","Chest"],
};
const RECOMMENDED_ISOLATION = {
  "Bench":          ["Triceps","Chest"],
  "Military Press": ["Triceps","Shoulders"],
  "Deadlift":       ["Biceps","Back"],
  "Squat":          ["Biceps","Legs"],
  "Weighted Pull Up": ["Biceps","Back"],
  "Hip Thrust":     ["Glutes","Legs"],
};

const HYPE = ["Time to move some weight!","Let's get after it!","No excuses. Let's go!","Your future self will thank you.","The bar is waiting.","Stronger than last week. Prove it."];
const DAY_ABBR = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// C25K Plan - keyed by number of days per week (2 or 3)
const C25K_PLAN = {
  2: [
    {week:1,  goal:"START MOVING",          days:[
      {day:1, intervals:[{type:"walk",duration:5,label:"Warm up walk"},{type:"repeat",reps:8,intervals:[{type:"jog",duration:1},{type:"walk",duration:1.5}]},{type:"walk",duration:5,label:"Cool down"}], totalMin:28},
      {day:2, intervals:[{type:"walk",duration:5,label:"Warm up walk"},{type:"repeat",reps:8,intervals:[{type:"jog",duration:1},{type:"walk",duration:1.5}]},{type:"walk",duration:5,label:"Cool down"}], totalMin:28},
    ]},
    {week:2,  goal:"BUILD RHYTHM",          days:[
      {day:1, intervals:[{type:"walk",duration:5},{type:"repeat",reps:6,intervals:[{type:"jog",duration:1.5},{type:"walk",duration:2}]},{type:"walk",duration:5}], totalMin:30},
      {day:2, intervals:[{type:"walk",duration:5},{type:"repeat",reps:6,intervals:[{type:"jog",duration:1.5},{type:"walk",duration:2}]},{type:"walk",duration:5}], totalMin:30},
    ]},
    {week:3,  goal:"LONGER INTERVALS",      days:[
      {day:1, intervals:[{type:"walk",duration:5},{type:"repeat",reps:2,intervals:[{type:"jog",duration:1.5},{type:"walk",duration:1.5},{type:"jog",duration:3},{type:"walk",duration:3}]},{type:"walk",duration:5}], totalMin:30},
      {day:2, intervals:[{type:"walk",duration:5},{type:"repeat",reps:2,intervals:[{type:"jog",duration:1.5},{type:"walk",duration:1.5},{type:"jog",duration:3},{type:"walk",duration:3}]},{type:"walk",duration:5}], totalMin:30},
    ]},
    {week:4,  goal:"PUSH THROUGH",          days:[
      {day:1, intervals:[{type:"walk",duration:5},{type:"jog",duration:3},{type:"walk",duration:1.5},{type:"jog",duration:5},{type:"walk",duration:2.5},{type:"jog",duration:3},{type:"walk",duration:1.5},{type:"jog",duration:5},{type:"walk",duration:5}], totalMin:31},
      {day:2, intervals:[{type:"walk",duration:5},{type:"jog",duration:3},{type:"walk",duration:1.5},{type:"jog",duration:5},{type:"walk",duration:2.5},{type:"jog",duration:3},{type:"walk",duration:1.5},{type:"jog",duration:5},{type:"walk",duration:5}], totalMin:31},
    ]},
    {week:5,  goal:"FIRST CONTINUOUS RUN",  days:[
      {day:1, intervals:[{type:"walk",duration:5},{type:"jog",duration:5},{type:"walk",duration:3},{type:"jog",duration:5},{type:"walk",duration:3},{type:"jog",duration:5},{type:"walk",duration:5}], totalMin:31},
      {day:2, intervals:[{type:"walk",duration:5},{type:"jog",duration:20,label:"Continuous run!"},{type:"walk",duration:5}], totalMin:30},
    ]},
    {week:6,  goal:"EXTEND RUNS",           days:[
      {day:1, intervals:[{type:"walk",duration:5},{type:"jog",duration:5},{type:"walk",duration:3},{type:"jog",duration:8},{type:"walk",duration:3},{type:"jog",duration:5},{type:"walk",duration:5}], totalMin:34},
      {day:2, intervals:[{type:"walk",duration:5},{type:"jog",duration:22,label:"Continuous run"},{type:"walk",duration:5}], totalMin:32},
    ]},
    {week:7,  goal:"25 MIN CONTINUOUS",     days:[
      {day:1, intervals:[{type:"walk",duration:5},{type:"jog",duration:25,label:"Continuous run"},{type:"walk",duration:5}], totalMin:35},
      {day:2, intervals:[{type:"walk",duration:5},{type:"jog",duration:25,label:"Continuous run"},{type:"walk",duration:5}], totalMin:35},
    ]},
    {week:8,  goal:"28 MIN CONTINUOUS",     days:[
      {day:1, intervals:[{type:"walk",duration:5},{type:"jog",duration:28,label:"Continuous run"},{type:"walk",duration:5}], totalMin:38},
      {day:2, intervals:[{type:"walk",duration:5},{type:"jog",duration:28,label:"Continuous run"},{type:"walk",duration:5}], totalMin:38},
    ]},
    {week:9,  goal:"30 MIN / 5K!",          days:[
      {day:1, intervals:[{type:"walk",duration:5},{type:"jog",duration:30,label:"You got this!"},{type:"walk",duration:5}], totalMin:40},
      {day:2, intervals:[{type:"walk",duration:5},{type:"jog",duration:30,label:"You got this!"},{type:"walk",duration:5}], totalMin:40},
    ]},
    {week:10, goal:"BUILD DISTANCE",        days:[
      {day:1, intervals:[{type:"walk",duration:5},{type:"jog",duration:32},{type:"walk",duration:5}], totalMin:42},
      {day:2, intervals:[{type:"walk",duration:5},{type:"jog",duration:32},{type:"walk",duration:5}], totalMin:42},
    ]},
    {week:11, goal:"FIND YOUR PACE",        days:[
      {day:1, intervals:[{type:"walk",duration:5},{type:"jog",duration:35},{type:"walk",duration:5}], totalMin:45},
      {day:2, intervals:[{type:"walk",duration:5},{type:"jog",duration:35},{type:"walk",duration:5}], totalMin:45},
    ]},
    {week:12, goal:"RACE DAY!",             days:[
      {day:1, intervals:[{type:"walk",duration:5},{type:"jog",duration:38},{type:"walk",duration:5}], totalMin:48},
      {day:2, intervals:[{type:"walk",duration:5},{type:"jog",duration:0,label:"🏁 5K RACE DAY! Run 5 kilometers!"}], totalMin:35},
    ]},
  ]
};
// 3-day plan = 2-day plan + extra easy day
C25K_PLAN[3] = C25K_PLAN[2].map(week => ({
  ...week,
  days: [...week.days, {
    day:3,
    intervals:[{type:"walk",duration:5},{type:"jog",duration: week.week < 5 ? 20 : week.week < 9 ? 25 : 30, label:"Easy recovery run"},{type:"walk",duration:5}],
    totalMin: week.week < 5 ? 30 : 35,
    isEasy: true
  }]
}));

let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _audioCtx;
}
function playBeeps(ctx) {
  [0, 0.3, 0.6].forEach(delay => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.6, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.25);
  });
}
function playTimerSound() {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().then(() => playBeeps(ctx)).catch(()=>{});
    } else {
      playBeeps(ctx);
    }
  } catch(e) {}
}
// Prime AND keep audio alive - call on every user interaction
function primeAudio() {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === "suspended") ctx.resume();
    // Play a silent buffer to keep context alive on iOS
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch(e) {}
}
function fmtDuration(secs) {
  if (!secs || secs <= 0) return "0:00";
  const h = Math.floor(secs/3600);
  const m = Math.floor((secs%3600)/60);
  const s = secs%60;
  if (h > 0) return h+":"+String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
  return m+":"+String(s).padStart(2,"0");
}

const ROOT_KEY = "barnone_v5"; // kept for legacy session cleanup

function isAssistedPullUp(lift) { return lift?.mainLiftOption === "Assisted Pull Up"; }

// Assisted pull-ups now run on EFFECTIVE load (bodyweight − assistance) through the same engine as
// every other lift — see getEffMax/getWorkingMax. The entered startingMax is the assistance needed
// for one rep (the 1RM-equivalent floor); per-set assistance is derived in render as bodyweight − load.

function calcCurrentMax(s) { return Math.round(s * 0.9 / 5) * 5; }
function calcTrueMax(s) { return s; } // The actual max the user entered
function calcWorkingWeights(m) {
  return [Math.round(m*.50/5)*5, Math.round(m*.5833/5)*5, Math.round(m*.6667/5)*5, Math.round(m*.75/5)*5];
}
function calcEstMax(w, r) {
  if (+r <= 10) return null;
  return Math.round((w*1.1*r*0.0333 + w*1.1)/5)*5;
}
function calcNextMax(cur, em, isLower) {
  if (!em) return cur;
  const d = em - cur;
  return isLower ? (d>=20?cur+15:d>=10?cur+10:cur) : (d>=20?cur+10:d>=10?cur+5:cur);
}
function calcBMI(wlbs, hin) {
  if (!wlbs || !hin) return null;
  return ((wlbs / (hin * hin)) * 703).toFixed(1);
}
function bmiCat(b) { b=+b; return b<18.5?"Underweight":b<25?"Normal":b<30?"Overweight":"Obese"; }
function bmiCol(b) { b=+b; return b<18.5?"#3a86ff":b<25?"#06d6a0":b<30?"#f7b731":"#e85d04"; }
function fmtDate(iso) { return iso ? new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : ""; }
function todayISO() { return new Date().toISOString().split("T")[0]; }

// Supabase data functions
async function loadUD(userId) {
  const { data } = await supabase.from("user_data").select("*").eq("user_id", userId).single();
  return data;
}
async function saveProgramToHistory(userId, archive) {
  console.log("Saving program to history for user:", userId);
  const { error } = await supabase.from("program_history").insert({
    user_id: userId,
    start_date: archive.startDate || "",
    end_date: archive.endDate || "",
    program_id: archive.programId || "",
    lifts: archive.lifts || [],
    final_maxes: archive.finalMaxes || {},
    sessions_completed: archive.sessionsCompleted || 0,
    total_possible: archive.totalPossible || 0,
    best_streak: archive.bestStreak || 0,
    total_volume: archive.totalVolume || 0,
    logs: archive.logs || {},
    lift_weeks: archive.liftWeeks || {},
    completed_days: archive.completedDays || {},
    acc_list: archive.accList || {},
  });
  if (error) console.error("Error saving program history:", error);
}

async function loadProgramHistory(userId) {
  const { data, error } = await supabase
    .from("program_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) { 
    console.error("Error loading program history:", error); 
    console.error("Error details:", JSON.stringify(error));
    return []; 
  }
  console.log("Loaded program history:", data?.length, "records");
  return (data || []).map(p => ({
    id: p.id,
    startDate: p.start_date,
    endDate: p.end_date,
    programId: p.program_id,
    lifts: p.lifts,
    finalMaxes: p.final_maxes,
    sessionsCompleted: p.sessions_completed,
    totalPossible: p.total_possible,
    bestStreak: p.best_streak,
    totalVolume: p.total_volume,
    logs: p.logs,
    liftWeeks: p.lift_weeks,
    completedDays: p.completed_days,
    accList: p.acc_list,
  }));
}

async function deleteProgramFromHistory(id) {
  await supabase.from("program_history").delete().eq("id", id);
}

async function saveUD(userId, d) {
  await supabase.from("user_data").upsert({
    user_id: userId,
    lifts: d.lifts,
    start_date: d.startDate,
    logs: d.logs,
    completed_days: d.completedDays,
    acc_list: d.accList,
    exercise_history: d.exerciseHistory,
    weight_adjust: d.weightAdjust,
    lift_weeks: d.liftWeeks,
    custom_accessories: d.customAccessories,
    session_ledger: d.sessionLedger,
    body_stats: d.bodyStats,
    weight_nudge: d.weightNudge,
    program_started: d.programStarted,
    program_id: d.programId,
    program_name: d.programName,
    workout_in_progress: d.workoutInProgress,
    in_progress_lift_id: d.inProgressLiftId,
    workout_start_time: d.workoutStartTime,
    run_days: d.runDays,
    run_week: d.runWeek,
    run_day: d.runDay,
    run_history: d.runHistory,
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id" });
}

export default function App() {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [authForm, setAuthForm] = useState({ name:"", email:"", password:"", confirm:"" });
  const [authErr, setAuthErr] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authScreen, setAuthScreen] = useState("login");

  const [lifts, setLifts] = useState(DEFAULT_LIFTS);
  const [startDate, setStartDate] = useState("");
  const [activeId, setActiveId] = useState(DEFAULT_LIFTS[0].id);
  const [view, setView] = useState("dashboard");
  const [logs, setLogs] = useState({});
  const [completedDays, setCompletedDays] = useState({});
  const [accList, setAccList] = useState({});
  const [exerciseHistory, setExerciseHistory] = useState({});
  const [weightAdjust, setWeightAdjust] = useState({});
  const [liftWeeks, setLiftWeeks] = useState(Object.fromEntries(DEFAULT_LIFTS.map(l=>[l.id,1])));
  const [customAccessories, setCustomAccessories] = useState({});
  const [sessionLedger, setSessionLedger] = useState([]);
  const [bodyStats, setBodyStats] = useState({ heightIn:"", entries:[] });
  const [programHistory, setProgramHistory] = useState([]);
  const [viewingWeek, setViewingWeek] = useState(1);
  const [editingPastWeek, setEditingPastWeek] = useState(false);
  const [selectedAcc, setSelectedAcc] = useState({});
  const [customAccInput, setCustomAccInput] = useState({});
  const [accSectionOpen, setAccSectionOpen] = useState({support:true,isolation:false,aux:false});
  const [previewLift, setPreviewLift] = useState(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [restTimer, setRestTimer] = useState(null); // seconds remaining (display only)
  const [restRunning, setRestRunning] = useState(false);
  const [restDuration, setRestDuration] = useState(90);
  const [restStartTime, setRestStartTime] = useState(null); // ISO timestamp when rest started
  const [reactorsOpen, setReactorsOpen] = useState(null); // postKey of expanded "who reacted" list
  const [editingProgram, setEditingProgram] = useState(false); // mid-program editor open/closed
  const APP_VERSION = "v6.21";
  const [theme, setTheme] = useState(() => localStorage.getItem("barnone_theme") || "dark");
  const [weightUnit, setWeightUnit] = useState(() => localStorage.getItem("barnone_unit") || "lbs");
  function setThemePref(t) { setTheme(t); localStorage.setItem("barnone_theme", t); }
  function setWeightUnitPref(u) { setWeightUnit(u); localStorage.setItem("barnone_unit", u); }
  const [showProfile, setShowProfile] = useState(false);
  const [weightEntry, setWeightEntry] = useState("");
  const [heightFtEntry, setHeightFtEntry] = useState("");
  const [heightInEntry, setHeightInEntry] = useState("");
  const [showWeightPrompt, setShowWeightPrompt] = useState(false);
  const [finishAlert, setFinishAlert] = useState(null);
  const [prAlert, setPrAlert] = useState(null);
  const [restAlert, setRestAlert] = useState(false);
  const [newWeekAlert, setNewWeekAlert] = useState(null);
  const [streakAlert, setStreakAlert] = useState(false);
  const [weightNudge, setWeightNudge] = useState({ weekKey:"", skips:0 });
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);
  const [workoutInProgress, setWorkoutInProgress] = useState(false);
  const [inProgressLiftId, setInProgressLiftId] = useState(null);
  const [workoutStartTime, setWorkoutStartTime] = useState(null); // ISO timestamp when workout started
  const [workoutElapsed, setWorkoutElapsed] = useState(0); // seconds elapsed, updates every second
  const [workoutPausedAt, setWorkoutPausedAt] = useState(null); // ISO timestamp when paused, null if running
  // Running module
  const [runDays, setRunDays] = useState([]);
  const [runWeek, setRunWeek] = useState(1);
  const [runDay, setRunDay] = useState(1);
  const [runHistory, setRunHistory] = useState([]);
  const [runView, setRunView] = useState("today");
  const [showRunLog, setShowRunLog] = useState(false);
  const [runAnyway, setRunAnyway] = useState(false); // lets user do today's run on a non-scheduled day
  const [runDistEntry, setRunDistEntry] = useState("");
  const [runNotesEntry, setRunNotesEntry] = useState("");
  const [runMinEntry, setRunMinEntry] = useState("");
  const [runSecEntry, setRunSecEntry] = useState("");
  const [setupSnapshot, setSetupSnapshot] = useState(null);
  const [shareCard, setShareCard] = useState(null);
  const [confirmContinue, setConfirmContinue] = useState(null);
  const [continueError, setContinueError] = useState(null);
  const [confirmDeleteSession, setConfirmDeleteSession] = useState(null);
  const [postWorkoutScreen, setPostWorkoutScreen] = useState(null);
  const [reviewingCompletedWorkout, setReviewingCompletedWorkout] = useState(false); // {liftName, week, vol, estMax, color}
  const [expandedProgramId, setExpandedProgramId] = useState(null); // stores the program to continue
  const [programId, setProgramId] = useState("");
  const [programName, setProgramName] = useState("");
  const [programStarted, setProgramStarted] = useState(false);
  const [showSocial, setShowSocial] = useState(false);
  const [newReactionCount, setNewReactionCount] = useState(0);
  const [newFriendSessions, setNewFriendSessions] = useState(0);
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [lastSeenReaction, setLastSeenReaction] = useState("");
  const [socialTab, setSocialTab] = useState("feed");
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [myReactions, setMyReactions] = useState([]); // reactions I received
  const [sentReactions, setSentReactions] = useState([]); // reactions I sent
  const [friendSearch, setFriendSearch] = useState("");
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [username, setUsername] = useState("");
  const [usernameEntry, setUsernameEntry] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const timerRef = useRef(null);

  // Restore session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setCurrentUser(session.user);
        setAuthScreen(null);
        loadUserIntoState(session.user.id);
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setCurrentUser(session.user);
        setAuthScreen(null);
        // Only reload data on SIGNED_IN event, not token refresh
        if (_event === "SIGNED_IN") {
          setDataLoaded(false);
          loadUserIntoState(session.user.id);
        }
      } else {
        setDataLoaded(false);
        setAuthScreen("login");
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const uid = session?.user?.id;
  const readyToStart = lifts.every(l=>l.startingMax>0) && 
    startDate && 
    (heightFtEntry || bodyStats.heightIn) && 
    (weightEntry || bodyStats.entries.length > 0) &&
    lifts.every(l=>(l.trainingDays||[]).length>0);
  const hasSetup = readyToStart && programStarted;
  // Running on/off lives inside bodyStats jsonb (no schema change). Defaults to on for existing data.
  const runActive = bodyStats?.runActive !== false;

  // Workout elapsed timer
  useEffect(() => {
    if (!workoutInProgress || !workoutStartTime) { setWorkoutElapsed(0); return; }
    const tick = () => {
      const endRef = workoutPausedAt ? new Date(workoutPausedAt).getTime() : Date.now();
      setWorkoutElapsed(Math.max(0, Math.floor((endRef - new Date(workoutStartTime).getTime()) / 1000)));
    };
    tick();
    if (workoutPausedAt) return; // frozen while paused — no ticking
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [workoutInProgress, workoutStartTime, workoutPausedAt]);

  function pauseWorkout() {
    const nowISO = new Date().toISOString();
    setWorkoutPausedAt(nowISO);
    if (uid) localStorage.setItem("barnone_pausedat_" + uid, nowISO);
  }
  function resumeWorkout() {
    if (!workoutPausedAt || !workoutStartTime) { setWorkoutPausedAt(null); return; }
    const pausedMs = Date.now() - new Date(workoutPausedAt).getTime();
    // Shift start forward by the paused duration so elapsed continues seamlessly (and persists)
    setWorkoutStartTime(new Date(new Date(workoutStartTime).getTime() + pausedMs).toISOString());
    setWorkoutPausedAt(null);
    if (uid) localStorage.removeItem("barnone_pausedat_" + uid);
  }

  useEffect(() => {
    if (!uid || !dataLoaded) return;
    const timer = setTimeout(() => {
      saveUD(uid, { lifts, startDate, activeId, logs, completedDays, accList, exerciseHistory, weightAdjust, liftWeeks, customAccessories, sessionLedger, bodyStats, weightNudge, programStarted, programId, programName, workoutInProgress, inProgressLiftId, workoutStartTime, runDays, runWeek, runDay, runHistory });
    }, 800);
    return () => clearTimeout(timer);
  }, [lifts,startDate,activeId,logs,completedDays,accList,exerciseHistory,weightAdjust,liftWeeks,customAccessories,sessionLedger,bodyStats,weightNudge,programStarted,uid,dataLoaded,runDays,runWeek,runDay,runHistory,workoutInProgress,inProgressLiftId,workoutStartTime,programName]);

  useEffect(() => {
    if (restRunning && restTimer > 0) {
      timerRef.current = setTimeout(() => setRestTimer(t => t-1), 1000);
    } else if (restTimer === 0 && restRunning) {
      setRestRunning(false);
      playTimerSound();
      setRestAlert(true);
    }
    return () => clearTimeout(timerRef.current);
  }, [restRunning, restTimer]);

  // PR notification
  function checkForPR(liftId, estMax) {
    if (!estMax) return;
    const lift = lifts.find(l => l.id === liftId);
    if (!lift) return;
    const prevMax = getEffMax(liftId, liftWeeks[liftId] || 1);
    if (estMax > prevMax) {
      setPrAlert({ liftName: lift.name, estMax, prevMax, color: lift.color });
    }
  }

  // New week notification - only on scheduled training day
  useEffect(() => {
    if (!hasSetup || !uid) return;
    const todayAbbr = DAY_ABBR[new Date().getDay()];
    lifts.forEach(l => {
      const w = liftWeeks[l.id] || 1;
      if (w <= 1) return;
      // Only notify on a day this lift is scheduled
      if (l.active===false || !(l.trainingDays||[]).includes(todayAbbr)) return;
      // Don't notify if this lift was completed in the previous week (just finished)
      // completedDays is keyed by week number, w is already advanced to next week
      const justCompleted = completedDays?.[w-1]?.[l.id];
      const loggedToday = sessionLedger.some(s => s.date === todayISO() && s.liftId === l.id);
      if ((justCompleted === true || justCompleted?.done) && loggedToday) return;
      const key = "barnone_newweek_" + uid + "_" + l.id + "_w" + w + "_" + todayISO();
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
      const lAssist = l.mainLiftOption==="Assisted Pull Up";
      const bwA = latestBodyweight();
      const wts = (lAssist && bwA!=null)
        ? calcWorkingWeights(getWorkingMax(l.id, w)).map(x=>Math.max(0,Math.round((bwA-x)/5)*5))
        : calcWorkingWeights(getWorkingMax(l.id, w));
      setNewWeekAlert({ liftName: l.name, week: w, weights: wts, color: l.color, assist: lAssist });
    });
  }, [liftWeeks, hasSetup, uid]);

  // Streak reminder - if no session logged in 3+ days
  useEffect(() => {
    if (!hasSetup || !uid || !sessionLedger.length) return;
    const key = "barnone_streak_" + uid + "_" + todayISO();
    if (localStorage.getItem(key)) return;
    const lastDate = sessionLedger[0]?.date;
    if (!lastDate) return;
    const daysSince = Math.floor((new Date(todayISO()) - new Date(lastDate)) / 86400000);
    if (daysSince >= 3) {
      localStorage.setItem(key, "1");
      setStreakAlert(true);
    }
  }, [hasSetup, uid, sessionLedger]);

  // Weekly summary - fires on Sunday
  useEffect(() => {
    if (!hasSetup || !uid) return;
    const today = new Date();
    if (today.getDay() !== 0) return; // Sunday only
    const key = "barnone_summary_" + uid + "_" + todayISO();
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - 6);
    const weekSessions = sessionLedger.filter(s => new Date(s.date) >= thisWeekStart);
    if (!weekSessions.length) return;
    const totalVol = weekSessions.reduce((sum, s) => sum + (s.volume || 0), 0);
    setFinishAlert({
      liftName: "WEEKLY SUMMARY",
      week: null,
      vol: totalVol,
      estMax: null,
      color: "#8338ec"
    });
  }, [hasSetup, uid]);

  async function loadUserIntoState(userId) {
    const d = await loadUD(userId);
    if (d) {
      setLifts(d.lifts || DEFAULT_LIFTS);
      setStartDate(d.start_date || "");
      // If workout in progress, restore that lift; else auto-select today's
      const loadedLifts = d.lifts || DEFAULT_LIFTS;
      if (d.workout_in_progress && d.in_progress_lift_id) {
        setActiveId(d.in_progress_lift_id);
      } else {
        const todayAbbr = DAY_ABBR[new Date().getDay()];
        const todayLift = loadedLifts.find(l => l.active!==false && (l.trainingDays||[]).includes(todayAbbr));
        setActiveId(todayLift?.id || d.activeId || loadedLifts[0]?.id || DEFAULT_LIFTS[0].id);
      }
      setLogs(d.logs || {});
      // Migrate old completedDays format (true) to {done, date}
      const rawCD = d.completed_days || {};
      const today = new Date().toISOString().split("T")[0];
      const migratedCD = JSON.parse(JSON.stringify(rawCD));
      Object.keys(migratedCD).forEach(week => {
        Object.keys(migratedCD[week]).forEach(liftId => {
          if (migratedCD[week][liftId] === true) {
            migratedCD[week][liftId] = {done: true, date: today};
          }
        });
      });
      setCompletedDays(migratedCD);
      setAccList(d.acc_list || {});
      setExerciseHistory(d.exercise_history || {});
      setWeightAdjust(d.weight_adjust || {});
      // Self-healing week: derive each lift's week from completed history, and never let the
      // stored counter sit BELOW it. max() preserves a manual advance while fixing downward drift.
      const loadedLiftWeeks = d.lift_weeks || Object.fromEntries(DEFAULT_LIFTS.map(l=>[l.id,1]));
      const healedWeeks = {...loadedLiftWeeks};
      loadedLifts.forEach(l => {
        let maxCompleted = 0;
        Object.keys(migratedCD).forEach(w => {
          const cd = migratedCD[w]?.[l.id];
          if ((cd === true || cd?.done) && +w > maxCompleted) maxCompleted = +w;
        });
        const derived = Math.min(12, maxCompleted + 1);
        healedWeeks[l.id] = Math.max(loadedLiftWeeks[l.id] || 1, derived);
      });
      setLiftWeeks(healedWeeks);
      setCustomAccessories(d.custom_accessories || {});
      setSessionLedger(d.session_ledger || []);
      const loadedStats = d.body_stats || { heightIn:"", entries:[] };
      // Make sure entries is always an array
      if (!Array.isArray(loadedStats.entries)) loadedStats.entries = [];
      setBodyStats(loadedStats);
      // Program history loaded separately from program_history table
      const ph = await loadProgramHistory(userId);
      setProgramHistory(ph);
      setWeightNudge(d.weight_nudge || { weekKey:"", skips:0 });
      setProgramId(d.program_id || "");
      setProgramName(d.program_name || "");
      setWorkoutInProgress(d.workout_in_progress || false);
      setInProgressLiftId(d.in_progress_lift_id || null);
      setWorkoutStartTime(d.workout_start_time || null);
      const pausedAtStored = (typeof localStorage !== "undefined") ? localStorage.getItem("barnone_pausedat_" + userId) : null;
      setWorkoutPausedAt(d.workout_in_progress && pausedAtStored ? pausedAtStored : null);
      setRunDays(d.run_days || []);
      setRunWeek(d.run_week || 1);
      setRunDay(d.run_day || 1);
      setRunHistory(d.run_history || []);
      // Infer programStarted from any existing data
      const inferred = d.program_started ||
        (d.lifts && d.lifts.some(l => l.startingMax > 0) && d.start_date) ||
        (d.logs && Object.keys(d.logs).length > 0) ||
        (d.completed_days && Object.keys(d.completed_days).length > 0) ||
        false;
      setProgramStarted(inferred);
    }
    // Tag any old sessions missing programId with current programId
    const pid = d.program_id || "";
    if (pid && d.session_ledger && d.session_ledger.some(s => !s.programId)) {
      const tagged = d.session_ledger.map(s => s.programId ? s : {...s, programId: pid});
      await supabase.from("user_data").update({session_ledger: tagged}).eq("user_id", userId);
      d.session_ledger = tagged;
    }
    setDataLoaded(true);
    // Open to setup if program not started
    // If workout in progress, go straight back to workout
    if (!d.program_started) {
      setView("setup");
    } else if (d.workout_in_progress) {
      setView("workout");
    } else {
      setView("dashboard");
    }
    // Save snapshot for cancel
    loadSocialData(userId);
  }

  async function loadSocialData(userId) {
    if (!userId) return;
    const { data: profile } = await supabase
      .from("public_profiles").select("*").eq("id", userId).single();
    if (profile) {
      setUsername(profile.username || "");
      setUsernameEntry(profile.username || "");
      setIsPublic(profile.is_public || false);
      setDisplayName(profile.name || currentUser?.user_metadata?.name || "");
    }
    const { data: requests } = await supabase
      .from("friend_requests")
      .select("id, from_id, to_id, status")
      .or("from_id.eq." + userId + ",to_id.eq." + userId);
    if (requests) {
      const pendingRequests = requests.filter(r => r.status === "pending" && r.to_id === userId);
      // Fetch sender names
      if (pendingRequests.length > 0) {
        const senderIds = pendingRequests.map(r => r.from_id);
        const { data: senderProfiles } = await supabase
          .from("public_profiles").select("id, name, username").in("id", senderIds);
        const requestsWithNames = pendingRequests.map(r => ({
          ...r,
          from_name: senderProfiles?.find(p => p.id === r.from_id)?.name || "Someone",
          from_username: senderProfiles?.find(p => p.id === r.from_id)?.username || ""
        }));
        setFriendRequests(requestsWithNames);
      } else {
        setFriendRequests([]);
      }
      const accepted = requests.filter(r => r.status === "accepted");
      const friendIds = accepted.map(r => r.from_id === userId ? r.to_id : r.from_id);
      if (friendIds.length > 0) {
        const { data: friendData } = await supabase
          .from("user_data").select("user_id, lifts, lift_weeks, logs, session_ledger, run_history")
          .in("user_id", friendIds);
        const { data: friendProfiles } = await supabase
          .from("public_profiles").select("id, name, username")
          .in("id", friendIds);
        if (friendData && friendProfiles) {
          const merged = friendProfiles.map(p => ({
            ...p,
            ...(friendData.find(d => d.user_id === p.id) || {})
          }));
          setFriends(merged);
          // Count new friend sessions since last check
          const lastCheck = localStorage.getItem("barnone_social_check_" + userId) || "";
          let newCount = 0;
          merged.forEach(f => {
            const sessions = f.session_ledger || [];
            if (sessions.length > 0 && sessions[0].date > lastCheck) newCount++;
          });
          setNewFriendSessions(newCount);
        }
      }
    }
    const { data: reactions } = await supabase
      .from("reactions").select("*").eq("to_id", userId)
      .order("created_at", { ascending: false }).limit(50);
    if (reactions) {
      setMyReactions(reactions);
      const lastSeen = localStorage.getItem("barnone_last_reaction_" + userId) || "";
      const newCount = reactions.filter(r => r.created_at > lastSeen).length;
      setNewReactionCount(newCount);
      setLastSeenReaction(reactions[0]?.created_at || "");
    }
    // Load reactions I sent so we can show selected state
    const { data: sentR } = await supabase
      .from("reactions").select("*").eq("from_id", userId)
      .order("created_at", { ascending: false }).limit(100);
    if (sentR) setSentReactions(sentR);
  }


  async function handleRegister() {
    setAuthErr("");
    const { name, email, password, confirm } = authForm;
    if (!name.trim()||!email.trim()||!password) { setAuthErr("All fields required."); return; }
    if (!email.includes("@")) { setAuthErr("Enter a valid email."); return; }
    if (password.length < 6) { setAuthErr("Password must be 6+ characters."); return; }
    if (password !== confirm) { setAuthErr("Passwords don't match."); return; }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } }
    });
    if (error) { setAuthErr(error.message); return; }
    setCurrentUser(data.user);
    setAuthScreen(null);
    setAuthForm({ name:"", email:"", password:"", confirm:"" });
  }

  async function handleLogin() {
    setAuthErr("");
    const { email, password } = authForm;
    if (!email||!password) { setAuthErr("Email and password required."); return; }
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password,
      options: { persistSession: rememberMe }
    });
    if (error) { setAuthErr(error.message); return; }
    setCurrentUser(data.user);
    setSession(data.session);
    await loadUserIntoState(data.user.id);
    setAuthScreen(null);
    setAuthForm({ name:"", email:"", password:"", confirm:"" });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setAuthScreen("login");
    setShowProfile(false);
  }

  // Latest logged bodyweight in lbs (entries are stored newest-first), or null if none yet.
  function latestBodyweight() {
    const w = bodyStats?.entries?.[0]?.weightLbs;
    return w ? +w : null;
  }

  function getEffMax(liftId, targetWeek) {
    const lift = lifts.find(l=>l.id===liftId);
    if (!lift) return 0;
    if (isAssistedPullUp(lift)) {
      // Assisted pull-ups run on EFFECTIVE load = bodyweight − assistance, reusing the normal engine.
      // The entered startingMax is the assistance needed for ONE rep (the 1RM-equivalent floor).
      const bw = latestBodyweight();
      if (bw == null) return lift.startingMax || 0; // no bodyweight yet — can't convert; UI will prompt
      let workingMax = calcCurrentMax(Math.max(0, bw - (lift.startingMax||0))); // working max of effective 1RM
      for (let w=1; w<targetWeek; w++) {
        const log = logs?.[w]?.[liftId]?.[3];
        if (log?.reps && +log.reps>10) {
          const em = calcEstMax(calcWorkingWeights(workingMax)[3], +log.reps);
          workingMax = calcNextMax(workingMax, em, lift.isLower);
        }
      }
      const effTrueMax = Math.round(workingMax/0.9/5)*5; // effective 1RM at this week
      return Math.max(0, Math.round((bw - effTrueMax)/5)*5); // assistance needed for 1 rep
    }
    // Start with the true max (what user entered), convert to working max internally
    let workingMax = calcCurrentMax(lift.startingMax||0);
    for (let w=1; w<targetWeek; w++) {
      const log = logs?.[w]?.[liftId]?.[3];
      if (log?.reps && +log.reps>10) {
        const em = calcEstMax(calcWorkingWeights(workingMax)[3], +log.reps);
        workingMax = calcNextMax(workingMax, em, lift.isLower);
      }
    }
    // Return true max (working max / 0.9)
    return Math.round(workingMax / 0.9 / 5) * 5;
  }

  function getWorkingMax(liftId, targetWeek) {
    const lift = lifts.find(l=>l.id===liftId);
    if (!lift) return 0;
    if (isAssistedPullUp(lift)) {
      // Effective-load working max (basis for the set percentages); assistance is derived per set in render.
      const bw = latestBodyweight();
      if (bw == null) return 0;
      const effTrueMax = bw - getEffMax(liftId, targetWeek); // bw − assistance = effective 1RM
      return calcCurrentMax(Math.max(0, effTrueMax));
    }
    return calcCurrentMax(getEffMax(liftId, targetWeek));
  }

  function calcVolume(liftId, w) {
    const lift = lifts.find(l=>l.id===liftId);
    const wts = isAssistedPullUp(lift) ? calcWorkingWeights(getWorkingMax(liftId, w)) : calcWorkingWeights(getEffMax(liftId, w));
    let vol = wts[0]*10 + wts[1]*10 + wts[2]*10 + wts[3]*(+(logs?.[w]?.[liftId]?.[3]?.reps)||10);
    (accList?.[w]?.[liftId]||[]).forEach(a => { vol += (+a.weight||0)*(+a.reps||10)*3; });
    return vol;
  }

  // A lift counts as done only if it was actually logged TODAY (date-based, no 7-day window).
  // This is the source of truth for "already worked out" so a fresh training day is never blocked.
  function isLiftDoneToday(liftId) {
    const cd = completedDays || {};
    return Object.keys(cd).some(w => {
      const e = cd[w]?.[liftId];
      return e?.done && e?.date === todayISO();
    });
  }

  function addLift() {
    const id="lift_"+Date.now();
    setLifts(prev=>{
      const usedColors = prev.map(l=>l.color);
      const availableColor = COLORS.find(c=>!usedColors.includes(c)) || COLORS[prev.length%COLORS.length];
      return [...prev,{id,name:"",mainLiftOption:"Bench",color:availableColor,startingMax:0,trainingDays:[],isLower:false}];
    });
    setLiftWeeks(prev=>({...prev,[id]:1}));
  }
  function removeLift(id) { setSetupSnapshot(prev => prev || {lifts:[...lifts], startDate}); setLifts(prev=>prev.filter(l=>l.id!==id)); }
  function updateLift(id,field,val) { setLifts(prev=>prev.map(l=>l.id===id?{...l,[field]:val}:l)); }
  function switchLift(id) { setActiveId(id); setViewingWeek(liftWeeks[id]||1); setEditingPastWeek(false); setReviewingCompletedWorkout(false); }

  // Start a workout and persist the in-progress state IMMEDIATELY (not via the 800ms debounce),
  // so backgrounding/closing the app right after starting still restores into the workout.
  function startWorkout() {
    const now = new Date().toISOString();
    setWorkoutInProgress(true);
    setInProgressLiftId(activeId);
    setWorkoutStartTime(now);
    setWorkoutPausedAt(null);
    if (uid) {
      localStorage.removeItem("barnone_pausedat_" + uid);
      supabase.from("user_data").update({ workout_in_progress: true, in_progress_lift_id: activeId, workout_start_time: now }).eq("user_id", uid);
    }
    setView("workout");
  }
  function navigateWeek(dir) {
    setViewingWeek(v=>Math.max(1,Math.min(liftWeeks[activeId]||1,v+dir)));
    setEditingPastWeek(false);
  }

  const lift = lifts.find(l=>l.id===activeId)||lifts[0];
  const activeLiftWeek = liftWeeks[activeId]||1;
  const isPastWeek = viewingWeek < activeLiftWeek;
  const isReadOnly = isPastWeek && !editingPastWeek;
  const week = viewingWeek;
  const effMax = getEffMax(activeId, week);
  const workingMax = getWorkingMax(activeId, week);
  const isAssisted = isAssistedPullUp(lift);
  const bodyW = latestBodyweight();
  const needsBodyweight = isAssisted && bodyW == null;
  // Effective set loads (50/58/67/75% of working max) for both lift types. For assisted, each set's
  // DISPLAYED weight is the assistance (bodyweight − effective load); the hardest set has the least help.
  const effSetWeights = calcWorkingWeights(workingMax);
  const weights = isAssisted
    ? effSetWeights.map(w => Math.max(0, Math.round(((bodyW||0) - w)/5)*5))
    : effSetWeights;
  const set4Reps = logs?.[week]?.[activeId]?.[3]?.reps ?? "10";
  // 1RM estimate is always computed on the EFFECTIVE top-set load, so assisted reuses the normal estimator.
  const sessionEstMax = +set4Reps>10 ? calcEstMax(effSetWeights[3], +set4Reps) : null;
  // Progression runs in effective-load terms; assisted converts the resulting effective 1RM back to assistance.
  const effTrueMax = isAssisted ? Math.round(workingMax/0.9/5)*5 : effMax;
  const nextEffTrueMax = calcNextMax(effTrueMax, sessionEstMax, lift?.isLower);
  const nextMax = isAssisted ? Math.max(0, Math.round(((bodyW||0) - nextEffTrueMax)/5)*5) : nextEffTrueMax;
  const nextWorkingMax = calcCurrentMax(isAssisted ? nextEffTrueMax : nextMax);
  const willProgress = isAssisted ? nextMax < effMax : nextMax > effMax;
  const isDayDone = completedDays?.[week]?.[activeId];

  function getReps(w,id,i) { return logs?.[w]?.[id]?.[i]?.reps ?? "10"; }
  function setReps(w,id,i,val) {
    setLogs(prev=>{
      const n=JSON.parse(JSON.stringify(prev));
      if(!n[w])n[w]={};if(!n[w][id])n[w][id]={};if(!n[w][id][i])n[w][id][i]={};
      n[w][id][i].reps=val; return n;
    });
  }
  function getAccList(w,id,section) { const all=accList?.[w]?.[id]||[]; if(!section) return all; return all.filter(a=>(a.section||"support")===section); }
  function addAcc(w,id,name,section) {
    if(!name)return;
    const sec=section||"support";
    setAccList(prev=>{
      const n=JSON.parse(JSON.stringify(prev));
      if(!n[w])n[w]={};if(!n[w][id])n[w][id]=[];
      if(n[w][id].some(a=>a.name===name&&(a.section||"support")===sec)) return n;
      n[w][id].push({id:Date.now(),name,weight:exerciseHistory[name]||"",reps:"10",section:sec}); return n;
    });
  }
  function updateAcc(w,id,aid,field,val) {
    setAccList(prev=>{
      const n=JSON.parse(JSON.stringify(prev));
      const item=n?.[w]?.[id]?.find(a=>a.id===aid);
      if(item){item[field]=val;if(field==="weight"&&val)setExerciseHistory(h=>({...h,[item.name]:val}));}
      return n;
    });
  }
  function removeAcc(w,id,aid) {
    setAccList(prev=>{const n=JSON.parse(JSON.stringify(prev));if(n?.[w]?.[id])n[w][id]=n[w][id].filter(a=>a.id!==aid);return n;});
  }
  function setAdj(aid,val) {
    setWeightAdjust(prev=>{
      const n=JSON.parse(JSON.stringify(prev));
      if(!n[week])n[week]={};if(!n[week][activeId])n[week][activeId]={};
      n[week][activeId][aid]=n[week][activeId][aid]===val?null:val; return n;
    });
  }







  async function searchFriends(query) {
    if (!query.trim()) { setFriendSearchResults([]); return; }
    const { data } = await supabase.from("public_profiles")
      .select("id, name, username")
      .or("name.ilike.%" + query + "%,username.ilike.%" + query + "%")
      .neq("id", uid).limit(5);
    setFriendSearchResults(data || []);
  }

  async function sendFriendRequest(toId) {
    // Step 1: delete ALL existing requests between these two users in either direction
    const { error: delErr } = await supabase.from("friend_requests")
      .delete()
      .or("and(from_id.eq." + uid + ",to_id.eq." + toId + "),and(from_id.eq." + toId + ",to_id.eq." + uid + ")");
    if (delErr) { alert("Error clearing old request: " + delErr.message); return; }
    // Step 2: upsert instead of insert to handle any race condition
    const { error } = await supabase.from("friend_requests")
      .upsert({ from_id: uid, to_id: toId, status: "pending" }, { onConflict: "from_id,to_id" });
    if (!error) {
      setFriendSearchResults([]);
      setFriendSearch("");
      alert("Friend request sent to " + (friendSearchResults.find(u=>u.id===toId)?.name || "user") + "!");
    } else {
      alert("Error sending request: " + error.message);
    }
  }

  async function acceptFriendRequest(requestId) {
    await supabase.from("friend_requests")
      .update({ status: "accepted" }).eq("id", requestId);
    setFriendRequests(prev => prev.filter(r => r.id !== requestId));
    loadSocialData(uid);
  }

  async function declineFriendRequest(requestId) {
    await supabase.from("friend_requests")
      .update({ status: "declined" }).eq("id", requestId);
    setFriendRequests(prev => prev.filter(r => r.id !== requestId));
  }

  async function sendReaction(toId, sessionDate, liftName, emoji) {
    if (!uid) return;
    const fromName = (currentUser?.user_metadata?.name || currentUser?.email || "Someone").split(" ")[0];
    // Update sentReactions immediately for instant visual feedback
    setSentReactions(prev => {
      const filtered = prev.filter(r => !(r.session_date === sessionDate && r.to_id === toId));
      return [...filtered, {from_id: uid, to_id: toId, session_date: sessionDate, lift_name: liftName, emoji, from_name: fromName, from_username: username||"", created_at: new Date().toISOString()}];
    });
    // Replace any prior reaction from me on this session, then insert. delete+insert avoids
    // depending on a DB unique constraint (the old upsert onConflict silently failed to save,
    // which caused the highlight to vanish on reload and left duplicate rows).
    await supabase.from("reactions").delete().match({ from_id: uid, to_id: toId, session_date: sessionDate });
    const { error: reactErr } = await supabase.from("reactions").insert({
      from_id: uid, to_id: toId, session_date: sessionDate, lift_name: liftName, emoji,
      from_name: fromName, from_username: username || ""
    });
    if (reactErr) { console.error("reaction save failed", reactErr); return; }
    loadSocialData(uid);
  }

  async function savePublicProfile() {
    const uname = usernameEntry.toLowerCase().replace(/[^a-z0-9_]/g, "");
    const { error } = await supabase.from("public_profiles").upsert({
      id: uid,
      name: currentUser?.user_metadata?.name || currentUser?.email || "User",
      username: uname,
      is_public: isPublic
    }, { onConflict: "id" });
    if (error) {
      alert("Error saving profile: " + error.message);
      return;
    }
    setUsername(uname);
    setEditingProfile(false);
    alert("Profile saved! Username: @" + uname);
  }

  function finishDay() {
    getAccList(week,activeId).forEach(acc=>{
      const adj=weightAdjust?.[week]?.[activeId]?.[acc.id];
      if(adj==="up") setExerciseHistory(h=>({...h,[acc.name]:String((+(h[acc.name]||acc.weight||0))+5)}));
      else if(adj==="down") setExerciseHistory(h=>({...h,[acc.name]:String(Math.max(0,(+(h[acc.name]||acc.weight||0))-5))}));
      // "same" = no change, weight stays as is
    });
    const vol = calcVolume(activeId, week);
    const entry = {
      date:todayISO(), liftId:activeId, liftName:lift?.name, liftColor:lift?.color, programId,
      week, sets:weights.map((w,i)=>({weight:w,reps:i<3?10:+set4Reps||10})),
      accessories:getAccList(week,activeId).map(a=>({name:a.name,weight:a.weight,reps:a.reps})),
      notes:sessionNotes, volume:vol, estMax:sessionEstMax,
    };
    setSessionLedger(prev=>[entry,...prev]);
    checkForPR(activeId, sessionEstMax);
    const workoutEndRef = workoutPausedAt ? new Date(workoutPausedAt).getTime() : Date.now();
    const workoutDurationSecs = workoutStartTime ? Math.max(0, Math.floor((workoutEndRef - new Date(workoutStartTime).getTime()) / 1000)) : 0;
    const weightKg = (bodyStats.entries?.[bodyStats.entries.length-1]?.weight || 180) / 2.205;
    const hours = workoutDurationSecs / 3600;
    const caloriesBurned = Math.round(3.5 * weightKg * hours); // MET 3.5 for weightlifting
    setWorkoutInProgress(false);
    setInProgressLiftId(null);
    setWorkoutStartTime(null);
    setWorkoutElapsed(0);
    setWorkoutPausedAt(null);
    if (uid) localStorage.removeItem("barnone_pausedat_" + uid);
    if (uid) supabase.from("user_data").update({ workout_in_progress: false, in_progress_lift_id: null }).eq("user_id", uid);
    // Save duration and calories to session ledger
    setSessionLedger(prev => {
      const updated = [...prev];
      if (updated[0] && updated[0].liftId === activeId) {
        updated[0] = {...updated[0], durationSecs: workoutDurationSecs, calories: caloriesBurned};
      }
      return updated;
    });
    // Post-workout completion in-app alert
    setPostWorkoutScreen({
      liftName: lift?.name || "",
      week,
      vol,
      estMax: sessionEstMax,
      color: lift?.color || "#e85d04",
      nextWeek: Math.min(12, activeLiftWeek+1)
    });
    setFinishAlert({
      liftName: lift?.name || "",
      week,
      vol,
      estMax: sessionEstMax,
      color: lift?.color || "#e85d04"
    });
    setSessionNotes("");
    // Show weight prompt if not logged this week
    if (!loggedThisWeek) setShowWeightPrompt(true); // Always prompt if not logged this week
    setCompletedDays(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[week])n[week]={};n[week][activeId]={done:true,date:todayISO()};return n;});
    const nw=Math.min(12,activeLiftWeek+1);
    setLiftWeeks(prev=>({...prev,[activeId]:nw}));
    setViewingWeek(nw);
    setWorkoutInProgress(false);
    setInProgressLiftId(null);
    setWorkoutStartTime(null);
    setWorkoutElapsed(0);
  }

  async function startNewProgram() {
    // Save final maxes before archiving
    const finalMaxes = Object.fromEntries(lifts.map(l=>[l.id, getEffMax(l.id, liftWeeks[l.id]||1)]));
    const archive = {startDate, lifts, endDate:todayISO(), finalMaxes, sessionsCompleted: totalSessions, totalPossible, bestStreak: streak, totalVolume: programVolume, logs, liftWeeks, completedDays, programId, programName, accList, runHistory, runDays, runWeek, runDay};
    // Save to program_history table
    await saveProgramToHistory(uid, archive);
    // Reload history
    const ph = await loadProgramHistory(uid);
    setProgramHistory(ph);
    // Reset to default 4 lifts but carry over final maxes where lift names match
    const nl = DEFAULT_LIFTS.map(l => {
      // Find matching lift from previous program by mainLiftOption or name
      const prevLift = lifts.find(pl => pl.mainLiftOption === l.mainLiftOption || pl.name === l.name);
      const prevMax = prevLift ? finalMaxes[prevLift.id] || 0 : 0;
      return {...l, startingMax: prevMax, trainingDays: []};
    });
    // Note: when user adds custom lifts after reset, exerciseHistory still has their last weights
    setLifts(nl);
    setStartDate(todayISO());
    setLogs({});
    setCompletedDays({});
    setAccList({});
    setWeightAdjust({});
    setLiftWeeks(Object.fromEntries(nl.map(l=>[l.id,1])));
    setActiveId(nl[0].id);
    setViewingWeek(1);
    setProgramStarted(false);
    setProgramId("");
    setView("setup");
  }

  function addWeightEntry() {
    logWeightAndDismiss();
  }

  function getWeekKey() {
    const d = new Date();
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${week}`;
  }

  const thisWeek = getWeekKey();
  const loggedThisWeek = bodyStats.entries.some(e => {
    const d = new Date(e.date);
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${week}` === thisWeek;
  });

  const hasEverLogged = bodyStats.entries.length > 0;
  const nudgeLevel = (hasEverLogged && !loggedThisWeek && hasSetup) ? (weightNudge.weekKey === thisWeek ? weightNudge.skips : 0) : -1;
  // -1 = logged, 0 = first ask (banner), 1 = second ask (big card), 2+ = modal

  function skipWeightNudge() {
    const skips = weightNudge.weekKey === thisWeek ? weightNudge.skips + 1 : 1;
    const newNudge = { weekKey: thisWeek, skips };
    setWeightNudge(newNudge);
    if (skips >= 2) setShowWeightModal(true);
  }

  function logWeightAndDismiss() {
    if (!weightEntry) return;
    const newEntry = {date:todayISO(), weightLbs:+weightEntry};
    const newStats = {...bodyStats, entries:[newEntry,...bodyStats.entries.filter(e=>e.date!==todayISO())]};
    const newNudge = { weekKey: thisWeek, skips: -1 };
    setBodyStats(newStats);
    setWeightEntry("");
    setShowWeightModal(false);
    setWeightNudge(newNudge);

  }

  const latestWeight = bodyStats.entries[0]?.weightLbs ? +bodyStats.entries[0].weightLbs : null;
  const bmi = calcBMI(latestWeight, +bodyStats.heightIn);
  const totalSessions = sessionLedger.filter(s => {
    return programId && s.programId === programId;
  }).length;
  const allTimeSessions = sessionLedger.length;
  const programVolume = sessionLedger
    .filter(s => programId && s.programId === programId)
    .reduce((sum, s) => sum + (s.volume || 0), 0);
  const programVolumeDisplay = programVolume >= 1000000 
    ? (programVolume/1000000).toFixed(1) + "M" 
    : programVolume >= 1000 
    ? Math.round(programVolume/1000) + "k" 
    : programVolume;
  // Total possible sessions = unique training days per week × 12
  const uniqueTrainingDays = [...new Set(lifts.flatMap(l => l.active!==false ? (l.trainingDays || []) : []))].length;
  const totalPossible = uniqueTrainingDays * 12;
  const streak = (() => {
    // Use all sessions if programId not set, otherwise filter by program
    // Match sessions by programId, but also include sessions with no programId
    const programSessions = programId
      ? sessionLedger.filter(s => !s.programId || s.programId === programId)
      : sessionLedger;
    if(!programSessions.length) return 0;
    const loggedDates = new Set(programSessions.map(s=>s.date));
    // Get all unique training days across all lifts
    const allTrainingDays = [...new Set(lifts.flatMap(l=>l.active!==false ? (l.trainingDays||[]) : []))];
    if(!allTrainingDays.length) return 0;
    // Work entirely in LOCAL time so the weekday and the date always refer to the same
    // calendar day (the old code mixed local getDay() with a UTC date string, which broke
    // the match for anyone behind UTC). Sessions are stamped with todayISO() (UTC), so an
    // evening workout can land on the next UTC date — accept that day or the next.
    const loggedOn = (dt) => {
      const a = new Date(dt); a.setHours(12,0,0,0);
      const b = new Date(a); b.setDate(a.getDate()+1);
      return loggedDates.has(a.toISOString().split("T")[0]) || loggedDates.has(b.toISOString().split("T")[0]);
    };
    let streak = 0;
    const today = new Date(); today.setHours(12,0,0,0); // local noon avoids UTC/DST edge
    for(let i=0; i<84; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const abbr = DAY_ABBR[d.getDay()];
      if(!allTrainingDays.includes(abbr)) continue; // skip rest days
      if(loggedOn(d)) { streak++; }
      else if(i === 0) { continue; } // today's session may not be logged yet
      else { break; } // missed scheduled day — streak over
    }
    return streak;
  })();
  const PRs = lifts.map(l=>({...l,startMax:l.startingMax||0,curMax:getEffMax(l.id,liftWeeks[l.id]||1)}));

  const iS = { background:"var(--bg-input)",border:"1px solid var(--border-input)",color:"var(--text-primary)",borderRadius:8,padding:"12px 16px",fontFamily:"'DM Mono',monospace",fontSize:14,outline:"none",display:"block",width:"100%" };
  const card = { background:"var(--bg-card)", borderRadius:10, padding:"14px 16px", marginBottom:14 };

  return (
    <div className={"theme-"+theme} onTouchStart={primeAudio} style={{minHeight:"100vh",background:"var(--bg-primary)",color:"var(--text-primary)",fontFamily:"'Roboto',sans-serif",fontSize:14,paddingBottom:view==="workout"?160:100,paddingTop:"env(safe-area-inset-top)"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@700&family=Roboto:wght@400;500&display=swap&font-display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        html,body,#root{min-height:100%;}
        body{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);}
        .theme-dark{--bg-primary:#000000;--bg-secondary:#0a0a0f;--bg-card:#0f0f1a;--bg-input:#1a1a2e;--bg-sunken:#111111;--text-primary:#f0f0f0;--text-secondary:#aaaaaa;--text-muted:#555;--border:#1a1a1a;--border-input:#333;}
        .theme-midnight{--bg-primary:#0d1117;--bg-secondary:#0d1117;--bg-card:#161b22;--bg-input:#1c2128;--bg-sunken:#131820;--text-primary:#e6edf3;--text-secondary:#8b949e;--text-muted:#484f58;--border:#21262d;--border-input:#30363d;}
        .theme-light{--bg-primary:#f3eee4;--bg-secondary:#efe9dd;--bg-card:#fdfbf7;--bg-input:#eae3d6;--bg-sunken:#e8e1d3;--text-primary:#2a2521;--text-secondary:#6b6155;--text-muted:#938979;--border:#d9d1c2;--border-input:#cabfac;}
        input[type=number],input[type=text],input[type=date],input[type=email],input[type=password]{background:var(--bg-input);border:1px solid #333;color:var(--text-primary);border-radius:6px;padding:6px 10px;font-family:'DM Mono',monospace;font-size:13px;}
        input[type=number]{width:64px;text-align:center;-moz-appearance:textfield;}
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;}
        input:focus,select:focus,textarea:focus{outline:none;border-color:#888;}
        input[readonly]{background:var(--bg-sunken);border-color:var(--border);color:#444;cursor:default;}
        select{background:var(--bg-input);border:1px solid #333;color:var(--text-primary);border-radius:6px;padding:6px 10px;font-family:'DM Mono',monospace;font-size:12px;}
        textarea{background:var(--bg-input);border:1px solid #333;color:var(--text-primary);border-radius:6px;padding:8px 10px;font-family:'DM Mono',monospace;font-size:12px;resize:none;width:100%;}
        .bn{border:none;cursor:pointer;border-radius:6px;font-family:'Roboto Condensed',sans-serif;font-size:17px;letter-spacing:1px;padding:8px 14px;transition:all 0.15s;}
        .bigbtn{border:none;cursor:pointer;border-radius:8px;font-family:'Roboto Condensed',sans-serif;font-size:20px;letter-spacing:2px;padding:14px;width:100%;transition:all 0.2s;margin-bottom:8px;}
        .ntab{background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 10px;color:#444;font-family:'DM Mono',monospace;font-size:9px;transition:all 0.15s;flex:1;}
        .ntab.on{color:var(--text-primary);}
        .srow{display:grid;grid-template-columns:28px 1fr auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);}
      `}</style>

      {authScreen && authScreen!=="profile" && (
        <div style={{position:"fixed",inset:0,background:"var(--bg-secondary)",zIndex:100,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
          <img src="/logo.png" alt="Bar None" style={{width:"100%",maxWidth:360,objectFit:"contain",marginBottom:36}} />
          <div style={{width:"100%",maxWidth:360}}>
            <div style={{display:"flex",marginBottom:20,background:"var(--bg-card)",borderRadius:8,padding:4}}>
              {["login","register"].map(tab=>(
                <button key={tab} onClick={()=>{setAuthScreen(tab);setAuthErr("");}} style={{flex:1,background:authScreen===tab?"var(--bg-input)":"none",border:authScreen===tab?"1px solid #333":"none",color:authScreen===tab?"var(--text-primary)":"#555",borderRadius:6,padding:"8px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,letterSpacing:1,cursor:"pointer"}}>
                  {tab==="login"?"SIGN IN":"CREATE ACCOUNT"}
                </button>
              ))}
            </div>
            {authScreen==="register" && <input type="text" value={authForm.name} placeholder="Full name" onChange={e=>setAuthForm(f=>({...f,name:e.target.value}))} style={{...iS,marginBottom:10}} />}
            <input type="email" value={authForm.email} placeholder="Email" onChange={e=>setAuthForm(f=>({...f,email:e.target.value}))} style={{...iS,marginBottom:10}} />
            <div style={{position:"relative",marginBottom:authScreen==="register"?10:16}}>
              <input type={showPw?"text":"password"} value={authForm.password} placeholder="Password" onChange={e=>setAuthForm(f=>({...f,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&authScreen==="login"&&handleLogin()} style={{...iS}} />
              <button onClick={()=>setShowPw(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:11}}>{showPw?"hide":"show"}</button>
            </div>
            {authScreen==="register" && <input type="password" value={authForm.confirm} placeholder="Confirm password" onChange={e=>setAuthForm(f=>({...f,confirm:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleRegister()} style={{...iS,marginBottom:16}} />}
            {authScreen==="login" && (
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)}
                  style={{width:16,height:16,cursor:"pointer",accentColor:"#e85d04"}} />
                <label htmlFor="rememberMe" style={{color:"#555",fontSize:12,cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>Remember me on this device</label>
              </div>
            )}
            {authErr && <div style={{color:"#e85d04",fontSize:12,marginBottom:12,textAlign:"center"}}>{authErr}</div>}
            <button onClick={authScreen==="login"?handleLogin:handleRegister} className="bigbtn" style={{background:"#fff",color:"#000"}}>{authScreen==="login"?"SIGN IN →":"CREATE ACCOUNT →"}</button>
          </div>
        </div>
      )}

      {showProfile && (
        <div style={{position:"fixed",inset:0,background:"var(--bg-secondary)",zIndex:100,display:"flex",flexDirection:"column"}} onClick={()=>setShowProfile(false)}>
          <div style={{background:"var(--bg-secondary)",width:"100%",flex:1,overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"12px 24px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"var(--bg-secondary)",zIndex:1}}>
              <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,letterSpacing:1}}>SETTINGS</div>
              <button onClick={()=>setShowProfile(false)} style={{background:"none",border:"none",color:"#555",fontSize:24,cursor:"pointer",padding:"0 4px"}}>×</button>
            </div>
            <div style={{padding:"0 24px"}}>
              <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,marginBottom:2,marginTop:16}}>{currentUser?.user_metadata?.name || currentUser?.email}</div>
              <div style={{color:"#555",fontSize:11,marginBottom:16}}>{currentUser?.email}</div>
              <div style={{display:"flex",gap:20,marginBottom:20}}>
                <div><div style={{color:"#555",fontSize:10}}>SESSIONS</div><div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:26}}>{totalSessions}</div></div>
                <div><div style={{color:"#555",fontSize:10}}>STREAK</div><div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:26,color:"#f7b731"}}>{streak} 🔥</div></div>
              </div>

              <div style={{borderBottom:"1px solid var(--border)",marginBottom:16,paddingBottom:4}}>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,color:"#555",letterSpacing:1,marginBottom:12}}>PREFERENCES</div>
                <div style={{marginBottom:14}}>
                  <div style={{color:"#555",fontSize:10,marginBottom:8,letterSpacing:1}}>WEIGHT UNIT</div>
                  <div style={{display:"flex",gap:8}}>
                    {["lbs","kg"].map(u=>(
                      <button key={u} onClick={()=>setWeightUnitPref(u)}
                        style={{flex:1,background:weightUnit===u?"var(--bg-input)":"var(--bg-sunken)",border:"1px solid "+(weightUnit===u?"#e85d04":"#333"),color:weightUnit===u?"#e85d04":"#555",borderRadius:6,padding:"10px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,letterSpacing:1,cursor:"pointer"}}>
                        {u.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{color:"#555",fontSize:10,marginBottom:8,letterSpacing:1}}>THEME</div>
                  <div style={{display:"flex",gap:8}}>
                    {[{id:"dark",label:"DARK"},{id:"midnight",label:"MIDNIGHT"},{id:"light",label:"LIGHT"}].map(t=>(
                      <button key={t.id} onClick={()=>setThemePref(t.id)}
                        style={{flex:1,background:theme===t.id?"var(--bg-input)":"var(--bg-sunken)",border:"1px solid "+(theme===t.id?"#3a86ff":"#333"),color:theme===t.id?"#3a86ff":"#555",borderRadius:6,padding:"10px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:14,letterSpacing:1,cursor:"pointer"}}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{borderBottom:"1px solid var(--border)",marginBottom:16,paddingBottom:16}}>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,color:"#555",letterSpacing:1,marginBottom:12}}>PROFILE</div>
                {displayName !== undefined && (
                  <div style={{marginBottom:12}}>
                    <div style={{color:"#555",fontSize:10,marginBottom:6,letterSpacing:1}}>DISPLAY NAME</div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <div style={{color:"var(--text-primary)",fontSize:15,flex:1}}>{displayName || currentUser?.user_metadata?.name || currentUser?.email}</div>
                      <button onClick={()=>setEditingName(true)} style={{background:"none",border:"1px solid #555",color:"#555",borderRadius:4,padding:"2px 8px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,cursor:"pointer"}}>EDIT</button>
                    </div>
                  </div>
                )}
                {username && (
                  <div style={{marginBottom:12}}>
                    <div style={{color:"#555",fontSize:10,marginBottom:4,letterSpacing:1}}>USERNAME</div>
                    <div style={{color:"var(--text-primary)",fontSize:15}}>@{username}</div>
                  </div>
                )}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{color:"var(--text-secondary)",fontSize:12}}>Public profile</div>
                  <button onClick={()=>{const v=!isPublic;setIsPublic(v);if(username)supabase.from("public_profiles").update({is_public:v}).eq("id",uid);}}
                    style={{background:isPublic?"#06d6a0":"var(--bg-input)",border:"1px solid "+(isPublic?"#06d6a0":"#555"),color:isPublic?"#000":"#555",borderRadius:20,padding:"4px 14px",fontFamily:"'DM Mono',monospace",fontSize:12,cursor:"pointer"}}>
                    {isPublic?"ON":"OFF"}
                  </button>
                </div>
              </div>

              <button onClick={handleLogout} className="bigbtn" style={{background:"none",border:"1px solid #e85d04",color:"#e85d04",marginBottom:8}}>SIGN OUT</button>
              <button onClick={()=>setShowProfile(false)} className="bigbtn" style={{background:"none",border:"1px solid #333",color:"#555",marginBottom:16}}>CANCEL</button>
              <div style={{textAlign:"center",color:"#333",fontSize:10,marginBottom:16,letterSpacing:1}}>BAR NONE — THE PROGRAM {APP_VERSION}</div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{position:"fixed",inset:0,background:"var(--bg-secondary)",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <img src="/logo.png" alt="Bar None" style={{height:80,objectFit:"contain"}} />
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#444",letterSpacing:2,marginTop:8}}>LOADING...</div>
        </div>
      )}

      {restAlert && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"var(--bg-card)",borderRadius:16,padding:28,width:"100%",maxWidth:320,textAlign:"center",borderTop:"4px solid #f7b731"}}>
            <div style={{fontSize:48,marginBottom:8}}>⏱️</div>
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:28,color:"#f7b731",letterSpacing:2,marginBottom:8}}>REST OVER!</div>
            <div style={{color:"#555",fontSize:12,marginBottom:24}}>Time for your next set</div>
            <button onClick={()=>setRestAlert(false)} style={{width:"100%",background:"#f7b731",border:"none",color:"#000",borderRadius:10,padding:"14px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,letterSpacing:2,cursor:"pointer"}}>LET'S GO</button>
          </div>
        </div>
      )}

      {prAlert && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"var(--bg-card)",borderRadius:16,padding:28,width:"100%",maxWidth:320,textAlign:"center",borderTop:"4px solid "+prAlert.color}}>
            <div style={{fontSize:48,marginBottom:8}}>🏆</div>
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:28,color:prAlert.color,letterSpacing:2,marginBottom:4}}>NEW PR!</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#555",marginBottom:20,letterSpacing:1}}>{prAlert.liftName.toUpperCase()}</div>
            <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:24}}>
              <div style={{background:"var(--bg-input)",borderRadius:10,padding:"12px 20px"}}>
                <div style={{color:"#555",fontSize:10,marginBottom:4}}>BEFORE</div>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,color:"#555"}}>{prAlert.prevMax} lbs</div>
              </div>
              <div style={{background:"var(--bg-input)",borderRadius:10,padding:"12px 20px"}}>
                <div style={{color:"#555",fontSize:10,marginBottom:4}}>NEW MAX</div>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,color:"#06d6a0"}}>{prAlert.estMax} lbs</div>
              </div>
            </div>
            <button onClick={()=>setPrAlert(null)} style={{width:"100%",background:prAlert.color,border:"none",color:"#000",borderRadius:10,padding:"14px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,letterSpacing:2,cursor:"pointer"}}>LET'S GO 🔥</button>
          </div>
        </div>
      )}

      {newWeekAlert && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"var(--bg-card)",borderRadius:16,padding:28,width:"100%",maxWidth:320,textAlign:"center",borderTop:"4px solid "+newWeekAlert.color}}>
            <div style={{fontSize:48,marginBottom:8}}>📅</div>
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:28,color:newWeekAlert.color,letterSpacing:2,marginBottom:4}}>WEEK {newWeekAlert.week}!</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#555",marginBottom:20,letterSpacing:1}}>{newWeekAlert.liftName.toUpperCase()} — NEW WEIGHTS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:24}}>
              {newWeekAlert.weights.map((w,i)=>(
                <div key={i} style={{background:"var(--bg-input)",borderRadius:8,padding:"10px"}}>
                  <div style={{color:"#555",fontSize:10,marginBottom:2}}>SET {i+1}</div>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,color:"var(--text-primary)"}}>{w} {newWeekAlert.assist?"assist":"lbs"}</div>
                </div>
              ))}
            </div>
            <button onClick={()=>setNewWeekAlert(null)} style={{width:"100%",background:newWeekAlert.color,border:"none",color:"#000",borderRadius:10,padding:"14px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,letterSpacing:2,cursor:"pointer"}}>LET'S LIFT!</button>
          </div>
        </div>
      )}

      {streakAlert && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"var(--bg-card)",borderRadius:16,padding:28,width:"100%",maxWidth:320,textAlign:"center",borderTop:"4px solid #e85d04"}}>
            <div style={{fontSize:48,marginBottom:8}}>🔥</div>
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:28,color:"#e85d04",letterSpacing:2,marginBottom:8}}>GET BACK IN THE GYM!</div>
            <div style={{color:"#555",fontSize:12,marginBottom:24}}>It's been a few days. Time to lift!</div>
            <button onClick={()=>setStreakAlert(false)} style={{width:"100%",background:"#e85d04",border:"none",color:"#000",borderRadius:10,padding:"14px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,letterSpacing:2,cursor:"pointer"}}>I'M BACK 💪</button>
          </div>
        </div>
      )}

      {confirmDeleteSession !== null && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"var(--bg-card)",borderRadius:16,padding:28,width:"100%",maxWidth:360,textAlign:"center",borderTop:"4px solid #e85d04"}}>
            <div style={{fontSize:40,marginBottom:8}}>⚠️</div>
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:24,color:"#e85d04",letterSpacing:2,marginBottom:12}}>DELETE SESSION?</div>
            <div style={{background:"var(--bg-sunken)",borderRadius:8,padding:12,marginBottom:20,fontSize:11,color:"var(--text-secondary)",textAlign:"left"}}>
              <div style={{color:"#e85d04",marginBottom:6,fontFamily:"'Roboto Condensed',sans-serif",letterSpacing:1}}>THIS WILL AFFECT YOUR CHARTS</div>
              Deleting this session removes it from your progress charts and volume history. This cannot be undone.
            </div>
            <button onClick={()=>{
              setSessionLedger(prev=>prev.filter((_,j)=>j!==confirmDeleteSession));
              setConfirmDeleteSession(null);
            }} style={{width:"100%",background:"#e85d04",border:"none",color:"#000",borderRadius:10,padding:"14px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,letterSpacing:2,cursor:"pointer",marginBottom:10}}>YES, DELETE</button>
            <button onClick={()=>setConfirmDeleteSession(null)} style={{width:"100%",background:"none",border:"1px solid #333",color:"#555",borderRadius:10,padding:"10px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,cursor:"pointer"}}>CANCEL</button>
          </div>
        </div>
      )}

      {confirmContinue && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"var(--bg-card)",borderRadius:16,padding:28,width:"100%",maxWidth:360,textAlign:"center",borderTop:"4px solid #06d6a0"}}>
            <div style={{fontSize:40,marginBottom:8}}>🔄</div>
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:26,color:"#06d6a0",letterSpacing:2,marginBottom:8}}>CONTINUE PROGRAM?</div>
            <div style={{color:"#555",fontSize:12,marginBottom:8}}>
              {fmtDate(confirmContinue.startDate)} program
            </div>
            <div style={{background:"var(--bg-sunken)",borderRadius:8,padding:12,marginBottom:20,fontSize:11,color:"var(--text-secondary)",textAlign:"left"}}>
              <div style={{color:"#e85d04",marginBottom:4,fontFamily:"'Roboto Condensed',sans-serif",letterSpacing:1}}>⚠️ YOUR CURRENT PROGRAM WILL BE ARCHIVED</div>
              You can always come back to it from the PROGRAM tab.
            </div>
            {continueError && <div style={{background:"#2a0a0a",border:"1px solid #e85d04",borderRadius:8,padding:10,marginBottom:12,color:"#e85d04",fontSize:11}}>{continueError}</div>}
            <button onClick={async()=>{
              setContinueError(null);
              try {
                const p = confirmContinue;
                // Only archive current program if it was actually started
                if (programStarted && programId) {
                  const finalMaxes = Object.fromEntries(lifts.map(l=>[l.id, getEffMax(l.id, liftWeeks[l.id]||1)]));
                  const curArchive = {startDate, lifts, endDate:todayISO(), finalMaxes, sessionsCompleted:totalSessions, totalPossible, bestStreak:streak, totalVolume:programVolume, logs, liftWeeks, completedDays, programId, programName, accList, runHistory, runDays, runWeek, runDay};
                  await saveProgramToHistory(uid, curArchive);
                }
                // Block saves during restore
                setDataLoaded(false);
                const restoredLifts = p.lifts || DEFAULT_LIFTS;
                const restoredLiftWeeks = p.liftWeeks || Object.fromEntries(restoredLifts.map(l=>[l.id,1]));
                setLifts(restoredLifts);
                setStartDate(p.startDate || "");
                setLogs(p.logs || {});
                setLiftWeeks(restoredLiftWeeks);
                setCompletedDays(p.completedDays || {});
                setAccList(p.accList || {});
                setProgramId(p.programId || (uid + "_" + Date.now()));
                setProgramStarted(true);
                setActiveId(restoredLifts[0]?.id || DEFAULT_LIFTS[0].id);
                setViewingWeek(restoredLiftWeeks[restoredLifts[0]?.id] || 1);
                setWorkoutInProgress(false);
                setInProgressLiftId(null);
                setEditingPastWeek(false);
                // Reset run state to match restored program (old programs had no running)
                const restoredRunDays = p.runDays || [];
                const restoredRunWeek = p.runWeek || 1;
                const restoredRunDay = p.runDay || 1;
                setRunDays(restoredRunDays);
                setRunWeek(restoredRunWeek);
                setRunDay(restoredRunDay);
                setRunHistory(p.runHistory || []);
                if (p.id) await deleteProgramFromHistory(p.id);
                const ph = await loadProgramHistory(uid);
                setProgramHistory(ph);
                // Save restored state to Supabase
                await saveUD(uid, {
                  lifts: restoredLifts,
                  startDate: p.startDate || "",
                  activeId: restoredLifts[0]?.id || DEFAULT_LIFTS[0].id,
                  logs: p.logs || {},
                  completedDays: p.completedDays || {},
                  accList: p.accList || {},
                  exerciseHistory, weightAdjust,
                  liftWeeks: restoredLiftWeeks,
                  customAccessories, sessionLedger, bodyStats,
                  weightNudge,
                  programStarted: true,
                  programId: p.programId || (uid + "_" + Date.now()),
                  workoutInProgress: false,
                  inProgressLiftId: null,
                  runDays: p.runDays || [],
                  runWeek: p.runWeek || 1,
                  runDay: p.runDay || 1,
                  runHistory: p.runHistory || []
                });
                // Now allow saves again
                setDataLoaded(true);
                setConfirmContinue(null);
                setView("dashboard");
              } catch(e) {
                setContinueError("Error: " + (e?.message || JSON.stringify(e)));
              }
            }} style={{width:"100%",background:"#06d6a0",border:"none",color:"#000",borderRadius:10,padding:"14px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,letterSpacing:2,cursor:"pointer",marginBottom:10}}>YES, CONTINUE 💪</button>
            <button onClick={()=>{setConfirmContinue(null);setContinueError(null);}} style={{width:"100%",background:"none",border:"1px solid #333",color:"#555",borderRadius:10,padding:"10px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,cursor:"pointer"}}>CANCEL</button>
          </div>
        </div>
      )}

      {shareCard && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:300,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,overflowY:"auto"}}>
          <div id="shareCardEl" style={{background:"#0a0a0f",borderRadius:16,padding:24,width:"100%",maxWidth:360,border:"1px solid #1a1a1a"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,paddingBottom:16,borderBottom:"1px solid #1a1a1a"}}>
              <div style={{width:44,height:44,background:"#1a1a2e",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>⊕</div>
              <div>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,fontWeight:900,letterSpacing:2,color:"#f0f0f0"}}>BAR NONE</div>
                <div style={{fontSize:9,color:"#555",letterSpacing:2}}>THE PROGRAM</div>
              </div>
              <div style={{marginLeft:"auto",textAlign:"right"}}>
                <div style={{fontSize:10,color:"#555"}}>12 WEEKS</div>
                <div style={{fontSize:11,color:"#aaa"}}>{fmtDate(shareCard.startDate)} → {fmtDate(shareCard.endDate)}</div>
              </div>
            </div>
            <div style={{fontSize:11,color:"#555",letterSpacing:1,marginBottom:10}}>LIFT PROGRESS</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
              {(shareCard.lifts||[]).map(l=>{
                const sm = l.startingMax||0;
                const fm = shareCard.finalMaxes?.[l.id]||sm;
                const gain = fm - sm;
                return (
                  <div key={l.id} style={{background:"#1a1a2e",borderRadius:8,padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,color:l.color||"#f0f0f0",letterSpacing:1}}>{l.name}</div>
                      <div style={{fontSize:11,color:"#555"}}>{sm} → {fm} lbs</div>
                    </div>
                    <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,color:gain>0?"#06d6a0":"#555"}}>{gain>0?"+"+gain:gain}</div>
                  </div>
                );
              })}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
              <div style={{background:"#1a1a2e",borderRadius:8,padding:"10px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#555",marginBottom:4}}>SESSIONS</div>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,color:"#f0f0f0"}}>{shareCard.sessionsCompleted||"—"}</div>
              </div>
              <div style={{background:"#1a1a2e",borderRadius:8,padding:"10px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#555",marginBottom:4}}>STREAK</div>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,color:"#f7b731"}}>{shareCard.bestStreak||"—"}🔥</div>
              </div>
              <div style={{background:"#1a1a2e",borderRadius:8,padding:"10px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#555",marginBottom:4}}>VOLUME</div>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,color:"#3a86ff"}}>
                  {shareCard.totalVolume >= 1000000 ? (shareCard.totalVolume/1000000).toFixed(1)+"M" : shareCard.totalVolume >= 1000 ? Math.round(shareCard.totalVolume/1000)+"k" : shareCard.totalVolume||"—"}
                </div>
              </div>
            </div>
            {(shareCard.runHistory||[]).length > 0 && (
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,color:"#555",letterSpacing:1,marginBottom:10}}>RUNNING</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  <div style={{background:"#1a1a2e",borderRadius:8,padding:"10px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:"#555",marginBottom:4}}>RUNS</div>
                    <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,color:"#3a86ff"}}>{(shareCard.runHistory||[]).length}</div>
                  </div>
                  <div style={{background:"#1a1a2e",borderRadius:8,padding:"10px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:"#555",marginBottom:4}}>MILES</div>
                    <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,color:"#f7b731"}}>{((shareCard.runHistory||[]).reduce((s,r)=>s+(r.dist||0),0)).toFixed(1)}</div>
                  </div>
                  <div style={{background:"#1a1a2e",borderRadius:8,padding:"10px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:"#555",marginBottom:4}}>BEST PACE</div>
                    <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,color:"#06d6a0"}}>{(()=>{const best=(shareCard.runHistory||[]).filter(r=>r.pace).sort((a,b)=>a.pace.localeCompare(b.pace))[0];return best?best.pace+"/mi":"—"})()}</div>
                  </div>
                </div>
              </div>
            )}
            <div style={{textAlign:"center",color:"#333",fontSize:10,letterSpacing:2}}>barnone-six.vercel.app</div>
          </div>
          <div style={{width:"100%",maxWidth:360,marginTop:12,display:"flex",gap:10}}>
            <button onClick={()=>setShareCard(null)} style={{flex:1,background:"none",border:"1px solid #333",color:"#555",borderRadius:8,padding:"12px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,cursor:"pointer"}}>CLOSE</button>
            <button onClick={()=>{
              import("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js").then(()=>{
                window.html2canvas(document.getElementById("shareCardEl"),{backgroundColor:"#0a0a0f",scale:3,useCORS:true}).then(canvas=>{
                  const link=document.createElement("a");
                  link.download="barnone-"+fmtDate(shareCard.startDate)+".png";
                  link.href=canvas.toDataURL("image/png");
                  link.click();
                });
              });
            }} style={{flex:2,background:"#e85d04",border:"none",color:"#000",borderRadius:8,padding:"12px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,cursor:"pointer",letterSpacing:1}}>SAVE TO PHOTOS</button>
          </div>
        </div>
      )}

      {postWorkoutScreen && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"var(--bg-card)",borderRadius:16,padding:28,width:"100%",maxWidth:360,textAlign:"center",borderTop:"4px solid "+postWorkoutScreen.color}}>
            <div style={{fontSize:48,marginBottom:8}}>✅</div>
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:28,color:postWorkoutScreen.color,letterSpacing:2,marginBottom:4}}>{postWorkoutScreen.liftName.toUpperCase()} DONE!</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#555",marginBottom:16,letterSpacing:1}}>WEEK {postWorkoutScreen.week} COMPLETE</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              <div style={{background:"var(--bg-sunken)",borderRadius:10,padding:12}}>
                <div style={{color:"#555",fontSize:10,marginBottom:4}}>VOLUME</div>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,color:"var(--text-primary)"}}>{postWorkoutScreen.vol?.toLocaleString()}<span style={{fontSize:11,color:"#555"}}> lbs</span></div>
              </div>
              <div style={{background:"var(--bg-sunken)",borderRadius:10,padding:12}}>
                <div style={{color:"#555",fontSize:10,marginBottom:4}}>EST MAX</div>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,color:"#06d6a0"}}>{postWorkoutScreen.estMax||"—"}<span style={{fontSize:11,color:"#555"}}> lbs</span></div>
              </div>
            </div>
            <div style={{background:"var(--bg-sunken)",borderRadius:8,padding:10,marginBottom:20,fontSize:11,color:"#555"}}>
              Next up: <span style={{color:postWorkoutScreen.color}}>Week {postWorkoutScreen.nextWeek}</span> when you return
            </div>
            <button onClick={()=>{setPostWorkoutScreen(null);setView("dashboard");}} style={{width:"100%",background:postWorkoutScreen.color,border:"none",color:"#000",borderRadius:10,padding:"14px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,letterSpacing:2,cursor:"pointer",marginBottom:10}}>HOME</button>
            <button onClick={()=>{setPostWorkoutScreen(null);}} style={{width:"100%",background:"var(--bg-input)",border:"1px solid #333",color:"var(--text-secondary)",borderRadius:10,padding:"12px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,letterSpacing:1,cursor:"pointer",marginBottom:8}}>VIEW THIS WORKOUT</button>
            <button onClick={()=>{setPostWorkoutScreen(null);setEditingPastWeek(true);}} style={{width:"100%",background:"none",border:"1px solid #333",color:"#555",borderRadius:10,padding:"10px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:14,cursor:"pointer"}}>EDIT THIS WORKOUT</button>
          </div>
        </div>
      )}

      {finishAlert && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"var(--bg-card)",borderRadius:16,padding:28,width:"100%",maxWidth:360,textAlign:"center",borderTop:"4px solid "+finishAlert.color}}>
            <div style={{fontSize:48,marginBottom:8}}>💪</div>
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:32,color:finishAlert.color,letterSpacing:2,marginBottom:4}}>{finishAlert.liftName.toUpperCase()} DONE!</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#555",marginBottom:20,letterSpacing:1}}>WEEK {finishAlert.week} COMPLETE</div>
            <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:24}}>
              <div style={{background:"var(--bg-input)",borderRadius:10,padding:"12px 20px"}}>
                <div style={{color:"#555",fontSize:10,marginBottom:4,letterSpacing:1}}>VOLUME</div>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,color:"var(--text-primary)"}}>{finishAlert.vol.toLocaleString()}<span style={{fontSize:12,color:"#555"}}> lbs</span></div>
              </div>
              {finishAlert.estMax && (
                <div style={{background:"var(--bg-input)",borderRadius:10,padding:"12px 20px"}}>
                  <div style={{color:"#555",fontSize:10,marginBottom:4,letterSpacing:1}}>EST MAX</div>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,color:"#06d6a0"}}>{finishAlert.estMax}<span style={{fontSize:12,color:"#555"}}> lbs</span></div>
                </div>
              )}
            </div>
            <button onClick={()=>{setFinishAlert(null);setView("dashboard");}} style={{width:"100%",background:finishAlert.color,border:"none",color:"#000",borderRadius:10,padding:"14px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,letterSpacing:2,cursor:"pointer"}}>LETS GO 🔥</button>
          </div>
        </div>
      )}

      {showWeightPrompt && (
        <div style={{position:"fixed",inset:0,background:"#0a0a0f99",zIndex:200,display:"flex",alignItems:"flex-end"}}>
          <div style={{background:"var(--bg-card)",borderRadius:"16px 16px 0 0",padding:24,width:"100%",maxWidth:500,margin:"0 auto",borderTop:"3px solid #06d6a0"}}>
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,color:"#06d6a0",marginBottom:4,letterSpacing:1}}>LOG THIS WEEK'S WEIGHT</div>
            <div style={{color:"#555",fontSize:12,marginBottom:16}}>Track your progress alongside your lifts.</div>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:16}}>
              <input type="number" value={weightEntry} placeholder="185 lbs" autoFocus
                onChange={e=>setWeightEntry(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&weightEntry){logWeightAndDismiss();setShowWeightPrompt(false);}}}
                style={{flex:1,background:"var(--bg-input)",border:"1px solid #06d6a0",color:"#06d6a0",borderRadius:6,padding:"10px 12px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,textAlign:"center"}} />
              <span style={{color:"#555",fontSize:12}}>lbs</span>
            </div>
            <button onClick={()=>{if(weightEntry){logWeightAndDismiss();setShowWeightPrompt(false);}}} style={{width:"100%",background:"#06d6a0",border:"none",color:"#000",borderRadius:8,padding:"14px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,letterSpacing:2,cursor:"pointer",marginBottom:10}}>LOG WEIGHT</button>
            <button onClick={()=>setShowWeightPrompt(false)} style={{width:"100%",background:"none",border:"1px solid #333",color:"#555",borderRadius:8,padding:"10px",fontFamily:"'DM Mono',monospace",fontSize:12,cursor:"pointer"}}>skip for now</button>
          </div>
        </div>
      )}

      {showWeightModal && (
        <div style={{position:"fixed",inset:0,background:"#0a0a0fdd",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"var(--bg-card)",borderRadius:16,padding:28,width:"100%",maxWidth:360,borderTop:"4px solid #f7b731"}}>
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:26,letterSpacing:2,color:"#f7b731",marginBottom:6}}>HEY! LOG YOUR WEIGHT</div>
            <div style={{color:"var(--text-secondary)",fontSize:13,marginBottom:20,lineHeight:1.6}}>You've skipped a couple times this week. Tracking your weight is just as important as tracking your lifts. Takes 5 seconds.</div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <input type="number" value={weightEntry} placeholder="185 lbs"
                onChange={e=>setWeightEntry(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&logWeightAndDismiss()}
                style={{flex:1,background:"var(--bg-input)",border:"1px solid #f7b731",color:"#f7b731",borderRadius:6,padding:"10px 12px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,textAlign:"center"}} />
            </div>
            <button onClick={logWeightAndDismiss} style={{width:"100%",background:"#f7b731",border:"none",color:"#000",borderRadius:8,padding:"14px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,letterSpacing:2,cursor:"pointer",marginBottom:10}}>LOG IT NOW</button>
            <button onClick={()=>setShowWeightModal(false)} style={{width:"100%",background:"none",border:"1px solid #333",color:"#555",borderRadius:8,padding:"10px",fontFamily:"'DM Mono',monospace",fontSize:12,cursor:"pointer"}}>maybe later</button>
          </div>
        </div>
      )}

      <div className="theme-dark" style={{padding:"12px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"var(--bg-secondary)",zIndex:10}}>
        <div>
          <img src="/logo.png" alt="Bar None" style={{height:80,objectFit:"contain"}} />
        </div>
        <button onClick={()=>setShowProfile(true)} style={{background:"var(--bg-card)",border:"1px solid #222",color:"#555",borderRadius:6,padding:"5px 12px",fontFamily:"'DM Mono',monospace",fontSize:11,cursor:"pointer",textAlign:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <span>{(currentUser?.user_metadata?.name || currentUser?.email || "USER").split(" ")[0].toUpperCase()}</span>
            <span style={{fontSize:9}}>⚙️</span>
          </div>
          <div style={{fontSize:9,color:"#333",letterSpacing:1}}>{APP_VERSION}</div>
        </button>
      </div>

      <div style={{maxWidth:600,margin:"0 auto"}}>

      {view==="run" && (
        <div style={{padding:16,paddingBottom:100}}>
          {(!runActive || runDays.length < 2) ? (
            <div style={{textAlign:"center",padding:40}}>
              <div style={{fontSize:48,marginBottom:12}}>🏃</div>
              <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,color:"#555",letterSpacing:2,marginBottom:8}}>{!runActive && runDays.length>=2 ? "C25K PAUSED" : "C25K NOT SET UP"}</div>
              <div style={{color:"#444",fontSize:12,marginBottom:20}}>{!runActive && runDays.length>=2 ? "Running is turned off for this program. Turn it back on in Setup → Edit Program." : "Go to SETUP and pick at least 2 running days to start the Couch to 5K program."}</div>
              <button onClick={()=>setView("setup")} style={{background:"#3a86ff",border:"none",color:"#000",borderRadius:8,padding:"12px 24px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,cursor:"pointer",letterSpacing:1}}>GO TO SETUP</button>
            </div>
          ) : (
            <>
              {/* Run view tabs */}
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                {["today","plan","history"].map(t=>(
                  <button key={t} onClick={()=>setRunView(t)} style={{flex:1,background:runView===t?"var(--bg-input)":"var(--bg-card)",border:"1px solid "+(runView===t?"#3a86ff":"#222"),color:runView===t?"#3a86ff":"#555",borderRadius:6,padding:"8px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:12,letterSpacing:1,cursor:"pointer"}}>
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* TODAY */}
              {runView==="today" && (() => {
                const plan = C25K_PLAN[runDays.length >= 3 ? 3 : 2];
                const weekPlan = plan[runWeek-1];
                const dayPlan = weekPlan?.days[runDay-1];
                const todayAbbr = DAY_ABBR[new Date().getDay()];
                const isRunDay = runDays.includes(todayAbbr) || runAnyway;
                const completedToday = runHistory.some(r => r.date === todayISO());
                const nextRun = (() => {
                  for(let i=1;i<=7;i++){
                    const d=DAY_ABBR[(new Date().getDay()+i)%7];
                    if(runDays.includes(d)) return {day:d,daysAway:i};
                  }
                  return null;
                })();

                // No run today
                if (!isRunDay) return (
                  <div>
                    <div style={{background:"var(--bg-card)",borderRadius:12,padding:"20px",marginBottom:16,border:"2px solid #333",display:"flex",alignItems:"center",gap:16}}>
                      <div style={{fontSize:38}}>😴</div>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:28,color:"#555",letterSpacing:2,lineHeight:1}}>NO RUN TODAY</div>
                        <div style={{fontSize:12,color:"#888",marginTop:6}}>{nextRun ? "NEXT RUN: "+nextRun.day+" · "+(nextRun.daysAway===1?"TOMORROW":"IN "+nextRun.daysAway+" DAYS")+" · WK "+runWeek+" DAY "+runDay : "REST UP!"}</div>
                      </div>
                    </div>
                    <button onClick={()=>setRunAnyway(true)} style={{width:"100%",background:"var(--bg-input)",border:"1px solid #3a86ff",color:"#3a86ff",borderRadius:10,padding:"12px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,letterSpacing:1,cursor:"pointer"}}>🏃 RUN ANYWAY</button>
                  </div>
                );

                // Completed today
                if (completedToday) return (
                  <div>
                    <div style={{background:"var(--bg-card)",borderRadius:12,padding:"20px",marginBottom:16,border:"2px solid #06d6a0",display:"flex",alignItems:"center",gap:16}}>
                      <div style={{fontSize:38}}>✅</div>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:28,color:"#06d6a0",letterSpacing:2,lineHeight:1}}>RUN COMPLETE!</div>
                        <div style={{fontSize:12,color:"#888",marginTop:6}}>Week {runWeek} Day {runDay} done · {nextRun?"Next: "+nextRun.day:"All done!"}</div>
                      </div>
                    </div>
                  </div>
                );

                // Run day - show workout
                return (
                  <div>
                    <div style={{background:"var(--bg-card)",borderRadius:12,padding:"20px",marginBottom:16,border:"2px solid #3a86ff"}}>
                      <div style={{display:"flex",alignItems:"center",gap:16}}>
                        <div style={{fontSize:38}}>🏃</div>
                        <div style={{flex:1}}>
                          <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:28,color:"#3a86ff",letterSpacing:2,lineHeight:1}}>RUN DAY!</div>
                          <div style={{fontSize:12,color:"#888",marginTop:6}}>WEEK {runWeek} · DAY {runDay} · ~{dayPlan?.totalMin} MIN</div>
                        </div>
                      </div>
                    </div>

                    {!showRunLog && dayPlan && (
                      <div style={{background:"var(--bg-card)",borderRadius:12,marginBottom:16,borderTop:"4px solid #3a86ff",overflow:"hidden"}}>
                        <div style={{padding:"14px 16px 10px"}}>
                          <div style={{color:"#555",fontSize:10,marginBottom:4,letterSpacing:1}}>WEEK {runWeek} — DAY {runDay}{dayPlan.isEasy?" · EASY RUN":""}</div>
                          <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,color:"#3a86ff",letterSpacing:2,marginBottom:14}}>{weekPlan.goal}</div>
                        </div>
                        {dayPlan.intervals.map((seg,i) => (
                          seg.type==="repeat" ? (
                            <div key={i} style={{margin:"0 12px 10px",borderRadius:10,overflow:"hidden",border:"1px solid var(--bg-input)"}}>
                              <div style={{background:"var(--bg-input)",padding:"8px 14px",display:"flex",alignItems:"center",gap:10}}>
                                <span style={{fontSize:16}}>🔁</span>
                                <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:14,color:"#8338ec",letterSpacing:1,flex:1}}>REPEAT</span>
                                <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,color:"#8338ec"}}>× {seg.reps}</span>
                              </div>
                              {seg.intervals.map((s,j) => (
                                <div key={j} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:s.type==="jog"?"#1a2a4a":"#1a1a0a",borderTop:"1px solid var(--bg-sunken)"}}>
                                  <span style={{fontSize:20}}>{s.type==="jog"?"🏃":"🚶"}</span>
                                  <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,color:s.type==="jog"?"#3a86ff":"#f7b731",flex:1,letterSpacing:1}}>{s.type==="jog"?"JOG":"WALK"}</span>
                                  <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,color:s.type==="jog"?"#3a86ff":"#f7b731"}}>{s.duration<1?s.duration*60+"s":s.duration+"min"}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",background:seg.type==="jog"?"#1a2a4a":"transparent",borderTop:"1px solid var(--bg-sunken)"}}>
                              <span style={{fontSize:20}}>{seg.type==="jog"?"🏃":"🚶"}</span>
                              <div style={{flex:1}}>
                                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,color:seg.type==="jog"?"#3a86ff":"#f7b731",letterSpacing:1}}>{seg.type==="jog"?"JOG":"WALK"}</div>
                                {seg.label && <div style={{fontSize:10,color:"#555",marginTop:1}}>{seg.label}</div>}
                              </div>
                              <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,color:seg.type==="jog"?"#3a86ff":"#f7b731"}}>{seg.duration+"min"}</span>
                            </div>
                          )
                        ))}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",background:"var(--bg-sunken)",borderTop:"1px solid var(--border)"}}>
                          <div style={{fontSize:10,color:"#555",letterSpacing:1}}>TOTAL TIME</div>
                          <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,color:"var(--text-primary)"}}>~{dayPlan.totalMin} min</div>
                        </div>
                      </div>
                    )}

                    {showRunLog && (
                      <div style={{background:"var(--bg-card)",borderRadius:12,marginBottom:16,borderTop:"4px solid #06d6a0",padding:"18px 16px"}}>
                        <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,color:"#06d6a0",letterSpacing:2,marginBottom:4}}>LOG YOUR RUN</div>
                        <div style={{color:"#555",fontSize:11,marginBottom:18}}>WEEK {runWeek} · DAY {runDay} — all fields optional</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
                          <div>
                            <div style={{color:"#555",fontSize:10,marginBottom:6,letterSpacing:1}}>DISTANCE</div>
                            <input type="number" step="0.1" value={runDistEntry} onChange={e=>setRunDistEntry(e.target.value)} placeholder="0.0"
                              style={{width:"100%",background:"var(--bg-input)",border:"1px solid #333",color:"#3a86ff",borderRadius:8,padding:10,fontFamily:"'Roboto Condensed',sans-serif",fontSize:24,fontWeight:700,textAlign:"center",outline:"none"}} />
                            <div style={{fontSize:10,color:"#555",textAlign:"center",marginTop:4}}>miles</div>
                          </div>
                          <div>
                            <div style={{color:"#555",fontSize:10,marginBottom:6,letterSpacing:1}}>TIME</div>
                            <div style={{display:"flex",alignItems:"center",gap:4}}>
                              <input type="number" value={runMinEntry} onChange={e=>setRunMinEntry(e.target.value)} placeholder="00"
                                style={{width:"100%",background:"var(--bg-input)",border:"1px solid #333",color:"#3a86ff",borderRadius:8,padding:10,fontFamily:"'Roboto Condensed',sans-serif",fontSize:24,fontWeight:700,textAlign:"center",outline:"none"}} />
                              <span style={{color:"#555",fontSize:18,fontWeight:700}}>:</span>
                              <input type="number" value={runSecEntry} onChange={e=>setRunSecEntry(e.target.value)} placeholder="00"
                                style={{width:"100%",background:"var(--bg-input)",border:"1px solid #333",color:"#3a86ff",borderRadius:8,padding:10,fontFamily:"'Roboto Condensed',sans-serif",fontSize:24,fontWeight:700,textAlign:"center",outline:"none"}} />
                            </div>
                            <div style={{fontSize:10,color:"#555",textAlign:"center",marginTop:4}}>min : sec</div>
                          </div>
                        </div>
                        <div style={{background:"var(--bg-sunken)",borderRadius:10,padding:"14px",textAlign:"center",marginBottom:16}}>
                          <div style={{color:"#555",fontSize:10,letterSpacing:1,marginBottom:4}}>PACE</div>
                          <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:32,fontWeight:700,color:runDistEntry&&runMinEntry?"#06d6a0":"#333"}}>
                            {runDistEntry&&runMinEntry ? (()=>{
                              const totalSecs=(+runMinEntry*60)+(+runSecEntry||0);
                              const pace=totalSecs/+runDistEntry;
                              return Math.floor(pace/60)+":"+String(Math.round(pace%60)).padStart(2,"0");
                            })() : "--:--"}
                            <span style={{fontSize:13,color:"#555",fontWeight:400}}> / mile</span>
                          </div>
                        </div>
                        <div style={{marginBottom:16}}>
                          <div style={{color:"#555",fontSize:10,letterSpacing:1,marginBottom:6}}>NOTES <span style={{color:"#333"}}>(optional)</span></div>
                          <textarea value={runNotesEntry} onChange={e=>setRunNotesEntry(e.target.value)} placeholder="How did it feel?"
                            style={{width:"100%",background:"var(--bg-input)",border:"1px solid #333",color:"var(--text-secondary)",borderRadius:8,padding:10,fontFamily:"'Roboto',sans-serif",fontSize:13,resize:"none",height:70,outline:"none"}} />
                        </div>
                        <button onClick={()=>{
                          const totalSecs=(+runMinEntry*60)+(+runSecEntry||0);
                          const paceSecPerMile=runDistEntry&&totalSecs?totalSecs/+runDistEntry:0;
                          const pm=Math.floor(paceSecPerMile/60);
                          const ps=Math.round(paceSecPerMile%60);
                          const pace=paceSecPerMile>0?pm+":"+String(ps).padStart(2,"0"):null;
                          const entry={date:todayISO(),week:runWeek,day:runDay,dist:+runDistEntry||null,totalSecs:totalSecs||null,pace,notes:runNotesEntry||null};
                          setRunHistory(prev=>[entry,...prev]);
                          const wp=C25K_PLAN[runDays.length>=3?3:2][runWeek-1];
                          if(runDay<wp.days.length){setRunDay(d=>d+1);}
                          else if(runWeek<12){setRunWeek(w=>w+1);setRunDay(1);}
                          setShowRunLog(false);
                          setRunAnyway(false);
                          setRunDistEntry("");setRunMinEntry("");setRunSecEntry("");setRunNotesEntry("");
                        }} style={{width:"100%",background:"#06d6a0",border:"none",color:"#000",borderRadius:10,padding:"16px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,fontWeight:700,letterSpacing:2,cursor:"pointer",marginBottom:8}}>SAVE RUN ✓</button>
                        <button onClick={()=>setShowRunLog(false)} style={{width:"100%",background:"none",border:"1px solid #333",color:"#555",borderRadius:10,padding:10,fontFamily:"'Roboto Condensed',sans-serif",fontSize:14,cursor:"pointer"}}>BACK</button>
                      </div>
                    )}

                    {!showRunLog && (
                      <button onClick={()=>setShowRunLog(true)} style={{width:"100%",background:"#3a86ff",border:"none",color:"#000",borderRadius:10,padding:"16px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,fontWeight:700,letterSpacing:2,cursor:"pointer",marginBottom:10}}>LOG COMPLETED RUN</button>
                    )}
                  </div>
                );
              })()}

              {/* PLAN */}
              {runView==="plan" && (
                  <div>
                    {C25K_PLAN[runDays.length>=3?3:2].map(wp=>{
                      const isDone = wp.week < runWeek || (wp.week === runWeek && runDay > wp.days.length);
                      const isCurrent = wp.week === runWeek;
                      const color = isDone?"#06d6a0":isCurrent?"#3a86ff":"#333";
                      return (
                        <div key={wp.week} style={{...card,borderLeft:"3px solid "+color,marginBottom:10,opacity:wp.week>runWeek+1?0.5:1}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,color,letterSpacing:1}}>WEEK {wp.week}{isCurrent?" ← YOU ARE HERE":""}</div>
                            <div style={{background:isDone?"#06d6a020":isCurrent?"#3a86ff20":"var(--bg-input)",color:isDone?"#06d6a0":isCurrent?"#3a86ff":"#555",borderRadius:4,padding:"2px 8px",fontSize:10,fontFamily:"'Roboto Condensed',sans-serif"}}>
                              {isDone?"✓ DONE":isCurrent?"IN PROGRESS":"UPCOMING"}
                            </div>
                          </div>
                          <div style={{color:"#555",fontSize:10,marginBottom:8,letterSpacing:1}}>{wp.goal}</div>
                          {wp.days.map(d=>(
                            <div key={d.day} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid var(--border)",fontSize:11}}>
                              <span style={{color,minWidth:45,fontFamily:"'Roboto Condensed',sans-serif"}}>DAY {d.day}{d.isEasy?" 🟢":""}</span>
                              <span style={{color:"#555",flex:1,padding:"0 8px"}}>{d.intervals.find(i=>i.type==="jog"||i.type==="repeat")?.label || (d.intervals.find(i=>i.type==="jog")?.duration ? d.intervals.find(i=>i.type==="jog").duration+"min jog" : "Intervals")}</span>
                              <span style={{color:"#f7b731",fontFamily:"'Roboto Condensed',sans-serif"}}>{d.totalMin}min</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
              )}

              {/* HISTORY */}
              {runView==="history" && (
                <div>
                  {runHistory.length === 0 ? (
                    <div style={{textAlign:"center",padding:40,color:"#444"}}>No runs logged yet. Get out there! 🏃</div>
                  ) : (
                    <>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
                        <div style={{background:"var(--bg-card)",borderRadius:8,padding:12,textAlign:"center"}}>
                          <div style={{color:"#555",fontSize:9,marginBottom:4,letterSpacing:1}}>RUNS</div>
                          <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,color:"#3a86ff"}}>{runHistory.length}</div>
                        </div>
                        <div style={{background:"var(--bg-card)",borderRadius:8,padding:12,textAlign:"center"}}>
                          <div style={{color:"#555",fontSize:9,marginBottom:4,letterSpacing:1}}>TOTAL</div>
                          <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,color:"#f7b731"}}>{runHistory.reduce((s,r)=>s+(r.dist||0),0).toFixed(1)}<span style={{fontSize:11}}>mi</span></div>
                        </div>
                        <div style={{background:"var(--bg-card)",borderRadius:8,padding:12,textAlign:"center"}}>
                          <div style={{color:"#555",fontSize:9,marginBottom:4,letterSpacing:1}}>BEST PACE</div>
                          <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,color:"#06d6a0"}}>{(()=>{const best=runHistory.filter(r=>r.pace).sort((a,b)=>a.pace.localeCompare(b.pace))[0];return best?.pace||"—"})()}</div>
                        </div>
                      </div>
                      {runHistory.map((r,i)=>(
                        <div key={i} style={{...card,marginBottom:8}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:r.notes?6:0}}>
                            <div>
                              <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:14,fontWeight:700,color:"#3a86ff"}}>WEEK {r.week} · DAY {r.day}</div>
                              <div style={{color:"#555",fontSize:10,marginTop:2}}>{fmtDate(r.date)}</div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              {r.dist?<div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,fontWeight:700,color:"var(--text-primary)"}}>{r.dist} <span style={{fontSize:12,color:"#555"}}>mi</span></div>:null}
                              {r.pace?<div style={{color:"#06d6a0",fontSize:12}}>{r.pace} / mile</div>:null}
                              {r.totalSecs?<div style={{color:"#555",fontSize:11}}>{Math.floor(r.totalSecs/60)}:{String(r.totalSecs%60).padStart(2,"0")} total</div>:null}
                            </div>
                          </div>
                          {r.notes&&<div style={{color:"#888",fontSize:12,fontStyle:"italic",borderTop:"1px solid var(--border)",paddingTop:6}}>"{r.notes}"</div>}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {view==="social" && (
        <div style={{maxWidth:600,margin:"0 auto"}}>
          <div style={{padding:"16px 16px 0"}}>
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,letterSpacing:2,color:"#888",marginBottom:14}}>SOCIAL</div>
          </div>
          <div style={{display:"flex",borderBottom:"1px solid var(--border)"}}>
            {[{id:"feed",label:"FEED"},{id:"friends",label:"FRIENDS"},{id:"requests",label:friendRequests.length > 0 ? "REQUESTS (" + friendRequests.length + ")" : "REQUESTS"},{id:"profile",label:"MY PROFILE"}].map(t => (
              <button key={t.id} onClick={()=>{setSocialTab(t.id);if(t.id==="profile"||t.id==="feed"){localStorage.setItem("barnone_last_reaction_"+uid, lastSeenReaction);setNewReactionCount(0);setNewFriendSessions(0);localStorage.setItem("barnone_social_check_"+uid, new Date().toISOString());}}} style={{flex:1,background:"none",border:"none",borderBottom:socialTab===t.id?"2px solid #e85d04":"2px solid transparent",color:socialTab===t.id?"var(--text-primary)":"#555",padding:"10px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,letterSpacing:1,cursor:"pointer"}}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{padding:16,flex:1}}>
            {socialTab === "feed" && (
              <div>
                {(()=>{
                  // Build feed from own sessions + friends sessions
                  const myPosts = sessionLedger.slice(0,30).map(s=>({
                    ...s,
                    authorId: uid,
                    authorName: (currentUser?.user_metadata?.name || currentUser?.email || "You").split(" ")[0],
                    authorUsername: username,
                    isMe: true,
                    type: "lift"
                  }));
                  const runPosts = runHistory.slice(0,10).map(r=>({
                    date: r.date,
                    authorId: uid,
                    authorName: (currentUser?.user_metadata?.name || currentUser?.email || "You").split(" ")[0],
                    authorUsername: username,
                    isMe: true,
                    type: "run",
                    week: r.week, day: r.day, dist: r.dist, pace: r.pace, totalSecs: r.totalSecs,
                    liftColor: "#3a86ff",
                  }));
                  const friendPosts = friends.flatMap(f => [
                    ...(f.session_ledger||[]).slice(0,10).map(s=>({
                      ...s,
                      authorId: f.id,
                      authorName: f.name || "Friend",
                      authorUsername: f.username || "",
                      isMe: false,
                      type: "lift"
                    })),
                    ...(f.run_history||[]).slice(0,5).map(r=>({
                      date: r.date,
                      authorId: f.id,
                      authorName: f.name || "Friend",
                      authorUsername: f.username || "",
                      isMe: false,
                      type: "run",
                      week: r.week, day: r.day, dist: r.dist, pace: r.pace,
                      liftColor: "#3a86ff",
                    })),
                  ]);
                  const allPosts = [...myPosts, ...runPosts, ...friendPosts]
                    .sort((a,b) => new Date(b.date) - new Date(a.date))
                    .slice(0,50);

                  if (allPosts.length === 0) return (
                    <div style={{textAlign:"center",padding:40,color:"#444"}}>
                      <div style={{fontSize:40,marginBottom:12}}>🏋️</div>
                      <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,letterSpacing:1,marginBottom:8}}>NO ACTIVITY YET</div>
                      <div style={{fontSize:12}}>Complete a workout or add friends to see activity here</div>
                    </div>
                  );

                  return allPosts.map((post, i) => {
                    // Get reactions for this post
                    const postKey = post.authorId + "_" + post.date + "_" + (post.liftName||"run");
                    // Reactions others sent on this post (for posts I own = received, for friend posts = from reactions table)
                    const postReactions = post.isMe
                      ? myReactions.filter(r => r.session_date === post.date && r.to_id === uid)
                      : myReactions.filter(r => r.session_date === post.date && r.to_id === post.authorId && r.from_id !== uid);
                    // My reaction on this post (what I sent)
                    const myReaction = sentReactions.find(r => r.session_date === post.date && r.to_id === post.authorId);
                    
                    // Time since
                    const daysSince = Math.floor((new Date() - new Date(post.date)) / 86400000);
                    const timeStr = daysSince === 0 ? "Today" : daysSince === 1 ? "Yesterday" : daysSince + "d ago";

                    return (
                      <div key={i} style={{background:"var(--bg-card)",borderRadius:10,padding:14,marginBottom:10,borderLeft:"3px solid "+(post.liftColor||"#555")}}>
                        {/* Header */}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <div>
                            <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,color:"var(--text-primary)"}}>{post.isMe ? "You" : post.authorName}</span>
                            {post.authorUsername ? <span style={{color:"#555",fontSize:11}}> @{post.authorUsername}</span> : null}
                          </div>
                          <span style={{color:"#555",fontSize:11}}>{timeStr}</span>
                        </div>

                        {/* Lift post */}
                        {post.type === "lift" && (
                          <div>
                            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:17,color:post.liftColor||"var(--text-primary)",marginBottom:4}}>
                              {post.liftName} · Week {post.week}
                            </div>
                            {(()=>{
                              const lift = (post.isMe ? lifts : (friends.find(f=>f.id===post.authorId)?.lifts||[])).find(l=>l.id===post.liftId);
                              const startMax = lift?.startingMax || 0;
                              const round5 = n => Math.round(n/5)*5;
                              // New max = next week's working max from est max
                              const newMax = post.estMax > 0 ? round5(post.estMax * 0.9) : 0;
                              const prevMax = post.week > 1 ? round5(startMax * 0.9) : 0;
                              const maxIncreased = newMax > prevMax && prevMax > 0;
                              const gainFromStart = post.estMax > 0 && startMax > 0 ? post.estMax - startMax : 0;
                              return (
                                <div>
                                  <div style={{display:"flex",gap:12,fontSize:11,color:"#555",marginBottom:8,flexWrap:"wrap"}}>
                                    {post.volume > 0 && <span>Vol: <span style={{color:"var(--text-secondary)"}}>{post.volume?.toLocaleString()} lbs</span></span>}
                                    {newMax > 0 && (
                                      <span style={{display:"flex",alignItems:"center",gap:3}}>
                                        {maxIncreased && <span style={{color:"#06d6a0",fontSize:13}}>↑</span>}
                                        <span style={{color:maxIncreased?"#06d6a0":"var(--text-secondary)"}}>New Max: {newMax} lbs</span>
                                      </span>
                                    )}
                                    {post.sets?.[3]?.reps != null && <span style={{color:"var(--text-secondary)"}}>AMRAP: {post.sets[3].reps}</span>}
                                    {post.durationSecs > 0 && <span>⏱ {fmtDuration(post.durationSecs)}</span>}
                                    {post.calories > 0 && <span>🔥 {post.calories} cal</span>}
                                  </div>
                                  {post.estMax > 0 && gainFromStart > 0 && (
                                    <div style={{display:"inline-flex",alignItems:"center",gap:4,background:(theme==="light"?"#dcf5ea":"#0a2a1a"),border:"1px solid #06d6a0",borderRadius:6,padding:"3px 10px",fontSize:11,color:(theme==="light"?"#0a7a52":"#06d6a0"),marginBottom:8}}>
                                      📈 Est Max {post.estMax} lbs · +{gainFromStart} from start
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* Run post */}
                        {post.type === "run" && (
                          <div>
                            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:17,color:"#3a86ff",marginBottom:4}}>
                              🏃 C25K · Week {post.week} Day {post.day}
                            </div>
                            <div style={{display:"flex",gap:16,fontSize:11,color:"#555",marginBottom:8}}>
                              {post.dist && <span>Dist: <span style={{color:"var(--text-secondary)"}}>{post.dist} mi</span></span>}
                              {post.pace && <span>Pace: <span style={{color:"#06d6a0"}}>{post.pace}/mi</span></span>}
                            </div>
                          </div>
                        )}

                        {/* Reactions */}
                        <div style={{marginTop:8}}>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>
                            {["💪","🔥","⚡","😤","💯"].map(emoji => {
                              const reactorsForEmoji = postReactions.filter(r=>r.emoji===emoji);
                              const reactionCount = reactorsForEmoji.length + (myReaction?.emoji===emoji?1:0);
                              const isSelected = myReaction?.emoji === emoji;
                              if(!post.isMe && reactionCount===0) return (
                                <button key={emoji} onClick={()=>sendReaction(post.authorId, post.date, post.liftName||"run", emoji)}
                                  style={{background:"transparent",border:"1px solid var(--border)",borderRadius:20,padding:"3px 8px",fontSize:15,cursor:"pointer",transition:"all 0.15s"}}>
                                  {emoji}
                                </button>
                              );
                              if(reactionCount===0) return null;
                              return (
                                <button key={emoji} onClick={()=>{
                                  if(!post.isMe) sendReaction(post.authorId, post.date, post.liftName||"run", emoji);
                                }}
                                  style={{background:isSelected?(theme==="light"?"#ffe6d5":"#2a1a0a"):"var(--border)",border:"1px solid "+(isSelected?"#e85d04":"#333"),borderRadius:20,padding:"3px 10px",fontSize:15,cursor:post.isMe?"default":"pointer",display:"flex",alignItems:"center",gap:4,transition:"all 0.2s",transform:isSelected?"scale(1.15)":"scale(1)",boxShadow:isSelected?"0 0 8px #e85d0444":"none"}}>
                                  {emoji}<span style={{fontSize:11,color:isSelected?"#e85d04":"#888",fontFamily:"'Roboto Condensed',sans-serif",fontWeight:isSelected?"700":"400"}}>{reactionCount}</span>
                                </button>
                              );
                            })}
                          </div>
                          {/* Who reacted */}
                          {(()=>{
                            // Build a deduped reactor list — one entry per person
                            const seen = new Set();
                            const reactors = [];
                            const addR = (fromId, fromName, fromUsername, emj, isYou) => {
                              if(seen.has(fromId)) return;
                              seen.add(fromId);
                              const friend = friends.find(f => f.id === fromId);
                              const nm = isYou ? "You" : (friend?.name || fromName || fromUsername || "Someone");
                              reactors.push({ id: fromId, name: nm, emoji: emj });
                            };
                            postReactions.forEach(r => addR(r.from_id, r.from_name, r.from_username, r.emoji, r.from_id === uid));
                            if(myReaction && !post.isMe) addR(uid, "You", "", myReaction.emoji, true);
                            if(reactors.length === 0) return null;
                            const open = reactorsOpen === postKey;
                            const clickable = reactors.length > 2;
                            let label;
                            if(reactors.length === 1) label = reactors[0].name + " reacted";
                            else if(reactors.length === 2) label = reactors[0].name + " and " + reactors[1].name + " reacted";
                            else label = reactors[0].name + " and " + (reactors.length - 1) + " others";
                            return (
                              <div style={{marginTop:2}}>
                                <div onClick={clickable ? (()=>setReactorsOpen(open ? null : postKey)) : undefined}
                                  style={{fontSize:10,color:clickable?"#999":"#555",marginTop:2,cursor:clickable?"pointer":"default",textDecoration:clickable?"underline":"none"}}>
                                  {label}{clickable ? (open ? " ▲" : " ▼") : ""}
                                </div>
                                {open && (
                                  <div style={{marginTop:4,background:"var(--bg-card)",borderRadius:8,padding:"6px 10px"}}>
                                    {reactors.map(rc => (
                                      <div key={rc.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0",fontSize:12,color:"#ccc"}}>
                                        <span>{rc.name}</span><span style={{fontSize:15}}>{rc.emoji}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {socialTab === "friends" && (
              <div>
                <div style={{marginBottom:16}}>
                  <div style={{color:"#555",fontSize:10,marginBottom:6,letterSpacing:1}}>FIND FRIENDS</div>
                  <input type="text" value={friendSearch} placeholder="Search by name or username..."
                    onChange={e => { setFriendSearch(e.target.value); searchFriends(e.target.value); }}
                    style={{width:"100%",background:"var(--bg-input)",border:"1px solid #333",color:"var(--text-primary)",borderRadius:6,padding:"8px 10px",fontFamily:"'DM Mono',monospace",fontSize:12}} />
                  {friendSearchResults.map(u => (
                    <div key={u.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                      <div>
                        <div style={{color:"var(--text-primary)",fontSize:13}}>{u.name}</div>
                        {u.username && <div style={{color:"#555",fontSize:11}}>{"@" + u.username}</div>}
                      </div>
                      <button onClick={()=>sendFriendRequest(u.id)} style={{background:"#e85d04",border:"none",color:"#000",borderRadius:4,padding:"5px 12px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,cursor:"pointer"}}>ADD</button>
                    </div>
                  ))}
                </div>
                {friends.length === 0 && <div style={{color:"#333",fontSize:12,textAlign:"center",padding:30}}>No friends yet — search above to add some!</div>}
                {[...friends].sort((a,b)=>(a.name||"").localeCompare(b.name||"")).map(f => {
                  const fLifts = f.lifts || DEFAULT_LIFTS;
                  const lastSession = (f.session_ledger || [])[0];
                  const daysSince = lastSession ? Math.floor((new Date(todayISO()) - new Date(lastSession.date)) / 86400000) : null;
                  const lastSeenStr = daysSince === null ? "never" : daysSince === 0 ? "today" : daysSince === 1 ? "yesterday" : daysSince + "d ago";
                  const lastSeenColor = daysSince === null ? "#444" : daysSince <= 1 ? "#06d6a0" : daysSince <= 4 ? "#f7b731" : "#e85d04";
                  // Compute real current max using their logs + lift_weeks
                  function getFriendEffMax(lift) {
                    const fLiftWeeks = f.lift_weeks || {};
                    const fLogs = f.logs || {};
                    const targetWeek = fLiftWeeks[lift.id] || 1;
                    if (lift.mainLiftOption === "Assisted Pull Up") {
                      const fbw = f.body_stats?.entries?.[0]?.weightLbs ? +f.body_stats.entries[0].weightLbs : null;
                      if (fbw == null) return lift.startingMax || 0; // no friend bodyweight — best-effort
                      let wmA = calcCurrentMax(Math.max(0, fbw - (lift.startingMax||0)));
                      for (let w = 1; w < targetWeek; w++) {
                        const log = fLogs?.[w]?.[lift.id]?.[3];
                        if (log?.reps && +log.reps > 10) {
                          const set4w = Math.round(wmA * 0.75 / 5) * 5;
                          const em = Math.round((set4w * 1.1 * +log.reps * 0.0333 + set4w * 1.1) / 5) * 5;
                          const d = em - wmA;
                          wmA = lift.isLower ? (d >= 20 ? wmA + 15 : d >= 10 ? wmA + 10 : wmA) : (d >= 20 ? wmA + 10 : d >= 10 ? wmA + 5 : wmA);
                        }
                      }
                      const effTM = Math.round(wmA / 0.9 / 5) * 5;
                      return Math.max(0, Math.round((fbw - effTM)/5)*5); // assistance
                    }
                    let wm = Math.round((lift.startingMax || 0) * 0.9 / 5) * 5;
                    for (let w = 1; w < targetWeek; w++) {
                      const log = fLogs?.[w]?.[lift.id]?.[3];
                      if (log?.reps && +log.reps > 10) {
                        const set4w = Math.round(wm * 0.75 / 5) * 5;
                        const em = Math.round((set4w * 1.1 * +log.reps * 0.0333 + set4w * 1.1) / 5) * 5;
                        const d = em - wm;
                        wm = lift.isLower ? (d >= 20 ? wm + 15 : d >= 10 ? wm + 10 : wm) : (d >= 20 ? wm + 10 : d >= 10 ? wm + 5 : wm);
                      }
                    }
                    return Math.round(wm / 0.9 / 5) * 5;
                  }
                  return (
                    <div key={f.id} style={{background:"var(--bg-card)",borderRadius:10,padding:14,marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                        <div>
                          <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,color:"var(--text-primary)"}}>{f.name}</div>
                          {f.username && <div style={{color:"#555",fontSize:11}}>{"@" + f.username}</div>}
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{color:lastSeenColor,fontSize:12,fontFamily:"'Roboto Condensed',sans-serif",letterSpacing:1}}>{lastSeenStr}</div>
                          {lastSession && <div style={{color:"#333",fontSize:10}}>{fmtDate(lastSession.date)}</div>}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:lastSession ? 10 : 0}}>
                        {fLifts.filter(l => l.startingMax > 0).map(l => {
                          const curMax = getFriendEffMax(l);
                          const gained = curMax - (l.startingMax || 0);
                          const cardStyle = {background:"var(--bg-input)",borderRadius:6,padding:"6px 10px",borderLeft:"2px solid " + l.color};
                          return (
                            <div key={l.id} style={cardStyle}>
                              <div style={{color:l.color,fontFamily:"'Roboto Condensed',sans-serif",fontSize:13}}>{l.name}</div>
                              <div style={{color:"var(--text-primary)",fontSize:13,fontFamily:"'Roboto Condensed',sans-serif"}}>{curMax} lbs</div>
                              {gained > 0 && <div style={{color:"#06d6a0",fontSize:10}}>+{gained} from start</div>}
                            </div>
                          );
                        })}
                      </div>
                      {lastSession && (
                        <div style={{borderTop:"1px solid var(--border)",paddingTop:10}}>
                          <div style={{color:"#555",fontSize:10,marginBottom:6}}>{lastSession.liftName + " · " + fmtDate(lastSession.date)}</div>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            {["💪","🔥","⚡","😤","💯"].map(emoji => {
                              const myFR = sentReactions.find(r => r.session_date === lastSession.date && r.to_id === f.id);
                              const isSelected = myFR?.emoji === emoji;
                              return (
                                <button key={emoji} onClick={()=>sendReaction(f.id, lastSession.date, lastSession.liftName, emoji)}
                                  style={{background:isSelected?(theme==="light"?"#ffe6d5":"#2a1a0a"):"var(--bg-input)",border:"1px solid "+(isSelected?"#e85d04":"#333"),borderRadius:6,padding:"4px 8px",fontSize:18,cursor:"pointer",transform:isSelected?"scale(1.1)":"scale(1)",boxShadow:isSelected?"0 0 8px #e85d0444":"none",transition:"all 0.2s"}}>
                                  {emoji}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {socialTab === "requests" && (
              <div>
                {friendRequests.length === 0 && <div style={{color:"#333",fontSize:12,textAlign:"center",padding:30}}>No pending friend requests</div>}
                {friendRequests.map(r => (
                  <div key={r.id} style={{background:"var(--bg-card)",borderRadius:10,padding:14,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{color:"var(--text-primary)",fontSize:14}}>{r.from_name || "Someone"}</div>
                      {r.from_username && <div style={{color:"#555",fontSize:11}}>@{r.from_username}</div>}
                      <div style={{color:"#444",fontSize:11}}>wants to be friends</div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>acceptFriendRequest(r.id)} style={{background:"#06d6a0",border:"none",color:"#000",borderRadius:4,padding:"6px 12px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,cursor:"pointer"}}>ACCEPT</button>
                      <button onClick={()=>declineFriendRequest(r.id)} style={{background:"none",border:"1px solid #555",color:"#555",borderRadius:4,padding:"6px 12px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,cursor:"pointer"}}>DECLINE</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {socialTab === "profile" && (
              <div>
                <div style={{background:"var(--bg-card)",borderRadius:10,padding:14,marginBottom:14}}>
                  {username ? (
                    <>
                      <div style={{marginBottom:12}}>
                        <div style={{color:"#555",fontSize:10,marginBottom:4}}>DISPLAY NAME</div>
                        {editingName
                          ? <div style={{display:"flex",gap:8}}>
                              <input type="text" value={displayName} onChange={e=>setDisplayName(e.target.value)}
                                style={{flex:1,background:"var(--bg-input)",border:"1px solid #333",color:"var(--text-primary)",borderRadius:6,padding:"6px 10px",fontFamily:"'DM Mono',monospace",fontSize:13}} />
                              <button onClick={async()=>{
                                await supabase.from("public_profiles").update({name:displayName}).eq("id",uid);
                                setEditingName(false);
                              }} style={{background:"#e85d04",border:"none",color:"#000",borderRadius:6,padding:"6px 12px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,cursor:"pointer"}}>SAVE</button>
                              <button onClick={()=>setEditingName(false)} style={{background:"none",border:"1px solid #555",color:"#555",borderRadius:6,padding:"6px 10px",fontSize:12,cursor:"pointer"}}>✕</button>
                            </div>
                          : <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div style={{color:"var(--text-primary)",fontSize:15}}>{displayName || currentUser?.user_metadata?.name || currentUser?.email}</div>
                              <button onClick={()=>setEditingName(true)} style={{background:"none",border:"1px solid #555",color:"#555",borderRadius:4,padding:"2px 8px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,cursor:"pointer"}}>EDIT</button>
                            </div>
                        }
                      </div>
                      <div style={{marginBottom:12}}>
                        <div style={{color:"#555",fontSize:10,marginBottom:4}}>USERNAME</div>
                        <div style={{color:"var(--text-primary)",fontSize:16,fontFamily:"'DM Mono',monospace"}}>@{username}</div>
                        <div style={{color:"#333",fontSize:10,marginTop:4}}>Connections stay linked to your account, not your username.</div>
                      </div>
                      <div style={{marginBottom:14}}>
                        <div style={{color:"#555",fontSize:10,marginBottom:8,letterSpacing:1}}>PUBLIC PROFILE</div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div style={{color:"var(--text-secondary)",fontSize:12}}>Friends can find and see your progress</div>
                          <button onClick={()=>{const newVal=!isPublic;setIsPublic(newVal);if(username){supabase.from("public_profiles").update({is_public:newVal}).eq("id",uid);}}} style={{background:isPublic?"#06d6a0":"var(--bg-input)",border:"1px solid "+(isPublic?"#06d6a0":"#555"),color:isPublic?"#000":"#555",borderRadius:20,padding:"4px 14px",fontFamily:"'DM Mono',monospace",fontSize:12,cursor:"pointer"}}>
                            {isPublic?"ON":"OFF"}
                          </button>
                        </div>
                      </div>
                      <div style={{borderTop:"1px solid var(--border)",paddingTop:16,marginBottom:14}}>
                        <div style={{color:"#555",fontSize:10,marginBottom:8,letterSpacing:1}}>WEIGHT UNIT</div>
                        <div style={{display:"flex",gap:8}}>
                          {["lbs","kg"].map(u=>(
                            <button key={u} onClick={()=>setWeightUnitPref(u)}
                              style={{flex:1,background:weightUnit===u?"var(--bg-input)":"var(--bg-sunken)",border:"1px solid "+(weightUnit===u?"#e85d04":"#333"),color:weightUnit===u?"#e85d04":"#555",borderRadius:6,padding:"10px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,letterSpacing:1,cursor:"pointer"}}>
                              {u.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{marginBottom:14}}>
                        <div style={{color:"#555",fontSize:10,marginBottom:8,letterSpacing:1}}>THEME</div>
                        <div style={{display:"flex",gap:8}}>
                          {[{id:"dark",label:"DARK"},{id:"midnight",label:"MIDNIGHT"},{id:"light",label:"LIGHT"}].map(t=>(
                            <button key={t.id} onClick={()=>setThemePref(t.id)}
                              style={{flex:1,background:theme===t.id?"var(--bg-input)":"var(--bg-sunken)",border:"1px solid "+(theme===t.id?"#3a86ff":"#333"),color:theme===t.id?"#3a86ff":"#555",borderRadius:6,padding:"8px 4px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:12,letterSpacing:1,cursor:"pointer"}}>
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{color:"#555",fontSize:10,marginBottom:6,letterSpacing:1}}>CHOOSE YOUR USERNAME</div>
                      <div style={{color:"#444",fontSize:11,marginBottom:10}}>You can change this anytime. Your connections stay the same.</div>
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14}}>
                        <span style={{color:"#555",fontSize:14}}>@</span>
                        <input type="text" value={usernameEntry} placeholder="yourname"
                          onChange={e => setUsernameEntry(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                          style={{flex:1,background:"var(--bg-input)",border:"1px solid #333",color:"var(--text-primary)",borderRadius:6,padding:"8px 10px",fontFamily:"'DM Mono',monospace",fontSize:13}} />
                      </div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                        <div>
                          <div style={{color:"var(--text-primary)",fontSize:13}}>Public profile</div>
                          <div style={{color:"#555",fontSize:11}}>Friends can find and see your progress</div>
                        </div>
                        <button onClick={()=>setIsPublic(p=>!p)} style={{background:isPublic?"#06d6a0":"var(--bg-input)",border:"1px solid "+(isPublic?"#06d6a0":"#555"),color:isPublic?"#000":"#555",borderRadius:20,padding:"4px 14px",fontFamily:"'DM Mono',monospace",fontSize:12,cursor:"pointer"}}>
                          {isPublic ? "ON" : "OFF"}
                        </button>
                      </div>
                      <button onClick={savePublicProfile} style={{width:"100%",background:"#e85d04",border:"none",color:"#000",borderRadius:8,padding:"12px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,letterSpacing:1,cursor:"pointer"}}>SET USERNAME</button>
                    </>
                  )}
                </div>
                {myReactions.length > 0 && (
                  <div style={{background:"var(--bg-card)",borderRadius:10,padding:14}}>
                    <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,color:"#888",marginBottom:10,letterSpacing:1}}>REACTIONS RECEIVED</div>
                    {myReactions.slice(0,10).map((r,i) => (
                      <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--border)",fontSize:12}}>
                        <span style={{color:"#555"}}>{r.lift_name + " · " + fmtDate(r.session_date)}</span>
                        <span style={{fontSize:18}}>{r.emoji}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

        {view==="dashboard" && (
          <div style={{padding:16}}>
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,letterSpacing:2,color:"#888",marginBottom:14}}>DASHBOARD</div>
            {hasSetup && dataLoaded && (()=>{
              const todayAbbr = DAY_ABBR[new Date().getDay()];
              // Find lifts scheduled today that haven't been completed yet
              const todayScheduled = lifts.filter(l => l.active!==false && (l.trainingDays||[]).includes(todayAbbr));
              const isRunDay = runActive && runDays.includes(todayAbbr);
              const runCompletedToday = runHistory.some(r => r.date === todayISO());
              const todayCompleted = todayScheduled.filter(l => isLiftDoneToday(l.id));
              const todayPending = todayScheduled.filter(l => !isLiftDoneToday(l.id));
              // Find next upcoming lift
              const getNextLift = () => {
                for(let i=1; i<=7; i++){
                  const nextDay = DAY_ABBR[(new Date().getDay()+i)%7];
                  const found = lifts.find(l => l.active!==false && (l.trainingDays||[]).includes(nextDay));
                  if(found) return {lift:found, day:nextDay, daysAway:i};
                }
                return null;
              };
              const nextLift = getNextLift();
              // Determine banner message
              let bannerColor, bannerIcon, bannerTitle, bannerSub;
              if (todayPending.length > 0) {
                // Time to lift today
                const l = todayPending[0];
                bannerColor = l.color || "#e85d04";
                bannerIcon = "💪";
                bannerTitle = "TIME TO LIFT";
                bannerSub = l.name.toUpperCase() + " — WEEK " + (liftWeeks[l.id]||1);
              } else if (isRunDay && !runCompletedToday && todayPending.length === 0) {
                // Run day - lifts done or no lifts today
                const wp = C25K_PLAN[runDays.length>=3?3:2]?.[runWeek-1];
                bannerColor = "#3a86ff";
                bannerIcon = "🏃";
                bannerTitle = "RUN DAY!";
                bannerSub = "WEEK " + runWeek + " · DAY " + runDay + " · ~" + (wp?.days[runDay-1]?.totalMin||30) + " MIN";
              } else if ((todayCompleted.length > 0 || (isRunDay && runCompletedToday)) && todayPending.length === 0) {
                // All done today - find next scheduled event (lift OR run) whichever comes first
                bannerColor = "#06d6a0";
                bannerIcon = "✅";
                bannerTitle = "GREAT WORK TODAY!";
                // Find next run day
                let nextRunInfo = null;
                for(let i=1;i<=7;i++){
                  const d=DAY_ABBR[(new Date().getDay()+i)%7];
                  if(runActive && runDays.includes(d)) { nextRunInfo={day:d,daysAway:i}; break; }
                }
                // Compare next lift vs next run and show whichever is sooner
                const nextLiftDays = nextLift ? nextLift.daysAway : 99;
                const nextRunDays = nextRunInfo ? nextRunInfo.daysAway : 99;
                if (nextLiftDays <= nextRunDays && nextLift) {
                  bannerSub = "NEXT: " + nextLift.lift.name.toUpperCase() + " WK " + (liftWeeks[nextLift.lift.id]||1) + (nextLift.daysAway===1?" · TOMORROW":" · IN "+nextLift.daysAway+" DAYS");
                } else if (nextRunInfo) {
                  bannerSub = "NEXT RUN: WK " + runWeek + " DAY " + runDay + (nextRunInfo.daysAway===1?" · TOMORROW":" · IN "+nextRunInfo.daysAway+" DAYS");
                } else {
                  bannerSub = "ALL CAUGHT UP 🎉";
                }
              } else {
                // Rest day
                bannerColor = "#555";
                bannerIcon = "😴";
                bannerTitle = "REST DAY";
                bannerSub = nextLift
                  ? "NEXT: " + nextLift.lift.name.toUpperCase() + " WK " + (liftWeeks[nextLift.lift.id]||1) + (nextLift.daysAway===1?" · TOMORROW":" · IN "+nextLift.daysAway+" DAYS")
                  : "ENJOY THE RECOVERY";
              }
              return (
                <div onClick={()=>{ if(todayPending.length>0) { setActiveId(todayPending[0].id); setView("workout"); } else if(isRunDay&&!runCompletedToday) { setView("run"); setRunView("today"); } }} style={{background:"var(--bg-card)",borderRadius:12,padding:"20px",marginBottom:16,border:"2px solid "+bannerColor,display:"flex",alignItems:"center",gap:16,cursor:(todayPending.length>0||(isRunDay&&!runCompletedToday))?"pointer":"default"}}>
                  <div style={{fontSize:38}}>{bannerIcon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:28,color:bannerColor,letterSpacing:2,lineHeight:1}}>{bannerTitle}</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#888",marginTop:6}}>{bannerSub}</div>
                  </div>
                  {(todayPending.length>0||(isRunDay&&!runCompletedToday)) && <div style={{color:bannerColor,fontSize:28,fontWeight:"bold"}}>›</div>}
                </div>
              );
            })()}
            {!hasSetup && dataLoaded && (
              <div style={{...card,borderLeft:"3px solid #f7b731"}}>
                <div style={{color:"#f7b731",fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,marginBottom:4}}>SETUP REQUIRED</div>
                <div style={{color:"#555",fontSize:12,marginBottom:10}}>Enter your starting maxes to begin the program.</div>
                <button onClick={()=>setView("setup")} className="bn" style={{background:"#f7b731",color:"#000"}}>GO TO SETUP</button>
              </div>
            )}
            {nudgeLevel === 0 && (
              <div style={{...card,borderLeft:"3px solid #f7b731",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <div>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:14,color:"#f7b731",letterSpacing:1}}>LOG THIS WEEK'S WEIGHT</div>
                  <div style={{color:"#555",fontSize:11}}>Last: {latestWeight ? latestWeight+" lbs" : "never"}</div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <input type="number" value={weightEntry} placeholder="lbs" step="0.1" onFocus={e=>e.target.select()}
                    onChange={e=>setWeightEntry(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&logWeightAndDismiss()}
                    style={{width:64,color:"#f7b731",borderColor:"#f7b731"}} />
                  <button onClick={logWeightAndDismiss} className="bn" style={{background:"#f7b731",color:"#000",fontSize:13,padding:"4px 10px"}}>LOG</button>
                  <button onClick={skipWeightNudge} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:18,padding:"0 4px"}}>×</button>
                </div>
              </div>
            )}

            {nudgeLevel === 1 && (
              <div style={{...card,borderLeft:"3px solid #f7b731",marginBottom:14}}>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,color:"#f7b731",letterSpacing:1,marginBottom:4}}>YOUR BODY IS CHANGING</div>
                <div style={{color:"var(--text-secondary)",fontSize:12,marginBottom:14}}>You're putting in the work — track the results. Log this week's weight to see how your body is responding to the program.</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input type="number" value={weightEntry} placeholder="lbs" step="0.1" onFocus={e=>e.target.select()}
                    onChange={e=>setWeightEntry(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&logWeightAndDismiss()}
                    style={{flex:1,color:"#f7b731",borderColor:"#f7b731"}} />
                  <button onClick={logWeightAndDismiss} className="bn" style={{background:"#f7b731",color:"#000"}}>LOG WEIGHT</button>
                  <button onClick={skipWeightNudge} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:18,padding:"0 4px"}}>×</button>
                </div>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
              {[{l:"SESSIONS",v:totalPossible > 0 ? totalSessions + " of " + totalPossible : totalSessions,c:"var(--text-primary)"},{l:"STREAK",v:streak+"🔥",c:"#f7b731"},{l:"VOLUME",v:programVolume > 0 ? programVolumeDisplay + " lbs" : "—",c:"#3a86ff"}].map(s=>(
                <div key={s.l} style={{...card,textAlign:"center",marginBottom:0}}>
                  <div style={{color:"#555",fontSize:9,marginBottom:4}}>{s.l}</div>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:26,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>

            <div style={{...card}}>
              <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,color:"#888",marginBottom:14,letterSpacing:1}}>BODY STATS</div>
              {(()=>{
                const prevWeight = bodyStats.entries[1]?.weightLbs;
                const trend = prevWeight ? (latestWeight > prevWeight ? "↑" : latestWeight < prevWeight ? "↓" : "→") : null;
                const trendCol = prevWeight ? (latestWeight > prevWeight ? "#e85d04" : latestWeight < prevWeight ? "#06d6a0" : "#555") : null;
                return (
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                    {bodyStats.heightIn && (
                      <div style={{background:"var(--bg-sunken)",borderRadius:8,padding:"12px"}}>
                        <div style={{color:"#555",fontSize:10,marginBottom:6,letterSpacing:1}}>HEIGHT</div>
                        <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:28,color:"var(--text-secondary)",lineHeight:1}}>{Math.floor(+bodyStats.heightIn/12)}′{+bodyStats.heightIn%12}″</div>
                      </div>
                    )}
                    {/* Weight card with trend */}
                    <div style={{background:"var(--bg-sunken)",borderRadius:8,padding:"12px"}}>
                      <div style={{color:"#555",fontSize:10,marginBottom:6,letterSpacing:1}}>WEIGHT</div>
                      {latestWeight ? (
                        <>
                          <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:28,color:"#06d6a0",lineHeight:1}}>{latestWeight}</div>
                            <div style={{fontSize:10,color:"#555"}}>lbs</div>
                          </div>
                          {trend && (
                            <div style={{display:"flex",alignItems:"center",gap:4,marginTop:6,background:trendCol+"33",borderRadius:6,padding:"3px 8px",width:"fit-content"}}>
                              <span style={{fontSize:20,color:trendCol,lineHeight:1,fontWeight:"bold"}}>{trend}</span>
                              <span style={{fontSize:10,color:trendCol,fontFamily:"'DM Mono',monospace"}}>{prevWeight?Math.abs(+latestWeight-+prevWeight).toFixed(1)+" lbs":""}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{color:"#444",fontSize:11,marginTop:4}}>not logged</div>
                      )}
                    </div>
                    {/* LOG card */}
                    <div style={{background:"var(--bg-sunken)",borderRadius:8,padding:"12px",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center"}}>
                      <div style={{color:"#555",fontSize:10,marginBottom:8,letterSpacing:1}}>LOG</div>
                      <button onClick={()=>setShowWeightPrompt(true)} style={{background:"#06d6a0",border:"none",color:"#000",borderRadius:8,padding:"10px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,cursor:"pointer",letterSpacing:1,width:"100%"}}>LOG WEIGHT</button>
                      {loggedThisWeek && <div style={{color:"#06d6a0",fontSize:9,marginTop:4}}>✓ logged this week</div>}
                    </div>
                    {!bodyStats.heightIn && !latestWeight && (
                      <div style={{color:"#444",fontSize:11,gridColumn:"1/-1"}}>Set up height & weight in PROGRAM setup</div>
                    )}
                  </div>
                );
              })()}

            </div>

            <div style={{...card}}>
              <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,color:"#888",marginBottom:10,letterSpacing:1}}>CURRENT MAXES</div>
              {PRs.map(l=>(
                <div key={l.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
                  <div>
                    <div style={{color:l.color,fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,letterSpacing:1}}>{l.name}</div>
                    <div style={{color:"#555",fontSize:10}}>Week {liftWeeks[l.id]||1} · Started {l.startMax} lbs</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,color:l.color}}>{l.curMax} lbs</div>
                    {l.curMax>l.startMax && <div style={{color:"#06d6a0",fontSize:11}}>+{l.curMax-l.startMax} lbs</div>}
                  </div>
                </div>
              ))}
            </div>

            {runDays.length > 0 && (
              <div style={{...card}}>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,color:"#888",marginBottom:10,letterSpacing:1}}>C25K PROGRESS</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{color:"#3a86ff",fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,letterSpacing:1}}>WEEK {runWeek} · DAY {runDay}</div>
                  <div style={{color:"#555",fontSize:11}}>{runHistory.length} run{runHistory.length!==1?"s":""} logged</div>
                </div>
                {runHistory.length > 0 ? (
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
                    <div style={{background:"var(--bg-sunken)",borderRadius:8,padding:"10px",textAlign:"center"}}>
                      <div style={{color:"#555",fontSize:9,marginBottom:4,letterSpacing:1}}>TOTAL MILES</div>
                      <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,color:"#f7b731"}}>{runHistory.reduce((s,r)=>s+(r.dist||0),0).toFixed(1)}</div>
                    </div>
                    <div style={{background:"var(--bg-sunken)",borderRadius:8,padding:"10px",textAlign:"center"}}>
                      <div style={{color:"#555",fontSize:9,marginBottom:4,letterSpacing:1}}>AVG PACE</div>
                      <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,color:"#3a86ff"}}>{(()=>{
                        const runs = runHistory.filter(r=>r.totalSecs&&r.dist);
                        if(!runs.length) return "—";
                        const avgPace = runs.reduce((s,r)=>s+(r.totalSecs/r.dist),0)/runs.length;
                        return Math.floor(avgPace/60)+":"+String(Math.round(avgPace%60)).padStart(2,"0");
                      })()}</div>
                    </div>
                    <div style={{background:"var(--bg-sunken)",borderRadius:8,padding:"10px",textAlign:"center"}}>
                      <div style={{color:"#555",fontSize:9,marginBottom:4,letterSpacing:1}}>BEST PACE</div>
                      <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,color:"#06d6a0"}}>{(()=>{
                        const best=runHistory.filter(r=>r.pace).sort((a,b)=>a.pace.localeCompare(b.pace))[0];
                        return best?best.pace:"—";
                      })()}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{color:"#333",fontSize:11,marginBottom:10}}>No runs logged yet — get out there! 🏃</div>
                )}
                {runHistory[0] && (
                  <div style={{background:"var(--bg-sunken)",borderRadius:8,padding:"10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,color:"#3a86ff"}}>LAST RUN · WK {runHistory[0].week} DAY {runHistory[0].day}</div>
                      <div style={{color:"#555",fontSize:10,marginTop:2}}>{fmtDate(runHistory[0].date)}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      {runHistory[0].dist && <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,color:"var(--text-primary)"}}>{runHistory[0].dist} mi</div>}
                      {runHistory[0].pace && <div style={{color:"#555",fontSize:10}}>{runHistory[0].pace}/mi</div>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {sessionLedger[0] && (
              <div style={{...card,borderLeft:"3px solid "+(sessionLedger[0].liftColor||"#555")}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,color:"#888",letterSpacing:1}}>LAST SESSION</div>
                  <div style={{display:"flex",gap:10}}>
                    {sessionLedger[0].durationSecs > 0 && <span style={{fontSize:11,color:"#555"}}>⏱ {fmtDuration(sessionLedger[0].durationSecs)}</span>}
                    {sessionLedger[0].calories > 0 && <span style={{fontSize:11,color:"#f7b731"}}>🔥 ~{sessionLedger[0].calories} cal</span>}
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{color:sessionLedger[0].liftColor,fontFamily:"'Roboto Condensed',sans-serif",fontSize:18}}>{sessionLedger[0].liftName}</div>
                  <div style={{color:"#555",fontSize:11}}>{fmtDate(sessionLedger[0].date)} · Wk {sessionLedger[0].week}</div>
                </div>
                <div style={{color:"#555",fontSize:11}}>Vol: <span style={{color:"var(--text-primary)"}}>{sessionLedger[0].volume?.toLocaleString()} lbs</span>{sessionLedger[0].estMax?<> · Est: <span style={{color:"#06d6a0"}}>{sessionLedger[0].estMax} lbs</span></>:""}</div>
                {sessionLedger[0].notes && <div style={{color:"#444",fontSize:11,marginTop:4,fontStyle:"italic"}}>"{sessionLedger[0].notes}"</div>}
              </div>
            )}

            {latestWeight && PRs.some(l=>l.curMax>0) && (
              <div style={{...card}}>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,color:"#888",marginBottom:8,letterSpacing:1}}>STRENGTH / BW RATIO</div>
                {PRs.filter(l=>l.curMax>0).map(l=>(
                  <div key={l.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid var(--border)"}}>
                    <span style={{color:l.color,fontSize:12}}>{l.name}</span>
                    <span style={{color:"var(--text-secondary)",fontSize:12}}>{(l.curMax/latestWeight).toFixed(2)}× bodyweight</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view==="setup" && (
          <div style={{padding:16}}>
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,letterSpacing:2,color:"#888",marginBottom:14}}>{hasSetup?"MY PROGRAM":"PROGRAM SETUP"}</div>

            {hasSetup && (
              <>
                <div style={{...card,borderLeft:"3px solid #06d6a0"}}>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,color:"#06d6a0",marginBottom:8}}>PROGRAM ACTIVE</div>
                  <div style={{color:"#555",fontSize:11,marginBottom:4}}>Started: <span style={{color:"var(--text-secondary)"}}>{fmtDate(startDate)}</span></div>
                  {lifts.map(l=>{
                    const on = l.active!==false;
                    return (
                    <div key={l.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--border)",opacity:on?1:0.45}}>
                      <span style={{color:on?l.color:"#666",fontFamily:"'Roboto Condensed',sans-serif",fontSize:15}}>{l.name}{on?"":" · NOT ACTIVE"}</span>
                      <span style={{color:"#555",fontSize:11}}>{on?("Week "+(liftWeeks[l.id]||1)+" · "+l.startingMax+" lbs"):"off"}</span>
                    </div>
                    );
                  })}
                  <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",marginTop:2,opacity:runActive?1:0.45}}>
                    <span style={{color:runActive?"#3a86ff":"#666",fontFamily:"'Roboto Condensed',sans-serif",fontSize:15}}>🏃 Couch to 5K{runActive?"":" · NOT ACTIVE"}</span>
                    <span style={{color:"#555",fontSize:11}}>{runActive && runDays.length>=2 ? (runDays.length+" days/wk · Wk "+runWeek) : "off"}</span>
                  </div>
                </div>
                <div style={{marginTop:14}}>
                  <button onClick={()=>setEditingProgram(v=>!v)} style={{width:"100%",background:"var(--bg-input)",border:"1px solid #444",color:"var(--text-secondary)",borderRadius:10,padding:"12px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,letterSpacing:1,cursor:"pointer"}}>{editingProgram ? "✕ CLOSE EDITOR" : "✎ EDIT PROGRAM"}</button>
                </div>
                {editingProgram && (
                  <div style={{...card,marginTop:10,borderLeft:"3px solid #888"}}>
                    <div style={{color:"#888",fontSize:11,marginBottom:12,lineHeight:1.5}}>Turn a lift or running off to drop it from your schedule. Nothing is deleted — logged history stays in your Ledger and Progress, and you can switch it back on anytime. Editing a starting max recomputes every week from the new number; your logged sessions in the Ledger stay as recorded.</div>
                    {lifts.map(l=>{
                      const on = l.active!==false;
                      return (
                        <div key={l.id} style={{background:"var(--bg-card)",borderRadius:10,padding:12,marginBottom:10,opacity:on?1:0.55,borderLeft:"3px solid "+(on?l.color:"#333")}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                            <span style={{color:on?l.color:"#666",fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,letterSpacing:1}}>{l.name}{on?"":" · NOT ACTIVE"}</span>
                            <button onClick={()=>updateLift(l.id,"active",!on)} style={{background:on?"var(--bg-input)":"#06d6a0",border:"1px solid "+(on?"#555":"#06d6a0"),color:on?"#888":"#000",borderRadius:6,padding:"5px 12px",fontSize:12,fontFamily:"'Roboto Condensed',sans-serif",letterSpacing:1,cursor:"pointer"}}>{on?"TURN OFF":"TURN ON"}</button>
                          </div>
                          <div style={{color:"#555",fontSize:10,marginBottom:6}}>TRAINING DAYS</div>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>{
                              const sel=(l.trainingDays||[]).includes(d);
                              return <button key={d} disabled={!on} onClick={()=>{const cur=l.trainingDays||[];const next=sel?cur.filter(x=>x!==d):[...cur,d];if(next.length===0)return;updateLift(l.id,"trainingDays",next);}} style={{background:sel?l.color:"var(--bg-sunken)",color:sel?"#000":"#555",border:"1px solid "+(sel?l.color:"#333"),borderRadius:4,padding:"4px 9px",fontSize:11,cursor:on?"pointer":"not-allowed",opacity:on?1:0.6}}>{d}</button>;
                            })}
                          </div>
                          {on && (l.trainingDays||[]).length===1 && <div style={{color:"#555",fontSize:9,marginTop:5}}>An active lift needs at least one day — turn it off instead to remove it.</div>}
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10,paddingTop:10,borderTop:"1px solid var(--border)"}}>
                            <span style={{color:"#555",fontSize:10,letterSpacing:1}}>CURRENT WEEK</span>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <button onClick={()=>{const target=Math.max(1,(liftWeeks[l.id]||1)-1);setLiftWeeks(prev=>({...prev,[l.id]:target}));setCompletedDays(prev=>{const n=JSON.parse(JSON.stringify(prev));Object.keys(n).forEach(w=>{if(+w>=target&&n[w])delete n[w][l.id];});return n;});}} style={{background:"var(--bg-sunken)",border:"1px solid #555",color:"var(--text-secondary)",borderRadius:5,width:30,height:30,fontSize:18,cursor:"pointer",lineHeight:1}}>−</button>
                              <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,color:l.color,minWidth:22,textAlign:"center"}}>{liftWeeks[l.id]||1}</span>
                              <button onClick={()=>setLiftWeeks(prev=>({...prev,[l.id]:Math.min(12,(prev[l.id]||1)+1)}))} style={{background:"var(--bg-sunken)",border:"1px solid #555",color:"var(--text-secondary)",borderRadius:5,width:30,height:30,fontSize:18,cursor:"pointer",lineHeight:1}}>+</button>
                            </div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10,paddingTop:10,borderTop:"1px solid var(--border)"}}>
                            <div>
                              <span style={{color:"#555",fontSize:10,letterSpacing:1}}>STARTING MAX</span>
                              <div style={{color:"#555",fontSize:9,marginTop:2}}>Fixes a wrong number — all weeks recompute from it</div>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <input type="number" inputMode="numeric" defaultValue={l.startingMax||""} key={l.id+"-sm-"+(l.startingMax||0)} onFocus={e=>e.target.select()} onBlur={e=>{const v=Math.max(5,Math.round((+e.target.value||l.startingMax||0)/5)*5);updateLift(l.id,"startingMax",v);}} style={{width:72,fontSize:18,fontFamily:"'Roboto Condensed',sans-serif",background:"var(--bg-sunken)",border:"1px solid "+l.color,color:l.color,textAlign:"center",borderRadius:6,padding:"6px 4px",outline:"none"}} />
                              <span style={{color:"#555",fontSize:12}}>lbs</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{background:"var(--bg-card)",borderRadius:10,padding:12,opacity:runActive?1:0.55,borderLeft:"3px solid "+(runActive?"#3a86ff":"#333")}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <span style={{color:runActive?"#3a86ff":"#666",fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,letterSpacing:1}}>🏃 COUCH TO 5K{runActive?"":" · NOT ACTIVE"}</span>
                        <button onClick={()=>setBodyStats(prev=>({...prev,runActive:!runActive}))} style={{background:runActive?"var(--bg-input)":"#06d6a0",border:"1px solid "+(runActive?"#555":"#06d6a0"),color:runActive?"#888":"#000",borderRadius:6,padding:"5px 12px",fontSize:12,fontFamily:"'Roboto Condensed',sans-serif",letterSpacing:1,cursor:"pointer"}}>{runActive?"TURN OFF":"TURN ON"}</button>
                      </div>
                      <div style={{color:"#555",fontSize:10,marginBottom:6}}>RUNNING DAYS (pick 2–3)</div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>{
                          const sel=runDays.includes(d);
                          return <button key={d} disabled={!runActive} onClick={()=>setRunDays(prev=>prev.includes(d)?prev.filter(x=>x!==d):prev.length<3?[...prev,d]:prev)} style={{background:sel?"var(--bg-input)":"var(--bg-sunken)",color:sel?"#3a86ff":"#555",border:"1px solid "+(sel?"#3a86ff":"#333"),borderRadius:4,padding:"4px 9px",fontSize:11,cursor:runActive?"pointer":"not-allowed",opacity:runActive?1:0.6}}>{d}</button>;
                        })}
                      </div>
                      {runActive && runDays.length<2 && <div style={{color:"#e85d04",fontSize:9,marginTop:5}}>Pick at least 2 days or turn running off.</div>}
                    </div>
                  </div>
                )}
                <div style={{marginTop:20}}>
                  {!confirmStart && (
                  <button onClick={()=>{setSetupSnapshot({lifts:[...lifts],startDate});setConfirmStart(true);}} className="bigbtn" style={{background:"none",border:"1px solid #e85d04",color:"#e85d04"}}>START NEW 12-WEEK PROGRAM</button>
                )}
                {confirmStart && (
                  <div style={{background:"var(--bg-card)",borderRadius:10,padding:16,marginTop:8,borderLeft:"3px solid #e85d04"}}>
                    <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,color:"#e85d04",marginBottom:6,letterSpacing:1}}>⚠️ START NEW PROGRAM?</div>
                    <div style={{color:"var(--text-secondary)",fontSize:12,marginBottom:14}}>Your current program will be archived. All workout history, progress and custom exercises will be saved. Enter your new starting maxes before confirming.</div>
                    <div style={{display:"flex",gap:8}}>
                      <button className="bigbtn" onClick={()=>{startNewProgram();setConfirmStart(false);}} style={{background:"#e85d04",color:"#000",flex:2,marginBottom:0}}>CONFIRM →</button>
                      <button className="bigbtn" onClick={()=>setConfirmStart(false)} style={{background:"none",border:"1px solid #555",color:"#555",flex:1,marginBottom:0}}>BACK</button>
                    </div>
                  </div>
                )}
                </div>
              </>
            )}

            {!hasSetup && dataLoaded && (
              <>
                <div style={{...card,borderLeft:"3px solid #fff"}}>
                  <div style={{marginBottom:14}}>
                    <div style={{color:"#555",fontSize:10,marginBottom:6,letterSpacing:1}}>PROGRAM NAME <span style={{color:"#333"}}>(optional)</span></div>
                    <input type="text" value={programName} onChange={e=>setProgramName(e.target.value)} placeholder="e.g. Bulk 2026, Cut Season..."
                      style={{width:"100%",background:"var(--bg-input)",border:"1px solid #333",color:"var(--text-primary)",borderRadius:8,padding:"10px 12px",fontFamily:"'Roboto',sans-serif",fontSize:14,outline:"none"}} />
                  </div>
                  <div style={{color:"#555",fontSize:10,marginBottom:6}}>PROGRAM START DATE</div>
                  <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{background:"var(--bg-input)",border:"1px solid #333",color:"var(--text-primary)",fontSize:14,outline:"none",width:"100%",borderRadius:6,padding:"8px 10px"}} />
                </div>
                <div style={{...card,borderLeft:"3px solid #06d6a0"}}>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,color:"#06d6a0",marginBottom:10,letterSpacing:1}}>BODY STATS</div>
                  <div style={{display:"flex",gap:12,alignItems:"flex-end",flexWrap:"wrap"}}>
                    <div>
                      <div style={{color:"#555",fontSize:10,marginBottom:4}}>HEIGHT</div>
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        <input type="number" value={heightFtEntry} placeholder="ft" style={{width:44}} onChange={e=>setHeightFtEntry(e.target.value)} />
                        <span style={{color:"#555",fontSize:11}}>ft</span>
                        <input type="number" value={heightInEntry} placeholder="in" style={{width:44}} onChange={e=>setHeightInEntry(e.target.value)} />
                        <span style={{color:"#555",fontSize:11}}>in</span>
                      </div>
                    </div>
                    <div>
                      <div style={{color:"#555",fontSize:10,marginBottom:4}}>STARTING WEIGHT (lbs)</div>
                      <input type="number" value={weightEntry} placeholder="lbs" step="0.1" onChange={e=>setWeightEntry(e.target.value)} style={{width:80,color:"#06d6a0"}} />
                    </div>

                  </div>
                  {bodyStats.heightIn && latestWeight && (
                    <div style={{marginTop:10,color:"#555",fontSize:11}}>
                      Height: <span style={{color:"var(--text-secondary)"}}>{Math.floor(+bodyStats.heightIn/12)}′{+bodyStats.heightIn%12}″</span>
                      {"  ·  "}Weight: <span style={{color:"#06d6a0"}}>{latestWeight} lbs</span>
                      {bmi && <>{" · "}BMI: <span style={{color:bmiCol(bmi)}}>{bmi} ({bmiCat(bmi)})</span></>}
                    </div>
                  )}
                </div>

                {/* Running days picker */}
                <div style={{...card,marginBottom:14}}>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,color:"#3a86ff",marginBottom:4,letterSpacing:1}}>🏃 COUCH TO 5K</div>
                  <div style={{color:"#555",fontSize:11,marginBottom:10}}>Pick your running days (min 2, max 3). Choose days not used for lifting.</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                    {DAY_ABBR.slice(1).concat(["Sun"]).map(d=>(
                      <button key={d} onClick={()=>setRunDays(prev=>prev.includes(d)?prev.filter(x=>x!==d):prev.length<3?[...prev,d]:prev)}
                        style={{background:runDays.includes(d)?"var(--bg-input)":"var(--bg-sunken)",border:"1px solid "+(runDays.includes(d)?"#3a86ff":"#333"),color:runDays.includes(d)?"#3a86ff":"#444",borderRadius:4,padding:"6px 10px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,cursor:"pointer"}}>
                        {d}
                      </button>
                    ))}
                  </div>
                  {runDays.length > 0 && <div style={{color:"#3a86ff",fontSize:10}}>{runDays.length} day{runDays.length>1?"s":""}/week · {runDays.length >= 2 ? "✓ Ready" : "Need 1 more day"}</div>}
                  {runDays.length === 0 && <div style={{color:"#333",fontSize:10}}>Optional — skip if not running</div>}
                </div>

                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,letterSpacing:1}}>YOUR LIFTS</div>
                  <button onClick={addLift} className="bn" style={{background:"var(--bg-input)",border:"1px solid #555",color:"var(--text-secondary)",fontSize:13,padding:"4px 10px"}}>+ ADD LIFT</button>
                </div>
            {lifts.map(l=>{
              const isAssistL=l.mainLiftOption==="Assisted Pull Up";
              const bwSetup=latestBodyweight();
              const cur=l.startingMax?(isAssistL?l.startingMax:calcCurrentMax(l.startingMax)):null;
              const effWMSetup=(isAssistL&&bwSetup!=null)?calcCurrentMax(Math.max(0,bwSetup-(l.startingMax||0))):null;
              const wkts=cur?(isAssistL?(effWMSetup!=null?calcWorkingWeights(effWMSetup).map(w=>Math.max(0,Math.round((bwSetup-w)/5)*5)):null):calcWorkingWeights(cur)):null;
              return (
                <div key={l.id} style={{...card,borderLeft:"3px solid "+l.color}}>
                  <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
                    <div style={{flex:1}}>
                      <select value={l.mainLiftOption||"Bench"} onChange={e=>{const v=e.target.value;updateLift(l.id,"mainLiftOption",v);if(v==="Custom")updateLift(l.id,"name","");else updateLift(l.id,"name",v);}} style={{width:"100%",background:"transparent",border:"none",borderBottom:"1px solid "+l.color+"66",color:l.color,fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,letterSpacing:1,padding:"2px 0",cursor:"pointer",marginBottom:6}}>
                        {MAIN_LIFT_OPTIONS.map(o=><option key={o} value={o} style={{background:"var(--bg-input)",fontFamily:"sans-serif",fontSize:14}}>{o}</option>)}
                      </select>
                      {l.mainLiftOption==="Custom" && <input type="text" value={l.name} placeholder="Type lift name..." onChange={e=>updateLift(l.id,"name",e.target.value)} style={{width:"100%",background:"transparent",border:"none",borderBottom:"1px solid "+l.color+"44",color:l.color,fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,padding:"2px 0",outline:"none",marginBottom:6}} />}
                      <div style={{display:"flex",gap:6}}>
                        {["UPPER","LOWER"].map(t=><button key={t} onClick={()=>updateLift(l.id,"isLower",t==="LOWER")} style={{background:(t==="LOWER")===l.isLower?l.color:"var(--bg-sunken)",color:(t==="LOWER")===l.isLower?"#000":"#555",border:"1px solid "+((t==="LOWER")===l.isLower?l.color:"#333"),borderRadius:3,padding:"2px 8px",fontSize:10,cursor:"pointer"}}>{t}</button>)}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <input type="number" value={l.startingMax||""} placeholder="0" style={{width:80,fontSize:18,fontFamily:"'Roboto Condensed',sans-serif",borderColor:l.color,color:l.color,textAlign:"center"}} onFocus={e=>{e.target.select();}} onChange={e=>updateLift(l.id,"startingMax",+e.target.value||0)} />
                      <span style={{color:"#555",fontSize:11}}>{l.mainLiftOption==="Assisted Pull Up"?"lbs assist":"lbs"}</span>
                      {lifts.length>1 && <button onClick={()=>removeLift(l.id)} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:18,padding:"0 4px"}}>×</button>}
                    </div>
                  </div>
                  {isAssistL && <div style={{color:"#555",fontSize:10,marginTop:-4,marginBottom:8}}>Enter the assistance you currently need — the band or machine weight that lets you hit your reps. It drops as you get stronger.</div>}
                  {isAssistL && cur && bwSetup==null && <div style={{color:"#f7b731",fontSize:11,marginBottom:8}}>Log your bodyweight (Body tab) to calculate your assisted loads.</div>}
                  {cur && !(isAssistL&&bwSetup==null) && <div style={{color:"#555",fontSize:11,marginBottom:8}}>{isAssistL?"Top set: ":"Training at: "}<span style={{color:l.color}}>{wkts?wkts[3]:cur} lbs{isAssistL?" assist":""}</span>{"  "}<button onClick={()=>setPreviewLift(previewLift===l.id?null:l.id)} style={{background:"none",border:"1px solid "+l.color,color:l.color,borderRadius:3,padding:"1px 7px",fontSize:10,cursor:"pointer"}}>{previewLift===l.id?"hide":"preview"}</button></div>}
                  {previewLift===l.id && wkts && (
                    <div style={{background:"var(--bg-secondary)",borderRadius:6,padding:"10px 12px",marginBottom:10}}>
                      {wkts.map((w,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"1px solid var(--border)",fontSize:12}}><span style={{color:"#555"}}>Set {i+1}</span><span style={{color:l.color}}>{w} lbs{isAssistL?" assist":""}</span><span style={{color:"#444"}}>{i<3?"× 10":"max reps"}</span></div>)}
                    </div>
                  )}
                  <div style={{color:"#555",fontSize:10,marginBottom:5}}>TRAINING DAYS</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>{const sel=(l.trainingDays||[]).includes(d);return <button key={d} onClick={()=>updateLift(l.id,"trainingDays",sel?l.trainingDays.filter(x=>x!==d):[...(l.trainingDays||[]),d])} style={{background:sel?l.color:"var(--bg-sunken)",color:sel?"#000":"#555",border:"1px solid "+(sel?l.color:"#333"),borderRadius:4,padding:"3px 8px",fontSize:11,cursor:"pointer",transition:"all 0.15s"}}>{d}</button>;})}
                  </div>
                </div>
              );
            })}
            {"Notification" in window && Notification.permission!=="granted" && (
              <div style={{...card,borderLeft:"3px solid #f7b731",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div><div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:14,color:"#f7b731"}}>TRAINING REMINDERS</div><div style={{color:"#555",fontSize:11}}>Get hyped on your training days</div></div>
                <button onClick={()=>Notification.requestPermission()} className="bn" style={{background:"#f7b731",color:"#000",fontSize:13,padding:"5px 12px"}}>ENABLE</button>
              </div>
            )}
                {/* Show checklist of what's still needed */}
                {!readyToStart && !hasSetup && startDate && (
                  <div style={{...card,borderLeft:"3px solid #555",marginTop:8}}>
                    <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,color:"#555",marginBottom:8,letterSpacing:1}}>COMPLETE TO START:</div>
                    {lifts.some(l=>!l.startingMax) && <div style={{color:"#555",fontSize:11,marginBottom:4}}>⬜ Enter starting max for all lifts</div>}
                    {lifts.some(l=>!(l.trainingDays||[]).length) && <div style={{color:"#555",fontSize:11,marginBottom:4}}>⬜ Select training days for all lifts</div>}
                    {!heightFtEntry && !bodyStats.heightIn && <div style={{color:"#555",fontSize:11,marginBottom:4}}>⬜ Enter your height</div>}
                    {!weightEntry && <div style={{color:"#555",fontSize:11,marginBottom:4}}>⬜ Enter your starting weight</div>}
                  </div>
                )}
                {/* Cancel button — only show if we came from an active program */}
                {hasSetup === false && setupSnapshot && (
                  <button onClick={()=>{
                    setLifts(setupSnapshot.lifts);
                    setStartDate(setupSnapshot.startDate);
                    setSetupSnapshot(null);
                    setConfirmStart(false);
                    setView("setup");
                  }} className="bigbtn" style={{background:"none",border:"1px solid #555",color:"#555",marginBottom:8}}>← CANCEL & RESTORE</button>
                )}
                {readyToStart && !hasSetup && (
                  <>
                    {!confirmStart && (
                      <div style={{...card,borderLeft:"3px solid #06d6a0",marginTop:8}}>
                        <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,color:"#06d6a0",marginBottom:4,letterSpacing:1}}>✅ READY TO GO</div>
                        <div style={{color:"#555",fontSize:11,marginBottom:12}}>All lifts configured. Review your maxes above then confirm to lock them in.</div>
                        {lifts.map(l=>(
                          <div key={l.id} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--border)",fontSize:12}}>
                            <span style={{color:l.color,fontFamily:"'Roboto Condensed',sans-serif"}}>{l.name}</span>
                            <span style={{color:"var(--text-secondary)"}}>{calcCurrentMax(l.startingMax)} lbs training max</span>
                          </div>
                        ))}
                        <button className="bigbtn" onClick={()=>setConfirmStart(true)} style={{background:"#06d6a0",color:"#000",marginTop:14,marginBottom:0}}>CONFIRM & START PROGRAM →</button>
                      </div>
                    )}
                    {confirmStart && (
                      <div style={{background:"var(--bg-card)",borderRadius:10,padding:16,marginTop:8,borderLeft:"3px solid #06d6a0"}}>
                        <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,color:"#06d6a0",marginBottom:6,letterSpacing:1}}>LAST CHANCE!</div>
                        <div style={{color:"var(--text-secondary)",fontSize:12,marginBottom:14}}>
                          Starting {fmtDate(startDate)} with {lifts.length} lift{lifts.length>1?"s":""}. Your maxes are locked in once you start — you cannot change them mid-program.
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <button className="bigbtn" onClick={()=>{
  // Save height and weight together when starting
  const totalIn = (+heightFtEntry||0)*12+(+heightInEntry||0);
  const newStats = {...bodyStats};
  if(totalIn>0) newStats.heightIn = String(totalIn);
  if(weightEntry) {
    const newEntry = {date:todayISO(), weightLbs:+weightEntry};
    newStats.entries = [newEntry,...(newStats.entries||[]).filter(e=>e.date!==todayISO())];
  }
  setBodyStats(newStats);
  setHeightFtEntry(""); setHeightInEntry(""); setWeightEntry("");
  setProgramStarted(true);
  setProgramId(uid + "_" + Date.now());
  setActiveId(lifts[0].id);
  setViewingWeek(liftWeeks[lifts[0].id]||1);
  setView("workout");
  setConfirmStart(false);
}} style={{background:"#06d6a0",color:"#000",flex:2,marginBottom:0}}>LET'S GO →</button>
                          <button className="bigbtn" onClick={()=>setConfirmStart(false)} style={{background:"none",border:"1px solid #555",color:"#555",flex:1,marginBottom:0}}>BACK</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            {programHistory.length>0 && (
              <div style={{marginTop:20}}>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,color:"#555",letterSpacing:1,marginBottom:10}}>PROGRAM HISTORY</div>
                {programHistory.map((p,i)=>(
                  <div key={i} style={{...card,borderLeft:"3px solid #333"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,color:"#555"}}>PROGRAM {programHistory.length-i} · {fmtDate(p.startDate)} → {fmtDate(p.endDate)}</div>
                      <button onClick={async()=>{if(window.confirm("Delete this program from history?")){{await deleteProgramFromHistory(p.id);const ph=await loadProgramHistory(uid);setProgramHistory(ph);}}}} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:16,padding:"0 4px"}}>×</button>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <div style={{display:"flex",gap:16,fontSize:11,color:"#555"}}>
                        {p.sessionsCompleted !== undefined && <span>{p.sessionsCompleted} of {p.totalPossible || "?"} sessions</span>}
                        {p.bestStreak > 0 && <span>🔥 {p.bestStreak} day best streak</span>}
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>setConfirmContinue(p)} style={{background:"var(--bg-input)",border:"1px solid #06d6a0",color:"#06d6a0",borderRadius:6,padding:"4px 10px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:12,cursor:"pointer",letterSpacing:1}}>CONTINUE</button>
                        <button onClick={()=>setShareCard(p)} style={{background:"var(--bg-input)",border:"1px solid #555",color:"var(--text-secondary)",borderRadius:6,padding:"4px 10px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:12,cursor:"pointer",letterSpacing:1}}>SHARE</button>
                      </div>
                    </div>
                    {(p.lifts||[]).map(l=>{const sm=l.startingMax||0;const fm=p.finalMaxes?.[l.id]||0;return(<div key={l.id} style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#555",padding:"2px 0"}}><span style={{color:l.color}}>{l.name}</span><span>{sm} → {fm} lbs{fm>sm?<span style={{color:"#06d6a0"}}> (+{fm-sm})</span>:""}</span></div>);})}
                    {(p.runHistory||[]).length > 0 && (
                      <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid var(--border)"}}>
                        <div style={{display:"flex",gap:16,fontSize:11,color:"#555"}}>
                          <span>🏃 {(p.runHistory||[]).length} runs</span>
                          <span>{((p.runHistory||[]).reduce((s,r)=>s+(r.dist||0),0)).toFixed(1)} mi total</span>
                          {(()=>{const best=(p.runHistory||[]).filter(r=>r.pace).sort((a,b)=>a.pace.localeCompare(b.pace))[0];return best?<span>Best: {best.pace}/mi</span>:null;})()}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view==="workout" && workoutInProgress && (
          <div style={{background:"var(--bg-card)",padding:"8px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid var(--border)"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:workoutPausedAt?"#f7b731":"#06d6a0",animation:workoutPausedAt?"none":"pulse 1s infinite"}}></div>
              <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,color:workoutPausedAt?"#f7b731":"#06d6a0",letterSpacing:1}}>{workoutPausedAt?"PAUSED":"WORKOUT IN PROGRESS"}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,color:workoutPausedAt?"#f7b731":"var(--text-primary)",letterSpacing:1}}>{fmtDuration(workoutElapsed)}</div>
              <button onClick={()=>workoutPausedAt?resumeWorkout():pauseWorkout()} style={{background:workoutPausedAt?"#06d6a0":"var(--bg-input)",border:"1px solid "+(workoutPausedAt?"#06d6a0":"#555"),color:workoutPausedAt?"#000":"var(--text-secondary)",borderRadius:6,padding:"6px 14px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,letterSpacing:1,cursor:"pointer"}}>{workoutPausedAt?"RESUME":"PAUSE"}</button>
            </div>
          </div>
        )}
        {view==="workout" && !workoutInProgress && !reviewingCompletedWorkout && (()=>{
          const todayAbbr = DAY_ABBR[new Date().getDay()];
          const scheduledToday = lifts.some(l=>l.active!==false && (l.trainingDays||[]).includes(todayAbbr));
          if(!scheduledToday) return false;
          return isLiftDoneToday(activeId);
        })() && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
            <div style={{background:"var(--bg-card)",borderRadius:16,padding:28,width:"100%",maxWidth:340,textAlign:"center",borderTop:"4px solid #06d6a0"}}>
              <div style={{fontSize:40,marginBottom:8}}>✅</div>
              <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:26,color:"#06d6a0",letterSpacing:2,marginBottom:4}}>{lift?.name?.toUpperCase()}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#555",marginBottom:20,letterSpacing:1}}>TODAY'S WORKOUT COMPLETE</div>
              <button onClick={()=>{setView("dashboard");setReviewingCompletedWorkout(false);}} style={{width:"100%",background:"#06d6a0",border:"none",color:"#000",borderRadius:10,padding:"14px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,letterSpacing:2,cursor:"pointer",marginBottom:10}}>HOME</button>
              <button onClick={()=>{setReviewingCompletedWorkout(true);setViewingWeek((liftWeeks[activeId]||1)-1||1);}} style={{width:"100%",background:"var(--bg-input)",border:"1px solid #333",color:"var(--text-secondary)",borderRadius:10,padding:"12px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,letterSpacing:1,cursor:"pointer",marginBottom:8}}>REVIEW WORKOUT</button>
              <button onClick={()=>{setReviewingCompletedWorkout(true);setEditingPastWeek(true);setViewingWeek((liftWeeks[activeId]||1)-1||1);}} style={{width:"100%",background:"none",border:"1px solid #333",color:"#555",borderRadius:10,padding:"10px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:14,cursor:"pointer"}}>EDIT WORKOUT</button>
            </div>
          </div>
        )}
        {view==="workout" && !workoutInProgress && (()=>{
          const ta = DAY_ABBR[new Date().getDay()];
          const sched = lifts.some(l=>l.active!==false && (l.trainingDays||[]).includes(ta));
          if(!sched) return true;
          return !isLiftDoneToday(activeId);
        })() && (()=>{
          const todayAbbr = DAY_ABBR[new Date().getDay()];
          const scheduledLifts = lifts.filter(l=>l.active!==false && (l.trainingDays||[]).includes(todayAbbr));
          const isScheduledToday = scheduledLifts.length > 0;
          const pumpUps = ["Time to get after it! 💪","No excuses. Just reps. 🔥","Your future self will thank you.","Champions train. Everyone else wishes. 🏆","Make today count. 💯","Pain is temporary. PRs are forever. 🎯","You didn't come this far to only come this far.","Beast mode: ON. 🦁"];
          const pumpMsg = pumpUps[new Date().getDay() % pumpUps.length];
          // Find next scheduled lift
          const nextLift = !isScheduledToday ? (()=>{
            for(let i=1; i<=7; i++){
              const nextDay = DAY_ABBR[(new Date().getDay()+i)%7];
              const found = lifts.find(l=>l.active!==false && (l.trainingDays||[]).includes(nextDay));
              if(found) return {lift:found, day:nextDay, daysAway:i};
            }
            return null;
          })() : null;
          return (
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
              {isScheduledToday ? (
                <div style={{background:"var(--bg-card)",borderRadius:16,padding:28,width:"100%",maxWidth:340,textAlign:"center",borderTop:"4px solid "+(lift?.color||"#e85d04")}}>
                  <div style={{fontSize:40,marginBottom:8}}>🏋️</div>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:28,color:lift?.color||"#e85d04",letterSpacing:2,marginBottom:4}}>{lift?.name?.toUpperCase()}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#555",marginBottom:12}}>WEEK {liftWeeks[activeId]||1}</div>
                  <div style={{color:"var(--text-secondary)",fontSize:13,marginBottom:24,fontStyle:"italic"}}>"{pumpMsg}"</div>
                  <button onClick={startWorkout} style={{width:"100%",background:lift?.color||"#e85d04",border:"none",color:"#000",borderRadius:10,padding:"16px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:24,letterSpacing:2,cursor:"pointer",marginBottom:10}}>START WORKOUT</button>
                  <button onClick={()=>setView("dashboard")} style={{width:"100%",background:"none",border:"1px solid #333",color:"#555",borderRadius:10,padding:"10px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,cursor:"pointer"}}>BACK</button>
                </div>
              ) : (
                <div style={{background:"var(--bg-card)",borderRadius:16,padding:28,width:"100%",maxWidth:340,textAlign:"center",borderTop:"4px solid #333"}}>
                  <div style={{fontSize:40,marginBottom:8}}>😴</div>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:24,color:"#555",letterSpacing:2,marginBottom:8}}>REST DAY</div>
                  <div style={{color:"#888",fontSize:14,marginBottom:20}}>Enjoy the rest. Recovery is part of the program.</div>
                  {nextLift && (
                    <div style={{background:"var(--bg-sunken)",borderRadius:10,padding:"14px",marginBottom:20}}>
                      <div style={{color:"#555",fontSize:10,marginBottom:6,letterSpacing:1}}>NEXT WORKOUT</div>
                      <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,color:nextLift.lift.color,letterSpacing:1,marginBottom:2}}>{nextLift.lift.name.toUpperCase()} · {({Mon:"Monday",Tue:"Tuesday",Wed:"Wednesday",Thu:"Thursday",Fri:"Friday",Sat:"Saturday",Sun:"Sunday"})[nextLift.day]}</div>
                      <div style={{color:"#555",fontSize:11}}>{nextLift.daysAway === 1 ? "Tomorrow" : "In "+nextLift.daysAway+" days"} · Week {liftWeeks[nextLift.lift.id]||1}</div>
                    </div>
                  )}
                  <button onClick={startWorkout} style={{width:"100%",background:"var(--bg-input)",border:"1px solid #555",color:"#555",borderRadius:10,padding:"12px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,letterSpacing:1,cursor:"pointer",marginBottom:10}}>LIFT ANYWAY</button>
                  <button onClick={()=>setView("dashboard")} style={{width:"100%",background:"none",border:"1px solid #333",color:"#444",borderRadius:10,padding:"10px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,cursor:"pointer"}}>BACK</button>
                </div>
              )}
            </div>
          );
        })()}
        {view==="workout" && (
          <>
            <div style={{padding:"8px 16px",display:"flex",gap:8,borderBottom:"1px solid var(--border)",flexWrap:"wrap"}}>
              {lifts.map(l=>(
                <div key={l.id} style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,color:activeId===l.id?l.color:"#333",letterSpacing:1}}>{l.name}</span>
                  <span style={{background:activeId===l.id?l.color:"var(--bg-input)",color:activeId===l.id?"#000":"#444",borderRadius:3,padding:"1px 5px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:11}}>W{liftWeeks[l.id]||1}</span>
                </div>
              ))}
            </div>
            <div style={{padding:"10px 16px",display:"flex",gap:6,flexWrap:"wrap",borderBottom:"1px solid var(--border)"}}>
              {lifts.map(l=>{const done=completedDays?.[liftWeeks[l.id]]?.[l.id];return <button key={l.id} className="bn" onClick={()=>switchLift(l.id)} style={{background:activeId===l.id?l.color:"var(--bg-input)",color:activeId===l.id?"#000":l.color,border:"1px solid "+l.color,opacity:done&&activeId!==l.id?0.5:1}}>{l.name}{done?" ✓":""}</button>;})}
            </div>
            <div style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid var(--border)"}}>
              <button onClick={()=>navigateWeek(-1)} disabled={viewingWeek<=1} style={{background:"var(--bg-input)",border:"1px solid #333",color:viewingWeek<=1?"#333":"var(--text-secondary)",borderRadius:4,width:32,height:32,cursor:viewingWeek<=1?"default":"pointer",fontSize:18}}>‹</button>
              <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,color:lift.color,minWidth:80,textAlign:"center"}}>
                WEEK {viewingWeek}{isPastWeek&&<div style={{color:"#555",fontSize:10,fontFamily:"'DM Mono',monospace"}}>current: w{activeLiftWeek}</div>}
              </div>
              <button onClick={()=>navigateWeek(1)} disabled={viewingWeek>=activeLiftWeek} style={{background:"var(--bg-input)",border:"1px solid #333",color:viewingWeek>=activeLiftWeek?"#333":"var(--text-secondary)",borderRadius:4,width:32,height:32,cursor:viewingWeek>=activeLiftWeek?"default":"pointer",fontSize:18}}>›</button>
              {isPastWeek && (
                <>
                  <button onClick={()=>{setViewingWeek(activeLiftWeek);setEditingPastWeek(false);}} style={{background:"none",border:"1px solid "+lift.color,color:lift.color,borderRadius:4,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>current</button>
                  <button onClick={()=>setEditingPastWeek(e=>!e)} style={{background:editingPastWeek?"#2e1a1a":"var(--bg-input)",border:"1px solid "+(editingPastWeek?"#e85d04":"#555"),color:editingPastWeek?"#e85d04":"var(--text-secondary)",borderRadius:4,padding:"4px 10px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,cursor:"pointer"}}>{editingPastWeek?"CANCEL":"EDIT"}</button>
                </>
              )}
            </div>
            <div style={{padding:16}}>
              <div style={{display:"flex",gap:10,marginBottom:14}}>
                {[
                {l: isAssisted ? "ASSISTANCE" : "CURRENT MAX", v: isAssisted ? `${effMax} lbs` : effMax, c: lift.color},
                {l: isAssisted ? "EFFECTIVE PULL" : "EST MAX", v: isAssisted ? (latestWeight ? `${latestWeight - effMax} lbs` : "—") : (sessionEstMax||"—"), c: isAssisted ? (latestWeight?"#06d6a0":"#333") : (sessionEstMax?"#06d6a0":"#333")},
                {l:"NEXT WEEK", v: isAssisted ? (nextMax === 0 ? "UNASSISTED!" : `${nextMax} lbs`) : nextMax, c: willProgress ? "#06d6a0" : "#333"}
              ].map(x=>(
                  <div key={x.l} style={{...card,flex:1,borderLeft:"3px solid "+x.c,marginBottom:0}}>
                    <div style={{color:"#555",fontSize:9,marginBottom:2}}>{x.l}</div>
                    <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,color:x.c}}>{x.v} <span style={{fontSize:9,color:"#555"}}>lbs</span></div>
                  </div>
                ))}
              </div>



              <div style={{marginBottom:20}}>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:19,letterSpacing:2,color:lift.color,marginBottom:10}}>{lift.name} — MAIN SETS</div>
                {needsBodyweight && <div style={{background:"var(--bg-card)",border:"1px solid #f7b731",borderRadius:8,padding:"12px 14px",color:"#f7b731",fontSize:12,marginBottom:10}}>Log your bodyweight in the Body tab to calculate your assisted pull-up loads — they're worked out from bodyweight minus assistance.</div>}
                <div className="srow" style={{color:"#555",fontSize:10}}><div>SET</div><div>WEIGHT</div><div>REPS</div></div>
                {weights.map((w,i)=>(
                  <div key={i} className="srow">
                    <div style={{color:"#555"}}>{i+1}</div>
                    <div style={{color:"#ccc"}}>{w} {isAssisted ? 'assist' : 'lbs'}</div>
                    {i<3
                      ? <div style={{color:lift.color,fontSize:12}}>× 10</div>
                      : isReadOnly
                        ? <div style={{color:lift.color,fontSize:13}}>{getReps(week,activeId,i)} reps</div>
                        : <div style={{display:"flex",alignItems:"center",gap:0}}>
                            <button onClick={()=>setReps(week,activeId,i,String(Math.max(1,+(getReps(week,activeId,i)||10)-1)))}
                              style={{background:"var(--bg-card)",border:"2px solid "+lift.color,color:lift.color,borderRadius:"8px 0 0 8px",width:48,height:48,cursor:"pointer",fontSize:24,fontWeight:"bold",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                            <div style={{background:"var(--bg-input)",borderTop:"2px solid "+lift.color,borderBottom:"2px solid "+lift.color,color:lift.color,width:64,height:48,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Roboto Condensed',sans-serif",fontSize:28}}>{getReps(week,activeId,i)}</div>
                            <button onClick={()=>setReps(week,activeId,i,String(+(getReps(week,activeId,i)||10)+1))}
                              style={{background:"var(--bg-card)",border:"2px solid "+lift.color,color:lift.color,borderRadius:"0 8px 8px 0",width:48,height:48,cursor:"pointer",fontSize:24,fontWeight:"bold",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                          </div>
                    }
                  </div>
                ))}
              </div>

              {/* ─── SUPPORT LIFTS ─── */}
              <div style={{marginBottom:8}}>
                <button onClick={()=>setAccSectionOpen(p=>({...p,support:!p.support}))} style={{width:"100%",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:8,padding:"9px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",marginBottom:accSectionOpen.support?6:0}}>
                  <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:14,letterSpacing:2,color:"#888"}}>SUPPORT LIFTS</span>
                  <span style={{color:"#555",fontSize:16,display:"inline-block",transform:accSectionOpen.support?"rotate(90deg)":"none",transition:"transform 0.2s"}}>›</span>
                </button>
                {accSectionOpen.support && (<div>
                  {!isReadOnly && (<div style={{marginBottom:8}}>
                    <div style={{display:"flex",gap:8,marginBottom:selectedAcc[activeId+"_s"]==="__custom__"?8:0}}>
                      <select style={{flex:1}} value={selectedAcc[activeId+"_s"]||""} onChange={e=>setSelectedAcc(p=>({...p,[activeId+"_s"]:e.target.value}))}>
                        <option value="">— Select support lift —</option>
                        {(SUPPORT_LIFTS[lift?.mainLiftOption]||SUPPORT_LIFTS["Custom"]).map(a=><option key={a} value={a}>{a}</option>)}
                        <option value="__custom__">✏️ Custom...</option>
                      </select>
                      {selectedAcc[activeId+"_s"]&&selectedAcc[activeId+"_s"]!=="__custom__"&&<button onClick={()=>{addAcc(week,activeId,selectedAcc[activeId+"_s"],"support");setSelectedAcc(p=>({...p,[activeId+"_s"]:""}));}} className="bn" style={{background:lift.color,color:"#000",fontSize:13,padding:"4px 10px"}}>+ ADD</button>}
                    </div>
                    {selectedAcc[activeId+"_s"]==="__custom__"&&(<div style={{display:"flex",gap:8}}>
                      <input type="text" value={customAccInput[activeId+"_s"]||""} placeholder="Exercise name..." autoFocus onChange={e=>setCustomAccInput(p=>({...p,[activeId+"_s"]:e.target.value}))} style={{flex:1,borderColor:lift.color,color:lift.color}} />
                      <button onClick={()=>{const n=customAccInput[activeId+"_s"]?.trim();if(!n)return;addAcc(week,activeId,n,"support");setCustomAccInput(p=>({...p,[activeId+"_s"]:""}));setSelectedAcc(p=>({...p,[activeId+"_s"]:""}));}} className="bn" style={{background:lift.color,color:"#000",fontSize:13,padding:"4px 10px"}}>+ ADD</button>
                    </div>)}
                  </div>)}
                  {getAccList(week,activeId,"support").length===0&&<div style={{color:"#333",fontSize:12,textAlign:"center",padding:"8px 0"}}>No support lifts added</div>}
                  {getAccList(week,activeId,"support").map(acc=>{
                  const adj=weightAdjust?.[week]?.[activeId]?.[acc.id];
                  return (
                    <div key={acc.id} style={{padding:"10px 0",borderBottom:"1px solid #161616"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <div style={{color:"#ccc",fontSize:12}}>{acc.name}</div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{color:"#555",fontSize:11,fontFamily:"'Roboto Condensed',sans-serif"}}>3 × 10</span>
                          {!isReadOnly&&<button onClick={()=>removeAcc(week,activeId,acc.id)} style={{background:"#2a1a1a",border:"1px solid #e85d04",color:"#e85d04",cursor:"pointer",fontSize:13,padding:"2px 8px",borderRadius:4,fontFamily:"'Roboto Condensed',sans-serif",letterSpacing:1}}>DEL</button>}
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <input type="number" value={acc.weight} placeholder="lbs" readOnly={isReadOnly} onFocus={e=>e.target.select()} style={{color:lift.color,borderColor:lift.color}} onChange={e=>{if(!isReadOnly){updateAcc(week,activeId,acc.id,"weight",e.target.value);if(e.target.value)setExerciseHistory(h=>({...h,[acc.name]:e.target.value}));}}} />
                        <span style={{color:"#555",fontSize:11}}>lbs</span>
                        <input type="number" value={acc.reps} readOnly={isReadOnly} onFocus={e=>e.target.select()} style={{width:56,color:lift.color,borderColor:lift.color}} onChange={e=>!isReadOnly&&updateAcc(week,activeId,acc.id,"reps",e.target.value)} />
                        <span style={{color:"#555",fontSize:11}}>reps</span>
                        {!isReadOnly&&(
                          <div style={{marginLeft:"auto",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                            <div style={{display:"flex",gap:4}}>
                              <button onClick={()=>setAdj(acc.id,"up")} style={{background:adj==="up"?"#06d6a0":"var(--bg-card)",border:"1px solid "+(adj==="up"?"#06d6a0":"#333"),color:adj==="up"?"#000":"#06d6a0",borderRadius:4,width:36,height:36,cursor:"pointer",fontSize:18,fontWeight:"bold",transition:"all 0.15s"}}>+</button>
                              <button onClick={()=>setAdj(acc.id,"same")} style={{background:adj==="same"?"#3a86ff":"var(--bg-card)",border:"1px solid "+(adj==="same"?"#3a86ff":"#333"),color:adj==="same"?"#000":"#3a86ff",borderRadius:4,width:36,height:36,cursor:"pointer",fontSize:18,fontWeight:"bold",transition:"all 0.15s"}}>=</button>
                              <button onClick={()=>setAdj(acc.id,"down")} style={{background:adj==="down"?"#e85d04":"var(--bg-card)",border:"1px solid "+(adj==="down"?"#e85d04":"#333"),color:adj==="down"?"#000":"#e85d04",borderRadius:4,width:36,height:36,cursor:"pointer",fontSize:18,fontWeight:"bold",transition:"all 0.15s"}}>−</button>
                            </div>
                            {adj && acc.weight && (
                              <div style={{fontSize:10,color:"#555"}}>
                                next: <span style={{color:adj==="up"?"#06d6a0":adj==="down"?"#e85d04":"#3a86ff"}}>
                                  {adj==="up"?+acc.weight+5:adj==="down"?Math.max(0,+acc.weight-5):+acc.weight} lbs
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                  })}
                </div>)}
              </div>

              {/* ─── ISOLATION ─── */}
              <div style={{marginBottom:8}}>
                <button onClick={()=>setAccSectionOpen(p=>({...p,isolation:!p.isolation}))} style={{width:"100%",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:8,padding:"9px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",marginBottom:accSectionOpen.isolation?6:0}}>
                  <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:14,letterSpacing:2,color:"#888"}}>ISOLATION</span>
                  <span style={{color:"#555",fontSize:16,display:"inline-block",transform:accSectionOpen.isolation?"rotate(90deg)":"none",transition:"transform 0.2s"}}>›</span>
                </button>
                {accSectionOpen.isolation && (<div>
                  {!isReadOnly && (<div style={{marginBottom:8}}>
                    <div style={{display:"flex",gap:8,marginBottom:selectedAcc[activeId+"_i"]==="__custom__"?8:0}}>
                      <select style={{flex:1}} value={selectedAcc[activeId+"_i"]||""} onChange={e=>setSelectedAcc(p=>({...p,[activeId+"_i"]:e.target.value}))}>
                        <option value="">— Select isolation lift —</option>
                        {(ISOLATION_ORDER[lift?.mainLiftOption]||Object.keys(ISOLATION_LIFTS)).map(g=>(
                          <optgroup key={g} label={(RECOMMENDED_ISOLATION[lift?.mainLiftOption]||[]).includes(g)?"⭐ "+g+" (recommended)":"── "+g+" ──"}>
                            {(ISOLATION_LIFTS[g]||[]).map(a=><option key={a} value={a}>{a}</option>)}
                          </optgroup>
                        ))}
                        <option value="__custom__">✏️ Custom...</option>
                      </select>
                      {selectedAcc[activeId+"_i"]&&selectedAcc[activeId+"_i"]!=="__custom__"&&<button onClick={()=>{addAcc(week,activeId,selectedAcc[activeId+"_i"],"isolation");setSelectedAcc(p=>({...p,[activeId+"_i"]:""}));}} className="bn" style={{background:lift.color,color:"#000",fontSize:13,padding:"4px 10px"}}>+ ADD</button>}
                    </div>
                    {selectedAcc[activeId+"_i"]==="__custom__"&&(<div style={{display:"flex",gap:8}}>
                      <input type="text" value={customAccInput[activeId+"_i"]||""} placeholder="Exercise name..." autoFocus onChange={e=>setCustomAccInput(p=>({...p,[activeId+"_i"]:e.target.value}))} style={{flex:1,borderColor:lift.color,color:lift.color}} />
                      <button onClick={()=>{const n=customAccInput[activeId+"_i"]?.trim();if(!n)return;addAcc(week,activeId,n,"isolation");setCustomAccInput(p=>({...p,[activeId+"_i"]:""}));setSelectedAcc(p=>({...p,[activeId+"_i"]:""}));}} className="bn" style={{background:lift.color,color:"#000",fontSize:13,padding:"4px 10px"}}>+ ADD</button>
                    </div>)}
                  </div>)}
                  {getAccList(week,activeId,"isolation").length===0&&<div style={{color:"#333",fontSize:12,textAlign:"center",padding:"8px 0"}}>No isolation lifts added</div>}
                  {getAccList(week,activeId,"isolation").map(acc=>{
                  const adj=weightAdjust?.[week]?.[activeId]?.[acc.id];
                  return (
                    <div key={acc.id} style={{padding:"10px 0",borderBottom:"1px solid #161616"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <div style={{color:"#ccc",fontSize:12}}>{acc.name}</div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{color:"#555",fontSize:11,fontFamily:"'Roboto Condensed',sans-serif"}}>3 × 10</span>
                          {!isReadOnly&&<button onClick={()=>removeAcc(week,activeId,acc.id)} style={{background:"#2a1a1a",border:"1px solid #e85d04",color:"#e85d04",cursor:"pointer",fontSize:13,padding:"2px 8px",borderRadius:4,fontFamily:"'Roboto Condensed',sans-serif",letterSpacing:1}}>DEL</button>}
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <input type="number" value={acc.weight} placeholder="lbs" readOnly={isReadOnly} onFocus={e=>e.target.select()} style={{color:lift.color,borderColor:lift.color}} onChange={e=>{if(!isReadOnly){updateAcc(week,activeId,acc.id,"weight",e.target.value);if(e.target.value)setExerciseHistory(h=>({...h,[acc.name]:e.target.value}));}}} />
                        <span style={{color:"#555",fontSize:11}}>lbs</span>
                        <input type="number" value={acc.reps} readOnly={isReadOnly} onFocus={e=>e.target.select()} style={{width:56,color:lift.color,borderColor:lift.color}} onChange={e=>!isReadOnly&&updateAcc(week,activeId,acc.id,"reps",e.target.value)} />
                        <span style={{color:"#555",fontSize:11}}>reps</span>
                        {!isReadOnly&&(
                          <div style={{marginLeft:"auto",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                            <div style={{display:"flex",gap:4}}>
                              <button onClick={()=>setAdj(acc.id,"up")} style={{background:adj==="up"?"#06d6a0":"var(--bg-card)",border:"1px solid "+(adj==="up"?"#06d6a0":"#333"),color:adj==="up"?"#000":"#06d6a0",borderRadius:4,width:36,height:36,cursor:"pointer",fontSize:18,fontWeight:"bold",transition:"all 0.15s"}}>+</button>
                              <button onClick={()=>setAdj(acc.id,"same")} style={{background:adj==="same"?"#3a86ff":"var(--bg-card)",border:"1px solid "+(adj==="same"?"#3a86ff":"#333"),color:adj==="same"?"#000":"#3a86ff",borderRadius:4,width:36,height:36,cursor:"pointer",fontSize:18,fontWeight:"bold",transition:"all 0.15s"}}>=</button>
                              <button onClick={()=>setAdj(acc.id,"down")} style={{background:adj==="down"?"#e85d04":"var(--bg-card)",border:"1px solid "+(adj==="down"?"#e85d04":"#333"),color:adj==="down"?"#000":"#e85d04",borderRadius:4,width:36,height:36,cursor:"pointer",fontSize:18,fontWeight:"bold",transition:"all 0.15s"}}>−</button>
                            </div>
                            {adj && acc.weight && (
                              <div style={{fontSize:10,color:"#555"}}>
                                next: <span style={{color:adj==="up"?"#06d6a0":adj==="down"?"#e85d04":"#3a86ff"}}>
                                  {adj==="up"?+acc.weight+5:adj==="down"?Math.max(0,+acc.weight-5):+acc.weight} lbs
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                  })}
                </div>)}
              </div>

              {/* ─── AUX ─── */}
              <div style={{marginBottom:20}}>
                <button onClick={()=>setAccSectionOpen(p=>({...p,aux:!p.aux}))} style={{width:"100%",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:8,padding:"9px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",marginBottom:accSectionOpen.aux?6:0}}>
                  <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:14,letterSpacing:2,color:"#888"}}>AUX</span>
                  <span style={{color:"#555",fontSize:16,display:"inline-block",transform:accSectionOpen.aux?"rotate(90deg)":"none",transition:"transform 0.2s"}}>›</span>
                </button>
                {accSectionOpen.aux && (<div>
                  {!isReadOnly && (<div style={{marginBottom:8}}>
                    <div style={{display:"flex",gap:8,marginBottom:selectedAcc[activeId+"_a"]==="__custom__"?8:0}}>
                      <select style={{flex:1}} value={selectedAcc[activeId+"_a"]||""} onChange={e=>setSelectedAcc(p=>({...p,[activeId+"_a"]:e.target.value}))}>
                        <option value="">— Select aux lift —</option>
                        {Object.entries(AUX_LIFTS).map(([g,ex])=>(<optgroup key={g} label={"── "+g+" ──"}>{ex.map(a=><option key={a} value={a}>{a}</option>)}</optgroup>))}
                        <option value="__custom__">✏️ Custom...</option>
                      </select>
                      {selectedAcc[activeId+"_a"]&&selectedAcc[activeId+"_a"]!=="__custom__"&&<button onClick={()=>{addAcc(week,activeId,selectedAcc[activeId+"_a"],"aux");setSelectedAcc(p=>({...p,[activeId+"_a"]:""}));}} className="bn" style={{background:lift.color,color:"#000",fontSize:13,padding:"4px 10px"}}>+ ADD</button>}
                    </div>
                    {selectedAcc[activeId+"_a"]==="__custom__"&&(<div style={{display:"flex",gap:8}}>
                      <input type="text" value={customAccInput[activeId+"_a"]||""} placeholder="Exercise name..." autoFocus onChange={e=>setCustomAccInput(p=>({...p,[activeId+"_a"]:e.target.value}))} style={{flex:1,borderColor:lift.color,color:lift.color}} />
                      <button onClick={()=>{const n=customAccInput[activeId+"_a"]?.trim();if(!n)return;addAcc(week,activeId,n,"aux");setCustomAccInput(p=>({...p,[activeId+"_a"]:""}));setSelectedAcc(p=>({...p,[activeId+"_a"]:""}));}} className="bn" style={{background:lift.color,color:"#000",fontSize:13,padding:"4px 10px"}}>+ ADD</button>
                    </div>)}
                  </div>)}
                  {getAccList(week,activeId,"aux").length===0&&<div style={{color:"#333",fontSize:12,textAlign:"center",padding:"8px 0"}}>No aux lifts added</div>}
                  {getAccList(week,activeId,"aux").map(acc=>{
                  const adj=weightAdjust?.[week]?.[activeId]?.[acc.id];
                  return (
                    <div key={acc.id} style={{padding:"10px 0",borderBottom:"1px solid #161616"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <div style={{color:"#ccc",fontSize:12}}>{acc.name}</div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{color:"#555",fontSize:11,fontFamily:"'Roboto Condensed',sans-serif"}}>3 × 10</span>
                          {!isReadOnly&&<button onClick={()=>removeAcc(week,activeId,acc.id)} style={{background:"#2a1a1a",border:"1px solid #e85d04",color:"#e85d04",cursor:"pointer",fontSize:13,padding:"2px 8px",borderRadius:4,fontFamily:"'Roboto Condensed',sans-serif",letterSpacing:1}}>DEL</button>}
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <input type="number" value={acc.weight} placeholder="lbs" readOnly={isReadOnly} onFocus={e=>e.target.select()} style={{color:lift.color,borderColor:lift.color}} onChange={e=>{if(!isReadOnly){updateAcc(week,activeId,acc.id,"weight",e.target.value);if(e.target.value)setExerciseHistory(h=>({...h,[acc.name]:e.target.value}));}}} />
                        <span style={{color:"#555",fontSize:11}}>lbs</span>
                        <input type="number" value={acc.reps} readOnly={isReadOnly} onFocus={e=>e.target.select()} style={{width:56,color:lift.color,borderColor:lift.color}} onChange={e=>!isReadOnly&&updateAcc(week,activeId,acc.id,"reps",e.target.value)} />
                        <span style={{color:"#555",fontSize:11}}>reps</span>
                        {!isReadOnly&&(
                          <div style={{marginLeft:"auto",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                            <div style={{display:"flex",gap:4}}>
                              <button onClick={()=>setAdj(acc.id,"up")} style={{background:adj==="up"?"#06d6a0":"var(--bg-card)",border:"1px solid "+(adj==="up"?"#06d6a0":"#333"),color:adj==="up"?"#000":"#06d6a0",borderRadius:4,width:36,height:36,cursor:"pointer",fontSize:18,fontWeight:"bold",transition:"all 0.15s"}}>+</button>
                              <button onClick={()=>setAdj(acc.id,"same")} style={{background:adj==="same"?"#3a86ff":"var(--bg-card)",border:"1px solid "+(adj==="same"?"#3a86ff":"#333"),color:adj==="same"?"#000":"#3a86ff",borderRadius:4,width:36,height:36,cursor:"pointer",fontSize:18,fontWeight:"bold",transition:"all 0.15s"}}>=</button>
                              <button onClick={()=>setAdj(acc.id,"down")} style={{background:adj==="down"?"#e85d04":"var(--bg-card)",border:"1px solid "+(adj==="down"?"#e85d04":"#333"),color:adj==="down"?"#000":"#e85d04",borderRadius:4,width:36,height:36,cursor:"pointer",fontSize:18,fontWeight:"bold",transition:"all 0.15s"}}>−</button>
                            </div>
                            {adj && acc.weight && (
                              <div style={{fontSize:10,color:"#555"}}>
                                next: <span style={{color:adj==="up"?"#06d6a0":adj==="down"?"#e85d04":"#3a86ff"}}>
                                  {adj==="up"?+acc.weight+5:adj==="down"?Math.max(0,+acc.weight-5):+acc.weight} lbs
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                  })}
                </div>)}
              </div>


              {!isReadOnly && (
                <div style={{marginBottom:14}}>
                  <div style={{color:"#555",fontSize:10,marginBottom:6}}>SESSION NOTES</div>
                  <textarea value={sessionNotes} rows={3} placeholder="How did it feel? Any PRs or notes..." onChange={e=>setSessionNotes(e.target.value)} />
                </div>
              )}

              {reviewingCompletedWorkout && !editingPastWeek && (
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:8}}>
                  <div style={{display:"flex",gap:8}}>
                    <button className="bigbtn" onClick={()=>{setReviewingCompletedWorkout(false);setViewingWeek(liftWeeks[activeId]||1);}} style={{flex:1,background:"var(--bg-input)",border:"1px solid #06d6a0",color:"#06d6a0",marginBottom:0}}>← BACK</button>
                    <button className="bigbtn" onClick={()=>{setEditingPastWeek(true);}} style={{flex:1,background:"var(--bg-input)",border:"1px solid #f7b731",color:"#f7b731",marginBottom:0}}>EDIT</button>
                  </div>
                  <button className="bigbtn" onClick={()=>{setReviewingCompletedWorkout(false);setViewingWeek(liftWeeks[activeId]||1);setView("dashboard");}} style={{background:"none",border:"1px solid #333",color:"#555"}}>HOME</button>
                </div>
              )}
              {reviewingCompletedWorkout && editingPastWeek && (
                <button className="bigbtn" onClick={()=>{setEditingPastWeek(false);setReviewingCompletedWorkout(false);setViewingWeek(liftWeeks[activeId]||1);}} style={{background:"var(--bg-input)",border:"1px solid #555",color:"#555"}}>CANCEL EDIT</button>
              )}
              {isPastWeek&&editingPastWeek&&<button className="bigbtn" onClick={()=>{
                // Recalculate volume and estMax from edited logs
                const editedSets = logs?.[week]?.[activeId] || {};
                const wts = calcWorkingWeights(getWorkingMax(activeId, week));
                const editedReps = +( editedSets[3]?.reps || 10 );
                const editedVol = wts[0]*10 + wts[1]*10 + wts[2]*10 + wts[3]*editedReps;
                const editedEstMax = calcEstMax(wts[3], editedReps);
                // Find existing ledger entry for this lift+week and replace, or add if missing
                setSessionLedger(prev => {
                  const existingIdx = prev.findIndex(s => s.liftId === activeId && s.week === week);
                  const updatedEntry = existingIdx >= 0
                    ? {...prev[existingIdx], volume: editedVol, estMax: editedEstMax}
                    : {date: todayISO(), liftId: activeId, liftName: lift?.name, liftColor: lift?.color, programId, week, sets: wts.map((w,i)=>({weight:w, reps:i<3?10:editedReps})), volume: editedVol, estMax: editedEstMax};
                  if (existingIdx >= 0) {
                    const updated = [...prev];
                    updated[existingIdx] = updatedEntry;
                    return updated;
                  }
                  return [...prev, updatedEntry];
                });
                setEditingPastWeek(false);
                if(reviewingCompletedWorkout) setReviewingCompletedWorkout(false);
              }} style={{background:lift.color,color:"#000"}}>SAVE CHANGES</button>}
              {!isPastWeek && (
                <>
                  <button className="bigbtn" onClick={finishDay} style={{background:isDayDone?"var(--bg-card)":lift.color,color:isDayDone?lift.color:"#000",border:isDayDone?"1px solid "+lift.color:"none"}}>
                    {isDayDone?"✓ DAY COMPLETE":"FINISH DAY"}
                  </button>
                  {willProgress&&!isDayDone&&!isAssisted&&<div style={{textAlign:"center",color:"#06d6a0",fontSize:12}}>🔥 Next week's max: {nextMax} lbs</div>}
                  {willProgress&&!isDayDone&&isAssisted&&nextMax>0&&<div style={{textAlign:"center",color:"#06d6a0",fontSize:12}}>💪 Next week: {nextMax} lbs assistance — getting closer!</div>}
                  {willProgress&&!isDayDone&&isAssisted&&nextMax===0&&<div style={{textAlign:"center",color:"#f7b731",fontSize:13,fontFamily:"'Roboto Condensed',sans-serif",letterSpacing:1}}>🎉 UNASSISTED NEXT WEEK! YOU DID IT!</div>}
                  {!isDayDone&&isAssisted&&effMax===0&&<div style={{textAlign:"center",color:"#f7b731",fontSize:12,marginTop:8}}>🏆 You're doing unassisted pullups! Consider switching to Weighted Pull Up.</div>}
                </>
              )}
            </div>
          </>
        )}

        {view==="progress" && (
          <div style={{padding:16}}>
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,letterSpacing:2,color:"#888",marginBottom:14}}>PROGRESS</div>
            {lifts.map(l=>{
              const startMax=l.startingMax||0;
              const curMax=getEffMax(l.id,liftWeeks[l.id]||1);
              const currentWeek = liftWeeks[l.id] || 1;
                // Build max progression - actual max + est max dashed line
                const liftSessions = sessionLedger
                  .filter(s => s.liftId === l.id)
                  .sort((a,b) => new Date(a.date) - new Date(b.date))
                  .slice(-12);
                const maxData = liftSessions.length > 0
                  ? [{w:"Start", max:startMax, est:startMax}, ...liftSessions.map(s=>({
                      w: (new Date(s.date).getMonth()+1)+"/"+(new Date(s.date).getDate()),
                      max: getEffMax(l.id, s.week),
                      est: s.estMax || null
                    }))]
                  : [{w:"Start", max:startMax, est:startMax}];
                // Y axis ticks in increments of 5
                const allVals = maxData.flatMap(d=>[d.max, d.est]).filter(Boolean);
                const yMin = Math.floor((Math.min(...allVals)-10)/5)*5;
                const yMax = Math.ceil((Math.max(...allVals)+10)/5)*5;
                const yTicks = [];
                for(let t=yMin; t<=yMax; t+=5) yTicks.push(t);
              const volData=sessionLedger.filter(s=>s.liftId===l.id).slice(-12).reverse().map(s=>({d:(new Date(s.date).getMonth()+1)+'/'+(new Date(s.date).getDate()),v:Math.round((s.volume||0)/1000)}));
              // For assisted pullups, build effective pull strength data
              const effPullData = isAssistedPullUp(l) ? (() => {
                const bw = latestWeight || latestBodyweight();
                if (!bw) return [];
                const data = [];
                for (let w = 1; w <= (liftWeeks[l.id]||1); w++) {
                  const assistW = getEffMax(l.id, w); // assistance at week w (effective-load model)
                  data.push({ w: `W${w}`, pull: Math.max(0, bw - assistW) });
                }
                return data;
              })() : [];
              return (
                <div key={l.id} style={{...card,borderLeft:"3px solid "+l.color}}>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,color:l.color,marginBottom:2}}>{l.name}</div>
                  <div style={{color:"#555",fontSize:11,marginBottom:10}}>
                    {isAssistedPullUp(l)
                      ? <>
                          Start: <span style={{color:"var(--text-secondary)"}}>{l.startingMax} lbs assist</span>{"  →  "}
                          Week {liftWeeks[l.id]||1}: <span style={{color:l.color}}>{curMax === 0 ? "UNASSISTED! 🎉" : curMax+" lbs assist"}</span>
                          {latestWeight && curMax > 0 && <span style={{color:"#06d6a0"}}> · Pulling {latestWeight - curMax} lbs</span>}
                          {latestWeight && curMax === 0 && <span style={{color:"#f7b731"}}> · Full {latestWeight} lbs!</span>}
                        </>
                      : <>Start: <span style={{color:"var(--text-secondary)"}}>{startMax} lbs</span>{"  →  "}Week {liftWeeks[l.id]||1}: <span style={{color:l.color}}>{curMax} lbs</span>{curMax>startMax&&<span style={{color:"#06d6a0"}}> (+{curMax-startMax})</span>}</>
                    }
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <div style={{color:"#555",fontSize:10}}>MAX PROGRESSION</div>
                    <div style={{display:"flex",gap:12,alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <div style={{width:16,height:2,background:l.color,borderRadius:1}}></div>
                        <span style={{color:"#555",fontSize:9}}>PROGRAM MAX</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <div style={{width:16,height:0,borderTop:"2px dashed "+l.color,borderRadius:1}}></div>
                        <span style={{color:"#555",fontSize:9}}>EST MAX</span>
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={110}>
                    <LineChart data={maxData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-input)" />
                      <XAxis dataKey="w" tick={{fill:"#555",fontSize:9}} />
                      <YAxis tick={{fill:"#555",fontSize:9}} domain={[yMin,yMax]} ticks={yTicks} />
                      <Tooltip contentStyle={{background:"var(--bg-input)",border:"1px solid "+l.color,borderRadius:6,fontSize:11}} formatter={(v,n)=>[v+" lbs",n==="max"?"Program Max":"Est Max"]} />
                      <Line type="monotone" dataKey="max" stroke={l.color} strokeWidth={2} dot={{fill:l.color,r:3}} name="max" connectNulls />
                      <Line type="monotone" dataKey="est" stroke={l.color} strokeWidth={1.5} strokeDasharray="5 3" dot={{fill:l.color,r:2}} name="est" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                  {isAssistedPullUp(l) && effPullData.length>1 && (
                    <>
                      <div style={{color:"#555",fontSize:10,marginTop:10,marginBottom:4}}>EFFECTIVE PULL STRENGTH (lbs)</div>
                      <ResponsiveContainer width="100%" height={80}>
                        <LineChart data={effPullData}>
                          <XAxis dataKey="w" tick={{fill:"#555",fontSize:8}} />
                          <YAxis tick={{fill:"#555",fontSize:8}} domain={["auto","auto"]} />
                          <Tooltip contentStyle={{background:"var(--bg-input)",border:"1px solid "+l.color,borderRadius:6,fontSize:11}} />
                          <Line type="monotone" dataKey="pull" stroke="#06d6a0" strokeWidth={2} dot={{fill:"#06d6a0",r:3}} name="Effective Pull" />
                        </LineChart>
                      </ResponsiveContainer>
                      {latestWeight && <div style={{color:"#555",fontSize:10,marginTop:4}}>Bodyweight: {latestWeight} lbs · Current pull: <span style={{color:"#06d6a0"}}>{latestWeight - (getEffMax(l.id, liftWeeks[l.id]||1))} lbs</span></div>}
                    </>
                  )}
                  {volData.length>0 && !isAssistedPullUp(l) && (
                    <>
                      <div style={{color:"#555",fontSize:10,marginTop:10,marginBottom:4}}>VOLUME (1000s lbs)</div>
                      <ResponsiveContainer width="100%" height={80}>
                        <BarChart data={volData}><XAxis dataKey="d" tick={{fill:"#555",fontSize:8}} /><YAxis tick={{fill:"#555",fontSize:8}} /><Tooltip contentStyle={{background:"var(--bg-input)",border:"1px solid "+l.color,borderRadius:6,fontSize:11}} /><Bar dataKey="v" fill={l.color} radius={[3,3,0,0]} name="Vol(k)" /></BarChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </div>
              );
            })}
            {bodyStats.entries.length>0 && (()=>{
              // Build 12-week weekly averages
              const now = new Date();
              const weeklyData = [];
              for (let w = 11; w >= 0; w--) {
                const weekEnd = new Date(now);
                weekEnd.setDate(now.getDate() - w * 7);
                const weekStart = new Date(weekEnd);
                weekStart.setDate(weekEnd.getDate() - 6);
                const weekEntries = bodyStats.entries.filter(e => {
                  const d = new Date(e.date);
                  return d >= weekStart && d <= weekEnd;
                });
                if (weekEntries.length > 0) {
                  const avg = weekEntries.reduce((sum, e) => sum + e.weightLbs, 0) / weekEntries.length;
                  const label = (weekEnd.getMonth()+1) + "/" + weekEnd.getDate();
                  weeklyData.push({ d: label, w: Math.round(avg * 10) / 10 });
                }
              }
              if (weeklyData.length === 0) return null;
              return (
                <div style={{...card}}>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,color:"#06d6a0",marginBottom:4}}>BODYWEIGHT</div>
                  <div style={{color:"#555",fontSize:10,marginBottom:10}}>12-WEEK WEEKLY AVERAGE</div>
                  <ResponsiveContainer width="100%" height={110}>
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-input)" />
                      <XAxis dataKey="d" tick={{fill:"#555",fontSize:9}} />
                      <YAxis tick={{fill:"#555",fontSize:9}} domain={["auto","auto"]} />
                      <Tooltip contentStyle={{background:"var(--bg-input)",border:"1px solid #06d6a0",borderRadius:6,fontSize:11}} />
                      <Line type="monotone" dataKey="w" stroke="#06d6a0" strokeWidth={2} dot={{fill:"#06d6a0",r:3}} name="avg lbs" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </div>
        )}

        {view==="ledger" && (
          <div style={{padding:16}}>
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:22,letterSpacing:2,color:"#888",marginBottom:14}}>WORKOUT LEDGER</div>
            {sessionLedger.length===0&&<div style={{color:"#333",fontSize:13,textAlign:"center",padding:40}}>No sessions logged yet</div>}
            {(()=>{
              // Group sessions by programId
              const groups = [];
              const seen = new Map();
              sessionLedger.forEach((s,i) => {
                const pid = s.programId || "unknown";
                if (!seen.has(pid)) {
                  seen.set(pid, groups.length);
                  groups.push({
                    programId: pid,
                    programName: s.programName || "",
                    sessions: [],
                    indices: [],
                    startDate: s.date,
                    endDate: s.date,
                  });
                }
                const g = groups[seen.get(pid)];
                g.sessions.push(s);
                g.indices.push(i);
                if (s.date < g.startDate) g.startDate = s.date;
                if (s.date > g.endDate) g.endDate = s.date;
              });

              return groups.map((g,gi) => {
                const isActive = g.programId === programId;
                const isExpanded = expandedProgramId === g.programId;
                const totalVol = g.sessions.reduce((sum,s)=>sum+(s.volume||0),0);
                const displayName = g.programName || (isActive ? "Current Program" : "Program " + (groups.length - gi));

                return (
                  <div key={g.programId} style={{marginBottom:12}}>
                    {/* Program header */}
                    <div onClick={()=>setExpandedProgramId(isExpanded?null:g.programId)}
                      style={{background:"var(--bg-card)",borderRadius:isExpanded?"10px 10px 0 0":10,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",border:"1px solid "+(isActive?"#e85d04":"var(--border)"),borderBottom:isExpanded?"none":"1px solid "+(isActive?"#e85d04":"var(--border)")}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          {isActive && <div style={{width:8,height:8,borderRadius:"50%",background:"#06d6a0",flexShrink:0}}></div>}
                          <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:17,color:isActive?"#e85d04":"var(--text-primary)",letterSpacing:1}}>{displayName}</div>
                        </div>
                        <div style={{color:"#555",fontSize:11}}>{fmtDate(g.startDate)}{!isActive?" → "+fmtDate(g.endDate):""} · {g.sessions.length} sessions · {Math.round(totalVol/1000)}k lbs</div>
                      </div>
                      <div style={{color:"#555",fontSize:20,transform:isExpanded?"rotate(90deg)":"none",transition:"transform 0.2s"}}>›</div>
                    </div>

                    {/* Expanded sessions */}
                    {isExpanded && (
                      <div style={{border:"1px solid "+(isActive?"#e85d04":"var(--border)"),borderTop:"none",borderRadius:"0 0 10px 10px",overflow:"hidden"}}>
                        {g.sessions.map((s,si) => (
                          <div key={si} style={{padding:"12px 16px",borderBottom:si<g.sessions.length-1?"1px solid var(--bg-sunken)":"none",background:si%2===0?"var(--bg-secondary)":"var(--bg-card)"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                              <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,color:s.liftColor||"var(--text-primary)"}}>{s.liftName}</div>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div style={{color:"#555",fontSize:11}}>{fmtDate(s.date)} · Wk {s.week}</div>
                                <button onClick={()=>setConfirmDeleteSession(g.indices[si])} style={{background:"none",border:"1px solid #333",color:"#444",borderRadius:4,padding:"2px 6px",fontSize:10,cursor:"pointer"}}>DEL</button>
                              </div>
                            </div>
                            <div style={{display:"flex",gap:14,marginBottom:6,flexWrap:"wrap"}}>
                              {s.sets?.map((set,j)=>(
                                <div key={j} style={{textAlign:"center"}}>
                                  <div style={{color:"#555",fontSize:9}}>SET {j+1}</div>
                                  <div style={{color:s.liftColor,fontFamily:"'Roboto Condensed',sans-serif",fontSize:14}}>{set.weight}</div>
                                  <div style={{color:"#555",fontSize:10}}>×{set.reps}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <div style={{color:"#555",fontSize:11}}>
                                Vol: <span style={{color:"var(--text-secondary)"}}>{s.volume?.toLocaleString()} lbs</span>
                                {s.estMax&&<> · Est: <span style={{color:"#06d6a0"}}>{s.estMax} lbs</span></>}
                              </div>
                              <div style={{display:"flex",gap:8}}>
                                {s.durationSecs>0&&<span style={{fontSize:10,color:"#555"}}>⏱ {fmtDuration(s.durationSecs)}</span>}
                                {s.calories>0&&<span style={{fontSize:10,color:"#f7b731"}}>🔥 {s.calories}cal</span>}
                              </div>
                            </div>
                            {s.accessories?.length>0&&<div style={{color:"#444",fontSize:10,marginTop:3}}>+ {s.accessories.length} accessories</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {view==="workout" && (
        <div className="theme-dark" style={{position:"fixed",bottom:70,left:0,right:0,background:"var(--bg-secondary)",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)",zIndex:9,display:"flex",alignItems:"center",gap:10,padding:"8px 12px"}}>
          {/* Timer display */}
          <div style={{textAlign:"center",minWidth:60}}>
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:28,color:restRunning?"#f7b731":restTimer===0?"#06d6a0":"var(--text-primary)",lineHeight:1}}>
              {restTimer!==null?Math.floor(restTimer/60)+":"+String(restTimer%60).padStart(2,"0"):restDuration+"s"}
            </div>
            <div style={{color:"#555",fontSize:8,letterSpacing:1}}>REST</div>
          </div>
          {/* Presets */}
          <div style={{display:"flex",gap:4,flex:1}}>
            {[60,90,120,180].map(s=>(
              <button key={s} onClick={()=>{setRestDuration(s);setRestTimer(s);setRestRunning(false);setRestStartTime(null);}}
                style={{flex:1,background:restDuration===s?"var(--bg-input)":"var(--bg-sunken)",border:"1px solid "+(restDuration===s?"#555":"#222"),color:restDuration===s?"var(--text-secondary)":"#444",borderRadius:5,padding:"5px 0",fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,cursor:"pointer"}}>
                {s}s
              </button>
            ))}
          </div>
          {/* GO / RST */}
          <button onClick={()=>{primeAudio();const now=new Date().toISOString();setRestStartTime(now);setRestTimer(restDuration);setRestRunning(true);}}
            style={{background:"#06d6a0",border:"none",color:"#000",borderRadius:6,padding:"6px 14px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,cursor:"pointer"}}>GO</button>
          <button onClick={()=>{setRestTimer(null);setRestRunning(false);setRestStartTime(null);}}
            style={{background:"none",border:"1px solid #333",color:"#555",borderRadius:6,padding:"6px 10px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,cursor:"pointer"}}>RST</button>
        </div>
      )}

      <div className="theme-dark" style={{position:"fixed",bottom:0,left:0,right:0,background:"var(--bg-secondary)",borderTop:"1px solid var(--border)",display:"flex",zIndex:10,padding:"4px"}}>
        {[
          {id:"dashboard", label:"HOME", color:"#e85d04", svg:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>},
          {id:"workout",   label:"LIFT",     color:"#3a86ff", svg:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="12" x2="18" y2="12"/><circle cx="4" cy="12" r="2"/><circle cx="20" cy="12" r="2"/><rect x="7" y="8" width="2" height="8" rx="1"/><rect x="15" y="8" width="2" height="8" rx="1"/></svg>},
          {id:"progress",  label:"PROGRESS", color:"#8338ec", svg:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>},
          {id:"run",      label:"RUN",      color:"#3a86ff", svg:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 7l-2 5h4l-2 5"/><path d="M8 17l-2 3M16 17l2 3"/><path d="M7 12l-3 1M17 12l3 1"/></svg>},
          {id:"social",    label:"SOCIAL",   color:"#ff006e", svg:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>},
          {id:"ledger",    label:"LEDGER",   color:"#06d6a0", svg:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>},
          {id:"setup",     label:hasSetup?"PROGRAM":"SETUP", color:"#f7b731", svg:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>},
        ].map(t=>(
          <button key={t.id} onClick={()=>{setView(t.id);if(t.id==="social"){localStorage.setItem("barnone_social_check_"+uid, new Date().toISOString());localStorage.setItem("barnone_last_reaction_"+uid, lastSeenReaction);setNewFriendSessions(0);setNewReactionCount(0);setSocialTab("feed");}}} style={{flex:1,background:"none",border:"none",padding:"8px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",color:view===t.id?t.color:"#444",position:"relative"}}>
            {t.svg}
            <span style={{fontSize:9,letterSpacing:1,fontFamily:"'DM Mono',monospace"}}>{t.label}</span>
            <div style={{width:4,height:4,borderRadius:"50%",background:view===t.id?t.color:"transparent"}}></div>
            {t.id==="social" && (friendRequests.length + newReactionCount + newFriendSessions) > 0 && (
              <span style={{position:"absolute",top:4,right:"15%",background:"#e85d04",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono',monospace"}}>{friendRequests.length + newReactionCount + newFriendSessions}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
