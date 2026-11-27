/* catalog.js — 훈이네과일야채 반곡점 · 카페·식당 납품 상품 목록
   2026-11-27 단구점 식자재몰(huns-fruit/food)을 바탕으로 반곡점 카페(케이크·디저트) 납품용으로 다시 꾸렸습니다.
   주력: 딸기 → 디저트·음료 과일 / 서브: 야채 · 계란·두부·콩나물
   ※ 딸기·계란 가격은 사장님 확정 전 임시 값입니다 (단구점 소매가보다 낮게 잡아 둠). 과일·야채는 식자재몰 단가 그대로.
   사진: 이 저장소 img/fruit/ · 식자재몰·소매몰 사진(절대 주소). 사진이 없으면 색 타일 + 이모지로 보입니다. */

var IMG = {
  /* 이 저장소 사진 */
  strawberry: "img/fruit/strawberry.webp", blueberry: "img/fruit/blueberry.webp", mango: "img/fruit/mango.webp",
  shine: "img/fruit/shine.webp", orange: "img/fruit/orange.webp", pear: "img/fruit/pear.webp",
  goldenhwang: "img/fruit/goldenhwang.webp", tangerine: "img/fruit/tangerine.webp", kiwi: "img/fruit/kiwi.webp",
  apple: "img/fruit/apple.webp", persimmon: "img/fruit/persimmon.webp",
  /* 소매몰 사진 */
  egg: "https://huns-fruit.github.io/assets/img/egg.webp", pomegranate: "https://huns-fruit.github.io/assets/img/pomegranate.webp",
  /* 식자재몰 사진 */
  onion: "https://huns-fruit.github.io/food/assets/img/onion.webp",
  cabbage_green: "https://huns-fruit.github.io/food/assets/img/cabbage_green.webp",
  garlic_peeled: "https://huns-fruit.github.io/food/assets/img/garlic_peeled.webp",
  carrot: "https://huns-fruit.github.io/food/assets/img/carrot.webp",
  daepa: "https://huns-fruit.github.io/food/assets/img/daepa.webp",
  lettuce: "https://huns-fruit.github.io/food/assets/img/lettuce.webp",
  sangchu: "https://huns-fruit.github.io/food/assets/img/sangchu.webp",
  cabbage: "https://huns-fruit.github.io/food/assets/img/cabbage.webp",
  bell_pepper: "https://huns-fruit.github.io/food/assets/img/bell_pepper.webp",
  cheongyang: "https://huns-fruit.github.io/food/assets/img/cheongyang.webp",
  crunch_pepper: "https://huns-fruit.github.io/food/assets/img/crunch_pepper.webp",
  enoki: "https://huns-fruit.github.io/food/assets/img/enoki.webp",
  potato: "https://huns-fruit.github.io/food/assets/img/potato.webp",
  cucumber: "https://huns-fruit.github.io/food/assets/img/cucumber.webp",
  chapchapi: "https://huns-fruit.github.io/food/assets/img/chapchapi.webp",
  sweet_potato: "https://huns-fruit.github.io/food/assets/img/sweet_potato.webp",
  eggplant: "https://huns-fruit.github.io/food/assets/img/eggplant.webp",
  aehobak: "https://huns-fruit.github.io/food/assets/img/aehobak.webp",
  oyster_mushroom: "https://huns-fruit.github.io/food/assets/img/oyster_mushroom.webp",
  baby_cabbage: "https://huns-fruit.github.io/food/assets/img/baby_cabbage.webp",
  chicory: "https://huns-fruit.github.io/food/assets/img/chicory.webp",
  garlic_stem: "https://huns-fruit.github.io/food/assets/img/garlic_stem.webp",
  ground_garlic: "https://huns-fruit.github.io/food/assets/img/ground_garlic.webp",
  ground_ginger: "https://huns-fruit.github.io/food/assets/img/ground_ginger.webp",
  curly_sprouts: "https://huns-fruit.github.io/food/assets/img/curly_sprouts.webp",
  soy_sprouts: "https://huns-fruit.github.io/food/assets/img/soy_sprouts.webp",
  mung_sprouts: "https://huns-fruit.github.io/food/assets/img/mung_sprouts.webp",
  tofu: "https://huns-fruit.github.io/food/assets/img/tofu.webp",
  lemon: "https://huns-fruit.github.io/food/assets/img/lemon.webp",
  grapefruit: "https://huns-fruit.github.io/food/assets/img/grapefruit.webp",
  banana: "https://huns-fruit.github.io/food/assets/img/banana.webp",
  pineapple: "https://huns-fruit.github.io/food/assets/img/pineapple.webp",
  tomato: "https://huns-fruit.github.io/food/assets/img/tomato.webp"
};

