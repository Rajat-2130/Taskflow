import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tasks as tasksApi } from '../api';
import { format, isPast, isValid } from 'date-fns';

const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };
const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

export default function MyTasks() {
  const [taskList, setTaskList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    tasksApi.myTasks().then(r => setTaskList(r.data)).finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (taskId, status) => {
    setTaskList(l => l.map(t => t._id === taskId ? { ...t, status } : t));
    await tasksApi.update(taskId, { status });
  };

  const now = new Date().toISOString();
  const filtered = taskList.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'active') return t.status !== 'done';
    if (filter === 'overdue') return t.status !== 'done' && t.dueDate && t.dueDate < now;
    if (filter === 'done') return t.status === 'done';
    return true;
  }).sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2));

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">{taskList.length} task{taskList.length !== 1 ? 's' : ''} assigned to you</p>
        </div>
      </div>

      <div className="page-body">
        <div className="tabs" style={{ marginBottom: 24 }}>
          {[['all', 'All'], ['active', 'Active'], ['overdue', 'Overdue'], ['done', 'Done']].map(([key, label]) => (
            <button key={key} className={`tab-btn${filter === key ? ' active' : ''}`} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✓</div>
            <div className="empty-state-title">No tasks here</div>
            <div className="empty-state-text">Tasks assigned to you will appear here</div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(task => {
                  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                  const overdue = dueDate && isValid(dueDate) && isPast(dueDate) && task.status !== 'done';
                  return (
                    <tr key={task._id}>
                      <td>
                        <span style={{ color: 'var(--text)', fontWeight: 500 }}>{task.title}</span>
                        {task.description && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>
                            {task.description.slice(0, 60)}
                          </div>
                        )}
                      </td>
                      <td>
                        {task.project ? (
                          <Link
                            to={`/projects/${task.project._id}`}
                            style={{ textDecoration: 'none' }}
                          >
                            <div className="flex items-center gap-2">
                              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: task.project.color }} />
                              <span style={{ color: 'var(--accent-2)', fontSize: '0.85rem' }}>{task.project.name}</span>
                            </div>
                          </Link>
                        ) : '—'}
                      </td>
                      <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                      <td><span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span></td>
                      <td>
                        {dueDate && isValid(dueDate) ? (
                          <span className={overdue ? 'due-date-overdue' : 'due-date-ok'}>
                            {overdue ? '⚠ ' : ''}{format(dueDate, 'MMM d, yyyy')}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={task.status}
                          onChange={e => handleStatusChange(task._id, e.target.value)}
                          style={{ fontSize: '0.78rem', padding: '4px 8px', width: 'auto' }}
                        >
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
