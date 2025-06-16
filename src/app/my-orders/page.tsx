
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertTriangle, ShoppingBag, Printer, Package, LogIn, ListOrdered, FileText, Palette, CopyIcon, DollarSign, CalendarDays, Ticket, Home, Truck, MapPin } from "lucide-react";
import { format } from "date-fns";
import { getOrdersFromMongoDB, type OrderDisplayData as PrintOrderData } from "@/app/actions/getOrders";
import { getEcommOrdersFromMongoDB, type EcommOrderDisplayData as EcommOrderData } from "@/app/actions/getEcommOrders";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function MyOrdersPage() {
  const authContext = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [printOrders, setPrintOrders] = useState<PrintOrderData[]>([]);
  const [ecommOrders, setEcommOrders] = useState<EcommOrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authContext.loading) {
      setIsLoading(true);
      return;
    }

    if (!authContext.user) {
      setIsLoading(false);
      return;
    }

    const fetchUserOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [printResult, ecommResult] = await Promise.all([
          getOrdersFromMongoDB({ userIdFilter: authContext.user!.uid }),
          getEcommOrdersFromMongoDB({ userIdFilter: authContext.user!.uid })
        ]);

        if (printResult.error) {
          throw new Error(`Failed to fetch print orders: ${printResult.error}`);
        }
        setPrintOrders(printResult.orders);

        if (ecommResult.error) {
          throw new Error(`Failed to fetch e-commerce orders: ${ecommResult.error}`);
        }
        setEcommOrders(ecommResult.orders);

      } catch (err: any) {
        console.error("Error fetching user orders:", err);
        setError(err.message || "An unexpected error occurred.");
        toast({ title: "Error Fetching Orders", description: err.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserOrders();
  }, [authContext.loading, authContext.user, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-6">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-xl text-muted-foreground">Loading your orders...</p>
      </div>
    );
  }

  if (!authContext.user) {
    return (
      <main className="container mx-auto px-4 py-12 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center">
        <ListOrdered className="mx-auto h-24 w-24 text-muted-foreground opacity-50 mb-6" />
        <h1 className="text-3xl font-headline text-primary mb-4">View Your Orders</h1>
        <p className="text-muted-foreground mb-8">Please sign in to see your order history.</p>
        <Button onClick={authContext.signInWithGoogle} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <LogIn className="mr-2 h-5 w-5" /> Sign In with Google
        </Button>
      </main>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-xl text-destructive font-semibold">Could Not Load Orders</p>
        <p className="text-muted-foreground mt-2 max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-6">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8">
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary flex items-center">
          <ListOrdered className="mr-3 h-10 w-10" />
          My Orders
        </h1>
        <p className="text-muted-foreground mt-1">Track your print service and e-commerce purchases.</p>
      </header>

      <Tabs defaultValue="print-orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mx-auto mb-8 h-12 rounded-lg">
          <TabsTrigger value="print-orders" className="text-base h-full flex items-center justify-center gap-2 data-[state=active]:shadow-md">
            <Printer size={20} /> Print Service
          </TabsTrigger>
          <TabsTrigger value="ecomm-orders" className="text-base h-full flex items-center justify-center gap-2 data-[state=active]:shadow-md">
            <ShoppingBag size={20} /> E-commerce
          </TabsTrigger>
        </TabsList>

        <TabsContent value="print-orders">
          <Card className="shadow-xl rounded-xl overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="font-headline text-2xl text-primary flex items-center">
                <Printer className="mr-3 h-7 w-7" /> Print Service Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {printOrders.length === 0 ? (
                <div className="text-center p-10 text-muted-foreground flex flex-col items-center justify-center min-h-[200px]">
                  <Printer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  No print orders found.
                  <Button asChild variant="link" className="mt-2"><Link href="/">Place a Print Order</Link></Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader className="sticky top-0 bg-secondary/95 backdrop-blur-sm z-10">
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead><FileText size={16} className="inline mr-1"/>File</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Pickup Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right"><DollarSign size={16} className="inline mr-1"/>Cost</TableHead>
                      <TableHead className="text-right"><CalendarDays size={16} className="inline mr-1"/>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {printOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground" title={order.id}>{order.id.substring(0, 8)}...</TableCell>
                        <TableCell className="truncate max-w-[150px]" title={order.fileName || 'N/A'}>
                          {order.fileName || "N/A"}
                          <p className="text-xs text-muted-foreground">{order.numCopies} copies, {order.printColor}, {order.paperSize}</p>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {order.deliveryMethod === 'pickup' ? (
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              <Package size={14}/> Pickup: {order.pickupCenter || "N/A"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <Truck size={14}/> Home Delivery: {order.deliveryAddress?.city}, {order.deliveryAddress?.zip}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {order.deliveryMethod === 'pickup' ? (
                            <Badge className="bg-accent text-accent-foreground hover:bg-accent/90">
                              <Ticket size={14} className="mr-1.5"/>{order.pickupCode}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">{order.status}</TableCell>
                        <TableCell className="text-right">₹{order.totalCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{format(new Date(order.createdAt), "MMM d, yyyy HH:mm")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ecomm-orders">
          <Card className="shadow-xl rounded-xl overflow-hidden">
            <CardHeader className="bg-accent/5">
              <CardTitle className="font-headline text-2xl text-accent flex items-center">
                <ShoppingBag className="mr-3 h-7 w-7" /> E-commerce Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {ecommOrders.length === 0 ? (
                <div className="text-center p-10 text-muted-foreground flex flex-col items-center justify-center min-h-[200px]">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  No e-commerce orders found.
                  <Button asChild variant="link" className="mt-2"><Link href="/#ecommerce">Shop Now</Link></Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader className="sticky top-0 bg-secondary/95 backdrop-blur-sm z-10">
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                       <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ecommOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground" title={order.id}>{order.id.substring(0, 8)}...</TableCell>
                        <TableCell className="truncate max-w-xs" title={order.orderedProductsSummary}>{order.orderedProductsSummary}</TableCell>
                        <TableCell className="text-right font-semibold">₹{order.totalAmount.toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{order.paymentMethod === 'cod' ? 'COD' : 'Card'}</TableCell>
                        <TableCell className="capitalize">{order.status}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{format(new Date(order.createdAt), "MMM d, yyyy HH:mm")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
    
