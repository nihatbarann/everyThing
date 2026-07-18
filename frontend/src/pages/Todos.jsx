import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
// Lucide imports removed
import { useNavigate } from 'react-router-dom';

const Todos = () => {
  const [todos, setTodos] = useState({
    todo: [],
    in_progress: [],
    done: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Drag state
  const [draggedItem, setDraggedItem] = useState(null);

  // New/Edit task modal
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const todayStr = () => new Date().toISOString().split('T')[0];
  const [newTask, setNewTask] = useState({ title: '', description: '', created_at: todayStr(), target_date: '', status: 'todo', priority: 'medium' });

  useEffect(() => {
    fetchTodos();
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const res = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPermissions(res.data.user?.permissions || []);
    } catch (err) { /* ignore */ }
  };

  const hasPerm = (key) => permissions.includes(key);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/todos', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const allTodos = res.data.todos || [];
      
      // Sort closest date first. Null dates go to the bottom.
      allTodos.sort((a, b) => {
        if (!a.target_date && !b.target_date) return 0;
        if (!a.target_date) return 1;
        if (!b.target_date) return -1;
        return new Date(a.target_date) - new Date(b.target_date);
      });

      const grouped = { todo: [], in_progress: [], done: [] };
      allTodos.forEach(t => {
        if (grouped[t.status]) grouped[t.status].push(t);
      });
      setTodos(grouped);
      
    } catch (err) {
      setError('Failed to load tasks. ' + (err.response?.data?.error || ''));
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, item, sourceColumn) => {
    setDraggedItem({ ...item, sourceColumn });
    e.dataTransfer.effectAllowed = 'move';
    // Visual drag image styling (optional, relies on browser defaults here)
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { sourceColumn, id } = draggedItem;

    if (sourceColumn === targetColumn) {
      setDraggedItem(null);
      return; // Dropped in the same column
    }

    // Helper to sort by date
    const sortByDate = (list) => {
      return list.sort((a, b) => {
        if (!a.target_date && !b.target_date) return 0;
        if (!a.target_date) return 1;
        if (!b.target_date) return -1;
        return new Date(a.target_date) - new Date(b.target_date);
      });
    };

    // Optimistic UI update
    setTodos(prev => {
      const sourceList = [...prev[sourceColumn]];
      const targetList = [...prev[targetColumn]];
      const itemIndex = sourceList.findIndex(t => t.id === id);
      
      if (itemIndex > -1) {
        const [movedItem] = sourceList.splice(itemIndex, 1);
        movedItem.status = targetColumn;
        targetList.push(movedItem);
      }
      
      return {
        ...prev,
        [sourceColumn]: sourceList, // No need to re-sort source since we just removed one
        [targetColumn]: sortByDate(targetList) // Re-sort target list
      };
    });

    // API Call
    try {
      await axios.put(`/api/todos/${id}/status`, { status: targetColumn }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (err) {
      // Revert if API fails
      fetchTodos();
      setError('Failed to update task status.');
      setTimeout(() => setError(null), 3000);
    }
    
    setDraggedItem(null);
  };

  // Task Creation / Update
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    setSaving(true);
    try {
      if (editingTask) {
        await axios.put(`/api/todos/${editingTask.id}`, newTask, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.post('/api/todos', newTask, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      setShowModal(false);
      setEditingTask(null);
      setNewTask({ title: '', description: '', created_at: todayStr(), target_date: '', status: 'todo', priority: 'medium' });
      fetchTodos();
    } catch (err) {
      setError(`Failed to ${editingTask ? 'update' : 'create'} task.`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title || '',
      description: task.description || '',
      created_at: task.created_at ? task.created_at.split(' ')[0] : todayStr(),
      target_date: task.target_date ? task.target_date.split(' ')[0] : '', // Extract YYYY-MM-DD
      status: task.status,
      priority: task.priority || 'medium'
    });
    setShowModal(true);
  };

  const closePortal = () => {
    setShowModal(false);
    setEditingTask(null);
    setNewTask({ title: '', description: '', created_at: todayStr(), target_date: '', status: 'todo', priority: 'medium' });
  };

  // Task Archiving
  const handleArchiveTask = async (id) => {
    if(!window.confirm('Bu görevi arşivlemek istiyor musunuz?')) return;
    try {
      await axios.put(`/api/todos/${id}/archive`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchTodos();
    } catch (err) {
      setError('Görevi arşivleme hatası.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Task Deletion
  const handleDeleteTask = async (id) => {
    if(!window.confirm('Delete this task?')) return;
    try {
      await axios.delete(`/api/todos/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchTodos();
    } catch (err) {
      setError('Failed to delete task.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Utils
  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse consistently as local time to avoid timezone shift
    const [year, month, day] = dateStr.split(' ')[0].split('-');
    const target = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    target.setHours(0, 0, 0, 0);
    
    return target <= today;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in" style={{ minHeight: 'calc(100vh - 140px)' }}>
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-4xl mb-2 text-gradient">Yapılacaklar</h1>
          <p className="text-muted text-lg">Manage tasks and workflow</p>
        </div>
        
        <div className="flex-1 max-w-md px-4">
          <div className="um-search-box">
            <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--text-muted)' }}></i>
            <input
              type="text"
              placeholder="Görevlerde ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="um-search-input"
            />
          </div>
        </div>

        <div className="flex gap-2 items-end">
          <button onClick={() => navigate('/dashboard/todos/archived')} className="ev-btn ev-btn-secondary">
            <i className="fa-solid fa-box-open"></i> <span>Arşivlenenler</span>
          </button>
          <div onClick={() => setShowModal(true)} className="ev-btn ev-btn-primary" style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-plus"></i>
            <span>Yeni Görev</span>
          </div>
        </div>
      </header>

      {error && (
        <div className="um-alert-error animate-in flex-shrink-0">
          <i className="fa-solid fa-circle-exclamation w-5 h-5 flex-shrink-0"></i><span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="um-loading-page flex-1">
          <i className="fa-solid fa-spinner fa-spin w-8 h-8 text-primary"></i>
          <span>Panolar yükleniyor...</span>
        </div>
      ) : (
        <div className="flex-1 grid-container grid-cols-3" style={{ minWidth: '900px', overflowX: 'auto', minHeight: 0 }}>
          
          {/* TO DO COLUMN */}
          <div
            className="kanban-column delay-1"
            style={{ '--col-color': 'var(--primary)' }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'todo')}
          >
            <div className="kanban-column-header">
              <h2><i className="fa-solid fa-circle-dot"></i> Yapılacak</h2>
              <span className="kanban-column-count">{todos.todo.length}</span>
            </div>
            <div className="kanban-column-body">
              {todos.todo.filter(t =>
                ((t.title || '') + ' ' + (t.description || '')).toLowerCase().includes(searchQuery.toLowerCase())
              ).map(task => (
                <TaskCard
                  key={task.id} task={task} listId="todo"
                  onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                  onDelete={handleDeleteTask} onArchive={handleArchiveTask}
                  onEdit={openEditModal}
                  isOverdue={isOverdue} formatDate={formatDate}
                />
              ))}
              {todos.todo.length === 0 && <div className="kanban-column-empty">Görev yok</div>}
            </div>
          </div>

          {/* IN PROGRESS COLUMN */}
          <div
            className="kanban-column delay-2"
            style={{ '--col-color': 'var(--warning)' }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'in_progress')}
          >
            <div className="kanban-column-header">
              <h2><i className="fa-solid fa-stopwatch"></i> Yapılıyor</h2>
              <span className="kanban-column-count">{todos.in_progress.length}</span>
            </div>
            <div className="kanban-column-body">
              {todos.in_progress.filter(t =>
                ((t.title || '') + ' ' + (t.description || '')).toLowerCase().includes(searchQuery.toLowerCase())
              ).map(task => (
                <TaskCard
                  key={task.id} task={task} listId="in_progress"
                  onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                  onDelete={handleDeleteTask} onArchive={handleArchiveTask}
                  onEdit={openEditModal}
                  isOverdue={isOverdue} formatDate={formatDate}
                />
              ))}
              {todos.in_progress.length === 0 && <div className="kanban-column-empty">Görev yok</div>}
            </div>
          </div>

          {/* DONE COLUMN */}
          <div
            className="kanban-column delay-3"
            style={{ '--col-color': 'var(--success)' }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'done')}
          >
            <div className="kanban-column-header">
              <h2><i className="fa-solid fa-circle-check"></i> Yapıldı</h2>
              <span className="kanban-column-count">{todos.done.length}</span>
            </div>
            <div className="kanban-column-body">
              {todos.done.filter(t =>
                ((t.title || '') + ' ' + (t.description || '')).toLowerCase().includes(searchQuery.toLowerCase())
              ).map(task => (
                <TaskCard
                  key={task.id} task={task} listId="done"
                  onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                  onDelete={handleDeleteTask} onArchive={handleArchiveTask}
                  onEdit={openEditModal}
                  isOverdue={isOverdue} formatDate={formatDate}
                />
              ))}
              {todos.done.length === 0 && <div className="kanban-column-empty">Görev yok</div>}
            </div>
          </div>

        </div>
      )}

      {showModal && createPortal(
        <div className="um-modal-overlay" onClick={closePortal}>
          <div className="um-modal !max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4">{editingTask ? 'Görevi Düzenle' : 'Yeni Görev Ekle'}</h3>
            <form onSubmit={handleSaveTask} className="flex flex-col gap-4">
              <div className="um-field">
                <label>Başlık *</label>
                <input type="text" required autoFocus value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Görev başlığı..." />
              </div>
              <div className="um-field">
                <label>Açıklama</label>
                <textarea value={newTask.description} rows="4"
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Neler yapılacak?..." />
              </div>
              <div className="two-cols">
                <div className="um-field">
                  <label>Oluşturulma Tarihi</label>
                  <input type="date" value={newTask.created_at}
                    onChange={e => setNewTask({...newTask, created_at: e.target.value})} />
                </div>
                <div className="um-field">
                  <label>Son Yapılma Tarihi</label>
                  <input type="date" value={newTask.target_date}
                    onChange={e => setNewTask({...newTask, target_date: e.target.value})} />
                </div>
              </div>
              <div className="two-cols">
                <div className="um-field">
                  <label>Önem Derecesi</label>
                  <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                  </select>
                </div>
                <div className="um-field">
                  <label>Durum</label>
                  <select value={newTask.status} onChange={e => setNewTask({...newTask, status: e.target.value})}>
                    <option value="todo">Yapılacak</option>
                    <option value="in_progress">Yapılıyor</option>
                    <option value="done">Yapıldı</option>
                  </select>
                </div>
              </div>
              <div className="um-modal-actions">
                <button type="button" onClick={closePortal} className="ev-btn ev-btn-secondary">İptal</button>
                <button type="submit" className="ev-btn ev-btn-primary" disabled={saving}>
                  {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : (editingTask ? 'Güncelle' : 'Oluştur')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

// Extracted Card Component for clean rendering
const TaskCard = ({ task, listId, onDragStart, onDragEnd, onDelete, onArchive, onEdit, isOverdue, formatDate }) => {
  const getPriorityInfo = (p) => {
    switch(p) {
      case 'high': return { label: 'Yüksek', color: 'var(--error)' };
      case 'medium': return { label: 'Orta', color: 'var(--warning)' };
      case 'low': return { label: 'Düşük', color: 'var(--primary)' };
      default: return { label: 'Orta', color: 'var(--warning)' };
    }
  };

  const priority = getPriorityInfo(task.priority);

  let highlightClass = '';
  if (task.status === 'done') {
    highlightClass = 'card-done';
  } else if (isOverdue(task.target_date)) {
    highlightClass = 'overdue'; // still open but past its date
  } else if (task.status === 'in_progress') {
    highlightClass = 'card-in-progress';
  } else if (task.status === 'todo') {
    highlightClass = 'card-todo';
  }

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, task, listId)}
      onDragEnd={onDragEnd}
      className={`um-kanban-card group relative overflow-hidden flex flex-col gap-2 ${highlightClass}`}
    >
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-bold text-[var(--text-main)] leading-snug">{task.title || 'İsimsiz Görev'}</h4>
          <span className="priority-badge" style={{ '--badge-color': priority.color }}>
            {priority.label}
          </span>
        </div>
        {!!task.description && (
          <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap line-clamp-4">
            {task.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-1 pt-2 border-t border-[var(--glass-border)]">
        <div className="flex items-center gap-1.5 shrink-0" title={`Oluşturan: ${task.creator_fn || task.creator_username}`}>
           <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded w-max ${
             isOverdue(task.target_date) && task.status !== 'done' 
               ? 'bg-[hsla(350,80%,50%,0.15)] text-[var(--error)]' 
               : 'bg-[hsla(0,0%,100%,0.05)] text-muted'
           }`}>
             <i className="fa-solid fa-calendar-days w-3 h-3"></i>
             {formatDate(task.created_at)} {task.target_date ? `- ${formatDate(task.target_date)}` : ''}
           </div>
        </div>

        <div className="kanban-card-actions">
          <div 
            onClick={() => onEdit(task)}
            className="ev-icon ev-icon-sm ev-icon-action"
            title="Düzenle"
          >
            <i className="fa-solid fa-pen-to-square"></i>
          </div>
          <div 
            onClick={() => onArchive(task.id)}
            className="ev-icon ev-icon-sm ev-icon-action ev-hover-success"
            title="Arşivle"
          >
            <i className="fa-solid fa-box-archive"></i>
          </div>
          <div 
            onClick={() => onDelete(task.id)}
            className="ev-icon ev-icon-sm ev-icon-action ev-hover-error"
            title="Sil"
          >
            <i className="fa-solid fa-trash-can"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Todos;
