import type { Patient as FHIRPatient } from '../data/datatypes/fhirPatient';
import type { Encounter } from '../data/datatypes/fhirEncounter';
import type { Observation } from '../data/datatypes/fhirObservation';
import type { MedicationRequest } from '../data/datatypes/fhirMedicationRequest';
import type { Condition } from '../data/datatypes/fhirCondition';
import type { AllergyIntolerance } from '../data/datatypes/fhirAllergyIntolerance';

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

  // Get encounters for a patient
  static async getPatientEncounters(patientId: string): Promise<ApiResponse<Encounter[]>> {
    const response = await this.request<{
      success: boolean;
      data: Encounter[];
      count: number;
      message: string;
    }>(`/encounters/patient/${patientId}`);
    
    return {
      data: response.data.data,
      status: response.status,
      message: response.data.message
    };
  }

  // Get observations for a patient
  static async getPatientObservations(patientId: string): Promise<ApiResponse<Observation[]>> {
    const response = await this.request<{
      success: boolean;
      data: Observation[];
      count: number;
      message: string;
    }>(`/observations/patient/${patientId}`);
    
    return {
      data: response.data.data,
      status: response.status,
      message: response.data.message
    };
  }

  // Get medication requests for a patient
  static async getPatientMedicationRequests(patientId: string): Promise<ApiResponse<MedicationRequest[]>> {
    const response = await this.request<{
      success: boolean;
      data: MedicationRequest[];
      count: number;
      message: string;
    }>(`/medication-requests/patient/${patientId}`);
    
    return {
      data: response.data.data,
      status: response.status,
      message: response.data.message
    };
  }

  // Get conditions for a patient
  static async getPatientConditions(patientId: string): Promise<ApiResponse<Condition[]>> {
    const response = await this.request<{
      success: boolean;
      data: Condition[];
      count: number;
      message: string;
    }>(`/conditions/patient/${patientId}`);
    
    return {
      data: response.data.data,
      status: response.status,
      message: response.data.message
    };
  }

  // Get allergy intolerances for a patient
  static async getPatientAllergyIntolerances(patientId: string): Promise<ApiResponse<AllergyIntolerance[]>> {
    const response = await this.request<{
      success: boolean;
      data: AllergyIntolerance[];
      count: number;
      message: string;
    }>(`/allergy-intolerances/patient/${patientId}`);
    
    return {
      data: response.data.data,
      status: response.status,
      message: response.data.message
    };
  }

  // Encounter endpoints
  static async createEncounter(encounter: Omit<Encounter, 'id'>): Promise<ApiResponse<Encounter>> {
    const response = await this.request<{
      success: boolean;
      data: Encounter;
      message: string;
    }>('/encounters', {
      method: 'POST',
      body: JSON.stringify(encounter),
    });
    
    // Extract the actual encounter data from the wrapped response
    return {
      data: response.data.data,
      status: response.status,
      message: response.data.message
    };
  }

  // Observation endpoints
  static async createObservation(observation: Omit<Observation, 'id'>): Promise<ApiResponse<Observation>> {
    const response = await this.request<{
      success: boolean;
      data: Observation;
      message: string;
    }>('/observations', {
      method: 'POST',
      body: JSON.stringify(observation),
    });
    
    return {
      data: response.data.data,
      status: response.status,
      message: response.data.message
    };
  }

  // Medication Request endpoints
  static async createMedicationRequest(medicationRequest: Omit<MedicationRequest, 'id'>): Promise<ApiResponse<MedicationRequest>> {
    const response = await this.request<{
      success: boolean;
      data: MedicationRequest;
      message: string;
    }>('/medication-requests', {
      method: 'POST',
      body: JSON.stringify(medicationRequest),
    });
    
    return {
      data: response.data.data,
      status: response.status,
      message: response.data.message
    };
  }

  // Condition endpoints
  static async createCondition(condition: Omit<Condition, 'id'>): Promise<ApiResponse<Condition>> {
    const response = await this.request<{
      success: boolean;
      data: Condition;
      message: string;
    }>('/conditions', {
      method: 'POST',
      body: JSON.stringify(condition),
    });
    
    return {
      data: response.data.data,
      status: response.status,
      message: response.data.message
    };
  }

  // Allergy Intolerance endpoints
  static async createAllergyIntolerance(allergyIntolerance: Omit<AllergyIntolerance, 'id'>): Promise<ApiResponse<AllergyIntolerance>> {
    const response = await this.request<{
      success: boolean;
      data: AllergyIntolerance;
      message: string;
    }>('/allergy-intolerances', {
      method: 'POST',
      body: JSON.stringify(allergyIntolerance),
    });
    
    return {
      data: response.data.data,
      status: response.status,
      message: response.data.message
    };
  }
}
