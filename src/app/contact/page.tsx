import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <div className="text-center mb-10">
          <Mail className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="font-headline text-3xl sm:text-4xl font-bold text-primary">
          Get In Touch
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
          We're here to help. Reach out to us through any of the channels below.
          </p>
      </div>
      <Card className="shadow-lg">
          <CardContent className="p-8 grid md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                  <div className="p-3 bg-primary/10 rounded-full mb-3">
                      <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">Email Us</h3>
                  <p className="text-muted-foreground">support@xerox2u.com</p>
              </div>
               <div className="flex flex-col items-center">
                  <div className="p-3 bg-primary/10 rounded-full mb-3">
                      <Phone className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">Call Us</h3>
                  <p className="text-muted-foreground">+91-123-456-7890</p>
              </div>
               <div className="flex flex-col items-center">
                  <div className="p-3 bg-primary/10 rounded-full mb-3">
                      <MapPin className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">Our Location</h3>
                  <p className="text-muted-foreground">123 Digital Lane, Tech City, India</p>
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
