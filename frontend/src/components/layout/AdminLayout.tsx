'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Calendar, 
  Users, 
  QrCode, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  BarChart3,
  Palette
} from 'lucide-react';
import authService from '@/lib/auth';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
  staffOnly?: boolean;
  hideForStaff?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(authService.getUser());
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    router.push('/auth/login');
  };

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: BarChart3,
      adminOnly: true,  // Only admins see admin dashboard
    },
    {
      name: 'Dashboard',
      href: '/staff',
      icon: BarChart3,
      staffOnly: true,  // Only staff see staff dashboard
    },
    {
      name: 'Events',
      href: '/admin/events',
      icon: Calendar,
      adminOnly: true,
    },
    {
      name: 'Attendees',
      href: '/admin/attendees',
      icon: Users,
      adminOnly: true,  // Only admins can manage all attendees
    },
    {
      name: 'Check-in',
      href: '/staff',
      icon: QrCode,
      adminOnly: false,  // Both staff and admin can access
      hideForStaff: true,  // Hide this link for staff since they have dashboard
    },
    {
      name: 'Branding',
      href: '/admin/branding',
      icon: Palette,
      adminOnly: true,
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      adminOnly: true,
    },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!user) return false;
    
    // Show admin-only items only to admins
    if (item.adminOnly && user.role !== 'admin') return false;
    
    // Show staff-only items only to staff
    if (item.staffOnly && user.role !== 'event_staff') return false;
    
    // Hide check-in link for staff users (they have it as dashboard)
    if (item.hideForStaff && user.role === 'event_staff') return false;
    
    return true;
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">
            Event Management System
          </h1>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (pathname.startsWith(item.href) && item.href !== '/admin');
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const authenticated = authService.isAuthenticated();
    setIsAuthenticated(authenticated);
    
    if (!authenticated) {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  // Show loading during hydration
  if (!isClient) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white shadow-sm border-b px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="ml-2 text-lg font-semibold text-gray-900">
              Event System
            </h1>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}