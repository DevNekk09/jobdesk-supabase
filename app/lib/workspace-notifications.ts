import type {Job} from './workspace-types';
import {due} from './dates';
export const needsHandover=(j:Job)=>!j.production_status&&!!j.confirmed_at&&['Set Files - Ready to Print','Ready to Print','Printing','Completed'].includes(j.status);
export const liveDeadline=(j:Job)=>!['Deleted','Cancelled'].includes(j.status)&&(j.production_status?j.production_status!=='Ready to Collect':j.status!=='Completed');
export function notificationJobs(jobs:Job[]){return jobs.filter(j=>!['Deleted','Cancelled'].includes(j.status)&&(liveDeadline(j)&&due(j)<=3||needsHandover(j))).sort((a,b)=>a.due_date.localeCompare(b.due_date))}
