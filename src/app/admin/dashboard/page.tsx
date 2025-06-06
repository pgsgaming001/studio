
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, type Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Package, DollarSign, ListChecks, AlertTriangle, Loader2, FileText, Palette, CopyIcon, Scaling, MapPin, CalendarDays } from "lucide-react";
import type { OrderData as SubmittedOrderData } from "@/app/actions/submitOrder";

// Extended OrderData for display, including Firestore document ID and JS Date
interface OrderDisplayData extends SubmittedOrderData {
  id: string;
  createdAt: Date; // Firestore Timestamp is converted to JS Date
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<OrderDisplayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!db) {
        setError("Firebase Firestore client is not initialized.");
        setIsLoading(false);
        return;
      }
      try {
        const ordersCollection = collection(db, "orders");
        const q = query(ordersCollection, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedOrders: OrderDisplayData[] = [];
        let revenue = 0;
        let pendingCount = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data() as SubmittedOrderData;
          // Ensure createdAt is handled correctly, might be null or already a JS Date if not from serverTimestamp
          let createdAtDate: Date;
          if (data.createdAt && typeof (data.createdAt as any).toDate === 'function') {
            createdAtDate = (data.createdAt as Timestamp).toDate();
          } else if (data.createdAt instanceof Date) {
            createdAtDate = data.createdAt;
          } else {
            createdAtDate = new Date(); // Fallback, though ideally createdAt should always be a Timestamp from Firestore
          }

          fetchedOrders.push({
            ...data,
            id: doc.id,
            createdAt: createdAtDate,
          });
          revenue += data.totalCost || 0;
          if (data.status === "pending") {
            pendingCount++;
          }
        });

        setOrders(fetchedOrders);
        setTotalOrders(fetchedOrders.length);
        setPendingOrders(pendingCount);
        setTotalRevenue(revenue);
      } catch (err: any) {
        console.error("Error fetching orders:", err);
        setError(`Failed to fetch orders: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-secondary/50">
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <p className="text-xl text-muted-foreground">Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-destructive/10">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <p className="text-xl text-destructive font-semibold">Error Loading Dashboard</p>
        <p className="text-muted-foreground text-center max-w-md mt-2">{error}</p>
        <p className="text-xs text-muted-foreground mt-4">Please check console for more details and ensure Firebase is configured correctly.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-primary">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of print orders and key metrics.</p>
      </header>

      {/* Analytics Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <Package className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">All received orders</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
            <ListChecks className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Orders awaiting processing</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From all completed and pending orders</p>
          </CardContent>
        </Card>
      </section>

      {/* Orders Table Section */}
      <section>
        <Card className="shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <ListChecks className="mr-3 h-7 w-7" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px] w-full">
              {orders.length === 0 ? (
                <div className="text-center p-10 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  No orders found.
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-secondary/80 backdrop-blur-sm z-10">
                    <TableRow>
                      <TableHead className="w-[120px]">Order ID</TableHead>
                      <TableHead><FileText size={16} className="inline mr-1"/>File Name</TableHead>
                      <TableHead className="text-center"><CopyIcon size={16} className="inline mr-1"/>Copies</TableHead>
                      <TableHead><Palette size={16} className="inline mr-1"/>Color</TableHead>
                      <TableHead><Scaling size={16} className="inline mr-1"/>Paper Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead><MapPin size={16} className="inline mr-1"/>Delivery</TableHead>
                      <TableHead className="text-right"><DollarSign size={16} className="inline mr-1"/>Cost</TableHead>
                      <TableHead className="text-right"><CalendarDays size={16} className="inline mr-1"/>Date Ordered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-primary/5 transition-colors">
                        <TableCell className="font-mono text-xs text-muted-foreground truncate" title={order.id}>
                          {order.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="font-medium truncate max-w-[200px]" title={order.fileName || 'N/A'}>
                          {order.fileName || "N/A"}
                        </TableCell>
                        <TableCell className="text-center">{order.numCopies}</TableCell>
                        <TableCell className="capitalize">{order.printColor}</TableCell>
                        <TableCell>{order.paperSize}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={order.status === 'pending' ? 'secondary' : order.status === 'completed' ? 'default' : 'outline'}
                            className={
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              order.status === 'processing' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                              order.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-300' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-300' :
                              ''
                            }
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="truncate max-w-[150px]" title={`${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zip}`}>
                          {order.deliveryAddress.city}, {order.deliveryAddress.zip}
                        </TableCell>
                        <TableCell className="text-right">${order.totalCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {format(order.createdAt, "MMM d, yyyy HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
