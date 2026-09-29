/* Team ▸ Schedule Meetings. The advisors are fixed and the client changes, which is the
   RM's problem working down a call list. Booking joins the same review-then-send path as
   the client-first screen. */
(function(){
const NS=window.ProsperrAdvisorConsoleDS_c294ad;
const {Card,Avatar,Button,Icon,Field,Input,Modal,SearchInput,EmptyState,Note,Tag,TierChip}=NS;
const B=window.BK;

const TEAM_MENU=['Schedule Meetings','Onboard Advisors','Manage Advisors','Bulk Advisor Assignment','CSR Assignment','CSR Auto Assignment','Time Slot Config'];
const ADVISORS=B.STAFF.filter(s=>/Advisor/.test(s.role));
const isInternal=e=>e.toLowerCase().endsWith('@'+B.DOMAIN);

/* Each advisor's bookable window per weekday, as Time Slot Config sets it: a slot every
   (length + gap) minutes between From and To. Kept here so the client-first screen keeps
   the availability rules it was designed with. */
const SLOT_CONFIG={
  a1:{days:[1,2,3,4,5,6],from:660,to:810,len:30,gap:30},
  a2:{days:[1,2,3,4,5],  from:630,to:840,len:30,gap:15},
  a3:{days:[1,2,3,4,5,6],from:900,to:1110,len:45,gap:15},
  a4:{days:[2,3,4,5],    from:660,to:1020,len:30,gap:60},
  a5:{days:[1,2,3,4,5],  from:570,to:780,len:30,gap:30},
  a6:{days:[1,3,5],      from:840,to:1080,len:30,gap:30},
  a7:{days:[1,2,3,4,5,6],from:660,to:810,len:30,gap:30},
  a8:{days:[1,2,3,4,5],  from:600,to:960,len:30,gap:60},
  a9:{days:[2,3,4,5,6],  from:660,to:930,len:45,gap:15},
  w1:{days:[1,3,5],      from:960,to:1140,len:60,gap:0},
};
const cfgOf=id=>SLOT_CONFIG[id]||{days:[1,2,3,4,5,6],from:B.DAY_START,to:B.DAY_END,len:30,gap:30};
const worksOn=(id,date)=>cfgOf(id).days.includes(new Date(date+'T00:00:00').getDay());
const windowLabel=id=>{const c=cfgOf(id);return B.fmtT(c.from)+' – '+B.fmtT(c.to);};
const clientsOf=id=>B.USERS.filter(u=>u.advisorId===id||u.secondaryId===id);
const merge=l=>{l.sort((a,b)=>a[0]-b[0]);const m=[];for(const b of l){const x=m[m.length-1];if(x&&b[0]<=x[1])x[1]=Math.max(x[1],b[1]);else m.push([b[0],b[1]]);}return m;};

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

/* ---------------------------------------------------------------- the top menu -- */
/* Scheduling is opened many times a day; the other six are quarterly setup. Lifting it
   above a divider makes the menu answer "what am I here to do" before listing what exists. */
function TeamMenu({x,item,onPick,onClose}){
  return <React.Fragment>
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:60}}/>
    <div style={{position:'fixed',top:52,left:x,zIndex:61,width:268,background:'var(--surface)',
      border:'1px solid var(--border)',borderRadius:12,boxShadow:'0 14px 40px rgba(20,26,45,.18)',
      overflow:'hidden',padding:'6px 0'}}>
      {TEAM_MENU.map(m=><button key={m} type="button" onClick={()=>onPick(m)}
        style={{display:'block',width:'100%',padding:'10px 16px',border:0,
          background:item===m?'var(--tint)':'none',font:'inherit',fontSize:13.5,
          fontWeight:item===m?600:400,color:item===m?'var(--navy-deep)':'var(--ink)',
          textAlign:'left',cursor:'pointer'}}>{m}</button>)}
    </div>
  </React.Fragment>;
}

/* --------------------------------------------------------------- section router -- */
function TeamSection({item,appts,tweaks,onQuickBook,toast,team}){
  return item==='Schedule Meetings'
    ? <ScheduleMeetings appts={appts} tweaks={tweaks} onQuickBook={onQuickBook} toast={toast} team={team}/>
    : <Card><EmptyState>{item} isn&rsquo;t part of this prototype. Pick <b>Schedule Meetings</b> from the Team menu.</EmptyState></Card>;
}

