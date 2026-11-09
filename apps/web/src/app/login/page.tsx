import { Suspense } from "react";
import { Login } from "@/components/login";
export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8">در حال بارگیری…</p>}>
      <Login />
    </Suspense>
  );
}
