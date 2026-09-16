# Dodge Match

게임 제작을 위한 기획·개발 분리 저장소. plan/dev 하네스가 구성되어 있으며, 회피와 색상 타이밍 게임을 좌우 화면에서 동시에 플레이하는 모바일·PC 웹 게임을 로컬에서 플레이할 수 있습니다.

기획은 [초기 기획 개요](docs/planning/project-brief.md)에서 시작하고, 확정한 범위는 [개발 인계 계약](docs/planning/development-contract.md)에 정리합니다.

- `plan`: 게임 기획, 설계, 개발에 전달할 계약
- `dev`: 채택한 기획에 따른 구현과 검증
- `main`: 명시적으로 승격한 출시 기준

작업 규칙은 [AGENTS.md](AGENTS.md), 채택 및 검증 명령은 [하네스 작업 절차](docs/process/plan-dev.md)를 확인하세요.

## 개발 환경 구성

```sh
git clone -o personal -b plan https://github.com/milkpotato1000/dodge-match.git dodge-match-plan
cd dodge-match-plan
git worktree add ../dodge-match-dev dev
python3 scripts/contract_guard.py install
cd ../dodge-match-dev
python3 scripts/contract_guard.py check
```

원격은 `personal`만 사용합니다. 로컬 훅을 사용하려면 Git과 Python 3가 필요합니다.

## 로컬 플레이

Node.js 22.12 이상(또는 24 LTS)과 npm을 사용합니다. dev 워크트리에서 실행하세요.

```sh
npm ci
npm run dev
```

브라우저에서 http://127.0.0.1:5173 을 엽니다. WASD/방향키 또는 외곽 D-pad로
움직이고, 다른 손가락이나 마우스로 Match 원을 누릅니다. 링이 닿을 때 입력하며
캐릭터의 현재 구역과 같은 색은 누르지 않습니다. Escape 또는 우측 상단 버튼으로
일시정지합니다. 세로 화면에서는 가로 전환 안내가 표시됩니다.

```sh
npm run build
npm run preview
```

프로덕션 빌드는 `dist/`에 생성되며 기본 미리보기 주소는 http://127.0.0.1:4173 입니다.
HTTP 서버로 실행해야 합니다(`index.html` 파일 직접 열기는 지원하지 않음).
프로덕션을 온라인으로 한 번 열고 서비스 워커 설치가 끝나면 오프라인 재실행도 가능합니다.
개발 서버에서는 서비스 워커를 등록하지 않습니다.

### 검증

```sh
npm test
npm run build
npm run test:e2e
python3 scripts/contract_guard.py check
```

브라우저 검증에는 설치된 Google Chrome이 필요합니다. Playwright 설정이 개발/미리보기
서버를 자동 실행하므로 먼저 빌드를 생성하세요. 규칙·저장 테스트, Chrome 입력/기록,
모바일 터치 에뮬레이션, 프로덕션 오프라인 검증을 포함합니다.
검증 근거는 `docs/verification/first-playable/`, 개발 기록은 `docs/progress/first-playable.md`입니다.

### 현재 범위

180초 First Orbit 차트, 151개 원, 고정 스텝 회피·벽 반사·충돌, 7색 판정,
금지색 한 칸 재추첨, 점수·생명·콤보, 좌우 교환, 일시정지, 로컬 기록이 구현되어 있습니다.
음악은 120 BPM 테스트 클릭이며 최종 곡이 아닙니다. 기본 v2 강아지와 로딩 자산을 사용하고,
나머지 최종 상태별 그림과 온라인 리더보드는 후속 범위입니다. 기록은 현재 브라우저에만 저장됩니다.
실제 iOS/Android 기기 성능과 터치 감각은 별도 플레이 테스트가 필요합니다.
