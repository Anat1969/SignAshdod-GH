import { RESULT } from '../lib/check'
export const Tag = ({ status, children }) => <span className={`tag ${RESULT[status]?.cls || 'tag-info'}`}>{children || RESULT[status]?.label}</span>
export const Section = ({ s }) => <span className="section-ref">סעיף {s}</span>
export function Loading() { return <div className="page"><p className="muted">טוען נתונים...</p></div> }
export function SchemaNotice() {
  return <div className="notice notice-warn">הטבלאות של כתב העיר עדיין לא הוקמו במסד הנתונים. התוכן מוצג מתוך המדיניות, אבל שמירה עדיין אינה אפשרית.</div>
}
