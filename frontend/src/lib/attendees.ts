import api from './api';

export interface Attendee {
  id: number;
  registration_id: string;
  event_id: number;
  name: string;
  email: string;
  phone?: string;
  custom_data?: Record<string, any>;
  registration_source: 'web' | 'admin' | 'import';
  is_checked_in: boolean;
  checked_in_at?: string;
  checked_in_by?: number;
  checked_out_at?: string;
  checked_out_by?: number;
  created_at: string;
  updated_at: string;
  event?: {
    id: number;
    name: string;
    slug: string;
  };
  qr_code?: {
    id: number;
    qr_code_image_path: string;
  };
  checked_in_by_user?: {
    id: number;
    name: string;
  };
  checked_out_by_user?: {
    id: number;
    name: string;
  };
}

export interface RegisterAttendeeData {
  name?: string;
  email?: string;
  phone?: string;
  [key: string]: any; // For custom fields and dynamic default fields
}

export interface CreateAttendeeData extends RegisterAttendeeData {
  custom_data?: Record<string, any>;
}

class AttendeeService {
  async getAttendees(eventId: number, params?: {
    checked_in?: boolean;
    search?: string;
    page?: number;
  }): Promise<{
    data: Attendee[];
    current_page: number;
    last_page: number;
    total: number;
  }> {
    const response = await api.get(`/events/${eventId}/attendees`, { params });
    return response.data;
  }

  async getAttendee(id: number): Promise<Attendee> {
    const response = await api.get(`/attendees/${id}`);
    return response.data;
  }

  async registerAttendee(eventSlug: string, data: RegisterAttendeeData): Promise<{
    message: string;
    attendee: Attendee;
    qr_code_url: string;
  }> {
    const response = await api.post(`/public/events/${eventSlug}/register`, data);
    return response.data;
  }

  async createAttendee(eventId: number, data: CreateAttendeeData): Promise<{
    message: string;
    attendee: Attendee;
  }> {
    const response = await api.post(`/events/${eventId}/attendees`, data);
    return response.data;
  }

  async updateAttendee(id: number, data: CreateAttendeeData): Promise<{
    message: string;
    attendee: Attendee;
  }> {
    const response = await api.put(`/attendees/${id}`, data);
    return response.data;
  }

  async deleteAttendee(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/attendees/${id}`);
    return response.data;
  }

  async checkInAttendee(id: number): Promise<{
    message: string;
    attendee: Attendee;
  }> {
    const response = await api.post(`/attendees/${id}/checkin`);
    return response.data;
  }

  async bulkImport(eventId: number, file: File): Promise<{
    message: string;
    imported: number;
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/events/${eventId}/attendees/bulk-import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async scanQrCode(qrData: string): Promise<{
    message: string;
    action: 'check_in' | 'check_out' | 'already_checked_out';
    attendee: Attendee;
    checked_in_at?: string;
    checked_out_at?: string;
  }> {
    try {
      const response = await api.post('/qr-codes/scan', { qr_data: qrData });
      return response.data;
    } catch (error: any) {
      // Handle 422 status code for "already checked out" - this is a valid response
      if (error.response?.status === 422 && error.response?.data?.action === 'already_checked_out') {
        return error.response.data;
      }
      // Re-throw other errors
      throw error;
    }
  }

  async downloadQrCode(qrCodeId: number): Promise<Blob> {
    const response = await api.get(`/public/qr-codes/${qrCodeId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async generateQrCode(attendeeId: number): Promise<{
    message: string;
    qr_code: any;
  }> {
    const response = await api.post(`/attendees/${attendeeId}/generate-qr`);
    return response.data;
  }

  async regenerateQrCode(attendeeId: number): Promise<{
    message: string;
    qr_code: any;
  }> {
    const response = await api.post(`/attendees/${attendeeId}/regenerate-qr`);
    return response.data;
  }
}

export default new AttendeeService();