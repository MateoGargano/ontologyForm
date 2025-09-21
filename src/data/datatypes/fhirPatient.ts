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
// Patient-specific components
// ----------------------------

export interface Contact {
    relationship?: CodeableConcept[];
    name?: HumanName;
    telecom?: ContactPoint[];
    address?: Address;
    gender?: "male" | "female" | "other" | "unknown";
    organization?: Reference;
    period?: Period;
}

export interface Communication {
    language: CodeableConcept; // Required
    preferred?: boolean;
}

export interface Link {
    other: Reference; // Required
    type: "replaced-by" | "replaces" | "refer" | "seealso";
}

// ----------------------------
// Patient Resource
// ----------------------------

export interface Patient {
    resourceType: "Patient";
    id?: string;
    identifier?: Identifier[];
    active?: boolean;
    name?: HumanName[];
    telecom?: ContactPoint[];
    gender?: "male" | "female" | "other" | "unknown";
    birthDate?: string; // date
    deceasedDateTime?: string; // dateTime
    address?: Address[];
    maritalStatus?: CodeableConcept;
    multipleBirthBoolean?: boolean;
    multipleBirthInteger?: number;
    photo?: Attachment[];
    contact?: Contact[];
    communication?: Communication[];
    generalPractitioner?: Reference[];
    managingOrganization?: Reference;
    link?: Link[];
    height?: number;
    weight?: number;
}

// ----------------------------
// Domain Conversion Functions
// ----------------------------

import type { Patient as DomainPatient, PatientData, ContactMeans, Address as DomainAddress } from '../../domain/datatypes/Patient';
import type { Person as DomainPerson } from '../../domain/datatypes/Person';

export function toDomain(fhirPatient: Patient): DomainPatient {
    // Extract person data
    const person: DomainPerson = {
        identityDocument: {
            identificationType: fhirPatient.identifier?.[0]?.type?.coding?.[0]?.code || 'Unknown',
            country: fhirPatient.address?.[0]?.country || 'Unknown',
            identificationValue: fhirPatient.identifier?.[0]?.value || fhirPatient.id || 'Unknown'
        },
        dateOfBirth: fhirPatient.birthDate ? new Date(fhirPatient.birthDate) : new Date(),
        firstName: fhirPatient.name?.[0]?.given?.[0] || 'Unknown',
        lastName: fhirPatient.name?.[0]?.family || 'Unknown',
        gender: fhirPatient.gender || 'unknown'
    };

    // Extract contact means
    const contactMeans: ContactMeans = {
        cellular: fhirPatient.telecom?.find(t => t.system === 'phone' && t.use === 'mobile')?.value || '',
        email: fhirPatient.telecom?.find(t => t.system === 'email')?.value || '',
        phone: fhirPatient.telecom?.find(t => t.system === 'phone' && t.use === 'home')?.value || ''
    };

    // Extract address
    const fhirAddress = fhirPatient.address?.[0];
    const address: DomainAddress = {
        neighborhood: fhirAddress?.district || '',
        street: fhirAddress?.line?.join(' ') || '',
        city: fhirAddress?.city || '',
        postalCode: fhirAddress?.postalCode || '',
        department: fhirAddress?.state || '',
        doorNumber: '',
        apartmentNumber: ''
    };

    // Create patient data
    const patientData: PatientData = {
        contactMeans,
        height: fhirPatient.height || 0,
        weight: fhirPatient.weight || 0,
        address
    };

    return {
        ...person,
        patientData
    };
}