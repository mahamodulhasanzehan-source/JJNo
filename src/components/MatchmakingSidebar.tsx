import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query } from 'firebase/firestore';
import { db } from '../firebase';
import { CharacterType } from '../game/Types';
import { soundManager } from '../game/SoundManager';

interface LobbyEntry {
  id: string;
  name: string;
  character: string;
}

interface MatchmakingSidebarProps {
  selectedCharacter: CharacterType | null;
  onMatchStart: (role: 'host' | 'client', dataChannel: RTCDataChannel, peerConnection: RTCPeerConnection) => void;
}

export default function MatchmakingSidebar({ selectedCharacter, onMatchStart }: MatchmakingSidebarProps) {
  const [lobby, setLobby] = useState<LobbyEntry[]>([]);
  const [inQueue, setInQueue] = useState(false);
  const [status, setStatus] = useState('');
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const roomRef = useRef<string>('');
  const playerId = useRef(`Player_${Math.floor(Math.random()*1000)}`).current;

  useEffect(() => {
    const q = query(collection(db, 'lobbies'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries: LobbyEntry[] = [];
      snapshot.forEach((doc) => entries.push(doc.data() as LobbyEntry));
      setLobby(entries);
    });

    return () => unsubscribe();
  }, []);

  const handleQ2Play = async () => {
    if (!selectedCharacter) {
      alert("Please select a character first!");
      return;
    }
    soundManager.playClick();
    
    await setDoc(doc(db, 'lobbies', playerId), { 
      id: playerId, 
      name: playerId,
      character: selectedCharacter 
    });
    
    setInQueue(true);
    setStatus('Waiting in queue...');
  };

  const handleLeave = async () => {
    soundManager.playClick();
    await deleteDoc(doc(db, 'lobbies', playerId));
    setInQueue(false);
    setStatus('');
  };

  const handleChallenge = (targetId: string) => {
    // WebRTC signaling logic would go here, 
    // but we'll keep the UI for now.
    alert("Challenging feature needs WebRTC signaling update to Firestore!");
  };

  return (
    <div className="w-80 bg-zinc-950 border-l border-zinc-800 h-full flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-4">Multiplayer</h2>
        {!inQueue ? (
          <button 
            onClick={handleQ2Play}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest transition-colors"
          >
            Q2Play
          </button>
        ) : (
          <button 
            onClick={handleLeave}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest transition-colors"
          >
            Remove Entry
          </button>
        )}
        {status && <p className="mt-4 text-sm text-zinc-400 font-mono">{status}</p>}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-4 font-mono">Public Lobby</h3>
        {lobby.filter(e => e.id !== playerId).map(entry => (
          <div key={entry.id} className="p-4 bg-zinc-900 border border-zinc-800 flex justify-between items-center group hover:border-zinc-600 transition-colors">
            <div>
              <p className="text-sm font-bold text-white">{entry.name}</p>
              <p className="text-xs text-zinc-500 font-mono">{entry.character}</p>
            </div>
            <button 
              onClick={() => handleChallenge(entry.id)}
              className="px-3 py-1 bg-white text-black text-xs font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Fight
            </button>
          </div>
        ))}
        {lobby.filter(e => e.id !== playerId).length === 0 && (
          <p className="text-sm text-zinc-600 font-mono text-center mt-8">No players waiting.</p>
        )}
      </div>
    </div>
  );
}
