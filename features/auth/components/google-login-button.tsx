"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export function GoogleLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google OAuth login failed:", error.message);
      setIsLoading(false);
    }
  };

  return (
    <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
      {isLoading ? "로그인 중..." : "Google로 로그인"}
    </Button>
  );
}
