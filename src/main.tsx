import React from 'react';
import ReactDOM from 'react-dom/client';

import './styles/global.css';
import { config } from '../config.browser';
import PageColophon from './pages/PageColophon';
import PageNotFound from './pages/PageNotFound';
import PageCurriculumVitae from './pages/PageCurriculumVitae';
import PageMain from './pages/PageMain';
import PageOG from './pages/PageOG';

function App() {
  if (window.location.pathname === '/cv') {
    return <PageCurriculumVitae />;
  }

  if (window.location.pathname === '/og') {
    return <PageOG />;
  }

  if (window.location.pathname === '/colophon') {
    return <PageColophon />;
  }

  if (window.location.pathname === '/404') {
    return <PageNotFound />;
  }

  return <PageMain />;
}

Promise.all([
  ...config.fonts.sansSerif.weights.map((weight) =>
    document.fonts.load(`${weight} 1em "${config.fonts.sansSerif.name}"`)
  ),
  ...config.fonts.serif.weights.map((weight) => document.fonts.load(`${weight} 1em "${config.fonts.serif.name}"`)),
]).then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
