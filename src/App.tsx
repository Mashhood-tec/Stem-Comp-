import { SearchX } from 'lucide-react';
import { useEffect } from 'react';
import { AppHeader } from './components/AppHeader';
import { ConfirmProvider } from './components/ConfirmationDialog';
import { EmptyState } from './components/EmptyState';
import { ToastProvider } from './components/Toast';
import { GameSelectionPage } from './pages/GameSelectionPage';
import { GameSessionPage } from './pages/GameSessionPage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { ResultsPage } from './pages/ResultsPage';
import { RulesPage } from './pages/RulesPage';
import { SetupPage } from './pages/SetupPage';
import { AppProvider, useApp } from './state/AppContext';

const TITLES: Record<string, string> = {
  '': 'Home',
  games: 'Choose a Game',
  setup: 'Players & Teams',
  rules: 'Rules & Ready',
  play: 'Game in Progress',
  results: 'Final Results',
  history: 'Session History',
};

function Router() {
  const { route } = useApp();
  const [section, param] = route.segments;

  useEffect(() => {
    document.title = `${TITLES[section ?? ''] ?? 'Family AI Game Day'} · Family AI Game Day`;
  }, [section]);

  switch (section) {
    case undefined:
      return <HomePage />;
    case 'games':
      return <GameSelectionPage />;
    case 'setup':
      return <SetupPage gameId={param} />;
    case 'rules':
      return <RulesPage />;
    case 'play':
      return <GameSessionPage />;
    case 'results':
      return <ResultsPage recordId={param} fromHistory={false} />;
    case 'history':
      return param ? <ResultsPage recordId={param} fromHistory /> : <HistoryPage />;
    default:
      return (
        <div className="page container">
          <EmptyState icon={SearchX} title="Page not found" actions={<a href="#/" className="btn btn-primary">Go home</a>}>
            <p>That page doesn't exist.</p>
          </EmptyState>
        </div>
      );
  }
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <ConfirmProvider>
          <a href="#main" className="skip-link" onClick={(e) => {
            e.preventDefault();
            document.getElementById('main')?.focus();
          }}>
            Skip to content
          </a>
          <AppHeader />
          <main id="main" tabIndex={-1}>
            <Router />
          </main>
          <footer className="app-footer">
            <div className="container footer-inner">
              <span>Family AI Game Day · Built for the Abu Dhabi University Cycle 2 challenge</span>
              <span>AI creates the challenges. The host makes every call.</span>
            </div>
          </footer>
        </ConfirmProvider>
      </ToastProvider>
    </AppProvider>
  );
}
