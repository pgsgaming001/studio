
"use client";

import type React from 'react';
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, type Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns'; // For formatting timestamps
import type { OrderData } from '@/app/actions/submitOrder'; // Re-use OrderData
import { AlertTriangle, Loader2, ListOrdered } from 'lucide-react';

// Extend OrderData to include the Firestore document ID
interface FullOrderData extends OrderData {
  id: string;
  createdAt: Timestamp; // Ensure createdAt is specifically Timestamp from Firestore
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<FullOrderData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      if (!db) {
        setError("Firebase Firestore client is not initialized.");
        setIsLoading(false);
        return;
      }
      try {
        const ordersCollection = collection(db, "orders");
        const q = query(ordersCollection, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedOrders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as OrderData),
           // Ensure createdAt is correctly typed; Firestore returns Timestamp
          createdAt: doc.data().createdAt as Timestamp,
        })) as FullOrderData[];
        setOrders(fetchedOrders);
      } catch (e: any) {
        console.error("Error fetching orders: ", e);
        setError(e.message || "Failed to fetch orders.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatAddress = (address: FullOrderData['deliveryAddress']) => {
    if (!address) return 'N/A';
    return `${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`;
  }

  return (
    <div className="min-h-screen bg-secondary/50 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-primary flex items-center">
          <ListOrdered className="mr-3 h-10 w-10" /> Admin Dashboard - Orders
        </h1>
        <p className="text-muted-foreground mt-1">View and manage incoming print orders.</p>
      </header>

      <Card className="shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-primary/5">
          <CardTitle className="font-headline text-2xl text-primary">Incoming Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="flex items-center justify-center h-64 text-primary">
              <Loader2 className="h-12 w-12 animate-spin mr-3" />
              <span className="text-xl">Loading Orders...</span>
            </div>
          )}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center h-64 text-destructive p-4">
              <AlertTriangle className="h-12 w-12 mb-3" />
              <p className="text-xl font-semibold">Error Loading Orders</p>
              <p className="text-center">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">Please ensure Firebase is configured correctly and you have permission to read the 'orders' collection.</p>
            </div>
          )}
          {!isLoading && !error && orders.length === 0 && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p className="text-xl">No orders found.</p>
            </div>
          )}
          {!isLoading && !error && orders.length > 0 && (
            <ScrollArea className="h-[calc(100vh-250px)]"> {/* Adjust height as needed */}
              <Table>
                <TableHeader className="sticky top-0 bg-secondary/80 backdrop-blur-sm">
                  <TableRow>
                    <TableHead className="w-[150px]">Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead className="text-center">Copies</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Paper</TableHead>
                    <TableHead>Sides</TableHead>
                    <TableHead>Layout</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Delivery Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-primary/5">
                      <TableCell className="font-medium truncate max-w-[150px] text-xs font-code" title={order.id}>{order.id}</TableCell>
                      <TableCell className="text-xs">
                        {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'MMM d, yyyy HH:mm') : 'N/A'}
                      </TableCell>
                      <TableCell className="truncate max-w-[200px]" title={order.fileName || 'N/A'}>{order.fileName || 'N/A'}</TableCell>
                      <TableCell className="text-center">{order.numCopies}</TableCell>
                      <TableCell>
                        <Badge variant={order.printColor === 'color' ? 'default' : 'secondary'} className={order.printColor === 'color' ? 'bg-accent text-accent-foreground' : ''}>
                          {order.printColor === 'color' ? 'Color' : 'B&W'}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.paperSize}</TableCell>
                      <TableCell>{order.printSides === 'double' ? 'Double' : 'Single'}</TableCell>
                      <TableCell>{order.layout === '2up' ? '2-up' : '1-up'}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={order.status === 'pending' ? 'outline' : 'default'}
                          className={
                            order.status === 'pending' ? 'border-orange-500 text-orange-500' : 
                            order.status === 'printing' ? 'border-blue-500 text-blue-500' :
                            order.status === 'shipped' ? 'border-green-500 text-green-500' :
                            'border-muted-foreground text-muted-foreground'
                          }
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">${order.totalCost.toFixed(2)}</TableCell>
                      <TableCell className="text-xs truncate max-w-[250px]" title={formatAddress(order.deliveryAddress)}>{formatAddress(order.deliveryAddress)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      <footer className="text-center mt-8 text-sm text-muted-foreground">
        <p>Xerox2U Admin Panel</p>
      </footer>
    </div>
  );
}

