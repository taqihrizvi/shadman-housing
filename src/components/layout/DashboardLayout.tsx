import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  PackageCheck,
  PackageX,
  PackagePlus,
  FileText,
  FileSignature,
  FileOutput,
  BarChart3,
  DollarSign,
  TrendingUp,
  Receipt,
  Menu,
  X,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: ReactNode;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: <Package className="h-5 w-5" />,
    children: [
      {
        title: "Sold Inventory",
        href: "/inventory/sold",
        icon: <PackageCheck className="h-4 w-4" />,
      },
      {
        title: "Unsold Inventory",
        href: "/inventory/unsold",
        icon: <PackageX className="h-4 w-4" />,
      },
      {
        title: "Add Inventory",
        href: "/inventory/add",
        icon: <PackagePlus className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Forms",
    href: "/forms",
    icon: <FileText className="h-5 w-5" />,
    children: [
      {
        title: "Biyana Form",
        href: "/forms/biyana",
        icon: <FileText className="h-4 w-4" />,
      },
      {
        title: "Sale Agreement",
        href: "/forms/sale-agreement",
        icon: <FileSignature className="h-4 w-4" />,
      },
      {
        title: "Transfer Form",
        href: "/forms/transfer",
        icon: <FileOutput className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: <BarChart3 className="h-5 w-5" />,
    children: [
      {
        title: "Sales Report",
        href: "/reports/sales",
        icon: <TrendingUp className="h-4 w-4" />,
      },
      {
        title: "Payment Report",
        href: "/reports/payment",
        icon: <DollarSign className="h-4 w-4" />,
      },
      {
        title: "Sold & Unsold",
        href: "/reports/comparison",
        icon: <BarChart3 className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Vouchers",
    href: "/vouchers",
    icon: <Receipt className="h-5 w-5" />,
  },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const NavLink = ({ item, isChild = false }: { item: NavItem; isChild?: boolean }) => (
    <Link
      to={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isChild ? "ml-6 py-2" : "",
        isActive(item.href)
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      )}
      onClick={() => setMobileMenuOpen(false)}
    >
      {item.icon}
      <span className={cn(sidebarOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden", "transition-all duration-200")}>
        {item.title}
      </span>
    </Link>
  );

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
          <Building2 className="h-6 w-6 text-sidebar-primary-foreground" />
        </div>
        <span className={cn(
          "text-xl font-bold text-sidebar-foreground transition-all duration-200",
          sidebarOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
        )}>
          LaHomes
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => (
          <div key={item.href}>
            <NavLink item={item} />
            {item.children && sidebarOpen && (
              <div className="mt-1 space-y-1">
                {item.children.map((child) => (
                  <NavLink key={child.href} item={child} isChild />
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className={cn(
          "flex items-center gap-3 transition-all duration-200",
          sidebarOpen ? "opacity-100" : "opacity-0"
        )}>
          <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-medium text-sidebar-accent-foreground">AD</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-sidebar-foreground truncate">Admin User</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">admin@lahomes.com</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 hidden lg:block",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <SidebarContent />
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-7 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-secondary"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-3 w-3" />
        </Button>
      </aside>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">LaHomes</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-sidebar pt-16 lg:hidden">
          <SidebarContent />
        </div>
      )}

      {/* Main Content */}
      <main
        className={cn(
          "min-h-screen transition-all duration-300 pt-16 lg:pt-0",
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
