import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Loader, Trash2, Calendar } from 'lucide-react';

const NotesDashboard = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await axios.get('/api/notes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotes(res.data.notes || []);
    } catch(err) { } finally { setLoading(false); }
  };

  const handleCreateNote = async () => {
    try {
      const res = await axios.post('/api/notes', { title: 'Yeni Not', content: '' }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.id) {
        navigate(`/dashboard/notes/${res.data.id}`);
      }
    } catch(err) { }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Bu notu silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`/api/notes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchNotes();
    } catch(err) {}
  };

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in text-[var(--text-main)]">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Notlarım</h1>
          <p className="text-muted">Kişisel notlarınızı buradan yönetebilirsiniz.</p>
        </div>
        <button onClick={handleCreateNote} className="um-btn-primary">
          <Plus className="w-5 h-5"/> Yeni Not Oluştur
        </button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center p-10"><Loader className="w-8 h-8 animate-spin text-primary"/></div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 text-muted border border-dashed border-[var(--glass-border)] rounded-2xl bg-[hsla(0,0%,0%,0.1)]">
          <FileText className="w-16 h-16 mb-4 opacity-50"/>
          <p>Henüz hiç notunuz yok. "Yeni Not Oluştur" butonuna tıklayarak başlayın.</p>
        </div>
      ) : (
        <div 
          className="w-full max-w-6xl mb-10" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1.5rem' 
          }}
        >
          {notes.map(note => (
            <div 
              key={note.id} 
              onClick={() => navigate(`/dashboard/notes/${note.id}`)}
              className="premium-card cursor-pointer hover:border-primary/50 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] transition-all group flex flex-col h-40"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg truncate pr-4 text-[var(--text-main)]" title={note.title}>{note.title}</h3>
                <button 
                  onClick={(e) => handleDelete(e, note.id)}
                  className="p-1.5 rounded-md hover:bg-[var(--error)]/20 text-[var(--text-muted)] hover:text-[var(--error)] opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Notu Sil"
                >
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
              <div className="mt-auto text-xs text-muted flex justify-between items-center pt-3 border-t border-[var(--glass-border)]">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(note.updated_at).toLocaleDateString()}</span>
                <span className="text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">Düzenle &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesDashboard;
