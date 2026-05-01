import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projects as projectsApi, tasks as tasksApi } from '../api';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/TaskModal';
import MembersModal from '../components/MembersModal';
import { format, isPast, isValid, differenceInDays } from 'date-fns';

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
];

function DueLabel({ dueDate, status }) {
  if (!dueDate || status === 'done') return null;
  const d = new Date(dueDate);
  if (!isValid(d)) return null;
  const days = differenceInDays(d, new Date());
  const overdue = isPast(d);
  const soon = days >= 0 && days <= 2;
  const cls = overdue ? 'due-date-overdue' : soon ? 'due-date-soon' : 'due-date-ok';
  return <span className={cls}>{overdue ? '⚠ ' : '📅 '}{format(d, 'MMM d')}</span>;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [taskList, setTaskList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showMembers, setShowMembers] = useState(false);

  const load = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        projectsApi.get(id),
        tasksApi.byProject(id),
      ]);
      setProject(projRes.data);
      setTaskList(taskRes.data);
    } catch {
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const isAdmin = project?.role === 'admin';

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks?')) return;
    await projectsApi.delete(id);
    navigate('/projects');
  };

  const handleStatusChange = async (taskId, status) => {
    setTaskList(l => l.map(t => t._id === taskId ? { ...t, status } : t));
    await tasksApi.update(taskId, { status });
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await tasksApi.delete(taskId);
    setTaskList(l => l.filter(t => t._id !== taskId));
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = taskList.filter(t => t.status === col.key);
    return acc;
  }, {});

  const progress = taskList.length > 0
    ? Math.round((taskList.filter(t => t.status === 'done').length / taskList.length) * 100)
    : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
            <span
              onClick={() => navigate('/projects')}
              style={{ color: 'var(--text-3)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Projects
            </span>
            <span style={{ color: 'var(--text-3)' }}>/</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>{project?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: project?.color }} />
            <h1 className="page-title">{project?.name}</h1>
            <span className={`badge badge-${project?.role}`}>{project?.role}</span>
          </div>
          {project?.description && <p className="page-subtitle">{project?.description}</p>}
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowMembers(true)}>
            👥 {project?.members?.length} Members
          </button>
          {isAdmin && (
            <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>
              Delete
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => { setEditTask(null); setShowTaskModal(true); }}>
            + Task
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Progress bar */}
        <div className="card" style={{ marginBottom: 24, padding: '16px 24px' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>
              {taskList.filter(t => t.status === 'done').length} of {taskList.length} tasks completed
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-2)' }}>{progress}%</span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="tabs">
          {['board', 'list'].map(t => (
            <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t === 'board' ? '⊡ Board' : '≡ List'}
            </button>
          ))}
        </div>

        {tab === 'board' ? (
          <div className="kanban-board">
            {COLUMNS.map(col => (
              <div key={col.key} className="kanban-column">
                <div className="kanban-column-header">
                  <span className="kanban-column-title">{col.label}</span>
                  <span className="kanban-count">{tasksByStatus[col.key].length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tasksByStatus[col.key].map(task => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onEdit={() => { setEditTask(task); setShowTaskModal(true); }}
                      onDelete={() => handleDeleteTask(task._id)}
                      onStatusChange={handleStatusChange}
                      isAdmin={isAdmin}
                      currentUserId={user._id}
                      columns={COLUMNS}
                    />
                  ))}
                  {tasksByStatus[col.key].length === 0 && (
                    <div style={{ color: 'var(--text-3)', fontSize: '0.8rem', textAlign: 'center', padding: '20px 0', borderRadius: 8, border: '1px dashed var(--border)' }}>
                      Empty
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {taskList.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✓</div>
                <div className="empty-state-title">No tasks yet</div>
                <div className="empty-state-text" style={{ marginBottom: 20 }}>Add your first task to get started</div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}>+ Add Task</button>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assignee</th>
                    <th>Due Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {taskList.map(task => (
                    <tr key={task._id}>
                      <td>
                        <span
                          style={{ color: 'var(--text)', fontWeight: 500, cursor: 'pointer' }}
                          onClick={() => { setEditTask(task); setShowTaskModal(true); }}
                        >
                          {task.title}
                        </span>
                        {task.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>{task.description.slice(0, 60)}{task.description.length > 60 ? '…' : ''}</div>}
                      </td>
                      <td><span className={`badge badge-${task.status}`}>{task.status}</span></td>
                      <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                      <td>{task.assignee?.name || <span style={{ color: 'var(--text-3)' }}>Unassigned</span>}</td>
                      <td><DueLabel dueDate={task.dueDate} status={task.status} /></td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditTask(task); setShowTaskModal(true); }}>Edit</button>
                          {(isAdmin || task.createdBy === user._id) && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(task._id)}>Del</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showTaskModal && (
        <TaskModal
          project={project}
          task={editTask}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSaved={(saved) => {
            if (editTask) {
              setTaskList(l => l.map(t => t._id === saved._id ? saved : t));
            } else {
              setTaskList(l => [saved, ...l]);
            }
            setShowTaskModal(false);
            setEditTask(null);
          }}
        />
      )}

      {showMembers && (
        <MembersModal
          project={project}
          isAdmin={isAdmin}
          onClose={() => setShowMembers(false)}
          onUpdated={load}
        />
      )}
    </>
  );
}

function TaskCard({ task, onEdit, onDelete, onStatusChange, isAdmin, currentUserId, columns }) {
  const canModify = isAdmin || task.createdBy === currentUserId || task.assigneeId === currentUserId;

  return (
    <div className="task-card">
      <div className="task-card-title">{task.title}</div>
      {task.description && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 8, lineHeight: 1.4 }}>
          {task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}
        </p>
      )}
      <div className="task-card-meta">
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
        {task.assignee && <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>@{task.assignee.name.split(' ')[0]}</span>}
        <DueLabel dueDate={task.dueDate} status={task.status} />
      </div>
      {canModify && (
        <div className="flex gap-2" style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          <select
            className="form-select"
            value={task.status}
            onChange={e => onStatusChange(task._id, e.target.value)}
            style={{ fontSize: '0.75rem', padding: '3px 6px', flex: 1 }}
            onClick={e => e.stopPropagation()}
          >
            {columns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>✎</button>
          {(isAdmin) && <button className="btn btn-danger btn-sm" onClick={onDelete}>✕</button>}
        </div>
      )}
    </div>
  );
}


