import { Gamepad2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import type { GeneratorControls } from '../components/ChallengeCard';
import { useConfirm } from '../components/ConfirmationDialog';
import { EmptyState } from '../components/EmptyState';
import { EventLog } from '../components/EventLog';
import { Scoreboard } from '../components/Scoreboard';
import { ReviewPanel } from '../components/session/ReviewPanel';
import { SessionTopBar } from '../components/session/SessionParts';
import { useToast } from '../components/Toast';
import { ADJUSTABLE, buildHistoryRecord, currentParticipant, sessionReducer, turnKeyOf } from '../engine/session';
import { CulturePlay } from '../games/cultureSportsChallenge/CulturePlay';
import { getGame } from '../games/definitions';
import { ExpeditionPlay } from '../games/desertExpedition/ExpeditionPlay';
import { CharadesPlay } from '../games/emiratiCharades/CharadesPlay';
import { FootballPlay } from '../games/football/FootballPlay';
import { RiddlePlay } from '../games/heritageRiddleRelay/RiddlePlay';
import type { PlayProps } from '../games/types';
import { useCountdown } from '../hooks/useTimer';
import { generateLiveContent } from '../services/aiContentService';
import { drawPreparedForSession, getPreparedPool } from '../services/gameContentService';
import { useApp } from '../state/AppContext';
import type { GameContent } from '../types/content';
import type { GameId } from '../types/game';
import type { GameSession } from '../types/session';
import { playTimeUpAlert } from '../utils/sound';

const PLAY_SCREENS: Record<GameId, ComponentType<PlayProps>> = {
  football: FootballPlay,
  heritageRiddleRelay: RiddlePlay,
  desertExpedition: ExpeditionPlay,
  emiratiCharades: CharadesPlay,
  cultureSportsChallenge: CulturePlay,
};

export function GameSessionPage() {
  const { game: api } = useApp();
  if (!api.session) {
    return (
      <div className="page container">
        <EmptyState
          icon={Gamepad2}
          title="No game in progress"
          actions={
            <>
              <a href="#/games" className="btn btn-primary">
                Choose a game
              </a>
              <a href="#/history" className="btn btn-ghost">
                View history
              </a>
            </>
          }
        >
          <p>Pick one of the five games, set up players and start playing.</p>
        </EmptyState>
      </div>
    );
  }
  return <ActiveSession session={api.session} />;
}

function ActiveSession({ session }: { session: GameSession }) {
  const { game: api, navigate, addHistory, settings, aiStatus } = useApp();
  const { dispatch } = api;
  const confirm = useConfirm();
  const toast = useToast();
  const game = getGame(session.gameId)!;
  const Play = PLAY_SCREENS[session.gameId];

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const onExpire = useCallback(() => dispatch({ type: 'timeUp' }), [dispatch]);
  const remainingMs = useCountdown(session.timer, onExpire);

  const previousStatus = useRef(session.status);
  useEffect(() => {
    if (session.status === 'timeUp' && previousStatus.current === 'playing' && settings.sound) playTimeUpAlert();
    previousStatus.current = session.status;
  }, [session.status, settings.sound]);

  const announcedRestore = useRef(false);
  useEffect(() => {
    if (api.restored && !announcedRestore.current) {
      announcedRestore.current = true;
      if (session.status === 'paused') toast.info('Your game was restored. The timer is paused — press Resume to continue.');
    }
  }, [api.restored, session.status, toast]);

  /* ---------- Content ---------- */

  const drawNext = useCallback(() => drawPreparedForSession(sessionRef.current), []);
  const drawTiebreak = useCallback(() => {
    const s = sessionRef.current;
    const withTiebreak = { ...s, content: s.tiebreak?.content ?? s.content };
    return drawPreparedForSession(withTiebreak) ?? drawPreparedForSession(withTiebreak, true);
  }, []);

  const [genState, setGenState] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });
  useEffect(() => setGenState((g) => (g.error ? { ...g, error: null } : g)), [session.round, session.turnIndex, session.status === 'turnComplete']);

  const applyPrepared = useCallback(
    (allowRepeats = false) => {
      const item = drawPreparedForSession(sessionRef.current, allowRepeats || sessionRef.current.settings.allowRepeats);
      dispatch({ type: 'setContent', content: item });
      return item;
    },
    [dispatch],
  );

  const generate = useCallback(async () => {
    const s = sessionRef.current;
    if (genState.loading) return;
    if (!aiStatus.configured) {
      const item = applyPrepared();
      setGenState({ loading: false, error: null });
      if (item) toast.info('Live AI is not configured on this device, so a different challenge was drawn from the prepared AI-created set.');
      return;
    }
    const startedFor = `${s.id}:${turnKeyOf(s)}:${s.status}`;
    setGenState({ loading: true, error: null });
    try {
      const pool = getPreparedPool(s.gameId);
      const avoid = s.usedContentIds.map((id) => pool.find((item) => item.id === id)?.title).filter((t): t is string => Boolean(t));
      const item: GameContent = await generateLiveContent(s.gameId, s.content ? [...avoid, s.content.title] : avoid);
      const now = sessionRef.current;
      if (`${now.id}:${turnKeyOf(now)}:${now.status}` !== startedFor) {
        setGenState({ loading: false, error: null });
        toast.info('The game moved on, so the newly generated challenge was not used.');
        return;
      }
      dispatch({ type: 'setContent', content: item });
      setGenState({ loading: false, error: null });
      toast.success('New live AI challenge generated and checked.');
    } catch (error) {
      setGenState({ loading: false, error: error instanceof Error ? error.message : 'Live AI generation failed.' });
    }
  }, [aiStatus.configured, applyPrepared, dispatch, genState.loading, toast]);

  const generator: GeneratorControls = {
    loading: genState.loading,
    error: genState.error,
    liveConfigured: aiStatus.configured,
    generate: () => void generate(),
    usePrepared: () => {
      applyPrepared();
      setGenState({ loading: false, error: null });
    },
    reuse: () => {
      dispatch({ type: 'allowRepeats' });
      applyPrepared(true);
      toast.info('Prepared challenges will now repeat for the rest of this session.');
    },
  };

  /* ---------- Session-level actions ---------- */

  const endGame = async () => {
    const ok = await confirm({
      title: 'End the game now?',
      message: 'The clock stops and you go straight to the final result review. Scores recorded so far are kept.',
      confirmLabel: 'End game',
    });
    if (ok) dispatch({ type: 'endGame', now: Date.now() });
  };

  const exit = async () => {
    const noTurns = session.startedAt === null && session.events.length === 0;
    const ok = await confirm({
      title: noTurns ? 'Leave before playing?' : 'Leave this game?',
      message: noTurns
        ? 'No turns have been played yet. The game will be cancelled.'
        : 'The game will be cancelled and will not be saved to history. To keep the result, use End Game instead.',
      confirmLabel: 'Leave game',
      tone: 'danger',
    });
    if (ok) {
      api.clear();
      navigate('/games');
    }
  };

  const confirmResult = (acceptTie: boolean) => {
    const finished = sessionReducer(sessionRef.current, { type: 'confirmResult', now: Date.now(), acceptTie });
    const record = buildHistoryRecord(finished, game);
    if (!record) return;
    addHistory(record);
    api.clear();
    navigate(`/results/${record.id}`, { replace: true });
  };

  const adjust = (participantId: string, delta: 1 | -1) =>
    dispatch({
      type: 'record',
      now: Date.now(),
      event: { participantId, kind: 'adjust', points: delta, note: delta > 0 ? 'Point added by host' : 'Point removed by host' },
    });

  const reviewing = session.status === 'review' || session.status === 'tiebreak';
  const activeId = reviewing || session.gameId === 'football' ? null : currentParticipant(session).id;

  return (
    <div className="page container session-page">
      <SessionTopBar session={session} game={game} onEnd={() => void endGame()} onExit={() => void exit()} />
      <div className="session-grid">
        <section className="session-main" aria-label="Game area">
          {reviewing ? (
            <ReviewPanel session={session} game={game} dispatch={dispatch} onConfirm={confirmResult} drawTiebreak={drawTiebreak} />
          ) : (
            <Play session={session} game={game} dispatch={dispatch} remainingMs={remainingMs} drawNext={drawNext} generator={generator} />
          )}
        </section>
        <aside className="session-side" aria-label="Scores">
          <Scoreboard
            session={session}
            activeId={activeId}
            onAdjust={session.gameId === 'football' ? undefined : adjust}
            canAdjust={ADJUSTABLE.includes(session.status)}
          />
          <EventLog session={session} onReverse={(eventId) => dispatch({ type: 'reverse', eventId })} />
        </aside>
      </div>
    </div>
  );
}
