import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before logout

export function useAutoLogout(userType: 'student' | 'admin' | null) {
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Session expired",
        description: "You have been logged out due to inactivity",
      });
      navigate(userType === 'admin' ? '/admin' : '/student');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [navigate, userType]);

  const showWarning = useCallback(() => {
    toast({
      title: "Session expiring soon",
      description: "You will be logged out in 5 minutes due to inactivity",
      variant: "destructive",
    });
  }, []);

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // Update last activity
    lastActivityRef.current = Date.now();

    // Set warning timer
    warningRef.current = setTimeout(showWarning, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Set logout timer
    timeoutRef.current = setTimeout(logout, INACTIVITY_TIMEOUT);
  }, [logout, showWarning]);

  const updateActivity = useCallback(() => {
    // Update session in database
    const updateSessionActivity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
      }
    };

    updateSessionActivity();
    resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    if (!userType) return;

    // Activity events to track
    const events = [
      'mousedown',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Throttle activity updates to avoid too many calls
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledUpdate = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          updateActivity();
          throttleTimeout = null;
        }, 60000); // Update at most once per minute
      }
    };

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, throttledUpdate);
    });

    // Initialize timers
    resetTimers();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledUpdate);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [userType, updateActivity, resetTimers]);

  return { resetTimers };
}
