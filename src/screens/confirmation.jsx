/* Confirmation after create, with Reschedule / Cancel meeting */
(function(){
const NS=window.ProsperrAdvisorConsoleDS_c294ad;
const {Card,Avatar,Tag,Button,Icon,KeyValueList,IconButton,Modal,Field,Input,Note}=NS;
const B=window.BK;

function Confirmation({appt,u,onReschedule,onCancelled,onBack,toast}){
  const [cancelOpen,setCancelOpen]=React.useState(false);const [reason,setReason]=React.useState('');
  const invitees=appt.fireflies?[...appt.peopleObjs,{...B.FIREFLIES,kind:'bot'}]:appt.peopleObjs;
  const role=p=>p.kind==='client'?'Client':p.kind==='guest'?'External guest':p.kind==='bot'?'Recorder':p.role;
  const cancelled=appt.status==='Cancelled';
  return <div className="conf">
    <div className="pc-card">
      <div className="conf-hd" style={cancelled?{background:'var(--surface-2)',borderColor:'var(--border)'}:null}>
        <div className="ok" style={cancelled?{background:'var(--ink-3)'}:null}><Icon name={cancelled?'x':'check'} size={22} strokeWidth={2.5}/></div>
        <div><h2>{cancelled?'Call cancelled':appt.rescheduled?'Call rescheduled — everyone notified':'Call booked — invites sent'}</h2>
          <div className="s">{B.fmtD(appt.date,{weekday:'long',month:'long'})} · {B.fmtT(appt.start)} – {B.fmtT(appt.start+appt.dur)} IST</div></div>
      </div>
      <div className="conf-grid">
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <KeyValueList items={[['Client',u.name],['Type',appt.type],['Duration',appt.dur+' min'],['Meeting',appt.external?'External':'Internal'],['Organiser','scheduling@prosperr.io'],['Recording',appt.fireflies?'Fireflies — summary after the call':'Off']]}/>
          {!cancelled&&<div className="meet"><Icon name="video" size={15}/><span>{appt.meet}</span><IconButton icon="copy" tone="copy" label="Copy link" onClick={()=>toast('Copied '+appt.meet,'','check')}/></div>}
        </div>
        <div>
          <div style={{fontSize:10.5,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:8}}>Invitees · {invitees.length}</div>
          <div className="pc-ibox" style={{padding:'4px 12px'}}>{invitees.map(p=><div key={p.id} style={{display:'flex',alignItems:'center',gap:9,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
            <Avatar name={p.name} size={28}/><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:12.5}}>{p.name}</div><div style={{fontSize:11,color:'var(--ink-3)'}}>{role(p)} · {p.email}</div></div>
            <Tag variant="chip" tone={cancelled?'neutral':'green'}>{cancelled?'Notified':'Invite sent'}</Tag></div>)}</div>
        </div>
      </div>
      {!cancelled&&<div style={{padding:'0 22px 16px'}}><Note icon={<Icon name="lock" size={14}/>}>Nobody can move or delete this from Google Calendar. Use Reschedule or Cancel meeting here.</Note></div>}
      <div className="conf-ft">
        <Button onClick={onBack}>Back to appointments</Button>
        {!cancelled&&<><div className="l"></div><Button onClick={()=>setCancelOpen(true)} icon={<Icon name="x" size={13}/>}>Cancel meeting</Button><Button variant="dark" icon={<Icon name="cal" size={14}/>} onClick={onReschedule}>Reschedule</Button></>}
      </div>
    </div>
    {cancelOpen&&<Modal title="Cancel this call?" subtitle="Everyone invited gets a cancellation from the calendar." onClose={()=>setCancelOpen(false)}
      footer={<><Button onClick={()=>setCancelOpen(false)}>Keep call</Button><Button variant="dark" disabled={!reason.trim()} onClick={()=>{setCancelOpen(false);onCancelled(reason);}}>Cancel meeting</Button></>}>
      <Field label="Reason" required><Input as="textarea" placeholder="e.g. Client asked to move to next week" value={reason} onChange={e=>setReason(e.target.value)} autoFocus/></Field>
    </Modal>}
  </div>;
}
window.Confirmation=Confirmation;
})();
