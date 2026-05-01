import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { projects as projectsApi } from '../api';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    projectsApi.list().then(r => setProjects(r.data.slice(0, 5))).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          <div className="sidebar-logo-text">TaskFlow</div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main</div>
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <span className="icon">⊞</span> Dashboard
          </NavLink>
          <NavLink to="/my-tasks" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <span className="icon">✓</span> My Tasks
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <span className="icon">◫</span> All Projects
          </NavLink>

          {projects.length > 0 && (
            <>
              <div className="sidebar-section-label">Recent Projects</div>
              {projects.map(p => (
                <NavLink
                  key={p._id}
                  to={`/projects/${p._id}`}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                >
                  <span className="sidebar-project-dot" style={{ backgroundColor: p.color }} />
                  <span className="truncate">{p.name}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-full"
            onClick={handleLogout}
            style={{ marginTop: 6, justifyContent: 'flex-start', padding: '8px 10px' }}
          >
            <span>⤴</span> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
