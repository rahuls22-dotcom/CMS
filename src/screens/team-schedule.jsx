/* Team availability — every advisor's day side by side. The advisors are fixed and the
   client changes, which is the RM's problem working down a call list. Booking from here
   joins the same review-then-send path as the client-first screen. */
(function(){
const NS=window.ProsperrAdvisorConsoleDS_c294ad;
const {Card,Avatar,Button,Icon,Field,Input,Modal,FilterChip,SearchInput,EmptyState,Note,Tag,TierChip}=NS;
const B=window.BK;

const PXM=0.62;                                  // px per minute of grid height
const ADVISORS=B.STAFF.filter(s=>/Advisor/.test(s.role));
const isInternal=e=>e.toLowerCase().endsWith('@'+B.DOMAIN);
const y=m=>(m-B.GRID_START)*PXM;
const hours=(()=>{const o=[];for(let m=Math.ceil(B.GRID_START/60)*60;m<=B.GRID_END;m+=60)o.push(m);return o;})();
const merge=list=>{list.sort((a,b)=>a[0]-b[0]);const m=[];for(const b of list){const l=m[m.length-1];if(l&&b[0]<=l[1])l[1]=Math.max(l[1],b[1]);else m.push([b[0],b[1]]);}return m;};

function TeamSchedule({appts,tweaks,onQuickBook,toast}){
  const [offset,setOffset]=React.useState(0);
  const [date,setDate]=React.useState(B.TODAY);
  const [ids,setIds]=React.useState(ADVISORS.map(a=>a.id));
  const [dur,setDur]=React.useState(30);
  const [pick,setPick]=React.useState(null);     // {advisor,start}
  const days=B.weekDays(offset);
  const shown=ADVISORS.filter(a=>ids.includes(a.id));

  /* A scheduled call blocks its advisors whoever the client is — that is the whole
     point of looking at this board rather than one client's record. */
  const takenFor=id=>appts.filter(a=>a.status==='Scheduled'&&a.people.includes(id)).map(a=>({date:a.date,start:a.start,dur:a.dur}));
  const slotsFor=(id,d)=>B.freeSlots([{id,hasCalendar:true}],d,dur,takenFor(id),dur);
  const blocksFor=(id,d)=>merge(B.busyFor(id,d).map(b=>[b[0],b[1]]).concat(
    takenFor(id).filter(t=>t.date===d).map(t=>[t.start,t.start+t.dur])));

  const openOn=d=>shown.reduce((n,a)=>n+slotsFor(a.id,d).length,0);
  const total=openOn(date);
  const cols='54px repeat('+Math.max(shown.length,1)+',minmax(0,1fr))';
  const nowVisible=date===B.TODAY&&B.NOW_MIN>B.GRID_START&&B.NOW_MIN<B.GRID_END;

  return <div>
    <div className="ptitle">
      <div>
        <h2>Team availability</h2>
        <div className="sub">Pick an open slot in any advisor's column, then choose who it's for.</div>
      </div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <Field label="Length"><Input as="select" value={dur} onChange={e=>setDur(+e.target.value)}>
          {[15,30,45,60].map(m=><option key={m} value={m}>{m} min</option>)}
        </Input></Field>
      </div>
    </div>

    <Card style={{marginBottom:16}}>
      <div className="ulist-top">
        {ADVISORS.map(a=><FilterChip key={a.id} active={ids.includes(a.id)}
          onClick={()=>setIds(x=>x.includes(a.id)?x.filter(i=>i!==a.id):[...x,a.id])}>
          {a.name}
        </FilterChip>)}
        <span className="muted" style={{marginLeft:'auto',fontSize:12}}>
          {shown.length?`${total} open ${dur}-minute slot${total===1?'':'s'} on ${B.fmtD(date)}`:'No advisors selected'}
        </span>
      </div>

      <div className="dstrip">
        <button className="navbtn" onClick={()=>setOffset(o=>o-1)} disabled={offset<=0} aria-label="Previous week">‹</button>
        <div className="days">
          {days.map(d=>{
            const work=B.isWorkDay(d),n=work?openOn(d):0;
            return <button key={d} className={'dchip'+(d===date?' on':'')+(work?'':' off')+(d===B.TODAY?' today':'')}
              onClick={()=>work&&setDate(d)} disabled={!work}>
              <div className="w">{B.fmtD(d,{weekday:'short',day:undefined,month:undefined})}</div>
              <div className="d">{new Date(d+'T12:00:00+05:30').getDate()}</div>
              <div className={'c '+(n?'some':'none')}>{work?(n?n+' open':'none'):'closed'}</div>
            </button>;
          })}
        </div>
        <button className="navbtn" onClick={()=>setOffset(o=>o+1)} aria-label="Next week">›</button>
      </div>

      {tweaks&&tweaks.googleDown
        ? <div className="pad"><Note icon={<Icon name="alert" size={14}/>}>
            Google Calendar is unreachable, so nobody's free/busy can be read. Times shown
            elsewhere are not verified until it is back.
          </Note></div>
        : !shown.length
        ? <EmptyState>Tick an advisor above to see their day.</EmptyState>
        : <React.Fragment>
        <div className="ghead" style={{gridTemplateColumns:cols}}>
          <div/>
          {shown.map(a=>{const n=slotsFor(a.id,date).length;return <div key={a.id}>
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
              const work=B.isWorkDay(date);
              const off=work?[[B.GRID_START,B.DAY_START],[B.DAY_END,B.GRID_END]]:[[B.GRID_START,B.GRID_END]];
              return <div className="gcol" key={a.id}>
                {hours.map(h=><div key={h} className="hline" style={{top:y(h)}}/>)}
                {off.map(o=><div key={o[0]} className="offhrs" style={{top:y(o[0]),height:y(o[1])-y(o[0])}}/>)}
                {work&&blocksFor(a.id,date).map(b=><div key={b[0]} className="busy"
                  style={{top:y(b[0]),height:Math.max(y(b[1])-y(b[0]),14)}} title="Busy">
                  {y(b[1])-y(b[0])>=22?'Busy':''}
                </div>)}
                {work&&slotsFor(a.id,date).map(s=><button key={s} className="slot"
                  style={{top:y(s),height:Math.max(y(s+dur)-y(s)-2,15)}}
                  onClick={()=>setPick({advisor:a,start:s})}
                  title={`Book ${B.fmtT(s)} with ${a.name}`}>
                  <span>{B.fmtT(s)}</span>
                </button>)}
                {nowVisible&&<div className="nowline" style={{top:y(B.NOW_MIN)}}/>}
              </div>;
            })}
          </div>
        </div>

        <div className="legend">
          <span><i style={{background:'var(--green-soft)',border:'1px solid #bfe3cb'}}/>Open</span>
          <span><i style={{background:'var(--surface-2)',border:'1px solid var(--border-2)'}}/>Busy</span>
          <span><i style={{background:'repeating-linear-gradient(135deg,var(--surface-2) 0 6px,var(--surface-3) 6px 12px)'}}/>Outside working hours</span>
          <span style={{marginLeft:'auto'}}>Working hours {B.fmtT(B.DAY_START)} – {B.fmtT(B.DAY_END)}, Mon–Sat · IST</span>
        </div>
      </React.Fragment>}
    </Card>

    {pick&&<QuickBook pick={pick} date={date} dur={dur} tweaks={tweaks}
      onClose={()=>setPick(null)} onBook={onQuickBook} toast={toast}/>}
  </div>;
}

/* The advisor and the time are already decided — you clicked them. The only open
   question is who the call is for, so the client search takes focus. */
function QuickBook({pick,date,dur,tweaks,onClose,onBook,toast}){
  const [q,setQ]=React.useState('');
  const [client,setClient]=React.useState(null);
  const [type,setType]=React.useState(B.CONSULT_TYPES[1]);
  const [err,setErr]=React.useState('');
  const {advisor,start}=pick;
  const matches=B.USERS.filter(u=>!q.trim()||[u.name,u.email,u.phone].some(v=>v.toLowerCase().includes(q.trim().toLowerCase()))).slice(0,5);
  const theirs=client&&(client.advisorId===advisor.id||client.secondaryId===advisor.id);

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

  return <Modal title={`${B.fmtT(start)} – ${B.fmtT(start+dur)} · ${B.fmtD(date)}`}
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
          <SearchInput value={q} onChange={setQ} placeholder="Search client by name, email or phone"/>
          <div style={{marginTop:8}}>
            {matches.map(u=><div key={u.id} className="dd-item" onClick={()=>setClient(u)}>
              <Avatar name={u.name} size={24}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600}}>{u.name}</div>
                <div className="r">{u.phone} · {u.plan}</div>
              </div>
              {(u.advisorId===advisor.id||u.secondaryId===advisor.id)&&<Tag tone="blue">their advisor</Tag>}
            </div>)}
            {!matches.length&&<div className="muted" style={{padding:'10px 2px',fontSize:12.5}}>No client matches “{q}”.</div>}
          </div>
        </div>}

    {client&&!theirs&&<Note icon={<Icon name="alert" size={14}/>}>
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

window.TeamSchedule=TeamSchedule;
})();
