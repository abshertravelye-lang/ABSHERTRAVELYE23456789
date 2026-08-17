import { CheckCircle2 } from "lucide-react";

interface StepIndicatorProps {
  steps: string[];
  current: number; // 0-based index of current step
  ar: boolean;
}

/**
 * Horizontal step indicator used in multi-step forms (visa application,
 * agent new-application wizard, Umrah flow).
 */
export function StepIndicator({ steps, current, ar }: StepIndicatorProps) {
  return (
    <div className="w-full overflow-x-auto pb-1" dir="ltr">
      <div className="flex items-center min-w-max mx-auto justify-center">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          const future = i > current;

          return (
            <div key={i} className="flex items-center">
              {/* Circle */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 ${
                    done
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : active
                      ? "bg-[#0A2342] border-[#0A2342] text-white shadow-md ring-4 ring-[#0A2342]/15"
                      : "bg-white border-slate-200 text-slate-400"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold whitespace-nowrap max-w-[64px] text-center leading-tight ${
                    active
                      ? "text-[#0A2342]"
                      : done
                      ? "text-emerald-600"
                      : "text-slate-400"
                  }`}
                  dir={ar ? "rtl" : "ltr"}
                >
                  {label}
                </span>
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 w-10 md:w-16 mx-1 mb-5 rounded-full transition-all duration-300 ${
                    i < current ? "bg-emerald-400" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
