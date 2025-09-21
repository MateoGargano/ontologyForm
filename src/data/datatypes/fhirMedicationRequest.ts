// ----------------------------
// FHIR Core DataTypes
// ----------------------------

export interface Coding {
    system?: string;       // URI
    version?: string;
    code?: string;
    display?: string;
    userSelected?: boolean;
}

export interface CodeableConcept {
    coding?: Coding[];
    text?: string;
}

export interface Identifier {
    use?: "usual" | "official" | "temp" | "secondary" | "old";
    type?: CodeableConcept;
    system?: string;   // URI
    value?: string;
    period?: Period;
    assigner?: Reference;
}

export interface Reference {
    reference?: string; // e.g. "Patient/123"
    type?: string;      // uri
    identifier?: Identifier;
    display?: string;
}

export interface Period {
    start?: string; // dateTime
    end?: string;   // dateTime
}

export interface Annotation {
    authorReference?: Reference;
    authorString?: string;
    time?: string; // dateTime
    text: string; // Required
}

export interface Quantity {
    value?: number;
    comparator?: "<" | "<=" | ">=" | ">";
    unit?: string;
    system?: string; // URI
    code?: string;
}

export interface Ratio {
    numerator?: Quantity;
    denominator?: Quantity;
}

export interface Duration {
    value?: number;
    comparator?: "<" | "<=" | ">=" | ">";
    unit?: string;
    system?: string; // URI
    code?: string;
}

// ----------------------------
// MedicationRequest-specific components
// ----------------------------

export interface MedicationRequestDosageInstruction {
    sequence?: number;
    text?: string;
    additionalInstruction?: CodeableConcept[];
    patientInstruction?: string;
    timing?: any; // Timing
    asNeededBoolean?: boolean;
    asNeededCodeableConcept?: CodeableConcept;
    site?: CodeableConcept;
    route?: CodeableConcept;
    method?: CodeableConcept;
    doseAndRate?: any[]; // DoseAndRate
    maxDosePerPeriod?: Ratio;
    maxDosePerAdministration?: Quantity;
    maxDosePerLifetime?: Quantity;
}

export interface MedicationRequestDispenseRequest {
    initialFill?: any; // InitialFill
    dispenseInterval?: Duration;
    validityPeriod?: Period;
    numberOfRepeatsAllowed?: number;
    quantity?: Quantity;
    expectedSupplyDuration?: Duration;
    performer?: Reference;
}

export interface MedicationRequestSubstitution {
    allowedBoolean?: boolean;
    allowedCodeableConcept?: CodeableConcept;
    reason?: CodeableConcept;
}

// ----------------------------
// MedicationRequest Resource
// ----------------------------

export interface MedicationRequest {
    resourceType: "MedicationRequest";
    id?: string;
    identifier?: Identifier[];
    status: "active" | "on-hold" | "cancelled" | "completed" | "entered-in-error" | "stopped" | "draft" | "unknown";
    statusReason?: CodeableConcept;
    intent: "proposal" | "plan" | "order" | "original-order" | "reflex-order" | "filler-order" | "instance-order" | "option";
    category?: CodeableConcept[];
    priority?: "routine" | "urgent" | "asap" | "stat";
    doNotPerform?: boolean;
    reportedBoolean?: boolean;
    reportedReference?: Reference;
    medicationCodeableConcept?: CodeableConcept;
    medicationReference?: Reference;
    subject: Reference; // Reference to Patient (required)
    encounter?: Reference;
    supportingInformation?: Reference[];
    authoredOn?: string; // dateTime
    requester?: Reference;
    performer?: Reference;
    performerType?: CodeableConcept;
    recorder?: Reference;
    reasonCode?: CodeableConcept[];
    reasonReference?: Reference[];
    instantiatesCanonical?: string[]; // canonical
    instantiatesUri?: string[]; // uri
    basedOn?: Reference[];
    groupIdentifier?: Identifier;
    courseOfTherapyType?: CodeableConcept;
    insurance?: Reference[];
    note?: Annotation[];
    dosageInstruction?: MedicationRequestDosageInstruction[];
    dispenseRequest?: MedicationRequestDispenseRequest;
    substitution?: MedicationRequestSubstitution;
    priorPrescription?: Reference;
    detectedIssue?: Reference[];
    eventHistory?: Reference[];
}

// ----------------------------
// Domain Conversion Functions
// ----------------------------

import type { Medication } from '../../domain/datatypes/Encounter';

export function toDomain(fhirMedication: MedicationRequest): Medication {
    // Extract medication name from codeable concept or reference
    const medicationName = fhirMedication.medicationCodeableConcept?.text || 
                          fhirMedication.medicationCodeableConcept?.coding?.[0]?.display ||
                          fhirMedication.medicationReference?.display ||
                          'Unknown medication';

    // Extract dosage information from first dosage instruction
    const dosage = fhirMedication.dosageInstruction?.[0];
    const dosageText = dosage?.text || '';
    const doseValue = dosage?.doseAndRate?.[0]?.doseQuantity?.value;
    const doseUnit = dosage?.doseAndRate?.[0]?.doseQuantity?.unit;

    return {
        loincCode: fhirMedication.medicationCodeableConcept?.coding?.[0]?.code || 
                   fhirMedication.id || 
                   'Unknown',
        method: dosage?.route?.coding?.[0]?.display || 
                dosage?.route?.text || 
                'Unknown',
        unitOfMeasure: doseUnit || 'Unknown',
        value: doseValue || medicationName
    };
}