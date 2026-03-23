'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import styles from './page.module.css'

export default function Home() {
  const router = useRouter()
  const [roomInput, setRoomInput] = useState('')
  const [copied, setCopied] = useState(false)

  const createRoom = () => {
    const id = uuidv4().slice(0, 8)
    router.push(`/room/${id}`)
  }

    const joinRoom = (e: { preventDefault: () => void }) => { 
    e.preventDefault()
    const id = roomInput.trim()
    if (!id) return
    router.push(`/room/${id}`)
  }

  return (
    <main className={styles.main}>
      {/* Background grid */}
      <div className={styles.grid} />
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      <div className={styles.container}>
        <div className={styles.badge}>WebRTC · Peer-to-Peer · Encrypted</div>

        <h1 className={styles.title}>
          <span className={styles.nex}>Nex</span>Call
        </h1>
        <p className={styles.subtitle}>
          Private, zero-server video calls.<br />
          No accounts. No recordings. Just you and them.
        </p>

        <div className={styles.card}>
          <button className={styles.createBtn} onClick={createRoom}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create a new room
          </button>

          <div className={styles.divider}>
            <span>or join existing</span>
          </div>

          <form onSubmit={joinRoom} className={styles.form}>
            <input
              className={styles.input}
              type="text"
              placeholder="Enter room code..."
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              spellCheck={false}
            />
            <button type="submit" className={styles.joinBtn}>
              Join
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
        </div>

        <div className={styles.features}>
          {[
            { icon: '🔒', label: 'End-to-End', sub: 'WebRTC encrypted' },
            { icon: '⚡', label: 'Low Latency', sub: 'Direct P2P connection' },
            { icon: '🚫', label: 'No Signup', sub: 'Works instantly' },
          ].map(f => (
            <div key={f.label} className={styles.feature}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <div>
                <div className={styles.featureLabel}>{f.label}</div>
                <div className={styles.featureSub}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}