import React, { useState, useEffect, useRef } from 'react';
import type { ClinicalEncounter, EncounterType, Observation, Medication, Diagnosis, Allergy } from '../../domain/datatypes/Encounter';
import { ApiService } from '../../services/apiService';
import { 
  toFHIREncounter, 
  toFHIRObservation, 
  toFHIRMedicationRequest, 
  toFHIRCondition, 
  toFHIRAllergyIntolerance 
} from '../../services/fhirConverters';

// LOINC API interfaces
interface LoincCode {
  code: string;
  displayName: string;
  longCommonName: string;
  shortName: string;
}

interface LoincSearchResult {
  pageSize: number;
  pageNumber: number;
  result: {
    classType: string;
    results: Array<{
      ui: string;
      rootSource: string;
      uri: string;
      name: string;
    }>;
    recCount: number;
  };
}

// SNOMED CT API interfaces
interface SnomedCode {
  code: string;
  displayName: string;
  shortName: string;
}

interface SnomedSearchResult {
  pageSize: number;
  pageNumber: number;
  result: {
    classType: string;
    results: Array<{
      ui: string;
      rootSource: string;
      uri: string;
      name: string;
    }>;
    recCount: number;
  };
}

// LOINC Service
class LoincService {
  private static readonly API_BASE_URL = 'https://uts-ws.nlm.nih.gov/rest/search/current';
  private static readonly API_KEY = '9acb4127-e18e-4a0c-a53d-6555dd08fb32';

  static async searchLoincCodes(searchTerm: string): Promise<LoincCode[]> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        string: searchTerm.trim(),
        sabs: 'LNC-ES-AR',
        returnIdType: 'code',
        apiKey: this.API_KEY
      });

      const response = await fetch(`${this.API_BASE_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LoincSearchResult = await response.json();
      
      return data.result.results.map(item => ({
        code: item.ui,
        displayName: item.name,
        longCommonName: item.name,
        shortName: item.name.split(':')[0] // Toma la primera parte antes de los dos puntos
      }));
    } catch (error) {
      console.error('Error searching LOINC codes:', error);
      return [];
    }
  }
}

// SNOMED CT Service
class SnomedService {
  private static readonly API_BASE_URL = 'https://uts-ws.nlm.nih.gov/rest/search/current';
  private static readonly API_KEY = '9acb4127-e18e-4a0c-a53d-6555dd08fb32';

  static async searchSnomedCodes(searchTerm: string): Promise<SnomedCode[]> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        string: searchTerm.trim(),
        sabs: 'SCTSPA',
        returnIdType: 'code',
        apiKey: this.API_KEY
      });

      const response = await fetch(`${this.API_BASE_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SnomedSearchResult = await response.json();
      
      return data.result.results.map(item => ({
        code: item.ui,
        displayName: item.name,
        shortName: item.name.split('(')[0].trim() // Toma la primera parte antes del paréntesis
      }));
    } catch (error) {
      console.error('Error searching SNOMED codes:', error);
      return [];
    }
  }
}

interface EncounterFormProps {
  patientId: string;
  patientName: string;
  onBack: () => void;
  onSubmit: (encounter: Omit<ClinicalEncounter, 'id'>) => void;
}

