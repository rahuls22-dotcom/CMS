/* Team ▸ Schedule Meetings — pick advisors, read their calendars side by side, book a
   slot for one of that advisor's own clients. The advisors are the fixed thing here and
   the client changes, which is the RM's problem working down a call list. */
(function(){
const NS=window.ProsperrAdvisorConsoleDS_c294ad;
const {Card,Avatar,Button,Icon,Field,Input,Modal,SearchInput,EmptyState,Note,Tag,TierChip,StatusPill}=NS;
const B=window.BK;

const TEAM_MENU=['Schedule Meetings','Onboard Advisors','Manage Advisors','Bulk Advisor Assignment','CSR Assignment','CSR Auto Assignment','Time Slot Config'];
const ADVISORS=B.STAFF.filter(s=>/Advisor/.test(s.role));
const isInternal=e=>e.toLowerCase().endsWith('@'+B.DOMAIN);

/* Each advisor's bookable window per weekday, as Time Slot Config sets it:
   a slot every (length + gap) minutes between From and To. Kept here rather than in
   data.js so the client-first screen keeps the availability rules it was designed with. */
const SLOT_CONFIG={
  a1:{days:[1,2,3,4,5,6],from:11*60,to:13*60+30,len:30,gap:30},
  a2:{days:[1,2,3,4,5],  from:10*60+30,to:14*60,len:30,gap:15},
  a3:{days:[1,2,3,4,5,6],from:15*60,to:18*60+30,len:45,gap:15},
  a4:{days:[2,3,4,5],    from:11*60,to:17*60,len:30,gap:60},
  w1:{days:[1,3,5],      from:16*60,to:19*60,len:60,gap:0},
};
const cfgOf=id=>SLOT_CONFIG[id]||{days:[1,2,3,4,5,6],from:B.DAY_START,to:B.DAY_END,len:30,gap:30};
const worksOn=(id,date)=>cfgOf(id).days.includes(new Date(date+'T00:00:00').getDay());
const windowLabel=id=>{const c=cfgOf(id);return `${B.fmtT(c.from)} – ${B.fmtT(c.to)}`;};

/* Slots the config offers on this date, before anyone's calendar is consulted. */
function configSlots(id,date){
  const c=cfgOf(id);
  if(!worksOn(id,date))return [];
  const out=[];
  for(let t=c.from;t+c.len<=c.to;t+=c.len+c.gap){
    if(date===B.TODAY&&t<B.NOW_MIN+30)continue;
    out.push([t,t+c.len]);
  }
  return out;
}
const merge=list=>{list.sort((a,b)=>a[0]-b[0]);const m=[];for(const b of list){const l=m[m.length-1];if(l&&b[0]<=l[1])l[1]=Math.max(l[1],b[1]);else m.push([b[0],b[1]]);}return m;};
const clientsOf=id=>B.USERS.filter(u=>u.advisorId===id||u.secondaryId===id);

/* ---------------------------------------------------------------- section shell -- */

function TeamSection({appts,tweaks,onQuickBook,toast,team}){
  const [item,setItem]=React.useState('Schedule Meetings');
  return <div className="upage">
    <nav className="umenu">
      {TEAM_MENU.map(m=><button key={m} className={m===item?'on':''} onClick={()=>setItem(m)}>{m}</button>)}
    </nav>
    <div>
      {item==='Schedule Meetings'
        ? <ScheduleMeetings appts={appts} tweaks={tweaks} onQuickBook={onQuickBook} toast={toast} team={team}/>
        : <Card><EmptyState>{item} isn't part of this prototype.</EmptyState></Card>}
    </div>
  </div>;
}

/* ------------------------------------------------------------- schedule meetings -- */

const PXM=0.62;                                   // px per minute of grid height
const y=m=>(m-B.GRID_START)*PXM;
const hours=(()=>{const o=[];for(let m=Math.ceil(B.GRID_START/60)*60;m<=B.GRID_END;m+=60)o.push(m);return o;})();

function ScheduleMeetings({appts,tweaks,onQuickBook,toast,team}){
  const [t,setT]=team;                            // survives the invite-review detour
  const {ids,date,offset}=t;
  const setIds=fn=>setT(v=>({...v,ids:typeof fn==='function'?fn(v.ids):fn}));
  const setDate=d=>setT(v=>({...v,date:d}));
  const setOffset=fn=>setT(v=>({...v,offset:typeof fn==='function'?fn(v.offset):fn,}));
  const [adding,setAdding]=React.useState(!t.ids.length);
  const [pick,setPick]=React.useState(null);      // {advisor,start,end}
  const days=B.weekDays(offset);
  const shown=ADVISORS.filter(a=>ids.includes(a.id));
  const rest=ADVISORS.filter(a=>!ids.includes(a.id));

  const takenFor=id=>appts.filter(a=>a.status==='Scheduled'&&a.people.includes(id));
  const blocksFor=(id,d)=>merge(B.busyFor(id,d).map(b=>[b[0],b[1]])
    .concat(takenFor(id).filter(t=>t.date===d).map(t=>[t.start,t.start+t.dur])));
  /* A configured slot is open when no busy block and no booked call overlaps it. */
  const openSlots=(id,d)=>{const busy=blocksFor(id,d);return configSlots(id,d).filter(s=>!busy.some(b=>B.overlaps(b,s)));};
  const openOn=d=>shown.reduce((n,a)=>n+openSlots(a.id,d).length,0);

  React.useEffect(()=>{
    if(!ids.length)return;
    if(openOn(date)>0&&days.includes(date))return;
    const better=days.find(d=>openOn(d)>0);
    if(better)setDate(better);
  },[ids.join(','),offset]);

  const add=id=>setIds(x=>[...x,id]);
  const drop=id=>setIds(x=>x.filter(i=>i!==id));

  const cols='54px repeat('+Math.max(shown.length,1)+',minmax(0,1fr))';
  const nowVisible=date===B.TODAY&&B.NOW_MIN>B.GRID_START&&B.NOW_MIN<B.GRID_END;

  return <div>
    <div className="ptitle">
      <div>
        <h2>Schedule meetings</h2>
        <div className="sub">Choose the advisors you're booking for, then pick a slot in their calendar.</div>
      </div>
    </div>

    {/* Who we're booking for. Chips are removable; the dropdown adds more. */}
    <Card className="ucard">
      <div className="adder" style={{borderTop:0,background:'var(--surface)'}}>
        <div className="lbl">Advisors</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          {shown.map(a=><div key={a.id} className="locked" style={{padding:'6px 8px'}}>
            <Avatar name={a.name} size={22} style={{fontSize:9}}/>
            <div style={{minWidth:0}}>
              <div className="nm">{a.name}</div>
              <div className="em">{clientsOf(a.id).length} clients · {windowLabel(a.id)}</div>
            </div>
            <button className="navbtn" style={{width:22,height:22}} onClick={()=>drop(a.id)}
              aria-label={`Remove ${a.name}`}><Icon name="x" size={12}/></button>
          </div>)}

          <Button variant="ghost" onClick={()=>setAdding(v=>!v)}>
            <Icon name="plus" size={14}/>{shown.length?'Add or remove':'Select advisors'}
          </Button>

          {shown.length>1&&<Button variant="ghost" onClick={()=>setIds([])}>Clear all</Button>}
        </div>
      </div>

      {adding&&<div className="adder">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div className="lbl" style={{flex:1}}>Pick advisors · {ADVISORS.length} on the team</div>
          {!!shown.length&&<Button variant="ghost" onClick={()=>setAdding(false)}>Done</Button>}
        </div>
        {ADVISORS.map(a=>{
          const on=ids.includes(a.id),n=clientsOf(a.id).length;
          return <label key={a.id} className="dd-item" style={{borderRadius:8,padding:'8px 10px'}}>
            <input type="checkbox" checked={on} onChange={()=>on?drop(a.id):add(a.id)}
              style={{width:15,height:15,accentColor:'var(--navy)'}}/>
            <Avatar name={a.name} size={24}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600}}>{a.name}</div>
              <div className="r">{a.role} · {n} client{n===1?'':'s'} · {windowLabel(a.id)}</div>
            </div>
            {!n&&<Tag tone="amber">no clients</Tag>}
          </label>;
        })}
      </div>}

      {!shown.length
        ? <EmptyState>
            No advisors selected yet. Add one or more above and their calendars appear here,
            side by side.
          </EmptyState>
        : tweaks&&tweaks.googleDown
        ? <div className="pad"><Note icon={<Icon name="alert" size={14}/>}>
            Google Calendar is unreachable, so free/busy can't be read. Nothing here is verified.
          </Note></div>
        : <React.Fragment>

        <div className="dstrip">
          <button className="navbtn" onClick={()=>setOffset(o=>o-1)} disabled={offset<=0} aria-label="Previous week">‹</button>
          <div className="days">
            {days.map(d=>{
              const anyWorks=shown.some(a=>worksOn(a.id,d));
              const n=anyWorks?openOn(d):0;
              return <button key={d} className={'dchip'+(d===date?' on':'')+(anyWorks?'':' off')+(d===B.TODAY?' today':'')}
                onClick={()=>anyWorks&&setDate(d)} disabled={!anyWorks}>
                <div className="w">{B.fmtD(d,{weekday:'short',day:undefined,month:undefined})}</div>
                <div className="d">{new Date(d+'T12:00:00+05:30').getDate()}</div>
                <div className={'c '+(n?'some':'none')}>{anyWorks?(n?n+' open':'none'):'off'}</div>
              </button>;
            })}
          </div>
          <button className="navbtn" onClick={()=>setOffset(o=>o+1)} aria-label="Next week">›</button>
        </div>

        <div className="ghead" style={{gridTemplateColumns:cols}}>
          <div/>
          {shown.map(a=>{const n=openSlots(a.id,date).length;return <div key={a.id}>
            <Avatar name={a.name} size={18} style={{fontSize:8}}/>
            <span className="gn">{a.name}</span>
            <span style={{marginLeft:'auto',color:n?'var(--green-deep)':'var(--ink-3)'}}>{n}</span>
          </div>;})}
        </div>

        <div className="gscroll">
          <div className="gbody" style={{gridTemplateColumns:cols,height:y(B.GRID_END)}}>
            <div className="gcol gutter">
              {hours.map(h=><span key={h} className="hl" style={{top:y(h)}}>{B.fmtT(h).replace(':00','')}</span>)}
            </div>
            {shown.map(a=>{
              const c=cfgOf(a.id),on=worksOn(a.id,date);
              const off=on?[[B.GRID_START,c.from],[c.to,B.GRID_END]]:[[B.GRID_START,B.GRID_END]];
              const open=openSlots(a.id,date);
              return <div className="gcol" key={a.id}>
                {hours.map(h=><div key={h} className="hline" style={{top:y(h)}}/>)}
                {off.map(o=>o[1]>o[0]&&<div key={o[0]} className="offhrs" style={{top:y(o[0]),height:y(o[1])-y(o[0])}}/>)}
                {!on&&<div className="busy" style={{top:y(c.from),height:30,background:'transparent',border:0}}>Not scheduled</div>}
                {on&&blocksFor(a.id,date).filter(b=>b[1]>c.from&&b[0]<c.to).map(b=>{
                  const s=Math.max(b[0],c.from),e=Math.min(b[1],c.to);
                  return <div key={b[0]} className="busy" style={{top:y(s),height:Math.max(y(e)-y(s),14)}} title="Busy">
                    {y(e)-y(s)>=22?'Busy':''}
                  </div>;})}
                {on&&open.map(s=><button key={s[0]} className="slot"
                  style={{top:y(s[0]),height:Math.max(y(s[1])-y(s[0])-2,16)}}
                  onClick={()=>setPick({advisor:a,start:s[0],end:s[1]})}
                  title={`Book ${B.fmtT(s[0])} with ${a.name}`}>
                  <span>{B.fmtT(s[0])}</span>
                </button>)}
                {nowVisible&&<div className="nowline" style={{top:y(B.NOW_MIN)}}/>}
              </div>;
            })}
          </div>
        </div>

        <div className="legend">
          <span><i style={{background:'var(--green-soft)',border:'1px solid #bfe3cb'}}/>Open</span>
          <span><i style={{background:'var(--surface-2)',border:'1px solid var(--border-2)'}}/>Busy</span>
          <span><i style={{background:'repeating-linear-gradient(135deg,var(--surface-2) 0 6px,var(--surface-3) 6px 12px)'}}/>Outside their configured hours</span>
          <span style={{marginLeft:'auto'}}>Slots follow each advisor's Time Slot Config · IST</span>
        </div>
      </React.Fragment>}
    </Card>

    {pick&&<PickClient pick={pick} date={date} tweaks={tweaks}
      onClose={()=>setPick(null)} onBook={onQuickBook}/>}
  </div>;
}

/* ------------------------------------------------------------------ pick a client -- */
/* The advisor and the time are settled — you clicked them. The only open question is
   who the call is for, and the answer is almost always one of that advisor's own
   clients, so those are what the list shows first. */
function PickClient({pick,date,tweaks,onClose,onBook}){
  const {advisor,start,end}=pick;
  const dur=end-start;
  const mine=clientsOf(advisor.id);
  const [all,setAll]=React.useState(!mine.length);
  const [q,setQ]=React.useState('');
  const [client,setClient]=React.useState(null);
  const [type,setType]=React.useState(B.CONSULT_TYPES[1]);
  const [err,setErr]=React.useState('');

  const pool=all?B.USERS:mine;
  const matches=pool.filter(u=>!q.trim()||[u.name,u.email,u.phone].some(v=>v.toLowerCase().includes(q.trim().toLowerCase())));

  const submit=()=>{
    if(!client)return;
    if(tweaks&&tweaks.simulateConflict){
      setErr(`${advisor.name.split(' ')[0]} was booked into ${B.fmtT(start)} a moment ago. Close this and pick another slot.`);
      return;
    }
    const people=[
      {id:client.id,name:client.name,email:client.email,kind:'client',hasCalendar:false,locked:true},
      {...advisor,kind:'staff',hasCalendar:true},
    ];
    onBook({date,start,dur,type,fireflies:!!(tweaks&&tweaks.firefliesDefault),peopleObjs:people,
      external:people.some(p=>!isInternal(p.email))},client);
  };

  return <Modal title={`${B.fmtT(start)} – ${B.fmtT(end)} · ${B.fmtD(date)}`}
    subtitle={`with ${advisor.name} · ${advisor.role}`} onClose={onClose}
    footer={<React.Fragment>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button onClick={submit} disabled={!client}>{client?'Review invite':'Choose a client'}</Button>
    </React.Fragment>}>

    {client
      ? <div className="locked" style={{marginBottom:12}}>
          <Avatar name={client.name} size={28}/>
          <div style={{flex:1,minWidth:0}}>
            <div className="nm">{client.name} <TierChip tier={client.tier}/></div>
            <div className="em">{client.phone} · {client.plan}</div>
          </div>
          <Button variant="ghost" onClick={()=>{setClient(null);setErr('');}}>Change</Button>
        </div>
      : <div style={{marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <div className="lbl" style={{flex:1}}>
              {all?`All clients · ${B.USERS.length}`:`Assigned to ${advisor.name.split(' ')[0]} · ${mine.length}`}
            </div>
            {!!mine.length&&<Button variant="ghost" onClick={()=>{setAll(v=>!v);setQ('');}}>
              {all?'Only their clients':'Show all clients'}
            </Button>}
          </div>
          <SearchInput value={q} onChange={setQ} placeholder="Search by name, email or phone"/>
          <div style={{marginTop:8,maxHeight:240,overflowY:'auto'}}>
            {matches.map(u=><div key={u.id} className="dd-item" onClick={()=>setClient(u)}>
              <Avatar name={u.name} size={24}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600}}>{u.name}</div>
                <div className="r">{u.phone} · {u.plan}</div>
              </div>
              {u.advisorId===advisor.id
                ? <Tag tone="blue">primary</Tag>
                : u.secondaryId===advisor.id?<Tag tone="violet">secondary</Tag>:null}
            </div>)}
            {!matches.length&&<div className="muted" style={{padding:'12px 2px',fontSize:12.5}}>
              {q?<React.Fragment>No client matches “{q}”.</React.Fragment>
                :<React.Fragment>{advisor.name} has no clients assigned yet.</React.Fragment>}
            </div>}
          </div>
        </div>}

    {client&&client.advisorId!==advisor.id&&client.secondaryId!==advisor.id&&
      <Note icon={<Icon name="alert" size={14}/>}>
        {advisor.name} is not assigned to {client.name}. You can still book it.
      </Note>}

    <Field label="Consultation type">
      <Input as="select" value={type} onChange={e=>setType(e.target.value)}>
        {B.CONSULT_TYPES.map(t=><option key={t}>{t}</option>)}
      </Input>
    </Field>

    {err&&<Note icon={<Icon name="alert" size={14}/>}>{err}</Note>}
  </Modal>;
}

Object.assign(window,{TeamSection,TEAM_MENU});
})();
