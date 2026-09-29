(function(){
const NS=window.ProsperrAdvisorConsoleDS_c294ad;
const {TopBar,MeBadge,IconButton,Toast,ToastStack,EmptyState,Card}=NS;
const B=window.BK;

/* Whoever is signed in. Scheduling across advisors is a relationship manager's job,
   not an admin's, and the top bar should say so. */
const ME=B.STAFF.find(s=>s.role==='Relationship Manager')||B.STAFF[0];
const initialsOf=n=>n.split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();

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
  const [fromTeam,setFromTeam]=React.useState(false);   // the draft came from the team board
  /* The team board unmounts while the invite is reviewed. An RM books dozens in a
     sitting, so the advisors they picked and the day they were on live up here. */
  const team=React.useState({ids:[],date:B.TODAY,offset:0});
  const [teamMenu,setTeamMenu]=React.useState(false);
  const [teamItem,setTeamItem]=React.useState('Schedule Meetings');
  const [menuX,setMenuX]=React.useState(236);
  /* The menu hangs off the Team link in the top bar, so measure where that is
     rather than hard-coding an offset that breaks when the nav changes. */
  const toggleTeamMenu=()=>{
    const a=Array.from(document.querySelectorAll('.pc-nav a')).find(el=>el.textContent.trim()==='Team');
    if(a)setMenuX(Math.round(a.getBoundingClientRect().left));
    setTeamMenu(v=>!v);
  };
  const goTeam=item=>{setTeamItem(item);setNav('Team');setTeamMenu(false);setUserId(null);setDraft(null);setFromTeam(false);setMode('list');};
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
  const quickBook=(d,client)=>{setUserId(client.id);setDraft(d);setFromTeam(true);setMode('draft');window.scrollTo(0,0);};
  const leaveTeamDraft=()=>{setDraft(null);setFromTeam(false);setUserId(null);setMode('list');};
  const created=({subject,body})=>{const d=draft;
    if(resched){setAppts(as=>as.map(a=>a.id===resched.id?{...a,...d,people:d.peopleObjs.filter(p=>p.kind==='staff').map(p=>p.id),rescheduled:true}:a));setApptId(resched.id);setResched(null);toast('Rescheduled · updated invites sent','good','check');}
    else{const id='ap'+Date.now();setAppts(as=>[...as,{id,userId:u.id,status:'Scheduled',meet:meetId(),people:d.peopleObjs.filter(p=>p.kind==='staff').map(p=>p.id),...d}]);setApptId(id);toast(`Invites sent to ${d.peopleObjs.length+(d.fireflies?1:0)} people`,'good','send');}
    setDraft(null);
    if(fromTeam){setFromTeam(false);setUserId(null);setApptId(null);setMode('list');}
    else setMode('list');
    window.scrollTo(0,0);};
  const viewAppt=a=>{if(!a.peopleObjs){a.peopleObjs=[{id:u.id,name:u.name,email:u.email,kind:'client',hasCalendar:false,locked:true},...a.people.map(id=>({...B.STAFF.find(s=>s.id===id),kind:'staff',hasCalendar:true}))];a.meet=a.meet||meetId();a.external=true;}
    setApptId(a.id);setMode('confirm');};

  let body;
  if(nav==='Team'){
    body=mode==='draft'&&draft&&u
      ? <React.Fragment>
          <Crumbs items={[{label:'Team',onClick:leaveTeamDraft},{label:'Review invite'}]}/>
          <EmailDraft draft={draft} u={u} onSend={created} onBack={leaveTeamDraft}/>
        </React.Fragment>
      : <TeamSection item={teamItem} appts={appts} tweaks={t} toast={toast} onQuickBook={quickBook} team={team}/>;
  }
  else if(nav!=='Users')body=<Card><EmptyState>{nav} isn't part of this prototype. Start from <b>Users</b> in the top bar.</EmptyState></Card>;
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
  const links=['Dashboard','Users','Team','Chat','Tasks','Sales','Coins & Refer'].map(l=>({
    label:l,active:nav===l,
    onClick:l==='Team'?toggleTeamMenu
      :()=>{setNav(l);setTeamMenu(false);if(l==='Users')goUsers();else{setUserId(null);setDraft(null);setFromTeam(false);setMode('list');}},
  }));
  return <div className="app">
    <TopBar links={links} fy="F.Y. 2026-27" right={<><span className="pc-fy" style={{gap:8}} title={ME.name+" · "+ME.role}>RM</span><IconButton icon="bell" label="Notifications"/><MeBadge initials={initialsOf(ME.name)}/></>}/>
    {teamMenu&&<TeamMenu x={menuX} item={teamItem} onPick={goTeam} onClose={()=>setTeamMenu(false)}/>}
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
