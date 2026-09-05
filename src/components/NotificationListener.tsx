// src/components/NotificationListener.tsx

import { useEffect } from 'react';
import { toast } from 'react-toastify';
import websocketService from '../services/websocket';

// تعریف تایپ برای یک نوتیفیکیشن برای خوانایی و ایمنی بیشتر
interface Notification {
  id: string; // یا number، بسته به پیاده‌سازی بک‌اند شما
  message: string;
  // ... فیلدهای دیگر نوتیفیکیشن مثل created_at, is_read و ...
}

// تعریف تایپ برای داده‌ای که از وب‌سوکت دریافت می‌کنیم
interface WebSocketMessage {
  type: string;
  notification?: Notification; // چون ممکن است پیام دیگری هم ارسال شود، notification اختیاری است
}

const NotificationListener = () => {
    const WS_BASE = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';
    const WS_URL = `${WS_BASE}/ws/notifications/`;

  useEffect(() => {
    // تایپ کردن پارامتر data با استفاده از تایپی که تعریف کردیم
    const handleMessage = (data: WebSocketMessage) => {
      // اگر نوع پیام، نوتیفیکیشن بود
      if (data.type === 'notification' && data.notification) {
        const { notification } = data;
        
        // نمایش نوتیفیکیشن به صورت toast
        toast.info(notification.message, {
          onClick: () => {
            // ارسال پیام برای خوانده شدن نوتیفیکیشن
            websocketService.send({
              type: 'mark_read',
              notification_id: notification.id,
            });
          },
        });
        
        // در اینجا می‌توانید state مربوط به تعداد نوتیفیکیشن‌های خوانده نشده را آپدیت کنید
        // مثال: dispatch(incrementNotificationCount());
      }
    };

    // تایپ کردن پارامتر error
    const handleError = (error: Event) => {
      console.error('WebSocket error:', error);
      // در اینجا می‌توانید به کاربر اطلاع دهید که ارتباط با سرور قطع شده است
    };

    // اتصال به وب‌سوکت
    // The websocket service types incoming data as `unknown` and the
    // error as `Event | Error` (C-5); we narrow both back to the
    // shapes this component expects.
    const onWsMessage = (data: unknown) => handleMessage(data as WebSocketMessage);
    const onWsError = (error: Event | Error) => handleError(error as Event);
    websocketService.connect(WS_URL, onWsMessage, onWsError);

    // پاکسازی و قطع اتصال هنگام unmount شدن کامپوننت
    return () => {
      websocketService.disconnect();
    };
  }, []); // این افکت فقط یک بار در اولین رندر اجرا می‌شود

  // این کامپوننت یک "شنونده" است و چیزی در UI رندر نمی‌کند
  return null;
};

export default NotificationListener;