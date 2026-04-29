import { useMemo, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import './App.css';
import { STORE_KEYS, dateOnly, readStore, writeStore, uid, toNum, latest, getWeekCount, fmtDate } from './utils';

const tabs=['Dashboard','Intake','Post-Workout','Baselines','Progress','Weekly','History','Memory','Backup'];

const initIntake={date:dateOnly(),bodyWeight:'',cnsScore:7,soreness:'',notes:'',sprintWork:'',trackWorkout:''};
const initPost={date:dateOnly(),verticalJump:'',broadJump:'',sprintTiming:'',phaseStatus:'Progressing',postFatigue:5,concerns:''};

export default function App(){
  const [tab,setTab]=useState('Dashboard');
  const [intake,setIntake]=useState(()=>readStore(STORE_KEYS.intake,[]));
  const [post,setPost]=useState(()=>readStore(STORE_KEYS.post,[]));
  const [baselines,setBaselines]=useState(()=>readStore(STORE_KEYS.baselines,[]));
  const [msg,setMsg]=useState('');
  const [memory,setMemory]=useState('');
  const [editing,setEditing]=useState(null);

  const allLogs=useMemo(()=>[...intake.map(i=>({...i,type:'intake'})),...post.map(p=>({...p,type:'post'}))].sort((a,b)=>a.date.localeCompare(b.date)),[intake,post]);
  const lastI=latest(intake), lastP=latest(post);
  const chartData=useMemo(()=>intake.map(i=>({date:i.date,weight:toNum(i.bodyWeight),cns:toNum(i.cnsScore),vj:toNum(post.find(p=>p.date===i.date)?.verticalJump),bj:toNum(post.find(p=>p.date===i.date)?.broadJump)})),[intake,post]);

  const saveIntake=(f)=>{const n=[...intake,{...f,id:uid(),savedAt:new Date().toISOString()}];setIntake(n);writeStore(STORE_KEYS.intake,n);setMsg('Intake saved.');};
  const savePost=(f)=>{const n=[...post,{...f,id:uid(),savedAt:new Date().toISOString()}];setPost(n);writeStore(STORE_KEYS.post,n);setMsg('Post-workout saved.');};
  const saveBaseline=(f)=>{const n=[...baselines,{...f,id:uid(),savedAt:new Date().toISOString()}];setBaselines(n);writeStore(STORE_KEYS.baselines,n);setMsg('Baseline saved.');};

  const aiExport=()=>{const out=`SPRINT LAB AI COACH EXPORT\nLatest body weight: ${lastI?.bodyWeight||'—'}\nLatest readiness/CNS: ${lastI?.cnsScore||'—'}\nLatest soreness: ${lastI?.soreness||'—'}\nLatest intake: ${lastI?.trackWorkout||'—'}\nLatest post-workout: ${lastP?.concerns||'—'}\nLatest baselines: ${latest(baselines)?.summary||'—'}\nRecent 7-day training summary: ${getWeekCount(allLogs)} logs\nJump KPI trend: ${lastP?.verticalJump||'—'} / ${lastP?.broadJump||'—'}\nSprint notes/times: ${lastP?.sprintTiming||'—'}\nWarning flags: ${powerWeightWarn?'Body weight up while jump output down':'None'}\nSession Memory Block: ${memory||'Not generated yet'}`;
    navigator.clipboard.writeText(out);setMsg('AI Coach Export copied.');
  };

  const powerWeightWarn=chartData.length>2 && chartData.at(-1)?.weight>chartData[0]?.weight && (chartData.at(-1)?.vj??99)<(chartData[0]?.vj??0);

  const exportBackup=()=>{const payload={intake,post,baselines,exportedAt:new Date().toISOString()};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`sprint-lab-backup-${dateOnly()}.json`;a.click();writeStore(STORE_KEYS.backupMeta,{lastBackupAt:new Date().toISOString()});setMsg('Backup exported successfully.');};
  const importBackup=(file)=>{const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.intake)||!Array.isArray(d.post)||!Array.isArray(d.baselines)) throw new Error();setIntake(d.intake);setPost(d.post);setBaselines(d.baselines);writeStore(STORE_KEYS.intake,d.intake);writeStore(STORE_KEYS.post,d.post);writeStore(STORE_KEYS.baselines,d.baselines);setMsg('Backup imported successfully.');}catch{setMsg('Invalid backup file.')}};r.readAsText(file);};

  return <div className='app'><h1>Sprint Lab</h1><p className='msg'>{msg}</p>
  <div className='tabs'>{tabs.map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</div>
  {tab==='Dashboard'&&<section className='card'><h2>Overview</h2><p>Last logged session: {fmtDate(latest(allLogs)?.date)}</p><p>Logs this week: {getWeekCount(allLogs)}</p><p>Latest status: {lastP?.phaseStatus||'Not enough data'}</p><p>Latest body weight: {lastI?.bodyWeight||'—'}</p><p>Latest CNS: {lastI?.cnsScore||'—'}</p><p>Latest soreness: {lastI?.soreness||'—'}</p><p>Latest vertical jump: {lastP?.verticalJump||'—'}</p><p>Latest broad jump: {lastP?.broadJump||'—'}</p><p>Latest sprint note: {lastP?.sprintTiming||'—'}</p>{powerWeightWarn&&<p className='warn'>Body weight is increasing, but explosiveness appears to be dropping. Consider reducing non-essential volume and prioritizing recovery before pushing mass gain harder.</p>}<div className='row'><button onClick={()=>setTab('Intake')}>Log Intake</button><button onClick={()=>setTab('Post-Workout')}>Log Post-Workout</button><button onClick={()=>setTab('Progress')}>View Progress</button><button onClick={aiExport}>Copy AI Coach Export</button></div></section>}
  {tab==='Intake'&&<Form initial={initIntake} fields={['date','bodyWeight','cnsScore','soreness','trackWorkout','sprintWork','notes']} onSave={saveIntake} title='Intake Log'/>}
  {tab==='Post-Workout'&&<Form initial={initPost} fields={['date','verticalJump','broadJump','sprintTiming','phaseStatus','postFatigue','concerns']} onSave={savePost} title='Post Workout Log'/>}
  {tab==='Baselines'&&<Form initial={{date:dateOnly(),summary:''}} fields={['date','summary']} onSave={saveBaseline} title='Baselines'/>}
  {tab==='Progress'&&<section className='card'><h2>Progress</h2><MiniChart data={chartData} k='weight' name='Body weight'/><MiniChart data={chartData} k='cns' name='Readiness/CNS'/><MiniChart data={chartData} k='vj' name='Vertical jump'/><MiniChart data={chartData} k='bj' name='Broad jump'/></section>}
  {tab==='Weekly'&&<section className='card'><h2>Weekly</h2><p>Sessions in last 7 days: {getWeekCount(allLogs)}</p></section>}
  {tab==='History'&&<section className='card'><h2>History</h2>{allLogs.map(l=><div key={l.id} className='item'><strong>{l.type}</strong> {l.date} <button onClick={()=>setEditing(l)}>Edit</button><button onClick={()=>{if(confirm('Delete this log?')){if(l.type==='intake'){const n=intake.filter(x=>x.id!==l.id);setIntake(n);writeStore(STORE_KEYS.intake,n)}else{const n=post.filter(x=>x.id!==l.id);setPost(n);writeStore(STORE_KEYS.post,n)}}}}>Delete</button></div>)}{editing&&<Editor entry={editing} onCancel={()=>setEditing(null)} onSave={(u)=>{u.lastEditedAt=new Date().toISOString();if(u.type==='intake'){const n=intake.map(i=>i.id===u.id?u:i);setIntake(n);writeStore(STORE_KEYS.intake,n)}else{const n=post.map(i=>i.id===u.id?u:i);setPost(n);writeStore(STORE_KEYS.post,n)}setEditing(null);setMsg('Log updated.')}}/>}</section>}
  {tab==='Memory'&&<section className='card'><h2>Session Memory Block</h2><textarea value={memory} onChange={e=>setMemory(e.target.value)} placeholder='Generate or paste memory block' /><button onClick={()=>navigator.clipboard.writeText(memory)}>Copy Memory Block</button></section>}
  {tab==='Backup'&&<section className='card'><h2>Backup Controls</h2><p>Browser local data can be lost if browser/app storage is cleared.</p><button onClick={exportBackup}>Export Backup</button><input type='file' accept='application/json' onChange={e=>e.target.files?.[0]&&importBackup(e.target.files[0])}/><p>Last backup: {readStore(STORE_KEYS.backupMeta,{}).lastBackupAt||'Never'}</p>{allLogs.length>5&&!readStore(STORE_KEYS.backupMeta,{}).lastBackupAt&&<p className='warn'>You have several logs but no exported backup yet.</p>}</section>}
  </div>
}