/* ------------------------------------------------------------- schedule meetings -- */
const PXM=0.62;
const y=m=>(m-B.GRID_START)*PXM;
const hours=(()=>{const o=[];for(let m=Math.ceil(B.GRID_START/60)*60;m<=B.GRID_END;m+=60)o.push(m);return o;})();

function ScheduleMeetings({appts,tweaks,onQuickBook,team}){
  const [t,setT]=team;
  const {ids,date,offset}=t;
  const setIds=fn=>setT(v=>({...v,ids:typeof fn==='function'?fn(v.ids):fn}));
  const setDate=d=>setT(v=>({...v,date:d}));
  const setOffset=fn=>setT(v=>({...v,offset:typeof fn==='function'?fn(v.offset):fn}));

  const [q,setQ]=React.useState('');
  const [filter,setFilter]=React.useState('All');
  const [pick,setPick]=React.useState(null);       // {advisor,start,end}
  const [blocked,setBlocked]=React.useState(null); // {advisor,block}

  const days=B.weekDays(offset);
  const shown=ADVISORS.filter(a=>ids.includes(a.id));

  const takenFor=id=>appts.filter(a=>a.status==='Scheduled'&&a.people.includes(id));
  const blocksFor=(id,d)=>merge(B.busyFor(id,d).map(b=>[b[0],b[1]])
    .concat(takenFor(id).filter(x=>x.date===d).map(x=>[x.start,x.start+x.dur])));
  const openSlots=(id,d)=>{const busy=blocksFor(id,d);return configSlots(id,d).filter(s=>!busy.some(b=>B.overlaps(b,s)));};
  const openOn=d=>shown.reduce((n,a)=>n+openSlots(a.id,d).length,0);

  React.useEffect(()=>{
    if(!ids.length)return;
    if(openOn(date)>0&&days.includes(date))return;
    const better=days.find(d=>openOn(d)>0);
    if(better)setDate(better);
  },[ids.join(','),offset]);

  /* The rail is a ranking, not a roster: what is open on this date decides the order. */
  const ranked=ADVISORS
    .map(a=>({a,open:openSlots(a.id,date).length,clients:clientsOf(a.id).length}))
    .filter(r=>{
      if(filter==='Tax'&&!/^Tax/.test(r.a.role))return false;
      if(filter==='Wealth'&&!/Wealth/.test(r.a.role))return false;
      if(filter==='Open'&&!r.open)return false;
      const s=q.trim().toLowerCase();
      return !s||r.a.name.toLowerCase().includes(s)||r.a.role.toLowerCase().includes(s);
    })
    .sort((x,z)=>z.open-x.open||x.a.name.localeCompare(z.a.name));

  const counts={All:ADVISORS.length,
    Tax:ADVISORS.filter(a=>/^Tax/.test(a.role)).length,
    Wealth:ADVISORS.filter(a=>/Wealth/.test(a.role)).length,
    Open:ADVISORS.filter(a=>openSlots(a.id,date).length).length};

  const toggle=id=>setIds(x=>x.includes(id)?x.filter(i=>i!==id):[...x,id]);

  const nextFree=id=>{
    for(const d of days){
      if(d<date)continue;
      const s=openSlots(id,d);
      if(s.length)return {date:d,start:s[0][0]};
    }
    return null;
  };

  const cols='54px repeat('+Math.max(shown.length,1)+',minmax(0,1fr))';
  const nowVisible=date===B.TODAY&&B.NOW_MIN>B.GRID_START&&B.NOW_MIN<B.GRID_END;
  const total=openOn(date);

  return <div>
    <div className="ptitle">
      <div>
        <h2>Schedule meetings</h2>
        <div className="sub">Tick advisors on the left &mdash; their columns appear and disappear as you go.</div>
      </div>
      {!!shown.length&&<span style={{background:'var(--green-soft)',color:'var(--green-deep)',
        border:'1px solid #bfe3cb',borderRadius:20,padding:'7px 13px',fontSize:12.5,fontWeight:700}}>
        {shown.length} selected &middot; {total} open on {B.fmtD(date)}</span>}
    </div>

    {/* One screen: the roster stays beside the calendar, so adding or dropping an
        advisor is a tick against the grid rather than a trip to another step. */}
    <div style={{display:'grid',gridTemplateColumns:'262px minmax(0,1fr)',gap:14,alignItems:'start'}}>

      <Card>
        <div className="pc-chdr" style={{height:'auto',padding:'11px 14px',display:'flex',alignItems:'center',gap:8}}>
          <span style={{flex:1,fontSize:12.5,fontWeight:700}}>Advisors</span>
          {!!shown.length&&<button type="button" onClick={()=>setIds([])}
            style={{border:0,background:'none',font:'inherit',fontSize:11.5,fontWeight:700,
              color:'var(--navy)',cursor:'pointer',padding:0}}>Clear</button>}
          <button type="button" onClick={()=>setIds(ADVISORS.map(a=>a.id))}
            style={{border:0,background:'none',font:'inherit',fontSize:11.5,fontWeight:700,
              color:'var(--navy)',cursor:'pointer',padding:0}}>All</button>
        </div>

        <div style={{padding:'10px 12px',display:'grid',gap:8,borderBottom:'1px solid var(--border)'}}>
          <SearchInput value={q} onChange={setQ} placeholder="Search advisors"/>
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {['All','Tax','Wealth','Open'].map(f=><button key={f} type="button" onClick={()=>setFilter(f)}
              style={{padding:'4px 9px',borderRadius:20,cursor:'pointer',font:'inherit',fontSize:11.5,
                fontWeight:filter===f?700:600,
                border:'1px solid '+(filter===f?'var(--navy)':'var(--border)'),
                background:filter===f?'var(--tint)':'var(--surface)',
                color:filter===f?'var(--navy-deep)':'var(--ink-2)'}}>
              {f==='Open'?'Open now':f} {counts[f]}
            </button>)}
          </div>
        </div>

        <div style={{maxHeight:470,overflowY:'auto',padding:6}}>
          {ranked.map(({a,open,clients})=>{
            const on=ids.includes(a.id);
            return <label key={a.id} style={{display:'flex',alignItems:'center',gap:9,padding:'8px 8px',
              borderRadius:9,cursor:'pointer',opacity:open?1:.62,
              background:on?'var(--tint)':'transparent'}}>
              <input type="checkbox" checked={on} onChange={()=>toggle(a.id)}
                style={{width:15,height:15,accentColor:'var(--navy)',flex:'none'}}/>
              <Avatar name={a.name} size={26}/>
              <span style={{flex:1,minWidth:0}}>
                <span style={{display:'block',fontSize:12.5,fontWeight:700,whiteSpace:'nowrap',
                  overflow:'hidden',textOverflow:'ellipsis'}}>{a.name}</span>
                <span style={{display:'block',fontSize:10.5,color:'var(--ink-2)',whiteSpace:'nowrap',
                  overflow:'hidden',textOverflow:'ellipsis'}}>{clients} clients &middot; {windowLabel(a.id)}</span>
              </span>
              <span style={{flex:'none',fontFamily:'var(--mono)',fontSize:14,fontWeight:600,
                color:open?'var(--green-deep)':'var(--ink-3)'}}>{open}</span>
            </label>;
          })}
          {!ranked.length&&<div className="muted" style={{padding:'14px 8px',fontSize:12}}>No advisor matches that.</div>}
        </div>
      </Card>

      <Card>
        {tweaks&&tweaks.googleDown
          ? <div className="pad"><Note icon={<Icon name="alert" size={14}/>}>
              Google Calendar is unreachable, so free/busy cannot be read. Nothing here is verified.
            </Note></div>
          : <React.Fragment>

          <div className="dstrip">
            <button className="navbtn" onClick={()=>setOffset(o=>o-1)} disabled={offset<=0} aria-label="Previous week">&lsaquo;</button>
            <div className="days">
              {days.map(d=>{
                const works=shown.length?shown.some(a=>worksOn(a.id,d)):true;
                const n=works?openOn(d):0;
                return <button key={d} className={'dchip'+(d===date?' on':'')+(works?'':' off')+(d===B.TODAY?' today':'')}
                  onClick={()=>works&&setDate(d)} disabled={!works}>
                  <div className="w">{B.fmtD(d,{weekday:'short',day:undefined,month:undefined})}</div>
                  <div className="d">{new Date(d+'T12:00:00+05:30').getDate()}</div>
                  <div className={'c '+(n?'some':'none')}>
                    {!shown.length?'\u2014':works?(n?n+' open':'none'):'off'}
                  </div>
                </button>;
              })}
            </div>
            <button className="navbtn" onClick={()=>setOffset(o=>o+1)} aria-label="Next week">&rsaquo;</button>
          </div>

          {!shown.length
            ? <EmptyState>Tick an advisor on the left. Columns appear here as you do.</EmptyState>
            : <React.Fragment>
            <div className="ghead" style={{gridTemplateColumns:cols}}>
              <div/>
              {shown.map(a=>{const n=openSlots(a.id,date).length;return <div key={a.id}>
                <Avatar name={a.name} size={18} style={{fontSize:8}}/>
                <span className="gn">{a.name}</span>
                <span style={{color:n?'var(--green-deep)':'var(--ink-3)'}}>{n}</span>
                <button type="button" onClick={()=>toggle(a.id)} aria-label={'Remove '+a.name}
                  style={{border:0,background:'none',padding:0,marginLeft:2,color:'var(--ink-3)',cursor:'pointer',display:'flex'}}>
                  <Icon name="x" size={12}/>
                </button>
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
                  return <div className="gcol" key={a.id}>
                    {hours.map(h=><div key={h} className="hline" style={{top:y(h)}}/>)}
                    {off.map(o=>o[1]>o[0]&&<div key={o[0]} className="offhrs" style={{top:y(o[0]),height:y(o[1])-y(o[0])}}/>)}
                    {!on&&<div className="busy" style={{top:y(c.from),height:26,background:'transparent',border:0}}>Not scheduled</div>}
                    {on&&blocksFor(a.id,date).filter(b=>b[1]>c.from&&b[0]<c.to).map(b=>{
                      const s=Math.max(b[0],c.from),e=Math.min(b[1],c.to);
                      return <button key={b[0]} className="busy" type="button"
                        onClick={()=>setBlocked({advisor:a,block:[s,e]})}
                        style={{top:y(s),height:Math.max(y(e)-y(s),16),cursor:'not-allowed',textAlign:'left',
                          font:'inherit',fontSize:10.5,fontWeight:600}}
                        title="Busy — not bookable">{y(e)-y(s)>=22?'Busy':''}</button>;
                    })}
                    {on&&openSlots(a.id,date).map(s=><button key={s[0]} className="slot" type="button"
                      style={{top:y(s[0]),height:Math.max(y(s[1])-y(s[0])-2,16)}}
                      onClick={()=>setPick({advisor:a,start:s[0],end:s[1]})}
                      title={'Book '+B.fmtT(s[0])+' with '+a.name}>
                      <span>{B.fmtT(s[0])}</span>
                    </button>)}
                    {nowVisible&&<div className="nowline" style={{top:y(B.NOW_MIN)}}/>}
                  </div>;
                })}
              </div>
            </div>

            <div className="legend">
              <span><i style={{background:'var(--green-soft)',border:'1px solid #bfe3cb'}}/>Open &mdash; click to book</span>
              <span><i style={{background:'var(--surface-2)',border:'1px solid var(--border-2)'}}/>Busy &mdash; not bookable</span>
              <span><i style={{background:'repeating-linear-gradient(135deg,var(--surface-2) 0 6px,var(--surface-3) 6px 12px)'}}/>Outside their hours</span>
              <span style={{marginLeft:'auto'}}>Slots follow each advisor&rsquo;s Time Slot Config &middot; IST</span>
            </div>
          </React.Fragment>}
        </React.Fragment>}
      </Card>
    </div>

    {blocked&&<BusyNote blocked={blocked} date={date} next={nextFree(blocked.advisor.id)}
      onClose={()=>setBlocked(null)} onGo={d=>{setDate(d);setBlocked(null);}}/>}

    {pick&&<PickClient pick={pick} date={date} tweaks={tweaks}
      onClose={()=>setPick(null)} onBook={onQuickBook}/>}
  </div>;
}

