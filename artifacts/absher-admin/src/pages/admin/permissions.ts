/** Backend permission keys and their Arabic labels. */
export const PERMISSION_KEYS = [
  "overview",
  "bookings",
  "payments",
  "reports",
  "visa_applications",
  "documents_request",
  "documents_review",
  "visa_config",
  "customers",
  "employees",
  "messages",
  "notifications",
  "settings",
  "audit_logs",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_LABELS_AR: Record<string, string> = {
  overview: "نظرة عامة",
  bookings: "الحجوزات",
  payments: "المدفوعات",
  reports: "التقارير",
  visa_applications: "طلبات التأشيرات",
  documents_request: "طلب مستندات إضافية",
  documents_review: "مراجعة المستندات",
  visa_config: "إعدادات التأشيرات",
  customers: "العملاء",
  employees: "الموظفون",
  messages: "الرسائل",
  notifications: "الإشعارات",
  settings: "الإعدادات",
  audit_logs: "سجل النشاط",
};

export const PRESET_LABELS_AR: Record<string, string> = {
  visa_employee: "موظف تأشيرات",
  support_employee: "موظف دعم العملاء",
  flight_employee: "موظف طيران",
  hotel_employee: "موظف فنادق",
  custom: "مخصص",
};

export const ROLE_LABELS_AR: Record<string, string> = {
  agent: "وكيل",
  admin: "مدير",
  super_admin: "مدير عام",
  customer: "عميل",
};
