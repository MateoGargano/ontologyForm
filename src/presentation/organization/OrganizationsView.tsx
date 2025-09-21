import React from 'react';

interface OrganizationsViewProps {
  onBack: () => void;
}

const OrganizationsView: React.FC<OrganizationsViewProps> = ({ onBack }) => {
  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Organizaciones</h1>
        <button className="back-button" onClick={onBack}>
          Volver
        </button>
      </div>
      <div className="view-content">
        <p>Esta es la pantalla de gestión de organizaciones.</p>
        <p>Aquí se mostrará la lista de organizaciones y sus funcionalidades.</p>
      </div>
    </div>
  );
};

export default OrganizationsView;
