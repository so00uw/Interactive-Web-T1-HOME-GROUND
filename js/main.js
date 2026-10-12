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
// mode: "main" | "outside" | "inside" | "event" | "outside-detail" | "inside-detail" | "event-detail"
// #stage에 mode-* 클래스(디테일이면 detail-{부스}도)로 반영하고, 모양은 CSS가 맡는다.
const stage = document.getElementById("stage");
const modeButtons = document.querySelectorAll(".mode-btn");
const MODES = ["main", "outside", "inside", "event", "outside-detail", "inside-detail", "event-detail"];
const AUTO_DETAIL_DELAY = 900; // INSIDE·EVENT INFO 선택 후 디테일로 넘어가기까지 (도면이 흐려지는 걸 보여 주는 시간)
const AUTO_DETAIL = { inside: "inside-detail", event: "event-detail" };
const DETAIL_BOOTHS = ["membership", "spotify"];
let mode = "main";
let detailBooth = null;
let autoDetailTimer = null;

function setMode(next, booth = null) {
  clearTimeout(autoDetailTimer);
  mode = next;
  detailBooth = booth;
  MODES.forEach((m) => stage.classList.toggle(`mode-${m}`, m === mode));
  DETAIL_BOOTHS.forEach((b) => stage.classList.toggle(`detail-${b}`, b === detailBooth));
  modeButtons.forEach((btn) => btn.classList.toggle("is-selected", btn.dataset.mode === mode));
  setHoverBooth(null);
  setEventGroup(null);
  if (mode === "outside-detail") renderOutsideDetail(booth);
  // INSIDE, EVENT INFO: 도면이 흐려진 뒤 다른 인터랙션 없이 자동으로 디테일로
  if (AUTO_DETAIL[mode]) autoDetailTimer = setTimeout(() => setMode(AUTO_DETAIL[mode]), AUTO_DETAIL_DELAY);
}

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.mode;
    // 같은 버튼을 다시 누르면 선택 해제
    setMode(mode === target ? "main" : target);
  });
});

