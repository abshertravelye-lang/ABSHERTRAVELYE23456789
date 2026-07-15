import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";

export default function Login() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const redirect = new URLSearchParams(search).get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      setLocation(redirect);
    } catch {
      toast({
        variant: "destructive",
        title: ar ? "فشل تسجيل الدخول" : "Login failed",
        description: ar ? "يرجى التحقق من البريد الإلكتروني وكلمة المرور" : "Please check your email and password",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 py-16 px-4">
      <Card className="w-full max-w-md border-0 shadow-lg rounded-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <LogIn className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">{ar ? "تسجيل الدخول" : "Sign in"}</CardTitle>
          <CardDescription>
            {ar ? "سجّل الدخول لتتبع طلباتك وحجوزاتك" : "Sign in to track your applications and bookings"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{ar ? "البريد الإلكتروني" : "Email"}</Label>
              <Input id="email" type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{ar ? "كلمة المرور" : "Password"}</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full h-11" disabled={submitting}>
              {submitting ? (ar ? "جاري الدخول..." : "Signing in...") : (ar ? "تسجيل الدخول" : "Sign in")}
            </Button>
          </form>
          <p className="text-sm text-center text-slate-500 mt-6">
            {ar ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
            <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-primary font-medium hover:underline">
              {ar ? "إنشاء حساب" : "Create one"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
