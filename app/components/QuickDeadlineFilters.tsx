import Icon from './Icon';

export type QuickDeadline='all'|'today'|'tomorrow'|'soon'|'overdue';
type Props={
 value:QuickDeadline|'urgent';
 onChange:(next:QuickDeadline)=>void;
 counts:{all:number;today:number;tomorrow:number;soon:number;overdue:number};
 label?:string;
};
const choices=[
 {value:'all',label:'All',icon:'grid'},
 {value:'today',label:'Today',icon:'calendar'},
 {value:'tomorrow',label:'Tomorrow',icon:'calendar'},
 {value:'soon',label:'Next 3 days',icon:'clock'},
 {value:'overdue',label:'Overdue',icon:'alert'}
] as const;
export default function QuickDeadlineFilters({value,onChange,counts,label='Quick deadline filters'}:Props){
 return <div className="v23-quick-filters" role="group" aria-label={label}>
  {choices.map(item=><button key={item.value} type="button"
   aria-pressed={value===item.value}
   className={value===item.value?'selected':''}
   onClick={()=>onChange(item.value)}>
   <Icon name={item.icon}/><span>{item.label}</span><small>{counts[item.value]}</small>
  </button>)}
 </div>
}
