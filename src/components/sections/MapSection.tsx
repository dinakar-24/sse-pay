import { MapPin, Navigation, Phone } from 'lucide-react';

export function MapSection() {

  return (
    <section id="location" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Find Us Here
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Located in the spiritual town of Puttaparthi, our campus provides an ideal environment for academic excellence.
          </p>
        </div>

        <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-elegant border border-border">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3851.234!2d77.7785831!3d14.1340595!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bb17bb40d0208d5%3A0x61d71e6f61545268!2sSanskrithi%20School%20Of%20Engineering!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Sanskrithi School of Engineering, Puttaparthi"
          />
        </div>

        {/* Contact Information Cards */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 rounded-full p-4 mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Address</h3>
              <p className="text-sm text-muted-foreground">
                Beedupalli Road Prasanthigram<br />
                Puttaparthy, Andhra Pradesh - 515134
              </p>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="bg-secondary/10 rounded-full p-4 mb-4">
                <Navigation className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Transport</h3>
              <p className="text-sm text-muted-foreground">
                Well connected by road and rail<br />
                Regular bus services available
              </p>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="bg-accent/10 rounded-full p-4 mb-4">
                <Phone className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Contact</h3>
              <p className="text-sm text-muted-foreground">
                091009 74530<br />
                sseptp.org
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}