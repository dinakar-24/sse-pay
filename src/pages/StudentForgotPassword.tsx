import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function StudentForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Normalize date to match format in database
  const normalizeDateFormat = (dateStr: string) => {
    if (!dateStr) return "";
    // If date is in YYYY-MM-DD format (from date input), keep as is for comparison
    return dateStr.trim();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase
      .from('students')
      .select('email')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error || !data) {
      toast({ title: "Error", description: "Email not found", variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "Success", description: "Email verified" });
    setStep(2);
    setLoading(false);
  };

  const handleDobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase
      .from('students')
      .select('dob')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    const inputDob = normalizeDateFormat(dob);
    const dbDob = normalizeDateFormat(data?.dob || "");

    if (error || !data || inputDob !== dbDob) {
      toast({ title: "Error", description: "Date of birth does not match", variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "Success", description: "Date of birth verified" });
    setStep(3);
    setLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);

    // Update password in database
    const { error } = await supabase
      .from('students')
      .update({ password_hash: newPassword })
      .eq('email', email.trim().toLowerCase())
      .eq('dob', normalizeDateFormat(dob));
    
    if (error) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "Success", description: "Password updated successfully" });
    setLoading(false);
    navigate('/student');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary">Reset Password</h1>
            <p className="text-muted-foreground">Recover your student account access</p>
          </div>
          <Link to="/student">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </div>

        <div className="max-w-md mx-auto">
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Verify Email</CardTitle>
                <CardDescription>Enter your registered email address</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button className="w-full" variant="hero" type="submit" disabled={loading}>
                    {loading ? 'Verifying...' : 'Continue'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Verify Date of Birth</CardTitle>
                <CardDescription>Enter your date of birth for verification</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDobSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <DatePicker
                      value={dob}
                      onChange={(date) => setDob(date)}
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                  <Button className="w-full" variant="hero" type="submit" disabled={loading}>
                    {loading ? 'Verifying...' : 'Continue'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Password</CardTitle>
                <CardDescription>Enter your new password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input 
                      id="new-password" 
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button className="w-full" variant="hero" type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
