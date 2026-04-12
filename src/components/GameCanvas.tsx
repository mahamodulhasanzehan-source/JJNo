import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { CharacterType } from '../game/Types';
import { STAMINA_MAX } from '../game/Constants';
import { soundManager } from '../game/SoundManager';
import { HUD, EndGameScreen } from '../systems/ui_renderer';

interface GameCanvasProps {
  character: CharacterType;
  networkMatch?: {
    role: 'host' | 'client';
    dc: RTCDataChannel;
    pc: RTCPeerConnection;
  };
}

export default function GameCanvas({ character, networkMatch }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [gameState, setGameState] = useState({
    playerHp: 200, playerEnergy: 0, playerStamina: STAMINA_MAX,
    enemyHp: 200, enemyEnergy: 0, enemyStamina: STAMINA_MAX,
    domainActive: false, domainType: null as CharacterType | null, domainTimer: 0,
    gameOver: false, winner: null as 'player' | 'abonant' | null,
    enemyCharacter: 'Yuji' as CharacterType
  });

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const newEngine = new GameEngine(canvas, networkMatch ? 'multi' : 'single', networkMatch ? (networkMatch.role === 'client' ? 'guest' : 'host') : undefined);
    newEngine.player.characterType = character;
    
    if (networkMatch) {
      const dc = networkMatch.dc;
      
      dc.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'state' && newEngine.role === 'guest') {
          newEngine.setState(data.state);
        } else if (data.type === 'input' && newEngine.role === 'host') {
          // Clear old keys
          for (const key in newEngine.opponentInput.keys) {
            newEngine.opponentInput.keys[key] = false;
          }
          // Set new keys
          for (const key of data.input.keys) {
            newEngine.opponentInput.keys[key] = true;
          }
          // Set mouse
          newEngine.opponentInput.mouse = data.input.mouse;
        } else if (data.type === 'sync') {
          if (newEngine.abonant.characterType !== data.characterType) {
            newEngine.abonant.characterType = data.characterType;
          }
        }
      };

      dc.onopen = () => {
        dc.send(JSON.stringify({ type: 'sync', characterType: character }));
      };
      if (dc.readyState === 'open') {
        dc.send(JSON.stringify({ type: 'sync', characterType: character }));
      }

      if (newEngine.role === 'host') {
        newEngine.onStateUpdate = (state) => {
          if (dc.readyState === 'open') {
            dc.send(JSON.stringify({ type: 'state', state }));
          }
        };
      } else if (newEngine.role === 'guest') {
        newEngine.onClientInput = (input) => {
          if (dc.readyState === 'open') {
            dc.send(JSON.stringify({ type: 'input', input }));
          }
        };
      }
    }

    newEngine.start();
    setEngine(newEngine);
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      newEngine.groundY = canvas.height - 50;
    };
    window.addEventListener('resize', handleResize);
    
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
        winner: newEngine.winner,
        enemyCharacter: newEngine.abonant.characterType
      });
    }, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(hudInterval);
      newEngine.stop();
      if (networkMatch) {
        networkMatch.dc.close();
        networkMatch.pc.close();
      }
    };
  }, [character, networkMatch]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white font-sans">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />
      <HUD gameState={gameState} />
      <div className="absolute bottom-4 left-4 text-xs text-gray-400 space-y-1 pointer-events-none font-mono opacity-50">
        <p>[A/D] Move | [Space] Jump | [Shift] Dash</p>
        <p>[E] Energy Blast (5 CE)</p>
        <p>[Q] Cursed Dash (10 CE)</p>
        <p>[C] Domain Expansion (60 CE)</p>
        {networkMatch && <p className="text-red-500 mt-2">Multiplayer Mode: {networkMatch.role.toUpperCase()}</p>}
      </div>
      <EndGameScreen 
        winner={gameState.winner} 
        playerCharacter={character}
        enemyCharacter={gameState.enemyCharacter}
        onRestart={() => { soundManager.playClick(); window.location.reload(); }} 
      />
    </div>
  );
}
