import Icon from './Icon';

type Props={
 overviewActive:boolean;
 spacesOpen:boolean;
 canEdit:boolean;
 onOverview:()=>void;
 onCreate:()=>void;
 onSpaces:()=>void;
};

/** Compact shared dock. Always render all three controls, including for guests. */
export default function QuickDock({overviewActive,spacesOpen,canEdit,onOverview,onCreate,onSpaces}:Props){
 return <nav className="floating-panel ksl-dock" aria-label="Jobdesk quick navigation">
  <button type="button" className={'dock-tab '+(overviewActive?'active':'')} aria-current={overviewActive?'page':undefined} onClick={onOverview}><Icon name="grid"/><span>Overview</span></button>
  <button type="button" className="floating-add dock-create" aria-label={canEdit?'Add a jobsheet':'Choose a team member to add a jobsheet'} onClick={onCreate}><Icon name="plus"/></button>
  <button type="button" className={'dock-tab '+(spacesOpen?'active':'')} aria-expanded={spacesOpen} onClick={onSpaces}><Icon name="layers"/><span>Spaces</span></button>
 </nav>
}
