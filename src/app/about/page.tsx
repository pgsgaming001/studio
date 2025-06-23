
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Target, Users } from "lucide-react";

export default function AboutUsPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-12">
        <Building className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary">
          About Xerox2U
        </h1>
        <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Simplifying your digital needs, from print to purchase.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8 text-accent" />
              <CardTitle className="font-headline text-2xl text-foreground">Our Mission</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              Our mission is to provide a seamless, reliable, and integrated digital service hub for individuals and local businesses. In a world where digital tasks can be fragmented and complex, we aim to be the simple, powerful solution that combines essential services—on-demand printing and e-commerce—into one intuitive platform. We believe in empowering our users by making technology accessible and easy to use.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-accent" />
              <CardTitle className="font-headline text-2xl text-foreground">Who We Are</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              Xerox2U was born from a passion for building practical, real-world applications that solve everyday problems. We are a team of builders, thinkers, and creators dedicated to delivering high-quality digital tools. We saw a need for a unified platform that could handle both the tangible need for document services and the growing demand for online retail, especially at a local level. Xerox2U is our answer—a blueprint for a modern digital operation in one box.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
