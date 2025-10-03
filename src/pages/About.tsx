import { CreditCard, FileText, BookOpen, Users, BarChart3, Shield, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function About() {
  const features = [
    {
      icon: CreditCard,
      title: "Payment Management",
      description: "Easy and secure online payment system for all types of fees including library dues, cultural events, and industrial visits."
    },
    {
      icon: FileText,
      title: "Complaint Tracking",
      description: "Submit and track complaints with real-time status updates. Pay fines online and manage all records efficiently."
    },
    {
      icon: BookOpen,
      title: "Library System",
      description: "Track borrowed books, due dates, and pay library fines instantly through our integrated digital library system."
    },
    {
      icon: Users,
      title: "Student Portal",
      description: "Comprehensive dashboard for students to view pending payments, payment history, and manage their academic finances."
    },
    {
      icon: BarChart3,
      title: "Admin Dashboard",
      description: "Powerful admin tools for managing students, tracking payments, generating reports, and monitoring all transactions."
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Bank-grade security with Razorpay integration ensuring safe and encrypted transactions for all payments."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Platform Features
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              A comprehensive digital platform designed to streamline student fee management, 
              complaint handling, and administrative operations with ease and efficiency.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="bg-primary/10 rounded-lg p-4 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Why Choose Us */}
          <div className="mt-16 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 md:p-12">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-foreground mb-6">
                Why Choose Our Platform?
              </h3>
              <div className="grid md:grid-cols-3 gap-8 mt-8">
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">100%</div>
                  <p className="text-muted-foreground">Secure Payments</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                  <p className="text-muted-foreground">System Access</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">Instant</div>
                  <p className="text-muted-foreground">Payment Confirmation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
