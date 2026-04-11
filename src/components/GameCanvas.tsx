import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { CharacterType } from '../game/Types';
import { STAMINA_MAX, ENERGY_MAX } from '../game/Constants';
import { soundManager } from '../game/SoundManager';
import { HUD, EndGameScreen } from '../systems/ui_renderer';

interface GameCanvasProps {
  character: CharacterType;
}

export default function GameCanvas({ character }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [gameState, setGameState] = useState({
    playerHp: 100, playerEnergy: 0, playerStamina: STAMINA_MAX,
    enemyHp: 100, enemyEnergy: 0, enemyStamina: STAMINA_MAX,
    domainActive: false, domainType: null as CharacterType | null, domainTimer: 0,
    gameOver: false, winner: null as 'player' | 'abonant' | null
  });

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const newEngine = new GameEngine(canvas);
    newEngine.player.characterType = character;
    newEngine.start();
    setEngine(newEngine);
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      newEngine.groundY = canvas.height - 50;
    };
    window.addEventListener('resize', handleResize);
    
    // HUD Update loop
    const hudInterval = setInterval(() => {
      setGameState({
        playerHp: newEngine.player.hp,
        playerEnergy: newEngine.player.energy,
        playerStamina: newEngine.player.stamina,
        enemyHp: newEngine.abonant.hp,
        enemyEnergy: newEngine.abonant.energy,
        enemyStamina: newEngine.abonant.stamina,
        domainActive: newEngine.domainManager.active,
        domainType: newEngine.domainManager.type,
        domainTimer: newEngine.domainManager.timer,
        gameOver: newEngine.gameOver,
        winner: newEngine.winner
      });
    }, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(hudInterval);
      newEngine.stop();
    };
  }, [character]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white font-sans">
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-0" 
      />
      
      <HUD gameState={gameState} />

      {/* Controls Overlay */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-400 space-y-1 pointer-events-none font-mono opacity-50">
        <p>[A/D] Move | [Space] Jump | [Shift] Dash</p>
        <p>[E] Energy Blast (5 CE)</p>
        <p>[Q] Cursed Dash (10 CE)</p>
        <p>[C] Domain Expansion (60 CE)</p>
      </div>
      
      <EndGameScreen winner={gameState.winner} onRestart={() => { soundManager.playClick(); window.location.reload(); }} />
    </div>
  );
}
