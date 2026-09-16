# Plan / Dev 하네스

## 초기 상태

빈 프로젝트에서 하네스만 구성한다. 게임 규칙, 엔진, 플랫폼과 제품 범위는 아직 미정이다. 최초 채택은 작업 방식에 대한 기준선이며 게임 구현 승인이 아니다.

| 브랜치 | 작업 위치 | 역할 |
| --- | --- | --- |
| plan | dodge-match-plan | 기획·설계·작업 계약 |
| dev | dodge-match-dev | 채택한 계약의 구현·검증 |
| main | 전용 워크트리 없음 | 명시적으로 승격한 출시 기준 |

실제 보호 경로는 `.harness/policy.json`에 정의되어 있다. `.harness/adopted-plan.json`은 dev에서만 관리한다.

## 기획 변경을 개발에 전달

1. plan에서 변경 내용과 결정 상태를 검토하고 커밋한다. 미정인 결정은 미정으로 남긴다.
2. 전달할 정확한 SHA를 `git rev-parse HEAD`로 확인한다.
3. dev에서 아래 명령을 실행한다. `<plan-SHA>`와 `<실제 검토·인계 근거>`는 실제 값으로 대체한다.

```sh
git merge <plan-SHA>
python3 scripts/contract_guard.py adopt <plan-SHA> --review-reference '<실제 검토·인계 근거>'
git add .harness/adopted-plan.json
git commit -m "Record adopted plan baseline"
python3 scripts/contract_guard.py check
python3 scripts/contract_guard.py check --target index
python3 scripts/contract_guard.py check --target HEAD
```

병합이 훅 검사에서 멈추거나 충돌하면 검토한 계약 내용으로 해결하고, 선택한 plan 커밋을 `adopt`한 후 채택 기록과 해결 파일을 스테이징하여 병합 커밋을 완료한다. 훅을 우회하지 않는다.

plan이 먼저 진행되어도 기존에 채택한 커밋과 일치하는 dev 작업은 계속할 수 있다. 계약 변경 제안은 `docs/feedback/dev/`, 진행 기록은 `docs/progress/`, 검증 근거는 `docs/verification/`에 남긴다.

## 로컬 보호와 검사

```sh
python3 scripts/contract_guard.py install
git config --get core.hooksPath
python3 scripts/contract_guard.py check
```

연결 워크트리는 `core.hooksPath=.githooks` 설정을 공유한다. 새 clone에는 별도로 훅을 설치한다.

- pre-commit: dev의 staged 보호 문서를 채택한 정확한 plan SHA와 비교한다. main 직접 커밋을 차단한다.
- pre-push: 원격 dev로 전송하는 실제 SHA를 검사한다. plan 워크트리에서 dev로 push해도 검사한다.
- worktree 검사: 보호 경로의 추적되지 않은 파일도 검사한다.

이 훅은 우회를 방지하는 접근 제어가 아니라 로컬 실수 방지 장치다. main push에 대한 사용자 승인과 제품 결정의 의미는 자동 판정하지 않는다.

## 출시 승격

사용자의 명시 요청 이후에만 검증된 dev를 main에 fast-forward 병합한다. main 직접 커밋이나 plan으로 dev 역병합은 하지 않는다.
