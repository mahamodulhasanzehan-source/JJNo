import React from 'react';
import { CharacterType } from '../game/Types';

interface SilhouetteProps {
  type: CharacterType;
  selected: boolean;
  glowColor: string;
}

export default function CharacterSilhouette({ type, selected, glowColor }: SilhouetteProps) {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Background radial aura glow */}
      <div 
        className={`absolute inset-0 rounded-full blur-2xl transition-opacity duration-500 ${
          selected ? 'opacity-90 scale-110' : 'opacity-0 group-hover:opacity-40 scale-100'
        }`}
        style={{
          background: type === 'Yuji' ? 'radial-gradient(circle, rgba(255,100,0,0.6) 0%, rgba(200,0,0,0) 70%)' :
                      type === 'Gojo' ? 'radial-gradient(circle, rgba(168,85,247,0.7) 0%, rgba(6,182,212,0.3) 50%, rgba(0,0,0,0) 70%)' :
                      type === 'Sukuna' ? 'radial-gradient(circle, rgba(239,68,68,0.8) 0%, rgba(153,27,27,0.4) 50%, rgba(0,0,0,0) 70%)' :
                      type === 'Megumi' ? 'radial-gradient(circle, rgba(59,130,246,0.7) 0%, rgba(16,185,129,0.3) 50%, rgba(0,0,0,0) 70%)' :
                      'radial-gradient(circle, rgba(236,72,153,0.7) 0%, rgba(234,179,8,0.4) 50%, rgba(0,0,0,0) 70%)'
        }}
      />

      {/* Consistent SVG Bust Silhouette per character */}
      <div className={`relative z-10 w-full h-full flex items-center justify-center transition-all duration-500 transform -translate-y-4 ${
        selected 
          ? 'scale-105 brightness-100 grayscale-0 opacity-100 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
          : 'scale-95 brightness-[0.3] grayscale opacity-40 group-hover:brightness-90 group-hover:grayscale-0 group-hover:opacity-90 group-hover:scale-100'
      }`}>
        {type === 'Yuji' && <YujiSilhouette selected={selected} />}
        {type === 'Gojo' && <GojoSilhouette selected={selected} />}
        {type === 'Sukuna' && <SukunaSilhouette selected={selected} />}
        {type === 'Megumi' && <MegumiSilhouette selected={selected} />}
        {type === 'Hakari' && <HakariSilhouette selected={selected} />}
      </div>
    </div>
  );
}

// Common Humanoid Base Dimensions in SVG (ViewBox 0 0 200 240)
// Head Center: cx=100, cy=70, rx=32, ry=40
// Neck: x=88..112, y=105..125
// Shoulders: x=40..160, y=125..230

function YujiSilhouette({ selected }: { selected: boolean }) {
  return (
    <svg viewBox="0 0 200 240" className="w-44 h-56 drop-shadow-[0_0_15px_rgba(255,100,0,0.6)]">
      <defs>
        <linearGradient id="yujiUniform" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Black Flash Lightning Spark on select */}
      {selected && (
        <path d="M 30 140 L 60 110 L 50 125 L 85 95 L 75 105 L 110 70" stroke="#ff0055" strokeWidth="3" fill="none" className="animate-pulse" />
      )}

      {/* Broad Athletic Shoulders & Torso (Jujutsu Uniform) */}
      <path d="M 35 230 L 45 130 L 80 118 L 120 118 L 155 130 L 165 230 Z" fill="url(#yujiUniform)" />
      
      {/* Red Scarf / Hoodie Collar wrapped around neck */}
      <path d="M 64 112 Q 100 138 136 112 Q 150 128 128 142 Q 100 152 72 142 Q 50 128 64 112 Z" fill="#dc2626" />
      <path d="M 76 122 Q 100 142 124 122 L 118 133 Q 100 148 82 133 Z" fill="#991b1b" />

      {/* Solid Athletic Neck */}
      <path d="M 85 95 L 115 95 L 117 122 L 83 122 Z" fill="#fed7aa" />

      {/* Human Head & Chin */}
      <path d="M 72 68 C 72 104, 128 104, 128 68 C 128 40, 72 40, 72 68 Z" fill="#ffe4d6" />
      
      {/* Facial Features (Eyes & Scars) */}
      <ellipse cx="86" cy="72" rx="4" ry="2.5" fill="#0f172a" />
      <ellipse cx="114" cy="72" rx="4" ry="2.5" fill="#0f172a" />
      <circle cx="87" cy="71" r="1" fill="#ffffff" />
      <circle cx="115" cy="71" r="1" fill="#ffffff" />
      
      {/* Under-eye Sukuna slit scar lines */}
      <line x1="82" y1="78" x2="90" y2="78" stroke="#7f1d1d" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="110" y1="78" x2="118" y2="78" stroke="#7f1d1d" strokeWidth="1.5" strokeLinecap="round" />

      {/* Dark Undercut Hair Base */}
      <path d="M 70 65 Q 100 52 130 65 L 132 55 Q 100 42 68 55 Z" fill="#1e293b" />

      {/* Spiky Salmon-Pink Hair */}
      <path 
        d="M 66 65 L 52 40 L 72 48 L 82 22 L 95 38 L 105 18 L 118 38 L 132 25 L 135 50 L 148 42 L 134 68 Q 100 35 66 65 Z" 
        fill={selected ? "#fb7185" : "#f43f5e"} 
      />
    </svg>
  );
}

