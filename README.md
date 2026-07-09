# A Visual Analysis of Best-of-N Series

Best-of-N(Bo3/Bo5/Bo7) 시리즈의 모든 결과를 **하나의 다이아몬드** 위에서 탐험하는 인터랙티브 시각화.

🔗 **Live**: https://claude.ai/code/artifact/e3b3dabd-7767-4e2b-9ff7-efdea0800b8c

마우스로 다이아몬드를 가로지르면 시리즈가 그려집니다 — 칸의 위쪽은 승리(초록), 아래쪽은 패배(빨강). 한 팀의 관점에서 승/패를 기록하며, N승(포맷이 정하는 목표 승수)을 확정하는 순간 경로 전체가 승자의 색으로 물들고 패턴의 이름이 나타납니다.

## 다이어그램의 원리

다이아몬드는 45° 회전된 **N×N 격자**입니다 (Bo3=2×2, Bo5=3×3, Bo7=4×4). 각 칸은 스코어 상태 `(승, 패)`를 나타내고, 경로는 **칸의 정중앙에서 다음 칸의 정중앙으로** 이동합니다. 어느 한쪽이 N승에 도달하면 경로는 화살표가 되어 승리 변(우상) 또는 패배 변(우하)을 뚫고 나갑니다. 변 위의 교차 지점이 곧 최종 스코어입니다 — 산맥의 정상이 N:0, 산기슭이 N:(N-1) (Bo5라면 3:0 ~ 3:2).

## 기능

| 기능 | 설명 |
|---|---|
| **Home** | 커서 트레이싱으로 시리즈 그리기. 완성 시 패턴 이름 + 태그라인 + `n / 20` 페이지네이션 |
| **Anatomy** | 다이어그램 해부도(120% 확대, 무채색). 부위 호버 시 나머지는 디밍되고 이름·설명 표시 |
| **Settings** | Bo3(2×2) / Bo5(3×3) / Bo7(4×4) 전환. 이름 카탈로그·눈금·격자 자동 재생성 |
| **◀ ⇅ ▶** | 완성된 결과를 카탈로그 순서로 순회(거울 대칭 순서), 수직 뒤집기로 상대 입장 반전 |
| **⬇ 다운로드** | 시리즈를 하나 그린 뒤 누르면 다이어그램 + 점수/이름/태그라인을 PNG로 저장 |
| **🌐 한/EN** | 전체 UI·태그라인·해부도 이중 언어. 전환 시 픽셀 시프트 없음 |
| **☀/☾** | 라이트/다크 테마 (OS 설정 기본, 수동 토글) |

## 세계관 용어집

시리즈는 하나의 전쟁이고, 다이아몬드는 그 전쟁의 지형도입니다.

| 부위 | EN | KO |
|---|---|---|
| 큰 다이아몬드 | The War Zone | 전장 |
| 작은 칸 | The Battlefield | 격전지 |
| 그린 경로 | The Warpath | 진군로 |
| 가운데 점선 (동률선) | River of Dominance | 우세의 강줄기 |
| 우상 변 (승리 결승선) | Mountains of Victory | 승리의 산맥 |
| 우하 변 (패배 결승선) | Cliff of Defeat | 패배의 절벽 |
| 승리 매치포인트 칸들 | Ridge of Joy | 환희의 능선 |
| 패배 매치포인트 칸들 | Valley of Fear | 공포의 골짜기 |
| 마지막 칸 (N-1:N-1, Bo5라면 2:2) | The Final Cape | 최후의 곶 |

서쪽에서 상륙해, 강을 사이에 두고 능선과 골짜기를 지나, 곶에서 마지막 승부를 치르고 — 산맥을 넘거나 절벽 아래로 떨어집니다. 풀세트 승부는 예외 없이 최후의 곶을 통과합니다.

## Bo5 패턴 이름 (20종)

| 스코어 | 시퀀스 | 이름 |
|---|---|---|
| 3:0 | WWW | Sweep |
| 3:1 | LWWW / WLWW / WWLW | Wake-Up Call / Speed Bump / Stutter Step |
| 3:2 | WWLLW / WLWLW / WLLWW / LWWLW / LWLWW / LLWWW | The Great Escape / Flip Flop / Turnaround / Dogfight / Late Surge / Reverse Sweep |
| 2:3 | LLWWL / LWLWL / LWWLL / WLLWL / WLWLL / WWLLL | Heartbreaker / Flip Flopped / Collapse / Quicksand / Fizzle / Reverse Swept |
| 1:3 | WLLL / LWLL / LLWL | False Dawn / Dead Cat Bounce / Last Gasp |
| 0:3 | LLL | Swept |

Bo3/Bo7에서는 일반화 가능한 4종(Sweep / Swept / Reverse Sweep / Reverse Swept)만 유지되고, 나머지 결과는 W–L 테이프로 표시됩니다. 카탈로그 순서는 거울 대칭 — i번째와 (끝-i+1)번째가 항상 서로의 반전이라 순회 시 그래프 변화가 대칭입니다.

## 기술 노트

- 경로 재구성은 마우스 이동마다가 아니라 **시리즈가 실제로 바뀔 때만** 수행 — 드로잉 애니메이션이 끊기지 않음
- 화살촉(SVG marker)은 선 드로잉 `animationend` 시점에 부착 — 마커가 애니메이션을 앞지르는 문제 방지
- 언어/포맷/모드 토글 시 **픽셀 시프트 0**: 고정 높이·라인하이트, 고정 옵션 폭, 예약 min-height
- 스크롤바 없음: `vh` 바운드 크기 + 오버플로우 시 스크롤바 크롬 숨김
- `prefers-reduced-motion` 존중, 키보드 포커스 스타일, ARIA 라벨 적용
- 다운로드 이미지는 실제 라이브 SVG를 `<img>`로 래스터화해 합성 — 마커/패턴이 그대로 보존됨. 텍스트는
  캔버스에 직접 그려서 합성(‑ `foreignObject`는 Chromium/WebKit에서 캔버스를 "tainted" 처리해 `toBlob`이
  막히기 때문에 의도적으로 피함)

## 개발

배포되는 `index.html`은 이제 **빌드 산출물**입니다 — 소스는 `src/`에 있는 React + TypeScript 코드이고,
`npm run build`가 이를 단일 HTML 파일로 번들링해 리포지토리 루트의 `index.html`을 덮어씁니다
(외부 리소스 참조 없이 그대로 열리거나 공유 가능한 건 이전과 동일).

```bash
npm install
npm run dev      # http://localhost:5173, 핫리로드
npm run build    # dist/index.html 생성 후 ./index.html로 복사
```

주요 파일:

| 경로 | 내용 |
|---|---|
| `src/engine/DiagramEngine.ts` | 트레이싱·애니메이션·해부도 호버 등 원본 vanilla JS 로직을 그대로 이식한 명령형 엔진 (타이밍에 민감한 애니메이션 때문에 의도적으로 React state가 아닌 ref 기반) |
| `src/lib/series.ts` | 격자 기하학·스코어 집계·카탈로그 순수 함수 |
| `src/data/{names,i18n,parts}.ts` | 패턴 이름/태그라인, 다국어 문자열, 해부도 설명 |
| `src/components/*.tsx` | 정적 마크업(다이어그램 SVG, 리드아웃, 패널, 버튼) |
| `src/lib/exportImage.ts` | 다운로드 이미지 합성 |
| `index.original.html` | 리팩토링 전 원본 단일 파일 (참고용 백업) |
