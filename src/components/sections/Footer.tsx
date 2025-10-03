import { GraduationCap, MapPin, Phone, Mail, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-gradient-to-b from-background to-muted/30 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* College Info */}
          <div className="lg:col-span-2 space-y-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-gradient-to-br from-primary to-primary-hover p-2.5 rounded-xl shadow-lg group-hover:shadow-xl transition-all">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-foreground">
                  Sanskrithi School of Engineering
                </h3>
                <p className="text-sm text-muted-foreground font-medium">Excellence in Education</p>
              </div>
            </Link>
            
            <p className="text-muted-foreground max-w-md leading-relaxed">
              A premier educational institution committed to excellence in learning, 
              research, and character development. Shaping the future of engineering education.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">
                  Beedupalli Road Prasanthigram<br />
                  Puttaparthy, Andhra Pradesh - 515134
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">091009 74530</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">info@sseptp.org</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-foreground mb-6 text-lg">Services</h4>
            <ul className="space-y-3">
              {[
                'Payment Management',
                'Complaint Tracking',
                'Library Services',
                'Cultural Events',
                'Industrial Visits',
              ].map((service) => (
                <li key={service}>
                  <span className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center group cursor-pointer">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all mr-0 group-hover:mr-2" />
                    {service}
                  </span>
                </li>
              ))}
              <li>
                {/* TODO: Replace with actual Terms and Conditions PDF link */}
                <a 
                  href="https://drive.google.com/file/d/1nGG4jMTGiD_9pypsH6kxMvZmY6ZNeQN4/view?usp=drive_link" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center group cursor-pointer"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all mr-0 group-hover:mr-2" />
                  Terms and Conditions
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-6 text-lg">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { name: 'Home', href: '/' },
                { name: 'About', href: '/about' },
                { name: 'Contact', href: '/contact' },
                { name: 'Student Portal', href: '/student' },
                { name: 'Admin Portal', href: '/admin' },
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all mr-0 group-hover:mr-2" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-muted-foreground">
              © 2024 Sanskrithi School of Engineering. All rights reserved.
            </p>
            
            <Button
              onClick={() => navigate('/developer-team')}
              variant="outline"
              size="sm"
              className="group"
            >
              <Users className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Meet the Developer Team
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
