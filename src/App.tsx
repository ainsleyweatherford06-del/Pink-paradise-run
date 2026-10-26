/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { GameHud } from "./components/GameHud";
import { GameOverModal } from "./components/GameOverModal";
import { MainMenuOverlay } from "./components/MainMenuOverlay";
import { ParadiseEngine } from "./game/ParadiseEngine";
import { sound } from "./game/sound";
import {
  CharacterId,
  GameScreen,
  GameStats,
  HudCallout,
} from "./game/types";

const INITIAL_STATS: GameStats = {
  score: 0,
  gemsCollected: 0,
  distanceMeters: 0,
  elapsedSeconds: 0,
  currentSpeed: 14.5,
  bestScore: 0,
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ParadiseEngine | null>(null);

  const [screen, setScreen] = useState<GameScreen>(GameScreen.Menu);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>(
    CharacterId.Bella
  );
  const [stats, setStats] = useState<GameStats>(() => {
    let savedBest = 0;
    try {
      savedBest =
        parseInt(
          window.localStorage.getItem("pink_paradise_run_best_score") || "0",
          10
        ) || 0;
    } catch {
      savedBest = 0;
    }
    return { ...INITIAL_STATS, bestScore: savedBest };
  });
  const [callout, setCallout] = useState<HudCallout | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.isMuted());

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const engine = new ParadiseEngine(container, CharacterId.Bella, {
      onStatsUpdate: (nextStats) => {
        setStats(nextStats);
      },
      onScreenChange: (nextScreen) => {
        setScreen(nextScreen);
      },
      onCallout: (nextCallout) => {
        setCallout(nextCallout);
      },
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleSelectCharacter = useCallback((id: CharacterId) => {
    setSelectedCharacter(id);
    engineRef.current?.setCharacter(id, true);
  }, []);

  const handleSpinPreview = useCallback(() => {
    engineRef.current?.spinCharacterPreview();
  }, []);

  const handleStartGame = useCallback(() => {
    setCallout(null);
    engineRef.current?.startGame();
  }, []);

  const handleReturnToMenu = useCallback(() => {
    setCallout(null);
    engineRef.current?.returnToMenu();
  }, []);

  const handleTogglePause = useCallback(() => {
    engineRef.current?.togglePause();
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  const handleMoveLeft = useCallback(() => {
    engineRef.current?.moveLeft();
  }, []);

  const handleMoveRight = useCallback(() => {
    engineRef.current?.moveRight();
  }, []);

  const handleSingleJump = useCallback(() => {
    engineRef.current?.triggerSingleJump();
  }, []);

  const handleDoubleJump = useCallback(() => {
    engineRef.current?.triggerDirectDoubleJump();
  }, []);

  const handleSlide = useCallback(() => {
    engineRef.current?.triggerSlide();
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-[#ffd6ec] via-[#ffe6f3] to-[#f7afd2]">
      {/* Isolated Three.js WebGL Mount Container */}
      <div
        ref={canvasMountRef}
        className="fixed inset-0 h-full w-full"
        aria-label="Pink Paradise Run 3D Course Viewport"
      />

      {/* Main Menu & Character Selection Overlay */}
      {screen === GameScreen.Menu && (
        <MainMenuOverlay
          selectedCharacter={selectedCharacter}
          bestScore={stats.bestScore}
          isMuted={isMuted}
          onSelectCharacter={handleSelectCharacter}
          onSpinPreview={handleSpinPreview}
          onStartGame={handleStartGame}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Active Gameplay Progress HUD */}
      {(screen === GameScreen.Playing || screen === GameScreen.Paused) && (
        <GameHud
          screen={screen}
          stats={stats}
          callout={callout}
          isMuted={isMuted}
          onTogglePause={handleTogglePause}
          onToggleMute={handleToggleMute}
          onMoveLeft={handleMoveLeft}
          onMoveRight={handleMoveRight}
          onSingleJump={handleSingleJump}
          onDoubleJump={handleDoubleJump}
          onSlide={handleSlide}
        />
      )}

      {/* Pause & Game Over Results Modals */}
      {(screen === GameScreen.Paused || screen === GameScreen.GameOver) && (
        <GameOverModal
          screen={screen}
          stats={stats}
          characterId={selectedCharacter}
          onResume={handleTogglePause}
          onPlayAgain={handleStartGame}
          onMainMenu={handleReturnToMenu}
        />
      )}
    </div>
  );
}
