import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar } from "recharts";

const COLORS = ["#e85d04","#3a86ff","#8338ec","#06d6a0","#f7b731","#ff006e","#00b4d8","#80b918"];
const MAIN_LIFT_OPTIONS = ["Bench","Deadlift","Military Press","Squat","Weighted Pull Up","Hip Thrust","Custom"];
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
  "Custom":          ["Incline Bench","Pullups","Lat Pull-Down","Dumbbell Row","Dumbbell Curls","Arnold Press","Front Raises","Lateral Raises","Face Pulls","Romanian Deadlift","Leg Extension","Calf Raises","Hip Thrust","Leg Press","Ab Roller","Farmers Walk","Shrugs"],
};
const HYPE = ["Time to move some weight!","Let's get after it!","No excuses. Let's go!","Your future self will thank you.","The bar is waiting.","Stronger than last week. Prove it."];
const DAY_ABBR = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const ROOT_KEY = "barnone_v5";

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

async function hashPw(pw) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw+"bn_salt_2025"));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
const getUsers = () => { try { return JSON.parse(localStorage.getItem(ROOT_KEY+"_users")||"[]"); } catch { return []; } };
const saveUsers = u => { try { localStorage.setItem(ROOT_KEY+"_users", JSON.stringify(u)); } catch {} };
const getSession = () => localStorage.getItem(ROOT_KEY+"_session") || null;
const setSession = id => id ? localStorage.setItem(ROOT_KEY+"_session",id) : localStorage.removeItem(ROOT_KEY+"_session");
const loadUD = id => { try { const r=localStorage.getItem(ROOT_KEY+"_d_"+id); return r?JSON.parse(r):null; } catch { return null; } };
const saveUD = (id,d) => { try { localStorage.setItem(ROOT_KEY+"_d_"+id, JSON.stringify(d)); } catch {} };

