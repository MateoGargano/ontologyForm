import type { ClinicalEncounter, Observation, Medication, Diagnosis, Allergy, EncounterType } from '../domain/datatypes/Encounter';
import type { Encounter as FHIREncounter } from '../data/datatypes/fhirEncounter';
import type { Observation as FHIRObservation } from '../data/datatypes/fhirObservation';
import type { MedicationRequest as FHIRMedicationRequest } from '../data/datatypes/fhirMedicationRequest';
import type { Condition as FHIRCondition } from '../data/datatypes/fhirCondition';
import type { AllergyIntolerance as FHIRAllergyIntolerance } from '../data/datatypes/fhirAllergyIntolerance';

// Helper function to create a reference to a patient
const createPatientReference = (patientId: string) => ({
  reference: `Patient/${patientId}`,
  type: 'Patient'
});

// Helper function to create a reference to an encounter
const createEncounterReference = (encounterId: string) => ({
  reference: `Encounter/${encounterId}`,
  type: 'Encounter'
});

// Helper function to create a coding object
const createCoding = (system: string, code: string, display: string) => ({
  system,
  code,
  display
});

// Helper function to create a codeable concept
const createCodeableConcept = (coding: any[], text?: string) => ({
  coding,
  text
});

// Convert domain encounter type to FHIR encounter class
const mapEncounterTypeToFHIRClass = (encounterType: EncounterType) => {
  switch (encounterType) {
    case 'Ambulatory':
      return createCoding('http://terminology.hl7.org/CodeSystem/v3-ActCode', 'AMB', 'ambulatory');
    case 'Emergency':
      return createCoding('http://terminology.hl7.org/CodeSystem/v3-ActCode', 'EMER', 'emergency');
    case 'Hospitalization':
      return createCoding('http://terminology.hl7.org/CodeSystem/v3-ActCode', 'IMP', 'inpatient encounter');
    case 'Virtual':
      return createCoding('http://terminology.hl7.org/CodeSystem/v3-ActCode', 'VR', 'virtual');
    case 'Home':
      return createCoding('http://terminology.hl7.org/CodeSystem/v3-ActCode', 'HH', 'home health');
    default:
      return createCoding('http://terminology.hl7.org/CodeSystem/v3-ActCode', 'AMB', 'ambulatory');
  }
};

// Convert FHIR encounter to domain encounter
export function fromFHIREncounter(fhirEncounter: FHIREncounter): ClinicalEncounter {
  // Map FHIR encounter class to domain encounter type
  const mapFHIRClassToEncounterType = (fhirClass: any): EncounterType => {
    const code = fhirClass.code?.toLowerCase();
    switch (code) {
      case 'amb':
        return 'Ambulatory';
      case 'emer':
        return 'Emergency';
      case 'imp':
        return 'Hospitalization';
      case 'vr':
        return 'Virtual';
      case 'hh':
        return 'Home';
      default:
        return 'Ambulatory';
    }
  };

  return {
    id: fhirEncounter.id || 'unknown',
    encounterType: mapFHIRClassToEncounterType(fhirEncounter.class),
    startDate: fhirEncounter.period?.start ? new Date(fhirEncounter.period.start) : new Date(),
    endDate: fhirEncounter.period?.end ? new Date(fhirEncounter.period.end) : undefined,
    observations: [], // Will be populated separately
    medications: [], // Will be populated separately
    diagnoses: [], // Will be populated separately
    allergies: [] // Will be populated separately
  };
}

// Convert domain encounter to FHIR encounter
export function toFHIREncounter(clinicalEncounter: Omit<ClinicalEncounter, 'id'>, patientId: string): Omit<FHIREncounter, 'id'> {
  return {
    resourceType: 'Encounter',
    status: 'finished',
    class: mapEncounterTypeToFHIRClass(clinicalEncounter.encounterType),
    subject: createPatientReference(patientId),
    period: {
      start: clinicalEncounter.startDate.toISOString(),
      end: clinicalEncounter.endDate?.toISOString()
    }
  };
}

