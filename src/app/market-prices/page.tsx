import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

const marketData = [
  { crop: "Wheat", market: "Kanpur Mandi", currentPrice: 2250, historicalPrice: 2200, unit: "Quintal" },
  { crop: "Paddy (Rice)", market: "Ludhiana Mandi", currentPrice: 3100, historicalPrice: 3150, unit: "Quintal" },
  { crop: "Maize", market: "Gulbarga Mandi", currentPrice: 1950, historicalPrice: 1950, unit: "Quintal" },
  { crop: "Soybean", market: "Indore Mandi", currentPrice: 4500, historicalPrice: 4400, unit: "Quintal" },
  { crop: "Cotton", market: "Adilabad Mandi", currentPrice: 7200, historicalPrice: 7350, unit: "Quintal" },
  { crop: "Tomato", market: "Nashik Mandi", currentPrice: 1500, historicalPrice: 1200, unit: "Quintal" },
  { crop: "Onion", market: "Lasalgaon Mandi", currentPrice: 1800, historicalPrice: 2100, unit: "Quintal" },
];

export default function MarketPricesPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader 
        title="Market Price Dashboard"
        description="Current and historical mandi prices for key crops in nearby markets."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crop</TableHead>
                <TableHead>Market</TableHead>
                <TableHead className="text-right">Current Price (per {marketData[0].unit})</TableHead>
                <TableHead className="text-right">Price Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marketData.map((item) => {
                 const trend = item.currentPrice > item.historicalPrice ? 'up' : item.currentPrice < item.historicalPrice ? 'down' : 'stable';
                 return(
                  <TableRow key={`${item.crop}-${item.market}`}>
                    <TableCell className="font-medium">{item.crop}</TableCell>
                    <TableCell>{item.market}</TableCell>
                    <TableCell className="text-right font-mono">₹{item.currentPrice.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right">
                       <Badge variant={trend === 'down' ? 'destructive' : trend === 'up' ? 'default' : 'secondary'} className="gap-1">
                        {trend === 'up' && <ArrowUp className="h-3 w-3" />}
                        {trend === 'down' && <ArrowDown className="h-3 w-3" />}
                        {trend === 'stable' && <Minus className="h-3 w-3" />}
                        {trend.charAt(0).toUpperCase() + trend.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                 )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
