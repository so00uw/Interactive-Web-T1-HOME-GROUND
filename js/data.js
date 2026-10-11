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
        memo: null,
      },
    },
  },

  spotify: {
    name: "Spotify Booth",
    events: null, // 사용자 작성 예정
    days: {
      day1: {
        absent: true, // 미참여
        photo: "assets/photos/spotify-d1.jpg",
      },
      day2: {
        depart: "10:00", enter: "16:00", leave: "19:52",
        wait: ["12:10", "14:30"],
        level: { wait: 3/3, noise: 3/3, physical: 3/3 },
        memo: null,
      },
      day3: {
        depart: "09:30", enter: "15:30", leave: "21:41",
        wait: ["11:00", "14:27"],
        level: { wait: 3/3, noise: 2/3, physical: 3/3 },
        memo: null,
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
  events: [
    { label: "DAY 1, Dplus Kia", desc: "2:1 패배" },
    { label: "DAY 2, Talk Wave Live", desc: "T1의 자체 제작 토크쇼 프로그램" },
    { label: "DAY 3, Gen.G", desc: "2:0 패배" },
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
