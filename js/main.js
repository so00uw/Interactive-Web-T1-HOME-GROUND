// ===== 무대 크기 맞추기 =====
// 1920×1080 무대를 창 안에 비율을 유지한 채 꽉 차게 맞춘다 (letterbox).
const STAGE_W = 1920;
const STAGE_H = 1080;

function fitStage() {
  const scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
  document.getElementById("stage").style.setProperty("--stage-scale", scale);
}

window.addEventListener("resize", fitStage);
fitStage();

// ===== 날짜 라벨 =====
// 회색 깃발 + 층까지 이어지는 가로선. 좌표는 reference/01-main.png 기준.
// side: 깃발이 층의 어느 쪽에 있는지 / lineY: 가로선 높이 / edgeX: 층(F1~F3) 테두리와 만나는 x
// flagX: 깃발의 층 쪽 끝 x / flagW: 깃발 전체 폭 (사선 포함)
const DATE_LABELS = [
  { day: "day1", date: "8/14", side: "right", lineY: 258, edgeX: 1261, flagX: 1328, flagW: 66 },
  { day: "day2", date: "8/15", side: "left", lineY: 553, edgeX: 738, flagX: 602, flagW: 66 },
  { day: "day3", date: "8/16", side: "right", lineY: 862, edgeX: 1112, flagX: 1328, flagW: 66 },
];
const FLAG_H = 24;
const FLAG_PAD = 4; // 글자와 깃발 바깥 끝 사이 여백
const FLAG_SLANT = 22; // 사선 부분 폭

function drawDateLabels() {
  const svg = document.getElementById("date-labels");
  const NS = "http://www.w3.org/2000/svg";

  DATE_LABELS.forEach(({ day, date, side, lineY, edgeX, flagX, flagW }) => {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("id", `${day}-date-label`);
    g.setAttribute("class", "date-label");

    const line = document.createElementNS(NS, "line");
    line.setAttribute("class", "date-label-line");
    line.setAttribute("x1", edgeX);
    line.setAttribute("x2", flagX);
    line.setAttribute("y1", lineY);
    line.setAttribute("y2", lineY);

    // 깃발: 층 쪽 아래 모서리에서 사선으로 올라가는 사다리꼴
    const bottom = lineY + 1;
    const top = bottom - FLAG_H;
    const dir = side === "right" ? 1 : -1;
    const farX = flagX + dir * flagW;
    const flag = document.createElementNS(NS, "polygon");
    flag.setAttribute("class", "date-label-flag");
    flag.setAttribute("points", [
      [flagX, bottom],
      [flagX + dir * FLAG_SLANT, top],
      [farX, top],
      [farX, bottom],
    ].join(" "));

    const text = document.createElementNS(NS, "text");
    text.setAttribute("class", "date-label-text");
    // 글자는 깃발 바깥 끝 쪽에 붙인다
    text.setAttribute("x", farX - dir * FLAG_PAD);
    text.setAttribute("text-anchor", side === "right" ? "end" : "start");
    text.setAttribute("y", (top + bottom) / 2);
    text.textContent = date;

    g.append(line, flag, text);
    svg.append(g);
  });
}

drawDateLabels();

// ===== 이동경로 번호 (1)~(4) =====
// 그날 부스를 돈 순서. 층과 함께 움직이도록 각 날짜 그룹(day1~day3) 안에 넣는다.
// 좌표는 reference/01-main.png에서 잰 글자 중심. [번호, x, y, 해당 부스]
const ROUTE_LABELS = {
  day1: [[1, 1126.5, 386.5, "k9"], [2, 829.5, 374, "spotify"], [3, 633.5, 197.5, "membership"], [4, 1217.5, 166, null]],
  day2: [[1, 1126.5, 687.5, "k9"], [2, 829.5, 675, "spotify"], [3, 633.5, 500.5, "membership"], [4, 1174.5, 500, null]],
  day3: [[1, 1126.5, 986.5, "k9"], [2, 658.5, 782, "membership"], [3, 829.5, 968.5, "spotify"]],
};

