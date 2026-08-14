import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminAuth, ADMIN_ACCESS_TOKEN_KEY, ADMIN_REFRESH_TOKEN_KEY } from "@/hooks/use-admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Mail } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      if (user.role === "customer") {
        // Not authorized for the admin dashboard.
        localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
        localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
        setError("هذا الحساب غير مصرح له بالدخول إلى لوحة التحكم");
        return;
      }
      navigate("/");
    } catch {
      setError("بيانات الدخول غير صحيحة");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 font-sans" dir="rtl">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl border border-card-border shadow-xl p-8">
          <div className="flex flex-col items-center gap-2 mb-8">
            <img src={`${BASE}/absher-logo.png`} alt="ABSHER TRAVEL" className="h-14 w-48 object-contain" />
            <div className="text-sm text-muted-foreground font-medium">لوحة التحكم</div>
          </div>

          <h1 className="text-xl font-extrabold text-foreground text-center mb-6">تسجيل الدخول</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute top-3 right-3 text-muted-foreground" />
                <Input
                  type="email"
                  autoComplete="username"
                  className="rounded-xl pe-9 text-right"
                  placeholder="admin@absher.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>كلمة المرور</Label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute top-3 right-3 text-muted-foreground" />
                <Input
                  type="password"
                  autoComplete="current-password"
                  className="rounded-xl pe-9 text-right"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                {error}
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full rounded-xl h-11 text-base font-bold">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "دخول"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
