# KICK-X 작업 인수인계 (HANDOFF)

> 다음 작업자(사람 또는 AI 에이전트)가 이 문서만 읽고 이어서 작업할 수 있도록 정리한 현황입니다.
> 기준일: 2026-10-01 · 기준 브랜치: `main` (= `claude/tender-knuth-s4t9ub`)

---

## 0. 한눈에 보기

| 항목 | 상태 |
| --- | --- |
| 프론트엔드 디자인 | **Yellow Playbook 스타일로 전 화면(23개) 완료.** PC(1440px) 기준, 모바일(390px) 대응 |
| 데이터 | 실제 DB 미연결. `KICKX_MOCK_DATA=true`면 **예시 데이터**로 전 화면 동작 (배지 표시) |
| 로그인 | Google OAuth·세션·프로필·관심 선수 API는 코드 완료, **Supabase 실제 설정 전** |
| 거래·자산·스쿼드 저장·랭킹·커뮤니티 쓰기·관리자 작업 | **백엔드 미구현.** 프론트 UI와 연결 지점만 준비됨 |
| 검증 | `npm run lint` · `npm test`(22개) · `npm run build` · 브라우저 스모크(23경로×2해상도) 통과 |

---

## 1. 반드시 지킬 작업 원칙

1. **디자인은 Yellow Playbook(노랑·검정·흰색, 상단 가로 메뉴)을 유지한다.** 다크 블루 테마나 왼쪽 사이드바로 바꾸지 않는다. (사용자 확정 사항)
2. **프레임워크·구조를 갈아엎지 않는다.** Next.js App Router + `components/kickx/*` 구조 유지.
3. **비즈니스 로직(가격·Performance·수수료·포인트 계산, 거래 체결)은 프론트에서 구현하지 않는다.** 서버가 계산한 값을 표시만 한다.
4. **예시 데이터는 반드시 예시로 표시한다.** mock 응답에는 `source: "mock"`이 붙고 화면에 "예시 데이터" 배지가 뜬다. 이 규칙을 깨지 않는다.
5. **알 수 없는 값은 `—`, 실제 0만 `0`.** `money()`/`percent()`가 null을 `—`로 처리한다. 가짜 0을 만들지 않는다.
6. **색·간격·글자 크기는 `app/styles/tokens.css` 변수만 사용**하고 페이지마다 하드코딩하지 않는다.
7. 작업 후 항상 `npm run lint && npm test && npm run build` 통과를 확인한다.

---

## 2. 실행 · 검증

```sh
npm ci
# 예시 데이터로 보기 (.env.local 에 한 줄 추가)
echo "KICKX_MOCK_DATA=true" >> .env.local
npm run dev            # http://localhost:3000

npm run lint           # ESLint
npm test               # node:test 단위 테스트 (tests/*.test.mjs)
npm run build          # 타입 검사 포함 프로덕션 빌드
# 브라우저 스모크 (Playwright 필요, CI와 동일)
KICKX_BROWSER_MODULE=<playwright가 설치된 폴더> node tests/browser-smoke.mjs
```

- 스모크 테스트는 **mock이 꺼진 상태**를 기준으로 작성되어 있다(빈 상태·차단된 쓰기 검사). mock을 켠 채 실행하지 않는다.
- Vercel: `KICKX_MOCK_DATA=true`는 **Preview 환경에만** 설정. Production에는 설정하지 않는다.
- DB 연결 시 `KICKX_DATABASE_ENABLED=true` + Supabase URL/publishable key. DB가 켜지면 mock 설정은 자동 무시된다.

---

## 3. 구조와 데이터 흐름

```
브라우저 (components/kickx/*, "use client")
   │  PlatformProvider: GET /api/kickx 한 번 → 전역 상태
   │  useAdminData():   GET /api/kickx/admin
   ▼
app/api/kickx/route.ts ──► server/kickx/service.ts (readPlatform/readAdmin)
                               │
                               ▼
                      server/kickx/repository.ts (getKickxRepository)
                        ├─ SupabaseKickxRepository  (DB 설정 시)
                        ├─ mockRepository           (KICKX_MOCK_DATA=true, DB 미설정)
                        └─ unconfiguredRepository   (기본: 빈 데이터)
```

