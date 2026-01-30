import React, { useEffect, useState } from 'react';
import { Card, Container, Table, Form, Button, Alert, Nav } from 'react-bootstrap';

function AdminView({ token }) {
  const [activeTab, setActiveTab] = useState('users');

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [workouts, setWorkouts] = useState([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);

  const [msg, setMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const authHeaders = {
    Authorization: `Bearer ${token}`
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setMsg('');
    setErrMsg('');

    try {
      const res = await fetch('/api/admin/users', { headers: authHeaders });
      const data = await res.json().catch(() => []);

      if (!res.ok) {
        setErrMsg(data.error || 'Failed to load users.');
        setUsers([]);
        return;
      }

      setUsers(data);
    } catch (err) {
      console.error(err);
      setErrMsg('Network error. Is the backend running?');
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateRole = async (userId, newRole) => {
    setMsg('');
    setErrMsg('');

    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrMsg(data.error || 'Failed to update role.');
        return;
      }

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      setMsg('Role updated successfully.');
    } catch (err) {
      console.error(err);
      setErrMsg('Network error while updating role.');
    }
  };

  const fetchAllWorkouts = async () => {
    setLoadingWorkouts(true);
    setMsg('');
    setErrMsg('');

    try {
      const res = await fetch('/api/admin/workouts', { headers: authHeaders });
      const data = await res.json().catch(() => []);

      if (!res.ok) {
        setErrMsg(data.error || 'Failed to load workouts.');
        setWorkouts([]);
        return;
      }

      setWorkouts(data);
    } catch (err) {
      console.error(err);
      setErrMsg('Network error while loading workouts.');
      setWorkouts([]);
    } finally {
      setLoadingWorkouts(false);
    }
  };

  const deleteWorkoutAsAdmin = async (id) => {
    if (!window.confirm('Delete this workout? (admin)')) return;

    setMsg('');
    setErrMsg('');

    try {
      const res = await fetch(`/api/admin/workouts/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrMsg(data.error || 'Failed to delete workout.');
        return;
      }

      setWorkouts((prev) => prev.filter((w) => w.id !== id));
      setMsg('Workout deleted (admin).');
    } catch (err) {
      console.error(err);
      setErrMsg('Network error while deleting workout.');
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'workouts') fetchAllWorkouts();
  }, [activeTab, token]);

  return (
    <Container className="my-4">
      <Card className="shadow p-4">
        <h4 className="text-center mb-3">Admin Panel</h4>

        <Nav variant="tabs" activeKey={activeTab} className="mb-3">
          <Nav.Item>
            <Nav.Link eventKey="users" onClick={() => setActiveTab('users')}>
              Users & Roles
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="workouts" onClick={() => setActiveTab('workouts')}>
              All Workouts
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {msg && <Alert variant="success">{msg}</Alert>}
        {errMsg && <Alert variant="danger">{errMsg}</Alert>}

        {activeTab === 'users' && (
          <>
            {loadingUsers ? (
              <p>Loading users...</p>
            ) : users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th>Username</th>
                    <th style={{ width: '180px' }}>Role</th>
                    <th style={{ width: '160px' }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.username}</td>
                      <td>
                        <Form.Select
                          value={u.role || 'user'}
                          onChange={(e) => {
                            const newRole = e.target.value;
                            setUsers((prev) =>
                              prev.map((x) => (x.id === u.id ? { ...x, role: newRole } : x))
                            );
                          }}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </Form.Select>
                      </td>
                      <td>
                        <Button size="sm" variant="primary" onClick={() => updateRole(u.id, u.role || 'user')}>
                          Save
                        </Button>{' '}
                        <Button size="sm" variant="outline-secondary" onClick={fetchUsers}>
                          Refresh
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </>
        )}

        {activeTab === 'workouts' && (
          <>
            {loadingWorkouts ? (
              <p>Loading workouts...</p>
            ) : workouts.length === 0 ? (
              <p>No workouts found.</p>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th style={{ width: '140px' }}>Date</th>
                    <th>User</th>
                    <th>Activity</th>
                    <th style={{ width: '120px' }}>Duration</th>
                    <th style={{ width: '140px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workouts.map((w) => (
                    <tr key={w.id}>
                      <td>{w.id}</td>
                      <td>{w.date}</td>
                      <td>{w.username} (id: {w.user_id})</td>
                      <td>{w.activity}</td>
                      <td>{w.duration} min</td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          className="mb-2"
                          style={{ width: '90px' }}
                          onClick={() => deleteWorkoutAsAdmin(w.id)}
                        >
                          Delete
                        </Button>

                        <Button
                          size="sm"
                          variant="outline-secondary"
                          style={{ width: '90px' }}
                          onClick={fetchAllWorkouts}
                        >
                          Refresh
                        </Button>

                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </>
        )}
      </Card>
    </Container>
  );
}

export default AdminView;
