import React from 'react';
import { motion } from 'motion/react';
import { CharacterType } from '../game/Types';
import { STAMINA_MAX, ENERGY_MAX } from '../game/Constants';

interface HUDProps {
  gameState: {
    playerHp: number; playerEnergy: number; playerStamina: number;
    enemyHp: number; enemyEnergy: number; enemyStamina: number;
    domainActive: boolean; domainType: CharacterType | null; domainTimer: number;
    gameOver: boolean; winner: 'player' | 'abonant' | null;
  };
}

export function HUD({ gameState }: HUDProps) {
  const playerHpPct = Math.max(0, Math.min(100, (gameState.playerHp / 200) * 100));
  const enemyHpPct = Math.max(0, Math.min(100, (gameState.enemyHp / 200) * 100));
  
  const playerEnergyPct = Math.max(0, Math.min(100, (gameState.playerEnergy / ENERGY_MAX) * 100));
  const enemyEnergyPct = Math.max(0, Math.min(100, (gameState.enemyEnergy / ENERGY_MAX) * 100));

  const playerStaminaPct = Math.max(0, Math.min(100, (gameState.playerStamina / STAMINA_MAX) * 100));
  const enemyStaminaPct = Math.max(0, Math.min(100, (gameState.enemyStamina / STAMINA_MAX) * 100));

  return (
    <div className="absolute top-0 left-0 w-full p-4 md:p-8 flex justify-between items-start pointer-events-none z-30 selection:bg-transparent">
      {/* Player Stats */}
      <div className="w-[320px] md:w-[420px] flex flex-col gap-2">
        <div className="flex justify-between items-end mb-1">
          <div className="flex items-center gap-2">
            <span className="text-3xl md:text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.9)] tracking-tighter italic">YOU</span>
            <span className="text-xs px-2 py-0.5 bg-red-600/30 border border-red-500/50 text-red-300 font-mono font-bold rounded -skew-x-12">VESSEL</span>
          </div>
          <div className="flex items-baseline gap-1 font-mono font-bold text-gray-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
            <span className="text-xl md:text-2xl text-white">{Math.max(0, Math.floor(gameState.playerHp))}</span>
            <span className="text-xs md:text-sm text-zinc-400">/ 200</span>
          </div>
        </div>
        
        {/* Futuristic Skewed HP Bar */}
        <div className="w-full h-7 md:h-9 bg-zinc-950/90 border-2 border-red-500/40 p-1 -skew-x-12 backdrop-blur-xl relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.9)] rounded-sm">
          {/* Background grid track */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,0,0,0.08)_1px,transparent_1px)] bg-[size:10%_100%]" />
          {/* Fill bar */}
          <div 
            className="h-full bg-red-600 relative transition-all duration-150 ease-out shadow-[0_0_25px_rgba(239,68,68,1)] rounded-xs"
            style={{ 
              width: `${playerHpPct}%`,
              backgroundColor: '#dc2626',
              backgroundImage: 'linear-gradient(90deg, #dc2626 0%, #f43f5e 50%, #f59e0b 100%)'
            }}
          >
            <div className="absolute top-0 left-0 w-full h-2/5 bg-white/40" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_80%,rgba(255,255,255,0.6)_100%)]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-1">
          {/* Cursed Energy */}
          <div className="flex flex-col gap-1 -skew-x-12">
            <div className="flex justify-between items-center text-[10px] md:text-xs text-cyan-300 font-mono tracking-widest px-1 font-bold">
              <span>CURSED ENERGY</span>
              <span className="text-cyan-200">{Math.floor(gameState.playerEnergy)} CE</span>
            </div>
            <div className="w-full h-3 md:h-4 bg-zinc-950/90 border border-cyan-500/50 p-0.5 relative overflow-hidden backdrop-blur-md rounded-xs">
              <div 
                className="h-full bg-cyan-500 transition-all duration-75 relative shadow-[0_0_15px_rgba(6,182,212,0.9)]"
                style={{ 
                  width: `${playerEnergyPct}%`,
                  backgroundColor: '#06b6d4',
                  backgroundImage: 'linear-gradient(90deg, #2563eb 0%, #06b6d4 60%, #38bdf8 100%)'
                }}
              >
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/40" />
              </div>
            </div>
          </div>

          {/* Stamina */}
          <div className="flex flex-col gap-1 -skew-x-12">
            <div className="flex justify-between items-center text-[10px] md:text-xs text-emerald-300 font-mono tracking-widest px-1 font-bold">
              <span>STAMINA</span>
              <span className={playerStaminaPct <= 5 ? "text-amber-400 animate-pulse font-bold" : "text-emerald-200"}>
                {playerStaminaPct <= 5 ? "RECOVERING" : `${Math.floor((gameState.playerStamina / STAMINA_MAX) * 100)}%`}
              </span>
            </div>
            <div className="w-full h-3 md:h-4 bg-zinc-950/90 border border-emerald-500/50 p-0.5 relative overflow-hidden backdrop-blur-md rounded-xs">
              <div 
                className={`h-full transition-all duration-100 relative shadow-[0_0_15px_rgba(34,197,94,0.9)] ${
                  playerStaminaPct <= 5 ? "bg-amber-600 animate-pulse" : "bg-emerald-500"
                }`}
                style={{ 
                  width: `${playerStaminaPct}%`,
                  backgroundColor: playerStaminaPct <= 5 ? '#d97706' : '#10b981',
                  backgroundImage: playerStaminaPct <= 5 
                    ? 'linear-gradient(90deg, #d97706 0%, #ef4444 100%)' 
                    : 'linear-gradient(90deg, #059669 0%, #22c55e 60%, #a3e635 100%)'
                }}
              >
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/40" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Indicator */}
      {gameState.domainActive && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center flex flex-col items-center z-40">
          <motion.div 
            initial={{ scale: 2, opacity: 0, filter: 'blur(10px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-gray-400 tracking-[0.2em] uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.9)] italic"
          >
            DOMAIN EXPANSION
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mt-1 tracking-widest uppercase drop-shadow-[0_0_20px_rgba(255,0,255,0.8)] italic"
          >
            {gameState.domainType === 'Gojo' ? 'Unlimited Void' : 
             gameState.domainType === 'Sukuna' ? 'Malevolent Shrine' : 
             gameState.domainType === 'Megumi' ? 'Shadow Garden' : 
             gameState.domainType === 'Hakari' ? 'Idle Death Gamble' : 'Cursed Domain'}
          </motion.div>
          <div className="text-xl md:text-2xl font-mono font-bold text-red-400 mt-3 bg-zinc-950/90 px-6 py-1.5 rounded-full border border-red-500/50 backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.5)]">
            {(gameState.domainTimer / 1000).toFixed(1)}s REMAINING
          </div>
        </div>
      )}

      {/* Enemy Stats */}
      <div className="w-[320px] md:w-[420px] flex flex-col gap-2">
        <div className="flex justify-between items-end mb-1 flex-row-reverse">
          <div className="flex items-center gap-2 flex-row-reverse">
            <span className="text-3xl md:text-5xl font-black text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.9)] tracking-tighter italic">ENEMY</span>
            <span className="text-xs px-2 py-0.5 bg-purple-600/30 border border-purple-500/50 text-purple-300 font-mono font-bold rounded skew-x-12">CURSE</span>
          </div>
          <div className="flex items-baseline gap-1 font-mono font-bold text-gray-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
            <span className="text-xl md:text-2xl text-white">{Math.max(0, Math.floor(gameState.enemyHp))}</span>
            <span className="text-xs md:text-sm text-zinc-400">/ 200</span>
          </div>
        </div>
        
        {/* Futuristic Skewed HP Bar (Reversed) */}
        <div className="w-full h-7 md:h-9 bg-zinc-950/90 border-2 border-red-500/40 p-1 skew-x-12 backdrop-blur-xl relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.9)] rounded-sm">
          {/* Background grid track */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,0,0,0.08)_1px,transparent_1px)] bg-[size:10%_100%]" />
          <div className="w-full h-full flex justify-end">
            <div 
              className="h-full bg-red-600 relative transition-all duration-150 ease-out shadow-[0_0_25px_rgba(239,68,68,1)] rounded-xs"
              style={{ 
                width: `${enemyHpPct}%`,
                backgroundColor: '#dc2626',
                backgroundImage: 'linear-gradient(270deg, #dc2626 0%, #ea580c 50%, #f59e0b 100%)'
              }}
            >
              <div className="absolute top-0 left-0 w-full h-2/5 bg-white/40" />
              <div className="absolute inset-0 bg-[linear-gradient(-90deg,transparent_80%,rgba(255,255,255,0.6)_100%)]" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-1 flex-row-reverse">
          {/* Cursed Energy */}
          <div className="flex flex-col gap-1 skew-x-12">
            <div className="flex justify-between items-center text-[10px] md:text-xs text-blue-300 font-mono tracking-widest px-1 font-bold flex-row-reverse">
              <span>CURSED ENERGY</span>
              <span className="text-blue-200">{Math.floor(gameState.enemyEnergy)} CE</span>
            </div>
            <div className="w-full h-3 md:h-4 bg-zinc-950/90 border border-blue-500/50 p-0.5 relative overflow-hidden backdrop-blur-md rounded-xs">
              <div className="w-full h-full flex justify-end">
                <div 
                  className="h-full bg-blue-600 transition-all duration-75 relative shadow-[0_0_15px_rgba(59,130,246,0.9)]"
                  style={{ 
                    width: `${enemyEnergyPct}%`,
                    backgroundColor: '#2563eb',
                    backgroundImage: 'linear-gradient(270deg, #2563eb 0%, #6366f1 60%, #38bdf8 100%)'
                  }}
                >
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-white/40" />
                </div>
              </div>
            </div>
          </div>

          {/* Stamina */}
          <div className="flex flex-col gap-1 skew-x-12">
            <div className="flex justify-between items-center text-[10px] md:text-xs text-emerald-300 font-mono tracking-widest px-1 font-bold flex-row-reverse">
              <span>STAMINA</span>
              <span className={enemyStaminaPct <= 5 ? "text-amber-400 animate-pulse font-bold" : "text-emerald-200"}>
                {enemyStaminaPct <= 5 ? "RECOVERING" : `${Math.floor((gameState.enemyStamina / STAMINA_MAX) * 100)}%`}
              </span>
            </div>
            <div className="w-full h-3 md:h-4 bg-zinc-950/90 border border-emerald-500/50 p-0.5 relative overflow-hidden backdrop-blur-md rounded-xs">
              <div className="w-full h-full flex justify-end">
                <div 
                  className={`h-full transition-all duration-100 relative shadow-[0_0_15px_rgba(34,197,94,0.9)] ${
                    enemyStaminaPct <= 5 ? "bg-amber-600 animate-pulse" : "bg-emerald-500"
                  }`}
                  style={{ 
                    width: `${enemyStaminaPct}%`,
                    backgroundColor: enemyStaminaPct <= 5 ? '#d97706' : '#10b981',
                    backgroundImage: enemyStaminaPct <= 5 
                      ? 'linear-gradient(270deg, #d97706 0%, #ef4444 100%)' 
                      : 'linear-gradient(270deg, #059669 0%, #22c55e 60%, #a3e635 100%)'
                  }}
                >
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-white/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EndGameScreenProps {
  winner: 'player' | 'abonant' | null;
  playerCharacter?: CharacterType;
  enemyCharacter?: CharacterType;
  onRestart: () => void;
}

