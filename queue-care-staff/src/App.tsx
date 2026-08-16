import { useState, useEffect, useRef } from 'react';
import {
  Building2,
  User2,
  Calendar,
  Clock,
  Users,
  Play,
  CheckCircle,
  MapPin,
  LogOut,
  Camera,
  Settings,
  AlertCircle,
  Activity,
  QrCode
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface Hospital {
  id: string;
  name: string;
  address: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  department: string;
}

interface Appointment {
  appointment_id: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  queue_position: number;
  estimated_wait: number;
  status: string;
  appointment_time: string;
  department: string;
  reason: string;
  consultation_started_at?: string;
  checked_in_at?: string;
  doctor_id?: string;
  hospital_id?: string;
}

interface Summary {
  total: number;
  waiting: number;
  arrived: number;
  in_consultation: number;
  completed: number;
}

interface DoctorQueueData {
  doctor_id: string;
  doctor_name: string;
  specialization: string;
  summary: Summary;
  appointments: Appointment[];
}

const extractApiError = (error: any): string => {
  if (!error) return 'An unknown error occurred';
  if (typeof error === 'string') return error;
  if (error.message && typeof error.message === 'string') return error.message;
  if (error.error && typeof error.error === 'string') return error.error;
  if (error.error && error.error.message && typeof error.error.message === 'string') return error.error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return 'An error occurred';
  }
};

