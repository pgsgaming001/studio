
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, DollarSign, Users, ListOrdered, PackageSearch, CalendarDays, BarChart3 } from "lucide-react";
import { format } from "date-fns";

// Placeholder data for E-commerce
const ecommerceSummary = {
  totalProducts: 78,
  recentSales: 12560.75,
  newCustomers: 32,
};

const placeholderEcommerceOrders = [
  { id: "ECO-001", customer: "Alice Wonderland", date: new Date(2023, 10, 15, 10, 30), total: 75.99, status: "Shipped", items: 3 },
  { id: "ECO-002", customer: "Bob The Builder", date: new Date(2023, 10, 14, 14, 0), total: 120.50, status: "Processing", items: 1 },
  { id: "ECO-003", customer: "Charlie Brown", date: new Date(2023, 10, 14, 9, 15), total: 45.00, status: "Delivered", items: 2 },
  { id: "ECO-004", customer: "Diana Prince", date: new Date(2023, 10, 13, 17, 45), total: 210.20, status: "Pending", items: 5 },
];

export default function EcommerceDashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-primary flex items-center">
          <ShoppingCart className="mr-3 h-10 w-10" />
          E-commerce Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Overview of online store products, sales, and customer activity.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            <PackageSearch className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ecommerceSummary.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Active products in store</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales (Month)</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${ecommerceSummary.recentSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Sales in the current month</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Customers (Month)</CardTitle>
            <Users className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ecommerceSummary.newCustomers}</div>
            <p className="text-xs text-muted-foreground">Customers signed up this month</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <ListOrdered className="mr-3 h-7 w-7" />
              Recent E-commerce Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto h-[400px] w-full">
              {placeholderEcommerceOrders.length === 0 ? (
                <div className="text-center p-10 text-muted-foreground flex flex-col items-center justify-center h-full">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  No e-commerce orders found.
                </div>
              ) : (
                <Table className="min-w-[800px]">
                  <TableHeader className="sticky top-0 bg-secondary/95 backdrop-blur-sm z-10">
                    <TableRow>
                      <TableHead className="whitespace-nowrap px-3 py-3">Order ID</TableHead>
                      <TableHead className="whitespace-nowrap px-3 py-3">Customer</TableHead>
                      <TableHead className="whitespace-nowrap px-3 py-3">Items</TableHead>
                      <TableHead className="text-right whitespace-nowrap px-3 py-3">Total</TableHead>
                      <TableHead className="whitespace-nowrap px-3 py-3">Status</TableHead>
                      <TableHead className="text-right whitespace-nowrap px-3 py-3"><CalendarDays size={16} className="inline mr-1"/>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {placeholderEcommerceOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-primary/5 transition-colors">
                        <TableCell className="font-mono text-xs text-muted-foreground px-3 py-3">{order.id}</TableCell>
                        <TableCell className="font-medium px-3 py-3">{order.customer}</TableCell>
                        <TableCell className="text-center px-3 py-3">{order.items}</TableCell>
                        <TableCell className="text-right px-3 py-3">${order.total.toFixed(2)}</TableCell>
                        <TableCell className="capitalize px-3 py-3">{order.status}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground px-3 py-3">
                          {format(order.date, "MMM d, yyyy HH:mm")}
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
       <section className="mt-8">
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <BarChart3 className="mr-3 h-7 w-7" />
              Sales Analytics (Placeholder)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-secondary/30 rounded-md">
              <p className="text-muted-foreground">E-commerce charts and analytics will be displayed here.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

    