# KICK-X

실제 축구 경기 데이터를 기반으로 선수단과 자산을 운영하는 판타지 풋볼 마켓 플랫폼입니다.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Google OAuth
- Vercel
- API-FOOTBALL

## Local Development

1. 의존성 설치

```bash
npm install
```

2. `.env.example`을 참고해 `.env.local` 생성

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

3. 개발 서버 실행

```bash
npm run dev
```

## Directory Rules

- `app/`: 페이지, 레이아웃, Route Handler
- `components/`: 여러 기능에서 공통으로 사용하는 UI
- `features/`: 기능별 UI, action, query
- `server/repositories/`: Supabase DB 조회/저장
- `server/services/`: 가격, Performance, 거래 등 비즈니스 로직
- `lib/supabase/`: Supabase 연결
- `lib/football/`: API-FOOTBALL 연결
- `types/`: 공통 TypeScript 타입
- `constants/`: 리그 ID, 포지션 등 고정값

## Authentication

Google OAuth는 Supabase Auth를 통해 처리합니다.

```text
Browser
  -> Supabase Auth
  -> Google OAuth
  -> /auth/callback
  -> Supabase Session
```
