import {Component} from 'react';
import type {ReactNode} from 'react';
import {publicBase} from '../services/jobdesk-api';
export default class WorkspaceErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(_error:unknown){return {failed:true};}
 componentDidCatch(error:Error){console.error('Jobdesk display error:',error);}
 render(){
  if(!this.state.failed)return this.props.children;
  return <main className="start-screen" role="alert"><div className="load-failure">
  <div className="brand brand-ksl"><img src={publicBase+'icon.svg'} alt=""/><span className="brand-stack"><strong>Jobdesk</strong><small>KSL Job Management</small></span></div>
  <h1>Jobdesk could not display this page.</h1><p>Your jobs remain stored in the shared database. Reload to restore the display.</p>
  <button type="button" className="btn primary" onClick={()=>window.location.reload()}>Reload Jobdesk</button></div></main>;
 }
}
