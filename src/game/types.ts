export enum GameScreen {
  Menu = "MENU",
  Playing = "PLAYING",
  Paused = "PAUSED",
  GameOver = "GAME_OVER",
}

export enum CharacterId {
  Bella = "bella",
  Chloe = "chloe",
  Maya = "maya",
}

export enum ObstacleType {
  MakeupBag = "makeup_bag",
  GiantHeart = "giant_heart",
  CompactPalette = "compact_palette",
  PinkBarrier = "pink_barrier",
  HangingDecor = "hanging_decor",
  GiantMakeup = "giant_makeup",
  PinkWall = "pink_wall",
}

export enum AvoidAction {
  Jump = "Jump",
  Slide = "Slide",
  DoubleJump = "Double Jump",
  SwitchLane = "Switch Lanes",
}

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  role: string;
  hairstyle: string;
  outfit: string;
  accessory: string;
  skinHex: number;
  hairHex: number;
  primaryOutfitHex: number;
  secondaryOutfitHex: number;
  accentHex: number;
  shoeHex: number;
  cardAccentClass: string;
}

export const CHARACTERS: CharacterProfile[] = [
  {
    id: CharacterId.Bella,
    name: "Bella Rose",
    role: "Glam Pop Sprinter",
    hairstyle: "High golden ponytail with satin ribbon bow",
    outfit: "Pearl varsity crop jacket & rose pleated skirt",
    accessory: "Heart-shaped rose sunglasses",
    skinHex: 0xf7cbb2,
    hairHex: 0xf3c65f,
    primaryOutfitHex: 0xff3b8d,
    secondaryOutfitHex: 0xfff5f9,
    accentHex: 0xffb3d1,
    shoeHex: 0xe63980,
    cardAccentClass: "#e11d74",
  },
  {
    id: CharacterId.Chloe,
    name: "Chloe Starlight",
    role: "Ballet Ribbon Runner",
    hairstyle: "Espresso twin space buns with pastel star clips",
    outfit: "Blush layered tulle tutu & magenta satin bodice",
    accessory: "Sparkling rose-gold tiara crown",
    skinHex: 0xe6ab8a,
    hairHex: 0x3b221e,
    primaryOutfitHex: 0xff80b5,
    secondaryOutfitHex: 0xd61f69,
    accentHex: 0xf6c453,
    shoeHex: 0xf472b6,
    cardAccentClass: "#c02669",
  },
  {
    id: CharacterId.Maya,
    name: "Maya Velvet",
    role: "Berry Streetwear Dasher",
    hairstyle: "Long berry-auburn twin braids with gold cuffs",
    outfit: "Berry athletic hoodie & pastel blush runner shorts",
    accessory: "Shimmering pink headphones & star bag",
    skinHex: 0x8d553a,
    hairHex: 0x6e1d3f,
    primaryOutfitHex: 0xc81e68,
    secondaryOutfitHex: 0xffcce0,
    accentHex: 0xff5ca8,
    shoeHex: 0xbe185d,
    cardAccentClass: "#9d174d",
  },
];

export interface ObstacleSpec {
  type: ObstacleType;
  label: string;
  avoidAction: AvoidAction;
  /** Minimum Y occupied by solid collision box */
  minY: number;
  /** Maximum Y occupied by solid collision box */
  maxY: number;
  /** Half-width in X for collision check */
  halfWidth: number;
  /** Half-depth in Z for collision check */
  halfDepth: number;
}

export const OBSTACLE_SPECS: Record<ObstacleType, ObstacleSpec> = {
  [ObstacleType.MakeupBag]: {
    type: ObstacleType.MakeupBag,
    label: "Quilted Makeup Bag",
    avoidAction: AvoidAction.Jump,
    minY: 0,
    maxY: 1.02,
    halfWidth: 0.78,
    halfDepth: 0.48,
  },
  [ObstacleType.GiantHeart]: {
    type: ObstacleType.GiantHeart,
    label: "Crystal Pink Heart",
    avoidAction: AvoidAction.Jump,
    minY: 0,
    maxY: 1.08,
    halfWidth: 0.76,
    halfDepth: 0.42,
  },
  [ObstacleType.CompactPalette]: {
    type: ObstacleType.CompactPalette,
    label: "Blush Compact Mirror",
    avoidAction: AvoidAction.Jump,
    minY: 0,
    maxY: 0.98,
    halfWidth: 0.8,
    halfDepth: 0.5,
  },
  [ObstacleType.PinkBarrier]: {
    type: ObstacleType.PinkBarrier,
    label: "Satin Ribbon Barrier",
    avoidAction: AvoidAction.Slide,
    minY: 1.18,
    maxY: 2.6,
    halfWidth: 0.95,
    halfDepth: 0.35,
  },
  [ObstacleType.HangingDecor]: {
    type: ObstacleType.HangingDecor,
    label: "Hanging Heart Garland",
    avoidAction: AvoidAction.Slide,
    minY: 1.18,
    maxY: 3.1,
    halfWidth: 0.95,
    halfDepth: 0.35,
  },
  [ObstacleType.GiantMakeup]: {
    type: ObstacleType.GiantMakeup,
    label: "Towering Lipstick & Perfume",
    avoidAction: AvoidAction.DoubleJump,
    minY: 0,
    maxY: 2.08,
    halfWidth: 0.8,
    halfDepth: 0.52,
  },
  [ObstacleType.PinkWall]: {
    type: ObstacleType.PinkWall,
    label: "Royal Pink Palace Wall",
    avoidAction: AvoidAction.SwitchLane,
    minY: 0,
    maxY: 3.8,
    halfWidth: 0.92,
    halfDepth: 0.55,
  },
};

export interface GameStats {
  score: number;
  gemsCollected: number;
  distanceMeters: number;
  elapsedSeconds: number;
  currentSpeed: number;
  bestScore: number;
   crashedObstacleLabel?: string;
}

export interface HudCallout {
  id: number;
  text: string;
  variant: "gem" | "doubleJump";
}

export const LANE_WIDTH = 2.6;
export const LANES = [-1, 0, 1] as const;
export type LaneIndex = -1 | 0 | 1;

export const POINTS_PER_GEM = 10;
