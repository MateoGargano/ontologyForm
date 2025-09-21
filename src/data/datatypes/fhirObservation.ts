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

export interface SampledData {
    origin: Quantity; // Required
    period: number; // Required
    factor?: number;
    lowerLimit?: number;
    upperLimit?: number;
    dimensions: number; // Required
    data?: string;
}

export interface Attachment {
    contentType?: string;
    language?: string;
    data?: string; // base64Binary
    url?: string;
    size?: number;
    hash?: string; // base64Binary
    title?: string;
    creation?: string; // dateTime
}

export interface Ratio {
    numerator?: Quantity;
    denominator?: Quantity;
}

export interface Range {
    low?: Quantity;
    high?: Quantity;
}

// ----------------------------
// Observation-specific components
// ----------------------------

export interface ObservationReferenceRange {
    low?: Quantity;
    high?: Quantity;
    type?: CodeableConcept;
    appliesTo?: CodeableConcept[];
    age?: any; // Range
    text?: string;
}

export interface ObservationComponent {
    code: CodeableConcept; // Required
    valueQuantity?: Quantity;
    valueCodeableConcept?: CodeableConcept;
    valueString?: string;
    valueBoolean?: boolean;
    valueInteger?: number;
    valueRange?: Range;
    valueRatio?: Ratio;
    valueSampledData?: SampledData;
    valueTime?: string; // time
    valueDateTime?: string; // dateTime
    valuePeriod?: Period;
    dataAbsentReason?: CodeableConcept;
    interpretation?: CodeableConcept[];
    referenceRange?: ObservationReferenceRange[];
}

// ----------------------------
// Observation Resource
// ----------------------------

export interface Observation {
    resourceType: "Observation";
    id?: string;
    identifier?: Identifier[];
    basedOn?: Reference[];
    partOf?: Reference[];
    status: "registered" | "preliminary" | "final" | "amended" | "corrected" | "cancelled" | "entered-in-error" | "unknown";
    category?: CodeableConcept[];
    code: CodeableConcept; // Required
    subject?: Reference;
    focus?: Reference[];
    encounter?: Reference;
    effectiveDateTime?: string; // dateTime
    effectivePeriod?: Period;
    effectiveTiming?: any; // Timing
    effectiveInstant?: string; // instant
    issued?: string; // instant
    performer?: Reference[];
    valueQuantity?: Quantity;
    valueCodeableConcept?: CodeableConcept;
    valueString?: string;
    valueBoolean?: boolean;
    valueInteger?: number;
    valueRange?: Range;
    valueRatio?: Ratio;
    valueSampledData?: SampledData;
    valueTime?: string; // time
    valueDateTime?: string; // dateTime
    valuePeriod?: Period;
    dataAbsentReason?: CodeableConcept;
    interpretation?: CodeableConcept[];
    note?: Annotation[];
    bodySite?: CodeableConcept;
    method?: CodeableConcept;
    specimen?: Reference;
    device?: Reference;
    referenceRange?: ObservationReferenceRange[];
    hasMember?: Reference[];
    derivedFrom?: Reference[];
    component?: ObservationComponent[];
}

// ----------------------------
// Domain Conversion Functions
// ----------------------------

import type { Observation as DomainObservation } from '../../domain/datatypes/Encounter';

export function toDomain(fhirObservation: Observation): DomainObservation {
    // Extract LOINC code
    const loincCode = fhirObservation.code?.coding?.find(coding => 
        coding.system?.includes('loinc')
    )?.code || fhirObservation.code?.coding?.[0]?.code || fhirObservation.id || 'Unknown';

    // Extract method
    const method = fhirObservation.method?.text || 
                  fhirObservation.method?.coding?.[0]?.display || 
                  'Unknown';

    // Extract value and unit
    let value: string | number = 'Unknown';
    let unitOfMeasure = 'Unknown';

    if (fhirObservation.valueQuantity) {
        value = fhirObservation.valueQuantity.value || 0;
        unitOfMeasure = fhirObservation.valueQuantity.unit || 'Unknown';
    } else if (fhirObservation.valueString) {
        value = fhirObservation.valueString;
    } else if (fhirObservation.valueCodeableConcept) {
        value = fhirObservation.valueCodeableConcept.text || 
                fhirObservation.valueCodeableConcept.coding?.[0]?.display || 
                'Unknown';
    } else if (fhirObservation.valueBoolean !== undefined) {
        value = fhirObservation.valueBoolean;
    } else if (fhirObservation.valueInteger !== undefined) {
        value = fhirObservation.valueInteger;
    }

    return {
        loincCode,
        method,
        unitOfMeasure,
        value
    };
}