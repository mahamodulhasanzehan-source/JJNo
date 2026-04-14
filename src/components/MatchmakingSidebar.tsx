import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, updateDoc, or, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { CharacterType } from '../game/Types';
import { soundManager } from '../game/SoundManager';

interface LobbyEntry {
  id: string;
  name: string;
  character: string;
  lastSeen?: number;
}

interface Match {
  id: string;
  hostId: string;
  guestId: string;
  status: 'preparing' | 'playing' | 'finished';
  offer?: string;
  answer?: string;
  hostCandidates?: string[] | string;
  guestCandidates?: string[] | string;
  hostCharacter?: string;
  guestCharacter?: string;
}

interface MatchmakingSidebarProps {
  selectedCharacter: CharacterType | null;
  onMatchStart: (role: 'host' | 'client', dataChannel: RTCDataChannel, peerConnection: RTCPeerConnection, match: Match) => void;
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
  const onMatchStartRef = useRef(onMatchStart);
  const processedCandidatesRef = useRef<number>(0);
  const isSettingRemoteDescRef = useRef(false);

  useEffect(() => {
    onPreparingRef.current = onPreparing;
  }, [onPreparing]);

  useEffect(() => {
    onMatchStartRef.current = onMatchStart;
  }, [onMatchStart]);

  useEffect(() => {
    // Generate a random player ID if not in localStorage
    let storedId = localStorage.getItem('cursed_combat_player_id');
    if (!storedId) {
      storedId = 'player_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('cursed_combat_player_id', storedId);
    }
    setPlayerId(storedId);
  }, []);

  // Heartbeat to keep lobby entry alive
  useEffect(() => {
    if (!playerId || !inQueue) return;
    
    const interval = setInterval(async () => {
      try {
        await updateDoc(doc(db, 'lobbies', playerId), { lastSeen: Date.now() });
      } catch (e) {
        // If document doesn't exist, we might have been removed or matched
      }
    }, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }, [playerId, inQueue]);

  useEffect(() => {
    if (!playerId) return;

    const q = query(collection(db, 'lobbies'));
    const unsubscribeLobby = onSnapshot(q, (snapshot) => {
      const entries: LobbyEntry[] = [];
      const now = Date.now();
      snapshot.forEach((doc) => {
        const data = doc.data() as LobbyEntry;
        // Filter out stale entries (older than 30 seconds)
        if (!data.lastSeen || (now - data.lastSeen < 30000)) {
          entries.push(data);
        }
      });
      setLobby(entries);
    }, (error) => {
      console.error("Error listening to lobbies:", error);
    });

    // Listen for matches where I am host or guest
    const qMatches = query(
      collection(db, 'matches'),
      or(
        where('hostId', '==', playerId),
        where('guestId', '==', playerId)
      )
    );

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
      } else if (matchData.status === 'playing') {
        // Always keep ref updated to latest data for async operations
        matchRef.current = matchData;
      }

      // Handle signaling
      if (matchData.status === 'playing' && pcRef.current) {
        const pc = pcRef.current;
        
        if (role === 'host' && matchData.answer && matchData.answer !== 'undefined' && pc.signalingState === 'have-local-offer' && !isSettingRemoteDescRef.current) {
          console.log('Host received answer, setting remote description...');
          isSettingRemoteDescRef.current = true;
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(matchData.answer)));
            console.log('Host set remote description successfully.');
          } catch (e) { console.error('Error setting remote answer:', e); }
          finally { isSettingRemoteDescRef.current = false; }
        }
        
