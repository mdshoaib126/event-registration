'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import PublicLayout from '@/components/layout/PublicLayout';
import { Calendar, MapPin, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import eventService, { Event } from '@/lib/events';
import attendeeService, { RegisterAttendeeData } from '@/lib/attendees';

interface EventData {
  event: Event;
  is_full: boolean;
  attendees_count: number;
}

export default function EventRegistrationPage() {
  const params = useParams();
  const eventSlug = params.eventSlug as string;
  
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    qrCodeUrl?: string;
  } | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterAttendeeData>();

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const data = await eventService.getPublicEvent(eventSlug);
        setEventData(data);
      } catch (error) {
        console.error('Failed to load event:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (eventSlug) {
      loadEvent();
    }
  }, [eventSlug]);

  const onSubmit = async (data: RegisterAttendeeData) => {
    if (!eventData) return;

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const result = await attendeeService.registerAttendee(eventSlug, data);
      
      setSubmitResult({
        success: true,
        message: result.message,
        qrCodeUrl: result.qr_code_url,
      });
      
      reset();
    } catch (error: any) {
      setSubmitResult({
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </PublicLayout>
    );
  }

  if (!eventData) {
    return (
      <PublicLayout title="Event Not Found">
        <div className="text-center py-16">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600">
            The event you're looking for doesn't exist or is no longer available.
          </p>
        </div>
      </PublicLayout>
    );
  }

  const { event, is_full, attendees_count } = eventData;

  // Show success message if registration completed
  if (submitResult?.success) {
    return (
      <PublicLayout title={`Registration Successful - ${event.name}`}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              Registration Successful!
            </h2>
            <p className="text-green-700 mb-6">
              {submitResult.message}
            </p>
            
            <div className="bg-white rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Your QR Code
              </h3>
              {submitResult.qrCodeUrl && (
                <div className="flex flex-col items-center space-y-4">
                  <img
                    src={submitResult.qrCodeUrl}
                    alt="Registration QR Code"
                    className="w-48 h-48 border border-gray-200 rounded-lg"
                  />
                  <p className="text-sm text-gray-600 text-center">
                    Save this QR code for event check-in. You'll also receive it via email.
                  </p>
                  <a
                    href={submitResult.qrCodeUrl}
                    download="event-qr-code.png"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download QR Code
                  </a>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-600">
              <p className="font-medium">Event Details:</p>
              <p>{event.name}</p>
              <p>{new Date(event.event_date).toLocaleDateString()} at {event.event_time}</p>
              <p>{event.venue}</p>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout title={`Register for ${event.name}`}>
      <div className="max-w-4xl mx-auto">
        {/* Event Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6">
            {event.banner && (
              <div className="w-full lg:w-1/3 mb-4 lg:mb-0">
                <img
                  src={`${process.env.NEXT_PUBLIC_STORAGE_URL}/${event.banner}`}
                  alt={event.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.name}</h1>
              
              <div className="space-y-2 text-gray-600 mb-4">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  {new Date(event.event_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  {event.event_time}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  {event.venue}
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  {attendees_count} registered
                  {event.max_attendees && ` of ${event.max_attendees} max`}
                </div>
              </div>

              {event.description && (
                <div className="prose text-gray-700">
                  <p>{event.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Registration Status */}
        {is_full ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              Event is Full
            </h2>
            <p className="text-red-700">
              This event has reached its maximum capacity. Registration is no longer available.
            </p>
          </div>
        ) : (
          /* Registration Form */
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Register for this Event</h2>
            
            {submitResult?.success === false && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Registration Failed
                    </h3>
                    <p className="mt-1 text-sm text-red-700">
                      {submitResult.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company/Organization
                  </label>
                  <input
                    {...register('company')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your company name"
                  />
                </div>

                <div>
                  <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title/Designation
                  </label>
                  <input
                    {...register('designation')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your job title"
                  />
                </div>

                <div>
                  <label htmlFor="ticket_type" className="block text-sm font-medium text-gray-700 mb-2">
                    Ticket Type *
                  </label>
                  <select
                    {...register('ticket_type', { required: 'Ticket type is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select ticket type</option>
                    <option value="general">General Admission</option>
                    <option value="vip">VIP</option>
                    <option value="student">Student</option>
                    <option value="corporate">Corporate</option>
                  </select>
                  {errors.ticket_type && (
                    <p className="mt-1 text-sm text-red-600">{errors.ticket_type.message}</p>
                  )}
                </div>
              </div>

              {/* Custom Fields (if any) */}
              {(() => {
                // Parse custom_fields if it's a string, otherwise use as is
                let customFields = event.custom_fields;
                if (typeof customFields === 'string') {
                  try {
                    customFields = JSON.parse(customFields);
                  } catch (e) {
                    customFields = [];
                  }
                }
                
                return customFields && Array.isArray(customFields) && customFields.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {customFields.map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label} {field.required && '*'}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            {...register(field.name, {
                              required: field.required ? `${field.label} is required` : false,
                            })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                        ) : field.type === 'select' ? (
                          <select
                            {...register(field.name, {
                              required: field.required ? `${field.label} is required` : false,
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select {field.label.toLowerCase()}</option>
                            {field.options?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            {...register(field.name, {
                              required: field.required ? `${field.label} is required` : false,
                            })}
                            type={field.type}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                        )}
                        {errors[field.name] && (
                          <p className="mt-1 text-sm text-red-600">
                            {(errors[field.name] as any)?.message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

              <div className="flex items-center justify-between pt-6 border-t">
                <p className="text-sm text-gray-600">
                  * Required fields
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Register Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}