function GojoSilhouette({ selected }: { selected: boolean }) {
  return (
    <svg viewBox="0 0 200 240" className="w-44 h-56 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]">
      <defs>
        <linearGradient id="gojoCoat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>
      </defs>

      {/* Limitless Infinity Aura Ring */}
      <ellipse cx="100" cy="120" rx="80" ry="25" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" className="animate-[spin_8s_linear_infinite]" opacity="0.6" />

      {/* Shoulders & High Collared Coat */}
      <path d="M 45 230 L 52 130 L 75 110 L 125 110 L 148 130 L 155 230 Z" fill="url(#gojoCoat)" />
      
      {/* High Collar detail & Zipper/Button */}
      <path d="M 72 110 L 72 90 L 128 90 L 128 110 Z" fill="#18181b" stroke="#4338ca" strokeWidth="2" />
      <circle cx="100" cy="118" r="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />

      {/* Neck */}
      <path d="M 88 80 L 112 80 L 112 95 L 88 95 Z" fill="#ffe4d6" />

      {/* Head & Jaw */}
      <path d="M 72 65 C 72 100, 128 100, 128 65 C 128 35, 72 35, 72 65 Z" fill="#fff1ea" />

      {/* Iconic Black Blindfold */}
      <rect x="68" y="56" width="64" height="20" rx="3" fill="#09090b" />
      <line x1="68" y1="66" x2="132" y2="66" stroke="#38bdf8" strokeWidth="2" opacity="0.8" />

      {/* Spiky Pure White Hair */}
      <path 
        d="M 64 60 L 48 30 L 70 42 L 80 12 L 96 32 L 108 10 L 122 32 L 138 18 L 136 48 L 150 35 L 136 65 Q 100 30 64 60 Z" 
        fill="#ffffff" 
      />
    </svg>
  );
}

function SukunaSilhouette({ selected }: { selected: boolean }) {
  return (
    <svg viewBox="0 0 200 240" className="w-44 h-56 drop-shadow-[0_0_15px_rgba(239,68,68,0.7)]">
      <defs>
        <linearGradient id="sukunaKimono" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef2f2" />
          <stop offset="60%" stopColor="#fee2e2" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
      </defs>

      {/* Malevolent Cleave lines */}
      {selected && (
        <g stroke="#ef4444" strokeWidth="2" opacity="0.8">
          <line x1="10" y1="40" x2="190" y2="200" strokeDasharray="8 4" className="animate-pulse" />
          <line x1="190" y1="50" x2="10" y2="190" strokeDasharray="12 4" className="animate-pulse" />
        </g>
      )}

      {/* Massive Buff Shoulders, Traps & Torso */}
      <path d="M 20 230 L 32 122 L 76 104 L 124 104 L 168 122 L 180 230 Z" fill="url(#sukunaKimono)" />
      
      {/* Deep Muscular V-neck open chest revealing tattoos */}
      <path d="M 72 108 L 100 176 L 128 108 Z" fill="#ffe4d6" />
      {/* Pectoral Muscle Definition & Tattoo markings */}
      <circle cx="100" cy="142" r="9" fill="none" stroke="#000000" strokeWidth="2" />
      <line x1="82" y1="135" x2="118" y2="135" stroke="#000000" strokeWidth="2" />
      <line x1="86" y1="148" x2="114" y2="148" stroke="#000000" strokeWidth="1.5" opacity="0.6" />

      {/* Thick Muscular Neck & Tattoos */}
      <path d="M 80 92 L 120 92 L 122 118 L 78 118 Z" fill="#ffe4d6" />
      <line x1="84" y1="102" x2="116" y2="102" stroke="#000" strokeWidth="2.5" />

      {/* Head */}
      <path d="M 72 65 C 72 100, 128 100, 128 65 C 128 35, 72 35, 72 65 Z" fill="#ffe4d6" />

      {/* 4 Glowing Red Eyes */}
      <circle cx="84" cy="62" r="3.5" fill="#ef4444" />
      <circle cx="84" cy="71" r="2.5" fill="#ef4444" />
      <circle cx="116" cy="62" r="3.5" fill="#ef4444" />
      <circle cx="116" cy="71" r="2.5" fill="#ef4444" />

      {/* Face Tattoo Markings */}
      <path d="M 80 54 L 120 54 M 84 78 L 116 78 M 100 54 L 100 80" stroke="#000000" strokeWidth="1.5" />

      {/* Swept-Back Spiky Pink Hair */}
      <path 
        d="M 66 60 L 50 35 L 72 44 L 84 15 L 98 32 L 108 15 L 120 38 L 136 22 L 134 52 L 148 40 L 134 64 Q 100 30 66 60 Z" 
        fill="#fb7185" 
      />
    </svg>
  );
}

