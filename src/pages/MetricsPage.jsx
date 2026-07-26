import { useEffect, useMemo, useRef, useState } from 'react';
import TrendChart from '../components/TrendChart.jsx';
import MultiTrendChart from '../components/MultiTrendChart.jsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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

function buildQuestionMetrics(entries, questions) {
  return questions.map((question) => {
    const points = buildQuestionPoints(entries, question.id);
    const values = points.map((point) => point.value);
    const average = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
    const latest = values.length ? values[values.length - 1] : 0;
    return { question, points, average, latest };
  });
}

export default function MetricsPage() {
  const reportRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const countEntries = (type) => entries.filter((entry) => entry.type === type).length;
  const averageScore = (type) => {
    const filtered = entries.filter((entry) => entry.type === type);
    if (!filtered.length) return 0;
    return Math.round(filtered.reduce((sum, entry) => sum + entry.totalScore, 0) / filtered.length);
  };

  const handleExport = async () => {
    if (isExporting) return;
    if (!reportRef.current) {
      setExportError('Could not find report content.');
      return;
    }
    setIsExporting(true);
    setExportError('');
    try {
      let sections = Array.from(reportRef.current.querySelectorAll('.report-export-section'));
      if (!sections.length) sections = [reportRef.current];

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const imgWidth = pageWidth - margin * 2;
      const pageInnerHeight = pageHeight - margin * 2;
      let isFirst = true;

      for (const section of sections) {
        const clone = section.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.left = '-9999px';
        clone.style.top = '0px';
        clone.style.zIndex = '99999';
        clone.style.pointerEvents = 'none';
        document.body.appendChild(clone);
        await new Promise((r) => setTimeout(r, 80));
        const canvas = await html2canvas(clone, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
        document.body.removeChild(clone);

        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (!isFirst) pdf.addPage();
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
    } catch (err) {
      console.error('PDF export failed', err);
      setExportError('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const [entries, setEntries] = useState([]);
  const [zoomCard, setZoomCard] = useState(null);
  const [activeTab, setActiveTab] = useState('combined');
  const depressionPagerRef = useRef(null);
  const anxietyPagerRef = useRef(null);

  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  const depressionEntries = useMemo(() => entries.filter((entry) => entry.type === 'depression'), [entries]);
  const anxietyEntries = useMemo(() => entries.filter((entry) => entry.type === 'anxiety'), [entries]);

  const depressionPoints = useMemo(() => buildPoints(depressionEntries), [depressionEntries]);
  const anxietyPoints = useMemo(() => buildPoints(anxietyEntries), [anxietyEntries]);
  const depressionQuestionMetrics = useMemo(() => buildQuestionMetrics(depressionEntries, depressionQuestions), [depressionEntries]);
  const anxietyQuestionMetrics = useMemo(() => buildQuestionMetrics(anxietyEntries, anxietyQuestions), [anxietyEntries]);

  const average = (items) => {
    if (!items.length) {
      return 0;
    }
    return Math.round(items.reduce((sum, entry) => sum + entry.totalScore, 0) / items.length);
  };

  const latestScore = (items) => {
    if (!items.length) {
      return 0;
    }
    const sorted = items.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted[0].totalScore;
  };

  const scrollPager = (ref, offset) => {
    if (ref.current) {
      ref.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const openZoom = (metric) => setZoomCard(metric);
  const closeZoom = () => setZoomCard(null);

  return (
    <div>
      <div className="card card-fade">
        <h2 className="heading">📐 Metrics Dashboard</h2>
        <p className="note soft-note">
          These values are the summary metrics for depression and anxiety entries. They remain visible while you switch chart views.
        </p>
        <div className="summary report-summary">
          <div className="summary-card soft-card">
            <strong>Depression entries</strong>
            <div>{depressionEntries.length}</div>
            <div className="note">Latest score: {latestScore(depressionEntries)}</div>
            <div className="note">Average score: {average(depressionEntries)}</div>
          </div>
          <div className="summary-card soft-card">
            <strong>Anxiety entries</strong>
            <div>{anxietyEntries.length}</div>
            <div className="note">Latest score: {latestScore(anxietyEntries)}</div>
            <div className="note">Average score: {average(anxietyEntries)}</div>
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
              <div className="field-error" style={{ marginTop: '1rem', textAlign: 'center' }}>{exportError}</div>
            )}
          </div>
      </div>

      <div className="card card-fade">
        <h2 className="heading">📈 Charts </h2>
        <div className="metrics-tabs">
          <button
            type="button"
            className={`button tab-button ${activeTab === 'combined' ? 'active' : ''}`}
            onClick={() => setActiveTab('combined')}
          >
            Combined
          </button>
          <button
            type="button"
            className={`button tab-button ${activeTab === 'depression' ? 'active' : ''}`}
            onClick={() => setActiveTab('depression')}
          >
            Depression
          </button>
          <button
            type="button"
            className={`button tab-button ${activeTab === 'anxiety' ? 'active' : ''}`}
            onClick={() => setActiveTab('anxiety')}
          >
            Anxiety
          </button>
        </div>
      </div>

      {activeTab === 'combined' && (
        <MultiTrendChart
          title="Depression vs Anxiety Total Score"
          series={[
            { name: 'Depression total', points: depressionPoints, color: '#2563eb' },
            { name: 'Anxiety total', points: anxietyPoints, color: '#dc2626' }
          ]}
        />
      )}

      {/* Hidden report capture for export */}
      <div id="report-capture" ref={reportRef} aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '900px', padding: '24px', background: '#ffffff', color: '#111827', pointerEvents: 'none', zIndex: -1 }}>
        <h2>Anonymized Mood Report</h2>
        <p style={{ marginTop: '16px', color: '#475569', lineHeight: 1.65 }}>This report includes an overview of tracked entries for depression and anxiety, together with weekly totals.</p>
        <div className="summary" style={{ marginTop: '24px' }}>
          <div className="summary-card soft-card"><strong>Depression entries</strong><div>{countEntries('depression')}</div><div className="note">Avg score: {averageScore('depression')}</div></div>
          <div className="summary-card soft-card"><strong>Anxiety entries</strong><div>{countEntries('anxiety')}</div><div className="note">Avg score: {averageScore('anxiety')}</div></div>
        </div>
        <div className="report-export-section" data-title="Combined Trend" style={{ marginTop: '24px' }}>
          <h3>Combined Trend</h3>
          <MultiTrendChart title="Depression vs Anxiety Total Score" series={[{ name: 'Depression total', points: depressionPoints, color: '#2563eb' }, { name: 'Anxiety total', points: anxietyPoints, color: '#dc2626' }]} />
        </div>
        <div className="report-export-section" data-title="Depression Trend" style={{ marginTop: '24px' }}>
          <h3>Depression Trend</h3>
          <TrendChart title="Depression Total Score Over Time" points={depressionPoints} color="#2563eb" />
        </div>
        <div className="report-export-section" data-title="Anxiety Trend" style={{ marginTop: '24px' }}>
          <h3>Anxiety Trend</h3>
          <TrendChart title="Anxiety Total Score Over Time" points={anxietyPoints} color="#dc2626" />
        </div>
        <div className="report-export-section" data-title="Depression Question Trends" style={{ marginTop: '24px' }}>
          <h3>Depression Question Trends</h3>
          {depressionQuestionMetrics.map((metric) => (
            <div key={`dep-q-${metric.question.id}`} style={{ marginTop: '12px' }}>
              <h4 style={{ margin: '6px 0' }}>{metric.question.id}. {metric.question.text}</h4>
              <div className="metric-summary">Latest rating {metric.latest} · Avg rating {metric.average}</div>
              <TrendChart title={`Depression Q${metric.question.id}`} points={metric.points} color="#2563eb" />
            </div>
          ))}
        </div>
        <div className="report-export-section" data-title="Anxiety Question Trends" style={{ marginTop: '24px' }}>
          <h3>Anxiety Question Trends</h3>
          {anxietyQuestionMetrics.map((metric) => (
            <div key={`anx-q-${metric.question.id}`} style={{ marginTop: '12px' }}>
              <h4 style={{ margin: '6px 0' }}>{metric.question.id}. {metric.question.text}</h4>
              <div className="metric-summary">Latest rating {metric.latest} · Avg rating {metric.average}</div>
              <TrendChart title={`Anxiety Q${metric.question.id}`} points={metric.points} color="#dc2626" />
            </div>
          ))}
        </div>
      </div>

      {activeTab === 'depression' && (
        <>
          <TrendChart title="Depression Total Score Over Time" points={depressionPoints} color="#2563eb" />
          <div className="card horizontal-pager-card">
            <h2 className="heading">Depression Question Trends</h2>
            <div className="pager-shell">
              <button className="button secondary pager-side" type="button" onClick={() => scrollPager(depressionPagerRef, -520)}>◀</button>
              <div className="horizontal-pager" ref={depressionPagerRef}>
                {depressionQuestionMetrics.map((metric) => (
                  <div key={metric.question.id} className="horizontal-page" onClick={() => openZoom({
                    title: `Depression Q${metric.question.id}: ${metric.question.text}`,
                    points: metric.points,
                    color: '#2563eb',
                    latest: metric.latest,
                    average: metric.average
                  })}>
                    <h3>{metric.question.id}. {metric.question.text}</h3>
                    <div className="metric-summary">Latest rating {metric.latest} · Avg rating {metric.average}</div>
                    <TrendChart title={`Depression Q${metric.question.id}`} points={metric.points} color="#2563eb" />
                  </div>
                ))}
              </div>
              <button className="button secondary pager-side" type="button" onClick={() => scrollPager(depressionPagerRef, 520)}>▶</button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'anxiety' && (
        <>
          <TrendChart title="Anxiety Total Score Over Time" points={anxietyPoints} color="#dc2626" />
          <div className="card horizontal-pager-card">
            <h2 className="heading">Anxiety Question Trends</h2>
            <div className="pager-shell">
              <button className="button secondary pager-side" type="button" onClick={() => scrollPager(anxietyPagerRef, -520)}>◀</button>
              <div className="horizontal-pager" ref={anxietyPagerRef}>
                {anxietyQuestionMetrics.map((metric) => (
                  <div key={metric.question.id} className="horizontal-page" onClick={() => openZoom({
                    title: `Anxiety Q${metric.question.id}: ${metric.question.text}`,
                    points: metric.points,
                    color: '#dc2626',
                    latest: metric.latest,
                    average: metric.average
                  })}>
                    <h3>{metric.question.id}. {metric.question.text}</h3>
                    <div className="metric-summary">Latest rating {metric.latest} · Avg rating {metric.average}</div>
                    <TrendChart title={`Anxiety Q${metric.question.id}`} points={metric.points} color="#dc2626" />
                  </div>
                ))}
              </div>
              <button className="button secondary pager-side" type="button" onClick={() => scrollPager(anxietyPagerRef, 520)}>▶</button>
            </div>
          </div>
        </>
      )}

      {zoomCard && (
        <div className="modal-overlay" onClick={closeZoom}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={closeZoom}>×</button>
            <h2 className="modal-title">{zoomCard.title}</h2>
            <div className="modal-details">
              <div className="note">Latest rating: {zoomCard.latest}</div>
              <div className="note">Average rating: {zoomCard.average}</div>
            </div>
            <TrendChart title="Zoomed trend" points={zoomCard.points} color={zoomCard.color} />
          </div>
        </div>
      )}
    </div>
  );
}
