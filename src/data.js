/* Sample data for the CMS call-booking flow. In-memory only. Times are IST (Asia/Kolkata). */
(function(){
const TODAY='2026-09-23';          // Wed
const NOW_MIN=11*60+40;            // 11:40 IST
const DAY_START=10*60+30, DAY_END=19*60, GRID_START=8*60, GRID_END=21*60; // working hours 10:30–19:00, Mon–Sat
const PICK_START=0, PICK_END=23*60+45;
const isWorkDay=date=>new Date(date+'T00:00:00').getDay()!==0;

const USERS=[
 {id:'u1',secondaryId:'a2',name:'Vishal Gupta',email:'vishal.gupta@gmail.com',phone:'+91 98201 33470',tier:'Premium',plan:'ITR Filing + Tax Planning',city:'Pune',advisorId:'a1',rmId:'r1',joined:'12 Apr 2025',status:'Active'},
 {id:'u2',secondaryId:'a3',name:'Rahul Menon',email:'rahul.menon@gmail.com',phone:'+91 98200 41122',tier:'Premium',plan:'ITR Filing',city:'Bengaluru',advisorId:'a1',rmId:'r1',joined:'3 Mar 2025',status:'Active'},
 {id:'u3',secondaryId:'a1',name:'Priya Nair',email:'priya.nair@outlook.com',phone:'+91 99301 55708',tier:'Elite',plan:'Wealth + Tax',city:'Mumbai',advisorId:'a2',rmId:'r2',joined:'19 Jan 2025',status:'Active'},
 {id:'u4',secondaryId:'a2',name:'Vikram Shah',email:'vikram.shah@gmail.com',phone:'+91 98450 77219',tier:'Advanced',plan:'Advance Tax',city:'Ahmedabad',advisorId:'a3',rmId:'r1',joined:'8 Jun 2025',status:'Active'},
 {id:'u5',secondaryId:'a4',name:'Neha Kulkarni',email:'neha.k@gmail.com',phone:'+91 97690 30154',tier:'Elite',plan:'Tax Planning',city:'Pune',advisorId:'a1',rmId:'r2',joined:'27 Feb 2025',status:'Active'},
 {id:'u6',secondaryId:'a1',name:'Aditya Sharma',email:'aditya.s@gmail.com',phone:'+91 98111 62240',tier:'Basic',plan:'ITR Filing',city:'Delhi',advisorId:'a4',rmId:'r2',joined:'4 Sep 2026',status:'Onboarding'},
 {id:'u7',secondaryId:'a3',name:'Sana Kapoor',email:'sana.k@gmail.com',phone:'+91 90040 18876',tier:'Basic',plan:'ITR Filing',city:'Hyderabad',advisorId:'a2',rmId:'r1',joined:'15 May 2025',status:'Active'},
 {id:'u8',secondaryId:'a4',name:'Meera Iyer',email:'meera.iyer@gmail.com',phone:'+91 99870 45590',tier:'Advanced',plan:'Notice / Compliance',city:'Chennai',advisorId:'a3',rmId:'r2',joined:'2 Nov 2024',status:'Inactive'},
];
/* Internal directory — everyone here has a Workspace calendar */
const STAFF=[
 {id:'a1',name:'Ishan Kulkarni',role:'Tax Advisor',email:'ishan.k@prosperr.io'},
 {id:'a2',name:'Neha Reddy',role:'Tax Advisor',email:'neha.reddy@prosperr.io'},
 {id:'a3',name:'Aditya Menon',role:'Tax Advisor',email:'aditya.menon@prosperr.io'},
 {id:'a4',name:'Farah Sheikh',role:'Tax Advisor',email:'farah.sheikh@prosperr.io'},
 {id:'w1',name:'Karthik Rao',role:'Wealth Advisor',email:'karthik.rao@prosperr.io'},
 {id:'r1',name:'Kishan Patel',role:'Relationship Manager',email:'kishan.patel@prosperr.io'},
 {id:'r2',name:'Divya Menon',role:'Relationship Manager',email:'divya.menon@prosperr.io'},
 {id:'t1',name:'Sameer Joshi',role:'Tax Specialist · Notices',email:'sameer.joshi@prosperr.io'},
];
const DOMAIN='prosperr.io';
const FIREFLIES={id:'ff',name:'Fireflies Notetaker',role:'Records & summarises',email:'fred@fireflies.ai'};
const CONSULT_TYPES=['General Query','ITR Filing','Tax Planning','Advance Tax','Notice / Compliance','Wealth Review'];

/* Deterministic busy blocks per person per date: [startMin,endMin] */
function hash(s){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h;}
function busyFor(personId,date){
  const h=hash(personId+date),out=[];
  const d=new Date(date+'T00:00:00').getDay();
  const dh=hash(date+'#2');                 // day-level mood shared by everyone
  const mood=dh%6;                     // 0 = fully booked, 1 = two slots left, 2-3 = busy, 4-5 = light
  if(mood===0)return [[DAY_START,DAY_END]];
  if(mood===1){                        // block everything except two 30-min windows
    const a=DAY_START+((dh>>>3)%8)*30, b=15*60+((dh>>>7)%8)*30;
    const [x,y]=a<b?[a,b]:[b,a];
    return [[DAY_START,x],[x+30,y],[y+30,DAY_END]].filter(r=>r[1]>r[0]);
  }
  const n=mood<=3?5:2;
  for(let i=0;i<n;i++){
    const s=DAY_START+((h>>>(i*4))%22)*30; const len=[30,60,90,120][(h>>>(i*3+1))%4];
    out.push([s,Math.min(s+len,DAY_END)]);
  }
  if(personId==='a1'&&date===TODAY){out.push([13*60,14*60]);}
  out.push([13*60+30,14*60]); // lunch for everyone internal
  out.sort((a,b)=>a[0]-b[0]);
  const m=[];for(const b of out){const l=m[m.length-1];if(l&&b[0]<=l[1])l[1]=Math.max(l[1],b[1]);else m.push([b[0],b[1]]);}
  return m;
}
const overlaps=(a,b)=>a[0]<b[1]&&b[0]<a[1];
function freeSlots(people,date,dur,taken,step){
  step=step||30;
  if(!isWorkDay(date))return [];
  const cal=people.filter(p=>p.hasCalendar);
  const busy=cal.flatMap(p=>busyFor(p.id,date)).concat(taken.filter(t=>t.date===date).map(t=>[t.start,t.start+t.dur]));
  const out=[];
  for(let t=DAY_START;t+dur<=DAY_END;t+=step){
    if(date===TODAY&&t<NOW_MIN+30)continue;
    if(!busy.some(b=>overlaps(b,[t,t+dur])))out.push(t);
  }
  return out;
}
/* Contiguous free windows (merged busy complement) for the day */
function freeWindows(people,date,taken,minLen){
  const cal=people.filter(p=>p.hasCalendar);
  const busy=cal.flatMap(p=>busyFor(p.id,date)).concat(taken.filter(t=>t.date===date).map(t=>[t.start,t.start+t.dur])).sort((a,b)=>a[0]-b[0]);
  const m=[];for(const b of busy){const l=m[m.length-1];if(l&&b[0]<=l[1])l[1]=Math.max(l[1],b[1]);else m.push([b[0],b[1]]);}
  let cur=date===TODAY?Math.max(DAY_START,Math.ceil((NOW_MIN+30)/5)*5):DAY_START;const out=[];
  for(const b of m){if(b[0]>cur)out.push([cur,b[0]]);cur=Math.max(cur,b[1]);}
  if(cur<DAY_END)out.push([cur,DAY_END]);
  return out.filter(w=>w[1]-w[0]>=(minLen||15));
}
function weekDays(offset){
  const base=new Date(TODAY+'T00:00:00');const mon=new Date(base);mon.setDate(base.getDate()-((base.getDay()+6)%7)+offset*7);
  const iso=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
  return Array.from({length:6},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return iso(d);});
}
const fmt24=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const fmtT=m=>{const h=Math.floor(m/60),mm=m%60,ap=h>=12?'PM':'AM',h12=((h+11)%12)+1;return `${h12}:${String(mm).padStart(2,'0')} ${ap}`;};
const fmtD=(date,opts)=>new Intl.DateTimeFormat('en-IN',Object.assign({timeZone:'Asia/Kolkata',weekday:'short',day:'numeric',month:'short'},opts||{})).format(new Date(date+'T12:00:00+05:30'));

const APPTS=[
 {id:'ap1',userId:'u1',date:'2026-09-14',start:11*60,dur:30,type:'ITR Filing',status:'Completed',people:['a1','r1'],summary:true},
 {id:'ap2',userId:'u1',date:'2026-08-28',start:16*60,dur:45,type:'Tax Planning',status:'Completed',people:['a1'],summary:true},
 {id:'ap3',userId:'u1',date:'2026-08-02',start:10*60+30,dur:30,type:'General Query',status:'Cancelled',people:['a1'],summary:false},
];
window.BK={TODAY,NOW_MIN,DAY_START,DAY_END,PICK_START,PICK_END,isWorkDay,GRID_START,GRID_END,USERS,STAFF,DOMAIN,FIREFLIES,CONSULT_TYPES,APPTS,busyFor,freeSlots,freeWindows,weekDays,fmtT,fmt24,fmtD,overlaps};
})();
