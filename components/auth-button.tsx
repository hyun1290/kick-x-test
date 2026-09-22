import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";

export async function AuthButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    return (
      <Button asChild size="sm">
        <Link href="/auth/login">Google로 로그인</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span>{user.email}</span>
      <LogoutButton />
    </div>
  );
}
