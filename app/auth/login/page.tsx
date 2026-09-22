import { GoogleLoginButton } from "@/features/auth/components/google-login-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">KICK-X 로그인</CardTitle>
        </CardHeader>
        <CardContent>
          <GoogleLoginButton />
        </CardContent>
      </Card>
    </main>
  );
}
