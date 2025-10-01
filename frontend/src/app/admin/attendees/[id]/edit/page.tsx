'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { ArrowLeft, Save } from 'lucide-react';
import attendeeService, { Attendee } from '@/lib/attendees';

export default function EditAttendeePage() {
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    designation: '',
    ticket_type: 'General',
  });
  
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
      const response = await attendeeService.getAttendee(attendeeId);
      setAttendee(response);
      
      setFormData({
        name: response.name,
        email: response.email,
        phone: response.phone || '',
        company: response.company || '',
        designation: response.designation || '',
        ticket_type: response.ticket_type,
      });
    } catch (error) {
      console.error('Failed to load attendee:', error);
      router.push('/admin/attendees');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    try {
      setIsSaving(true);
      await attendeeService.updateAttendee(attendeeId, formData);
      router.push(`/admin/attendees/${attendeeId}`);
    } catch (error) {
      console.error('Failed to update attendee:', error);
      alert('Failed to update attendee. Please try again.');
    } finally {
      setIsSaving(false);
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

  if (!attendee) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Attendee Not Found</h2>
          <p className="text-gray-600 mb-6">The attendee you're trying to edit doesn't exist.</p>
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push(`/admin/attendees/${attendeeId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Attendee</h1>
            <p className="text-gray-600">Update attendee information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Attendee Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label htmlFor="ticket_type" className="block text-sm font-medium text-gray-700 mb-2">
                    Ticket Type *
                  </label>
                  <select
                    id="ticket_type"
                    name="ticket_type"
                    value={formData.ticket_type}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="General">General</option>
                    <option value="VIP">VIP</option>
                    <option value="Student">Student</option>
                    <option value="Speaker">Speaker</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company/Organization
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title/Designation
                  </label>
                  <input
                    type="text"
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter job title"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Registration Info (Read-only) */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration Information</h2>
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div>
                <span className="text-gray-500">Registration ID:</span>
                <span className="ml-2 font-mono">{attendee.registration_id}</span>
              </div>
              <div>
                <span className="text-gray-500">Registration Source:</span>
                <span className="ml-2 capitalize">{attendee.registration_source}</span>
              </div>
              <div>
                <span className="text-gray-500">Registered:</span>
                <span className="ml-2">{new Date(attendee.created_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Check-in Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  attendee.is_checked_in 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {attendee.is_checked_in ? 'Checked In' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push(`/admin/attendees/${attendeeId}`)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}