import api from './api';

export interface Staff {
  id: number;
  name: string;
  email: string;
  role: 'event_staff';
  created_at: string;
  updated_at: string;
  email_verified_at: string | null;
}

export interface CreateStaffData {
  name: string;
  email: string;
  password: string;
}

export interface UpdateStaffData {
  name: string;
  email: string;
  password?: string;
}

export interface StaffStats {
  total_staff: number;
  active_staff: number;
}

class StaffService {
  async getAll(params?: { 
    search?: string; 
    per_page?: number; 
    page?: number; 
  }): Promise<{
    data: Staff[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }> {
    const response = await api.get('/staff', { params });
    return response.data;
  }

  async getById(id: number): Promise<Staff> {
    const response = await api.get(`/staff/${id}`);
    return response.data;
  }

  async create(data: CreateStaffData): Promise<Staff> {
    const response = await api.post('/staff', data);
    return response.data.staff;
  }

  async update(id: number, data: UpdateStaffData): Promise<Staff> {
    const response = await api.put(`/staff/${id}`, data);
    return response.data.staff;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/staff/${id}`);
  }

  async getStats(): Promise<StaffStats> {
    const response = await api.get('/staff-stats');
    return response.data;
  }
}

const staffService = new StaffService();
export default staffService;