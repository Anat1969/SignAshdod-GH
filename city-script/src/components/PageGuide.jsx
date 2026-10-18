// "מה עושים כאן": מה כבר נעשה ומה נשאר, בשורה אחת מעל התוכן.
// steps: [[טקסט, נעשה?], ...]. הצעד הראשון שלא נעשה מודגש.
export default function PageGuide({ title = 'מה עושים כאן', steps, note }) {
  const current = steps.findIndex(([, done]) => !done)
  const doneCount = steps.filter(([, d]) => d).length
  return (
    <section className="pguide" aria-label={title}>
      <div className="pguide-head">
        <span className="eyebrow">{title}</span>
        <span className="caption">{doneCount === steps.length ? 'הכול הושלם' : `${doneCount} מתוך ${steps.length} נעשו`}</span>
      </div>
      <ol className="pguide-steps">
        {steps.map(([t, done], i) => (
          <li key={i} className={done ? 'is-done' : i === current ? 'is-now' : ''}>
            <span className="pguide-n" aria-hidden="true">{done ? '' : i + 1}</span>
            <span>{t}<span className="sr-only">{done ? ' (נעשה)' : i === current ? ' (הצעד הבא)' : ''}</span></span>
          </li>
        ))}
      </ol>
      {note && <p className="caption pguide-note">{note}</p>}
    </section>
  )
}
