import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import DepressionPage from './pages/DepressionPage.jsx';
import AnxietyPage from './pages/AnxietyPage.jsx';
import MetricsPage from './pages/MetricsPage.jsx';
import './App.css';

function App() {
  const [tagline, setTagline] = useState('');
  const fullTagline = 'Calm, private mood tracking with progress reporting.';

  useEffect(() => {
    let index = 0;
    const tick = () => {
      if (index <= fullTagline.length) {
        setTagline(fullTagline.slice(0, index));
        index += 1;
        setTimeout(tick, 45);
      }
    };

    tick();
  }, []);

  const moods = ['😢', '😕', '😐', '🙂', '😄'];
  const [moodIndex, setMoodIndex] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setMoodIndex((i) => (i + 1) % moods.length);
    }, 700);
    return () => clearInterval(interval);
  }, []);

  return (
    <HashRouter>
      <div className="app-shell">
        <header className="app-header">
          <div className="brand">
            <div className="brand-row">
              <h1>Mood Tracker</h1>
              <div className="mood-strip" aria-hidden="true">
                <span className="mood-face looping">{moods[moodIndex]}</span>
              </div>
            </div>
            <p className="app-tagline">{tagline}</p>
          </div>
          <nav className="header-nav">
            <div id="header-menu" className={`hamburger-menu ${navOpen ? 'open' : ''}`} role="menu" aria-hidden={!navOpen}>
              <NavLink to="/depression" role="menuitem" onClick={() => setNavOpen(false)} className={({ isActive }) => `menu-item menu-depression ${isActive ? 'active' : ''}`}>
                Depression
              </NavLink>
              <NavLink to="/anxiety" role="menuitem" onClick={() => setNavOpen(false)} className={({ isActive }) => `menu-item menu-anxiety ${isActive ? 'active' : ''}`}>
                Anxiety
              </NavLink>
              <NavLink to="/metrics" role="menuitem" onClick={() => setNavOpen(false)} className={({ isActive }) => `menu-item menu-metrics ${isActive ? 'active' : ''}`}>
                Metrics
              </NavLink>
            </div>
          </nav>
        </header>
        <main className="app-main">
          <section className="hero-banner">
            <div className="hero-copy">
              <p className="eyebrow">Wellness in a calmer space</p>
              <h2>Track your mood with clarity and balance.</h2>
              <p>Use intentional check-ins for depression and anxiety, then view your progress through thoughtful charts and a private report.</p>
            </div>
          </section>
          <Routes>
            <Route path="/" element={<DepressionPage />} />
            <Route path="/depression" element={<DepressionPage />} />
            <Route path="/anxiety" element={<AnxietyPage />} />
            <Route path="/metrics" element={<MetricsPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;
