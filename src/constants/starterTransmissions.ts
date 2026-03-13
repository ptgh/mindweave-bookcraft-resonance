import type { Transmission } from "@/services/transmissionsService";

/**
 * Curated starter transmissions shown to anonymous visitors.
 * Negative IDs prevent collision with real DB records.
 */
export const STARTER_TRANSMISSIONS: Transmission[] = [
  {
    id: -1,
    title: "Neuromancer",
    author: "William Gibson",
    status: "want-to-read",
    tags: ["cyberpunk", "AI", "virtual reality"],
    notes: "",
    cover_url: "https://books.google.com/books/content?id=TaJhAAAAQBAJ&printsec=frontcover&img=1&zoom=1",
    rating: {},
    user_id: "",
    created_at: new Date().toISOString(),
    publication_year: 1984,
  },
  {
    id: -2,
    title: "The Left Hand of Darkness",
    author: "Ursula K. Le Guin",
    status: "want-to-read",
    tags: ["gender", "anthropology", "political SF"],
    notes: "",
    cover_url: "https://books.google.com/books/content?id=hOPKDQAAQBAJ&printsec=frontcover&img=1&zoom=1",
    rating: {},
    user_id: "",
    created_at: new Date().toISOString(),
    publication_year: 1969,
  },
  {
    id: -3,
    title: "Do Androids Dream of Electric Sheep?",
    author: "Philip K. Dick",
    status: "want-to-read",
    tags: ["identity", "dystopia", "empathy"],
    notes: "",
    cover_url: "https://books.google.com/books/content?id=count04UKBMIC&printsec=frontcover&img=1&zoom=1",
    rating: {},
    user_id: "",
    created_at: new Date().toISOString(),
    publication_year: 1968,
  },
  {
    id: -4,
    title: "Dune",
    author: "Frank Herbert",
    status: "want-to-read",
    tags: ["ecology", "politics", "messianic"],
    notes: "",
    cover_url: "https://books.google.com/books/content?id=B1hSG45JCX4C&printsec=frontcover&img=1&zoom=1",
    rating: {},
    user_id: "",
    created_at: new Date().toISOString(),
    publication_year: 1965,
  },
  {
    id: -5,
    title: "The Dispossessed",
    author: "Ursula K. Le Guin",
    status: "want-to-read",
    tags: ["anarchism", "utopia", "physics"],
    notes: "",
    cover_url: "https://books.google.com/books/content?id=Fq3fCwAAQBAJ&printsec=frontcover&img=1&zoom=1",
    rating: {},
    user_id: "",
    created_at: new Date().toISOString(),
    publication_year: 1974,
  },
];

/** Check if a transmission is a starter (not from DB) */
export const isStarterTransmission = (t: Transmission) => t.id < 0;
