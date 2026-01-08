// Role-based access control utilities

export type UserRole = 'ADMIN' | 'MANAGER' | 'AGENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export const getUserData = (): User | null => {
  const userData = localStorage.getItem('userData');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }
  return null;
};

export const getUserRole = (): UserRole => {
  const user = getUserData();
  return user?.role || 'AGENT';
};

export const isAdmin = (): boolean => {
  return getUserRole() === 'ADMIN';
};

export const isManager = (): boolean => {
  return getUserRole() === 'MANAGER';
};

export const canAccessRoute = (allowedRoles: UserRole[]): boolean => {
  const userRole = getUserRole();
  return allowedRoles.includes(userRole);
};

// Navigation permissions by role
export const ROUTE_PERMISSIONS = {
  // Inventory
  '/inventory/sold': ['ADMIN', 'MANAGER'],
  '/inventory/unsold': ['ADMIN', 'MANAGER'],
  '/inventory/add': ['ADMIN', 'MANAGER'],
  
  // Forms
  '/forms/biyana': ['ADMIN', 'MANAGER'],
  '/forms/sale-agreement': ['ADMIN'],
  '/forms/transfer': ['ADMIN'],
  
  // Submitted Forms
  '/submitted-forms/biyana': ['ADMIN', 'MANAGER'],
  '/submitted-forms/sale-agreement': ['ADMIN'],
  '/submitted-forms/transfer': ['ADMIN'],
  
  // Payments
  '/payments/pending': ['ADMIN'],
  '/payments/record': ['ADMIN', 'MANAGER'],
  
  // Reports
  '/reports/sales': ['ADMIN'],
  '/reports/payment': ['ADMIN'],
  '/reports/comparison': ['ADMIN'],
  
  // Vouchers
  '/vouchers': ['ADMIN'],
  
  // Approvals
  '/approvals': ['ADMIN'],
} as const;