const EncounterForm: React.FC<EncounterFormProps> = ({ patientId, patientName, onBack, onSubmit }) => {
  // Note: patientId is available for future use (e.g., API calls)
  console.log('Creating encounter for patient:', patientId);
  const [encounterType, setEncounterType] = useState<EncounterType>('Ambulatory');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Observations
  const [observations, setObservations] = useState<Observation[]>([]);
  const [newObservation, setNewObservation] = useState<Observation>({
    loincCode: '',
    method: '',
    unitOfMeasure: '',
    value: ''
  });
  
  // Variables para guardar nombres de elementos seleccionados
  const [observationNames, setObservationNames] = useState<string[]>([]);
  const [newObservationName, setNewObservationName] = useState<string>('');
  
  // Medications
  const [medications, setMedications] = useState<Medication[]>([]);
  const [newMedication, setNewMedication] = useState<Medication>({
    loincCode: '',
    method: '',
    unitOfMeasure: '',
    value: ''
  });
  
  // Variables para nombres de medicamentos
  const [medicationNames, setMedicationNames] = useState<string[]>([]);
  const [newMedicationName, setNewMedicationName] = useState<string>('');
  
  // Diagnoses
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [newDiagnosis, setNewDiagnosis] = useState<Diagnosis>({
    description: '',
    diagnosisCode: '',
    status: ''
  });
  
  // Variables para nombres de diagnósticos
  const [diagnosisNames, setDiagnosisNames] = useState<string[]>([]);
  const [newDiagnosisName, setNewDiagnosisName] = useState<string>('');
  
  // Allergies
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [newAllergy, setNewAllergy] = useState<Allergy>({
    description: '',
    active: true
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // LOINC search state
  const [loincSearchResults, setLoincSearchResults] = useState<LoincCode[]>([]);
  const [isSearchingLoinc, setIsSearchingLoinc] = useState(false);
  const [showLoincResults, setShowLoincResults] = useState(false);
  const [loincSearchError, setLoincSearchError] = useState<string | null>(null);
  const loincInputRef = useRef<HTMLInputElement>(null);
  const loincResultsRef = useRef<HTMLDivElement>(null);
  const loincSearchTimeoutRef = useRef<number | null>(null);

  // SNOMED search state for medications
  const [medicationSearchResults, setMedicationSearchResults] = useState<SnomedCode[]>([]);
  const [isSearchingMedication, setIsSearchingMedication] = useState(false);
  const [showMedicationResults, setShowMedicationResults] = useState(false);
  const [medicationSearchError, setMedicationSearchError] = useState<string | null>(null);
  const medicationInputRef = useRef<HTMLInputElement>(null);
  const medicationResultsRef = useRef<HTMLDivElement>(null);
  const medicationSearchTimeoutRef = useRef<number | null>(null);

  // SNOMED search state for diagnoses
  const [diagnosisSearchResults, setDiagnosisSearchResults] = useState<SnomedCode[]>([]);
  const [isSearchingDiagnosis, setIsSearchingDiagnosis] = useState(false);
  const [showDiagnosisResults, setShowDiagnosisResults] = useState(false);
  const [diagnosisSearchError, setDiagnosisSearchError] = useState<string | null>(null);
  const diagnosisInputRef = useRef<HTMLInputElement>(null);
  const diagnosisResultsRef = useRef<HTMLDivElement>(null);
  const diagnosisSearchTimeoutRef = useRef<number | null>(null);

  const encounterTypes: EncounterType[] = ['Ambulatory', 'Home', 'Emergency', 'Hospitalization', 'Virtual'];

  // LOINC search functions
  const handleLoincSearch = async (searchTerm: string) => {
    if (loincSearchTimeoutRef.current) {
      clearTimeout(loincSearchTimeoutRef.current);
    }

    if (searchTerm.length < 2) {
      setLoincSearchResults([]);
      setShowLoincResults(false);
      return;
    }

    setIsSearchingLoinc(true);
    setLoincSearchError(null);

    loincSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await LoincService.searchLoincCodes(searchTerm);
        setLoincSearchResults(results);
        setShowLoincResults(true);
      } catch (err) {
        console.error('Error searching LOINC codes:', err);
        setLoincSearchError('Error al buscar códigos LOINC');
        setLoincSearchResults([]);
      } finally {
        setIsSearchingLoinc(false);
      }
    }, 500);
  };

  const handleLoincSelect = (loincCode: LoincCode) => {
    // Stop any ongoing search
    if (loincSearchTimeoutRef.current) {
      clearTimeout(loincSearchTimeoutRef.current);
      loincSearchTimeoutRef.current = null;
    }
    
    setNewObservation(prev => ({
      ...prev,
      loincCode: loincCode.code // Mantener el código para mostrar
    }));
    setNewObservationName(loincCode.shortName); // Guardar el nombre para enviar
    setIsSearchingLoinc(false);
    setShowLoincResults(false);
    setLoincSearchResults([]); // Clear results after selection
  };

  const handleLoincInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewObservation(prev => ({ ...prev, loincCode: value }));
    handleLoincSearch(value);
  };

  const handleLoincInputFocus = () => {
    if (loincSearchResults.length > 0) {
      setShowLoincResults(true);
    }
  };

  const handleLoincInputBlur = () => {
    // Add a small delay to allow click events to fire first
    setTimeout(() => {
      // Stop any ongoing search and hide results
      if (loincSearchTimeoutRef.current) {
        clearTimeout(loincSearchTimeoutRef.current);
        loincSearchTimeoutRef.current = null;
      }
      setIsSearchingLoinc(false);
      setShowLoincResults(false);
    }, 150);
  };

  // Close LOINC results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        loincResultsRef.current &&
        !loincResultsRef.current.contains(event.target as Node) &&
        loincInputRef.current &&
        !loincInputRef.current.contains(event.target as Node)
      ) {
        setShowLoincResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Cleanup any pending search timeouts
      if (loincSearchTimeoutRef.current) {
        clearTimeout(loincSearchTimeoutRef.current);
      }
    };
  }, []);

  // SNOMED search functions for medications
  const handleMedicationSearch = async (searchTerm: string) => {
    if (medicationSearchTimeoutRef.current) {
      clearTimeout(medicationSearchTimeoutRef.current);
    }

    if (searchTerm.length < 2) {
      setMedicationSearchResults([]);
      setShowMedicationResults(false);
      return;
    }

    setIsSearchingMedication(true);
    setMedicationSearchError(null);

    medicationSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await SnomedService.searchSnomedCodes(searchTerm);
        setMedicationSearchResults(results);
        setShowMedicationResults(true);
      } catch (err) {
        console.error('Error searching medication codes:', err);
        setMedicationSearchError('Error al buscar medicamentos');
        setMedicationSearchResults([]);
      } finally {
        setIsSearchingMedication(false);
      }
    }, 500);
  };

  const handleMedicationSelect = (snomedCode: SnomedCode) => {
    if (medicationSearchTimeoutRef.current) {
      clearTimeout(medicationSearchTimeoutRef.current);
      medicationSearchTimeoutRef.current = null;
    }
    
    setNewMedication(prev => ({
      ...prev,
      loincCode: snomedCode.code // Mantener el código para mostrar
    }));
    setNewMedicationName(snomedCode.shortName); // Guardar el nombre para enviar
    setIsSearchingMedication(false);
    setShowMedicationResults(false);
    setMedicationSearchResults([]);
  };

  const handleMedicationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMedication(prev => ({ ...prev, loincCode: value }));
    handleMedicationSearch(value);
  };

  const handleMedicationInputFocus = () => {
    if (medicationSearchResults.length > 0) {
      setShowMedicationResults(true);
    }
  };

  const handleMedicationInputBlur = () => {
    // Add a small delay to allow click events to fire first
    setTimeout(() => {
      if (medicationSearchTimeoutRef.current) {
        clearTimeout(medicationSearchTimeoutRef.current);
        medicationSearchTimeoutRef.current = null;
      }
      setIsSearchingMedication(false);
      setShowMedicationResults(false);
    }, 150);
  };

  // SNOMED search functions for diagnoses
  const handleDiagnosisSearch = async (searchTerm: string) => {
    if (diagnosisSearchTimeoutRef.current) {
      clearTimeout(diagnosisSearchTimeoutRef.current);
    }

    if (searchTerm.length < 2) {
      setDiagnosisSearchResults([]);
      setShowDiagnosisResults(false);
      return;
    }

    setIsSearchingDiagnosis(true);
    setDiagnosisSearchError(null);

    diagnosisSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await SnomedService.searchSnomedCodes(searchTerm);
        setDiagnosisSearchResults(results);
        setShowDiagnosisResults(true);
      } catch (err) {
        console.error('Error searching diagnosis codes:', err);
        setDiagnosisSearchError('Error al buscar diagnósticos');
        setDiagnosisSearchResults([]);
      } finally {
        setIsSearchingDiagnosis(false);
      }
    }, 500);
  };

  const handleDiagnosisSelect = (snomedCode: SnomedCode) => {
    if (diagnosisSearchTimeoutRef.current) {
      clearTimeout(diagnosisSearchTimeoutRef.current);
      diagnosisSearchTimeoutRef.current = null;
    }
    
    setNewDiagnosis(prev => ({
      ...prev,
      diagnosisCode: snomedCode.code // Mantener el código para mostrar
    }));
    setNewDiagnosisName(snomedCode.shortName); // Guardar el nombre para enviar
    setIsSearchingDiagnosis(false);
    setShowDiagnosisResults(false);
    setDiagnosisSearchResults([]);
  };

  const handleDiagnosisInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewDiagnosis(prev => ({ ...prev, diagnosisCode: value }));
    handleDiagnosisSearch(value);
  };

  const handleDiagnosisInputFocus = () => {
    if (diagnosisSearchResults.length > 0) {
      setShowDiagnosisResults(true);
    }
  };

  const handleDiagnosisInputBlur = () => {
    // Add a small delay to allow click events to fire first
    setTimeout(() => {
      if (diagnosisSearchTimeoutRef.current) {
        clearTimeout(diagnosisSearchTimeoutRef.current);
        diagnosisSearchTimeoutRef.current = null;
      }
      setIsSearchingDiagnosis(false);
      setShowDiagnosisResults(false);
    }, 150);
  };

  const addObservation = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('addObservation called', newObservation);
    if (newObservation.loincCode && newObservation.method && newObservation.unitOfMeasure && newObservation.value) {
      setObservations([...observations, { ...newObservation }]);
      setObservationNames([...observationNames, newObservationName]);
      setNewObservation({ loincCode: '', method: '', unitOfMeasure: '', value: '' });
      setNewObservationName('');
      console.log('Observation added successfully');
    } else {
      console.log('Missing required fields for observation');
    }
  };

  const removeObservation = (index: number) => {
    setObservations(observations.filter((_, i) => i !== index));
    setObservationNames(observationNames.filter((_, i) => i !== index));
  };

  const addMedication = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('addMedication called', newMedication);
    if (newMedication.loincCode && newMedication.method && newMedication.unitOfMeasure && newMedication.value) {
      setMedications([...medications, { ...newMedication }]);
      setMedicationNames([...medicationNames, newMedicationName]);
      setNewMedication({ loincCode: '', method: '', unitOfMeasure: '', value: '' });
      setNewMedicationName('');
      console.log('Medication added successfully');
    } else {
      console.log('Missing required fields for medication');
    }
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
    setMedicationNames(medicationNames.filter((_, i) => i !== index));
  };

  const addDiagnosis = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('addDiagnosis called', newDiagnosis);
    if (newDiagnosis.description && newDiagnosis.diagnosisCode && newDiagnosis.status) {
      setDiagnoses([...diagnoses, { ...newDiagnosis }]);
      setDiagnosisNames([...diagnosisNames, newDiagnosisName]);
      setNewDiagnosis({ description: '', diagnosisCode: '', status: '' });
      setNewDiagnosisName('');
      console.log('Diagnosis added successfully');
    } else {
      console.log('Missing required fields for diagnosis');
    }
  };

  const removeDiagnosis = (index: number) => {
    setDiagnoses(diagnoses.filter((_, i) => i !== index));
    setDiagnosisNames(diagnosisNames.filter((_, i) => i !== index));
  };

  const addAllergy = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('addAllergy called', newAllergy);
    if (newAllergy.description) {
      setAllergies([...allergies, { ...newAllergy }]);
      setNewAllergy({ description: '', active: true });
      console.log('Allergy added successfully');
    } else {
      console.log('Missing required fields for allergy');
    }
  };

  const removeAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const isFormReady = (): boolean => {
    // Check required fields
    if (!encounterType || !startDate) {
      return false;
    }

    // Check if at least one section has data
    if (observations.length === 0 && medications.length === 0 && diagnoses.length === 0 && allergies.length === 0) {
      return false;
    }

    return true;
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!encounterType) {
      newErrors.push('El tipo de encuentro es requerido');
    }

    if (!startDate) {
      newErrors.push('La fecha de inicio es requerida');
    }

    // Check if at least one section has data
    if (observations.length === 0 && medications.length === 0 && diagnoses.length === 0 && allergies.length === 0) {
      newErrors.push('Debe completar al menos una sección (Observaciones, Medicamentos, Diagnósticos o Alergias)');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Create the clinical encounter object
      const clinicalEncounter: Omit<ClinicalEncounter, 'id'> = {
        encounterType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        observations,
        medications,
        diagnoses,
        allergies
      };

      // Convert to FHIR encounter
      const fhirEncounter = toFHIREncounter(clinicalEncounter as ClinicalEncounter, patientId);
      
      // Create encounter first
      console.log('Creating encounter...');
      const encounterResponse = await ApiService.createEncounter(fhirEncounter);
      const encounterId = encounterResponse.data.id;
      
      if (!encounterId) {
        throw new Error('No se pudo obtener el ID del encuentro creado');
      }

      console.log('Encounter created with ID:', encounterId);

      // Create observations with names instead of codes
      const observationsWithNames = observations.map((obs, index) => ({
        ...obs,
        loincCode: observationNames[index] || obs.loincCode // Usar el nombre si está disponible, sino el código
      }));
      const observationPromises = observationsWithNames.map(obs => 
        ApiService.createObservation(toFHIRObservation(obs, patientId, encounterId))
      );

      // Create medications with names instead of codes
      const medicationsWithNames = medications.map((med, index) => ({
        ...med,
        loincCode: medicationNames[index] || med.loincCode // Usar el nombre si está disponible, sino el código
      }));
      const medicationPromises = medicationsWithNames.map(med => 
        ApiService.createMedicationRequest(toFHIRMedicationRequest(med, patientId, encounterId))
      );

      // Create diagnoses with names instead of codes
      const diagnosesWithNames = diagnoses.map((diag, index) => ({
        ...diag,
        diagnosisCode: diagnosisNames[index] || diag.diagnosisCode // Usar el nombre si está disponible, sino el código
      }));
      const diagnosisPromises = diagnosesWithNames.map(diag => 
        ApiService.createCondition(toFHIRCondition(diag, patientId, encounterId))
      );

      // Create allergies
      const allergyPromises = allergies.map(allergy => 
        ApiService.createAllergyIntolerance(toFHIRAllergyIntolerance(allergy, patientId, encounterId))
      );

      // Execute all creation requests in parallel
      console.log('Creating related resources...');
      await Promise.all([
        ...observationPromises,
        ...medicationPromises,
        ...diagnosisPromises,
        ...allergyPromises
      ]);

      console.log('All resources created successfully');
      setSubmitSuccess(true);
      
      // Call the original onSubmit callback with the created encounter
      onSubmit(clinicalEncounter);

    } catch (error) {
      console.error('Error creating encounter:', error);
      setSubmitError(error instanceof Error ? error.message : 'Error desconocido al crear el encuentro');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Crear Encuentro Clínico</h1>
        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
          Paciente: <strong>{patientName}</strong>
        </p>
        <button className="back-button" onClick={onBack}>
          Volver al Detalle
        </button>
      </div>

      <div className="view-content">
        <form onSubmit={handleSubmit} className="encounter-form">
          {errors.length > 0 && (
            <div className="error-messages" style={{ 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '0.5rem', 
              padding: '1rem', 
              marginBottom: '1.5rem' 
            }}>
              <h3 style={{ color: '#dc2626', margin: '0 0 0.5rem 0' }}>Errores de validación:</h3>
              <ul style={{ color: '#dc2626', margin: 0, paddingLeft: '1.5rem' }}>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {submitError && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              color: '#dc2626'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                Error al crear el encuentro:
              </h3>
              <p style={{ margin: 0 }}>{submitError}</p>
            </div>
          )}

          {submitSuccess && (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              color: '#166534'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                ¡Encuentro creado exitosamente!
              </h3>
              <p style={{ margin: 0 }}>El encuentro clínico y todos sus recursos relacionados han sido creados en el backend.</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="form-section">
            <h2>Información Básica</h2>
            
            <div className="form-group">
              <label htmlFor="encounterType">Tipo de Encuentro *</label>
              <select
                id="encounterType"
                value={encounterType}
                onChange={(e) => setEncounterType(e.target.value as EncounterType)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              >
                {encounterTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="startDate">Fecha de Inicio *</label>
              <input
                type="datetime-local"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">Fecha de Fin (Opcional)</label>
              <input
                type="datetime-local"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          {/* Observations Section */}
          <div className="form-section">
            <h2>Observaciones</h2>
            
            <div className="form-row">
              <div className="form-group" style={{ position: 'relative' }}>
                <label htmlFor="obsLoincCode">Código LOINC</label>
                <input
                  ref={loincInputRef}
                  type="text"
                  id="obsLoincCode"
                  value={newObservation.loincCode}
                  onChange={handleLoincInputChange}
                  onFocus={handleLoincInputFocus}
                  onBlur={handleLoincInputBlur}
                  placeholder="Buscar código LOINC (ej: glucosa, presión arterial)..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    paddingRight: isSearchingLoinc ? '2.5rem' : '0.75rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    background: '#ffffff',
                    color: '#1f2937'
                  }}
                />
                
                {isSearchingLoinc && (
                  <div style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '69%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #f3f3f3',
                      borderTop: '2px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                  </div>
                )}

                {loincSearchError && (
                  <div style={{
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    marginTop: '0.25rem'
                  }}>
                    {loincSearchError}
                  </div>
                )}

                {showLoincResults && loincSearchResults.length > 0 && (
                  <div
                    ref={loincResultsRef}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      zIndex: 10,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      marginTop: '2px'
                    }}
                  >
                    {loincSearchResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleLoincSelect(result)}
                        style={{
                          padding: '0.75rem',
                          cursor: 'pointer',
                          borderBottom: index < loincSearchResults.length - 1 ? '1px solid #f3f4f6' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                        }}
                      >
                        <div style={{
                          fontWeight: '600',
                          color: '#1f2937',
                          fontSize: '0.9rem',
                          marginBottom: '0.25rem'
                        }}>
                          {result.code}
                        </div>
                        <div style={{
                          color: '#374151',
                          fontSize: '0.85rem',
                          lineHeight: '1.3',
                          wordBreak: 'break-word'
                        }}>
                          {result.shortName}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showLoincResults && loincSearchResults.length === 0 && newObservation.loincCode.length >= 2 && !isSearchingLoinc && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      zIndex: 10,
                      padding: '0.75rem',
                      color: '#6b7280',
                      fontSize: '0.9rem',
                      marginTop: '2px'
                    }}
                  >
                    No se encontraron códigos LOINC para "{newObservation.loincCode}"
                  </div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="obsMethod">Método</label>
                <input
                  type="text"
                  id="obsMethod"
                  value={newObservation.method}
                  onChange={(e) => setNewObservation({...newObservation, method: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="obsUnit">Unidad de Medida</label>
                <input
                  type="text"
                  id="obsUnit"
                  value={newObservation.unitOfMeasure}
                  onChange={(e) => setNewObservation({...newObservation, unitOfMeasure: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="obsValue">Valor</label>
                <input
                  type="text"
                  id="obsValue"
                  value={newObservation.value}
                  onChange={(e) => setNewObservation({...newObservation, value: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>
            
            <div className="add-button-container" style={{ marginTop: '1rem' }}>
              <button type="button" onClick={addObservation} className="add-button">
                Agregar Observación
              </button>
            </div>

            {observations.length > 0 && (
              <div className="items-list">
                <h3>Observaciones Agregadas:</h3>
                {observations.map((obs, index) => (
                  <div key={index} className="item-card">
                    <p><strong>Código LOINC:</strong> {obs.loincCode}</p>
                    <p><strong>Método:</strong> {obs.method}</p>
                    <p><strong>Unidad:</strong> {obs.unitOfMeasure}</p>
                    <p><strong>Valor:</strong> {obs.value}</p>
                    <button type="button" onClick={() => removeObservation(index)} className="remove-button">
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Medications Section */}
          <div className="form-section">
            <h2>Medicamentos</h2>
            
            <div className="form-row">
              <div className="form-group" style={{ position: 'relative' }}>
                <label htmlFor="medLoincCode">Código SNOMED</label>
                <input
                  ref={medicationInputRef}
                  type="text"
                  id="medLoincCode"
                  value={newMedication.loincCode}
                  onChange={handleMedicationInputChange}
                  onFocus={handleMedicationInputFocus}
                  onBlur={handleMedicationInputBlur}
                  placeholder="Buscar medicamento (ej: metformina, ibuprofeno)..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    paddingRight: isSearchingMedication ? '2.5rem' : '0.75rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    background: '#ffffff',
                    color: '#1f2937'
                  }}
                />
                
                {isSearchingMedication && (
                  <div style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '69%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #f3f3f3',
                      borderTop: '2px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                  </div>
                )}

                {medicationSearchError && (
                  <div style={{
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    marginTop: '0.25rem'
                  }}>
                    {medicationSearchError}
                  </div>
                )}

                {showMedicationResults && medicationSearchResults.length > 0 && (
                  <div
                    ref={medicationResultsRef}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      zIndex: 10,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      marginTop: '2px'
                    }}
                  >
                    {medicationSearchResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleMedicationSelect(result)}
                        style={{
                          padding: '0.75rem',
                          cursor: 'pointer',
                          borderBottom: index < medicationSearchResults.length - 1 ? '1px solid #f3f4f6' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                        }}
                      >
                        <div style={{
                          fontWeight: '600',
                          color: '#1f2937',
                          fontSize: '0.9rem',
                          marginBottom: '0.25rem'
                        }}>
                          {result.code}
                        </div>
                        <div style={{
                          color: '#374151',
                          fontSize: '0.85rem',
                          lineHeight: '1.3',
                          wordBreak: 'break-word'
                        }}>
                          {result.shortName}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showMedicationResults && medicationSearchResults.length === 0 && newMedication.loincCode.length >= 2 && !isSearchingMedication && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      zIndex: 10,
                      padding: '0.75rem',
                      color: '#6b7280',
                      fontSize: '0.9rem',
                      marginTop: '2px'
                    }}
                  >
                    No se encontraron medicamentos para "{newMedication.loincCode}"
                  </div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="medMethod">Método</label>
                <input
                  type="text"
                  id="medMethod"
                  value={newMedication.method}
                  onChange={(e) => setNewMedication({...newMedication, method: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="medUnit">Unidad de Medida</label>
                <input
                  type="text"
                  id="medUnit"
                  value={newMedication.unitOfMeasure}
                  onChange={(e) => setNewMedication({...newMedication, unitOfMeasure: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="medValue">Valor</label>
                <input
                  type="text"
                  id="medValue"
                  value={newMedication.value}
                  onChange={(e) => setNewMedication({...newMedication, value: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>
            
            <div className="add-button-container" style={{ marginTop: '1rem' }}>
              <button type="button" onClick={addMedication} className="add-button">
                Agregar Medicamento
              </button>
            </div>

            {medications.length > 0 && (
              <div className="items-list">
                <h3>Medicamentos Agregados:</h3>
                {medications.map((med, index) => (
                  <div key={index} className="item-card">
                    <p><strong>Código LOINC:</strong> {med.loincCode}</p>
                    <p><strong>Método:</strong> {med.method}</p>
                    <p><strong>Unidad:</strong> {med.unitOfMeasure}</p>
                    <p><strong>Valor:</strong> {med.value}</p>
                    <button type="button" onClick={() => removeMedication(index)} className="remove-button">
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diagnoses Section */}
          <div className="form-section">
            <h2>Diagnósticos</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="diagDescription">Descripción</label>
                <input
                  type="text"
                  id="diagDescription"
                  value={newDiagnosis.description}
                  onChange={(e) => setNewDiagnosis({...newDiagnosis, description: e.target.value})}
                  placeholder="Ej: Diabetes mellitus tipo 2"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    background: '#ffffff',
                    color: '#1f2937'
                  }}
                />
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label htmlFor="diagCode">Código SNOMED</label>
                <input
                  ref={diagnosisInputRef}
                  type="text"
                  id="diagCode"
                  value={newDiagnosis.diagnosisCode}
                  onChange={handleDiagnosisInputChange}
                  onFocus={handleDiagnosisInputFocus}
                  onBlur={handleDiagnosisInputBlur}
                  placeholder="Buscar diagnóstico (ej: diabetes, hipertensión)..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    paddingRight: isSearchingDiagnosis ? '2.5rem' : '0.75rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    background: '#ffffff',
                    color: '#1f2937'
                  }}
                />
                
                {isSearchingDiagnosis && (
                  <div style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '69%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #f3f3f3',
                      borderTop: '2px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                  </div>
                )}

                {diagnosisSearchError && (
                  <div style={{
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    marginTop: '0.25rem'
                  }}>
                    {diagnosisSearchError}
                  </div>
                )}

                {showDiagnosisResults && diagnosisSearchResults.length > 0 && (
                  <div
                    ref={diagnosisResultsRef}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      zIndex: 10,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      marginTop: '2px'
                    }}
                  >
                    {diagnosisSearchResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleDiagnosisSelect(result)}
                        style={{
                          padding: '0.75rem',
                          cursor: 'pointer',
                          borderBottom: index < diagnosisSearchResults.length - 1 ? '1px solid #f3f4f6' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                        }}
                      >
                        <div style={{
                          fontWeight: '600',
                          color: '#1f2937',
                          fontSize: '0.9rem',
                          marginBottom: '0.25rem'
                        }}>
                          {result.code}
                        </div>
                        <div style={{
                          color: '#374151',
                          fontSize: '0.85rem',
                          lineHeight: '1.3',
                          wordBreak: 'break-word'
                        }}>
                          {result.shortName}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showDiagnosisResults && diagnosisSearchResults.length === 0 && newDiagnosis.diagnosisCode.length >= 2 && !isSearchingDiagnosis && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      zIndex: 10,
                      padding: '0.75rem',
                      color: '#6b7280',
                      fontSize: '0.9rem',
                      marginTop: '2px'
                    }}
                  >
                    No se encontraron diagnósticos para "{newDiagnosis.diagnosisCode}"
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="diagStatus">Estado</label>
              <input
                type="text"
                id="diagStatus"
                value={newDiagnosis.status}
                onChange={(e) => setNewDiagnosis({...newDiagnosis, status: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div className="add-button-container" style={{ marginTop: '1rem' }}>
              <button type="button" onClick={addDiagnosis} className="add-button">
                Agregar Diagnóstico
              </button>
            </div>

            {diagnoses.length > 0 && (
              <div className="items-list">
                <h3>Diagnósticos Agregados:</h3>
                {diagnoses.map((diag, index) => (
                  <div key={index} className="item-card">
                    <p><strong>Descripción:</strong> {diag.description}</p>
                    <p><strong>Código:</strong> {diag.diagnosisCode}</p>
                    <p><strong>Estado:</strong> {diag.status}</p>
                    <button type="button" onClick={() => removeDiagnosis(index)} className="remove-button">
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Allergies Section */}
          <div className="form-section">
            <h2>Alergias</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="allergyDescription">Descripción</label>
                <input
                  type="text"
                  id="allergyDescription"
                  value={newAllergy.description}
                  onChange={(e) => setNewAllergy({...newAllergy, description: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="allergyActive">Activa</label>
                <select
                  id="allergyActive"
                  value={newAllergy.active.toString()}
                  onChange={(e) => setNewAllergy({...newAllergy, active: e.target.value === 'true'})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                >
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
            
            <div className="add-button-container" style={{ marginTop: '1rem' }}>
              <button type="button" onClick={addAllergy} className="add-button">
                Agregar Alergia
              </button>
            </div>

            {allergies.length > 0 && (
              <div className="items-list">
                <h3>Alergias Agregadas:</h3>
                {allergies.map((allergy, index) => (
                  <div key={index} className="item-card">
                    <p><strong>Descripción:</strong> {allergy.description}</p>
                    <p><strong>Activa:</strong> {allergy.active ? 'Sí' : 'No'}</p>
                    <button type="button" onClick={() => removeAllergy(index)} className="remove-button">
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isFormReady() && (
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '6px',
              padding: '1rem',
              marginBottom: '1rem',
              color: '#92400e'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                Campos requeridos:
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                {!encounterType && <li>Tipo de encuentro</li>}
                {!startDate && <li>Fecha de inicio</li>}
                {observations.length === 0 && medications.length === 0 && diagnoses.length === 0 && allergies.length === 0 && (
                  <li>Al menos una sección (Observaciones, Medicamentos, Diagnósticos o Alergias)</li>
                )}
              </ul>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onBack} className="cancel-button">
              Cancelar
            </button>
            <button 
              type="submit" 
              className={`submit-button ${!isFormReady() || isSubmitting ? 'disabled' : ''}`}
              disabled={!isFormReady() || isSubmitting}
            >
              {isSubmitting ? 'Creando Encuentro...' : 'Crear Encuentro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EncounterForm;
