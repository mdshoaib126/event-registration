import api from './api';

export interface Event {
  id: number;
  name: string;
  slug: string;
  description?: string;
  venue: string;
  event_date: string;
  event_time: string;
  banner?: string;
  event_logo?: string;
  custom_fields?: CustomField[];
  default_fields?: {
    name: { required: boolean; label: string };
    email: { required: boolean; label: string };
    phone: { required: boolean; label: string };
  };
  is_active: boolean;
  status: 'draft' | 'published' | 'closed';
  max_attendees?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  total_attendees?: number;
  checked_in_attendees?: number;
}

export interface CustomField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
}

export interface CreateEventData {
  name: string;
  description?: string;
  venue: string;
  event_date: string;
  event_time: string;
  max_attendees?: number;
  custom_fields?: CustomField[];
  default_fields?: {
    name: { required: boolean; label: string };
    email: { required: boolean; label: string };
    phone: { required: boolean; label: string };
  };
  banner?: File;
  event_logo?: File;
}

export interface UpdateEventData extends CreateEventData {
  status: 'draft' | 'published' | 'closed';
}

class EventService {
  async getEvents(params?: {
    status?: string;
    search?: string;
    page?: number;
  }): Promise<{
    data: Event[];
    current_page: number;
    last_page: number;
    total: number;
  }> {
    const response = await api.get('/events', { params });
    return response.data;
  }

  async getEvent(id: number): Promise<Event> {
    const response = await api.get(`/events/${id}`);
    return response.data;
  }

  async getPublicEvent(slug: string): Promise<{
    event: Event;
    is_full: boolean;
    attendees_count: number;
  }> {
    const response = await api.get(`/public/events/${slug}`);
    return response.data;
  }

  async createEvent(data: CreateEventData): Promise<{ message: string; event: Event }> {
    const formData = new FormData();
    
    // Add text fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'banner' || key === 'event_logo') return;
      if (key === 'custom_fields') {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    // Add files
    if (data.banner) {
      formData.append('banner', data.banner);
    }
    if (data.event_logo) {
      formData.append('event_logo', data.event_logo);
    }

    const response = await api.post('/events', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateEvent(id: number, data: UpdateEventData): Promise<{ message: string; event: Event }> {
    const formData = new FormData();
    
    // Add text fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'banner' || key === 'event_logo') return;
      if (key === 'custom_fields') {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    // Add files
    if (data.banner) {
      formData.append('banner', data.banner);
    }
    if (data.event_logo) {
      formData.append('event_logo', data.event_logo);
    }

    // Add method override for PUT request
    formData.append('_method', 'PUT');

    const response = await api.post(`/events/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteEvent(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  }

  async toggleEventStatus(id: number): Promise<{ message: string; event: Event }> {
    const response = await api.post(`/events/${id}/toggle-status`);
    return response.data;
  }

  async generateReport(id: number, filters?: {
    checked_in?: boolean;
  }): Promise<{
    event: Event;
    statistics: {
      total_registered: number;
      checked_in: number;
      not_checked_in: number;
    };
    attendees: any[];
  }> {
    const response = await api.get(`/events/${id}/report`, { params: filters });
    return response.data;
  }

  async exportData(id: number, format: 'csv' | 'xlsx', filters?: {
    checked_in?: boolean;
  }): Promise<Blob> {
    const response = await api.get(`/events/${id}/export/${format}`, {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  }
}

export default new EventService();