| 경로 | 역할 |
| --- | --- |
| `app/**/page.tsx` | 4줄 래퍼. 실제 화면은 `components/kickx/*` |
| `components/kickx/ui.tsx` | 공통 UI: PageHeading, SectionTitle, StatCard, Change, PositionBadge, TeamBadge, PlayerPortrait, PlayerIdentity, WatchButton, MockBadge, Empty, Skeleton, DataEmpty, DataNotice, Tabs, Sparkline, PriceChart, Modal, **TradeButton/TradeDialog** |
| `components/kickx/provider.tsx` | 전역 데이터·`mock` 플래그·관심 선수 저장·토스트 |
| `components/kickx/shell.tsx` | 상단바·헤더(계정 메뉴/포인트)·서브메뉴·푸터 |
| `components/kickx/{home,players,squad,assets,ranking,community,auth,fixtures,admin}.tsx` | 화면 |
| `lib/kickx/types.ts` | **프론트-백엔드 데이터 계약(타입).** 서버는 이 형태로 응답해야 한다 |
| `lib/kickx/data.ts` | 포맷 함수(money, percent, dateText, relativeTime, seriesForDays), 빈 데이터 |
| `lib/kickx/validation.ts` | 입력 검증(프로필, 관심 선수, **게시글 `validatePost`**) — 서버에서도 재사용 |
| `lib/kickx/trade.ts` | **거래 연결 지점(TradeService).** 현재 mock/비활성 구현만 있음 |
| `server/kickx/mock-data.ts` | 예시 데이터(5대 리그 20구단, 47명, 일정, 데모 계정, 게시글, 랭킹, 관리자) |
| `server/kickx/catalog.ts` · `supabase-repository.ts` | Supabase 조회 어댑터 |
| `supabase/migrations/202610010001_*.sql` | 11개 테이블 + RLS (카탈로그·프로필·역할·관심 선수) |
| `app/styles/*.css` | 디자인 시스템 (아래 4장) |

---

## 4. 디자인 시스템 메모

- 파일 순서: `tokens.css → base.css → components.css → shell.css → pages.css` (`app/globals.css`가 import).
- 주요 토큰: `--yellow #ffe23a`, `--ink #111110`, `--paper`, `--surface`, `--line`, `--up/--down`(+bg), 포지션 색 `--pos-*`, 간격 `--s-*`(4px 단위), `--radius-1(2px)`, `--border-strong(2px ink)`.
- 상승/하락은 **색 + ▲/▼ 기호 + 스크린리더 텍스트**를 함께 쓴다(`<Change>`).
- 선수 사진: 라이선스 미확정이라 `PlayerPortrait`가 일러스트 플레이스홀더를 그린다. `Player.photo`에 URL이 오면 사진을 쓴다.
- 반응형 클래스: `hide-md`(≤900 숨김), `hide-sm`(≤640 숨김), `only-sm`(≤640에서만 표시). 모바일 표는 줄바꿈 없이 가로 스크롤.

**이미 겪은 함정 (재발 주의)**
- `.empty`는 전역 상태 컴포넌트 클래스다. 다른 요소에 `empty` 클래스를 붙이지 말 것(유니폼 아이콘이 깨졌던 원인).
- `.table-scroll` 안의 절대위치 요소는 스크롤 컨테이너 밖으로 새어 페이지가 넓어진다 → `.table-scroll { position: relative }` 유지.
- 그리드 자식이 줄어들지 않으면 모바일 가로 넘침 → `grid-template-columns: minmax(0, 1fr)` 사용.
- 모달은 부모의 `text-align`을 상속한다 → `.modal { text-align: left }` 유지.
- Next.js 라우트 안내 요소도 `role="alert"`다 → 테스트에서 `getByRole("alert")`는 텍스트로 좁혀서 사용.

---

## 5. 화면별 현황

| 화면 | 경로 | 프론트 | 백엔드 연결 필요 |
| --- | --- | --- | --- |
| 홈 | `/` | 완료 (마켓 보드·자산·스쿼드·경기·관심·급등락·최근 거래) | 카탈로그·자산·스쿼드 조회 |
| 선수 시장 / 탐색 | `/market` `/players` | 완료 (검색·리그/구단/포지션 필터·정렬·카드/표·페이지) | **서버 검색·페이지네이션**(대량 데이터 전) |
| 선수 상세 | `/players/[id]` | 완료 (가치 차트·최근 경기·AI 분석·보유 현황·매입/매각 모달) | 거래 견적/체결, 기록 기간 확장, AI 리포트 |
| 스쿼드 | `/squad` | 완료 (피치·자리 선택→배치·11명 표시·포지션 구성) | **스쿼드 저장 API** |
| 내 자산 / 거래 내역 | `/portfolio` `/transactions` | 완료 | 지갑·보유·거래 원장·자산 스냅샷 |
| 랭킹 | `/ranking` | 완료 (주간/월간·상위 3·내 순위·전체 표) | 수익률 집계 배치 |
| 구단 / 선수 커뮤니티 | `/community/clubs` `/community/players` (+ `/[id]`) | 완료 (`/community`는 구단으로 리다이렉트) | 게시글 조회·공감·인기 정렬 |
| 게시글 상세 | `/community/posts/[postId]` | 완료 (첨부 거래·댓글 목록) | 댓글/공감/신고/삭제 API |
| 글쓰기 | `/community/write` | **완료 (검증 UI: 필드별 오류·오류 요약·글자 수·이탈 경고·완료 화면)** | **게시글 등록/수정 API** |
| 마이페이지 · 로그인 · 온보딩 | `/mypage` `/login` `/onboarding` | 완료 (프로필 저장은 실제 API 연결됨) | Supabase OAuth 실제 설정 |
| 경기 일정 | `/fixtures` | 완료 | API-FOOTBALL 수집 |
| 관리자 4종 | `/admin` `/admin/data` `/admin/trades` `/admin/community` | 완료 (컨트롤룸 디자인·파이프라인 상태·로그·정산·신고 검토) | 관리자 조회 어댑터, 재처리/숨김/기각 API |

