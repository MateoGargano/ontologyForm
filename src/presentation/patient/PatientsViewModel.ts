import { useState, useEffect } from 'react';
import { ApiService } from '../../services/apiService';
import { toDomain } from '../../data/datatypes/fhirPatient';

export interface Patient {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  deathDate: string | null;
}

export interface PatientsViewModelState {
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  selectedPatient: Patient | null;
}

export const usePatientsViewModel = () => {
  const [state, setState] = useState<PatientsViewModelState>({
    patients: [],
    isLoading: false,
    error: null,
    selectedPatient: null,
  });

  // Load patients from API
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await ApiService.getPatients();
      console.log('API Response:', response);
      
      const fhirPatients = response.data;
      
      if (!Array.isArray(fhirPatients)) {
        throw new Error('Los datos de pacientes no están en el formato esperado');
      }
      
      // Convert FHIR patients to display format
      const displayPatients: Patient[] = fhirPatients.map(fhirPatient => {
        try {
          const domainPatient = toDomain(fhirPatient);
          
          return {
            id: fhirPatient.id || '-',
            name: `${domainPatient.firstName} ${domainPatient.lastName}`,
            birthDate: fhirPatient.birthDate || '-',
            gender: domainPatient.gender === 'unknown' ? '-' : 
                    domainPatient.gender === 'male' ? 'Masculino' :
                    domainPatient.gender === 'female' ? 'Femenino' :
                    domainPatient.gender === 'other' ? 'Otro' : domainPatient.gender,
            deathDate: fhirPatient.deceasedDateTime ? 
              fhirPatient.deceasedDateTime.split('T')[0] : 
              null
          };
        } catch (conversionError) {
          console.error('Error converting patient:', fhirPatient, conversionError);
          // Return fallback patient data
          return {
            id: fhirPatient.id || '-',
            name: fhirPatient.name?.[0]?.text || 
                  `${fhirPatient.name?.[0]?.given?.join(' ') || ''} ${fhirPatient.name?.[0]?.family || ''}`.trim() || 
                  'Nombre no disponible',
            birthDate: fhirPatient.birthDate || '-',
            gender: fhirPatient.gender === 'unknown' ? '-' : 
                    fhirPatient.gender === 'male' ? 'Masculino' :
                    fhirPatient.gender === 'female' ? 'Femenino' :
                    fhirPatient.gender === 'other' ? 'Otro' : (fhirPatient.gender || '-'),
            deathDate: fhirPatient.deceasedDateTime ? 
              fhirPatient.deceasedDateTime.split('T')[0] : 
              null
          };
        }
      });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        patients: displayPatients
      }));
    } catch (error) {
      console.error('Error loading patients:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar los pacientes'
      }));
    }
  };

  const selectPatient = (patient: Patient) => {
    setState(prev => ({ ...prev, selectedPatient: patient }));
  };

  const clearSelection = () => {
    setState(prev => ({ ...prev, selectedPatient: null }));
  };

  const refreshPatients = () => {
    loadPatients();
  };

  return {
    ...state,
    selectPatient,
    clearSelection,
    refreshPatients,
  };
};
