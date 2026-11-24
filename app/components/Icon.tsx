import type {ReactNode} from 'react';

const icons:Record<string,ReactNode>={
 menu:<path d="M4 6h16M4 12h16M4 18h16"/>,layers:<><path d="m12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5"/></>,
 settings:<><path d="m9 3-.6 2.2-2 .9-2.1-.6-2.3 4 1.6 1.6v2L2 14.7l2.3 4 2.1-.6 2 .9L9 21h6l.6-2.1 2-.9 2.1.6 2.3-4-1.6-1.6v-2L22 9.5l-2.3-4-2.1.6-2-.9L15 3z"/><circle cx="12" cy="12" r="3"/></>,
 grid:<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
 file:<><path d="M14 3H5v18h14V8l-5-5ZM14 3v6h5M9 13h6M9 17h4"/></>,
 check:<path d="m5 12 4 4L19 6"/>,plus:<path d="M12 5v14M5 12h14"/>,bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
 calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18M8 15h1M14 15h1"/></>,
 bolt:<path d="m13 2-9 12h7l-1 8 10-13h-7z"/>,alert:<><path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5M12 17h.01"/></>,
 search:<><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></>,chevron:<path d="m9 6 6 6-6 6"/>,close:<path d="m6 6 12 12M18 6 6 18"/>,
 team:<><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v2"/></>,undo:<path d="M9 5 4 10l5 5M4 10h10a6 6 0 0 1 0 12"/>,refresh:<path d="M20 10a8 8 0 1 0-1 8M20 3v7h-7"/>,
 star:<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>,edit:<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14z"/>,logout:<path d="M10 3H4v18h6M14 8l5 4-5 4M9 12h10"/>,
 trash:<><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7"/></>,
 download:<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>,note:<><path d="M4 3h16v14l-4 4H4zM15 21v-5h5M8 8h8M8 12h5"/></>,
};
export default function Icon({name}:{name:string}){return <svg viewBox="0 0 24 24" aria-hidden="true">{icons[name]||icons.file}</svg>}
