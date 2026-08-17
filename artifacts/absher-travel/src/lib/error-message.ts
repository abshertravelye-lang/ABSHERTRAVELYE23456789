/**
 * Converts a raw API error (any shape) into a human-readable Arabic/English string.
 * Never surfaces raw stack traces, database errors, or internal field names.
 */
export function friendlyError(err: unknown, ar: boolean): string {
  if (!err) return ar ? "حدث خطأ غير متوقع" : "An unexpected error occurred.";

  const e = err as Record<string, unknown>;

  // Structured API error shapes
  const msg =
    (e?.data as Record<string, unknown>)?.error ||
    e?.error ||
    e?.message ||
    (typeof err === "string" ? err : null);

  if (typeof msg === "string" && msg.trim()) {
    // Strip internal prefixes that should never reach users
    const clean = msg
      .replace(/^(Error:|Exception:|QueryFailedError:|TypeError:)\s*/i, "")
      .trim();

    // Map common technical phrases to friendly ones
    if (/duplicate|already exists|unique/i.test(clean)) {
      return ar ? "هذا السجل موجود مسبقاً." : "This record already exists.";
    }
    if (/foreign key|violates|constraint/i.test(clean)) {
      return ar ? "لا يمكن تنفيذ الإجراء بسبب ارتباطات البيانات." : "Action blocked due to related data.";
    }
    if (/unauthorized|401/i.test(clean)) {
      return ar ? "انتهت جلستك. يرجى تسجيل الدخول مرة أخرى." : "Your session expired. Please sign in again.";
    }
    if (/forbidden|403/i.test(clean)) {
      return ar ? "لا تملك صلاحية لهذا الإجراء." : "You don't have permission for this action.";
    }
    if (/not found|404/i.test(clean)) {
      return ar ? "لم يتم العثور على المورد المطلوب." : "The requested resource was not found.";
    }
    if (/network|fetch|econnrefused/i.test(clean)) {
      return ar ? "تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت." : "Could not reach the server. Check your connection.";
    }

    // If it's short and doesn't look like a technical string, show it as-is
    if (clean.length < 200 && !/SELECT|INSERT|UPDATE|DELETE|stack|at \w/i.test(clean)) {
      return clean;
    }
  }

  return ar ? "حدث خطأ. يرجى المحاولة مرة أخرى." : "An error occurred. Please try again.";
}
