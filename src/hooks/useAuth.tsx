import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  userType: 'student' | 'admin' | null;
  // Student auth
  signUp: (email: string, password: string, userData: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  resetPassword: (email: string, dob: string, newPassword: string) => Promise<any>;
  // Admin auth
  adminSignUp: (payload: { name: string; email: string; role: string; dob: string; password: string }) => Promise<any>;
  adminSignIn: (email: string, password: string) => Promise<any>;
  adminResetPassword: (email: string, dob: string, newPassword: string) => Promise<any>;
  // Common
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<'student' | 'admin' | null>(null);

  useEffect(() => {
    // Check for persisted custom auth session
    const storedUser = localStorage.getItem('auth_user');
    const storedUserType = localStorage.getItem('auth_user_type');
    
    if (storedUser && storedUserType) {
      setUser(JSON.parse(storedUser));
      setUserType(storedUserType as 'student' | 'admin');
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const rollNorm = String(userData.rollNo || '').replace(/\s+/g, '').toUpperCase();
      const emailNorm = String(email || '').trim().toLowerCase();

      // 1) Check duplicates (case-insensitive)
      const { data: existingRoll } = await supabase
        .from('students')
        .select('id')
        .ilike('roll_no', rollNorm)
        .maybeSingle();
      if (existingRoll) {
        return { data: null, error: 'Roll number already exists. Please log in or use a different roll number.' };
      }

      const { data: existingEmail } = await supabase
        .from('students')
        .select('id')
        .ilike('email', emailNorm)
        .maybeSingle();
      if (existingEmail) {
        return { data: null, error: 'Email already registered. Please log in or use a different email.' };
      }

      // 2) Insert new student (normalized values)
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert([{
          name: String(userData.name || '').trim(),
          roll_no: rollNorm,
          roll_series: String(userData.rollSeries || '').trim().toUpperCase(),
          email: emailNorm,
          department: String(userData.department || '').trim(),
          section: String(userData.section || '').trim(),
          dob: String(userData.dob || '').trim(),
          student_phone: String(userData.studentPhone || '').trim(),
          parent_phone: String(userData.parentPhone || '').trim(),
          password_hash: String(password || '') // NOTE: hash in production
        }])
        .select();

      if (studentError) {
        const rawMsg = (studentError as any)?.message || '';
        const code = (studentError as any)?.code;
        if (code === '23505' || rawMsg.includes('students_roll_no_key')) {
          return { data: null, error: 'Roll number already exists. Please use a different one or log in.' };
        }
        if (code === '23505' || rawMsg.includes('students_email_key')) {
          return { data: null, error: 'Email already registered. Try logging in instead.' };
        }
        throw new Error(rawMsg || 'Failed to create account');
      }

      toast({ title: 'Account created successfully!', description: 'You can now login with your credentials.' });
      return { data: studentData, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password)
        .maybeSingle();

      if (error || !student) {
        throw new Error('Invalid credentials');
      }

      setUser(student);
      setUserType('student');
      
      // Persist session
      localStorage.setItem('auth_user', JSON.stringify(student));
      localStorage.setItem('auth_user_type', 'student');
      
      toast({
        title: "Login successful!",
        description: "Welcome back to your student portal.",
      });

      return { data: student, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setUserType(null);
    
    // Clear persisted session
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_user_type');
    
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
  };

  const resetPassword = async (email: string, dob: string, newPassword: string) => {
    try {
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .eq('dob', dob)
        .maybeSingle();

      if (error || !student) {
        throw new Error('Invalid email or date of birth');
      }

      const { error: updateError } = await supabase
        .from('students')
        .update({ password_hash: newPassword })
        .eq('id', student.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      toast({
        title: "Password reset successful!",
        description: "You can now login with your new password.",
      });

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  // Admin auth functions
  const adminSignIn = async (email: string, password: string) => {
    try {
      const { data: admin, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password)
        .maybeSingle();

      if (error || !admin) throw new Error('Invalid credentials');

      setUser(admin);
      setUserType('admin');
      
      // Persist session
      localStorage.setItem('auth_user', JSON.stringify(admin));
      localStorage.setItem('auth_user_type', 'admin');
      
      toast({ title: 'Login successful!', description: 'Welcome to the admin portal.' });
      return { data: admin, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  };

  const adminSignUp = async (payload: { name: string; email: string; role: string; dob: string; password: string }) => {
    try {
      // Limit to 6 admins total
      const { count } = await supabase
        .from('admins')
        .select('*', { count: 'exact', head: true });
      if ((count || 0) >= 6) throw new Error('Admin limit reached (6)');

      const { data, error } = await supabase
        .from('admins')
        .insert([{
          full_name: payload.name,
          email: payload.email,
          role: payload.role,
          dob: payload.dob,
          password_hash: payload.password
        }])
        .select();

      if (error) throw error;

      toast({ title: 'Admin account created', description: 'You can now log in.' });
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  };

  const adminResetPassword = async (email: string, dob: string, newPassword: string) => {
    try {
      const { data: admin, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .eq('dob', dob)
        .maybeSingle();

      if (error || !admin) throw new Error('Invalid email or date of birth');

      const { error: updateError } = await supabase
        .from('admins')
        .update({ password_hash: newPassword })
        .eq('id', admin.id);

      if (updateError) throw updateError;

      toast({ title: 'Password reset', description: 'You can now log in with the new password.' });
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const value = {
    user,
    session,
    loading,
    userType,
    // Student
    signUp,
    signIn,
    resetPassword,
    // Admin
    adminSignUp,
    adminSignIn,
    adminResetPassword,
    // Common
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};