// ESC: 한 단계 뒤로 (Event Info의 일정 선택 → 선택 해제, 디테일 → 메인, 선택 상태 → 메인)
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (eventGroup) setEventGroup(null);
  else if (mode !== "main") setMode("main");
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
// memoBelow: 메모를 기호 오른쪽이 아니라 아래에 둔다 (메모가 긴 부스)
const DETAIL_LAYOUT = {
  membership: {
    day1: { timeline: [645, 229], leader: [[1443, 238], [1309, 308], 1080] },
    day2: { timeline: [539, 516], leader: [[1428, 535], [1285, 596], 997] },
    day3: { timeline: [735, 748], leader: [[1435, 765], [1332, 714], 1168] },
  },
  spotify: {
    memoBelow: true,
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

  // 메모: 기호 오른쪽 위, 또는 기호 아래 (여러 줄이면 배열)
  if (data.memo) {
    const lines = [].concat(data.memo);
    const below = DETAIL_LAYOUT[booth].memoBelow;
    const memoX = below ? iconX : iconX + 3 * ICON.w + 2 * ICON.gap + 12;
    const memoY = below ? iconY + ICON.h + 15 : iconY + 9;
    lines.forEach((line, i) => {
      g.append(svgEl("text", { class: "detail-time", x: memoX, y: memoY + i * 18 }, line));
    });
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
  const { name, events, flow, note } = BOOTHS[booth];
  const box = document.getElementById("booth-info");
  // "Event 1 · 제목" → "Event 1" / "제목" 두 줄
  const items = (events || []).map(({ title, desc }) => {
    const [label, ...rest] = title.split(" · ");
    return [["event-label", label], ["event-title", rest.join(" · ")], ["event-desc", desc]];
  });
  fillInfoBox(box, name, items);

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  // 순서: 가운데 정렬, 단계 사이에 ↓
  if (flow) {
    const list = el("div", "booth-flow");
    flow.forEach((step, i) => {
      if (i > 0) list.append(el("p", "flow-arrow", "↓"));
      list.append(el("p", "flow-step", step));
    });
    box.append(list);
  }

  // 메모: 제목 한 줄, 원인이 있으면 "원인들 → 결과"
  if (note) {
    const wrap = el("div", "booth-note");
    wrap.append(el("p", "note-title", note.title));
    if (note.causes) {
      const row = el("div", "note-cause");
      const causes = el("div", "note-causes");
      note.causes.forEach((c) => causes.append(el("p", "", c)));
      row.append(causes, el("p", "", "→"), el("p", "", note.result));
      wrap.append(row);
    }
    box.append(wrap);
  }
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
    INSIDE.events.map(({ label, desc, note }) => [
      ["event-label", label],
      ["event-desc", desc],
      ...(note ? [["event-desc event-note", note]] : []),
    ])
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

  // 8/15: 경기가 없던 날이라 날짜만 / 깔때기 아래: 세 날이 흘러내린 결과
  svg.append(
    svgEl("text", { class: "match-date", x: 1561, y: 547 }, INSIDE.day2Date),
    svgEl("text", { class: "match-team", x: 1372, y: 744, "text-anchor": "middle" }, INSIDE.conclusion)
  );

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

// ===== Event Info =====
// 좌측 일정표의 항목을 누르면 그 묶음(booth / inside) 색이 바뀌고 사진이 나온다. 좌표는 reference/01~03-info 기준.
// 일정표 시각의 y (시간에 비례하지 않음)
const EVENT_TIME_Y = {
  "09:00": 269, "12:00": 361, "15:30": 549, "16:00": 586, "16:30": 623,
  "17:00": 660, "19:00": 848, "19:30": 885, "21:30": 996,
};
// 사진 묶음의 왼쪽 위 [x, y]. booth: 구역 제목 위 / inside: 사진 위
const EVENT_PHOTO_POS = {
  booth: [[431, 268], [993, 268], [431, 640]],
  inside: [[396, 388], [562, 388], [853, 388], [1173, 388], [1529, 388]],
};
const PHOTO_SWEEP = 0.35; // 사진이 왼쪽 끝에서 오른쪽 끝까지 차례로 나타나는 데 걸리는 시간(초)
let eventGroup = null;

function htmlEl(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// 사진은 2x로 내보낸 것이라 원본의 절반 크기로 표시
function photoEl(file) {
  const img = htmlEl("img", "event-photo");
  img.alt = "";
  img.addEventListener("load", () => {
    img.style.width = `${img.naturalWidth / 2}px`;
    img.style.height = `${img.naturalHeight / 2}px`;
  });
  img.src = `assets/photos/${file}`;
  return img;
}

function renderEventInfo() {
  const info = EVENT_INFO;
  document.getElementById("event-name").textContent = info.name;
  document.getElementById("event-slogan").textContent = info.slogan;
  document.getElementById("event-date").textContent = info.date;
  document.getElementById("event-place").textContent = info.place;

  // 일정표: 세로축 + 시각 눈금 + 항목 (항목 위쪽 가로선 색 = 묶음 색)
  const schedule = document.getElementById("event-schedule");
  const items = info.schedule;
  const top = EVENT_TIME_Y[items[0].time];
  const bottom = EVENT_TIME_Y[items.at(-1).time];
  const axis = htmlEl("div", "schedule-axis");
  axis.style.top = `${top}px`;
  axis.style.height = `${bottom - top + 1}px`;
  schedule.append(axis);

  items.forEach((item, i) => {
    const y = EVENT_TIME_Y[item.time];
    const tick = htmlEl("div", "schedule-tick");
    tick.style.top = `${y}px`;
    const time = htmlEl("p", "schedule-time", item.time);
    time.style.top = `${y}px`;
    schedule.append(tick, time);

    if (!item.name) {
      // 끝 시각: 가로선만 (앞 항목의 묶음 색)
      const end = htmlEl("div", `schedule-end group-${items[i - 1].group}`);
      end.style.top = `${y}px`;
      schedule.append(end);
      return;
    }
    const btn = htmlEl("button", `schedule-item group-${item.group}`);
    btn.type = "button";
    btn.style.top = `${y}px`;
    btn.style.height = `${EVENT_TIME_Y[items[i + 1].time] - y}px`;
    btn.append(htmlEl("span", "", item.name));
    // 같은 묶음을 다시 누르면 선택 해제
    btn.addEventListener("click", () => setEventGroup(eventGroup === item.group ? null : item.group));
    schedule.append(btn);
  });

  // Booth 사진: 구역 제목 / 사진들 / 부스 이름
  const boothPanel = document.getElementById("event-photos-booth");
  info.booth.forEach(({ title, photos, captions }, i) => {
    const area = htmlEl("div", "photo-group");
    [area.style.left, area.style.top] = EVENT_PHOTO_POS.booth[i].map((v) => `${v}px`);
    const row = htmlEl("div", "photo-row");
    photos.forEach((f) => row.append(photoEl(f)));
    const caps = htmlEl("div", "photo-captions");
    captions.forEach((c) => caps.append(htmlEl("p", "", c)));
    area.append(htmlEl("p", "photo-group-title", title), row, caps);
    boothPanel.append(area);
  });

  // 경기장 안 사진: 사진들 / 프로그램 이름 / 날짜별 내용
  const insidePanel = document.getElementById("event-photos-inside");
  info.inside.forEach(({ title, photos, details }, i) => {
    const group = htmlEl("div", "photo-group");
    [group.style.left, group.style.top] = EVENT_PHOTO_POS.inside[i].map((v) => `${v}px`);
    const row = htmlEl("div", "photo-row");
    photos.forEach((f) => row.append(photoEl(f)));
    const list = htmlEl("div", "photo-details");
    details.forEach(([day, text]) => {
      const line = htmlEl("p");
      if (day) line.append(htmlEl("span", "detail-day", day));
      line.append(text);
      list.append(line);
    });
    group.append(row, htmlEl("p", "photo-group-title", title), list);
    insidePanel.append(group);
  });
}

// 일정 묶음 선택: 색을 바꾸고 사진을 왼쪽부터 오른쪽으로 차례로 보여 준다
function setEventGroup(group) {
  eventGroup = group;
  ["booth", "inside"].forEach((g) => stage.classList.toggle(`event-${g}`, g === group));
  gsap.killTweensOf(".event-photos *");
  if (!group) return;

  // 사진은 한 장씩, 글은 묶음 단위로. 화면 x 위치에 비례해서 늦게 나타난다
  const panel = document.getElementById(`event-photos-${group}`);
  const targets = [...panel.querySelectorAll(".event-photo, .photo-group > p, .photo-captions, .photo-details")];
  const xs = targets.map((el) => el.getBoundingClientRect().left);
  const minX = Math.min(...xs);
  const range = Math.max(...xs) - minX || 1;
  gsap.fromTo(targets, { opacity: 0, x: -10 }, {
    opacity: 1,
    x: 0,
    duration: 0.4,
    ease: "power2.out",
    stagger: (i) => ((xs[i] - minX) / range) * PHOTO_SWEEP,
  });
}

renderEventInfo();

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

// ===== 인트로 → 전환 시퀀스 → 메인 =====
// 첫 방문에만 재생. 주소에 ?intro가 있으면 항상 재생.
const VISITED_KEY = "t1-home-ground-visited";
const PROGRESS_DURATION = 10; // 링이 한 바퀴 채워지는 시간(초). 다 차면 누를 때까지 그대로

function hasVisited() {
  try {
    return localStorage.getItem(VISITED_KEY) === "1";
  } catch {
    return false;
  }
}

function markVisited() {
  try {
    localStorage.setItem(VISITED_KEY, "1");
  } catch {
    // 저장이 막힌 환경(시크릿 모드 등)에서는 기록 없이 진행
  }
}

function playIntro() {
  // 전환 시퀀스에서 움직이는 요소들. 끝나면 인라인 스타일을 지워서 다시 CSS가 상태를 맡게 한다
  const $ = (sel) => [...document.querySelectorAll(sel)];
  const layers = { day1: $("#day1"), day2: $("#day2"), day3: $("#day3") };
  const buildings = { day1: $("#day1-building"), day2: $("#day2-building"), day3: $("#day3-building") };
  const booths = $('#stadium [id*="-booth-"]');
  const routes = $(".route-labels");
  const grid = $("#grid");
  const ui = { text: $("#intro-text"), labels: $("#date-labels"), buttons: $("#mode-buttons") };
  const animated = [...Object.values(layers), ...Object.values(buildings), booths, routes, grid, ...Object.values(ui)].flat();

  // 세 층을 가운데(day2 위치)에 겹쳐 둔다. 층 중심 y: day1 258, day2 552, day3 853 (F1~F3)
  const STACK = { day1: 552 - 258, day3: 552 - 853 };

  stage.classList.add("is-intro");
  gsap.set(animated, { opacity: 0 });
  gsap.set(layers.day1, { y: STACK.day1 });
  gsap.set(layers.day3, { y: STACK.day3 });
  gsap.set([layers.day1, layers.day2, layers.day3], { opacity: 1 }); // 층 그룹은 보이고, 안의 요소만 숨김

  // 링을 따라 채워지는 바 (LoL 매칭 수락 화면)
  const progress = document.getElementById("intro-progress");
  const circumference = 2 * Math.PI * progress.r.baseVal.value;
  gsap.set(progress, { strokeDasharray: circumference, strokeDashoffset: circumference });
  const progressTween = gsap.to(progress, {
    strokeDashoffset: 0,
    duration: PROGRESS_DURATION,
    ease: "none",
  });

  const acceptBtn = document.getElementById("intro-accept");
  acceptBtn.addEventListener("click", () => {
    progressTween.pause(); // 채워지던 지점에서 멈춤
    markVisited();
    playSequence();
  }, { once: true });

  function playSequence() {
    stage.classList.add("is-sequence");
    const tl = gsap.timeline({ delay: 1.2, onComplete: finish });

    // 1. 원이 뒤로 눕듯이 기울어져 경기장 바닥이 된다.
    //    안쪽 원(r 272)이 F1(가로 반지름 298.5, 세로 99)과 같은 크기·기울기가 되도록 scale 1.1, rotationX 70.
    //    겹쳐 둔 층 가운데(y 552)로 12px 내려간다
    tl.to(["#intro-text-match", "#intro-accept", "#intro-progress"], { opacity: 0, duration: 0.4 })
      .to("#intro-disc", { rotationX: 70, scale: 1.1, y: 12, duration: 1, ease: "power2.inOut" }, "<0.1")
      .to("#intro-floor", { opacity: 1, duration: 0.8 }, "<")
      .to("#intro-color", { opacity: 0, duration: 0.8 }, "<")

    // 2. 바닥이 건물 외관 도면(day1-building)으로 바뀐다
      .to("#intro-disc", { opacity: 0, duration: 0.6 })
      .to(buildings.day1, { opacity: 1, duration: 0.6 }, "<")

    // 3. 세 층이 분리된다: day2는 그대로, day1은 위로, day3는 아래로
      .addLabel("split")
      .to(layers.day1, { y: 0, duration: 1.2, ease: "power2.inOut" }, "split")
      .to(layers.day3, { y: 0, duration: 1.2, ease: "power2.inOut" }, "split")
      .to([buildings.day2, buildings.day3], { opacity: 1, duration: 0.8 }, "split+=0.2")
      .to(grid, { opacity: 1, duration: 0.8 }, "split+=0.4")

    // 4. 외부 부스 구역이 나타난다
      .to([booths, routes], { opacity: 1, duration: 0.6, stagger: 0 })

    // 5. 제목, 설명, 날짜 라벨, 우측 버튼이 나타나며 메인 완성
      .to([ui.text, ui.labels, ui.buttons], { opacity: 1, duration: 0.6 });

    // 재생 중 화면을 클릭하면 바로 메인 최종 상태로
    // (ACCEPT 클릭 이벤트가 끝난 뒤에 등록해야 같은 클릭으로 건너뛰지 않는다)
    setTimeout(() => {
      document.getElementById("intro").addEventListener("click", () => tl.progress(1), { once: true });
    });
  }

  function finish() {
    progressTween.kill();
    gsap.set(animated, { clearProps: "opacity,transform" });
    stage.classList.remove("is-intro", "is-sequence");
  }
}

const params = new URLSearchParams(location.search);
if (params.has("intro") || !hasVisited()) playIntro();

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
