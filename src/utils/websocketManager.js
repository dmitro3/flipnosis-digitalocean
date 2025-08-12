class WebSocketManager {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(url) {
    try {
      if (this.ws?.readyState === WebSocket.OPEN) {
        return;
      }

      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onerror = (error) => {
        console.warn('⚠️ WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('🔄 WebSocket closed, attempting reconnect...');
        this.reconnect(url);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Dispatch custom event for global handlers
          window.dispatchEvent(new CustomEvent('websocketMessage', { detail: data }));
        } catch (e) {
          console.warn('⚠️ Failed to parse WebSocket message:', e);
        }
      };
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.reconnect(url);
    }
  }

  reconnect(url) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => {
      console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}...`);
      this.connect(url);
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket not ready, queuing message');
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

export default new WebSocketManager();
