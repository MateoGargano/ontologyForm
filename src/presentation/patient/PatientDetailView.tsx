import React, { useState } from 'react';

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

const PatientDetailView: React.FC<PatientDetailViewProps> = ({ patient, onBack, onKillPatient }) => {
  const [showDeathModal, setShowDeathModal] = useState(false);

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

                 {!patient.deathDate && onKillPatient && (
                   <div className="patient-actions">
                     <button className="kill-button" onClick={handleKillPatient}>
                       Acta de Defunción
                     </button>
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
