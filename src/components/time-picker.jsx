/* Google-Calendar-style time picker: typeable field with a scrollable 15-min list */
(function(){
const B=window.BK;
const parse=s=>{s=s.trim().toLowerCase().replace(/\./g,':').replace(/\s+/g,'');const m=s.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)?$/);if(!m)return null;
  let h=+m[1],mm=+(m[2]||0);if(mm>59||h>23)return null;if(m[3]){if(h>12)return null;if(m[3]==='pm'&&h<12)h+=12;if(m[3]==='am'&&h===12)h=0;}else if(h>=1&&h<=7)h+=12;return h*60+mm;};
function TimePicker({value,onChange,options,disabled,placeholder,anchor,invalid}){
  const [txt,setTxt]=React.useState(value==null?'':B.fmtT(value));
  const [open,setOpen]=React.useState(false);
  const listRef=React.useRef(null);
  React.useEffect(()=>{setTxt(value==null?'':B.fmtT(value));},[value]);
  React.useEffect(()=>{if(open&&listRef.current){const target=value!=null?value:(anchor!=null?anchor:options[0]);const idx=options.findIndex(o=>o>=target);const el=listRef.current.children[Math.max(0,idx-1)];if(el)listRef.current.scrollTop=el.offsetTop-4;}},[open]);
  const commit=()=>{const m=parse(txt);if(m!=null&&m>=0&&m<24*60)onChange(Math.round(m/5)*5);else setTxt(value==null?'':B.fmtT(value));};
  return <div className="tp">
    <input className={'pc-input tpin'+(invalid?' invalid':'')} value={txt} disabled={disabled} placeholder={placeholder} onFocus={e=>{setOpen(true);e.target.select();}} onBlur={()=>{setTimeout(()=>setOpen(false),120);commit();}}
      onChange={e=>setTxt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.target.blur();}if(e.key==='Escape')setOpen(false);}}/>
    <svg className="tpic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
    {open&&!disabled&&<div className="tplist" ref={listRef}>{options.map(o=><div key={o} className={'tpi'+(o===value||(value!=null&&value%15!==0&&o===Math.floor(value/15)*15)?' on':'')} onMouseDown={e=>{e.preventDefault();onChange(o);setOpen(false);}}>{B.fmtT(o)}</div>)}</div>}
  </div>;
}
window.TimePicker=TimePicker;
})();
