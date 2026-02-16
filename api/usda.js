const FDC_BASE = 'https://api.nal.usda.gov/fdc/v1';

const NUTRIENT_IDS = {
  calories: 1008,
  protein: 1003,
  carbs: 1005,
  fat: 1004,
  fiber: 1079,
  sodium: 1093,
};

function getNutrient(food, nutrientId) {
  const n = food.foodNutrients?.find((x) => x.nutrientId === nutrientId);
  return n != null ? Number(n.value) : 0;
}

function mapFoodToAbridged(food) {
  const servingGrams = food.servingSize ?? 100;
  const servingUnit = food.servingSizeUnit ?? 'g';
  return {
    fdcId: food.fdcId,
    description: food.description,
    brandOwner: food.brandOwner || null,
    brandName: food.brandName || null,
    dataType: food.dataType,
    servingSize: servingGrams,
    servingSizeUnit: servingUnit,
    householdServingFullText: food.householdServingFullText || null,
    calories: getNutrient(food, NUTRIENT_IDS.calories),
    protein: getNutrient(food, NUTRIENT_IDS.protein),
    carbs: getNutrient(food, NUTRIENT_IDS.carbs),
    fat: getNutrient(food, NUTRIENT_IDS.fat),
    fiber: getNutrient(food, NUTRIENT_IDS.fiber),
    sodium: getNutrient(food, NUTRIENT_IDS.sodium),
  };
}

export async function searchFoods(query, apiKey, pageSize = 20) {
  const key = apiKey || process.env.FDC_API_KEY || 'DEMO_KEY';
  const url = `${FDC_BASE}/foods/search?api_key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: query.trim(),
      pageSize: Math.min(50, pageSize),
      dataType: ['Branded', 'Survey (FNDDS)', 'Foundation', 'SR Legacy'],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    const isRateLimit = res.status === 429 || /rate limit|too many requests/i.test(text);
    const msg = isRateLimit
      ? 'USDA rate limit exceeded. Use "Enter manually" for now, or add a free API key (see README).'
      : `USDA API error: ${res.status} ${text}`;
    const err = new Error(msg);
    err.rateLimit = isRateLimit;
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const foods = (data.foods || []).map(mapFoodToAbridged);
  return { foods, totalHits: data.totalHits ?? 0 };
}

export async function getFoodByFdcId(fdcId, apiKey) {
  const key = apiKey || process.env.FDC_API_KEY || 'DEMO_KEY';
  const url = `${FDC_BASE}/food/${fdcId}?api_key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    const isRateLimit = res.status === 429 || /rate limit|too many requests/i.test(text);
    const msg = isRateLimit
      ? 'USDA rate limit exceeded. Use "Enter manually" or add a free API key (see README).'
      : `USDA API error: ${res.status} ${text}`;
    const err = new Error(msg);
    err.rateLimit = isRateLimit;
    throw err;
  }
  const food = await res.json();
  return mapFoodToAbridged(food);
}
