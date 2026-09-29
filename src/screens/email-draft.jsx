/* Email draft review — shown after Confirm; Send email creates the appointment */
(function(){
const NS=window.ProsperrAdvisorConsoleDS_c294ad;
const {Card,Avatar,Tag,Button,Icon,Field,Input}=NS;
const B=window.BK;

function EmailDraft({draft,u,reschedule,onSend,onBack}){
  const {date,start,dur,type,peopleObjs}=draft;
  const when=(()=>{const dt=new Date(date+'T12:00:00+05:30');const d=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric'}).format(dt);return `${d} at ${B.fmtT(start).replace(/^(\d):/,'0$1:')}`;})();
  const adv=peopleObjs.find(p=>p.kind==='staff'&&p.locked)||peopleObjs.find(p=>p.kind==='staff');
  const [subject,setSubject]=React.useState(`${type.replace(/ /g,'_').replace(/^(\w)(.*)$/,(m,a,r)=>a+r.toLowerCase())} : ${u.name} <> ${adv?adv.name:''}`);
  const [body,setBody]=React.useState(
`Hi ${u.name.split(' ')[0]},

It's a pleasure to inform you that your ${type.toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'')} is scheduled with the Taxation Expert as per your requested time on ${when}

Feel free to reach out to us any time at connect@prosperr.io or call us at +91 9739779797.

Regards,
Customer Success team
Prosperr.io
+91 9739779797`);
  const [sending,setSending]=React.useState(false);const [sent,setSent]=React.useState(false);
  const send=()=>{if(sending)return;setSending(true);setTimeout(()=>onSend({subject,body}),900);};
  const role=p=>p.kind==='client'?'Client':p.secondary?'Secondary':p.kind==='guest'?'Guest':p.locked?'Primary':p.role.split(' ')[0];
  return <>
    <div className="ptitle"><h1 className="pgh">{reschedule?'Reschedule Event':'Create Event'}</h1></div>
    <div className="pcard">
      <div className="pcard-h">Event Summary &amp; Description</div>
      <div className="pcard-b">
        <Input as="textarea" className="msubj" value={subject} onChange={e=>setSubject(e.target.value)} rows={1}/>
        <Input as="textarea" className="mbody" value={body} onChange={e=>setBody(e.target.value)}/>
        <div className="brow"><button className="pbtn grey" onClick={onBack}>BACK</button><button className="pbtn grey" disabled={sending} onClick={send}>{sending?'SENDING…':'SEND EMAIL'}</button></div>
      </div>
    </div>
  </>;
}
window.EmailDraft=EmailDraft;
})();
