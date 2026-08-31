// COACHES: real names, real credentials, from the client's own WordPress
// export (Tools > Export, 2026-08-26, cpt_team post type).
//
// Every credit line below is copied from that coach's own bio page; none
// invented. Two things intentionally left out:
//   - the "Practice / Championships / Experience" percentage bars: every
//     coach carried the identical 80% / 90% / 88%, which is the page
//     builder's demo default, not a real measurement. Fabricated stats
//     read worse than no stats.
//   - photos: the client's media library is on the dev domain, which this
//     build cannot reach, so no photo has been substituted. Send the real
//     headshots (or the wp-content/uploads zip) and they drop straight in;
//     see the flag in source/inner-pages.md.
//
// Order: founder first, then the client's own WordPress post order.

export const coaches = [
  {
    slug: 'christy-halbert',
    name: 'Dr. Christy Halbert',
    role: 'Founder & Director',
    bio: `<p>Founder and Director of Fighters, Dr. Christy Halbert has used her background
      as an academic in sociology, collegiate athlete, and professional boxer to take a
      multi-disciplinary approach to the sport of boxing. Halbert is a 2012 Olympic Coach
      for Team USA, and IWBHF Inductee.</p>`,
    credentials: ['2012 Olympic Coach, Team USA', 'IWBHF Inductee'],
  },
  {
    slug: 'kayla-trotter',
    name: 'Kayla Trotter',
    role: 'Competition Team Coach',
    credentials: ['Former Boxer', 'Competition Team Coach', 'Class Instructor'],
  },
  {
    slug: 'evan-carr',
    name: 'Evan Carr',
    role: 'Competition Team Coach',
    credentials: ['Former MMA Fighter', 'USA Boxing Certified', 'Competition Team'],
  },
  {
    slug: 'nick-hicks',
    name: 'Nick Hicks',
    role: 'Competition Team Coach',
    credentials: ['USA Boxing, Bronze Coach', 'Competition Team Coach', 'Class Instructor'],
  },
  {
    slug: 'steve-vernier',
    name: 'Steve Vernier',
    role: 'Class Instructor',
    credentials: ['USA Boxing, Bronze Coach', 'Class Instruction', 'Personal Training', 'Adaptive Boxing'],
    instagram: 'https://www.instagram.com/full_throttle2024/',
  },
  {
    slug: 'mindy-vernier',
    name: 'Mindy Vernier',
    role: 'Class Instructor',
    credentials: [
      'USA Boxing, Bronze Coach',
      'Nutrition Coach',
      'Personal Training',
      'Adaptive Boxing',
      'Certified Mindset Coach',
    ],
    instagram: 'https://www.instagram.com/coachmindyv/',
  },
  {
    slug: 'jeremiah-cline',
    name: 'Jeremiah Cline',
    role: 'Competition Team Coach',
    credentials: ['USA Boxing, Bronze Coach', 'Class Instruction', 'Competition Team', 'Personal Training'],
  },
  {
    slug: 'sena-agbeko',
    name: 'Sena Agbeko',
    role: 'Coach',
    credentials: ['Professional Boxer', 'Personal Training'],
    instagram: 'https://www.instagram.com/assassi_nation/',
  },
  {
    slug: 'ernest-rodriguez',
    name: 'Ernest Rodriguez',
    role: 'Competition Team Coach',
    credentials: ['USA Boxing Certified Coach & Referee/Judge', 'Former D-1 Athlete', 'Personal Training'],
  },
];
