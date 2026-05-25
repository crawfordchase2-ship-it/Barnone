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
const ACCESSORIES_BY_LIFT = {
  "Bench":           ["Incline Bench","Decline Bench","Cable Flys High/Low","Dips","Skull Crushers","Cable Tricep Ext.","Push Ups","Dumbbell Flys","Close Grip Bench","Sven Press","Tate Press","JM Press","Chest Supported Row","Face Pulls"],
  "Deadlift":        ["Pullups","Weighted Pullups","Lat Pull-Down","Seated T-bar Row","Str. Arm Lat Pulldown","Dumbbell Row","Barbell Row","Dumbbell Curls","Barbell Curls","Hammer Curls","Preacher Curls","Rack Pulls","Romanian Deadlift","Good Mornings","Shrugs","Ab Roller","Farmers Walk"],
  "Military Press":  ["Arnold Press","Front Raises","Lateral Raises","Reverse Fly","Rear Delt Swing","Cable Front Raise","Rear Delt Cable Pull","45 Deg Y Raise","Upright Row","Snatch","Face Pulls","Cable Lateral Raise","Dumbbell Shoulder Press","Plate Raises"],
  "Squat":           ["Smith Lunges","Stiff Leg Deadlift","Leg Extension","Prone Leg Curl","Calf Raises","Hip Abductor","Hip Adductor","Hip Thrust","Bulgarian Split Squat","Cable Kickbacks","Leg Press","Step Ups","Box Jumps","Goblet Squat","Wall Sit"],
  "Weighted Pull Up":["Lat Pull-Down","Straight Arm Pulldown","Dumbbell Row","Barbell Row","Seated Cable Row","T-bar Row","Hammer Curls","Barbell Curls","Dumbbell Curls","Preacher Curls","Face Pulls","Band Pull Apart"],
  "Hip Thrust":      ["Glute Bridge","Cable Kickback","Donkey Kicks","Bulgarian Split Squat","Calf Raises","Hip Abductor","Hip Adductor","Leg Press","Romanian Deadlift","Step Ups","Sumo Squat","Reverse Hyper"],
  "Assisted Pull Up":["Lat Pull-Down","Straight Arm Pulldown","Dumbbell Row","Barbell Row","Seated Cable Row","T-bar Row","Hammer Curls","Barbell Curls","Dumbbell Curls","Preacher Curls","Face Pulls","Band Pull Apart","Dead Hang","Scapular Pull Up"],
  "Custom":          ["Incline Bench","Pullups","Lat Pull-Down","Dumbbell Row","Dumbbell Curls","Arnold Press","Front Raises","Lateral Raises","Face Pulls","Romanian Deadlift","Leg Extension","Calf Raises","Hip Thrust","Leg Press","Ab Roller","Farmers Walk","Shrugs"],
};
const HYPE = ["Time to move some weight!","Let's get after it!","No excuses. Let's go!","Your future self will thank you.","The bar is waiting.","Stronger than last week. Prove it."];
const DAY_ABBR = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const ROOT_KEY = "barnone_v5"; // kept for legacy session cleanup

function isAssistedPullUp(lift) { return lift?.mainLiftOption === "Assisted Pull Up"; }

// For assisted pullups, working weights are assistance amounts that decrease
// Starting max = assistance weight (e.g. 50 lbs)
// Each set uses less assistance, encouraging more bodyweight strength
function calcAssistedWeights(assistanceMax) {
  // Sets go from most assistance to least — hardest set last
  // Always round to nearest 5, minimum 5 lbs
  const r = v => Math.max(5, Math.round(v / 5) * 5);
  return [
    r(assistanceMax * 0.75),
    r(assistanceMax * 0.60),
    r(assistanceMax * 0.45),
    r(assistanceMax * 0.30),
  ];
}

// Reverse progression — assistance goes DOWN over time
function calcNextAssistedMax(currentAssist, reps, isLower) {
  if (+reps <= 10) return currentAssist; // 10 reps = stay same
  const drop = +reps >= 15 ? 10 : 5; // >15 reps = drop 10 lbs, else 5
  return Math.max(0, currentAssist - drop);
}

function calcCurrentMax(s) { return Math.round(s * 0.9 / 5) * 5; }
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
  return isLower ? (d>=20?cur+20:d>=10?cur+10:cur) : (d>=20?cur+10:d>=10?cur+5:cur);
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
    program_history: d.programHistory,
    weight_nudge: d.weightNudge,
    program_started: d.programStarted,
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id" });
}

