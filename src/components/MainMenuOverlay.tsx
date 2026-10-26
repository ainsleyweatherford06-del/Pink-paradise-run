import React from "react";
import { Check, Play, RotateCw, Volume2, VolumeX } from "lucide-react";
import { CHARACTERS, CharacterId } from "../game/types";
import { CharacterAvatarSvg } from "./CharacterAvatarSvg";

interface MainMenuOverlayProps {
  selectedCharacter: CharacterId;
  bestScore: number;
  isMuted: boolean;
  onSelectCharacter: (id: CharacterId) => void;
  onSpinPreview: () => void;
  onStartGame: () => void;
  onToggleMute: () => void;
}

export const MainMenuOverlay: React.FC<MainMenuOverlayProps> = ({
  selectedCharacter,
  bestScore,
  isMuted,
  onSelectCharacter,
  onSpinPreview,
  onStartGame,
  onToggleMute,
}) => {
  const activeProfile =
    CHARACTERS.find((c) => c.id === selectedCharacter) ?? CHARACTERS[0];

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between overflow-y-auto">
      {/* Clean 3-Zone Top Bar */}
      <header className="pointer-events-auto flex items-center justify-between gap-8 border-b border-[#f5bfd8] bg-[#fff8fc]/95 px-6 py-3.5">
        <span className="font-display text-lg font-bold tracking-tight text-[#4a0e2b] whitespace-nowrap shrink-0">
          Pink Paradise Run
        </span>

        <nav
          aria-label="Menu sections"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#7a284f]"
        >
          <a
            href="#character-select"
            className="hover:text-[#c81e68] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Runners
          </a>
          <a
            href="#how-to-play"
            className="hover:text-[#c81e68] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            How to Play
          </a>
          <a
            href="#obstacles-guide"
            className="hover:text-[#c81e68] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Obstacles
          </a>
          {bestScore > 0 && (
            <span className="text-xs text-[#8a3a61] whitespace-nowrap shrink-0">
              Best Score:{" "}
              <strong className="font-mono-nums font-semibold text-[#4a0e2b]">
                {bestScore} pts
              </strong>
            </span>
          )}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#f2bdd7] bg-white text-[#7a284f] hover:bg-[#fff0f7] focus-visible:outline-2 focus-visible:outline-[#db2777] transition-colors shrink-0 cursor-pointer"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onStartGame}
            className="inline-flex items-center gap-2 rounded-lg bg-[#db2777] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#be185d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#db2777] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Start Game</span>
          </button>
        </div>
      </header>

      {/* Main Content Split: Left 3D Character Stage + Right Menu & Instructions */}
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col lg:flex-row items-stretch justify-between gap-6 px-4 py-5 sm:px-6 lg:py-6">
        {/* Left Zone: Live 3D Character Runway Stage Caption */}
        <div className="flex flex-col justify-end lg:w-[42%] min-h-[210px] lg:min-h-0 pb-2">
          <div className="pointer-events-auto inline-flex max-w-md flex-col gap-2.5 self-start rounded-2xl border border-[#f5c2dc] bg-[#fff9fc]/95 p-4 shadow-md">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#9d2f63]">
                  Selected Runner · {activeProfile.role}
                </p>
                <h2 className="font-display text-xl font-bold text-[#3b0a22]">
                  {activeProfile.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={onSpinPreview}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#f3bdd8] bg-white px-3 py-1.5 text-xs font-semibold text-[#831843] hover:bg-[#ffeef6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Twirl Preview</span>
              </button>
            </div>
            <p className="text-xs leading-relaxed text-[#6b2146]">
              {activeProfile.hairstyle} · {activeProfile.outfit} ·{" "}
              {activeProfile.accessory}
            </p>
          </div>
        </div>

        {/* Right Zone: Title, Character Selection, Start CTA & How to Play */}
        <div className="pointer-events-auto flex w-full lg:w-[56%] flex-col justify-between gap-5 rounded-2xl border border-[#f3bdd8] bg-[#fffafd]/96 p-5 sm:p-6 shadow-xl overflow-y-auto max-h-[calc(100vh-92px)]">
          {/* Hero Header & Primary CTA */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#f8d5e6] pb-4">
            <div>
              <p className="text-xs font-semibold text-[#be185d]">
                3D Endless Fantasy Runner · Three-Lane Course
              </p>
              <h1
                className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#38091f] mt-0.5"
                style={{ textWrap: "balance" }}
              >
                Pink Paradise Run
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-[#632042] max-w-xl">
                Run as far as possible through a sparkling pink fantasy world!
                Collect Pink Gems for{" "}
                <strong className="font-semibold text-[#be185d]">
                  +10 points
                </strong>{" "}
                each while dodging oversized makeup, giant hearts, and palace
                walls as the speed builds.
              </p>
            </div>

            <button
              type="button"
              onClick={onStartGame}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#db2777] px-6 py-3.5 text-base font-bold text-white shadow-sm hover:bg-[#be185d] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#db2777] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>Start Game</span>
            </button>
          </div>

          {/* FR-01: Character Selection Section */}
          <section id="character-select" aria-labelledby="runner-heading">
            <div className="flex items-baseline justify-between mb-2.5">
              <h2
                id="runner-heading"
                className="font-display text-base font-bold text-[#3b0a22]"
              >
                1. Choose Your Character
              </h2>
              <span className="text-xs text-[#8a3a61]">
                Click a character to preview in 3D
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CHARACTERS.map((char) => {
                const isSelected = char.id === selectedCharacter;
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => onSelectCharacter(char.id)}
                    aria-pressed={isSelected}
                    className={`group relative flex flex-col items-start rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#db2777] bg-[#fff0f7] ring-2 ring-[#db2777]/25"
                        : "border-[#f3cce0] bg-white hover:border-[#ec4899] hover:bg-[#fff8fc]"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-2 mb-2">
                      <CharacterAvatarSvg
                        characterId={char.id}
                        className="w-12 h-12 shrink-0 rounded-xl"
                      />
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                          isSelected
                            ? "bg-[#db2777] text-white"
                            : "border border-[#f1c4da] text-transparent group-hover:border-[#ec4899]"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    </div>

                    <span className="font-display text-sm font-bold text-[#3b0a22]">
                      {char.name}
                    </span>
                    <span className="text-[11px] font-medium text-[#be185d] mt-0.5">
                      {char.role}
                    </span>
                    <p className="mt-1.5 text-xs leading-snug text-[#6b2146]">
                      {char.hairstyle} · {char.accessory}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* FR-09: How to Play & Obstacle Guide */}
          <section
            id="how-to-play"
            aria-labelledby="howto-heading"
            className="border-t border-[#f8d5e6] pt-4"
          >
            <h2
              id="howto-heading"
              className="font-display text-base font-bold text-[#3b0a22] mb-2.5"
            >
              2. How to Play & Controls
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="rounded-xl border border-[#f5cfe1] bg-white p-2.5">
                <kbd className="inline-block rounded-md border border-[#eab4ce] bg-[#fff3f8] px-2 py-0.5 font-mono-nums text-xs font-bold text-[#9d174d]">
                  ↑ Up
                </kbd>
                <p className="mt-1.5 text-xs font-semibold text-[#3b0a22]">
                  Jump
                </p>
                <p className="text-[11px] text-[#7a284f]">
                  Leap over hearts &amp; makeup bags
                </p>
              </div>

              <div className="rounded-xl border border-[#f5cfe1] bg-white p-2.5">
                <kbd className="inline-block rounded-md border border-[#eab4ce] bg-[#fff3f8] px-2 py-0.5 font-mono-nums text-xs font-bold text-[#9d174d]">
                  ↓ Down
                </kbd>
                <p className="mt-1.5 text-xs font-semibold text-[#3b0a22]">
                  Slide
                </p>
                <p className="text-[11px] text-[#7a284f]">
                  Duck under barriers &amp; garlands
                </p>
              </div>

              <div className="rounded-xl border border-[#f5cfe1] bg-white p-2.5">
                <kbd className="inline-block rounded-md border border-[#eab4ce] bg-[#fff3f8] px-2 py-0.5 font-mono-nums text-xs font-bold text-[#9d174d]">
                  ← Left
                </kbd>
                <p className="mt-1.5 text-xs font-semibold text-[#3b0a22]">
                  Move Left
                </p>
                <p className="text-[11px] text-[#7a284f]">
                  Shift one lane left
                </p>
              </div>

              <div className="rounded-xl border border-[#f5cfe1] bg-white p-2.5">
                <kbd className="inline-block rounded-md border border-[#eab4ce] bg-[#fff3f8] px-2 py-0.5 font-mono-nums text-xs font-bold text-[#9d174d]">
                  → Right
                </kbd>
                <p className="mt-1.5 text-xs font-semibold text-[#3b0a22]">
                  Move Right
                </p>
                <p className="text-[11px] text-[#7a284f]">
                  Shift one lane right
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-xl border border-[#f0abcb] bg-[#fff2f8] p-2.5">
                <kbd className="inline-block rounded-md border border-[#e18bb3] bg-white px-2 py-0.5 font-mono-nums text-xs font-bold text-[#be185d] whitespace-nowrap">
                  Space × 2
                </kbd>
                <p className="mt-1.5 text-xs font-semibold text-[#3b0a22]">
                  Double Jump
                </p>
                <p className="text-[11px] text-[#7a284f]">
                  Tap twice fast for tall obstacles
                </p>
              </div>
            </div>

            {/* Concise Obstacle & Scoring Reference */}
            <div
              id="obstacles-guide"
              className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#6b2146] pt-1"
            >
              <span>
                <strong className="font-semibold text-[#3b0a22]">
                  Pink Gems:
                </strong>{" "}
                +10 points each
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong className="font-semibold text-[#3b0a22]">
                  Tall Lipstick Display:
                </strong>{" "}
                Double Jump (Space × 2) or Switch Lanes
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong className="font-semibold text-[#3b0a22]">
                  Pink Palace Walls:
                </strong>{" "}
                Switch Lanes Left or Right
              </span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
