import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import MatchmakingSidebar from './components/MatchmakingSidebar';
import { CharacterType } from './game/Types';
import { soundManager } from './game/SoundManager';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export default function App() {
  const [character, setCharacter] = useState<CharacterType | null>(null);
  const [playingLocal, setPlayingLocal] = useState(false);
  const [networkMatch, setNetworkMatch] = useState<{role: 'host'|'client', dc: RTCDataChannel, pc: RTCPeerConnection} | null>(null);
  const [preparingMatch, setPreparingMatch] = useState<{match: any, role: 'host'|'client'} | null>(null);

  if (playingLocal && character) {
    return <GameCanvas character={character} />;
  }

  if (networkMatch && character) {
    return <GameCanvas character={character} networkMatch={networkMatch} />;
  }

  return (
    <div className="min-h-screen bg-black text-zinc-50 flex font-sans selection:bg-red-500/30 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.05)_0%,transparent_100%)] pointer-events-none" />
      
      {preparingMatch ? (
        <div className="flex-1 z-10">
          <PreparingScreen 
            match={preparingMatch.match} 
            role={preparingMatch.role} 
            initialCharacter={character}
            onComplete={(finalChar) => {
              setCharacter(finalChar);
              setPreparingMatch(null);
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
          <div className="max-w-6xl w-full space-y-16">
            <div className="text-center space-y-4">
              <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                Cursed Combat
              </h1>
              <p className="text-zinc-500 text-lg md:text-xl tracking-[0.3em] uppercase font-mono">
                Select Your Vessel
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-[50vh]">
              <CharacterCard 
                name="Yuji" title="The Tiger" color="hover:shadow-[0_0_50px_rgba(255,204,0,0.5)] hover:border-yellow-500" glowColor="bg-yellow-500" stats={{ hp: 200, ce: 100, dmg: 'High', speed: 'Med' }}
                selected={character === 'Yuji'}
                onClick={() => { soundManager.playClick(); setCharacter('Yuji'); }}
              />
              <CharacterCard 
                name="Gojo" title="The Strongest" color="hover:shadow-[0_0_50px_rgba(138,43,226,0.5)] hover:border-purple-500" glowColor="bg-purple-500" stats={{ hp: 200, ce: 100, dmg: 'Max', speed: 'High' }}
                selected={character === 'Gojo'}
                onClick={() => { soundManager.playClick(); setCharacter('Gojo'); }}
              />
              <CharacterCard 
                name="Sukuna" title="King of Curses" color="hover:shadow-[0_0_50px_rgba(255,0,0,0.5)] hover:border-red-500" glowColor="bg-red-500" stats={{ hp: 200, ce: 100, dmg: 'High', speed: 'High' }}
                selected={character === 'Sukuna'}
                onClick={() => { soundManager.playClick(); setCharacter('Sukuna'); }}
              />
            </div>

            {character && (
              <div className="flex justify-center">
                <button 
                  onClick={() => setPlayingLocal(true)}
                  className="px-12 py-4 bg-white text-black font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  Play Local (vs AI)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`z-20 ${preparingMatch ? 'hidden' : ''}`}>
        <MatchmakingSidebar 
          selectedCharacter={character} 
          onMatchStart={(role, dc, pc) => setNetworkMatch({ role, dc, pc })} 
          onPreparing={(match, role) => setPreparingMatch({ match, role })}
        />
      </div>
    </div>
  );
}

function PreparingScreen({ match, role, initialCharacter, onComplete }: { match: any, role: 'host'|'client', initialCharacter: CharacterType | null, onComplete: (char: CharacterType) => void }) {
  const [timeLeft, setTimeLeft] = useState(5);
  const [selected, setSelected] = useState<CharacterType | null>(initialCharacter);

  useEffect(() => {
    if (timeLeft <= 0) {
      let finalChar = selected;
      if (!finalChar) {
        const chars: CharacterType[] = ['Yuji', 'Gojo', 'Sukuna'];
        finalChar = chars[Math.floor(Math.random() * chars.length)];
      }
      
      // Update match document
      const updateMatch = async () => {
        const field = role === 'host' ? 'hostCharacter' : 'guestCharacter';
        await updateDoc(doc(db, 'matches', match.id), { [field]: finalChar });
        
        if (role === 'host') {
          // Host transitions to playing after a short delay to ensure both updated
          setTimeout(async () => {
            await updateDoc(doc(db, 'matches', match.id), { status: 'playing' });
          }, 1000);
        }
        
        onComplete(finalChar!);
      };
      updateMatch();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, selected, match.id, role, onComplete]);

  return (
    <div className="min-h-screen bg-black text-zinc-50 flex flex-col items-center justify-center p-8 font-sans">
      <h1 className="text-4xl font-black uppercase tracking-widest text-red-500 mb-8 animate-pulse">
        Match Found
      </h1>
      <p className="text-2xl mb-12">Choose your character: <span className="font-bold text-white text-4xl">{timeLeft}</span></p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-[50vh] max-w-6xl w-full">
        <CharacterCard 
          name="Yuji" title="The Tiger" color="hover:shadow-[0_0_50px_rgba(255,204,0,0.5)] hover:border-yellow-500" glowColor="bg-yellow-500" stats={{ hp: 200, ce: 100, dmg: 'High', speed: 'Med' }}
          selected={selected === 'Yuji'}
          onClick={() => { soundManager.playClick(); setSelected('Yuji'); }}
        />
        <CharacterCard 
          name="Gojo" title="The Strongest" color="hover:shadow-[0_0_50px_rgba(138,43,226,0.5)] hover:border-purple-500" glowColor="bg-purple-500" stats={{ hp: 200, ce: 100, dmg: 'Max', speed: 'High' }}
          selected={selected === 'Gojo'}
          onClick={() => { soundManager.playClick(); setSelected('Gojo'); }}
        />
        <CharacterCard 
          name="Sukuna" title="King of Curses" color="hover:shadow-[0_0_50px_rgba(255,0,0,0.5)] hover:border-red-500" glowColor="bg-red-500" stats={{ hp: 200, ce: 100, dmg: 'High', speed: 'High' }}
          selected={selected === 'Sukuna'}
          onClick={() => { soundManager.playClick(); setSelected('Sukuna'); }}
        />
      </div>
    </div>
  );
}

function CharacterCard({ name, title, color, glowColor, stats, selected, onClick }: { name: string, title: string, color: string, glowColor: string, stats: any, selected: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => soundManager.playHover()}
      className={`group relative flex flex-col justify-end p-8 bg-zinc-950 border transition-all duration-500 text-left w-full h-full overflow-hidden ${color} ${selected ? 'border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'border-zinc-800'}`}
    >
      {/* Silhouette */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${selected ? 'opacity-100' : 'opacity-20 group-hover:opacity-100'}`}>
        <div className={`w-32 h-[150%] ${glowColor} blur-[100px] transition-opacity duration-500 ${selected ? 'opacity-50' : 'opacity-0 group-hover:opacity-50'}`} />
        <div className="absolute bottom-0 w-48 h-[80%] bg-black" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }} />
      </div>

      <div className={`relative z-10 transform transition-transform duration-500 ${selected ? 'translate-y-0' : 'translate-y-8 group-hover:translate-y-0'}`}>
        <h2 className="text-5xl font-black uppercase tracking-tighter mb-1 text-white">{name}</h2>
        <h3 className="text-sm text-zinc-500 uppercase tracking-[0.2em] mb-6 font-mono">{title}</h3>
        
        <div className={`grid grid-cols-2 gap-4 transition-opacity duration-500 delay-100 font-mono text-xs ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div><span className="text-zinc-500 block mb-1">HP</span><span className="text-white">{stats.hp}</span></div>
          <div><span className="text-zinc-500 block mb-1">CE</span><span className="text-white">{stats.ce}</span></div>
          <div><span className="text-zinc-500 block mb-1">DMG</span><span className="text-white">{stats.dmg}</span></div>
          <div><span className="text-zinc-500 block mb-1">SPD</span><span className="text-white">{stats.speed}</span></div>
        </div>
      </div>
    </button>
  );
}