function drawRouteLabels() {
  const NS = "http://www.w3.org/2000/svg";

  Object.entries(ROUTE_LABELS).forEach(([day, labels]) => {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("id", `${day}-route`);
    g.setAttribute("class", "route-labels");

    labels.forEach(([num, x, y, booth]) => {
      const text = document.createElementNS(NS, "text");
      text.setAttribute("class", booth ? `route-label route-${booth}` : "route-label");
      text.setAttribute("x", x);
      text.setAttribute("y", y);
      text.textContent = `(${num})`;
      g.append(text);
    });

    document.getElementById(day).append(g);
  });
}

drawRouteLabels();

// k9 부스 이름: 호버 시 14일 (1) 옆에 표시
function drawK9Name() {
  const NS = "http://www.w3.org/2000/svg";
  const [, x, y] = ROUTE_LABELS.day1.find(([num]) => num === 1);
  const text = document.createElementNS(NS, "text");
  text.setAttribute("id", "k9-name");
  text.setAttribute("x", x + 12);
  text.setAttribute("y", y);
  text.textContent = BOOTHS.k9.name;
  document.getElementById("day1-route").append(text);
}

drawK9Name();

// ===== 화면 상태 =====
// mode: "main" | "outside" | "inside" | "outside-detail" | "inside-detail"
// #stage에 mode-* 클래스(디테일이면 detail-{부스}도)로 반영하고, 모양은 CSS가 맡는다.
const stage = document.getElementById("stage");
const modeButtons = document.querySelectorAll(".mode-btn");
const MODES = ["main", "outside", "inside", "outside-detail", "inside-detail"];
const INSIDE_DELAY = 900; // INSIDE 선택 후 디테일로 넘어가기까지 (부스가 흐려지는 걸 보여 주는 시간)
const DETAIL_BOOTHS = ["membership", "spotify"];
let mode = "main";
let detailBooth = null;
let insideTimer = null;

function setMode(next, booth = null) {
  clearTimeout(insideTimer);
  mode = next;
  detailBooth = booth;
  MODES.forEach((m) => stage.classList.toggle(`mode-${m}`, m === mode));
  DETAIL_BOOTHS.forEach((b) => stage.classList.toggle(`detail-${b}`, b === detailBooth));
  modeButtons.forEach((btn) => btn.classList.toggle("is-selected", btn.dataset.mode === mode));
  setHoverBooth(null);
  if (mode === "outside-detail") renderOutsideDetail(booth);
  // INSIDE: 부스가 흐려진 뒤 다른 인터랙션 없이 자동으로 디테일로
  if (mode === "inside") insideTimer = setTimeout(() => setMode("inside-detail"), INSIDE_DELAY);
}

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.mode;
    if (target === "event") return; // EVENT INFO는 9단계에서
    // 같은 버튼을 다시 누르면 선택 해제
    setMode(mode === target ? "main" : target);
  });
});

// ESC: 한 단계 뒤로 (디테일 → 메인, 선택 상태 → 메인)
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && mode !== "main") setMode("main");
});

// 홈 아이콘 → 메인
document.getElementById("home-btn").addEventListener("click", () => setMode("main"));

// ===== 부스 호버 (OUTSIDE 선택 상태에서만) =====
// 어느 날짜 구역에 올려도 그 부스의 3일치가 함께 반응한다.
// membership, spotify: 연결 기둥 + 호버 사진 / k9: 이름만
const HOVER_BOOTHS = ["membership", "spotify", "k9"];

function setHoverBooth(booth) {
  HOVER_BOOTHS.forEach((b) => stage.classList.toggle(`hover-${b}`, b === booth));
}

