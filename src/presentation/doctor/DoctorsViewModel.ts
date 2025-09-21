import { useState, useEffect } from 'react';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  licenseNumber: string;
  email: string;
  phone: string;
  hospital: string;
}

export interface DoctorsViewModelState {
  doctors: Doctor[];
  isLoading: boolean;
  error: string | null;
  selectedDoctor: Doctor | null;
}

export const useDoctorsViewModel = () => {
  const [state, setState] = useState<DoctorsViewModelState>({
    doctors: [],
    isLoading: false,
    error: null,
    selectedDoctor: null,
  });

  // Simulate loading doctors
  useEffect(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API call
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        doctors: [
          {
            id: '1',
            name: 'Dr. Carlos López',
            specialty: 'Cardiología',
            licenseNumber: 'MED123456',
            email: 'carlos.lopez@hospital.com',
            phone: '+1234567890',
            hospital: 'Hospital General'
          },
          {
            id: '2',
            name: 'Dra. Ana Martínez',
            specialty: 'Pediatría',
            licenseNumber: 'MED789012',
            email: 'ana.martinez@hospital.com',
            phone: '+1234567891',
            hospital: 'Hospital Infantil'
          }
        ]
      }));
    }, 1000);
  }, []);

  const selectDoctor = (doctor: Doctor) => {
    setState(prev => ({ ...prev, selectedDoctor: doctor }));
  };

  const clearSelection = () => {
    setState(prev => ({ ...prev, selectedDoctor: null }));
  };

  const addDoctor = (doctor: Omit<Doctor, 'id'>) => {
    const newDoctor: Doctor = {
      ...doctor,
      id: Date.now().toString(),
    };
    
    setState(prev => ({
      ...prev,
      doctors: [...prev.doctors, newDoctor]
    }));
  };

  const updateDoctor = (id: string, updates: Partial<Doctor>) => {
    setState(prev => ({
      ...prev,
      doctors: prev.doctors.map(doctor =>
        doctor.id === id ? { ...doctor, ...updates } : doctor
      )
    }));
  };

  const deleteDoctor = (id: string) => {
    setState(prev => ({
      ...prev,
      doctors: prev.doctors.filter(doctor => doctor.id !== id),
      selectedDoctor: prev.selectedDoctor?.id === id ? null : prev.selectedDoctor
    }));
  };

  return {
    ...state,
    selectDoctor,
    clearSelection,
    addDoctor,
    updateDoctor,
    deleteDoctor,
  };
};
