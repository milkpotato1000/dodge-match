# 색 일치 v3 검증

2026-09-17, Chrome headless, 채택 plan21eea24.

- Vitest42/42, TypeScript/Vite build 통과.
- Playwright 기존8개 + 신규2개 통과. 첫 실행 신규1개 시계 fixture 불일치 실패 후 tick/time을 맞춰 수정, 신규2개 재검증 통과.
- 초기16칸과 색 중복, 시간 경과 불변, 16칸 좌표·헤어라인 경계.
- 클릭 순간 칸 판정, 콤보 반올림 후2배, 비일치 일반점수, 미입력Miss.
- 성공 칸만 재추첨, 같은 색 허용, 같은 스텝 연속 입력 새 색 반영, 합성색·문양 페이드 연속성.
- 240초247개 및 최대점수109550, 기존 물리·저장·키보드 회귀.
- 실제 캔버스 클릭으로200점·콤보1·16칸·dog-loading/happy 확인.
- 충돌 dog-cry→480ms후 결과·기본포즈, Match 소진 기본포즈 확인.
- production boot/offline reload와 오류 없음 확인.

화면: [성공](success.png), [충돌](collision.png), [16칸](sixteen-tile.png).
테스트는 타이밍·충돌을 결정적으로 주입한 fixture이며 실제240초 완주 난이도를 보증하지 않는다.
