import React, { useEffect, useState } from 'react';
import { Form, Button, Card, Container } from 'react-bootstrap';
import { toast } from 'react-toastify';

function WorkoutForm({
  token,
  onWorkoutSaved,
  initialDate = '',
  workoutToEdit = null,
  onCancel
}) {
  const [date, setDate] = useState(initialDate);
  const [activity, setActivity] = useState('');
  const [customActivity, setCustomActivity] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('');
  const [notes, setNotes] = useState('');
  const [distance, setDistance] = useState('');
  const [exercises, setExercises] = useState([{ name: '', sets: '', reps: '', weight: '' }]);

  const activityOptions = [
    'Running', 'Gym', 'Cycling', 'Swimming', 'Hiking', 'Walking',
    'Yoga', 'Pilates', 'Dancing', 'Martial arts', 'Other'
  ];

  
  const getFinalActivity = () => (activity === 'Other' ? customActivity.trim() : activity);

  const needsDistance = (act) => {
    const dActivities = ['running', 'swimming', 'cycling', 'hiking', 'walking'];
    return dActivities.includes((act || '').toLowerCase());
  };

  const isGym = () => getFinalActivity().toLowerCase() === 'gym';

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  useEffect(() => {
    if (!workoutToEdit) return;

    setDate(workoutToEdit.date || '');

    const inList = activityOptions.includes(workoutToEdit.activity);
    setActivity(inList ? workoutToEdit.activity : 'Other');
    setCustomActivity(inList ? '' : (workoutToEdit.activity || ''));

    setDuration(workoutToEdit.duration ?? '');
    setIntensity(workoutToEdit.intensity || '');
    setNotes(workoutToEdit.notes || '');
    setDistance(workoutToEdit.distance ?? '');

    if (workoutToEdit.gym_exercises) {
      try {
        setExercises(JSON.parse(workoutToEdit.gym_exercises));
      } catch (e) {
        setExercises([{ name: '', sets: '', reps: '', weight: '' }]);
      }
    } else {
      setExercises([{ name: '', sets: '', reps: '', weight: '' }]);
    }
  }, [workoutToEdit]);

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: '', reps: '', weight: '' }]);
  };

  const updateExercise = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const resetForm = () => {
    setDate('');
    setActivity('');
    setCustomActivity('');
    setDuration('');
    setIntensity('');
    setDistance('');
    setNotes('');
    setExercises([{ name: '', sets: '', reps: '', weight: '' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalActivity = getFinalActivity();

    if (finalActivity === '') {
      alert('Please enter a custom activity.');
      return;
    }

    const isEdit = !!workoutToEdit;
    const url = isEdit ? `/api/workouts/${workoutToEdit.id}` : '/api/workouts';

    try {
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          date,
          activity: finalActivity,
          duration: Number(duration),
          intensity,
          notes,
          distance: needsDistance(finalActivity) ? Number(distance) : null,
          gym_exercises: finalActivity.toLowerCase() === 'gym' ? JSON.stringify(exercises) : null
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        toast.success(isEdit ? 'Workout updated!' : 'Workout saved!');

        if (onWorkoutSaved) onWorkoutSaved();

        if (isEdit) {
          if (onCancel) onCancel();
        } else {
          resetForm();
        }
      } else {
        alert(data.error || 'Something went wrong.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Is the backend running?');
    }
  };

  const finalActivityForUI = getFinalActivity();

  return (
    <Container className="my-4">
      <Card className="shadow">
        <Card.Body>
          <Card.Title className="text-center mb-4">
            {workoutToEdit ? 'Edit Workout' : 'Add Workout'}
          </Card.Title>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Activity</Form.Label>
              <Form.Select
                value={activity}
                onChange={(e) => {
                  setActivity(e.target.value);
                  if (e.target.value !== 'Other') setCustomActivity('');
                }}
                required
              >
                <option value="">Select activity</option>
                {activityOptions.map((act, idx) => (
                  <option key={idx} value={act}>
                    {act}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {activity === 'Other' && (
              <Form.Group className="mb-3">
                <Form.Label>Enter custom activity</Form.Label>
                <Form.Control
                  type="text"
                  value={customActivity}
                  onChange={(e) => setCustomActivity(e.target.value)}
                  placeholder="e.g. Crossfit, Dance, etc."
                  required
                />
              </Form.Group>
            )}

            {needsDistance(finalActivityForUI) && (
              <Form.Group className="mb-3">
                <Form.Label>Distance (km)</Form.Label>
                <Form.Control
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  min="0"
                  step="0.1"
                />
              </Form.Group>
            )}

            {isGym() && (
              <div className="mb-3">
                <h5>Exercises</h5>

                {exercises.map((ex, idx) => (
                  <div key={idx} className="border rounded p-3 mb-2 bg-light">
                    <Form.Group className="mb-2">
                      <Form.Label>Exercise name</Form.Label>
                      <Form.Control
                        value={ex.name}
                        onChange={(e) => updateExercise(idx, 'name', e.target.value)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label>Weight (kg)</Form.Label>
                      <Form.Control
                        type="number"
                        value={ex.weight}
                        onChange={(e) => updateExercise(idx, 'weight', e.target.value)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label>Reps</Form.Label>
                      <Form.Control
                        type="number"
                        value={ex.reps}
                        onChange={(e) => updateExercise(idx, 'reps', e.target.value)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label>Sets</Form.Label>
                      <Form.Control
                        type="number"
                        value={ex.sets}
                        onChange={(e) => updateExercise(idx, 'sets', e.target.value)}
                      />
                    </Form.Group>
                  </div>
                ))}

                <Button variant="secondary" size="sm" type="button" onClick={addExercise}>
                  Add Exercise
                </Button>
              </div>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Duration (minutes)</Form.Label>
              <Form.Control
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Intensity</Form.Label>
              <Form.Select value={intensity} onChange={(e) => setIntensity(e.target.value)}>
                <option value="">Choose</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Form.Group>

            <div className="d-grid">
              <Button variant="primary" type="submit">
                {workoutToEdit ? 'Update Workout' : 'Save Workout'}
              </Button>

              {workoutToEdit && (
                <div className="d-grid mt-2">
                  <Button variant="outline-secondary" type="button" onClick={onCancel}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default WorkoutForm;
