import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "accent";
}

const variantStyles = {
  default: "border-l-primary",
  primary: "border-l-primary",
  success: "border-l-success",
  warning: "border-l-warning",
  accent: "border-l-accent",
};

const iconBgStyles = {
  default: "text-primary",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  accent: "text-accent",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  return (
    <Card className={cn("border-l-4 card-hover h-full", variantStyles[variant])}>
      <CardContent className="p-4 h-full">
        <div className="flex items-start justify-between gap-4 h-full">
          <div className="space-y-1.5 flex-1 min-w-0 max-w-[calc(100%-48px)]">
            <p className="text-xs font-medium text-muted-foreground line-clamp-2 min-h-[2rem]">{title}</p>
            <p className="text-xl font-bold tracking-tight">{value}</p>
            <div className="min-h-[1rem]">
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className="min-h-[1.25rem]">
              {trend && (
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      trend.positive ? "text-success" : "text-destructive"
                    )}
                  >
                    {trend.positive ? "+" : ""}{trend.value}%
                  </span>
                  <span className="text-[10px] text-muted-foreground">vs last month</span>
                </div>
              )}
            </div>
          </div>
          <div className={cn("rounded-full p-2 flex-shrink-0 mt-1", iconBgStyles[variant])}>
            <Icon className="h-4 w-4" strokeWidth={2.5} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
