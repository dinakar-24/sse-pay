import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Session {
  id: string;
  device_info: string;
  ip_address: string;
  user_agent: string;
  last_activity: string;
  created_at: string;
  expires_at: string;
}

export default function SessionsManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchSessions = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_activity', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading sessions',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Session ended',
        description: 'The session has been terminated',
      });

      fetchSessions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };


  const getDeviceIcon = (userAgent: string) => {
    if (/mobile/i.test(userAgent)) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const isCurrentSession = (session: Session) => {
    // Check if this is the current session by comparing last activity time
    const timeDiff = Date.now() - new Date(session.last_activity).getTime();
    return timeDiff < 5 * 60 * 1000; // Within last 5 minutes
  };

  const getDeviceName = (deviceInfo: string) => {
    try {
      const info = JSON.parse(deviceInfo);
      return `${info.platform || 'Unknown'} - ${info.vendor || 'Unknown'}`;
    } catch {
      return 'Unknown Device';
    }
  };

  const isSessionActive = (expiresAt: string) => {
    return new Date(expiresAt) > new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-destructive/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            ← Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Active Sessions</h1>
          <p className="text-muted-foreground">
            Manage your active login sessions across different devices
          </p>
        </div>


        <div className="space-y-4">
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Monitor className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active sessions found</p>
              </CardContent>
            </Card>
          ) : (
            sessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(session.user_agent)}
                      <div>
                        <CardTitle className="text-lg">
                          {getDeviceName(session.device_info)}
                        </CardTitle>
                        <CardDescription>
                          Last active: {new Date(session.last_activity).toLocaleString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCurrentSession(session) && (
                        <Badge variant="default">Current</Badge>
                      )}
                      {isSessionActive(session.expires_at) ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <strong>Created:</strong>{' '}
                      {new Date(session.created_at).toLocaleString()}
                    </p>
                    <p>
                      <strong>Expires:</strong>{' '}
                      {new Date(session.expires_at).toLocaleString()}
                    </p>
                    {session.ip_address && (
                      <p>
                        <strong>IP Address:</strong> {session.ip_address}
                      </p>
                    )}
                  </div>
                  {!isCurrentSession(session) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-4"
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      End Session
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
