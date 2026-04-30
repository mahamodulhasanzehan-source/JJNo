import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import MatchmakingSidebar from './components/MatchmakingSidebar';
import { CharacterType } from './game/Types';
import { soundManager } from './game/SoundManager';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from './firebase';

export default function App() {
  const [character, setCharacter] = useState<CharacterType | null>(null);
  const [playingLocal, setPlayingLocal] = useState(false);
  const [networkMatch, setNetworkMatch] = useState<{role: 'host'|'client', dc: RTCDataChannel, pc: RTCPeerConnection, match: any} | null>(null);
  const [preparingMatch, setPreparingMatch] = useState<{match: any, role: 'host'|'client'} | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  if (playingLocal && character) {
    return <GameCanvas character={character} />;
  }

  if (networkMatch && character) {
    const opponentCharacter = networkMatch.role === 'host' ? networkMatch.match.guestCharacter : networkMatch.match.hostCharacter;
    return <GameCanvas character={character} opponentCharacter={opponentCharacter as CharacterType} networkMatch={networkMatch} />;
  }

  return (
    <div className="min-h-screen bg-[#050010] text-zinc-50 flex font-sans selection:bg-red-500/30 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(100,20,150,0.15)_0%,rgba(0,0,0,1)_80%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none transform perspective-[1000px] rotateX-[60deg] scale-[2.5] origin-[50%_100%] animate-[slide_4s_linear_infinite]" />
      
      {isConnecting ? (
        <div className="flex-1 flex flex-col items-center justify-center z-10">
          <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-500 animate-pulse tracking-widest uppercase">Connecting...</h2>
        </div>
      ) : preparingMatch ? (
        <div className="flex-1 z-10">
          <PreparingScreen 
            match={preparingMatch.match} 
            role={preparingMatch.role} 
            initialCharacter={character}
            onComplete={(finalChar) => {
              setCharacter(finalChar);
              setPreparingMatch(null);
              setIsConnecting(true);
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10 relative">
          {/* VERSION NUMBER */}
          <div className="absolute top-6 right-8 text-zinc-500 font-mono text-sm uppercase tracking-[0.2em] font-bold z-50 opacity-80 mix-blend-plus-lighter">
            v2.0.0 <span className="opacity-50 mx-2">|</span> DOMAIN ERA
          </div>

          <div className="max-w-[1500px] w-full space-y-12 md:space-y-16 mt-8">
            <div className="text-center space-y-2 relative">
              <h1 className="text-7xl md:text-8xl lg:text-[10rem] font-black uppercase tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.3)] leading-none italic z-10 relative">
                CURSED COMBAT
              </h1>
              <p className="text-red-500 text-sm md:text-xl lg:text-2xl tracking-[0.4em] uppercase font-mono font-bold drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]">
                Select Your Vessel
              </p>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 lg:gap-10">
              <CharacterCard 
                name="Yuji" title="The Tiger" color="hover:shadow-[0_0_80px_rgba(255,100,0,0.6)] hover:border-orange-500" glowColor="bg-orange-500" stats={{ hp: 200, ce: 100, dmg: 'High', speed: 'Med' }}
                selected={character === 'Yuji'}
                onClick={() => { soundManager.playClick(); setCharacter('Yuji'); }}
              />
              <CharacterCard 
                name="Gojo" title="The Strongest" color="hover:shadow-[0_0_80px_rgba(138,43,226,0.6)] hover:border-purple-500" glowColor="bg-purple-500" stats={{ hp: 200, ce: 100, dmg: 'Max', speed: 'High' }}
                selected={character === 'Gojo'}
                onClick={() => { soundManager.playClick(); setCharacter('Gojo'); }}
              />
              <CharacterCard 
                name="Sukuna" title="King of Curses" color="hover:shadow-[0_0_80px_rgba(255,0,0,0.6)] hover:border-red-500" glowColor="bg-red-500" stats={{ hp: 200, ce: 100, dmg: 'High', speed: 'High' }}
                selected={character === 'Sukuna'}
                onClick={() => { soundManager.playClick(); setCharacter('Sukuna'); }}
              />
              <CharacterCard 
                name="Megumi" title="Ten Shadows" color="hover:shadow-[0_0_80px_rgba(0,100,255,0.6)] hover:border-blue-500" glowColor="bg-blue-500" stats={{ hp: 200, ce: 100, dmg: 'Med', speed: 'High' }}
                selected={character === 'Megumi'}
                onClick={() => { soundManager.playClick(); setCharacter('Megumi'); }}
              />
              <CharacterCard 
                name="Hakari" title="The Gambler" color="hover:shadow-[0_0_80px_rgba(255,20,147,0.6)] hover:border-pink-500" glowColor="bg-pink-500" stats={{ hp: 200, ce: 100, dmg: 'RNG', speed: 'High' }}
                selected={character === 'Hakari'}
                onClick={() => { soundManager.playClick(); setCharacter('Hakari'); }}
              />
            </div>

            {character && (
              <div className="flex justify-center mt-12 animate-[fadeIn_0.5s_ease-out]">
                <button 
                  onClick={() => setPlayingLocal(true)}
                  className="group relative px-16 py-5 bg-white text-black font-black text-2xl uppercase tracking-[0.2em] overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                >
                  <span className="relative z-10 transition-colors group-hover:text-red-600">ENTER DOMAIN</span>
                  <div className="absolute inset-0 bg-zinc-200 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MULTIPLAYER TEMPORARILY DISABLED */}
      {false && (
        <div className={`z-20 ${preparingMatch || isConnecting ? 'hidden' : ''}`}>
          <MatchmakingSidebar 
            selectedCharacter={character} 
            onMatchStart={(role, dc, pc, match) => {
              setIsConnecting(false);
              setNetworkMatch({ role, dc, pc, match });
            }} 
            onPreparing={(match, role) => setPreparingMatch({ match, role })}
          />
        </div>
      )}
    </div>
  );
}

function PreparingScreen({ match, role, initialCharacter, onComplete }: { match: any, role: 'host'|'client', initialCharacter: CharacterType | null, onComplete: (char: CharacterType) => void }) {
  const [timeLeft, setTimeLeft] = useState(5);
  const [selected, setSelected] = useState<CharacterType | null>(initialCharacter);
  const hasCompleted = React.useRef(false);
  const onCompleteRef = React.useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (timeLeft <= 0 && !hasCompleted.current) {
      hasCompleted.current = true;
      let finalChar = selected;
      if (!finalChar) {
        const chars: CharacterType[] = ['Yuji', 'Gojo', 'Sukuna', 'Megumi', 'Hakari'];
        finalChar = chars[Math.floor(Math.random() * chars.length)];
      }
      
      // Update match document
      const updateMatch = async () => {
        const field = role === 'host' ? 'hostCharacter' : 'guestCharacter';
        await updateDoc(doc(db, 'matches', match.id), { [field]: finalChar });
        
        if (role === 'host') {
          // Host transitions to playing after a short delay to ensure both updated
          setTimeout(async () => {
            await updateDoc(doc(db, 'matches', match.id), { 
              status: 'playing',
              offer: deleteField(),
              answer: deleteField(),
              hostCandidates: deleteField(),
              guestCandidates: deleteField()
            });
          }, 1000);
        }
        
        onCompleteRef.current(finalChar!);
      };
      updateMatch();
      return;
    }

    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, selected, match.id, role]);

  return (
    <div className="min-h-screen bg-[#050010] text-zinc-50 flex flex-col items-center justify-center p-8 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(100,20,150,0.15)_0%,rgba(0,0,0,1)_80%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none transform perspective-[1000px] rotateX-[60deg] scale-[2.5] origin-[50%_100%] animate-[slide_4s_linear_infinite]" />
      
      <div className="relative z-10 flex flex-col items-center flex-1 justify-center w-full max-w-[1500px]">
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-500 mb-8 animate-pulse italic">
          Match Found
        </h1>
        <p className="text-xl md:text-2xl mb-12 font-mono uppercase tracking-widest">Choose your vessel: <span className="font-bold text-white text-3xl md:text-4xl">{timeLeft}</span></p>
        
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 lg:gap-10 w-full">
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
        <CharacterCard 
          name="Megumi" title="Ten Shadows" color="hover:shadow-[0_0_50px_rgba(0,0,139,0.5)] hover:border-blue-800" glowColor="bg-blue-800" stats={{ hp: 200, ce: 100, dmg: 'Med', speed: 'High' }}
          selected={selected === 'Megumi'}
          onClick={() => { soundManager.playClick(); setSelected('Megumi'); }}
        />
        <CharacterCard 
          name="Hakari" title="The Gambler" color="hover:shadow-[0_0_50px_rgba(255,20,147,0.5)] hover:border-pink-500" glowColor="bg-pink-500" stats={{ hp: 200, ce: 100, dmg: 'RNG', speed: 'High' }}
          selected={selected === 'Hakari'}
          onClick={() => { soundManager.playClick(); setSelected('Hakari'); }}
        />
      </div>
      </div>
    </div>
  );
}

function CharacterCard({ name, title, color, glowColor, stats, selected, onClick }: { name: string, title: string, color: string, glowColor: string, stats: any, selected: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => soundManager.playHover()}
      className={`group relative flex flex-col items-center justify-end p-4 md:p-6 bg-zinc-950/80 border transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex-1 min-w-[200px] md:min-w-[240px] max-w-[280px] h-[350px] md:h-[450px] overflow-hidden backdrop-blur-xl ${color} ${selected ? 'border-white/80 shadow-[0_0_50px_rgba(255,255,255,0.4)] scale-105 z-10' : 'border-zinc-800/50 hover:scale-105 hover:z-10'}`}
    >
      {/* Scanlines Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none z-20" />
      
      {/* Diagonal Glitch Lines */}
      <div className={`absolute -inset-10 bg-white/5 transform rotate-[-45deg] transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${selected ? 'translate-y-[-10%]' : 'translate-y-[150%] group-hover:translate-y-[-10%]'}`} />
      <div className={`absolute -inset-10 bg-white/5 transform rotate-[-45deg] transition-all duration-700 delay-75 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${selected ? 'translate-y-[-50%]' : 'translate-y-[150%] group-hover:translate-y-[-50%]'}`} />

      {/* Silhouette & Glow */}
      <div className={`absolute inset-0 flex flex-col items-center justify-end transition-opacity duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${selected ? 'opacity-100' : 'opacity-30 group-hover:opacity-100'}`}>
        <div className={`absolute top-0 w-48 h-[150%] ${glowColor} blur-[120px] transition-opacity duration-700 ${selected ? 'opacity-60' : 'opacity-0 group-hover:opacity-60'}`} />
        <div className="relative w-48 h-[90%] bg-black/80 drop-shadow-[0_0_15px_rgba(0,0,0,1)]" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)' }} />
      </div>

      {/* Content */}
      <div className={`relative z-30 flex flex-col items-center w-full transform transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${selected ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-80 group-hover:translate-y-0 group-hover:opacity-100'}`}>
        <h2 className="text-4xl xl:text-5xl font-black uppercase tracking-tighter mb-0 text-white text-center w-full drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] italic">{name}</h2>
        <h3 className="text-[10px] md:text-xs text-zinc-400 uppercase tracking-[0.3em] mb-4 font-mono text-center drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{title}</h3>
        
        <div className={`grid grid-cols-2 gap-x-2 gap-y-4 w-full max-w-[160px] transition-all duration-700 delay-150 font-mono text-[10px] md:text-xs text-center border-t border-white/10 pt-4 ${selected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'}`}>
          <div className="flex flex-col items-center"><span className="text-zinc-500 mb-1">HP</span><span className="text-white font-bold">{stats.hp}</span></div>
          <div className="flex flex-col items-center"><span className="text-zinc-500 mb-1">CE</span><span className="text-white font-bold">{stats.ce}</span></div>
          <div className="flex flex-col items-center"><span className="text-zinc-500 mb-1">DMG</span><span className="text-white font-bold">{stats.dmg}</span></div>
          <div className="flex flex-col items-center"><span className="text-zinc-500 mb-1">SPD</span><span className="text-white font-bold">{stats.speed}</span></div>
        </div>
      </div>
    </button>
  );
}
