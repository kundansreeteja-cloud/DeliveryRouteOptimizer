import React, { useState } from 'react';

export default function LocationTable({ locations, setLocations }) {
  const [newName, setNewName] = useState('');
  const [newX, setNewX] = useState('');
  const [newY, setNewY] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  function validate(name, x, y, excludeId = null) {
    if (!name.trim()) return 'Location name cannot be empty.';
    const dup = locations.find(
      (l) => l.name.toLowerCase() === name.trim().toLowerCase() && l.id !== excludeId
    );
    if (dup) return `Name "${name.trim()}" already exists.`;
    if (isNaN(parseFloat(x)) || x === '') return 'X coordinate must be a valid number.';
    if (isNaN(parseFloat(y)) || y === '') return 'Y coordinate must be a valid number.';
    return null;
  }

  function handleAdd() {
    const err = validate(newName, newX, newY);
    if (err) { setError(err); return; }
    setError('');
    setLocations((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newName.trim(),
        x: parseFloat(newX),
        y: parseFloat(newY),
      },
    ]);
    setNewName('');
    setNewX('');
    setNewY('');
  }

  function handleRemove(id) {
    if (locations.length <= 2) {
      setError('At least 2 locations are required.');
      return;
    }
    setError('');
    setLocations((prev) => prev.filter((l) => l.id !== id));
  }

  function startEdit(loc) {
    setEditingId(loc.id);
    setEditValues({ name: loc.name, x: String(loc.x), y: String(loc.y) });
    setError('');
  }

  function saveEdit(id) {
    const { name, x, y } = editValues;
    const err = validate(name, x, y, id);
    if (err) { setError(err); return; }
    setError('');
    setLocations((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, name: name.trim(), x: parseFloat(x), y: parseFloat(y) }
          : l
      )
    );
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError('');
  }

  return (
    <div className="card">
      <h2 className="card-title">📍 Customer Locations</h2>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper">
        <table className="location-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>X</th>
              <th>Y</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc, idx) => (
              <tr key={loc.id} className={editingId === loc.id ? 'editing-row' : ''}>
                <td className="row-num">{idx + 1}</td>
                {editingId === loc.id ? (
                  <>
                    <td>
                      <input
                        className="inline-input"
                        value={editValues.name}
                        onChange={(e) =>
                          setEditValues((v) => ({ ...v, name: e.target.value }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="inline-input coord-input"
                        type="number"
                        value={editValues.x}
                        onChange={(e) =>
                          setEditValues((v) => ({ ...v, x: e.target.value }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="inline-input coord-input"
                        type="number"
                        value={editValues.y}
                        onChange={(e) =>
                          setEditValues((v) => ({ ...v, y: e.target.value }))
                        }
                      />
                    </td>
                    <td className="action-cell">
                      <button className="btn btn-success btn-sm" onClick={() => saveEdit(loc.id)}>
                        ✓ Save
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>
                        ✕
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="name-cell">{loc.name}</td>
                    <td className="coord-cell">{loc.x}</td>
                    <td className="coord-cell">{loc.y}</td>
                    <td className="action-cell">
                      <button className="btn btn-outline btn-sm" onClick={() => startEdit(loc)}>
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemove(loc.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="add-location-row">
        <input
          className="form-input"
          placeholder="Location name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <input
          className="form-input coord-input"
          placeholder="X"
          type="number"
          value={newX}
          onChange={(e) => setNewX(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <input
          className="form-input coord-input"
          placeholder="Y"
          type="number"
          value={newY}
          onChange={(e) => setNewY(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add Location
        </button>
      </div>
    </div>
  );
}
