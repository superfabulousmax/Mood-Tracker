import { useEffect, useMemo, useRef, useState } from 'react';

const scaleOptions = [
  { value: null, label: '—' },
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Sometimes' },
  { value: 2, label: 'Frequently' },
  { value: 3, label: 'Most of the time' }
];

export default function QuestionnaireForm({ title, questions, onSave }) {
  const today = new Date().toISOString().slice(0, 10);
  const draftKey = `mood-tracker-draft-${title.toLowerCase()}`;
  const defaultAnswers = questions.reduce((acc, question) => ({ ...acc, [question.id]: null }), {});

  const [date, setDate] = useState(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        const saved = JSON.parse(raw);
        return saved?.date || today;
      }
    } catch (error) {
      console.warn('Unable to load draft date', error);
    }
    return today;
  });

  const [dateError, setDateError] = useState('');
  const [formError, setFormError] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [answers, setAnswers] = useState(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        const saved = JSON.parse(raw);
        return { ...defaultAnswers, ...(saved?.answers ?? {}) };
      }
    } catch (error) {
      console.warn('Unable to load draft answers', error);
    }
    return defaultAnswers;
  });
  const [isSaving, setIsSaving] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(draftKey, JSON.stringify({ date, answers }));
    } catch (error) {
      console.warn('Unable to save draft', error);
    }
  }, [date, answers, draftKey]);

  const totalScore = useMemo(
    () => Object.values(answers).reduce((sum, value) => sum + Number(value ?? 0), 0),
    [answers]
  );

  const isComplete = questions.every((question) => answers[question.id] !== null);

  const handleAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setFormError('');
  };

  const handleDateChange = (value) => {
    if (value > today) {
      setDateError('Date cannot be in the future.');
      return;
    }
    setDateError('');
    setDate(value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (submittingRef.current) {
      return;
    }

    if (date > today) {
      setDateError('Date cannot be in the future.');
      return;
    }

    if (!isComplete) {
      setShowValidation(true);
      setFormError('Please answer every question before saving.');
      return;
    }

    setShowValidation(false);
    submittingRef.current = true;
    setIsSaving(true);

    onSave({
      id: `${title}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: title.toLowerCase(),
      date,
      createdAt: new Date().toISOString(),
      answers,
      totalScore
    });

    setTimeout(() => {
      submittingRef.current = false;
      setIsSaving(false);
      setAnswers(defaultAnswers);
      setFormError('');
      setShowValidation(false);
      try {
        window.localStorage.removeItem(draftKey);
      } catch (error) {
        console.warn('Unable to clear draft', error);
      }
    }, 800);
  };

  return (
    <div className="card">
      <h2 className="heading">{title}</h2>
      <form onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="entry-date">Entry date</label>
          <input
            id="entry-date"
            type="date"
            className="input"
            value={date}
            max={today}
            onChange={(event) => handleDateChange(event.target.value)}
          />
          {dateError && <div className="field-error">{dateError}</div>}
        </div>
        {questions.map((question, index) => {
          const isUnfilled = showValidation && answers[question.id] === null;
          return (
            <div className={`field-group question-row ${isUnfilled ? 'unfilled-answer' : ''}`} key={question.id}>
              <div>
                <label htmlFor={`question-${question.id}`}>
                  {index + 1}. {question.text}
                </label>
              </div>
              <div className="button-group">
                {scaleOptions.map((option) => {
                  const isPlaceholder = option.value === null;
                  const isSelected = answers[question.id] === option.value;
                  const buttonClasses = [
                    'button',
                    'score-button',
                    isSelected ? (isPlaceholder ? 'placeholder-selected' : 'selected') : '',
                    isPlaceholder ? 'placeholder' : ''
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <button
                      key={String(option.value)}
                      type="button"
                      className={buttonClasses}
                      onClick={() => handleAnswer(question.id, option.value)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {isUnfilled && <div className="field-error">Please select an answer for this question.</div>}
            </div>
          );
        })}
        {formError && <div className="field-error">{formError}</div>}
        <div className="field-group">
          <label>Total score</label>
          <div>{totalScore}</div>
        </div>
        <button type="submit" className="button" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save Entry'}
        </button>
      </form>
    </div>
  );
}