function Form({initial,fields,onSave,title}){const [form,setForm]=useState(initial);return <section className='card'><h2>{title}</h2>{fields.map(f=><label key={f}>{f}<input aria-label={f} value={form[f]??''} onChange={e=>setForm({...form,[f]:e.target.value})}/></label>)}<button onClick={()=>{onSave(form);setForm(initial)}}>Save</button></section>}
function Editor({entry,onCancel,onSave}){const [v,setV]=useState(entry);return <div className='editor'><h3>Edit log</h3>{Object.keys(v).filter(k=>!['id','savedAt','type'].includes(k)).map(k=><label key={k}>{k}<input value={v[k]??''} onChange={e=>setV({...v,[k]:e.target.value})}/></label>)}<button onClick={()=>onSave(v)}>Save changes</button><button onClick={onCancel}>Cancel</button></div>}
function MiniChart({data,k,name}){if(!data.some(d=>d[k]!=null))return <p>No {name} data yet.</p>;return <div style={{height:180}}><h4>{name}</h4><ResponsiveContainer><LineChart data={data}><CartesianGrid strokeDasharray='3 3'/><XAxis dataKey='date'/><YAxis/><Tooltip/><Line type='monotone' dataKey={k} stroke='#c8ff00'/></LineChart></ResponsiveContainer></div>}
