import { useState } from 'react';
import { Building2, Loader2, Mail, ArrowRight } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

export default function Login() {
  const { reloadUser } = useAuth();
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async (e) => {
    e?.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      const id = await base44.auth.sendEmailCode(trimmed);
      setUserId(id);
      setStep('code');
    } catch (err) {
      console.error(err);
      setError('שליחת הקוד נכשלה. בדקו את כתובת המייל ונסו שוב.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e?.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      await base44.auth.verifyEmailCode(userId, trimmed);
      await reloadUser(); // flips the app to the authenticated view
    } catch (err) {
      console.error(err);
      setError('הקוד שגוי או שפג תוקפו. נסו שוב.');
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="font-heebo">
      <AuthLayout
        icon={Building2}
        title="עיריית אשדוד"
        subtitle="מערכת ניהול בקשות שילוט"
      >
        {step === 'email' ? (
          <form onSubmit={sendCode} className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              הזינו כתובת מייל ונשלח אליכם קוד כניסה חד-פעמי.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">כתובת מייל</label>
              <Input
                type="email"
                inputMode="email"
                dir="ltr"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full h-12 gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
              שליחת קוד כניסה
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              שלחנו קוד בן 6 ספרות אל<br />
              <span className="font-medium text-foreground" dir="ltr">{email}</span>
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">קוד הכניסה</label>
              <Input
                type="text"
                inputMode="numeric"
                dir="ltr"
                placeholder="______"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-[0.4em]"
                autoFocus
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full h-12 gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              כניסה
            </Button>
            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setError(''); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              שינוי כתובת המייל
            </button>
          </form>
        )}
      </AuthLayout>
    </div>
  );
}
