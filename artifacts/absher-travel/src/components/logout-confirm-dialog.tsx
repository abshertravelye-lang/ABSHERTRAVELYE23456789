import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { LogOut } from "lucide-react";

/**
 * Branded logout confirmation dialog (Arabic RTL) using the design-system
 * AlertDialog. The real logout (backend session revocation + local token
 * clearing) is performed by the `onConfirm` callback provided by the caller.
 */
export function LogoutConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  ar = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  ar?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir={ar ? "rtl" : "ltr"} className="max-w-md rounded-2xl">
        <AlertDialogHeader className="items-center text-center sm:text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-2">
            <LogOut className="w-7 h-7 text-red-500" />
          </div>
          <AlertDialogTitle className="text-[#0d2351] text-xl font-black">
            {ar ? "هل تريد تسجيل الخروج؟" : "Sign out?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-500">
            {ar
              ? "هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟"
              : "Are you sure you want to sign out of your account?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:justify-center">
          <AlertDialogCancel className="rounded-xl font-semibold">
            {ar ? "إلغاء" : "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white"
          >
            {ar ? "تسجيل الخروج" : "Sign out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
