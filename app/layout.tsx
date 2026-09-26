import { Suspense } from "react";
import type { Metadata } from "next";
import { DemoProvider } from "@/components/kickx/provider";
import { AppShell } from "@/components/kickx/shell";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "KICK-X | Football Market", template: "%s | KICK-X" },
  description:
    "실제 축구의 흐름을 나만의 선수 자산으로. KICK-X 판타지 축구 선수 시장 UI 프로토타입.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <DemoProvider>
          <Suspense
            fallback={
              <div className="page-loading">KICK-X 화면을 불러오는 중…</div>
            }
          >
            <AppShell>{children}</AppShell>
          </Suspense>
        </DemoProvider>
      </body>
    </html>
  );
}
