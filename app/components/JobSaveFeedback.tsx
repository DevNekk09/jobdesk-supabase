import Icon from './Icon';

export type SaveFeedbackState={id:number;kind:'created'|'updated'|'production';title:string;detail:string};
type Props={value:SaveFeedbackState|null;onDismiss:()=>void;onUndo?:()=>void};

/** Announce the server-confirmed save without blocking the current workspace. */
export default function JobSaveFeedback({value,onDismiss,onUndo}:Props){
 if(!value)return null;
 return <div key={value.id} className={'job-save-feedback '+value.kind} role="status" aria-live="polite" aria-atomic="true">
  <span className="job-save-symbol"><Icon name="check"/></span>
  <span className="job-save-copy"><strong>{value.title}</strong><small>{value.detail}</small></span>
  {onUndo&&<button type="button" className="v30-toast-undo" onClick={onUndo}><Icon name="undo"/>Undo</button>}<button type="button" className="job-save-dismiss" aria-label="Dismiss confirmation" onClick={onDismiss}><Icon name="close"/></button>
  <span className={"job-save-timeline"+(onUndo?" v30-undo-timeline":"")} aria-hidden="true"/>
 </div>;
}
