/**
 * Light AI-powered search utilities
 * Expands search terms with synonyms and related words for better matching
 */

// Synonym mappings for nonprofit/charity domain
const synonyms: Record<string, string[]> = {
  // Animals
  animal: ["animals", "pet", "pets", "wildlife", "dog", "cat", "shelter"],
  pet: ["pets", "animal", "animals", "dog", "cat", "shelter"],
  dog: ["dogs", "canine", "pet", "pets", "animal", "shelter"],
  cat: ["cats", "feline", "pet", "pets", "animal", "shelter"],
  wildlife: ["wild", "nature", "conservation", "animal", "animals"],

  // Environment
  environment: ["environmental", "climate", "nature", "conservation", "green", "eco", "sustainability"],
  climate: ["environment", "global warming", "carbon", "green", "sustainability"],
  nature: ["environment", "wildlife", "conservation", "outdoor", "natural"],
  conservation: ["preserve", "protect", "environment", "nature", "wildlife"],
  green: ["environment", "eco", "sustainable", "climate"],
  ocean: ["marine", "sea", "water", "beach", "coastal"],
  tree: ["trees", "forest", "reforestation", "plant"],
  forest: ["trees", "reforestation", "nature", "woodland"],

  // Healthcare
  health: ["healthcare", "medical", "medicine", "hospital", "wellness", "disease"],
  healthcare: ["health", "medical", "medicine", "hospital", "clinic"],
  medical: ["health", "healthcare", "medicine", "hospital", "doctor"],
  hospital: ["health", "healthcare", "medical", "clinic"],
  disease: ["illness", "health", "medical", "cure", "treatment"],
  cancer: ["disease", "health", "medical", "oncology", "tumor"],
  mental: ["mental health", "psychology", "counseling", "therapy", "wellness"],

  // Education
  education: ["school", "learning", "teach", "student", "academic", "literacy"],
  school: ["education", "learning", "student", "academy", "teach"],
  student: ["students", "education", "school", "learning", "youth"],
  literacy: ["reading", "education", "books", "learning"],
  scholarship: ["education", "student", "tuition", "college", "university"],

  // Hunger/Food
  hunger: ["food", "meal", "hungry", "feed", "nutrition", "starvation"],
  food: ["hunger", "meal", "feed", "nutrition", "grocery"],
  meal: ["food", "hunger", "feed", "lunch", "dinner"],
  feed: ["food", "hunger", "meal", "nutrition"],
  homeless: ["housing", "shelter", "poverty", "unhoused"],

  // Housing
  housing: ["home", "house", "shelter", "homeless", "affordable"],
  home: ["housing", "house", "shelter", "family"],
  shelter: ["housing", "homeless", "home"],
  affordable: ["low-income", "housing", "poverty"],

  // Children/Youth
  children: ["child", "kids", "youth", "young", "family"],
  child: ["children", "kids", "youth", "young"],
  kids: ["children", "child", "youth", "young"],
  youth: ["young", "children", "kids", "teen", "adolescent"],
  family: ["families", "children", "parent", "home"],

  // Veterans/Military
  veteran: ["veterans", "military", "soldier", "armed forces", "service member"],
  veterans: ["veteran", "military", "soldiers", "armed forces"],
  military: ["veteran", "veterans", "soldier", "armed forces", "army", "navy", "marines"],

  // Disaster
  disaster: ["emergency", "relief", "crisis", "hurricane", "flood", "earthquake"],
  emergency: ["disaster", "relief", "crisis", "urgent"],
  relief: ["disaster", "emergency", "aid", "help", "assistance"],

  // Human Rights
  rights: ["human rights", "civil rights", "equality", "justice", "freedom"],
  equality: ["equal", "rights", "justice", "fairness"],
  justice: ["rights", "equality", "legal", "fairness"],

  // Religion
  religious: ["religion", "faith", "church", "spiritual", "christian", "ministry"],
  church: ["religious", "faith", "christian", "ministry", "worship"],
  faith: ["religious", "church", "spiritual", "belief"],
  ministry: ["church", "religious", "faith", "christian"],

  // Arts
  art: ["arts", "culture", "museum", "creative", "artistic"],
  arts: ["art", "culture", "museum", "creative", "artistic"],
  culture: ["cultural", "arts", "heritage", "museum"],
  music: ["arts", "culture", "performance", "concert"],

  // Sports
  sport: ["sports", "athletic", "fitness", "exercise", "recreation"],
  sports: ["sport", "athletic", "fitness", "exercise", "recreation"],
  athletic: ["sports", "fitness", "exercise"],

  // General giving terms
  help: ["support", "assist", "aid", "donate", "give"],
  support: ["help", "assist", "aid", "donate"],
  donate: ["give", "support", "help", "contribute"],
  charity: ["nonprofit", "organization", "foundation", "give"],
  community: ["local", "neighborhood", "people", "society"],
  poverty: ["poor", "low-income", "needy", "disadvantaged"],
  international: ["global", "world", "overseas", "foreign"],
  local: ["community", "neighborhood", "regional"],
};

/**
 * Expand a search term with related synonyms
 */
function expandTerm(term: string): string[] {
  const normalized = term.toLowerCase().trim();
  const expanded = new Set<string>([normalized]);

  // Add direct synonyms
  if (synonyms[normalized]) {
    synonyms[normalized].forEach((syn) => expanded.add(syn));
  }

  // Check if any synonym key contains this term (partial match)
  Object.entries(synonyms).forEach(([key, values]) => {
    if (key.includes(normalized) || normalized.includes(key)) {
      expanded.add(key);
      values.forEach((v) => expanded.add(v));
    }
  });

  return Array.from(expanded);
}

/**
 * Get all expanded search terms from a search query
 */
export function getExpandedSearchTerms(query: string): string[] {
  if (!query.trim()) return [];

  const words = query.toLowerCase().trim().split(/\s+/);
  const allTerms = new Set<string>();

  words.forEach((word) => {
    const expanded = expandTerm(word);
    expanded.forEach((term) => allTerms.add(term));
  });

  return Array.from(allTerms);
}

/**
 * Check if text matches any of the search terms (expanded with synonyms)
 */
export function smartMatch(text: string | null | undefined, searchQuery: string): boolean {
  if (!text || !searchQuery.trim()) return true;

  const normalizedText = text.toLowerCase();
  const expandedTerms = getExpandedSearchTerms(searchQuery);

  // Check if any expanded term matches
  return expandedTerms.some((term) => normalizedText.includes(term));
}

/**
 * Smart filter function for nonprofits
 * Matches against name, mission, description, and category
 */
export function smartFilterNonprofit(
  nonprofit: {
    name: string;
    mission?: string | null;
    description?: string | null;
    category?: { name: string } | null;
  },
  searchQuery: string
): boolean {
  if (!searchQuery.trim()) return true;

  const expandedTerms = getExpandedSearchTerms(searchQuery);
  const searchableText = [
    nonprofit.name,
    nonprofit.mission,
    nonprofit.description,
    nonprofit.category?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return expandedTerms.some((term) => searchableText.includes(term));
}

/**
 * Smart filter function for categories
 */
export function smartFilterCategory(
  category: {
    name: string;
    description?: string | null;
  },
  searchQuery: string
): boolean {
  if (!searchQuery.trim()) return true;

  const expandedTerms = getExpandedSearchTerms(searchQuery);
  const searchableText = [category.name, category.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return expandedTerms.some((term) => searchableText.includes(term));
}
