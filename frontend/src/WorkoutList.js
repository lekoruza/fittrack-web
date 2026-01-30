import React, { useEffect, useState } from 'react';
import { Form, Button, Card, Container } from 'react-bootstrap';
import WorkoutForm from './WorkoutForm';

function WorkoutList({ token, refresh, onDeleted }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState('All');
  const [sortOption, setSortOption] = useState('newest');

  const [editingWorkout, setEditingWorkout] = useState(null);

  const authHeaders = {
    Authorization: `Bearer ${token}`
  };

  const fetchWorkouts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/workouts', {
        headers: authHeaders
      });

      const data = await response.json().catch(() => []);

      if (response.ok) {
        setWorkouts(data);
      } else {
        alert(data.error || 'Failed to load workouts.');
      }
    } catch (err) {
      alert('Error fetching workouts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [token, refresh]);

  const deleteWorkout = async (id) => {
    if (!window.confirm('Are you sure you want to delete this workout?')) return;

    const response = await fetch(`/api/workouts/${id}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
      if (onDeleted) onDeleted();
    } else {
      alert(data.error || 'Failed to delete workout.');
    }
  };

  const filteredWorkouts = workouts
    .filter((workout) => {
      if (activityFilter === 'All') return true;
      return workout.activity.toLowerCase() === activityFilter.toLowerCase();
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.date) - new Date(a.date);
        case 'oldest':
          return new Date(a.date) - new Date(b.date);
        case 'duration-asc':
          return a.duration - b.duration;
        case 'duration-desc':
          return b.duration - a.duration;
        default:
          return 0;
      }
    });

  if (loading) return <p>Loading workouts...</p>;
  if (workouts.length === 0) return <p>No workouts found.</p>;

  return (
    <Container className="my-4">
      <h2 className="text-center mb-4">Your Workouts</h2>


      {editingWorkout && (
        <WorkoutForm
          token={token}
          workoutToEdit={editingWorkout}
          onWorkoutSaved={() => {
            setEditingWorkout(null);
            fetchWorkouts();
          }}
          onCancel={() => setEditingWorkout(null)}
        />
      )}

      <div className="d-flex flex-wrap justify-content-center gap-3 mb-3">
        <Form.Select
          value={activityFilter}
          onChange={(e) => setActivityFilter(e.target.value)}
          style={{ maxWidth: '200px' }}
        >
          <option value="All">All Activities</option>
          {[...new Set(workouts.map((w) => w.activity))].map((activity) => (
            <option key={activity} value={activity}>
              {activity}
            </option>
          ))}
        </Form.Select>

        <Form.Select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          style={{ maxWidth: '200px' }}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="duration-asc">Duration ↑</option>
          <option value="duration-desc">Duration ↓</option>
        </Form.Select>
      </div>

      {!loading && filteredWorkouts.length === 0 && <p>No workouts found.</p>}

      {filteredWorkouts.map((workout) => (
        <Card key={workout.id} className="mb-3 shadow">
          <Card.Body>
            <Card.Title>
              {workout.activity} – {workout.duration} min
            </Card.Title>
            <Card.Subtitle className="mb-2 text-muted">{workout.date}</Card.Subtitle>

            {workout.intensity && <p>Intensity: {workout.intensity}</p>}
            {workout.notes && <Card.Text>{workout.notes}</Card.Text>}

            {workout.distance && (
              <p>
                <strong>Distance:</strong> {workout.distance} km
              </p>
            )}

            {workout.gym_exercises && (
              <>
                <strong>Exercises:</strong>
                <ul>
                  {JSON.parse(workout.gym_exercises).map((ex, i) => (
                    <li key={i}>
                      {ex.name && <>{ex.name}</>}
                      {ex.sets && <> – {ex.sets} sets</>}
                      {ex.reps && <> × {ex.reps} reps</>}
                      {ex.weight && <> @ {ex.weight} kg</>}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setEditingWorkout(workout)}
              >
                Edit
              </Button>

              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => deleteWorkout(workout.id)}
              >
                Delete
              </Button>
            </div>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
}

export default WorkoutList;