/* A taken block explains itself rather than being a dead pixel, and points somewhere. */
function BusyNote({blocked,date,next,onClose,onGo}){
  const {advisor,block}=blocked;
  return <Modal title={advisor.name.split(' ')[0]+' is booked '+B.fmtT(block[0])+' – '+B.fmtT(block[1])}
    subtitle="Booking over it would double-book them." onClose={onClose}
    footer={<React.Fragment>
      <Button variant="ghost" onClick={onClose}>Close</Button>
      {next&&<Button onClick={()=>onGo(next.date)}>Go to {B.fmtD(next.date)}</Button>}
    </React.Fragment>}>
    <Note icon={<Icon name="clock" size={14}/>}>
      {next
        ? <React.Fragment>Next opening for {advisor.name.split(' ')[0]}: <b>{B.fmtD(next.date)}, {B.fmtT(next.start)}</b>.</React.Fragment>
        : <React.Fragment>{advisor.name.split(' ')[0]} has nothing open this week. Try the next week, or another advisor who shares this client.</React.Fragment>}
    </Note>
  </Modal>;
}

/* ------------------------------------------------------------------ pick a client -- */
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
      setErr(advisor.name.split(' ')[0]+' was booked into '+B.fmtT(start)+' a moment ago. Close this and pick another slot.');
      return;
    }
    const people=[
      {id:client.id,name:client.name,email:client.email,kind:'client',hasCalendar:false,locked:true},
      {...advisor,kind:'staff',hasCalendar:true},
    ];
    onBook({date,start,dur,type,fireflies:!!(tweaks&&tweaks.firefliesDefault),peopleObjs:people,
      external:people.some(p=>!isInternal(p.email))},client);
  };

  return <Modal title={B.fmtT(start)+' – '+B.fmtT(end)+' · '+B.fmtD(date)}
    subtitle={'with '+advisor.name+' · '+advisor.role} onClose={onClose}
    footer={<React.Fragment>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button onClick={submit} disabled={!client}>{client?'Review invite':'Choose a client'}</Button>
    </React.Fragment>}>
    {client
      ? <div className="locked" style={{marginBottom:12}}>
          <Avatar name={client.name} size={28}/>
          <div style={{flex:1,minWidth:0}}>
            <div className="nm">{client.name} <TierChip tier={client.tier}/></div>
            <div className="em">{client.phone} &middot; {client.plan}</div>
          </div>
          <Button variant="ghost" onClick={()=>{setClient(null);setErr('');}}>Change</Button>
        </div>
      : <div style={{marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <div className="lbl" style={{flex:1}}>
              {all?'All clients · '+B.USERS.length:'Assigned to '+advisor.name.split(' ')[0]+' · '+mine.length}
            </div>
            {!!mine.length&&<Button variant="ghost" onClick={()=>{setAll(v=>!v);setQ('');}}>
              {all?'Only their clients':'Show all clients'}
            </Button>}
          </div>
          <SearchInput value={q} onChange={setQ} placeholder="Search by name, email or phone"/>
          <div style={{marginTop:8,maxHeight:230,overflowY:'auto'}}>
            {matches.map(u=><div key={u.id} className="dd-item" onClick={()=>setClient(u)}>
              <Avatar name={u.name} size={24}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600}}>{u.name}</div>
                <div className="r">{u.phone} &middot; {u.plan}</div>
              </div>
              {u.advisorId===advisor.id?<Tag tone="blue">primary</Tag>
                :u.secondaryId===advisor.id?<Tag tone="violet">secondary</Tag>:null}
            </div>)}
            {!matches.length&&<div className="muted" style={{padding:'12px 2px',fontSize:12.5}}>
              {q?'No client matches that.':advisor.name+' has no clients assigned yet.'}
            </div>}
          </div>
        </div>}

    {client&&client.advisorId!==advisor.id&&client.secondaryId!==advisor.id&&
      <Note icon={<Icon name="alert" size={14}/>}>
        {advisor.name} is not assigned to {client.name}. You can still book it.
      </Note>}

    <Field label="Consultation type">
      <Input as="select" value={type} onChange={e=>setType(e.target.value)}>
        {B.CONSULT_TYPES.map(x=><option key={x}>{x}</option>)}
      </Input>
    </Field>

    {err&&<Note icon={<Icon name="alert" size={14}/>}>{err}</Note>}
  </Modal>;
}

Object.assign(window,{TeamSection,TeamMenu,TEAM_MENU});
})();
