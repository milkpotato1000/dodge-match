# First playable — 개발 기록

- 개발일: 2026-09-17
- 채택 plan: `db10a9e1363752f74fb90098abbd4ae4c5d79fa9`
- 사용자 요청: plan 병합 후 로컬 실행 결과물까지 개발, 개발 단위별 커밋·푸시.
- 착수 당시 최신 personal/plan은 이미 dev에 병합·채택된 상태였으며 fetch로 확인했다.
- 대상 원격: `personal` → `git@github-personal:milkpotato1000/dodge-match.git`

## 개발 단위

1. `ecbf40f` — 151개 JSON 차트, 60Hz 결정론 엔진, 반사·구간 충돌,
   7색 구역·잠금·금지색 재추첨, 생명·점수. 규칙 테스트 23개 후 dev 푸시.
2. `599d036` — Phaser 플레이 화면, v2 자산, 설정·입력·카운트다운·일시정지,
   결과·로컬 기록과 브라우저 검증. dev 푸시.
3. 로컬 실행 완성 — 저장 오류 복구, 모바일 D-pad 실측 크기, 오프라인 PWA,
   코드 형식 정리, 실행 README, 검증 근거. 검증 후 이 문서와 함께 dev 커밋·푸시.

## 사용 가능한 결과

`npm ci && npm run dev`로 플레이. `npm run build && npm run preview`로
프로덕션 빌드 확인. 현재 로컬 서버는 개발 5173, 빌드 미리보기 4173 포트로 실행한다.
좌우 배치·음악·음량·효과음·진동·Reduced Effects·오디오 보정과 로컬 기록을 저장한다.
180초 차트, 151개 원과 총 만점 41,575점을 채택 계약대로 구현했다.

검증 결과와 한계: [최종 검증](../verification/first-playable/final.md).
제품 계약이나 main 브랜치는 변경하지 않았다. 실제 기기 조작감·성능 검증과
최종 상태별 캐릭터 자산·음악은 완료로 표시하지 않는다.
