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
    <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-10">
      {/* Player Stats */}
      <div className="w-1/3">
        <div className="flex justify-between text-white font-bold mb-1">
          <span>YOU</span>
          <span>{Math.max(0, Math.floor(gameState.playerHp))} / 200 HP</span>
        </div>
        <div className="h-6 bg-red-950/50 border-2 border-red-900 rounded-sm overflow-hidden mb-2">
          <div 
            className="h-full bg-red-500 transition-all duration-200 ease-out"
            style={{ width: `${(Math.max(0, gameState.playerHp) / 200) * 100}%` }}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="h-3 bg-blue-950/50 border border-blue-900 rounded-sm overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-200 ease-out"
                style={{ width: `${(gameState.playerEnergy / ENERGY_MAX) * 100}%` }}
              />
            </div>
            <div className="text-blue-300 text-xs mt-1 font-mono">CE: {Math.floor(gameState.playerEnergy)}</div>
          </div>
          <div className="flex-1">
            <div className="h-3 bg-green-950/50 border border-green-900 rounded-sm overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-100 ease-out"
                style={{ width: `${(gameState.playerStamina / STAMINA_MAX) * 100}%` }}
              />
            </div>
            <div className="text-green-300 text-xs mt-1 font-mono">STAMINA</div>
          </div>
        </div>
      </div>

      {/* Domain Indicator */}
      {gameState.domainActive && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
          <div className="text-3xl font-black text-white tracking-widest uppercase animate-pulse drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
            Domain Expansion
          </div>
          <div className="text-xl font-bold text-gray-300 mt-1">
            {gameState.domainType === 'Gojo' ? 'Unlimited Void' : 
             gameState.domainType === 'Sukuna' ? 'Malevolent Shrine' : 'Benevolent Boxing Ring'}
          </div>
          <div className="text-lg font-mono text-white mt-2">
            {(gameState.domainTimer / 1000).toFixed(1)}s
          </div>
        </div>
      )}

      {/* Enemy Stats */}
      <div className="w-1/3 text-right">
        <div className="flex justify-between text-white font-bold mb-1 flex-row-reverse">
          <span>ABONANT</span>
          <span>{Math.max(0, Math.floor(gameState.enemyHp))} / 200 HP</span>
        </div>
        <div className="h-6 bg-red-950/50 border-2 border-red-900 rounded-sm overflow-hidden mb-2">
          <div 
            className="h-full bg-red-600 transition-all duration-200 ease-out float-right"
            style={{ width: `${(Math.max(0, gameState.enemyHp) / 200) * 100}%` }}
          />
        </div>
        <div className="flex gap-2 flex-row-reverse">
          <div className="flex-1">
            <div className="h-3 bg-blue-950/50 border border-blue-900 rounded-sm overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-200 ease-out float-right"
                style={{ width: `${(gameState.enemyEnergy / ENERGY_MAX) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="h-3 bg-green-950/50 border border-green-900 rounded-sm overflow-hidden">
              <div 
                className="h-full bg-green-600 transition-all duration-100 ease-out float-right"
                style={{ width: `${(gameState.enemyStamina / STAMINA_MAX) * 100}%` }}
              />
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
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center ${winner === 'player' ? 'bg-white/10' : 'bg-black/50'}`}>
      <h1 className={`flex gap-1 text-6xl md:text-8xl font-black tracking-tighter mb-8 text-center flex-wrap justify-center px-4 ${winner === 'player' ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]' : 'text-red-600 drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]'}`}>
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
                className="inline-block"
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
                className="inline-block"
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            );
          })
        )}
      </h1>
      <motion.button 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        onClick={onRestart}
        className="px-8 py-4 bg-white text-black font-bold text-xl hover:bg-gray-200 transition-colors"
      >
        REINCARNATE
      </motion.button>
    </div>
  );
}
