import api from './api';

export interface ClientBranding {
  id: number;
  organizer_logo?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  company_name: string;
  company_description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBrandingData {
  company_name: string;
  company_description?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  organizer_logo?: File;
}

class ClientBrandingService {
  async getBrandings(page?: number): Promise<{
    data: ClientBranding[];
    current_page: number;
    last_page: number;
    total: number;
  }> {
    const response = await api.get('/client-branding', { params: { page } });
    return response.data;
  }

  async getBranding(id: number): Promise<ClientBranding> {
    const response = await api.get(`/client-branding/${id}`);
    return response.data;
  }

  async getPublicBranding(): Promise<{
    branding: ClientBranding;
    logo_url?: string;
  }> {
    const response = await api.get('/public/branding');
    return response.data;
  }

  async createBranding(data: CreateBrandingData): Promise<{
    message: string;
    branding: ClientBranding;
  }> {
    const formData = new FormData();
    
    // Add text fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'organizer_logo') return;
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    // Add logo file
    if (data.organizer_logo) {
      formData.append('organizer_logo', data.organizer_logo);
    }

    const response = await api.post('/client-branding', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateBranding(id: number, data: CreateBrandingData): Promise<{
    message: string;
    branding: ClientBranding;
  }> {
    const formData = new FormData();
    
    // Add text fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'organizer_logo') return;
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    // Add logo file
    if (data.organizer_logo) {
      formData.append('organizer_logo', data.organizer_logo);
    }

    // Add method override for PUT request
    formData.append('_method', 'PUT');

    const response = await api.post(`/client-branding/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteBranding(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/client-branding/${id}`);
    return response.data;
  }

  async activateBranding(id: number): Promise<{
    message: string;
    branding: ClientBranding;
  }> {
    const response = await api.post(`/client-branding/${id}/activate`);
    return response.data;
  }
}

export default new ClientBrandingService();