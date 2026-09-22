import { AuthButton } from "@/components/auth-button";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-xl font-bold">KICK-X</span>
          <Suspense fallback={null}>
            <AuthButton />
          </Suspense>
        </div>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-24">
        <p className="text-sm font-medium text-muted-foreground">
          Fantasy Football Market
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          실제 경기 데이터로 움직이는 판타지 축구 시장
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          실제 선수의 경기 성과와 시장 수요를 반영해 선수를 영입하고,
          선수단과 자산을 운영하는 KICK-X입니다.
        </p>
      </section>
    </main>
  );
}
