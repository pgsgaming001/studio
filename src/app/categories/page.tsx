
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { placeholderCategories } from "@/config/categories";
import { ChevronRight, List } from "lucide-react";

export default function AllCategoriesPage() {
  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8 text-center">
        <List className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
          All Product Categories
        </h1>
        <p className="text-muted-foreground mt-2">
          Browse products by selecting a category below.
        </p>
      </div>

      {placeholderCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {placeholderCategories.map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`} passHref legacyBehavior>
              <a className="block group h-full">
                <Card className="h-full overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 rounded-xl flex flex-col items-center justify-center text-center p-6 cursor-pointer group-hover:bg-primary/5">
                  <div className="p-4 bg-primary/10 rounded-full mb-4 group-hover:bg-primary/20 transition-colors">
                    <category.icon className="h-10 w-10 text-primary transition-transform group-hover:scale-110" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-card-foreground group-hover:text-primary">
                    {category.name}
                  </CardTitle>
                  <CardContent className="p-0 mt-2">
                    <p className="text-sm text-muted-foreground flex items-center justify-center">
                      View Products <ChevronRight className="ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground text-lg">No categories available at the moment.</p>
        </div>
      )}
    </main>
  );
}
