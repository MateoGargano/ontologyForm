import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/apiService';
import { fromFHIREncounter } from '../../services/fhirConverters';
import type { ClinicalEncounter } from '../../domain/datatypes/Encounter';

interface Patient {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  deathDate: string | null;
  phone: string;
  mobile: string;
  email: string;
  address: string;
  district: string;
  height: string;
  weight: string;
}

interface PatientDetailViewProps {
  patient: Patient;
  onBack: () => void;
  onKillPatient?: (patientId: string, deceasedDateTime: string) => void;
  onCreateEncounter?: (patientId: string) => void;
}

interface DeathModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deceasedDateTime: string) => void;
  patientName: string;
}

const DeathModal: React.FC<DeathModalProps> = ({ isOpen, onClose, onConfirm, patientName }) => {
  const [deceasedDateTime, setDeceasedDateTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deceasedDateTime) {
      onConfirm(deceasedDateTime);
      setDeceasedDateTime('');
    }
  };

  const handleClose = () => {
    setDeceasedDateTime('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Registrar Fallecimiento</h2>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
            Estás a punto de marcar como fallecido al paciente <strong>{patientName}</strong>.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="modal-form-group">
              <label htmlFor="deceasedDateTime">Fecha y Hora de Fallecimiento *</label>
              <input
                type="datetime-local"
                id="deceasedDateTime"
                value={deceasedDateTime}
                onChange={(e) => setDeceasedDateTime(e.target.value)}
                required
                min="1900-01-01T00:00"
                max={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="modal-button secondary" onClick={handleClose}>
                Cancelar
              </button>
              <button type="submit" className="modal-button primary">
                Confirmar Fallecimiento
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const PatientDetailView: React.FC<PatientDetailViewProps> = ({ patient, onBack, onKillPatient, onCreateEncounter }) => {
  const [showDeathModal, setShowDeathModal] = useState(false);
  const [encounters, setEncounters] = useState<ClinicalEncounter[]>([]);
  const [loadingEncounters, setLoadingEncounters] = useState(false);
  const [encountersError, setEncountersError] = useState<string | null>(null);

  const handleKillPatient = () => {
    setShowDeathModal(true);
  };

  const handleConfirmDeath = (deceasedDateTime: string) => {
    if (onKillPatient) {
      onKillPatient(patient.id, deceasedDateTime);
    }
    setShowDeathModal(false);
  };

  const handleCloseModal = () => {
    setShowDeathModal(false);
  };

  // Load encounters and related resources when component mounts
  useEffect(() => {
    const loadEncountersWithResources = async () => {
      setLoadingEncounters(true);
      setEncountersError(null);
      
      try {
        // Load encounters
        const encountersResponse = await ApiService.getPatientEncounters(patient.id);
        const clinicalEncounters = encountersResponse.data.map(fhirEncounter => 
          fromFHIREncounter(fhirEncounter)
        );

        // Load all related resources
        const [observationsResponse, medicationsResponse, conditionsResponse, allergiesResponse] = await Promise.all([
          ApiService.getPatientObservations(patient.id),
          ApiService.getPatientMedicationRequests(patient.id),
          ApiService.getPatientConditions(patient.id),
          ApiService.getPatientAllergyIntolerances(patient.id)
        ]);

        // Group resources by encounter
        const encountersWithResources = clinicalEncounters.map(encounter => {
          const encounterId = encounter.id;
          
          // Filter observations for this encounter
          const encounterObservations = observationsResponse.data
            .filter(obs => obs.encounter?.reference === `Encounter/${encounterId}`)
            .map(obs => ({
              loincCode: obs.code?.coding?.[0]?.code || obs.id || 'Unknown',
              method: obs.method?.text || 'Unknown',
              unitOfMeasure: obs.valueQuantity?.unit || 'Unknown',
              value: obs.valueQuantity?.value?.toString() || obs.valueString || 'Unknown'
            }));

          // Filter medications for this encounter
          const encounterMedications = medicationsResponse.data
            .filter(med => med.encounter?.reference === `Encounter/${encounterId}`)
            .map(med => ({
              loincCode: med.medicationCodeableConcept?.coding?.[0]?.code || med.id || 'Unknown',
              method: med.dosageInstruction?.[0]?.route?.text || 'Unknown',
              unitOfMeasure: med.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity?.unit || 'Unknown',
              value: med.dosageInstruction?.[0]?.text || 'Unknown'
            }));

          // Filter conditions for this encounter
          const encounterConditions = conditionsResponse.data
            .filter(cond => cond.encounter?.reference === `Encounter/${encounterId}`)
            .map(cond => ({
              description: cond.code?.text || cond.code?.coding?.[0]?.display || 'Unknown',
              diagnosisCode: cond.code?.coding?.[0]?.code || cond.id || 'Unknown',
              status: cond.clinicalStatus?.coding?.[0]?.code || 'unknown'
            }));

          // Filter allergies for this encounter
          const encounterAllergies = allergiesResponse.data
            .filter(allergy => allergy.encounter?.reference === `Encounter/${encounterId}`)
            .map(allergy => ({
              description: allergy.code?.text || allergy.code?.coding?.[0]?.display || 'Unknown',
              active: allergy.clinicalStatus?.coding?.[0]?.code === 'active'
            }));

          return {
            ...encounter,
            observations: encounterObservations,
            medications: encounterMedications,
            diagnoses: encounterConditions,
            allergies: encounterAllergies
          };
        });

        setEncounters(encountersWithResources);
      } catch (error) {
        console.error('Error loading encounters:', error);
        setEncountersError('Error al cargar los encuentros del paciente');
      } finally {
        setLoadingEncounters(false);
      }
    };

    loadEncountersWithResources();
  }, [patient.id]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Detalle del Paciente</h1>
        <button className="back-button" onClick={onBack}>
          Volver a la Lista
        </button>
      </div>
      
      <div className="view-content">
        <div className="patient-detail-simple">
          <div className="patient-info">
            <h2>{patient.name}</h2>
            <p><strong>Género:</strong> {patient.gender}</p>
            <p><strong>Fecha de Nacimiento:</strong> {patient.birthDate}</p>
            <p><strong>Fecha de Defunción:</strong> {patient.deathDate || '-'}</p>
            <p><strong>Altura:</strong> {patient.height} cm</p>
            <p><strong>Peso:</strong> {patient.weight} kg</p>
          </div>

          <div className="patient-contact">
            <h3>Contacto</h3>
            <p><strong>Teléfono Fijo:</strong> {patient.phone}</p>
            <p><strong>Teléfono Móvil:</strong> {patient.mobile}</p>
            <p><strong>Email:</strong> {patient.email}</p>
          </div>

          <div className="patient-address">
            <h3>Dirección</h3>
            <p><strong>Dirección:</strong> {patient.address}</p>
            <p><strong>Barrio:</strong> {patient.district}</p>
          </div>

                 {!patient.deathDate && (
                   <div className="patient-actions">
                     {onCreateEncounter && (
                       <button 
                         className="create-encounter-button" 
                         onClick={() => onCreateEncounter(patient.id)}
                         style={{
                           backgroundColor: '#10b981',
                           color: 'white',
                           border: 'none',
                           padding: '0.75rem 1.5rem',
                           borderRadius: '0.5rem',
                           cursor: 'pointer',
                           fontSize: '1rem',
                           fontWeight: '500',
                           marginRight: '1rem'
                         }}
                       >
                         Crear Encuentro
                       </button>
                     )}
                     {onKillPatient && (
                       <button className="kill-button" onClick={handleKillPatient}>
                         Acta de Defunción
                       </button>
                     )}
                   </div>
                 )}
               </div>

               {/* Encounters Section */}
               <div className="patient-encounters">
                 <h2>Encuentros Clínicos</h2>
                 
                 {loadingEncounters && (
                   <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                     <div style={{
                       display: 'inline-block',
                       width: '20px',
                       height: '20px',
                       border: '2px solid #f3f3f3',
                       borderTop: '2px solid #3b82f6',
                       borderRadius: '50%',
                       animation: 'spin 1s linear infinite'
                     }}></div>
                     <p style={{ marginTop: '0.5rem' }}>Cargando encuentros...</p>
                   </div>
                 )}

                 {encountersError && (
                   <div style={{
                     backgroundColor: '#fef2f2',
                     border: '1px solid #fecaca',
                     borderRadius: '0.5rem',
                     padding: '1rem',
                     color: '#dc2626',
                     marginBottom: '1rem'
                   }}>
                     {encountersError}
                   </div>
                 )}

                 {!loadingEncounters && !encountersError && encounters.length === 0 && (
                   <div style={{
                     backgroundColor: '#f8fafc',
                     border: '1px solid #e2e8f0',
                     borderRadius: '0.5rem',
                     padding: '2rem',
                     textAlign: 'center',
                     color: '#64748b'
                   }}>
                     <p>No hay encuentros clínicos registrados para este paciente.</p>
                   </div>
                 )}

                 {!loadingEncounters && !encountersError && encounters.length > 0 && (
                   <div className="encounters-list">
                     {encounters.map((encounter, index) => (
                       <div key={encounter.id || index} className="encounter-card">
                         <div className="encounter-header">
                           <h3>{encounter.encounterType}</h3>
                           <span className="encounter-date">
                             {formatDate(encounter.startDate)}
                             {encounter.endDate && ` - ${formatDate(encounter.endDate)}`}
                           </span>
                         </div>
                         
                         <div className="encounter-content">
                           {/* Show resources if they exist */}
                           {(encounter.observations.length > 0 || encounter.medications.length > 0 || 
                             encounter.diagnoses.length > 0 || encounter.allergies.length > 0) ? (
                             <div className="encounter-resources">
                               {encounter.observations.length > 0 && (
                                 <div className="resource-section">
                                   <h4>Observaciones:</h4>
                                   {encounter.observations.map((obs, obsIndex) => (
                                     <div key={obsIndex} className="resource-item">
                                       <span className="resource-code">{obs.loincCode}</span>
                                       <span className="resource-value">{obs.value} {obs.unitOfMeasure}</span>
                                       <span className="resource-method">Método: {obs.method}</span>
                                     </div>
                                   ))}
                                 </div>
                               )}

                               {encounter.medications.length > 0 && (
                                 <div className="resource-section">
                                   <h4>Medicamentos:</h4>
                                   {encounter.medications.map((med, medIndex) => (
                                     <div key={medIndex} className="resource-item">
                                       <span className="resource-code">{med.loincCode}</span>
                                       <span className="resource-value">{med.value}</span>
                                       <span className="resource-method">Método: {med.method}</span>
                                     </div>
                                   ))}
                                 </div>
                               )}

                               {encounter.diagnoses.length > 0 && (
                                 <div className="resource-section">
                                   <h4>Diagnósticos:</h4>
                                   {encounter.diagnoses.map((diag, diagIndex) => (
                                     <div key={diagIndex} className="resource-item">
                                       <span className="resource-description">{diag.description}</span>
                                       <span className="resource-code">{diag.diagnosisCode}</span>
                                       <span className="resource-status">Estado: {diag.status}</span>
                                     </div>
                                   ))}
                                 </div>
                               )}

                               {encounter.allergies.length > 0 && (
                                 <div className="resource-section">
                                   <h4>Alergias:</h4>
                                   {encounter.allergies.map((allergy, allergyIndex) => (
                                     <div key={allergyIndex} className="resource-item">
                                       <span className="resource-description">{allergy.description}</span>
                                       <span className={`resource-status ${allergy.active ? 'active' : 'inactive'}`}>
                                         {allergy.active ? 'Activa' : 'Inactiva'}
                                       </span>
                                     </div>
                                   ))}
                                 </div>
                               )}
                             </div>
                           ) : (
                             <div className="no-resources">
                               <p>No hay registros médicos en este encuentro.</p>
                             </div>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </div>
             
             <DeathModal
               isOpen={showDeathModal}
               onClose={handleCloseModal}
               onConfirm={handleConfirmDeath}
               patientName={patient.name}
             />
           </div>
         );
       };

       export default PatientDetailView;
