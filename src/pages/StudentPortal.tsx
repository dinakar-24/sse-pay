import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CreditCard, FileText, BookOpen, Users, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export default function StudentPortal() {
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const { user, signUp, signIn } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    name: "", rollNo: "", rollSeries: "", email: "", department: "", section: "",
    dob: "", studentPhone: "", parentPhone: "", password: "", confirmPassword: ""
  });


  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(loginData.email, loginData.password);
    
    if (error) {
      toast({
        title: "Login failed",
        description: error,
        variant: "destructive",
      });
    } else {
      navigate('/student/dashboard');
    }
    
    setLoading(false);
  }, [loginData.email, loginData.password, signIn, navigate]);

  const handleSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Password and confirm password do not match",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    const { error } = await signUp(signupData.email, signupData.password, {
      name: signupData.name,
      rollNo: signupData.rollNo,
      rollSeries: signupData.rollSeries,
      department: signupData.department,
      section: signupData.section,
      dob: signupData.dob,
      studentPhone: signupData.studentPhone,
      parentPhone: signupData.parentPhone,
    });
    
    if (error) {
      toast({
        title: "Signup failed",
        description: error,
        variant: "destructive",
      });
    } else {
      setActiveTab("login");
    }
    
    setLoading(false);
  }, [signupData, signUp]);


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary">Student Portal</h1>
            <p className="text-muted-foreground">Access your academic and financial information</p>
          </div>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="max-w-md mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Student Login</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="your.email@example.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="text-right">
                      <Link to="/student/forgot-password" className="text-sm text-primary hover:underline">
                        Forgot Password?
                      </Link>
                    </div>
                    <Button className="w-full" variant="hero" type="submit" disabled={loading}>
                      {loading ? "Logging in..." : "Login to Dashboard"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Student Registration</CardTitle>
                  <CardDescription>Create your student account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          placeholder="John Doe"
                          value={signupData.name}
                          onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roll">Roll Number</Label>
                        <Input 
                          id="roll" 
                          placeholder="22KF1A0501"
                          value={signupData.rollNo}
                          onChange={(e) => {
                            const rollNo = e.target.value.toUpperCase();
                            const rollSeries = rollNo.slice(0, 4);
                            setSignupData(prev => ({ 
                              ...prev, 
                              rollNo,
                              rollSeries 
                            }));
                          }}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rollSeries">Roll Number Series</Label>
                      <Input 
                        id="rollSeries" 
                        placeholder="Auto-filled from roll number"
                        value={signupData.rollSeries}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Automatically extracted from your roll number (first 4 characters)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input 
                        id="signup-email" 
                        type="email" 
                        placeholder="your.email@example.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input 
                          id="department" 
                          placeholder="CSE"
                          value={signupData.department}
                          onChange={(e) => setSignupData(prev => ({ ...prev, department: e.target.value.toUpperCase() }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="section">Section</Label>
                        <Input 
                          id="section" 
                          placeholder="A"
                          value={signupData.section}
                          onChange={(e) => setSignupData(prev => ({ ...prev, section: e.target.value.toUpperCase() }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <DatePicker
                        value={signupData.dob}
                        onChange={(date) => setSignupData(prev => ({ ...prev, dob: date }))}
                        placeholder="Select date of birth"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="student-phone">Student phone no</Label>
                        <PhoneInput 
                          id="student-phone" 
                          placeholder="9999999999"
                          value={signupData.studentPhone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setSignupData(prev => ({ ...prev, studentPhone: value }));
                          }}
                          maxLength={10}
                          pattern="[0-9]{10}"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Enter 10-digit mobile number</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="parent-phone">Parent phone no</Label>
                        <PhoneInput 
                          id="parent-phone" 
                          placeholder="9999999999"
                          value={signupData.parentPhone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setSignupData(prev => ({ ...prev, parentPhone: value }));
                          }}
                          maxLength={10}
                          pattern="[0-9]{10}"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Enter 10-digit mobile number</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input 
                          id="signup-password" 
                          type="password"
                          value={signupData.password}
                          onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input 
                          id="confirm-password" 
                          type="password"
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <Button className="w-full" variant="hero" type="submit" disabled={loading}>
                      {loading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}