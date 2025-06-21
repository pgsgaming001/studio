
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, ShoppingCart } from "lucide-react";
import PrintServiceDashboard from "@/components/admin/PrintServiceDashboard";
import EcommerceDashboard from "@/components/admin/EcommerceDashboard";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const ADMIN_EMAIL = 'pgsgaming001@gmail.com';

export default function AdminDashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
            toast({
                title: "Access Denied",
                description: "You must be an administrator to view this page.",
                variant: "destructive",
            });
            router.push('/');
        }
    }, [user, loading, router, toast]);

    if (loading || !user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-secondary/50">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <p className="text-xl text-muted-foreground">Loading Dashboard...</p>
            </div>
        );
    }
    
    if (user.email !== ADMIN_EMAIL) {
        // This is a fallback in case the useEffect redirect doesn't happen instantly
        return null;
    }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-primary">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Manage your platform's print and e-commerce services.</p>
      </header>

      <Tabs defaultValue="print-service" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mb-8 h-12 rounded-lg">
          <TabsTrigger value="print-service" className="text-base h-full flex items-center justify-center gap-2 data-[state=active]:shadow-md">
            <Printer size={20} /> Print Service
          </TabsTrigger>
          <TabsTrigger value="ecommerce" className="text-base h-full flex items-center justify-center gap-2 data-[state=active]:shadow-md">
            <ShoppingCart size={20} /> E-commerce
          </TabsTrigger>
        </TabsList>
        <TabsContent value="print-service">
            <PrintServiceDashboard />
        </TabsContent>
        <TabsContent value="ecommerce">
            <EcommerceDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
