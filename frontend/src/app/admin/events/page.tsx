'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { Plus, Edit, Trash2, Users, Calendar, Globe, Eye, ExternalLink, Copy, Check } from 'lucide-react';
import eventService, { Event } from '@/lib/events';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copiedEventId, setCopiedEventId] = useState<number | null>(null);
  const router = useRouter();

  const getRegistrationUrl = (event: Event) => {
    return `${window.location.origin}/register/${event.slug}`;
  };

  const copyRegistrationLink = async (event: Event) => {
    const url = getRegistrationUrl(event);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedEventId(event.id);
      setTimeout(() => setCopiedEventId(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedEventId(event.id);
      setTimeout(() => setCopiedEventId(null), 2000);
    }
  };

  const openRegistrationPage = (event: Event) => {
    const url = getRegistrationUrl(event);
    window.open(url, '_blank');
  };

  useEffect(() => {
    loadEvents();
  }, [currentPage]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const response = await eventService.getEvents({ page: currentPage });
      setEvents(response.data);
      setTotalPages(response.last_page || 1);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await eventService.deleteEvent(eventId);
      await loadEvents(); // Reload events
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event');
    }
  };

  const toggleEventStatus = async (eventId: number) => {
    try {
      await eventService.toggleEventStatus(eventId);
      await loadEvents(); // Reload events
    } catch (error) {
      console.error('Failed to toggle event status:', error);
      alert('Failed to update event status');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString || dateString === 'null' || dateString === 'undefined') {
        return 'No Date Set';
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Try parsing different formats
        const cleanDate = dateString.replace(/\s+/g, ' ').trim();
        const retryDate = new Date(cleanDate);
        if (isNaN(retryDate.getTime())) {
          return 'Invalid Date';
        }
        return retryDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-600">Manage your events and registrations</p>
          </div>
          <button
            onClick={() => router.push('/admin/events/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Create Event
          </button>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first event</p>
            <button
              onClick={() => router.push('/admin/events/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Event Image */}
                {event.banner && (
                  <div className="h-48 bg-gray-200">
                    <img
                      src={`${process.env.NEXT_PUBLIC_STORAGE_URL}/${event.banner}`}
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* Event Title & Status */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {event.name}
                    </h3>
                    <div className="flex gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          event.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {event.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          event.status === 'published'
                            ? 'bg-blue-100 text-blue-800'
                            : event.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar size={16} className="mr-2" />
                      {formatDate(event.event_date)}
                    </div>
                    {event.venue && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Globe size={16} className="mr-2" />
                        {event.venue}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Users size={16} className="mr-2" />
                      {event.total_attendees || 0} attendees
                    </div>
                  </div>

                  {/* Registration Link */}
                  {event.status === 'published' && event.is_active && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800 mb-2">
                        🔗 Registration Link
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyRegistrationLink(event)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-md text-sm font-medium transition-colors"
                          title="Copy registration link"
                        >
                          {copiedEventId === event.id ? (
                            <>
                              <Check size={16} />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={16} />
                              Copy Link
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => openRegistrationPage(event)}
                          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                          title="Open registration page"
                        >
                          <ExternalLink size={16} />
                          View
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                     <button
                      onClick={() => toggleEventStatus(event.id)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        event.is_active
                          ? 'bg-red-50 hover:bg-red-100 text-red-700'
                          : 'bg-green-50 hover:bg-green-100 text-green-700'
                      }`}
                    >
                      {event.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => router.push(`/admin/events/${event.id}`)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye size={16} />
                      
                    </button>
                    <button
                      onClick={() => router.push(`/admin/events/${event.id}/edit`)}
                      className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit size={16} />
                      
                    </button>
                   
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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