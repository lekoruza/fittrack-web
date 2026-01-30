import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Card, Container } from 'react-bootstrap';
import { startOfWeek, endOfWeek, parseISO, isWithinInterval, format } from 'date-fns';

function StatsView({ token, refresh }) {
  const [weekStats, setWeekStats] = useState({
    count: 0,
    totalDuration: 0,
    mostActiveDay: '',
    chartData: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/workouts', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json().catch(() => []);
        if (!res.ok) return;

        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = endOfWeek(today, { weekStartsOn: 1 });

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const countPerDay = {
          Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0
        };

        let totalDuration = 0;

        data.forEach((w) => {
          const date = parseISO(w.date);
          if (isWithinInterval(date, { start, end })) {
            const day = format(date, 'EEE');
            countPerDay[day] += 1;
            totalDuration += w.duration;
          }
        });

        const chartData = days.map((day) => ({
          day,
          count: countPerDay[day]
        }));

        const mostActive = days.reduce((a, b) =>
          countPerDay[a] > countPerDay[b] ? a : b
        );

        setWeekStats({
          count: chartData.reduce((sum, d) => sum + d.count, 0),
          totalDuration,
          mostActiveDay: mostActive,
          chartData
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    fetchStats();
  }, [token, refresh]);

  return (
    <Container className="my-4">
      <Card className="shadow p-4">
        <h4 className="text-center mb-4">Weekly Summary</h4>

        <p>
          <strong>Number of workouts:</strong> {weekStats.count}
        </p>
        <p>
          <strong>Total duration:</strong> {weekStats.totalDuration} min
        </p>
        <p>
          <strong>Most active day:</strong> {weekStats.mostActiveDay}
        </p>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weekStats.chartData}>
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} />
            <Bar dataKey="count" fill="#7c4dff" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </Container>
  );
}

export default StatsView;
