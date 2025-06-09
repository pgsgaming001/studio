
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { ShoppingCart, DollarSign, Users, ListOrdered, PackageSearch, Edit, Trash2, PlusCircle, AlertTriangle, Loader2, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { getProducts, type ProductSummary } from "@/app/actions/getProducts";
import { useToast } from "@/hooks/use-toast";

// Placeholder summary data, can be made dynamic later
const ecommerceSummary = {
  totalActiveProducts: 0, // Will be calculated
  totalSalesMonth: 12560.75, // Static for now
  newCustomersMonth: 32, // Static for now
};

export default function EcommerceDashboardPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [summaryData, setSummaryData] = useState(ecommerceSummary);

  useEffect(() => {
    const fetchAdminProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getProducts({}); // Fetch all products for admin
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
        setError(`Failed to load products: ${err.message}`);
        toast({
          title: "Error Loading Products",
          description: err.message || "Could not retrieve products from the database.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminProducts();
  }, [toast]);

  const handleAddProduct = () => {
    // TODO: Implement navigation or modal for adding a new product
    toast({ title: "Add Product Clicked", description: "Implement form for adding products." });
  };

  const handleEditProduct = (productId: string) => {
    // TODO: Implement navigation or modal for editing product `productId`
    toast({ title: "Edit Product Clicked", description: `Implement form for editing product ID: ${productId.substring(0,8)}...` });
  };

  const handleDeleteProduct = (productId: string) => {
    // TODO: Implement deletion logic for product `productId`
    toast({ title: "Delete Product Clicked", description: `Implement deletion for product ID: ${productId.substring(0,8)}...` });
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-secondary/50">
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <p className="text-xl text-muted-foreground">Loading E-commerce Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-destructive/10">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <p className="text-xl text-destructive font-semibold">Error Loading Dashboard</p>
        <p className="text-muted-foreground text-center max-w-md mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="font-headline text-4xl font-bold text-primary flex items-center">
            <ShoppingCart className="mr-3 h-10 w-10" />
            E-commerce Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage your online store products, orders, and settings.</p>
        </div>
        <Button onClick={handleAddProduct} className="mt-4 sm:mt-0 bg-accent hover:bg-accent/90 text-accent-foreground">
          <PlusCircle className="mr-2 h-5 w-5" />
          Add New Product
        </Button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales (Month)</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${summaryData.totalSalesMonth.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Sales in the current month (placeholder)</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Customers (Month)</CardTitle>
            <Users className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summaryData.newCustomersMonth}</div>
            <p className="text-xs text-muted-foreground">Customers signed up this month (placeholder)</p>
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
                          <Badge variant={product.status === 'active' ? 'default' : 'outline'} className={product.status === 'active' ? 'bg-green-500/20 text-green-700 border-green-400' : 'bg-yellow-500/20 text-yellow-700 border-yellow-400'}>
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
