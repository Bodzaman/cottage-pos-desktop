import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, ShoppingCart, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  globalColors as colors,
  styles,
  effects,
} from "utils/QSAIDesign";

const cardStyle = {
  backgroundColor: colors.background.secondary,
  color: colors.text.primary,
  border: `1px solid ${colors.border.secondary}`,
  ...effects.neuMorphism,
};

interface MenuPreviewData {
  lastUpdated: string;
  totalItems: number;
  activeItems: number;
}

interface OnlineOrdersCardProps {
  menuData: MenuPreviewData | null;
  isLoading: boolean;
  formatLastUpdate: (timestamp: string) => string;
}

const OnlineOrdersCard: React.FC<OnlineOrdersCardProps> = ({ 
  menuData, 
  isLoading, 
  formatLastUpdate 
}) => {
  if (isLoading) {
    return (
      <Card style={cardStyle} className="h-[400px]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" style={{ color: colors.brand.purple }} />
            <CardTitle style={{ color: colors.text.primary }} className="font-bold">Online Orders</CardTitle>
          </div>
          <CardDescription style={{ color: colors.text.secondary }}>
            Live preview of the customer ordering platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Separator />
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-6 w-1/4" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-6 w-1/4" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!menuData) {
    return (
      <Card style={cardStyle} className="h-[400px]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" style={{ color: colors.brand.warning }} />
            <CardTitle style={{ color: colors.text.primary }} className="font-bold">Online Orders</CardTitle>
          </div>
          <CardDescription style={{ color: colors.text.secondary }}>
            Data unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-full">
          <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
          <p className="text-lg font-semibold">Could not load menu data</p>
          <p className="text-sm text-gray-400">Please check the connection or try again later.</p>
        </CardContent>
      </Card>
    );
  }

  const { lastUpdated, totalItems, activeItems } = menuData;
  const isSynced = totalItems > 0 && activeItems === totalItems;

  return (
    <Card style={cardStyle} className="h-[400px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" style={{ color: colors.brand.purple }} />
              <CardTitle style={{ color: colors.text.primary }} className="font-bold">Online Orders</CardTitle>
            </div>
            <CardDescription style={{ color: colors.text.secondary }}>
              Live customer ordering channel.
            </CardDescription>
          </div>
          <Badge variant={isSynced ? "secondary" : "destructive"} className="flex items-center gap-1">
            {isSynced ? <CheckCircle className="h-4 w-4 text-green-400" /> : <AlertCircle className="h-4 w-4" />}
            {isSynced ? 'Live' : 'Needs Attention'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="mb-4 bg-slate-800/50 p-3 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: colors.text.secondary }} className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Last Synced
                </span>
                <span className="font-mono text-xs font-semibold">{formatLastUpdate(lastUpdated)}</span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span style={{ color: colors.text.secondary }}>Total Menu Items</span>
                <span style={{ color: colors.text.primary }} className="font-semibold">{totalItems}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span style={{ color: colors.text.secondary }}>Published & Active</span>
                <span className="font-semibold" style={{ color: isSynced ? colors.brand.success : colors.brand.warning }}>
                  {activeItems}
                </span>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <p style={{ color: colors.text.secondary }} className="text-xs">
              This reflects the live menu available to customers for online ordering.
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full font-bold"
          style={{
            ...styles.button.primary,
            color: colors.text.primary,
          }}
        >
          Go to Online Orders
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OnlineOrdersCard;
