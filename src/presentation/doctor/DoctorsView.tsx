import React from 'react';

interface DoctorsViewProps {
  onBack: () => void;
}

const DoctorsView: React.FC<DoctorsViewProps> = ({ onBack }) => {
  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Médicos</h1>
        <button className="back-button" onClick={onBack}>
          Volver
        </button>
      </div>
      <div className="view-content">
        <p>Esta es la pantalla de gestión de médicos.</p>
        <p>Aquí se mostrará la lista de médicos y sus funcionalidades.</p>
      </div>
    </div>
  );
};

export default DoctorsView;
