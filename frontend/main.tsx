import React from 'react';
import {createRoot} from 'react-dom/client';
import Home from '../app/page';
import '../app/globals.css';
import '../app/styles/fluid.css';
createRoot(document.getElementById('root')!).render(<Home/>);
