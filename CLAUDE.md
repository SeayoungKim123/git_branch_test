# CLAUDE.md

이 저장소에서 작업하는 AI 에이전트가 따라야 할 규칙입니다.

## 프로젝트

- HTML·CSS·JavaScript로 만든 할 일 관리 앱 (빌드 도구 없음. `package.json`은 ESLint 버전 고정용)
- 데이터는 브라우저 localStorage에 저장
- 배포: Vercel
  - `main` → 운영(Production)
  - `develop` → 스테이징(Preview)
  - 그 밖의 브랜치 → 브랜치별 미리보기(Preview)

## 브랜치

- 새 작업은 **항상 최신 `develop`에서** 시작한다.
  ```bash
  git switch develop && git pull
  git switch -c ai/<작업-이름>
  ```
- 브랜치 이름: `ai/<작업-이름>` (영문 소문자, 하이픈 연결). 예: `ai/todo-reorder`, `ai/fix-date-filter`
- 브랜치 하나에는 **작업 하나만** 담는다.

## 금지 사항

- `main`, `develop`에 직접 커밋하거나 push하지 않는다.
- PR을 병합하지 않는다. 병합은 사람이 한다.
- `git push --force`를 쓰지 않는다.
- `.env`, API 키, 토큰 같은 비밀값을 커밋하지 않는다.
- `node_modules/`를 커밋하지 않는다.
- 요청받지 않은 파일은 고치지 않는다. 관련 없어 보이는 코드 정리도 하지 않는다.
- `.github/workflows/`, `eslint.config.mjs`, 이 파일(`CLAUDE.md`)은 요청이 있을 때만 수정한다.

## 커밋 메시지

형식: `<이모지> <type>(<범위>): <설명>` — 설명은 한국어로, 무엇을 했는지 한 줄로 쓴다.

| 이모지 | type | 용도 |
|---|---|---|
| ✨ | `feat` | 새 기능 |
| 🐛 | `fix` | 버그 수정 |
| ♻️ | `refactor` | 동작은 그대로 두고 구조만 변경 |
| 🎨 | `style` | CSS·화면 스타일 |
| 📝 | `docs` | 문서 |
| ✅ | `test` | 테스트 |
| 👷 | `ci` | CI 설정 |
| 🧹 | `chore` | 그 밖의 잡무 |

예: `✨ feat(todo): 할 일 순서 변경 기능 추가`

커밋 메시지 끝에 다음 줄을 붙인다.

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

## push 전 검사

CI와 같은 린트를 로컬에서 먼저 실행하고, 오류가 없을 때만 push한다.

```bash
npm ci
npm run lint
```

- `error`는 반드시 고친다.
- `warning`은 이번 작업에서 생긴 것만 고친다.

## Pull Request

```bash
git push -u origin ai/<작업-이름>
gh pr create --base develop
```

- base는 **항상 `develop`**이다. `main`으로 PR을 올리지 않는다.
- 제목은 커밋 메시지 형식을 따른다.
- 설명은 `.github/pull_request_template.md`의 모든 항목을 채운다.
- "어떻게 확인하나"에는 미리보기에서 눌러 볼 화면과 동작을 구체적으로 적는다.

## CI가 실패하거나 리뷰 댓글이 달렸을 때

- 같은 브랜치에 수정 커밋을 추가해 push한다. 새 PR을 만들지 않는다.
- CI가 실패하면 로그의 오류 메시지를 확인하고 원인을 고친다. 검사를 끄거나 규칙을 완화하지 않는다.
- 리뷰 댓글에는 무엇을 바꿨는지 답글로 남긴다.
