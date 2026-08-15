import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import MatchmakingSidebar from './components/MatchmakingSidebar';
import CharacterSilhouette from './components/CharacterSilhouette';
import { CharacterType } from './game/Types';
import { soundManager } from './game/SoundManager';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from './firebase';

const KANJI_MAP: Record<CharacterType, { kanji: string, domain: string }> = {
  Yuji: { kanji: "虎杖 悠仁", domain: "Benevolent Boxing" },
  Gojo: { kanji: "五条 悟", domain: "Unlimited Void" },
  Sukuna: { kanji: "両面 宿儺", domain: "Malevolent Shrine" },
  Megumi: { kanji: "伏黒 恵", domain: "Mahoraga Summon" },
  Hakari: { kanji: "秤 金次", domain: "Idle Death Gamble" }
};

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
    <div className="min-h-screen bg-[#030008] text-zinc-50 flex font-sans selection:bg-red-500/30 overflow-hidden relative">
      {/* Dynamic Cursed Energy Background Aura */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(140,20,60,0.25)_0%,rgba(20,5,35,0.85)_50%,rgba(2,0,8,1)_100%)] pointer-events-none" />
      
      {/* Animated Japanese Cursed Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,60,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(140,0,255,0.04)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none transform perspective-[1000px] rotateX-[60deg] scale-[2.5] origin-[50%_100%] animate-[slide_6s_linear_infinite]" />
      
      {/* Huge Background Kanji Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 select-none overflow-hidden">
        <span className="text-[25vw] font-black text-red-600 tracking-widest blur-xs transform -rotate-12 italic">
          呪術対戦
        </span>
      </div>

      {/* Floating Cursed Particles Glow */}
      <div className="absolute top-1/4 left-1/5 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/5 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      {isConnecting ? (
        <div className="flex-1 flex flex-col items-center justify-center z-10">
          <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-amber-500 animate-pulse tracking-widest uppercase italic">Connecting to Domain...</h2>
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
        <div className="flex-1 flex flex-col items-center justify-center p-2 z-10 w-full h-full relative">
          {/* VERSION NUMBER */}
          <div className="absolute top-4 right-4 md:right-8 flex items-center gap-2 text-zinc-400 font-mono text-xs md:text-sm uppercase tracking-[0.2em] font-bold z-50 bg-zinc-950/80 px-4 py-1.5 rounded-full border border-zinc-800 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>v2.1.0</span> <span className="text-zinc-600">|</span> <span className="text-red-400">DOMAIN EVOLUTION</span>
          </div>

          <div className="max-w-[1600px] w-full flex flex-col h-full justify-evenly">
            {/* STYLIZED TITLE BANNER */}
            <div className="text-center space-y-1 relative flex-shrink-0 mt-4 md:mt-6">
              {/* Kanji Header Subtitle */}
              <div className="text-red-500/80 text-xs md:text-sm font-mono tracking-[0.6em] uppercase font-black drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">
                呪術対戦 • JUJUTSU COMBAT
              </div>
              
              {/* Main Title with multi-layered glow */}
              <div className="relative inline-block">
                <h1 className="text-5xl md:text-7xl lg:text-9xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-500 drop-shadow-[0_0_50px_rgba(255,255,255,0.4)] leading-none italic z-10 relative">
                  CURSED COMBAT
                </h1>
                <span className="absolute inset-0 text-5xl md:text-7xl lg:text-9xl font-black uppercase tracking-tighter text-red-600 blur-md opacity-50 italic pointer-events-none select-none translate-y-1" aria-hidden="true">
                  CURSED COMBAT
                </span>
              </div>

              {/* Subtitle Badge */}
              <div className="flex justify-center items-center gap-3 mt-2">
                <span className="h-[1px] w-12 md:w-24 bg-gradient-to-r from-transparent to-red-500" />
                <p className="text-red-400 text-xs md:text-base lg:text-lg tracking-[0.4em] uppercase font-mono font-bold drop-shadow-[0_0_15px_rgba(255,0,0,0.9)] px-4 py-1 bg-red-950/40 border border-red-500/30 rounded-full backdrop-blur-md">
                  SELECT YOUR VESSEL
                </p>
                <span className="h-[1px] w-12 md:w-24 bg-gradient-to-l from-transparent to-red-500" />
              </div>
            </div>

            {/* CHARACTER CARDS ROW */}
            <div className="flex flex-wrap justify-center items-center gap-3 md:gap-5 lg:gap-6 my-auto scale-90 md:scale-95 origin-center">
              <CharacterCard 
                name="Yuji" title="The Tiger" color="hover:shadow-[0_0_80px_rgba(255,100,0,0.6)] hover:border-orange-500" glowColor="bg-orange-500" stats={{ hp: 200, ce: 100, dmg: 'High', speed: 'Med' }}
                selected={character === 'Yuji'}
                onClick={() => { soundManager.playClick(); setCharacter('Yuji'); }}
              />
              <CharacterCard 
                name="Gojo" title="The Strongest" color="hover:shadow-[0_0_80px_rgba(168,85,247,0.6)] hover:border-purple-500" glowColor="bg-purple-500" stats={{ hp: 200, ce: 100, dmg: 'Max', speed: 'High' }}
                selected={character === 'Gojo'}
                onClick={() => { soundManager.playClick(); setCharacter('Gojo'); }}
              />
              <CharacterCard 
                name="Sukuna" title="King of Curses" color="hover:shadow-[0_0_80px_rgba(239,68,68,0.6)] hover:border-red-500" glowColor="bg-red-500" stats={{ hp: 200, ce: 100, dmg: 'High', speed: 'High' }}
                selected={character === 'Sukuna'}
                onClick={() => { soundManager.playClick(); setCharacter('Sukuna'); }}
              />
              <CharacterCard 
                name="Megumi" title="Ten Shadows" color="hover:shadow-[0_0_80px_rgba(59,130,246,0.6)] hover:border-blue-500" glowColor="bg-blue-500" stats={{ hp: 200, ce: 100, dmg: 'Med', speed: 'High' }}
                selected={character === 'Megumi'}
                onClick={() => { soundManager.playClick(); setCharacter('Megumi'); }}
              />
              <CharacterCard 
                name="Hakari" title="The Gambler" color="hover:shadow-[0_0_80px_rgba(236,72,153,0.6)] hover:border-pink-500" glowColor="bg-pink-500" stats={{ hp: 200, ce: 100, dmg: 'RNG', speed: 'High' }}
                selected={character === 'Hakari'}
                onClick={() => { soundManager.playClick(); setCharacter('Hakari'); }}
              />
            </div>

            {/* ACTION BUTTON */}
            {character ? (
              <div className="flex justify-center mt-2 md:mt-4 pb-4 md:pb-6 flex-shrink-0 animate-[fadeIn_0.4s_ease-out]">
                <button 
                  onClick={() => setPlayingLocal(true)}
                  className="group relative px-12 py-4 md:px-20 md:py-5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white font-black text-xl md:text-3xl uppercase tracking-[0.25em] italic overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(239,68,68,0.8)] rounded-sm border border-red-300"
                >
                  <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">ENTER DOMAIN</span>
                  <div className="absolute inset-0 bg-white/30 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                </button>
              </div>
            ) : (
                <div className="h-[70px] md:h-[90px] mt-2 md:mt-4 pb-4 md:pb-6 opacity-0 pointer-events-none" />
            )}
          </div>
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
      
      const updateMatch = async () => {
        const field = role === 'host' ? 'hostCharacter' : 'guestCharacter';
        await updateDoc(doc(db, 'matches', match.id), { [field]: finalChar });
        
        if (role === 'host') {
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
    <div className="min-h-screen bg-[#030008] text-zinc-50 flex flex-col items-center justify-center p-8 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(100,20,150,0.15)_0%,rgba(0,0,0,1)_80%)] pointer-events-none" />
      
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

function CharacterCard({ name, title, color, glowColor, selected, onClick }: { name: string, title: string, color: string, glowColor: string, stats?: any, selected: boolean, onClick: () => void }) {
  const charType = name as CharacterType;
  const kanjiData = KANJI_MAP[charType];

  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => soundManager.playHover()}
      className={`group relative flex flex-col items-center justify-between p-4 md:p-6 bg-zinc-950/90 border transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex-1 min-w-[190px] md:min-w-[220px] max-w-[260px] h-[310px] md:h-[370px] overflow-hidden backdrop-blur-2xl rounded-sm ${color} ${
        selected ? 'border-red-500/90 shadow-[0_0_60px_rgba(239,68,68,0.5)] scale-105 z-20' : 'border-zinc-800/80 hover:scale-[1.03] hover:border-zinc-500 hover:z-10'
      }`}
    >
      {/* Background Japanese Kanji Watermark */}
      <div className="absolute top-2 right-2 text-4xl md:text-5xl font-black text-zinc-800/40 pointer-events-none select-none italic font-serif">
        {kanjiData?.kanji}
      </div>

      {/* Card Header Info */}
      <div className="relative z-30 flex flex-col items-center w-full">
        <span className="text-[10px] md:text-xs text-red-500 font-mono tracking-[0.3em] font-bold uppercase mb-0.5">
          {kanjiData?.domain}
        </span>
        <h2 className="text-3xl md:text-4xl xl:text-5xl font-black uppercase tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] italic">
          {name}
        </h2>
        <h3 className="text-[10px] md:text-xs text-zinc-400 uppercase tracking-[0.25em] font-mono text-center">
          {title}
        </h3>
      </div>

      {/* Unique Character SVG Silhouette & Energy Aura */}
      <div className="relative w-full h-48 md:h-60 z-10 -mt-2 md:-mt-4 my-0">
        <CharacterSilhouette type={charType} selected={selected} glowColor={glowColor} />
      </div>
    </button>
  );
}