export default function App() {
  const [users, setUsers] = useState(getUsers());
  const [uid, setUid] = useState(getSession());
  const [authScreen, setAuthScreen] = useState(!getSession() ? "login" : null);
  const [authForm, setAuthForm] = useState({ name:"", email:"", password:"", confirm:"" });
  const [authErr, setAuthErr] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const saved = uid ? loadUD(uid) : null;
  const [lifts, setLifts] = useState(saved?.lifts || DEFAULT_LIFTS);
  const [startDate, setStartDate] = useState(saved?.startDate || "");
  const [activeId, setActiveId] = useState(saved?.activeId || DEFAULT_LIFTS[0].id);
  const [view, setView] = useState("dashboard");
  const [logs, setLogs] = useState(saved?.logs || {});
  const [completedDays, setCompletedDays] = useState(saved?.completedDays || {});
  const [accList, setAccList] = useState(saved?.accList || {});
  const [exerciseHistory, setExerciseHistory] = useState(saved?.exerciseHistory || {});
  const [weightAdjust, setWeightAdjust] = useState(saved?.weightAdjust || {});
  const [liftWeeks, setLiftWeeks] = useState(saved?.liftWeeks || Object.fromEntries(DEFAULT_LIFTS.map(l=>[l.id,1])));
  const [customAccessories, setCustomAccessories] = useState(saved?.customAccessories || {});
  const [sessionLedger, setSessionLedger] = useState(saved?.sessionLedger || []);
  const [bodyStats, setBodyStats] = useState(saved?.bodyStats || { heightIn:"", entries:[] });
  const [programHistory, setProgramHistory] = useState(saved?.programHistory || []);
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
  const timerRef = useRef(null);

  const hasSetup = lifts.every(l=>l.startingMax>0) && startDate;
  const currentUser = users.find(u=>u.id===uid);

  useEffect(() => {
    if (!uid) return;
    saveUD(uid, { lifts, startDate, activeId, logs, completedDays, accList, exerciseHistory, weightAdjust, liftWeeks, customAccessories, sessionLedger, bodyStats, programHistory });
  }, [lifts,startDate,activeId,logs,completedDays,accList,exerciseHistory,weightAdjust,liftWeeks,customAccessories,sessionLedger,bodyStats,programHistory,uid]);

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

  function loadUserIntoState(id) {
    const d = loadUD(id);
    setLifts(d?.lifts || DEFAULT_LIFTS);
    setStartDate(d?.startDate || "");
    setActiveId(d?.activeId || DEFAULT_LIFTS[0].id);
    setLogs(d?.logs || {});
    setCompletedDays(d?.completedDays || {});
    setAccList(d?.accList || {});
    setExerciseHistory(d?.exerciseHistory || {});
    setWeightAdjust(d?.weightAdjust || {});
    setLiftWeeks(d?.liftWeeks || Object.fromEntries(DEFAULT_LIFTS.map(l=>[l.id,1])));
    setCustomAccessories(d?.customAccessories || {});
    setSessionLedger(d?.sessionLedger || []);
    setBodyStats(d?.bodyStats || { heightIn:"", entries:[] });
    setProgramHistory(d?.programHistory || []);
    setView("dashboard");
  }

  async function handleRegister() {
    setAuthErr("");
    const { name, email, password, confirm } = authForm;
    if (!name.trim()||!email.trim()||!password) { setAuthErr("All fields required."); return; }
    if (!email.includes("@")) { setAuthErr("Enter a valid email."); return; }
    if (password.length < 6) { setAuthErr("Password must be 6+ characters."); return; }
    if (password !== confirm) { setAuthErr("Passwords don't match."); return; }
    if (users.find(u=>u.email.toLowerCase()===email.toLowerCase())) { setAuthErr("Email already registered."); return; }
    const hash = await hashPw(password);
    const id = "u_"+Date.now();
    const updated = [...users, { id, name:name.trim(), email:email.trim().toLowerCase(), hash }];
    setUsers(updated); saveUsers(updated);
    setUid(id); setSession(id);
    loadUserIntoState(id);
    setAuthScreen(null);
    setAuthForm({ name:"", email:"", password:"", confirm:"" });
  }

  async function handleLogin() {
    setAuthErr("");
    const { email, password } = authForm;
    if (!email||!password) { setAuthErr("Email and password required."); return; }
    const user = users.find(u=>u.email.toLowerCase()===email.toLowerCase());
    if (!user) { setAuthErr("No account found."); return; }
    const hash = await hashPw(password);
    if (hash !== user.hash) { setAuthErr("Incorrect password."); return; }
    setUid(user.id);
    if (rememberMe) setSession(user.id);
    loadUserIntoState(user.id);
    setAuthScreen(null);
    setAuthForm({ name:"", email:"", password:"", confirm:"" });
  }

  function handleLogout() { setSession(null); setUid(null); setAuthScreen("login"); setShowProfile(false); }

  function getEffMax(liftId, targetWeek) {
    const lift = lifts.find(l=>l.id===liftId);
    if (!lift) return 0;
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
  const weights = calcWorkingWeights(effMax);
  const set4Reps = logs?.[week]?.[activeId]?.[3]?.reps ?? "10";
  const sessionEstMax = +set4Reps>10 ? calcEstMax(weights[3],+set4Reps) : null;
  const nextMax = calcNextMax(effMax, sessionEstMax, lift?.isLower);
  const willProgress = nextMax > effMax;
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
    setSessionNotes("");
    setCompletedDays(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[week])n[week]={};n[week][activeId]=true;return n;});
    const nw=Math.min(12,activeLiftWeek+1);
    setLiftWeeks(prev=>({...prev,[activeId]:nw}));
    setViewingWeek(nw);
  }

  function startNewProgram() {
    const archive={startDate,lifts,endDate:todayISO(),finalMaxes:Object.fromEntries(lifts.map(l=>[l.id,getEffMax(l.id,liftWeeks[l.id]||1)]))};
    setProgramHistory(prev=>[archive,...prev]);
    const nl=lifts.map(l=>({...l,startingMax:0,trainingDays:[]}));
    setLifts(nl);setStartDate("");setLogs({});setCompletedDays({});setAccList({});setWeightAdjust({});
    setLiftWeeks(Object.fromEntries(nl.map(l=>[l.id,1])));setActiveId(nl[0].id);setViewingWeek(1);setView("setup");
  }

  function addWeightEntry() {
    if(!weightEntry)return;
    setBodyStats(prev=>({...prev,entries:[{date:todayISO(),weightLbs:+weightEntry},...prev.entries.filter(e=>e.date!==todayISO())]}));
    setWeightEntry("");
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
    <div style={{minHeight:"100vh",background:"#0a0a0f",color:"#f0f0f0",fontFamily:"'DM Mono','Courier New',monospace",fontSize:14,paddingBottom:70}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        *{box-sizing:border-box;}
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
        .srow{display:grid;grid-template-columns:28px 88px 68px;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid #1a1a1a;}
      `}</style>

      {authScreen && authScreen!=="profile" && (
        <div style={{position:"fixed",inset:0,background:"#0a0a0f",zIndex:100,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,letterSpacing:4,lineHeight:1}}>BAR NONE</div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#444",letterSpacing:2,marginBottom:36}}>THE PROGRAM</div>
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
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,marginBottom:2}}>{currentUser?.name}</div>
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

      <div style={{padding:"12px 16px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#0a0a0f",zIndex:10}}>
        <div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:3,color:lift?.color||"#f0f0f0",lineHeight:1}}>BAR NONE</div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#333",letterSpacing:2}}>THE PROGRAM</div>
        </div>
        <button onClick={()=>setShowProfile(true)} style={{background:"#0f0f1a",border:"1px solid #222",color:"#555",borderRadius:6,padding:"5px 12px",fontFamily:"'DM Mono',monospace",fontSize:11,cursor:"pointer"}}>
          {currentUser?.name?.split(" ")[0]?.toUpperCase()||"USER"}
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
              {[{l:"SESSIONS",v:totalSessions,c:"#f0f0f0"},{l:"STREAK",v:streak+"🔥",c:"#f7b731"},{l:"BMI",v:bmi||"—",c:bmi?bmiCol(bmi):"#333"}].map(s=>(
                <div key={s.l} style={{...card,textAlign:"center",marginBottom:0}}>
                  <div style={{color:"#555",fontSize:9,marginBottom:4}}>{s.l}</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>

            <div style={{...card}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:"#888",marginBottom:10,letterSpacing:1}}>BODY STATS</div>
              <div style={{display:"flex",gap:12,alignItems:"flex-end",flexWrap:"wrap",marginBottom:10}}>
                <div>
                  <div style={{color:"#555",fontSize:10,marginBottom:4}}>HEIGHT (inches)</div>
                  <input type="number" value={bodyStats.heightIn} placeholder="70" onChange={e=>setBodyStats(prev=>({...prev,heightIn:e.target.value}))} style={{width:72}} />
                </div>
                <div>
                  <div style={{color:"#555",fontSize:10,marginBottom:4}}>LOG WEIGHT (lbs)</div>
                  <div style={{display:"flex",gap:6}}>
                    <input type="number" value={weightEntry} placeholder="185" onChange={e=>setWeightEntry(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addWeightEntry()} style={{width:72,color:"#06d6a0"}} />
                    <button onClick={addWeightEntry} className="bn" style={{background:"#06d6a0",color:"#000",fontSize:14,padding:"4px 10px"}}>LOG</button>
                  </div>
                </div>
                {latestWeight && (
                  <div style={{marginLeft:"auto",textAlign:"right"}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:"#06d6a0"}}>{latestWeight} lbs</div>
                    {bmi && <div style={{fontSize:10,color:bmiCol(bmi)}}>BMI {bmi} · {bmiCat(bmi)}</div>}
                  </div>
                )}
              </div>
              {bodyStats.entries.length>1 && (
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={[...bodyStats.entries].reverse().slice(-10).map(e=>({d:fmtDate(e.date),w:e.weightLbs}))}>
                    <XAxis dataKey="d" tick={{fill:"#555",fontSize:8}} /><YAxis tick={{fill:"#555",fontSize:8}} domain={["auto","auto"]} />
                    <Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid #06d6a0",borderRadius:6,fontSize:11}} />
                    <Line type="monotone" dataKey="w" stroke="#06d6a0" strokeWidth={2} dot={{fill:"#06d6a0",r:3}} name="lbs" />
                  </LineChart>
                </ResponsiveContainer>
              )}
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
              <div style={{...card,borderLeft:`3px solid ${sessionLedger[0].liftColor||"#555"}`}}>
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
                  <button onClick={()=>{if(window.confirm("⚠️ Starting a new program will archive your current one.\n\nYour workout history, progress and custom exercises will all be saved.\n\nAre you sure?"))startNewProgram();}} className="bigbtn" style={{background:"none",border:"1px solid #e85d04",color:"#e85d04"}}>START NEW 12-WEEK PROGRAM</button>
                </div>
              </>
            )}

            {!hasSetup && (
              <>
                <div style={{...card,borderLeft:"3px solid #fff"}}>
                  <div style={{color:"#555",fontSize:10,marginBottom:6}}>PROGRAM START DATE</div>
                  <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{background:"transparent",border:"none",color:"#f0f0f0",fontSize:14,outline:"none",width:"100%"}} />
                </div>

                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:1}}>YOUR LIFTS</div>
                  <button onClick={addLift} className="bn" style={{background:"#1a1a2e",border:"1px solid #555",color:"#aaa",fontSize:13,padding:"4px 10px"}}>+ ADD LIFT</button>
                </div>
            {lifts.map(l=>{
              const cur=l.startingMax?calcCurrentMax(l.startingMax):null;
              const wkts=cur?calcWorkingWeights(cur):null;
              return (
                <div key={l.id} style={{...card,borderLeft:`3px solid ${l.color}`}}>
                  <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
                    <div style={{flex:1}}>
                      <select value={l.mainLiftOption||"Bench"} onChange={e=>{const v=e.target.value;updateLift(l.id,"mainLiftOption",v);if(v==="Custom")updateLift(l.id,"name","");else updateLift(l.id,"name",v);}} style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px solid ${l.color}66`,color:l.color,fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:1,padding:"2px 0",cursor:"pointer",marginBottom:6}}>
                        {MAIN_LIFT_OPTIONS.map(o=><option key={o} value={o} style={{background:"#1a1a2e",fontFamily:"sans-serif",fontSize:14}}>{o}</option>)}
                      </select>
                      {l.mainLiftOption==="Custom" && <input type="text" value={l.name} placeholder="Type lift name..." onChange={e=>updateLift(l.id,"name",e.target.value)} style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px solid ${l.color}44`,color:l.color,fontFamily:"'Bebas Neue',sans-serif",fontSize:15,padding:"2px 0",outline:"none",marginBottom:6}} />}
                      <div style={{display:"flex",gap:6}}>
                        {["UPPER","LOWER"].map(t=><button key={t} onClick={()=>updateLift(l.id,"isLower",t==="LOWER")} style={{background:(t==="LOWER")===l.isLower?l.color:"#111",color:(t==="LOWER")===l.isLower?"#000":"#555",border:`1px solid ${(t==="LOWER")===l.isLower?l.color:"#333"}`,borderRadius:3,padding:"2px 8px",fontSize:10,cursor:"pointer"}}>{t}</button>)}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <input type="number" value={l.startingMax||""} placeholder="0" style={{width:80,fontSize:18,fontFamily:"'Bebas Neue',sans-serif",borderColor:l.color,color:l.color,textAlign:"center"}} onChange={e=>updateLift(l.id,"startingMax",+e.target.value||0)} />
                      <span style={{color:"#555",fontSize:11}}>lbs</span>
                      {lifts.length>1 && <button onClick={()=>removeLift(l.id)} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:18,padding:"0 4px"}}>×</button>}
                    </div>
                  </div>
                  {cur && <div style={{color:"#555",fontSize:11,marginBottom:8}}>Training at: <span style={{color:l.color}}>{cur} lbs</span>{"  "}<button onClick={()=>setPreviewLift(previewLift===l.id?null:l.id)} style={{background:"none",border:`1px solid ${l.color}`,color:l.color,borderRadius:3,padding:"1px 7px",fontSize:10,cursor:"pointer"}}>{previewLift===l.id?"hide":"preview"}</button></div>}
                  {previewLift===l.id && wkts && (
                    <div style={{background:"#0a0a0f",borderRadius:6,padding:"10px 12px",marginBottom:10}}>
                      {wkts.map((w,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"1px solid #1a1a1a",fontSize:12}}><span style={{color:"#555"}}>Set {i+1}</span><span style={{color:l.color}}>{w} lbs</span><span style={{color:"#444"}}>{i<3?"× 10":"max reps"}</span></div>)}
                    </div>
                  )}
                  <div style={{color:"#555",fontSize:10,marginBottom:5}}>TRAINING DAYS</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>{const sel=(l.trainingDays||[]).includes(d);return <button key={d} onClick={()=>updateLift(l.id,"trainingDays",sel?l.trainingDays.filter(x=>x!==d):[...(l.trainingDays||[]),d])} style={{background:sel?l.color:"#111",color:sel?"#000":"#555",border:`1px solid ${sel?l.color:"#333"}`,borderRadius:4,padding:"3px 8px",fontSize:11,cursor:"pointer",transition:"all 0.15s"}}>{d}</button>;})}
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
                {startDate && lifts.every(l=>l.startingMax>0) && (
                  <button className="bigbtn" onClick={()=>{setActiveId(lifts[0].id);setViewingWeek(liftWeeks[lifts[0].id]||1);setView("workout");}} style={{background:"#fff",color:"#000",marginTop:8}}>START PROGRAM →</button>
                )}
              </>
            )}
            {programHistory.length>0 && (
              <div style={{marginTop:20}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:"#555",letterSpacing:1,marginBottom:10}}>PROGRAM HISTORY</div>
                {programHistory.map((p,i)=>(
                  <div key={i} style={{...card,borderLeft:"3px solid #333"}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,color:"#555",marginBottom:6}}>PROGRAM {programHistory.length-i} · {fmtDate(p.startDate)} → {fmtDate(p.endDate)}</div>
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
              {lifts.map(l=>{const done=completedDays?.[liftWeeks[l.id]]?.[l.id];return <button key={l.id} className="bn" onClick={()=>switchLift(l.id)} style={{background:activeId===l.id?l.color:"#1a1a2e",color:activeId===l.id?"#000":l.color,border:`1px solid ${l.color}`,opacity:done&&activeId!==l.id?0.5:1}}>{l.name}{done?" ✓":""}</button>;})}
            </div>
            <div style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid #1a1a1a"}}>
              <button onClick={()=>navigateWeek(-1)} disabled={viewingWeek<=1} style={{background:"#1a1a2e",border:"1px solid #333",color:viewingWeek<=1?"#333":"#aaa",borderRadius:4,width:32,height:32,cursor:viewingWeek<=1?"default":"pointer",fontSize:18}}>‹</button>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:lift.color,minWidth:80,textAlign:"center"}}>
                WEEK {viewingWeek}{isPastWeek&&<div style={{color:"#555",fontSize:10,fontFamily:"'DM Mono',monospace"}}>current: w{activeLiftWeek}</div>}
              </div>
              <button onClick={()=>navigateWeek(1)} disabled={viewingWeek>=activeLiftWeek} style={{background:"#1a1a2e",border:"1px solid #333",color:viewingWeek>=activeLiftWeek?"#333":"#aaa",borderRadius:4,width:32,height:32,cursor:viewingWeek>=activeLiftWeek?"default":"pointer",fontSize:18}}>›</button>
              {isPastWeek && (
                <>
                  <button onClick={()=>{setViewingWeek(activeLiftWeek);setEditingPastWeek(false);}} style={{background:"none",border:`1px solid ${lift.color}`,color:lift.color,borderRadius:4,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>current</button>
                  <button onClick={()=>setEditingPastWeek(e=>!e)} style={{background:editingPastWeek?"#2e1a1a":"#1a1a2e",border:`1px solid ${editingPastWeek?"#e85d04":"#555"}`,color:editingPastWeek?"#e85d04":"#aaa",borderRadius:4,padding:"4px 10px",fontFamily:"'Bebas Neue',sans-serif",fontSize:13,cursor:"pointer"}}>{editingPastWeek?"CANCEL":"EDIT"}</button>
                </>
              )}
            </div>
            <div style={{padding:16}}>
              <div style={{display:"flex",gap:10,marginBottom:14}}>
                {[{l:"CURRENT MAX",v:effMax,c:lift.color},{l:"EST MAX",v:sessionEstMax||"—",c:sessionEstMax?"#06d6a0":"#333"},{l:"NEXT WEEK",v:nextMax,c:willProgress?"#06d6a0":"#333"}].map(x=>(
                  <div key={x.l} style={{...card,flex:1,borderLeft:`3px solid ${x.c}`,marginBottom:0}}>
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
                  {[60,90,120,180].map(s=><button key={s} onClick={()=>{setRestDuration(s);setRestTimer(s);setRestRunning(false);}} style={{background:restDuration===s?"#1a1a2e":"#111",border:`1px solid ${restDuration===s?"#555":"#222"}`,color:restDuration===s?"#aaa":"#444",borderRadius:4,padding:"3px 7px",fontSize:10,cursor:"pointer"}}>{s}s</button>)}
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
                    <div style={{color:"#ccc"}}>{w} lbs</div>
                    {i<3?<div style={{color:lift.color,fontSize:12}}>× 10</div>:<input type="number" value={getReps(week,activeId,i)} readOnly={isReadOnly} onFocus={e=>e.target.select()} style={{color:lift.color,borderColor:lift.color}} onChange={e=>!isReadOnly&&setReps(week,activeId,i,e.target.value)} />}
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
                            <button onClick={()=>setAdj(acc.id,"up")} style={{background:adj==="up"?"#06d6a0":"#0f0f1a",border:`1px solid ${adj==="down"?"#222":"#06d6a0"}`,color:adj==="up"?"#000":adj==="down"?"#333":"#06d6a0",borderRadius:4,width:32,height:32,cursor:"pointer",fontSize:18,fontWeight:"bold",transition:"all 0.15s"}}>+</button>
                            <button onClick={()=>setAdj(acc.id,"down")} style={{background:adj==="down"?"#e85d04":"#0f0f1a",border:`1px solid ${adj==="up"?"#222":"#e85d04"}`,color:adj==="down"?"#000":adj==="up"?"#333":"#e85d04",borderRadius:4,width:32,height:32,cursor:"pointer",fontSize:18,fontWeight:"bold",transition:"all 0.15s"}}>−</button>
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
                  <button className="bigbtn" onClick={finishDay} style={{background:isDayDone?"#0f0f1a":lift.color,color:isDayDone?lift.color:"#000",border:isDayDone?`1px solid ${lift.color}`:"none"}}>
                    {isDayDone?"✓ DAY COMPLETE":"FINISH DAY"}
                  </button>
                  {willProgress&&!isDayDone&&<div style={{textAlign:"center",color:"#06d6a0",fontSize:12}}>🔥 Next week's max: {nextMax} lbs</div>}
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
              return (
                <div key={l.id} style={{...card,borderLeft:`3px solid ${l.color}`}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:l.color,marginBottom:2}}>{l.name}</div>
                  <div style={{color:"#555",fontSize:11,marginBottom:10}}>Start: <span style={{color:"#aaa"}}>{startMax} lbs</span>{"  →  "}Week {liftWeeks[l.id]||1}: <span style={{color:l.color}}>{curMax} lbs</span>{curMax>startMax&&<span style={{color:"#06d6a0"}}> (+{curMax-startMax})</span>}</div>
                  <div style={{color:"#555",fontSize:10,marginBottom:4}}>MAX PROGRESSION</div>
                  <ResponsiveContainer width="100%" height={110}>
                    <LineChart data={maxData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" /><XAxis dataKey="w" tick={{fill:"#555",fontSize:9}} /><YAxis tick={{fill:"#555",fontSize:9}} domain={["auto","auto"]} />
                      <Tooltip contentStyle={{background:"#1a1a2e",border:`1px solid ${l.color}`,borderRadius:6,fontSize:11}} />
                      <ReferenceLine y={startMax} stroke="#333" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="max" stroke={l.color} strokeWidth={2} dot={{fill:l.color,r:3}} name="Max" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                  {volData.length>0 && (
                    <>
                      <div style={{color:"#555",fontSize:10,marginTop:10,marginBottom:4}}>VOLUME (1000s lbs)</div>
                      <ResponsiveContainer width="100%" height={80}>
                        <BarChart data={volData}><XAxis dataKey="d" tick={{fill:"#555",fontSize:8}} /><YAxis tick={{fill:"#555",fontSize:8}} /><Tooltip contentStyle={{background:"#1a1a2e",border:`1px solid ${l.color}`,borderRadius:6,fontSize:11}} /><Bar dataKey="v" fill={l.color} radius={[3,3,0,0]} name="Vol(k)" /></BarChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </div>
              );
            })}
            {bodyStats.entries.length>1 && (
              <div style={{...card}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"#06d6a0",marginBottom:10}}>BODYWEIGHT</div>
                <ResponsiveContainer width="100%" height={110}>
                  <LineChart data={[...bodyStats.entries].reverse().slice(-12).map(e=>({d:fmtDate(e.date),w:e.weightLbs}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" /><XAxis dataKey="d" tick={{fill:"#555",fontSize:9}} /><YAxis tick={{fill:"#555",fontSize:9}} domain={["auto","auto"]} />
                    <Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid #06d6a0",borderRadius:6,fontSize:11}} />
                    <Line type="monotone" dataKey="w" stroke="#06d6a0" strokeWidth={2} dot={{fill:"#06d6a0",r:3}} name="lbs" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {view==="ledger" && (
          <div style={{padding:16}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:2,color:"#888",marginBottom:14}}>WORKOUT LEDGER</div>
            {sessionLedger.length===0&&<div style={{color:"#333",fontSize:13,textAlign:"center",padding:40}}>No sessions logged yet</div>}
            {sessionLedger.map((s,i)=>(
              <div key={i} style={{...card,borderLeft:`3px solid ${s.liftColor||"#555"}`}}>
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

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0a0a0f",borderTop:"1px solid #1a1a1a",display:"flex",zIndex:10}}>
        {[{id:"dashboard",icon:"🏠",label:"HOME"},{id:"workout",icon:"🏋️",label:"LIFT"},{id:"progress",icon:"📈",label:"PROGRESS"},{id:"ledger",icon:"📋",label:"LEDGER"},{id:"setup",icon:"⚙️",label:hasSetup?"PROGRAM":"SETUP"}].map(t=>(
          <button key={t.id} className={`ntab ${view===t.id?"on":""}`} onClick={()=>setView(t.id)}>
            <span style={{fontSize:18}}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
