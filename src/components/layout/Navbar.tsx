import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Menu, X, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Student Portal", href: "/student" },
    { name: "Admin Portal", href: "/admin" },
    { name: "Contact", href: "/contact" },
    { name: "About", href: "/about" },
  ];

  return (
    <nav className="fixed top-0 w-full bg-white/95 dark:bg-background/95 backdrop-blur-lg border-b border-border z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-gradient-to-br from-primary to-primary-hover p-2.5 rounded-xl shadow-lg group-hover:shadow-xl transition-all">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl text-foreground">SSE</span>
              <span className="text-xs text-muted-foreground font-medium">Engineering Excellence</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 transition-all"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <Link to="/student" className="hidden sm:block">
              <Button className="bg-gradient-to-r from-primary to-primary-hover hover:shadow-lg transition-all">
                Student Login
              </Button>
            </Link>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 animate-in slide-in-from-top">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-2">
                <Link to="/student" className="block" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-primary to-primary-hover">
                    Student Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