/* 최소주문 — 품목 구분 없이 합쳐서 50,000원 이상이면 원주 시내 무료배달 */
var MIN_ORDER = 50000;

/* 상품 구분 (탭 순서대로) */
var CATS = {
  berry: { key: "berry", label: "딸기·베리", short: "딸기", emoji: "🍓" },
  fruit: { key: "fruit", label: "디저트·음료 과일", short: "과일", emoji: "🍊" },
  veg:   { key: "veg",   label: "야채", short: "야채", emoji: "🥬" },
  daily: { key: "daily", label: "계란·두부·콩나물", short: "계란·두부", emoji: "🥚" }
};
var CAT_ORDER = ["berry", "fruit", "veg", "daily"];

/* 용도 — 카페 사장님이 쓰임새로 바로 찾게 (여러 구분에 걸쳐 모아 보여 줌) */
var USES = [
  { key: "cake",  label: "케이크·디저트", emoji: "🎂" },
  { key: "drink", label: "음료·에이드", emoji: "🥤" },
  { key: "brunch", label: "브런치·샐러드", emoji: "🥗" },
  { key: "kitchen", label: "식당 주방", emoji: "🍲" }
];

/* 🍓 딸기·베리 — 반곡점 주력. 크기별로 쓰임새를 적어 카페에서 고르기 쉽게 */
var BERRIES = [
  { id: "berry-3x4", name: "딸기 대과 (3×4)", unit: "1팩 · 케이크 토핑용", price: 12500, img: "strawberry", badge: "케이크 추천", use: ["cake"], desc: "모양이 고르고 큼직해 홀케이크·쇼트케이크 위에 올리기 좋아요" },
  { id: "berry-3x5", name: "딸기 중과 (3×5)", unit: "1팩 · 생크림·타르트", price: 9900, img: "strawberry", use: ["cake", "drink"], desc: "타르트·생크림 케이크 속, 컵과일에 알맞은 크기" },
  { id: "berry-4x5", name: "딸기 소과 (4×5)", unit: "1팩 · 라떼·청·주스", price: 7200, img: "strawberry", badge: "인기", use: ["drink"], desc: "딸기라떼·딸기청·생과일주스용으로 가성비 좋아요" },
  { id: "berry-box-2kg", name: "딸기 업소용", unit: "1박스 · 2kg", price: 39000, img: "strawberry", badge: "업소추천", use: ["cake", "drink"], desc: "겨울 시즌 · 디저트·음료 대량 사용" },
  { id: "berry-blueberry-fresh", name: "생블루베리 (칠레)", unit: "125g×12팩 1박스", price: 43000, img: "blueberry", use: ["cake", "brunch"], desc: "타르트·요거트볼 토핑" },
  { id: "berry-blueberry-frozen", name: "냉동 블루베리", unit: "1kg", price: 9500, img: "blueberry", use: ["drink"], desc: "스무디·에이드·청 만들기" }
];