export default function App() {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
  const [previewLift, setPreviewLift] = useState(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [restTimer, setRestTimer] = useState(null);
  const [restRunning, setRestRunning] = useState(false);
  const [restDuration, setRestDuration] = useState(90);
  const [showProfile, setShowProfile] = useState(false);
  const [weightEntry, setWeightEntry] = useState("");
  const [heightFtEntry, setHeightFtEntry] = useState("");
  const [heightInEntry, setHeightInEntry] = useState("");
  const [showWeightPrompt, setShowWeightPrompt] = useState(false);
  const [weightNudge, setWeightNudge] = useState({ weekKey:"", skips:0 });
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);
  const [programStarted, setProgramStarted] = useState(false);
  const [showSocial, setShowSocial] = useState(false);
  const [newReactionCount, setNewReactionCount] = useState(0);
  const [editingProfile, setEditingProfile] = useState(false);
  const [lastSeenReaction, setLastSeenReaction] = useState("");
  const [socialTab, setSocialTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [myReactions, setMyReactions] = useState([]);
  const [friendSearch, setFriendSearch] = useState("");
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [username, setUsername] = useState("");
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
      } else {
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
    weightEntry &&
    lifts.every(l=>(l.trainingDays||[]).length>0);
  const hasSetup = readyToStart && programStarted;

  useEffect(() => {
    if (!uid) return;
    saveUD(uid, { lifts, startDate, activeId, logs, completedDays, accList, exerciseHistory, weightAdjust, liftWeeks, customAccessories, sessionLedger, bodyStats, programHistory, weightNudge, programStarted });
  }, [lifts,startDate,activeId,logs,completedDays,accList,exerciseHistory,weightAdjust,liftWeeks,customAccessories,sessionLedger,bodyStats,programHistory,weightNudge,programStarted,uid]);

  useEffect(() => {
    if (restRunning && restTimer > 0) {
      timerRef.current = setTimeout(() => setRestTimer(t => t-1), 1000);
    } else if (restTimer === 0 && restRunning) {
      setRestRunning(false);
      if ("Notification" in window && Notification.permission === "granted")
        new Notification("Rest Over!", { body: "Time for your next set!" });
    }
    return () => clearTimeout(timerRef.current);
  }, [restRunning, restTimer]);

  // PR notification
  function checkForPR(liftId, estMax) {
    if (!estMax) return;
    const lift = lifts.find(l => l.id === liftId);
    if (!lift) return;
    const prevMax = getEffMax(liftId, liftWeeks[liftId] || 1);
    if (estMax > prevMax && Notification.permission === "granted") {
      new Notification(`🏆 NEW PR - ${lift.name.toUpperCase()}!`, {
        body: `Est. max: ${estMax} lbs — up from ${prevMax} lbs. Beast mode activated.`
      });
    }
  }

  // New week notification
  useEffect(() => {
    if (!hasSetup || !uid) return;
    lifts.forEach(l => {
      const w = liftWeeks[l.id] || 1;
      if (w <= 1) return;
      const key = `barnone_newweek_${uid}_${l.id}_w${w}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      if (Notification.permission !== "granted") return;
      const wts = calcWorkingWeights(getEffMax(l.id, w));
      new Notification(`📅 WEEK ${w} - ${l.name.toUpperCase()}`, {
        body: `New week, new weights!
Sets: ${wts[0]} / ${wts[1]} / ${wts[2]} / ${wts[3]} lbs`
      });
    });
  }, [liftWeeks, hasSetup, uid]);

  // Streak reminder - if no session logged in 3+ days
  useEffect(() => {
    if (!hasSetup || !uid || !sessionLedger.length) return;
    const key = `barnone_streak_${uid}_${todayISO()}`;
    if (sessionStorage.getItem(key)) return;
    const lastDate = sessionLedger[0]?.date;
    if (!lastDate) return;
    const daysSince = Math.floor((new Date(todayISO()) - new Date(lastDate)) / 86400000);
    if (daysSince >= 3 && Notification.permission === "granted") {
      sessionStorage.setItem(key, "1");
      new Notification("💪 TIME TO GET BACK IN THE GYM", {
        body: `It's been ${daysSince} days since your last session. Your gains are waiting.`
      });
    }
  }, [hasSetup, uid, sessionLedger]);

  // Weekly summary - fires on Sunday
  useEffect(() => {
    if (!hasSetup || !uid) return;
    const today = new Date();
    if (today.getDay() !== 0) return; // Sunday only
    const key = `barnone_summary_${uid}_${todayISO()}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    if (Notification.permission !== "granted") return;
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - 6);
    const weekSessions = sessionLedger.filter(s => new Date(s.date) >= thisWeekStart);
    if (!weekSessions.length) return;
    const totalVol = weekSessions.reduce((sum, s) => sum + (s.volume || 0), 0);
    new Notification("📊 WEEKLY SUMMARY", {
      body: `${weekSessions.length} session${weekSessions.length > 1 ? "s" : ""} this week · ${Math.round(totalVol / 1000)}k lbs moved. Keep it up!`
    });
  }, [hasSetup, uid]);

  async function loadUserIntoState(userId) {
    const d = await loadUD(userId);
    if (d) {
      setLifts(d.lifts || DEFAULT_LIFTS);
      setStartDate(d.start_date || "");
      setActiveId((d.lifts || DEFAULT_LIFTS)[0]?.id || DEFAULT_LIFTS[0].id);
      setLogs(d.logs || {});
      setCompletedDays(d.completed_days || {});
      setAccList(d.acc_list || {});
      setExerciseHistory(d.exercise_history || {});
      setWeightAdjust(d.weight_adjust || {});
      setLiftWeeks(d.lift_weeks || Object.fromEntries(DEFAULT_LIFTS.map(l=>[l.id,1])));
      setCustomAccessories(d.custom_accessories || {});
      setSessionLedger(d.session_ledger || []);
      setBodyStats(d.body_stats || { heightIn:"", entries:[] });
      setProgramHistory(d.program_history || []);
      setWeightNudge(d.weight_nudge || { weekKey:"", skips:0 });
      // Infer programStarted from any existing data
      const inferred = d.program_started ||
        (d.lifts && d.lifts.some(l => l.startingMax > 0) && d.start_date) ||
        (d.logs && Object.keys(d.logs).length > 0) ||
        (d.completed_days && Object.keys(d.completed_days).length > 0) ||
        false;
      setProgramStarted(inferred);
    }
    setView("dashboard");
    loadSocialData(userId);
  }

  async function loadSocialData(userId) {
    if (!userId) return;
    const { data: profile } = await supabase
      .from("public_profiles").select("*").eq("id", userId).single();
    if (profile) {
      setUsername(profile.username || "");
      setIsPublic(profile.is_public || false);
    }
    const { data: requests } = await supabase
      .from("friend_requests")
      .select("id, from_id, to_id, status")
      .or("from_id.eq." + userId + ",to_id.eq." + userId);
    if (requests) {
      setFriendRequests(requests.filter(r => r.status === "pending" && r.to_id === userId));
      const accepted = requests.filter(r => r.status === "accepted");
      const friendIds = accepted.map(r => r.from_id === userId ? r.to_id : r.from_id);
      if (friendIds.length > 0) {
        const { data: friendData } = await supabase
          .from("user_data").select("user_id, lifts, lift_weeks, session_ledger")
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
        }
      }
    }
    const { data: reactions } = await supabase
      .from("reactions").select("*").eq("to_id", userId)
      .order("created_at", { ascending: false }).limit(20);
    if (reactions) {
      setMyReactions(reactions);
      // Count reactions newer than last seen
      const lastSeen = localStorage.getItem("barnone_last_reaction_" + userId) || "";
      const newCount = reactions.filter(r => r.created_at > lastSeen).length;
      setNewReactionCount(newCount);
      setLastSeenReaction(reactions[0]?.created_at || "");
    }
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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

  function getEffMax(liftId, targetWeek) {
    const lift = lifts.find(l=>l.id===liftId);
    if (!lift) return 0;
    if (isAssistedPullUp(lift)) {
      let assist = lift.startingMax || 0;
      for (let w=1; w<targetWeek; w++) {
        const log = logs?.[w]?.[liftId]?.[3];
        if (log?.reps) assist = calcNextAssistedMax(assist, +log.reps);
      }
      return assist;
    }
    let max = calcCurrentMax(lift.startingMax||0);
    for (let w=1; w<targetWeek; w++) {
      const log = logs?.[w]?.[liftId]?.[3];
      if (log?.reps && +log.reps>10) {
        const em = calcEstMax(calcWorkingWeights(max)[3], +log.reps);
        max = calcNextMax(max, em, lift.isLower);
      }
    }
    return max;
  }

  function calcVolume(liftId, w) {
    const wts = calcWorkingWeights(getEffMax(liftId, w));
    let vol = wts[0]*10 + wts[1]*10 + wts[2]*10 + wts[3]*(+(logs?.[w]?.[liftId]?.[3]?.reps)||10);
    (accList?.[w]?.[liftId]||[]).forEach(a => { vol += (+a.weight||0)*(+a.reps||10)*3; });
    return vol;
  }

  function addLift() {
    const id="lift_"+Date.now();
    setLifts(prev=>[...prev,{id,name:"",mainLiftOption:"Bench",color:COLORS[prev.length%COLORS.length],startingMax:0,trainingDays:[],isLower:false}]);
    setLiftWeeks(prev=>({...prev,[id]:1}));
  }
  function removeLift(id) { setLifts(prev=>prev.filter(l=>l.id!==id)); }
  function updateLift(id,field,val) { setLifts(prev=>prev.map(l=>l.id===id?{...l,[field]:val}:l)); }
  function switchLift(id) { setActiveId(id); setViewingWeek(liftWeeks[id]||1); setEditingPastWeek(false); }
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
  const isAssisted = isAssistedPullUp(lift);
  const weights = isAssisted ? calcAssistedWeights(effMax) : calcWorkingWeights(effMax);
  const set4Reps = logs?.[week]?.[activeId]?.[3]?.reps ?? "10";
  const sessionEstMax = +set4Reps>10 ? calcEstMax(weights[3],+set4Reps) : null;
  const nextMax = isAssisted
    ? calcNextAssistedMax(effMax, +set4Reps)
    : calcNextMax(effMax, sessionEstMax, lift?.isLower);
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
  function getAccList(w,id) { return accList?.[w]?.[id]||[]; }
  function addAcc(w,id,name) {
    if(!name)return;
    setAccList(prev=>{
      const n=JSON.parse(JSON.stringify(prev));
      if(!n[w])n[w]={};if(!n[w][id])n[w][id]=[];
      n[w][id].push({id:Date.now(),name,weight:exerciseHistory[name]||"",reps:"10"}); return n;
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
    const { error } = await supabase.from("friend_requests")
      .insert({ from_id: uid, to_id: toId, status: "pending" });
    if (!error) {
      setFriendSearchResults([]);
      setFriendSearch("");
      alert("Friend request sent!");
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
    await supabase.from("reactions")
      .insert({ from_id: uid, to_id: toId, session_date: sessionDate, lift_name: liftName, emoji });
  }

  async function savePublicProfile() {
    const uname = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
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
    });
    const vol = calcVolume(activeId, week);
    const entry = {
      date:todayISO(), liftId:activeId, liftName:lift?.name, liftColor:lift?.color,
      week, sets:weights.map((w,i)=>({weight:w,reps:i<3?10:+set4Reps||10})),
      accessories:getAccList(week,activeId).map(a=>({name:a.name,weight:a.weight,reps:a.reps})),
      notes:sessionNotes, volume:vol, estMax:sessionEstMax,
    };
    setSessionLedger(prev=>[entry,...prev]);
    checkForPR(activeId, sessionEstMax);
    setSessionNotes("");
    // Show weight prompt if not logged this week
    if (!loggedThisWeek) setShowWeightPrompt(true);
    setCompletedDays(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[week])n[week]={};n[week][activeId]=true;return n;});
    const nw=Math.min(12,activeLiftWeek+1);
    setLiftWeeks(prev=>({...prev,[activeId]:nw}));
    setViewingWeek(nw);
  }

  function startNewProgram() {
    // Save final maxes before archiving
    const finalMaxes = Object.fromEntries(lifts.map(l=>[l.id, getEffMax(l.id, liftWeeks[l.id]||1)]));
    const archive = {startDate, lifts, endDate:todayISO(), finalMaxes};
    setProgramHistory(prev=>[archive,...prev]);
    // Carry over final maxes as new starting maxes + keep exercise history
    const nl = lifts.map(l=>({...l, startingMax:finalMaxes[l.id]||0, trainingDays:[]}));
    setLifts(nl);
    setStartDate("");
    setLogs({});
    setCompletedDays({});
    setAccList({});
    setWeightAdjust({});
    setLiftWeeks(Object.fromEntries(nl.map(l=>[l.id,1])));
    setActiveId(nl[0].id);
    setViewingWeek(1);
    setProgramStarted(false);
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

  const latestWeight = bodyStats.entries[0]?.weightLbs;
  const bmi = calcBMI(latestWeight, +bodyStats.heightIn);
  const totalSessions = sessionLedger.length;
  const streak = (() => {
    if(!sessionLedger.length)return 0;
    const dates=[...new Set(sessionLedger.map(s=>s.date))].sort().reverse();
    let s=0,cur=todayISO();
    for(const d of dates){const diff=(new Date(cur)-new Date(d))/(86400000);if(diff<=1){s++;cur=d;}else break;}
    return s;
  })();
  const PRs = lifts.map(l=>({...l,startMax:calcCurrentMax(l.startingMax||0),curMax:getEffMax(l.id,liftWeeks[l.id]||1)}));

  const iS = { background:"#0f0f1a",border:"1px solid #333",color:"#f0f0f0",borderRadius:8,padding:"12px 16px",fontFamily:"'DM Mono',monospace",fontSize:14,outline:"none",display:"block",width:"100%" };
  const card = { background:"#0f0f1a", borderRadius:10, padding:"14px 16px", marginBottom:14 };

  return (
    <div style={{minHeight:"100vh",background:"#000000",color:"#f0f0f0",fontFamily:"'DM Mono','Courier New',monospace",fontSize:14,paddingBottom:100}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root{background:#000000!important;min-height:100%;}
        input[type=number],input[type=text],input[type=date],input[type=email],input[type=password]{background:#1a1a2e;border:1px solid #333;color:#f0f0f0;border-radius:6px;padding:6px 10px;font-family:'DM Mono',monospace;font-size:13px;}
        input[type=number]{width:64px;text-align:center;-moz-appearance:textfield;}
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;}
        input:focus,select:focus,textarea:focus{outline:none;border-color:#888;}
        input[readonly]{background:#111;border-color:#1a1a1a;color:#444;cursor:default;}
        select{background:#1a1a2e;border:1px solid #333;color:#f0f0f0;border-radius:6px;padding:6px 10px;font-family:'DM Mono',monospace;font-size:12px;}
        textarea{background:#1a1a2e;border:1px solid #333;color:#f0f0f0;border-radius:6px;padding:8px 10px;font-family:'DM Mono',monospace;font-size:12px;resize:none;width:100%;}
        .bn{border:none;cursor:pointer;border-radius:6px;font-family:'Bebas Neue',sans-serif;font-size:17px;letter-spacing:1px;padding:8px 14px;transition:all 0.15s;}
        .bigbtn{border:none;cursor:pointer;border-radius:8px;font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:2px;padding:14px;width:100%;transition:all 0.2s;margin-bottom:8px;}
        .ntab{background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 10px;color:#444;font-family:'DM Mono',monospace;font-size:9px;transition:all 0.15s;flex:1;}
        .ntab.on{color:#f0f0f0;}
        .srow{display:grid;grid-template-columns:28px 1fr auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #1a1a1a;}
      `}</style>

      {authScreen && authScreen!=="profile" && (
        <div style={{position:"fixed",inset:0,background:"#0a0a0f",zIndex:100,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
          <img src="/logo.png" alt="Bar None" style={{width:"100%",maxWidth:360,objectFit:"contain",marginBottom:36}} />
          <div style={{width:"100%",maxWidth:360}}>
            <div style={{display:"flex",marginBottom:20,background:"#0f0f1a",borderRadius:8,padding:4}}>
              {["login","register"].map(tab=>(
                <button key={tab} onClick={()=>{setAuthScreen(tab);setAuthErr("");}} style={{flex:1,background:authScreen===tab?"#1a1a2e":"none",border:authScreen===tab?"1px solid #333":"none",color:authScreen===tab?"#f0f0f0":"#555",borderRadius:6,padding:"8px",fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:1,cursor:"pointer"}}>
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
        <div style={{position:"fixed",inset:0,background:"#0a0a0f99",zIndex:100,display:"flex",alignItems:"flex-end"}} onClick={()=>setShowProfile(false)}>
          <div style={{background:"#0f0f1a",borderRadius:"16px 16px 0 0",padding:24,width:"100%",maxWidth:500,margin:"0 auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,marginBottom:2}}>{currentUser?.user_metadata?.name || currentUser?.email}</div>
            <div style={{color:"#555",fontSize:11,marginBottom:16}}>{currentUser?.email}</div>
            <div style={{display:"flex",gap:20,marginBottom:20}}>
              <div><div style={{color:"#555",fontSize:10}}>SESSIONS</div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26}}>{totalSessions}</div></div>
              <div><div style={{color:"#555",fontSize:10}}>STREAK</div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#f7b731"}}>{streak} 🔥</div></div>
              {bmi && <div><div style={{color:"#555",fontSize:10}}>BMI</div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:bmiCol(bmi)}}>{bmi}</div></div>}
            </div>
            <button onClick={handleLogout} className="bigbtn" style={{background:"none",border:"1px solid #e85d04",color:"#e85d04",marginBottom:8}}>SIGN OUT</button>
            <button onClick={()=>setShowProfile(false)} className="bigbtn" style={{background:"none",border:"1px solid #333",color:"#555"}}>CANCEL</button>
          </div>
        </div>
      )}

      {loading && (
        <div style={{position:"fixed",inset:0,background:"#0a0a0f",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <img src="/logo.png" alt="Bar None" style={{height:80,objectFit:"contain"}} />
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#444",letterSpacing:2,marginTop:8}}>LOADING...</div>
        </div>
      )}

      {showWeightPrompt && (
        <div style={{position:"fixed",inset:0,background:"#0a0a0f99",zIndex:200,display:"flex",alignItems:"flex-end"}}>
          <div style={{background:"#0f0f1a",borderRadius:"16px 16px 0 0",padding:24,width:"100%",maxWidth:500,margin:"0 auto",borderTop:"3px solid #06d6a0"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#06d6a0",marginBottom:4,letterSpacing:1}}>LOG THIS WEEK'S WEIGHT</div>
            <div style={{color:"#555",fontSize:12,marginBottom:16}}>Track your progress alongside your lifts.</div>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:16}}>
              <input type="number" value={weightEntry} placeholder="185 lbs" autoFocus
                onChange={e=>setWeightEntry(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&weightEntry){logWeightAndDismiss();setShowWeightPrompt(false);}}}
                style={{flex:1,background:"#1a1a2e",border:"1px solid #06d6a0",color:"#06d6a0",borderRadius:6,padding:"10px 12px",fontFamily:"'Bebas Neue',sans-serif",fontSize:20,textAlign:"center"}} />
              <span style={{color:"#555",fontSize:12}}>lbs</span>
            </div>
            <button onClick={()=>{if(weightEntry){logWeightAndDismiss();setShowWeightPrompt(false);}}} style={{width:"100%",background:"#06d6a0",border:"none",color:"#000",borderRadius:8,padding:"14px",fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:2,cursor:"pointer",marginBottom:10}}>LOG WEIGHT</button>
            <button onClick={()=>setShowWeightPrompt(false)} style={{width:"100%",background:"none",border:"1px solid #333",color:"#555",borderRadius:8,padding:"10px",fontFamily:"'DM Mono',monospace",fontSize:12,cursor:"pointer"}}>skip for now</button>
          </div>
        </div>
      )}

      {showWeightModal && (
        <div style={{position:"fixed",inset:0,background:"#0a0a0fdd",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"#0f0f1a",borderRadius:16,padding:28,width:"100%",maxWidth:360,borderTop:"4px solid #f7b731"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,letterSpacing:2,color:"#f7b731",marginBottom:6}}>HEY! LOG YOUR WEIGHT</div>
            <div style={{color:"#aaa",fontSize:13,marginBottom:20,lineHeight:1.6}}>You've skipped a couple times this week. Tracking your weight is just as important as tracking your lifts. Takes 5 seconds.</div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <input type="number" value={weightEntry} placeholder="185 lbs"
                onChange={e=>setWeightEntry(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&logWeightAndDismiss()}
                style={{flex:1,background:"#1a1a2e",border:"1px solid #f7b731",color:"#f7b731",borderRadius:6,padding:"10px 12px",fontFamily:"'Bebas Neue',sans-serif",fontSize:20,textAlign:"center"}} />
            </div>
            <button onClick={logWeightAndDismiss} style={{width:"100%",background:"#f7b731",border:"none",color:"#000",borderRadius:8,padding:"14px",fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:2,cursor:"pointer",marginBottom:10}}>LOG IT NOW</button>
            <button onClick={()=>setShowWeightModal(false)} style={{width:"100%",background:"none",border:"1px solid #333",color:"#555",borderRadius:8,padding:"10px",fontFamily:"'DM Mono',monospace",fontSize:12,cursor:"pointer"}}>maybe later</button>
          </div>
        </div>
      )}

}

      {showSocial && (
        <div style={{position:"fixed",inset:0,background:"#0a0a0f",zIndex:100,display:"flex",flexDirection:"column",overflowY:"auto"}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#0a0a0f"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:2}}>SOCIAL</div>
            <button onClick={()=>setShowSocial(false)} style={{background:"none",border:"none",color:"#555",fontSize:24,cursor:"pointer"}}>{"×"}</button>
          </div>
          <div style={{display:"flex",borderBottom:"1px solid #1a1a1a"}}>
            {[{id:"friends",label:"FRIENDS"},{id:"requests",label:friendRequests.length > 0 ? "REQUESTS (" + friendRequests.length + ")" : "REQUESTS"},{id:"profile",label:"MY PROFILE"}].map(t => (
              <button key={t.id} onClick={()=>{setSocialTab(t.id);if(t.id==="profile"){localStorage.setItem("barnone_last_reaction_"+uid, lastSeenReaction);setNewReactionCount(0);}}} style={{flex:1,background:"none",border:"none",borderBottom:socialTab===t.id?"2px solid #e85d04":"2px solid transparent",color:socialTab===t.id?"#f0f0f0":"#555",padding:"10px",fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:1,cursor:"pointer"}}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{padding:16,flex:1}}>
            {socialTab === "friends" && (
              <div>
                <div style={{marginBottom:16}}>
                  <div style={{color:"#555",fontSize:10,marginBottom:6,letterSpacing:1}}>FIND FRIENDS</div>
                  <input type="text" value={friendSearch} placeholder="Search by name or username..."
                    onChange={e => { setFriendSearch(e.target.value); searchFriends(e.target.value); }}
                    style={{width:"100%",background:"#1a1a2e",border:"1px solid #333",color:"#f0f0f0",borderRadius:6,padding:"8px 10px",fontFamily:"'DM Mono',monospace",fontSize:12}} />
                  {friendSearchResults.map(u => (
                    <div key={u.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #1a1a1a"}}>
                      <div>
                        <div style={{color:"#f0f0f0",fontSize:13}}>{u.name}</div>
                        {u.username && <div style={{color:"#555",fontSize:11}}>{"@" + u.username}</div>}
                      </div>
                      <button onClick={()=>sendFriendRequest(u.id)} style={{background:"#e85d04",border:"none",color:"#000",borderRadius:4,padding:"5px 12px",fontFamily:"'Bebas Neue',sans-serif",fontSize:13,cursor:"pointer"}}>ADD</button>
                    </div>
                  ))}
                </div>
                {friends.length === 0 && <div style={{color:"#333",fontSize:12,textAlign:"center",padding:30}}>No friends yet — search above to add some!</div>}
                {friends.map(f => {
                  const fLifts = f.lifts || DEFAULT_LIFTS;
                  const lastSession = (f.session_ledger || [])[0];
                  return (
                    <div key={f.id} style={{background:"#0f0f1a",borderRadius:10,padding:14,marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                        <div>
                          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"#f0f0f0"}}>{f.name}</div>
                          {f.username && <div style={{color:"#555",fontSize:11}}>{"@" + f.username}</div>}
                        </div>
                        {lastSession && <div style={{color:"#555",fontSize:11}}>{fmtDate(lastSession.date)}</div>}
                      </div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:lastSession ? 10 : 0}}>
                        {fLifts.filter(l => l.startingMax > 0).map(l => {
                          const cardStyle = {background:"#1a1a2e",borderRadius:6,padding:"6px 10px",borderLeft:"2px solid " + l.color};
                          const nameStyle = {color:l.color,fontFamily:"'Bebas Neue',sans-serif",fontSize:13};
                          return (
                            <div key={l.id} style={cardStyle}>
                              <div style={nameStyle}>{l.name}</div>
                              <div style={{color:"#aaa",fontSize:12}}>{l.startingMax} lbs</div>
                            </div>
                          );
                        })}
                      </div>
                      {lastSession && (
                        <div style={{borderTop:"1px solid #1a1a1a",paddingTop:10}}>
                          <div style={{color:"#555",fontSize:10,marginBottom:6}}>{lastSession.liftName + " · " + fmtDate(lastSession.date)}</div>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            {["👊","🔥","💪","⚡","❤️","🙌","😤","💯"].map(emoji => (
                              <button key={emoji} onClick={()=>sendReaction(f.id, lastSession.date, lastSession.liftName, emoji)}
                                style={{background:"#1a1a2e",border:"1px solid #333",borderRadius:6,padding:"4px 8px",fontSize:18,cursor:"pointer"}}>
                                {emoji}
                              </button>
                            ))}
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
                  <div key={r.id} style={{background:"#0f0f1a",borderRadius:10,padding:14,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{color:"#f0f0f0",fontSize:14}}>{r.from_name || "Someone"}</div>
                      <div style={{color:"#555",fontSize:11}}>wants to be friends</div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>acceptFriendRequest(r.id)} style={{background:"#06d6a0",border:"none",color:"#000",borderRadius:4,padding:"6px 12px",fontFamily:"'Bebas Neue',sans-serif",fontSize:13,cursor:"pointer"}}>ACCEPT</button>
                      <button onClick={()=>declineFriendRequest(r.id)} style={{background:"none",border:"1px solid #555",color:"#555",borderRadius:4,padding:"6px 12px",fontFamily:"'Bebas Neue',sans-serif",fontSize:13,cursor:"pointer"}}>DECLINE</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {socialTab === "profile" && (
              <div>
                <div style={{background:"#0f0f1a",borderRadius:10,padding:14,marginBottom:14}}>
                  {username ? (
                    <>
                      <div style={{marginBottom:12}}>
                        <div style={{color:"#555",fontSize:10,marginBottom:4}}>USERNAME</div>
                        <div style={{color:"#f0f0f0",fontSize:16,fontFamily:"'DM Mono',monospace"}}>@{username}</div>
                        <div style={{color:"#333",fontSize:10,marginTop:4}}>Username is permanent and cannot be changed</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div>
                          <div style={{color:"#f0f0f0",fontSize:13}}>Public profile</div>
                          <div style={{color:"#555",fontSize:11}}>Friends can find and see your progress</div>
                        </div>
                        <button onClick={()=>{setIsPublic(p=>!p);savePublicProfile();}} style={{background:isPublic?"#06d6a0":"#1a1a2e",border:"1px solid "+(isPublic?"#06d6a0":"#555"),color:isPublic?"#000":"#555",borderRadius:20,padding:"4px 14px",fontFamily:"'DM Mono',monospace",fontSize:12,cursor:"pointer"}}>
                          {isPublic ? "ON" : "OFF"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{color:"#555",fontSize:10,marginBottom:6,letterSpacing:1}}>CHOOSE YOUR USERNAME</div>
                      <div style={{color:"#444",fontSize:11,marginBottom:10}}>This cannot be changed once set.</div>
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14}}>
                        <span style={{color:"#555",fontSize:14}}>@</span>
                        <input type="text" value={username} placeholder="yourname"
                          onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                          style={{flex:1,background:"#1a1a2e",border:"1px solid #333",color:"#f0f0f0",borderRadius:6,padding:"8px 10px",fontFamily:"'DM Mono',monospace",fontSize:13}} />
                      </div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                        <div>
                          <div style={{color:"#f0f0f0",fontSize:13}}>Public profile</div>
                          <div style={{color:"#555",fontSize:11}}>Friends can find and see your progress</div>
                        </div>
                        <button onClick={()=>setIsPublic(p=>!p)} style={{background:isPublic?"#06d6a0":"#1a1a2e",border:"1px solid "+(isPublic?"#06d6a0":"#555"),color:isPublic?"#000":"#555",borderRadius:20,padding:"4px 14px",fontFamily:"'DM Mono',monospace",fontSize:12,cursor:"pointer"}}>
                          {isPublic ? "ON" : "OFF"}
                        </button>
                      </div>
                      <button onClick={savePublicProfile} style={{width:"100%",background:"#e85d04",border:"none",color:"#000",borderRadius:8,padding:"12px",fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:1,cursor:"pointer"}}>SET USERNAME</button>
                    </>
                  )}
                </div>
                {myReactions.length > 0 && (
                  <div style={{background:"#0f0f1a",borderRadius:10,padding:14}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:"#888",marginBottom:10,letterSpacing:1}}>REACTIONS RECEIVED</div>
                    {myReactions.slice(0,10).map((r,i) => (
                      <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #1a1a1a",fontSize:12}}>
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

      <div style={{padding:"12px 16px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#0a0a0f",zIndex:10}}>
        <div>
          <img src="/logo.png" alt="Bar None" style={{height:80,objectFit:"contain"}} />
        </div>
        <button onClick={()=>setShowProfile(true)} style={{background:"#0f0f1a",border:"1px solid #222",color:"#555",borderRadius:6,padding:"5px 12px",fontFamily:"'DM Mono',monospace",fontSize:11,cursor:"pointer"}}>
          {(currentUser?.user_metadata?.name || currentUser?.email || "USER").split(" ")[0].toUpperCase()}
        </button>
      </div>

      <div style={{maxWidth:600,margin:"0 auto"}}>

        {view==="dashboard" && (
          <div style={{padding:16}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:2,color:"#888",marginBottom:14}}>DASHBOARD</div>
            {!hasSetup && (
              <div style={{...card,borderLeft:"3px solid #f7b731"}}>
                <div style={{color:"#f7b731",fontFamily:"'Bebas Neue',sans-serif",fontSize:16,marginBottom:4}}>SETUP REQUIRED</div>
                <div style={{color:"#555",fontSize:12,marginBottom:10}}>Enter your starting maxes to begin the program.</div>
                <button onClick={()=>setView("setup")} className="bn" style={{background:"#f7b731",color:"#000"}}>GO TO SETUP</button>
              </div>
            )}
            {nudgeLevel === 0 && (
              <div style={{...card,borderLeft:"3px solid #f7b731",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:"#f7b731",letterSpacing:1}}>LOG THIS WEEK'S WEIGHT</div>
                  <div style={{color:"#555",fontSize:11}}>Last: {latestWeight ? latestWeight+" lbs" : "never"}</div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <input type="number" value={weightEntry} placeholder="lbs" onFocus={e=>e.target.select()}
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
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"#f7b731",letterSpacing:1,marginBottom:4}}>YOUR BODY IS CHANGING</div>
                <div style={{color:"#aaa",fontSize:12,marginBottom:14}}>You're putting in the work — track the results. Log this week's weight to see how your body is responding to the program.</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input type="number" value={weightEntry} placeholder="lbs" onFocus={e=>e.target.select()}
                    onChange={e=>setWeightEntry(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&logWeightAndDismiss()}
                    style={{flex:1,color:"#f7b731",borderColor:"#f7b731"}} />
                  <button onClick={logWeightAndDismiss} className="bn" style={{background:"#f7b731",color:"#000"}}>LOG WEIGHT</button>
                  <button onClick={skipWeightNudge} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:18,padding:"0 4px"}}>×</button>
                </div>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
              {[{l:"SESSIONS",v:totalSessions,c:"#f0f0f0"},{l:"STREAK",v:streak+"🔥",c:"#f7b731"},{l:"BMI",v:bmi?String(bmi):"—",c:bmi?bmiCol(bmi):"#555"}].map(s=>(
                <div key={s.l} style={{...card,textAlign:"center",marginBottom:0}}>
                  <div style={{color:"#555",fontSize:9,marginBottom:4}}>{s.l}</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>

            <div style={{...card}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:"#888",marginBottom:10,letterSpacing:1}}>BODY STATS</div>
              <div style={{display:"flex",gap:20,flexWrap:"wrap",marginBottom:bodyStats.entries.length>1?12:0}}>
                {bodyStats.heightIn && (
                  <div>
                    <div style={{color:"#555",fontSize:10,marginBottom:2}}>HEIGHT</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"#aaa"}}>{Math.floor(+bodyStats.heightIn/12)}′{+bodyStats.heightIn%12}″</div>
                  </div>
                )}
                {latestWeight && (
                  <div>
                    <div style={{color:"#555",fontSize:10,marginBottom:2}}>WEIGHT</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"#06d6a0"}}>{latestWeight} lbs</div>
                  </div>
                )}
                {bmi && (
                  <div>
                    <div style={{color:"#555",fontSize:10,marginBottom:2}}>BMI</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:bmiCol(bmi)}}>{bmi} <span style={{fontSize:11}}>{bmiCat(bmi)}</span></div>
                  </div>
                )}
                {!bodyStats.heightIn && !latestWeight && (
                  <div style={{color:"#444",fontSize:11}}>Set up height & weight in PROGRAM setup</div>
                )}
              </div>
              {bodyStats.entries.length>0 && (()=>{
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
                    weeklyData.push({ d: "W"+(12-w), w: Math.round(avg*10)/10 });
                  }
                }
                if (weeklyData.length < 2) return null;
                return (
                  <ResponsiveContainer width="100%" height={90}>
                    <LineChart data={weeklyData}>
                      <XAxis dataKey="d" tick={{fill:"#555",fontSize:8}} />
                      <YAxis tick={{fill:"#555",fontSize:8}} domain={["auto","auto"]} />
                      <Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid #06d6a0",borderRadius:6,fontSize:11}} />
                      <Line type="monotone" dataKey="w" stroke="#06d6a0" strokeWidth={2} dot={{fill:"#06d6a0",r:3}} name="avg lbs" />
                    </LineChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>

            <div style={{...card}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:"#888",marginBottom:10,letterSpacing:1}}>CURRENT MAXES</div>
              {PRs.map(l=>(
                <div key={l.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #1a1a1a"}}>
                  <div>
                    <div style={{color:l.color,fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:1}}>{l.name}</div>
                    <div style={{color:"#555",fontSize:10}}>Week {liftWeeks[l.id]||1} · Started {l.startMax} lbs</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:l.color}}>{l.curMax} lbs</div>
                    {l.curMax>l.startMax && <div style={{color:"#06d6a0",fontSize:11}}>+{l.curMax-l.startMax} lbs</div>}
                  </div>
                </div>
              ))}
            </div>

            {sessionLedger[0] && (
              <div style={{...card,borderLeft:"3px solid "+(sessionLedger[0].liftColor||"#555")}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:"#888",marginBottom:8,letterSpacing:1}}>LAST SESSION</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{color:sessionLedger[0].liftColor,fontFamily:"'Bebas Neue',sans-serif",fontSize:18}}>{sessionLedger[0].liftName}</div>
                  <div style={{color:"#555",fontSize:11}}>{fmtDate(sessionLedger[0].date)} · Wk {sessionLedger[0].week}</div>
                </div>
                <div style={{color:"#555",fontSize:11}}>Vol: <span style={{color:"#f0f0f0"}}>{sessionLedger[0].volume?.toLocaleString()} lbs</span>{sessionLedger[0].estMax?<> · Est: <span style={{color:"#06d6a0"}}>{sessionLedger[0].estMax} lbs</span></>:""}</div>
                {sessionLedger[0].notes && <div style={{color:"#444",fontSize:11,marginTop:4,fontStyle:"italic"}}>"{sessionLedger[0].notes}"</div>}
              </div>
            )}

            {latestWeight && PRs.some(l=>l.curMax>0) && (
              <div style={{...card}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:"#888",marginBottom:8,letterSpacing:1}}>STRENGTH / BW RATIO</div>
                {PRs.filter(l=>l.curMax>0).map(l=>(
                  <div key={l.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #1a1a1a"}}>
                    <span style={{color:l.color,fontSize:12}}>{l.name}</span>
                    <span style={{color:"#aaa",fontSize:12}}>{(l.curMax/latestWeight).toFixed(2)}× bodyweight</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view==="setup" && (
          <div style={{padding:16}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:2,color:"#888",marginBottom:14}}>{hasSetup?"MY PROGRAM":"PROGRAM SETUP"}</div>

            {hasSetup && (
              <>
                <div style={{...card,borderLeft:"3px solid #06d6a0"}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:"#06d6a0",marginBottom:8}}>PROGRAM ACTIVE</div>
                  <div style={{color:"#555",fontSize:11,marginBottom:4}}>Started: <span style={{color:"#aaa"}}>{fmtDate(startDate)}</span></div>
                  {lifts.map(l=>(
                    <div key={l.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #1a1a1a"}}>
                      <span style={{color:l.color,fontFamily:"'Bebas Neue',sans-serif",fontSize:15}}>{l.name}</span>
                      <span style={{color:"#555",fontSize:11}}>Week {liftWeeks[l.id]||1} · {l.startingMax} lbs</span>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:20}}>
                  {!confirmStart && (
                  <button onClick={()=>setConfirmStart(true)} className="bigbtn" style={{background:"none",border:"1px solid #e85d04",color:"#e85d04"}}>START NEW 12-WEEK PROGRAM</button>
                )}
                {confirmStart && (
                  <div style={{background:"#0f0f1a",borderRadius:10,padding:16,marginTop:8,borderLeft:"3px solid #e85d04"}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"#e85d04",marginBottom:6,letterSpacing:1}}>⚠️ START NEW PROGRAM?</div>
                    <div style={{color:"#aaa",fontSize:12,marginBottom:14}}>Your current program will be archived. All workout history, progress and custom exercises will be saved. Enter your new starting maxes before confirming.</div>
                    <div style={{display:"flex",gap:8}}>
                      <button className="bigbtn" onClick={()=>{startNewProgram();setConfirmStart(false);}} style={{background:"#e85d04",color:"#000",flex:2,marginBottom:0}}>CONFIRM →</button>
                      <button className="bigbtn" onClick={()=>setConfirmStart(false)} style={{background:"none",border:"1px solid #555",color:"#555",flex:1,marginBottom:0}}>BACK</button>
                    </div>
                  </div>
                )}
                </div>
              </>
            )}

            {!hasSetup && (
              <>
                <div style={{...card,borderLeft:"3px solid #fff"}}>
                  <div style={{color:"#555",fontSize:10,marginBottom:6}}>PROGRAM START DATE</div>
                  <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{background:"transparent",border:"none",color:"#f0f0f0",fontSize:14,outline:"none",width:"100%"}} />
                </div>
                <div style={{...card,borderLeft:"3px solid #06d6a0"}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:"#06d6a0",marginBottom:10,letterSpacing:1}}>BODY STATS</div>
                  <div style={{display:"flex",gap:12,alignItems:"flex-end",flexWrap:"wrap"}}>
                    <div>
                      <div style={{color:"#555",fontSize:10,marginBottom:4}}>HEIGHT</div>
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        <input type="number" value={heightFtEntry||Math.floor(+bodyStats.heightIn/12)||""} placeholder="5" style={{width:44}} onChange={e=>setHeightFtEntry(e.target.value)} />
                        <span style={{color:"#555",fontSize:11}}>ft</span>
                        <input type="number" value={heightInEntry||(bodyStats.heightIn?(+bodyStats.heightIn%12):"")||""} placeholder="10" style={{width:44}} onChange={e=>setHeightInEntry(e.target.value)} />
                        <span style={{color:"#555",fontSize:11}}>in</span>
                      </div>
                    </div>
                    <div>
                      <div style={{color:"#555",fontSize:10,marginBottom:4}}>STARTING WEIGHT (lbs)</div>
                      <input type="number" value={weightEntry} placeholder="185" onChange={e=>setWeightEntry(e.target.value)} style={{width:80,color:"#06d6a0"}} />
                    </div>

                  </div>
                  {bodyStats.heightIn && latestWeight && (
                    <div style={{marginTop:10,color:"#555",fontSize:11}}>
                      Height: <span style={{color:"#aaa"}}>{Math.floor(+bodyStats.heightIn/12)}′{+bodyStats.heightIn%12}″</span>
                      {"  ·  "}Weight: <span style={{color:"#06d6a0"}}>{latestWeight} lbs</span>
                      {bmi && <>{" · "}BMI: <span style={{color:bmiCol(bmi)}}>{bmi} ({bmiCat(bmi)})</span></>}
                    </div>
                  )}
                </div>

                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:1}}>YOUR LIFTS</div>
                  <button onClick={addLift} className="bn" style={{background:"#1a1a2e",border:"1px solid #555",color:"#aaa",fontSize:13,padding:"4px 10px"}}>+ ADD LIFT</button>
                </div>
            {lifts.map(l=>{
              const cur=l.startingMax?calcCurrentMax(l.startingMax):null;
              const wkts=cur?calcWorkingWeights(cur):null;
              return (
                <div key={l.id} style={{...card,borderLeft:"3px solid "+l.color}}>
                  <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
                    <div style={{flex:1}}>
                      <select value={l.mainLiftOption||"Bench"} onChange={e=>{const v=e.target.value;updateLift(l.id,"mainLiftOption",v);if(v==="Custom")updateLift(l.id,"name","");else updateLift(l.id,"name",v);}} style={{width:"100%",background:"transparent",border:"none",borderBottom:"1px solid "+l.color+"66",color:l.color,fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:1,padding:"2px 0",cursor:"pointer",marginBottom:6}}>
                        {MAIN_LIFT_OPTIONS.map(o=><option key={o} value={o} style={{background:"#1a1a2e",fontFamily:"sans-serif",fontSize:14}}>{o}</option>)}
                      </select>
                      {l.mainLiftOption==="Custom" && <input type="text" value={l.name} placeholder="Type lift name..." onChange={e=>updateLift(l.id,"name",e.target.value)} style={{width:"100%",background:"transparent",border:"none",borderBottom:"1px solid "+l.color+"44",color:l.color,fontFamily:"'Bebas Neue',sans-serif",fontSize:15,padding:"2px 0",outline:"none",marginBottom:6}} />}
                      <div style={{display:"flex",gap:6}}>
                        {["UPPER","LOWER"].map(t=><button key={t} onClick={()=>updateLift(l.id,"isLower",t==="LOWER")} style={{background:(t==="LOWER")===l.isLower?l.color:"#111",color:(t==="LOWER")===l.isLower?"#000":"#555",border:"1px solid "+((t==="LOWER")===l.isLower?l.color:"#333"),borderRadius:3,padding:"2px 8px",fontSize:10,cursor:"pointer"}}>{t}</button>)}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <input type="number" value={l.startingMax||""} placeholder="0" style={{width:80,fontSize:18,fontFamily:"'Bebas Neue',sans-serif",borderColor:l.color,color:l.color,textAlign:"center"}} onChange={e=>updateLift(l.id,"startingMax",+e.target.value||0)} />
                      <span style={{color:"#555",fontSize:11}}>{l.mainLiftOption==="Assisted Pull Up"?"lbs assist":"lbs"}</span>
                      {lifts.length>1 && <button onClick={()=>removeLift(l.id)} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:18,padding:"0 4px"}}>×</button>}
                    </div>
                  </div>
                  {cur && <div style={{color:"#555",fontSize:11,marginBottom:8}}>Training at: <span style={{color:l.color}}>{cur} lbs</span>{"  "}<button onClick={()=>setPreviewLift(previewLift===l.id?null:l.id)} style={{background:"none",border:"1px solid "+l.color,color:l.color,borderRadius:3,padding:"1px 7px",fontSize:10,cursor:"pointer"}}>{previewLift===l.id?"hide":"preview"}</button></div>}
                  {previewLift===l.id && wkts && (
                    <div style={{background:"#0a0a0f",borderRadius:6,padding:"10px 12px",marginBottom:10}}>
                      {wkts.map((w,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"1px solid #1a1a1a",fontSize:12}}><span style={{color:"#555"}}>Set {i+1}</span><span style={{color:l.color}}>{w} lbs</span><span style={{color:"#444"}}>{i<3?"× 10":"max reps"}</span></div>)}
                    </div>
                  )}
                  <div style={{color:"#555",fontSize:10,marginBottom:5}}>TRAINING DAYS</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>{const sel=(l.trainingDays||[]).includes(d);return <button key={d} onClick={()=>updateLift(l.id,"trainingDays",sel?l.trainingDays.filter(x=>x!==d):[...(l.trainingDays||[]),d])} style={{background:sel?l.color:"#111",color:sel?"#000":"#555",border:"1px solid "+(sel?l.color:"#333"),borderRadius:4,padding:"3px 8px",fontSize:11,cursor:"pointer",transition:"all 0.15s"}}>{d}</button>;})}
                  </div>
                </div>
              );
            })}
            {"Notification" in window && Notification.permission!=="granted" && (
              <div style={{...card,borderLeft:"3px solid #f7b731",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:"#f7b731"}}>TRAINING REMINDERS</div><div style={{color:"#555",fontSize:11}}>Get hyped on your training days</div></div>
                <button onClick={()=>Notification.requestPermission()} className="bn" style={{background:"#f7b731",color:"#000",fontSize:13,padding:"5px 12px"}}>ENABLE</button>
              </div>
            )}
                {/* Show checklist of what's still needed */}
                {!readyToStart && !hasSetup && startDate && (
                  <div style={{...card,borderLeft:"3px solid #555",marginTop:8}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,color:"#555",marginBottom:8,letterSpacing:1}}>COMPLETE TO START:</div>
                    {lifts.some(l=>!l.startingMax) && <div style={{color:"#555",fontSize:11,marginBottom:4}}>⬜ Enter starting max for all lifts</div>}
                    {lifts.some(l=>!(l.trainingDays||[]).length) && <div style={{color:"#555",fontSize:11,marginBottom:4}}>⬜ Select training days for all lifts</div>}
                    {!heightFtEntry && !bodyStats.heightIn && <div style={{color:"#555",fontSize:11,marginBottom:4}}>⬜ Enter your height</div>}
                    {!weightEntry && <div style={{color:"#555",fontSize:11,marginBottom:4}}>⬜ Enter your starting weight</div>}
                  </div>
                )}
                {readyToStart && !hasSetup && (
                  <>
                    {!confirmStart && (
                      <div style={{...card,borderLeft:"3px solid #06d6a0",marginTop:8}}>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:"#06d6a0",marginBottom:4,letterSpacing:1}}>✅ READY TO GO</div>
                        <div style={{color:"#555",fontSize:11,marginBottom:12}}>All lifts configured. Review your maxes above then confirm to lock them in.</div>
                        {lifts.map(l=>(
                          <div key={l.id} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #1a1a1a",fontSize:12}}>
                            <span style={{color:l.color,fontFamily:"'Bebas Neue',sans-serif"}}>{l.name}</span>
                            <span style={{color:"#aaa"}}>{calcCurrentMax(l.startingMax)} lbs training max</span>
                          </div>
                        ))}
                        <button className="bigbtn" onClick={()=>setConfirmStart(true)} style={{background:"#06d6a0",color:"#000",marginTop:14,marginBottom:0}}>CONFIRM & START PROGRAM →</button>
                      </div>
                    )}
                    {confirmStart && (
                      <div style={{background:"#0f0f1a",borderRadius:10,padding:16,marginTop:8,borderLeft:"3px solid #06d6a0"}}>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"#06d6a0",marginBottom:6,letterSpacing:1}}>LAST CHANCE!</div>
                        <div style={{color:"#aaa",fontSize:12,marginBottom:14}}>
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
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:"#555",letterSpacing:1,marginBottom:10}}>PROGRAM HISTORY</div>
                {programHistory.map((p,i)=>(
                  <div key={i} style={{...card,borderLeft:"3px solid #333"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,color:"#555"}}>PROGRAM {programHistory.length-i} · {fmtDate(p.startDate)} → {fmtDate(p.endDate)}</div>
                      <button onClick={()=>{if(window.confirm("Delete this program from history?"))setProgramHistory(prev=>prev.filter((_,j)=>j!==i));}} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:16,padding:"0 4px"}}>×</button>
                    </div>
                    {(p.lifts||[]).map(l=>{const sm=calcCurrentMax(l.startingMax||0);const fm=p.finalMaxes?.[l.id]||0;return(<div key={l.id} style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#555",padding:"2px 0"}}><span style={{color:l.color}}>{l.name}</span><span>{sm} → {fm} lbs{fm>sm?<span style={{color:"#06d6a0"}}> (+{fm-sm})</span>:""}</span></div>);})}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view==="workout" && (
          <>
            <div style={{padding:"8px 16px",display:"flex",gap:8,borderBottom:"1px solid #1a1a1a",flexWrap:"wrap"}}>
              {lifts.map(l=>(
                <div key={l.id} style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:activeId===l.id?l.color:"#333",letterSpacing:1}}>{l.name}</span>
                  <span style={{background:activeId===l.id?l.color:"#1a1a2e",color:activeId===l.id?"#000":"#444",borderRadius:3,padding:"1px 5px",fontFamily:"'Bebas Neue',sans-serif",fontSize:11}}>W{liftWeeks[l.id]||1}</span>
                </div>
              ))}
            </div>
            <div style={{padding:"10px 16px",display:"flex",gap:6,flexWrap:"wrap",borderBottom:"1px solid #1a1a1a"}}>
              {lifts.map(l=>{const done=completedDays?.[liftWeeks[l.id]]?.[l.id];return <button key={l.id} className="bn" onClick={()=>switchLift(l.id)} style={{background:activeId===l.id?l.color:"#1a1a2e",color:activeId===l.id?"#000":l.color,border:"1px solid "+l.color,opacity:done&&activeId!==l.id?0.5:1}}>{l.name}{done?" ✓":""}</button>;})}
            </div>
            <div style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid #1a1a1a"}}>
              <button onClick={()=>navigateWeek(-1)} disabled={viewingWeek<=1} style={{background:"#1a1a2e",border:"1px solid #333",color:viewingWeek<=1?"#333":"#aaa",borderRadius:4,width:32,height:32,cursor:viewingWeek<=1?"default":"pointer",fontSize:18}}>‹</button>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:lift.color,minWidth:80,textAlign:"center"}}>
                WEEK {viewingWeek}{isPastWeek&&<div style={{color:"#555",fontSize:10,fontFamily:"'DM Mono',monospace"}}>current: w{activeLiftWeek}</div>}
              </div>
              <button onClick={()=>navigateWeek(1)} disabled={viewingWeek>=activeLiftWeek} style={{background:"#1a1a2e",border:"1px solid #333",color:viewingWeek>=activeLiftWeek?"#333":"#aaa",borderRadius:4,width:32,height:32,cursor:viewingWeek>=activeLiftWeek?"default":"pointer",fontSize:18}}>›</button>
              {isPastWeek && (
                <>
                  <button onClick={()=>{setViewingWeek(activeLiftWeek);setEditingPastWeek(false);}} style={{background:"none",border:"1px solid "+lift.color,color:lift.color,borderRadius:4,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>current</button>
                  <button onClick={()=>setEditingPastWeek(e=>!e)} style={{background:editingPastWeek?"#2e1a1a":"#1a1a2e",border:"1px solid "+(editingPastWeek?"#e85d04":"#555"),color:editingPastWeek?"#e85d04":"#aaa",borderRadius:4,padding:"4px 10px",fontFamily:"'Bebas Neue',sans-serif",fontSize:13,cursor:"pointer"}}>{editingPastWeek?"CANCEL":"EDIT"}</button>
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
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:x.c}}>{x.v} <span style={{fontSize:9,color:"#555"}}>lbs</span></div>
                  </div>
                ))}
              </div>

              <div style={{...card,display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                <div style={{textAlign:"center",minWidth:64}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:restRunning?"#f7b731":restTimer===0?"#06d6a0":"#f0f0f0",lineHeight:1}}>
                    {restTimer!==null?`${Math.floor(restTimer/60)}:${String(restTimer%60).padStart(2,"0")}`:restDuration+"s"}
                  </div>
                  <div style={{color:"#555",fontSize:9}}>REST</div>
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {[60,90,120,180].map(s=><button key={s} onClick={()=>{setRestDuration(s);setRestTimer(s);setRestRunning(false);}} style={{background:restDuration===s?"#1a1a2e":"#111",border:"1px solid "+(restDuration===s?"#555":"#222"),color:restDuration===s?"#aaa":"#444",borderRadius:4,padding:"3px 7px",fontSize:10,cursor:"pointer"}}>{s}s</button>)}
                  <button onClick={()=>{setRestTimer(restDuration);setRestRunning(true);}} style={{background:"#f7b731",border:"none",color:"#000",borderRadius:4,padding:"4px 10px",fontFamily:"'Bebas Neue',sans-serif",fontSize:13,cursor:"pointer"}}>GO</button>
                  <button onClick={()=>{setRestTimer(null);setRestRunning(false);}} style={{background:"none",border:"1px solid #333",color:"#555",borderRadius:4,padding:"4px 8px",fontSize:10,cursor:"pointer"}}>RST</button>
                </div>
              </div>

              <div style={{marginBottom:20}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:19,letterSpacing:2,color:lift.color,marginBottom:10}}>{lift.name} — MAIN SETS</div>
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
                              style={{background:"#0f0f1a",border:"2px solid "+lift.color,color:lift.color,borderRadius:"8px 0 0 8px",width:48,height:48,cursor:"pointer",fontSize:24,fontWeight:"bold",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                            <div style={{background:"#1a1a2e",borderTop:"2px solid "+lift.color,borderBottom:"2px solid "+lift.color,color:lift.color,width:64,height:48,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:28}}>{getReps(week,activeId,i)}</div>
                            <button onClick={()=>setReps(week,activeId,i,String(+(getReps(week,activeId,i)||10)+1))}
                              style={{background:"#0f0f1a",border:"2px solid "+lift.color,color:lift.color,borderRadius:"0 8px 8px 0",width:48,height:48,cursor:"pointer",fontSize:24,fontWeight:"bold",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                          </div>
                    }
                  </div>
                ))}
              </div>

              <div style={{marginBottom:20}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:19,letterSpacing:2,color:"#888",marginBottom:10}}>ACCESSORIES</div>
                {!isReadOnly && (
                  <div style={{marginBottom:12}}>
                    <div style={{display:"flex",gap:8,marginBottom:selectedAcc[activeId]==="__custom__"?8:0}}>
                      <select style={{flex:1}} value={selectedAcc[activeId]||""} onChange={e=>setSelectedAcc(prev=>({...prev,[activeId]:e.target.value}))}>
                        <option value="">— Select exercise —</option>
                        {(ACCESSORIES_BY_LIFT[lift?.mainLiftOption]||ACCESSORIES_BY_LIFT["Custom"]).map(a=><option key={a} value={a}>{a}</option>)}
                        {(customAccessories[lift?.mainLiftOption]||[]).map(a=><option key={a} value={a}>{a}</option>)}
                        <option value="__custom__">✏️ Custom...</option>
                      </select>
                      {selectedAcc[activeId]&&selectedAcc[activeId]!=="__custom__"&&<button onClick={()=>{addAcc(week,activeId,selectedAcc[activeId]);setSelectedAcc(prev=>({...prev,[activeId]:""}));}} className="bn" style={{background:lift.color,color:"#000",fontSize:13,padding:"4px 10px"}}>+ ADD</button>}
                    </div>
                    {selectedAcc[activeId]==="__custom__" && (
                      <div style={{display:"flex",gap:8}}>
                        <input type="text" value={customAccInput[activeId]||""} placeholder="Exercise name..." autoFocus onChange={e=>setCustomAccInput(prev=>({...prev,[activeId]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter"){const n=customAccInput[activeId]?.trim();if(!n)return;addAcc(week,activeId,n);const k=lift?.mainLiftOption||"Custom";setCustomAccessories(prev=>({...prev,[k]:[...new Set([...(prev[k]||[]),n])]}));setCustomAccInput(prev=>({...prev,[activeId]:""}));setSelectedAcc(prev=>({...prev,[activeId]:""}));}}} style={{flex:1,borderColor:lift.color,color:lift.color}} />
                        <button onClick={()=>{const n=customAccInput[activeId]?.trim();if(!n)return;addAcc(week,activeId,n);const k=lift?.mainLiftOption||"Custom";setCustomAccessories(prev=>({...prev,[k]:[...new Set([...(prev[k]||[]),n])]}));setCustomAccInput(prev=>({...prev,[activeId]:""}));setSelectedAcc(prev=>({...prev,[activeId]:""}));}} className="bn" style={{background:lift.color,color:"#000",fontSize:13,padding:"4px 10px"}}>+ ADD</button>
                      </div>
                    )}
                  </div>
                )}
                {getAccList(week,activeId).length===0&&<div style={{color:"#333",fontSize:12,textAlign:"center",padding:"12px 0"}}>No accessories added</div>}
                {getAccList(week,activeId).map(acc=>{
                  const adj=weightAdjust?.[week]?.[activeId]?.[acc.id];
                  return (
                    <div key={acc.id} style={{padding:"10px 0",borderBottom:"1px solid #161616"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <div style={{color:"#ccc",fontSize:12}}>{acc.name}</div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{color:"#555",fontSize:11,fontFamily:"'Bebas Neue',sans-serif"}}>3 × 10</span>
                          {!isReadOnly&&<button onClick={()=>removeAcc(week,activeId,acc.id)} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:15,padding:0}}>×</button>}
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <input type="number" value={acc.weight} placeholder="lbs" readOnly={isReadOnly} onFocus={e=>e.target.select()} style={{color:lift.color,borderColor:lift.color}} onChange={e=>!isReadOnly&&updateAcc(week,activeId,acc.id,"weight",e.target.value)} />
                        <span style={{color:"#555",fontSize:11}}>lbs</span>
                        <input type="number" value={acc.reps} readOnly={isReadOnly} onFocus={e=>e.target.select()} style={{width:56,color:lift.color,borderColor:lift.color}} onChange={e=>!isReadOnly&&updateAcc(week,activeId,acc.id,"reps",e.target.value)} />
                        <span style={{color:"#555",fontSize:11}}>reps</span>
                        {!isReadOnly&&(
                          <div style={{marginLeft:"auto",display:"flex",gap:4}}>
                            <button onClick={()=>setAdj(acc.id,"up")} style={{background:adj==="up"?"#06d6a0":"#0f0f1a",border:"1px solid "+(adj==="down"?"#222":"#06d6a0"),color:adj==="up"?"#000":adj==="down"?"#333":"#06d6a0",borderRadius:4,width:32,height:32,cursor:"pointer",fontSize:18,fontWeight:"bold",transition:"all 0.15s"}}>+</button>
                            <button onClick={()=>setAdj(acc.id,"down")} style={{background:adj==="down"?"#e85d04":"#0f0f1a",border:"1px solid "+(adj==="up"?"#222":"#e85d04"),color:adj==="down"?"#000":adj==="up"?"#333":"#e85d04",borderRadius:4,width:32,height:32,cursor:"pointer",fontSize:18,fontWeight:"bold",transition:"all 0.15s"}}>−</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isReadOnly && (
                <div style={{marginBottom:14}}>
                  <div style={{color:"#555",fontSize:10,marginBottom:6}}>SESSION NOTES</div>
                  <textarea value={sessionNotes} rows={3} placeholder="How did it feel? Any PRs or notes..." onChange={e=>setSessionNotes(e.target.value)} />
                </div>
              )}

              {isPastWeek&&editingPastWeek&&<button className="bigbtn" onClick={()=>setEditingPastWeek(false)} style={{background:lift.color,color:"#000"}}>SAVE CHANGES</button>}
              {!isPastWeek && (
                <>
                  <button className="bigbtn" onClick={finishDay} style={{background:isDayDone?"#0f0f1a":lift.color,color:isDayDone?lift.color:"#000",border:isDayDone?"1px solid "+lift.color:"none"}}>
                    {isDayDone?"✓ DAY COMPLETE":"FINISH DAY"}
                  </button>
                  {willProgress&&!isDayDone&&!isAssisted&&<div style={{textAlign:"center",color:"#06d6a0",fontSize:12}}>🔥 Next week's max: {nextMax} lbs</div>}
                  {willProgress&&!isDayDone&&isAssisted&&nextMax>0&&<div style={{textAlign:"center",color:"#06d6a0",fontSize:12}}>💪 Next week: {nextMax} lbs assistance — getting closer!</div>}
                  {willProgress&&!isDayDone&&isAssisted&&nextMax===0&&<div style={{textAlign:"center",color:"#f7b731",fontSize:13,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1}}>🎉 UNASSISTED NEXT WEEK! YOU DID IT!</div>}
                  {!isDayDone&&isAssisted&&effMax===0&&<div style={{textAlign:"center",color:"#f7b731",fontSize:12,marginTop:8}}>🏆 You're doing unassisted pullups! Consider switching to Weighted Pull Up.</div>}
                </>
              )}
            </div>
          </>
        )}

        {view==="progress" && (
          <div style={{padding:16}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:2,color:"#888",marginBottom:14}}>PROGRESS</div>
            {lifts.map(l=>{
              const startMax=calcCurrentMax(l.startingMax||0);
              const curMax=getEffMax(l.id,liftWeeks[l.id]||1);
              const maxData=[{w:"Start",max:startMax},...Array.from({length:12},(_,i)=>({w:`W${i+1}`,max:getEffMax(l.id,i+1)}))];
              const volData=sessionLedger.filter(s=>s.liftId===l.id).slice(0,10).reverse().map(s=>({d:fmtDate(s.date),v:Math.round((s.volume||0)/1000)}));
              // For assisted pullups, build effective pull strength data
              const effPullData = isAssistedPullUp(l) ? (() => {
                let assist = l.startingMax || 0;
                const data = [];
                for (let w = 1; w <= (liftWeeks[l.id]||1); w++) {
                  const bwEntry = bodyStats.entries.find(e => {
                    const log = logs?.[w]?.[l.id]?.[3];
                    return log && e.date <= (log.date || todayISO());
                  });
                  const bw = bwEntry?.weightLbs || latestWeight || 0;
                  if (bw) data.push({ w: `W${w}`, pull: bw - assist });
                  const log = logs?.[w]?.[l.id]?.[3];
                  if (log?.reps) assist = calcNextAssistedMax(assist, +log.reps);
                }
                return data;
              })() : [];
              return (
                <div key={l.id} style={{...card,borderLeft:"3px solid "+l.color}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:l.color,marginBottom:2}}>{l.name}</div>
                  <div style={{color:"#555",fontSize:11,marginBottom:10}}>
                    {isAssistedPullUp(l)
                      ? <>
                          Start: <span style={{color:"#aaa"}}>{l.startingMax} lbs assist</span>{"  →  "}
                          Week {liftWeeks[l.id]||1}: <span style={{color:l.color}}>{curMax === 0 ? "UNASSISTED! 🎉" : curMax+" lbs assist"}</span>
                          {latestWeight && curMax > 0 && <span style={{color:"#06d6a0"}}> · Pulling {latestWeight - curMax} lbs</span>}
                          {latestWeight && curMax === 0 && <span style={{color:"#f7b731"}}> · Full {latestWeight} lbs!</span>}
                        </>
                      : <>Start: <span style={{color:"#aaa"}}>{startMax} lbs</span>{"  →  "}Week {liftWeeks[l.id]||1}: <span style={{color:l.color}}>{curMax} lbs</span>{curMax>startMax&&<span style={{color:"#06d6a0"}}> (+{curMax-startMax})</span>}</>
                    }
                  </div>
                  <div style={{color:"#555",fontSize:10,marginBottom:4}}>MAX PROGRESSION</div>
                  <ResponsiveContainer width="100%" height={110}>
                    <LineChart data={maxData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" /><XAxis dataKey="w" tick={{fill:"#555",fontSize:9}} /><YAxis tick={{fill:"#555",fontSize:9}} domain={["auto","auto"]} />
                      <Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid "+l.color,borderRadius:6,fontSize:11}} />
                      <ReferenceLine y={startMax} stroke="#333" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="max" stroke={l.color} strokeWidth={2} dot={{fill:l.color,r:3}} name="Max" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                  {isAssistedPullUp(l) && effPullData.length>1 && (
                    <>
                      <div style={{color:"#555",fontSize:10,marginTop:10,marginBottom:4}}>EFFECTIVE PULL STRENGTH (lbs)</div>
                      <ResponsiveContainer width="100%" height={80}>
                        <LineChart data={effPullData}>
                          <XAxis dataKey="w" tick={{fill:"#555",fontSize:8}} />
                          <YAxis tick={{fill:"#555",fontSize:8}} domain={["auto","auto"]} />
                          <Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid "+l.color,borderRadius:6,fontSize:11}} />
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
                        <BarChart data={volData}><XAxis dataKey="d" tick={{fill:"#555",fontSize:8}} /><YAxis tick={{fill:"#555",fontSize:8}} /><Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid "+l.color,borderRadius:6,fontSize:11}} /><Bar dataKey="v" fill={l.color} radius={[3,3,0,0]} name="Vol(k)" /></BarChart>
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
                  weeklyData.push({ d: "W" + (12-w), w: Math.round(avg * 10) / 10 });
                }
              }
              if (weeklyData.length < 2) return null;
              return (
                <div style={{...card}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"#06d6a0",marginBottom:4}}>BODYWEIGHT</div>
                  <div style={{color:"#555",fontSize:10,marginBottom:10}}>12-WEEK WEEKLY AVERAGE</div>
                  <ResponsiveContainer width="100%" height={110}>
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                      <XAxis dataKey="d" tick={{fill:"#555",fontSize:9}} />
                      <YAxis tick={{fill:"#555",fontSize:9}} domain={["auto","auto"]} />
                      <Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid #06d6a0",borderRadius:6,fontSize:11}} />
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
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:2,color:"#888",marginBottom:14}}>WORKOUT LEDGER</div>
            {sessionLedger.length===0&&<div style={{color:"#333",fontSize:13,textAlign:"center",padding:40}}>No sessions logged yet</div>}
            {sessionLedger.map((s,i)=>(
              <div key={i} style={{...card,borderLeft:"3px solid "+(s.liftColor||"#555")}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,color:s.liftColor||"#f0f0f0"}}>{s.liftName}</div>
                  <div style={{color:"#555",fontSize:11}}>{fmtDate(s.date)} · Wk {s.week}</div>
                </div>
                <div style={{display:"flex",gap:14,marginBottom:6,flexWrap:"wrap"}}>
                  {s.sets?.map((set,j)=>(
                    <div key={j} style={{textAlign:"center"}}>
                      <div style={{color:"#555",fontSize:9}}>SET {j+1}</div>
                      <div style={{color:s.liftColor,fontFamily:"'Bebas Neue',sans-serif",fontSize:14}}>{set.weight}</div>
                      <div style={{color:"#555",fontSize:10}}>×{set.reps}</div>
                    </div>
                  ))}
                </div>
                <div style={{color:"#555",fontSize:11}}>
                  Vol: <span style={{color:"#aaa"}}>{s.volume?.toLocaleString()} lbs</span>
                  {s.estMax&&<> · Est: <span style={{color:"#06d6a0"}}>{s.estMax} lbs</span></>}
                </div>
                {s.accessories?.length>0&&<div style={{color:"#444",fontSize:10,marginTop:3}}>+ {s.accessories.length} accessories</div>}
                {s.notes&&<div style={{color:"#555",fontSize:11,marginTop:5,fontStyle:"italic"}}>"{s.notes}"</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0a0a0f",borderTop:"1px solid #1a1a1a",display:"flex",zIndex:10,padding:"4px"}}>
        {[
          {id:"dashboard", label:"HOME", color:"#e85d04", svg:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>},
          {id:"workout",   label:"LIFT",     color:"#3a86ff", svg:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="12" x2="18" y2="12"/><circle cx="4" cy="12" r="2"/><circle cx="20" cy="12" r="2"/><rect x="7" y="8" width="2" height="8" rx="1"/><rect x="15" y="8" width="2" height="8" rx="1"/></svg>},
          {id:"progress",  label:"PROGRESS", color:"#8338ec", svg:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>},
          {id:"ledger",    label:"LEDGER",   color:"#06d6a0", svg:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>},
          {id:"social",    label:"SOCIAL",   color:"#ff006e", svg:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>},
          {id:"setup",     label:hasSetup?"PROGRAM":"SETUP", color:"#f7b731", svg:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>},
        ].map(t=>(
          <button key={t.id} onClick={()=>t.id==="social"?setShowSocial(true):setView(t.id)} style={{flex:1,background:"none",border:"none",padding:"8px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",color:view===t.id||( t.id==="social"&&showSocial)?t.color:"#444",position:"relative"}}>
            {t.svg}
            <span style={{fontSize:9,letterSpacing:1,fontFamily:"'DM Mono',monospace"}}>{t.label}</span>
            <div style={{width:4,height:4,borderRadius:"50%",background:view===t.id||( t.id==="social"&&showSocial)?t.color:"transparent"}}></div>
            {t.id==="social" && (friendRequests.length + newReactionCount) > 0 && (
              <span style={{position:"absolute",top:4,right:"15%",background:"#e85d04",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono',monospace"}}>{friendRequests.length + newReactionCount}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
