'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { ArrowLeft, Edit, Users, Calendar, Globe, MapPin, Clock, DollarSign, Tag, CheckCircle, XCircle, ExternalLink, Copy, Check } from 'lucide-react';
import eventService, { Event } from '@/lib/events';
import attendeeService, { Attendee } from '@/lib/attendees';

export default function EventDetailsPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attendeesLoading, setAttendeesLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const router = useRouter();
  const params = useParams();
  const eventId = parseInt(params.id as string);

  const getRegistrationUrl = () => {
    if (!event) return '';
    return `${window.location.origin}/register/${event.slug}`;
  };

  const copyRegistrationLink = async () => {
    const url = getRegistrationUrl();
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const openRegistrationPage = () => {
    const url = getRegistrationUrl();
    window.open(url, '_blank');
  };

  useEffect(() => {
    if (eventId) {
      loadEvent();
      loadAttendees();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setIsLoading(true);
      const response = await eventService.getEvent(eventId);
      setEvent(response);
    } catch (error) {
      console.error('Failed to load event:', error);
      router.push('/admin/events');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAttendees = async () => {
    try {
      setAttendeesLoading(true);
      const response = await attendeeService.getAttendees(eventId);
      setAttendees(response.data);
    } catch (error) {
      console.error('Failed to load attendees:', error);
    } finally {
      setAttendeesLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Invalid Date';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString: string) => {
    try {
      if (!timeString) return 'Invalid Time';
      
      // Handle different time formats
      if (timeString.includes('T') || timeString.includes(' ')) {
        // Full datetime string
        const date = new Date(timeString);
        if (isNaN(date.getTime())) {
          return timeString; // Return original if can't parse
        }
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } else {
        // Time-only format (HH:MM:SS or HH:MM)
        const date = new Date(`2000-01-01T${timeString}`);
        if (isNaN(date.getTime())) {
          return timeString; // Return original if can't parse
        }
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
    } catch (error) {
      return timeString; // Return original if error
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!event) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/admin/events')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Events
          </button>
        </div>
      </AdminLayout>
    );
  }

  const checkedInCount = attendees.filter(a => a.checked_in_at).length;
  const totalAttendees = attendees.length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/events')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className={`px-2 py-1 text-sm font-medium rounded-full ${
                  event.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {event.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className={`px-2 py-1 text-sm font-medium rounded-full ${
                  event.status === 'published' ? 'bg-blue-100 text-blue-800' :
                  event.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push(`/admin/events/${eventId}/edit`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
          >
            <Edit size={20} />
            Edit Event
          </button>
        </div>

        {/* Event Banner */}
        {event.banner && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <img
              src={`${process.env.NEXT_PUBLIC_STORAGE_URL}/${event.banner}`}
              alt={event.name}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Registration Link */}
        {event.status === 'published' && event.is_active && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  🔗 Public Registration Link
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Share this link with attendees so they can register for your event
                </p>
                <div className="bg-white p-3 rounded-lg border border-gray-200 font-mono text-sm text-gray-800 break-all">
                  {getRegistrationUrl()}
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-6">
                <button
                  onClick={copyRegistrationLink}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  {linkCopied ? (
                    <>
                      <Check size={20} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={20} />
                      Copy Link
                    </>
                  )}
                </button>
                <button
                  onClick={openRegistrationPage}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <ExternalLink size={20} />
                  Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Event Details Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h2>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Calendar className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{formatDate(event.event_date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{event.event_time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Venue</p>
                    <p className="font-medium">{event.venue || 'Not specified'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Capacity</p>
                    <p className="font-medium">{event.max_attendees || 'Unlimited'}</p>
                  </div>
                </div>




              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                <div className="prose max-w-none text-gray-700">
                  <p>{event.description}</p>
                </div>
              </div>
            )}

            {/* Custom Fields */}
            {(() => {
              // Parse custom_fields if it's a string, otherwise use as is
              let customFields = event.custom_fields;
              
              // Handle string parsing
              if (typeof customFields === 'string') {
                try {
                  customFields = JSON.parse(customFields);
                } catch (e) {
                  console.error('Error parsing custom fields:', e);
                  customFields = [];
                }
              }
              
              // Ensure it's an array
              if (!Array.isArray(customFields)) {
                customFields = [];
              }
              
              return customFields && customFields.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Registration Fields</h2>
                  <div className="space-y-3">
                    {customFields.map((field, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{field.label}</p>
                          <p className="text-sm text-gray-500">{field.type} - {field.required ? 'Required' : 'Optional'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Attendance Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Registered</span>
                  <span className="font-bold text-2xl text-blue-600">{totalAttendees}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Checked In</span>
                  <span className="font-bold text-2xl text-green-600">{checkedInCount}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-bold text-2xl text-yellow-600">{totalAttendees - checkedInCount}</span>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Check-in Progress</span>
                    <span>{totalAttendees > 0 ? Math.round((checkedInCount / totalAttendees) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${totalAttendees > 0 ? (checkedInCount / totalAttendees) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Attendees */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Registrations</h2>
              
              {attendeesLoading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : attendees.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No registrations yet</p>
              ) : (
                <div className="space-y-3">
                  {attendees.slice(0, 5).map((attendee) => (
                    <div key={attendee.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {attendee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{attendee.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500 truncate">{attendee.email}</p>
                          {attendee.checked_in_at ? (
                            <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle size={14} className="text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {attendees.length > 5 && (
                    <button
                      onClick={() => router.push(`/admin/attendees?event=${eventId}`)}
                      className="w-full text-center text-blue-600 hover:text-blue-700 text-sm font-medium py-2"
                    >
                      View all {attendees.length} attendees
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}