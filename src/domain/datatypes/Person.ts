export interface IdentityDocument {
  identificationType: string;
  country: string;
  identificationValue: string;
}

export interface Person {
  identityDocument: IdentityDocument;
  dateOfBirth: Date;
  firstName: string;
  lastName: string;
  gender: string;
}
