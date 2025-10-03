import { Mail, Phone, MapPin, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Contact() {
  const contactInfo = [
    {
      icon: MapPin,
      title: "Address",
      details: ["Beedupalli Road Prasanthigram", "Puttaparthy, Andhra Pradesh - 515134"]
    },
    {
      icon: Phone,
      title: "Phone",
      details: ["091009 74530"]
    },
    {
      icon: Mail,
      title: "Email",
      details: ["info@sseptp.org", "admissions@sseptp.org"]
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

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get in touch with us. We're here to help and answer any questions you may have.
            </p>
          </div>

          {/* Contact Information */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{info.title}</h3>
                      {info.details.map((detail, idx) => (
                        <p key={idx} className="text-muted-foreground text-sm">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Office Hours */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8">
              <h3 className="font-semibold text-2xl mb-6 text-center">Office Hours</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="font-semibold text-lg mb-2">Monday - Friday</div>
                  <p className="text-muted-foreground">9:00 AM - 5:00 PM</p>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg mb-2">Saturday</div>
                  <p className="text-muted-foreground">9:00 AM - 1:00 PM</p>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg mb-2">Sunday</div>
                  <p className="text-muted-foreground">Closed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
