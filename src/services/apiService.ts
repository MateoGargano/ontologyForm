import type { Patient as FHIRPatient } from '../data/datatypes/fhirPatient';

const BASE_URL = 'http://localhost:3000';

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export class ApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      console.log(`Making API request to: ${url}`); // Debug log
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`API response for ${endpoint}:`, data); // Debug log

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Patient endpoints
  static async getPatients(): Promise<ApiResponse<FHIRPatient[]>> {
    const response = await this.request<{
      success: boolean;
      data: FHIRPatient[];
      count: number;
      message: string;
    }>('/patients');
    
    // Extract the actual data from the wrapped response
    return {
      data: response.data.data,
      status: response.status,
      message: response.data.message
    };
  }

  static async getPatientById(id: string): Promise<ApiResponse<FHIRPatient>> {
    return this.request<FHIRPatient>(`/patients/${id}`);
  }

  static async createPatient(patient: Omit<FHIRPatient, 'id'>): Promise<ApiResponse<FHIRPatient>> {
    return this.request<FHIRPatient>('/patients', {
      method: 'POST',
      body: JSON.stringify(patient),
    });
  }

  static async updatePatient(id: string, updates: Partial<FHIRPatient>): Promise<ApiResponse<FHIRPatient>> {
    // Convert to JSON Patch format for PATCH requests
    const patchOperations = Object.entries(updates).map(([key, value]) => ({
      op: 'add' as const,
      path: `/${key}`,
      value,
    }));

    return this.request<FHIRPatient>(`/patients/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json-patch+json',
      },
      body: JSON.stringify(patchOperations),
    });
  }

  static async markPatientAsDeceased(id: string, deceasedDateTime: string): Promise<ApiResponse<FHIRPatient>> {
    return this.request<FHIRPatient>(`/patients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        deceasedDateTime: deceasedDateTime
      }),
    });
  }

  // Health check
  static async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>('/health');
  }
}
