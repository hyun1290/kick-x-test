# 축구 데이터 수집과 서버 조회

2026-10-01 기반 연결. 실제 API 키와 Supabase 프로젝트는 별도 설정한다. 수집은 사이트 방문과 분리된 수동 CLI로 실행하며, 브라우저에 공급자 키나 서비스 역할 키를 보내지 않는다.

## 연결 순서

1. `docs/backend-setup.md`에 따라 모든 SQL 마이그레이션을 순서대로 적용한다.
2. 실행 환경의 `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `API_FOOTBALL_KEY`를 설정한다. 비밀키는 `NEXT_PUBLIC_` 접두사를 사용하지 않는다. 수동 CLI를 실행할 컴퓨터에만 수집 비밀키를 둬도 된다.
3. API-FOOTBALL 계정에서 대상 리그 ID와 사용할 수 있는 시즌을 확인한다. 시즌은 자동 추정하지 않는다. 아래 `39`, `2025`는 실행 형태 예이며 계정에서 접근 가능한 값으로 바꾼다.
4. 원본 확인 → DB 적재 → 현재 선수단 → 경기 → 경기별 선수 기록 순서로 진행한다.

```sh
# DB에 쓰지 않고 공급자 응답의 모양/시즌/coverage 확인. API 호출은 실제로 소비한다.
npm run data:sync -- leagues --league=39 --season=2025 --dry-run
# DB 기록. 모두 명시적인 리그와 시즌을 사용한다.
npm run data:sync -- teams --league=39 --season=2025
npm run data:sync -- players --league=39 --season=2025 --page=1 --pages=3 --budget=5
# 앞 출력의 nextPage가 4라면 이어서 실행한다. 같은 페이지 재실행도 안전하다.
npm run data:sync -- players --league=39 --season=2025 --page=4 --pages=3 --budget=5
# 현재 소속은 시즌 출전 기록이 아니라 현재 선수단 endpoint로 설정한다.
npm run data:sync -- squads --league=39 --season=2025 --team=팀_ID
npm run data:sync -- fixtures --league=39 --season=2025 --from=2025-08-01 --to=2025-08-08
# 위에서 저장한 경기 ID를 사용한다.
npm run data:sync -- matches --league=39 --season=2025 --fixture=경기_ID
# 공개 조회 테이블/뷰, Google 공급자 활성화 확인. 값이나 비밀키를 출력하지 않는다.
npm run connection:check
```

각 실행은 `/leagues` 응답으로 시즌과 coverage를 먼저 확인한다. 기본 호출 예산은 실행당 10회, 페이지 수는 1, 호출 간격은 6.5초다. 페이지 수를 늘려도 예산/공급자 잔여 쿼터가 먼저 적용된다. HTTP 200의 `errors`도 실패로 처리하며 자동 재시도로 호출을 소비하지 않는다. 플레이어 페이지의 `paging.current/total`을 검증한다. 경기 날짜 창은 최대 31일이다. API 키 권한·실제 응답의 접근 시즌은 운영 계정에서 시험해야 한다.

`--dry-run`은 DB 쓰기를 하지 않으며, 실제 API 호출 비용을 소비한다. 경기 기록 dry run은 경기 메타데이터도 공급자에서 조회한다. 일반 경기 기록 적재는 저장된 경기의 리그·시즌·양 팀을 확인한다. 잘못된 선수나 팀 관계가 있으면 응답 단위 트랜잭션 전체를 취소한다.

## 저장 데이터

| 위치 | 용도 |
| --- | --- |
| leagues / teams / players / fixtures | 공개 카탈로그와 현재 선수단 정보 |
| football_league_seasons | 시즌별 제공 지표 coverage (비공개) |
| football_player_seasons | 선수·리그·구단·시즌별 원천 통계 JSON (비공개) |
| football_match_stats | 선수·경기별 원천 통계 JSON (비공개) |
| player_season_summaries | 최신 적재 시즌의 실제 득점·도움·시간 요약 (공개) |
| player_match_records | 날짜·상대·결과·실제 출전 기록 (공개), Performance는 계산 엔진 담당 |
| football_sync_jobs | 실행 결과·호출 수·다음 페이지·일반화한 오류 코드 (비공개) |

고정 ID는 `af-<공급자 ID>`이며 `external_id`도 보존한다. 이미 같은 외부 ID를 다른 내부 ID로 적재했다면 먼저 매핑을 정리해야 한다. 충돌을 자동 덮어쓰지 않는다. NULL은 미제공, 0은 실제 값이다. 영문 이름을 원본 그대로 저장하며 한국어 이름·색·사진 정책은 별도로 정한다. 사진은 이번 수집에서 저장/노출하지 않는다.

시즌 이적 통계는 구단별로 분리한다. 최신 시즌의 대상 리그 기록을 합산해 요약을 재계산하므로 같은 페이지를 다시 가져와도 누적되지 않는다. 시즌 기록 수집은 현재 소속을 덮어쓰지 않으며 `/players/squads` 수집이 현재 소속을 설정한다. 현재 소속을 아직 수집하지 않은 선수는 최신 시즌에 제공된 리그로 검색할 수 있다. squads 실행은 해당 구단이 요청 리그·시즌의 팀 목록에 있는지 먼저 확인한다. 현재 선수단에서 사라진 선수의 소속 해제·여러 리그 간 이적 확정은 추가 동기화 정책이 필요하다.

`apply_football_batch`는 서비스 역할만 실행할 수 있고, 응답 하나를 원자적으로 저장한다. 같은 선수를 동시에 적재할 때 잠금을 사용한다. 작업 이력 갱신 전 프로세스가 종료되면 같은 페이지를 다시 실행하면 된다. 원천 정정 시 기존 행을 갱신하지만 계산 엔진의 Performance·가격 재계산은 다음 단계다. 공급자 rating을 KICK-X Performance로 복사하지 않는다.

## 조회 API

| API | 지원 |
| --- | --- |
| GET /api/kickx | 리그·구단 메타데이터와 제한된 홈 미리보기, 실제 선수 총수, 현재 회원 |
| GET /api/kickx/players | q, league, team, position, sort, scope, page, size |
| GET /api/kickx/players/:id | 해당 선수, 최근 20경기, 최근 31일 가격 이력 최대 1,000개, 저장된 분석 |
| GET /api/kickx/fixtures | q, league, state, day, page, size |

페이지 응답은 `{status, data:{items,total,page,size}}` 형태다. 기본 선수 12개·경기 20개, 최대 50개다. 검색/필터 후 전체 수를 집계하며 동률은 ID로 정렬하고 NULL은 뒤로 보낸다. 검색의 `%`, `_`, `\`는 검색 문자열로 처리한다. 날짜 필터는 대한민국 자정부터 다음 자정 직전까지다. 응답은 개인 쿠키에 따라 달라질 수 있어 `private, no-store`다.

`scope=watch`는 서버 검증 회원만 사용하며 DB의 RLS를 적용한 본인 관심 선수 관계에서 검색한다. 일반 회원이 타인 ID를 입력해 조회할 수 없다. 보유 선수(`scope=owned`)는 금융 연결 전 `not-configured`다.

선수 탐색·시장·경기 화면과 홈 검색은 실제 DB 모드에서 서버 목록 API를 사용한다. 상세/선수 라운지는 직접 상세 조회한다. 구단 로스터와 선수 라운지 미리보기는 각각 12/24개로 제한한다. 전체는 선수 탐색에서 검색한다. 글쓰기의 선수 선택 양식은 아직 부트스트랩 미리보기를 사용하므로 실제 커뮤니티 API를 구현할 때 검색형 선택기로 확장한다. mock 모드에서는 기존 로컬 상호작용을 유지한다.

## 남은 운영 확인

- 실제 5대 리그·접근 가능 시즌·결측 지표를 소량 dry run으로 확인한다.
- 계정 전체가 공유하는 하루 쿼터는 공급자 대시보드에서도 확인한다. CLI 예산은 다른 도구의 호출까지 통제하지 않는다.
- 아직 자동 예약 실행·관리자 작업 대시보드·영구 실패 복구 큐는 없다. 우선 수동 수집을 검증한 뒤 운영 주기를 정한다.
- 실데이터가 충분해지면 검색 쿼리 성능과 Supabase 비용을 측정한다. 현재 부분 문자열 검색의 별도 전문 검색 인덱스는 없다.

공식 참고: [API-FOOTBALL v3](https://www.api-football.com/documentation-v3), [쿼터와 페이지네이션](https://www.api-football.com/news/post/how-to-optimize-api-sports-calls-and-quota-usage), [Supabase range](https://supabase.com/docs/reference/javascript/using-modifiers-range).
