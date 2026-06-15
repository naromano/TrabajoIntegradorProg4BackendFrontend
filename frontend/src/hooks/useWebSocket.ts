import { useEffect, useRef, useCallback, useState } from 'react'
import type { WSMessage } from '../types/websocket'

const WS_URL = "ws://localhost:8000/api/v1/pedidos/ws"

interface UseWebSocketProps {
  onMessage?: (msg: WSMessage) => void
  enabled?: boolean
}

interface UseWebSocketReturn {
  subscribeToOrder: (orderId: number) => void
  unsubscribeFromOrder: (orderId: number) => void
  connected: boolean
}

export function useWebSocket({ onMessage, enabled = true }: UseWebSocketProps): UseWebSocketReturn {
  const wsRef: React.MutableRefObject<WebSocket | null> = useRef<WebSocket | null>(null)
  const onMessageRef: React.MutableRefObject<((msg: WSMessage) => void) | undefined> = useRef(onMessage)
  const [connected, setConnected] = useState<boolean>(false)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    if (!enabled) return

    let cancelled: boolean = false
    let retryCount: number = 0
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let currentWs: WebSocket | null = null

    const closeCleanly = (ws: WebSocket): void => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener("open", () => ws.close(1000), { once: true })
      } else if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000)
      }
    }

    const connect = (): void => {
      if (cancelled) return

      const token: string | null = localStorage.getItem('access_token')
      const wsUrl: string = token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL

      const ws = new WebSocket(wsUrl)
      currentWs = ws
      wsRef.current = ws

      ws.onopen = (): void => {
        if (cancelled) {
          ws.close(1000)
          return
        }
        retryCount = 0
        setConnected(true)
        onMessageRef.current?.({ event: "WS_CONNECTED", data: null })
      }

      ws.onmessage = (event: MessageEvent): void => {
        if (cancelled) return
        try {
          const msg: WSMessage = JSON.parse(event.data as string)
          onMessageRef.current?.(msg)
        } catch {
        }
      }

      ws.onerror = (): void => {
      }

      ws.onclose = (e: CloseEvent): void => {
        if (wsRef.current === ws) wsRef.current = null
        currentWs = null
        setConnected(false)

        const wasNormal: boolean = e.code === 1000
        const wasAuthRejected: boolean = e.code === 1008

        if (cancelled || wasNormal || wasAuthRejected) return

        retryCount++
        const delay: number = Math.min(1000 * 2 ** retryCount, 30000)
        retryTimer = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      cancelled = true
      if (retryTimer !== null) clearTimeout(retryTimer)
      if (currentWs) closeCleanly(currentWs)
      wsRef.current = null
      setConnected(false)
    }
  }, [enabled])

  const subscribeToOrder = useCallback((orderId: number): void => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "subscribe-order", order_id: orderId }))
    }
  }, [])

  const unsubscribeFromOrder = useCallback((orderId: number): void => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "unsubscribe-order", order_id: orderId }))
    }
  }, [])

  return { subscribeToOrder, unsubscribeFromOrder, connected }
}
