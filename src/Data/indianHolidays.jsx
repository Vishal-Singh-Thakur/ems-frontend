// Indian Gazetted Holidays + Major Festivals — auto-shown on Holidays calendar.
// Note: Some dates (Hindu/Islamic festivals) vary slightly by lunar calendar.
// These are widely-accepted dates. HR can override by adding a custom entry.

const HOLIDAYS_2026 = [
  { name: "New Year's Day",         date: '2026-01-01', type: 'Optional' },
  { name: 'Republic Day',           date: '2026-01-26', type: 'Public',   description: 'Indian Republic Day (Gazetted)' },
  { name: 'Maha Shivaratri',        date: '2026-02-15', type: 'Festival' },
  { name: 'Holi',                   date: '2026-03-03', type: 'Festival' },
  { name: 'Eid al-Fitr',            date: '2026-03-20', type: 'Festival' },
  { name: 'Ram Navami',             date: '2026-03-26', type: 'Festival' },
  { name: 'Mahavir Jayanti',        date: '2026-03-31', type: 'Public' },
  { name: 'Good Friday',            date: '2026-04-03', type: 'Public' },
  { name: 'Ambedkar Jayanti',       date: '2026-04-14', type: 'Public' },
  { name: 'Buddha Purnima',         date: '2026-05-01', type: 'Public' },
  { name: 'Eid al-Adha (Bakrid)',   date: '2026-05-26', type: 'Festival' },
  { name: 'Muharram',               date: '2026-06-26', type: 'Public' },
  { name: 'Independence Day',       date: '2026-08-15', type: 'Public',   description: 'Indian Independence Day (Gazetted)' },
  { name: 'Raksha Bandhan',         date: '2026-08-28', type: 'Festival' },
  { name: 'Janmashtami',            date: '2026-09-04', type: 'Festival' },
  { name: 'Ganesh Chaturthi',       date: '2026-09-14', type: 'Festival' },
  { name: 'Milad-un-Nabi',          date: '2026-08-26', type: 'Public' },
  { name: 'Gandhi Jayanti',         date: '2026-10-02', type: 'Public',   description: 'Mahatma Gandhi Birthday (Gazetted)' },
  { name: 'Dussehra',               date: '2026-10-20', type: 'Festival' },
  { name: 'Karwa Chauth',           date: '2026-10-30', type: 'Festival' },
  { name: 'Diwali',                 date: '2026-11-08', type: 'Festival', description: 'Festival of Lights' },
  { name: 'Govardhan Puja',         date: '2026-11-09', type: 'Festival' },
  { name: 'Bhai Dooj',              date: '2026-11-10', type: 'Festival' },
  { name: 'Chhath Puja',            date: '2026-11-15', type: 'Festival' },
  { name: 'Guru Nanak Jayanti',     date: '2026-11-24', type: 'Public' },
  { name: 'Christmas',              date: '2026-12-25', type: 'Public' }
];

const HOLIDAYS_2027 = [
  { name: "New Year's Day",         date: '2027-01-01', type: 'Optional' },
  { name: 'Republic Day',           date: '2027-01-26', type: 'Public',   description: 'Indian Republic Day (Gazetted)' },
  { name: 'Maha Shivaratri',        date: '2027-03-06', type: 'Festival' },
  { name: 'Holi',                   date: '2027-03-22', type: 'Festival' },
  { name: 'Eid al-Fitr',            date: '2027-03-09', type: 'Festival' },
  { name: 'Ram Navami',             date: '2027-04-15', type: 'Festival' },
  { name: 'Mahavir Jayanti',        date: '2027-04-19', type: 'Public' },
  { name: 'Good Friday',            date: '2027-03-26', type: 'Public' },
  { name: 'Ambedkar Jayanti',       date: '2027-04-14', type: 'Public' },
  { name: 'Buddha Purnima',         date: '2027-05-20', type: 'Public' },
  { name: 'Eid al-Adha (Bakrid)',   date: '2027-05-16', type: 'Festival' },
  { name: 'Muharram',               date: '2027-06-15', type: 'Public' },
  { name: 'Independence Day',       date: '2027-08-15', type: 'Public',   description: 'Indian Independence Day (Gazetted)' },
  { name: 'Raksha Bandhan',         date: '2027-08-17', type: 'Festival' },
  { name: 'Janmashtami',            date: '2027-08-24', type: 'Festival' },
  { name: 'Ganesh Chaturthi',       date: '2027-09-03', type: 'Festival' },
  { name: 'Milad-un-Nabi',          date: '2027-08-15', type: 'Public' },
  { name: 'Gandhi Jayanti',         date: '2027-10-02', type: 'Public',   description: 'Mahatma Gandhi Birthday (Gazetted)' },
  { name: 'Dussehra',               date: '2027-10-09', type: 'Festival' },
  { name: 'Karwa Chauth',           date: '2027-10-19', type: 'Festival' },
  { name: 'Diwali',                 date: '2027-10-28', type: 'Festival', description: 'Festival of Lights' },
  { name: 'Govardhan Puja',         date: '2027-10-29', type: 'Festival' },
  { name: 'Bhai Dooj',              date: '2027-10-30', type: 'Festival' },
  { name: 'Chhath Puja',            date: '2027-11-04', type: 'Festival' },
  { name: 'Guru Nanak Jayanti',     date: '2027-11-13', type: 'Public' },
  { name: 'Christmas',              date: '2027-12-25', type: 'Public' }
];

const INDIAN_HOLIDAYS = [...HOLIDAYS_2026, ...HOLIDAYS_2027].map((h) => ({
  ...h,
  _id: `system-${h.date}-${h.name.replace(/\s+/g, '-').toLowerCase()}`,
  isSystem: true
}));

export default INDIAN_HOLIDAYS;