export default function App() {
  // Config
  const [apiUrl, setApiUrl] = useState(() => {
    return localStorage.getItem('qc_staff_api_url') || 'https://g9ikkt-ip-171-79-61-126.tunnelmole.net';
  });
  const [showConfig, setShowConfig] = useState(false);

  // Auth State
  const [token, setToken] = useState(() => localStorage.getItem('qc_staff_token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Selection state
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');

  // Queue state
  const [currentConsultation, setCurrentConsultation] = useState<Appointment | null>(null);
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [doctorsQueue, setDoctorsQueue] = useState<DoctorQueueData[]>([]);
  const [doctorFilters, setDoctorFilters] = useState<Record<string, string>>({});
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [queueError, setQueueError] = useState('');

  // Scan state
  const [activeScanner, setActiveScanner] = useState<'NONE' | 'ARRIVAL' | 'CONSULTATION'>('NONE');
  const [manualToken, setManualToken] = useState('');
  const [scanResult, setScanResult] = useState<{ message: string; success: boolean } | null>(null);
  const [scanLoading, setScanLoading] = useState(false);

  // Live Timer for active consultation
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Save API URL
  const handleSaveApiUrl = (url: string) => {
    const formattedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    setApiUrl(formattedUrl);
    localStorage.setItem('qc_staff_api_url', formattedUrl);
    setShowConfig(false);
  };

  // Auth Submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      if (data.user.role !== 'staff') {
        throw new Error('Forbidden: You are not authorized as staff');
      }

      setToken(data.access_token);
      localStorage.setItem('qc_staff_token', data.access_token);
    } catch (err: any) {
      setAuthError(err.message || 'Network error connecting to backend');
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('qc_staff_token');
    setSelectedHospital('');
    setSelectedDoctor('');
    setQueue([]);
    setCurrentConsultation(null);
  };

  // Fetch Hospitals
  useEffect(() => {
    if (!token) return;
    fetch(`${apiUrl}/api/v1/hospital`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHospitals(data);
          if (data.length > 0) setSelectedHospital(data[0].id);
        }
      })
      .catch(err => console.error('Error fetching hospitals:', err));
  }, [token, apiUrl]);

  // Fetch Doctors when Hospital changes
  useEffect(() => {
    if (!token || !selectedHospital) return;
    setDoctors([]);
    setSelectedDoctor('');
    fetch(`${apiUrl}/api/v1/hospital/${selectedHospital}/doctors`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDoctors(data);
          if (data.length > 0) setSelectedDoctor(data[0].id);
        }
      })
      .catch(err => console.error('Error fetching doctors:', err));
  }, [token, selectedHospital, apiUrl]);

  const loadData = async (forcedDoctorId?: string, forcedHospitalId?: string) => {
    const activeDoc = forcedDoctorId || selectedDoctor;
    const activeHosp = forcedHospitalId || selectedHospital;

    if (!token || !activeHosp) return;
    setQueueError('');
    try {
      // Fetch Today's Hospital Queue (grouped by doctor)
      const qRes = await fetch(`${apiUrl}/api/v1/staff/queue/today?hospital_id=${activeHosp}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const qData = await qRes.json();
      if (!qRes.ok) {
        throw new Error(qData.message || qData.error || "Failed to load today's queue");
      }
      if (Array.isArray(qData.doctors)) {
        setDoctorsQueue(qData.doctors);
      }

      // Fetch Current Consultation for selected doctor on the left
      if (activeDoc) {
        const cRes = await fetch(`${apiUrl}/api/v1/staff/current-consultation?doctor_id=${activeDoc}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (cRes.ok) {
          const cData = await cRes.json();
          setCurrentConsultation(cData || null);
        } else {
          setCurrentConsultation(null);
        }
      } else {
        setCurrentConsultation(null);
      }
    } catch (err: any) {
      console.error('Error polling queue info:', err);
      setQueueError(extractApiError(err));
    }
  };

  // Main Polling Loop for Queue Data
  useEffect(() => {
    if (!token || !selectedHospital) return;

    loadData();
    setIsDataLoading(false);
    const interval = setInterval(() => loadData(), 5000); // Poll every 5s for snappy dashboards

    return () => clearInterval(interval);
  }, [token, selectedHospital, selectedDoctor, apiUrl]);

  // Live Timer for active consultation
  useEffect(() => {
    if (!currentConsultation || !currentConsultation.consultation_started_at) {
      setElapsedSeconds(0);
      return;
    }

    const start = new Date(currentConsultation.consultation_started_at).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((now - start) / 1000));
      setElapsedSeconds(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentConsultation]);

  // Manual Status Transition Click
  const handleTransition = async (id: string, status: string) => {
    setIsDataLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/staff/appointments/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to update status');
      }
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDataLoading(false);
    }
  };

  // Submit scan input (QR or Manual Input)
  const executeScan = async (scannedData: string, mode: 'ARRIVAL' | 'CONSULTATION') => {
    if (!scannedData.trim()) return;
    setScanLoading(true);
    setScanResult(null);

    let id = scannedData.trim();
    if (id.startsWith('QUEUECARE:APPOINTMENT:')) {
      id = id.replace('QUEUECARE:APPOINTMENT:', '');
    }

    try {
      const endpoint = mode === 'ARRIVAL'
        ? `${apiUrl}/api/v1/staff/appointments/${id}/check-in`
        : `${apiUrl}/api/v1/staff/appointments/${id}/consultation-scan`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Request rejected');
      }

      let nextDoc = selectedDoctor;
      let nextHosp = selectedHospital;

      if (mode === 'ARRIVAL') {
        const apt = data.appointment || {};
        setScanResult({
          message: `Arrival Confirmed for Token #${apt.queue_position} (${apt.patient_name || 'N/A'})! Status set to Checked In.`,
          success: true
        });
        if (apt.doctor_id) {
          setSelectedDoctor(apt.doctor_id);
          nextDoc = apt.doctor_id;
        }
        if (apt.hospital_id) {
          setSelectedHospital(apt.hospital_id);
          nextHosp = apt.hospital_id;
        }
      } else {
        const current = data.current_consultation || {};
        const prev = data.previous_consultation;
        let msg = `Consultation started for Token #${current.queue_position} (${current.patient_name})!`;
        if (prev) {
          msg += ` Previous Token #${prev.queue_position} set to Completed.`;
        }
        setScanResult({ message: msg, success: true });
        if (current.doctor_id) {
          setSelectedDoctor(current.doctor_id);
          nextDoc = current.doctor_id;
        }
        if (current.hospital_id) {
          setSelectedHospital(current.hospital_id);
          nextHosp = current.hospital_id;
        }
      }
      setManualToken('');
      if (scannerRef.current) {
        stopScanner();
      }
      await loadData(nextDoc, nextHosp);
    } catch (err: any) {
      setScanResult({
        message: err.message || 'Operation failed',
        success: false
      });
    } finally {
      setScanLoading(false);
    }
  };

  // Initialize and Stop html5-qrcode camera scanner
  const startScanner = (mode: 'ARRIVAL' | 'CONSULTATION') => {
    setScanResult(null);
    setActiveScanner(mode);

    // Defer initialization to let the div mount in DOM
    setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          "webcam-scanner-view",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText) => {
            scanner.clear();
            executeScan(decodedText, mode);
          },
          (error) => {
            // Silence common scanning frame misses
          }
        );
        scannerRef.current = scanner;
      } catch (err) {
        console.error("Failed to start html5-qrcode scanner:", err);
      }
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (e) { }
      scannerRef.current = null;
    }
    setActiveScanner('NONE');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs}s`;
  };

  // Pre-Login UI
  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-badge">QC</div>
            <h1>Queue Care Staff</h1>
            <p>Hospital & Clinic Queue Management System</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Staff Email</label>
              <input
                type="email"
                placeholder="staff@queuecare.local"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {authError && (
              <div className="error-banner">
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-submit"
              disabled={authLoading}
            >
              {authLoading ? 'Signing In...' : 'Access Staff Portal'}
            </button>
          </form>

          <div className="config-trigger" onClick={() => setShowConfig(!showConfig)}>
            <Settings size={14} />
            <span>Configure Backend URL</span>
          </div>

          {showConfig && (
            <div className="config-box">
              <input
                type="text"
                defaultValue={apiUrl}
                id="api-url-input"
                placeholder="https://your-localtunnel.loca.lt"
              />
              <button
                onClick={() => {
                  const input = document.getElementById('api-url-input') as HTMLInputElement;
                  if (input) handleSaveApiUrl(input.value);
                }}
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active Dashboard UI
  return (
    <div className="dashboard-layout">
      {/* Sidebar / Left Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Activity size={24} className="teal-text" />
          <h2>Queue Care Portal</h2>
        </div>

        <div className="setup-panel">
          <h3>Active Clinic</h3>

          <div className="select-container">
            <Building2 size={16} />
            <select
              value={selectedHospital}
              onChange={e => setSelectedHospital(e.target.value)}
            >
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <h3>Active Doctor</h3>
          <div className="select-container">
            <User2 size={16} />
            <select
              value={selectedDoctor}
              onChange={e => setSelectedDoctor(e.target.value)}
            >
              <option value="">Select Doctor</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.department})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="staff-info">
            <div className="staff-avatar">S</div>
            <div>
              <p className="staff-name">Hospital Staff</p>
              <p className="staff-role">{email}</p>
            </div>
          </div>

          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="main-header">
          <div>
            <h1>Dashboard Control Room</h1>
            <p>Real-time patient monitoring and state overrides</p>
          </div>

          <div className="header-actions">
            <div className="api-badge" onClick={() => setShowConfig(!showConfig)}>
              <Settings size={14} />
              <span>API: {apiUrl.slice(0, 30)}...</span>
            </div>

            {showConfig && (
              <div className="config-box-floating">
                <input
                  type="text"
                  defaultValue={apiUrl}
                  id="api-url-input-float"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('api-url-input-float') as HTMLInputElement;
                    if (input) handleSaveApiUrl(input.value);
                  }}
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Grid Panels */}
        <div className="dashboard-grid">

          {/* Left Side: QR Scanning & Active Consultation */}
          <div className="grid-left">

            {/* Active Scanner Panel */}
            <div className="glass-card scanner-panel">
              <div className="card-header">
                <h2>QR Scan Intake Rooms</h2>
                <div className="pulse-indicator"></div>
              </div>

              {activeScanner === 'NONE' ? (
                <div className="scanner-buttons">
                  <button
                    className="scan-trigger-btn btn-arrival"
                    onClick={() => startScanner('ARRIVAL')}
                  >
                    <QrCode size={18} />
                    <span>Open Arrival Scanner</span>
                  </button>

                  <button
                    className="scan-trigger-btn btn-consultation"
                    onClick={() => startScanner('CONSULTATION')}
                    disabled={!!currentConsultation}
                  >
                    <Play size={18} />
                    <span>Open Consultation Scanner</span>
                  </button>
                </div>
              ) : (
                <div className="active-scanner-view">
                  <div className="scanner-view-header">
                    <span>
                      {activeScanner === 'ARRIVAL' ? 'Arrival Scanner Active' : 'Consultation Scanner Active'}
                    </span>
                    <button className="btn-stop-scan" onClick={stopScanner}>Cancel</button>
                  </div>
                  <div id="webcam-scanner-view" className="webcam-box"></div>
                </div>
              )}

              {/* Simulation Box */}
              <div className="simulator-box">
                <h4>Emulator QR Scan Simulator</h4>
                <div className="sim-form">
                  <input
                    type="text"
                    placeholder="Enter raw UUID token"
                    value={manualToken}
                    onChange={e => setManualToken(e.target.value)}
                  />
                  <div className="sim-buttons">
                    <button
                      onClick={() => executeScan(manualToken, 'ARRIVAL')}
                      disabled={scanLoading}
                    >
                      Arrival Check-In
                    </button>
                    <button
                      onClick={() => executeScan(manualToken, 'CONSULTATION')}
                      disabled={scanLoading || !!currentConsultation}
                    >
                      Start Consult
                    </button>
                  </div>
                </div>
              </div>

              {scanResult && (
                <div className={`scan-result-banner ${scanResult.success ? 'success' : 'error'}`}>
                  {scanResult.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  <span>{scanResult.message}</span>
                </div>
              )}
            </div>

            {/* Active Consultation Panel */}
            <div className="glass-card active-consultation">
              <h2>Current Doctor Consultation</h2>

              {currentConsultation ? (
                <div className="active-patient-details">
                  <div className="patient-hero">
                    <span className="token-hero">Token #{currentConsultation.queue_position}</span>
                    <h3>{currentConsultation.patient_name}</h3>
                    <p className="patient-meta">{currentConsultation.patient_age} yrs • {currentConsultation.patient_gender}</p>
                  </div>

                  <div className="stats-row">
                    <div className="stat-box">
                      <Clock size={16} />
                      <div>
                        <span className="stat-label">Elapsed Time</span>
                        <span className="stat-val">{formatDuration(elapsedSeconds)}</span>
                      </div>
                    </div>

                    <div className="stat-box">
                      <Calendar size={16} />
                      <div>
                        <span className="stat-label">Booked Slot</span>
                        <span className="stat-val">{currentConsultation.appointment_time}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn-complete-consultation"
                    onClick={() => handleTransition(currentConsultation.appointment_id, 'Completed')}
                    disabled={isDataLoading}
                  >
                    <CheckCircle size={18} />
                    <span>End Consultation</span>
                  </button>
                </div>
              ) : (
                <div className="no-active-consultation">
                  <Clock size={32} />
                  <p>No active patient consultation currently in progress for this doctor.</p>
                  <p className="subtext">Scan a Checked-In patient to start their checkup.</p>
                </div>
              )}
            </div>

          </div>

          {/* Right Side: Active Queue list */}
          <div className="grid-right">
            <div className="glass-card queue-card">
              <div className="card-header">
                <h2>Today's Patient Queue</h2>
                <span className="badge-count">
                  <Users size={14} />
                  {doctorsQueue.reduce((acc, doc) => acc + (doc.summary?.total || 0), 0)} Total Booked
                </span>
              </div>

              {queueError && (
                <div className="error-banner">
                  <AlertCircle size={16} />
                  <span>{queueError}</span>
                </div>
              )}

              <div className="queue-card-grouped-list">
                {doctorsQueue.length > 0 ? (
                  doctorsQueue.map(doc => {
                    const currentFilter = doctorFilters[doc.doctor_id] || 'All';

                    // Filter appointments
                    const filteredAppointments = doc.appointments.filter(apt => {
                      if (currentFilter === 'All') return true;
                      if (currentFilter === 'Waiting') {
                        return apt.status === 'Booked' || apt.status === 'Confirmed' || apt.status === 'In Queue';
                      }
                      if (currentFilter === 'Arrived') {
                        return apt.status === 'Checked In';
                      }
                      if (currentFilter === 'In Consultation') {
                        return apt.status === 'Consultation Started';
                      }
                      if (currentFilter === 'Completed') {
                        return apt.status === 'Completed';
                      }
                      return true;
                    });

                    return (
                      <div key={doc.doctor_id} className="doctor-section-card">
                        <div className="doctor-section-header">
                          <div>
                            <h3>👨‍⚕️ {doc.doctor_name}</h3>
                            <p className="specialization-text">{doc.specialization || 'General Practitioner'}</p>
                          </div>
                          <div className="doctor-summary-badges">
                            <span className="summary-badge total">Total: {doc.summary.total}</span>
                            <span className="summary-badge waiting">Waiting: {doc.summary.waiting}</span>
                            <span className="summary-badge arrived">Arrived: {doc.summary.arrived}</span>
                            <span className="summary-badge consult">In Consult: {doc.summary.in_consultation}</span>
                            <span className="summary-badge completed">Completed: {doc.summary.completed}</span>
                          </div>
                        </div>

                        {/* Filter Controls for this doctor */}
                        <div className="filter-controls-row">
                          {['All', 'Waiting', 'Arrived', 'In Consultation', 'Completed'].map(filterOpt => (
                            <button
                              key={filterOpt}
                              className={`filter-btn ${currentFilter === filterOpt ? 'active' : ''}`}
                              onClick={() => {
                                setDoctorFilters(prev => ({
                                  ...prev,
                                  [doc.doctor_id]: filterOpt
                                }));
                              }}
                            >
                              {filterOpt.toUpperCase()}
                            </button>
                          ))}
                        </div>

                        {/* Patient rows list */}
                        <div className="doctor-appointments-list">
                          {doc.appointments.length === 0 ? (
                            <p className="no-patients-text">No appointments scheduled for this doctor today.</p>
                          ) : filteredAppointments.length > 0 ? (
                            filteredAppointments.map(apt => (
                              <div
                                key={apt.appointment_id}
                                className={`patient-queue-row ${apt.status === 'Consultation Started' ? 'in-consultation-row' : ''}`}
                              >
                                <div className="patient-row-left">
                                  <span className="token-num">#{apt.queue_position}</span>
                                  <div className="patient-main-info">
                                    <span className="patient-name">{apt.patient_name}</span>
                                    <span className="patient-sub">{apt.patient_age} yrs • {apt.patient_gender}</span>
                                  </div>
                                </div>

                                <div className="patient-row-right">
                                  <span className="appt-time">{apt.appointment_time}</span>
                                  <span className={`status-tag ${apt.status.toLowerCase().replace(' ', '-')}`}>
                                    {apt.status === 'Checked In' ? 'ARRIVED' : apt.status}
                                  </span>

                                  {/* Inline Action override tags */}
                                  <div className="row-actions">
                                    {(apt.status === 'Booked' || apt.status === 'Confirmed') && (
                                      <button
                                        className="btn-action-mini checkin"
                                        onClick={() => handleTransition(apt.appointment_id, 'Checked In')}
                                        disabled={isDataLoading}
                                      >
                                        Check In
                                      </button>
                                    )}
                                    {apt.status === 'Checked In' && (
                                      <button
                                        className="btn-action-mini queue"
                                        onClick={() => handleTransition(apt.appointment_id, 'In Queue')}
                                        disabled={isDataLoading}
                                      >
                                        Queue
                                      </button>
                                    )}
                                    {apt.status === 'In Queue' && (
                                      <button
                                        className="btn-action-mini start-consult"
                                        onClick={() => executeScan(apt.appointment_id, 'CONSULTATION')}
                                        disabled={isDataLoading || (!!currentConsultation && currentConsultation.doctor_id === doc.doctor_id)}
                                      >
                                        Start Consult
                                      </button>
                                    )}
                                    {apt.status === 'Consultation Started' && (
                                      <button
                                        className="btn-action-mini complete"
                                        onClick={() => handleTransition(apt.appointment_id, 'Completed')}
                                        disabled={isDataLoading}
                                      >
                                        End Consult
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="no-patients-text">No patients match this filter.</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-queue-list">
                    <Users size={48} />
                    <p>No appointments scheduled for today.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
