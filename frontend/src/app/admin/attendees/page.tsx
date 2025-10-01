'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { Search, Filter, Download, Upload, UserPlus, CheckCircle, XCircle, Calendar, Mail, Phone } from 'lucide-react';
import attendeeService, { Attendee } from '@/lib/attendees';
import eventService, { Event } from '@/lib/events';

export default function AttendeesPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      loadAttendees();
    }
  }, [events, selectedEvent, searchTerm, statusFilter, currentPage]);

  const loadEvents = async () => {
    try {
      const response = await eventService.getEvents({ page: 1 });
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const loadAttendees = async () => {
    try {
      setIsLoading(true);
      
      // Don't load attendees if no events are available yet
      if (events.length === 0) {
        setIsLoading(false);
        return;
      }
      
      // In a real implementation, this would filter by event, search term, etc.
      // For now, we'll load all attendees and filter client-side
      const allAttendees: Attendee[] = [];
      
      // Load attendees for each event if no specific event is selected
      if (selectedEvent === 'all') {
        for (const event of events) {
          try {
            console.log(`Loading attendees for event ${event.id}: ${event.name}`);
            const response = await attendeeService.getAttendees(event.id);
            console.log(`Loaded ${response.data.length} attendees for event ${event.id}`);
            allAttendees.push(...response.data.map((attendee: Attendee) => ({ ...attendee, event_name: event.name })));
          } catch (error: any) {
            console.error(`Failed to load attendees for event ${event.id}:`, error);
            console.error(`Error details:`, error.response?.data || error.message);
          }
        }
      } else {
        try {
          const eventId = parseInt(selectedEvent);
          console.log(`Loading attendees for specific event ${eventId}`);
          const response = await attendeeService.getAttendees(eventId);
          console.log(`Loaded ${response.data.length} attendees for event ${eventId}`);
          const event = events.find(e => e.id === eventId);
          allAttendees.push(...response.data.map((attendee: Attendee) => ({ ...attendee, event_name: event?.name || 'Unknown' })));
        } catch (error: any) {
          console.error(`Failed to load attendees for event ${selectedEvent}:`, error);
          console.error(`Error details:`, error.response?.data || error.message);
        }
      }

      // Apply client-side filtering
      let filtered = allAttendees;
      
      if (searchTerm) {
        filtered = filtered.filter(attendee => 
          attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          attendee.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(attendee => {
          if (statusFilter === 'checked-in') return attendee.checked_in_at;
          if (statusFilter === 'pending') return !attendee.checked_in_at;
          return true;
        });
      }

      console.log(`Total attendees loaded: ${allAttendees.length}`);
      console.log(`Filtered attendees: ${filtered.length}`);
      
      setAttendees(filtered);
      setTotalPages(Math.ceil(filtered.length / 20)); // 20 items per page
    } catch (error) {
      console.error('Failed to load attendees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async (attendeeId: number) => {
    try {
      await attendeeService.checkInAttendee(attendeeId);
      await loadAttendees(); // Reload attendees
    } catch (error) {
      console.error('Failed to check in attendee:', error);
      alert('Failed to check in attendee');
    }
  };

  const handleExport = async () => {
    try {
      showNotification('Preparing export...', 'success');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedEvent !== 'all') {
        params.append('event_id', selectedEvent);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      // Get token from cookie
      const getTokenFromCookie = () => {
        const cookies = document.cookie.split(';');
        const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
        return authCookie ? authCookie.split('=')[1] : localStorage.getItem('token');
      };

      // Make API request for export
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendees/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getTokenFromCookie()}`,
          'Accept': 'text/csv',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'attendees-export.csv';
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="(.+)"/);
        if (matches) {
          filename = matches[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showNotification(`Successfully exported attendees to ${filename}`, 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('Export failed. Please try again.', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const colors = {
      success: 'bg-green-600',
      error: 'bg-red-600', 
      warning: 'bg-orange-600'
    };
    
    const icons = {
      success: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>',
      error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>',
      warning: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>'
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 max-w-md`;
    notification.innerHTML = `
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        ${icons[type]}
      </svg>
      <span class="text-sm">${message}</span>
    `;
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  };

  const handleBulkImport = () => {
    router.push('/admin/attendees/import');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (attendee: Attendee) => {
    if (attendee.checked_in_at) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle size={12} className="mr-1" />
          Checked In
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <XCircle size={12} className="mr-1" />
        Pending
      </span>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendees</h1>
            <p className="text-gray-600">Manage event attendees and registrations</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkImport}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Upload size={20} />
              Import
            </button>
            <button
              onClick={handleExport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              title="Export attendees as CSV"
            >
              <Download size={20} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search attendees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Event Filter */}
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id.toString()}>
                  {event.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="checked-in">Checked In</option>
              <option value="pending">Pending</option>
            </select>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-600">
              <Filter size={16} className="mr-2" />
              {attendees.length} attendees
            </div>
          </div>
        </div>

        {/* Attendees Table */}
        {attendees.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No attendees found</h3>
            <p className="text-gray-600">No attendees match your current filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendees.slice((currentPage - 1) * 20, currentPage * 20).map((attendee) => (
                    <tr key={attendee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{attendee.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Mail size={12} />
                              {attendee.email}
                            </span>
                            {attendee.phone && (
                              <span className="flex items-center gap-1">
                                <Phone size={12} />
                                {attendee.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{(attendee as any).event_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(attendee)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(attendee.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {!attendee.checked_in_at && (
                            <button
                              onClick={() => handleCheckIn(attendee.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Check In
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/admin/attendees/${attendee.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-2 border border-gray-300 rounded-md bg-blue-50 text-blue-700">
              {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}