HOVER_BOOTHS.forEach((booth) => {
  document.querySelectorAll(`#stadium [id$="-booth-${booth}"]`).forEach((el) => {
    el.addEventListener("mouseenter", () => {
      if (mode === "outside") setHoverBooth(booth);
    });
    el.addEventListener("mouseleave", () => setHoverBooth(null));
    // 클릭 → 해당 부스의 Outside 디테일
    if (DETAIL_BOOTHS.includes(booth)) {
      el.addEventListener("click", () => {
        if (mode === "outside") setMode("outside-detail", booth);
      });
    }
  });
});

// ===== Outside 디테일 =====
// 도면은 CSS로 오른쪽으로 747px 이동 (reference/04-outside 기준). 아래 좌표는 모두 이동 후 화면 좌표.
const SVG_NS = "http://www.w3.org/2000/svg";
const TIMELINE_W = 382; // 세 날짜 모두 같은 길이
const TICK = 12; // 타임라인 끝과 입장 지점에서 위로 올라가는 눈금 길이
const WAIT_LEN = 63; // 대기 눈금 길이
const LEVEL_KEYS = ["wait", "noise", "physical"];
const ICON = { w: 36, h: 62, gap: 8 }; // 기호 한 칸

// 날짜별 행 배치. timeline: 출발 지점 x와 선 높이 y / leader: 부스 구역 점 → 꺾이는 점 → 끝 x
// 미참여(absent) 날은 timeline 대신 photo: [x, y, 폭, 높이]
const DETAIL_LAYOUT = {
  membership: {
    day1: { timeline: [645, 229], leader: [[1443, 238], [1309, 308], 1080] },
    day2: { timeline: [539, 516], leader: [[1428, 535], [1285, 596], 997] },
    day3: { timeline: [735, 748], leader: [[1435, 765], [1332, 714], 1168] },
  },
  spotify: {
    // 8/14 미참여: 지시선은 spotify 8/14 구역을 가리킨다 (reference/05-outside는 membership 쪽을 가리키고 있었음)
    day1: { photo: [870, 165, 192, 143], leader: [[1400, 290], [1309, 308], 1080] },
    day2: { timeline: [539, 516], leader: [[1400, 557], [1240, 506], 987] },
    day3: { timeline: [713, 810], leader: [[1400, 828], [1297, 776], 1133] },
  },
};

const toMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

function svgEl(tag, attrs = {}, text) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  if (text !== undefined) el.textContent = text;
  return el;
}

// 타임라인 모양: 출발~입장(청록) + 입장~귀가(분홍), 양 끝과 입장 지점에 위로 눈금
function drawTimeline(parent, x0, y0, xEnter, labels, textClass) {
  const xEnd = x0 + TIMELINE_W;
  const ty = y0 - TICK - 14;
  parent.append(
    svgEl("polyline", { class: "timeline-out", points: `${x0},${y0 - TICK} ${x0},${y0} ${xEnter},${y0} ${xEnter},${y0 - TICK}` }),
    svgEl("polyline", { class: "timeline-in", points: `${xEnter},${y0} ${xEnd},${y0} ${xEnd},${y0 - TICK}` }),
    svgEl("text", { class: textClass, x: x0, y: ty, "text-anchor": "middle" }, labels[0]),
    svgEl("text", { class: textClass, x: xEnter, y: ty, "text-anchor": "middle" }, labels[1]),
    svgEl("text", { class: textClass, x: xEnd, y: ty, "text-anchor": "middle" }, labels[2])
  );
}

// 기호 한 칸: 아래에서부터 level(1/3, 2/3, 3/3)만큼 그라데이션 배경(외부 청록 / 내부 분홍) + 아이콘
function drawLevelIcon(parent, key, x, y, level, gradient = "level-gradient") {
  const g = svgEl("g", { class: "level-icon", transform: `translate(${x} ${y})` });
  const fillH = ICON.h * level;
  g.append(
    svgEl("rect", { x: 0, y: ICON.h - fillH, width: ICON.w, height: fillH, fill: `url(#${gradient})` }),
    svgEl("image", { href: `assets/icons/${key}.svg`, x: 2.5, y: 0, width: 31, height: ICON.h })
  );
  parent.append(g);
}

