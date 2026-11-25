import {useEffect,useId,useRef} from 'react';
import Icon from './Icon';
const dialogs:HTMLDivElement[]=[];
let previousOverflow='';
function focusable(root:HTMLElement){
 return Array.from(root.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],summary,[tabindex]')).filter(el=>!el.matches(':disabled,[aria-disabled="true"],[type="hidden"]')&&el.tabIndex>=0&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden'&&!el.closest('[inert]'));
}
export default function Modal({title,subtitle,children,close,wide=false,variant}:{title:string;subtitle?:string;children:React.ReactNode;close:()=>void;wide?:boolean;variant?:'apple-job'}){
 const titleId=useId(),ref=useRef<HTMLDivElement>(null),closeRef=useRef(close);closeRef.current=close;
 useEffect(()=>{const root=ref.current;if(!root)return;const old=document.activeElement as HTMLElement;
 if(!dialogs.length){previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden'}
 dialogs.push(root);
 const initial=root.querySelector<HTMLElement>('[autofocus]');(initial||focusable(root)[0]||root).focus();
 const key=(e:KeyboardEvent)=>{if(dialogs.at(-1)!==root)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeRef.current();return}if(e.key!=='Tab')return;const a=focusable(root),index=a.indexOf(document.activeElement as HTMLElement);if(!a.length){e.preventDefault();root.focus()}else if(index<0||e.shiftKey&&index===0||!e.shiftKey&&index===a.length-1){e.preventDefault();a[e.shiftKey?a.length-1:0].focus()}};
 document.addEventListener('keydown',key,true);
 return()=>{const index=dialogs.indexOf(root);const wasTop=index===dialogs.length-1;if(index>=0)dialogs.splice(index,1);document.removeEventListener('keydown',key,true);if(!dialogs.length)document.body.style.overflow=previousOverflow;if(wasTop){if(old?.isConnected)old?.focus();else dialogs.at(-1)?.focus()}};
 },[]);
 return <div className="overlay" onClick={e=>{if(e.target===e.currentTarget&&dialogs.at(-1)===ref.current)close()}}><div className={'modal '+(wide?'wide':'')+(variant==='apple-job'?' apple-job-modal':'')} ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}><header className="modal-head"><div><h2 id={titleId}>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><button className="icon-btn" onClick={close} aria-label="Close dialog"><Icon name="close"/></button></header>{children}</div></div>
}
