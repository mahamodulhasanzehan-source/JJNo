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
  return (
    <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start pointer-events-none z-10 selection:bg-transparent">
      {/* Player Stats */}
      <div className="w-[400px] flex flex-col gap-3">
        <div className="flex justify-between items-end mb-1">
          <span className="text-4xl font-black text-white hover:text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] tracking-tighter italic">YOU</span>
          <span className="text-xl font-mono font-bold text-gray-200 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
            {Math.max(0, Math.floor(gameState.playerHp))} / 200
          </span>
        </div>
        
        {/* Futuristic Skewed HP Bar */}
        <div className="w-full h-8 bg-black/60 border border-white/20 p-1 -skew-x-12 backdrop-blur-md relative overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.8)]">
          <div className="absolute inset-0 bg-red-950/40" />
          <div 
            className="h-full bg-gradient-to-r from-red-600 to-red-400 relative transition-all duration-150 ease-linear shadow-[0_0_20px_rgba(255,0,0,0.8)]"
            style={{ width: `${Math.max(0, Math.min(100, (gameState.playerHp / 200) * 100))}%` }}
          >
            <div className="absolute top-0 left-0 w-full h-1/3 bg-white/30" />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-grow flex flex-col gap-1 -skew-x-12">
            <span className="text-xs text-blue-300 font-mono tracking-widest pl-2">CURSED ENERGY</span>
            <div className="w-full h-4 bg-black/60 border border-blue-900/50 p-0.5 relative overflow-hidden backdrop-blur-md">
              <div 
                className="h-full bg-gradient-to-r from-blue-700 to-cyan-400 transition-all duration-75 relative shadow-[0_0_15px_rgba(0,150,255,0.5)]"
                style={{ width: `${Math.max(0, Math.min(100, (gameState.playerEnergy / ENERGY_MAX) * 100))}%` }}
              >
                 <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]" />
              </div>
            </div>
          </div>

          <div className="flex-grow flex flex-col gap-1 -skew-x-12">
            <span className="text-xs text-green-300 font-mono tracking-widest pl-2">STAMINA</span>
            <div className="w-full h-4 bg-black/60 border border-green-900/50 p-0.5 relative overflow-hidden backdrop-blur-md">
              <div 
                className="h-full bg-gradient-to-r from-green-700 to-emerald-400 transition-all duration-100 relative shadow-[0_0_15px_rgba(0,255,100,0.5)]"
                style={{ width: `${Math.max(0, Math.min(100, (gameState.playerStamina / STAMINA_MAX) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Domain Indicator */}
      {gameState.domainActive && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center flex flex-col items-center">
          <motion.div 
            initial={{ scale: 2, opacity: 0, filter: 'blur(10px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 tracking-[0.2em] uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]"
          >
            DOMAIN EXPANSION
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mt-2 tracking-widest uppercase drop-shadow-[0_0_15px_rgba(255,0,255,0.5)]"
          >
            {gameState.domainType === 'Gojo' ? 'Unlimited Void' : 
             gameState.domainType === 'Sukuna' ? 'Malevolent Shrine' : 
             gameState.domainType === 'Megumi' ? 'Shadow Garden' : 
             gameState.domainType === 'Yuji' ? 'Cursed Womb' : 'Benevolent Boxing'}
          </motion.div>
          <div className="text-2xl font-mono font-bold text-white mt-4 bg-black/50 px-6 py-2 rounded-full border border-white/30 backdrop-blur-sm">
            {(gameState.domainTimer / 1000).toFixed(1)}s
          </div>
        </div>
      )}

      {/* Enemy Stats */}
      <div className="w-[400px] flex flex-col gap-3">
        <div className="flex justify-between items-end mb-1 flex-row-reverse">
          <span className="text-4xl font-black text-red-500 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] tracking-tighter italic">ENEMY</span>
          <span className="text-xl font-mono font-bold text-gray-200 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
            {Math.max(0, Math.floor(gameState.enemyHp))} / 200
          </span>
        </div>
        
        {/* Futuristic Skewed HP Bar (Reversed) */}
        <div className="w-full h-8 bg-black/60 border border-white/20 p-1 skew-x-12 backdrop-blur-md relative overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.8)]">
          <div className="absolute inset-0 bg-red-950/40" />
          <div className="w-full h-full flex justify-end">
            <div 
              className="h-full bg-gradient-to-l from-red-600 to-orange-500 relative transition-all duration-150 ease-linear shadow-[0_0_20px_rgba(255,50,0,0.8)]"
              style={{ width: `${Math.max(0, Math.min(100, (gameState.enemyHp / 200) * 100))}%` }}
            >
              <div className="absolute top-0 left-0 w-full h-1/3 bg-white/30" />
            </div>
          </div>
        </div>

        <div className="flex gap-4 flex-row-reverse">
          <div className="flex-grow flex flex-col gap-1 flex-row-reverse skew-x-12">
            <span className="text-xs text-blue-300 font-mono tracking-widest text-right pr-2">CURSED ENERGY</span>
            <div className="w-full h-4 bg-black/60 border border-blue-900/50 p-0.5 relative overflow-hidden backdrop-blur-md">
              <div className="w-full h-full flex justify-end">
                <div 
                  className="h-full bg-gradient-to-l from-blue-700 to-indigo-400 transition-all duration-75 relative shadow-[0_0_15px_rgba(0,50,255,0.5)]"
                  style={{ width: `${Math.max(0, Math.min(100, (gameState.enemyEnergy / ENERGY_MAX) * 100))}%` }}
                >
                   <div className="absolute inset-0 bg-[linear-gradient(-45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-grow flex flex-col gap-1 flex-row-reverse skew-x-12">
            <span className="text-xs text-green-300 font-mono tracking-widest text-right pr-2">STAMINA</span>
            <div className="w-full h-4 bg-black/60 border border-green-900/50 p-0.5 relative overflow-hidden backdrop-blur-md">
              <div className="w-full h-full flex justify-end">
                <div 
                  className="h-full bg-gradient-to-l from-green-700 to-emerald-400 transition-all duration-100 relative shadow-[0_0_15px_rgba(0,255,100,0.5)]"
                  style={{ width: `${Math.max(0, Math.min(100, (gameState.enemyStamina / STAMINA_MAX) * 100))}%` }}
                />
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
