import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [monitors, setMonitors] = useState([]);
  const [systemLoaded, setSystemLoaded] = useState(false);

  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newEvent, setNewEvent] = useState({ title: '', time: '', color: '#3b82f6', is_done: 0 });
  const [editingEventId, setEditingEventId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch(e){}
    }
    fetchLatestAnnouncements();
    fetchEvents(new Date());
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    const headers = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
    try {
      const [certRes, monRes] = await Promise.all([
        axios.get('/api/certificates', headers).catch(() => ({ data: { certificates: [] } })),
        axios.get('/api/monitors', headers).catch(() => ({ data: { monitors: [] } })),
      ]);
      setCertificates(certRes.data.certificates || []);
      setMonitors(monRes.data.monitors || []);
    } catch (err) {
    } finally {
      setSystemLoaded(true);
    }
  };

  const fetchEvents = async (date) => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const res = await axios.get(`/api/calendar?month=${year}-${month}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.events) {
        setEvents(res.data.events);
      }
    } catch (err) {

    }
  };

  const handleDayClick = (value) => {
    setSelectedDate(value);
  };
  
  const handleActiveStartDateChange = ({ activeStartDate }) => {
    setCurrentDate(activeStartDate);
    fetchEvents(activeStartDate);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!selectedDate) return;

    try {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const payload = {
        event_date: dateStr,
        event_time: newEvent.time,
        title: newEvent.title,
        color: newEvent.color,
        is_done: newEvent.is_done ? 1 : 0
      };
      
      let res;
      if (editingEventId) {
        res = await axios.put(`/api/calendar/${editingEventId}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        res = await axios.post('/api/calendar', payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      
      if (res.data.success) {
        setShowEventModal(false);
        setNewEvent({ title: '', time: '', color: '#3b82f6', is_done: 0 });
        setEditingEventId(null);
        fetchEvents(currentDate);
      }
    } catch (err) {

      alert('Event kaydetme başarısız oldu.');
    }
  };

  const handleToggleDone = async (e, evt) => {
    e.stopPropagation();
    try {
      const payload = {
        title: evt.title,
        color: evt.color,
        event_date: evt.event_date,
        event_time: evt.event_time,
        is_done: evt.is_done ? 0 : 1
      };
      await axios.put(`/api/calendar/${evt.id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchEvents(currentDate);
    } catch (err) {

    }
  };

  const handleEditEventClick = (e, evt) => {
    e.stopPropagation();
    setNewEvent({ 
      title: evt.title, 
      time: evt.event_time || '', 
      color: evt.color,
      is_done: evt.is_done 
    });
    setEditingEventId(evt.id);
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (e, id) => {
    e.stopPropagation();
    if(!window.confirm('Bu notu silmek istediğinize emin misiniz?')) return;
    
    try {
      await axios.delete(`/api/calendar/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchEvents(currentDate);
    } catch (err) {

    }
  };

  // Helper for custom tile content (event dots)
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.event_date === dateStr);
      
      if (dayEvents.length > 0) {
        return (
          <div className="react-calendar__tile-dots">
            {dayEvents.slice(0, 3).map((e, i) => (
              <div key={i} className="react-calendar__tile-dot" style={{ backgroundColor: e.color }} />
            ))}
          </div>
        );
      }
    }
    return null;
  };

  const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  const fetchLatestAnnouncements = async () => {
    try {
      const res = await axios.get('/api/announcements/latest', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setAnnouncements(res.data.announcements);
      }
    } catch (err) {

    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'ev-priority-high';
      case 'medium': return 'ev-priority-medium';
      default: return 'ev-priority-low';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'Önemli';
      case 'medium': return 'Orta';
      default: return 'Temel';
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in">
        <div>
          <h1 className="text-4xl mb-2 text-gradient">Dashboard Overview</h1>
          <p className="text-muted text-lg">
            Welcome back, <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{user?.username || 'Admin'}</span>.
          </p>
        </div>
        <div className="ev-btn ev-btn-ghost" style={{ cursor: 'default' }}>
          <i className="fa-regular fa-clock" style={{ color: 'var(--info)' }}></i>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </header>

      {/* System Status Strip — certificate/domain expiry + device monitoring */}
      {systemLoaded && (certificates.length > 0 || monitors.length > 0) && (() => {
        const expiringCerts = certificates
          .filter(c => c.days_left <= c.reminder_days)
          .sort((a, b) => a.days_left - b.days_left)
          .slice(0, 3);
        const downMonitors = monitors.filter(m => m.last_status === 'down');
        const allClear = expiringCerts.length === 0 && downMonitors.length === 0;

        if (allClear) {
          return (
            <div className="premium-card animate-in" style={{ padding: '0.9rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="ev-icon ev-icon-sm ev-icon-success"><i className="fa-solid fa-check"></i></div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Sistem durumu iyi — süresi yaklaşan kayıt veya erişilemeyen cihaz yok.</span>
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-2 animate-in" style={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'row', gap: '0.75rem' }}>
            {downMonitors.length > 0 && (
              <Link to="/dashboard/monitors" className="premium-card" style={{ padding: '0.9rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 260px', textDecoration: 'none' }}>
                <div className="ev-icon ev-icon-sm ev-icon-error"><i className="fa-solid fa-tower-broadcast"></i></div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{downMonitors.length} cihaz erişilemiyor</span>
                <i className="fa-solid fa-arrow-right" style={{ marginLeft: 'auto', color: 'var(--text-subtle)', fontSize: '0.75rem' }}></i>
              </Link>
            )}
            {expiringCerts.map(c => (
              <Link key={c.id} to="/dashboard/certificates" className="premium-card" style={{ padding: '0.9rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 260px', textDecoration: 'none' }}>
                <div className={`ev-icon ev-icon-sm ${c.days_left <= 7 ? 'ev-icon-error' : 'ev-icon-warning'}`}><i className="fa-solid fa-certificate"></i></div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.title} — {c.days_left < 0 ? 'süresi doldu' : `${c.days_left} gün kaldı`}
                </span>
                <i className="fa-solid fa-arrow-right" style={{ marginLeft: 'auto', color: 'var(--text-subtle)', fontSize: '0.75rem', flexShrink: 0 }}></i>
              </Link>
            ))}
          </div>
        );
      })()}

      {/* Dashboard Content - 50/50 Split Grid */}
      <div className="dashboard-split">
        
        {/* Sol Taraf - Duyurular (50%) */}
        <div className="premium-card flex flex-col animate-in delay-1" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'hsla(0,0%,0%,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="flex items-center gap-3">
              <div className="ev-icon ev-icon-purple"><i className="fa-solid fa-bullhorn"></i></div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Son Duyurular</h2>
            </div>
            <Link to="/dashboard/announcements" className="ev-btn ev-btn-secondary ev-btn-sm">
              Tümünü Gör
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
          <div style={{ padding: '1.25rem', flex: 1, overflowY: 'auto' }}>
            {announcements.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-bullhorn" style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.2 }}></i>
                <p>Henüz yayınlanmış bir duyuru bulunmuyor.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {announcements.map((ann) => (
                  <div 
                    key={ann.id} 
                    className="premium-card"
                    style={{ padding: '1.25rem', cursor: 'pointer' }}
                  >
                    <div className="flex items-start justify-between gap-4" style={{ marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.4 }}>
                        {ann.title}
                      </h3>
                      <span className={`shrink-0 whitespace-nowrap ${getPriorityColor(ann.priority)}`} style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', border: '1px solid' }}>
                        {getPriorityLabel(ann.priority)}
                      </span>
                    </div>
                    
                    <p className="text-muted" style={{ fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ann.short_description}
                    </p>
                    
                    <div className="flex items-center gap-4" style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-subtle)', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                      <div className="flex items-center gap-1">
                        <i className="fa-solid fa-user" style={{ fontSize: '10px', color: 'var(--primary)' }}></i>
                        {ann.created_by_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <i className="fa-regular fa-calendar" style={{ fontSize: '11px', color: 'var(--primary)' }}></i>
                        {new Date(ann.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Sağ Taraf - Takvim Widget (50%) */}
        <div className="animate-in delay-2 flex flex-col gap-4">
          
          {/* Calendar Card */}
          <div className="premium-card um-custom-calendar-wrapper" style={{ padding: '1rem', overflow: 'hidden', flexShrink: 0, borderRadius: 'var(--radius-xl)' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem', fontWeight: 700, padding: '0 0.5rem' }}>
              <i className="fa-regular fa-calendar" style={{ color: 'var(--primary)' }}></i> 
              Takvim
            </div>
            <Calendar 
              onChange={handleDayClick} 
              value={selectedDate}
              onActiveStartDateChange={handleActiveStartDateChange}
              tileContent={tileContent}
              next2Label={null}
              prev2Label={null}
              locale="tr-TR"
            />
          </div>

          {/* Selected Day Events */}
          <div className="premium-card flex flex-col" style={{ padding: 0, overflow: 'hidden', flex: 1, borderRadius: 'var(--radius-xl)' }}>
            <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                {selectedDate ? (
                  selectedDate.toDateString() === new Date().toDateString() 
                    ? 'Bugünün Planları' 
                    : `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} Planları`
                ) : (
                  'Planlar'
                )}
              </h3>
              {selectedDate && (
                <button 
                  onClick={() => {
                    setNewEvent({ title: '', time: '', color: '#3b82f6', is_done: 0 });
                    setEditingEventId(null);
                    setShowEventModal(true);
                  }}
                  className="ev-icon ev-icon-sm ev-icon-action"
                  title="Not Ekle"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              )}
            </div>

            <div style={{ padding: '1rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(() => {
                if (!selectedDate) {
                  return (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                       <span className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Gün seçin</span>
                    </div>
                  );
                }

                const selStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                const selectedEvents = events.filter(e => e.event_date === selStr);
                
                if (selectedEvents.length === 0) {
                  return (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, padding: '1rem' }}>
                      <span className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Plan yok</span>
                    </div>
                  );
                }
                
                return selectedEvents.map(evt => (
                  <div 
                    key={evt.id} 
                    className="group"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-hover)', transition: 'background 0.18s' }}
                  >
                    <div className="flex items-center gap-3 overflow-hidden" style={{ opacity: evt.is_done ? 0.6 : 1 }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '4px', flexShrink: 0, backgroundColor: evt.color }}></div>
                      <div className="flex flex-col">
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: evt.is_done ? 'line-through' : 'none' }} title={evt.title}>
                          {evt.title}
                        </span>
                        {evt.event_time && (
                          <span className="text-muted" style={{ fontSize: '10px', fontWeight: 500, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: evt.is_done ? 'line-through' : 'none' }}>
                            <i className="fa-regular fa-clock"></i>
                            {evt.event_time.substring(0, 5)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => handleToggleDone(e, evt)} 
                        className="ev-icon ev-icon-sm ev-icon-action"
                        title={evt.is_done ? "Geri Al" : "Yapıldı"}
                      >
                        <i className={`fa-solid ${evt.is_done ? 'fa-rotate-left' : 'fa-check'}`} style={{ color: evt.is_done ? 'var(--text-muted)' : 'var(--success)' }}></i>
                      </button>
                      <button 
                        onClick={(e) => handleEditEventClick(e, evt)} 
                        className="ev-icon ev-icon-sm ev-icon-action"
                        title="Düzenle"
                      >
                        <i className="fa-solid fa-pen" style={{ color: 'var(--primary)' }}></i>
                      </button>
                      <button 
                        onClick={(e) => handleDeleteEvent(e, evt.id)} 
                        className="ev-icon ev-icon-sm ev-icon-action ev-hover-error"
                        title="Sil"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Event Add Modal */}
      {showEventModal && (
        <div className="um-modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="um-modal" style={{ maxWidth: '24rem' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-calendar-plus" style={{ color: 'var(--primary)' }}></i> 
                {editingEventId ? 'Notu Düzenle' : 'Not Ekle'}
              </h2>
              <button onClick={() => setShowEventModal(false)} className="ev-btn ev-btn-ghost ev-btn-icon ev-btn-sm">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--text-main)' }}>{selectedDate?.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> tarihi için plan veya not ekleyin.
            </p>
            
            <form onSubmit={handleSaveEvent} className="flex flex-col gap-4">
              <div className="um-field">
                <label>Not / Plan</label>
                <input 
                  type="text" 
                  autoFocus
                  required 
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="örn: Müşteri toplantısı, fatura ödemesi..."
                />
              </div>

              <div className="um-field">
                <label>Saat (İsteğe Bağlı)</label>
                <input 
                  type="time" 
                  value={newEvent.time}
                  onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                />
              </div>
              
              <div className="um-field">
                <label>Renk Etiketi</label>
                <div className="flex gap-3 mt-1">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(color => (
                    <div 
                      key={color}
                      onClick={() => setNewEvent({...newEvent, color})}
                      style={{ width: '2rem', height: '2rem', borderRadius: '50%', cursor: 'pointer', transition: 'transform 0.18s', backgroundColor: color, transform: newEvent.color === color ? 'scale(1.15)' : 'scale(1)', boxShadow: newEvent.color === color ? `0 0 0 2px var(--bg-surface), 0 0 0 4px ${color}` : 'none' }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-3" style={{ marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowEventModal(false)} className="ev-btn ev-btn-secondary">İptal</button>
                <button type="submit" className="ev-btn ev-btn-primary">
                  <i className="fa-solid fa-check"></i>
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