모든 쓰기 버튼은 **실제 모드에서 비활성**(또는 "서비스 준비 중" 안내), **mock 모드에서는 화면에서만 동작하고 "저장되지 않음"을 표시**한다.

---

## 6. 백엔드 연결 지점 (프론트가 기대하는 계약)

### 6-1. 이미 있는 API
| 메서드 | 경로 | 비고 |
| --- | --- | --- |
| GET | `/api/kickx` | `DataResponse<PlatformData>` — 공개 카탈로그 + 세션 + 본인 MemberData |
| GET | `/api/kickx/admin` | 관리자 권한 확인 후 `AdminData` (어댑터는 아직 빈 값) |
| POST | `/api/kickx/profile` | 닉네임·응원 구단 저장 (`parseProfile`) |
| PUT | `/api/kickx/watchlist` | 관심 선수 추가/해제 |
| POST | `/api/auth/login` · `/api/auth/logout`, GET `/api/auth/status` | Google OAuth |

쓰기 API 공통 규칙(`server/kickx/http.ts`): 동일 출처 검사(`requireOrigin`) → 서버 세션 검증 → 입력 검증 → RLS. **클라이언트가 보낸 userId/role은 절대 사용하지 않는다.**
⚠ `readJson`은 요청 본문을 **4096바이트로 제한**한다. 게시글(최대 3,000자, 한글은 3바이트)용 API는 이 한도를 별도로 늘려야 한다.

### 6-2. 새로 필요한 API (제안 형태)
| 기능 | 제안 | 프론트 연결 위치 |
| --- | --- | --- |
| 거래 견적 | `POST /api/kickx/trades/quote` `{playerId, side, quantity}` → `TradeQuote` (`price, fee, settlement, balance, balanceAfter, quotedAt`) | `lib/kickx/trade.ts`의 `quote()` |
| 거래 체결 | `POST /api/kickx/trades` `{playerId, side, quantity, quotedAt, idempotencyKey}` → 체결 결과/갱신된 MemberData | `trade.ts`의 `submit()`. 성공 후 `reload()` 호출 |
| 스쿼드 저장 | `PUT /api/kickx/squad` `{formationId, slots: (playerId\|null)[11]}` | `squad.tsx`의 "스쿼드 저장" 버튼 |
| 게시글 등록/수정 | `POST /api/kickx/posts`, `PATCH /api/kickx/posts/[id]` `{scope, target, category, title, body, transactionId?}` | `community.tsx` `WritePost.submit` — 서버에서 **`validatePost`를 그대로 재사용** |
| 댓글/공감/신고/삭제 | `POST /posts/[id]/comments`, `PUT /posts/[id]/like`, `POST /posts/[id]/reports`, `DELETE /posts/[id]` | `PostDetail` |
| 관리자 | 작업 재처리, 신고 숨김/기각 | `admin.tsx` (DisabledAction 위치) |
| 목록 분리 | `GET /api/kickx/players?q&league&team&position&sort&page` 등 | 지금은 `/api/kickx` 전체 조회 (20,000행 한도) |

`TradeService`를 실제 구현으로 바꾸는 방법: `lib/kickx/trade.ts`에 `apiService`를 추가해 위 API를 호출하고, `tradeService(mock)`에서 실제 모드일 때 반환하도록 교체한다. `quote()`는 현재 동기 함수이므로 실제 구현 시 `Promise<TradeQuote>`로 바꾸고 `TradeDialog`에서 로딩 상태를 추가한다.

---

## 7. 백엔드 할 일 (우선순위 순)

