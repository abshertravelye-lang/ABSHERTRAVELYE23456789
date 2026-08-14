/** Admin-section permission keys. Enforced server-side; the admin UI mirrors them. */
export const PERMISSIONS = [
  "overview",           // dashboard stats
  "bookings",           // flight/hotel/program requests
  "payments",
  "reports",
  "visa_applications",  // review/process applications + applicant docs
  "documents_request",  // request additional documents from customers
  "documents_review",   // review / approve / reject uploaded documents
  "visa_config",        // visa countries, types, eligibility, requirements
  "customers",
  "employees",          // employee management (super_admin only in practice)
  "messages",           // customer messages
  "notifications",
  "settings",           // app settings incl. app links
  "audit_logs",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const STAFF_ROLES = ["agent", "admin", "super_admin"] as const;

/** Predefined role presets (Super Admin can customize per employee). */
export const ROLE_PRESETS: Record<string, Permission[]> = {
  visa_employee: ["visa_applications"],
  support_employee: ["messages", "customers"],
  flight_employee: ["bookings"],
  hotel_employee: ["bookings"],
  custom: [],
};
