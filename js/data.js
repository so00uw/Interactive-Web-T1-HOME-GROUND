// ===== 데이터 =====
// 기호 정도(wait, noise, physical)는 1~3. null = 아직 채우지 않은 값 (spec.md의 "?").

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
        level: { wait: null, noise: null, physical: null },
        memo: null,
      },
      day2: {
        depart: "10:00", enter: "16:00", leave: "19:52",
        wait: ["12:20"], // 대기 없음 (도착 시각만)
        level: { wait: null, noise: null, physical: null },
        memo: "*수량 부족",
      },
      day3: {
        depart: "09:30", enter: "15:30", leave: "21:41",
        wait: ["11:00", "11:48"],
        level: { wait: null, noise: null, physical: null },
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
        level: { wait: null, noise: null, physical: null },
        memo: null,
      },
      day3: {
        depart: "09:30", enter: "15:30", leave: "21:41",
        wait: ["11:00", "14:27"],
        level: { wait: null, noise: null, physical: null },
        memo: null,
      },
    },
  },

  // k9: 데이터 없이 호버 시 이름만 표시
  k9: {
    name: "K9 Booth",
  },
};
