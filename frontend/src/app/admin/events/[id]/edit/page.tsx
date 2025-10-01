'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react';
import eventService, { Event, CustomField } from '@/lib/events';

export default function EditEventPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    venue: '',
    event_date: '',
    event_time: '',
    max_attendees: '',
    status: 'draft' as 'draft' | 'published' | 'closed',
  });
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [banner, setBanner] = useState<File | null>(null);
  const [eventLogo, setEventLogo] = useState<File | null>(null);
  const router = useRouter();
  const params = useParams();
  const eventId = parseInt(params.id as string);

  // Helper functions for date/time formatting
  const formatDateForInput = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (error) {
      return '';
    }
  };

  const formatTimeForInput = (timeString: string) => {
    try {
      if (!timeString) return '';
      
      // If it's already in HH:MM format, return as is
      if (timeString.match(/^\d{2}:\d{2}$/)) {
        return timeString;
      }
      
      // If it's in HH:MM:SS format, remove seconds
      if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
        return timeString.substring(0, 5);
      }
      
      // If it's a full datetime, extract time part
      if (timeString.includes('T') || timeString.includes(' ')) {
        const date = new Date(timeString);
        if (isNaN(date.getTime())) {
          return '';
        }
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      }
      
      return timeString;
    } catch (error) {
      return '';
    }
  };

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setIsLoading(true);
      const response = await eventService.getEvent(eventId);
      setEvent(response);
      
      // Populate form data with proper formatting
      setFormData({
        name: response.name,
        description: response.description || '',
        venue: response.venue,
        event_date: formatDateForInput(response.event_date),
        event_time: formatTimeForInput(response.event_time),
        max_attendees: response.max_attendees?.toString() || '',
        status: response.status,
      });
      
      // Handle custom fields parsing
      let parsedCustomFields = response.custom_fields || [];
      if (typeof parsedCustomFields === 'string') {
        try {
          parsedCustomFields = JSON.parse(parsedCustomFields);
        } catch (e) {
          console.error('Error parsing custom fields:', e);
          parsedCustomFields = [];
        }
      }
      // Ensure it's an array
      if (!Array.isArray(parsedCustomFields)) {
        parsedCustomFields = [];
      }
      setCustomFields(parsedCustomFields);
    } catch (error) {
      console.error('Failed to load event:', error);
      router.push('/admin/events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomFieldChange = (index: number, field: string, value: any) => {
    setCustomFields(prev => prev.map((cf, i) => 
      i === index ? { ...cf, [field]: value } : cf
    ));
  };

  const addCustomField = () => {
    setCustomFields(prev => [...prev, {
      name: '',
      label: '',
      type: 'text',
      required: false,
      options: []
    }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    try {
      setIsSaving(true);
      
      const updateData = {
        ...formData,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : undefined,
        custom_fields: customFields,
        banner: banner || undefined,
        event_logo: eventLogo || undefined,
      };

      await eventService.updateEvent(eventId, updateData);
      router.push(`/admin/events/${eventId}`);
    } catch (error) {
      console.error('Failed to update event:', error);
      alert('Failed to update event. Please try again.');
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

  if (!event) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
          <p className="text-gray-600 mb-6">The event you're trying to edit doesn't exist.</p>
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

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/admin/events/${eventId}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
              <p className="text-gray-600">Update event information and settings</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter event name"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter event description"
                />
              </div>

              <div>
                <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
                  Venue *
                </label>
                <input
                  type="text"
                  id="venue"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter venue"
                />
              </div>

              <div>
                <label htmlFor="max_attendees" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Attendees
                </label>
                <input
                  type="number"
                  id="max_attendees"
                  name="max_attendees"
                  value={formData.max_attendees}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div>
                <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date *
                </label>
                <input
                  type="date"
                  id="event_date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="event_time" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Time *
                </label>
                <input
                  type="text"
                  id="event_time"
                  name="event_time"
                  value={formData.event_time}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 10:00 AM - 5:00 PM"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Event Images</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="banner" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Banner
                </label>
                <input
                  type="file"
                  id="banner"
                  accept="image/*"
                  onChange={(e) => setBanner(e.target.files?.[0] || null)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {event.banner && (
                  <div className="mt-2">
                    <img
                      src={`${process.env.NEXT_PUBLIC_STORAGE_URL}/${event.banner}`}
                      alt="Current banner"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Current banner</p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="event_logo" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Logo
                </label>
                <input
                  type="file"
                  id="event_logo"
                  accept="image/*"
                  onChange={(e) => setEventLogo(e.target.files?.[0] || null)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {event.event_logo && (
                  <div className="mt-2">
                    <img
                      src={event.event_logo}
                      alt="Current logo"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Current logo</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Custom Registration Fields</h2>
              <button
                type="button"
                onClick={addCustomField}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Add Field
              </button>
            </div>

            {!Array.isArray(customFields) || customFields.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No custom fields added yet.</p>
            ) : (
              <div className="space-y-4">
                {customFields.map((field, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-sm font-medium text-gray-900">Field {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeCustomField(index)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Field Name
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => handleCustomFieldChange(index, 'name', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          placeholder="field_name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Display Label
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleCustomFieldChange(index, 'label', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          placeholder="Field Label"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Field Type
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => handleCustomFieldChange(index, 'type', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="number">Number</option>
                          <option value="select">Select</option>
                          <option value="textarea">Textarea</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center">
                      <input
                        type="checkbox"
                        id={`required-${index}`}
                        checked={field.required}
                        onChange={(e) => handleCustomFieldChange(index, 'required', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <label htmlFor={`required-${index}`} className="ml-2 text-sm text-gray-700">
                        Required field
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push(`/admin/events/${eventId}`)}
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