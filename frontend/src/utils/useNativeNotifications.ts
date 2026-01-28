/**
 * useNativeNotifications.ts
 *
 * Hook that sends native Windows 10/11 notifications via Electron's Notification API.
 * Falls back to Sonner toasts when not running in Electron.
 *
 * Usage:
 *   const { notify } = useNativeNotifications();
 *   notify({ title: 'New Online Order', body: 'Order #142 from John', urgency: 'critical', actionId: 'online-order-142' });
 */

import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface NotificationPayload {
  title: string;
  body: string;
  /** 'low' | 'normal' | 'critical' */
  urgency?: 'low' | 'normal' | 'critical';
  /** ID sent back on click so renderer can navigate */
  actionId?: string;
}

interface UseNativeNotificationsOptions {
  /** Callback when a notification is clicked — receives the actionId */
  onNotificationClick?: (actionId: string) => void;
}

export function useNativeNotifications(options?: UseNativeNotificationsOptions) {
  const onClickRef = useRef(options?.onNotificationClick);
  onClickRef.current = options?.onNotificationClick;

  const electronAPI = typeof window !== 'undefined' ? (window as any).electronAPI : null;
  const isElectron = !!electronAPI?.showNotification;

  // Listen for notification clicks from main process
  useEffect(() => {
    if (!isElectron) return;

    electronAPI.onNotificationClicked?.((data: { actionId?: string }) => {
      if (data.actionId && onClickRef.current) {
        onClickRef.current(data.actionId);
      }
    });

    return () => {
      electronAPI.removeNotificationClickedListener?.();
    };
  }, [isElectron]);

  const notify = useCallback(
    async (payload: NotificationPayload) => {
      if (isElectron) {
        try {
          await electronAPI.showNotification(payload);
        } catch {
          // Fallback to toast on failure
          toast(payload.title, { description: payload.body });
        }
      } else {
        // Web fallback — use Sonner toast
        toast(payload.title, { description: payload.body });
      }
    },
    [isElectron]
  );

  return { notify, isElectron };
}
