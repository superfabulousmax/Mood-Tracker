import { useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import TrendChart from '../components/TrendChart.jsx';
import MultiTrendChart from '../components/MultiTrendChart.jsx';
import { depressionQuestions, anxietyQuestions } from '../data/questions.js';
import { loadEntries } from '../storage/localStorage.js';

function buildPoints(entries) {
  return entries
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((entry) => ({ date: entry.date, value: entry.totalScore }));
}

function buildQuestionPoints(entries, questionId) {
  return entries
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((entry) => ({ date: entry.date, value: Number(entry.answers?.[questionId] ?? 0) }));
}

function buildWeeklyTotals(entries) {
  const grouped = entries.reduce((acc, entry) => {
    const date = new Date(entry.date);
    const year = date.getUTCFullYear();
    const week = Math.ceil(((date - new Date(year, 0, 1)) / 86400000 + new Date(year, 0, 1).getUTCDay() + 1) / 7);
    const key = `${year}-W${week}`;

    acc[key] = acc[key] || { week: key, depression: 0, anxiety: 0, count: 0 };
    acc[key][entry.type] += entry.totalScore;
    acc[key].count += 1;
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => (a.week > b.week ? 1 : -1));
}

export default function ReportPage() {
  const [entries, setEntries] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const reportRef = useRef(null);

  useEffect(() => {
    const loaded = loadEntries();
    setEntries(loaded);
  }, []);

  const weeklyTotals = useMemo(() => buildWeeklyTotals(entries), [entries]);
  const depressionEntries = useMemo(() => entries.filter((entry) => entry.type === 'depression'), [entries]);
  const anxietyEntries = useMemo(() => entries.filter((entry) => entry.type === 'anxiety'), [entries]);
  const depressionPoints = useMemo(() => buildPoints(depressionEntries), [depressionEntries]);
  const anxietyPoints = useMemo(() => buildPoints(anxietyEntries), [anxietyEntries]);
  const depressionQuestionSeries = useMemo(
    () => depressionQuestions.map((question) => ({
      ...question,
      points: buildQuestionPoints(depressionEntries, question.id)
    })),
    [depressionEntries]
  );
  const anxietyQuestionSeries = useMemo(
    () => anxietyQuestions.map((question) => ({
      ...question,
      points: buildQuestionPoints(anxietyEntries, question.id)
    })),
    [anxietyEntries]
  );

  const countEntries = (type) => entries.filter((entry) => entry.type === type).length;
  const averageScore = (type) => {
    const filtered = entries.filter((entry) => entry.type === type);
    if (!filtered.length) return 0;
    return Math.round(filtered.reduce((sum, entry) => sum + entry.totalScore, 0) / filtered.length);
  };

  const handleExport = async () => {
    if (isExporting) {
      return;
    }

    if (!reportRef.current) {
      setExportError('Could not find report content.');
      return;
    }

    setIsExporting(true);
    setExportError('');

    try {
      let sections = Array.from(reportRef.current.querySelectorAll('.report-export-section'));
      if (!sections.length) {
        sections = [reportRef.current];
      }

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const imgWidth = pageWidth - margin * 2;
      const pageInnerHeight = pageHeight - margin * 2;
      let isFirst = true;

      for (const section of sections) {
        // Clone the section into an offscreen container so we can capture it
        const clone = section.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.left = '-9999px';
        clone.style.top = '0px';
        clone.style.zIndex = '99999';
        clone.style.pointerEvents = 'none';
        document.body.appendChild(clone);
        // allow browser to render the clone
        await new Promise((r) => setTimeout(r, 80));

        const canvas = await html2canvas(clone, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true
        });
        document.body.removeChild(clone);

        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (!isFirst) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);

        let remainingHeight = imgHeight - pageInnerHeight;
        while (remainingHeight > 0) {
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, margin - (imgHeight - remainingHeight), imgWidth, imgHeight);
          remainingHeight -= pageInnerHeight;
        }

        isFirst = false;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      pdf.save(`mood-report-${timestamp}.pdf`);
    } catch (error) {
      console.error('PDF export failed', error);
      setExportError('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <div className="card card-fade">
        <h2 className="heading">Metrics Dashboard</h2>
        <p className="note soft-note">
          These values are the summary metrics for depression and anxiety entries.
        </p>
        <div className="summary report-summary">
          <div className="summary-card soft-card">
            <strong>Depression entries</strong>
            <div>{countEntries('depression')}</div>
            <div className="note">Avg score: {averageScore('depression')}</div>
          </div>
          <div className="summary-card soft-card">
            <strong>Anxiety entries</strong>
            <div>{countEntries('anxiety')}</div>
            <div className="note">Avg score: {averageScore('anxiety')}</div>
          </div>
        </div>
      </div>

      <div className="card card-fade">
        <div className="report-action" style={{ justifyContent: 'center' }}>
          <button className="button button-soft" onClick={handleExport} disabled={isExporting}>
            <span className="button-icon" aria-hidden="true">📎</span>
            {isExporting ? 'Preparing…' : 'Export PDF Report'}
          </button>
        </div>
        {exportError && (
          <div className="field-error" style={{ marginTop: '1rem', textAlign: 'center' }}>
            {exportError}
          </div>
        )}
      </div>

      <div
        id="report-capture"
        ref={reportRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '900px',
          padding: '24px',
          background: '#ffffff',
          color: '#111827',
          pointerEvents: 'none',
          zIndex: -1
        }}
      >
        <h2>Anonymized Mood Report</h2>
        <p style={{ marginTop: '16px', color: '#475569', lineHeight: 1.65 }}>
          This report includes an overview of tracked entries for depression and anxiety, together with weekly totals.
        </p>
        <div className="summary" style={{ marginTop: '24px' }}>
          <div className="summary-card soft-card">
            <strong>Depression entries</strong>
            <div>{countEntries('depression')}</div>
            <div className="note">Avg score: {averageScore('depression')}</div>
          </div>
          <div className="summary-card soft-card">
            <strong>Anxiety entries</strong>
            <div>{countEntries('anxiety')}</div>
            <div className="note">Avg score: {averageScore('anxiety')}</div>
          </div>
        </div>
        <div className="report-export-section" data-title="Combined Trend" style={{ marginTop: '24px' }}>
          <h3>Combined Trend</h3>
          <MultiTrendChart
            title="Depression vs Anxiety Total Score"
            series={[
              { name: 'Depression total', points: depressionPoints, color: '#2563eb' },
              { name: 'Anxiety total', points: anxietyPoints, color: '#dc2626' }
            ]}
          />
        </div>
        <div className="report-export-section" data-title="Depression Trend" style={{ marginTop: '24px' }}>
          <h3>Depression Trend</h3>
          <TrendChart title="Depression Total Score Over Time" points={depressionPoints} color="#2563eb" />
        </div>
        <div className="report-export-section" data-title="Anxiety Trend" style={{ marginTop: '24px' }}>
          <h3>Anxiety Trend</h3>
          <TrendChart title="Anxiety Total Score Over Time" points={anxietyPoints} color="#dc2626" />
        </div>
        {depressionQuestionSeries.map((question) => (
          <div
            key={`report-dep-${question.id}`}
            className="report-export-section"
            data-title={`Depression Q${question.id}: ${question.text}`}
            style={{ marginTop: '24px' }}
          >
            <h3>Depression Q{question.id}</h3>
            <p style={{ color: '#475569', lineHeight: 1.5 }}>{question.text}</p>
            <TrendChart title={`Depression Q${question.id}`} points={question.points} color="#2563eb" />
          </div>
        ))}
        {anxietyQuestionSeries.map((question) => (
          <div
            key={`report-anx-${question.id}`}
            className="report-export-section"
            data-title={`Anxiety Q${question.id}: ${question.text}`}
            style={{ marginTop: '24px' }}
          >
            <h3>Anxiety Q{question.id}</h3>
            <p style={{ color: '#475569', lineHeight: 1.5 }}>{question.text}</p>
            <TrendChart title={`Anxiety Q${question.id}`} points={question.points} color="#dc2626" />
          </div>
        ))}
        <div className="report-export-section" data-title="Weekly Summary" style={{ marginTop: '24px' }}>
          <h3>Weekly Summary</h3>
          <table className="table report-table">
            <thead>
              <tr>
                <th>Week</th>
                <th>Depression total</th>
                <th>Anxiety total</th>
                <th>Entries</th>
              </tr>
            </thead>
            <tbody>
              {weeklyTotals.map((week) => (
                <tr key={week.week}>
                  <td>{week.week}</td>
                  <td>{week.depression}</td>
                  <td>{week.anxiety}</td>
                  <td>{week.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
