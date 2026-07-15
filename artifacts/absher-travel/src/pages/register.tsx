import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelect } from "@/components/country-select";
import { UserPlus } from "lucide-react";

export default function Register() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const { register } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const redirect = new URLSearchParams(search).get("redirect") || "/";

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "", nationality: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email && !form.phone) {
      toast({ variant: "destructive", title: ar ? "مطلوب" : "Required", description: ar ? "يرجى إدخال البريد الإلكتروني أو رقم الهاتف" : "Please enter an email or phone number" });
      return;
    }
    setSubmitting(true);
    try {
      await register({
        email: form.email || undefined,
        phone: form.phone || undefined,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
      });
      setLocation(redirect);
    } catch {
      toast({
        variant: "destructive",
        title: ar ? "فشل إنشاء الحساب" : "Registration failed",
        description: ar ? "قد يكون هذا البريد مستخدماً بالفعل" : "This email or phone may already be in use",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 py-16 px-4">
      <Card className="w-full max-w-lg border-0 shadow-lg rounded-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <UserPlus className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">{ar ? "إنشاء حساب جديد" : "Create an account"}</CardTitle>
          <CardDescription>{ar ? "أنشئ حساباً لطلب التأشيرات وحجز الرحلات" : "Create an account to apply for visas and book flights"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{ar ? "الاسم الأول" : "First name"}</Label>
                <Input value={form.firstName} onChange={update("firstName")} />
              </div>
              <div className="space-y-2">
                <Label>{ar ? "اسم العائلة" : "Last name"}</Label>
                <Input value={form.lastName} onChange={update("lastName")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{ar ? "البريد الإلكتروني" : "Email"}</Label>
              <Input type="email" dir="ltr" value={form.email} onChange={update("email")} />
            </div>
            <div className="space-y-2">
              <Label>{ar ? "رقم الهاتف" : "Phone"}</Label>
              <Input dir="ltr" value={form.phone} onChange={update("phone")} />
            </div>
            <div className="space-y-2">
              <Label>{ar ? "الجنسية" : "Nationality"}</Label>
              <CountrySelect language={language as "ar" | "en"} value={form.nationality} onChange={(code) => setForm((f) => ({ ...f, nationality: code }))} />
            </div>
            <div className="space-y-2">
              <Label>{ar ? "كلمة المرور" : "Password"}</Label>
              <Input type="password" required minLength={8} value={form.password} onChange={update("password")} />
            </div>
            <Button type="submit" className="w-full h-11" disabled={submitting}>
              {submitting ? (ar ? "جاري الإنشاء..." : "Creating...") : (ar ? "إنشاء حساب" : "Create account")}
            </Button>
          </form>
          <p className="text-sm text-center text-slate-500 mt-6">
            {ar ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
            <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-primary font-medium hover:underline">
              {ar ? "تسجيل الدخول" : "Sign in"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
