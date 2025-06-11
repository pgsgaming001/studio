
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, DollarSign, Users, ListOrdered, PackageSearch, Edit, Trash2, PlusCircle, AlertTriangle, Loader2, BarChart3, Truck } from "lucide-react";
import { format } from "date-fns";
import { getProducts, type ProductSummary } from "@/app/actions/getProducts";
import { getEcommOrdersFromMongoDB, type EcommOrderDisplayData, type EcommOrderStatus } from "@/app/actions/getEcommOrders";
import { updateEcommOrderStatus } from "@/app/actions/updateEcommOrderStatus";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

const VALID_ECOMM_STATUSES: EcommOrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const initialEcommerceSummary = {
  totalActiveProducts: 0,
  totalSalesMonth: 0.00,
  newCustomersMonth: 0, // This would require tracking unique user IDs from orders
};

export default function EcommerceDashboardPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [ecommOrders, setEcommOrders] = useState<EcommOrderDisplayData[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  const [errorOrders, setErrorOrders] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const authContext = useAuth(); // Get auth context

  const [summaryData, setSummaryData] = useState(initialEcommerceSummary);

  useEffect(() => {
    // Admin access control
    if (!authContext.loading) {
      if (!authContext.user) {
        router.push('/'); 
        toast({ title: "Access Denied", description: "Please sign in to access the admin dashboard.", variant: "destructive" });
        return;
      } else if (authContext.user.email !== 'pgsviews@gmail.com') { // Your admin email
        router.push('/');
        toast({ title: "Access Denied", description: "You are not authorized to view this page.", variant: "destructive" });
        return;
      }
    }

    // Only proceed to fetch data if admin check passes (or is still loading)
    if (authContext.loading || (authContext.user && authContext.user.email === 'pgsviews@gmail.com')) {
        const fetchAdminProducts = async () => {
        setIsLoadingProducts(true);
        setErrorProducts(null);
        try {
            const result = await getProducts({});
            if (result.error) {
            throw new Error(result.error);
            }
            setProducts(result.products);
            setSummaryData(prev => ({
            ...prev,
            totalActiveProducts: result.products.filter(p => p.status === 'active').length
            }));
        } catch (err: any) {
            console.error("Error fetching products for admin dashboard:", err);
            setErrorProducts(`Failed to load products: ${err.message}`);
        } finally {
            setIsLoadingProducts(false);
        }
        };

        const fetchEcommOrders = async () => {
        setIsLoadingOrders(true);
        setErrorOrders(null);
        try {
            const result = await getEcommOrdersFromMongoDB(); // Fetch all orders
            if (result.error) {
            throw new Error(result.error);
            }
            setEcommOrders(result.orders);
            // Placeholder for calculating total sales & new customers from orders
            const totalSales = result.orders.reduce((sum, order) => sum + order.totalAmount, 0);
            const uniqueUserIds = new Set(result.orders.map(order => order.userId).filter(Boolean));
            setSummaryData(prev => ({
                ...prev,
                totalSalesMonth: totalSales, // This is total sales, not just month. Update if date filtering is added.
                newCustomersMonth: uniqueUserIds.size 
            }));
        } catch (err: any) {
            console.error("Error fetching e-commerce orders:", err);
            setErrorOrders(`Failed to load e-commerce orders: ${err.message}`);
        } finally {
            setIsLoadingOrders(false);
        }
        };

        fetchAdminProducts();
        fetchEcommOrders();
    }
  }, [authContext.loading, authContext.user, router, toast]);

  const handleEditProduct = (productId: string) => {
    toast({ title: "Edit Product Clicked", description: `Implement form for editing product ID: ${productId.substring(0,8)}...` });
    // router.push(`/admin/ecommerce-dashboard/edit-product/${productId}`); // Future
  };

  const handleDeleteProduct = (productId: string) => {
    toast({ title: "Delete Product Clicked", description: `Implement deletion for product ID: ${productId.substring(0,8)}...` });
    // Call a server action to delete product, then refetch products
  };

  const handleEcommStatusChange = async (orderId: string, newStatus: EcommOrderStatus) => {
    const originalOrders = [...ecommOrders];
    
    const updatedOptimisticOrders = ecommOrders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setEcommOrders(updatedOptimisticOrders);

    const result = await updateEcommOrderStatus({ orderId, newStatus });

    if (result.success && result.updatedOrder) {
      toast({
        title: "E-comm Order Status Updated",
        description: `Order ${result.updatedOrder.id.substring(0,8)}... status changed to ${newStatus}.`,
      });
      setEcommOrders(prevOrders => prevOrders.map(order => 
        order.id === result.updatedOrder!.id 
          ? { ...result.updatedOrder, status: result.updatedOrder!.status as EcommOrderStatus, createdAt: result.updatedOrder!.createdAt } 
          : order
      ));
    } else {
      toast({
        title: "Update Failed",
        description: result.error || "Could not update e-commerce order status.",
        variant: "destructive",
      });
      setEcommOrders(originalOrders); 
    }
  };

  if (authContext.loading || (isLoadingProducts || isLoadingOrders) && authContext.user?.email === 'pgsviews@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-secondary/50">
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <p className="text-xl text-muted-foreground">Loading E-commerce Dashboard Data...</p>
      </div>
    );
  }
  
  if (!authContext.user || authContext.user.email !== 'pgsviews@gmail.com') {
      return null; 
  }

  if (errorProducts || errorOrders) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-destructive/10">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <p className="text-xl text-destructive font-semibold">Error Loading Dashboard Data</p>
        {errorProducts && <p className="text-muted-foreground text-center max-w-md mt-2">Product Error: {errorProducts}</p>}
        {errorOrders && <p className="text-muted-foreground text-center max-w-md mt-2">Order Error: {errorOrders}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="font-headline text-4xl font-bold text-primary flex items-center">
            <ShoppingCart className="mr-3 h-10 w-10" />
            E-commerce Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage your online store products, orders, and settings.</p>
        </div>
        <Button asChild className="mt-4 sm:mt-0 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/admin/ecommerce-dashboard/add-product">
            <PlusCircle className="mr-2 h-5 w-5" />
            Add New Product
          </Link>
        </Button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Products</CardTitle>
            <PackageSearch className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summaryData.totalActiveProducts}</div>
            <p className="text-xs text-muted-foreground">Currently active products in store</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${summaryData.totalSalesMonth.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time sales</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            <Users className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summaryData.newCustomersMonth}</div>
            <p className="text-xs text-muted-foreground">Unique customers with orders</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <ListOrdered className="mr-3 h-7 w-7" />
              Product Inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {products.length === 0 ? (
                <div className="text-center p-10 text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  No products found. Click "Add New Product" to get started.
                </div>
              ) : (
                <Table className="min-w-[1000px]">
                  <TableHeader className="sticky top-0 bg-secondary/95 backdrop-blur-sm z-10">
                    <TableRow>
                      <TableHead className="w-[80px] px-3 py-3">Image</TableHead>
                      <TableHead className="min-w-[200px] px-3 py-3">Name</TableHead>
                      <TableHead className="px-3 py-3">Category</TableHead>
                      <TableHead className="text-right px-3 py-3">Price</TableHead>
                      <TableHead className="text-center px-3 py-3">Stock</TableHead>
                      <TableHead className="px-3 py-3">Status</TableHead>
                      <TableHead className="text-right px-3 py-3">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className="hover:bg-primary/5 transition-colors">
                        <TableCell className="px-3 py-2">
                          <div className="w-12 h-12 relative rounded-md overflow-hidden border bg-muted">
                            <Image 
                              src={product.image || "https://placehold.co/100x100.png"} 
                              alt={product.name} 
                              fill
                              sizes="50px"
                              className="object-cover"
                              data-ai-hint={product.dataAiHint || product.name.split(" ").slice(0,2).join(" ")}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium px-3 py-3 truncate max-w-xs" title={product.name}>{product.name}</TableCell>
                        <TableCell className="px-3 py-3">
                          <Badge variant="secondary">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right px-3 py-3">${product.price.toFixed(2)}</TableCell>
                        <TableCell className="text-center px-3 py-3">{product.stock ?? 'N/A'}</TableCell>
                        <TableCell className="px-3 py-3">
                           <Badge 
                              variant={product.status === 'active' ? 'default' : product.status === 'draft' ? 'outline' : 'secondary'}
                              className={
                                product.status === 'active' ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' : 
                                product.status === 'draft' ? 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200' : 
                                'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}
                            >
                              {product.status ? product.status.charAt(0).toUpperCase() + product.status.slice(1) : 'N/A'}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right px-3 py-3">
                          <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product.id)} className="mr-2 hover:text-primary">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)} className="hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      <section>
        <Card className="shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-accent/10">
            <CardTitle className="font-headline text-2xl text-accent flex items-center">
              <Truck className="mr-3 h-7 w-7" />
              Recent E-commerce Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {ecommOrders.length === 0 ? (
                <div className="text-center p-10 text-muted-foreground flex flex-col items-center justify-center min-h-[200px]">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  No e-commerce orders found.
                </div>
              ) : (
                <Table className="min-w-[1000px]">
                  <TableHeader className="sticky top-0 bg-secondary/95 backdrop-blur-sm z-10">
                    <TableRow>
                      <TableHead className="px-3 py-3">Order ID</TableHead>
                      <TableHead className="px-3 py-3">Customer</TableHead>
                      <TableHead className="px-3 py-3">Items</TableHead>
                      <TableHead className="text-right px-3 py-3">Total</TableHead>
                      <TableHead className="px-3 py-3">Payment</TableHead>
                      <TableHead className="px-3 py-3">Status</TableHead>
                      <TableHead className="text-right px-3 py-3">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ecommOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-accent/5 transition-colors">
                        <TableCell className="font-mono text-xs text-muted-foreground px-3 py-3" title={order.id}>
                          {order.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="font-medium px-3 py-3 truncate max-w-xs" title={order.customerEmail}>
                          {order.customerName}
                          <br />
                          <span className="text-xs text-muted-foreground">{order.customerEmail}</span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-sm text-muted-foreground truncate max-w-xs" title={order.orderedProductsSummary}>
                          {order.orderedProductsSummary}
                        </TableCell>
                        <TableCell className="text-right font-semibold px-3 py-3">${order.totalAmount.toFixed(2)}</TableCell>
                        <TableCell className="px-3 py-3 capitalize">
                          <Badge variant={order.paymentMethod === 'cod' ? 'secondary' : 'outline'}>
                            {order.paymentMethod === 'cod' ? 'COD' : 'Card'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <Select
                            value={order.status}
                            onValueChange={(newStatus: EcommOrderStatus) => handleEcommStatusChange(order.id, newStatus)}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                              <SelectValue placeholder="Change status" />
                            </SelectTrigger>
                            <SelectContent>
                              {VALID_ECOMM_STATUSES.map(statusVal => (
                                <SelectItem key={statusVal} value={statusVal} className="capitalize text-xs">
                                  {statusVal.charAt(0).toUpperCase() + statusVal.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground px-3 py-3">
                          {format(new Date(order.createdAt), "MMM d, yyyy HH:mm")}
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

      <section>
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <BarChart3 className="mr-3 h-7 w-7" />
              Sales Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-secondary/30 rounded-md">
              <p className="text-muted-foreground">Charts and analytics based on real sales data will be displayed here (placeholder).</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
