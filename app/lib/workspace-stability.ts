import type {Job} from './workspace-types';
export function validUndoResult(before:Job,after:Job,action:'undo-progress'|'undo-production',expected:string){
 return after.id===before.id&&Number.isInteger(before.version)&&after.version===before.version+1&&(action==='undo-progress'?after.status===expected:after.production_status===expected);
}
export function newerRecord<T extends {version:number}>(current:T,incoming:T):T{return incoming.version>=current.version?incoming:current}
