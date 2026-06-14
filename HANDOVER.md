# 줍줍여행사 (jubjub-travel) 인수인계서

> 이 문서는 다른 봇/세션이 이 프로젝트를 이어받아 작업할 수 있도록 작성된 자급식(self-contained) 인수인계서입니다. 작성 기준일: 2026-06-14.

## 1. 프로젝트 정체성 (무엇 / 왜)

- **한 줄**: 형님 개인용 "평소보다 싼 항공권 줍줍" 도구. 실시간 Skyscanner 데이터로 8개 도시 왕복 최저가를 추적하고, 평소 대비 싼지/보통인지/비싼지 신호를 보여준다.
- **대상 도시 8곳**: 제주, 도쿄, 오사카, 후쿠오카, 오키나와, 다낭, 푸꾸옥, 방콕
- **핵심 컨셉**: 가격 신호. 30일/90일 최저가 페어를 뽑아 현재가가 평소보다 싼지(`cheap`) / 보통(`normal`) / 비싼지(`expensive`) 표시. "지금이 줍줍 타이밍인가?"를 알려주는 게 목적.
- **수익화**: (현재 미설정) 형님 개인 도구로 시작. 추후 어필리에이트(스카이스캐너/항공권 딥링크) 가능성.

## 2. 위치 / 인프라

| 항목 | 값 |
|---|---|
| 로컬 경로 (repo root) | `/Users/trollman/.openclaw/workspace/sandbox/jubjub_travel/nextjs_scaffold/` |
| GitHub | https://github.com/youngduks/jubjub-travel (push 시 Vercel 자동 배포) |
| Vercel 프로젝트 | `jubjub-travel` (projectId `prj_Qik9PsMQacvzLCOo4sKvSChTGiV2`) |
| Vercel 팀 | youngduks-projects (orgId `team_5tzm8HHcGRFS4kc9PgStHTER`) |
| 공개 URL | Vercel 배포 도메인 (커스텀 도메인 미연결 — `vercel project` 또는 대시보드에서 확인) |

## 3. 스택

- **Next.js 15.3.0** (App Router) + **React 19** + TypeScript
- **Tailwind CSS 3.4.15** (다크 테마)
- **데이터 소스**: RapidAPI **Sky-Scrapper** API (`sky-scrapper.p.rapidapi.com`)
- 렌더링: `app/page.tsx`는 **Server Component, 7일 ISR**. 빌드/요청 시 `fetchAllBaselines()`로 8도시 baseline 적재.

## 4. 주요 파일 구조

| 파일 | 역할 |
|---|---|
| `app/page.tsx` | 진입 Server Component. 7일 ISR. 8도시 baseline fetch 후 `HomeClient`에 전달 |
| `app/layout.tsx` | `<title>` "줍줍여행사 — 평소보다 싼 항공권 줍줍" 등 메타 |
| `lib/cities.ts` | 8도시 정의 + 노선별 `tax_oneway_krw`(편도 세금/유류할증) 테이블 (~162줄) |
| `lib/baseline.ts` | RapidAPI fetch + 신호 로직(cheap/normal/expensive) + top-10 페어 산출 (~212줄). **NIGHT_OPTIONS에 6박 포함** |
| `lib/baseline_seed.ts` | 2026-05-15 스냅샷 — RapidAPI 쿼터 소진 시 폴백 데이터 |
| `lib/skyscanner.ts` | 스카이스캐너 딥링크 생성 |
| `components/HomeClient.tsx` | `"use client"`. 박수(nights) 선택기 + 도시 그리드 (~208줄). 6박 옵션 추가됨 |
| `components/CityModal.tsx` | 도시별 top-10 최저가 페어 모달 (~234줄) |

## 5. 환경변수 / 자격증명

`.env.local` (gitignored, repo root). **키 이름만** 기록:

- `RAPIDAPI_KEY`
- `RAPIDAPI_KEY_2`  ← 라운드로빈(쿼터 분산)용 두 번째 키
- `RAPIDAPI_HOST=sky-scrapper.p.rapidapi.com`

> 쿼터 관리 설계: RapidAPI 키 2개를 라운드로빈으로 돌리고, 그래도 쿼터가 소진되면 `lib/baseline_seed.ts`의 2026-05-15 스냅샷으로 폴백한다.

## 6. 실행 / 배포 절차

```bash
cd /Users/trollman/.openclaw/workspace/sandbox/jubjub_travel/nextjs_scaffold
npm install
npm run dev      # localhost:3000
npm run build    # 프로덕션 빌드
npm run start    # 빌드 결과 구동
npm run lint
```

**배포**: `git push origin main` → Vercel 자동 배포. 별도 `vercel deploy` 수동 명령 불필요.

## 7. ⚠️ 현재 상태 — 커밋 안 된 WIP 있음 (작업 전 반드시 확인)

마지막 커밋: `17ef95a feat: 세금 포함 가격 — 운임 + 노선별 평균 세금/유류할증` (2026-05-16)

**커밋되지 않은 수정 5개 파일** (대부분 "6박 옵션 추가" 작업으로 보임):
- `app/layout.tsx`
- `components/CityModal.tsx`
- `components/HomeClient.tsx`
- `lib/baseline.ts`
- `tsconfig.json`

**추적 안 되는 .bak 파일 4개** (2026-05-28 백업):
- `app/layout.tsx.bak-2026-05-28`, `components/CityModal.tsx.bak-2026-05-28`, `components/HomeClient.tsx.bak-2026-05-28`, `lib/baseline.ts.bak-2026-05-28`

> **인수받는 봇에게**: 이 WIP를 커밋/배포하기 전에 형님께 의도를 확인하라. `git diff`로 변경 내용을 먼저 검토할 것. .bak 파일은 git에 커밋하지 말 것(.gitignore 또는 삭제). 마지막 실데이터 fetch는 2026-05-29 무렵.

## 8. 알아둘 것 (gotchas)

- **쿼터 소진 → seed 폴백**: 화면에 오래된 가격이 보이면 RapidAPI 쿼터 소진으로 seed(2026-05-15)가 뜨는 것일 수 있다. 키 상태/쿼터부터 확인.
- **"KV 마이그레이션 막힘" 메모는 stale로 추정**: 과거 메모에 KV 마이그레이션 관련 언급이 있었으나, **git 히스토리·현재 코드 어디에도 KV/마이그레이션 흔적 없음**. 현재 설계는 RapidAPI 키 라운드로빈 + seed 폴백이 전부. 그 메모는 기획 단계 잔재로 보고 무시해도 된다(형님 확인 권장).
- **7일 ISR**: 페이지가 7일마다 재생성되므로, 즉시 최신 가격 반영이 필요하면 재배포하거나 revalidate 주기를 조정.
- **세금 포함 가격**: 표시 가격은 운임 + 노선별 평균 세금/유류할증(`lib/cities.ts`의 `tax_oneway_krw`)이 더해진 값.

## 9. 다음/대기 작업

- (대기) 6박 옵션 WIP 마무리 → 커밋 여부 형님 결정 필요
- (아이디어) 어필리에이트/딥링크 수익화
- 메모리 노트 없음: 이 프로젝트는 auto-memory에 별도 project 메모가 아직 없다. 필요 시 생성 권장.
