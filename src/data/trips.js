// Seed itinerary data for the group trip: Bangkok → Phuket → Saigon → Nha Trang.
// Each trip has an accent color (same recipe, hue varies per place), a set of
// days, and three timeslot groups per day. Most days start empty.
//
// Activity shape:
//   { id, title, time, location, cost, photo: bool, photoLabel?, people: [bool x5] }

const emptyGroups = () => ({ morning: [], afternoon: [], evening: [] });

export function seedTrips() {
  return [
    {
      name: 'Bangkok',
      dateRange: '28 – 31 Aug',
      accent: 'oklch(72% 0.16 82)', // saffron / gold
      days: [
        {
          label: 'Day 1',
          sub: 'Fri 28',
          groups: {
            morning: [],
            afternoon: [],
            evening: [
              {
                id: 'b1',
                title: 'Land BKK, taxi to hotel',
                time: '5:30 PM',
                location: 'Suvarnabhumi → Sukhumvit',
                cost: '',
                photo: false,
                people: [true, true, true, true, true],
              },
              {
                id: 'b2',
                title: 'Street food at Chinatown',
                time: '8:00 PM',
                location: 'Yaowarat Road',
                cost: '฿200pp',
                photo: true,
                photoLabel: 'night market',
                people: [true, true, true, true, false],
              },
            ],
          },
        },
        { label: 'Day 2', sub: 'Sat 29', groups: emptyGroups() },
        { label: 'Day 3', sub: 'Sun 30', groups: emptyGroups() },
      ],
    },
    {
      name: 'Phuket',
      dateRange: '31 Aug – 3 Sep',
      accent: 'oklch(64% 0.11 205)', // turquoise
      days: [
        {
          label: 'Day 1',
          sub: 'Mon 31',
          groups: {
            morning: [
              {
                id: 'p1',
                title: 'Breakfast at hotel',
                time: '8:00 AM',
                location: 'Kata Beach Resort',
                cost: '',
                photo: false,
                people: [true, true, true, true, true],
              },
            ],
            afternoon: [
              {
                id: 'p2',
                title: 'Phi Phi island boat trip',
                time: '1:00 PM',
                location: 'Rassada Pier',
                cost: '฿1,800pp',
                photo: true,
                photoLabel: 'longtail boat',
                people: [true, true, false, true, true],
              },
            ],
            evening: [],
          },
        },
        { label: 'Day 2', sub: 'Tue 1', groups: emptyGroups() },
        { label: 'Day 3', sub: 'Wed 2', groups: emptyGroups() },
      ],
    },
    {
      name: 'Saigon',
      dateRange: '3 – 7 Sep',
      accent: 'oklch(56% 0.14 30)', // lacquer red
      days: [
        {
          label: 'Day 1',
          sub: 'Thu 3',
          groups: {
            morning: [],
            afternoon: [
              {
                id: 's1',
                title: 'War Remnants Museum',
                time: '2:00 PM',
                location: 'District 3',
                cost: '₫40k',
                photo: false,
                people: [true, true, true, false, true],
              },
            ],
            evening: [],
          },
        },
        { label: 'Day 2', sub: 'Fri 4', groups: emptyGroups() },
        { label: 'Day 3', sub: 'Sat 5', groups: emptyGroups() },
        { label: 'Day 4', sub: 'Sun 6', groups: emptyGroups() },
      ],
    },
    {
      name: 'Nha Trang',
      dateRange: '7 – 10 Sep',
      accent: 'oklch(58% 0.1 175)', // jade / teal
      days: [
        {
          label: 'Day 1',
          sub: 'Mon 7',
          groups: {
            morning: [
              {
                id: 'n1',
                title: 'Snorkeling trip',
                time: '9:00 AM',
                location: 'Hon Mun Island',
                cost: '₫900k pp',
                photo: true,
                photoLabel: 'reef dive',
                people: [true, false, true, true, true],
              },
            ],
            afternoon: [],
            evening: [],
          },
        },
        { label: 'Day 2', sub: 'Tue 8', groups: emptyGroups() },
        { label: 'Day 3', sub: 'Wed 9', groups: emptyGroups() },
      ],
    },
  ];
}

// Ordered timeslot groups shown for every day.
export const GROUPS = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
];
