export const SWEET_WEIGHT_OPTIONS = [
  { id: '250g', label: '250g' },
  { id: '500g', label: '500g' },
  { id: '1kg', label: '1 kg' },
];

export const SWEETS_CATALOG = [
  {
    id: 'palkova',
    name: 'Signature Palkova',
    tagline: 'Our Traditional Signature',
    image: '/palkova_card.jpg',
    featured: true,
    hsn: '0402',
    description: 'Slow-simmered whole milk caramelized to perfection in brass urulis with pure desi ghee.',
    prices: {
      '250g': 180,
      '500g': 340,
      '1kg': 650,
    },
  },
  {
    id: 'milk-peda',
    name: 'Milk Peda',
    tagline: 'Melt-in-mouth',
    image: '/milk_peda.jpg',
    featured: false,
    hsn: '0402',
    description: 'Silky smooth cardamom-infused condensed milk fudge shaped into classic rounds.',
    prices: {
      '250g': 170,
      '500g': 320,
      '1kg': 620,
    },
  },
  {
    id: 'mysore-pak',
    name: 'Royal Mysore Pak',
    tagline: 'Rich & Desi Ghee',
    image: '/mysore_pak.jpg',
    featured: false,
    hsn: '2106',
    description: 'Porous, aromatic roasted gram flour enriched with generous golden desi ghee.',
    prices: {
      '250g': 190,
      '500g': 360,
      '1kg': 690,
    },
  },
  {
    id: 'kaju-katli',
    name: 'Kaju Katli',
    tagline: 'Silver Leaf Cashew Diamond',
    image: '/kaju_katli.jpg',
    featured: false,
    hsn: '2106',
    description: 'Velvety diamond-cut confectionery crafted from 100% premium roasted cashews.',
    prices: {
      '250g': 280,
      '500g': 530,
      '1kg': 1020,
    },
  },
  {
    id: 'badam-halwa',
    name: 'Badam Halwa',
    tagline: 'Saffron Kissed Almond',
    image: '/badam_halwa.jpg',
    featured: false,
    hsn: '2106',
    description: 'Decadent crushed California almond halwa simmered with Kashmiri saffron & ghee.',
    prices: {
      '250g': 290,
      '500g': 550,
      '1kg': 1060,
    },
  },
  {
    id: 'jangiri',
    name: 'Jangiri',
    tagline: 'Classic South Royal',
    image: '/jangiri.jpg',
    featured: false,
    hsn: '2106',
    description: 'Crisp, intricately swirled urad dal rosettes steeped in saffron rose syrup.',
    prices: {
      '250g': 150,
      '500g': 280,
      '1kg': 540,
    },
  },
  {
    id: 'gulab-jamun',
    name: 'Gulab Jamun',
    tagline: 'Syrup Soaked Khoa',
    image: '/gulab_jamun.jpg',
    featured: false,
    hsn: '0402',
    description: 'Soft, melt-in-mouth milk khoa dumplings soaked in fragrant cardamom sugar syrup.',
    prices: {
      '250g': 160,
      '500g': 300,
      '1kg': 580,
    },
  },
];

export const SPECIAL_BOX = {
  id: 'assorted-box',
  name: 'Thenisai Royal Assorted Box',
  tagline: 'A Box Full of Happiness (Limited Edition)',
  image: '/sweet_box.jpg',
  weight: '1kg',
  price: 750,
  hsn: '2106',
  description: 'Curated gift box featuring Palkova, Mysore Pak, Kaju Katli, and Badam Halwa in celebratory luxury packaging.',
};

export const STORE_DETAILS = {
  brandName: 'THENISAI SWEETS',
  tagline: 'The Taste of Tradition · Since 2006 · Madurai & Theni Heritage',
  establishedYear: '2006',
  addressLine1: '123 Sweet Street, Opp. South Tower',
  cityStatePin: 'Madurai, Tamil Nadu - 625001',
  phone: '+91 93448 93547',
  secondaryPhone: '+91 86818 58723',
  whatsappNumber: '919344893547',
  email: 'orders@thenisai.com',
  secondaryContact: '+91 86818 58723',
  gstin: '33AABCT9988C1Z4',
  fssai: '12423011000452',
  upiId: 'thenisai.sweets@okhdfcbank',
};

export const FREE_DELIVERY_THRESHOLD = 799;
export const STANDARD_DELIVERY_FEE = 50;
export const GST_RATE = 0.05; // 5% GST for Indian confectionery/milk sweets
