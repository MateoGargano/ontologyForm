// ----------------------------
// FHIR Core DataTypes (reused from Patient)
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

export interface HumanName {
    use?: "usual" | "official" | "temp" | "nickname" | "anonymous" | "old" | "maiden";
    text?: string;
    family?: string;
    given?: string[];
    prefix?: string[];
    suffix?: string[];
    period?: Period;
}

export interface ContactPoint {
    system?: "phone" | "fax" | "email" | "pager" | "url" | "sms" | "other";
    value?: string;
    use?: "home" | "work" | "temp" | "old" | "mobile";
    rank?: number;
    period?: Period;
}

export interface Address {
    use?: "home" | "work" | "temp" | "old" | "billing";
    type?: "postal" | "physical" | "both";
    text?: string;
    line?: string[];
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    period?: Period;
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

export interface Reference {
    reference?: string; // e.g. "Organization/123"
    type?: string;      // uri
    identifier?: Identifier;
    display?: string;
}

export interface Period {
    start?: string; // dateTime
    end?: string;   // dateTime
}

// ----------------------------
// Practitioner-specific components
// ----------------------------

export interface Qualification {
    identifier?: Identifier[];
    code: CodeableConcept; // Required
    period?: Period;
    issuer?: Reference;
}

export interface Communication {
    language: CodeableConcept; // Required
    preferred?: boolean;
}

// ----------------------------
// Practitioner Resource
// ----------------------------

export interface Practitioner {
    resourceType: "Practitioner";
    id?: string;
    identifier?: Identifier[];
    active?: boolean;
    name?: HumanName[];
    telecom?: ContactPoint[];
    address?: Address[];
    gender?: "male" | "female" | "other" | "unknown";
    birthDate?: string; // date
    photo?: Attachment[];
    qualification?: Qualification[];
    communication?: Communication[];
}

// ----------------------------
// Domain Conversion Functions
// ----------------------------

import type { Person as DomainPerson, IdentityDocument } from '../../domain/datatypes/Person';

export function toDomain(fhirPractitioner: Practitioner): DomainPerson {
    return {
        identityDocument: {
            identificationType: fhirPractitioner.identifier?.[0]?.type?.coding?.[0]?.code || 'Unknown',
            country: fhirPractitioner.address?.[0]?.country || 'Unknown',
            identificationValue: fhirPractitioner.identifier?.[0]?.value || fhirPractitioner.id || 'Unknown'
        },
        dateOfBirth: fhirPractitioner.birthDate ? new Date(fhirPractitioner.birthDate) : new Date(),
        fullName: fhirPractitioner.name?.[0]?.text || 
                 `${fhirPractitioner.name?.[0]?.given?.join(' ') || ''} ${fhirPractitioner.name?.[0]?.family || ''}`.trim() || 
                 'Unknown',
        gender: fhirPractitioner.gender || 'unknown'
    };
}