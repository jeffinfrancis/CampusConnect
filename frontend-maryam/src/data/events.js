export function averageRating(reviews) {
  if (!reviews || reviews.length === 0) {
    return "No ratings yet";
  }

  let total = 0;
  for (const review of reviews) {
    total += review.stars;
  }

  const average = total / reviews.length;
  return average.toFixed(1) + " ★ (" + reviews.length + " reviews)";
}

const events = [
  {
    id: 1,
    title: "Career Fair 2026",
    category: "Academic",
    date: "2026-11-13",
    time: "10:00 AM",
    location: "Progress Campus",
    description: "Meet employers from local companies, drop off your resume, and learn about internships and jobs.",
    image: "/images/career.webp",
    capacity: 100,
    seatsTaken: 42,
    reviews: [],
  },
  {
    id: 2,
    title: "Campus Music Night",
    category: "Music",
    date: "2026-11-18",
    time: "7:00 PM",
    location: "Student Centre Main Stage",
    description: "An evening of live performances by student bands and solo artists. Free entry for all students.",
    image: "/images/music.webp",
    capacity: 80,
    seatsTaken: 79,
    reviews: [],
  },
  {
    id: 3,
    title: "Basketball Game",
    category: "Sports",
    date: "2026-11-21",
    time: "6:00 PM",
    location: "Athletic Centre",
    description: "Come out and support the campus basketball team in a home game.",
    image: "/images/sports.webp",
    capacity: 50,
    seatsTaken: 20,
    reviews: [],
  },
  {
    id: 4,
    title: "Fall Music Festival",
    category: "Music",
    date: "2025-10-18",
    time: "6:00 PM",
    location: "Outdoor Quad",
    description: "A day of live music from student bands, food trucks, and games on the quad.",
    image: "/images/festival.webp",
    capacity: 150,
    seatsTaken: 150,
    reviews: [
      { id: 1, author: "Amira", stars: 5, text: "Amazing bands and great food!" },
      { id: 2, author: "Liam", stars: 4, text: "Lots of fun, line for food was long." },
      { id: 3, author: "Sofia", stars: 5, text: "Loved every minute of it." },
    ],
  },
  {
    id: 5,
    title: "Comedy Night",
    category: "Entertainment",
    date: "2025-11-07",
    time: "8:00 PM",
    location: "Student Centre Theatre",
    description: "Stand-up comedy from local comedians and student performers. Doors open 30 minutes before the show.",
    image: "/images/comedy.webp",
    capacity: 60,
    seatsTaken: 60,
    reviews: [
      { id: 1, author: "Jordan", stars: 5, text: "Hilarious, laughed the entire time." },
      { id: 2, author: "Priya", stars: 3, text: "Some jokes were good, some not." },
      { id: 3, author: "Ethan", stars: 4, text: "Great event for a Friday night." },
    ],
  },
  {
    id: 6,
    title: "Volunteer Day",
    category: "Other",
    date: "2025-10-04",
    time: "9:00 AM",
    location: "Meet at the Main Gate",
    description: "Join classmates to clean up local parks and help with a community food drive.",
    image: "/images/volunteer.webp",
    capacity: 30,
    seatsTaken: 30,
    reviews: [
      { id: 1, author: "Hana", stars: 5, text: "Felt great to help out." },
      { id: 2, author: "Marcus", stars: 4, text: "Well organized and meaningful." },
      { id: 3, author: "Sofia", stars: 5, text: "Met so many nice people!" },
    ],
  },
];

export default events;