function drawDayRow(svg, booth, day) {
  const data = BOOTHS[booth].days[day];
  const layout = DETAIL_LAYOUT[booth][day];
  const g = svgEl("g", { class: "detail-row", id: `detail-${day}` });

  // 지시선: 부스 구역 → 꺾임 → 화면 가운데 쪽. 선 위에 날짜, 아래에 날씨
  const [[ax, ay], [bx, by], endX] = layout.leader;
  g.append(
    svgEl("polyline", { class: "leader-line", points: `${ax},${ay} ${bx},${by} ${endX},${by}` }),
    svgEl("text", { class: "detail-time", x: endX, y: by - 10 }, WEATHER[day].date),
    svgEl("text", { class: "detail-time", x: endX, y: by + 10 }, WEATHER[day].text)
  );

  if (data.absent) {
    // 미참여: 사진 + "*미참여"
    const [px, py, pw, ph] = layout.photo;
    g.append(
      svgEl("image", { href: data.photo, x: px, y: py, width: pw, height: ph, preserveAspectRatio: "xMidYMid slice" }),
      svgEl("text", { class: "detail-time", x: px - 14, y: py + ph - 7, "text-anchor": "end" }, "*미참여")
    );
    svg.append(g);
    return;
  }

  // 타임라인: 왼쪽 끝 = 출발, 오른쪽 끝 = 귀가. 그 사이 시각은 비율로 위치
  const [x0, y0] = layout.timeline;
  const start = toMin(data.depart);
  const span = toMin(data.leave) - start;
  const xOf = (t) => x0 + ((toMin(t) - start) / span) * TIMELINE_W;
  drawTimeline(g, x0, y0, xOf(data.enter), [data.depart, data.enter, data.leave], "detail-time");

  // 대기 눈금: 대기 시작·종료 (대기 없던 날은 도착 시각 1개)
  const LABEL_HALF = 15; // 시각 글자 폭의 절반 (대략)
  const waitXs = data.wait.map(xOf);
  // 두 눈금이 가까우면 글자가 겹치지 않게 좌우로 벌린다
  let labelXs = waitXs;
  if (waitXs.length === 2 && waitXs[1] - waitXs[0] < LABEL_HALF * 2 + 4) {
    const mid = (waitXs[0] + waitXs[1]) / 2;
    labelXs = [mid - LABEL_HALF - 2, mid + LABEL_HALF + 2];
  }
  data.wait.forEach((t, i) => {
    g.append(
      svgEl("line", { class: "wait-tick", x1: waitXs[i], y1: y0, x2: waitXs[i], y2: y0 + WAIT_LEN }),
      svgEl("text", { class: "detail-time", x: labelXs[i], y: y0 + WAIT_LEN + 9, "text-anchor": "middle" }, t)
    );
  });

  // 기호 3개: 대기 눈금(과 그 시각 글자) 오른쪽
  const iconX = Math.max(waitXs.at(-1) + 28, labelXs.at(-1) + LABEL_HALF + 12);
  const iconY = y0 + 18;
  LEVEL_KEYS.forEach((key, i) => {
    drawLevelIcon(g, key, iconX + i * (ICON.w + ICON.gap), iconY, data.level[key]);
  });

  // 메모: 기호 오른쪽 위
  if (data.memo) {
    const memoX = iconX + 3 * ICON.w + 2 * ICON.gap + 12;
    g.append(svgEl("text", { class: "detail-time", x: memoX, y: iconY + 9 }, data.memo));
  }

  svg.append(g);
}

