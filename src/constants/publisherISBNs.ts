// Publisher book series constants
// Penguin Science Fiction: https://www.penguin.co.uk/series/PENGSCIFI/penguin-science-fiction
// Gollancz SF Masterworks: https://store.gollancz.co.uk/collections/series-s-f-masterworks-1

export interface PublisherBook {
  isbn: string;
  title: string;
  author: string;
  publisher_url: string;
  cover_url: string;
  publication_year?: number;
}

export interface PublisherSeries {
  name: string;
  publisher: string;
  description: string;
  badge_emoji: string;
}

// ============================================
// PENGUIN SCIENCE FICTION (19 titles)
// ============================================
export const PENGUIN_SF_BOOKS: PublisherBook[] = [
  {
    isbn: '9780241454589',
    title: 'The Ark Sakura',
    author: 'Kobo Abe',
    publisher_url: 'https://www.penguin.co.uk/books/317662/the-ark-sakura-by-abe-kobo/9780241454589',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241454589/9780241454589-jacket-large.jpg',
    publication_year: 1988
  },
  {
    isbn: '9780241465684',
    title: 'Black No More',
    author: 'George S. Schuyler',
    publisher_url: 'https://www.penguin.co.uk/books/316943/black-no-more-by-schuyler-george-s/9780241465684',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241465684/9780241465684-jacket-large.jpg',
    publication_year: 1931
  },
  {
    isbn: '9780241472781',
    title: 'Roadside Picnic',
    author: 'Arkady Strugatsky & Boris Strugatsky',
    publisher_url: 'https://www.penguin.co.uk/books/316944/roadside-picnic-by-strugatsky-arkady-and-boris/9780241472781',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241472781/9780241472781-jacket-large.jpg',
    publication_year: 1972
  },
  {
    isbn: '9780241472798',
    title: 'The Body Snatchers',
    author: 'Jack Finney',
    publisher_url: 'https://www.penguin.co.uk/books/316945/the-body-snatchers-by-finney-jack/9780241472798',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241472798/9780241472798-jacket-large.jpg',
    publication_year: 1955
  },
  {
    isbn: '9780241454572',
    title: 'Solaris',
    author: 'Stanisław Lem',
    publisher_url: 'https://www.penguin.co.uk/books/317663/solaris-by-lem-stanislaw/9780241454572',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241454572/9780241454572-jacket-large.jpg',
    publication_year: 1961
  },
  {
    isbn: '9780241453094',
    title: 'The Drowned World',
    author: 'J. G. Ballard',
    publisher_url: 'https://www.penguin.co.uk/books/317664/the-drowned-world-by-ballard-j-g/9780241453094',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241453094/9780241453094-jacket-large.jpg',
    publication_year: 1962
  },
  {
    isbn: '9780241465608',
    title: 'Woman on the Edge of Time',
    author: 'Marge Piercy',
    publisher_url: 'https://www.penguin.co.uk/books/316946/woman-on-the-edge-of-time-by-piercy-marge/9780241465608',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241465608/9780241465608-jacket-large.jpg',
    publication_year: 1976
  },
  {
    isbn: '9780241454527',
    title: 'The Penultimate Truth',
    author: 'Philip K. Dick',
    publisher_url: 'https://www.penguin.co.uk/books/317665/the-penultimate-truth-by-dick-philip-k/9780241454527',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241454527/9780241454527-jacket-large.jpg',
    publication_year: 1964
  },
  {
    isbn: '9780241454534',
    title: 'Flow My Tears, the Policeman Said',
    author: 'Philip K. Dick',
    publisher_url: 'https://www.penguin.co.uk/books/317666/flow-my-tears-the-policeman-said-by-dick-philip-k/9780241454534',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241454534/9780241454534-jacket-large.jpg',
    publication_year: 1974
  },
  {
    isbn: '9780241473597',
    title: 'The Stars My Destination',
    author: 'Alfred Bester',
    publisher_url: 'https://www.penguin.co.uk/books/316947/the-stars-my-destination-by-bester-alfred/9780241473597',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241473597/9780241473597-jacket-large.jpg',
    publication_year: 1956
  },
  {
    isbn: '9780241454541',
    title: 'The Three Stigmata of Palmer Eldritch',
    author: 'Philip K. Dick',
    publisher_url: 'https://www.penguin.co.uk/books/317667/the-three-stigmata-of-palmer-eldritch-by-dick-philip-k/9780241454541',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241454541/9780241454541-jacket-large.jpg',
    publication_year: 1965
  },
  {
    isbn: '9780241465646',
    title: 'Flowers for Algernon',
    author: 'Daniel Keyes',
    publisher_url: 'https://www.penguin.co.uk/books/316948/flowers-for-algernon-by-keyes-daniel/9780241465646',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241465646/9780241465646-jacket-large.jpg',
    publication_year: 1966
  },
  {
    isbn: '9780241454558',
    title: 'The Man in the High Castle',
    author: 'Philip K. Dick',
    publisher_url: 'https://www.penguin.co.uk/books/317668/the-man-in-the-high-castle-by-dick-philip-k/9780241454558',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241454558/9780241454558-jacket-large.jpg',
    publication_year: 1962
  },
  {
    isbn: '9780241454565',
    title: 'Do Androids Dream of Electric Sheep?',
    author: 'Philip K. Dick',
    publisher_url: 'https://www.penguin.co.uk/books/317669/do-androids-dream-of-electric-sheep-by-dick-philip-k/9780241454565',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241454565/9780241454565-jacket-large.jpg',
    publication_year: 1968
  },
  {
    isbn: '9780241465653',
    title: 'The Left Hand of Darkness',
    author: 'Ursula K. Le Guin',
    publisher_url: 'https://www.penguin.co.uk/books/316949/the-left-hand-of-darkness-by-le-guin-ursula-k/9780241465653',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241465653/9780241465653-jacket-large.jpg',
    publication_year: 1969
  },
  {
    isbn: '9780241465660',
    title: 'The Forever War',
    author: 'Joe Haldeman',
    publisher_url: 'https://www.penguin.co.uk/books/316950/the-forever-war-by-haldeman-joe/9780241465660',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241465660/9780241465660-jacket-large.jpg',
    publication_year: 1974
  },
  {
    isbn: '9780241465677',
    title: "Childhood's End",
    author: 'Arthur C. Clarke',
    publisher_url: 'https://www.penguin.co.uk/books/316951/childhoods-end-by-clarke-arthur-c/9780241465677',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241465677/9780241465677-jacket-large.jpg',
    publication_year: 1953
  },
  {
    isbn: '9780241465691',
    title: 'Rendezvous with Rama',
    author: 'Arthur C. Clarke',
    publisher_url: 'https://www.penguin.co.uk/books/316952/rendezvous-with-rama-by-clarke-arthur-c/9780241465691',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241465691/9780241465691-jacket-large.jpg',
    publication_year: 1973
  },
  {
    isbn: '9780241454510',
    title: 'A Scanner Darkly',
    author: 'Philip K. Dick',
    publisher_url: 'https://www.penguin.co.uk/books/317670/a-scanner-darkly-by-dick-philip-k/9780241454510',
    cover_url: 'https://cdn.penguin.co.uk/dam-assets/books/9780241454510/9780241454510-jacket-large.jpg',
    publication_year: 1977
  }
];

