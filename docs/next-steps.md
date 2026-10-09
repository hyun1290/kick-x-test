# 다음 작업 — 2026-10-09 자동화 전환

1. 기존 SQL 001~003은 적용 완료로 전달받음. 새 `202610090004_automated_operations.sql`만 1회 적용한다.
2. GitHub 저장소 → Settings → Secrets and variables → Actions → Repository secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BSD_API_KEY`. 기존 Supabase/BSD 값을 그대로 사용한다. Vercel 환경변수와 별개다.
3. Actions → Automatic football operations → Run workflow 1회로 첫 실행 확인. 이후 기본 브랜치에서 15분 간격 실행하며 일일 데이터는 DB에서 하루 1회로 제한한다.
4. 실제 두 Google 계정으로 거래·스쿼드 저장·권한 분리·댓글/답글·신고를 확인한다. 관리자 계산·가격·랭킹 버튼은 필요 없다.
5. Performance 표본과 이름 매핑 결과를 대조하고, 시범 가치 공식은 별도 확정 후 서버/DB 정책과 함께 변경한다.
6. 후속: 거래·신고 전체 목록 페이지, 선수 사진 톤, 대규모 랭킹/잠금 비용 측정, AI 분석·별도 이적 정책.

세부 동작과 오류 재개 방식은 [자동화 설정](automatic-operations.md)을 읽는다. 테스트 시드 SQL을 운영 DB에 실행하지 않는다.
