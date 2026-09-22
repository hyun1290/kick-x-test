# features

KICK-X의 도메인별 기능 코드를 모아두는 폴더입니다.

- `auth/`: 로그인, 로그아웃, 사용자 인증
- `players/`: 선수 목록, 상세 정보, 경기 기록
- `market/`: 선수 매수/매도, 시세, 거래 내역
- `squad/`: 보유 선수와 라인업/포메이션
- `ranking/`: 총자산, 수익률, 랭킹
- `community/`: 구단/선수 커뮤니티

페이지 라우팅은 `app/`, DB 접근은 `server/repositories/`, 핵심 계산 규칙은 `server/services/`에서 담당합니다.
