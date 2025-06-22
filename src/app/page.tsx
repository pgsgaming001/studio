
"use client";

import { useState, useEffect } from "react";
import XeroxForm from "@/components/features/xerox/XeroxForm";
import { EcommercePlaceholder } from "@/components/features/ecommerce/EcommercePlaceholder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, ShoppingCart, HelpCircle, Mail, Phone, MapPin } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";


const SESSION_STORAGE_KEY = 'homePageActiveTab';

export default function HomePage() {
  // Initialize with default, then useEffect will update from sessionStorage
  const [activeTab, setActiveTab] = useState<string>("print");

  // On component mount, try to load the active tab from sessionStorage
  useEffect(() => {
    const storedTab = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (storedTab === "print" || storedTab === "ecommerce") {
      setActiveTab(storedTab);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // When activeTab changes, save it to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, activeTab);
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const faqItems = [
    {
      question: "What file types can I upload for printing?",
      answer: "For document printing, we accept PDF files to ensure formatting is preserved. For our photo printing service, you can upload high-quality JPEG, JPG, or PNG files."
    },
    {
      question: "What are my delivery options?",
      answer: "We offer two convenient options. You can choose to pick up your order for free from one of our designated local centers. Alternatively, you can opt for home delivery for a nominal shipping fee, which will be calculated at checkout."
    },
    {
      question: "How long will it take to get my order?",
      answer: "Standard production time for most print orders is 1-2 business days. For home delivery, please allow an additional 2-4 business days for shipping. You will receive an email notification as soon as your order is ready for pickup or has been dispatched."
    },
    {
      question: "How can I track my order status?",
      answer: "Once you are logged in, you can view the real-time status of all your print and e-commerce orders by navigating to the 'My Orders' page from your user profile menu in the header."
    },
     {
      question: "What is your return policy?",
      answer: "Due to the custom nature of our print services, these orders are non-refundable unless there is a clear printing error on our part. For products purchased from our e-commerce store, we have a 14-day return policy for unopened and unused items. Please refer to our Terms and Conditions for full details."
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <header id="home" className="text-center mb-10 md:mb-16">
        <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary">
          Xerox2U: Your Digital Service Hub
        </h1>
        <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Your all-in-one platform for on-demand document printing and high-quality e-commerce products. Streamline your tasks with our reliable, easy-to-use services.
        </p>
      </header>

      <Tabs 
        value={activeTab} // Control the Tabs component with our state
        className="w-full" 
        onValueChange={handleTabChange} // Update state on tab change
      >
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mx-auto mb-8 h-12 rounded-lg">
          <TabsTrigger value="print" id="print" className="text-base h-full flex items-center justify-center gap-2 data-[state=active]:shadow-md">
            <Printer size={20} /> Print Service
          </TabsTrigger>
          <TabsTrigger value="ecommerce" id="ecommerce" className="text-base h-full flex items-center justify-center gap-2 data-[state=active]:shadow-md">
            <ShoppingCart size={20} /> Online Store
          </TabsTrigger>
        </TabsList>

        <TabsContent value="print">
          <XeroxForm />
        </TabsContent>
        <TabsContent value="ecommerce">
          <EcommercePlaceholder />
        </TabsContent>
      </Tabs>

      <section id="faq" className="mt-16 md:mt-24 max-w-4xl mx-auto">
        <div className="text-center mb-10">
            <HelpCircle className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary">
            Frequently Asked Questions
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
            Have questions? We've got answers.
            </p>
        </div>
        <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-lg text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                    {item.answer}
                </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      </section>

      <section id="contact" className="mt-16 md:mt-24 max-w-4xl mx-auto">
        <div className="text-center mb-10">
            <Mail className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary">
            Get In Touch
            </h2>
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
      </section>

    </div>
  );
}