export const PENGUIN_SF_SERIES: PublisherSeries = {
  name: 'Penguin Science Fiction',
  publisher: 'penguin',
  description: 'A curated collection of classic science fiction, featuring distinctive cover art celebrating the genre\'s most influential works from the mid-20th century.',
  badge_emoji: '🐧'
};

// ============================================
// GOLLANCZ SF MASTERWORKS (curated selection - 20 iconic titles)
// Source: https://store.gollancz.co.uk/collections/series-s-f-masterworks-1
// Cover URL pattern: https://store.gollancz.co.uk/cdn/shop/products/{ISBN}-original.jpg
// ============================================
export const GOLLANCZ_SF_BOOKS: PublisherBook[] = [
  {
    isbn: '9781399623001',
    title: 'Dune',
    author: 'Frank Herbert',
    publisher_url: 'https://store.gollancz.co.uk/products/dune',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9781399623001-original.jpg',
    publication_year: 1965
  },
  {
    isbn: '9781399625654',
    title: 'The Dispossessed',
    author: 'Ursula K. Le Guin',
    publisher_url: 'https://store.gollancz.co.uk/products/the-dispossessed',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/files/9781399625654-original.jpg',
    publication_year: 1974
  },
  {
    isbn: '9780575099432',
    title: 'Hyperion',
    author: 'Dan Simmons',
    publisher_url: 'https://store.gollancz.co.uk/products/hyperion',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575099432-original.jpg',
    publication_year: 1989
  },
  {
    isbn: '9780575094161',
    title: 'I Am Legend',
    author: 'Richard Matheson',
    publisher_url: 'https://store.gollancz.co.uk/products/i-am-legend',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575094161-original.jpg',
    publication_year: 1954
  },
  {
    isbn: '9780575079939',
    title: 'Do Androids Dream Of Electric Sheep?',
    author: 'Philip K. Dick',
    publisher_url: 'https://store.gollancz.co.uk/products/do-androids-dream-of-electric-sheep',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575079939-original.jpg',
    publication_year: 1968
  },
  {
    isbn: '9781473225947',
    title: 'The Left Hand of Darkness',
    author: 'Ursula K. Le Guin',
    publisher_url: 'https://store.gollancz.co.uk/products/the-left-hand-of-darkness',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9781473225947-original.jpg',
    publication_year: 1969
  },
  {
    isbn: '9781399607766',
    title: 'Flowers For Algernon',
    author: 'Daniel Keyes',
    publisher_url: 'https://store.gollancz.co.uk/products/flowers-for-algernon',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9781399607766-original.jpg',
    publication_year: 1966
  },
  {
    isbn: '9780575094147',
    title: 'The Forever War',
    author: 'Joe Haldeman',
    publisher_url: 'https://store.gollancz.co.uk/products/the-forever-war',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575094147-original.jpg',
    publication_year: 1974
  },
  {
    isbn: '9781399607834',
    title: 'The Man Who Fell to Earth',
    author: 'Walter Tevis',
    publisher_url: 'https://store.gollancz.co.uk/products/the-man-who-fell-to-earth',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9781399607834-original.jpg',
    publication_year: 1963
  },
  {
    isbn: '9780575082434',
    title: 'Neuromancer',
    author: 'William Gibson',
    publisher_url: 'https://store.gollancz.co.uk/products/neuromancer',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575082434-original.jpg',
    publication_year: 1984
  },
  {
    isbn: '9780575077256',
    title: 'Gateway',
    author: 'Frederik Pohl',
    publisher_url: 'https://store.gollancz.co.uk/products/gateway',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575077256-original.jpg',
    publication_year: 1977
  },
  {
    isbn: '9780575099937',
    title: 'The Stars My Destination',
    author: 'Alfred Bester',
    publisher_url: 'https://store.gollancz.co.uk/products/the-stars-my-destination',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575099937-original.jpg',
    publication_year: 1956
  },
  {
    isbn: '9780575075788',
    title: 'Ubik',
    author: 'Philip K. Dick',
    publisher_url: 'https://store.gollancz.co.uk/products/ubik',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575075788-original.jpg',
    publication_year: 1969
  },
  {
    isbn: '9780575079915',
    title: 'A Scanner Darkly',
    author: 'Philip K. Dick',
    publisher_url: 'https://store.gollancz.co.uk/products/a-scanner-darkly',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575079915-original.jpg',
    publication_year: 1977
  },
  {
    isbn: '9780575094185',
    title: 'Stand on Zanzibar',
    author: 'John Brunner',
    publisher_url: 'https://store.gollancz.co.uk/products/stand-on-zanzibar',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575094185-original.jpg',
    publication_year: 1968
  },
  {
    isbn: '9780575094208',
    title: 'Lord of Light',
    author: 'Roger Zelazny',
    publisher_url: 'https://store.gollancz.co.uk/products/lord-of-light',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575094208-original.jpg',
    publication_year: 1967
  },
  {
    isbn: '9780575099418',
    title: 'Ringworld',
    author: 'Larry Niven',
    publisher_url: 'https://store.gollancz.co.uk/products/ringworld',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575099418-original.jpg',
    publication_year: 1970
  },
  {
    isbn: '9780575082533',
    title: 'The Book of the New Sun',
    author: 'Gene Wolfe',
    publisher_url: 'https://store.gollancz.co.uk/products/the-book-of-the-new-sun',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575082533-original.jpg',
    publication_year: 1980
  },
  {
    isbn: '9780575079953',
    title: 'More Than Human',
    author: 'Theodore Sturgeon',
    publisher_url: 'https://store.gollancz.co.uk/products/more-than-human',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575079953-original.jpg',
    publication_year: 1953
  },
  {
    isbn: '9780575118171',
    title: 'Rendezvous with Rama',
    author: 'Arthur C. Clarke',
    publisher_url: 'https://store.gollancz.co.uk/products/rendezvous-with-rama',
    cover_url: 'https://store.gollancz.co.uk/cdn/shop/products/9780575118171-original.jpg',
    publication_year: 1973
  }
];

export const GOLLANCZ_SF_SERIES: PublisherSeries = {
  name: 'Gollancz SF Masterworks',
  publisher: 'gollancz',
  description: 'The definitive library of science fiction classics, featuring over 190 essential works from the genre\'s greatest authors with iconic yellow-spine cover designs.',
  badge_emoji: '⭐'
};
