import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lobby, setLobby] = useState<LobbyEntry[]>([]);
  const [inQueue, setInQueue] = useState(false);
  const [status, setStatus] = useState('');
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const roomRef = useRef<string>('');

  useEffect(() => {
    const s = io();
    setSocket(s);

    s.on('lobby_update', (entries: LobbyEntry[]) => {
      setLobby(entries);
    });

    s.on('match_found', async ({ room, role }) => {
      setStatus(`Match found! Connecting as ${role}...`);
      roomRef.current = room;
      setInQueue(false);
      
      const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
      const pc = new RTCPeerConnection(configuration);
      pcRef.current = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          s.emit('webrtc_ice_candidate', { room, candidate: event.candidate });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setStatus('Connected!');
        }
      };

      if (role === 'host') {
        const dc = pc.createDataChannel('game_sync', { negotiated: true, id: 0 });
        dc.onopen = () => onMatchStart('host', dc, pc);
        
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        s.emit('webrtc_offer', { room, offer });
      } else {
        const dc = pc.createDataChannel('game_sync', { negotiated: true, id: 0 });
        dc.onopen = () => onMatchStart('client', dc, pc);
      }
    });

    s.on('webrtc_offer', async (offer) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      s.emit('webrtc_answer', { room: roomRef.current, answer });
    });

    s.on('webrtc_answer', async (answer) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    s.on('webrtc_ice_candidate', async (candidate) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => { s.disconnect(); };
  }, [onMatchStart]);

  const handleQ2Play = () => {
    if (!selectedCharacter) {
      alert("Please select a character first!");
      return;
    }
    soundManager.playClick();
    socket?.emit('join_q2play', { 
      name: `Player_${Math.floor(Math.random()*1000)}`, 
      character: selectedCharacter 
    });
    setInQueue(true);
    setStatus('Waiting in queue...');
  };

  const handleLeave = () => {
    soundManager.playClick();
    socket?.emit('leave_q2play');
    setInQueue(false);
    setStatus('');
  };

  const handleChallenge = (targetId: string) => {
    if (!selectedCharacter) {
      alert("Please select a character first!");
      return;
    }
    soundManager.playClick();
    socket?.emit('challenge_player', targetId);
    setStatus('Challenging player...');
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
        {lobby.filter(e => e.id !== socket?.id).map(entry => (
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
        {lobby.filter(e => e.id !== socket?.id).length === 0 && (
          <p className="text-sm text-zinc-600 font-mono text-center mt-8">No players waiting.</p>
        )}
      </div>
    </div>
  );
}
