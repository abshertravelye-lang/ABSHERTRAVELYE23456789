/**
 * Program Detail — full information page for a tourism program,
 * with an in-platform «طلب حجز» button (no WhatsApp redirect).
 */
import { useTranslation } from "@/hooks/use-translation";
import { Link, useParams } from "wouter";
import { useGetProgram } from "@workspace/api-client-react";
import { AppImage } from "@/components/app-image";
import {
  Calendar, MapPin, CheckCircle2, XCircle, ChevronRight, Hotel,
  Plane, Utensils, Bus, Landmark, FileText, Star, ArrowLeft,
} from "lucide-react";

export default function ProgramDetail() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const params = useParams();
  const programId = Number(params.id);

  const { data: program, isLoading, isError } = useGetProgram(programId, {
    query: { enabled: Number.isFinite(programId) && programId > 0, queryKey: ["program", programId] },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0A2342] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !program) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" dir={ar ? "rtl" : "ltr"}>
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center">
          <h1 className="text-xl font-black text-slate-800 mb-3">
            {ar ? "البرنامج غير متاح" : "Program not available"}
          </h1>
          <p className="text-slate-500 mb-6">
            {ar ? "لم يتم العثور على هذا البرنامج أو أنه لم يعد متاحاً." : "This program was not found or is no longer available."}
          </p>
          <Link href="/programs">
            <button className="px-6 py-3 bg-[#0A2342] text-white rounded-xl font-bold hover:bg-[#0A2342]/90 transition-colors">
              {ar ? "العودة إلى البرامج" : "Back to Programs"}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const title = ar ? program.titleAr : program.titleEn;
  const description = ar ? program.descriptionAr : program.descriptionEn;
  const notes = ar ? program.notesAr : program.notesEn;
  const gallery = [program.imageUrl, ...(program.images ?? [])].filter(Boolean) as string[];
  const includedList = (program.includedServices?.length
    ? program.includedServices
    : (program.included ? program.included.split("\n").filter(Boolean) : []));

  return (
    <div className="min-h-screen bg-slate-50 pb-24" dir={ar ? "rtl" : "ltr"}>
      {/* Hero */}
      <div className="relative h-[340px] md:h-[420px] overflow-hidden">
        <AppImage src={gallery[0]} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="container mx-auto">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
              <Link href="/programs" className="hover:text-white transition-colors">
                {ar ? "البرامج السياحية" : "Programs"}
              </Link>
              <ChevronRight className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} />
              <span className="text-white">{title}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-slate-200 text-sm">
              {program.destination && (
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{program.destination}</span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {program.days} {ar ? "أيام" : "days"}{program.nights ? ` / ${program.nights} ${ar ? "ليالٍ" : "nights"}` : ""}
              </span>
              {program.programDate && (
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{program.programDate}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {description && (
              <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
                <h2 className="text-lg font-black text-slate-800 mb-3">{ar ? "عن البرنامج" : "About the Program"}</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{description}</p>
              </div>
            )}

            {/* Daily itinerary */}
            {(program.dailyItinerary?.length ?? 0) > 0 && (
              <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
                <h2 className="text-lg font-black text-slate-800 mb-5">{ar ? "البرنامج اليومي" : "Daily Itinerary"}</h2>
                <div className="space-y-4">
                  {program.dailyItinerary!.map((d) => (
                    <div key={d.day} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#0A2342] text-white flex items-center justify-center font-black shrink-0">
                        {d.day}
                      </div>
                      <div className="pb-4 border-b border-slate-100 flex-1">
                        <div className="font-bold text-slate-800">{ar ? d.titleAr : d.titleEn}</div>
                        <p className="text-sm text-slate-500 mt-1 whitespace-pre-line">{ar ? d.descriptionAr : d.descriptionEn}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hotels */}
            {(program.hotels?.length ?? 0) > 0 && (
              <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
                <h2 className="text-lg font-black text-slate-800 mb-5 flex items-center gap-2">
                  <Hotel className="w-5 h-5 text-[#D4AF37]" />{ar ? "الفنادق" : "Hotels"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {program.hotels!.map((h, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="font-bold text-slate-800">{ar ? h.nameAr : h.nameEn}</div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-0.5 text-[#D4AF37]">
                          {Array.from({ length: h.stars }).map((_, s) => <Star key={s} className="w-3.5 h-3.5 fill-current" />)}
                        </span>
                        · {h.city}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Included / excluded */}
            {(includedList.length > 0 || (program.excludedServices?.length ?? 0) > 0) && (
              <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {includedList.length > 0 && (
                  <div>
                    <h2 className="text-base font-black text-slate-800 mb-4">{ar ? "يشمل البرنامج" : "Included"}</h2>
                    <ul className="space-y-2.5">
                      {includedList.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(program.excludedServices?.length ?? 0) > 0 && (
                  <div>
                    <h2 className="text-base font-black text-slate-800 mb-4">{ar ? "لا يشمل" : "Not Included"}</h2>
                    <ul className="space-y-2.5">
                      {program.excludedServices!.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Extra info chips */}
            {(program.meals || program.transport || (program.tours?.length ?? 0) > 0 || (program.airlines?.length ?? 0) > 0) && (
              <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 space-y-4">
                <h2 className="text-lg font-black text-slate-800">{ar ? "تفاصيل إضافية" : "More Details"}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {program.meals && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <Utensils className="w-4 h-4 text-[#0A2342] shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{ar ? "الوجبات" : "Meals"}</div>
                        <div className="font-semibold text-slate-700">{program.meals}</div>
                      </div>
                    </div>
                  )}
                  {program.transport && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <Bus className="w-4 h-4 text-[#0A2342] shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{ar ? "التنقلات" : "Transport"}</div>
                        <div className="font-semibold text-slate-700">{program.transport}</div>
                      </div>
                    </div>
                  )}
                  {(program.airlines?.length ?? 0) > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <Plane className="w-4 h-4 text-[#0A2342] shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{ar ? "الطيران" : "Airlines"}</div>
                        <div className="font-semibold text-slate-700">{program.airlines!.join("، ")}</div>
                      </div>
                    </div>
                  )}
                  {(program.tours?.length ?? 0) > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <Landmark className="w-4 h-4 text-[#0A2342] shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{ar ? "الجولات" : "Tours"}</div>
                        <div className="font-semibold text-slate-700">{program.tours!.join("، ")}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Terms & policies */}
            {(program.bookingTerms || program.cancellationPolicy || notes) && (
              <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 space-y-5">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#D4AF37]" />{ar ? "الشروط والسياسات" : "Terms & Policies"}
                </h2>
                {program.bookingTerms && (
                  <div>
                    <div className="font-bold text-slate-700 text-sm mb-1">{ar ? "شروط الحجز" : "Booking Terms"}</div>
                    <p className="text-sm text-slate-500 whitespace-pre-line">{program.bookingTerms}</p>
                  </div>
                )}
                {program.cancellationPolicy && (
                  <div>
                    <div className="font-bold text-slate-700 text-sm mb-1">{ar ? "سياسة الإلغاء" : "Cancellation Policy"}</div>
                    <p className="text-sm text-slate-500 whitespace-pre-line">{program.cancellationPolicy}</p>
                  </div>
                )}
                {notes && (
                  <div>
                    <div className="font-bold text-slate-700 text-sm mb-1">{ar ? "ملاحظات" : "Notes"}</div>
                    <p className="text-sm text-slate-500 whitespace-pre-line">{notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky booking card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:sticky lg:top-24">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {ar ? "السعر للشخص" : "Price per person"}
              </div>
              <div className="text-4xl font-black text-[#0A2342] mb-1">
                {Number(program.price).toLocaleString()}
                <span className="text-base text-slate-400 font-bold ms-2">{program.currency || "USD"}</span>
              </div>
              <div className="text-sm text-slate-500 mb-6">
                {program.days} {ar ? "أيام" : "days"}{program.nights ? ` / ${program.nights} ${ar ? "ليالٍ" : "nights"}` : ""}
              </div>

              {program.isActive ? (
                <Link href={`/programs/${program.id}/book`}>
                  <button className="w-full h-14 bg-[#D4AF37] text-[#0A2342] font-black text-lg rounded-2xl hover:bg-[#c8a84b] transition-all flex items-center justify-center gap-2 shadow-lg">
                    {ar ? "طلب حجز" : "Request Booking"}
                    <ArrowLeft className={`w-5 h-5 ${ar ? "" : "rotate-180"}`} />
                  </button>
                </Link>
              ) : (
                <div className="w-full h-14 bg-slate-100 text-slate-400 font-bold rounded-2xl flex items-center justify-center">
                  {ar ? "غير متاح حالياً" : "Currently unavailable"}
                </div>
              )}

              <p className="text-center text-xs text-slate-400 mt-4">
                {ar
                  ? "طلب الحجز داخل المنصة — ستحصل على رقم طلب لمتابعة حالته من حسابك."
                  : "In-platform booking — you'll get a request number to track it from your account."}
              </p>

              {gallery.length > 1 && (
                <div className="grid grid-cols-3 gap-2 mt-6">
                  {gallery.slice(1, 7).map((img, i) => (
                    <AppImage key={i} src={img} alt="" className="w-full h-16 object-cover rounded-lg" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
