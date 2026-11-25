import Icon from './Icon';
import type {Data,Job} from '../lib/workspace-types';
import {due,time} from '../lib/dates';
import type {useNotificationReads} from '../hooks/workspace-insights';
type Filter='all'|'unread'|'deadlines'|'activity';
export default function NotificationContent({data,filter,setFilter,reads,openJob}:{data:Data;filter:Filter;setFilter:(v:Filter)=>void;reads:ReturnType<typeof useNotificationReads>;openJob:(j:Job)=>void}){
 const handover=(j:Job)=>!j.production_status&&!!j.confirmed_at&&['Set Files - Ready to Print','Ready to Print','Printing','Completed'].includes(j.status);
 const live=(j:Job)=>!['Deleted','Cancelled'].includes(j.status)&&(j.production_status?j.production_status!=='Ready to Collect':j.status!=='Completed');
 const reminders=data.jobs.filter(j=>!['Deleted','Cancelled'].includes(j.status)&&(live(j)&&due(j)<=3||handover(j))).sort((a,b)=>a.due_date.localeCompare(b.due_date));
 const activities=data.activity||[];
 const key=(j:Job)=>reads.deadlineKey(j.id,j.version);
 const keys=[...reminders.map(key),...activities.map(reads.activityKey)];
 const unread=keys.filter(k=>!reads.isRead(k)).length;
 const shown=reminders.filter(j=>filter!=='unread'||!reads.isRead(key(j)));
 const events=activities.filter(a=>filter!=='unread'||!reads.isRead(reads.activityKey(a)));
 const text=(j:Job)=>{const d=due(j);return live(j)&&d<=3?(d<0?(-d)+' '+(d===-1?'day':'days')+' overdue':d===0?'Due today':d===1?'Due tomorrow':'Due in '+d+' days')+(handover(j)?' · For handover':''):'Ready for handover'};
 return <><div className="v36-notification-tools"><span>{unread} unread · This browser</span><button className="btn small" onClick={()=>reads.mark(keys)}>Mark all as read</button><div className="v30-view-switch" role="group" aria-label="Notification filter">{(['all','unread','deadlines','activity'] as Filter[]).map(v=><button key={v} aria-pressed={v===filter} onClick={()=>setFilter(v)}>{v[0].toUpperCase()+v.slice(1)}</button>)}</div></div>{filter!=='activity'&&<div className="v30-utility-list"><h3>Deadline reminders &amp; handover</h3>{shown.slice(0,100).map(j=><button key={j.id} onClick={()=>{reads.mark([key(j)]);openJob(j)}}><Icon name="bell"/><span><b>{j.name}</b><small>{text(j)}</small></span>{!reads.isRead(key(j))&&<i className="v36-unread-dot"/>}<Icon name="chevron"/></button>)}{!shown.length&&<p className="muted">No matching reminders.</p>}{shown.length>100&&<p className="muted">Showing first 100 of {shown.length} reminders.</p>}</div>}{filter!=='deadlines'&&<div className="v30-utility-list"><h3>Recent team activity</h3>{events.map(a=><button key={a.id} onClick={()=>reads.mark([reads.activityKey(a)])}><Icon name="check"/><span><b>{a.job_name||a.action}</b><small>{a.job_name?a.action+' · ':''}{a.user_name} · {time(a.created_at)}</small></span>{!reads.isRead(reads.activityKey(a))&&<i className="v36-unread-dot"/>}</button>)}{!events.length&&<p className="muted">No matching activity.</p>}</div>}</>
}