// Convert domain observation to FHIR observation
export function toFHIRObservation(observation: Observation, patientId: string, encounterId?: string): Omit<FHIRObservation, 'id'> {
  const loincCoding = createCoding('http://loinc.org', observation.loincCode, observation.loincCode);
  const codeableConcept = createCodeableConcept([loincCoding], observation.loincCode);

  const fhirObservation: Omit<FHIRObservation, 'id'> = {
    resourceType: 'Observation',
    status: 'final',
    code: codeableConcept,
    subject: createPatientReference(patientId),
    valueQuantity: {
      value: typeof observation.value === 'number' ? observation.value : parseFloat(observation.value.toString()) || 0,
      unit: observation.unitOfMeasure,
      system: 'http://unitsofmeasure.org',
      code: observation.unitOfMeasure
    }
  };

  if (encounterId) {
    fhirObservation.encounter = createEncounterReference(encounterId);
  }

  if (observation.method) {
    fhirObservation.method = createCodeableConcept([], observation.method);
  }

  return fhirObservation;
}

// Convert domain medication to FHIR medication request
export function toFHIRMedicationRequest(medication: Medication, patientId: string, encounterId?: string): Omit<FHIRMedicationRequest, 'id'> {
  const medicationCoding = createCoding('http://snomed.info/sct', medication.loincCode, medication.loincCode);
  const medicationConcept = createCodeableConcept([medicationCoding], medication.loincCode);

  const fhirMedicationRequest: Omit<FHIRMedicationRequest, 'id'> = {
    resourceType: 'MedicationRequest',
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: medicationConcept,
    subject: createPatientReference(patientId),
    dosageInstruction: [{
      text: `${medication.value} ${medication.unitOfMeasure}`,
      route: createCodeableConcept([], medication.method)
    }]
  };

  if (encounterId) {
    fhirMedicationRequest.encounter = createEncounterReference(encounterId);
  }

  return fhirMedicationRequest;
}

// Convert domain diagnosis to FHIR condition
export function toFHIRCondition(diagnosis: Diagnosis, patientId: string, encounterId?: string): Omit<FHIRCondition, 'id'> {
  const diagnosisCoding = createCoding('http://snomed.info/sct', diagnosis.diagnosisCode, diagnosis.description);
  const diagnosisConcept = createCodeableConcept([diagnosisCoding], diagnosis.description);

  const fhirCondition: Omit<FHIRCondition, 'id'> = {
    resourceType: 'Condition',
    clinicalStatus: createCodeableConcept([createCoding('http://terminology.hl7.org/CodeSystem/condition-clinical', 'active', 'Active')]),
    verificationStatus: createCodeableConcept([createCoding('http://terminology.hl7.org/CodeSystem/condition-ver-status', 'confirmed', 'Confirmed')]),
    code: diagnosisConcept,
    subject: createPatientReference(patientId),
    onsetDateTime: new Date().toISOString()
  };

  if (encounterId) {
    fhirCondition.encounter = createEncounterReference(encounterId);
  }

  return fhirCondition;
}

// Convert domain allergy to FHIR allergy intolerance
export function toFHIRAllergyIntolerance(allergy: Allergy, patientId: string, encounterId?: string): Omit<FHIRAllergyIntolerance, 'id'> {
  const allergyCoding = createCoding('http://snomed.info/sct', '419199007', allergy.description);
  const allergyConcept = createCodeableConcept([allergyCoding], allergy.description);

  const fhirAllergyIntolerance: Omit<FHIRAllergyIntolerance, 'id'> = {
    resourceType: 'AllergyIntolerance',
    clinicalStatus: createCodeableConcept([createCoding('http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', 'active', 'Active')]),
    verificationStatus: createCodeableConcept([createCoding('http://terminology.hl7.org/CodeSystem/allergyintolerance-verification', 'confirmed', 'Confirmed')]),
    type: 'allergy',
    category: ['medication'],
    criticality: 'high',
    code: allergyConcept,
    patient: createPatientReference(patientId),
    reaction: [{
      manifestation: [createCodeableConcept([createCoding('http://snomed.info/sct', '419199007', 'Allergic reaction')])],
      severity: 'moderate'
    }]
  };

  if (encounterId) {
    fhirAllergyIntolerance.encounter = createEncounterReference(encounterId);
  }

  return fhirAllergyIntolerance;
}
