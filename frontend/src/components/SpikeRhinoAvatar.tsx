import React from 'react';

export type RhinoState = 'neutral' | 'excited' | 'thinking' | 'socratic' | 'shocked' | 'celebrating';

interface SpikeRhinoAvatarProps {
  outfit?: string; // e.g. "EEE_HIGH_VOLTAGE", "CSE_HACKER", etc.
  state?: RhinoState;
  size?: number;
  className?: string;
  animate?: boolean;
}

export const SpikeRhinoAvatar: React.FC<SpikeRhinoAvatarProps> = ({
  outfit = 'EEE_HIGH_VOLTAGE',
  state = 'neutral',
  size = 120,
  className = '',
  animate = true,
}) => {
  // Normalize outfit code
  const code = (outfit || 'EEE_HIGH_VOLTAGE').toUpperCase();

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className} ${animate ? 'transition-transform duration-300 hover:scale-105' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible filter drop-shadow-sm"
      >
        <defs>
          <radialGradient id="rhinoSkin" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="60%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#64748B" />
          </radialGradient>
          <linearGradient id="hornGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="mechaMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="quantumGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>

        {/* 1. RHINO BODY & LEGS */}
        <g id="body">
          {/* Shadow */}
          <ellipse cx="100" cy="188" rx="55" ry="10" fill="#000000" fillOpacity="0.12" />

          {/* Feet / Boots */}
          {code === 'EEE_HIGH_VOLTAGE' ? (
            // High Voltage Yellow Arc Boots
            <g id="eee-boots">
              <rect x="68" y="155" width="24" height="28" rx="7" fill="#FACC15" stroke="#CA8A04" strokeWidth="2.5" />
              <rect x="108" y="155" width="24" height="28" rx="7" fill="#FACC15" stroke="#CA8A04" strokeWidth="2.5" />
              <path d="M78 163L73 171H81L76 179" stroke="#713F12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M118 163L113 171H121L116 179" stroke="#713F12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ) : (
            // Chunky Sturdy Rhino Feet
            <g id="natural-feet">
              <rect x="68" y="158" width="24" height="24" rx="8" fill="#64748B" />
              <rect x="108" y="158" width="24" height="24" rx="8" fill="#64748B" />
              <ellipse cx="74" cy="178" rx="3" ry="2" fill="#E2E8F0" />
              <ellipse cx="80" cy="178" rx="3" ry="2" fill="#E2E8F0" />
              <ellipse cx="86" cy="178" rx="3" ry="2" fill="#E2E8F0" />
              <ellipse cx="114" cy="178" rx="3" ry="2" fill="#E2E8F0" />
              <ellipse cx="120" cy="178" rx="3" ry="2" fill="#E2E8F0" />
              <ellipse cx="126" cy="178" rx="3" ry="2" fill="#E2E8F0" />
            </g>
          )}

          {/* Torso */}
          <rect x="58" y="95" width="84" height="68" rx="32" fill="url(#rhinoSkin)" stroke="#475569" strokeWidth="3" />
          <ellipse cx="100" cy="128" rx="28" ry="24" fill="#E2E8F0" fillOpacity="0.4" />
        </g>

        {/* 2. OUTFIT TORSO LAYER */}
        {code === 'CSE_HACKER' && (
          // Dark Violet Hoodie with Terminal Pocket
          <g id="outfit-cse-hacker">
            <path d="M58 108C58 98 72 94 100 94C128 94 142 98 142 108V155C142 160 137 164 130 164H70C63 164 58 160 58 155V108Z" fill="#7C3AED" stroke="#5B21B6" strokeWidth="2.5" />
            <rect x="78" y="125" width="44" height="24" rx="6" fill="#6D28D9" stroke="#4C1D95" strokeWidth="1.5" />
            <path d="M84 133L88 137L84 141" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
            <line x1="92" y1="141" x2="98" y2="141" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {code === 'ECE_TECH' && (
          // Hardware Vest with Multimeter Badge
          <g id="outfit-ece-tech">
            <path d="M60 108C60 98 74 94 100 94C126 94 140 98 140 108V156H60V108Z" fill="#D97706" stroke="#92400E" strokeWidth="2.5" />
            <rect x="68" y="116" width="22" height="28" rx="4" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
            <circle cx="79" cy="126" r="5" fill="#18181B" />
            {/* ESD Wristband on Left Arm */}
            <rect x="44" y="132" width="16" height="8" rx="3" fill="#10B981" stroke="#047857" strokeWidth="1.5" />
          </g>
        )}

        {code === 'EEE_HIGH_VOLTAGE' && (
          // Electric Utility Vest
          <g id="outfit-eee-hv">
            <path d="M60 106C60 98 74 94 100 94C126 94 140 98 140 106V156H60V106Z" fill="#EA580C" stroke="#9A3412" strokeWidth="2.5" />
            <rect x="60" y="130" width="80" height="12" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
            <path d="M98 108L92 120H103L97 132" stroke="#FEF08A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}

        {code === 'TAMIL_TRADITIONAL' && (
          // Traditional Veshti with Gold Zari Border
          <g id="outfit-tamil-veshti">
            <path d="M60 106C60 98 74 94 100 94C126 94 140 98 140 106V142H60V106Z" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="2" />
            <path d="M58 140H142V166C142 170 137 174 130 174H70C63 174 58 170 58 166V140Z" fill="#FAFAFA" stroke="#D1D5DB" strokeWidth="2" />
            <rect x="58" y="162" width="84" height="6" fill="#F59E0B" />
            <line x1="58" y1="164" x2="142" y2="164" stroke="#D97706" strokeWidth="1" />
          </g>
        )}

        {code === 'KIMONO_MASTER' && (
          // Samurai Haori
          <g id="outfit-kimono">
            <path d="M58 102C58 96 74 94 100 94C126 94 142 96 142 102V160H58V102Z" fill="#1E3A8A" stroke="#172554" strokeWidth="2" />
            <path d="M78 96L100 135L122 96" stroke="#93C5FD" strokeWidth="3" />
            <rect x="74" y="138" width="52" height="12" fill="#DC2626" />
          </g>
        )}

        {code === 'WESTERN_COWBOY' && (
          // Leather Ranger Vest
          <g id="outfit-cowboy">
            <path d="M60 106C60 98 74 94 100 94C126 94 140 98 140 106V156H60V106Z" fill="#78350F" stroke="#451A03" strokeWidth="2.5" />
            <polygon points="100,122 103,129 110,129 104,133 106,140 100,136 94,140 96,133 90,129 97,129" fill="#F59E0B" />
          </g>
        )}

        {code === 'QUANTUM_CROWN' && (
          // Quantum Plasma Cape
          <g id="outfit-quantum-cape">
            <path d="M52 108L38 162C38 162 48 166 60 160L56 120" fill="url(#quantumGlow)" fillOpacity="0.8" />
            <path d="M148 108L162 162C162 162 152 166 140 160L144 120" fill="url(#quantumGlow)" fillOpacity="0.8" />
          </g>
        )}

        {code === 'MECHA_BOSS_SLAYER' && (
          // Heavy Titanium Exoskeleton Plate
          <g id="outfit-mecha">
            <rect x="62" y="104" width="76" height="56" rx="14" fill="url(#mechaMetal)" stroke="#38BDF8" strokeWidth="2.5" />
            <circle cx="100" cy="132" r="10" fill="#0284C7" stroke="#38BDF8" strokeWidth="2" />
            <circle cx="100" cy="132" r="4" fill="#38BDF8" />
          </g>
        )}

        {/* 3. ARMS / HANDS */}
        <g id="arms">
          {state === 'celebrating' ? (
            // Arms raised triumphantly
            <>
              <path d="M60 114C45 92 34 82 28 88C22 94 36 112 52 126" fill="url(#rhinoSkin)" stroke="#475569" strokeWidth="3" />
              <circle cx="27" cy="86" r="8" fill="#64748B" />
              <path d="M140 114C155 92 166 82 172 88C178 94 164 112 148 126" fill="url(#rhinoSkin)" stroke="#475569" strokeWidth="3" />
              <circle cx="173" cy="86" r="8" fill="#64748B" />
            </>
          ) : state === 'socratic' || state === 'thinking' ? (
            // Hand on chin / gesturing
            <>
              <path d="M60 120C46 130 42 142 46 148C50 154 58 144 64 136" fill="url(#rhinoSkin)" stroke="#475569" strokeWidth="3" />
              <path d="M140 122C146 128 132 140 118 132" fill="url(#rhinoSkin)" stroke="#475569" strokeWidth="3" />
              <circle cx="116" cy="130" r="7" fill="#64748B" />
            </>
          ) : (
            // Natural relaxed arms
            <>
              <ellipse cx="50" cy="130" rx="10" ry="18" fill="url(#rhinoSkin)" stroke="#475569" strokeWidth="2.5" transform="rotate(15 50 130)" />
              <ellipse cx="150" cy="130" rx="10" ry="18" fill="url(#rhinoSkin)" stroke="#475569" strokeWidth="2.5" transform="rotate(-15 150 130)" />
            </>
          )}
        </g>

        {/* 4. RHINO HEAD & EARS */}
        <g id="head">
          {/* Ears */}
          <ellipse cx="64" cy="46" rx="9" ry="14" fill="url(#rhinoSkin)" stroke="#475569" strokeWidth="2" transform="rotate(-25 64 46)" />
          <ellipse cx="64" cy="46" rx="4" ry="8" fill="#F472B6" transform="rotate(-25 64 46)" />
          <ellipse cx="136" cy="46" rx="9" ry="14" fill="url(#rhinoSkin)" stroke="#475569" strokeWidth="2" transform="rotate(25 136 46)" />
          <ellipse cx="136" cy="46" rx="4" ry="8" fill="#F472B6" transform="rotate(25 136 46)" />

          {/* Head Base */}
          <ellipse cx="100" cy="68" rx="42" ry="36" fill="url(#rhinoSkin)" stroke="#475569" strokeWidth="3" />

          {/* Friendly Snout */}
          <path d="M76 68C76 62 86 58 100 58C114 58 124 62 124 68C124 86 116 98 100 98C84 98 76 86 76 68Z" fill="#E2E8F0" stroke="#475569" strokeWidth="2.5" />
          <ellipse cx="92" cy="85" rx="3.5" ry="4.5" fill="#475569" />
          <ellipse cx="108" cy="85" rx="3.5" ry="4.5" fill="#475569" />

          {/* SIGNATURE GOLDEN RHINO HORN */}
          <path d="M96 66C96 52 98 42 100 36C102 42 104 52 104 66Z" fill="url(#hornGrad)" stroke="#B45309" strokeWidth="2" />
          {/* Secondary mini horn */}
          <path d="M98 74C98 70 99 67 100 65C101 67 102 70 102 74Z" fill="url(#hornGrad)" stroke="#B45309" strokeWidth="1.5" />

          {/* FACIAL EXPRESSIONS & EYES */}
          {state === 'shocked' ? (
            // Shocked / Electrified wide eyes
            <>
              <circle cx="82" cy="58" r="9" fill="#FFFFFF" stroke="#18181B" strokeWidth="2" />
              <circle cx="82" cy="58" r="3" fill="#18181B" />
              <circle cx="118" cy="58" r="9" fill="#FFFFFF" stroke="#18181B" strokeWidth="2" />
              <circle cx="118" cy="58" r="3" fill="#18181B" />
              <ellipse cx="100" cy="92" rx="7" ry="5" fill="#18181B" />
            </>
          ) : state === 'celebrating' || state === 'excited' ? (
            // Joyful curved happy eye arcs
            <>
              <path d="M75 58C77 52 87 52 89 58" stroke="#18181B" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M111 58C113 52 123 52 125 58" stroke="#18181B" strokeWidth="3.5" strokeLinecap="round" />
              {/* Joyful grin */}
              <path d="M90 88C95 95 105 95 110 88" stroke="#18181B" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : state === 'socratic' ? (
            // Inquisitive winking / arched eyebrow
            <>
              <path d="M75 57C78 51 86 51 89 57" stroke="#18181B" strokeWidth="3" strokeLinecap="round" />
              <path d="M74 48C78 44 86 44 90 48" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="118" cy="56" r="7" fill="#18181B" />
              <circle cx="120" cy="54" r="2.5" fill="#FFFFFF" />
              <path d="M112 46C116 43 124 43 128 46" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" />
              {/* Confident smile */}
              <path d="M94 88C98 92 106 91 108 87" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : (
            // Friendly Neutral Eyes
            <>
              <circle cx="82" cy="56" r="7" fill="#18181B" />
              <circle cx="84" cy="54" r="2.5" fill="#FFFFFF" />
              <circle cx="118" cy="56" r="7" fill="#18181B" />
              <circle cx="120" cy="54" r="2.5" fill="#FFFFFF" />
              <path d="M92 88C96 92 104 92 108 88" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
        </g>

        {/* 5. HEADWEAR OUTFIT LAYERS */}
        {code === 'EEE_HIGH_VOLTAGE' && (
          // High-Voltage Yellow Hardhat with Lightning Emblem
          <g id="eee-hardhat">
            <path d="M64 42C64 22 80 14 100 14C120 14 136 22 136 42H64Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="2.5" />
            <rect x="58" y="38" width="84" height="7" rx="3.5" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
            <path d="M101 20L96 28H104L99 36" stroke="#713F12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}

        {code === 'CSE_HACKER' && (
          // Neon Terminal Cyber Glasses
          <g id="cse-glasses">
            <rect x="70" y="48" width="24" height="15" rx="4" fill="#09090B" stroke="#A855F7" strokeWidth="2.5" />
            <rect x="106" y="48" width="24" height="15" rx="4" fill="#09090B" stroke="#A855F7" strokeWidth="2.5" />
            <line x1="94" y1="55" x2="106" y2="55" stroke="#A855F7" strokeWidth="2.5" />
            {/* Terminal Green Reflection lines */}
            <line x1="74" y1="53" x2="84" y2="53" stroke="#22C55E" strokeWidth="1.5" />
            <line x1="110" y1="53" x2="120" y2="53" stroke="#22C55E" strokeWidth="1.5" />
          </g>
        )}

        {code === 'WESTERN_COWBOY' && (
          // Tan Stetson Ranger Hat
          <g id="cowboy-hat">
            <ellipse cx="100" cy="36" rx="48" ry="10" fill="#B45309" stroke="#78350F" strokeWidth="2.5" />
            <path d="M78 36C78 18 88 12 100 12C112 12 122 18 122 36H78Z" fill="#92400E" stroke="#78350F" strokeWidth="2" />
          </g>
        )}

        {code === 'QUANTUM_CROWN' && (
          // Glowing Quantum Plasma Crown
          <g id="quantum-crown">
            <path d="M72 34L80 18L92 28L100 14L108 28L120 18L128 34H72Z" fill="url(#quantumGlow)" stroke="#F3EEFF" strokeWidth="2" />
            <circle cx="100" cy="14" r="3.5" fill="#FDE047" />
            <circle cx="80" cy="18" r="2.5" fill="#FDE047" />
            <circle cx="120" cy="18" r="2.5" fill="#FDE047" />
          </g>
        )}

        {code === 'MECHA_BOSS_SLAYER' && (
          // Heavy Mecha Visor & Helmet
          <g id="mecha-helmet">
            <path d="M64 40C64 20 80 14 100 14C120 14 136 20 136 40H64Z" fill="url(#mechaMetal)" stroke="#0284C7" strokeWidth="2" />
            <path d="M74 48H126V58H74V48Z" rx="4" fill="#0EA5E9" fillOpacity="0.8" stroke="#38BDF8" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  );
};
