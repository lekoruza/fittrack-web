import React, { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Container, Card } from 'react-bootstrap';
import WorkoutForm from './WorkoutForm';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function BigCalendarView({ token, refresh, onWorkoutAdded }) {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const res = await fetch('/api/workouts', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json().catch(() => []);

        if (res.ok) {
          const colorMap = {
            running: '#42a5f5',
            gym: '#e0ea72',
            cycling: '#66bb6a',
            swimming: '#26c6da',
            hiking: '#8d6e63',
            walking: '#ffa726',
            yoga: '#ba68c8',
            pilates: '#f1948a',
            dancing: '#f06292',
            'martial arts': '#ef5350',
          };

          const formattedEvents = data
            .map((w) => {
              const rawDate = w.date?.trim();
              if (!rawDate) return null;

              const start = new Date(`${rawDate}T09:00:00`);
              const end = new Date(`${rawDate}T10:00:00`);

              return {
                id: w.id,
                title: `${w.activity} – ${w.duration} min`,
                start,
                end,
                allDay: true,
                style: {
                  backgroundColor: colorMap[w.activity?.toLowerCase()] || '#90a4ae',
                  borderRadius: '5px',
                  color: 'white',
                  border: 'none',
                },
              };
            })
            .filter((e) => e !== null);

          setEvents(formattedEvents);
        } else {
          console.error(data.error || 'Failed to fetch workouts.');
        }
      } catch (err) {
        console.error('Failed to fetch workouts:', err);
      }
    };

    fetchWorkouts();
  }, [token, refresh]);

  const handleNavigate = (date) => {
    setCurrentDate(date);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleDateClick = (slotInfo) => {
    setSelectedDate(slotInfo.start);
    setShowAddModal(true);
  };

  return (
    <Container className="my-4">
      <Card className="shadow p-4">
        <h4 className="text-center mb-4">Workout Calendar</h4>

        <Calendar
          localizer={localizer}
          events={events}
          date={currentDate}
          onNavigate={handleNavigate}
          view={currentView}
          onView={handleViewChange}
          defaultView="month"
          views={['month', 'week', 'day', 'agenda']}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleEventClick}
          onSelectSlot={handleDateClick}
          selectable
          eventPropGetter={(event) => ({ style: event.style })}
          style={{ height: '80vh', minHeight: 600 }}
        />

        {showAddModal && selectedDate && (
          <div
            className="modal fade show"
            style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
            tabIndex="-1"
          >
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Add Workout for {selectedDate.toDateString()}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAddModal(false)}
                  ></button>
                </div>

                <div className="modal-body">
                  <WorkoutForm
                    token={token}
                    onWorkoutSaved={() => {
                      setShowAddModal(false);
                      if (onWorkoutAdded) onWorkoutAdded();
                    }}
                    initialDate={format(selectedDate, 'yyyy-MM-dd')}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {showModal && selectedEvent && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Workout Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              <div className="modal-body">
                <p>
                  <strong>Activity:</strong> {selectedEvent.title}
                </p>
                <p>
                  <strong>Date:</strong> {selectedEvent.start.toDateString()}
                </p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}

export default BigCalendarView;
