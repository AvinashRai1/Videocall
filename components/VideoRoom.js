'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWebRTC } from '@/lib/useWebRTC'
import styles from './VideoRoom.module.css'

export default function VideoRoom({ roomId }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const {
    localVideoRef,
    remoteVideoRef,  
    status,
    isMuted,
    isCamOff,
    remoteUserId,
    toggleMute,
    toggleCamera,
    leaveRoom,
  } = useWebRTC(roomId)

  const handleLeave = () => {
    leaveRoom()
    router.push('/')
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const statusInfo = {
    idle: { label: 'Initializing...', color: '#64748b' },
    connecting: { label: 'Waiting for someone to join...', color: '#f59e0b' },
    connected: { label: 'Connected', color: '#10b981' },
    disconnected: { label: 'Call ended', color: '#ef4444' },
    full: { label: 'Room is full', color: '#ef4444' },
    error: { label: 'Camera/mic access denied', color: '#ef4444' },
  }

  const info = statusInfo[status] || statusInfo.idle

  return (
    <div className={styles.root}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <span className={styles.logoNex}>Nex</span>Call
          </div>
          <div className={styles.roomCode}>
            <span className={styles.roomLabel}>Room</span>
            <span className={styles.roomId}>{roomId}</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.statusDot} style={{ '--dot-color': info.color }} />
          <span className={styles.statusText} style={{ color: info.color }}>
            {info.label}
          </span>
        </div>
      </header>

      {/* Video area */}
      <div className={styles.videoArea}>
        {/* Remote video (main) */}
        <div className={styles.remoteWrapper}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={styles.remoteVideo}
          />
          {status !== 'connected' && (
            <div className={styles.waitingOverlay}>
              {status === 'connecting' && (
                <>
                  <div className={styles.pulseRing} />
                  <div className={styles.waitingIcon}>
                    <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className={styles.waitingText}>Waiting for someone to join...</p>
                  <button className={styles.copyLinkBtn} onClick={copyLink}>
                    {copied ? (
                      <>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy invite link
                      </>
                    )}
                  </button>
                </>
              )}

              {status === 'disconnected' && (
                <>
                  <div className={styles.endedIcon}>📵</div>
                  <p className={styles.waitingText}>The other person left</p>
                  <button className={styles.copyLinkBtn} onClick={() => router.push('/')}>
                    Back to home
                  </button>
                </>
              )}

              {status === 'full' && (
                <>
                  <div className={styles.endedIcon}>🚫</div>
                  <p className={styles.waitingText}>This room is full</p>
                  <button className={styles.copyLinkBtn} onClick={() => router.push('/')}>
                    Back to home
                  </button>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className={styles.endedIcon}>⚠️</div>
                  <p className={styles.waitingText}>Camera or microphone access denied</p>
                  <p className={styles.waitingSubText}>Please allow access and refresh the page</p>
                </>
              )}

              {status === 'idle' && (
                <div className={styles.spinner} />
              )}
            </div>
          )}
        </div>

        {/* Local video (pip) */}
        <div className={styles.localWrapper}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`${styles.localVideo} ${isCamOff ? styles.camOff : ''}`}
          />
          {isCamOff && (
            <div className={styles.camOffOverlay}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          )}
          <div className={styles.youLabel}>You</div>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <button
          className={`${styles.controlBtn} ${isMuted ? styles.active : ''}`}
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
          <span>{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        <button
          className={`${styles.controlBtn} ${isCamOff ? styles.active : ''}`}
          onClick={toggleCamera}
          title={isCamOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isCamOff ? (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8.5A2.5 2.5 0 015.5 6h7A2.5 2.5 0 0115 8.5v7a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 013 15.5v-7z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          <span>{isCamOff ? 'Start cam' : 'Stop cam'}</span>
        </button>

        <button className={`${styles.controlBtn} ${styles.copyBtn}`} onClick={copyLink}>
          {copied ? (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          <span>{copied ? 'Copied!' : 'Invite'}</span>
        </button>

        <button className={`${styles.controlBtn} ${styles.leaveBtn}`} onClick={handleLeave}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 17l5-5m0 0l-5-5m5 5H9m3 4a9 9 0 100-18 9 9 0 000 18z" />
          </svg>
          <span>Leave</span>
        </button>
      </div>
    </div>
  )
}