'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { tasksAPI, decryptData } from '@/lib/api';

interface Task {
    _id: string;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'done';
    createdAt: string;
}

interface Pagination {
    currentPage: number;
    totalPages: number;
    totalTasks: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

// Task Modal Component
function TaskModal({
    task,
    onClose,
    onSave,
}: {
    task?: Task | null;
    onClose: () => void;
    onSave: (data: { title: string; description: string; status: string }) => Promise<void>;
}) {
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [status, setStatus] = useState<'todo' | 'in-progress' | 'done'>(task?.status || 'todo');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { setError('Title is required'); return; }
        setSaving(true);
        setError('');
        try {
            await onSave({ title: title.trim(), description: description.trim(), status });
            onClose();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Failed to save task.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal card" onClick={(e) => e.stopPropagation()}>
                <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>
                {error && <div className="error-message" style={{ marginBottom: 16 }}>{error}</div>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="input-group">
                        <label htmlFor="task-title">Title</label>
                        <input
                            id="task-title"
                            className="input"
                            type="text"
                            placeholder="What needs to be done?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            maxLength={200}
                            autoFocus
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="task-desc">Description</label>
                        <textarea
                            id="task-desc"
                            className="input"
                            placeholder="Add some details... (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={2000}
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="task-status">Status</label>
                        <select
                            id="task-status"
                            className="input"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as 'todo' | 'in-progress' | 'done')}
                        >
                            <option value="todo">📋 To Do</option>
                            <option value="in-progress">🔄 In Progress</option>
                            <option value="done">✅ Done</option>
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <><div className="spinner" /> Saving...</> : task ? 'Update Task' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Delete Confirm Modal
function DeleteModal({ onClose, onConfirm, loading }: { onClose: () => void; onConfirm: () => void; loading: boolean }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal card" onClick={(e) => e.stopPropagation()}>
                <h2>Delete Task</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                    Are you sure you want to delete this task? This action cannot be undone.
                </p>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
                        {loading ? <><div className="spinner" /> Deleting...</> : 'Delete Task'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [taskLoading, setTaskLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [deletingTask, setDeletingTask] = useState<Task | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) router.replace('/login');
    }, [user, authLoading, router]);

    // Fetch tasks
    const fetchTasks = useCallback(async () => {
        setTaskLoading(true);
        try {
            const params: Record<string, string | number> = { page, limit: 8 };
            if (statusFilter) params.status = statusFilter;
            if (search) params.search = search;

            const res = await tasksAPI.getAll(params);
            if (res.data.success && res.data.data) {
                const decrypted = decryptData(res.data.data);
                if (decrypted) {
                    setTasks(decrypted.tasks || []);
                    setPagination(decrypted.pagination || null);
                }
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setTaskLoading(false);
        }
    }, [page, statusFilter, search]);

    useEffect(() => {
        if (user) fetchTasks();
    }, [user, fetchTasks]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Handlers
    const handleSaveTask = async (data: { title: string; description: string; status: string }) => {
        if (editingTask) {
            await tasksAPI.update(editingTask._id, data);
        } else {
            await tasksAPI.create(data);
        }
        fetchTasks();
    };

    const handleDeleteTask = async () => {
        if (!deletingTask) return;
        setDeleteLoading(true);
        try {
            await tasksAPI.delete(deletingTask._id);
            setDeletingTask(null);
            fetchTasks();
        } catch (err) {
            console.error('Error deleting task:', err);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const statusBadgeClass = (status: string) => {
        switch (status) {
            case 'todo': return 'badge badge-todo';
            case 'in-progress': return 'badge badge-in-progress';
            case 'done': return 'badge badge-done';
            default: return 'badge';
        }
    };

    const statusLabel = (status: string) => {
        switch (status) {
            case 'todo': return 'To Do';
            case 'in-progress': return 'In Progress';
            case 'done': return 'Done';
            default: return status;
        }
    };

    if (authLoading) {
        return <div className="page-loading"><div className="spinner" style={{ width: 32, height: 32 }} /></div>;
    }

    if (!user) return null;

    return (
        <>
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-brand">✦ TaskFlow</div>
                <div className="navbar-user">
                    <span>Hi, {user.name}</span>
                    <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            {/* Dashboard */}
            <main className="dashboard">
                {/* Header */}
                <div className="dashboard-header">
                    <h1>My Tasks</h1>
                    <button
                        className="btn btn-primary"
                        onClick={() => { setEditingTask(null); setShowModal(true); }}
                    >
                        + New Task
                    </button>
                </div>

                {/* Controls: Search & Filter */}
                <div className="dashboard-controls">
                    <input
                        type="text"
                        className="input"
                        placeholder="🔍 Search tasks..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <select
                        className="input"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        style={{ minWidth: 160 }}
                    >
                        <option value="">All Statuses</option>
                        <option value="todo">📋 To Do</option>
                        <option value="in-progress">🔄 In Progress</option>
                        <option value="done">✅ Done</option>
                    </select>
                </div>

                {/* Task List */}
                {taskLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                        <div className="spinner" style={{ width: 32, height: 32 }} />
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <h3>No tasks found</h3>
                        <p>
                            {search || statusFilter
                                ? 'No tasks match your current filters. Try adjusting your search or filter.'
                                : 'Get started by creating your first task!'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="task-list">
                            {tasks.map((task) => (
                                <div key={task._id} className="task-card card">
                                    <div className="task-content">
                                        <div className="task-title">{task.title}</div>
                                        {task.description && (
                                            <div className="task-description">{task.description}</div>
                                        )}
                                        <div className="task-meta">
                                            <span className={statusBadgeClass(task.status)}>
                                                {statusLabel(task.status)}
                                            </span>
                                            <span className="task-date">{formatDate(task.createdAt)}</span>
                                        </div>
                                    </div>
                                    <div className="task-actions">
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => { setEditingTask(task); setShowModal(true); }}
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => setDeletingTask(task)}
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={!pagination.hasPrevPage}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    ← Prev
                                </button>
                                <span className="pagination-info">
                                    Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalTasks} tasks)
                                </span>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={!pagination.hasNextPage}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Modals */}
            {showModal && (
                <TaskModal
                    task={editingTask}
                    onClose={() => { setShowModal(false); setEditingTask(null); }}
                    onSave={handleSaveTask}
                />
            )}
            {deletingTask && (
                <DeleteModal
                    onClose={() => setDeletingTask(null)}
                    onConfirm={handleDeleteTask}
                    loading={deleteLoading}
                />
            )}
        </>
    );
}
