import React from "react";
import { CharacterId } from "../game/types";

interface CharacterAvatarSvgProps {
  characterId: CharacterId;
  className?: string;
}

export const CharacterAvatarSvg: React.FC<CharacterAvatarSvgProps> = ({
  characterId,
  className = "w-14 h-14",
}) => {
  if (characterId === CharacterId.Bella) {
    // Bella Rose: High golden ponytail + hot-pink satin bow + heart rose sunglasses + pearl varsity jacket
    return (
      <svg
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <rect width="80" height="80" rx="14" fill="#FFE4F1" />
        {/* Ponytail */}
        <path
          d="M46 14C58 12 65 24 62 38C59 34 54 28 48 25Z"
          fill="#EAB84B"
        />
        {/* Satin Pink Bow */}
        <path d="M32 14L40 19L32 23Z" fill="#FF1F80" />
        <path d="M48 14L40 19L48 23Z" fill="#FF1F80" />
        <circle cx="40" cy="18.5" r="3" fill="#FFF5F9" />
        {/* Varsity Shoulders */}
        <path d="M18 76C18 61 28 55 40 55C52 55 62 61 62 76H18Z" fill="#FFF7FB" />
        <path d="M34 55H46V76H34V55Z" fill="#FF2E88" />
        {/* Neck & Face */}
        <rect x="36" y="47" width="8" height="10" rx="4" fill="#F7CBB2" />
        <circle cx="40" cy="36" r="14" fill="#F7CBB2" />
        {/* Golden Bangs */}
        <path
          d="M26 35C26 24 33 20 40 20C48 20 54 25 54 35C50 29 44 27 37 28C32 28.5 28 31 26 35Z"
          fill="#F3C65F"
        />
        {/* Heart Sunglasses */}
        <path
          d="M33 34C31.5 32 28.5 32.5 28.5 35C28.5 37.5 33 40 33 40C33 40 37.5 37.5 37.5 35C37.5 32.5 34.5 32 33 34Z"
          fill="#FF1F80"
          stroke="#FFF5F9"
          strokeWidth="1.2"
        />
        <path
          d="M47 34C45.5 32 42.5 32.5 42.5 35C42.5 37.5 47 40 47 40C47 40 51.5 37.5 51.5 35C51.5 32.5 48.5 32 47 34Z"
          fill="#FF1F80"
          stroke="#FFF5F9"
          strokeWidth="1.2"
        />
        <line x1="37" y1="35" x2="43" y2="35" stroke="#FFF5F9" strokeWidth="1.5" />
        {/* Smile */}
        <path
          d="M36.5 43.5C38 45.5 42 45.5 43.5 43.5"
          stroke="#D61F69"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (characterId === CharacterId.Chloe) {
    // Chloe Starlight: Espresso twin space buns + star hairclips + rose-gold tiara + magenta bodice
    return (
      <svg
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <rect width="80" height="80" rx="14" fill="#FCE7F3" />
        {/* Twin Space Buns */}
        <circle cx="24" cy="22" r="8" fill="#3B221E" />
        <circle cx="56" cy="22" r="8" fill="#3B221E" />
        {/* Star Clips */}
        <circle cx="27" cy="24" r="2.8" fill="#FF80B5" />
        <circle cx="53" cy="24" r="2.8" fill="#FF80B5" />
        {/* Rose-Gold Tiara Crown */}
        <path d="M31 21L35 14L40 10L45 14L49 21H31Z" fill="#F6C453" />
        <circle cx="40" cy="16" r="2.2" fill="#FF1F80" />
        {/* Ballet Bodice & Puff Sleeves */}
        <path d="M19 76C19 61 29 55 40 55C51 55 61 61 61 76H19Z" fill="#D61F69" />
        <circle cx="24" cy="61" r="6" fill="#FF9EC7" />
        <circle cx="56" cy="61" r="6" fill="#FF9EC7" />
        {/* Neck & Face */}
        <rect x="36" y="47" width="8" height="10" rx="4" fill="#E6AB8A" />
        <circle cx="40" cy="36" r="14" fill="#E6AB8A" />
        {/* Espresso Bangs */}
        <path
          d="M26 35C26 24 32 20 40 20C48 20 54 24 54 35C50 28 45 26 40 26C35 26 30 28 26 35Z"
          fill="#3B221E"
        />
        {/* Eyes & Rosy Cheeks */}
        <circle cx="34.5" cy="36" r="2" fill="#24101C" />
        <circle cx="45.5" cy="36" r="2" fill="#24101C" />
        <circle cx="31" cy="40" r="2.6" fill="#FF6FA9" fillOpacity="0.5" />
        <circle cx="49" cy="40" r="2.6" fill="#FF6FA9" fillOpacity="0.5" />
        <path
          d="M36.5 43C38 45 42 45 43.5 43"
          stroke="#B81B5A"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Maya Velvet: Berry-auburn twin braids with gold cuffs + pink headphones + berry athletic hoodie
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="80" height="80" rx="14" fill="#FBE2EE" />
      {/* Twin Berry Braids + Gold Cuffs */}
      <rect x="20" y="34" width="6" height="25" rx="3" fill="#6E1D3F" />
      <rect x="54" y="34" width="6" height="25" rx="3" fill="#6E1D3F" />
      <rect x="20" y="53" width="6" height="3" rx="1" fill="#F6C453" />
      <rect x="54" y="53" width="6" height="3" rx="1" fill="#F6C453" />
      {/* Headphone Band */}
      <path
        d="M22 36C22 23 30 16 40 16C50 16 58 23 58 36"
        stroke="#FF5CA8"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Berry Hoodie */}
      <path d="M18 76C18 61 28 55 40 55C52 55 62 61 62 76H18Z" fill="#C81E68" />
      {/* Gold Crossbody Strap */}
      <line x1="29" y1="57" x2="50" y2="75" stroke="#F6C453" strokeWidth="3" />
      {/* Neck & Face */}
      <rect x="36" y="47" width="8" height="10" rx="4" fill="#8D553A" />
      <circle cx="40" cy="36" r="14" fill="#8D553A" />
      {/* Berry Hair Cap */}
      <path
        d="M26 34C26 24 32 20 40 20C48 20 54 24 54 34C49 28 44 27 40 27C36 27 31 28 26 34Z"
        fill="#6E1D3F"
      />
      {/* Headphone Ear Cups */}
      <rect x="20" y="31" width="6" height="12" rx="3" fill="#FF5CA8" />
      <rect x="54" y="31" width="6" height="12" rx="3" fill="#FF5CA8" />
      {/* Eyes & Smile */}
      <circle cx="34.5" cy="36" r="2" fill="#1E0B14" />
      <circle cx="45.5" cy="36" r="2" fill="#1E0B14" />
      <circle cx="31" cy="40" r="2.6" fill="#FF80B5" fillOpacity="0.45" />
      <circle cx="49" cy="40" r="2.6" fill="#FF80B5" fillOpacity="0.45" />
      <path
        d="M36.5 43.2C38 45.2 42 45.2 43.5 43.2"
        stroke="#FFD1E6"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