/* 🍊 디저트·음료 과일 — 식자재몰 박스 단가 그대로 */
var DESSERT_FRUITS = [
  { id: "fruit-shine-muscat", name: "샤인머스캣", unit: "1박스 · 2kg", price: 28000, img: "shine", badge: "케이크 추천", use: ["cake"] },
  { id: "fruit-mango", name: "망고 (태국 남동마이)", unit: "5kg 1박스", price: 69000, img: "mango", use: ["cake", "drink"] },
  { id: "fruit-mango-apple", name: "애플망고 (페루)", unit: "5kg 1박스", price: 93000, img: "mango", use: ["cake"] },
  { id: "fruit-kiwi-gold-nz", name: "골드키위 (뉴질랜드)", unit: "5.8kg · 44과 1박스", price: 44000, img: "kiwi", use: ["cake", "drink"] },
  { id: "fruit-kiwi-green", name: "그린키위 (국내산 참다래)", unit: "10kg · 65과 1박스", price: 54000, img: "kiwi", use: ["drink"] },
  { id: "fruit-lemon", name: "레몬", unit: "50개입", price: 25000, img: "lemon", badge: "업소추천", use: ["drink"], desc: "레모네이드·에이드·청" },
  { id: "fruit-lemon-box", name: "레몬 (칠레)", unit: "17kg · 140과 1박스", price: 50000, img: "lemon", use: ["drink"] },
  { id: "fruit-lime", name: "라임", unit: "36개입", price: 18000, emoji: "🍋", use: ["drink"] },
  { id: "fruit-grapefruit", name: "자몽", unit: "25개입", price: 37500, img: "grapefruit", use: ["drink"], desc: "자몽에이드·자몽청" },
  { id: "fruit-grapefruit-box", name: "자몽 (남아공)", unit: "15kg · 35~45과 1박스", price: 61000, img: "grapefruit", use: ["drink"] },
  { id: "fruit-cheongjamong", name: "청자몽 (미국 메로골드)", unit: "15kg 1박스", price: 45000, emoji: "🍊", use: ["drink"] },
  { id: "fruit-orange", name: "오렌지", unit: "1박스 · 18kg", price: 69000, img: "orange", use: ["drink"], desc: "생오렌지주스" },
  { id: "fruit-banana", name: "바나나", unit: "12/14발 1박스 · 약 13kg · 필리핀/베트남산", price: 28000, img: "banana", badge: "인기", use: ["drink", "brunch"], desc: "바나나라떼·스무디·브런치" },
  { id: "fruit-pineapple", name: "골드파인애플", unit: "6수 1박스", price: 43000, img: "pineapple", use: ["drink", "cake"] },
  { id: "fruit-avocado", name: "아보카도", unit: "5.5kg · 25과 1박스", price: 47000, emoji: "🥑", use: ["brunch"] },
  { id: "fruit-green-grape", name: "청포도 (미국 오텀킹)", unit: "8.6kg 1박스", price: 92000, emoji: "🍇", use: ["cake"] },
  { id: "fruit-grape-red", name: "적포도 (미국 크림슨)", unit: "8.6kg 1박스", price: 65000, emoji: "🍇", use: ["brunch", "cake"] },
  { id: "fruit-hwanggeum-5", name: "황금향 (제주)", unit: "5kg 1박스", price: 24000, img: "goldenhwang", use: ["drink"] },
  { id: "fruit-mandarin", name: "감귤 (조생)", unit: "1박스 · 10kg", price: 18000, img: "tangerine", use: ["drink"] },
  { id: "fruit-melon", name: "메론", unit: "4수 1박스", price: 28000, emoji: "🍈", use: ["cake", "drink"] },
  { id: "fruit-dragonfruit", name: "용과 (베트남)", unit: "5kg 1박스", price: 26000, emoji: "🐉", use: ["drink", "brunch"] },
  { id: "fruit-pomegranate", name: "석류 (미국)", unit: "5.5kg · 11수 1박스", price: 49000, img: "pomegranate", use: ["drink"] },
  { id: "fruit-apple-3", name: "안동 사과", unit: "20kg · 상 3번", price: 40000, img: "apple", use: ["cake", "drink"], desc: "사과파이·애플시나몬·생과일주스" },
  { id: "fruit-pear", name: "신고배", unit: "15kg 1박스", price: 45000, img: "pear", use: ["drink", "kitchen"] },
  { id: "fruit-tomato-1", name: "완숙 토마토", unit: "5kg · 1번", price: 15000, img: "tomato", use: ["brunch", "kitchen"], desc: "시기상 A급이 아닙니다" }
];

