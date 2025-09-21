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
// Condition-specific components
// ----------------------------

export interface ConditionStage {
    summary?: CodeableConcept;
    assessment?: Reference[];
    type?: CodeableConcept;
}

export interface ConditionEvidence {
    code?: CodeableConcept[];
    detail?: Reference[];
}

// ----------------------------
// Condition Resource
// ----------------------------

export interface Condition {
    resourceType: "Condition";
    id?: string;
    identifier?: Identifier[];
    clinicalStatus?: CodeableConcept;
    verificationStatus?: CodeableConcept;
    category?: CodeableConcept[];
    severity?: CodeableConcept;
    code?: CodeableConcept;
    bodySite?: CodeableConcept[];
    subject: Reference; // Reference to Patient (required)
    encounter?: Reference;
    onsetDateTime?: string; // dateTime
    onsetAge?: any; // Age
    onsetPeriod?: Period;
    onsetRange?: any; // Range
    onsetString?: string;
    abatementDateTime?: string; // dateTime
    abatementAge?: any; // Age
    abatementPeriod?: Period;
    abatementRange?: any; // Range
    abatementString?: string;
    recordedDate?: string; // dateTime
    recorder?: Reference;
    asserter?: Reference;
    stage?: ConditionStage[];
    evidence?: ConditionEvidence[];
    note?: Annotation[];
}

// ----------------------------
// Domain Conversion Functions
// ----------------------------

import type { Diagnosis } from '../../domain/datatypes/Encounter';

export function toDomain(fhirCondition: Condition): Diagnosis {
    return {
        description: fhirCondition.code?.text || 
                    fhirCondition.code?.coding?.[0]?.display || 
                    'Unknown condition',
        diagnosisCode: fhirCondition.code?.coding?.[0]?.code || 
                      fhirCondition.id || 
                      'Unknown',
        status: fhirCondition.clinicalStatus?.coding?.[0]?.code || 
                fhirCondition.verificationStatus?.coding?.[0]?.code || 
                'unknown'
    };
}