
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

// Mock data for articles
const articlesList = [
  {
    id: "1",
    title: "How to Care for Succulents",
    excerpt: "Learn the basics of succulent care and maintenance.",
    image: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3",
    date: "Apr 15, 2025",
    readTime: "5 min read"
  },
  {
    id: "2",
    title: "Best Indoor Plants for Beginners",
    excerpt: "Discover easy-to-care-for plants that are perfect for plant newbies.",
    image: "https://images.unsplash.com/photo-1463320898484-cdee8141c787?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3",
    date: "Apr 10, 2025",
    readTime: "7 min read"
  },
  {
    id: "3",
    title: "Understanding Plant Diseases",
    excerpt: "Identify common plant diseases and learn how to treat them effectively.",
    image: "https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3",
    date: "Apr 5, 2025",
    readTime: "8 min read"
  },
  {
    id: "4",
    title: "Seasonal Planting Guide",
    excerpt: "What to plant during each season for optimal growth.",
    image: "https://images.unsplash.com/photo-1466945924683-06a85d882d5e?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3",
    date: "Mar 28, 2025",
    readTime: "6 min read"
  },
  {
    id: "5",
    title: "Creating a Vertical Garden",
    excerpt: "Maximize your space with stylish vertical gardening solutions.",
    image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3",
    date: "Mar 20, 2025",
    readTime: "10 min read"
  },
  {
    id: "6",
    title: "The Benefits of Plants in Your Home",
    excerpt: "Discover how indoor plants improve air quality and mental health.",
    image: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.0.3",
    date: "Mar 15, 2025",
    readTime: "4 min read"
  }
];

const ArticlesScreen = () => {
  return (
    <div className="p-6 pb-20 overflow-y-auto">
      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {articlesList.map((article) => (
          <Card 
            key={article.id} 
            className="overflow-hidden cursor-pointer hover:shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.15),_0px_4px_6px_-2px_rgba(0,0,0,0.1)] transition-shadow duration-200"
          >
            <div className="h-40 relative">
              <img 
                src={article.image} 
                alt={article.title} 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                <span>{article.date}</span>
                <span>{article.readTime}</span>
              </div>
              <h3 className="font-bold text-lg mb-1 text-text">{article.title}</h3>
              <p className="text-text-muted text-sm">{article.excerpt}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Pagination */}
      <div className="mt-8">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default ArticlesScreen;
