# KICK-X

실제 축구 경기 기록과 선수 시장을 연결하는 Next.js 판타지 축구 웹 서비스입니다. Yellow Playbook의 노랑·검정·흰색 스타일을 사용합니다.

## 현재 상태 — 2026-10-01

- 기존 20개 화면에 **경기 일정 /fixtures**를 추가했습니다.
- 홈 검색·정렬·점진적 목록 표시, 선수 탐색/상세, 자산·선수단·커뮤니티·운영 화면과 빈 상태를 제공합니다.
- **Google OAuth 시작/콜백/로그아웃, 검증된 세션 조회, 프로필 등록·변경, 관심 선수 추가·해제, 공개 축구 데이터 조회 어댑터**를 구현했습니다.
- **11개 테이블의 초기 SQL 마이그레이션과 RLS**를 제공합니다. 실제 Supabase 프로젝트에 자동 적용하지 않습니다.
- 초기 포인트 지급, 거래/원장, 스쿼드 저장, 랭킹 집계, 커뮤니티 저장, 관리자 작업, API-FOOTBALL 수집·가치 계산·AI 생성은 아직 연결되지 않았습니다.

코드 구현과 운영 연결은 다릅니다. 환경변수만 넣기 전에 SQL과 Google 공급자/리다이렉트를 설정해야 합니다. 기본값은 미연결이며 예시 선수·잔액·거래·회원 데이터를 채우지 않습니다.

## 실행

```sh
npm ci
npm run dev
```

환경변수가 없어도 UI를 확인할 수 있습니다. 알 수 없는 수치에는 `—`를 표시하며 실제 조회값이 0일 때만 0을 표시합니다. 로그인·DB 연결 설정은 [연결 안내](docs/backend-setup.md)를 따르세요.

## 개발 구조

| 경로 | 역할 |
| --- | --- |
| app/ | 21개 화면, OAuth 콜백, 조회·프로필·관심 선수 API |
| components/kickx/ | 화면, 저장 상태, 반응형 UI |
| lib/kickx/ | 화면 타입, 입력 검증, 날짜·금액·경기 상태 |
| server/kickx/ | 서버 전용 Supabase 클라이언트와 조회 어댑터, 인증·요청 검증 |
| supabase/migrations/ | 공개 경기 카탈로그, 프로필, 역할, 관심 선수 스키마와 RLS |
| app/yellow-playbook.css | 기본 Yellow Playbook 스타일 |
| app/playbook-details.css | 정보 구분·표·카드·로딩·알림·모바일 디테일 |
| tests/ | 데이터 경계, 입력/리다이렉트, 카탈로그, SQL RLS, 브라우저 검사 |
| .github/workflows/check.yml | 빌드, 테스트, 임시 PostgreSQL 권한 검사, 브라우저 확인 |

공개 API는 관리자 데이터를 반환하지 않습니다. 사용자 ID와 역할은 서버 검증 결과에서만 가져오며 클라이언트의 역할·ID 입력을 사용하지 않습니다. publishable/anon 키와 RLS를 사용하고 서비스 역할 키를 브라우저나 일반 사용자 API에 사용하지 않습니다.

현재 카탈로그는 초기 개발용 전체 조회입니다. 기본 행 제한을 넘는 데이터는 페이지로 나누어 읽고, 테이블당 20,000행에 도달하면 일부 결과를 정상인 것처럼 돌려주지 않고 오류를 반환합니다. **유럽 5대 리그를 대량 적재하기 전에 화면별 서버 검색·페이지네이션으로 분리해야 합니다.** 최근 가격/경기 기록은 31일 범위입니다.

## 다음 작업

[페이지별 구현 상태](docs/ui-implementation.md) · [DB/OAuth 연결 안내](docs/backend-setup.md) · [다음 개발 단계와 결정표](docs/next-steps.md)

```sh
npm run lint
npm test
npm run build
```

CI의 PostgreSQL은 권한 검사용 임시 DB입니다. 실제 Supabase OAuth·배포 환경의 통합 시험을 대신하지 않습니다. 브라우저 테스트의 주입 데이터는 테스트 코드에만 있으며 앱·SQL에는 시드 데이터가 없습니다.

## 시각 자산

`public/images/yellow-playbook-reference.png`는 제공된 레퍼런스의 장식용 비주얼입니다. 실제 선수 정보로 사용하지 않습니다. 로컬 Noto Sans KR의 라이선스는 `public/fonts/OFL-NotoSansKR.txt`에 있습니다. 모션 감소 설정에서는 전환·로딩 애니메이션을 끕니다.
