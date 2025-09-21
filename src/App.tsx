import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './App.css'
import PatientsView from './presentation/patient/PatientsView'
import PatientDetailView from './presentation/patient/PatientDetailView'
import DoctorsView from './presentation/doctor/DoctorsView'
import OrganizationsView from './presentation/organization/OrganizationsView'
import { ApiService } from './services/apiService'

function MainPage() {
  return (
    <div className="main-navigation">
      <h1>Sistema de Gestión Médica</h1>
      <div className="navigation-buttons">
        <Link to="/patients" className="nav-button">
          Pacientes
        </Link>
        <Link to="/doctors" className="nav-button">
          Médicos
        </Link>
        <Link to="/organizations" className="nav-button">
          Organizaciones
        </Link>
      </div>
    </div>
  )
}

function PatientsPage() {
  const navigate = useNavigate()

  const handlePatientSelect = (patient: { id: string; name: string; birthDate: string; gender: string; deathDate: string | null }) => {
    navigate(`/patients/${patient.id}`)
  }

  const handleBack = () => {
    navigate('/')
  }

  return <PatientsView onBack={handleBack} onPatientSelect={handlePatientSelect} />
}

function PatientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPatient = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        const response = await ApiService.getPatientById(id)
        // La respuesta viene envuelta en { success, data, message }
        if (response.data && typeof response.data === 'object' && 'data' in response.data) {
          setPatient(response.data.data)
        } else {
          setPatient(response.data)
        }
      } catch (err) {
        setError('Error al cargar el paciente')
        console.error('Error loading patient:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPatient()
  }, [id])

  const handleBack = () => {
    navigate('/patients')
  }

  const handleKillPatient = async (patientId: string, deceasedDateTime: string) => {
    try {
      // Convertir la fecha local a formato ISO con timezone UTC
      const isoDateTime = new Date(deceasedDateTime).toISOString()
      
      console.log('Marcando paciente como fallecido:', patientId, 'Fecha:', isoDateTime)
      
      const response = await ApiService.markPatientAsDeceased(patientId, isoDateTime)
      
      if (response.status === 200 || response.status === 204) {
        alert('Paciente marcado como fallecido exitosamente')
        // Después de marcar como fallecido, volver a la lista
        navigate('/patients')
      } else {
        throw new Error('Error en la respuesta del servidor')
      }
    } catch (error) {
      console.error('Error al marcar paciente como fallecido:', error)
      alert('Error al marcar el paciente como fallecido. Inténtalo de nuevo.')
    }
  }

  if (loading) {
    return (
      <div className="view-container">
        <div className="view-header">
          <h1 className="view-title">Cargando Paciente...</h1>
          <button className="back-button" onClick={handleBack}>
            Volver a la Lista
          </button>
        </div>
        <div className="view-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando paciente...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="view-container">
        <div className="view-header">
          <h1 className="view-title">Error</h1>
          <button className="back-button" onClick={handleBack}>
            Volver a la Lista
          </button>
        </div>
        <div className="view-content">
          <div className="error-container">
            <p className="error-message">{error || 'Paciente no encontrado'}</p>
          </div>
        </div>
      </div>
    )
  }

  // Transformar datos FHIR a formato de display
  const displayPatient = {
    id: patient.id || '-',
    name: patient.name?.[0]?.text || 
          (patient.name?.[0]?.given && patient.name?.[0]?.family ? 
            `${patient.name[0].given.join(' ')} ${patient.name[0].family}`.trim() : 
            'Nombre no disponible'),
    birthDate: patient.birthDate || '-',
    gender: patient.gender === 'male' ? 'Masculino' : 
            patient.gender === 'female' ? 'Femenino' : 
            patient.gender || '-',
    deathDate: patient.deceasedDateTime ? 
      patient.deceasedDateTime.split('T')[0] : 
      null,
    // Información adicional
    phone: patient.telecom?.find((t: any) => t.system === 'phone' && t.use === 'home')?.value || '-', // eslint-disable-line @typescript-eslint/no-explicit-any
    mobile: patient.telecom?.find((t: any) => t.system === 'phone' && t.use === 'mobile')?.value || '-', // eslint-disable-line @typescript-eslint/no-explicit-any
    email: patient.telecom?.find((t: any) => t.system === 'email')?.value || '-', // eslint-disable-line @typescript-eslint/no-explicit-any
    address: patient.address?.[0] ? 
      `${patient.address[0].line?.join(', ') || ''}, ${patient.address[0].city || ''}, ${patient.address[0].state || ''}, ${patient.address[0].postalCode || ''}, ${patient.address[0].country || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '') : '-',
    district: patient.address?.[0]?.district || '-',
    height: patient.height || '-',
    weight: patient.weight || '-'
  }

  return (
    <PatientDetailView 
      patient={displayPatient} 
      onBack={handleBack}
      onKillPatient={handleKillPatient}
    />
  )
}

function DoctorsPage() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate('/')
  }

  return <DoctorsView onBack={handleBack} />
}

function OrganizationsPage() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate('/')
  }

  return <OrganizationsView onBack={handleBack} />
}

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/patients/:id" element={<PatientDetailPage />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/organizations" element={<OrganizationsPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
