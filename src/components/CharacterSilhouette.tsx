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
        className={`absolute inset-0 rounded-full blur-2xl transition-opacity duration-500 pointer-events-none ${
          selected ? 'opacity-90 scale-110' : 'opacity-0 group-hover:opacity-35 scale-95'
        }`}
        style={{
          background: type === 'Yuji' ? 'radial-gradient(circle, rgba(255,100,0,0.5) 0%, rgba(200,50,0,0) 70%)' :
                      type === 'Gojo' ? 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, rgba(6,182,212,0.25) 50%, rgba(0,0,0,0) 70%)' :
                      type === 'Sukuna' ? 'radial-gradient(circle, rgba(239,68,68,0.7) 0%, rgba(153,27,27,0.35) 50%, rgba(0,0,0,0) 70%)' :
                      type === 'Megumi' ? 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(16,185,129,0.25) 50%, rgba(0,0,0,0) 70%)' :
                      'radial-gradient(circle, rgba(236,72,153,0.6) 0%, rgba(234,179,8,0.35) 50%, rgba(0,0,0,0) 70%)'
        }}
      />

      {/* Anime Stylized Bust Silhouette per character */}
      <div className={`relative z-10 w-full h-full flex items-center justify-center transition-all duration-300 transform -translate-y-3 ${
        selected 
          ? 'scale-105 opacity-100' 
          : 'scale-95 opacity-50 group-hover:opacity-100 group-hover:scale-100'
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

function YujiSilhouette({ selected }: { selected: boolean }) {
  return (
    <svg viewBox="0 0 200 240" className="w-44 h-56 select-none" style={{ filter: selected ? 'drop-shadow(0 0 12px rgba(249, 115, 22, 0.6))' : 'none' }}>
      <defs>
        <linearGradient id="yujiUniformGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="yujiSkinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fae8d8" />
          <stop offset="100%" stopColor="#f3d5be" />
        </linearGradient>
      </defs>

      {/* Cursed Black Flash Sparks */}
      {selected && (
        <g stroke="#ff0055" strokeWidth="2.5" strokeLinecap="round" fill="none" className="animate-pulse">
          <path d="M 28 140 L 52 112 L 44 126 L 76 96 L 68 106 L 96 74" />
          <path d="M 172 140 L 148 112 L 156 126 L 124 96 L 132 106 L 104 74" />
        </g>
      )}

      {/* Shoulders & Torso */}
      <path d="M 32 230 L 42 130 L 78 116 L 122 116 L 158 130 L 168 230 Z" fill="url(#yujiUniformGrad)" />
      
      {/* Red Scarf / Hoodie Collar */}
      <path d="M 60 110 Q 100 138 140 110 Q 154 128 130 144 Q 100 155 70 144 Q 46 128 60 110 Z" fill="#dc2626" />
      <path d="M 72 120 Q 100 142 128 120 L 122 132 Q 100 148 78 132 Z" fill="#991b1b" />

      {/* Solid Athletic Neck */}
      <path d="M 84 92 L 116 92 L 118 122 L 82 122 Z" fill="url(#yujiSkinGrad)" />
      {/* Neck Shadow */}
      <path d="M 84 92 L 116 92 L 116 100 Q 100 106 84 100 Z" fill="#e2ba9f" />

      {/* Human Head Base & Jaw */}
      <path d="M 72 65 C 72 102, 128 102, 128 65 C 128 38, 72 38, 72 65 Z" fill="url(#yujiSkinGrad)" />
      
      {/* Facial Features (Eyes, Eyebrows & Sukuna Scars) */}
      <ellipse cx="86" cy="70" rx="3.5" ry="2.5" fill="#0f172a" />
      <ellipse cx="114" cy="70" rx="3.5" ry="2.5" fill="#0f172a" />
      <circle cx="87" cy="69.5" r="0.8" fill="#ffffff" />
      <circle cx="115" cy="69.5" r="0.8" fill="#ffffff" />
      
      {/* Determined Eyebrows */}
      <path d="M 80 64 L 92 66" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 120 64 L 108 66" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
      
      {/* Under-eye Sukuna slit scars */}
      <line x1="81" y1="76" x2="90" y2="76" stroke="#7f1d1d" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="110" y1="76" x2="119" y2="76" stroke="#7f1d1d" strokeWidth="1.6" strokeLinecap="round" />

      {/* Dark Undercut Hair Base */}
      <path d="M 68 64 Q 100 50 132 64 L 134 54 Q 100 40 66 54 Z" fill="#1e293b" />

      {/* Spiky Salmon-Pink Hair */}
      <path 
        d="M 66 64 L 50 38 L 70 46 L 80 20 L 94 36 L 104 16 L 118 36 L 132 22 L 136 48 L 150 40 L 134 66 Q 100 32 66 64 Z" 
        fill={selected ? "#fb7185" : "#f43f5e"} 
      />
    </svg>
  );
}

function GojoSilhouette({ selected }: { selected: boolean }) {
  return (
    <svg viewBox="0 0 200 240" className="w-44 h-56 select-none" style={{ filter: selected ? 'drop-shadow(0 0 12px rgba(168, 85, 247, 0.6))' : 'none' }}>
      <defs>
        <linearGradient id="gojoCoatGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>
        <linearGradient id="gojoSkinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fae8d8" />
          <stop offset="100%" stopColor="#f3d5be" />
        </linearGradient>
      </defs>

      {/* Limitless Orbit Ring */}
      {selected && (
        <ellipse cx="100" cy="115" rx="84" ry="24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" className="animate-[spin_6s_linear_infinite]" opacity="0.8" />
      )}

      {/* Shoulders & High Collared Coat */}
      <path d="M 40 230 L 48 128 L 74 108 L 126 108 L 152 128 L 160 230 Z" fill="url(#gojoCoatGrad)" />
      
      {/* High Collar & Metallic Zipper */}
      <path d="M 70 108 L 70 88 L 130 88 L 130 108 Z" fill="#18181b" stroke="#4338ca" strokeWidth="2" />
      <circle cx="100" cy="116" r="4" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />

      {/* Solid Neck */}
      <path d="M 86 78 L 114 78 L 114 96 L 86 96 Z" fill="url(#gojoSkinGrad)" />

      {/* Head Base */}
      <path d="M 72 65 C 72 100, 128 100, 128 65 C 128 35, 72 35, 72 65 Z" fill="url(#gojoSkinGrad)" />

      {/* Iconic Black Blindfold with Glowing Edge */}
      <rect x="66" y="55" width="68" height="20" rx="3" fill="#09090b" />
      <line x1="66" y1="65" x2="134" y2="65" stroke="#38bdf8" strokeWidth="2.5" opacity="0.9" />

      {/* Spiky Pure White Hair */}
      <path 
        d="M 62 58 L 46 28 L 68 40 L 78 10 L 94 30 L 106 8 L 120 30 L 136 16 L 134 46 L 148 33 L 134 63 Q 100 28 62 58 Z" 
        fill="#ffffff" 
        stroke="#cbd5e1"
        strokeWidth="1"
      />
    </svg>
  );
}

function SukunaSilhouette({ selected }: { selected: boolean }) {
  return (
    <svg viewBox="0 0 200 240" className="w-44 h-56 select-none" style={{ filter: selected ? 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.7))' : 'none' }}>
      <defs>
        <linearGradient id="sukunaKimonoGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="60%" stopColor="#fee2e2" />
          <stop offset="100%" stopColor="#881337" />
        </linearGradient>
        <linearGradient id="sukunaSkinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fae8d8" />
          <stop offset="100%" stopColor="#f3d5be" />
        </linearGradient>
      </defs>

      {/* Malevolent Cleave Lines */}
      {selected && (
        <g stroke="#ef4444" strokeWidth="2" strokeDasharray="8 4" className="animate-pulse" opacity="0.8">
          <line x1="12" y1="36" x2="188" y2="204" />
          <line x1="188" y1="46" x2="12" y2="194" />
        </g>
      )}

      {/* Massive Buff Torso & Kimono */}
      <path d="M 22 230 L 32 122 L 76 104 L 124 104 L 168 122 L 178 230 Z" fill="url(#sukunaKimonoGrad)" />
      
      {/* Deep Muscular V-neck Chest with Solid Skin */}
      <path d="M 70 106 L 100 178 L 130 106 Z" fill="url(#sukunaSkinGrad)" />
      
      {/* Pectoral Tattoos */}
      <circle cx="100" cy="142" r="9" fill="none" stroke="#000000" strokeWidth="2.5" />
      <line x1="82" y1="134" x2="118" y2="134" stroke="#000000" strokeWidth="2.5" />
      <line x1="86" y1="148" x2="114" y2="148" stroke="#000000" strokeWidth="2" opacity="0.8" />

      {/* Thick Neck & Tattoos */}
      <path d="M 78 90 L 122 90 L 124 118 L 76 118 Z" fill="url(#sukunaSkinGrad)" />
      <line x1="82" y1="102" x2="118" y2="102" stroke="#000000" strokeWidth="2.5" />

      {/* Head Base */}
      <path d="M 70 65 C 70 100, 130 100, 130 65 C 130 35, 70 35, 70 65 Z" fill="url(#sukunaSkinGrad)" />

      {/* 4 Glowing Red Eyes */}
      <circle cx="84" cy="62" r="3.5" fill="#ef4444" />
      <circle cx="84" cy="71" r="2.5" fill="#ef4444" />
      <circle cx="116" cy="62" r="3.5" fill="#ef4444" />
      <circle cx="116" cy="71" r="2.5" fill="#ef4444" />

      {/* Face Cursed Tattoos */}
      <path d="M 78 52 L 122 52 M 82 78 L 118 78 M 100 52 L 100 80" stroke="#000000" strokeWidth="1.8" />

      {/* Swept-Back Spiky Pink Hair */}
      <path 
        d="M 64 58 L 48 33 L 70 42 L 82 13 L 96 30 L 106 13 L 118 36 L 134 20 L 132 50 L 146 38 L 132 62 Q 100 28 64 58 Z" 
        fill="#fb7185" 
      />
    </svg>
  );
}

function MegumiSilhouette({ selected }: { selected: boolean }) {
  return (
    <svg viewBox="0 0 200 240" className="w-44 h-56 select-none" style={{ filter: selected ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.6))' : 'none' }}>
      <defs>
        <linearGradient id="megumiUniformGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="megumiSkinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fae8d8" />
          <stop offset="100%" stopColor="#f3d5be" />
        </linearGradient>
      </defs>

      {/* Ten Shadows Aura Ring */}
      {selected && (
        <circle cx="100" cy="115" r="75" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="10 5" className="animate-spin" opacity="0.6" />
      )}

      {/* Shoulders & Jujutsu Uniform */}
      <path d="M 42 230 L 52 128 L 78 112 L 122 112 L 148 128 L 158 230 Z" fill="url(#megumiUniformGrad)" />
      
      {/* High Collared Jacket & Gold Button Accents */}
      <path d="M 76 112 L 76 92 L 124 92 L 124 112 Z" fill="#090d16" stroke="#1d4ed8" strokeWidth="1.5" />
      <circle cx="100" cy="102" r="3" fill="#facc15" />
      <circle cx="100" cy="122" r="3" fill="#facc15" />

      {/* Solid Neck */}
      <path d="M 86 78 L 114 78 L 114 96 L 86 96 Z" fill="url(#megumiSkinGrad)" />

      {/* Head Base */}
      <path d="M 72 65 C 72 100, 128 100, 128 65 C 128 35, 72 35, 72 65 Z" fill="url(#megumiSkinGrad)" />
      <ellipse cx="86" cy="68" rx="3.5" ry="2" fill="#0f172a" />
      <ellipse cx="114" cy="68" rx="3.5" ry="2" fill="#0f172a" />

      {/* Wild Spiky Dark Hair */}
      <path 
        d="M 62 60 L 42 30 L 66 43 L 76 8 L 90 32 L 104 3 L 118 32 L 136 10 L 134 46 L 150 30 L 134 64 Q 100 26 62 60 Z" 
        fill="#090d16" 
        stroke="#2563eb"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function HakariSilhouette({ selected }: { selected: boolean }) {
  return (
    <svg viewBox="0 0 200 240" className="w-44 h-56 select-none" style={{ filter: selected ? 'drop-shadow(0 0 12px rgba(236, 72, 153, 0.6))' : 'none' }}>
      <defs>
        <linearGradient id="hakariJacketGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#831843" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
        <linearGradient id="hakariSkinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fae8d8" />
          <stop offset="100%" stopColor="#f3d5be" />
        </linearGradient>
      </defs>

      {/* Jackpot 777 Floating Aura */}
      {selected && (
        <g className="animate-bounce font-mono font-black text-sm">
          <text x="24" y="58" fill="#facc15">7</text>
          <text x="94" y="38" fill="#ec4899">7</text>
          <text x="164" y="58" fill="#38bdf8">7</text>
        </g>
      )}

      {/* Broad Buff Shoulders & Open Jacket */}
      <path d="M 26 230 L 36 124 L 76 110 L 124 110 L 164 124 L 174 230 Z" fill="url(#hakariJacketGrad)" />
      
      {/* Broad White Undershirt */}
      <path d="M 74 112 L 100 176 L 126 112 Z" fill="#ffffff" />

      {/* Solid Neck & Gold Chain */}
      <path d="M 82 92 L 118 92 L 118 120 L 82 120 Z" fill="url(#hakariSkinGrad)" />
      <path d="M 82 108 Q 100 124 118 108" stroke="#facc15" strokeWidth="2.5" fill="none" />

      {/* Head Base */}
      <path d="M 70 65 C 70 100, 130 100, 130 65 C 130 35, 70 35, 70 65 Z" fill="url(#hakariSkinGrad)" />

      {/* Stylish Dark Sunglasses with Pink Tint Flare */}
      <rect x="72" y="56" width="56" height="15" rx="3" fill="#18181b" />
      <circle cx="85" cy="63" r="4" fill="#ec4899" />
      <circle cx="115" cy="63" r="4" fill="#ec4899" />

      {/* Styled Blonde Hair */}
      <path 
        d="M 64 58 L 52 33 L 72 42 L 84 16 L 98 30 L 112 16 L 124 42 L 142 33 L 132 60 Q 100 28 64 58 Z" 
        fill="#facc15" 
      />
    </svg>
  );
}
