import { useState, useEffect } from 'react';

export interface Organization {
  id: string;
  name: string;
  type: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  licenseNumber: string;
}

export interface OrganizationsViewModelState {
  organizations: Organization[];
  isLoading: boolean;
  error: string | null;
  selectedOrganization: Organization | null;
}

export const useOrganizationsViewModel = () => {
  const [state, setState] = useState<OrganizationsViewModelState>({
    organizations: [],
    isLoading: false,
    error: null,
    selectedOrganization: null,
  });

  // Simulate loading organizations
  useEffect(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API call
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        organizations: [
          {
            id: '1',
            name: 'Hospital General Madrid',
            type: 'Hospital',
            address: 'Calle de la Salud 123, Madrid',
            phone: '+34912345678',
            email: 'info@hospitalmadrid.com',
            website: 'www.hospitalmadrid.com',
            licenseNumber: 'HOS123456'
          },
          {
            id: '2',
            name: 'Clínica Barcelona',
            type: 'Clínica Privada',
            address: 'Avenida Diagonal 456, Barcelona',
            phone: '+34987654321',
            email: 'contacto@clinicabarcelona.com',
            website: 'www.clinicabarcelona.com',
            licenseNumber: 'CLI789012'
          }
        ]
      }));
    }, 1000);
  }, []);

  const selectOrganization = (organization: Organization) => {
    setState(prev => ({ ...prev, selectedOrganization: organization }));
  };

  const clearSelection = () => {
    setState(prev => ({ ...prev, selectedOrganization: null }));
  };

  const addOrganization = (organization: Omit<Organization, 'id'>) => {
    const newOrganization: Organization = {
      ...organization,
      id: Date.now().toString(),
    };
    
    setState(prev => ({
      ...prev,
      organizations: [...prev.organizations, newOrganization]
    }));
  };

  const updateOrganization = (id: string, updates: Partial<Organization>) => {
    setState(prev => ({
      ...prev,
      organizations: prev.organizations.map(organization =>
        organization.id === id ? { ...organization, ...updates } : organization
      )
    }));
  };

  const deleteOrganization = (id: string) => {
    setState(prev => ({
      ...prev,
      organizations: prev.organizations.filter(organization => organization.id !== id),
      selectedOrganization: prev.selectedOrganization?.id === id ? null : prev.selectedOrganization
    }));
  };

  return {
    ...state,
    selectOrganization,
    clearSelection,
    addOrganization,
    updateOrganization,
    deleteOrganization,
  };
};
