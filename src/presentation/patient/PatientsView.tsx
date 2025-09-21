import React, { useState } from 'react';
import { usePatientsViewModel } from './PatientsViewModel.ts';
import { ApiService } from '../../services/apiService';

interface Patient {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  deathDate: string | null;
}

interface PatientsViewProps {
  onBack: () => void;
  onPatientSelect: (patient: Patient) => void;
}

interface NewPatientForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  identificationType: string;
  identificationCountry: string;
  identificationValue: string;
  email: string;
  phone: string;
  cellular: string;
  neighborhood: string;
  street: string;
  city: string;
  postalCode: string;
  department: string;
  doorNumber: string;
  apartmentNumber: string;
  height: string;
  weight: string;
}

const PatientsView: React.FC<PatientsViewProps> = ({ onBack, onPatientSelect }) => {
  const viewModel = usePatientsViewModel();
  const [currentView, setCurrentView] = useState<'list' | 'add'>('list');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newPatient, setNewPatient] = useState<NewPatientForm>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    identificationType: 'CI',
    identificationCountry: '',
    identificationValue: '',
    email: '',
    phone: '',
    cellular: '',
    neighborhood: '',
    street: '',
    city: '',
    postalCode: '',
    department: '',
    doorNumber: '',
    apartmentNumber: '',
    height: '',
    weight: ''
  });

  const handlePatientClick = (patient: Patient) => {
    viewModel.selectPatient(patient);
    onPatientSelect(patient);
  };

  const handleAddPatient = () => {
    setCurrentView('add');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validar campos requeridos del tipo Patient
    if (!newPatient.firstName.trim()) newErrors.firstName = 'El nombre es obligatorio';
    if (!newPatient.lastName.trim()) newErrors.lastName = 'El apellido es obligatorio';
    if (!newPatient.dateOfBirth) newErrors.dateOfBirth = 'La fecha de nacimiento es obligatoria';
    if (!newPatient.gender) newErrors.gender = 'El género es obligatorio';
    if (!newPatient.identificationType) newErrors.identificationType = 'El tipo de identificación es obligatorio';
    if (!newPatient.identificationCountry.trim()) newErrors.identificationCountry = 'El país de identificación es obligatorio';
    if (!newPatient.identificationValue.trim()) newErrors.identificationValue = 'El número de identificación es obligatorio';
    if (!newPatient.email.trim()) newErrors.email = 'El email es obligatorio';
    if (!newPatient.phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
    if (!newPatient.cellular.trim()) newErrors.cellular = 'El celular es obligatorio';
    if (!newPatient.neighborhood.trim()) newErrors.neighborhood = 'El barrio es obligatorio';
    if (!newPatient.street.trim()) newErrors.street = 'La calle es obligatoria';
    if (!newPatient.city.trim()) newErrors.city = 'La ciudad es obligatoria';
    if (!newPatient.postalCode.trim()) newErrors.postalCode = 'El código postal es obligatorio';
    if (!newPatient.department.trim()) newErrors.department = 'El departamento es obligatorio';
    if (!newPatient.doorNumber.trim()) newErrors.doorNumber = 'El número de puerta es obligatorio';
    if (!newPatient.height.trim()) newErrors.height = 'La altura es obligatoria';
    if (!newPatient.weight.trim()) newErrors.weight = 'El peso es obligatorio';

    // Validar formato de email
    if (newPatient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newPatient.email)) {
      newErrors.email = 'El formato del email no es válido';
    }

    // Validar formato de teléfono (básico)
    if (newPatient.phone && !/^[\d\s\-+()]+$/.test(newPatient.phone)) {
      newErrors.phone = 'El formato del teléfono no es válido';
    }

    // Validar formato de celular
    if (newPatient.cellular && !/^[\d\s\-+()]+$/.test(newPatient.cellular)) {
      newErrors.cellular = 'El formato del celular no es válido';
    }

    // Validar que altura y peso sean números positivos
    if (newPatient.height && (isNaN(Number(newPatient.height)) || Number(newPatient.height) <= 0)) {
      newErrors.height = 'La altura debe ser un número mayor a 0';
    }

    if (newPatient.weight && (isNaN(Number(newPatient.weight)) || Number(newPatient.weight) <= 0)) {
      newErrors.weight = 'El peso debe ser un número mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCancelAdd = () => {
    setCurrentView('list');
    setErrors({});
    setNewPatient({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
      identificationType: 'CI',
      identificationCountry: '',
      identificationValue: '',
      email: '',
      phone: '',
      cellular: '',
      neighborhood: '',
      street: '',
      city: '',
      postalCode: '',
      department: '',
      doorNumber: '',
      apartmentNumber: '',
      height: '',
      weight: ''
    });
  };

  const handleSubmitAdd = async () => {
    if (validateForm()) {
      try {
        // Crear el objeto paciente en formato FHIR
        const patientData = {
          resourceType: "Patient" as const,
          active: true,
          gender: newPatient.gender as "male" | "female" | "other" | "unknown",
          identifier: [{
            use: "usual" as const,
            type: {
              coding: [{
                system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                code: newPatient.identificationType === 'CI' ? 'SS' : 
                      newPatient.identificationType === 'PASSPORT' ? 'PPN' : 'DL',
                display: newPatient.identificationType === 'CI' ? 'Social Security number' :
                        newPatient.identificationType === 'PASSPORT' ? 'Passport Number' : 'Driver License'
              }]
            },
            system: `urn:oid:2.16.840.1.113883.4.3.${newPatient.identificationCountry}`,
            value: newPatient.identificationValue
          }],
          name: [{
            use: "official" as const,
            family: newPatient.lastName,
            given: [newPatient.firstName]
          }],
          telecom: [
            {
              system: "phone" as const,
              value: newPatient.phone,
              use: "home" as const
            },
            {
              system: "phone" as const, 
              value: newPatient.cellular,
              use: "mobile" as const
            },
            {
              system: "email" as const,
              value: newPatient.email,
              use: "home" as const
            }
          ],
          address: [{
            use: "home" as const,
            type: "physical" as const,
            line: [
              `${newPatient.street} ${newPatient.doorNumber}`,
              ...(newPatient.apartmentNumber ? [`Apto ${newPatient.apartmentNumber}`] : [])
            ],
            city: newPatient.city,
            district: newPatient.neighborhood,
            state: newPatient.department,
            postalCode: newPatient.postalCode,
            country: newPatient.identificationCountry
          }],
          birthDate: newPatient.dateOfBirth,
          height: Number(newPatient.height),
          weight: Number(newPatient.weight)
        };

        console.log('Creando paciente:', patientData);
        
        // Llamada real a la API
        const response = await ApiService.createPatient(patientData);
        
        if (response.status === 200 || response.status === 201) {
          alert('Paciente creado exitosamente!');
        } else {
          throw new Error('Error en la respuesta del servidor');
        }
        
        // Cerrar formulario y recargar lista
        handleCancelAdd();
        viewModel.refreshPatients();
        
      } catch (error) {
        console.error('Error al crear paciente:', error);
        alert('Error al crear el paciente. Inténtalo de nuevo.');
      }
    } else {
      // Scroll al primer error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }
    }
  };

  const handleInputChange = (field: keyof NewPatientForm, value: string) => {
    setNewPatient(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Pantalla del formulario de agregar paciente
  if (currentView === 'add') {
    return (
      <div className="view-container">
        <div className="view-header">
          <h1 className="view-title">Agregar Nuevo Paciente</h1>
          <button className="back-button" onClick={handleCancelAdd}>
            Volver a la Lista
          </button>
        </div>
        <div className="view-content">
          <div className="add-patient-form">
            <div className="form-sections">
              {/* Información Personal */}
              <div className="form-section">
                <h3>👤 Información Personal</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nombre *</label>
                    <input
                      type="text"
                      id="firstName"
                      value={newPatient.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Nombre"
                      className={errors.firstName ? 'error' : ''}
                      required
                    />
                    {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                  </div>
                  <div className="form-group">
                    <label>Apellido *</label>
                    <input
                      type="text"
                      id="lastName"
                      value={newPatient.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Apellido"
                      className={errors.lastName ? 'error' : ''}
                      required
                    />
                    {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                  </div>
                  <div className="form-group">
                    <label>Fecha de Nacimiento *</label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      value={newPatient.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className={errors.dateOfBirth ? 'error' : ''}
                      required
                    />
                    {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
                  </div>
                  <div className="form-group">
                    <label>Género *</label>
                    <select
                      id="gender"
                      value={newPatient.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className={errors.gender ? 'error' : ''}
                      required
                    >
                      <option value="male">Masculino</option>
                      <option value="female">Femenino</option>
                      <option value="other">Otro</option>
                      <option value="unknown">Desconocido</option>
                    </select>
                    {errors.gender && <span className="error-message">{errors.gender}</span>}
                  </div>
                </div>
              </div>

              {/* Documento de Identidad */}
              <div className="form-section">
                <h3>🆔 Documento de Identidad</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tipo de Identificación *</label>
                    <select
                      id="identificationType"
                      value={newPatient.identificationType}
                      onChange={(e) => handleInputChange('identificationType', e.target.value)}
                      className={errors.identificationType ? 'error' : ''}
                    >
                      <option value="CI">Cédula de Identidad</option>
                      <option value="PASSPORT">Pasaporte</option>
                      <option value="DRIVER_LICENSE">Licencia de Conducir</option>
                      <option value="OTHER">Otro</option>
                    </select>
                    {errors.identificationType && <span className="error-message">{errors.identificationType}</span>}
                  </div>
                  <div className="form-group">
                    <label>País de Identificación *</label>
                    <input
                      type="text"
                      id="identificationCountry"
                      value={newPatient.identificationCountry}
                      onChange={(e) => handleInputChange('identificationCountry', e.target.value)}
                      placeholder="País"
                      className={errors.identificationCountry ? 'error' : ''}
                    />
                    {errors.identificationCountry && <span className="error-message">{errors.identificationCountry}</span>}
                  </div>
                  <div className="form-group">
                    <label>Número de Identificación *</label>
                    <input
                      type="text"
                      id="identificationValue"
                      value={newPatient.identificationValue}
                      onChange={(e) => handleInputChange('identificationValue', e.target.value)}
                      placeholder="Número de documento"
                      className={errors.identificationValue ? 'error' : ''}
                    />
                    {errors.identificationValue && <span className="error-message">{errors.identificationValue}</span>}
                  </div>
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="form-section">
                <h3>📞 Información de Contacto</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      id="email"
                      value={newPatient.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>
                  <div className="form-group">
                    <label>Teléfono *</label>
                    <input
                      type="tel"
                      id="phone"
                      value={newPatient.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="000 000 000"
                      className={errors.phone ? 'error' : ''}
                    />
                    {errors.phone && <span className="error-message">{errors.phone}</span>}
                  </div>
                  <div className="form-group">
                    <label>Celular *</label>
                    <input
                      type="tel"
                      id="cellular"
                      value={newPatient.cellular}
                      onChange={(e) => handleInputChange('cellular', e.target.value)}
                      placeholder="000 000 000"
                      className={errors.cellular ? 'error' : ''}
                    />
                    {errors.cellular && <span className="error-message">{errors.cellular}</span>}
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div className="form-section">
                <h3>🏠 Dirección</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Barrio *</label>
                    <input
                      type="text"
                      id="neighborhood"
                      value={newPatient.neighborhood}
                      onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                      placeholder="Barrio"
                      className={errors.neighborhood ? 'error' : ''}
                    />
                    {errors.neighborhood && <span className="error-message">{errors.neighborhood}</span>}
                  </div>
                  <div className="form-group">
                    <label>Calle *</label>
                    <input
                      type="text"
                      id="street"
                      value={newPatient.street}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      placeholder="Calle"
                      className={errors.street ? 'error' : ''}
                    />
                    {errors.street && <span className="error-message">{errors.street}</span>}
                  </div>
                  <div className="form-group">
                    <label>Número de Puerta *</label>
                    <input
                      type="text"
                      id="doorNumber"
                      value={newPatient.doorNumber}
                      onChange={(e) => handleInputChange('doorNumber', e.target.value)}
                      placeholder="Número"
                      className={errors.doorNumber ? 'error' : ''}
                    />
                    {errors.doorNumber && <span className="error-message">{errors.doorNumber}</span>}
                  </div>
                  <div className="form-group">
                    <label>Número de Apartamento</label>
                    <input
                      type="text"
                      id="apartmentNumber"
                      value={newPatient.apartmentNumber}
                      onChange={(e) => handleInputChange('apartmentNumber', e.target.value)}
                      placeholder="Apartamento (opcional)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Ciudad *</label>
                    <input
                      type="text"
                      id="city"
                      value={newPatient.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Ciudad"
                      className={errors.city ? 'error' : ''}
                    />
                    {errors.city && <span className="error-message">{errors.city}</span>}
                  </div>
                  <div className="form-group">
                    <label>Departamento *</label>
                    <input
                      type="text"
                      id="department"
                      value={newPatient.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="Departamento"
                      className={errors.department ? 'error' : ''}
                    />
                    {errors.department && <span className="error-message">{errors.department}</span>}
                  </div>
                  <div className="form-group">
                    <label>Código Postal *</label>
                    <input
                      type="text"
                      id="postalCode"
                      value={newPatient.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="00000"
                      className={errors.postalCode ? 'error' : ''}
                    />
                    {errors.postalCode && <span className="error-message">{errors.postalCode}</span>}
                  </div>
                </div>
              </div>

              {/* Información Médica */}
              <div className="form-section">
                <h3>🏥 Información Médica</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Altura (cm) *</label>
                    <input
                      type="number"
                      id="height"
                      value={newPatient.height}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      placeholder="170"
                      className={errors.height ? 'error' : ''}
                    />
                    {errors.height && <span className="error-message">{errors.height}</span>}
                  </div>
                  <div className="form-group">
                    <label>Peso (kg) *</label>
                    <input
                      type="number"
                      id="weight"
                      value={newPatient.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      placeholder="70"
                      className={errors.weight ? 'error' : ''}
                    />
                    {errors.weight && <span className="error-message">{errors.weight}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button className="cancel-button" onClick={handleCancelAdd}>
                Cancelar
              </button>
              <button className="submit-button" onClick={handleSubmitAdd}>
                ✅ Crear Paciente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de la lista de pacientes
  if (viewModel.isLoading) {
    return (
      <div className="view-container">
        <div className="view-header">
          <h1 className="view-title">Pacientes</h1>
          <button className="back-button" onClick={onBack}>
            Volver
          </button>
        </div>
        <div className="view-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando pacientes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (viewModel.error) {
  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Pacientes</h1>
        <button className="back-button" onClick={onBack}>
          Volver
        </button>
      </div>
      <div className="view-content">
          <div className="error-container">
            <p className="error-message">Error: {viewModel.error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Pacientes ({viewModel.patients.length})</h1>
        <div className="header-actions">
          <button className="add-button" onClick={handleAddPatient}>
            Agregar Paciente
          </button>
          <button className="back-button" onClick={onBack}>
            Volver
          </button>
        </div>
      </div>
      <div className="view-content">
        {viewModel.patients.length === 0 ? (
          <div className="empty-state">
            <p>No hay pacientes registrados</p>
          </div>
        ) : (
          <div className="patients-table">
            <table className="patients-table-content">
              <thead>
                <tr>
                  <th>Nombre y Apellido</th>
                  <th>Fecha de Nacimiento</th>
                  <th>Género</th>
                  <th>Fecha de Defunción</th>
                </tr>
              </thead>
              <tbody>
                {viewModel.patients.map((patient) => (
                  <tr 
                    key={patient.id} 
                    className={`patient-row ${viewModel.selectedPatient?.id === patient.id ? 'selected' : ''}`}
                    onClick={() => handlePatientClick(patient)}
                  >
                    <td className="patient-name">{patient.name}</td>
                    <td className="patient-birth">{patient.birthDate}</td>
                    <td className="patient-gender">{patient.gender}</td>
                    <td className="patient-death">{patient.deathDate || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientsView;
