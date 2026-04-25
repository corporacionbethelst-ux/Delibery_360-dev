// Hook personalizado para actualizaciones en tiempo real via WebSocket
import { useEffect, useCallback, useRef } from 'react';
import { useRealtimeStore } from '@/stores/realtimeStore';
import type { Order } from '@/types/order';
import type { Delivery } from '@/types/delivery';
import type { Rider } from '@/types/rider';
import type { Alert } from '@/types/alerts';

// Tipos adicionales necesarios para el contexto
export interface OrderUpdate { orderId: string; data: any }
export interface DeliveryUpdate { deliveryId: string; data: any }
export interface RiderLocationUpdate { data: any }
export interface AlertMessage { data: any }

export interface UseRealtimeUpdatesOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number; // en ms
  onOrderUpdate?: (order: Order) => void;
  onDeliveryUpdate?: (delivery: Delivery) => void;
  onRiderUpdate?: (rider: Rider) => void;
  onAlert?: (alert: Alert) => void;
}

interface UseRealtimeUpdatesReturn {
  // Estado de conexión (Nombres corregidos para coincidir con el contexto)
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: string | null; // Antes era lastMessageAt (Date)
  connectionError: string | null; // Antes era error
  
  // Datos en tiempo real
  activeOrders: Order[];
  activeDeliveries: Delivery[];
  onlineRiders: Rider[];
  alerts: Alert[];
  
  // Acciones
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  sendMessage: (message: any) => void; // NUEVO: Función faltante
  
  // Utilidades
  getOrderById: (id: string) => Order | undefined;
  getDeliveryById: (id: string) => Delivery | undefined;
  getRiderById: (id: string) => Rider | undefined;
  dismissAlert: (alertId: string) => void;
}

const defaultOptions: UseRealtimeUpdatesOptions = {
  autoConnect: true,
  reconnectAttempts: 3,
  reconnectInterval: 5000,
};

export const useRealtimeUpdates = (options: UseRealtimeUpdatesOptions = {}): UseRealtimeUpdatesReturn => {
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Suscribirse al store de realtime
  const {
    isConnected,
    isConnecting,
    lastMessageAt,
    error,
    activeOrders,
    activeDeliveries,
    onlineRiders,
    alerts,
    connect,
    disconnect,
    reconnect: storeReconnect,
    updateOrder,
    updateDelivery,
    updateRider,
    addAlert,
    dismissAlert,
    setConnected,
    setError,
  } = useRealtimeStore();
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef<number>(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageRef = useRef<string | null>(null); // Para almacenar el último mensaje crudo

  // Construir URL del WebSocket
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_URL || window.location.host;
    const token = localStorage.getItem('access_token'); // Ajustado al nombre real del token
    
    return `${protocol}//${host}/api/v1/ws?token=${token}`; // Ajusta la ruta según tu backend
  }, []);

  // Manejar mensaje recibido
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const rawData = event.data as string;
      lastMessageRef.current = rawData; // Guardar el mensaje crudo para el estado
      const data = JSON.parse(rawData);
      
      switch (data.type) {
        case 'ORDER_UPDATE':
          updateOrder(data.payload as Order);
          mergedOptions.onOrderUpdate?.(data.payload as Order);
          break;
          
        case 'DELIVERY_UPDATE':
          updateDelivery(data.payload as Delivery);
          mergedOptions.onDeliveryUpdate?.(data.payload as Delivery);
          break;
          
        case 'RIDER_UPDATE':
          updateRider(data.payload as Rider);
          mergedOptions.onRiderUpdate?.(data.payload as Rider);
          break;
          
        case 'ALERT':
          addAlert(data.payload as Alert);
          mergedOptions.onAlert?.(data.payload as Alert);
          break;
          
        case 'PING':
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'PONG' }));
          }
          break;
          
        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  }, [updateOrder, updateDelivery, updateRider, addAlert, mergedOptions]);

  // Manejar apertura de conexión
  const handleOpen = useCallback(() => {
    console.log('WebSocket connected');
    setConnected(true);
    setError(null);
    reconnectCountRef.current = 0;
    
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, [setConnected, setError]);

  // Manejar cierre de conexión
  const handleClose = useCallback(() => {
    console.log('WebSocket disconnected');
    setConnected(false);
    
    if (reconnectCountRef.current < (mergedOptions.reconnectAttempts || 3)) {
      reconnectCountRef.current += 1;
      console.log(`Reconnecting... attempt ${reconnectCountRef.current}`);
      
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, mergedOptions.reconnectInterval);
    } else {
      setError('Unable to connect to real-time updates. Please refresh the page.');
    }
  }, [setConnected, setError, connect, mergedOptions.reconnectAttempts, mergedOptions.reconnectInterval]);

  // Manejar error
  const handleError = useCallback((event: Event) => {
    console.error('WebSocket error:', event);
    setError('Connection error. Attempting to reconnect...');
  }, [setError]);

  // Conectar al WebSocket
  const establishConnection = useCallback(() => {
    if (!mergedOptions.autoConnect) return;
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    try {
      const url = getWebSocketUrl();
      wsRef.current = new WebSocket(url);
      
      wsRef.current.onmessage = handleMessage;
      wsRef.current.onopen = handleOpen;
      wsRef.current.onclose = handleClose;
      wsRef.current.onerror = handleError;
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to establish connection');
    }
  }, [mergedOptions.autoConnect, getWebSocketUrl, handleMessage, handleOpen, handleClose, handleError, setError]);

  // Desconectar
  const disconnectWs = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    disconnect();
  }, [disconnect]);

  // NUEVO: Enviar mensaje
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket is not connected');
    }
  }, []);

  // Reconectar manualmente
  const manualReconnect = useCallback(() => {
    reconnectCountRef.current = 0;
    establishConnection();
  }, [establishConnection]);

  // Utilidades para buscar entidades
  const getOrderById = useCallback((id: string): Order | undefined => {
    return activeOrders.find(o => o.id === id);
  }, [activeOrders]);

  const getDeliveryById = useCallback((id: string): Delivery | undefined => {
    return activeDeliveries.find(d => d.id === id);
  }, [activeDeliveries]);

  const getRiderById = useCallback((id: string): Rider | undefined => {
    return onlineRiders.find(r => r.id === id);
  }, [onlineRiders]);

  // Auto-connect al montar
  useEffect(() => {
    if (mergedOptions.autoConnect) {
      establishConnection();
    }
    
    return () => {
      disconnectWs();
    };
  }, [mergedOptions.autoConnect, establishConnection, disconnectWs]);

  return {
    // Estado de conexión (Mapeo de nombres corregidos)
    isConnected,
    isConnecting,
    lastMessage: lastMessageRef.current, // Usamos el ref o null
    connectionError: error, // Mapeamos error a connectionError
    
    // Datos en tiempo real
    activeOrders,
    activeDeliveries,
    onlineRiders,
    alerts,
    
    // Acciones
    connect: establishConnection,
    disconnect: disconnectWs,
    reconnect: manualReconnect,
    sendMessage, // Retornamos la nueva función
    
    // Utilidades
    getOrderById,
    getDeliveryById,
    getRiderById,
    dismissAlert,
  };
};

export default useRealtimeUpdates;