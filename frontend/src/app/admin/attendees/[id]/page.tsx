'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { ArrowLeft, Edit, Download, QrCode, CheckCircle, XCircle, Calendar, Mail, Phone, Clock, MapPin } from 'lucide-react';
import attendeeService, { Attendee } from '@/lib/attendees';
import eventService, { Event } from '@/lib/events';

export default function AttendeeDetailsPage() {
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const router = useRouter();
  const params = useParams();
  const attendeeId = parseInt(params.id as string);

  useEffect(() => {
    if (attendeeId) {
      loadAttendee();
    }
  }, [attendeeId]);

  const loadAttendee = async () => {
    try {
      setIsLoading(true);
      const attendeeResponse = await attendeeService.getAttendee(attendeeId);
      setAttendee(attendeeResponse);
      
      // Load event details
      if (attendeeResponse.event_id) {
        const eventResponse = await eventService.getEvent(attendeeResponse.event_id);
        setEvent(eventResponse);
      }
    } catch (error) {
      console.error('Failed to load attendee:', error);
      router.push('/admin/attendees');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!attendee || attendee.is_checked_in) return;

    try {
      setIsCheckingIn(true);
      await attendeeService.checkInAttendee(attendeeId);
      await loadAttendee(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to check in attendee:', error);
      alert('Failed to check in attendee');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleDownloadQR = async () => {
    if (!attendee?.qr_code?.id) {
      alert('QR code not available for this attendee');
      return;
    }

    try {
      const blob = await attendeeService.downloadQrCode(attendee.qr_code.id);
      
      // Create temporary link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-code-${attendee.registration_id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download QR code:', error);
      alert('QR code download failed. The QR code image may not exist yet.');
    }
  };

  const handleGenerateQR = async () => {
    if (!attendee) return;

    try {
      setIsLoading(true);
      const response = await attendeeService.generateQrCode(attendeeId);
      alert(response.message);
      await loadAttendee(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      alert('Failed to generate QR code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateQR = async () => {
    if (!attendee) return;

    if (!confirm('Are you sure you want to regenerate the QR code? The old QR code will no longer work.')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await attendeeService.regenerateQrCode(attendeeId);
      alert(response.message);
      await loadAttendee(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to regenerate QR code:', error);
      alert('Failed to regenerate QR code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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

  if (!attendee) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Attendee Not Found</h2>
          <p className="text-gray-600 mb-6">The attendee you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/admin/attendees')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Attendees
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/attendees')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{attendee.name}</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-gray-600">#{attendee.registration_id}</span>
                <span className={`px-2 py-1 text-sm font-medium rounded-full ${
                  attendee.is_checked_in 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {attendee.is_checked_in ? 'Checked In' : 'Pending Check-in'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            {attendee.qr_code ? (
              <>
                <button
                  onClick={handleDownloadQR}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
                >
                  <Download size={16} />
                  Download QR
                </button>
                <button
                  onClick={handleRegenerateQR}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
                >
                  <QrCode size={16} />
                  Regenerate QR
                </button>
              </>
            ) : (
              <button
                onClick={handleGenerateQR}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
              >
                <QrCode size={16} />
                Generate QR Code
              </button>
            )}
            
            {!attendee.is_checked_in && (
              <button
                onClick={handleCheckIn}
                disabled={isCheckingIn}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 disabled:opacity-50"
              >
                {isCheckingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Checking In...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Check In
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={() => router.push(`/admin/attendees/${attendeeId}/edit`)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
            >
              <Edit size={16} />
              Edit
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Mail className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{attendee.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{attendee.email}</p>
                  </div>
                </div>

                {attendee.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{attendee.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Event Information */}
            {event && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h2>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Event</p>
                      <p className="font-medium">{event.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p className="font-medium">{formatDate(event.event_date)}</p>
                      <p className="text-sm text-gray-500">{event.event_time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Venue</p>
                      <p className="font-medium">{event.venue}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Data */}
            {attendee.custom_data && Object.keys(attendee.custom_data).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(attendee.custom_data).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-gray-500 capitalize">{key.replace('_', ' ')}</p>
                      <p className="font-medium">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h2>
              
              {attendee.qr_code ? (
                <div className="text-center">
                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <QrCode size={120} className="mx-auto text-green-600" />
                    <p className="text-sm text-gray-500 mt-2">QR Code Available</p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={handleDownloadQR}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg inline-flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Download QR Code
                    </button>
                    <button
                      onClick={handleRegenerateQR}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg inline-flex items-center justify-center gap-2"
                    >
                      <QrCode size={16} />
                      Regenerate QR
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <XCircle size={48} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 mb-4">No QR code available</p>
                  <button
                    onClick={handleGenerateQR}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg inline-flex items-center justify-center gap-2"
                  >
                    <QrCode size={16} />
                    Generate QR Code
                  </button>
                </div>
              )}
            </div>

            {/* Registration Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration Details</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Registration ID</p>
                  <p className="font-medium font-mono">{attendee.registration_id}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Registration Source</p>
                  <p className="font-medium capitalize">{attendee.registration_source}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Registered On</p>
                  <p className="font-medium">{formatDateTime(attendee.created_at)}</p>
                </div>
                
                {attendee.checked_in_at && (
                  <div>
                    <p className="text-sm text-gray-500">Checked In</p>
                    <p className="font-medium">{formatDateTime(attendee.checked_in_at)}</p>
                    {attendee.checked_in_by_user && (
                      <p className="text-sm text-gray-500">By: {attendee.checked_in_by_user.name}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Check-in Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Check-in Status</h2>
              
              <div className="text-center">
                {attendee.is_checked_in ? (
                  <div>
                    <CheckCircle size={48} className="mx-auto text-green-500 mb-2" />
                    <p className="text-green-600 font-medium">Checked In</p>
                    {attendee.checked_in_at && (
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDateTime(attendee.checked_in_at)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <XCircle size={48} className="mx-auto text-yellow-500 mb-2" />
                    <p className="text-yellow-600 font-medium">Pending Check-in</p>
                    <button
                      onClick={handleCheckIn}
                      disabled={isCheckingIn}
                      className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {isCheckingIn ? 'Checking In...' : 'Check In Now'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}