import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { TICKET_PRIORITY, fmtDateTime } from '../utils/ticketHelpers';

const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const COMMENT_TYPE_ICON = { comment: 'fa-comment', completion: 'fa-circle-check', reassignment: 'fa-people-arrows' };

const ArchivedTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailTicket, setDetailTicket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchArchived(); }, []);

  const fetchArchived = async () => {
    try {
      const res = await axios.get('/api/tickets/archived', authHeaders());
      setTickets(res.data.tickets || []);
    } catch (err) { } finally { setLoading(false); }
  };

  const openDetail = async (ticket) => {
    try {
      const res = await axios.get(`/api/tickets/${ticket.id}`, authHeaders());
      setDetailTicket(res.data.ticket);
    } catch (err) {
      setDetailTicket(ticket);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in text-[var(--text-main)]" style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      <header className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/tickets')} className="note-editor-back-btn"><i className="fa-solid fa-arrow-left"></i><span>Ticketlar</span></button>
      </header>

      <div className="flex items-center gap-3">
        <i className="fa-solid fa-box-archive text-primary text-3xl shrink-0"></i>
        <div>
          <h1 className="text-3xl font-bold text-gradient">Ticket Arşivi</h1>
          <p className="text-muted">Tamamlanmış geçmiş ticketları buradan inceleyebilirsiniz.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-10"><i className="fa-solid fa-spinner fa-spin text-primary"></i></div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-muted p-10 border border-dashed border-[var(--glass-border)] rounded-2xl">
          <i className="fa-solid fa-box-archive mb-3 opacity-20" style={{ fontSize: '2.5rem' }}></i>
          <p>Arşivde henüz ticket yok.</p>
        </div>
      ) : (
        <div className="vault-list">
          {tickets.map(t => {
            const prio = TICKET_PRIORITY[t.priority] || TICKET_PRIORITY.medium;
            return (
              <div key={t.id} className="vault-row" onClick={() => openDetail(t)} style={{ cursor: 'pointer' }}>
                <div className="vault-row-favicon"><i className="fa-solid fa-circle-check" style={{ color: 'var(--success)' }}></i></div>
                <div className="vault-row-info">
                  <div className="vault-row-title">
                    <span className="truncate" title={t.title}>{t.title}</span>
                    <span className="priority-badge" style={{ '--badge-color': prio.color }}>{prio.label}</span>
                  </div>
                  <div className="vault-row-subtitle">
                    <span className="truncate">Atayan: {t.creator_name}</span>
                    <span className="vault-row-sep">•</span>
                    <span className="truncate">Atanan: {t.assignee_name}</span>
                    <span className="vault-row-sep">•</span>
                    <span className="truncate">Tamamlandı: {fmtDateTime(t.completed_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detailTicket && createPortal(
        <div className="um-modal-overlay" onClick={() => setDetailTicket(null)}>
          <div className="um-modal" style={{ maxWidth: '640px', maxHeight: '88vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start" style={{ marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.4rem' }}>{detailTicket.title}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="priority-badge" style={{ '--badge-color': (TICKET_PRIORITY[detailTicket.priority] || TICKET_PRIORITY.medium).color }}>{(TICKET_PRIORITY[detailTicket.priority] || TICKET_PRIORITY.medium).label}</span>
                  <span className="priority-badge" style={{ '--badge-color': 'var(--success)' }}><i className="fa-solid fa-circle-check" style={{ marginRight: '0.3rem' }}></i>Tamamlandı</span>
                </div>
              </div>
              <button onClick={() => setDetailTicket(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><i className="fa-solid fa-xmark" style={{ fontSize: '1.25rem' }}></i></button>
            </div>

            {!!detailTicket.description && (
              <p className="text-sm text-muted" style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem', lineHeight: 1.6 }}>{detailTicket.description}</p>
            )}

            <div className="project-overview-meta" style={{ marginTop: 0, paddingTop: '1rem' }}>
              <div><label>Atayan</label><span>{detailTicket.creator_name}</span></div>
              <div><label>Atanan</label><span>{detailTicket.assignee_name}</span></div>
              <div><label>Başlangıç</label><span>{fmtDateTime(detailTicket.start_at)}</span></div>
              <div><label>Tamamlandı</label><span>{fmtDateTime(detailTicket.completed_at)}</span></div>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-subtle)' }}>Notlar & Geçmiş</span>
              <div className="flex flex-col gap-3" style={{ marginTop: '0.75rem', maxHeight: '320px', overflowY: 'auto' }}>
                {(!detailTicket.comments || detailTicket.comments.length === 0) ? (
                  <p className="text-xs text-muted">Not eklenmemiş.</p>
                ) : detailTicket.comments.map(c => (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <span className="project-member-avatar" style={{ flexShrink: 0, background: c.type === 'comment' ? undefined : 'var(--bg-hover)', color: c.type === 'comment' ? undefined : 'var(--text-muted)' }}>
                      <i className={`fa-solid ${COMMENT_TYPE_ICON[c.type] || 'fa-comment'}`} style={{ fontSize: '11px' }}></i>
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{c.user_name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>{fmtDateTime(c.created_at)}</span>
                        {c.type === 'completion' && <span className="priority-badge" style={{ '--badge-color': 'var(--success)', fontSize: '0.6rem' }}>Tamamlama Notu</span>}
                      </div>
                      <p style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', marginTop: '0.15rem', color: c.type === 'reassignment' ? 'var(--text-muted)' : 'var(--text-main)', fontStyle: c.type === 'reassignment' ? 'italic' : 'normal' }}>{c.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ArchivedTickets;
