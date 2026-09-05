// src/services/websocket.ts

import { authService } from './authService';

// تعریف تایپ برای توابع callback که به متد connect پاس داده می‌شوند
type OnMessageCallback = (data: unknown) => void;
type OnErrorCallback = (error: Event | Error) => void;

// Security fix (C-5): documented 4401 / 4403 close-code handling.
// 4001 = generic auth failure (PR-3 / backend default)
// 4401 = cookie missing/expired — try a refresh then reconnect once
// 4403 = forbidden (e.g. role/perms) — do NOT reconnect
const CLOSE_AUTH_FAILED = 4001;
const CLOSE_TOKEN_EXPIRED = 4401;
const CLOSE_FORBIDDEN = 4403;
const CLOSE_NORMAL = 1000;

class WebSocketService {
  // تعریف پراپرتی‌های کلاس با تایپ‌های مشخص
  private socket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  // Security fix (C-5): a single refresh attempt per disconnect cycle.
  // Without this guard, a refresh-and-retry loop would amplify a 4401
  // storm.
  private refreshInFlight: boolean = false;

  /**
   * اتصال به وب‌سوکت
   * @param url آدرس وب‌سوکت سرور (e.g. `/ws/notifications/` or `/ws/projects/foo/`)
   * @param onMessage تابعی که پس از دریافت پیام اجرا می‌شود
   * @param onError تابعی که در صورت بروز خطا اجرا می‌شود
   *
   * PR-6: auth no longer embeds the JWT in the URL. The browser sends
   * the HttpOnly `ws_access` cookie automatically on the upgrade
   * request, provided the WebSocket endpoint is same-origin (or proxied
   * to the same origin — see `vite.config.ts`). The backend
   * `config/websocket_auth.py` reads the cookie from the Cookie header.
   *
   * Reconnect strategy (C-5): the server may close with 4001/4401 if
   * the cookie is missing/expired, or 4403 if the user is not allowed
   * on the channel. For 4001/4401 we attempt ONE refresh via
   * `authService.refresh()` (cookie-based; hits /accounts/auth/refresh/
   * which sets a new ws_access cookie) and then reconnect. If the
   * refresh fails, we surface a fatal error to the caller — the
   * AuthContext will detect the next 401 and force re-login. For 4403
   * we never reconnect. For any other non-1000 code we use exponential
   * backoff up to maxReconnectAttempts.
   */
  public connect(url: string, onMessage?: OnMessageCallback, onError?: OnErrorCallback): void {
    // اگر اتصال از قبل برقرار است، کاری نکن
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected.');
      return;
    }

    // The browser attaches the HttpOnly `ws_access` cookie on the
    // upgrade request. We do not read or include the token in the URL.
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0; // ریست کردن شمارنده تلاش برای اتصال مجدد
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const data: unknown = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (err) {
        // Non-JSON frames are surfaced as a parse error. We don't
        // crash the socket; the caller decides what to do.
        console.error('WebSocket message parse error:', err);
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    this.socket.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };

    this.socket.onclose = (event: CloseEvent) => {
      console.log('WebSocket disconnected', event.reason, event.code);
      this.handleClose(event, url, onMessage, onError);
    };
  }

  // Security fix (C-5): single place that decides whether to reconnect,
  // refresh, or give up. Previously this logic was inlined in onclose
  // and silently looped on auth failures.
  private handleClose(
    event: CloseEvent,
    url: string,
    onMessage?: OnMessageCallback,
    onError?: OnErrorCallback
  ): void {
    // Normal close — nothing to do.
    if (event.code === CLOSE_NORMAL) {
      return;
    }

    // Auth failures — try ONE refresh, then reconnect. If refresh is
    // already in flight (concurrent disconnects on different sockets),
    // wait it out instead of stacking requests.
    if (event.code === CLOSE_TOKEN_EXPIRED || event.code === CLOSE_AUTH_FAILED) {
      if (this.refreshInFlight) {
        // A refresh is already running; it'll set a new cookie, and
        // the next explicit `connect()` call from the caller will
        // succeed. We do not auto-reconnect here to avoid stampedes.
        if (onError) onError(new Error('Authentication refresh in progress'));
        return;
      }
      this.refreshInFlight = true;
      authService
        .refresh()
        .then(() => {
          this.refreshInFlight = false;
          this.reconnectAttempts = 0;
          this.connect(url, onMessage, onError);
        })
        .catch(() => {
          this.refreshInFlight = false;
          // Refresh failed — surface a fatal error. The caller (or
          // AuthContext via the next 401) will route to /login.
          if (onError) onError(new Error('Authentication failed'));
        });
      return;
    }

    // Forbidden — never reconnect. The user simply isn't allowed on
    // this channel.
    if (event.code === CLOSE_FORBIDDEN) {
      if (onError) onError(new Error('Forbidden'));
      return;
    }

    // Any other non-1000 close: exponential-ish backoff (1s, 2s, 3s…)
    // up to maxReconnectAttempts.
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = 1000 * this.reconnectAttempts;
      console.log(
        `WebSocket reconnecting... Attempt ${this.reconnectAttempts} in ${delay}ms`
      );
      setTimeout(() => {
        this.connect(url, onMessage, onError);
      }, delay);
    } else {
      console.error('Max reconnect attempts reached. Giving up.');
      if (onError) onError(new Error('Max reconnect attempts reached'));
    }
  }

  /**
   * ارسال داده به سرور از طریق وب‌سوکت
   * @param data داده‌ای که باید ارسال شود
   */
  public send(data: unknown): void {
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
      this.socket.close(CLOSE_NORMAL, 'Disconnecting manually');
      this.socket = null;
    }
  }
}

// Export یک نمونه singleton از سرویس
export default new WebSocketService();
