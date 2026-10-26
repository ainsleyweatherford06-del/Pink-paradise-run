import { LANES, LaneIndex, ObstacleType } from "./types";

export interface WaveObstacleInstruction {
  lane: LaneIndex;
  type: ObstacleType;
}

export interface WaveGemInstruction {
  lane: LaneIndex;
  zOffset: number;
  y: number;
}

export interface SpawnWave {
  obstacles: WaveObstacleInstruction[];
  gems: WaveGemInstruction[];
  /** Recommended distance before spawning the next wave */
  spacingAfter: number;
}

const LOW_OBSTACLES: ObstacleType[] = [
  ObstacleType.MakeupBag,
  ObstacleType.GiantHeart,
  ObstacleType.CompactPalette,
];

const SLIDE_OBSTACLES: ObstacleType[] = [
  ObstacleType.PinkBarrier,
  ObstacleType.HangingDecor,
];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffledLanes(): LaneIndex[] {
  const copy: LaneIndex[] = [...LANES];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Generates guaranteed-solvable obstacle & pink gem waves calibrated for a 3–5 minute
 * difficulty progression.
 */
export function generateNextWave(
  elapsedSeconds: number,
  currentSpeed: number
): SpawnWave {
  // Normalized difficulty 0.0 -> 1.0 over 240 seconds (4 minutes)
  const difficulty = Math.min(1, elapsedSeconds / 240);
  const lanes = shuffledLanes();

  const obstacles: WaveObstacleInstruction[] = [];
  const gems: WaveGemInstruction[] = [];

  // Reaction time scales gently from 1.75s (beginner friendly) down to 0.96s (fast-paced)
  const reactionSeconds = 1.75 - difficulty * 0.79;
  const baseSpacing = Math.max(23, currentSpeed * reactionSeconds);

  const roll = Math.random();

  if (elapsedSeconds < 25) {
    // Phase 1 (0:00 - 0:25): Gentle warm-up — single obstacle + inviting gem lines
    const obsLane = lanes[0];
    const safeLane = lanes[1];
    const type =
      roll < 0.55
        ? pickRandom(LOW_OBSTACLES)
        : roll < 0.85
        ? pickRandom(SLIDE_OBSTACLES)
        : ObstacleType.PinkWall;

    obstacles.push({ lane: obsLane, type });

    if (LOW_OBSTACLES.includes(type) && Math.random() < 0.5) {
      // Teach jumping over low obstacles with a gem arc!
      gems.push(
        { lane: obsLane, zOffset: 3.2, y: 1.25 },
        { lane: obsLane, zOffset: 0, y: 2.05 },
        { lane: obsLane, zOffset: -3.2, y: 1.25 }
      );
    } else if (SLIDE_OBSTACLES.includes(type) && Math.random() < 0.55) {
      // Teach sliding under barriers with low ground gems!
      gems.push(
        { lane: obsLane, zOffset: 2.8, y: 0.55 },
        { lane: obsLane, zOffset: 0, y: 0.55 },
        { lane: obsLane, zOffset: -2.8, y: 0.55 }
      );
    } else {
      // Line of 3 gems in an open lane
      for (let i = -1; i <= 1; i++) {
        gems.push({ lane: safeLane, zOffset: i * 3.0, y: 0.62 });
      }
    }

    return { obstacles, gems, spacingAfter: baseSpacing + 3 };
  }

  if (elapsedSeconds < 75) {
    // Phase 2 (0:25 - 1:15): Introduce Towering Makeup (Double Jump!) & 2-lane combos
    if (roll < 0.3) {
      // Showcase Double Jump obstacle with high rainbow gem arc
      const djLane = lanes[0];
      obstacles.push({ lane: djLane, type: ObstacleType.GiantMakeup });
      obstacles.push({ lane: lanes[1], type: ObstacleType.PinkWall });
      // Lane[2] is 100% open, OR player can Double Jump over GiantMakeup for 3 bonus gems!
      gems.push(
        { lane: djLane, zOffset: 4.0, y: 1.8 },
        { lane: djLane, zOffset: 0, y: 3.15 },
        { lane: djLane, zOffset: -4.0, y: 1.8 }
      );
    } else if (roll < 0.68) {
      // Two obstacles, 1 open lane with diagonal gem trail
      obstacles.push({ lane: lanes[0], type: pickRandom(LOW_OBSTACLES) });
      obstacles.push({ lane: lanes[1], type: pickRandom(SLIDE_OBSTACLES) });
      gems.push(
        { lane: lanes[2], zOffset: 3.5, y: 0.62 },
        { lane: lanes[2], zOffset: 0, y: 0.62 },
        { lane: lanes[0], zOffset: -5.5, y: 0.62 }
      );
    } else {
      // One Palace Wall + one Jump/Slide + open lane
      obstacles.push({ lane: lanes[0], type: ObstacleType.PinkWall });
      const secondType =
        Math.random() < 0.5
          ? pickRandom(LOW_OBSTACLES)
          : pickRandom(SLIDE_OBSTACLES);
      obstacles.push({ lane: lanes[1], type: secondType });
      for (let i = -1; i <= 1; i++) {
        gems.push({ lane: lanes[2], zOffset: i * 2.8, y: 0.62 });
      }
    }

    return { obstacles, gems, spacingAfter: baseSpacing + 1.5 };
  }

  // Phase 3 & 4 (1:15 - 5:00+): Full Paradise Challenge — rich multi-lane choreography, ALWAYS solvable!
  if (roll < 0.24) {
    // Two Palace Walls + 1 Open or Actionable Escape Lane!
    obstacles.push({ lane: lanes[0], type: ObstacleType.PinkWall });
    obstacles.push({ lane: lanes[1], type: ObstacleType.PinkWall });

    if (difficulty > 0.55 && Math.random() < 0.5) {
      // Actionable 3rd lane: Slide or Jump through the gap!
      const gapType =
        Math.random() < 0.5
          ? pickRandom(LOW_OBSTACLES)
          : pickRandom(SLIDE_OBSTACLES);
      obstacles.push({ lane: lanes[2], type: gapType });
      const gemY = LOW_OBSTACLES.includes(gapType) ? 2.05 : 0.55;
      gems.push(
        { lane: lanes[2], zOffset: 3.0, y: 0.62 },
        { lane: lanes[2], zOffset: 0, y: gemY },
        { lane: lanes[2], zOffset: -3.0, y: 0.62 }
      );
    } else {
      // Clean open lane threaded with 4 pink gems
      for (let i = 0; i < 4; i++) {
        gems.push({ lane: lanes[2], zOffset: 4.5 - i * 3.0, y: 0.62 });
      }
    }
  } else if (roll < 0.48) {
    // Full-width Ribbon/Garland Slide Row OR Full-width Heart Jump Row (no walls!)
    const useSlideRow = Math.random() < 0.5;
    const rowType = useSlideRow
      ? pickRandom(SLIDE_OBSTACLES)
      : pickRandom(LOW_OBSTACLES);

    // Leave 1 lane open occasionally or span all 3 with jumpable/slidable obstacles
    obstacles.push({ lane: lanes[0], type: rowType });
    obstacles.push({ lane: lanes[1], type: rowType });
    if (difficulty > 0.4) {
      obstacles.push({ lane: lanes[2], type: rowType });
    }

    const rewardLane = lanes[0];
    const rewardY = useSlideRow ? 0.55 : 2.08;
    gems.push(
      { lane: rewardLane, zOffset: 3.2, y: useSlideRow ? 0.55 : 1.3 },
      { lane: rewardLane, zOffset: 0, y: rewardY },
      { lane: rewardLane, zOffset: -3.2, y: useSlideRow ? 0.55 : 1.3 }
    );
  } else if (roll < 0.74) {
    // Towering Makeup Double-Jump Challenge + Mixed Lanes
    const djLane = lanes[0];
    obstacles.push({ lane: djLane, type: ObstacleType.GiantMakeup });
    obstacles.push({ lane: lanes[1], type: ObstacleType.PinkWall });
    if (difficulty > 0.65) {
      obstacles.push({ lane: lanes[2], type: pickRandom(SLIDE_OBSTACLES) });
    }
    gems.push(
      { lane: djLane, zOffset: 4.2, y: 1.85 },
      { lane: djLane, zOffset: 0, y: 3.2 },
      { lane: djLane, zOffset: -4.2, y: 1.85 }
    );
  } else {
    // Asymmetric Trio: Wall + Low Jump + Slide Barrier (2 actionable lanes, 0 impossible walls!)
    obstacles.push({ lane: lanes[0], type: ObstacleType.PinkWall });
    obstacles.push({ lane: lanes[1], type: pickRandom(LOW_OBSTACLES) });
    obstacles.push({ lane: lanes[2], type: pickRandom(SLIDE_OBSTACLES) });

    // Diagonal gem slalom guiding into the slide lane
    gems.push(
      { lane: -1, zOffset: 6.0, y: 0.62 },
      { lane: 0, zOffset: 3.2, y: 0.62 },
      { lane: lanes[2], zOffset: 0, y: 0.55 },
      { lane: lanes[2], zOffset: -3.0, y: 0.62 }
    );
  }

  return { obstacles, gems, spacingAfter: baseSpacing };
}

/**
 * Computes progressive running speed (m/s) over survival time.
 * Starts gently at 14.5 m/s so beginners learn controls comfortably,
 * building smoothly toward 27 m/s at 3.5 min and 33 m/s by 5 min.
 */
export function computeSpeedAtTime(elapsedSeconds: number): number {
  const baseSpeed = 14.5;
  const maxBonus = 20.5;
  // Smooth saturating curve calibrated for a 3–5 minute target session
  const progress = 1 - Math.exp(-elapsedSeconds / 195);
  return baseSpeed + maxBonus * progress;
}
