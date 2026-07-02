import { useEffect, useState } from 'react';
import { requestForToken, onMessageListener } from '../config/firebase';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useFCMToken = (isAuthenticated) => {
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    let unsubscribe = null;

    const setupFCM = async () => {
      if (!isAuthenticated) return;

      try {
        const handleToken = async () => {
          const token = await requestForToken();
          if (token) {
            setFcmToken(token);
            await api.post('/notifications/register-token', {
              token,
              deviceInfo: {
                browser: navigator.userAgent,
                platform: navigator.platform
              }
            });
            console.log("FCM Token registered successfully");
          }
        };

        if (Notification.permission === 'granted') {
          await handleToken();
        } else if (Notification.permission === 'default') {
          // Directly trigger the native browser permission dialog
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            await handleToken();
          }
        }

        // Setup message listener
        onMessageListener().then((payload) => {
          console.log("Received foreground message: ", payload);
          
          const title = payload.notification?.title || payload.data?.title || 'New Notification';
          const body = payload.notification?.body || payload.data?.message || '';
          const link = payload.data?.link || '/notifications';
          
          toast(
            (t) => (
              <div 
                className="flex flex-col cursor-pointer"
                onClick={() => {
                  toast.dismiss(t.id);
                  if (link) window.location.href = link;
                }}
              >
                <span className="font-semibold">{title}</span>
                <span className="text-sm text-gray-600">{body}</span>
                {link && <span className="text-xs text-emerald-600 mt-1">Click to view</span>}
              </div>
            ),
            {
              duration: 6000,
              icon: '🔔',
            }
          );
          
          // Re-attach listener since it resolves once
          setupFCM();
        }).catch((err) => console.log('Failed to listen for messages', err));
        
      } catch (error) {
        console.error("Error setting up FCM:", error);
      }
    };

    setupFCM();

    return () => {
      // Cleanup if needed
    };
  }, [isAuthenticated]);

  return { fcmToken };
};

export default useFCMToken;
