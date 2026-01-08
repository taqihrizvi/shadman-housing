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
    <Card className={cn("border-l-4 card-hover", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2 flex-1 min-w-0 max-w-[calc(100%-60px)]">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "text-sm font-medium",
                    trend.positive ? "text-success" : "text-destructive"
                  )}
                >
                  {trend.positive ? "+" : ""}{trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
          <div className={cn("rounded-full p-2.5 flex-shrink-0 mt-1", iconBgStyles[variant])}>
            <Icon className="h-5 w-5" strokeWidth={2.5} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
