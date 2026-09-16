# Dodge Match

게임 제작을 위한 기획·개발 분리 저장소. 현재는 하네스 초기 구성 단계이며 게임 규칙과 기술 선택은 미정입니다.

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