// 정보 박스: 제목 + 항목들. 항목은 [클래스, 글] 줄의 목록
function fillInfoBox(box, title, items) {
  box.innerHTML = "";
  const h = document.createElement("h3");
  h.textContent = title;
  box.append(h);
  items.forEach((lines) => {
    const item = document.createElement("div");
    item.className = "booth-event";
    lines.forEach(([cls, text]) => {
      const p = document.createElement("p");
      p.className = cls;
      p.textContent = text;
      item.append(p);
    });
    box.append(item);
  });
}

function renderBoothInfo(booth) {
  const { name, events } = BOOTHS[booth];
  // "Event 1 · 제목" → "Event 1" / "제목" 두 줄
  const items = (events || []).map(({ title, desc }) => {
    const [label, ...rest] = title.split(" · ");
    return [["event-label", label], ["event-title", rest.join(" · ")], ["event-desc", desc]];
  });
  fillInfoBox(document.getElementById("booth-info"), name, items);
}

function renderOutsideDetail(booth) {
  renderBoothInfo(booth);

  const svg = document.getElementById("detail-rows");
  svg.querySelectorAll(".detail-row").forEach((el) => el.remove());
  ["day1", "day2", "day3"].forEach((day) => drawDayRow(svg, booth, day));

  // 다른 부스로 넘어가는 버튼: 다음 부스 이름 표시
  const other = DETAIL_BOOTHS.find((b) => b !== booth);
  const switchBtn = document.getElementById("booth-switch");
  switchBtn.textContent = BOOTHS[other].name;
  switchBtn.dataset.booth = other;
}

document.getElementById("booth-switch").addEventListener("click", (e) => {
  setMode("outside-detail", e.currentTarget.dataset.booth);
});

// ===== Inside 디테일 =====
// 도면은 CSS로 왼쪽으로 267px 이동. 깔때기와 말풍선은 이미지. 아래 좌표는 reference/02-inside 기준.
// line: 깔때기에서 날짜까지 가로선 [시작 x, 끝 x] / y: 그 높이
const INSIDE_LAYOUT = {
  day1: { line: [1509, 1550], y: 413 },
  day3: { line: [1487, 1549], y: 675 },
};
const INSIDE_LEVEL_KEYS = ["physical", "side"];

function renderInsideDetail() {
  fillInfoBox(
    document.getElementById("inside-info"),
    INSIDE.title,
    INSIDE.events.map(({ label, desc }) => [["event-label", label], ["event-desc", desc]])
  );

  const svg = document.getElementById("inside-rows");
  Object.entries(INSIDE_LAYOUT).forEach(([day, { line: [x1, x2], y }]) => {
    const match = INSIDE.matches[day];
    const g = svgEl("g", { class: "match-row" });
    g.append(
      svgEl("line", { class: "match-line", x1, y1: y, x2, y2: y }),
      svgEl("text", { class: "match-date", x: 1561, y }, WEATHER[day].date),
      svgEl("text", { class: "match-score", x: 1628, y }, match.score),
      svgEl("text", { class: "match-team", x: 1681, y }, match.team)
    );
    // 기호: 신체적 피로도, 옆자리 불편
    INSIDE_LEVEL_KEYS.forEach((key, i) => {
      drawLevelIcon(g, key, 1679 + i * (ICON.w + ICON.gap), y + 28, match.level[key], "level-gradient-inside");
    });
    // 정규 라운드 기록
    match.record.forEach((text, i) => {
      g.append(svgEl("text", { class: "detail-time", x: 1680, y: y + 105 + i * 19 }, text));
    });
    svg.append(g);
  });

  // 좌하단 범례: 기호 2개와 이름, 정도 견본
  const names = { side: "옆자리 불편", physical: "신체적 피로도" };
  ["side", "physical"].forEach((key, i) => {
    const y = 836 + i * 61;
    svg.append(
      svgEl("image", { href: `assets/icons/${key}.svg`, x: 58, y, width: 24, height: 48 }),
      svgEl("text", { class: "legend-text", x: 96, y: y + 39 }, names[key])
    );
  });
  const BAR_H = 52;
  [1 / 3, 2 / 3, 1].forEach((level, i) => {
    const h = BAR_H * level;
    svg.append(svgEl("rect", { x: 54 + i * 47, y: 1016 - h, width: ICON.w, height: h, fill: "url(#level-gradient-inside)" }));
  });
  svg.append(svgEl("text", { class: "legend-text", x: 196, y: 1008 }, "정도"));
}