function getEndGameText(winner: 'player' | 'abonant', playerChar?: CharacterType, enemyChar?: CharacterType): string {
  if (!playerChar || !enemyChar) return winner === 'player' ? "PURIFIED" : "CONSUMED";
  
  const winnerChar = winner === 'player' ? playerChar : enemyChar;
  const loserChar = winner === 'player' ? enemyChar : playerChar;

  if (winnerChar === 'Sukuna' && loserChar === 'Yuji') return "KNOW YOUR PLACE, BRAT";
  if (winnerChar === 'Sukuna' && loserChar === 'Gojo') return "YOU WERE ORDINARY";
  if (winnerChar === 'Gojo' && loserChar === 'Sukuna') return "I TOLD YOU I'D WIN";
  if (winnerChar === 'Yuji' && loserChar === 'Sukuna') return "I'M YOU, SUKUNA";
  
  if (winnerChar === 'Gojo' && loserChar === 'Yuji') return "NOT BAD FOR A STUDENT";
  if (winnerChar === 'Yuji' && loserChar === 'Gojo') return "I SURPASSED YOU, SENSEI";

  if (winnerChar === 'Yuji' && loserChar === 'Yuji') return "THERE CAN BE ONLY ONE";
  if (winnerChar === 'Gojo' && loserChar === 'Gojo') return "I AM THE STRONGEST";
  if (winnerChar === 'Sukuna' && loserChar === 'Sukuna') return "TWO KINGS? UNACCEPTABLE";

  if (winnerChar === 'Yuji' && loserChar === 'Megumi') return "GOOD SPAR, FUSHIGURO!";
  if (winnerChar === 'Megumi' && loserChar === 'Yuji') return "DON'T BE SO RECKLESS, ITADORI.";

  if (winnerChar === 'Gojo' && loserChar === 'Megumi') return "STILL HOLDING BACK, MEGUMI?";
  if (winnerChar === 'Megumi' && loserChar === 'Gojo') return "I CAN HANDLE MYSELF NOW.";

  if (winnerChar === 'Sukuna' && loserChar === 'Megumi') return "WHAT A WASTE OF POTENTIAL.";
  if (winnerChar === 'Megumi' && loserChar === 'Sukuna') return "I'LL EXORCISE YOU MYSELF.";

  if (winnerChar === 'Megumi' && loserChar === 'Megumi') {
    return winner === 'player' ? "I AM THE TRUE HEIR." : "YOU LACK RESOLVE.";
  }

  return winner === 'player' ? "PURIFIED" : "CONSUMED";
}

