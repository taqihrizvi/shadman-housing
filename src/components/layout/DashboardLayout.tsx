import { ReactNode, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  LogOut,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { getUserData, getUserRole, type UserRole } from "@/lib/rbac";

interface NavItem {
  title: string;
  href: string;
  icon: ReactNode;
  children?: NavItem[];
  roles?: UserRole[]; // Allowed roles
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
    roles: ['ADMIN', 'MANAGER'],
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
    roles: ['ADMIN', 'MANAGER'],
    children: [
      {
        title: "Biyana Form",
        href: "/forms/biyana",
        icon: <FileText className="h-4 w-4" />,
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        title: "Sale Agreement",
        href: "/forms/sale-agreement",
        icon: <FileSignature className="h-4 w-4" />,
        roles: ['ADMIN'],
      },
      {
        title: "Transfer Form",
        href: "/forms/transfer",
        icon: <FileOutput className="h-4 w-4" />,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    title: "Submitted Forms",
    href: "/submitted-forms",
    icon: <FileSignature className="h-5 w-5" />,
    roles: ['ADMIN', 'MANAGER'],
    children: [
      {
        title: "View Biyana Forms",
        href: "/submitted-forms/biyana",
        icon: <FileText className="h-4 w-4" />,
      },
      {
        title: "View Sales Agreement",
        href: "/submitted-forms/sale-agreement",
        icon: <FileSignature className="h-4 w-4" />,
      },
      {
        title: "View Transfer Forms",
        href: "/submitted-forms/transfer",
        icon: <FileOutput className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Payments",
    href: "/payments",
    icon: <DollarSign className="h-5 w-5" />,
    roles: ['ADMIN', 'MANAGER'],
    children: [
      {
        title: "Pending Payments",
        href: "/payments/pending",
        icon: <DollarSign className="h-4 w-4" />,
        roles: ['ADMIN'],
      },
      {
        title: "Record Payment",
        href: "/payments/record",
        icon: <Receipt className="h-4 w-4" />,
        roles: ['ADMIN', 'MANAGER'],
      },
    ],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ['ADMIN'],
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
    roles: ['ADMIN'],
  },
  {
    title: "Approvals",
    href: "/approvals",
    icon: <ClipboardCheck className="h-5 w-5" />,
    roles: ['ADMIN'],
  },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const userData = getUserData();
  const userRole = getUserRole();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userData");
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  // Filter navigation based on user role
  const canAccessItem = (item: NavItem): boolean => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(userRole);
  };

  const filteredNavigation = navigation.filter(item => canAccessItem(item)).map(item => {
    if (item.children) {
      return {
        ...item,
        children: item.children.filter(child => canAccessItem(child)),
      };
    }
    return item;
  });

  // Auto-expand parent when on a child route
  useEffect(() => {
    const currentPath = location.pathname;
    const parentItem = navigation.find(item => 
      item.children?.some(child => child.href === currentPath)
    );
    if (parentItem) {
      setExpandedItems([parentItem.href]);
    }
  }, [location.pathname]);

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev =>
      prev.includes(href)
        ? []
        : [href]
    );
  };

  const NavLink = ({ item, isChild = false }: { item: NavItem; isChild?: boolean }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.href);

    if (hasChildren) {
      return (
        <div>
          <button
            onClick={() => toggleExpanded(item.href)}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive(item.href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}
          >
            {item.icon}
            <span className={cn(sidebarOpen ? "opacity-100 flex-1 text-left" : "opacity-0 w-0 overflow-hidden", "transition-all duration-200")}>
              {item.title}
            </span>
            {sidebarOpen && (
              <svg
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isExpanded ? "rotate-180" : ""
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>
      );
    }

    return (
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
  };

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
          Shadman Housing
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {filteredNavigation.map((item) => (
          <div key={item.href}>
            <NavLink item={item} />
            {item.children && item.children.length > 0 && sidebarOpen && (
              <div 
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  expandedItems.includes(item.href) 
                    ? "max-h-96 opacity-100 mt-1" 
                    : "max-h-0 opacity-0"
                )}
              >
                <div className="space-y-1">
                  {item.children.map((child) => (
                    <NavLink key={child.href} item={child} isChild />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4 space-y-3">
        <div className={cn(
          "flex items-center gap-3 transition-all duration-200",
          sidebarOpen ? "opacity-100" : "opacity-0"
        )}>
          <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-medium text-sidebar-accent-foreground">
              {userData?.name?.substring(0, 2).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{userData?.name || 'User'}</p>
              <Badge variant={userRole === 'ADMIN' ? 'default' : userRole === 'MANAGER' ? 'secondary' : 'outline'} className="text-xs">
                {userRole}
              </Badge>
            </div>
            <p className="text-xs text-sidebar-foreground/60 truncate">{userData?.email || ''}</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start gap-2 transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground",
            !sidebarOpen && "justify-center"
          )}
        >
          <LogOut className="h-4 w-4" />
          <span className={cn(
            sidebarOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden",
            "transition-all duration-200"
          )}>
            Logout
          </span>
        </Button>
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
          <span className="text-lg font-bold">Shadman Housing</span>
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
