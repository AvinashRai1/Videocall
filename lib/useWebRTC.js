'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

export function useWebRTC(roomId) {
  const [status, setStatus] = useState('idle') // idle | connecting | connected | disconnected | full | error
  const [isMuted, setIsMuted] = useState(false)
  const [isCamOff, setIsCamOff] = useState(false)
  const [remoteUserId, setRemoteUserId] = useState(null)

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const socketRef = useRef(null)
  const peerRef = useRef(null)
  const localStreamRef = useRef(null)

  const createPeer = useCallback((targetId, isInitiator) => {
    const peer = new RTCPeerConnection(ICE_SERVERS)

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peer.addTrack(track, localStreamRef.current)
      })
    }

    // ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          to: targetId,
        })
      }
    }

    // Remote stream
    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState
      if (state === 'connected') setStatus('connected')
      else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        setStatus('disconnected')
        setRemoteUserId(null)
      }
    }

    if (isInitiator) {
      peer.createOffer()
        .then(offer => peer.setLocalDescription(offer))
        .then(() => {
          socketRef.current.emit('offer', {
            offer: peer.localDescription,
            to: targetId,
          })
        })
        .catch(console.error)
    }

    peerRef.current = peer
    return peer
  }, [])

  useEffect(() => {
    if (!roomId) return

    let mounted = true

    const init = async () => {
      try {
        // Get media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        })
        localStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        // Connect socket
        const socket = io({ path: '/socket.io' })
        socketRef.current = socket

        socket.on('connect', () => {
          setStatus('connecting')
          socket.emit('join-room', { roomId })
        })

        socket.on('room-full', () => {
          setStatus('full')
        })

        socket.on('room-joined', ({ users }) => {
          // If there's already someone in the room, initiate connection
          if (users.length > 0) {
            const targetId = users[0]
            setRemoteUserId(targetId)
            createPeer(targetId, true)
          }
        })

        socket.on('user-joined', ({ userId }) => {
          // Someone joined, they'll send an offer
          setRemoteUserId(userId)
          createPeer(userId, false)
        })

        socket.on('offer', async ({ offer, from }) => {
          if (!peerRef.current) {
            setRemoteUserId(from)
            createPeer(from, false)
          }
          const peer = peerRef.current
          await peer.setRemoteDescription(new RTCSessionDescription(offer))
          const answer = await peer.createAnswer()
          await peer.setLocalDescription(answer)
          socket.emit('answer', { answer: peer.localDescription, to: from })
        })

        socket.on('answer', async ({ answer }) => {
          if (peerRef.current) {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer))
          }
        })

        socket.on('ice-candidate', async ({ candidate }) => {
          if (peerRef.current && candidate) {
            try {
              await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate))
            } catch (e) { /* ignore */ }
          }
        })

        socket.on('user-left', () => {
          setStatus('disconnected')
          setRemoteUserId(null)
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
          if (peerRef.current) {
            peerRef.current.close()
            peerRef.current = null
          }
        })

        socket.on('disconnect', () => {
          if (mounted) setStatus('disconnected')
        })

      } catch (err) {
        console.error('Media/socket error:', err)
        setStatus('error')
      }
    }

    init()

    return () => {
      mounted = false
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      peerRef.current?.close()
      socketRef.current?.disconnect()
    }
  }, [roomId, createPeer])

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return
    const audio = localStreamRef.current.getAudioTracks()[0]
    if (audio) {
      audio.enabled = !audio.enabled
      setIsMuted(!audio.enabled)
    }
  }, [])

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return
    const video = localStreamRef.current.getVideoTracks()[0]
    if (video) {
      video.enabled = !video.enabled
      setIsCamOff(!video.enabled)
    }
  }, [])

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('leave-room', { roomId })
    socketRef.current?.disconnect()
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    peerRef.current?.close()
  }, [roomId])

  return {
    localVideoRef,
    remoteVideoRef,
    status,
    isMuted,
    isCamOff,
    remoteUserId,
    toggleMute,
    toggleCamera,
    leaveRoom,
  }
}