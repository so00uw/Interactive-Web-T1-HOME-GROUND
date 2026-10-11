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
// 좌표는 reference/01-main.png에서 잰 글자 중심.
const ROUTE_LABELS = {
  day1: [[1, 1126.5, 386.5], [2, 829.5, 374], [3, 633.5, 197.5], [4, 1217.5, 166]],
  day2: [[1, 1126.5, 687.5], [2, 829.5, 675], [3, 633.5, 500.5], [4, 1174.5, 500]],
  day3: [[1, 1126.5, 986.5], [2, 658.5, 782], [3, 829.5, 968.5]],
};

function drawRouteLabels() {
  const NS = "http://www.w3.org/2000/svg";

  Object.entries(ROUTE_LABELS).forEach(([day, labels]) => {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("id", `${day}-route`);
    g.setAttribute("class", "route-labels");

    labels.forEach(([num, x, y]) => {
      const text = document.createElementNS(NS, "text");
      text.setAttribute("class", "route-label");
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
// mode: "main" | "outside" | "inside". #stage에 mode-* 클래스로 반영하고, 모양은 CSS가 맡는다.
const stage = document.getElementById("stage");
const modeButtons = document.querySelectorAll(".mode-btn");
let mode = "main";

function setMode(next) {
  mode = next;
  stage.classList.remove("mode-main", "mode-outside", "mode-inside");
  stage.classList.add(`mode-${mode}`);
  modeButtons.forEach((btn) => btn.classList.toggle("is-selected", btn.dataset.mode === mode));
  setHoverBooth(null);
}

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.mode;
    if (target === "event") return; // EVENT INFO는 9단계에서
    // 같은 버튼을 다시 누르면 선택 해제
    setMode(mode === target ? "main" : target);
  });
});

// ESC: 선택 상태 → 메인
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && mode !== "main") setMode("main");
});

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
    // 클릭 → Outside 디테일 (4단계에서 연결)
  });
});

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
