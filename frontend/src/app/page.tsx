'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import { Calendar, Users, QrCode, Star, Shield, Zap } from 'lucide-react';
import authService from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to their appropriate dashboard
    if (authService.isAuthenticated()) {
      const user = authService.getUser();
      if (user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/staff');
      }
    }
  }, [router]);

  const features = [
    {
      icon: Calendar,
      title: 'Event Management',
      description: 'Create and manage events with custom branding and registration forms.',
    },
    {
      icon: Users,
      title: 'Attendee Tracking',
      description: 'Track registrations, manage attendee data, and monitor check-ins.',
    },
    {
      icon: QrCode,
      title: 'QR Code Check-in',
      description: 'Generate unique QR codes for each attendee with seamless mobile scanning.',
    },
    {
      icon: Star,
      title: 'Custom Branding',
      description: 'Brand your events with custom logos, colors, and themes.',
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with role-based access control.',
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Get instant updates on registrations and check-ins.',
    },
  ];

  return (
    <PublicLayout>
      <div className="space-y-16">
        {/* Hero Section */}
        <section className="text-center py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Professional Event Registration
              <span className="text-blue-600"> Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Streamline your event management with our comprehensive platform. 
              From registration to check-in, we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Shield className="w-5 h-5 mr-2" />
                Staff Login
              </Link>
              <a
                href="#features"
                className="inline-flex items-center px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 bg-white rounded-2xl shadow-sm">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Everything You Need for Event Success
              </h2>
              <p className="text-lg text-gray-600">
                Powerful features designed to make event management effortless
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl text-white text-center">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of event organizers who trust our platform
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Access System
            </Link>
          </div>
        </section>

        {/* Demo Credentials */}
        <section className="py-8 bg-gray-50 rounded-xl">
          <div className="max-w-2xl mx-auto text-center px-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Demo Credentials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-4 rounded-lg">
                <p className="font-medium text-gray-900">Admin Access</p>
                <p className="text-gray-600">admin@eventregistration.com</p>
                <p className="text-gray-600">password123</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="font-medium text-gray-900">Staff Access</p>
                <p className="text-gray-600">staff@eventregistration.com</p>
                <p className="text-gray-600">password123</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}