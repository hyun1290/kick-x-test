# server

서버 전용 비즈니스 로직을 배치합니다.

- `repositories/`: Supabase PostgreSQL 조회/저장
- `services/`: Performance, 선수 가격, 거래, 랭킹 등 핵심 규칙

UI 코드와 외부 API 클라이언트 코드는 이 폴더에 두지 않습니다.
