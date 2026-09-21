/**
 * English to Tamil Automatic Translation Utility
 * Specially tailored for sweets, savouries, beverages, bakery, and grocery items.
 * Uses a rich local fast dictionary for instantaneous offline translation,
 * with debounced fallback to MyMemory Translation API for novel/complex phrases.
 */

// Comprehensive sweet stall, bakery, snack & beverage dictionary
export const SWEET_SHOP_DICTIONARY = {
  // Beverages
  tea: 'டீ',
  coffee: 'காபி',
  'filter coffee': 'ஃபில்டர் காபி',
  milk: 'பால்',
  'cow milk': 'பசும்பால்',
  'hot milk': 'சூடான பால்',
  'cold milk': 'குளிர்ந்த பால்',
  'badam milk': 'பாதாம் பால்',
  horlicks: 'ஹார்லிக்ஸ்',
  boost: 'பூஸ்ட்',
  'ragi malt': 'கேழ்வரகு கூழ்',
  'lemon tea': 'எலுமிச்சை டீ',
  'sugu tea': 'சுக்கு டீ',
  'sukku tea': 'சுக்கு டீ',
  'magu tea': 'மிளகு டீ',
  'ginger lemon': 'இஞ்சி எலுமிச்சை',
  'ginger tea': 'இஞ்சி டீ',
  'green tea': 'கிரீன் டீ',
  'black tea': 'பிளாக் டீ',
  'black coffee': 'பிளாக் காபி',
  water: 'தண்ணீர்',
  'mineral water': 'குடிநீர்',
  buttermilk: 'மோர்',
  curd: 'தயிர்',
  lassi: 'லஸ்ஸி',
  bovonto: 'போவண்டோ',
  'rose milk': 'ரோஸ் மில்க்',

  // Sweets
  palkova: 'பால்கோவா',
  'signature palkova': 'பாரம்பரிய பால்கோவா',
  'milk peda': 'பால் பேடா',
  peda: 'பேடா',
  'kesar peda': 'கேசரி பேடா',
  'mysore pak': 'மைசூர் பாக்',
  'ghee mysore pak': 'நெய் மைசூர் பாக்',
  'royal mysore pak': 'நெய் மைசூர் பாக்',
  'kaju katli': 'காஜு கத்லி',
  'kaju roll': 'காஜு ரோல்',
  'cashew roll': 'முந்திரி ரோல்',
  'cashew cake': 'முந்திரி கேக்',
  halwa: 'அல்வா',
  'wheat halwa': 'கோதுமை அல்வா',
  'tirunelveli halwa': 'திருநெல்வேலி அல்வா',
  'carrot halwa': 'கேரட் அல்வா',
  'badam halwa': 'பாதாம் அல்வா',
  'dum root halwa': 'டம்ரூட் அல்வா',
  laddu: 'லட்டு',
  laddoo: 'லட்டு',
  'motichoor laddu': 'மோதிச்சூர் லட்டு',
  'boondi laddu': 'பூந்தி லட்டு',
  'rava laddu': 'ரவா லட்டு',
  'besan laddu': 'கடலை மாவு லட்டு',
  jangri: 'ஜாங்கிரி',
  'mini jangri': 'மினி ஜாங்கிரி',
  jalebi: 'ஜிலேபி',
  'gulab jamun': 'குலாப் ஜாமுன்',
  'kala jamun': 'காலா ஜாமுன்',
  rasagulla: 'ரசகுல்லா',
  rasgulla: 'ரசகுல்லா',
  rasmalai: 'ரஸ்மலாய்',
  'cham cham': 'சாம் சாம்',
  'soan papdi': 'சோன் பப்டி',
  'dry fruit halwa': 'டிரை ஃப்ரூட் அல்வா',
  'dates halwa': 'பேரீச்சம்பழ அல்வா',
  'coconut burfi': 'தேங்காய் பர்பி',
  'chocolate burfi': 'சாக்லேட் பர்பி',
  'badam burfi': 'பாதாம் பர்பி',
  'kaju burfi': 'காஜு பர்பி',
  'milk cake': 'மில்க் கேக்',
  kalakand: 'கலாகந்த்',
  adhirasam: 'அதிரசம்',
  athirasam: 'அதிரசம்',
  somasi: 'சோமாசி',
  poli: 'போளி',
  'paruppu poli': 'பருப்பு போளி',
  'thengai poli': 'தேங்காய் போளி',

  // Savouries & Snacks
  vada: 'வடை',
  vadai: 'வடை',
  'medu vada': 'மெது வடை',
  'masala vada': 'மசால் வடை',
  samosa: 'சமோசா',
  'mini samosa': 'மினி சமோசா',
  'onion samosa': 'வெங்காய சமோசா',
  murukku: 'முறுக்கு',
  'kai murukku': 'கை முறுக்கு',
  'butter murukku': 'வெண்ணெய் முறுக்கு',
  thenkuzhal: 'தேன்குழல்',
  thattai: 'தட்டை',
  'mini thattai': 'மினி தட்டை',
  mixture: 'மிக்சர்',
  'special mixture': 'ஸ்பெஷல் மிக்சர்',
  'bombay mixture': 'பாம்பே மிக்சர்',
  'madras mixture': 'மெட்ராஸ் மிக்சர்',
  'nuts mixture': 'நட்ஸ் மிக்சர்',
  'ragi mixture': 'ராகி மிக்சர்',
  'aval mixture': 'அவல் மிக்சர்',
  'mint mixture': 'புதினா மிக்சர்',
  'kara sev': 'காராசேவு',
  'kara sevu': 'காராசேவு',
  'sattur kara sevu': 'சாத்தூர் காராசேவு',
  'kara boondi': 'காரா பூந்தி',
  omapodi: 'ஓமப்பொடி',
  'ribbon pakoda': 'ரிப்பன் பக்கோடா',
  'cashew pakoda': 'முந்திரி பக்கோடா',
  'onion pakoda': 'வெங்காய பக்கோடா',
  seedai: 'சீடை',
  'uppu seedai': 'உப்பு சீடை',
  'banana chips': 'வாழைக்காய் சிப்ஸ்',
  'potato chips': 'உருளைக்கிழங்கு சிப்ஸ்',
  'tapioca chips': 'மரவள்ளிக்கிழங்கு சிப்ஸ்',
  'kara pori': 'காரப்பொரி',
  nippat: 'நெப்பட்',

  // Key ingredients & modifiers
  ghee: 'நெய்',
  butter: 'வெண்ணெய்',
  sweet: 'இனிப்பு',
  kara: 'காரம்',
  spicy: 'காரமான',
  hot: 'சூடான',
  special: 'ஸ்பெஷல்',
  traditional: 'பாரம்பரிய',
  crispy: 'மொருமொருப்பான',
  fresh: 'புதிய',
  cashew: 'முந்திரி',
  almond: 'பாதாம்',
  badam: 'பாதாம்',
  pista: 'பிஸ்தா',
  pistachio: 'பிஸ்தா',
  cardamom: 'ஏலக்காய்',
  honey: 'தேன்',
  jaggery: 'வெல்லம்',
  sugar: 'சர்க்கரை',
  ginger: 'இஞ்சி',
  lemon: 'எலுமிச்சை',
  ragi: 'கேழ்வரகு',
  wheat: 'கோதுமை',
  rice: 'அரிசி',
  coconut: 'தேங்காய்',
  garlic: 'பூண்டு',
  onion: 'வெங்காயம்',
  pepper: 'மிளகு',
  cumin: 'சீரகம்',
  jeera: 'சீரகம்',
  sesame: 'எள்ளு',
  groundnut: 'வேர்க்கடலை',
  peanut: 'நிலக்கடலை',
  dal: 'பருப்பு',
  gram: 'கடலை',
};

