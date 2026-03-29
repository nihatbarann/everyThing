import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';

const NoteEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [note, setNote] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (!isNew) {
      fetchNote();
    }
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
      if (isNew) {
        // Create new note
        const res = await axios.post('/api/notes', {
          title: note.title || 'İsimsiz Not',
          content: note.content
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data.id) {
          navigate(`/dashboard/notes/${res.data.id}`, { replace: true });
        }
      } else {
        // Update existing note — send only title and content
        await axios.put(`/api/notes/${id}`, {
          title: note.title,
          content: note.content
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      setLastSaved(new Date());
      if(!auto) {
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 2000);
      }
    } catch(err) {

    } finally {
      if(!auto) setSaving(false);
    }
  };

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

  if (loading) return <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 120px)' }}><i className="fa-solid fa-spinner fa-spin w-8 h-8 text-primary"></i></div>;

  return (
    <div className="note-editor-root animate-in">
      
      {/* Premium Top Bar */}
      <header className="note-editor-topbar">
        <div className="note-editor-breadcrumb">
          <button 
            onClick={() => navigate('/dashboard/notes')} 
            className="note-editor-back-btn"
            title="Notlara Dön"
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Notlarım</span>
          </button>
          <span className="note-editor-breadcrumb-sep">/</span>
          <span className="note-editor-breadcrumb-title">{isNew ? 'Yeni Not' : (note.title || 'İsimsiz')}</span>
        </div>

        <div className="note-editor-actions">
          {lastSaved && (
            <div className="note-editor-save-status">
              <i className="fa-solid fa-clock-rotate-left"></i>
              <span>Son kayıt {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          )}
          <button 
            onClick={() => handleSave(false)} 
            disabled={saving} 
            className="ev-btn ev-btn-primary ev-btn-sm"
          >
            {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : savedOk ? <i className="fa-solid fa-circle-check"></i> : <i className="fa-solid fa-floppy-disk"></i>}
            <span>{savedOk ? 'Kaydedildi!' : (isNew ? 'Oluştur' : 'Kaydet')}</span>
          </button>
        </div>
      </header>

      {/* Editor Canvas */}
      <div className="note-editor-canvas">
        
        {/* Title Input */}
        <input 
          type="text" 
          value={note.title} 
          onChange={e => setNote({...note, title: e.target.value})}
          placeholder="Not Başlığı"
          className="note-editor-title-input"
          autoFocus={isNew}
        />

        {/* Divider */}
        <div className="note-editor-divider"></div>

        {/* Rich Text ReactQuill */}
        <div className="quill-premium-wrapper note-editor-quill-wrapper">
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
