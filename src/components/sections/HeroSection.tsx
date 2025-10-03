import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Sparkles } from "lucide-react";
import heroCampus from "@/assets/hero-campus.png";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background with Gradient Overlay - Fixed within section */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="absolute inset-0 bg-fixed">
          <img
            src={heroCampus}
            alt="Sanskrithi School of Engineering Campus"
            className="w-full h-full object-cover opacity-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 py-20 w-full">
        <div className="flex flex-col items-center text-center">
          <div className="space-y-8 flex flex-col items-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Digital Payment Platform</span>
            </div>

            {/* Main Heading */}
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-foreground">Sanskrithi School</span>
              <br />
              <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                of Engineering
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Streamlined fee management and payment processing for students and administrators. 
              Secure, efficient, and transparent financial operations.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/student">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary-hover hover:shadow-lg group"
                >
                  Student Portal
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/admin">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full sm:w-auto border-2 hover:bg-muted/50"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Access
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
