import { useEffect, useState } from 'react';
import QuestionnaireForm from '../components/QuestionnaireForm.jsx';
import { anxietyQuestions } from '../data/questions.js';
import { loadEntries, saveEntries } from '../storage/localStorage.js';

export default function AnxietyPage() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    setEntries(loadEntries().filter((entry) => entry.type === 'anxiety'));
  }, []);

  const handleSave = (entry) => {
    const rawEntries = loadEntries();
    const existing = rawEntries[rawEntries.length - 1];
    if (
      existing &&
      existing.type === entry.type &&
      existing.date === entry.date &&
      existing.totalScore === entry.totalScore &&
      JSON.stringify(existing.answers) === JSON.stringify(entry.answers)
    ) {
      return;
    }

    const updated = [...rawEntries, entry];
    saveEntries(updated);
    setEntries(updated.filter((item) => item.type === 'anxiety'));
  };

  const handleDelete = (entryId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }
    const rawEntries = loadEntries().filter((entry) => entry.id !== entryId);
    saveEntries(rawEntries);
    setEntries(rawEntries.filter((entry) => entry.type === 'anxiety'));
  };

  return (
    <div>
      <QuestionnaireForm title="Anxiety" questions={anxietyQuestions} onSave={handleSave} />
      <div className="card">
        <h2 className="heading">Saved Anxiety Entries</h2>
        {entries.length === 0 ? (
          <p className="note">No anxiety entries have been saved yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Total score</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {entries
                .slice()
                .sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date))
                .map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.date}</td>
                    <td>{entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString() : '—'}</td>
                    <td>{entry.totalScore}</td>
                    <td>
                      <button type="button" className="button danger" onClick={() => handleDelete(entry.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
