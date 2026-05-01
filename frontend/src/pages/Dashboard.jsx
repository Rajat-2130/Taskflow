import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tasks as tasksApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { format, isPast, isValid } from 'date-fns';

function DueLabel({ dueDate, status }) {
  if (!dueDate || status === 'done') return null;
  const d = new Date(dueDate);
  if (!isValid(d)) return null;
  const overdue = isPast(d);
  return (
    <span className={overdue ? 'due-date-overdue' : 'due-date-ok'}>
      {overdue ? '⚠ ' : '📅 '}{format(d, 'MMM d')}
    </span>
  );
}

const STATUS_LABELS = {
  'todo': 'To Do', 'in-progress': 'In Progress', 'review': 'Review', 'done': 'Done'
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tasksApi.dashboard()
      .then(r => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening in your workspace</p>
        </div>
        <Link to="/projects" className="btn btn-primary">
          + New Project
        </Link>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 32 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(124,92,252,0.12)', color: 'var(--accent-2)' }}>◫</div>
            <div className="stat-label">Total Projects</div>
            <div className="stat-value">{stats?.totalProjects ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>◻</div>
            <div className="stat-label">My Tasks</div>
            <div className="stat-value">{stats?.myTasks ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>✓</div>
            <div className="stat-label">Completed</div>
            <div className="stat-value">{stats?.completed ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>⚠</div>
            <div className="stat-label">Overdue</div>
            <div className="stat-value" style={{ color: stats?.overdue > 0 ? 'var(--red)' : undefined }}>
              {stats?.overdue ?? 0}
            </div>
          </div>
        </div>

        <div className="grid-2">
          {/* Task status breakdown */}
          <div className="card">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 20 }}>Task Overview</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'To Do', value: (stats?.myTasks || 0) - (stats?.inProgress || 0) - (stats?.completed || 0), color: 'var(--text-3)' },
                { label: 'In Progress', value: stats?.inProgress || 0, color: 'var(--blue)' },
                { label: 'Completed', value: stats?.completed || 0, color: 'var(--green)' },
                { label: 'Overdue', value: stats?.overdue || 0, color: 'var(--red)' },
              ].map(item => {
                const total = stats?.myTasks || 1;
                const pct = Math.max(0, Math.min(100, (item.value / total) * 100));
                return (
                  <div key={item.label}>
                    <div className="flex justify-between" style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>{item.label}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: item.color }}>{item.value}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: item.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent tasks */}
          <div className="card">
            <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>Recent Tasks</h2>
              <Link to="/my-tasks" style={{ fontSize: '0.82rem', color: 'var(--accent-2)', textDecoration: 'none' }}>
                View all →
              </Link>
            </div>
            {stats?.recentTasks?.length === 0 ? (
              <div style={{ color: 'var(--text-3)', fontSize: '0.88rem', textAlign: 'center', padding: '32px 0' }}>
                No tasks yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(stats?.recentTasks || []).map(task => (
                  <div key={task._id} className="task-card">
                    <div className="task-card-title">{task.title}</div>
                    <div className="task-card-meta">
                      <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      <DueLabel dueDate={task.dueDate} status={task.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