export function EndGameScreen({ winner, playerCharacter, enemyCharacter, onRestart }: EndGameScreenProps) {
  if (!winner) return null;
  
  const text = getEndGameText(winner, playerCharacter, enemyCharacter);
  
  return (
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-[2000ms] ${winner === 'player' ? 'bg-black/60' : 'bg-black/95'}`}>
      
      {/* Background intensity */}
      {winner === 'player' ? (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15)_0%,transparent_70%)] animate-pulse" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,0,0,0.15)_0%,transparent_70%)] animate-pulse" />
      )}

      <h1 className={`relative z-10 flex gap-1 text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter mb-12 text-center flex-wrap justify-center px-4 italic ${winner === 'player' ? 'text-white' : 'text-red-600'}`}>
        {/* Background Glitch Offset */}
        <span className="absolute inset-0 flex gap-1 flex-wrap justify-center opacity-50 blur-[2px] -translate-x-1 translate-y-1 text-cyan-500 pointer-events-none mix-blend-screen" aria-hidden="true">
          {text}
        </span>
        <span className="absolute inset-0 flex gap-1 flex-wrap justify-center opacity-50 blur-[2px] translate-x-1 -translate-y-1 text-red-500 pointer-events-none mix-blend-screen" aria-hidden="true">
          {text}
        </span>
        
        {winner === 'player' ? (
          text.split('').map((char, i) => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 500 + Math.random() * 500;
            return (
              <motion.span
                key={i}
                initial={{ opacity: 0, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, rotate: (Math.random() - 0.5) * 180, scale: 0, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
                transition={{ duration: 0.8, type: 'spring', bounce: 0.4, delay: i * 0.05 }}
                className="inline-block relative z-20 drop-shadow-[0_0_20px_rgba(255,255,255,1)]"
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            );
          })
        ) : (
          text.split('').map((char, i) => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 500 + Math.random() * 500;
            return (
              <motion.span
                key={i}
                initial={{ opacity: 0, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, rotate: (Math.random() - 0.5) * 180, scale: 0, filter: 'blur(15px) brightness(200%)', color: '#fbbf24', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, filter: 'blur(0px) brightness(100%)', color: '#dc2626', clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
                transition={{ duration: 1.2, delay: i * 0.05, ease: "easeOut" }}
                className="inline-block relative z-20 drop-shadow-[0_0_30px_rgba(255,0,0,1)]"
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            );
          })
        )}
      </h1>
      <motion.button 
        initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ delay: 1.5, duration: 0.8, type: 'spring' }}
        onClick={onRestart}
        className="group relative px-16 py-6 bg-transparent overflow-hidden"
      >
        <div className="absolute inset-0 bg-white skew-x-[-15deg] group-hover:scale-110 transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]" />
        <span className="relative z-10 text-black font-black text-3xl uppercase tracking-[0.2em] italic group-hover:text-red-600 transition-colors duration-300">
          REINCARNATE
        </span>
      </motion.button>
    </div>
  );
}
