import {useEffect,useState,useMemo} from 'react';
import type {Data,Activity} from '../lib/workspace-types';
import {jobdeskRequest} from '../services/jobdesk-api';
import {add,due} from '../lib/dates';
export function useFocusJobs(data:Data|null,month:string,today:string,enabled:boolean){
 const nextMonth=add(1).slice(0,7),currentMonth=today.slice(0,7);
 const [extra,setExtra]=useState<{key:string;records:Data[]}|null>(null);
 const key=[currentMonth,nextMonth,month,data?.me.id].join(':');
 useEffect(()=>{if(!enabled||!data||month==='all')return;const months=[...new Set([currentMonth,nextMonth])].filter(m=>m!==month);if(!months.length)return;
 let live=true;setExtra(null);
 Promise.all(months.map(m=>jobdeskRequest<Data>('/api/bootstrap?month='+encodeURIComponent(m)))).then(records=>{if(live)setExtra({key,records})}).catch(()=>{});
 return()=>{live=false};
 },[enabled,data,month,currentMonth,nextMonth,key]);
 return useMemo(()=>{const active=(j:Data['jobs'][number])=>!['Deleted','Cancelled','Completed'].includes(j.status);const other=extra?.key===key?extra.records.flatMap(r=>r.jobs):[];const jobs=[...new Map([...(data?.jobs||[]),...other].map(j=>[j.id,j])).values()].filter(active);const ready=(m:string)=>month==='all'||month===m||extra?.key===key;
 return {overdue:data?.overdue_total??(month==='all'?jobs.filter(j=>due(j)<0).length:null),today:ready(currentMonth)?jobs.filter(j=>due(j)===0).length:null,tomorrow:ready(nextMonth)?jobs.filter(j=>due(j)===1).length:null};
 },[data,extra,key,month,currentMonth,nextMonth,today]);
}
export function useNotificationReads(actor:number|undefined,today:string){
 const key='jobdesk-notification-reads-v36:'+String(actor??'guest');
 const [state,setState]=useState<{key:string;ids:string[]}>({key:'',ids:[]});
 useEffect(()=>{try{const raw=JSON.parse(localStorage.getItem(key)||'[]');setState({key,ids:Array.isArray(raw)?raw.filter(x=>typeof x==='string').slice(-1000):[]})}catch{setState({key,ids:[]})}},[key]);
 const ids=new Set(state.key===key?state.ids:[]);
 const mark=(keys:string[])=>setState(old=>{const next=[...new Set([...(old.key===key?old.ids:[]),...keys])].slice(-1000);try{localStorage.setItem(key,JSON.stringify(next))}catch{}return {key,ids:next}});
 return {isRead:(id:string)=>ids.has(id),mark,activityKey:(a:Activity)=>'activity:'+a.id,deadlineKey:(id:number,version:number)=>'deadline:'+today+':'+id+':'+version,unreadActivity:(items:Activity[])=>items.filter(a=>!ids.has('activity:'+a.id)).length};
}
