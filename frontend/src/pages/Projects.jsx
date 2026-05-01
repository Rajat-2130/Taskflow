import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projects as projectsApi } from '../api';
import ProjectModal from '../components/ProjectModal';

const COLORS = ['#7c5cfc','#3b82f6','#22c55e','#f59e0b','#ef4444','#ec4899','#06b6d4','#f97316'];

export default function Projects() {
  const [projectList, setProjectList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const load = () => projectsApi.list().then(r => setProjectList(r.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projectList.length} project{projectList.length !== 1 ? 's' : ''} in your workspace</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : projectList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◫</div>
            <div className="empty-state-title">No projects yet</div>
            <div className="empty-state-text" style={{ marginBottom: 24 }}>Create your first project to get started</div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
          </div>
        ) : (
          <div className="grid-3">
            {projectList.map(p => {
              const progress = p.taskCount > 0 ? Math.round((p.completedCount / p.taskCount) * 100) : 0;
              return (
                <div key={p._id} className="project-card" onClick={() => navigate(`/projects/${p._id}`)}>
                  <div>
                    <div className="project-color-bar" style={{ backgroundColor: p.color }} />
                    <div className="flex justify-between items-center" style={{ marginTop: 14 }}>
                      <h3 className="project-name">{p.name}</h3>
                      <span className={`badge badge-${p.role}`}>{p.role}</span>
                    </div>
                    {p.description && <p className="project-desc" style={{ marginTop: 6 }}>{p.description}</p>}
                  </div>

                  <div>
                    <div className="flex justify-between" style={{ marginBottom: 6, fontSize: '0.8rem', color: 'var(--text-3)' }}>
                      <span>{p.completedCount}/{p.taskCount} tasks</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="flex gap-3" style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>
                    <span>👥 {p.memberCount} member{p.memberCount !== 1 ? 's' : ''}</span>
                    {p.overdue > 0 && <span style={{ color: 'var(--red)' }}>⚠ {p.overdue} overdue</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <ProjectModal
          onClose={() => setShowModal(false)}
          onCreated={(project) => { setProjectList(l => [project, ...l]); setShowModal(false); navigate(`/projects/${project._id}`); }}
        />
      )}
    </>
  );
}
