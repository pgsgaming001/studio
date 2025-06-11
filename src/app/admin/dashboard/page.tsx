
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Package, DollarSign, ListChecks, AlertTriangle, Loader2, FileText, Palette, CopyIcon, Scaling, MapPin, CalendarDays, Download, Printer, User } from "lucide-react"; // Added User
import { getOrdersFromMongoDB, type OrderDisplayData as FetchedOrderData } from "@/app/actions/getOrders";
import { updateOrderStatus, type OrderStatus } from "@/app/actions/updateOrderStatus";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { useRouter } from "next/navigation"; // Import useRouter

const VALID_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const ADMIN_EMAIL = 'pgsgaming001@gmail.com'; // Centralized admin email

interface OrderDisplayDataInternal extends Omit<FetchedOrderData, 'status' | 'createdAt'> {
  status: OrderStatus;
  createdAt: string; 
}

export default function PrintServiceDashboardPage() {
  const [orders, setOrders] = useState<OrderDisplayDataInternal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const authContext = useAuth(); // Get auth context
  const router = useRouter(); // Get router instance

  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    // Admin access control
    if (!authContext.loading) {
      if (!authContext.user) {
        router.push('/'); 
        toast({ title: "Access Denied", description: "Please sign in to access the admin dashboard.", variant: "destructive" });
        return;
      } else if (authContext.user.email !== ADMIN_EMAIL) { 
        router.push('/');
        toast({ title: "Access Denied", description: "You are not authorized to view this page.", variant: "destructive" });
        return;
      }
    }
    // Only proceed to fetch data if admin check passes (or is still loading)
    if (authContext.loading || (authContext.user && authContext.user.email === ADMIN_EMAIL)) {
        const fetchOrders = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getOrdersFromMongoDB(); // Fetch all orders for admin

            if (result.error) {
            throw new Error(result.error);
            }
            
            const processedOrders: OrderDisplayDataInternal[] = result.orders.map((order) => ({
                ...order,
                status: order.status as OrderStatus, 
                createdAt: order.createdAt,
            }));

            setOrders(processedOrders);
            calculateSummaryMetrics(processedOrders);
        } catch (err: any) {
            console.error("Error fetching print orders for dashboard:", err);
            setError(`Failed to fetch print orders: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
        };
        fetchOrders();
    }
  }, [authContext.loading, authContext.user, router, toast]);


  const calculateSummaryMetrics = (currentOrders: OrderDisplayDataInternal[]) => {
    let revenue = 0;
    let pendingCount = 0;
    currentOrders.forEach(order => {
      revenue += order.totalCost || 0;
      if (order.status === "pending") {
        pendingCount++;
      }
    });
    setTotalRevenue(revenue);
    setPendingOrders(pendingCount);
    setTotalOrders(currentOrders.length);
  };


  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const originalOrders = [...orders];
    
    const updatedOptimisticOrders = orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOptimisticOrders);
    calculateSummaryMetrics(updatedOptimisticOrders);

    const result = await updateOrderStatus({ orderId, newStatus });

    if (result.success && result.updatedOrder) {
      toast({
        title: "Status Updated",
        description: `Print Order ${orderId.substring(0,8)} status changed to ${newStatus}.`,
      });
      const finalOrders = orders.map(order => 
        order.id === result.updatedOrder!.id 
          ? { ...order, status: result.updatedOrder!.status as OrderStatus, createdAt: result.updatedOrder!.createdAt } 
          : order
      );
      setOrders(finalOrders);
      calculateSummaryMetrics(finalOrders);

    } else {
      toast({
        title: "Update Failed",
        description: result.error || "Could not update print order status.",
        variant: "destructive",
      });
      setOrders(originalOrders); 
      calculateSummaryMetrics(originalOrders); 
    }
  };

  // Loading state for auth check
  if (authContext.loading || (isLoading && authContext.user?.email === ADMIN_EMAIL)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-secondary/50">
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <p className="text-xl text-muted-foreground">Loading Print Service Dashboard...</p>
      </div>
    );
  }
  
  // If not admin after loading, this component might not render fully due to redirect
  // but this is a fallback.
  if (!authContext.user || authContext.user.email !== ADMIN_EMAIL) {
      return null; // Or a more specific "Access Denied" component if redirection fails
  }


  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-destructive/10">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <p className="text-xl text-destructive font-semibold">Error Loading Dashboard</p>
        <p className="text-muted-foreground text-center max-w-md mt-2">{error}</p>
        <p className="text-xs text-muted-foreground mt-4">Please check console for more details and ensure MongoDB is configured correctly.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-primary flex items-center">
          <Printer className="mr-3 h-10 w-10" />
          Print Service Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Overview of print orders and key metrics.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Print Orders</CardTitle>
            <Package className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">All received print orders</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Print Orders</CardTitle>
            <ListChecks className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Print orders awaiting processing</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Print Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From all print orders</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <ListChecks className="mr-3 h-7 w-7" />
              Recent Print Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto h-[600px] w-full">
              {orders.length === 0 ? (
                <div className="text-center p-10 text-muted-foreground flex flex-col items-center justify-center h-full">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  No print orders found.
                </div>
              ) : (
                <Table className="min-w-[1200px]"> 
                  <TableHeader className="sticky top-0 bg-secondary/95 backdrop-blur-sm z-10"> 
                    <TableRow>
                      <TableHead className="whitespace-nowrap px-2 py-3">Order ID</TableHead>
                      <TableHead className="whitespace-nowrap px-2 py-3"><User size={16} className="inline mr-1"/>Customer</TableHead>
                      <TableHead className="whitespace-nowrap px-2 py-3"><FileText size={16} className="inline mr-1"/>File</TableHead>
                      <TableHead className="whitespace-nowrap px-2 py-3"><Download size={16} className="inline mr-1"/>Attachment</TableHead>
                      <TableHead className="text-center whitespace-nowrap px-2 py-3"><CopyIcon size={16} className="inline mr-1"/>Copies</TableHead>
                      <TableHead className="whitespace-nowrap px-2 py-3"><Palette size={16} className="inline mr-1"/>Color</TableHead>
                      <TableHead className="whitespace-nowrap hidden md:table-cell px-2 py-3"><Scaling size={16} className="inline mr-1"/>Paper</TableHead>
                      <TableHead className="whitespace-nowrap px-2 py-3">Status</TableHead>
                      <TableHead className="whitespace-nowrap px-2 py-3"><MapPin size={16} className="inline mr-1"/>Delivery</TableHead>
                      <TableHead className="text-right whitespace-nowrap px-2 py-3"><DollarSign size={16} className="inline mr-1"/>Cost</TableHead>
                      <TableHead className="text-right whitespace-nowrap px-2 py-3"><CalendarDays size={16} className="inline mr-1"/>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-primary/5 transition-colors">
                        <TableCell className="font-mono text-xs text-muted-foreground truncate px-2 py-3" title={order.id}>
                          {order.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="font-medium truncate max-w-[180px] px-2 py-3" title={order.userEmail || 'N/A'}>
                          {order.userName || 'Guest'}
                          <br />
                          <span className="text-xs text-muted-foreground">{order.userEmail || 'No email'}</span>
                        </TableCell>
                        <TableCell className="font-medium truncate max-w-[150px] px-2 py-3" title={order.fileName || 'N/A'}>
                          {order.fileName || "N/A"}
                        </TableCell>
                        <TableCell className="px-2 py-3">
                          {order.pdfDownloadURL ? (
                            <Button variant="outline" size="sm" asChild>
                              <a href={order.pdfDownloadURL} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                <Download size={14} className="mr-1.5 shrink-0" /> View PDF
                              </a>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">No PDF</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center px-2 py-3">{order.numCopies}</TableCell>
                        <TableCell className="capitalize px-2 py-3">{order.printColor}</TableCell>
                        <TableCell className="hidden md:table-cell px-2 py-3">{order.paperSize}</TableCell>
                        <TableCell className="px-2 py-3">
                          <Select
                            value={order.status}
                            onValueChange={(newStatus: OrderStatus) => handleStatusChange(order.id, newStatus)}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                              <SelectValue placeholder="Change status" />
                            </SelectTrigger>
                            <SelectContent>
                              {VALID_STATUSES.map(statusVal => (
                                <SelectItem key={statusVal} value={statusVal} className="capitalize text-xs">
                                  {statusVal.charAt(0).toUpperCase() + statusVal.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="truncate max-w-[120px] px-2 py-3" title={`${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zip}`}>
                          {order.deliveryAddress.city}, {order.deliveryAddress.zip}
                        </TableCell>
                        <TableCell className="text-right px-2 py-3">${order.totalCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground px-2 py-3">
                          {format(new Date(order.createdAt), "MMM d, HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

    