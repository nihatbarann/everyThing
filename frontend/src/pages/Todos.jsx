import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, MoreVertical, Calendar, Clock, CheckCircle2, 
  Circle, AlertCircle, Loader, GripVertical, X, Package, Search, Pencil
} from 'lucide-react';
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
  const [newTask, setNewTask] = useState({ description: '', target_date: '', status: 'todo', priority: 'medium' });

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
    if (!newTask.description.trim()) return;
    
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
      setNewTask({ description: '', target_date: '', status: 'todo', priority: 'medium' });
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
      description: task.description || '',
      target_date: task.target_date ? task.target_date.split(' ')[0] : '', // Extract YYYY-MM-DD
      status: task.status,
      priority: task.priority || 'medium'
    });
    setShowModal(true);
  };

  const closePortal = () => {
    setShowModal(false);
    setEditingTask(null);
    setNewTask({ description: '', target_date: '', status: 'todo', priority: 'medium' });
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
    <div className="flex flex-col gap-6 pb-8 h-[calc(100vh-100px)] animate-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-4xl mb-2 text-gradient">Yapılacaklar</h1>
          <p className="text-muted text-lg">Manage tasks and workflow</p>
        </div>
        
        <div className="flex-1 max-w-md px-4">
          <div className="um-search-box !bg-white/5 border border-white/10 hover:border-primary/30 focus-within:border-primary/50 transition-all">
            <Search className="w-4 h-4 text-muted" />
            <input 
              type="text" 
              placeholder="Görevlerde ara..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="um-search-input !text-[var(--text-main)]"
            />
          </div>
        </div>

        <div className="flex gap-2 items-end">
          {hasPerm('todo_view') && (
            <button onClick={() => navigate('/dashboard/todos/archived')} className="um-btn-secondary">
              <Package className="w-4 h-4" /> <span>Arşivlenenler</span>
            </button>
          )}
          <button onClick={() => setShowModal(true)} className="um-btn-primary">
            <Plus className="w-4 h-4" /> <span>Yeni Görev</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="um-alert-error animate-in flex-shrink-0">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="um-loading-page flex-1">
          <Loader className="w-8 h-8 animate-spin text-primary" />
          <span>Panolar yükleniyor...</span>
        </div>
      ) : (
        <div className="flex-1 grid-container grid-cols-3 h-full" style={{ minWidth: '900px', overflowX: 'auto' }}>
          
          {/* TO DO COLUMN (Yapılacak - Yellow) */}
          <div 
            className="flex flex-col rounded-2xl bg-[hsla(45,100%,45%,0.15)] border border-[hsla(45,100%,45%,0.35)] overflow-hidden delay-1"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'todo')}
          >
            <div className="p-4 border-b border-[hsla(45,100%,45%,0.25)] bg-[hsla(45,100%,45%,0.2)] flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2 text-[#f1c40f]">
                <Circle className="w-5 h-5" /> Yapılacak
              </h2>
              <span className="badge warning bg-[#f1c40f] text-white border-none">{todos.todo.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 um-kanban-column">
              {todos.todo.filter(t => 
                t.description.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(task => (
                <TaskCard 
                  key={task.id} task={task} listId="todo" 
                  onDragStart={handleDragStart} onDragEnd={handleDragEnd} 
                  onDelete={handleDeleteTask} onArchive={handleArchiveTask}
                  onEdit={openEditModal}
                  isOverdue={isOverdue} formatDate={formatDate}
                />
              ))}
              {todos.todo.length === 0 && <div className="text-muted text-sm text-center py-8">Görev yok</div>}
            </div>
          </div>

          {/* IN PROGRESS COLUMN (Yapılıyor - Red) */}
          <div 
            className="flex flex-col rounded-2xl bg-[hsla(0,80%,50%,0.15)] border border-[hsla(0,80%,50%,0.35)] overflow-hidden delay-2"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'in_progress')}
          >
            <div className="p-4 border-b border-[hsla(0,80%,50%,0.25)] bg-[hsla(0,80%,50%,0.2)] flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2 text-[#e74c3c]">
                <Clock className="w-5 h-5" /> Yapılıyor
              </h2>
              <span className="badge danger bg-[#e74c3c] text-white border-none">{todos.in_progress.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 um-kanban-column">
              {todos.in_progress.filter(t => 
                t.description.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(task => (
                <TaskCard 
                  key={task.id} task={task} listId="in_progress" 
                  onDragStart={handleDragStart} onDragEnd={handleDragEnd} 
                  onDelete={handleDeleteTask} onArchive={handleArchiveTask}
                  onEdit={openEditModal}
                  isOverdue={isOverdue} formatDate={formatDate}
                />
              ))}
              {todos.in_progress.length === 0 && <div className="text-muted text-sm text-center py-8">Görev yok</div>}
            </div>
          </div>

          {/* DONE COLUMN (Yapıldı - Green) */}
          <div 
            className="flex flex-col rounded-2xl bg-[hsla(150,80%,40%,0.15)] border border-[hsla(150,80%,40%,0.35)] overflow-hidden delay-3"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'done')}
          >
            <div className="p-4 border-b border-[hsla(150,80%,40%,0.25)] bg-[hsla(150,80%,40%,0.2)] flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2 text-[#2ecc71]">
                <CheckCircle2 className="w-5 h-5" /> Yapıldı
              </h2>
              <span className="badge positive bg-[#2ecc71] text-white border-none">{todos.done.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 um-kanban-column">
              {todos.done.filter(t => 
                t.description.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(task => (
                <TaskCard 
                  key={task.id} task={task} listId="done" 
                  onDragStart={handleDragStart} onDragEnd={handleDragEnd} 
                  onDelete={handleDeleteTask} onArchive={handleArchiveTask}
                  onEdit={openEditModal}
                  isOverdue={isOverdue} formatDate={formatDate}
                />
              ))}
              {todos.done.length === 0 && <div className="text-muted text-sm text-center py-8">Görev yok</div>}
            </div>
          </div>

        </div>
      )}

      {showModal && (
        <div className="um-modal-overlay" onClick={closePortal}>
          <div className="um-modal !max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4">{editingTask ? 'Görevi Düzenle' : 'Yeni Görev Ekle'}</h3>
            <form onSubmit={handleSaveTask} className="flex flex-col gap-4">
              <div className="um-field">
                <label>Görev Açıklaması *</label>
                <textarea required autoFocus value={newTask.description} rows="4"
                  onChange={e => setNewTask({...newTask, description: e.target.value})} 
                  placeholder="Neler yapılacak?..." />
              </div>
              <div className="two-cols">
                <div className="um-field">
                  <label>Hedef Tarih</label>
                  <input type="date" value={newTask.target_date} 
                    onChange={e => setNewTask({...newTask, target_date: e.target.value})} />
                </div>
                <div className="um-field">
                  <label>Öncelik</label>
                  <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                  </select>
                </div>
              </div>
              <div className="um-field">
                <label>Durum</label>
                <select value={newTask.status} onChange={e => setNewTask({...newTask, status: e.target.value})}>
                  <option value="todo">Yapılacak</option>
                  <option value="in_progress">Yapılıyor</option>
                  <option value="done">Yapıldı</option>
                </select>
              </div>
              <div className="um-modal-actions">
                <button type="button" onClick={closePortal} className="um-btn-secondary">İptal</button>
                <button type="submit" className="um-btn-primary" disabled={saving}>
                  {saving ? <Loader className="w-4 h-4 animate-spin"/> : (editingTask ? 'Güncelle' : 'Oluştur')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// Extracted Card Component for clean rendering
const TaskCard = ({ task, listId, onDragStart, onDragEnd, onDelete, onArchive, onEdit, isOverdue, formatDate }) => {
  const getPriorityInfo = (p) => {
    switch(p) {
      case 'high': return { label: 'Yüksek', class: 'bg-error/20 text-error border-error/30' };
      case 'medium': return { label: 'Orta', class: 'bg-warning/20 text-warning border-warning/30' };
      case 'low': return { label: 'Düşük', class: 'bg-primary/20 text-primary border-primary/30' };
      default: return { label: 'Orta', class: 'bg-warning/20 text-warning border-warning/30' };
    }
  };

  const priority = getPriorityInfo(task.priority);

  let highlightClass = '';
  if (task.status === 'done') {
    highlightClass = 'overdue'; // Red permanently for done
  } else if (isOverdue(task.target_date)) {
    highlightClass = 'overdue'; // Red for overdue/today
  } else if (task.status === 'in_progress') {
    highlightClass = 'card-in-progress'; // Yellow for in-progress
  } else if (task.status === 'todo') {
    highlightClass = 'card-todo'; // Green for to-do
  }

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, task, listId)}
      onDragEnd={onDragEnd}
      className={`um-kanban-card group relative overflow-hidden flex flex-col gap-2 ${highlightClass}`}
    >
      <div className="flex-1">
        <p className="text-xs text-[var(--text-main)] leading-relaxed whitespace-pre-wrap line-clamp-4">
          {task.description}
        </p>
      </div>

      <div className="flex items-center justify-between mt-1 pt-2 border-t border-[var(--glass-border)]">
        <div className="flex items-center gap-1.5 shrink-0" title={`Oluşturan: ${task.creator_fn || task.creator_username}`}>
           <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded w-max ${
             isOverdue(task.target_date) && task.status !== 'done' 
               ? 'bg-[hsla(350,80%,50%,0.15)] text-[var(--error)]' 
               : 'bg-[hsla(0,0%,100%,0.05)] text-muted'
           }`}>
             <Calendar className="w-3 h-3" />
             {formatDate(task.created_at)} {task.target_date ? `- ${formatDate(task.target_date)}` : ''}
           </div>
        </div>

        {/* Horizontal Action Buttons */}
        <div className="flex items-center gap-1 shrink-0 bg-black/20 p-1 rounded-lg border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-md text-muted hover:bg-[hsla(210,100%,50%,0.2)] hover:text-[#3b82f6] transition-colors"
            title="Düzenle"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => onArchive(task.id)}
            className="p-1.5 rounded-md text-muted hover:bg-[hsla(150,80%,40%,0.2)] hover:text-[#2ecc71] transition-colors"
            title="Arşivle"
          >
            <Package className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded-md text-muted hover:bg-[hsla(0,80%,50%,0.2)] hover:text-[#e74c3c] transition-colors"
            title="Sil"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Todos;
