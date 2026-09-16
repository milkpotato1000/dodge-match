# Dodge Match

게임 제작을 위한 기획·개발 분리 저장소. plan/dev 하네스가 구성되어 있으며, 회피와 색상 타이밍 게임을 좌우 화면에서 동시에 플레이하는 모바일·PC 웹 게임을 기획 중입니다.

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