/* 🥚 계란 — 임시 가격 (사장님 확정 전) */
var EGGS = [
  { id: "daily-egg-king", name: "왕란", unit: "30구 1판", price: 5800, img: "egg", badge: "인기", use: ["cake", "brunch", "kitchen"], desc: "베이킹·브런치 · 판 없이 알만" },
  { id: "daily-egg-king-5", name: "왕란", unit: "30구 × 5판", price: 28000, img: "egg", use: ["cake", "kitchen"], desc: "베이킹 대량 사용" }
];
/* 🥬 야채 — 식자재몰 채소 목록 그대로 (식당·브런치 서브) */
var BULK_VEGETABLES = [
  /* ── 기존 품목 (중량·개입만 보기 쉽게 덧붙임) ── */
  { id: "veg-onion",          name: "양파",             unit: "15kg · 국내산 A급",        price: 23800, img: "onion", badge: "인기" },
  { id: "veg-cabbage-green",  name: "양배추",           unit: "1망 · 3입 약 7kg",         price: 7900,  img: "cabbage_green" },
  { id: "veg-garlic",         name: "깐마늘",           unit: "1kg",                      price: 9900,  img: "garlic_peeled", badge: "업소추천" },
  { id: "veg-carrot",         name: "세척당근",         unit: "10kg 1박스 · 중국산",      price: 7900,  img: "carrot" },
  { id: "veg-scallion",       name: "대파",             unit: "1관 · 약 4kg",             price: 7900,  img: "daepa", badge: "인기" },
  { id: "veg-lettuce",        name: "양상추",           unit: "12수 1박스 · 약 6kg",      price: 15000, img: "lettuce", badge: "업소추천" },
  { id: "veg-leaf-lettuce",   name: "상추",             unit: "4kg (1박스)",              price: 19800, img: "sangchu" },
  { id: "veg-leaf-lettuce-2", name: "상추",             unit: "2kg (1박스)",              price: 10500, img: "sangchu", badge: "인기" },
  { id: "veg-cabbage",        name: "배추",             unit: "1망 · 3입 약 6kg (55사이즈 중품)", price: 5000, img: "cabbage" },
  { id: "veg-bell-pepper",    name: "피망",             unit: "1kg",                      price: 9900,  img: "bell_pepper" },
  { id: "veg-hot-pepper",     name: "청양고추",         unit: "1kg",                      price: 7500,  img: "cheongyang" },
  { id: "veg-crunch-pepper",  name: "아삭이고추",       unit: "1kg",                      price: 8000,  img: "crunch_pepper" },
  { id: "veg-enoki",          name: "팽이버섯",         unit: "1박스 · 30봉 약 4.5kg",    price: 9900,  img: "enoki" },
  { id: "veg-potato-l",       name: "감자",             unit: "20kg · 대",                price: 20000, img: "potato", badge: "인기" },
  { id: "veg-potato-xl",      name: "감자",             unit: "20kg · 왕특",              price: 36000, img: "potato" },
  { id: "veg-potato-xxl",     name: "감자",             unit: "20kg · 왕왕",              price: 38000, img: "potato" },
  { id: "veg-cucumber",       name: "백오이",           unit: "100개입 1박스",            price: 90000, img: "cucumber", badge: "업소추천" },
  { id: "veg-chapchapi",      name: "찹찹이",           unit: "1kg",                      price: 13000, img: "chapchapi" },
  { id: "veg-sweet-potato",   name: "고구마",           unit: "10kg · 튀김용",            price: 25000, img: "sweet_potato" },
  { id: "veg-eggplant",       name: "가지",             unit: "1박스 · 10kg",             price: 20000, img: "eggplant" },
  { id: "veg-squash",         name: "애호박",           unit: "20개입 1박스 · 약 6kg · 특", price: 20000, img: "aehobak" },
  { id: "veg-oyster-mushroom",name: "느타리버섯",       unit: "2kg",                      price: 9900,  img: "oyster_mushroom" },
  { id: "veg-baby-cabbage",   name: "알배기",           unit: "1박스 · 8kg · 상",         price: 15000, img: "baby_cabbage" },
  { id: "veg-chicory",        name: "치커리",           unit: "1박스 · 2kg",              price: 9900,  img: "chicory" },
  { id: "veg-garlic-stem",    name: "수입마늘쫑",       unit: "1단 · 약 1kg · 중국산",    price: 3000,  img: "garlic_stem" },
  { id: "veg-ground-garlic",  name: "간마늘",           unit: "1kg",                      price: 8500,  img: "ground_garlic" },
  { id: "veg-ground-ginger",  name: "간생강",           unit: "1kg",                      price: 11000, img: "ground_ginger" },
  { id: "veg-curly-sprouts",  name: "곱슬이",           unit: "1박스 · 약 4kg",           price: 3500,  img: "curly_sprouts" },
  { id: "veg-soy-sprouts",    name: "일자콩나물",       unit: "1박스 · 약 4.5kg",         price: 3500,  img: "soy_sprouts" },
  { id: "veg-mung-sprouts",   name: "숙주",             unit: "1박스 · 약 4kg",           price: 5500,  img: "mung_sprouts" },
  { id: "veg-tofu",           name: "강릉심해순두부",   unit: "1kg 식자재용 · 1박스",     price: 18000, img: "tofu" },

  /* ── 신규: 잎 · 쌈 · 샐러드 ── */
  { id: "veg-perilla",        name: "깻잎",             unit: "1kg",                      price: 12000, emoji: "🍃", badge: "인기" },
  { id: "veg-chive-500",      name: "부추",             unit: "1단 · 500g",               price: 2500,  emoji: "🌿" },
  { id: "veg-chive-box",      name: "부추",             unit: "1박스 · 4kg",              price: 18000, emoji: "🌿" },
  { id: "veg-spinach-bunch",  name: "시금치",           unit: "1단 · 400g",               price: 2800,  emoji: "🥬" },
  { id: "veg-spinach-box",    name: "시금치",           unit: "1박스 · 4kg",              price: 24000, emoji: "🥬" },
  { id: "veg-garland",        name: "쑥갓",             unit: "1단 · 300g",               price: 2200,  emoji: "🌿" },
  { id: "veg-water-dropwort", name: "미나리",           unit: "1단 · 500g",               price: 3000,  emoji: "🌿" },
  { id: "veg-eolgari",        name: "얼갈이배추",       unit: "1단 · 800g",               price: 2500,  emoji: "🥬" },
  { id: "veg-yeolmu",         name: "열무",             unit: "1단 · 1kg",                price: 3000,  emoji: "🥬" },
  { id: "veg-bokchoy",        name: "청경채",           unit: "1박스 · 2kg",              price: 8000,  emoji: "🥬" },
  { id: "veg-romaine",        name: "로메인",           unit: "1박스 · 2kg",              price: 11000, emoji: "🥬" },
  { id: "veg-kale",           name: "케일",             unit: "1kg",                      price: 6500,  emoji: "🥬" },
  { id: "veg-vitamin",        name: "비타민",           unit: "1kg",                      price: 5500,  emoji: "🌱" },
  { id: "veg-red-cabbage",    name: "적양배추",         unit: "1박스 · 10kg",             price: 13000, emoji: "🥬" },
  { id: "veg-musun",          name: "무순",             unit: "1박스 · 약 1kg",           price: 9000,  emoji: "🌱" },
  { id: "veg-parsley",        name: "파슬리",           unit: "500g",                     price: 4500,  emoji: "🌿" },
  { id: "veg-broccoli",       name: "브로콜리",         unit: "1박스 · 8kg",              price: 21000, emoji: "🥦", badge: "업소추천" },
  { id: "veg-cauliflower",    name: "콜리플라워",       unit: "1박스 · 8kg",              price: 20000, emoji: "🥦" },
  { id: "veg-celery",         name: "셀러리",           unit: "1박스 · 10kg",             price: 13000, emoji: "🌿" },

  /* ── 신규: 뿌리 · 파 · 고추 · 향신 ── */
  { id: "veg-radish",         name: "무",               unit: "1박스 · 20kg",             price: 16000, emoji: "🥕", badge: "인기" },
  { id: "veg-garlic-whole-1", name: "통마늘",           unit: "1망 · 1kg",                price: 12000, emoji: "🧄" },
  { id: "veg-garlic-whole-5", name: "통마늘",           unit: "1망 · 5kg",                price: 56000, emoji: "🧄" },
  { id: "veg-chives",         name: "쪽파",             unit: "1단 · 약 1kg",             price: 3000,  emoji: "🌿" },
  { id: "veg-red-pepper",     name: "홍고추",           unit: "1kg",                      price: 9000,  emoji: "🌶️" },
  { id: "veg-ggari-pepper",   name: "꽈리고추",         unit: "1kg",                      price: 8500,  emoji: "🌶️" },
  { id: "veg-paprika-red",    name: "파프리카 (적)",    unit: "1박스 · 5kg",              price: 32000, emoji: "🫑" },
  { id: "veg-paprika-yellow", name: "파프리카 (황)",    unit: "1박스 · 5kg",              price: 33000, emoji: "🫑" },
  { id: "veg-red-onion",      name: "적양파",           unit: "1망 · 15kg",               price: 19000, emoji: "🧅" },
  { id: "veg-onion-peeled",   name: "깐양파",           unit: "1박스 · 10kg",             price: 17000, emoji: "🧅" },
  { id: "veg-lotus-root",     name: "연근",             unit: "1박스 · 2kg",              price: 9000,  emoji: "🪷" },
  { id: "veg-burdock",        name: "우엉",             unit: "1박스 · 2kg",              price: 8000,  emoji: "🥕" },
  { id: "veg-beet",           name: "비트",             unit: "1박스 · 5kg",              price: 9000,  emoji: "🍠" },

  /* ── 신규: 버섯 · 열매 · 두부 · 나물 ── */
  { id: "veg-king-oyster",    name: "새송이버섯",       unit: "1박스 · 2kg",              price: 8500,  emoji: "🍄", badge: "업소추천" },
  { id: "veg-shiitake",       name: "표고버섯",         unit: "1kg",                      price: 12000, emoji: "🍄" },
  { id: "veg-button-mushroom",name: "양송이버섯",       unit: "1kg",                      price: 9500,  emoji: "🍄" },
  { id: "veg-wood-ear",       name: "목이버섯 (건)",    unit: "1kg",                      price: 16000, emoji: "🍄" },
  { id: "veg-buna-shimeji",   name: "만가닥버섯",       unit: "1박스 · 2kg",              price: 7000,  emoji: "🍄" },
  { id: "veg-sweet-pumpkin",  name: "단호박",           unit: "1박스 · 10kg",             price: 22000, emoji: "🎃" },
  { id: "veg-zucchini",       name: "쥬키니호박",       unit: "1박스 · 10kg",             price: 12000, emoji: "🥒" },
  { id: "veg-cucumber-chwi",  name: "취청오이",         unit: "50개입 1박스",             price: 32000, emoji: "🥒", badge: "업소추천" },
  { id: "veg-cherry-tomato",  name: "대추방울토마토",   unit: "1박스 · 2kg",              price: 12000, emoji: "🍅" },
  { id: "veg-tofu-pan",       name: "판두부",           unit: "1판 · 3kg",                price: 6500,  emoji: "⬜" },
  { id: "veg-gosari",         name: "고사리 (삶은)",    unit: "1kg",                      price: 11000, emoji: "🌿" }
];

