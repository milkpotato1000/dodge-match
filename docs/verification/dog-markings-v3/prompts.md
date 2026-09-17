# 강아지 외형 편집 지시

2026-09-17, 내장 image_gen 편집. 원본의 자세·표정·몸/꼬리 점무늬·투명 배경을 유지한다.

공통 지시: 보는 사람 기준 왼쪽 얼굴과 눈 주변은 흰색, 오른쪽 얼굴은 검정, 흰 주둥이 유지.
양쪽 귀는 검정이며 약15% 짧고 약10% 좁게. 왼쪽 귀 부착 경계의 좁은 검정 띠만 얼굴로 내려오게.
반전 금지, 기존 외곽선·보라 음영·청록 림라이트 보존. 발/꼬리 잘림 없이 실제 알파 PNG.

- 기본: 기존 웃는 선 자세 보존. 원본 player-dog-idle-v2.
- 울음: 기존 웅크린 자세·감은 눈·큰 파란 눈물·작게 벌린 입 보존. 원본 player-dog-forbidden-cry-v1.
- 로딩: 한 줄6프레임·기존 달리기 동작과 네 번째 앞발 든 웃는 도약 보존. 원본 player-dog-loading-run-v1.
- 로딩 재편집: 각 프레임의 발/꼬리가 이웃 프레임과 겹치지 않도록 투명 간격 확보.
  생성 결과의 실제 간격을 기준으로 CSS와 성공 프레임의 원본 좌표 범위를 지정했다.

편집된 마스터는 docs/design/characters/*-v3.png 및 cry-v2/loading-run-v2에 저장.
실제 생성 프롬프트 전문은 이 작업의 image_gen 호출에 기록되어 있다.

## 최종 보정 — 사용자 직접 그린 경계 + 자연스러운 털

[user-boundary.png](user-boundary.png)가 최우선 무늬 기준이다.
머리 위 양쪽은 검정, 좁은 중앙 흰 이마선 유지, 왼쪽 눈 주변/볼 흰색.
검정은 왼쪽 관자놀이 바깥으로 이어지고, 오른쪽 눈 주변은 검정.
내장 image_gen 편집으로 차콜 털에 보라회색 하이라이트·가는 결·털 경계를 넣어
평평한 덧칠 느낌과 과도한 청록 테두리를 줄였다. 기본·울음·6프레임에 동일 적용.

최종 파일: idle-v3 / cry-v2 / loading-run-v2 (docs/design/characters).
최종 생성 결과: 72b00290(기본), a359d5c9(울음), 91ddb5bf(로딩).
로딩 프레임은 서로 분리된 원본 좌표와 여백을 그대로 렌더에서 지정한다.

최종 지시 요약: Preserve existing poses and marking boundaries; integrate black forehead
as soft charcoal fur matching ears, with fine directional strands, muted violet-gray
highlights and feathered boundaries. Maintain both black upper forehead halves around
narrow white center blaze, white viewer-left eye patch and lower cheek. Reduce electric
cyan halo, keep creamy-white fur and lavender shading. Genuine transparent alpha PNG.
