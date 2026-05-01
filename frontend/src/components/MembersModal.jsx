import { useState } from 'react';
import { projects as projectsApi } from '../api';

export default function MembersModal({ project, isAdmin, onClose, onUpdated }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await projectsApi.addMember(project._id, { email: email.trim(), role });
      setSuccess(`${email} has been added as ${role}`);
      setEmail('');
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await projectsApi.removeMember(project._id, userId);
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await projectsApi.updateMember(project._id, userId, { role: newRole });
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2 className="modal-title">Team Members</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Members list */}
        <div style={{ marginBottom: 24 }}>
          {(project.members || []).map((member) => {
            if (!member.user) return null;
            const isOwner = member.role === 'admin' && project.members.indexOf(member) === 0;
            return (
              <div key={member.userId} className="flex items-center gap-3" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="user-avatar" style={{ width: 36, height: 36 }}>
                  {member.user.name?.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>{member.user.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{member.user.email}</div>
                </div>
                {isAdmin && !isOwner ? (
                  <select
                    className="form-select"
                    value={member.role}
                    onChange={e => handleRoleChange(member.userId, e.target.value)}
                    style={{ width: 'auto', fontSize: '0.82rem', padding: '4px 8px' }}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className={`badge badge-${member.role}`}>{member.role}</span>
                )}
                {isAdmin && !isOwner && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemove(member.userId)}>Remove</button>
                )}
              </div>
            );
          })}
        </div>

        {/* Invite form */}
        {isAdmin && (
          <div>
            <div className="separator" />
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Invite Member
            </h3>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleInvite}>
              <div className="flex gap-2">
                <input
                  className="form-input"
                  type="email"
                  placeholder="Email address (must be registered)"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ flex: 1 }}
                />
                <select
                  className="form-select"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <span className="spinner" /> : 'Invite'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