| # | 할 일 | 완료 기준 |
| --- | --- | --- |
| 1 | **Supabase 실제 연결**: 마이그레이션 적용, Google Provider/Redirect URL, Vercel 환경변수 (`docs/backend-setup.md`) | 로그인→프로필 등록→새로고침→재로그인 유지 |
| 2 | **API-FOOTBALL 수집**: 리그→구단→선수→경기→선수별 경기 기록 upsert, 외부 ID 보존, 수집 이력 | 하루 호출 한도 내 동작, 중복 적재 없음, 화면 표시와 원본 일치 |
| 3 | **팀 정책 확정** (8장 표) | 문서화된 수치·예시 계산 |
| 4 | **Performance·가치 계산 엔진**: 포지션별 가중치, 규칙 버전, 가격 이력, 경기 정정 재계산 | 같은 입력 = 같은 결과, 재처리해도 중복 변동 없음 |
| 5 | **지갑·원장·보유·거래 테이블 + 원자적 체결**: 최초 포인트 1회 지급, 견적/체결 API, 멱등 키 | 동시 주문·중복 요청·잔액 부족·가격 변경·실패 복구 테스트 통과 |
| 6 | **자산 조회**: `MemberData.financialReady=true`, holdings/transactions/assetHistory 채우기 | 자산·거래 화면이 실제 값 표시 |
| 7 | **스쿼드 저장 API** | 미보유/중복/11명 초과/포지션 위반 거부, 재접속 유지 |
| 8 | **랭킹 집계**: 자산 스냅샷 → 주간/월간 수익률 | 기간·동률·신규 회원 규칙대로 재현 가능 |
| 9 | **커뮤니티 테이블·API**: 게시글/댓글/공감/신고, 응원 구단 작성 권한, 본인 거래만 첨부 | 타 구단 팬·타인 거래 첨부 거부 (`validatePost` 서버 재사용) |
| 10 | **관리자 어댑터**: `getAdminData` 실제 구현, 재처리·신고 처리 API, 감사 로그 | 관리자만 접근, 모든 처리 감사 기록 |
| 11 | **목록 API 분리**: 선수/경기 서버 검색·페이지네이션 | 5대 리그 전체 적재 후 응답 크기·속도 정상 |
| 12 | **AI 가치 분석 리포트**: 저장된 기록 기반 생성, 생성 시각·출처 보존 | 수치를 임의 생성하지 않음 |

---

## 8. 팀이 정해야 할 정책 (현재는 예시 값)

| 항목 | 현재 화면/예시 값 | 결정 필요 |
| --- | --- | --- |
| 초기 포인트 | 예시 1,300,000 P (mock만) | 지급액, 1회 지급 조건 |
| 판매 수수료 | 예시 2% (mock만) | 기본 수수료, 거래량 기반 차등 기준 |
| 거래 방식 | 1명 단위 즉시 체결 UI | 수량 단위, 가격 유효 시간, 동일 선수 다중 보유 |
| Performance | 0–100 표기 (mock) | 포지션별 지표·가중치, 미출전 처리 |
| 가치 변동 | 직전 갱신 대비 % | 점수→가격 공식, 상·하한 |
| 포메이션 | 4-3-3, 4-4-2, 4-2-3-1, 3-5-2 (mock) | 허용 포메이션 목록 |
| 랭킹 | 초기 자산 대비 수익률 | 기간 경계(KST), 동률, 신규 회원 |
| 커뮤니티 | 구단 라운지는 응원 구단 팬만 작성, 제목 2–80자, 본문 10–3,000자 | 구단 변경 제한, 길이·이미지·신고 처리 기준 |
| 선수 사진 | 일러스트 플레이스홀더 | 라이선스 있는 출처 사용 여부 |

---

## 9. 알려진 제약 · 남은 프론트 작업

- 데이터를 `/api/kickx` 한 번에 받는 구조라 대량 데이터 전에 화면별 API로 나눠야 한다(7-11).
- 차트는 자체 SVG(`PriceChart`, `Sparkline`) — 라이브러리 미사용.
- 모든 화면 컴포넌트는 클라이언트 컴포넌트다. 서버 컴포넌트 전환은 목록 API 분리와 함께 검토.
- Tailwind 설정 파일은 남아 있으나 실제 스타일은 `app/styles/*.css`만 사용한다.
- GitHub에 정리되지 않은 옛 브랜치 2개(`chore/cleanup-starter-template`, `feat/playbook-details-and-account-foundation`)가 있다. 내용은 모두 `main`에 포함되어 있어 삭제해도 된다.
- 프론트 후속 후보: 거래 견적 로딩 상태(실제 API 연결 시), 댓글 작성 검증 UI, 다크 모드는 **하지 않음**(디자인 방향상).
