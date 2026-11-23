import React from 'react';
import {createRoot} from 'react-dom/client';
import Home from '../app/page';
import WorkspaceErrorBoundary from '../app/components/WorkspaceErrorBoundary';
import '../app/globals.css';
import '../app/styles/fluid.css';
document.documentElement.dataset.jobdeskBooted='true';
createRoot(document.getElementById('root')!).render(<WorkspaceErrorBoundary><Home/></WorkspaceErrorBoundary>);
