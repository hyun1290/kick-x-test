# KICK-X

실제 축구 경기 데이터를 바탕으로 선수 자산을 운용하는 PC 웹 서비스의 **전체 화면 UI 프로토타입**입니다.

짙은 Navy 배경, Blue 강조색, 고정 사이드바, 우측 상단 프로필을 공통으로 사용합니다. 선수 시장은 시세표, 선수 상세는 가격 그래프, 스쿼드는 축구장 배치, 커뮤니티는 게시판 중심으로 구성했습니다.

## 실행

```sh
npm ci
npm run dev
```

현재 프로토타입은 환경변수 없이 실행됩니다. Google 로그인 버튼은 연결 전 상태로 표시되며 **데모 계정으로 시작하기**로 화면을 체험할 수 있습니다. 첫 접속 시에는 페이지 검토를 위해 예시 계정과 포트폴리오가 준비됩니다.

## 구현된 20개 화면

| 경로 | 화면 / 동작 |
| --- | --- |
| `/` | 홈: 자산 요약, 상승 선수, 예시 경기, 스쿼드 미리보기 |
| `/login` | Google 로그인 안내, 데모 계정 입장 |
| `/onboarding` | 닉네임과 응원 구단 설정 |
| `/players` | 선수 검색, 리그·구단·포지션 필터, 정렬, 카드·목록, 관심 선수 |
| `/players/[id]` | 선수 정보, 기간별 가격 그래프, 예시 경기·시즌 기록, 가치 설명, 거래 |
| `/market` | 거래량·등락 중심 선수 시장, 상승·하락·관심 필터 |
| `/portfolio` | 포인트·선수 자산·평가손익, 자산 구성과 예시 차트, 보유 선수 |
| `/transactions` | 본인 거래 내역, 매입·매각 필터, 선수 검색, 기간 필터 |
| `/squad` | 포메이션 선택, 포지션별 배치·제거·저장·되돌리기 |
| `/ranking` | 주간·월간 예시 랭킹, 내 순위, 응원 구단 필터 |
| `/community` | 구단 라운지, 게시글 검색·정렬·주제 필터, 선수 라운지 |
| `/community/clubs/[teamId]` | 구단 게시판: 해당 응원 구단만 작성 가능 |
| `/community/players/[playerId]` | 선수별 게시판, 선수 상세 연결 |
| `/community/posts/[postId]` | 게시글·댓글 조회, 본인 글·댓글 수정·삭제, 공감, 신고 |
| `/community/write` | 글 작성·수정, 본인 거래 내역 첨부 |
| `/mypage` | 프로필 변경, 로그아웃, 데모 초기화 확인 |
| `/admin` | 예시 운영 현황, 처리 이력 |
| `/admin/data` | 수집·Performance·가치 갱신 상태와 실패 항목 재처리 시연 |
| `/admin/trades` | 거래 모니터링, 검색, 고액 거래 필터, 정산 상세 |
| `/admin/community` | 신고 검토, 숨김·기각 처리, 게시글 노출 상태 반영 |

오류 및 존재하지 않는 주소를 위한 공통 화면도 제공합니다.

## 시연과 실제 기능의 경계

- `lib/kickx/data.ts`의 선수·경기·가격·Performance·사용자는 모두 **화면 검토용 예시**입니다. 현재 사실이나 실제 경기 결과를 의미하지 않습니다.
- `lib/kickx/store.ts`는 브라우저 안에서만 작동하는 순수 상태 변경 로직입니다. 거래 시 포인트·보유 선수·거래 내역을 함께 변경하며, 중복 요청·잔액 부족·미보유 매각·포지션 오류를 검증합니다.
- 데모 데이터는 `localStorage`의 `kickx-ui-demo-v1`에 저장됩니다. 같은 브라우저에서 새로고침·재입장 시 유지됩니다. 브라우저가 저장을 차단하면 새로고침 후에는 유지되지 않습니다.
- 시연용 가정: 선수당 1명 보유, 시스템 상대 즉시 거래, 판매 수수료 2%, 4-3-3 / 4-4-2 / 3-5-2, 최대 11명이며 빈 자리 허용. **확정된 운영 정책이 아닙니다.**
- 초기 계정에는 38,420 P와 11명의 예시 선수가 있습니다. 기준 자산 132,000 P는 예시 수익률 계산 기준이며 실제 초기 지급액이 아닙니다. 로그인할 때 포인트를 추가 지급하지 않습니다.
- 과거 자산 차트와 다른 사용자의 랭킹은 예시입니다. 내 총자산과 평가손익은 현재 데모 보유 상태로 계산합니다.
- 커뮤니티 게시글은 외부에 발행되지 않습니다. 관리자 화면은 누구나 검토 가능한 **운영 시연**이며 실제 관리자 권한을 부여하지 않습니다.
- **미연결:** Supabase 인증/DB, Google OAuth, API-FOOTBALL, 서버 거래 트랜잭션·권한 검증, 실제 가격/Performance 계산, 실제 랭킹 배치, AI 분석 API. 실제 서비스로 전환할 때는 모든 권한·가격·소유권 검증과 저장을 서버로 옮겨야 합니다.

## 코드 구성

- `app/`: 기존 URL 구조를 유지하는 얇은 페이지 진입점, 공통 레이아웃·스타일·오류 화면
- `components/kickx/`: 공통 사이드바/헤더/UI와 각 기능 영역의 화면
- `lib/kickx/data.ts`: 공통 예시 데이터·포메이션·타입
- `lib/kickx/store.ts`: 데모 거래·스쿼드·커뮤니티·운영 상태 변경과 복원
- `tests/demo-store.test.mjs`: 거래/자산/작성 권한/스쿼드/복원 회귀 검증
- `public/images/`: 웹에서 사용하는 경기장 이미지

기존 Next.js·React·Tailwind·Lucide 및 잠금 파일의 의존성을 유지했습니다. 별도 UI·상태·차트 라이브러리는 추가하지 않았습니다.

## 검증 명령

```sh
npm run lint
npm test
npm run build
```

데모 테스트는 기존 TypeScript 컴파일러와 Node 테스트 러너만 사용합니다. 테스트용 컴파일 과정에 실제 환경변수나 서비스 연결은 필요하지 않습니다.

## 이미지

`public/images/stadium-night.webp`는 이 프로젝트를 위해 기본 이미지 생성 도구로 만든 야간 경기장 배경입니다. 사용자 시안의 Navy/Blue 분위기를 바탕으로 홈과 로그인에서 재사용했습니다. 실제 구단 경기장이나 선수 사진이 아닙니다.

생성 프롬프트: “Ultra wide cinematic night-time football stadium at pitch level; deep navy negative space on the left, cool white floodlights and stadium architecture on the right; restrained cobalt light and subtle mist; realistic sports photography; no close-up people, text, badges, logos, watermark, UI or charts.”

## 글꼴

`public/fonts/noto-sans-kr.woff2`는 Google Fonts의 Noto Sans KR 가변 글꼴을 한글·라틴·기본 기호 범위로 서브셋한 자체 제공 파일입니다. 외부 글꼴 요청 없이 표시되며, SIL Open Font License 원문은 `public/fonts/OFL-NotoSansKR.txt`에 포함되어 있습니다.
