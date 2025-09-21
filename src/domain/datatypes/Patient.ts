import { type Person } from './Person';

export interface ContactMeans {
  cellular: string;
  email: string;
  phone: string;
}

export interface Address {
  neighborhood: string;
  street: string;
  city: string;
  postalCode: string;
  department: string;
  doorNumber: string;
  apartmentNumber: string;
}

export interface PatientData {
  contactMeans: ContactMeans;
  height: number;
  weight: number;
  address: Address;
}

export interface Patient extends Person {
  patientData: PatientData;
}
