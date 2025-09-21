export interface Observation {
  loincCode: string;
  method: string;
  unitOfMeasure: string;
  value: string | number;
}

export interface Medication {
  loincCode: string;
  method: string;
  unitOfMeasure: string;
  value: string | number;
}

export interface Diagnosis {
  description: string;
  diagnosisCode: string;
  status: string;
}

export interface Allergy {
  description: string;
  active: boolean;
}

export type EncounterType = 
  | 'Ambulatory'
  | 'Home'
  | 'Emergency'
  | 'Hospitalization'
  | 'Virtual';

export interface ClinicalEncounter {
  id: string;
  encounterType: EncounterType;
  startDate: Date;
  endDate?: Date;
  observations: Observation[];
  medications: Medication[];
  diagnoses: Diagnosis[];
  allergies: Allergy[];
}
