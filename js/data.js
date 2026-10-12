// ===== 데이터 =====
// 기호 정도(wait, noise, physical)는 채움 비율: 1/3, 2/3, 3/3. null = 아직 채우지 않은 값.

const WEATHER = {
  day1: { date: "8/14", text: "32°-27°" },
  day2: { date: "8/15", text: "29°-26°" },
  day3: { date: "8/16", text: "26°-22°, 22mm" },
};

const BOOTHS = {
  membership: {
    name: "T1 Membership Booth",
    events: [
      { title: "Event 1 · T1 Home Ground 출석 체크", desc: "QR 코드 스캔 → 8월 디지털 리워드 지급" },
      { title: "Event 2 · T1 Membership 회원 인증", desc: "회원 인증 → Membership 엽서 지급" },
      { title: "Event 3 · T1 Membership 가입 내역 제시", desc: "내역 제시 → 선수단 스크래치 카드" },
    ],
    note: { title: "*수량 부족" },
    days: {
      day1: {
        depart: "09:00", enter: "14:30", leave: "21:44",
        wait: ["11:40", "11:48"],
        level: { wait: 1/3, noise: 2/3, physical: 1/3 },
        memo: null,
      },
      day2: {
        depart: "10:00", enter: "16:00", leave: "19:52",
        wait: ["12:20"], // 대기 없음 (도착 시각만)
        level: { wait: 1/3, noise: 2/3, physical: 1/3 },
        memo: "*수량 부족",
      },
      day3: {
        depart: "09:30", enter: "15:30", leave: "21:41",
        wait: ["11:00", "11:48"],
        level: { wait: 2/3, noise: 2/3, physical: 3/3 },
        memo: "*전날 수량 부족으로 인한 대기",
      },
    },
  },

  spotify: {
    name: "Spotify Booth",
    // 이벤트 대신 입장 순서(위 → 아래, 화살표로 연결)와 대기가 길어진 원인
    flow: ["웨이팅 예약", "입장 안내 문자 발송", "입장 대기", "입장"],
    note: { title: "*웨이팅 예약", causes: ["예약 기기 1대", "안내 부족"], result: "대기 시간 증가" },
    days: {
      day1: {
        absent: true, // 미참여
        photo: "assets/photos/spotify-d1.jpg",
      },
      day2: {
        depart: "10:00", enter: "16:00", leave: "19:52",
        wait: ["12:10", "14:30"],
        level: { wait: 3/3, noise: 3/3, physical: 3/3 },
        memo: "*웨이팅 예약 기기 1대",
      },
      day3: {
        depart: "09:30", enter: "15:30", leave: "21:41",
        wait: ["11:00", "14:27"],
        level: { wait: 3/3, noise: 2/3, physical: 3/3 },
        memo: ["*웨이팅 예약 문제 미해결", "*안내 부족"], // 여러 줄이면 배열
      },
    },
  },

  // k9: 데이터 없이 호버 시 이름만 표시
  k9: {
    name: "K9 Booth",
  },
};

// ===== Inside (경기장 안) =====
// 경기가 있던 14일·16일만 기호를 표시한다. 기호 정도는 채움 비율.
const INSIDE = {
  title: "14일과 16일의 경기",
  day2Date: "8/15", // 경기가 없던 날: 깔때기 옆에 날짜만
  conclusion: "기대감의 저하", // 깔때기 아래
  events: [
    { label: "DAY 1, Dplus Kia", desc: "2:1 패배", note: "옆자리 관객의 다리떨기 → 두통" },
    { label: "DAY 2, Talk Wave Live", desc: "T1의 자체 제작 토크쇼 프로그램" },
    { label: "DAY 3, Gen.G", desc: "2:0 패배", note: "옆자리 관객의 다리떨기 → 두통" },
  ],
  matches: {
    day1: {
      score: "2:1", team: "Dplus Kia",
      record: ["정규 라운드 115경기", "16승 7패"],
      level: { physical: 1 / 3, side: 2 / 3 },
    },
    day3: {
      score: "2:0", team: "Gen.G",
      record: ["정규 라운드 119경기", "16승 8패"],
      level: { physical: 2 / 3, side: 3 / 3 },
    },
  },
};

// ===== Event Info =====
// 왼쪽 일정표(하루 일정, 3일 공통)와 항목을 눌렀을 때 나오는 사진.
// group: "booth" = 경기장 밖(부스), "inside" = 경기장 안. 마지막 항목은 끝 시각만.
const EVENT_INFO = {
  name: "T1 HOME GROUND",
  slogan: "REACH FOR THE STARS",
  date: "2026.08.14 - 16",
  place: "KSPO DOME",
  schedule: [
    { time: "09:00", name: "Booth", group: "booth" },
    { time: "12:00", name: "LCK CL MATCH", group: "inside" },
    { time: "15:30", name: "Boom-up Stage", group: "inside" },
    { time: "16:00", name: "Spotify Opening Stage", group: "inside" },
    { time: "16:30", name: "Opening Ceremony", group: "inside" },
    { time: "17:00", name: "LCK MATCH", group: "inside" },
    { time: "19:00", name: "Halftime Event", group: "inside" },
    { time: "19:30", name: "T1 LCK Fan Meet", group: "inside" },
    { time: "21:30" },
  ],
  // Booth를 눌렀을 때: 부스 구역별 사진과 그 구역의 부스 이름
  booth: [
    { title: "Booth Area 1", photos: ["photo-1.png", "photo-2.png"], captions: ["K9 Booth"] },
    { title: "Booth Area 2", photos: ["photo-3.png", "photo-4.png", "photo-5.png"], captions: ["Spotify Booth", "대웅 제약", "Away Team Booth"] },
    { title: "Booth Area 3", photos: ["photo-6.png", "photo-7.png", "photo-8.png"], captions: ["Membership Booth", "T1 Shop"] },
  ],
  // 경기장 안 항목을 눌렀을 때: 프로그램별 사진. details = [날짜, 내용] (날짜 없으면 "")
  inside: [
    { title: "Boom-up Stage", photos: ["photo-9.png"], details: [["", "등촌서커스"]] },
    { title: "Spotify Opening Stage", photos: ["photo-10.png", "photo-11.png"], details: [["DAY 1", "도겸 X 승관"], ["DAY 2", "FIFTY FIFTY"], ["DAY 3", "DYNAMICDUO"]] },
    { title: "Opening Ceremony", photos: ["photo-12.png", "photo-13.png"], details: [] },
    { title: "LCK MATCH", photos: ["photo-14.png", "photo-15.png"], details: [["DAY 1", "T1 VS DK"], ["DAY 3", "T1 VS GEN"]] },
    { title: "T1 LCK Fan Meet", photos: ["photo-16.png"], details: [] },
  ],
};
