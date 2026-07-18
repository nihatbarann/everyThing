import React, { useState, useEffect, useRef, Suspense } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';

const DiagramEditor = React.lazy(() => import('../components/DiagramEditor'));
const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

// A note's `content` column stores a JSON envelope { html, diagram } so a single
// note can hold both a rich-text body and a diagram on one page. Older rows
// predate this: type === 'diagram' rows hold a raw Excalidraw scene with no
// envelope, and type === 'text' rows hold raw Quill HTML. Both are detected and
// upgraded to the envelope format transparently on first save.
const parseNote = (raw) => {
  if (raw.type === 'diagram') {
    return { html: '', diagram: raw.content || null, initialTab: 'diagram' };
  }
  let html = raw.content || '';
  let diagram = null;
  try {
    const parsed = JSON.parse(raw.content);
    if (parsed && typeof parsed === 'object' && ('html' in parsed || 'diagram' in parsed)) {
      html = parsed.html || '';
      diagram = parsed.diagram || null;
    }
  } catch {
    // Legacy plain-HTML note — keep raw.content as html.
  }
  return { html, diagram, initialTab: 'text' };
};

const ProjectNoteEditor = () => {
  const { projectId, noteId } = useParams();
  const navigate = useNavigate();
  const isNew = noteId === 'new';
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [diagramInitial, setDiagramInitial] = useState(null);
  const [activeTab, setActiveTab] = useState('text');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const isDiagramTab = activeTab === 'diagram';
  const diagramSceneRef = useRef(null);

  useEffect(() => {
    if (!isNew) fetchNote();
  }, [noteId]);

  const fetchNote = async () => {
    try {
      const res = await axios.get(`/api/projects/${projectId}/notes/${noteId}`, authHeaders());
      const { html, diagram, initialTab } = parseNote(res.data.note);
      setTitle(res.data.note.title || '');
      setContentHtml(html);
      setDiagramInitial(diagram);
      setActiveTab(initialTab);
      diagramSceneRef.current = null;
      setLastSaved(new Date());
    } catch (err) {
      if (err.response?.status === 404) navigate(`/dashboard/projects/${projectId}`);
    } finally { setLoading(false); }
  };

  const handleSave = async (auto = false) => {
    if (!auto) setSaving(true);
    const diagram = diagramSceneRef.current != null ? diagramSceneRef.current : diagramInitial;
    const content = JSON.stringify({ html: contentHtml, diagram });
    try {
      if (isNew) {
        const res = await axios.post(`/api/projects/${projectId}/notes`, {
          title: title || 'İsimsiz Not', content, type: 'text'
        }, authHeaders());
        if (res.data.id) navigate(`/dashboard/projects/${projectId}/notes/${res.data.id}`, { replace: true });
      } else {
        await axios.put(`/api/projects/${projectId}/notes/${noteId}`, { title, content }, authHeaders());
      }
      setLastSaved(new Date());
      if (!auto) { setSavedOk(true); setTimeout(() => setSavedOk(false), 2000); }
    } catch (err) {
    } finally {
      if (!auto) setSaving(false);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'clean']
    ]
  };

  if (loading) return <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 120px)' }}><i className="fa-solid fa-spinner fa-spin w-8 h-8 text-primary"></i></div>;

  return (
    <div className={`note-editor-root animate-in${isDiagramTab ? ' note-editor-root-diagram' : ''}`}>
      <header className="note-editor-topbar">
        <div className="note-editor-breadcrumb">
          <button onClick={() => navigate(`/dashboard/projects/${projectId}`)} className="note-editor-back-btn" title="Projeye Dön">
            <i className="fa-solid fa-arrow-left"></i><span>Proje</span>
          </button>
          <span className="note-editor-breadcrumb-sep">/</span>
          <i className="fa-solid fa-note-sticky text-primary" style={{ fontSize: '0.8rem' }}></i>
          <span className="note-editor-breadcrumb-title">{isNew ? 'Yeni Not' : (title || 'İsimsiz')}</span>
        </div>
        <div className="note-editor-actions">
          {lastSaved && (
            <div className="note-editor-save-status">
              <i className="fa-solid fa-clock-rotate-left"></i>
              <span>Son kayıt {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
          <button onClick={() => handleSave(false)} disabled={saving} className="ev-btn ev-btn-primary ev-btn-sm">
            {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : savedOk ? <i className="fa-solid fa-circle-check"></i> : <i className="fa-solid fa-floppy-disk"></i>}
            <span>{savedOk ? 'Kaydedildi!' : (isNew ? 'Oluştur' : 'Kaydet')}</span>
          </button>
        </div>
      </header>

      <div className={`note-editor-canvas${isDiagramTab ? ' note-editor-canvas-diagram' : ''}`}>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Not Başlığı" className="note-editor-title-input" autoFocus={isNew} />
        <div className="note-editor-divider"></div>

        {/* Metin / Şema switcher — both live under the same note */}
        <div className="tool-mode-switcher mb-4">
          <button type="button" className={`tool-mode-btn${!isDiagramTab ? ' active' : ''}`} onClick={() => setActiveTab('text')}>
            <i className="fa-solid fa-note-sticky"></i>
            <span>Metin</span>
          </button>
          <button type="button" className={`tool-mode-btn${isDiagramTab ? ' active' : ''}`} onClick={() => setActiveTab('diagram')}>
            <i className="fa-solid fa-diagram-project"></i>
            <span>Şema</span>
          </button>
        </div>

        {isDiagramTab ? (
          <div className="note-editor-diagram-wrapper">
            <Suspense fallback={<div className="flex items-center justify-center" style={{ height: '100%' }}><i className="fa-solid fa-spinner fa-spin w-8 h-8 text-primary"></i></div>}>
              <DiagramEditor
                content={diagramSceneRef.current != null ? diagramSceneRef.current : diagramInitial}
                sceneRef={diagramSceneRef}
              />
            </Suspense>
          </div>
        ) : (
          <div className="quill-premium-wrapper note-editor-quill-wrapper">
            <ReactQuill theme="snow" value={contentHtml} onChange={setContentHtml}
              modules={modules} placeholder="Bir şeyler yazın veya '/' tıklayarak biçimlendirin..." />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectNoteEditor;
