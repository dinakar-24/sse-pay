import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SessionInfo {
  userType: 'student' | 'admin';
  userId: string;
}

export function useSessionTracker({ userType, userId }: SessionInfo) {
  useEffect(() => {
    if (!userId) return;

    const createSession = async () => {
      try {
        // Get device info
        const deviceInfo = {
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          vendor: navigator.vendor,
          language: navigator.language,
        };

        // Create new session
        const { error } = await supabase
          .from('user_sessions')
          .insert({
            user_id: userId,
            user_type: userType,
            device_info: JSON.stringify(deviceInfo),
            user_agent: navigator.userAgent,
            last_activity: new Date().toISOString(),
          });

        if (error) {
          console.error('Failed to create session:', error);
        }
      } catch (error) {
        console.error('Session tracking error:', error);
      }
    };

    createSession();

    // Cleanup on unmount - mark session as ended
    return () => {
      const endSession = async () => {
        try {
          await supabase
            .from('user_sessions')
            .update({ expires_at: new Date().toISOString() })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);
        } catch (error) {
          console.error('Failed to end session:', error);
        }
      };
      endSession();
    };
  }, [userId, userType]);
}
