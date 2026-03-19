import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader, CircleCheck, Clock } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';

const NoteEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    try {
      const res = await axios.get(`/api/notes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNote(res.data.note);
      setLastSaved(new Date());
    } catch(err) {
      if (err.response?.status === 404) navigate('/dashboard/notes');
    } finally { setLoading(false); }
  };

  const handleSave = async (auto = false) => {
    if(!auto) setSaving(true);
    try {
      await axios.put(`/api/notes/${id}`, note, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLastSaved(new Date());
      if(!auto) {
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 2000);
      }
    } catch(err) { } 
    finally { if(!auto) setSaving(false); }
  };

  // Optional: Auto-save debounce (skipping complex useEffects for manual trigger, but UX looks better with manual for now)

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'clean']
    ]
  };

  if (loading) return <div className="flex items-center justify-center p-20"><Loader className="w-8 h-8 animate-spin text-primary"/></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-in gap-4 max-w-4xl mx-auto w-full relative">
      
      {/* Sticky Top Bar - Notion Style */}
      <header className="sticky top-0 z-30 flex items-center justify-between pb-4 pt-2 mb-4 border-b border-[var(--glass-border)] bg-[var(--bg-main)]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/dashboard/notes')} 
            className="p-2 hover:bg-[hsla(0,0%,50%,0.1)] rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors flex items-center gap-1"
            title="Notlara Dön"
          >
            <ArrowLeft className="w-5 h-5"/>
            <span className="text-sm font-medium hidden sm:inline">Notlarım</span>
          </button>
          <span className="text-[var(--text-muted)] opacity-50 select-none">/</span>
          <span className="text-sm text-[var(--text-muted)] truncate max-w-[150px] sm:max-w-xs">{note.title || 'İsimsiz'}</span>
        </div>

        <div className="flex items-center gap-4">
          {lastSaved && (
            <div className="text-xs text-[var(--text-muted)] hidden sm:flex items-center gap-1">
              <Clock className="w-3 h-3"/> Son kaydetme {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          )}
          <button 
            onClick={() => handleSave(false)} 
            disabled={saving} 
            className="um-btn-primary h-9 px-4 text-sm transiton-all"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin"/> : savedOk ? <CircleCheck className="w-4 h-4"/> : <Save className="w-4 h-4"/>}
            <span className="hidden sm:inline">{savedOk ? 'Kaydedildi' : 'Kaydet'}</span>
          </button>
        </div>
      </header>

      {/* Editor Canvas Container */}
      <div className="flex-1 flex flex-col px-4 sm:px-10 pb-20 overflow-y-auto custom-scrollbar">
        
        {/* Huge Document Title Input */}
        <input 
          type="text" 
          value={note.title} 
          onChange={e => setNote({...note, title: e.target.value})}
          placeholder="Not Başlığı"
          className="text-4xl sm:text-5xl font-extrabold bg-transparent border-none outline-none focus:ring-0 w-full p-0 py-6 text-[var(--text-main)] placeholder-[var(--text-muted)]/50 tracking-tight"
        />

        {/* Rich Text ReactQuill */}
        <div className="quill-premium-wrapper flex-1">
          <ReactQuill 
            theme="snow" 
            value={note.content} 
            onChange={(val) => setNote({...note, content: val})} 
            modules={modules}
            placeholder="Bir şeyler yazın veya '/' tıklayarak biçimlendirin..."
          />
        </div>
      </div>
      
    </div>
  );
};

export default NoteEditor;
