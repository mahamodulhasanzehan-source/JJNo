import { io, Socket } from 'socket.io-client';

export type Role = 'host' | 'guest';

export class WebRTCManager {
  socket: Socket | null = null;
  peerConnection: RTCPeerConnection | null = null;
  dataChannel: RTCDataChannel | null = null;
  roomId: string | null = null;
  role: Role | null = null;

  onMatchFound?: (role: Role) => void;
  onData?: (data: any) => void;
  onDisconnect?: () => void;
  onConnected?: () => void;

  constructor() {}

  connect() {
    this.socket = io(window.location.origin);

    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
    });

    this.socket.on('waiting_for_match', () => {
      console.log('Waiting for match...');
    });

    this.socket.on('match_found', async ({ roomId, role }) => {
      console.log('Match found!', roomId, role);
      this.roomId = roomId;
      this.role = role as Role;
      
      this.setupPeerConnection();

      if (this.role === 'host') {
        const offer = await this.peerConnection!.createOffer();
        await this.peerConnection!.setLocalDescription(offer);
        this.socket!.emit('webrtc_offer', { offer, roomId });
      }

      if (this.onMatchFound) this.onMatchFound(this.role);
    });

    this.socket.on('webrtc_offer', async ({ offer }) => {
      if (!this.peerConnection) return;
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.socket!.emit('webrtc_answer', { answer, roomId: this.roomId });
    });

    this.socket.on('webrtc_answer', async ({ answer }) => {
      if (!this.peerConnection) return;
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    this.socket.on('webrtc_ice_candidate', async ({ candidate }) => {
      if (!this.peerConnection) return;
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding received ice candidate', e);
      }
    });

    this.socket.on('opponent_disconnected', () => {
      console.log('Opponent disconnected');
      if (this.onDisconnect) this.onDisconnect();
      this.disconnect();
    });
  }

  joinMatchmaking() {
    if (!this.socket) this.connect();
    this.socket!.emit('join_matchmaking');
  }

  setupPeerConnection() {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ]
    };
    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket!.emit('webrtc_ice_candidate', {
          candidate: event.candidate,
          roomId: this.roomId
        });
      }
    };

    if (this.role === 'host') {
      this.dataChannel = this.peerConnection.createDataChannel('game_state');
      this.setupDataChannel();
    } else {
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel();
      };
    }
  }

  setupDataChannel() {
    if (!this.dataChannel) return;
    
    this.dataChannel.onopen = () => {
      console.log('Data channel open');
      if (this.onConnected) this.onConnected();
    };

    this.dataChannel.onmessage = (event) => {
      if (this.onData) {
        try {
          const data = JSON.parse(event.data);
          this.onData(data);
        } catch (e) {
          console.error('Error parsing data channel message', e);
        }
      }
    };

    this.dataChannel.onclose = () => {
      console.log('Data channel closed');
      if (this.onDisconnect) this.onDisconnect();
    };
  }

  send(data: any) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.roomId = null;
    this.role = null;
  }
}

export const webrtcManager = new WebRTCManager();
