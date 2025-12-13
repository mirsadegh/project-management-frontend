// src/services/websocket.ts

// تعریف تایپ برای توابع callback که به متد connect پاس داده می‌شوند
type OnMessageCallback = (data: any) => void;
type OnErrorCallback = (error: Event) => void;

class WebSocketService {
  // تعریف پراپرتی‌های کلاس با تایپ‌های مشخص
  private socket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private readonly reconnectDelay: number = 3000;

  /**
   * اتصال به وب‌سوکت
   * @param url آدرس وب‌سوکت سرور
   * @param onMessage تابعی که پس از دریافت پیام اجرا می‌شود
   * @param onError تابعی که در صورت بروز خطا اجرا می‌شود
   */
  public connect(url: string, onMessage?: OnMessageCallback, onError?: OnErrorCallback): void {
    // اگر اتصال از قبل برقرار است، کاری نکن
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    // اگر توکن وجود ندارد، اتصال برقرار نمی‌شود
    if (!token) {
        console.error('Cannot connect to WebSocket: No access token found.');
        return;
    }
    
    const wsUrl = `${url}?token=${token}`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0; // ریست کردن شمارنده تلاش برای اتصال مجدد
    };

    this.socket.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (onMessage) onMessage(data);
    };

    this.socket.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };

    this.socket.onclose = (event: CloseEvent) => {
      console.log('WebSocket disconnected', event.reason, event.code);
      // اگر اتصال به صورت عادی (با کد 1000) بسته نشده باشد، برای اتصال مجدد تلاش کن
      if (event.code !== 1000) {
        this.attemptReconnect(url, onMessage, onError);
      }
    };
  }

  /**
   * تلاش برای اتصال مجدد در صورت قطعی
   */
  private attemptReconnect(url: string, onMessage?: OnMessageCallback, onError?: OnErrorCallback): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`WebSocket reconnecting... Attempt ${this.reconnectAttempts}`);
      
      setTimeout(() => {
        this.connect(url, onMessage, onError);
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnect attempts reached. Giving up.');
    }
  }

  /**
   * ارسال داده به سرور از طریق وب‌سوکت
   * @param data داده‌ای که باید ارسال شود
   */
  public send(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected. Cannot send message.');
    }
  }

  /**
   * قطع کردن اتصال وب‌سوکت
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'Disconnecting manually'); // کد 1000 یعنی بستن عادی
      this.socket = null;
    }
  }
}

// Export یک نمونه singleton از سرویس
export default new WebSocketService();