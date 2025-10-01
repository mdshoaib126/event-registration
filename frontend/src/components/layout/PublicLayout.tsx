'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import clientBrandingService, { ClientBranding } from '@/lib/branding';

interface PublicLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function PublicLayout({ children, title }: PublicLayoutProps) {
  const [branding, setBranding] = useState<ClientBranding | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const response = await clientBrandingService.getPublicBranding();
        setBranding(response.branding);
        setLogoUrl(response.logo_url || null);
      } catch (error) {
        console.error('Failed to load branding:', error);
        // Use default branding
        setBranding({
          id: 0,
          company_name: 'Event Registration System',
          company_description: 'Professional Event Management',
          primary_color: '#007bff',
          secondary_color: '#6c757d',
          accent_color: '#28a745',
          is_active: true,
          created_at: '',
          updated_at: '',
        });
      }
    };

    loadBranding();
  }, []);

  if (!branding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
      style={{
        '--primary-color': branding.primary_color,
        '--secondary-color': branding.secondary_color,
        '--accent-color': branding.accent_color,
      } as React.CSSProperties}
    >
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              {logoUrl && (
                <div className="relative w-12 h-12">
                  <Image
                    src={logoUrl}
                    alt={branding.company_name}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <div>
                <h1 
                  className="text-2xl font-bold"
                  style={{ color: branding.primary_color }}
                >
                  {branding.company_name}
                </h1>
                {branding.company_description && (
                  <p className="text-sm text-gray-600">
                    {branding.company_description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        {title && (
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <h1 
                className="text-3xl font-bold"
                style={{ color: branding.primary_color }}
              >
                {title}
              </h1>
            </div>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} {branding.company_name}. 
              All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .btn-primary {
          background-color: var(--primary-color);
          border-color: var(--primary-color);
        }
        .btn-primary:hover {
          background-color: var(--primary-color);
          opacity: 0.9;
        }
        .text-primary {
          color: var(--primary-color);
        }
        .border-primary {
          border-color: var(--primary-color);
        }
        .bg-primary {
          background-color: var(--primary-color);
        }
      `}</style>
    </div>
  );
}