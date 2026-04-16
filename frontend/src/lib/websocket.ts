/**
 * WebSocket utilities for Delivery360
 * Handles WebSocket connection, message handling, and reconnection logic
 */

export interface WSMessage {
  type: string;
  data: any;
  timestamp?: number;
  correlationId?: string;
}

export interface WSConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export type WSConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WSConfig;
  private status: WSConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageQueue: WSMessage[] = [];
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private statusListeners: Set<(status: WSConnectionStatus) => void> = new Set();

  constructor(config: WSConfig) {
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...config,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.setStatus('connecting');
        
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.setStatus('connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.setStatus('error');
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.setStatus('disconnected');
          this.stopHeartbeat();
          this.attemptReconnect();
        };
      } catch (error) {
        this.setStatus('error');
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.stopHeartbeat();
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.setStatus('disconnected');
  }

  /**
   * Send message through WebSocket
   */
  send(message: WSMessage): void {
    const enrichedMessage = {
      ...message,
      timestamp: Date.now(),
      correlationId: message.correlationId || this.generateCorrelationId(),
    };

    if (this.status === 'connected' && this.ws) {
      this.ws.send(JSON.stringify(enrichedMessage));
    } else {
      // Queue message for later delivery
      this.messageQueue.push(enrichedMessage);
      console.warn('WebSocket not connected, message queued');
    }
  }

  /**
   * Subscribe to specific message type
   */
  subscribe(messageType: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(messageType)) {
      this.subscribers.set(messageType, new Set());
    }
    
    this.subscribers.get(messageType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(messageType)?.delete(callback);
    };
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(callback: (status: WSConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Get current connection status
   */
  getStatus(): WSConnectionStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message: WSMessage = JSON.parse(data);
      
      // Notify subscribers for this message type
      const subscribers = this.subscribers.get(message.type);
      if (subscribers) {
        subscribers.forEach(callback => callback(message.data));
      }

      // Also notify generic subscribers
      const genericSubscribers = this.subscribers.get('*');
      if (genericSubscribers) {
        genericSubscribers.forEach(callback => callback(message));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping', data: { timestamp: Date.now() } });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Flush queued messages after reconnection
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      if (message && this.ws) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Set connection status and notify listeners
   */
  private setStatus(status: WSConnectionStatus): void {
    this.status = status;
    this.statusListeners.forEach(listener => listener(status));
  }

  /**
   * Generate unique correlation ID
   */
  private generateCorrelationId(): string {
    return `msg_${Date.now}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Create WebSocket client instance
 */
export function createWebSocketClient(config: WSConfig): WebSocketClient {
  return new WebSocketClient(config);
}

/**
 * Get WebSocket URL based on environment
 */
export function getWebSocketUrl(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const protocol = isProduction ? 'wss:' : 'ws:';
  const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
  
  return `${protocol}//${host}/ws`;
}

/**
 * Parse WebSocket message
 */
export function parseWSMessage(data: string): WSMessage | null {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing WebSocket message:', error);
    return null;
  }
}

/**
 * Format WebSocket message for sending
 */
export function formatWSMessage(type: string, data: any, correlationId?: string): WSMessage {
  return {
    type,
    data,
    timestamp: Date.now(),
    correlationId: correlationId || `msg_${Date.now}_${Math.random().toString(36).substr(2, 9)}`,
  };
}

/**
 * Common WebSocket message types
 */
export const WSMessageTypes = {
  // Connection
  PING: 'ping',
  PONG: 'pong',
  
  // Orders
  ORDER_CREATED: 'order_created',
  ORDER_UPDATED: 'order_updated',
  ORDER_ASSIGNED: 'order_assigned',
  ORDER_CANCELLED: 'order_cancelled',
  
  // Deliveries
  DELIVERY_STARTED: 'delivery_started',
  DELIVERY_UPDATED: 'delivery_updated',
  DELIVERY_COMPLETED: 'delivery_completed',
  
  // Riders
  RIDER_LOCATION: 'rider_location',
  RIDER_STATUS_CHANGED: 'rider_status_changed',
  
  // Alerts
  ALERT_CREATED: 'alert_created',
  ALERT_RESOLVED: 'alert_resolved',
  
  // System
  SYSTEM_NOTIFICATION: 'system_notification',
  MAINTENANCE_MODE: 'maintenance_mode',
} as const;
