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
