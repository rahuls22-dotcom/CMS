/* Users list + user page (sidebar, profile, appointments list) */
(function(){
const NS=window.ProsperrAdvisorConsoleDS_c294ad;
const {Card,DataTable,Avatar,TierChip,Tag,SearchInput,FilterChip,ClientHeader,Button,Icon,SegmentedTabs,ListRow,EmptyState,KeyValueList,StatusPill,LinkButton,QuickAction}=NS;
const B=window.BK;
const staff=id=>B.STAFF.find(s=>s.id===id);

function Crumbs({items}){return <div className="crumbs">{items.map((it,i)=><React.Fragment key={i}>{i>0&&<span className="sep">›</span>}{it.onClick?<a onClick={it.onClick}>{it.label}</a>:<span>{it.label}</span>}</React.Fragment>)}</div>;}

function UsersList({onOpen}){
  const [q,setQ]=React.useState('');const [tier,setTier]=React.useState('all');
  const all=B.USERS.filter(u=>(tier==='all'||u.tier===tier)&&(!q||(u.name+u.email+u.phone).toLowerCase().includes(q.toLowerCase())));
  /* Two thousand rows is not a table anyone reads — show a page of them and let
     search do the finding. */
  const PAGE=25;
  const list=all.slice(0,PAGE);
  return <>
    <div className="ptitle"><div><h2>Users</h2><div className="sub">{all.length.toLocaleString('en-IN')} client{all.length===1?'':'s'}{all.length>list.length?' · showing the first '+list.length+', search to narrow':' · click a row to open the user'}</div></div></div>
    <Card>
      <div className="ulist-top"><SearchInput value={q} onChange={setQ} placeholder="Search by name, email or phone"/>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{['all','Elite','Premium','Advanced','Basic'].map(t=><FilterChip key={t} active={tier===t} onClick={()=>setTier(t)}>{t==='all'?'All tiers':t}</FilterChip>)}</div></div>
      {list.length?<DataTable columns={['Client','Tier','Plan','Advisor','RM','Status','']} onRowClick={i=>onOpen(list[i].id)}
        rows={list.map(u=>[<span className="uname"><Avatar name={u.name} size={28}/><span><b>{u.name}</b><div className="muted">{u.email}</div></span></span>,
          <TierChip tier={u.tier}/>,u.plan,staff(u.advisorId).name,staff(u.rmId).name,
          <Tag variant="chip" tone={u.status==='Active'?'green':u.status==='Onboarding'?'blue':'neutral'}>{u.status}</Tag>,
          <QuickAction solid>Open</QuickAction>])}/>:<EmptyState>No users match “{q}”.</EmptyState>}
    </Card>
  </>;
}

const MENU=['User Profile','View Income','View Deduction','Exemption Page','Advisor Document','Onboarding Details','Client Chat','User Activity','Notes','Consultation Experience','Manage Appointment','User Active Milestone','Coins & Referrals History'];

function Profile({u}){
  return <div className="pgrid">
    <Card title="Client"><div className="pad"><KeyValueList boxed={false} items={[['Name',u.name],['Email',u.email],['Phone',u.phone],['City',u.city],['Joined',u.joined]]}/></div></Card>
    <Card title="Plan & team"><div className="pad"><KeyValueList boxed={false} items={[['Tier',<TierChip tier={u.tier}/>],['Plan',u.plan],['Tax advisor',staff(u.advisorId).name],['Relationship manager',staff(u.rmId).name],['Status',u.status]]}/></div></Card>
  </div>;
}

function Appointments({u,appts,onBook,onView,onReschedule,toast}){
  const [tab,setTab]=React.useState('up');
  const mine=appts.filter(a=>a.userId===u.id);
  const isUp=a=>a.status==='Scheduled';
  const list=mine.filter(a=>tab==='up'?isUp(a):!isUp(a)).sort((a,b)=>tab==='up'?(a.date+a.start).localeCompare(b.date+b.start):(b.date).localeCompare(a.date));
  const tone={Scheduled:'blue',Completed:'green',Cancelled:'neutral'};
  return <>
    <div className="ptitle"><h1 className="pgh">Manage Appointment</h1>
      <Button variant="primary" icon={<Icon name="plus" size={14}/>} onClick={onBook}>Create event</Button></div>
    <Card>
      <div className="pad" style={{borderBottom:'1px solid var(--border)',maxWidth:320}}><SegmentedTabs value={tab} onChange={setTab} items={[{value:'up',label:'Upcoming',count:mine.filter(isUp).length},{value:'past',label:'Past',count:mine.filter(a=>!isUp(a)).length}]}/></div>
      {list.length?<DataTable columns={['Date','Time','Agenda','Status','']} rows={list.map(a=>[
        <b>{B.fmtD(a.date)}</b>,<span className="tnum">{B.fmtT(a.start)} – {B.fmtT(a.start+a.dur)}</span>,a.type,<Tag variant="chip" tone={tone[a.status]}>{a.status}</Tag>,
        <span style={{display:'flex',justifyContent:'flex-end',gap:6}}>{a.status==='Scheduled'?<QuickAction solid onClick={()=>onReschedule(a)}>Reschedule</QuickAction>:a.status==='Completed'&&a.summary?<QuickAction onClick={()=>toast('Opening Fireflies summary','info','doc')}>Summary</QuickAction>:null}</span>])}/>
      :<EmptyState>{tab==='up'?<>No upcoming calls. <LinkButton onClick={onBook}>Create event</LinkButton></>:'No past calls.'}</EmptyState>}
    </Card>
  </>;
}

function UserPage({u,section,setSection,children,crumbs,toast}){
  return <>
    <Crumbs items={crumbs}/>
    <div className="pc-card ucard"><ClientHeader name={u.name} tier={u.tier} email={u.email} phone={u.phone} onProfile={()=>setSection('User Profile')} onCopy={v=>toast('Copied '+v,'','check')}/></div>
    <div className="upage">
      <nav className="umenu">{MENU.map(m=><button key={m} className={section===m?'on':''} onClick={()=>setSection(m)}>{m}</button>)}</nav>
      <div className="panel">{children}</div>
    </div>
  </>;
}
Object.assign(window,{UsersList,UserPage,Profile,Appointments,Crumbs,MENU});
})();
