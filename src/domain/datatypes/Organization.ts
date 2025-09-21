export type SpecificAreaType = 
  | 'Urgencias'      // Emergencies
  | 'Radiología'     // Radiology
  | 'Pediatría'      // Pediatrics
  | 'Medicina interna' // Internal Medicine
  | 'Laboratorio';   // Laboratory

export type AdministrativeAreaType = 
  | 'Secretaría'     // Secretariat
  | 'Archivo'        // Archive
  | 'Admisión';      // Admission

export interface SpecificArea {
  id: string;
  name: SpecificAreaType;
  description?: string;
}

export interface AdministrativeArea {
  id: string;
  name: AdministrativeAreaType;
  description?: string;
}

export type AreaType = 'Specific' | 'Administrative';

export interface Area {
  id: string;
  type: AreaType;
  specificArea?: SpecificArea;
  administrativeArea?: AdministrativeArea;
}

export interface Caregiver {
  id: string;
  name: string;
  role: string;
  area?: Area;
}

export interface HealthOrganization {
  id: string;
  name: string;
  description?: string;
  areas: Area[];
  caregivers: Caregiver[];
}
