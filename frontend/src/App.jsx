import React from 'react';

// students page. add/edit/delete + filters + stats
export default function App() {

  const [data, setData] = React.useState([]);
  const [all, setAll] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [cls, setCls] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [total, setTotal] = React.useState(0);
  const [classes, setClasses] = React.useState([]);
  const [stats, setStats] = React.useState({});
  const [showModal, setShowModal] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [fName, setFName] = React.useState("");
  const [fClass, setFClass] = React.useState("");
  const [fGrade, setFGrade] = React.useState("");

  React.useEffect(() => {
    fetch("http://localhost:8080/api/students?page=" + page + "&size=10")
      .then(r => r.json())
      .then(d => {
        console.log("got", d);
        setData(d.data);
        setAll(d.data);
        setTotal(d.total);
      });
    fetch("http://localhost:8080/api/classes")
      .then(r => r.json())
      .then(d => { setClasses(d); });
    fetch("http://localhost:8080/api/stats/passing")
      .then(r => r.json())
      .then(d => { console.log("stats", d); setStats(d); });
  }, [page]);

  function doSearch(v) {
    setSearch(v);
    // filter on client
    var x = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].fullName.toLowerCase().indexOf(v.toLowerCase()) != -1) {
        if (cls == "" || all[i].className == cls) {
          x.push(all[i]);
        }
      }
    }
    setData(x);
  }

  function doClass(v) {
    setCls(v);
    fetch("http://localhost:8080/api/students?class=" + v + "&search=" + search + "&page=0&size=10")
      .then(r => r.json())
      .then(d => {
        console.log("got2", d);
        setData(d.data);
        setTotal(d.total);
      });
    fetch("http://localhost:8080/api/stats/passing?class=" + v)
      .then(r => r.json())
      .then(d => { setStats(d); });
  }

  function openAdd() {
    setEditing(null);
    setFName("");
    setFClass("");
    setFGrade("");
    setShowModal(true);
  }

  function openEdit(s) {
    setEditing(s.id);
    setFName(s.fullName);
    setFClass(s.className);
    setFGrade(s.averageGrade);
    setShowModal(true);
  }

  function save() {
    if (editing == null) {
      fetch("http://localhost:8080/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fName, className: fClass, averageGrade: fGrade })
      })
        .then(r => r.json())
        .then(d => {
          console.log("created", d);
          setShowModal(false);
          setPage(0);
          // reload
          fetch("http://localhost:8080/api/students?page=0&size=10")
            .then(r => r.json())
            .then(d => { setData(d.data); setAll(d.data); setTotal(d.total); });
        });
    } else {
      fetch("http://localhost:8080/api/students/" + editing, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fName, className: fClass, averageGrade: fGrade })
      })
        .then(r => r.json())
        .then(d => {
          console.log("updated", d);
          setShowModal(false);
          fetch("http://localhost:8080/api/students?page=" + page + "&size=10")
            .then(r => r.json())
            .then(d => { setData(d.data); setAll(d.data); setTotal(d.total); });
        });
    }
  }

  function del(id) {
    fetch("http://localhost:8080/api/students/" + id, { method: "DELETE" })
      .then(r => r.text())
      .then(d => {
        console.log("deleted", d);
        // remove from list
        var x = [];
        for (var i = 0; i < data.length; i++) {
          if (data[i].id != id) x.push(data[i]);
        }
        setData(x);
      });
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1 style={{ color: "#333" }}>Students</h1>

      <div style={{ marginBottom: "10px" }}>
        Passing: {stats.passing} | Failing: {stats.failing}
      </div>

      <input
        style={{ padding: "8px", border: "1px solid #ccc", marginRight: "10px" }}
        placeholder="search..."
        value={search}
        onChange={e => doSearch(e.target.value)}
      />
      <select
        style={{ padding: "8px", border: "1px solid #ccc", marginRight: "10px" }}
        value={cls}
        onChange={e => doClass(e.target.value)}>
        <option value="">All classes</option>
        {classes.map((c, i) => (
          <option key={i} value={c}>{c}</option>
        ))}
      </select>
      <button style={{ padding: "8px 16px", background: "#1F4E78", color: "#fff", border: "none" }} onClick={openAdd}>
        Add student
      </button>

      <table style={{ marginTop: "20px", width: "100%", borderCollapse: "collapse" }}>
        <tr style={{ background: "#eee" }}>
          <td style={{ padding: "8px", border: "1px solid #ccc" }}>ID</td>
          <td style={{ padding: "8px", border: "1px solid #ccc" }}>Name</td>
          <td style={{ padding: "8px", border: "1px solid #ccc" }}>Class</td>
          <td style={{ padding: "8px", border: "1px solid #ccc" }}>Average</td>
          <td style={{ padding: "8px", border: "1px solid #ccc" }}>Actions</td>
        </tr>
        {data.map((s, i) => (
          <tr key={i} style={{ background: s.averageGrade < 10 ? "#fdd" : "#fff" }}>
            <td style={{ padding: "8px", border: "1px solid #ccc" }}>{s.id}</td>
            <td style={{ padding: "8px", border: "1px solid #ccc" }}>{s.fullName}</td>
            <td style={{ padding: "8px", border: "1px solid #ccc" }}>{s.className}</td>
            <td style={{ padding: "8px", border: "1px solid #ccc" }}>{s.averageGrade}</td>
            <td style={{ padding: "8px", border: "1px solid #ccc" }}>
              <button onClick={() => openEdit(s)}>Edit</button>
              <button onClick={() => del(s.id)} style={{ marginLeft: "5px" }}>Delete</button>
            </td>
          </tr>
        ))}
      </table>

      <div style={{ marginTop: "20px" }}>
        <button onClick={() => setPage(page - 1)}>Prev</button>
        <span style={{ margin: "0 10px" }}>page {page}</span>
        <button onClick={() => setPage(page + 1)}>Next</button>
      </div>

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)" }}>
          <div style={{ background: "#fff", width: "400px", margin: "100px auto", padding: "20px" }}>
            <h2>{editing == null ? "Add" : "Edit"} student</h2>
            <div style={{ marginBottom: "10px" }}>
              <input style={{ padding: "8px", width: "100%" }} placeholder="name"
                value={fName} onChange={e => setFName(e.target.value)} />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <input style={{ padding: "8px", width: "100%" }} placeholder="class"
                value={fClass} onChange={e => setFClass(e.target.value)} />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <input style={{ padding: "8px", width: "100%" }} placeholder="grade"
                value={fGrade} onChange={e => setFGrade(e.target.value)} />
            </div>
            <button onClick={save} style={{ padding: "8px 16px", background: "#1F4E78", color: "#fff", border: "none" }}>
              Save
            </button>
            <button onClick={() => setShowModal(false)} style={{ marginLeft: "10px", padding: "8px 16px" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