/* 식자재몰 채소 중 두부·콩나물·숙주는 '계란·두부·콩나물'로 옮깁니다 */
var DAILY_FROM_VEG = ["veg-tofu", "veg-tofu-pan", "veg-soy-sprouts", "veg-mung-sprouts"];
/* 야채 용도 — 브런치·샐러드에 쓰는 것만 표시, 나머지는 식당 주방 */
var BRUNCH_VEG = ["veg-lettuce", "veg-leaf-lettuce", "veg-leaf-lettuce-2", "veg-romaine", "veg-kale", "veg-baby-cabbage", "veg-red-cabbage",
  "veg-parsley", "veg-broccoli", "veg-cherry-tomato", "veg-paprika-red", "veg-paprika-yellow", "veg-red-onion", "veg-celery", "veg-vitamin", "veg-chicory"];

/* 화면에서 쓰는 한 벌 목록 (cat 키를 붙여 둡니다) */
var PRODUCTS = [];
BERRIES.forEach(function(p){ p.cat = "berry"; PRODUCTS.push(p); });
DESSERT_FRUITS.forEach(function(p){ p.cat = "fruit"; PRODUCTS.push(p); });
EGGS.forEach(function(p){ p.cat = "daily"; PRODUCTS.push(p); });
BULK_VEGETABLES.forEach(function(p){
  if (DAILY_FROM_VEG.indexOf(p.id) > -1){ p.cat = "daily"; p.use = ["kitchen"]; }
  else { p.cat = "veg"; p.use = BRUNCH_VEG.indexOf(p.id) > -1 ? ["brunch", "kitchen"] : ["kitchen"]; }
  PRODUCTS.push(p);
});
