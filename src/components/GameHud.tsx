import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { GameScreen, GameStats, HudCallout } from "../game/types";

interface GameHudProps {
  screen: GameScreen;
  stats: GameStats;
  callout: HudCallout | null;
  isMuted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onSingleJump: () => void;
  onDoubleJump: () => void;
  onSlide: () => void;
}

export function formatSurvivalTime(totalSeconds: number): string {
  const secs = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

export const GameHud: React.FC<GameHudProps> = ({
  screen,
  stats,
  callout,
  isMuted,
  onTogglePause,
  onToggleMute,
  onMoveLeft,
  onMoveRight,
  onSingleJump,
  onDoubleJump,
  onSlide,
}) => {
  const [controlsCollapsed, setControlsCollapsed] = useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyH" && !e.repeat) {
        setControlsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const withBlur =
    (fn: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.blur();
      fn();
    };

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4 sm:p-5">
      {/* Top Progress Tracking HUD (Score, Distance, Time + Pause/Mute) */}
      <div className="flex items-start justify-between gap-4">
        <div className="pointer-events-auto flex flex-wrap items-center gap-5 sm:gap-7 rounded-2xl border border-[#f472b6]/40 bg-[#2d0b1e]/92 px-5 py-3 text-white shadow-lg">
          <div>
            <p className="text-[11px] font-medium text-[#f9a8d4]">Score</p>
            <p className="font-mono-nums text-xl sm:text-2xl font-bold tracking-tight text-white">
              {stats.score}
            </p>
          </div>

          <div className="h-8 w-px bg-white/15" aria-hidden="true" />

          <div>
            <p className="text-[11px] font-medium text-[#f9a8d4]">Distance</p>
            <p className="font-mono-nums text-xl sm:text-2xl font-bold tracking-tight text-white">
              {stats.distanceMeters} m
            </p>
          </div>

          <div className="h-8 w-px bg-white/15" aria-hidden="true" />

          <div>
            <p className="text-[11px] font-medium text-[#f9a8d4]">Time</p>
            <p className="font-mono-nums text-xl sm:text-2xl font-bold tracking-tight text-white">
              {formatSurvivalTime(stats.elapsedSeconds)}
            </p>
          </div>

          <div className="hidden sm:block h-8 w-px bg-white/15" aria-hidden="true" />

          <div className="hidden sm:block">
            <p className="text-[11px] font-medium text-[#f9a8d4]">Pink Gems</p>
            <p className="font-mono-nums text-lg font-semibold text-[#fbcfe8]">
              {stats.gemsCollected}
            </p>
          </div>
        </div>

        {/* Right Controls: Sound & Pause */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          <button
            type="button"
            onClick={withBlur(onToggleMute)}
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#f472b6]/40 bg-[#2d0b1e]/92 text-white hover:bg-[#4a1230] transition-colors cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-[#f9a8d4]" />
            ) : (
              <Volume2 className="h-4 w-4 text-[#f9a8d4]" />
            )}
          </button>

          <button
            type="button"
            onClick={withBlur(onTogglePause)}
            aria-label={screen === GameScreen.Paused ? "Resume game" : "Pause game"}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#f472b6]/40 bg-[#2d0b1e]/92 px-4 text-sm font-semibold text-white hover:bg-[#4a1230] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {screen === GameScreen.Paused ? (
              <>
                <Play className="h-4 w-4 fill-current text-[#f9a8d4]" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 text-[#f9a8d4]" />
                <span>Pause</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Floating Score / Double-Jump Callout */}
      {callout && (
        <div
          key={callout.id}
          className="animate-float-pop fixed left-1/2 top-24 z-20 rounded-xl border border-[#fbcfe8] bg-[#be185d] px-4 py-1.5 font-display text-base font-bold text-white shadow-md"
        >
          {callout.text}
        </div>
      )}

      {/* Collapsible Unified Bottom Control Dock */}
      <div className="mx-auto flex flex-col items-center">
        <button
          type="button"
          onClick={withBlur(() => setControlsCollapsed((prev) => !prev))}
          className="pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 rounded-lg border border-[#f472b6]/35 bg-[#2d0b1e]/88 px-3 py-1 text-xs font-medium text-[#fbcfe8] hover:bg-[#45122e] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {controlsCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              <span>Hide Controls</span>
            </>
          )}
        </button>

        {!controlsCollapsed && (
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#f472b6]/40 bg-[#2d0b1e]/90 px-3.5 py-2.5 text-xs text-white shadow-lg max-w-[94vw]">
            <button
              type="button"
              onClick={withBlur(onMoveLeft)}
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 font-medium hover:bg-white/20 active:scale-95 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="font-mono-nums font-bold text-[#f9a8d4]">←</span>{" "}
              Left
            </button>
            <button
              type="button"
              onClick={withBlur(onSingleJump)}
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 font-medium hover:bg-white/20 active:scale-95 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="font-mono-nums font-bold text-[#f9a8d4]">↑</span>{" "}
              Jump
            </button>
            <button
              type="button"
              onClick={withBlur(onDoubleJump)}
              className="rounded-lg border border-[#f472b6]/50 bg-[#db2777]/80 px-3 py-1.5 font-semibold hover:bg-[#db2777] active:scale-95 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="font-mono-nums font-bold text-[#ffe4f1]">
                Space × 2
              </span>{" "}
              Double Jump
            </button>
            <button
              type="button"
              onClick={withBlur(onSlide)}
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 font-medium hover:bg-white/20 active:scale-95 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="font-mono-nums font-bold text-[#f9a8d4]">↓</span>{" "}
              Slide
            </button>
            <button
              type="button"
              onClick={withBlur(onMoveRight)}
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 font-medium hover:bg-white/20 active:scale-95 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="font-mono-nums font-bold text-[#f9a8d4]">→</span>{" "}
              Right
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
