import { useState, useEffect, useMemo, useCallback } from 'react'
import './App.css'

const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Product & Design',
  'Marketing',
  'Finance',
  'Sales',
  'Operations'
]

const INITIAL_FORM_STATE = {
  name: '',
  email: '',
  role: '',
  department: 'Engineering',
  salary: '',
  status: 'Active'
}

function App() {
  // Theme State (Dark / Light) with persistence
  const getInitialTheme = () => {
    try {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme
      }
    } catch {
      // In case localStorage is disabled or restricted
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // ignore storage write errors
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'))
  }

  // Backend Health Status State
  const [healthStatus, setHealthStatus] = useState({ loading: true, data: null, error: null })

  // Employees CRUD State
  const [employees, setEmployees] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [formData, setFormData] = useState(INITIAL_FORM_STATE)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  // Delete Confirmation State
  const [deletingEmployee, setDeletingEmployee] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Global Alert / Toast State
  const [alert, setAlert] = useState(null)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002'

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type })
    setTimeout(() => {
      setAlert((prev) => (prev && prev.message === message ? null : prev))
    }, 4500)
  }

  // 1. Check Backend Health
  const checkHealth = useCallback(async (isInitial = false) => {
    if (!isInitial) {
      setHealthStatus({ loading: true, data: null, error: null })
    }
    try {
      const res = await fetch(`${apiUrl}/api/health`)
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setHealthStatus({ loading: false, data, error: null })
    } catch (err) {
      setHealthStatus({
        loading: false,
        data: null,
        error: err.message || 'Failed to connect to backend server'
      })
    }
  }, [apiUrl])

  // 2. Fetch Employee List
  const fetchEmployees = useCallback(async (isInitial = false) => {
    if (!isInitial) {
      setLoadingEmployees(true)
    }
    try {
      const res = await fetch(`${apiUrl}/api/employees`)
      const result = await res.json()
      if (res.ok && result.success) {
        setEmployees(result.data || [])
      } else {
        throw new Error(result.message || 'Failed to fetch employee records')
      }
    } catch (err) {
      showAlert(err.message || 'Error loading employee records from server', 'error')
    } finally {
      setLoadingEmployees(false)
    }
  }, [apiUrl])

  // Initial Load with cleanup to avoid cascading renders
  useEffect(() => {
    let ignore = false

    async function loadInitialData() {
      try {
        const healthRes = await fetch(`${apiUrl}/api/health`)
        if (healthRes.ok) {
          const data = await healthRes.json()
          if (!ignore) setHealthStatus({ loading: false, data, error: null })
        } else {
          throw new Error(`HTTP ${healthRes.status}`)
        }
      } catch (err) {
        if (!ignore) {
          setHealthStatus({
            loading: false,
            data: null,
            error: err.message || 'Failed to connect to backend server'
          })
        }
      }

      try {
        const empRes = await fetch(`${apiUrl}/api/employees`)
        const result = await empRes.json()
        if (empRes.ok && result.success) {
          if (!ignore) setEmployees(result.data || [])
        }
      } catch {
        // Handled gracefully
      } finally {
        if (!ignore) setLoadingEmployees(false)
      }
    }

    loadInitialData()

    return () => {
      ignore = true
    }
  }, [apiUrl])

  // Modal Open Handlers
  const openCreateModal = () => {
    setEditingEmployee(null)
    setFormData(INITIAL_FORM_STATE)
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (emp) => {
    setEditingEmployee(emp)
    setFormData({
      name: emp.name || '',
      email: emp.email || '',
      role: emp.role || '',
      department: emp.department || 'Engineering',
      salary: emp.salary !== undefined ? emp.salary : '',
      status: emp.status || 'Active'
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const closeModal = useCallback(() => {
    if (!formSubmitting) {
      setIsModalOpen(false)
      setEditingEmployee(null)
      setFormError(null)
    }
  }, [formSubmitting])

  // Handle ESC key to close open modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (isModalOpen && !formSubmitting) {
          closeModal()
        }
        if (deletingEmployee && !isDeleting) {
          setDeletingEmployee(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isModalOpen, formSubmitting, deletingEmployee, isDeleting, closeModal])

  // Form Input Change Handler
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Form Submit (Create or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)

    // Basic client-side validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.role.trim()) {
      setFormError('Please fill in Name, Email, and Job Title')
      return
    }

    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(formData.email.trim())) {
      setFormError('Please enter a valid email address')
      return
    }

    if (formData.salary === '' || Number(formData.salary) < 0) {
      setFormError('Please provide a valid non-negative salary')
      return
    }

    setFormSubmitting(true)
    try {
      const isEdit = Boolean(editingEmployee)
      const endpoint = isEdit
        ? `${apiUrl}/api/employees/${editingEmployee._id}`
        : `${apiUrl}/api/employees`
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salary: Number(formData.salary)
        })
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Operation failed')
      }

      showAlert(
        isEdit
          ? `Employee "${result.data.name}" updated successfully`
          : `Employee "${result.data.name}" added successfully`,
        'success'
      )
      setIsModalOpen(false)
      fetchEmployees()
    } catch (err) {
      setFormError(err.message || 'An error occurred while saving')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deletingEmployee) return

    setIsDeleting(true)
    try {
      const res = await fetch(`${apiUrl}/api/employees/${deletingEmployee._id}`, {
        method: 'DELETE'
      })
      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete employee')
      }

      showAlert(`Employee "${deletingEmployee.name}" deleted successfully`, 'success')
      setDeletingEmployee(null)
      fetchEmployees()
    } catch (err) {
      showAlert(err.message || 'Could not delete employee record', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  // Client-side filtering & search
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDept =
        filterDepartment === 'All' || emp.department === filterDepartment

      const matchesStatus = filterStatus === 'All' || emp.status === filterStatus

      return matchesSearch && matchesDept && matchesStatus
    })
  }, [employees, searchTerm, filterDepartment, filterStatus])

  // Summary Metrics
  const stats = useMemo(() => {
    const total = employees.length
    const active = employees.filter((e) => e.status === 'Active').length
    const depts = new Set(employees.map((e) => e.department)).size
    const payroll = employees.reduce((acc, curr) => acc + (Number(curr.salary) || 0), 0)
    return { total, active, depts, payroll }
  }, [employees])

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val)
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <div className="app-container" id="app-root">
      {/* Navigation Bar */}
      <header className="navbar" id="main-header">
        <div className="brand" id="brand-logo">
          <div className="logo-icon">EMS</div>
          <span className="brand-title">Employee Management System</span>
        </div>
        <div className="nav-actions">
          <button
            id="theme-toggle-btn"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <>
                <span className="theme-icon" aria-hidden="true">&#9728;&#65039;</span>
                <span className="theme-label">Light Mode</span>
              </>
            ) : (
              <>
                <span className="theme-icon" aria-hidden="true">&#127769;</span>
                <span className="theme-label">Dark Mode</span>
              </>
            )}
          </button>
          <div className="badge-tag" id="project-tag">
            College Assignment 4 &bull; Project ID 3
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content" id="main-content">
        {/* Hero Section */}
        <section className="hero-section" id="hero-section">
          <div className="pill-badge">System Initialized &bull; MERN Stack Active</div>
          <h1 className="hero-title" id="page-heading">
            Employee Management System
          </h1>
          <p className="hero-subtitle">
            Modern, secure, and intuitive workforce management portal powered by Express, MongoDB Atlas, and React.
          </p>

          {/* Backend Status Card */}
          <div className="status-card" id="backend-status-card">
            <div className="status-header">
              <div className="status-indicator-wrapper">
                <span
                  className={`status-dot ${
                    healthStatus.loading
                      ? 'status-loading'
                      : healthStatus.data
                      ? 'status-online'
                      : 'status-offline'
                  }`}
                  id="status-indicator-dot"
                ></span>
                <span className="status-label">
                  Backend API Health (<code>/api/health</code>):
                </span>
              </div>
              <button
                id="btn-recheck-health"
                className="recheck-btn"
                onClick={checkHealth}
                disabled={healthStatus.loading}
              >
                {healthStatus.loading ? 'Checking...' : 'Check Health'}
              </button>
            </div>

            <div className="status-body" id="status-body">
              {healthStatus.loading && (
                <p className="status-text muted">Querying backend health endpoint...</p>
              )}
              {healthStatus.data && (
                <div className="status-success" id="health-success-box">
                  <p className="status-text success">
                    <strong>Online:</strong> {healthStatus.data.message} &bull;{' '}
                    <strong>Database:</strong> {healthStatus.data.database}
                  </p>
                  <small className="timestamp">
                    Timestamp: {healthStatus.data.timestamp}
                  </small>
                </div>
              )}
              {healthStatus.error && (
                <div className="status-info" id="health-info-box">
                  <p className="status-text notice">
                    Backend not running or unreachable on port 5002.
                  </p>
                  <small className="hint">
                    Start backend with <code>npm run dev</code> inside <code>/backend</code>
                  </small>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Global Alert Notification */}
        {alert && (
          <div className={`alert-banner alert-${alert.type}`} id="global-alert-banner">
            <span>{alert.message}</span>
            <button
              className="alert-close"
              onClick={() => setAlert(null)}
              aria-label="Dismiss alert"
            >
              &times;
            </button>
          </div>
        )}

        {/* Employee Management Section */}
        <section className="employee-section" id="employee-management-section">
          {/* Section Header */}
          <div className="section-header">
            <div>
              <h2 className="section-title">Workforce Directory</h2>
              <p className="section-subtitle">
                Manage, track, and administer organization employee records in MongoDB Atlas
              </p>
            </div>
            <button
              id="btn-add-employee"
              className="btn-primary"
              onClick={openCreateModal}
            >
              <span>+</span> Add New Employee
            </button>
          </div>

          {/* Stats Bar */}
          <div className="stats-grid" id="stats-summary-grid">
            <div className="stat-card" id="stat-total-employees">
              <div className="stat-icon">&#128101;</div>
              <div className="stat-info">
                <span className="stat-label">Total Employees</span>
                <span className="stat-value">{stats.total}</span>
              </div>
            </div>

            <div className="stat-card" id="stat-active-employees">
              <div className="stat-icon">&#9989;</div>
              <div className="stat-info">
                <span className="stat-label">Active Staff</span>
                <span className="stat-value">{stats.active}</span>
              </div>
            </div>

            <div className="stat-card" id="stat-total-departments">
              <div className="stat-icon">&#127970;</div>
              <div className="stat-info">
                <span className="stat-label">Departments</span>
                <span className="stat-value">{stats.depts}</span>
              </div>
            </div>

            <div className="stat-card" id="stat-total-payroll">
              <div className="stat-icon">&#128178;</div>
              <div className="stat-info">
                <span className="stat-label">Annual Payroll</span>
                <span className="stat-value">{formatCurrency(stats.payroll)}</span>
              </div>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="toolbar" id="employee-toolbar">
            <div className="toolbar-left">
              <div className="search-input-wrapper">
                <input
                  id="input-search-employees"
                  type="text"
                  className="search-input"
                  placeholder="Search by name, email, role, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                id="select-filter-department"
                className="filter-select"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="All">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <select
                id="select-filter-status"
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

            <button
              id="btn-refresh-employees"
              className="btn-secondary"
              onClick={fetchEmployees}
              disabled={loadingEmployees}
            >
              {loadingEmployees ? 'Refreshing...' : 'Refresh List'}
            </button>
          </div>

          {/* Employee Records Table */}
          <div className="table-wrapper" id="employee-table-wrapper">
            {loadingEmployees ? (
              <div className="table-loading" id="employees-loading-spinner">
                <div className="spinner"></div>
                <p>Loading employee records from MongoDB Atlas...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="table-empty" id="employees-empty-state">
                <div className="empty-icon">&#128196;</div>
                <h3 className="empty-title">No employee records found</h3>
                <p className="empty-text">
                  {employees.length === 0
                    ? 'Your database is ready. Add your first employee to get started!'
                    : 'No records match your active search or filter criteria.'}
                </p>
                {employees.length === 0 && (
                  <button className="btn-primary" onClick={openCreateModal}>
                    Add First Employee
                  </button>
                )}
              </div>
            ) : (
              <table className="employee-table" id="table-employees">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role & Department</th>
                    <th>Salary</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr key={emp._id} id={`employee-row-${emp._id}`}>
                      <td>
                        <div className="emp-profile">
                          <div className="emp-avatar">{getInitials(emp.name)}</div>
                          <div>
                            <div className="emp-name">{emp.name}</div>
                            <div className="emp-email">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-h)' }}>{emp.role}</div>
                        <span className="department-badge">{emp.department}</span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-h)' }}>
                          {formatCurrency(emp.salary)}
                        </strong>
                      </td>
                      <td>
                        <span
                          className={`status-pill status-pill-${emp.status.toLowerCase().replace(' ', '-')}`}
                        >
                          &bull; {emp.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            id={`btn-edit-${emp._id}`}
                            className="btn-action btn-edit"
                            onClick={() => openEditModal(emp)}
                          >
                            Edit
                          </button>
                          <button
                            id={`btn-delete-${emp._id}`}
                            className="btn-action btn-delete"
                            onClick={() => setDeletingEmployee(emp)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Feature Cards Grid (Project Setup Overview) */}
        <section className="grid-section" id="overview-grid">
          <div className="card" id="card-frontend">
            <div className="card-icon">&#9881;</div>
            <h3 className="card-title">Frontend Architecture</h3>
            <p className="card-desc">
              React + Vite with JavaScript, clean reactive state management, modal dialogs, and instant search/filtering.
            </p>
            <span className="card-status status-ready">Active</span>
          </div>

          <div className="card" id="card-backend">
            <div className="card-icon">&#128421;</div>
            <h3 className="card-title">Backend API & Database</h3>
            <p className="card-desc">
              Express running on port 5002 with Mongoose models, full RESTful CRUD routes, and MongoDB Atlas persistence.
            </p>
            <span className="card-status status-ready">Connected</span>
          </div>

          <div className="card" id="card-environment">
            <div className="card-icon">&#128274;</div>
            <h3 className="card-title">Environment & Security</h3>
            <p className="card-desc">
              Sensitive MongoDB connection strings protected exclusively in <code>backend/.env</code> and excluded from Git.
            </p>
            <span className="card-status status-ready">Secured</span>
          </div>
        </section>
      </main>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" id="employee-modal">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title" id="modal-title">
                {editingEmployee ? 'Edit Employee Record' : 'Add New Employee'}
              </h3>
              <button
                className="modal-close"
                onClick={closeModal}
                disabled={formSubmitting}
                aria-label="Close dialog"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert-banner alert-error" style={{ marginBottom: '1rem' }}>
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group form-group-full">
                    <label className="form-label" htmlFor="input-name">Full Name *</label>
                    <input
                      id="input-name"
                      name="name"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Alex Morgan"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label" htmlFor="input-email">Email Address *</label>
                    <input
                      id="input-email"
                      name="email"
                      type="email"
                      className="form-input"
                      placeholder="e.g. alex.morgan@company.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="input-role">Job Title / Role *</label>
                    <input
                      id="input-role"
                      name="role"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Software Engineer"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="select-department">Department *</label>
                    <select
                      id="select-department"
                      name="department"
                      className="form-select"
                      value={formData.department}
                      onChange={handleInputChange}
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="input-salary">Annual Salary ($) *</label>
                    <input
                      id="input-salary"
                      name="salary"
                      type="number"
                      min="0"
                      className="form-input"
                      placeholder="e.g. 85000"
                      value={formData.salary}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="select-status">Status</label>
                    <select
                      id="select-status"
                      name="status"
                      className="form-select"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-employee-form"
                  type="submit"
                  className="btn-primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting
                    ? 'Saving...'
                    : editingEmployee
                    ? 'Update Employee'
                    : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEmployee && (
        <div className="modal-overlay" role="dialog" aria-modal="true" id="delete-modal">
          <div className="modal-dialog" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Deletion</h3>
              <button
                className="modal-close"
                onClick={() => setDeletingEmployee(null)}
                disabled={isDeleting}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <p style={{ margin: 0, color: 'var(--text-h)' }}>
                Are you sure you want to delete employee <strong>{deletingEmployee.name}</strong> ({deletingEmployee.role})?
              </p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text)' }}>
                This record will be permanently removed from MongoDB Atlas.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeletingEmployee(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete"
                type="button"
                className="btn-danger"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer" id="main-footer">
        <p>Assignment 4: Employee Management System &bull; Project ID 3 &bull; MERN Architecture</p>
      </footer>
    </div>
  )
}

export default App
