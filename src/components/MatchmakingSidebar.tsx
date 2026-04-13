import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CharacterType } from '../game/Types';
import { soundManager } from '../game/SoundManager';

interface LobbyEntry {
  id: string;
  name: string;
  character: string;
}

interface Match {
  id: string;
  hostId: string;
  guestId: string;
  status: 'preparing' | 'playing' | 'finished';
  offer?: string;
  answer?: string;
  hostCandidates?: string;
  guestCandidates?: string;
  hostCharacter?: string;
  guestCharacter?: string;
}

interface MatchmakingSidebarProps {
  selectedCharacter: CharacterType | null;
  onMatchStart: (role: 'host' | 'client', dataChannel: RTCDataChannel, peerConnection: RTCPeerConnection) => void;
  onPreparing: (match: Match, role: 'host' | 'client') => void;
}

export default function MatchmakingSidebar({ selectedCharacter, onMatchStart, onPreparing }: MatchmakingSidebarProps) {
  const [lobby, setLobby] = useState<LobbyEntry[]>([]);
  const [inQueue, setInQueue] = useState(false);
  const [status, setStatus] = useState('');
  const [playerId, setPlayerId] = useState<string>('');
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const matchRef = useRef<Match | null>(null);
  const onPreparingRef = useRef(onPreparing);

  useEffect(() => {
    onPreparingRef.current = onPreparing;
  }, [onPreparing]);

  useEffect(() => {
    // Generate a random player ID if not in localStorage
    let storedId = localStorage.getItem('cursed_combat_player_id');
    if (!storedId) {
      storedId = 'player_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('cursed_combat_player_id', storedId);
    }
    setPlayerId(storedId);
  }, []);

  useEffect(() => {
    if (!playerId) return;

    const q = query(collection(db, 'lobbies'));
    const unsubscribeLobby = onSnapshot(q, (snapshot) => {
      const entries: LobbyEntry[] = [];
      snapshot.forEach((doc) => entries.push(doc.data() as LobbyEntry));
      setLobby(entries);
    });

    // Listen for matches where I am host or guest
    const qHost = query(collection(db, 'matches'), where('hostId', '==', playerId));
    const qGuest = query(collection(db, 'matches'), where('guestId', '==', playerId));

    const handleMatchUpdate = async (matchData: Match) => {
      // Ignore finished matches or matches that are not our current active match
      if (matchData.status === 'finished') return;
      if (matchRef.current && matchRef.current.id !== matchData.id) return;

      const role = matchData.hostId === playerId ? 'host' : 'client';
      
      if (matchData.status === 'preparing' && (!matchRef.current || matchRef.current.status !== 'preparing')) {
        matchRef.current = matchData;
        setStatus('Match found! Preparing...');
        setInQueue(false);
        // Remove from lobby
        try {
          await deleteDoc(doc(db, 'lobbies', playerId));
        } catch (e) {
          console.warn('Failed to delete lobby entry:', e);
        }
        onPreparingRef.current(matchData, role);
      }

      if (matchData.status === 'playing' && matchRef.current?.status !== 'playing') {
        matchRef.current = matchData;
        setStatus('Connecting peer...');
        setupWebRTC(matchData, role);
      }

      // Handle signaling
      if (role === 'host' && matchData.answer && matchData.answer !== 'undefined' && pcRef.current?.signalingState === 'have-local-offer') {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(JSON.parse(matchData.answer)));
        } catch (e) { console.error('Error setting remote answer:', e); }
      }
      if (role === 'client' && matchData.offer && matchData.offer !== 'undefined' && pcRef.current?.signalingState === 'stable' && !pcRef.current.remoteDescription) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(JSON.parse(matchData.offer)));
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          if (answer) {
            await updateDoc(doc(db, 'matches', matchData.id), { answer: JSON.stringify(answer) });
          }
        } catch (e) { console.error('Error handling offer:', e); }
      }

      // Handle ICE candidates
      const candidatesStr = role === 'host' ? matchData.guestCandidates : matchData.hostCandidates;
      if (candidatesStr && pcRef.current?.remoteDescription) {
        const candidates = JSON.parse(candidatesStr);
        for (const c of candidates) {
          try {
            await pcRef.current?.addIceCandidate(new RTCIceCandidate(c));
          } catch (e) {
            console.error('Error adding ICE candidate', e);
          }
        }
      }
    };

    const unsubscribeHost = onSnapshot(qHost, (snapshot) => {
      snapshot.forEach(doc => handleMatchUpdate({ id: doc.id, ...doc.data() } as Match));
    });
    const unsubscribeGuest = onSnapshot(qGuest, (snapshot) => {
      snapshot.forEach(doc => handleMatchUpdate({ id: doc.id, ...doc.data() } as Match));
    });

    return () => {
      unsubscribeLobby();
      unsubscribeHost();
      unsubscribeGuest();
      if (playerId) {
        deleteDoc(doc(db, 'lobbies', playerId)).catch(console.error);
      }
    };
  }, [playerId]);

  const setupWebRTC = async (matchData: Match, role: 'host' | 'client') => {
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const pc = new RTCPeerConnection(configuration);
    pcRef.current = pc;

    const candidates: RTCIceCandidateInit[] = [];
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        candidates.push(event.candidate.toJSON());
        const field = role === 'host' ? 'hostCandidates' : 'guestCandidates';
        await updateDoc(doc(db, 'matches', matchData.id), { [field]: JSON.stringify(candidates) });
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
      if (offer) {
        await updateDoc(doc(db, 'matches', matchData.id), { offer: JSON.stringify(offer) });
      }
    } else {
      const dc = pc.createDataChannel('game_sync', { negotiated: true, id: 0 });
      dc.onopen = () => onMatchStart('client', dc, pc);
    }
  };

  const handleQ2Play = async () => {
    if (!playerId) return;
    soundManager.playClick();
    
    await setDoc(doc(db, 'lobbies', playerId), { 
      id: playerId, 
      name: `Player_${playerId.substring(0, 4)}`,
      character: selectedCharacter || '?' 
    });
    
    setInQueue(true);
    setStatus('Waiting in queue...');
  };

  const handleLeave = async () => {
    if (!playerId) return;
    soundManager.playClick();
    await deleteDoc(doc(db, 'lobbies', playerId));
    setInQueue(false);
    setStatus('');
  };

  const handleChallenge = async (targetId: string) => {
    if (!playerId) return;
    soundManager.playClick();
    setStatus('Challenging player...');
    
    // Create match
    const matchDocRef = doc(collection(db, 'matches'));
    await setDoc(matchDocRef, {
      id: matchDocRef.id,
      hostId: playerId,
      guestId: targetId,
      status: 'preparing',
      createdAt: Date.now()
    });
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
