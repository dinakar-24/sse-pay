import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, BookOpen, Users, MapPin, CreditCard, User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useSessionTracker } from "@/hooks/useSessionTracker";

interface Charge {
  id: string;
  event_type: string;
  description: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function StudentDashboard() {
  const { user, signOut } = useAuth();
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("complaints");

  // Initialize session management
  useAutoLogout('student');
  useSessionTracker({ userType: 'student', userId: user?.id || '' });

  useEffect(() => {
    if (user?.id) {
      fetchCharges();

      // Set up real-time subscription
      const channel = supabase
        .channel('student-assignments-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'student_assignments',
            filter: `student_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Real-time update:', payload);
            fetchCharges();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCharges = async () => {
    try {
      const { data, error } = await supabase
        .from('student_assignments')
        .select(`
          id,
          description,
          amount,
          paid,
          assigned_at,
          event_id,
          events (
            type,
            title
          )
        `)
        .eq('student_id', user.id);

      if (error) throw error;

      const formattedCharges = data?.map(charge => ({
        id: charge.id,
        event_type: charge.events?.type || 'general',
        description: charge.description || charge.events?.title || 'No description',
        amount: charge.amount,
        status: charge.paid ? 'paid' : 'pending',
        created_at: charge.assigned_at
      })) || [];

      setCharges(formattedCharges);
    } catch (error: any) {
      toast({
        title: "Error fetching charges",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (chargeId: string, amount: number) => {
    try {
      const contact = String(user?.student_phone ?? '').replace(/\D/g, '').slice(-10);
      if (contact.length !== 10) {
        toast({
          title: "Phone number required",
          description: "Please add a valid 10-digit student phone number to continue with payment.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Initializing payment",
        description: "Please wait...",
      });

      // Create Razorpay order
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: {
            assignmentId: chargeId,
            studentId: user.id
          }
        }
      );

      if (orderError) throw orderError;

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount * 100,
          currency: orderData.currency,
          name: 'College Payment',
          description: 'Fee Payment',
          order_id: orderData.orderId,
          handler: async function (response: any) {
            try {
              // Verify payment
              const { error: verifyError } = await supabase.functions.invoke(
                'verify-razorpay-payment',
                {
                  body: {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    paymentId: orderData.paymentId,
                    assignmentId: chargeId
                  }
                }
              );

              if (verifyError) throw verifyError;

              toast({
                title: "Payment successful!",
                description: `Payment of ₹${amount} completed successfully.`,
              });

              fetchCharges();
            } catch (error: any) {
              toast({
                title: "Payment verification failed",
                description: error.message,
                variant: "destructive",
              });
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact
          },
          theme: {
            color: '#3b82f6'
          },
          remember_customer: false,
          method: {
            wallet: true,
            upi: true,
            card: true,
            netbanking: true
          },
          config: {
            display: {
              sequence: ['block.wallet', 'block.upi', 'block.card', 'block.netbanking'],
              preferences: {
                show_default_blocks: true
              }
            }
          },
          notes: {
            recommendation: 'MobiKwik wallet recommended for faster checkout'
          }
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      };

    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filterChargesByType = (type: string) => {
    return charges.filter(charge => charge.event_type === type);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const ChargeCard = ({ charge }: { charge: Charge }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold">{charge.description}</h4>
          <Badge className={getStatusColor(charge.status)}>
            {charge.status.toUpperCase()}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Created: {new Date(charge.created_at).toLocaleDateString()}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-primary">₹{charge.amount}</span>
          {charge.status === 'pending' && (
            <Button 
              onClick={() => handlePayment(charge.id, charge.amount)}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Pay Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect if no valid user
  if (!user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to access the student dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/student/portal">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-secondary-light">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary">Student Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <Button variant="outline" onClick={signOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 rounded-full p-3">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{user?.name}</h3>
                <p className="text-muted-foreground">Roll No: {user?.roll_no}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.department} - Section {user?.section}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Pending</p>
                <p className="text-2xl font-bold text-destructive">
                  ₹{charges.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charges by Category */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="complaints" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Complaints
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="cultural" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Cultural
            </TabsTrigger>
            <TabsTrigger value="iv" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              IV Fees
            </TabsTrigger>
          </TabsList>

          <TabsContent value="complaints">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Complaint Fines
                </CardTitle>
                <CardDescription>
                  View and pay fines for disciplinary complaints
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filterChargesByType('complaint').length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No complaint fines found</p>
                ) : (
                  filterChargesByType('complaint').map(charge => (
                    <ChargeCard key={charge.id} charge={charge} />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-secondary" />
                  Library Fines
                </CardTitle>
                <CardDescription>
                  Outstanding library book fines and dues
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filterChargesByType('library').length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No library fines found</p>
                ) : (
                  filterChargesByType('library').map(charge => (
                    <ChargeCard key={charge.id} charge={charge} />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cultural">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent" />
                  Cultural Event Fees
                </CardTitle>
                <CardDescription>
                  Fees for cultural events and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filterChargesByType('cultural').length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No cultural event fees found</p>
                ) : (
                  filterChargesByType('cultural').map(charge => (
                    <ChargeCard key={charge.id} charge={charge} />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="iv">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Industrial Visit Fees
                </CardTitle>
                <CardDescription>
                  Fees for industrial visits and field trips
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filterChargesByType('iv').length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No IV fees found</p>
                ) : (
                  filterChargesByType('iv').map(charge => (
                    <ChargeCard key={charge.id} charge={charge} />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}