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
          <span>{Math.max(0, Math.floor(gameState.playerHp))} / 125 HP</span>
        </div>
        <div className="h-6 bg-red-950/50 border-2 border-red-900 rounded-sm overflow-hidden mb-2">
          <div 
            className="h-full bg-red-500 transition-all duration-200 ease-out"
            style={{ width: `${(Math.max(0, gameState.playerHp) / 125) * 100}%` }}
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
          <span>{Math.max(0, Math.floor(gameState.enemyHp))} / 125 HP</span>
        </div>
        <div className="h-6 bg-red-950/50 border-2 border-red-900 rounded-sm overflow-hidden mb-2">
          <div 
            className="h-full bg-red-600 transition-all duration-200 ease-out float-right"
            style={{ width: `${(Math.max(0, gameState.enemyHp) / 125) * 100}%` }}
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
  onRestart: () => void;
}

export function EndGameScreen({ winner, onRestart }: EndGameScreenProps) {
  if (!winner) return null;
  
  return (
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center ${winner === 'player' ? 'bg-white/10' : 'bg-black/50'}`}>
      <h1 className={`flex gap-1 text-8xl font-black tracking-tighter mb-8 ${winner === 'player' ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]' : 'text-red-600 drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]'}`}>
        {winner === 'player' ? (
          'PURIFIED'.split('').map((char, i) => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 500 + Math.random() * 500;
            return (
              <motion.span
                key={i}
                initial={{ opacity: 0, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, rotate: (Math.random() - 0.5) * 180 }}
                animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                transition={{ duration: 0.8, type: 'spring', bounce: 0.4, delay: i * 0.1 }}
                className="inline-block"
              >
                {char}
              </motion.span>
            );
          })
        ) : (
          'YOU WERE CONSUMED'.split('').map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, filter: 'blur(15px) brightness(200%)', y: -50, color: '#fbbf24', scale: 1.5 }}
              animate={{ opacity: 1, filter: 'blur(0px) brightness(100%)', y: 0, color: '#dc2626', scale: 1 }}
              transition={{ duration: 1.2, delay: i * 0.05, ease: "easeOut" }}
              className="inline-block"
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))
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
