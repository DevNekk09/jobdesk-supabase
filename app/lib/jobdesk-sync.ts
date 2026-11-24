/** Pure helpers for safe UI handling of concurrent job updates. */
export function isJobConflict(message:string):boolean{
 return /\b(conflict|version|stale|changed|out.of.date|already updated|409)\b/i.test(message);
}
export function saveErrorMessage(message:string):string{
 return isJobConflict(message)
  ?'This job was updated in another browser. The latest version has been refreshed; review it before saving again.'
  :message||'Changes were not saved. Check your connection and retry.';
}
