/* Book a call — one screen: basic details + participants on the left, available slots on the right */
(function(){
const NS=window.ProsperrAdvisorConsoleDS_c294ad;
const {Card,Avatar,Tag,Button,Icon,Field,Input}=NS;
const B=window.BK;
const isInternal=email=>email.toLowerCase().endsWith('@'+B.DOMAIN);
/* Defaults live in data.js so this screen and Schedule meetings agree. */
const isWeekend=d=>{const w=new Date(d+'T00:00:00').getDay();return w===0||w===6;};

function BookCall({u,appts,tweaks,reschedule,onCreated,onBack,toast}){
  const [advId,setAdvId]=React.useState(reschedule?(reschedule.peopleObjs.find(p=>p.kind==='staff')||{}).id||u.advisorId:u.advisorId);
  const adv=B.STAFF.find(s=>s.id===advId);
  const sec=B.STAFF.find(s=>s.id===u.secondaryId);
  const [withSec,setWithSec]=React.useState(reschedule?reschedule.peopleObjs.some(p=>p.secondary):false);
  const [extras,setExtras]=React.useState(reschedule?reschedule.peopleObjs.filter(p=>!p.locked&&!p.secondary):[]);
  const people=React.useMemo(()=>[{id:u.id,name:u.name,email:u.email,kind:'client',hasCalendar:false,locked:true},{...adv,kind:'staff',hasCalendar:true,locked:true},
    ...(withSec&&sec&&sec.id!==advId?[{...sec,kind:'staff',hasCalendar:true,secondary:true}]:[]),...extras.filter(p=>p.id!==advId&&!(withSec&&sec&&p.id===sec.id))],[u,adv,withSec,sec,extras,advId]);
  const setPeople=list=>setExtras(list.filter(p=>!p.locked&&!p.secondary));
  const [type,setType]=React.useState(reschedule?reschedule.type:'ITR Filing');
  const [dur,setDur]=React.useState(reschedule?reschedule.dur:B.durFor('ITR Filing'));
  const [date,setDate]=React.useState(reschedule?reschedule.date:'');
  const [sel,setSel]=React.useState(null);
  const [q,setQ]=React.useState('');const [open,setOpen]=React.useState(false);const [err,setErr]=React.useState('');
  const [extraTaken,setExtraTaken]=React.useState([]);
  const [conflictUsed,setConflictUsed]=React.useState(false);
  const [creating,setCreating]=React.useState(false);
  const external=people.some(p=>!isInternal(p.email));
  const taken=appts.filter(a=>a.status==='Scheduled'&&(!reschedule||a.id!==reschedule.id)).concat(extraTaken);
  const setDurKeep=d=>{setDur(d);};
  React.useEffect(()=>{setSel(null);},[people.length,date]);
  const changeType=t=>{setType(t);setDur(B.durFor(t));};
  const dateOk=date&&date>=B.TODAY;
  const dateErr=!date?'':date<B.TODAY?'Pick today or a later date':'';
  const avail=B.STAFF.filter(x=>!people.some(p=>p.id===x.id)&&q&&(x.name+x.role+x.email).toLowerCase().includes(q.toLowerCase()));
  const addStaff=x=>{setPeople([...people,{...x,kind:'staff',hasCalendar:true}]);setQ('');setOpen(false);setErr('');};
  const addTyped=()=>{const e=q.trim();if(!e)return;const st=B.STAFF.find(x=>x.email===e||x.name.toLowerCase()===e.toLowerCase());if(st){addStaff(st);return;}
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)){setErr('Pick a team member or enter a full email');return;}
    if(people.some(p=>p.email===e)){setErr('Already added');return;}
    setPeople([...people,{id:'g'+Date.now(),name:e.split('@')[0].replace(/[._]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),email:e,kind:'guest',hasCalendar:isInternal(e),role:'Guest'}]);setQ('');setErr('');};
  const free=dateOk?B.freeSlots(people,date,dur,taken,dur):[];
  const busyNames=sel==null||!dateOk?[]:people.filter(p=>p.hasCalendar&&(B.busyFor(p.id,date).some(b=>B.overlaps(b,[sel,sel+dur]))||taken.some(t=>t.date===date&&t.people.includes(p.id)&&B.overlaps([t.start,t.start+t.dur],[sel,sel+dur])))).map(p=>p.name.split(' ')[0]);
  const outside=sel!=null&&dateOk&&(!B.isWorkDay(date)||sel<B.DAY_START||sel+dur>B.DAY_END);
  const conflict=busyNames.length?busyNames.join(', ')+(busyNames.length>1?' are':' is'):'';
  let nextFreeDay=date,nextFreeCount=0;
  if(dateOk&&!free.length){for(let k=1;k<=14&&!nextFreeCount;k++){const d=new Date(date+'T00:00:00');d.setDate(d.getDate()+k);const iso=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');const n=B.freeSlots(people,iso,dur,taken).length;if(n){nextFreeDay=iso;nextFreeCount=n;}}}
  const create=()=>{if(creating)return;setCreating(true);
    setTimeout(()=>{
      if(tweaks.simulateConflict&&!conflictUsed){setConflictUsed(true);setExtraTaken([...extraTaken,{date,start:sel,dur,people:people.filter(p=>p.hasCalendar).map(p=>p.id),status:'Scheduled'}]);setSel(null);setCreating(false);toast('That slot was just taken — pick another','warn','alert');return;}
      onCreated({date,start:sel,dur,type,fireflies:false,peopleObjs:people,external});
    },900);};
  const tokenTone=p=>p.kind==='client'?'blue':p.kind==='guest'?'amber':'neutral';
  return <>
    <div className="ptitle"><h1 className="pgh">{reschedule?'Reschedule Event':'Create Event'}</h1>{reschedule&&<button className="pbtn ghost" onClick={onBack}>BACK</button>}</div>
    <div className="book3 two">
      <div className="stack">
      <div className="pcard">
        <div className="pcard-h">User Details</div>
        <div className="pcard-b">
          <Field label="Client name"><Input as="select" value={u.name} disabled><option>{u.name}</option></Input></Field>
          <Field label="Consultation type"><Input as="select" value={type} onChange={e=>changeType(e.target.value)}>{B.CONSULT_TYPES.map(t=><option key={t}>{t}</option>)}</Input></Field>
          <Field label="Advisor"><Input as="select" value={advId} onChange={e=>setAdvId(e.target.value)}>{B.STAFF.filter(s=>/Advisor/.test(s.role)).map(s=><option key={s.id} value={s.id}>{s.name}{s.id===u.advisorId?' (primary)':''}</option>)}</Input></Field>
          {sec&&sec.id!==advId&&<label className="secrow"><button type="button" className={'toggle sm'+(withSec?' on':'')} aria-pressed={withSec} onClick={()=>setWithSec(!withSec)}></button><span>Add secondary advisor <b>{sec.name}</b></span></label>}
          <Field label="Attendees">
            {people.filter(p=>!p.locked&&!p.secondary).length>0&&<div className="tokens" style={{marginBottom:8}}>{people.filter(p=>!p.locked&&!p.secondary).map(p=><span key={p.id} className="tok" title={p.email}><Avatar name={p.name} size={18} style={{fontSize:8}}/>{p.name}<Tag tone={p.secondary?'violet':tokenTone(p)}>{p.secondary?'Secondary':p.kind==='guest'?'Guest':p.role.split(' ')[0]}</Tag>
              {!p.secondary&&<button className="tokx" aria-label={'Remove '+p.name} onClick={()=>setPeople(people.filter(x=>x.id!==p.id))}><Icon name="x" size={11}/></button>}</span>)}</div>}
            <div className="dd"><div className="inrow"><Input placeholder="Attendee Email" value={q} invalid={!!err} onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),150)} onChange={e=>{setQ(e.target.value);setOpen(true);setErr('');}} onKeyDown={e=>e.key==='Enter'&&addTyped()}/><button className="pbtn addbtn" onClick={addTyped}>Add</button></div>
              {open&&avail.length>0&&<div className="dd-list">{avail.map(x=><div className="dd-item" key={x.id} onMouseDown={()=>addStaff(x)}><Avatar name={x.name} size={24}/><div><div style={{fontWeight:600}}>{x.name}</div><div className="r">{x.role}</div></div></div>)}</div>}
              {err&&<div className="ferr">{err}</div>}</div>
          </Field>
        </div>
      </div>
      <div className="pcard">
        <div className="pcard-h">Date &amp; Time</div>
        <div className="pcard-b">
          <div className="gcalrow">
            <Input type="date" min={B.TODAY} value={date} invalid={!!dateErr} onChange={e=>setDate(e.target.value)} style={{flex:'1 1 150px'}}/>
            <span className="trange"><TimePicker value={sel} disabled={!dateOk} placeholder="Start" invalid={sel!=null&&!!conflict} options={Array.from({length:96},(_,i)=>i*15)} onChange={t=>setSel(Math.min(t,24*60-5))}/>
            <span className="dash">–</span>
            <TimePicker value={sel==null?null:sel+dur} disabled={sel==null} placeholder="End" anchor={sel} options={sel==null?[]:Array.from({length:Math.floor((24*60-sel-15)/15)+1},(_,i)=>sel+15+i*15)} onChange={e=>{if(e>sel)setDur(e-sel);}}/></span>
            <Input as="select" className="durf" title="Duration" value={[15,30,45,60].includes(dur)?dur:'custom'} onChange={e=>{if(e.target.value!=='custom')setDur(+e.target.value);}}>{[15,30,45,60].map(m=><option key={m} value={m}>{m} Minutes</option>)}{![15,30,45,60].includes(dur)&&<option value="custom">{dur} Minutes</option>}</Input>
          </div>
          {dateErr&&<div className="ferr">{dateErr}</div>}
          {sel!=null&&!conflict&&outside&&<div className="muted" style={{display:'flex',gap:6,alignItems:'center',color:'var(--amber)',fontWeight:600}}><Icon name="clock" size={13}/>Outside working hours (10:30 AM – 7:00 PM, Mon–Sat). Allowed if the client asked for it.</div>}
          {sel!=null&&conflict&&<div className="ferr" style={{display:'flex',gap:6,alignItems:'center'}}><Icon name="alert" size={13}/>{conflict} busy at this time — pick a green slot or adjust.</div>}
        </div>
      </div>
      </div>
      <div className="pcard">
        <div className="pcard-h">Available slots <span className="muted" style={{fontWeight:500,marginLeft:6}}>· {dateOk?(free.length?free.length+(free.length===1?' slot':' slots')+' of '+dur+' min free for everyone':'none free for everyone'):'free for everyone'} · IST</span></div>
        <div className="pcard-b">
          {!dateOk?<div className="placeholder">Pick a date to see when everyone is free.</div>
            :!B.isWorkDay(date)?<div className="placeholder"><b style={{color:'var(--ink-2)'}}>Sunday — no working slots</b><br/>Working hours are 10:30 AM – 7:00 PM, Mon–Sat. You can still set a time on the left if the client asked for it.</div>
            :!free.length?<div className="placeholder"><b style={{color:'var(--ink-2)'}}>No slots on {B.fmtD(date)}</b><br/>{people.filter(p=>p.hasCalendar).map(p=>p.name.split(' ')[0]).join(', ')} {people.filter(p=>p.hasCalendar).length>1?'have':'has'} no common free time. Try {B.fmtD(nextFreeDay)} — {nextFreeCount} slots.</div>
            :<div className="slotlist">{free.map(t=><button key={t} className={'srow'+(sel===t?' sel':'')} onClick={()=>setSel(t)}><span>{B.fmtT(t)} – {B.fmtT(t+dur)}</span>{sel===t&&<Icon name="check" size={13} strokeWidth={3}/>}</button>)}</div>}
          <div className="muted">Working hours 10:30 AM – 7:00 PM, Mon–Sat. Type another time in Start / End if needed.</div>
          <div className="summary">
            <div className="pcard-h" style={{fontSize:15,marginBottom:4}}>Summary</div>
            <div className="srow2"><span className="k">Consultation</span><span className="v">{type} · {dur} min</span></div>
            <div className="srow2"><span className="k">Date &amp; time</span><span className="v">{sel!=null?<>{B.fmtD(date)} · {B.fmtT(sel)} – {B.fmtT(sel+dur)} IST</>:dateOk?<span className="muted">Select a slot above</span>:<span className="muted">Pick a date</span>}</span></div>
            <div className="srow2"><span className="k">Participants</span><span className="v tokens" style={{gap:5}}>{people.map(p=><span key={p.id} className="tok" title={p.email} style={{padding:'2px 7px 2px 3px',fontSize:11.5}}><Avatar name={p.name} size={16} style={{fontSize:7}}/><span className="tn">{p.name}</span><Tag tone={p.kind==='client'?'blue':p.secondary?'violet':p.kind==='guest'?'amber':'neutral'}>{p.kind==='client'?'Client':p.locked?'Primary':p.secondary?'Secondary':p.kind==='guest'?'Guest':p.role.split(' ')[0]}</Tag></span>)}</span></div>
          </div>
          <button className="pbtn" style={{alignSelf:'stretch'}} disabled={sel==null||creating||!!conflict} onClick={create}>{creating?'CHECKING…':reschedule?'CONFIRM RESCHEDULE':'CONFIRM'}</button>
        </div>
      </div>
    </div>
  </>;
}
Object.assign(window,{BookCall});
})();