        if (role === 'client' && matchData.offer && matchData.offer !== 'undefined' && pc.signalingState === 'stable' && !pc.remoteDescription && !isSettingRemoteDescRef.current) {
          console.log('Client received offer, setting remote description...');
          isSettingRemoteDescRef.current = true;
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(matchData.offer)));
            console.log('Client set remote description successfully. Creating answer...');
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log('Client set local description successfully. Sending answer...');
            if (answer) {
              await updateDoc(doc(db, 'matches', matchData.id), { answer: JSON.stringify(answer) });
            }
          } catch (e) { console.error('Error handling offer:', e); }
          finally { isSettingRemoteDescRef.current = false; }
        }

        // Handle ICE candidates
        const latestMatchData = matchRef.current || matchData;
        const candidatesData = role === 'host' ? latestMatchData.guestCandidates : latestMatchData.hostCandidates;
        if (candidatesData && pc.remoteDescription) {
          let candidates: any[] = [];
          if (typeof candidatesData === 'string') {
            try { candidates = JSON.parse(candidatesData); } catch(e) {}
          } else if (Array.isArray(candidatesData)) {
            candidates = candidatesData.map(c => typeof c === 'string' ? JSON.parse(c) : c);
          }
          
          if (candidates.length > processedCandidatesRef.current) {
            console.log(`Processing ${candidates.length - processedCandidatesRef.current} new ICE candidates...`);
            for (let i = processedCandidatesRef.current; i < candidates.length; i++) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidates[i]));
              } catch (e) {
                console.error('Error adding ICE candidate', e);
              }
            }
            processedCandidatesRef.current = candidates.length;
            console.log('Finished processing ICE candidates.');
          }
        }
      }
    };

    const unsubscribeMatches = onSnapshot(qMatches, (snapshot) => {
      snapshot.forEach(doc => handleMatchUpdate({ id: doc.id, ...doc.data() } as Match));
    }, (error) => {
      console.error("Error listening to matches:", error);
    });

    return () => {
      unsubscribeLobby();
      unsubscribeMatches();
      if (playerId) {
        deleteDoc(doc(db, 'lobbies', playerId)).catch(console.error);
      }
    };
  }, [playerId]);

  const setupWebRTC = async (matchData: Match, role: 'host' | 'client') => {
    const configuration = { 
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject"
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject"
        },
        {
          urls: "turn:openrelay.metered.ca:443?transport=tcp",
          username: "openrelayproject",
          credential: "openrelayproject"
        }
      ] 
    };
    const pc = new RTCPeerConnection(configuration);
    pcRef.current = pc;
    processedCandidatesRef.current = 0;
    isSettingRemoteDescRef.current = false;

    const candidateQueue: any[] = [];
    let candidateTimeout: any = null;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        candidateQueue.push(event.candidate.toJSON());
        
        if (!candidateTimeout) {
          candidateTimeout = setTimeout(async () => {
            const candidatesToSend = [...candidateQueue];
            candidateQueue.length = 0;
            candidateTimeout = null;
            
            if (candidatesToSend.length > 0) {
              const field = role === 'host' ? 'hostCandidates' : 'guestCandidates';
              try {
                const stringifiedCandidates = candidatesToSend.map(c => JSON.stringify(c));
                await updateDoc(doc(db, 'matches', matchData.id), { 
                  [field]: arrayUnion(...stringifiedCandidates) 
                });
              } catch (e) {
                console.error('Error sending candidates:', e);
              }
            }
          }, 500);
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setStatus('Connected!');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setStatus('Connection failed. Please refresh.');
      }
    };

    if (role === 'host') {
      const dc = pc.createDataChannel('game_sync', { negotiated: true, id: 0 });
      dc.onopen = () => {
        console.log('Data channel opened (host)');
        onMatchStartRef.current('host', dc, pc, matchData);
      };
      
      console.log('Host creating offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('Host set local description successfully. Sending offer...');
      if (offer) {
        await updateDoc(doc(db, 'matches', matchData.id), { offer: JSON.stringify(offer) });
      }
    } else {
      const dc = pc.createDataChannel('game_sync', { negotiated: true, id: 0 });
      dc.onopen = () => {
        console.log('Data channel opened (client)');
        onMatchStartRef.current('client', dc, pc, matchData);
      };
    }
  };

  const handleQ2Play = async () => {
    if (!playerId) return;
    soundManager.playClick();
    
    try {
      await setDoc(doc(db, 'lobbies', playerId), { 
        id: playerId, 
        name: `Player_${playerId.substring(0, 4)}`,
        character: selectedCharacter || '?',
        lastSeen: Date.now()
      });
      
      setInQueue(true);
      setStatus('Waiting in queue...');
    } catch (e) {
      console.error("Error joining queue:", e);
      setStatus('Error joining queue. Check console.');
    }
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
    
    // Deterministic match ID prevents duplicate matches if both click FIGHT
    const matchId = [playerId, targetId].sort().join('_');
    const isHost = playerId < targetId;
    
    const matchDocRef = doc(db, 'matches', matchId);
    await setDoc(matchDocRef, {
      id: matchId,
      hostId: isHost ? playerId : targetId,
      guestId: isHost ? targetId : playerId,
      status: 'preparing',
      createdAt: Date.now()
    }, { merge: true });
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
