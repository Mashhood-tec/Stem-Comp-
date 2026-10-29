import { Gamepad2, History, House, Menu, Play, Settings, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getGame } from '../games/definitions';
import { useApp } from '../state/AppContext';
import { SettingsDialog } from './SettingsDialog';

const NAV = [
  { to: '/', label: 'Home', icon: House, match: (s: string | undefined) => !s },
  { to: '/games', label: 'Games', icon: Gamepad2, match: (s: string | undefined) => s === 'games' || s === 'setup' || s === 'rules' },
  { to: '/history', label: 'History', icon: History, match: (s: string | undefined) => s === 'history' || s === 'results' },
];

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="10" fill="#F7F7F8" />
      <path d="M13 28V12h11M13 20h8" stroke="#0B0B0D" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="27.5" cy="26.5" r="3.2" fill="#10B981" />
    </svg>
  );
}

export function AppHeader() {
  const { route, navigate, game } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const section = route.segments[0];
  const activeGame = game.session ? getGame(game.session.gameId) : undefined;
  const showResume = Boolean(activeGame) && section !== 'play';

  useEffect(() => setMenuOpen(false), [route.path]);

  const links = (
    <>
      {NAV.map(({ to, label, icon: Icon, match }) => {
        const active = match(section);
        return (
          <a key={to} href={`#${to}`} className={`nav-link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
            <Icon size={17} aria-hidden="true" />
            {label}
          </a>
        );
      })}
    </>
  );

  return (
    <header className="app-header">
      <div className="container header-inner">
        <a href="#/" className="brand" aria-label="Family AI Game Day home">
          <BrandMark />
          <span className="brand-text">
            <span className="brand-kicker">Family Game Night</span>
            <span className="brand-name">Family AI Game Day</span>
          </span>
        </a>

        <nav className="main-nav" aria-label="Main">
          {links}
        </nav>

        <div className="header-actions">
          {showResume && activeGame && (
            <button type="button" className="btn btn-accent btn-sm resume-btn" onClick={() => navigate('/play')}>
              <Play size={15} aria-hidden="true" />
              <span>
                Resume <span className="hide-sm">{activeGame.name}</span>
              </span>
            </button>
          )}
          <button type="button" className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Settings">
            <Settings size={19} />
          </button>
          <button
            type="button"
            className="icon-btn menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav id="mobile-nav" className="mobile-nav container" aria-label="Main mobile">
          {links}
        </nav>
      )}
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}
