import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import { CharacterType } from './game/Types';
import { soundManager } from './game/SoundManager';

export default function App() {
  const [character, setCharacter] = useState<CharacterType | null>(null);
  const [graphicsMode, setGraphicsMode] = useState<'HIGH' | 'LOW'>('HIGH');

  if (character) {
    return (
      <>
        <GameCanvas character={character} graphicsMode={graphicsMode} />
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button 
            onClick={() => setGraphicsMode('LOW')}
            className={`px-3 py-1 rounded font-bold text-sm transition-colors ${graphicsMode === 'LOW' ? 'bg-white text-black' : 'bg-black/50 text-white border border-white/30 hover:bg-white/10'}`}
          >
            LOW
          </button>
          <button 
            onClick={() => setGraphicsMode('HIGH')}
            className={`px-3 py-1 rounded font-bold text-sm transition-colors ${graphicsMode === 'HIGH' ? 'bg-white text-black' : 'bg-black/50 text-white border border-white/30 hover:bg-white/10'}`}
          >
            HIGH
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-50 flex flex-col items-center justify-center p-8 font-sans selection:bg-red-500/30 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.05)_0%,transparent_100%)] pointer-events-none" />
      
      <div className="max-w-6xl w-full space-y-16 z-10">
        <div className="text-center space-y-4">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
            Cursed Combat
          </h1>
          <p className="text-zinc-500 text-lg md:text-xl tracking-[0.3em] uppercase font-mono">
            Select Your Vessel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-[60vh]">
          <CharacterCard 
            name="Yuji" 
            title="The Tiger"
            color="hover:shadow-[0_0_50px_rgba(255,204,0,0.5)] hover:border-yellow-500"
            glowColor="bg-yellow-500"
            stats={{ hp: 100, ce: 100, dmg: 'High', speed: 'Med' }}
            onClick={() => {
              soundManager.playClick();
              setCharacter('Yuji');
            }}
          />
          <CharacterCard 
            name="Gojo" 
            title="The Strongest"
            color="hover:shadow-[0_0_50px_rgba(138,43,226,0.5)] hover:border-purple-500"
            glowColor="bg-purple-500"
            stats={{ hp: 100, ce: 100, dmg: 'Max', speed: 'High' }}
            onClick={() => {
              soundManager.playClick();
              setCharacter('Gojo');
            }}
          />
          <CharacterCard 
            name="Sukuna" 
            title="King of Curses"
            color="hover:shadow-[0_0_50px_rgba(255,0,0,0.5)] hover:border-red-500"
            glowColor="bg-red-500"
            stats={{ hp: 100, ce: 100, dmg: 'High', speed: 'High' }}
            onClick={() => {
              soundManager.playClick();
              setCharacter('Sukuna');
            }}
          />
        </div>
      </div>
    </div>
  );
}

function CharacterCard({ name, title, color, glowColor, stats, onClick }: { name: string, title: string, color: string, glowColor: string, stats: any, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => soundManager.playHover()}
      className={`group relative flex flex-col justify-end p-8 bg-zinc-950 border border-zinc-800 transition-all duration-500 text-left w-full h-full overflow-hidden ${color}`}
    >
      {/* Silhouette */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity duration-500">
        <div className={`w-32 h-[150%] ${glowColor} blur-[100px] opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
        <div className="absolute bottom-0 w-48 h-[80%] bg-black" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }} />
      </div>

      <div className="relative z-10 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
        <h2 className="text-5xl font-black uppercase tracking-tighter mb-1 text-white">{name}</h2>
        <h3 className="text-sm text-zinc-500 uppercase tracking-[0.2em] mb-6 font-mono">{title}</h3>
        
        <div className="grid grid-cols-2 gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 font-mono text-xs">
          <div>
            <span className="text-zinc-500 block mb-1">HP</span>
            <span className="text-white">{stats.hp}</span>
          </div>
          <div>
            <span className="text-zinc-500 block mb-1">CE</span>
            <span className="text-white">{stats.ce}</span>
          </div>
          <div>
            <span className="text-zinc-500 block mb-1">DMG</span>
            <span className="text-white">{stats.dmg}</span>
          </div>
          <div>
            <span className="text-zinc-500 block mb-1">SPD</span>
            <span className="text-white">{stats.speed}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
