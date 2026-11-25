import {useState,useMemo,type ReactNode} from 'react';
import type {Job} from '../lib/workspace-types';
export function BoardColumns({columns,items,totals,group,label,render}:{columns:string[];items:Job[];totals:Job[];group:(j:Job)=>string;label:string;render:(j:Job)=>ReactNode}){
 const [hideEmpty,setHideEmpty]=useState(false);
 const counts=new Map<string,number>(),visible=new Map<string,Job[]>();
 for(const j of totals){const g=group(j);counts.set(g,(counts.get(g)||0)+1)}
 for(const j of items){const g=group(j);const bucket=visible.get(g)||[];bucket.push(j);visible.set(g,bucket)}
 const shown=columns.filter(c=>(c!=='Other'||counts.get(c))&&(!hideEmpty||counts.get(c)));
 return <div className="v36-board-wrap"><div className="v36-board-toolbar"><span>{items.length} of {totals.length} jobs shown</span><label><input type="checkbox" checked={hideEmpty} onChange={e=>setHideEmpty(e.target.checked)}/> Hide empty stages</label></div><div className="v30-board" aria-label={label}>{shown.map(c=><section className="v30-board-column" key={c}><h3>{c}<span title="Total matching jobs in this stage">{counts.get(c)||0}</span></h3>{(visible.get(c)||[]).map(render)}{!visible.get(c)?.length&&<p className="muted">{counts.get(c)?'Load more jobs to see this stage':'No jobs'}</p>}</section>)}</div></div>
}
