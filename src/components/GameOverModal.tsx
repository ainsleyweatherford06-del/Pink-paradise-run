import React from "react";
import { Home, Play, RotateCcw } from "lucide-react";
import { CHARACTERS, CharacterId, GameScreen, GameStats } from "../game/types";
import { formatSurvivalTime } from "./GameHud";

interface GameOverModalProps {
  screen: GameScreen.Paused | GameScreen.GameOver;
  stats: GameStats;
  characterId: CharacterId;
  onResume: () => void;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  screen,
  stats,
  characterId,
  onResume,
  onPlayAgain,
  onMainMenu,
}) => {
  const runner =
    CHARACTERS.find((c) => c.id === characterId) ?? CHARACTERS[0];

  if (screen === GameScreen.Paused) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#1f0714]/70 p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-title"
          className="w-full max-w-md rounded-2xl border border-[#f5c2dc] bg-[#fffafd] p-6 sm:p-7 text-[#38091f] shadow-2xl"
        >
          <p className="text-xs font-semibold text-[#be185d]">
            Pink Paradise Run · {runner.name}
          </p>
          <h2
            id="pause-title"
            className="font-display text-2xl font-bold mt-1"
          >
            Game Paused
          </h2>
          <p className="mt-1.5 text-sm text-[#6b2146]">
            Take a breather! Your current score of{" "}
            <strong className="font-mono-nums font-semibold">
              {stats.score} points
            </strong>{" "}
            and distance of{" "}
            <strong className="font-mono-nums font-semibold">
              {stats.distanceMeters} m
            </strong>{" "}
            are ready when you continue.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onResume}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#db2777] px-5 py-3 text-sm font-bold text-white hover:bg-[#be185d] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Resume</span>
            </button>
            <button
              type="button"
              onClick={onPlayAgain}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#f2bdd7] bg-white px-4 py-3 text-sm font-semibold text-[#7a284f] hover:bg-[#fff0f7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Restart</span>
            </button>
            <button
              type="button"
              onClick={onMainMenu}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#f2bdd7] bg-white px-4 py-3 text-sm font-semibold text-[#7a284f] hover:bg-[#fff0f7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Home className="h-4 w-4" />
              <span>Main Menu</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#1f0714]/75 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gameover-title"
        className="w-full max-w-lg rounded-2xl border border-[#f3bdd8] bg-[#fffafd] p-6 sm:p-8 text-[#38091f] shadow-2xl"
      >
        <div className="border-b border-[#f8d5e6] pb-4">
          <p className="text-xs font-semibold text-[#be185d]">
            Run Complete · {runner.name}
          </p>
          <h2
            id="gameover-title"
            className="font-display text-3xl font-bold tracking-tight mt-0.5"
          >
            Game Over
          </h2>
          <p className="mt-1 text-sm text-[#6b2146]">
            {stats.crashedObstacleLabel
              ? `Collided with ${stats.crashedObstacleLabel}.`
              : "You crashed into an obstacle on the runway."}
          </p>
        </div>

        {/* Final Results Summary */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-[#f3cce0] bg-[#fff2f8] p-3.5">
            <p className="text-xs font-medium text-[#8a3a61]">Final Score</p>
            <p className="font-mono-nums text-2xl sm:text-3xl font-bold text-[#be185d] mt-1">
              {stats.score}
            </p>
            <p className="text-[11px] text-[#7a284f] mt-0.5">
              {stats.gemsCollected} gems × 10 pts
            </p>
          </div>

          <div className="rounded-xl border border-[#f3cce0] bg-white p-3.5">
            <p className="text-xs font-medium text-[#8a3a61]">Distance</p>
            <p className="font-mono-nums text-2xl sm:text-3xl font-bold text-[#38091f] mt-1">
              {stats.distanceMeters} m
            </p>
            <p className="text-[11px] text-[#7a284f] mt-0.5">
              Traveled down course
            </p>
          </div>

          <div className="rounded-xl border border-[#f3cce0] bg-white p-3.5">
            <p className="text-xs font-medium text-[#8a3a61]">Time Survived</p>
            <p className="font-mono-nums text-2xl sm:text-3xl font-bold text-[#38091f] mt-1">
              {formatSurvivalTime(stats.elapsedSeconds)}
            </p>
            <p className="text-[11px] text-[#7a284f] mt-0.5">
              Best: {stats.bestScore} pts
            </p>
          </div>
        </div>

        {/* FR-08: Play Again & Main Menu Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#db2777] px-6 py-3.5 text-base font-bold text-white hover:bg-[#be185d] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#db2777] transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Play Again</span>
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#eeb8d3] bg-white px-6 py-3.5 text-base font-semibold text-[#7a284f] hover:bg-[#fff0f7] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#db2777] transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
