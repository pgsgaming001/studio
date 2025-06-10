
"use client";

import { useState, useEffect } from "react";
import XeroxForm from "@/components/features/xerox/XeroxForm";
import { EcommercePlaceholder } from "@/components/features/ecommerce/EcommercePlaceholder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, ShoppingCart } from "lucide-react";

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

  return (
    <main className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <header className="text-center mb-10 md:mb-16">
        <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary">
          My First Project
        </h1>
        <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          {activeTab === "print"
            ? "Upload your documents, customize print settings, and get them delivered straight to your doorstep. Fast, easy, and reliable."
            : "Discover amazing products in our online store. More items coming soon!"}
        </p>
      </header>

      <Tabs 
        value={activeTab} // Control the Tabs component with our state
        className="w-full" 
        onValueChange={handleTabChange} // Update state on tab change
      >
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mx-auto mb-8 h-12 rounded-lg">
          <TabsTrigger value="print" className="text-base h-full flex items-center justify-center gap-2 data-[state=active]:shadow-md">
            <Printer size={20} /> Print Service
          </TabsTrigger>
          <TabsTrigger value="ecommerce" className="text-base h-full flex items-center justify-center gap-2 data-[state=active]:shadow-md">
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
    </main>
  );
}
