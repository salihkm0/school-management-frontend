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
          // Show a toast asking for permission
          toast(
            (t) => (
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-sm">Enable push notifications?</span>
                <span className="text-xs text-gray-600">Get instant updates about exams, marks, and attendance.</span>
                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={async () => {
                      toast.dismiss(t.id);
                      const permission = await Notification.requestPermission();
                      if (permission === 'granted') {
                        await handleToken();
                        toast.success('Notifications enabled!');
                      }
                    }}
                    className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-emerald-700"
                  >
                    Enable
                  </button>
                  <button 
                    onClick={() => toast.dismiss(t.id)}
                    className="bg-gray-200 text-gray-800 text-xs px-3 py-1.5 rounded-md hover:bg-gray-300"
                  >
                    Not Now
                  </button>
                </div>
              </div>
            ),
            { duration: 10000, position: 'top-center' }
          );
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