function MegumiSilhouette({ selected }: { selected: boolean }) {
  return (
    <svg viewBox="0 0 200 240" className="w-44 h-56 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]">
      <defs>
        <linearGradient id="megumiUniform" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
      </defs>

      {/* Ten Shadows Aura */}
      {selected && (
        <circle cx="100" cy="120" r="70" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="10 5" className="animate-spin" opacity="0.5" />
      )}

      {/* Shoulders & Jujutsu High Uniform */}
      <path d="M 45 230 L 55 130 L 80 115 L 120 115 L 145 130 L 155 230 Z" fill="url(#megumiUniform)" />
      
      {/* High Collared Jacket & Gold Buttons */}
      <path d="M 78 115 L 78 95 L 122 95 L 122 115 Z" fill="#090d16" stroke="#1d4ed8" strokeWidth="1.5" />
      <circle cx="100" cy="105" r="3" fill="#facc15" />
      <circle cx="100" cy="125" r="3" fill="#facc15" />

      {/* Neck */}
      <path d="M 88 80 L 112 80 L 112 98 L 88 98 Z" fill="#ffe4d6" />

      {/* Head & Face */}
      <path d="M 72 65 C 72 100, 128 100, 128 65 C 128 35, 72 35, 72 65 Z" fill="#fff1ea" />
      <ellipse cx="86" cy="68" rx="4" ry="2" fill="#0f172a" />
      <ellipse cx="114" cy="68" rx="4" ry="2" fill="#0f172a" />

      {/* Messy Wild Spiky Dark Blue/Black Hair */}
      <path 
        d="M 64 62 L 44 32 L 68 45 L 78 10 L 92 34 L 106 5 L 120 34 L 138 12 L 136 48 L 152 32 L 136 66 Q 100 28 64 62 Z" 
        fill="#090d16" 
        stroke="#2563eb"
        strokeWidth="1"
      />
    </svg>
  );
}

function HakariSilhouette({ selected }: { selected: boolean }) {
  return (
    <svg viewBox="0 0 200 240" className="w-44 h-56 drop-shadow-[0_0_15px_rgba(236,72,153,0.6)]">
      <defs>
        <linearGradient id="hakariJacket" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#831843" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
      </defs>

      {/* Jackpot 777 floating numbers */}
      {selected && (
        <g className="animate-bounce font-mono font-bold text-xs">
          <text x="25" y="60" fill="#facc15">7</text>
          <text x="95" y="40" fill="#ec4899">7</text>
          <text x="165" y="60" fill="#38bdf8">7</text>
        </g>
      )}

      {/* Broad Buff Shoulders & Open Jacket */}
      <path d="M 28 230 L 38 126 L 78 112 L 122 112 L 162 126 L 172 230 Z" fill="url(#hakariJacket)" />
      
      {/* Broad White undershirt / chest */}
      <path d="M 76 114 L 100 178 L 124 114 Z" fill="#ffffff" />

      {/* Thick Neck & Gold Chain */}
      <path d="M 84 94 L 116 94 L 116 122 L 84 122 Z" fill="#fed7aa" />
      <path d="M 84 110 Q 100 126 116 110" stroke="#facc15" strokeWidth="2.5" fill="none" />

      {/* Head */}
      <path d="M 72 65 C 72 100, 128 100, 128 65 C 128 35, 72 35, 72 65 Z" fill="#ffe4d6" />

      {/* Stylish Dark Sunglasses */}
      <rect x="74" y="58" width="52" height="14" rx="3" fill="#18181b" />
      <circle cx="86" cy="65" r="4" fill="#ec4899" />
      <circle cx="114" cy="65" r="4" fill="#ec4899" />

      {/* Styled Blonde Hair */}
      <path 
        d="M 66 60 L 54 35 L 74 44 L 86 18 L 100 32 L 114 18 L 126 44 L 144 35 L 134 62 Q 100 30 66 60 Z" 
        fill="#facc15" 
      />
    </svg>
  );
}
