import React from 'react';

export type RhinoState = 'neutral' | 'excited' | 'thinking' | 'socratic' | 'shocked' | 'celebrating';

interface SpikeRhinoAvatarProps {
  outfit?: string; // e.g. "SAFARI_EXPLORER", "EEE_HIGH_VOLTAGE", "CSE_HACKER", etc.
  state?: RhinoState;
  size?: number;
  className?: string;
  animate?: boolean;
}

export const SpikeRhinoAvatar: React.FC<SpikeRhinoAvatarProps> = ({
  outfit = 'SAFARI_EXPLORER',
  state = 'neutral',
  size = 120,
  className = '',
  animate = true,
}) => {
  // Normalize outfit code
  const code = (outfit || 'SAFARI_EXPLORER').toUpperCase();

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className} ${
        animate ? 'transition-transform duration-300 hover:scale-105 active:scale-95' : ''
      }`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible filter drop-shadow-md"
      >
        <defs>
          {/* 3D Shading Gradients */}
          <radialGradient id="rhinoSkin3D" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="85%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#475569" />
          </radialGradient>
          <linearGradient id="hornGrad3D" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="30%" stopColor="#FDE047" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="safariPithGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="60%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="yellowVestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>
          <linearGradient id="mudBootsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="70%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#9A3412" />
          </linearGradient>
          <radialGradient id="eyePupilGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="60%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0F172A" />
          </radialGradient>
        </defs>

        {/* 1. GROUND SHADOW */}
        <ellipse cx="100" cy="188" rx="58" ry="11" fill="#0F172A" fillOpacity="0.25" />

        {/* 2. LEGS & MUD BOOTS */}
        <g id="legs-and-boots">
          {/* Tiny Rubber Mud Boots (Goofy 3D) */}
          <rect x="66" y="152" width="26" height="30" rx="8" fill="url(#mudBootsGrad)" stroke="#7C2D12" strokeWidth="2.5" />
          <rect x="108" y="152" width="26" height="30" rx="8" fill="url(#mudBootsGrad)" stroke="#7C2D12" strokeWidth="2.5" />
          {/* Mud Splashes on Boots */}
          <path d="M68 174C72 170 76 172 80 170C84 172 88 171 90 174V180H68V174Z" fill="#78350F" fillOpacity="0.7" />
          <path d="M110 174C114 170 118 172 122 170C126 172 130 171 132 174V180H110V174Z" fill="#78350F" fillOpacity="0.7" />
          {/* Boot Soles */}
          <rect x="64" y="178" width="30" height="6" rx="3" fill="#451A03" />
          <rect x="106" y="178" width="30" height="6" rx="3" fill="#451A03" />
        </g>

        {/* 3. CHUNKY ROUND TORSO */}
        <rect x="56" y="94" width="88" height="72" rx="36" fill="url(#rhinoSkin3D)" stroke="#334155" strokeWidth="3" />
        {/* Soft Tummy Patch */}
        <ellipse cx="100" cy="130" rx="30" ry="25" fill="#E2E8F0" fillOpacity="0.45" />

        {/* 4. SAFARI EXPLORER VEST (BRIGHT YELLOW 3D WITH POCKETS) */}
        {(code === 'SAFARI_EXPLORER' || code === 'EEE_HIGH_VOLTAGE' || code === 'DEFAULT') ? (
          <g id="safari-explorer-vest">
            {/* Main Vest Body */}
            <path
              d="M58 106C58 96 74 92 100 92C126 92 142 96 142 106V156H58V106Z"
              fill="url(#yellowVestGrad)"
              stroke="#A16207"
              strokeWidth="2.5"
            />
            {/* Vest Collar V-Neck Opening */}
            <polygon points="100,126 84,92 116,92" fill="#E2E8F0" stroke="#CA8A04" strokeWidth="2" />
            {/* Center Zipper Line */}
            <line x1="100" y1="126" x2="100" y2="156" stroke="#854D0E" strokeWidth="2.5" strokeDasharray="3 2" />
            {/* Brass Snap Buttons */}
            <circle cx="100" cy="132" r="3" fill="#FEF08A" stroke="#713F12" strokeWidth="1" />
            <circle cx="100" cy="144" r="3" fill="#FEF08A" stroke="#713F12" strokeWidth="1" />
            {/* Left Safari Utility Pocket */}
            <rect x="66" y="128" width="18" height="18" rx="4" fill="#EAB308" stroke="#854D0E" strokeWidth="1.5" />
            <line x1="66" y1="132" x2="84" y2="132" stroke="#854D0E" strokeWidth="1.5" />
            {/* Right Safari Utility Pocket with Mini Brass Compass */}
            <rect x="116" y="128" width="18" height="18" rx="4" fill="#EAB308" stroke="#854D0E" strokeWidth="1.5" />
            <circle cx="125" cy="137" r="5" fill="#F8FAFC" stroke="#854D0E" strokeWidth="1" />
            <path d="M125 133L127 137L125 141L123 137Z" fill="#DC2626" />
          </g>
        ) : code === 'CSE_HACKER' ? (
          // Dark Violet Hacker Hoodie
          <g id="outfit-cse-hacker">
            <path d="M58 106C58 96 74 92 100 92C126 92 142 96 142 106V156H58V106Z" fill="#7C3AED" stroke="#4C1D95" strokeWidth="2.5" />
            <rect x="76" y="126" width="48" height="22" rx="6" fill="#6D28D9" stroke="#4C1D95" strokeWidth="1.5" />
            <path d="M84 133L89 137L84 141" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
          </g>
        ) : code === 'ECE_TECH' ? (
          // Hardware Vest with ESD band
          <g id="outfit-ece-tech">
            <path d="M58 106C58 96 74 92 100 92C126 92 142 96 142 106V156H58V106Z" fill="#D97706" stroke="#92400E" strokeWidth="2.5" />
            <circle cx="78" cy="126" r="6" fill="#18181B" />
          </g>
        ) : null}

        {/* 5. ARMS & HANDS */}
        <g id="arms">
          {state === 'celebrating' ? (
            // Both hands raised with goofy triumph
            <>
              <path d="M58 112C42 88 32 78 24 86C16 94 32 114 48 128" fill="url(#rhinoSkin3D)" stroke="#334155" strokeWidth="3" />
              <circle cx="23" cy="84" r="9" fill="#64748B" />
              <path d="M142 112C158 88 168 78 176 86C184 94 168 114 152 128" fill="url(#rhinoSkin3D)" stroke="#334155" strokeWidth="3" />
              <circle cx="177" cy="84" r="9" fill="#64748B" />
            </>
          ) : state === 'socratic' || state === 'thinking' ? (
            // Paw resting on chin inquisitively
            <>
              <path d="M58 118C44 128 40 140 44 148C48 156 58 144 66 134" fill="url(#rhinoSkin3D)" stroke="#334155" strokeWidth="3" />
              <path d="M142 120C148 126 134 142 118 132" fill="url(#rhinoSkin3D)" stroke="#334155" strokeWidth="3" />
              <circle cx="116" cy="130" r="8" fill="#64748B" />
            </>
          ) : (
            // Goofy relaxed stubby paws
            <>
              <ellipse cx="48" cy="128" rx="11" ry="19" fill="url(#rhinoSkin3D)" stroke="#334155" strokeWidth="2.5" transform="rotate(16 48 128)" />
              <ellipse cx="152" cy="128" rx="11" ry="19" fill="url(#rhinoSkin3D)" stroke="#334155" strokeWidth="2.5" transform="rotate(-16 152 128)" />
            </>
          )}
        </g>

        {/* 6. BIG EXPRESSIVE HEAD */}
        <g id="head">
          {/* Ears */}
          <ellipse cx="62" cy="44" rx="10" ry="15" fill="url(#rhinoSkin3D)" stroke="#334155" strokeWidth="2" transform="rotate(-25 62 44)" />
          <ellipse cx="62" cy="44" rx="5" ry="9" fill="#F472B6" transform="rotate(-25 62 44)" />
          <ellipse cx="138" cy="44" rx="10" ry="15" fill="url(#rhinoSkin3D)" stroke="#334155" strokeWidth="2" transform="rotate(25 138 44)" />
          <ellipse cx="138" cy="44" rx="5" ry="9" fill="#F472B6" transform="rotate(25 138 44)" />

          {/* Main Round Head Sphere */}
          <ellipse cx="100" cy="68" rx="44" ry="38" fill="url(#rhinoSkin3D)" stroke="#334155" strokeWidth="3" />

          {/* Goofy Round Snout */}
          <path
            d="M74 68C74 60 86 56 100 56C114 56 126 60 126 68C126 88 116 100 100 100C84 100 74 88 74 68Z"
            fill="#E2E8F0"
            stroke="#334155"
            strokeWidth="2.5"
          />
          {/* Cute Nostrils */}
          <ellipse cx="91" cy="87" rx="4" ry="5.5" fill="#475569" />
          <ellipse cx="109" cy="87" rx="4" ry="5.5" fill="#475569" />

          {/* SIGNATURE 3D GOLDEN RHINO HORN */}
          <path
            d="M95 68C95 50 98 38 100 32C102 38 105 50 105 68Z"
            fill="url(#hornGrad3D)"
            stroke="#92400E"
            strokeWidth="2.5"
          />
          {/* Mini Cute Secondary Horn */}
          <path d="M97 76C97 71 98 67 100 65C102 67 103 71 103 76Z" fill="url(#hornGrad3D)" stroke="#92400E" strokeWidth="1.5" />

          {/* GOOFY CARTOON 3D EYES */}
          {state === 'shocked' ? (
            // Shocked Bug-Eyes
            <>
              <circle cx="80" cy="56" r="11" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
              <circle cx="80" cy="56" r="4.5" fill="url(#eyePupilGrad)" />
              <circle cx="78" cy="54" r="2" fill="#FFFFFF" />
              <circle cx="120" cy="56" r="11" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
              <circle cx="120" cy="56" r="4.5" fill="url(#eyePupilGrad)" />
              <circle cx="118" cy="54" r="2" fill="#FFFFFF" />
              {/* Shocked O-Mouth */}
              <ellipse cx="100" cy="94" rx="7" ry="5.5" fill="#0F172A" />
            </>
          ) : state === 'celebrating' || state === 'excited' ? (
            // Happy Joyful Arcs & Big Grin
            <>
              <path d="M72 58C75 48 87 48 90 58" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
              <path d="M110 58C113 48 125 48 128 58" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
              {/* Cheerful Blushing Cheeks */}
              <circle cx="68" cy="72" r="6" fill="#F43F5E" fillOpacity="0.4" />
              <circle cx="132" cy="72" r="6" fill="#F43F5E" fillOpacity="0.4" />
              {/* Goofy Wide Open Grin */}
              <path d="M88 88C94 98 106 98 112 88C112 88 100 95 88 88Z" fill="#DC2626" stroke="#7F1D1D" strokeWidth="2" strokeLinejoin="round" />
            </>
          ) : state === 'socratic' ? (
            // One Eyebrow Raised, Inquisitive Winking Expression
            <>
              <path d="M72 46C78 40 86 40 90 46" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="81" cy="56" r="8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
              <circle cx="82" cy="55" r="4" fill="url(#eyePupilGrad)" />
              <circle cx="80" cy="53" r="1.5" fill="#FFFFFF" />
              <path d="M110 58C114 54 124 54 128 58" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
              {/* Socratic Smirk */}
              <path d="M94 88C100 92 108 90 110 86" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            // Goofy Friendly Cartoon Eyes
            <>
              <circle cx="80" cy="56" r="9" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
              <circle cx="81" cy="55" r="4.5" fill="url(#eyePupilGrad)" />
              <circle cx="79" cy="53" r="2" fill="#FFFFFF" />
              <circle cx="120" cy="56" r="9" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
              <circle cx="121" cy="55" r="4.5" fill="url(#eyePupilGrad)" />
              <circle cx="119" cy="53" r="2" fill="#FFFFFF" />
              {/* Friendly Smirk */}
              <path d="M92 88C96 92 104 92 108 88" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            </>
          )}
        </g>

        {/* 7. LEAFY SAFARI PITH HELMET (CANONICAL HEADWEAR) */}
        {(code === 'SAFARI_EXPLORER' || code === 'DEFAULT' || code === 'EEE_HIGH_VOLTAGE') && (
          <g id="leafy-safari-pith-helmet">
            {/* Wide Helmet Brim */}
            <ellipse cx="100" cy="38" rx="52" ry="12" fill="url(#safariPithGrad)" stroke="#B45309" strokeWidth="2.5" />
            {/* Dome of Pith Helmet */}
            <path
              d="M62 38C62 16 78 8 100 8C122 8 138 16 138 38H62Z"
              fill="url(#safariPithGrad)"
              stroke="#B45309"
              strokeWidth="2.5"
            />
            {/* Leather Band with Brass Buckle */}
            <path d="M62 35C74 39 126 39 138 35V39C126 43 74 43 62 39V35Z" fill="#78350F" />
            <rect x="96" y="34" width="8" height="6" rx="1.5" fill="#FEF08A" stroke="#713F12" strokeWidth="1" />
            {/* Organic Cartoon Jungle Leaves Tucked into Band */}
            {/* Left Leaf */}
            <path
              d="M72 34C66 24 58 24 56 30C54 36 64 36 72 34Z"
              fill="#22C55E"
              stroke="#15803D"
              strokeWidth="1.5"
            />
            <line x1="64" y1="31" x2="72" y2="34" stroke="#15803D" strokeWidth="1" />
            {/* Right Leaf */}
            <path
              d="M76 34C74 22 84 18 88 24C92 30 84 34 76 34Z"
              fill="#16A34A"
              stroke="#14532D"
              strokeWidth="1.5"
            />
            <line x1="80" y1="28" x2="76" y2="34" stroke="#14532D" strokeWidth="1" />
          </g>
        )}
      </svg>
    </div>
  );
};