// Clean HTML entities if any returned by translation API
function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Translates English product text to Tamil.
 * 1. Checks exact phrase match in local dictionary
 * 2. Checks word-by-word in local dictionary
 * 3. Falls back to online translation API
 *
 * @param {string} text - English text to translate
 * @returns {Promise<string>} - Translated Tamil text
 */
export async function translateToTamil(text) {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();

  // 1. Direct dictionary match
  if (SWEET_SHOP_DICTIONARY[lower]) {
    return SWEET_SHOP_DICTIONARY[lower];
  }

  // 2. Check multi-word phrase patterns in dictionary
  const words = lower.split(/\s+/).filter(Boolean);
  let allWordsMatched = true;
  const translatedWords = words.map((w) => {
    if (SWEET_SHOP_DICTIONARY[w]) {
      return SWEET_SHOP_DICTIONARY[w];
    }
    allWordsMatched = false;
    return w;
  });

  if (allWordsMatched && translatedWords.length > 0) {
    return translatedWords.join(' ');
  }

  // 3. Fall back to MyMemory Translated API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=en|ta`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const rawResult = data?.responseData?.translatedText;
      if (rawResult && !rawResult.toUpperCase().includes('MYMEMORY WARNING')) {
        const decoded = decodeHtmlEntities(rawResult).trim();
        // If the result actually contains Tamil script (Unicode \u0B80-\u0BFF), return it!
        if (/[\u0B80-\u0BFF]/.test(decoded)) {
          return decoded;
        }
      }
    }
  } catch (err) {
    console.warn('[translateToTamil] API fetch failed, using local dictionary partial:', err.message);
  }

  // 4. Return any partial word matches if available, else empty string
  const partial = words.map((w) => SWEET_SHOP_DICTIONARY[w] || '').filter(Boolean);
  return partial.length > 0 ? partial.join(' ') : '';
}
