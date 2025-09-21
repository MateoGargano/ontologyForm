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

// ----------------------------
// AllergyIntolerance-specific components
// ----------------------------

export interface AllergyIntoleranceReaction {
    substance?: CodeableConcept;
    manifestation: CodeableConcept[]; // Required
    description?: string;
    onset?: string; // dateTime
    severity?: "mild" | "moderate" | "severe";
    exposureRoute?: CodeableConcept;
    note?: Annotation[];
}

// ----------------------------
// AllergyIntolerance Resource
// ----------------------------

export interface AllergyIntolerance {
    resourceType: "AllergyIntolerance";
    id?: string;
    identifier?: Identifier[];
    clinicalStatus?: CodeableConcept;
    verificationStatus?: CodeableConcept;
    type?: "allergy" | "intolerance" | "adverse-reaction" | "intolerance";
    category?: ("food" | "medication" | "environment" | "biologic")[];
    criticality?: "low" | "high" | "unable-to-assess";
    code?: CodeableConcept;
    patient: Reference; // Reference to Patient (required)
    encounter?: Reference;
    onsetDateTime?: string; // dateTime
    onsetAge?: any; // Age
    onsetPeriod?: Period;
    onsetRange?: any; // Range
    onsetString?: string;
    recordedDate?: string; // dateTime
    recorder?: Reference;
    asserter?: Reference;
    lastOccurrence?: string; // dateTime
    note?: Annotation[];
    reaction?: AllergyIntoleranceReaction[];
}

// ----------------------------
// Domain Conversion Functions
// ----------------------------

import type { Allergy } from '../../domain/datatypes/Encounter';

export function toDomain(fhirAllergy: AllergyIntolerance): Allergy {
    return {
        description: fhirAllergy.code?.text || 
                    fhirAllergy.code?.coding?.[0]?.display || 
                    'Unknown allergy',
        active: fhirAllergy.clinicalStatus?.coding?.[0]?.code === 'active'
    };
}