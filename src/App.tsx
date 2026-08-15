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
  const [enemyCharacter, setEnemyCharacter] = useState<CharacterType | null>(null);
  const [customEnemyMode, setCustomEnemyMode] = useState(false);
  const [playingLocal, setPlayingLocal] = useState(false);
  const [networkMatch, setNetworkMatch] = useState<{role: 'host'|'client', dc: RTCDataChannel, pc: RTCPeerConnection, match: any} | null>(null);
  const [preparingMatch, setPreparingMatch] = useState<{match: any, role: 'host'|'client'} | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  if (playingLocal && character) {
    return <GameCanvas character={character} opponentCharacter={(customEnemyMode && enemyCharacter) ? enemyCharacter : undefined} />;
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
            <div className="text-center space-y-1 relative flex-shrink-0 mt-3 md:mt-5">
              {/* Kanji Header Subtitle */}
              <div className="text-red-500/80 text-xs md:text-sm font-mono tracking-[0.6em] uppercase font-black drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">
                呪術対戦 • JUJUTSU COMBAT
              </div>
              
              {/* Main Title with multi-layered glow */}
              <div className="relative inline-block">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-500 drop-shadow-[0_0_50px_rgba(255,255,255,0.4)] leading-none italic z-10 relative">
                  CURSED COMBAT
                </h1>
                <span className="absolute inset-0 text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-red-600 blur-md opacity-50 italic pointer-events-none select-none translate-y-1" aria-hidden="true">
                  CURSED COMBAT
                </span>
              </div>

              {/* Subtitle & Enemy Selector Toggle */}
              <div className="flex flex-col items-center justify-center gap-2 mt-2">
                {/* Mode Toggle Switch */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      const nextMode = !customEnemyMode;
                      setCustomEnemyMode(nextMode);
                      if (!nextMode) {
                        setEnemyCharacter(null);
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-1.5 rounded-full border transition-all duration-300 backdrop-blur-md cursor-pointer ${
                      customEnemyMode 
                        ? 'bg-purple-950/70 border-purple-500/80 shadow-[0_0_25px_rgba(168,85,247,0.5)] text-purple-200' 
                        : 'bg-zinc-900/80 border-zinc-700/70 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-xs font-mono tracking-wider uppercase font-bold">
                      {customEnemyMode ? 'Enemy Selection: Manual' : 'Enemy Selection: Fair Random'}
                    </span>
                    {/* Toggle Pill */}
                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 flex items-center ${
                      customEnemyMode ? 'bg-purple-600 justify-end' : 'bg-zinc-700 justify-start'
                    }`}>
                      <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300" />
                    </div>
                  </button>
                </div>

                {/* Matchup Summary Pill */}
                <div className="flex items-center justify-center gap-3 text-xs font-mono uppercase tracking-widest text-zinc-400 bg-zinc-950/70 px-4 py-1 rounded-full border border-zinc-800/80">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500">YOU:</span>
                    <span className={`font-bold ${character ? 'text-red-400' : 'text-zinc-500 italic'}`}>
                      {character ? character.toUpperCase() : 'NOT SELECTED'}
                    </span>
                  </div>
                  <span className="text-zinc-600 font-bold">VS</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500">ENEMY:</span>
                    <span className={`font-bold ${enemyCharacter ? 'text-purple-400' : 'text-amber-400'}`}>
                      {enemyCharacter ? enemyCharacter.toUpperCase() : 'RANDOM (EQUAL 20% ODDS)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CHARACTER CARDS ROW */}
            <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 lg:gap-5 my-auto scale-90 md:scale-95 origin-center">
              <CharacterCard 
                name="Yuji" title="The Tiger" color="hover:shadow-[0_0_80px_rgba(255,100,0,0.6)] hover:border-orange-500" glowColor="bg-orange-500" stats={{ hp: 200, ce: 100, dmg: 'High', speed: 'Med' }}
                isPlayerSelected={character === 'Yuji'}
                isEnemySelected={enemyCharacter === 'Yuji'}
                customEnemyMode={customEnemyMode}
                onSelectPlayer={() => { soundManager.playClick(); setCharacter('Yuji'); }}
                onSelectEnemy={() => { soundManager.playClick(); setEnemyCharacter('Yuji'); }}
                onClick={() => {
                  soundManager.playClick();
                  if (customEnemyMode) {
                    if (character !== 'Yuji') setCharacter('Yuji');
                    else setEnemyCharacter('Yuji');
                  } else {
                    setCharacter('Yuji');
                  }
                }}
              />
              <CharacterCard 
                name="Gojo" title="The Strongest" color="hover:shadow-[0_0_80px_rgba(168,85,247,0.6)] hover:border-purple-500" glowColor="bg-purple-500" stats={{ hp: 200, ce: 100, dmg: 'Max', speed: 'High' }}
                isPlayerSelected={character === 'Gojo'}
                isEnemySelected={enemyCharacter === 'Gojo'}
                customEnemyMode={customEnemyMode}
                onSelectPlayer={() => { soundManager.playClick(); setCharacter('Gojo'); }}
                onSelectEnemy={() => { soundManager.playClick(); setEnemyCharacter('Gojo'); }}
                onClick={() => {
                  soundManager.playClick();
                  if (customEnemyMode) {
                    if (character !== 'Gojo') setCharacter('Gojo');
                    else setEnemyCharacter('Gojo');
                  } else {
                    setCharacter('Gojo');
                  }
                }}
              />
              <CharacterCard 
                name="Sukuna" title="King of Curses" color="hover:shadow-[0_0_80px_rgba(239,68,68,0.6)] hover:border-red-500" glowColor="bg-red-500" stats={{ hp: 200, ce: 100, dmg: 'High', speed: 'High' }}
                isPlayerSelected={character === 'Sukuna'}
                isEnemySelected={enemyCharacter === 'Sukuna'}
                customEnemyMode={customEnemyMode}
                onSelectPlayer={() => { soundManager.playClick(); setCharacter('Sukuna'); }}
                onSelectEnemy={() => { soundManager.playClick(); setEnemyCharacter('Sukuna'); }}
                onClick={() => {
                  soundManager.playClick();
                  if (customEnemyMode) {
                    if (character !== 'Sukuna') setCharacter('Sukuna');
                    else setEnemyCharacter('Sukuna');
                  } else {
                    setCharacter('Sukuna');
                  }
                }}
              />
              <CharacterCard 
                name="Megumi" title="Ten Shadows" color="hover:shadow-[0_0_80px_rgba(59,130,246,0.6)] hover:border-blue-500" glowColor="bg-blue-500" stats={{ hp: 200, ce: 100, dmg: 'Med', speed: 'High' }}
                isPlayerSelected={character === 'Megumi'}
                isEnemySelected={enemyCharacter === 'Megumi'}
                customEnemyMode={customEnemyMode}
                onSelectPlayer={() => { soundManager.playClick(); setCharacter('Megumi'); }}
                onSelectEnemy={() => { soundManager.playClick(); setEnemyCharacter('Megumi'); }}
                onClick={() => {
                  soundManager.playClick();
                  if (customEnemyMode) {
                    if (character !== 'Megumi') setCharacter('Megumi');
                    else setEnemyCharacter('Megumi');
                  } else {
                    setCharacter('Megumi');
                  }
                }}
              />
              <CharacterCard 
                name="Hakari" title="The Gambler" color="hover:shadow-[0_0_80px_rgba(236,72,153,0.6)] hover:border-pink-500" glowColor="bg-pink-500" stats={{ hp: 200, ce: 100, dmg: 'RNG', speed: 'High' }}
                isPlayerSelected={character === 'Hakari'}
                isEnemySelected={enemyCharacter === 'Hakari'}
                customEnemyMode={customEnemyMode}
                onSelectPlayer={() => { soundManager.playClick(); setCharacter('Hakari'); }}
                onSelectEnemy={() => { soundManager.playClick(); setEnemyCharacter('Hakari'); }}
                onClick={() => {
                  soundManager.playClick();
                  if (customEnemyMode) {
                    if (character !== 'Hakari') setCharacter('Hakari');
                    else setEnemyCharacter('Hakari');
                  } else {
                    setCharacter('Hakari');
                  }
                }}
              />
            </div>

            {/* ACTION BUTTON */}
            {character ? (
              <div className="flex justify-center mt-2 md:mt-3 pb-3 md:pb-5 flex-shrink-0 animate-[fadeIn_0.4s_ease-out]">
                <button 
                  onClick={() => setPlayingLocal(true)}
                  className="group relative px-12 py-3.5 md:px-20 md:py-4 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white font-black text-xl md:text-2xl uppercase tracking-[0.25em] italic overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(239,68,68,0.8)] rounded-sm border border-red-300 cursor-pointer"
                >
                  <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">ENTER DOMAIN</span>
                  <div className="absolute inset-0 bg-white/30 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                </button>
              </div>
            ) : (
                <div className="h-[60px] md:h-[80px] mt-2 md:mt-3 pb-3 md:pb-5 opacity-0 pointer-events-none" />
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

interface CharacterCardProps {
  name: string;
  title: string;
  color: string;
  glowColor: string;
  stats?: any;
  selected?: boolean;
  isPlayerSelected?: boolean;
  isEnemySelected?: boolean;
  customEnemyMode?: boolean;
  onSelectPlayer?: () => void;
  onSelectEnemy?: () => void;
  onClick?: () => void;
}

function CharacterCard({ 
  name, 
  title, 
  color, 
  glowColor, 
  selected, 
  isPlayerSelected = false, 
  isEnemySelected = false,
  customEnemyMode = false,
  onSelectPlayer,
  onSelectEnemy,
  onClick 
}: CharacterCardProps) {
  const charType = name as CharacterType;
  const kanjiData = KANJI_MAP[charType];
  const isPlayer = isPlayerSelected || (!customEnemyMode && !!selected);
  const isEnemy = isEnemySelected;

  const getBorderAndGlow = () => {
    if (isPlayer && isEnemy) {
      return 'border-amber-400 shadow-[0_0_60px_rgba(251,191,36,0.6)] scale-105 z-20';
    }
    if (isPlayer) {
      return 'border-red-500/90 shadow-[0_0_60px_rgba(239,68,68,0.5)] scale-105 z-20';
    }
    if (isEnemy) {
      return 'border-purple-500/90 shadow-[0_0_60px_rgba(168,85,247,0.5)] scale-105 z-20';
    }
    return 'border-zinc-800/80 hover:scale-[1.03] hover:border-zinc-500 hover:z-10';
  };

  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => soundManager.playHover()}
      className={`group relative flex flex-col items-center justify-between p-4 md:p-6 bg-zinc-950/90 border transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex-1 min-w-[190px] md:min-w-[220px] max-w-[260px] h-[310px] md:h-[370px] overflow-hidden backdrop-blur-2xl rounded-sm cursor-pointer select-none ${color} ${getBorderAndGlow()}`}
    >
      {/* Background Japanese Kanji Watermark */}
      <div className="absolute top-2 right-2 text-4xl md:text-5xl font-black text-zinc-800/40 pointer-events-none select-none italic font-serif">
        {kanjiData?.kanji}
      </div>

      {/* Badges Overlay for Selection */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-30 pointer-events-none">
        {isPlayer ? (
          <span className="px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider bg-red-600/90 text-white rounded border border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse">
            YOU
          </span>
        ) : <span />}

        {isEnemy ? (
          <span className="px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider bg-purple-600/90 text-white rounded border border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)] animate-pulse">
            ENEMY
          </span>
        ) : <span />}
      </div>

      {/* Card Header Info */}
      <div className="relative z-30 flex flex-col items-center w-full mt-1">
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
        <CharacterSilhouette type={charType} selected={isPlayer || isEnemy} glowColor={glowColor} />
      </div>

      {/* Hover Selection Buttons in Manual Enemy Selection Mode */}
      {customEnemyMode && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3 p-4 z-40">
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-300 font-bold mb-1">
            Assign Role
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectPlayer?.();
            }}
            className={`w-full py-2.5 px-3 rounded text-xs font-mono font-black tracking-widest uppercase transition-all duration-200 cursor-pointer border ${
              isPlayer 
                ? 'bg-red-600 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.8)] scale-102' 
                : 'bg-zinc-900/90 text-zinc-200 border-zinc-700 hover:bg-red-950/80 hover:border-red-500 hover:text-white'
            }`}
          >
            {isPlayer ? '✓ YOU (PLAYER)' : 'PLAY AS YOU'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectEnemy?.();
            }}
            className={`w-full py-2.5 px-3 rounded text-xs font-mono font-black tracking-widest uppercase transition-all duration-200 cursor-pointer border ${
              isEnemy 
                ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.8)] scale-102' 
                : 'bg-zinc-900/90 text-zinc-200 border-zinc-700 hover:bg-purple-950/80 hover:border-purple-500 hover:text-white'
            }`}
          >
            {isEnemy ? '✓ SET AS ENEMY' : 'SET AS ENEMY'}
          </button>
        </div>
      )}
    </div>
  );
}
