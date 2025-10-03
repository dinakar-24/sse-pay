import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState("passcode");
  const [passcode, setPasscode] = useState("");
  const navigate = useNavigate();
  const { adminSignIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: "", password: "" });

  const handlePasscodeSubmit = () => {
    if (passcode === "998877") {
      setActiveTab("login");
    } else {
      alert("Invalid passcode. Please try again.");
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await adminSignIn(loginData.email, loginData.password);
    if (error) {
      toast({ title: "Login failed", description: error, variant: "destructive" });
    } else {
      navigate('/admin/dashboard');
    }
    setLoading(false);
  };


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary">Admin Portal</h1>
            <p className="text-muted-foreground">Administrative access for authorized personnel</p>
          </div>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="max-w-md mx-auto">
          <Tabs value={activeTab} className="space-y-4">
            <TabsContent value="passcode">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Admin Access
                  </CardTitle>
                  <CardDescription>Enter the admin passcode to continue</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="passcode">Admin Passcode</Label>
                    <Input
                      id="passcode"
                      type="password"
                      placeholder="Enter 6-digit passcode"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      maxLength={6}
                    />
                  </div>
                  <Button className="w-full" variant="hero" onClick={handlePasscodeSubmit}>
                    Continue
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Contact IT administrator if you don't have the passcode
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Administrator Login</CardTitle>
                  <CardDescription>Access your admin dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email</Label>
                      <Input 
                        id="admin-email" 
                        type="email" 
                        placeholder="admin@sanskrthise.edu.in"
                        value={loginData.email}
                        onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Password</Label>
                      <Input 
                        id="admin-password" 
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                      <Link 
                        to="/admin/forgot-password"
                        className="text-sm text-primary hover:underline block"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                    <Button className="w-full" variant="hero" type="submit" disabled={loading}>
                      {loading ? 'Logging in...' : 'Login to Dashboard'}
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