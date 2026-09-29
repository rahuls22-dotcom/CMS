(function(){
const NS=window.ProsperrAdvisorConsoleDS_c294ad;
const {TopBar,MeBadge,IconButton,Toast,ToastStack,EmptyState,Card}=NS;
const B=window.BK;

const TWEAK_DEFAULTS=/*EDITMODE-BEGIN*/{
  "googleDown": false,
  "simulateConflict": false,
  "firefliesDefault": false
}/*EDITMODE-END*/;

const toPeople=a=>a.peopleObjs||[];
function BookingApp(){
  const [t,setTweak]=useTweaks(TWEAK_DEFAULTS);
  const [nav,setNav]=React.useState('Users');
  const [userId,setUserId]=React.useState(null);
  const [section,setSection]=React.useState('User Profile');
  const [mode,setMode]=React.useState('list');         // list | book | draft | confirm
  const [draft,setDraft]=React.useState(null);
  const [apptId,setApptId]=React.useState(null);
  const [resched,setResched]=React.useState(null);
  const [appts,setAppts]=React.useState(B.APPTS);
  const [toasts,setToasts]=React.useState([]);
  const toast=(m,tone,icon)=>{const id=Math.random();setToasts(x=>[...x,{id,m,tone,icon}]);setTimeout(()=>setToasts(x=>x.filter(y=>y.id!==id)),3400);};
  const u=B.USERS.find(x=>x.id===userId);
  const appt=appts.find(a=>a.id===apptId);
  const goUsers=()=>{setNav('Users');setUserId(null);setMode('list');};
  const hasUpcoming=id=>appts.some(a=>a.userId===id&&a.status==='Scheduled');
  const openUser=id=>{setUserId(id);setSection('Manage Appointment');setMode(hasUpcoming(id)?'list':'book');window.scrollTo(0,0);};
  const setSec=s=>{setSection(s);setMode(s==='Manage Appointment'&&u&&hasUpcoming(u.id)?'list':s==='Manage Appointment'?'book':'list');setResched(null);};
  const meetId=()=>{const r=()=>Math.random().toString(36).slice(2,5);return `meet.google.com/${r()}-${r()}${r().slice(0,1)}-${r()}`;};

  const confirmed=d=>{setDraft(d);setMode('draft');window.scrollTo(0,0);};
  const created=({subject,body})=>{const d=draft;
    if(resched){setAppts(as=>as.map(a=>a.id===resched.id?{...a,...d,people:d.peopleObjs.filter(p=>p.kind==='staff').map(p=>p.id),rescheduled:true}:a));setApptId(resched.id);setResched(null);toast('Rescheduled · updated invites sent','good','check');}
    else{const id='ap'+Date.now();setAppts(as=>[...as,{id,userId:u.id,status:'Scheduled',meet:meetId(),people:d.peopleObjs.filter(p=>p.kind==='staff').map(p=>p.id),...d}]);setApptId(id);toast(`Invites sent to ${d.peopleObjs.length+(d.fireflies?1:0)} people`,'good','send');}
    setDraft(null);setMode('list');window.scrollTo(0,0);};
  const viewAppt=a=>{if(!a.peopleObjs){a.peopleObjs=[{id:u.id,name:u.name,email:u.email,kind:'client',hasCalendar:false,locked:true},...a.people.map(id=>({...B.STAFF.find(s=>s.id===id),kind:'staff',hasCalendar:true}))];a.meet=a.meet||meetId();a.external=true;}
    setApptId(a.id);setMode('confirm');};

  let body;
  if(nav!=='Users')body=<Card><EmptyState>{nav} isn't part of this prototype. Start from <b>Users</b> in the top bar.</EmptyState></Card>;
  else if(!u)body=<UsersList onOpen={openUser}/>;
  else{
    const crumbs=[{label:'Users',onClick:goUsers},{label:u.name,onClick:()=>setSec('User Profile')},{label:section,onClick:mode!=='list'?()=>{setResched(null);setMode('list');}:null}];
    if(mode==='book')crumbs.push({label:resched?'Reschedule':'Create event'});
    if(mode==='draft')crumbs.push({label:'Review invite'});
    if(mode==='confirm')crumbs.push({label:'Appointment'});
    let inner;
    if(section==='User Profile')inner=<Profile u={u}/>;
    else if(section==='Manage Appointment'){
      inner=mode==='draft'&&draft?<EmailDraft draft={draft} u={u} reschedule={resched} onSend={created} onBack={()=>setMode('book')}/>
        :mode==='confirm'&&appt?<Confirmation appt={appt} u={u} toast={toast} onBack={()=>{setResched(null);setApptId(null);setMode('list');}}
            onReschedule={()=>{setResched(appt);setMode('book');}}
            onCancelled={()=>{setAppts(as=>as.map(a=>a.id===appt.id?{...a,status:'Cancelled'}:a));toast('Cancelled · everyone notified','','x');}}/>
        :mode==='book'?<BookCall key={(resched&&resched.id)||'new'} u={u} appts={appts} tweaks={t} reschedule={resched} onCreated={confirmed} onBack={()=>{setResched(null);setMode('list');}} toast={toast}/>
        :<Appointments u={u} appts={appts} toast={toast} onBook={()=>{setResched(null);setMode('book');}} onView={viewAppt} onReschedule={a=>{viewAppt(a);setResched(appts.find(x=>x.id===a.id));setMode('book');}}/>;
    } else inner=<Card><EmptyState>{section} isn't part of this prototype.</EmptyState></Card>;
    body=<UserPage u={u} section={section} setSection={setSec} crumbs={crumbs} toast={toast}>{inner}</UserPage>;
  }
  const links=['Dashboard','Users','Team','Chat','Tasks','Sales','Coins & Refer'].map(l=>({label:l,active:nav===l,onClick:()=>{setNav(l);if(l==='Users')goUsers();}}));
  return <div className="app">
    <TopBar links={links} fy="F.Y. 2026-27" right={<><span className="pc-fy" style={{gap:8}}>TAX_ADMIN</span><IconButton icon="bell" label="Notifications"/><MeBadge initials="RS"/></>}/>
    <div className="main">{body}</div>
    <ToastStack>{toasts.map(x=><Toast key={x.id} tone={x.tone||'default'} icon={x.icon}>{x.m}</Toast>)}</ToastStack>
    <TweaksPanel>
      <TweakSection label="Failure cases"/>
      <TweakToggle label="Google Calendar unreachable" value={t.googleDown} onChange={v=>setTweak('googleDown',v)}/>
      <TweakToggle label="Slot taken on submit (409)" value={t.simulateConflict} onChange={v=>setTweak('simulateConflict',v)}/>
      <TweakSection label="Defaults"/>
      <TweakToggle label="Fireflies on by default" value={t.firefliesDefault} onChange={v=>setTweak('firefliesDefault',v)}/>
    </TweaksPanel>
  </div>;
}
window.__mount_booking=()=>{const r=document.getElementById('root');if(r&&!r.dataset.mounted){r.dataset.mounted='1';ReactDOM.createRoot(r).render(<BookingApp/>);}};
})();
