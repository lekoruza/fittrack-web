import React, { useEffect, useState } from 'react';
import { Navbar, Button, Container, Nav } from 'react-bootstrap';
import LoginForm from './LoginForm';
import WorkoutForm from './WorkoutForm';
import WorkoutList from './WorkoutList';
import BigCalendarView from './BigCalendarView';
import StatsView from './StatsView';
import AdminView from './AdminView';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlus } from 'react-icons/fa';

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');
  const [role, setRole] = useState(() => localStorage.getItem('role') || '');
  const [refreshWorkouts, setRefreshWorkouts] = useState(false);
  const [activeView, setActiveView] = useState('calendar');

  useEffect(() => {
    if (!token) {
      setRole('');
      localStorage.removeItem('role');
      return;
    }

    const payload = decodeJwtPayload(token);
    const r = payload?.role || 'user';
    setRole(r);
    localStorage.setItem('role', r);
  }, [token]);

  const handleLogout = () => {
    setToken(null);
    setUsername('');
    setRole('');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setActiveView('calendar');
  };

  return (
    <>
      <Navbar bg="light" className="shadow-sm px-3 justify-content-between">
        <Navbar.Brand className="fw-bold">🏋️‍♀️ FitTrack</Navbar.Brand>

        {token && (
          <div>
            <span className="me-3">
              <strong>{username}</strong>
              {role && <span className="text-muted"> ({role})</span>}
            </span>
            <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        )}
      </Navbar>

      <Container className="my-3">
        {!token ? (
          <LoginForm
            onLogin={(t) => {
              setToken(t);
              setActiveView('calendar');
            }}
            onLoginUsername={(name) => setUsername(name)}
          />
        ) : (
          <>
            <Nav fill variant="tabs" activeKey={activeView} className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="calendar" onClick={() => setActiveView('calendar')}>
                  Calendar
                </Nav.Link>
              </Nav.Item>

              <Nav.Item>
                <Nav.Link eventKey="trainings" onClick={() => setActiveView('trainings')}>
                  Workouts
                </Nav.Link>
              </Nav.Item>

              <Nav.Item>
                <Nav.Link eventKey="stats" onClick={() => setActiveView('stats')}>
                  Statistics
                </Nav.Link>
              </Nav.Item>

              <Nav.Item>
                <Nav.Link eventKey="add" onClick={() => setActiveView('add')}>
                  <FaPlus style={{ marginRight: '5px' }} />
                </Nav.Link>
              </Nav.Item>

              {role === 'admin' && (
                <Nav.Item>
                  <Nav.Link eventKey="admin" onClick={() => setActiveView('admin')}>
                    Admin
                  </Nav.Link>
                </Nav.Item>
              )}
            </Nav>

            {activeView === 'calendar' && (
              <BigCalendarView
                token={token}
                refresh={refreshWorkouts}
                onWorkoutAdded={() => setRefreshWorkouts((prev) => !prev)}
              />
            )}

            {activeView === 'trainings' && (
              <WorkoutList
                token={token}
                refresh={refreshWorkouts}
                onDeleted={() => setRefreshWorkouts((prev) => !prev)}
              />
            )}

            {activeView === 'stats' && <StatsView token={token} refresh={refreshWorkouts} />}

            {activeView === 'add' && (
              <WorkoutForm
                token={token}
                onWorkoutSaved={() => setRefreshWorkouts((prev) => !prev)}
              />
            )}

            {activeView === 'admin' && role === 'admin' && <AdminView token={token} />}
          </>
        )}
      </Container>

      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} />
    </>
  );
}

export default App;
