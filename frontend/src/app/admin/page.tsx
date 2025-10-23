'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { Calendar, Users, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import eventService, { Event } from '@/lib/events';
import authService from '@/lib/auth';

interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalAttendees: number;
  checkedInAttendees: number;
}

interface RecentEvent extends Event {
  attendees_count?: number;
  checked_in_count?: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalAttendees: 0,
    checkedInAttendees: 0,
  });
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated and is admin
    const user = authService.getUser();
    const token = authService.getToken();
    
    if (!token || !user || user.role !== 'admin') {
      router.push('/auth/login');
      return;
    }

    const loadDashboardData = async () => {
      try {
        // Wait a moment to ensure token is set in axios
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Load recent events
        const eventsResponse = await eventService.getEvents({ page: 1 });
        const events = eventsResponse.data;
        setRecentEvents(events.slice(0, 5));

        // Calculate stats
        const totalEvents = events.length;
        const activeEvents = events.filter(e => e.is_active && e.status === 'published').length;
        const totalAttendees = events.reduce((sum, event) => sum + (event.total_attendees || 0), 0);
        const checkedInAttendees = events.reduce((sum, event) => sum + (event.checked_in_attendees || 0), 0);

        setStats({
          totalEvents,
          activeEvents,
          totalAttendees,
          checkedInAttendees,
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

  const statCards = [
    {
      title: 'Total Events',
      value: stats.totalEvents,
      icon: Calendar,
      color: 'bg-blue-500',
       
    },
    {
      title: 'Active Events',
      value: stats.activeEvents,
      icon: TrendingUp,
      color: 'bg-green-500',
     
    },
    {
      title: 'Total Attendees',
      value: stats.totalAttendees,
      icon: Users,
      color: 'bg-purple-500',
       
    },
    {
      title: 'Checked In',
      value: stats.checkedInAttendees,
      icon: CheckCircle,
      color: 'bg-orange-500',
       
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your events.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <div className="flex items-center">
                      <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                       
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Events</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
                <div key={event.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{event.name}</h3>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(event.event_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {event.total_attendees || 0} attendees
                        </span>
                        <span className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {event.checked_in_attendees || 0} checked in
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`
                        px-2 py-1 text-xs font-semibold rounded-full
                        ${event.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : event.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                        }
                      `}>
                        {event.status}
                      </span>
                      {event.is_active && (
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No events yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first event.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
            <div className="space-y-3">
              <a
                href="/admin/events/create"
                className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
              >
                Create New Event
              </a>
              <a
                href="/admin/attendees"
                className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
              >
                Manage Attendees
              </a>
              <a
                href="/staff"
                className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
              >
                QR Scanner
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Event Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Published</span>
                <span className="font-medium">
                  {recentEvents.filter(e => e.status === 'published').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Draft</span>
                <span className="font-medium">
                  {recentEvents.filter(e => e.status === 'draft').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Closed</span>
                <span className="font-medium">
                  {recentEvents.filter(e => e.status === 'closed').length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Attendance Rate</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.totalAttendees > 0 
                  ? Math.round((stats.checkedInAttendees / stats.totalAttendees) * 100)
                  : 0
                }%
              </div>
              <p className="text-sm text-gray-600 mt-1">Overall check-in rate</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}