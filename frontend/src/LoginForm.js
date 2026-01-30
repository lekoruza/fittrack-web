import React, { useState } from 'react';
import { Form, Button, Card, Container } from 'react-bootstrap';

function LoginForm({ onLogin, onLoginUsername }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = isRegistering ? '/api/register' : '/api/login';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(data.error || (isRegistering ? 'Registration failed' : 'Login failed'));
        return;
      }

      if (isRegistering) {
        alert('Registration successful! Now log in.');
        setIsRegistering(false);
        setPassword('');
        return;
      }

      alert('Login successful!');

      localStorage.setItem('token', data.token);
      localStorage.setItem('username', username);

      if (onLogin) onLogin(data.token);

      if (onLoginUsername) onLoginUsername(username);
    } catch (err) {
      console.error(err);
      alert('Network error. Is the backend running?');
    }
  };

  return (
    <Container className="d-flex justify-content-center mt-5">
      <Card style={{ width: '24rem' }} className="shadow">
        <Card.Body>
          <Card.Title className="text-center mb-4">
            {isRegistering ? 'Register' : 'Login'}
          </Card.Title>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <div className="d-grid">
              <Button variant="primary" type="submit">
                {isRegistering ? 'Register' : 'Login'}
              </Button>
            </div>

            <div className="text-center mt-3">
              <Button
                variant="link"
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
              >
                {isRegistering ? 'Switch to Login' : 'Switch to Register'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LoginForm;
