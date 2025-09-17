"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Minus, Search, Loader2, Store, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { handleMarketPriceSearch } from "../actions";
import type { MarketPriceOutput } from "@/ai/flows/get-market-price";

export default function MarketPricesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [result, setResult] = useState<MarketPriceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast({
        title: "Search term required",
        description: "Please enter a crop to search for.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setResult(null);
    try {
      const searchResult = await handleMarketPriceSearch({ crop: searchTerm });
      setResult(searchResult);
    } catch (error) {
      console.error("Failed to fetch market price:", error);
      toast({
        title: "Search Failed",
        description: "Could not fetch market price data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const trend = result ? (result.currentPrice > result.historicalPrice ? 'up' : result.currentPrice < result.historicalPrice ? 'down' : 'stable') : null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Market Price Dashboard"
        description="Search for current mandi prices and get recommendations on where to sell your produce."
      />
      <form onSubmit={handleSearch} className="flex w-full items-center space-x-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for a crop, e.g., 'Tomato' or 'Onion'"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4 md:hidden" />
          )}
          <span className="hidden md:inline">Search</span>
        </Button>
      </form>
      
      {isLoading && (
        <Card>
           <CardContent className="p-0">
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Crop</TableHead>
                    <TableHead>Market</TableHead>
                    <TableHead className="text-right">Current Price (per Quintal)</TableHead>
                    <TableHead className="text-right">Price Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex justify-center items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin"/>
                          <span>Fetching market data for "{searchTerm}"...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                </TableBody>
              </Table>
            </CardContent>
        </Card>
      )}

      {!isLoading && !result && (
         <Card>
           <CardContent className="p-0">
             <Table>
                <TableHeader>
                   <TableRow>
                    <TableHead>Crop</TableHead>
                    <TableHead>Market</TableHead>
                    <TableHead className="text-right">Current Price (per Quintal)</TableHead>
                    <TableHead className="text-right">Price Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Your search results will appear here.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
        </Card>
      )}

      {result && !isLoading && (
        <div className="flex flex-col gap-8">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Crop</TableHead>
                      <TableHead>Market</TableHead>
                      <TableHead className="text-right">Current Price (per Quintal)</TableHead>
                      <TableHead className="text-right">Price Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                        <TableRow key={`${result.crop}-${result.market}`}>
                          <TableCell className="font-medium">{result.crop}</TableCell>
                          <TableCell>{result.market}</TableCell>
                          <TableCell className="text-right font-mono">₹{result.currentPrice.toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right">
                            {trend && (
                              <Badge variant={trend === 'down' ? 'destructive' : trend === 'up' ? 'default' : 'secondary'} className="gap-1">
                                {trend === 'up' && <ArrowUp className="h-3 w-3" />}
                                {trend === 'down' && <ArrowDown className="h-3 w-3" />}
                                {trend === 'stable' && <Minus className="h-3 w-3" />}
                                {trend.charAt(0).toUpperCase() + trend.slice(1)}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader className="flex-row items-center gap-2 space-y-0">
                  <Globe className="h-5 w-5 text-primary" />
                  <CardTitle>Online Selling Platforms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.onlinePlatforms.map((platform, index) => (
                    <div key={index}>
                      <h3 className="font-semibold">{platform.name}</h3>
                      <p className="text-sm text-muted-foreground">{platform.details}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex-row items-center gap-2 space-y-0">
                  <Store className="h-5 w-5 text-primary"/>
                  <CardTitle>Local & Offline Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.offlinePlatforms.map((platform, index) => (
                    <div key={index}>
                      <h3 className="font-semibold">{platform.name}</h3>
                      <p className="text-sm text-muted-foreground">{platform.details}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
        </div>
      )}
    </div>
  );
}
