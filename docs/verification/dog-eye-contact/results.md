# 왼쪽 눈 바깥 경계 접촉 보정

2026-09-17, 사용자 요청, plan e6b9fb8 채택.

내장 image_gen 편집. 기존 기본·울음·로딩6개 자세를 유지하며 왼쪽 관자놀이의 검정 털을
왼쪽 눈 바깥 경계 일부까지 이어 흰 틈을 없앴다. 눈 전체를 감싸지 않고 아래·안쪽 흰색 유지.
중앙 흰 이마선, 양쪽 검정 귀, 자연스러운 털 결과 음영 유지. 이전 마스터 보존.

편집 지시: Extend viewer-left charcoal temple fur slightly until it directly touches the
outer-left eye corner, no white gap. Only outer-left portion of eye perimeter; preserve white
below and inside the eye, central blaze, natural fur, exact poses and transparent alpha.
울음은 감은 눈의 왼쪽 끝에, 로딩은6개 자세 모두 같은 기준을 적용한다.

최종 경로: docs/design/characters/player-dog-idle-v4.png,
player-dog-cry-v3.png, player-dog-loading-run-v3.png.
RGBA 알파와 런타임/마스터 바이트 일치: [assets.json](assets.json).

검증: TypeScript/Vite 빌드 통과, 모션2개+production offline1개=브라우저3개 통과.
계약가드·공백 검사 통과. [성공](success.png), [충돌](collision.png).
