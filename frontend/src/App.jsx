import React, { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:8080/api';
const PAGE_SIZE = 10;

// students page. add/edit/delete + filters + stats
export default function App() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [cls, setCls] = useState('');
  const [page, setPage] = useState(0);
  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState({ passing: 0, failing: 0 });
  const [loadError, setLoadError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [fName, setFName] = useState('');
  const [fClass, setFClass] = useState('');
  const [fGrade, setFGrade] = useState('');
  const [saveError, setSaveError] = useState('');

  // Load the current page of students + the passing/failing stats, using whatever search and class
  // filter are active. Everything goes through the backend so search, filter and pagination agree.
  const load = useCallback(() => {
    const params = new URLSearchParams({ page, size: PAGE_SIZE });
    if (search) params.set('search', search);
    if (cls) params.set('class', cls);

    fetch(`${API}/students?${params}`)
      .then(r => r.json())
      .then(d => {
        setData(d.data);
        setTotal(d.total);
        setLoadError('');
      })
      .catch(() => setLoadError('Could not load students. Is the backend running?'));

    fetch(`${API}/stats/passing${cls ? `?class=${encodeURIComponent(cls)}` : ''}`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, [page, search, cls]);

  useEffect(() => { load(); }, [load]);

  // Class list for the dropdown only changes when students are added/removed, but loading it once is fine.
  useEffect(() => {
    fetch(`${API}/classes`)
      .then(r => r.json())
      .then(setClasses)
      .catch(() => {});
  }, []);

  function onSearchChange(v) {
    setSearch(v);
    setPage(0); // a new search starts from the first page
  }

  function onClassChange(v) {
    setCls(v);
    setPage(0);
  }

  function openAdd() {
    setEditingId(null);
    setFName('');
    setFClass('');
    setFGrade('');
    setSaveError('');
    setShowModal(true);
  }

  function openEdit(s) {
    setEditingId(s.id);
    setFName(s.fullName);
    setFClass(s.className);
    setFGrade(String(s.averageGrade));
    setSaveError('');
    setShowModal(true);
  }

  async function save() {
    setSaveError('');
    const isEdit = editingId != null;
    const body = JSON.stringify({ fullName: fName, className: fClass, averageGrade: fGrade });

    try {
      const res = await fetch(`${API}/students${isEdit ? `/${editingId}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError(err.message || 'Could not save. Please check the fields.');
        return;
      }
      setShowModal(false);
      load();
    } catch {
      setSaveError('Network error. Is the backend running?');
    }
  }

  function del(id) {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    fetch(`${API}/students/${id}`, { method: 'DELETE' })
      .then(() => load())
      .catch(() => setLoadError('Could not delete the student.'));
  }

  const lastPage = total === 0 ? 0 : Math.ceil(total / PAGE_SIZE) - 1;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#333' }}>Students</h1>

      <div style={{ marginBottom: '10px' }}>
        Passing: {stats.passing} | Failing: {stats.failing}
      </div>

      {loadError && <div style={{ color: 'red', marginBottom: '10px' }}>{loadError}</div>}

      <input
        style={{ padding: '8px', border: '1px solid #ccc', marginRight: '10px' }}
        placeholder="search..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
      />
      <select
        style={{ padding: '8px', border: '1px solid #ccc', marginRight: '10px' }}
        value={cls}
        onChange={e => onClassChange(e.target.value)}>
        <option value="">All classes</option>
        {classes.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <button style={{ padding: '8px 16px', background: '#1F4E78', color: '#fff', border: 'none' }} onClick={openAdd}>
        Add student
      </button>

      <table style={{ marginTop: '20px', width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={cellStyle}>ID</th>
            <th style={cellStyle}>Name</th>
            <th style={cellStyle}>Class</th>
            <th style={cellStyle}>Average</th>
            <th style={cellStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(s => (
            <tr key={s.id} style={{ background: s.averageGrade < 10 ? '#fdd' : '#fff' }}>
              <td style={cellStyle}>{s.id}</td>
              <td style={cellStyle}>{s.fullName}</td>
              <td style={cellStyle}>{s.className}</td>
              <td style={cellStyle}>{s.averageGrade}</td>
              <td style={cellStyle}>
                <button onClick={() => openEdit(s)}>Edit</button>
                <button onClick={() => del(s.id)} style={{ marginLeft: '5px' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => setPage(page - 1)} disabled={page <= 0}>Prev</button>
        <span style={{ margin: '0 10px' }}>
          page {total === 0 ? 0 : page + 1} of {total === 0 ? 0 : lastPage + 1}
        </span>
        <button onClick={() => setPage(page + 1)} disabled={page >= lastPage}>Next</button>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)' }}>
          <div style={{ background: '#fff', width: '400px', margin: '100px auto', padding: '20px' }}>
            <h2>{editingId == null ? 'Add' : 'Edit'} student</h2>
            <div style={{ marginBottom: '10px' }}>
              <input style={inputStyle} placeholder="name"
                value={fName} onChange={e => setFName(e.target.value)} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input style={inputStyle} placeholder="class"
                value={fClass} onChange={e => setFClass(e.target.value)} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input style={inputStyle} placeholder="grade (0-20)"
                value={fGrade} onChange={e => setFGrade(e.target.value)} />
            </div>
            {saveError && <div style={{ color: 'red', marginBottom: '10px' }}>{saveError}</div>}
            <button onClick={save} style={{ padding: '8px 16px', background: '#1F4E78', color: '#fff', border: 'none' }}>
              Save
            </button>
            <button onClick={() => setShowModal(false)} style={{ marginLeft: '10px', padding: '8px 16px' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const cellStyle = { padding: '8px', border: '1px solid #ccc' };
const inputStyle = { padding: '8px', width: '100%', boxSizing: 'border-box' };