renderInsideDetail();

// ===== 좌하단 범례 =====
function drawLegend() {
  const svg = document.getElementById("detail-legend");

  // 기호 3개와 이름
  const names = { wait: "대기 시간", noise: "소음", physical: "신체적 피로도" };
  LEVEL_KEYS.forEach((key, i) => {
    const y = 704 + i * 60;
    svg.append(
      svgEl("image", { href: `assets/icons/${key}.svg`, x: 58, y, width: 24, height: 48 }),
      svgEl("text", { class: "legend-text", x: 96, y: y + 40 }, names[key])
    );
  });

  // 정도: 1/3, 2/3, 전체 견본
  [1 / 3, 2 / 3, 1].forEach((level, i) => {
    const h = ICON.h * level;
    svg.append(svgEl("rect", { x: 207 + i * 47, y: 873 - h, width: ICON.w, height: h, fill: "url(#level-gradient)" }));
  });
  svg.append(svgEl("text", { class: "legend-text", x: 348, y: 864 }, "정도"));

  // 타임라인: 실제 행과 같은 모양, 시각 대신 이름
  const x0 = 75, y0 = 953;
  drawTimeline(svg, x0, y0, 271, ["출발시간", "경기장 입장", "귀가시간"], "legend-text");
  [[130, "대기시작"], [198, "대기종료"]].forEach(([x, label]) => {
    svg.append(
      svgEl("line", { class: "wait-tick", x1: x, y1: y0, x2: x, y2: y0 + WAIT_LEN }),
      svgEl("text", { class: "legend-text", x, y: y0 + WAIT_LEN + 9, "text-anchor": "middle" }, label)
    );
  });

  // 정신적 피로도: 도면 구역 색 3단계. 우측 하단, 오른쪽 정렬 (오른쪽 여백 45 = 메인 우측 버튼과 같음)
  const fx = 1920 - 45, fy = 930;
  svg.append(svgEl("text", { class: "legend-text", x: fx, y: fy, "text-anchor": "end" }, "정신적 피로도"));
  ["#D1E9EF", "#9ECCD4", "#61A6B2"].forEach((color, i) => {
    svg.append(svgEl("rect", { x: fx - ICON.w - (2 - i) * 47, y: fy + 14, width: ICON.w, height: 20, fill: color }));
  });
  svg.append(
    svgEl("text", { class: "legend-text", x: fx, y: fy + 54, "text-anchor": "end" }, "세 기호의 정도가 합쳐진 결과 = 도면 구역의 색"),
    svgEl("text", { class: "legend-text", x: fx, y: fy + 70, "text-anchor": "end" }, "(정신적 피로도)")
  );
}

drawLegend();

setMode("main");

// ===== stadium.svg id 점검 (개발용) =====
// spec에서 쓰는 id가 SVG에 없으면 콘솔에 경고를 띄운다.
const REQUIRED_IDS = [
  "day1", "day2", "day3",
  "day1-building", "day2-building", "day3-building",
  ...["membership", "spotify", "k9"].flatMap((booth) =>
    [1, 2, 3].map((day) => `day${day}-booth-${booth}`)
  ),
  "link-membership", "link-spotify",
  "link-membership-d1-d2", "link-spotify-d1-d2",
  "day1-roof",
];

const missingIds = REQUIRED_IDS.filter((id) => !document.getElementById(id));
if (missingIds.length) {
  console.warn("stadium.svg에 없는 id:", missingIds);
} else {
  console.log("stadium.svg id 점검: 모두 있음");
}
