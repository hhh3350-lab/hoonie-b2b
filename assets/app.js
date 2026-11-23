
(function(){
"use strict";
var HOONIE_MODE = (window.__HOONIE_MODE || "client");
/* ═══════════════════════════════════════════════════════════
   훈이네과일야채 반곡점 — 원주 시내 야채·식자재 B2B 발주 (core)
   저장: localStorage 하나 (사업자 정보·단가·주문·거래처·입금·재입고)
   ═══════════════════════════════════════════════════════════ */

/* ── 화면 모드 ────────────────────────────────────────
   build.py 가 index.html에는 "client", admin.html에는 "admin"을 넣는다.
   client = 거래처(식당·마트) 발주 화면 — 사장님 관리 메뉴 없음
   admin  = 사장님 화면 — 열면 바로 사장님 관리, 거래처 화면 링크만 */
var MODE = (typeof HOONIE_MODE !== "undefined" ? HOONIE_MODE : "client");
var IS_ADMIN = MODE === "admin";

/* ── 사업자 정보 기본값 (반곡점) ────────────────────── */
var STORE_DEFAULT = {
  name: "훈이네과일야채",
  branch: "반곡점",
  owner: "김영헌",
  bizNo: "150-95-01921",
  addr: "강원특별자치도 원주시 늘품로 187-54, 105호(반곡동)",
  uptae: "도/소매업",
  jongmok: "채소, 과실 및 뿌리작물 소매업, 전자상거래 소매 중개업",
  taxType: "부가가치세 면세사업자",
  phone: "033-765-1531",
  bank: "농협",
  account: "351-5306-3519-83",
  holder: "김영헌"
};

/* 사업자 정보 프리셋 — 사진에 찍힌 단구점 / 사용자가 고른 반곡점 */
var STORE_PRESETS = {
  bangok: {
    label: "반곡점 (기본)",
    name: "훈이네과일야채", branch: "반곡점", owner: "김영헌", bizNo: "150-95-01921",
    addr: "강원특별자치도 원주시 늘품로 187-54, 105호(반곡동)",
    uptae: "도/소매업", jongmok: "채소, 과실 및 뿌리작물 소매업, 전자상거래 소매 중개업",
    taxType: "부가가치세 면세사업자", phone: "033-765-1531"
  },
  dangu: {
    label: "단구점 (사진 속 사업자)",
    name: "훈이네과일야채", branch: "단구점", owner: "황관훈", bizNo: "421-28-01608",
    addr: "강원특별자치도 원주시 단구로 398, 훈이네과일야채 101호 (단구동, 청솔3차)",
    uptae: "도/소매업", jongmok: "채소, 과실 및 뿌리작물 소매업, 전자상거래 소매 중개업",
    taxType: "부가가치세 면세사업자", phone: "033-765-1531"
  }
};

/* ── 배달 회차 ─────────────────────────────────────── */
var DEFAULT_ROUNDS = [
  { key:"R1", label:"1차", dispatch:"08:00", cutoff:"07:30", note:"아침 첫 배달" },
  { key:"R2", label:"2차", dispatch:"11:00", cutoff:"10:30", note:"두 번째 배달" },
  { key:"R3", label:"3차", dispatch:"13:00~14:00", cutoff:"12:30", note:"세 번째 배달" }
];

/* ── 기본 정책: 원주 시내권 배달, 최소 주문 50,000원 · 무료배송 ── */
var DEFAULT_POLICY = {
  minOrder: 50000,   // 이 금액 미만은 발주 불가 (5만 원 이상부터 주문 가능)
  shipFee: 0,        // 원주 시내권 기본 무료배송
  area: "원주 시내권"
};

/* ── 품목 (야채·식자재 15종) ──────────────────────────
   cat 은 손님(식당 사장님)이 바로 알아보는 말만 쓴다 — 야채 / 양념·파·마늘 / 과일
   사장님 말씀대로 품목은 "청양(특)1박스 · 청양(상)1박스 · 청양 1kg" 처럼
   같은 품목의 등급·단위별로 갈라진다. 카드에는 이름과 함께 등급·단위 배지가 크게 붙는다.
   name  = 전표·주문에 찍히는 정식 이름
   base  = 카드에 크게 보이는 품목 이름 (등급·단위는 배지로 따로)
   grade = 등급 (특 / 상 / 없음)
   unitLabel = 단위 배지 (1박스 · 1kg · 15kg · 1단 · 1개)
   prevPrice = 전날 단가 (어제 확정가가 저장돼 있지 않을 때 ▲▼ 비교 기준) */
function defaultProducts() {
  return [
    { id:"v1",  name:"로즈(야채)",  base:"로즈(야채)", grade:"", unitLabel:"1개",   spec:"-",   unit:"ea",  cat:"veg",    ref:23000, prevPrice:23000, cost:17800, sub:"", emoji:"🥬", stock:12, soldOut:false },
    { id:"v2",  name:"백오이",      base:"백오이",     grade:"", unitLabel:"1개",   spec:"ea",  unit:"ea",  cat:"veg",    ref:1000,  prevPrice:1000,  cost:720,   sub:"", emoji:"🥒", stock:60, soldOut:false },
    { id:"v3",  name:"라디치오",    base:"라디치오",   grade:"", unitLabel:"1개",   spec:"-",   unit:"ea",  cat:"veg",    ref:3000,  prevPrice:3000,  cost:2100,  sub:"", emoji:"🥬", stock:20, soldOut:false },
    { id:"v4",  name:"피망",        base:"피망",       grade:"", unitLabel:"1박스", spec:"box", unit:"box", cat:"veg",    ref:6900,  prevPrice:8900,  cost:5200,  sub:"", emoji:"🫑", stock:9,  soldOut:false },
    { id:"v5",  name:"레몬",        base:"레몬",       grade:"", unitLabel:"1개",   spec:"ea",  unit:"ea",  cat:"fruit",  ref:500,   prevPrice:500,   cost:380,   sub:"", emoji:"🍋", stock:120, soldOut:false },
    { id:"v6",  name:"양파 15kg",   base:"양파",       grade:"", unitLabel:"15kg",  spec:"box", unit:"box", cat:"season", ref:18500, prevPrice:17000, cost:14800, sub:"", emoji:"🧅", stock:14, soldOut:false },
    { id:"v7",  name:"대파 1단",    base:"대파",       grade:"", unitLabel:"1단",   spec:"단",  unit:"단",  cat:"season", ref:2800,  prevPrice:2800,  cost:2100,  sub:"", emoji:"🌿", stock:35, soldOut:false },
    { id:"v8",  name:"깐마늘 1kg",  base:"깐마늘",     grade:"", unitLabel:"1kg",   spec:"kg",  unit:"kg",  cat:"season", ref:8900,  prevPrice:9500,  cost:7400,  sub:"", emoji:"🧄", stock:18, soldOut:false },
    { id:"v9",  name:"감자 20kg",   base:"감자",       grade:"", unitLabel:"20kg",  spec:"box", unit:"box", cat:"veg",    ref:24000, prevPrice:24000, cost:19500, sub:"", emoji:"🥔", stock:10, soldOut:false },
    { id:"v10", name:"청양고추 1kg", base:"청양고추",  grade:"", unitLabel:"1kg",   spec:"kg",  unit:"kg",  cat:"season", ref:9500,  prevPrice:9500,  cost:8000,  sub:"", emoji:"🌶️", stock:0, soldOut:true },
    { id:"v11", name:"애호박",      base:"애호박",     grade:"", unitLabel:"1개",   spec:"ea",  unit:"ea",  cat:"veg",    ref:700,   prevPrice:700,   cost:520,   sub:"", emoji:"🥒", stock:40, soldOut:false },
    { id:"v12", name:"무 1박스",    base:"무",         grade:"", unitLabel:"1박스", spec:"box", unit:"box", cat:"veg",    ref:11500, prevPrice:10500, cost:9000,  sub:"", emoji:"🥬", stock:6,  soldOut:false },
    /* 등급·단위 파생 품목 — 같은 청양고추라도 특/상/1kg은 값이 다르고 따로 담는다 */
    { id:"v13", name:"청양고추 (특) 1박스", base:"청양고추", grade:"특", unitLabel:"1박스", spec:"box", unit:"box", cat:"season", ref:32000, prevPrice:29000, cost:26500, sub:"", emoji:"🌶️", stock:7, soldOut:false },
    { id:"v14", name:"청양고추 (상) 1박스", base:"청양고추", grade:"상", unitLabel:"1박스", spec:"box", unit:"box", cat:"season", ref:27000, prevPrice:28500, cost:22800, sub:"", emoji:"🌶️", stock:5, soldOut:false },
    { id:"v15", name:"대파 (특) 1단",       base:"대파",     grade:"특", unitLabel:"1단",   spec:"단",  unit:"단",  cat:"season", ref:3500,  prevPrice:3200,  cost:2700,  sub:"", emoji:"🌿", stock:20, soldOut:false }
  ];
}
/** 단위 배지 글자 — 없으면 규격에서 만든다 (예: box → 1박스) */
var UNIT_LABEL = { ea:"1개", box:"1박스", kg:"1kg", "단":"1단" };
function unitLabelOf(p) {
  if (!p) return "";
  if (p.unitLabel) return p.unitLabel;
  if (p.spec && p.spec !== "-") return p.spec;
  return UNIT_LABEL[p.unit] || ("1" + (p.unit || "개"));
}

/* 손님용 분류 — 쉬운 말 3가지 + 전체 */
var CATS = [
  { key:"all",    label:"전체" },
  { key:"veg",    label:"야채" },
  { key:"season", label:"양념·파·마늘" },
  { key:"fruit",  label:"과일" }
];
var CAT_KEYS = CATS.map(function (c) { return c.key; });
/* v5 이전 분류(leaf·fruit·root·allium)를 품목별로 쉬운 분류로 옮긴다. */
var LEGACY_CAT = { leaf:"veg", root:"veg", fruit:"veg", allium:"season" };
var CAT_OF_ID = { v1:"veg", v2:"veg", v3:"veg", v4:"veg", v5:"fruit", v6:"season", v7:"season", v8:"season", v9:"veg", v10:"season", v11:"veg", v12:"veg", v13:"season", v14:"season", v15:"season" };
function easyCat(p) {
  if (CAT_KEYS.indexOf(p.cat) >= 0) return p.cat;
  return CAT_OF_ID[p.id] || LEGACY_CAT[p.cat] || "veg";
}

var STATUS = { PENDING:"PRICE_PENDING", READY:"READY", DISPATCHED:"DISPATCHED", DELIVERED:"DELIVERED", CANCELED:"CANCELED" };
var STATUS_LABEL = { PRICE_PENDING:"단가확정 대기", READY:"출고 준비", DISPATCHED:"배송중", DELIVERED:"배송완료", CANCELED:"취소" };
var STATUS_CLASS = { PRICE_PENDING:"pending", READY:"ready", DISPATCHED:"disp", DELIVERED:"done", CANCELED:"cancel" };

/* ── 3대 규칙 (사업자 전용 · 외상 하루치 · 10만 원 이상 즉시결제) ── */
var PAY = { CREDIT:"CREDIT", IMMEDIATE:"IMMEDIATE" };
var PAY_LABEL = { CREDIT:"외상(하루치)", IMMEDIATE:"즉시결제" };
var PAY_IMMEDIATE_FROM = 100000;   // 이 금액 이상이면 외상 잠김 · 즉시 결제만
var CLIENT = { APPROVED:"APPROVED", PENDING:"PENDING", REJECTED:"REJECTED" };
var CLIENT_LABEL = { APPROVED:"승인 완료", PENDING:"승인 대기(사장님 확인 중)", REJECTED:"가입 반려" };
var DEPOSIT = { CLAIMED:"CLAIMED", CONFIRMED:"CONFIRMED" };   // 입금확인 대기 / 입금확인 완료

/* ── 거래처 등급 (사장님만 본다 · 손님 화면에는 절대 안 보인다) ──────
   등급이 높을수록 외상(미수)을 오래 줄 수 있다 — 호텔·식장은 15일 결제.
   일반 1일 / 우수 7일 / VIP·호텔·식장 15일. 기한이 지난(연체) 미수가 있을 때만
   다음 발주가 막힌다. 10만 원 이상 즉시결제 규칙도 '일반' 등급에만 적용된다. */
var TIERS = [
  { key:"NORMAL", label:"일반",            days:1,  short:"일반 (1일)" },
  { key:"GOOD",   label:"우수",            days:7,  short:"우수 (7일)" },
  { key:"VIP",    label:"VIP·호텔·식장",   days:15, short:"VIP·호텔·식장 (15일)" }
];
function tierOf(cl) {
  var key = (cl && cl.tier) || TIERS[0].key;
  var hit = TIERS.filter(function (t) { return t.key === key; })[0];
  return hit || TIERS[0];
}
function tierKeys() { return TIERS.map(function (t) { return t.key; }); }
function creditDaysOf(cl) { return tierOf(cl).days; }
function tierShort(cl) { return tierOf(cl).short; }
/** 이 거래처가 이 금액을 외상으로 낼 수 있는가 — 일반 등급만 10만 원 이상 즉시결제 */
function creditAllowed(cl, total) {
  if (creditDaysOf(cl) > 1) return true;
  return Number(total) < PAY_IMMEDIATE_FROM;
}
function setClientTier(cid, key) {
  var cl = getClient(cid);
  if (!cl || tierKeys().indexOf(key) < 0) return null;
  cl.tier = key;
  saveState();
  return cl;
}

/* ── 반품·클레임 ──────────────────────────────────────
   손님이 배송중·배송완료 주문에서 문제 품목 + 사유 + 증빙 사진을 올려 접수하면
   사장님 화면 주문현황 맨 위에 뜬다. 승인하면 그 품목 금액만큼 주문 합계(→미수)가 줄어든다. */
var CLAIM = { OPEN:"OPEN", APPROVED:"APPROVED", REJECTED:"REJECTED" };
var CLAIM_BADGE = { OPEN:"클레임 접수됨(확인중)", APPROVED:"반품 승인 · 금액 차감", REJECTED:"반품 반려" };
var CLAIM_CLASS = { OPEN:"claim", APPROVED:"disp", REJECTED:"cancel" };
var CLAIM_REASONS = ["신선도/파손", "수량 부족", "오배송", "기타"];
var CLAIM_PHOTOS_MAX = 3;

var KEY = "hoonie_b2b_veg_v3";
var WEEK = ["일","월","화","수","목","금","토"];

/* ── 공용 저장소 (Supabase) ─────────────────────────────────
   이 기기 저장소(localStorage)는 빠른 캐시로 그대로 두고, 거래처 화면과
   사장님 화면이 서로 다른 기기·브라우저여도 같은 주문·단가를 보도록 공용 DB에 함께 저장한다.
   인터넷이 없거나 file:// 로 열면 예전처럼 이 기기 저장소만으로 동작한다.
   장바구니(KEY + "_cart")는 기기별 값이므로 공용으로 올리지 않는다. */
var SB_URL  = "https://hiulxicbowkffoxjtvye.supabase.co";
var SB_KEY  = "sb_publishable_89p69vS6pSVQBJfImjKMrw__mvxKVg3";
var SB_STATE = "b2b_state";        // app_state.key
var SB_POLL_MS = 5000;
var SYNC_AT_KEY = KEY + "_synced_at";
var sbSyncAt = 0;          // 마지막으로 주고받은 원격 저장 시각(ms)
var sbTimer = null, sbPushTimer = null, sbReady = false, sbPending = false, sbPushing = false;

try { sbSyncAt = Number(localStorage.getItem(SYNC_AT_KEY) || 0) || 0; } catch (e) {}

function sbOn() {
  return !!(window.fetch && window.JSON && /^https?:$/.test(location.protocol));
}
function sbHead(extra) {
  var h = { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": "application/json" };
  if (extra) for (var k in extra) h[k] = extra[k];
  return h;
}
function sbCall(path, opt) {
  opt = opt || {};
  opt.headers = sbHead(opt.headers);
  return fetch(SB_URL + "/rest/v1/" + path, opt).then(function (r) {
    if (!r.ok) throw new Error("supabase " + r.status);
    if (r.status === 204) return null;
    var ct = r.headers.get("content-type") || "";
    return ct.indexOf("json") > -1 ? r.json() : null;
  });
}

/* 올리기 — 저장할 때마다 바로 쏘지 않고 0.4초 모아서 보낸다 */
function sbPushNow() {
  if (!sbOn()) return;
  if (!sbReady) { sbPending = true; return; }
  var at = Date.now();
  sbSyncAt = at;
  try { localStorage.setItem(SYNC_AT_KEY, String(at)); } catch (e) {}
  sbPushing = true;
  sbCall("app_state", {
    method: "POST",
    headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ key: SB_STATE, value: { data: state, updatedAt: at }, updated_at: new Date(at).toISOString() }])
  }).catch(function () {}).then(function () { sbPushing = false; });
}
function sbPush() {
  if (!sbOn()) return;
  clearTimeout(sbPushTimer);
  sbPushTimer = setTimeout(sbPushNow, 400);
}

/* 받아오기 — 이 기기에서 방금 고친 값이 있으면 그 회차는 건너뛴다 */
function sbPull() {
  if (!sbOn() || document.hidden || sbPushing) return Promise.resolve();
  return sbCall("app_state?key=eq." + SB_STATE + "&select=value").then(function (rows) {
    var v = rows && rows[0] && rows[0].value;
    if (!v || !v.data) return;
    var at = Number(v.updatedAt || 0);
    if (at <= sbSyncAt) return;
    var cur = "";
    try { cur = JSON.stringify(state); } catch (e) { return; }
    if (cur !== lastRaw) return;              /* 입력 중·미저장 변경은 덮지 않는다 */
    var myCid = state && state.currentClientId;   /* '내 가게'는 기기마다 다르므로 지킨다 */
    try { localStorage.setItem(KEY, JSON.stringify(v.data)); } catch (e) { return; }
    sbSyncAt = at;
    try { localStorage.setItem(SYNC_AT_KEY, String(at)); } catch (e) {}
    state = loadState();
    if (myCid && state.clients.some(function (c) { return c.id === myCid; })) {
      state.currentClientId = myCid;
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }
    lastRaw = JSON.stringify(state);
    render();
  }).catch(function () {});
}

function sbSyncAll() {
  sbPull().then(function () {
    sbReady = true;
    if (sbPending) { sbPending = false; sbPushNow(); }
  });
}
function sbStart() {
  if (!sbOn()) return;
  sbSyncAll();
  clearInterval(sbTimer);
  sbTimer = setInterval(sbSyncAll, SB_POLL_MS);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) sbSyncAll(); });
  window.addEventListener("online", sbSyncAll);
}


/* ── 유틸 ───────────────────────────────────────────── */
var $ = function (sel, root) { return (root || document).querySelector(sel); };
var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
function won(n) { return Number(n || 0).toLocaleString("ko-KR"); }
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c];
  });
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function pad2(n) { return String(n).padStart(2, "0"); }
function pad3(n) { return String(n).padStart(3, "0"); }
function digits(s) { return String(s == null ? "" : s).replace(/[^0-9]/g, ""); }
function fmtBizNo(v) {
  var d = digits(v).slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 5) return d.slice(0, 3) + "-" + d.slice(3);
  return d.slice(0, 3) + "-" + d.slice(3, 5) + "-" + d.slice(5);
}
function fmtPhone(v) {
  var d = digits(v).slice(0, 11);
  if (d.length === 11) return d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
  if (d.length === 10) return d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6);
  if (d.length === 9) return d.slice(0, 2) + "-" + d.slice(2, 5) + "-" + d.slice(5);
  if (d.length === 8) return d.slice(0, 4) + "-" + d.slice(4);
  return d;
}

/** 지금(KST) — 브라우저 시간대와 무관하게 한국 벽시계 */
function kstNow() {
  var now = new Date();
  var shifted = new Date(now.getTime() + 9 * 3600 * 1000);
  return {
    ymd: shifted.toISOString().slice(0, 10),
    hm: pad2(shifted.getUTCHours()) + ":" + pad2(shifted.getUTCMinutes()),
    ms: ((shifted.getUTCHours() * 60 + shifted.getUTCMinutes()) * 60 + shifted.getUTCSeconds()) * 1000,
    dow: shifted.getUTCDay(),
    date: shifted
  };
}
function todayYmd() { return kstNow().ymd; }
function nowIso() { return new Date().toISOString(); }
function addDays(ymd, n) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || "");
  if (!m) return "";
  var d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + n));
  return d.toISOString().slice(0, 10);
}
function ymdDow(ymd) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || "");
  if (!m) return "";
  return WEEK[new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay()];
}
function fmtDot(ymd) {  // 2026.11.20
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || "");
  return m ? m[1] + "." + m[2] + "." + m[3] : (ymd || "");
}
function fmtDotDow(ymd) { // 2026.11.20(금)
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || "");
  return m ? m[1] + "." + m[2] + "." + m[3] + "(" + ymdDow(ymd) + ")" : (ymd || "");
}
function fmtShort(ymd) { // 11/20(금)
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || "");
  return m ? Number(m[2]) + "/" + Number(m[3]) + "(" + ymdDow(ymd) + ")" : (ymd || "");
}
function dayLabel(ymd) {
  var t = todayYmd();
  if (ymd === t) return "오늘";
  if (ymd === addDays(t, 1)) return "내일";
  if (ymd === addDays(t, 2)) return "모레";
  return fmtShort(ymd);
}
function clockMs(hm) {
  var m = /^(\d{1,2}):(\d{2})/.exec(hm || "");
  return m ? (Number(m[1]) * 60 + Number(m[2])) * 60000 : null;
}
function stampLabel(iso) {
  if (!iso) return "-";
  var d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  var s = new Date(d.getTime() + 9 * 3600 * 1000);
  return pad2(s.getUTCMonth() + 1) + "." + pad2(s.getUTCDate()) + " " + pad2(s.getUTCHours()) + ":" + pad2(s.getUTCMinutes());
}
function isoToYmd(iso) {
  if (!iso) return "";
  var d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

/* ── 기본 데이터 ────────────────────────────────────── */
function seedState() {
  var t = todayYmd(), tm = addDays(t, 1);
  var d10 = addDays(t, -10);                     /* 호텔 거래처의 10일 전 외상 발주 */
  var vipNo = "B2B-" + d10.slice(2, 4) + d10.slice(5, 7) + d10.slice(8, 10) + "-001";
  var s = {
    version: 8,
    store: clone(STORE_DEFAULT),
    policy: clone(DEFAULT_POLICY),
    rounds: clone(DEFAULT_ROUNDS),
    products: defaultProducts(),
    days: {},
    clients: [],
    orders: [],
    alerts: [],
    claims: [],
    seq: {},
    currentClientId: "c1"
  };

  /* 오늘 단가는 아침 7시 이후면 확정된 상태, 내일은 참고가(미확정) */
  var now = kstNow();
  var confirmedToday = now.ms >= 7 * 3600 * 1000;
  var prices = {};
  s.products.forEach(function (p) { prices[p.id] = p.ref; });
  s.days[t] = {
    confirmed: confirmedToday,
    confirmedAt: confirmedToday ? new Date(Date.parse(t + "T07:02:00+09:00")).toISOString() : null,
    prices: confirmedToday ? clone(prices) : null
  };
  s.days[tm] = { confirmed: false, confirmedAt: null, prices: null };
  /* 어제(전일) 확정 단가 — 손님 화면의 ▲/▼ 변동폭 비교 기준 */
  var y = addDays(t, -1), prevPrices = {};
  s.products.forEach(function (p) { prevPrices[p.id] = p.prevPrice != null ? p.prevPrice : p.ref; });
  s.days[y] = {
    confirmed: true,
    confirmedAt: new Date(Date.parse(y + "T07:05:00+09:00")).toISOString(),
    prices: prevPrices
  };
  s.confirmedToday = confirmedToday;

  s.clients = [
    {
      id:"c1", name:"쪼끼쪼끼[단관택지]", bizNo:"234-56-78901", owner:"김단관",
      addr:"강원특별자치도 원주시 단관길 21, 1층", uptae:"음식점업", jongmok:"한식 일반 음식점",
      phone:"010-2233-4455", manager:"김단관", prevBalance:388600, payments:[], memo:"단관택지 상가 · 1차 배달",
      status:CLIENT.APPROVED, bizFile:null, approvedAt:null, tier:"NORMAL"
    },
    {
      id:"c2", name:"정담식당", bizNo:"123-45-67890", owner:"박정담",
      addr:"강원특별자치도 원주시 반곡길 8, 1층", uptae:"음식점업", jongmok:"한식 일반 음식점",
      phone:"010-5566-7788", manager:"박정담", prevBalance:124000,
      payments:[{ id:"pay1", ymd:t, amount:100000, memo:"10월분 일부 입금", at:new Date(Date.parse(t + "T10:00:00+09:00")).toISOString() }],
      memo:"반곡동 · 2차 배달", status:CLIENT.APPROVED, bizFile:null, approvedAt:null, tier:"NORMAL"
    },
    {
      id:"c3", name:"진미분식", bizNo:"345-67-89012", owner:"이진미",
      addr:"강원특별자치도 원주시 진미길 5, 1층", uptae:"음식점업", jongmok:"분식",
      phone:"010-9911-2233", manager:"이진미", prevBalance:0, payments:[], memo:"3차 배달",
      status:CLIENT.APPROVED, bizFile:null, approvedAt:null, tier:"NORMAL"
    },
    {
      /* 사업자등록증을 올리고 승인을 기다리는 신규 신청 — 사장님 관리 > 거래처·미수에서 승인 1클릭 */
      id:"c4", name:"원주손칼국수", bizNo:"612-34-56789", owner:"장원주",
      addr:"강원특별자치도 원주시 무실로 45, 1층", uptae:"음식점업", jongmok:"칼국수·만두",
      phone:"010-7788-9900", manager:"장원주", prevBalance:0, payments:[], memo:"간편 가입 · 사장님 확인 대기",
      status:CLIENT.PENDING, bizFile:{ name:"사업자등록증_원주손칼국수.jpg", type:"image/jpeg", size:184320, dataUrl:null },
      signupAt:new Date(Date.parse(t + "T09:40:00+09:00")).toISOString(), approvedAt:null, tier:"NORMAL"
    },
    {
      /* 호텔·식장은 15일 결제 — 사장님이 거래처·미수 탭에서 등급을 VIP로 두고 운용한다.
         손님 화면에는 등급이 보이지 않고, 15일이 지난 미수가 있을 때만 발주가 막힌다. */
      id:"c5", name:"원주그랜드호텔 연회팀", bizNo:"220-81-12345", owner:"최호텔",
      addr:"강원특별자치도 원주시 기업도시로 200, 호텔 1층 연회장", uptae:"숙박업", jongmok:"호텔·연회장 식음",
      phone:"010-4455-6677", manager:"최호텔", prevBalance:0, payments:[],
      memo:"연회장 주방 · 15일 결제",
      status:CLIENT.APPROVED, bizFile:null, approvedAt:null, tier:"VIP"
    }
  ];

  s.orders = [
    {
      no:"B2B-" + t.slice(2, 4) + t.slice(5, 7) + t.slice(8, 10) + "-001",
      ymd:t, round:"R1", clientId:"c1",
      items:[
        { pid:"v1", name:"로즈(야채)", spec:"-",   qty:1,  price:23000, amount:23000 },
        { pid:"v2", name:"백오이",     spec:"ea",  qty:5,  price:1000,  amount:5000 },
        { pid:"v3", name:"라디치오",   spec:"-",   qty:5,  price:3000,  amount:15000 },
        { pid:"v4", name:"피망",       spec:"box", qty:1,  price:6900,  amount:6900 },
        { pid:"v5", name:"레몬",       spec:"-",   qty:20, price:500,   amount:10000 }
      ],
      itemsAmount:59900, shipFee:0, total:59900,
      status:confirmedToday ? "DELIVERED" : "PRICE_PENDING",
      priceConfirmed:confirmedToday, priceMode:confirmedToday ? "fixed" : "ref",
      createdAt:new Date(Date.parse(t + "T06:40:00+09:00")).toISOString(),
      confirmedAt:confirmedToday ? new Date(Date.parse(t + "T07:02:00+09:00")).toISOString() : null,
      memo:"로즈는 잎 큰 것으로 부탁드립니다", stmtNo:confirmedToday ? "9-1/1" : null, history:[],
      payMode:PAY.CREDIT, deposit:"CREDIT", depositAt:null
    },
    {
      no:"B2B-" + tm.slice(2, 4) + tm.slice(5, 7) + tm.slice(8, 10) + "-001",
      ymd:tm, round:"R1", clientId:"c2",
      items:[
        { pid:"v6", name:"양파 15kg",  spec:"box", qty:2, price:18500, amount:37000 },
        { pid:"v7", name:"대파 1단",   spec:"단",  qty:4, price:2800,  amount:11200 },
        { pid:"v8", name:"깐마늘 1kg", spec:"kg",  qty:1, price:8900,  amount:8900 }
      ],
      itemsAmount:57100, shipFee:0, total:57100,
      status:"PRICE_PENDING", priceConfirmed:false, priceMode:"ref",
      createdAt:new Date(Date.parse(t + "T09:12:00+09:00")).toISOString(),
      confirmedAt:null, memo:"대파는 굵은 것으로", stmtNo:null, history:[],
      payMode:PAY.CREDIT, deposit:"CREDIT", depositAt:null
    },
    {
      no:"B2B-" + t.slice(2, 4) + t.slice(5, 7) + t.slice(8, 10) + "-002",
      ymd:t, round:"R2", clientId:"c3",
      items:[
        { pid:"v11", name:"애호박",   spec:"ea",  qty:10, price:700,   amount:7000 },
        { pid:"v2",  name:"백오이",   spec:"ea",  qty:20, price:1000,  amount:20000 },
        { pid:"v12", name:"무 1박스", spec:"box", qty:2,  price:11500, amount:23000 }
      ],
      itemsAmount:50000, shipFee:0, total:50000,
      payMode:PAY.IMMEDIATE, deposit:DEPOSIT.CONFIRMED, depositAt:new Date(Date.parse(t + "T07:20:00+09:00")).toISOString(),
      status:confirmedToday ? "DELIVERED" : "PRICE_PENDING",
      priceConfirmed:confirmedToday, priceMode:confirmedToday ? "fixed" : "ref",
      createdAt:new Date(Date.parse(t + "T06:55:00+09:00")).toISOString(),
      confirmedAt:confirmedToday ? new Date(Date.parse(t + "T07:02:00+09:00")).toISOString() : null,
      memo:"", stmtNo:confirmedToday ? "10-1/1" : null, history:[]
    },
    {
      /* 호텔 연회팀 — 10일 전 166,000원 외상 발주. 15일 기한 안이라 발주가 열려 있다. */
      no:vipNo, ymd:d10, round:"R1", clientId:"c5",
      items:[
        { pid:"v1",  name:"로즈(야채)", spec:"-",   qty:2, price:23000, amount:46000 },
        { pid:"v13", name:"청양고추 (특) 1박스", spec:"box", qty:3, price:32000, amount:96000 },
        { pid:"v9",  name:"감자 20kg",   spec:"box", qty:1, price:24000, amount:24000 }
      ],
      itemsAmount:166000, shipFee:0, total:166000, claimTotal:0,
      status:"DELIVERED", priceConfirmed:true, priceMode:"fixed",
      createdAt:new Date(Date.parse(d10 + "T06:30:00+09:00")).toISOString(),
      confirmedAt:new Date(Date.parse(d10 + "T07:02:00+09:00")).toISOString(),
      memo:"연회 200명 · 오전 8시 전 납품", stmtNo:"8-1/1", history:[],
      payMode:PAY.CREDIT, deposit:"CREDIT", depositAt:null
    }
  ];
  /* 접수된 반품·클레임 — 사장님 주문현황 맨 위에 뜨고, 승인하면 감자 24,000원이 차감된다. */
  s.claims = [
    {
      id:"cl1", orderNo:vipNo, clientId:"c5",
      items:[{ pid:"v9", name:"감자 20kg", qty:1, price:24000, amount:24000 }],
      reason:"신선도/파손", memo:"감자 20kg 박스 윗부분이 무르고 싹이 났습니다. 연회 11/19 사용분입니다.",
      photos:[], amount:24000, status:CLAIM.OPEN,
      createdAt:new Date(Date.parse(d10 + "T09:20:00+09:00")).toISOString(), decidedAt:null
    }
  ];
  s.seq["stmt-" + t] = confirmedToday ? 10 : 0;
  s.alerts = [
    {
      id:"a1", clientId:"c1", clientName:"쪼끼쪼끼[단관택지]", phone:"010-2233-4455",
      itemIds:["v4"], itemNames:["피망"], createdAt:new Date(Date.parse(t + "T08:20:00+09:00")).toISOString(),
      status:"WAIT", memo:"피망 박스 입고되면 연락 주세요"
    }
  ];
  return s;
}

/* ── 저장 ───────────────────────────────────────────── */
function normalize(s) {
  s = s || {};
  var out = clone(seedState());
  if (s.store) out.store = Object.assign({}, STORE_DEFAULT, s.store);
  if (s.policy) out.policy = Object.assign({}, DEFAULT_POLICY, s.policy);
  if (Number(s.version || 0) < 4) {
    /* v3까지는 3만 원 이상 무료·미만 3,000원이었다. v4에서 최소 주문 5만 원 · 원주 시내 무료배송으로 바뀜. */
    out.policy = clone(DEFAULT_POLICY);
  }
  out.policy.minOrder = Math.max(0, Number(out.policy.minOrder) || 0);
  out.policy.shipFee = Math.max(0, Number(out.policy.shipFee) || 0);
  /* 입금 계좌가 비어 있으면 매장 기본 계좌를 채운다. */
  if (!digits(out.store.account)) {
    out.store.bank = STORE_DEFAULT.bank;
    out.store.account = STORE_DEFAULT.account;
    out.store.holder = STORE_DEFAULT.holder;
  }
  if (Array.isArray(s.rounds) && s.rounds.length) out.rounds = s.rounds.map(function (r) {
    var def = DEFAULT_ROUNDS.filter(function (d) { return d.key === r.key; })[0] || DEFAULT_ROUNDS[0];
    return { key:r.key || def.key, label:r.label || def.label, dispatch:r.dispatch || def.dispatch, cutoff:r.cutoff || def.cutoff, note:r.note || def.note };
  });
  if (Array.isArray(s.products) && s.products.length) out.products = s.products.map(function (p) {
    return {
      id:p.id, name:String(p.name || "품목"), base:String(p.base || p.name || "품목"),
      grade:String(p.grade || ""), unitLabel:String(p.unitLabel || ""),
      spec:String(p.spec || "-"), unit:String(p.unit || "ea"),
      cat:easyCat(p), ref:Math.max(0, Number(p.ref) || 0),
      prevPrice:(p.prevPrice != null ? Math.max(0, Number(p.prevPrice) || 0) : null),
      /* 매입가(원가) — 사장님만 보는 값. 아침 단가 확정 탭에서 넣으면 마진이 계산된다. */
      cost:Math.max(0, Number(p.cost) || 0),
      /* 품절일 때 손님 화면에 추천할 대체 품목 id (비우면 같은 품목·분류에서 자동) */
      sub:String(p.sub || ""),
      emoji:p.emoji || "🥬",
      stock:Math.max(0, Number(p.stock) || 0), soldOut:Boolean(p.soldOut)
    };
  });
  /* v7 — 등급·단위 파생 품목(청양 특/상/1kg 등) 15종으로 품목표를 새로 깐다.
     예전 저장값(12종)을 그대로 쓰면 새 품목이 손님 화면에 안 보인다. */
  if (Number(s.version || 0) < 7) out.products = defaultProducts();
  out.days = (s.days && typeof s.days === "object") ? s.days : {};
  out.clients = Array.isArray(s.clients) && s.clients.length ? s.clients.map(function (c) {
    return {
      id:c.id, name:String(c.name || "거래처"), bizNo:c.bizNo || "", owner:c.owner || "",
      addr:c.addr || "", uptae:c.uptae || "", jongmok:c.jongmok || "",
      phone:c.phone || "", manager:c.manager || "", prevBalance:Number(c.prevBalance) || 0,
      payments:Array.isArray(c.payments) ? c.payments : [], memo:c.memo || "",
      /* 가입 상태 — 저장값이 없던 거래처는 승인 완료로 본다. */
      status:(c.status === CLIENT.PENDING || c.status === CLIENT.REJECTED) ? c.status : CLIENT.APPROVED,
      bizFile:c.bizFile && c.bizFile.name ? c.bizFile : null,
      signupAt:c.signupAt || null, approvedAt:c.approvedAt || null,
      /* 등급 — 예전 저장값에는 없으므로 일반(1일)으로 본다. 손님 화면에는 안 나간다. */
      tier:tierKeys().indexOf(c.tier) >= 0 ? c.tier : TIERS[0].key,
      /* 손님이 직접 고정한 즐겨찾기(★) · 사장님이 정한 거래처별 특별 단가 */
      favs:Array.isArray(c.favs) ? c.favs.map(String) : [],
      prices:(c.prices && typeof c.prices === "object") ? c.prices : {}
    };
  }) : out.clients;
  out.orders = Array.isArray(s.orders) ? s.orders.map(function (o) {
    if (!o) return o;
    var mode = o.payMode === PAY.IMMEDIATE ? PAY.IMMEDIATE : PAY.CREDIT;
    o.payMode = mode;
    o.deposit = mode === PAY.IMMEDIATE ? (o.deposit === DEPOSIT.CONFIRMED ? DEPOSIT.CONFIRMED : DEPOSIT.CLAIMED) : "CREDIT";
    o.claimTotal = Math.max(0, Number(o.claimTotal) || 0);
    /* v9 — 같은 회차 기존 주문과 합배송 / 배송 완료 시 남긴 납품 위치 메모 */
    o.combineWith = o.combineWith ? String(o.combineWith) : null;
    o.combined = Math.max(0, Number(o.combined) || 0);
    o.deliverMemo = String(o.deliverMemo || "");
    o.deliveredAt = o.deliveredAt || null;
    return o;
  }) : [];
  if (Number(s.version || 0) < 4) {
    /* 옛 주문에 붙어 있던 배송비를 무료배송 기준으로 정리 */
    out.orders.forEach(function (o) {
      if (!o || o.status === STATUS.CANCELED) return;
      o.shipFee = 0;
      o.total = Number(o.itemsAmount) || 0;
    });
  }
  out.version = 8;
  out.alerts = Array.isArray(s.alerts) ? s.alerts : [];
  /* 반품·클레임 — 저장값이 없는 예전 데이터에는 빈 목록 */
  out.claims = Array.isArray(s.claims) ? s.claims.filter(function (c) {
    return c && c.orderNo;
  }).map(function (c) {
    return {
      id:String(c.id || ("cl" + Math.random().toString(36).slice(2, 8))),
      orderNo:String(c.orderNo), clientId:c.clientId || "",
      items:Array.isArray(c.items) ? c.items : [],
      reason:CLAIM_REASONS.indexOf(c.reason) >= 0 ? c.reason : (c.reason || "기타"),
      memo:String(c.memo || ""),
      photos:Array.isArray(c.photos) ? c.photos.filter(function (p) { return p && p.dataUrl; }) : [],
      amount:Math.max(0, Number(c.amount) || 0),
      status:(c.status === CLAIM.APPROVED || c.status === CLAIM.REJECTED) ? c.status : CLAIM.OPEN,
      createdAt:c.createdAt || null, decidedAt:c.decidedAt || null
    };
  }) : [];
  out.seq = (s.seq && typeof s.seq === "object") ? s.seq : {};
  out.currentClientId = s.currentClientId && out.clients.some(function (c) { return c.id === s.currentClientId; })
    ? s.currentClientId : out.clients[0].id;
  return out;
}
function loadState() {
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) {}
  return normalize(seedState());
}
function saveState() {
  try {
    var raw = JSON.stringify(state);
    localStorage.setItem(KEY, raw);
    lastRaw = raw;            /* 내가 쓴 값 — 다른 창의 변경만 골라내려고 */
  } catch (e) {}
  sbPush();                 /* 공용 DB에도 올려 다른 기기의 화면에 바로 보이게 */
}
function loadCart() {
  try {
    var raw = localStorage.getItem(KEY + "_cart");
    if (raw) {
      var c = JSON.parse(raw) || {};
      var out = {};
      Object.keys(c).forEach(function (k) { if (Number(c[k]) > 0) out[k] = Number(c[k]); });
      return out;
    }
  } catch (e) {}
  return {};
}
function saveCart() { try { localStorage.setItem(KEY + "_cart", JSON.stringify(cart)); } catch (e) {} }

var state = loadState();
var cart = loadCart();
var lastRaw = "";   /* 마지막으로 읽거나 쓴 저장값 — 손님/사장님 창 실시간 동기화용 */
var ui = {
  route: "b2b",
  admTab: "orders",
  admDate: null,
  priceDate: null,
  priceDraft: {},
  listDate: null,
  slot: null,
  cat: "all",
  prodQuery: "",
  co: null,
  orderFilter: "ALL",
  clientQuery: "",
  modal: null,
  drawer: null,
  signupFile: null,
  prodForm: null,     /* 새 품목 추가 폼에 치고 있는 값 */
  bulkText: "",       /* 영수증 일괄 입력 칸 */
  bulkFile: null,     /* 영수증 사진 (미리보기용) */
  bulkResult: null,   /* 마지막 일괄 적용 결과 */
  claim: null,        /* 반품·클레임 접수 초안 (품목·사유·사진·메모) */
  pick: null,         /* 상차 피킹표 (날짜 + 회차) */
  month: null         /* 월말 정산에서 보고 있는 달 (YYYY-MM) */
};

/* ── 사업자·정책 접근 ───────────────────────────────── */
function storeLine() {
  var s = state.store;
  return {
    name: s.name, owner: s.owner, bizNo: s.bizNo, addr: s.addr,
    uptae: s.uptae, jongmok: s.jongmok, phone: s.phone,
    taxType: s.taxType, bank: s.bank, account: s.account, holder: s.holder
  };
}
function accountText() {
  var s = state.store;
  if (!digits(s.account)) return {
    ok:false,
    text: IS_ADMIN ? "입금 계좌번호 입력 필요 (설정에서 등록)"
                   : "입금 계좌는 가게(" + (s.phone || "033-765-1531") + ")로 문의해 주세요"
  };
  return { ok:true, text:(s.bank ? s.bank + " " : "") + s.account + (s.holder ? " (예금주: " + s.holder + ")" : "") };
}

/* ── 날짜별 단가 ────────────────────────────────────── */
function dayInfo(ymd) { return state.days[ymd] || null; }
function isDayConfirmed(ymd) {
  var d = dayInfo(ymd);
  return !!(d && d.confirmed);
}
function priceOf(p, ymd) {
  var d = dayInfo(ymd);
  if (d && d.confirmed && d.prices && d.prices[p.id] != null) return Number(d.prices[p.id]);
  return Number(p.ref) || 0;
}
function priceSource(ymd) { return isDayConfirmed(ymd) ? "fixed" : "ref"; }
/** 전일(어제) 단가 — 어제 확정가가 저장돼 있으면 그것, 없으면 품목의 prevPrice */
function priceBefore(p, ymd) {
  if (!p) return null;
  var d = dayInfo(addDays(ymd, -1));
  if (d && d.confirmed && d.prices && d.prices[p.id] != null) return Number(d.prices[p.id]);
  if (p.prevPrice != null) return Number(p.prevPrice);
  return null;
}
/** 전일 대비 변동 — { prev, now, delta }. 비교 기준이 없으면 null */
function priceDelta(p, ymd) {
  var prev = priceBefore(p, ymd);
  if (prev == null) return null;
  var now = priceOf(p, ymd);
  return { prev:prev, now:now, delta:now - prev };
}
function findProduct(id) { return state.products.filter(function (p) { return p.id === id; })[0] || null; }

/* ── 배달 회차 · 슬롯 ───────────────────────────────── */
function roundByKey(key) { return state.rounds.filter(function (r) { return r.key === key; })[0] || state.rounds[0]; }
function slotPhase(ymd, r) {
  var t = todayYmd();
  if (ymd < t) return "PAST";
  if (ymd > t) return "OPEN";
  var now = kstNow();
  return now.ms < clockMs(r.cutoff) ? "OPEN" : "CLOSED";
}
function slotList() {
  var out = [], t = todayYmd();
  for (var i = 0; i < 3; i++) {
    var ymd = addDays(t, i);
    state.rounds.forEach(function (r) {
      out.push({ ymd:ymd, round:r, phase:slotPhase(ymd, r), confirmed:isDayConfirmed(ymd) });
    });
  }
  return out;
}
function openSlots() { return slotList().filter(function (s) { return s.phase === "OPEN"; }); }
function defaultSlot() {
  var open = openSlots();
  return open.length ? open[0] : { ymd:addDays(todayYmd(), 1), round:state.rounds[0], phase:"OPEN", confirmed:isDayConfirmed(addDays(todayYmd(), 1)) };
}
/* 지금 화면에서 고른 배달(날짜+회차). 마감됐으면 열린 첫 회차로 대체. */
function currentSlot() {
  var s = ui && ui.slot;
  if (s && s.ymd && s.round) {
    var f = findSlot(s.ymd, s.round);
    if (f && f.phase === "OPEN") return { ymd: s.ymd, round: s.round };
    var o = openRoundsFor(s.ymd);
    if (o.length) return { ymd: s.ymd, round: o[0].key };
  }
  var d = defaultSlot();
  return { ymd: d.ymd, round: d.round.key };
}
/* 그 날짜에 아직 열린 회차 */
function openRoundsFor(ymd) {
  return state.rounds.filter(function (r) { return slotPhase(ymd, r) === "OPEN"; });
}
function findSlot(ymd, key) {
  var l = slotList().filter(function (s) { return s.ymd === ymd && s.round.key === key; });
  return l[0] || null;
}
function slotText(ymd, key) {
  var r = roundByKey(key);
  return dayLabel(ymd) + " " + r.label + " " + r.dispatch;
}

/* ── 장바구니 · 금액 ────────────────────────────────── */
function cartLines(ymd) {
  var out = [], cid = state.currentClientId;
  state.products.forEach(function (p) {
    var qty = Number(cart[p.id]) || 0;
    if (qty <= 0) return;
    var price = priceForClient(p, ymd, cid);
    out.push({ pid:p.id, p:p, name:p.name, spec:p.spec, unit:p.unit, qty:qty, price:price, amount:price * qty });
  });
  return out;
}
function cartCount() {
  return Object.keys(cart).reduce(function (s, k) { return s + (Number(cart[k]) || 0); }, 0);
}
function calcAmounts(lines, policy) {
  policy = policy || state.policy;
  var items = 0, qty = 0;
  lines.forEach(function (l) { items += l.amount; qty += l.qty; });
  var minOrder = Math.max(0, Number(policy.minOrder) || 0);
  var shipFee = items > 0 ? Math.max(0, Number(policy.shipFee) || 0) : 0;
  return {
    itemsAmount:items, qty:qty, kinds:lines.length, shipFee:shipFee, total:items + shipFee,
    minOrder:minOrder, shortfall:Math.max(0, minOrder - items), meetsMin:items > 0 && items >= minOrder
  };
}
function feeFor(itemsAmount) {
  if (itemsAmount <= 0) return 0;
  return Math.max(0, Number(state.policy.shipFee) || 0);
}

/* ── 주문 ───────────────────────────────────────────── */
function nextOrderNo(ymd) {
  var base = "B2B-" + ymd.slice(2, 4) + ymd.slice(5, 7) + ymd.slice(8, 10);
  var max = 0;
  state.orders.forEach(function (o) {
    if (o.no.indexOf(base + "-") === 0) {
      var n = parseInt(o.no.slice(base.length + 1), 10);
      if (n > max) max = n;
    }
  });
  max = Math.max(max, Number(state.seq[base]) || 0);
  state.seq[base] = max + 1;
  return base + "-" + pad3(max + 1);
}
function nextStmtNo(ymd) {
  var key = "stmt-" + ymd;
  var n = (Number(state.seq[key]) || 0) + 1;
  state.seq[key] = n;
  return n + "-1/1";
}
function findOrder(no) { return state.orders.filter(function (o) { return o.no === no; })[0] || null; }
function getClient(id) { return state.clients.filter(function (c) { return c.id === id; })[0] || state.clients[0]; }
function currentClient() { return getClient(state.currentClientId); }

/* ── 손님 로그인 (내 가게 1곳만) ───────────────────────
   손님 화면에는 거래처 목록이 없다. 로그인하면 내 가게만 메모리에 올라간다.
   로그아웃 상태는 탭을 닫으면 풀린다(sessionStorage) — 새로 열면 시연용 계정으로 돌아온다. */
function isLoggedIn() {
  if (IS_ADMIN || !currentClient()) return false;
  try { return sessionStorage.getItem(KEY + "_out") !== "1"; } catch (e) { return true; }
}
function loginClient(c) {
  state.currentClientId = c.id;
  saveState();
  try { sessionStorage.removeItem(KEY + "_out"); } catch (e) {}
}
function logoutClient() {
  try { sessionStorage.setItem(KEY + "_out", "1"); } catch (e) {}
  cart = {};
  saveCart();
}
function ordersOf(cid) { return state.orders.filter(function (o) { return o.clientId === cid; }); }
/** 그 거래처가 마지막으로 넣은 발주 (취소 제외 · 날짜→주문번호 순) */
function latestOrderOf(cid) {
  var list = state.orders.filter(function (o) {
    return o.clientId === cid && o.status !== STATUS.CANCELED;
  }).sort(function (a, b) {
    if (a.ymd !== b.ymd) return a.ymd < b.ymd ? 1 : -1;
    return a.no < b.no ? 1 : -1;
  });
  return list[0] || null;
}
/** '어제 주문 그대로 담기' — 직전 발주의 품목·수량을 장바구니에 한 번에 채운다.
    품절·재고 부족 품목은 건너뛰고 무엇이 빠졌는지 돌려준다. */
function applyReorder() {
  var cl = currentClient();
  var last = cl ? latestOrderOf(cl.id) : null;
  if (!last) return { ok:false, code:"NONE", msg:"지난 발주가 없습니다. 단가표에서 품목을 담아 첫 발주를 넣어 보세요." };
  var kinds = 0, qty = 0, skipped = [], capped = [], before = cartCount();
  last.items.forEach(function (it) {
    var p = findProduct(it.pid);
    if (!p) { skipped.push(it.name || it.pid); return; }
    if (p.soldOut || p.stock <= 0) { skipped.push(p.name); return; }
    var want = Math.max(1, Number(it.qty) || 1);
    var q = Math.min(want, p.stock);
    if (q < want) capped.push(p.name);
    cart[p.id] = q;
    kinds++;
    qty += q;
  });
  saveCart();
  return { ok:true, order:last, kinds:kinds, qty:qty, skipped:skipped, capped:capped, hadCart:before > 0 };
}

function placeOrder(opts) {
  var slot = findSlot(opts.ymd, opts.round);
  if (!slot || slot.phase !== "OPEN") return { ok:false, msg:"이미 마감된 회차입니다. 다른 회차를 골라 주세요." };
  var lines = cartLines(opts.ymd);
  if (!lines.length) return { ok:false, msg:"담은 품목이 없습니다." };
  var am = calcAmounts(lines);
  /* 같은 날 같은 회차에 이미 접수된 주문이 있으면 최소 주문 없이 합배송으로 접수 */
  var combineBase = combineOrderFor(opts.clientId, opts.ymd, opts.round);
  if (!am.meetsMin && !combineBase) return { ok:false, msg:"최소 주문 금액은 " + won(am.minOrder) + "원입니다. " + won(am.shortfall) + "원 더 담아 주세요." };

  /* 규칙 1·2 — 사업자 승인 + 미수 잔액 0원이어야 발주 가능 */
  var cl = getClient(opts.clientId);
  var gate = clientGate(cl.id);
  if (gate.blocked) return { ok:false, code:gate.code, msg:gate.msg };

  /* 규칙 3 — 10만 원 이상은 외상 불가 · 즉시결제(입금 확인 체크)만 (일반 등급한) */
  var forced = !creditAllowed(cl, am.total);
  var payMode = forced ? PAY.IMMEDIATE : (opts.payMode === PAY.IMMEDIATE ? PAY.IMMEDIATE : PAY.CREDIT);
  if (forced && opts.payMode === PAY.CREDIT) {
    return { ok:false, code:"PAY", msg:"10만 원 이상 주문은 외상이 불가합니다. 즉시 결제(계좌이체)로 진행해 주세요." };
  }
  if (payMode === PAY.IMMEDIATE && !opts.depositClaimed) {
    return { ok:false, code:"DEPOSIT", msg:"입금 완료(결제 확인 요청)에 체크해야 접수됩니다." };
  }

  var confirmed = isDayConfirmed(opts.ymd);
  var order = {
    no: nextOrderNo(opts.ymd),
    ymd: opts.ymd, round: opts.round, clientId: cl.id,
    items: lines.map(function (l) {
      return { pid:l.pid, name:l.name, spec:l.spec, qty:l.qty, price:l.price, amount:l.amount };
    }),
    itemsOut: lines.reduce(function (s, l) { return s + l.qty; }, 0),
    itemsAmount: am.itemsAmount, shipFee: am.shipFee, total: am.total, claimTotal: 0,
    payMode: payMode,
    deposit: payMode === PAY.IMMEDIATE ? DEPOSIT.CLAIMED : "CREDIT",
    depositAt: null,
    status: confirmed ? STATUS.READY : STATUS.PENDING,
    priceConfirmed: confirmed, priceMode: confirmed ? "fixed" : "ref",
    createdAt: nowIso(), confirmedAt: confirmed ? nowIso() : null,
    memo: opts.memo || "", stmtNo: confirmed ? nextStmtNo(opts.ymd) : null, history: [],
    combineWith: combineBase ? combineBase.no : null, combined: 0, deliverMemo: "", deliveredAt: null
  };
  state.orders.push(order);
  if (combineBase) combineBase.combined = (Number(combineBase.combined) || 0) + 1;
  /* 재고 차감 */
  lines.forEach(function (l) {
    var p = findProduct(l.pid);
    if (!p) return;
    p.stock = Math.max(0, p.stock - l.qty);
    if (p.stock <= 0) p.soldOut = true;
  });
  cart = {};
  saveCart();
  saveState();
  return { ok:true, order:order };
}

function cancelOrder(no) {
  var o = findOrder(no);
  if (!o) return false;
  if (o.status === STATUS.DISPATCHED || o.status === STATUS.DELIVERED) return false;
  o.status = STATUS.CANCELED;
  o.canceledAt = nowIso();
  o.items.forEach(function (it) {
    var p = findProduct(it.pid);
    if (!p) return;
    p.stock = p.stock + it.qty;
    if (p.stock > 0) p.soldOut = false;
  });
  saveState();
  return true;
}

function advanceOrder(no) {
  var o = findOrder(no);
  if (!o) return false;
  if (o.status === STATUS.PENDING) { toast("아침 단가 확정 후에 출고 준비로 넘길 수 있습니다."); return false; }
  if (o.status === STATUS.READY) o.status = STATUS.DISPATCHED;
  else if (o.status === STATUS.DISPATCHED) o.status = STATUS.DELIVERED;
  else return false;
  saveState();
  return true;
}

/** 아침 7시 단가 일괄 확정 — 미확정 주문 금액을 새 단가로 다시 계산한다. */
function confirmDayPrices(ymd, prices) {
  var before = { orders: state.orders.filter(function (o) { return o.ymd === ymd && !o.priceConfirmed && o.status !== STATUS.CANCELED; }).length };
  state.days[ymd] = { confirmed:true, confirmedAt:nowIso(), prices:clone(prices) };
  var changed = [];
  state.orders.forEach(function (o) {
    if (o.ymd !== ymd || o.priceConfirmed || o.status === STATUS.CANCELED) return;
    var prevTotal = o.total;
    o.items.forEach(function (it) {
      var p = findProduct(it.pid);
      if (!p) return;
      /* 거래처 특별 단가가 있으면 그 값으로 정산한다 (기본 단가 확정은 건너뜀) */
      var sp = specialPriceOf(o.clientId, p.id);
      it.price = sp > 0 ? sp : (Number(prices[p.id] != null ? prices[p.id] : p.ref) || 0);
      it.amount = it.price * it.qty;
    });
    o.itemsAmount = o.items.reduce(function (s, it) { return s + it.amount; }, 0);
    o.shipFee = feeFor(o.itemsAmount);
    o.total = Math.max(0, o.itemsAmount + o.shipFee - (Number(o.claimTotal) || 0));
    o.priceConfirmed = true;
    o.priceMode = "fixed";
    o.confirmedAt = nowIso();
    o.status = STATUS.READY;
    if (!o.stmtNo) o.stmtNo = nextStmtNo(ymd);
    o.history = o.history || [];
    o.history.push({ at:nowIso(), text:"아침 7시 단가 확정 (" + won(prevTotal) + "원 → " + won(o.total) + "원)" });
    changed.push({ no:o.no, before:prevTotal, after:o.total });
  });
  saveState();
  return { count:before.orders, changed:changed };
}

/* ── 미수 · 잔액 원장 ───────────────────────────────── */
/* 즉시결제(IMMEDIATE) 주문은 출고와 동시에 입금 처리되어 잔액에 잡히지 않는다.
   외상(CREDIT) 주문만 잔액을 키우고, 입금 기록으로 줄어든다. */
function isImmediate(o) { return !!o && o.payMode === PAY.IMMEDIATE; }
function buildLedger(cid) {
  var cl = getClient(cid);
  var byDay = {};
  state.orders.filter(function (o) { return o.clientId === cid && o.status !== STATUS.CANCELED; })
    .forEach(function (o) { (byDay[o.ymd] = byDay[o.ymd] || []).push(o); });
  (cl.payments || []).forEach(function (p) { byDay[p.ymd] = byDay[p.ymd] || []; });
  var bal = Number(cl.prevBalance) || 0, totalOut = 0, totalPaid = 0, stmts = {};
  Object.keys(byDay).sort().forEach(function (d) {
    var list = byDay[d].slice().sort(function (a, b) { return a.no < b.no ? -1 : 1; });
    var manual = (cl.payments || []).filter(function (p) { return p.ymd === d; })
      .reduce(function (s, p) { return s + (Number(p.amount) || 0); }, 0);
    var first = true;
    list.forEach(function (o) {
      var prior = bal;
      var out = Number(o.total) || 0;
      var p = first ? manual : 0;
      if (isImmediate(o)) p += out;   // 즉시결제 = 같은 날 입금 처리
      var after = prior + out - p;
      stmts[o.no] = { prev:prior, out:out, pay:p, bal:after, immediate:isImmediate(o) };
      bal = after; totalOut += out; totalPaid += p;
      first = false;
    });
    if (first) { bal -= manual; totalPaid += manual; }
  });
  return { stmts:stmts, balance:bal, totalOut:totalOut, totalPaid:totalPaid, base:Number(cl.prevBalance) || 0 };
}
function clientSummary(cid) {
  var cl = getClient(cid), L = buildLedger(cid);
  var pending = state.orders.filter(function (o) { return o.clientId === cid && o.status === STATUS.PENDING; });
  return {
    client:cl,
    base:L.base,
    totalOut:L.totalOut,
    totalPaid:L.totalPaid,
    balance:L.balance,
    pendingCount:pending.length,
    pendingAmount:pending.reduce(function (s, o) { return s + o.total; }, 0),
    immediatePending:immediatePendingOf(cid),
    gate:clientGate(cid),
    tier:tierOf(cl),
    aging:creditAging(cid),
    nextDue:nextDueYmd(cid),
    orders:ordersOf(cid).length,
    ledger:L
  };
}
function addPayment(cid, ymd, amount, memo) {
  var cl = getClient(cid);
  cl.payments = cl.payments || [];
  cl.payments.push({ id:"p" + Date.now().toString(36), ymd:ymd, amount:Number(amount) || 0, memo:memo || "", at:nowIso() });
  saveState();
}
/** 전액 입금 — 미수 잔액을 한 번에 0원으로 정리해 다음 발주를 연다. */
function addFullPayment(cid) {
  var bal = buildLedger(cid).balance;
  if (!(bal > 0)) return 0;
  addPayment(cid, todayYmd(), bal, "전액 입금(미수 정리)");
  return bal;
}

/* ── 거래처 가입(사업자 전용) ───────────────────────── */
function pendingClients() {
  return state.clients.filter(function (c) { return c.status === CLIENT.PENDING; });
}
function newClientId() {
  var max = 0;
  state.clients.forEach(function (c) {
    var n = parseInt(String(c.id || "").replace(/[^0-9]/g, ""), 10);
    if (n > max) max = n;
  });
  return "c" + (max + 1);
}
/** 가입 신청 — 간편 가입. 사업자등록증은 없어도 접수되고, 사장님 확인·승인 후 발주할 수 있다. */
function addSignupClient(data) {
  if (!data || !String(data.name || "").trim()) return { ok:false, msg:"상호를 입력해 주세요." };
  if (digits(data.phone).length < 9) return { ok:false, msg:"전화번호를 정확히 입력해 주세요." };
  var hasFile = !!(data.bizFile && data.bizFile.name);
  var cl = {
    id:newClientId(), name:String(data.name).trim(), bizNo:data.bizNo || "", owner:data.owner || "",
    addr:data.addr || "", uptae:data.uptae || "", jongmok:data.jongmok || "",
    phone:data.phone || "", manager:data.manager || data.owner || "",
    prevBalance:0, payments:[], memo:hasFile ? "간편 가입 · 사업자등록증 확인 대기" : "간편 가입 · 사장님 확인 대기",
    status:CLIENT.PENDING, bizFile:hasFile ? data.bizFile : null, signupAt:nowIso(), approvedAt:null
  };
  state.clients.push(cl);
  state.currentClientId = cl.id;
  saveState();
  return { ok:true, client:cl };
}
function approveClient(cid) {
  var cl = getClient(cid);
  if (!cl) return false;
  cl.status = CLIENT.APPROVED;
  cl.approvedAt = nowIso();
  cl.memo = "사장님 확인 · 승인 완료";
  saveState();
  return true;
}
function rejectClient(cid) {
  var cl = getClient(cid);
  if (!cl) return false;
  cl.status = CLIENT.REJECTED;
  cl.rejectedAt = nowIso();
  cl.memo = "가입 반려";
  saveState();
  return true;
}

/* ── 외상 기한 계산 (거래처 등급별) ──────────────────
   입금은 오래된 미수부터 갚은 것으로 본다(FIFO). 기초 미수는 날짜가 없으니
   가장 오래된 미수로 놓고, 그 위에 외상 주문을 날짜 순으로 쌓는다.
   기한 = 미수 발생일 + 등급별 일수(1/7/15). 오늘이 기한을 지났으면 연체.
   즉시결제 주문은 그날 입금 처리되므로 미수로 잡지 않는다. */
function creditAging(cid) {
  var cl = getClient(cid);
  var days = creditDaysOf(cl);
  var t = todayYmd();
  var charges = [];
  var base = Number(cl.prevBalance) || 0;
  if (base > 0) charges.push({ ymd:"0000-01-01", name:"기초 미수", amount:base });
  state.orders.forEach(function (o) {
    if (!o || o.clientId !== cid || o.status === STATUS.CANCELED || isImmediate(o)) return;
    var amt = Number(o.total) || 0;
    if (amt > 0) charges.push({ ymd:o.ymd, name:o.no, amount:amt });
  });
  charges.sort(function (a, b) {
    if (a.ymd !== b.ymd) return a.ymd < b.ymd ? -1 : 1;
    return a.name < b.name ? -1 : 1;
  });
  var paid = (cl.payments || []).reduce(function (s, p) { return s + (Number(p.amount) || 0); }, 0);
  var left = paid, rest = [];
  charges.forEach(function (c) {
    var use = Math.min(left, c.amount);
    left -= use;
    var remain = c.amount - use;
    if (remain > 0) rest.push({ ymd:c.ymd, name:c.name, amount:remain });
  });
  var out = { days:days, balance:0, overdue:0, due:0, items:[], overdueItems:[], oldestLate:null };
  rest.forEach(function (c) {
    out.balance += c.amount;
    var dueYmd = c.ymd === "0000-01-01" ? "" : addDays(c.ymd, days);
    var late = !dueYmd || t > dueYmd;
    var it = { ymd:c.ymd, name:c.name, amount:c.amount, dueYmd:dueYmd, late:late };
    out.items.push(it);
    if (late) {
      out.overdue += c.amount;
      out.overdueItems.push(it);
      if (!out.oldestLate || (it.ymd !== "0000-01-01" && (out.oldestLate.ymd === "0000-01-01" || it.ymd < out.oldestLate.ymd))) out.oldestLate = it;
    } else {
      out.due += c.amount;
    }
  });
  return out;
}
/** 기한 안에 있는 미수 중 가장 빨리 돌아오는 날 */
function nextDueYmd(cid) {
  var a = creditAging(cid);
  var list = a.items.filter(function (it) { return !it.late && it.dueYmd; })
    .sort(function (x, y) { return x.dueYmd < y.dueYmd ? -1 : 1; });
  return list.length ? list[0].dueYmd : "";
}
/** 발주가 막혔을 때 손님에게 보여 줄 말 — 등급명·기한 일수는 안 나간다. */
function gateBalanceMsg(cl, bal, age) {
  if (age.days <= 1) {
    return "미수 잔액 " + won(bal) + "원 입금 확인 후 다음 발주가 가능합니다 (외상은 하루치까지만 가능)";
  }
  return "미수 잔액 " + won(bal) + "원 중 약정 기한이 지난 " + won(age.overdue) + "원이 있어 발주가 막혔습니다";
}

/* ── 발주 가능 여부 (사업자 승인 · 등급별 외상 기한) ──────── */
/* 발주 화면·체크아웃·placeOrder가 모두 이 한 곳을 본다. */
function clientGate(cid) {
  var cl = getClient(cid);
  var out = { blocked:false, code:"OK", client:cl, balance:0, overdue:0, due:0, days:1, msg:"" };
  if (!cl) { out.blocked = true; out.code = "NOCLIENT"; out.msg = "거래처를 선택해주세요."; return out; }
  out.tier = tierOf(cl).key;
  out.days = creditDaysOf(cl);
  var st = cl.status || CLIENT.APPROVED;
  if (st === CLIENT.PENDING) {
    out.blocked = true; out.code = "PENDING";
    out.msg = "가입 승인 대기 중입니다. 사장님이 승인하면 바로 발주할 수 있어요.";
    return out;
  }
  if (st === CLIENT.REJECTED) {
    out.blocked = true; out.code = "REJECTED";
    out.msg = "가입이 반려된 거래처입니다. 사장님께 문의해 주세요.";
    return out;
  }
  var age = creditAging(cid);
  out.balance = age.balance;
  out.overdue = age.overdue;
  out.due = age.due;
  if (age.overdue > 0) {
    out.blocked = true; out.code = "BALANCE";
    out.msg = gateBalanceMsg(cl, age.balance, age);
  }
  return out;
}
/** 10만 원 이상이면 즉시결제 — 단, 약정 거래처(우수·VIP)는 기한 안이면 외상 가능. */
function payModeFor(total, cl) { return creditAllowed(cl || currentClient(), total) ? PAY.CREDIT : PAY.IMMEDIATE; }
function creditOpenAt(total, cl) { return creditAllowed(cl || currentClient(), total); }
/** 즉시결제 중 아직 입금 확인 전인 금액 */
function immediatePendingOf(cid) {
  return state.orders.filter(function (o) {
    return o.clientId === cid && o.status !== STATUS.CANCELED &&
      o.payMode === PAY.IMMEDIATE && o.deposit !== DEPOSIT.CONFIRMED;
  }).reduce(function (s, o) { return s + (Number(o.total) || 0); }, 0);
}
function confirmDeposit(no) {
  var o = findOrder(no);
  if (!o || o.payMode !== PAY.IMMEDIATE) return false;
  o.deposit = DEPOSIT.CONFIRMED;
  o.depositAt = nowIso();
  saveState();
  return true;
}

/* ── 재입고 알림 ────────────────────────────────────── */
function addAlert(clientId, itemIds) {
  var cl = getClient(clientId);
  var names = itemIds.map(function (id) { var p = findProduct(id); return p ? p.name : ""; }).filter(Boolean);
  state.alerts.unshift({
    id:"a" + Date.now().toString(36), clientId:cl.id, clientName:cl.name, phone:cl.phone,
    itemIds:itemIds.slice(), itemNames:names, createdAt:nowIso(), status:"WAIT", memo:""
  });
  saveState();
}
function openAlerts() { return state.alerts.filter(function (a) { return a.status === "WAIT"; }); }

/* ── 반품·클레임 처리 ────────────────────────────────── */
/** 배송중·배송완료 주문만 반품·클레임을 낼 수 있다 */
function canClaim(o) {
  return !!o && (o.status === STATUS.DISPATCHED || o.status === STATUS.DELIVERED);
}
function claimsOf(orderNo) {
  return (state.claims || []).filter(function (c) { return c.orderNo === orderNo; });
}
function openClaims() {
  return (state.claims || []).filter(function (c) { return c.status === CLAIM.OPEN; });
}
function findClaim(id) {
  return (state.claims || []).filter(function (c) { return c.id === id; })[0] || null;
}
/** 고른 품목들의 주문 금액 합 */
function claimAmountFor(o, pids) {
  if (!o) return 0;
  return (o.items || []).filter(function (it) { return pids.indexOf(it.pid) >= 0; })
    .reduce(function (s, it) { return s + (Number(it.amount) || 0); }, 0);
}
/** 손님 접수 — 품목·사유·증빙 사진·메모 */
function addClaim(data) {
  var o = data && findOrder(data.orderNo);
  if (!o) return { ok:false, msg:"발주를 찾지 못했습니다." };
  if (!canClaim(o)) return { ok:false, msg:"배송중·배송완료 주문만 반품·클레임을 낼 수 있습니다." };
  var pids = (data.items || []).filter(function (pid) {
    return (o.items || []).some(function (it) { return it.pid === pid; });
  });
  if (!pids.length) return { ok:false, msg:"문제가 있는 품목을 골라 주세요." };
  var reason = String(data.reason || "");
  if (CLAIM_REASONS.indexOf(reason) < 0) return { ok:false, msg:"사유를 골라 주세요." };
  var photos = (data.photos || []).filter(function (p) { return p && p.dataUrl; }).slice(0, CLAIM_PHOTOS_MAX);
  if (!photos.length) return { ok:false, msg:"증빙 사진을 1장 이상 올려 주세요." };
  var c = {
    id:"cl" + Date.now().toString(36),
    orderNo:o.no, clientId:o.clientId,
    items:(o.items || []).filter(function (it) { return pids.indexOf(it.pid) >= 0; })
      .map(function (it) { return { pid:it.pid, name:it.name, qty:it.qty, price:it.price, amount:it.amount }; }),
    reason:reason, memo:String(data.memo || "").slice(0, 300),
    photos:photos, amount:claimAmountFor(o, pids),
    status:CLAIM.OPEN, createdAt:nowIso(), decidedAt:null
  };
  state.claims = state.claims || [];
  state.claims.unshift(c);
  o.history = o.history || [];
  o.history.push({ at:nowIso(), text:"반품·클레임 접수 — " + reason + " · " + won(c.amount) + "원" });
  saveState();
  return { ok:true, claim:c, order:o };
}
/** 사장님 승인 — 그 품목 금액만큼 주문 합계(→미수 잔액)에서 차감 */
function approveClaim(id) {
  var c = findClaim(id);
  if (!c || c.status !== CLAIM.OPEN) return null;
  var o = findOrder(c.orderNo);
  if (!o) return null;
  c.status = CLAIM.APPROVED;
  c.decidedAt = nowIso();
  o.claimTotal = (Number(o.claimTotal) || 0) + c.amount;
  o.total = Math.max(0, (Number(o.itemsAmount) || 0) + (Number(o.shipFee) || 0) - o.claimTotal);
  o.history = o.history || [];
  o.history.push({ at:nowIso(), text:"반품 승인 — " + won(c.amount) + "원 차감 (합계 " + won(o.total) + "원)" });
  saveState();
  return { claim:c, order:o, amount:c.amount };
}
function rejectClaim(id) {
  var c = findClaim(id);
  if (!c || c.status !== CLAIM.OPEN) return null;
  c.status = CLAIM.REJECTED;
  c.decidedAt = nowIso();
  var o = findOrder(c.orderNo);
  if (o) {
    o.history = o.history || [];
    o.history.push({ at:nowIso(), text:"반품 반려 — " + c.reason });
  }
  saveState();
  return { claim:c, order:o };
}

/* ── 품목 관리 (사장님 · 품목 추가/삭제 · 가격·재고 변동) ─────────
   사장님이 '아침 7시 단가 확정' 탭에서 품목을 직접 늘리고 줄인다.
   바뀐 품목표는 같은 localStorage에 저장되므로 손님 화면(index.html)에 바로 반영된다. */
var CAT_EMOJI = { veg:"🥬", season:"🌿", fruit:"🍋" };
/* 이름만 보고 분류·그림을 짐작한다 (감귤 → 과일 🍊) */
var CAT_GUESS = [
  { cat:"fruit",  emoji:"🍊", words:["감귤","귤","오렌지","한라봉","천혜향","레몬","사과","신고배","단감","복숭아","자두","포도","바나나","키위","망고","딸기","수박","참외","블루베리","샤인머스캣","파인애플","체리","무화과","석류","앵두"] },
  { cat:"season", emoji:"🌶️", words:["고추","대파","쪽파","양파","마늘","생강","깻잎","부추","상추","청양","당근","시래기"] },
  { cat:"veg",    emoji:"🥬", words:["오이","호박","무","배추","양배추","감자","고구마","피망","파프리카","버섯","로즈","라디치오","도라지","우엉","시금치","브로콜리","토마토","가지"] }
];
function guessCat(name) {
  var n = String(name || "");
  var hit = null;
  CAT_GUESS.forEach(function (g) {
    if (hit) return;
    g.words.forEach(function (w) { if (!hit && n.indexOf(w) >= 0) hit = g; });
  });
  return { cat:hit ? hit.cat : "veg", emoji:hit ? hit.emoji : "🥬" };
}
var UNIT_OPTIONS = ["1박스", "1kg", "1단", "1개", "15kg", "20kg"];
var UNIT_SPEC_MAP = { "1박스":"box", "1kg":"kg", "1단":"단", "1개":"ea", "15kg":"box", "20kg":"box" };

function newProductId() {
  var max = 0;
  state.products.forEach(function (p) {
    var m = /^p(\d+)$/.exec(String(p.id || ""));
    if (m) max = Math.max(max, Number(m[1]));
  });
  return "p" + (max + 1);
}
function productNameOf(base, grade, unitLabel) {
  return String(base).trim() + (grade ? " (" + grade + ")" : "") + " " + unitLabel;
}
/** 같은 품목(이름·등급·단위)이 이미 있는지 — 띄어쓰기·괄호 무시 */
function sameProduct(p, base, grade, unitLabel) {
  return normSearch(p.base + p.grade + unitLabelOf(p)) === normSearch(base + grade + unitLabel);
}
/** 품목 추가 — 품목명·분류·등급·단위·오늘 단가·재고 */
function addProduct(data) {
  data = data || {};
  var base = String(data.base || "").trim();
  if (!base) return { ok:false, msg:"품목 이름을 입력해 주세요." };
  var price = Math.max(0, Number(digits(data.price)) || 0);
  if (!(price > 0)) return { ok:false, msg:"오늘 단가를 입력해 주세요." };
  var cat = CAT_KEYS.indexOf(data.cat) >= 0 ? data.cat : "veg";
  var grade = String(data.grade || "").trim();
  var unitLabel = String(data.unitLabel || "1개").trim() || "1개";
  var dup = state.products.filter(function (p) { return sameProduct(p, base, grade, unitLabel); })[0];
  if (dup) return { ok:false, msg:"이미 있는 품목입니다 — " + dup.name };

  var guess = guessCat(base);
  var spec = UNIT_SPEC_MAP[unitLabel] || "-";
  var p = {
    id:newProductId(), name:productNameOf(base, grade, unitLabel), base:base, grade:grade,
    unitLabel:unitLabel, spec:spec, unit:spec === "-" ? "ea" : spec, cat:cat,
    ref:price, prevPrice:price, emoji:(guess.cat === cat ? guess.emoji : (CAT_EMOJI[cat] || "🥬")),
    stock:Math.max(0, Number(digits(data.stock)) || 0), soldOut:false
  };
  state.products.push(p);
  /* 오늘(고른 날짜) 확정가 칸에도 바로 채운다 */
  var ymd = ui.priceDate || addDays(todayYmd(), 1);
  if (!ui.priceDraft[ymd]) priceDraftFor(ymd);
  if (ui.priceDraft[ymd]) ui.priceDraft[ymd][p.id] = price;
  saveState();
  return { ok:true, product:p };
}
/** 품목 삭제 — 장바구니·날짜별 단가에서도 같이 지운다 */
function deleteProduct(pid) {
  var p = findProduct(pid);
  if (!p) return null;
  state.products = state.products.filter(function (x) { return x.id !== pid; });
  if (cart[pid]) { delete cart[pid]; saveCart(); }
  Object.keys(state.days).forEach(function (d) {
    var day = state.days[d];
    if (day && day.prices && day.prices[pid] != null) delete day.prices[pid];
  });
  Object.keys(ui.priceDraft).forEach(function (d) {
    if (ui.priceDraft[d]) delete ui.priceDraft[d][pid];
  });
  saveState();
  return p;
}
/** 재고 바꾸기 — 0보다 크게 채우면 품절도 풀린다 */
function setProductStock(pid, n) {
  var p = findProduct(pid);
  if (!p) return null;
  p.stock = Math.max(0, Math.round(Number(n) || 0));
  p.soldOut = p.stock <= 0;
  saveState();
  return p;
}
function toggleSoldOut(pid) {
  var p = findProduct(pid);
  if (!p) return null;
  p.soldOut = !p.soldOut;
  saveState();
  return p;
}
/** 참고가를 바꾸면 확정가 칸도 따라간다 (손으로 고친 확정가는 그대로 둔다) */
function setProductRef(pid, n) {
  var p = findProduct(pid);
  if (!p) return null;
  var old = Number(p.ref) || 0;
  var nv = Math.max(0, Number(digits(n)) || 0);
  p.ref = nv;
  if (p.prevPrice == null) p.prevPrice = nv;
  Object.keys(ui.priceDraft).forEach(function (d) {
    var draft = ui.priceDraft[d];
    if (draft && Number(draft[pid]) === old) draft[pid] = nv;
  });
  saveState();
  return p;
}

/* ── 영수증 / 단가 일괄 입력 ──────────────────────────
   영수증을 보고 한 줄에 "품목 가격"을 붙여넣으면 매칭되는 품목의 확정가 칸을 채운다.
   예)  대파 2800 / 양파 18,500 / 청양고추 특 32000 */
function parsePriceLines(text) {
  var out = [];
  String(text == null ? "" : text).split(/\r?\n/).forEach(function (raw) {
    var line = raw.replace(/\t/g, " ").trim();
    if (!line) return;
    /* 가격 = 줄 끝의 숫자(콤마 허용). 없으면 이름만 있는 줄 */
    var m = /^(.*?)[\s:·\-]*([0-9][0-9,]{1,8})\s*원?\s*$/.exec(line);
    if (!m) { out.push({ raw:line, name:line, price:null }); return; }
    var name = m[1].replace(/[\s:·\-]+$/, "").trim();
    var price = Number(m[2].replace(/,/g, ""));
    if (!name) { out.push({ raw:line, name:line, price:null }); return; }
    out.push({ raw:line, name:name, price:price });
  });
  return out;
}
/** 영수증 한 줄의 품목 이름 → 품목 후보 (정확한 이름 > 등급 일치 > 등급 없는 기본 품목 > 단위 일치) */
function matchProductsForLine(name) {
  var q = String(name || "").trim();
  if (!q) return { list:[], best:null };
  var toks = q.split(/\s+/).map(normSearch).filter(Boolean);
  if (!toks.length) return { list:[], best:null };
  var cands = state.products.filter(function (p) {
    var hay = prodHay(p);
    return toks.every(function (t) { return hay.indexOf(t) >= 0; });
  });
  if (!cands.length) return { list:[], best:null };
  var qn = normSearch(q);
  function score(p) {
    var s = 0;
    if (normSearch(p.name) === qn) s += 100;
    if (p.grade) {
      if (toks.indexOf(normSearch(p.grade)) >= 0) s += 40; else s -= 20;
    } else if (!/[특상중]/.test(q)) s += 20;
    var ul = normSearch(unitLabelOf(p));
    if (ul && toks.some(function (t) { return ul.indexOf(t) >= 0; })) s += 30;
    s -= String(p.base || "").length / 100;   /* 기본(등급 없는) 품목을 살짝 앞세운다 */
    return s;
  }
  cands.sort(function (a, b) {
    var d = score(b) - score(a);
    if (d) return d;
    return String(a.id) < String(b.id) ? -1 : 1;
  });
  return { list:cands, best:cands[0] };
}
/** 일괄 적용 — 매칭된 품목의 확정가를 한꺼번에 채우고, 못 찾은 줄은 따로 돌려준다 */
function applyBulkPrices(text, ymd) {
  var day = ymd || ui.priceDate || addDays(todayYmd(), 1);
  var draft = priceDraftFor(day);
  var applied = [], unmatched = [], noPrice = [];
  parsePriceLines(text).forEach(function (r) {
    if (!(r.price > 0)) { noPrice.push(r); return; }
    var m = matchProductsForLine(r.name);
    if (!m.best) { unmatched.push(r); return; }
    draft[m.best.id] = r.price;
    applied.push({ pid:m.best.id, name:m.best.name, base:m.best.base, price:r.price, raw:r.raw, candidates:m.list.length });
  });
  ui.bulkResult = { ymd:day, applied:applied, unmatched:unmatched, noPrice:noPrice, at:nowIso() };
  return ui.bulkResult;
}

/* ═══════════════════════════════════════════════════════════
   v9 — 도매 사장님 핵심 실무 10기능 (데이터·계산)
   ═══════════════════════════════════════════════════════════ */

/* ── 날짜 차이 (일) ─────────────────────────────────── */
function daysBetween(fromYmd, toYmd) {
  var a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fromYmd || "");
  var b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(toYmd || "");
  if (!a || !b) return 0;
  var d1 = Date.UTC(Number(a[1]), Number(a[2]) - 1, Number(a[3]));
  var d2 = Date.UTC(Number(b[1]), Number(b[2]) - 1, Number(b[3]));
  return Math.round((d2 - d1) / 86400000);
}

/* ── 6. 거래처별 고정/특별 단가 (사장님만 정한다 · 손님 화면엔 가격만) ── */
function specialPricesOf(cid) {
  /* cid가 비었거나 없는 거래처면 특별 단가 없음 — 다른 거래처 단가가 새지 않게 */
  var cl = cid ? state.clients.filter(function (c) { return c.id === cid; })[0] : null;
  var out = {};
  if (!cl || !cl.prices || typeof cl.prices !== "object") return out;
  Object.keys(cl.prices).forEach(function (pid) {
    var v = Number(cl.prices[pid]) || 0;
    if (v > 0 && findProduct(pid)) out[pid] = v;
  });
  return out;
}
function specialPriceOf(cid, pid) {
  var m = specialPricesOf(cid);
  return Number(m[pid]) || 0;
}
function specialPriceCount(cid) { return Object.keys(specialPricesOf(cid)).length; }
function setSpecialPrice(cid, pid, price) {
  var cl = getClient(cid);
  if (!cl || !findProduct(pid)) return null;
  cl.prices = specialPricesOf(cid);
  var v = Math.max(0, Number(digits(price)) || 0);
  if (v > 0) cl.prices[pid] = v; else delete cl.prices[pid];
  saveState();
  return v;
}
/** 이 거래처에 이 품목을 파는 가격 — 특별 단가가 있으면 그 값, 없으면 그날 단가 */
function priceForClient(p, ymd, cid) {
  if (!p) return 0;
  var sp = specialPriceOf(cid || state.currentClientId, p.id);
  return sp > 0 ? sp : priceOf(p, ymd);
}
/** 특별 단가가 걸린 품목은 ▲▼ 대신 '내 단가'로 고정 표시 */
function priceDeltaFor(p, ymd, cid) {
  var sp = specialPriceOf(cid || state.currentClientId, p.id);
  if (sp > 0) return { prev:sp, now:sp, delta:0, special:true };
  return priceDelta(p, ymd);
}

/* ── 7. 거래처 즐겨찾기 (★) ────────────────────────── */
function favIds(cid) {
  var cl = getClient(cid);
  var list = (cl && Array.isArray(cl.favs)) ? cl.favs : [];
  return list.filter(function (pid) { return !!findProduct(pid); });
}
function isFav(cid, pid) { return favIds(cid).indexOf(pid) >= 0; }
function toggleFav(cid, pid) {
  var cl = getClient(cid);
  if (!cl || !findProduct(pid)) return null;
  var list = favIds(cid);
  var at = list.indexOf(pid);
  if (at >= 0) list.splice(at, 1); else list.unshift(pid);
  cl.favs = list;
  saveState();
  return { on:at < 0, count:list.length, product:findProduct(pid) };
}
function favProducts(cid) {
  return favIds(cid).map(function (pid) { return findProduct(pid); }).filter(Boolean);
}

/* ── 8. 마감 전 추가 합배송 ──────────────────────────
   같은 날 같은 회차에 이미 접수된 주문이 있으면, 추가 발주는 최소 주문(5만 원) 없이
   '기존 주문과 합배송'으로 접수한다. */
function combineOrderFor(cid, ymd, round) {
  var list = state.orders.filter(function (o) {
    return o && o.clientId === cid && o.ymd === ymd && (!round || o.round === round) &&
      o.status !== STATUS.CANCELED;
  });
  if (!list.length) return null;
  list.sort(function (a, b) { return a.no < b.no ? 1 : -1; });
  return list[0];
}

/* ── 9. 품절 대체품 추천 ───────────────────────────── */
function inStock(p) { return !!p && !p.soldOut && p.stock > 0; }
/** 품절 품목의 대체품 — 사장님이 지정한 품목 → 같은 품목의 다른 등급·단위 → 같은 분류 */
function substituteOf(p) {
  if (!p) return null;
  if (p.sub) {
    var fixed = findProduct(p.sub);
    if (inStock(fixed) && fixed.id !== p.id) return fixed;
  }
  var pool = state.products.filter(function (x) { return x.id !== p.id && inStock(x); });
  function cheap(a, b) { return priceOf(a, todayYmd()) - priceOf(b, todayYmd()); }
  var same = pool.filter(function (x) { return x.base === p.base; });
  if (same.length) return same.sort(cheap)[0];
  var near = pool.filter(function (x) { return x.cat === p.cat; });
  if (near.length) return near.sort(cheap)[0];
  return pool.length ? pool.sort(cheap)[0] : null;
}
function setSubstitute(pid, subId) {
  var p = findProduct(pid);
  if (!p) return null;
  var s = subId ? findProduct(subId) : null;
  p.sub = (s && s.id !== p.id) ? s.id : "";
  saveState();
  return p;
}

/* ── 10. 배송 완료 메모 (납품 위치) ────────────────── */
function completeDelivery(no, memo) {
  var o = findOrder(no);
  if (!o || o.status !== STATUS.DISPATCHED) return null;
  o.status = STATUS.DELIVERED;
  o.deliveredAt = nowIso();
  o.deliverMemo = String(memo == null ? "" : memo).replace(/\s+/g, " ").trim().slice(0, 80);
  o.history = o.history || [];
  o.history.push({ at:nowIso(), text:"배송 완료" + (o.deliverMemo ? " — " + o.deliverMemo : "") });
  saveState();
  return o;
}

/* ── 1. 회차별 상차·피킹 리스트 ────────────────────── */
/** 한 회차(또는 하루 전체)에 실을 품목별 총수량 + 거래처별 수량 */
function pickSheet(ymd, round) {
  var list = batchOrders(ymd, round);
  var rows = [], index = {}, clients = [];
  list.forEach(function (o) {
    var cl = getClient(o.clientId);
    if (!clients.some(function (c) { return c.id === cl.id; })) {
      clients.push({ id:cl.id, name:cl.name, no:o.no });
    }
    (o.items || []).forEach(function (it) {
      var key = String(it.pid || it.name);
      var row = index[key];
      if (!row) {
        var p = findProduct(it.pid);
        row = index[key] = {
          pid:it.pid, name:it.name, base:p ? (p.base || p.name) : it.name,
          grade:p ? p.grade : "", unit:p ? unitLabelOf(p) : (it.spec && it.spec !== "-" ? it.spec : ""),
          emoji:p ? p.emoji : "🥬", total:0, clients:[]
        };
        rows.push(row);
      }
      var qty = Number(it.qty) || 0;
      row.total += qty;
      var hit = row.clients.filter(function (x) { return x.id === cl.id; })[0];
      if (hit) hit.qty += qty;
      else row.clients.push({ id:cl.id, name:cl.name, qty:qty });
    });
  });
  var order = {};
  state.products.forEach(function (p, i) { order[p.id] = i; });
  rows.sort(function (a, b) {
    var ia = order[a.pid] == null ? 99 : order[a.pid];
    var ib = order[b.pid] == null ? 99 : order[b.pid];
    return ia - ib;
  });
  return {
    ymd:ymd, round:round || "", label:round ? roundByKey(round).label : "전체",
    dispatch:round ? roundByKey(round).dispatch : "",
    rows:rows, clients:clients, orderCount:list.length,
    totalQty:rows.reduce(function (s, r) { return s + r.total; }, 0),
    totalAmount:list.reduce(function (s, o) { return s + (Number(o.total) || 0); }, 0)
  };
}
/** 상차 피킹표 A4 — 품목 · 총수량 · 거래처별 수량 · 피킹 체크칸 */
function pickSheetHTML(sheet) {
  var s = state.store;
  var body = sheet.rows.map(function (r, i) {
    var who = r.clients.map(function (c) { return c.name + " " + c.qty; }).join(" · ");
    return "<tr>" +
      '<td class="c">' + (i + 1) + "</td>" +
      '<td class="pn"><b>' + esc(r.base) + "</b>" + (r.grade ? " (" + esc(r.grade) + ")" : "") +
        (r.unit ? ' <span class="u">' + esc(r.unit) + "</span>" : "") + "</td>" +
      '<td class="q"><b>' + r.total + "</b></td>" +
      '<td class="who">' + esc(who) + "</td>" +
      '<td class="chk"></td>' +
      "</tr>";
  }).join("");
  var blanks = Math.max(0, 16 - sheet.rows.length);
  for (var i = 0; i < blanks; i++) {
    body += '<tr class="blank"><td></td><td></td><td></td><td></td><td></td></tr>';
  }
  return '<div class="sheet pick-sheet">' +
    '<div class="pk-head">' +
      '<div class="pk-title"><h1>상차 피킹표</h1><span>' + esc(s.name) + " " + esc(s.branch || "") + "</span></div>" +
      '<div class="pk-when"><b>' + fmtDotDow(sheet.ymd) + " " + esc(sheet.label) + " 배달</b>" +
        "<span>" + (sheet.dispatch ? "출발 " + esc(sheet.dispatch) + " · " : "") +
        "거래처 " + sheet.clients.length + "곳 · " + sheet.rows.length + "품목 · 총 " + sheet.totalQty + "</span></div>" +
    "</div>" +
    '<table class="pk-table"><colgroup><col style="width:9mm"><col><col style="width:20mm"><col style="width:62mm"><col style="width:14mm"></colgroup>' +
      "<thead><tr><th>번호</th><th>품목 (등급 · 단위)</th><th>총수량</th><th>거래처별 수량</th><th>피킹</th></tr></thead>" +
      "<tbody>" + body + "</tbody></table>" +
    '<div class="pk-foot"><span>품목별 총수량대로 먼저 모으고, 오른쪽 거래처별 수량으로 나눠 담으세요.</span>' +
      "<span>" + esc(s.phone || "") + "</span></div>" +
    "</div>";
}

/* ── 2. 매입원가 · 예상 마진 ───────────────────────── */
function marginOf(p, sellPrice) {
  var sell = Math.max(0, Number(sellPrice) || 0);
  var cost = Math.max(0, Number(p && p.cost) || 0);
  var margin = sell - cost;
  return {
    cost:cost, sell:sell, margin:margin, costKnown:cost > 0,
    rate:sell > 0 ? (Math.round(Math.abs(margin) / sell * 1000) / 10) * (margin < 0 ? -1 : 1) : 0
  };
}

/* ── 3. 월말 정산 · CSV ────────────────────────────── */
function monthOf(ymd) { return String(ymd || "").slice(0, 7); }
function thisMonth() { return monthOf(todayYmd()); }
function monthLabel(ym) {
  var m = /^(\d{4})-(\d{2})$/.exec(ym || "");
  return m ? m[1] + "년 " + Number(m[2]) + "월" : (ym || "");
}
/** 거래처 한 곳의 그 달 정산 — 출고액 · 반품차감 · 입금액 · 월말 잔액 */
function monthStat(cid, ym) {
  var cl = getClient(cid), month = ym || thisMonth();
  var end = month + "-31";
  var list = state.orders.filter(function (o) {
    return o && o.clientId === cid && o.status !== STATUS.CANCELED && monthOf(o.ymd) === month;
  });
  var out = 0, claim = 0, paid = 0;
  list.forEach(function (o) {
    out += Number(o.total) || 0;
    claim += Number(o.claimTotal) || 0;
    if (isImmediate(o)) paid += Number(o.total) || 0;   // 즉시결제는 그날 입금 처리
  });
  (cl.payments || []).forEach(function (p) {
    if (monthOf(p.ymd) === month) paid += Number(p.amount) || 0;
  });
  var bal = Number(cl.prevBalance) || 0;
  state.orders.filter(function (o) {
    return o && o.clientId === cid && o.status !== STATUS.CANCELED && o.ymd <= end;
  }).forEach(function (o) {
    bal += Number(o.total) || 0;
    if (isImmediate(o)) bal -= Number(o.total) || 0;
  });
  (cl.payments || []).forEach(function (p) {
    if (String(p.ymd || "") <= end) bal -= Number(p.amount) || 0;
  });
  return {
    cid:cid, name:cl.name, bizNo:cl.bizNo || "", ym:month,
    count:list.length, out:out, claim:claim, paid:paid,
    balance:Math.max(0, bal), current:buildLedger(cid).balance
  };
}
function monthRows(ym) {
  return state.clients.filter(function (c) {
    return (c.status || CLIENT.APPROVED) === CLIENT.APPROVED;
  }).map(function (c) { return monthStat(c.id, ym); })
    .filter(function (r) { return r.count > 0 || r.paid > 0 || r.balance > 0; });
}
function monthTotals(ym) {
  var t = { count:0, out:0, claim:0, paid:0, balance:0, clients:0 };
  monthRows(ym).forEach(function (r) {
    t.clients++; t.count += r.count; t.out += r.out; t.claim += r.claim; t.paid += r.paid; t.balance += r.balance;
  });
  return t;
}
function csvCell(v) {
  var s = String(v == null ? "" : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csvLine(arr) { return arr.map(csvCell).join(","); }
/** 사장님 — 거래처별 월말 정산 CSV (전체 거래처) */
function monthCsvAll(ym) {
  var month = ym || thisMonth();
  var lines = [csvLine(["거래처", "사업자등록번호", "출고건수", "출고액", "반품차감", "입금액", "월말잔액"])];
  monthRows(month).forEach(function (r) {
    lines.push(csvLine([r.name, r.bizNo, r.count, r.out, r.claim, r.paid, r.balance]));
  });
  var t = monthTotals(month);
  lines.push(csvLine(["합계", "", t.count, t.out, t.claim, t.paid, t.balance]));
  return lines.join("\r\n");
}
/** 손님 — 내 거래 내역만 CSV (다른 거래처 정보 없음) */
function monthCsvClient(cid, ym) {
  var month = ym || thisMonth();
  var cl = getClient(cid);
  var lines = [csvLine(["일자", "회차", "주문번호", "출고액", "반품차감", "입금액", "비고"])];
  state.orders.filter(function (o) {
    return o && o.clientId === cid && o.status !== STATUS.CANCELED && monthOf(o.ymd) === month;
  }).sort(function (a, b) { return a.no < b.no ? -1 : 1; }).forEach(function (o) {
    lines.push(csvLine([
      o.ymd, roundByKey(o.round).label, o.no, Number(o.total) || 0, Number(o.claimTotal) || 0,
      isImmediate(o) ? (Number(o.total) || 0) : 0, o.status === STATUS.DELIVERED ? "배송완료" : ""
    ]));
  });
  (cl.payments || []).forEach(function (p) {
    if (monthOf(p.ymd) === month) {
      lines.push(csvLine([p.ymd, "입금", p.id || "", 0, 0, Number(p.amount) || 0, p.memo || "입금 기록"]));
    }
  });
  var st = monthStat(cid, month);
  lines.push("");
  lines.push(csvLine(["합계", "", st.count + "건", st.out, st.claim, st.paid, "월말잔액 " + st.balance]));
  return lines.join("\r\n");
}
/** CSV 내려받기 — 엑셀에서 바로 열리게 UTF-8 BOM을 붙인다 */
function downloadCsv(filename, text) {
  window.__lastCsv = { name:filename, text:text };
  try {
    var blob = new Blob(["\ufeff" + text], { type:"text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename; a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      try { URL.revokeObjectURL(url); a.parentNode.removeChild(a); } catch (e) {}
    }, 1200);
    return true;
  } catch (e) { return false; }
}
/** 월말 정산표 A4 (사장님) */
function monthSheetHTML(ym) {
  var month = ym || thisMonth(), s = state.store, T = monthTotals(month);
  var rows = monthRows(month).map(function (r, i) {
    return "<tr><td class=\"c\">" + (i + 1) + '</td><td class="pn">' + esc(r.name) + '</td><td class="q">' + r.count +
      '</td><td class="n">' + won(r.out) + '</td><td class="n">' + (r.claim > 0 ? "−" : "") + won(r.claim) + '</td><td class="n">' + won(r.paid) +
      '</td><td class="n"><b>' + won(r.balance) + "</b></td></tr>";
  }).join("");
  var blanks = Math.max(0, 10 - monthRows(month).length);
  for (var i = 0; i < blanks; i++) rows += '<tr class="blank"><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
  return '<div class="sheet month-sheet">' +
    '<div class="pk-head"><div class="pk-title"><h1>월말 정산표</h1><span>' + esc(s.name) + " " + esc(s.branch || "") + "</span></div>" +
      '<div class="pk-when"><b>' + monthLabel(month) + "</b><span>거래처 " + T.clients + "곳 · " + T.count + "건</span></div></div>" +
    '<table class="pk-table"><colgroup><col style="width:9mm"><col><col style="width:14mm"><col style="width:26mm"><col style="width:24mm"><col style="width:26mm"><col style="width:28mm"></colgroup>' +
      "<thead><tr><th>번호</th><th>거래처</th><th>출고</th><th>출고액</th><th>반품차감</th><th>입금액</th><th>월말잔액</th></tr></thead>" +
      "<tbody>" + rows + "</tbody>" +
      "<tfoot><tr><td></td><td>합계</td><td class=\"q\">" + T.count + '</td><td class="n">' + won(T.out) +
      '</td><td class="n">' + (T.claim > 0 ? "−" : "") + won(T.claim) + '</td><td class="n">' + won(T.paid) + '</td><td class="n"><b>' + won(T.balance) + "</b></td></tr></tfoot></table>" +
    '<div class="pk-foot"><span>입금 계좌: ' + esc(accountText().text) + "</span><span>" + esc(s.phone || "") + "</span></div>" +
    "</div>";
}

/* ── 4. 미수 · 정산 안내 문구 (카톡/문자 복사) ──────── */
function settlementMessage(cid) {
  var cl = getClient(cid);
  var bal = buildLedger(cid).balance;
  var acc = digits(state.store.account)
    ? "계좌: " + [state.store.bank, state.store.account, state.store.holder].filter(Boolean).join(" ")
    : "입금 계좌는 가게로 문의";
  return cl.name + " 사장님, " + state.store.name + "입니다. 현재 미수 잔액 " + won(bal) + "원(" + acc + ") 안내드립니다.";
}
/** 클립보드 복사 — 최신 브라우저 API + 예전 방식(execCommand) 둘 다 시도 */
function copyText(text) {
  window.__lastCopy = text;
  var ok = false;
  try {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.left = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    if (ta.setSelectionRange) ta.setSelectionRange(0, text.length);
    ok = document.execCommand("copy");
    document.body.removeChild(ta);
  } catch (e) { ok = false; }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { window.__copied = true; }, function () {});
    }
  } catch (e) {}
  return ok;
}

/* ── 5. 단골 이탈(미발주) ──────────────────────────── */
/** 승인 거래처 중 마지막 발주가 days일 이상 지난 곳 (발주 이력 없는 신규는 뺀다) */
function idleClients(days) {
  var n = Number(days) > 0 ? Number(days) : 3;
  var t = todayYmd(), out = [];
  state.clients.forEach(function (c) {
    if ((c.status || CLIENT.APPROVED) !== CLIENT.APPROVED) return;
    var last = latestOrderOf(c.id);
    if (!last) return;
    var gap = daysBetween(last.ymd, t);
    if (gap < n) return;
    out.push({ client:c, last:last, days:gap, phone:c.phone || "", balance:buildLedger(c.id).balance });
  });
  out.sort(function (a, b) { return b.days - a.days; });
  return out;
}

/* ═══════════════════════════════════════════════════════════
   UI — 화면 렌더링
   ═══════════════════════════════════════════════════════════ */

/* ── 작은 도우미 ────────────────────────────────────── */
var toastTimer = null;
function toast(msg) {
  var el = $("#toast");
  el.textContent = msg;
  el.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.classList.remove("on"); }, 2600);
}
function openModal(html) {
  $("#modalInner").innerHTML = html;
  var m = $("#modal");
  m.hidden = false;
  m.classList.add("on");
  $("#scrim").classList.add("on");
  ui.modal = true;
}
function closeModal() {
  var m = $("#modal");
  m.classList.remove("on");
  $("#scrim").classList.remove("on");
  ui.modal = false;
  setTimeout(function () { if (!ui.modal) { m.hidden = true; $("#modalInner").innerHTML = ""; } }, 180);
}
function openDrawer(html) {
  $("#drawerInner").innerHTML = html;
  var d = $("#drawer");
  d.hidden = false;
  d.classList.add("on");
  $("#scrim").classList.add("on");
  ui.drawer = true;
}
function closeDrawer() {
  var d = $("#drawer");
  d.classList.remove("on");
  $("#scrim").classList.remove("on");
  ui.drawer = false;
  setTimeout(function () { if (!ui.drawer) { d.hidden = true; $("#drawerInner").innerHTML = ""; } }, 200);
}
function catLabel(key) {
  var c = CATS.filter(function (x) { return x.key === key; })[0];
  return c ? c.label : "기타";
}
/** 검색어 정규화 — 띄어쓰기·괄호 무시, 손으로 치는 '1키로'도 '1kg'로 맞춘다 */
function normSearch(v) {
  return String(v == null ? "" : v).toLowerCase()
    .replace(/[\s()\[\]{}（）〔〕·,.\/\-_]/g, "")
    .replace(/키로|킬로|kilo/g, "kg")
    .replace(/그램|gram/g, "g");
}
/** 품목 하나의 검색용 글자 — 이름·품목명·등급·단위·분류를 모두 담는다 */
function prodHay(p) {
  return normSearch([p.name, p.base, p.grade, p.unitLabel, p.spec].join(" "));
}
/** 품목 검색 — 공백·괄호 무시 + 여러 낱말 AND.
    "청양 박스" → 청양고추 (특)/(상) 1박스 / "청양 특" → 특만 / "청양 1키로" → 1kg */
function matchQuery(p, q) {
  var raw = String(q == null ? "" : q).trim();
  if (!raw) return true;
  var hay = prodHay(p);
  var toks = raw.split(/\s+/).map(normSearch).filter(Boolean);
  if (!toks.length) return true;
  return toks.every(function (t) { return hay.indexOf(t) >= 0; });
}

/* ── 4단계 진행 상태 (① 주문 접수 → ② 단가 확정 → ③ 배달 출발 → ④ 배송 완료) ── */
var STEP_DEFS = [
  { key:"RECEIVED", label:"주문 접수" },
  { key:"PRICED",   label:"단가 확정" },
  { key:"SHIPPED",  label:"배달 출발" },
  { key:"DONE",     label:"배송 완료" }
];
/** 지금까지 끝난 단계 수 (0~4) */
function orderStepsDone(o) {
  if (!o || o.status === STATUS.CANCELED) return 0;
  if (o.status === STATUS.DELIVERED) return 4;
  if (o.status === STATUS.DISPATCHED) return 3;
  if (o.status === STATUS.READY || o.priceConfirmed) return 2;
  return 1;
}
/** 손님용 4단계 스텝 바 — 지난 단계는 ✓, 지금 단계는 초록 테두리로 크게 */
function stepsBarHTML(o) {
  if (!o || o.status === STATUS.CANCELED) return "";
  var done = orderStepsDone(o);
  return '<ol class="steps" data-steps="' + esc(o.no) + '" aria-label="배달 진행 상태">' +
    STEP_DEFS.map(function (st, i) {
      var cls = i < done ? "done" : (i === done ? "now" : "wait");
      return '<li class="' + cls + '"><i aria-hidden="true">' + (i < done ? "✓" : String(i + 1)) + "</i>" +
        "<b>" + st.label + "</b></li>";
    }).join("") + "</ol>";
}
function badgeOf(o) {
  return '<span class="badge ' + (STATUS_CLASS[o.status] || "done") + '">' + (STATUS_LABEL[o.status] || o.status) + "</span>";
}
function itemLine(o) {
  return o.items.map(function (it) {
    return esc(it.name) + " " + it.qty + (it.spec && it.spec !== "-" ? it.spec : "");
  }).join(" · ");
}

/* ── 3대 규칙 배지 · 차단 배너 ────────────────────── */
function payBadge(o) {
  if (isImmediate(o)) {
    var done = o.deposit === DEPOSIT.CONFIRMED;
    return '<span class="badge ' + (done ? "disp" : "pay") + '">즉시결제 · ' + (done ? "입금확인 완료" : "입금확인 대기") + "</span>";
  }
  return '<span class="badge credit">' + (creditDaysOf(getClient(o.clientId)) > 1 ? "외상(약정)" : "외상(하루치)") + "</span>";
}
/** 반품·클레임 상태 배지 — 손님·사장님 같은 말 */
function claimBadgesHTML(o) {
  var list = claimsOf(o.no);
  if (!list.length) return "";
  var open = list.filter(function (c) { return c.status === CLAIM.OPEN; }).length;
  var last = list[0];
  var html = "";
  if (open) html += '<span class="badge claim">' + CLAIM_BADGE[CLAIM.OPEN] + "</span>";
  if (last.status === CLAIM.APPROVED) html += '<span class="badge disp">' + CLAIM_BADGE[CLAIM.APPROVED] + "</span>";
  if (last.status === CLAIM.REJECTED) html += '<span class="badge cancel">' + CLAIM_BADGE[CLAIM.REJECTED] + "</span>";
  return html;
}
function clientStatusBadge(cl) {
  var st = (cl && cl.status) || CLIENT.APPROVED;
  if (st === CLIENT.PENDING) return '<span class="badge pending">승인 대기</span>';
  if (st === CLIENT.REJECTED) return '<span class="badge cancel">가입 반려</span>';
  return '<span class="badge ok">사업자 승인</span>';
}
function gateBannerHTML(gate) {
  if (!gate || !gate.blocked) return "";
  if (gate.code === "PENDING") {
    return '<div class="notice red" id="creditBlock"><span class="ni">📄</span><div>' +
      '<b>' + esc((gate.client && gate.client.name) || "거래처") + ' — 가입 승인 대기 중입니다.</b><br>' +
      '사장님이 가입을 확인하고 있습니다. <b>승인</b>하면 바로 발주할 수 있어요.</div></div>';
  }
  if (gate.code === "REJECTED") {
    return '<div class="notice red" id="creditBlock"><span class="ni">✕</span><div><b>가입이 반려된 거래처입니다.</b><br>' +
      esc(gate.msg) + '</div></div>';
  }
  if (gate.code === "BALANCE") {
    var late = Number(gate.days) > 1;
    return '<div class="notice red" id="creditBlock"><span class="ni">🔒</span><div>' +
      (late
        ? '미수 잔액 <b>' + won(gate.balance) + '원</b> 중 <b>약정 기한이 지난 ' + won(gate.overdue) + '원</b>이 있어 발주가 막혔습니다<br>' +
          '<span class="tiny">기한 안의 미수 ' + won(gate.due) + '원은 그대로 두고 발주할 수 있습니다. 연체분을 입금 처리하면 바로 다시 발주할 수 있습니다.</span>'
        : '미수 잔액 <b>' + won(gate.balance) + '원</b> 입금 확인 후 다음 발주가 가능합니다 (외상은 하루치까지만 가능)<br>' +
          '<span class="tiny">사장님이 입금을 확인하면 바로 다시 발주할 수 있어요. 10만 원 이상은 즉시 결제만 됩니다.</span>') +
      "</div></div>";
  }
  return '<div class="notice red"><span class="ni">!</span><div>' + esc(gate.msg) + "</div></div>";
}

/* ── 헤더 ───────────────────────────────────────────── */
function renderHeader() {
  $$(".mode").forEach(function (b) {
    b.setAttribute("aria-selected", b.getAttribute("data-route") === ui.route ? "true" : "false");
  });
  var mine = $("#headMine"), guest = $("#headGuest"), nav = $("#navModes");
  var on = isLoggedIn();
  if (mine) mine.hidden = !on;
  if (guest) guest.hidden = on;
  if (nav) nav.hidden = !on;
  var ccName = $("#ccName"), badge = $("#cartCnt");
  if (ccName) {
    var c = currentClient();
    ccName.textContent = (on && c) ? c.name : "내 가게";
  }
  if (badge) {
    var n = cartCount();
    badge.textContent = n;
    badge.hidden = n <= 0;
  }
}

/* ══════════════ 발주 화면 ══════════════ */
function renderB2B() {
  var t = todayYmd();
  var slot = currentSlot();
  ui.slot = { ymd: slot.ymd, round: slot.round };
  ui.listDate = slot.ymd;
  var listDate = slot.ymd;
  var fixed = isDayConfirmed(listDate);

  /* 날짜 — 오늘 / 내일 큰 버튼 */
  var dates = [t, addDays(t, 1)];
  $("#dateChips").innerHTML = dates.map(function (d) {
    var open = openRoundsFor(d);
    var on = d === listDate;
    var name = dayLabel(d) + " " + fmtShort(d).replace(/\(.*\)/, "");
    if (!open.length) {
      return '<button class="su-date" data-act="list-date" data-ymd="' + d + '" aria-pressed="' + on + '" disabled>' +
        '<b>' + name + '</b><span>마감</span></button>';
    }
    return '<button class="su-date" data-act="list-date" data-ymd="' + d + '" aria-pressed="' + on + '">' +
      '<b>' + name + '</b><span>' + (isDayConfirmed(d) ? "확정 단가" : "참고가") + "</span></button>";
  }).join("");

  /* 배달 회차 — 1차 / 2차 / 3차 큰 터치 버튼 */
  $("#orderRounds").innerHTML = state.rounds.map(function (r) {
    var ph = slotPhase(listDate, r);
    var on = r.key === slot.round;
    if (ph !== "OPEN") {
      return '<button class="su-round" data-act="round" data-round="' + r.key + '" aria-pressed="false" disabled>' +
        '<b>' + r.label + '</b><span>마감</span></button>';
    }
    return '<button class="su-round" data-act="round" data-round="' + r.key + '" aria-pressed="' + on + '">' +
      '<b>' + r.label + '</b><span>' + r.dispatch.split("~")[0] + "</span></button>";
  }).join("");

  /* 한 줄 핵심 조건 */
  $("#suNote").innerHTML = won(state.policy.minOrder) + "원 이상 " +
    (Number(state.policy.shipFee) ? won(state.policy.shipFee) + "원 배송" : "<b>무료배송</b>") +
    " · 아침 <b>7시</b> 단가 확정";

  /* 규칙 2 — 미수 잔액 · 승인 전에는 발주 화면 상단에 큰 차단 배너 */
  $("#orderBlock").innerHTML = gateBannerHTML(clientGate(state.currentClientId));

  $("#priceMode").className = "pmode " + (fixed ? "fixed" : "ref");
  $("#priceMode").innerHTML = fixed ? "✓ 확정가" : "◷ 참고가";

  if (fixed) {
    $("#priceNotice").innerHTML = "";
  } else {
    $("#priceNotice").innerHTML = '<div class="notice one"><span class="ni">◷</span><div>' +
      "<b>아직 확정 전</b> — 지금 금액은 참고가이고, <b>아침 7시</b>에 확정 단가로 정산됩니다.</div></div>";
  }

  renderReorder();
  renderFavBox();
  renderListMeta();
  renderCatChips();
  renderProdList();
  renderLiveProgress();
}

/* ── 7. 내 즐겨찾기 (★ 고정 · 발주하기 맨 위) ───────── */
function renderFavBox() {
  var box = $("#favBox");
  if (!box) return;
  var cl = currentClient();
  if (!cl) { box.innerHTML = ""; return; }
  var list = favProducts(cl.id);
  if (!list.length) {
    box.innerHTML = '<p class="fav-empty">★ 를 누르면 <b>내 즐겨찾기</b>에 고정되어 맨 위에서 바로 담을 수 있어요.</p>';
    return;
  }
  var listDate = ui.listDate || currentSlot().ymd;
  box.innerHTML = '<div class="fav-head"><b>★ 내 즐겨찾기</b><span>' + list.length + '품목 · ★ 다시 누르면 해제</span></div>' +
    '<div class="fav-list">' + list.map(function (p) { return prodCardHTML(p, listDate, true); }).join("") + "</div>";
}

/* ── 어제 주문 그대로 담기 (배달 선택 바로 아래 큰 버튼) ── */
function renderReorder() {
  var box = $("#reorderBox");
  if (!box) return;
  var cl = currentClient();
  if (!cl) { box.innerHTML = ""; return; }
  var last = latestOrderOf(cl.id);
  if (!last) {
    box.innerHTML = '<div class="reorder is-empty">' +
      '<span class="ro-i" aria-hidden="true">🧺</span>' +
      '<span class="ro-tx"><b>아직 발주한 적이 없어요</b>' +
        '<small>많이 찾는 품목부터 담아 보세요 — 청양고추 (특) 1박스 · 대파 1단 · 양파 15kg</small></span>' +
      "</div>";
    return;
  }
  box.innerHTML = '<button class="reorder" data-act="reorder">' +
    '<span class="ro-i" aria-hidden="true">↺</span>' +
    '<span class="ro-tx"><b>어제 주문 그대로 담기</b>' +
      "<small>" + fmtShort(last.ymd) + " " + roundByKey(last.round).label + " 발주 · " + last.items.length + "품목 " +
      won(last.total) + "원</small></span>" +
    '<span class="ro-go">담기</span>' +
    "</button>";
}

/* ── 첫 화면 상단 — 최근 발주 진행 상태 요약 ── */
function renderLiveProgress() {
  var box = $("#liveProgress");
  if (!box) return;
  var cl = currentClient();
  if (!cl) { box.innerHTML = ""; return; }
  var last = latestOrderOf(cl.id);
  if (!last) { box.innerHTML = ""; return; }
  var r = roundByKey(last.round);
  box.innerHTML = '<button class="live-card" data-act="go" data-route="orders">' +
    '<div class="lv-head">' +
      '<span class="lv-k">최근 발주</span>' +
      "<b>" + fmtShort(last.ymd) + " " + r.label + "</b>" +
      '<span class="lv-amt">' + won(last.total) + '원</span>' +
      '<span class="lv-go">›</span>' +
    "</div>" +
    stepsBarHTML(last) +
    "</button>";
}

function renderListMeta() {
  var listDate = ui.listDate || currentSlot().ymd;
  var q = ui.prodQuery || "";
  var n = state.products.filter(function (p) {
    return (ui.cat === "all" || p.cat === ui.cat) && matchQuery(p, q);
  }).length;
  $("#listTitle").innerHTML = (q ? "‘" + esc(q.trim()) + "’ 검색" : fmtDotDow(listDate) + " 단가표") +
    " <small>" + n + "품목</small>";
}

function renderCatChips() {
  var q = ui.prodQuery || "";
  $("#catChips").innerHTML = CATS.map(function (c) {
    var cnt = state.products.filter(function (p) {
      return (c.key === "all" || p.cat === c.key) && matchQuery(p, q);
    }).length;
    return '<button class="chip" data-act="cat" data-cat="' + c.key + '" aria-pressed="' + (ui.cat === c.key) + '">' +
      c.label + (q ? '<em class="chip-n">' + cnt + "</em>" : "") + "</button>";
  }).join("");
}

function renderProdList() {
  var listDate = ui.listDate || defaultSlot().ymd;
  var q = ui.prodQuery || "";
  var list = state.products.filter(function (p) {
    return (ui.cat === "all" || p.cat === ui.cat) && matchQuery(p, q);
  });
  if (!list.length) {
    $("#prodList").innerHTML = q
      ? '<div class="empty"><div class="ei">🔍</div><b>‘' + esc(q.trim()) + '’ 품목이 없습니다</b>' +
        '<p>품목 이름을 다시 확인하거나, 아래 버튼으로 전체 품목을 보세요.</p>' +
        '<button class="btn btn-sm" style="margin-top:12px" data-act="prod-clear">전체 품목 보기</button></div>'
      : '<div class="empty"><div class="ei">🥬</div><b>이 분류에 품목이 없습니다</b></div>';
    return;
  }
  $("#prodList").innerHTML = list.map(function (p) { return prodCardHTML(p, listDate, false); }).join("");
}

/** 품목 카드 한 장 — 단가표 · 즐겨찾기에서 같이 쓴다 */
function prodCardHTML(p, listDate, inFav) {
  var qty = Number(cart[p.id]) || 0;
  var out = p.soldOut || p.stock <= 0;
  var price = priceForClient(p, listDate, state.currentClientId);
  var ctl;
  if (out) {
    ctl = '<button class="add-btn is-gray" data-act="restock" data-pid="' + p.id + '">재입고 알림</button>';
  } else if (qty > 0) {
    ctl = '<div class="stepper">' +
      '<button data-act="qty" data-pid="' + p.id + '" data-d="-1" aria-label="' + esc(p.name) + ' 줄이기">−</button>' +
      '<input type="number" inputmode="numeric" data-act="qty-set" data-pid="' + p.id + '" value="' + qty + '" min="0" aria-label="' + esc(p.name) + ' 수량">' +
      '<button data-act="qty" data-pid="' + p.id + '" data-d="1" aria-label="' + esc(p.name) + ' 늘리기">＋</button>' +
      "</div>";
  } else {
    ctl = '<button class="add-btn" data-act="add" data-pid="' + p.id + '">＋ 담기</button>';
  }
  var stockTxt = out ? "품절" : "재고 " + p.stock;
  var stockCls = out ? "st-out" : (p.stock <= 5 ? "st-low" : "");
  /* 등급·단위 배지 — 특 · 1박스 / 상 · 1박스 / 1kg 처럼 한 덩어리로 크게 */
  var badge = '<span class="p-badge' + (p.grade ? " has-grade" : "") + '">' +
    (p.grade ? "<b>" + esc(p.grade) + "</b> · " : "") + esc(unitLabelOf(p)) + "</span>";
  var dd = priceDeltaFor(p, listDate, state.currentClientId);
  var deltaHTML = (dd && dd.delta)
    ? '<div class="p-delta ' + (dd.delta < 0 ? "down" : "up") + '">' +
      (dd.delta < 0 ? "▼" : "▲") + " " + won(Math.abs(dd.delta)) + "원</div>"
    : "";
  var fav = isFav(state.currentClientId, p.id);
  var star = '<button class="fav-btn' + (fav ? " on" : "") + '" data-act="fav" data-pid="' + p.id + '"' +
    ' aria-pressed="' + fav + '" aria-label="' + esc(p.name) + ' 즐겨찾기">★</button>';
  /* 9. 품절이면 대체품 원터치 추천 — "대체 추천: 청양고추 (상) 1박스 [＋ 담기]" */
  var sub = out ? substituteOf(p) : null;
  var subHTML = (out && sub)
    ? '<div class="p-sub"><span class="sub-lb">대체 추천</span>' +
      '<b class="sub-nm">' + esc(sub.name) + '</b>' +
      '<button class="add-btn sub-go" data-act="add" data-pid="' + sub.id + '">＋ 담기</button></div>'
    : "";
  return '<article class="p-row' + (out ? " out" : "") + '" data-row="' + p.id + '"' + (inFav ? ' data-fav="1"' : '') + '>' +
    '<div class="p-thumb" aria-hidden="true">' + p.emoji + "</div>" +
    '<div class="p-main">' +
      '<div class="p-name">' + esc(p.base || p.name) + "</div>" +
      '<div class="p-tags">' + badge + '<span class="p-stock ' + stockCls + '">' + stockTxt + "</span>" + star + "</div>" +
    "</div>" +
    '<div class="p-side">' +
      '<div class="p-price"><span class="amt">' + won(price) + "<small>원</small></span></div>" +
      deltaHTML +
      ctl +
    "</div>" +
    subHTML +
    "</article>";
}

/* ── 하단 바 ────────────────────────────────────────── */
function renderActionbar() {
  var bar = $("#actionbar");
  if (!bar) return;   /* 사장님 화면에는 하단 발주 바가 없다 */
  var show = isLoggedIn() && (ui.route === "b2b" || ui.route === "orders" || ui.route === "stmt") && cartCount() > 0;
  bar.classList.toggle("on", show);
  bar.hidden = !show;
  if (!show) return;
  var listDate = ui.listDate || currentSlot().ymd;
  var lines = cartLines(listDate);
  var am = calcAmounts(lines);
  var gate = clientGate(state.currentClientId);
  var sl = currentSlot();
  /* 8. 같은 날 같은 회차에 이미 접수된 주문이 있으면 최소 주문 없이 합배송 */
  var combineBase = isLoggedIn() ? combineOrderFor(state.currentClientId, sl.ymd, sl.round) : null;
  $("#abCnt").textContent = am.kinds + "품목 · " + am.qty + "개";
  $("#abAmt").innerHTML = won(am.itemsAmount) + "<small>원</small>";
  var btn = $("#abBtn");
  var prog = $("#abProgress");
  prog.hidden = false;
  prog.querySelector("i").style.width = (am.minOrder > 0 ? Math.min(100, Math.round(am.itemsAmount / am.minOrder * 100)) : 100) + "%";
  if ((am.meetsMin || combineBase) && !gate.blocked) {
    $("#abHint").innerHTML = (combineBase
      ? "<b>기존 주문과 합배송</b> · " + slotText(sl.ymd, sl.round) + " 배달"
      : "<b>" + slotText(sl.ymd, sl.round) + " 배달</b>") + " · " +
      (Number(state.policy.shipFee) ? "배송비 " + won(state.policy.shipFee) + "원" : "무료배송") +
      (!creditAllowed(currentClient(), am.total) ? " · 10만 원↑ <b>즉시결제</b>" : "");
    prog.querySelector("i").style.background = "var(--green)";
    btn.disabled = false;
    btn.textContent = (combineBase && !am.meetsMin) ? "합배송으로 발주" : "발주하기";
  } else if (gate.blocked) {
    $("#abHint").innerHTML = gate.code === "BALANCE"
      ? "미수 <b>" + won(gate.balance) + "원</b> 입금 전 발주 불가"
      : (gate.code === "PENDING" ? "<b>가입 승인 대기</b> 중입니다" : "<b>발주 불가</b> 상태입니다");
    prog.querySelector("i").style.background = "var(--red)";
    btn.disabled = true;
    btn.textContent = "발주 불가";
  } else {
    $("#abHint").innerHTML = "최소 주문 <b>" + won(am.minOrder) + "원</b>까지 <b>" + won(am.shortfall) + "원</b> 남았어요";
    prog.querySelector("i").style.background = "var(--amber)";
    btn.disabled = true;
    btn.textContent = "발주 불가";
  }
}

/* ── 바구니 드로어 ─────────────────────────────────── */
function renderCartDrawer() {
  var listDate = ui.listDate || defaultSlot().ymd;
  var lines = cartLines(listDate);
  var am = calcAmounts(lines);
  var gate = clientGate(state.currentClientId);
  var slNow = currentSlot();
  var combineBase = combineOrderFor(state.currentClientId, slNow.ymd, slNow.round);
  var body = lines.length ? lines.map(function (l) {
    return '<div class="cline">' +
      '<div class="ci" aria-hidden="true">' + l.p.emoji + "</div>" +
      '<div class="grow"><div class="cn">' + esc(l.name) + '</div><div class="cs">' +
        (l.spec && l.spec !== "-" ? esc(l.spec) + " · " : "") + won(l.price) + "원/" + esc(l.unit) + "</div></div>" +
      '<div class="stepper">' +
        '<button data-act="qty" data-pid="' + l.pid + '" data-d="-1">−</button>' +
        '<input type="number" data-act="qty-set" data-pid="' + l.pid + '" value="' + l.qty + '">' +
        '<button data-act="qty" data-pid="' + l.pid + '" data-d="1">＋</button>' +
      "</div>" +
      '<div class="ca">' + won(l.amount) + "</div>" +
      "</div>";
  }).join("") : '<div class="empty"><div class="ei">◇</div><b>바구니가 비었습니다</b><p>단가표에서 품목을 담아 보세요.</p></div>';

  openDrawer(
    '<div class="grab"></div>' +
    '<div class="dr-head"><h2 id="drawerTitle">발주 바구니</h2><button class="icon-btn" data-act="drawer-close" aria-label="닫기">✕</button></div>' +
    '<div class="dr-body">' + body + "</div>" +
    '<div class="dr-foot">' +
      '<div class="sum" style="margin-bottom:10px">' +
        '<div class="sum-row"><span class="lb">상품 합계</span><span>' + won(am.itemsAmount) + "원</span></div>" +
        '<div class="sum-row"><span class="lb">배송비</span><span class="' + (am.shipFee ? "" : "free") + '">' + (am.shipFee ? won(am.shipFee) + "원" : "무료") + "</span></div>" +
        '<div class="sum-row total"><span>합계</span><span class="amt">' + won(am.total) + "원</span></div>" +
      "</div>" +
      (combineBase ? '<div class="notice green" style="margin-bottom:10px"><span class="ni">🚚</span><div><b>기존 주문과 합배송</b> — 같은 회차 주문(' + esc(combineBase.no) + ')이 있어 최소 주문 없이 바로 접수됩니다.</div></div>'
        : (am.meetsMin ? "" : '<div class="notice" style="margin-bottom:10px"><span class="ni">!</span><div>최소 주문 <b>' + won(am.minOrder) + "원</b>부터 발주할 수 있어요. <b>" + won(am.shortfall) + "원</b> 더 담아 주세요.</div></div>")) +
      (gate.blocked ? '<div class="notice red" style="margin-bottom:10px"><span class="ni">🔒</span><div>' +
        esc(gate.msg) + "</div></div>" : "") +
      '<button class="btn btn-primary btn-block" data-act="checkout"' + (lines.length && (am.meetsMin || combineBase) && !gate.blocked ? "" : " disabled") + ">" +
        (gate.blocked ? "발주 불가" : ((am.meetsMin || combineBase) ? "발주서 작성" : "최소 주문 " + won(am.minOrder) + "원")) + "</button>" +
    "</div>"
  );
}

/* ── 내 가게 정보 (내 것만 보인다) ────────────────── */
function renderMyAccount() {
  var c = currentClient();
  if (!c) return;
  var L = buildLedger(c.id);
  var g = clientGate(c.id);
  var rows = [
    ["상호", c.name],
    ["사업자등록번호", c.bizNo || "-"],
    ["대표자", c.owner || "-"],
    ["연락처", c.phone || "-"],
    ["사업장 주소", c.addr || "-"]
  ].map(function (r) {
    return '<div class="my-row"><span>' + r[0] + "</span><b>" + esc(r[1]) + "</b></div>";
  }).join("");
  openDrawer(
    '<div class="grab"></div>' +
    '<div class="dr-head"><h2 id="drawerTitle">내 가게</h2><button class="icon-btn" data-act="drawer-close" aria-label="닫기">✕</button></div>' +
    '<div class="dr-body">' +
      '<div class="my-card">' +
        '<div class="my-name">' + esc(c.name) + " " + clientStatusBadge(c) + "</div>" +
        '<div class="my-rows">' + rows + "</div>" +
      "</div>" +
      '<div class="my-bal">' +
        '<div class="k">미수 잔액</div>' +
        '<div class="v">' + won(L.balance) + "<small>원</small></div>" +
        '<div class="s">' + (g.blocked ? esc(g.msg) : "발주할 수 있습니다") + "</div>" +
      "</div>" +
      '<p class="tiny muted" style="margin-top:10px">가게 정보가 다르면 사장님(' + esc(state.store.phone) + ')에게 알려 주세요.</p>' +
    "</div>" +
    '<div class="dr-foot">' +
      '<button class="btn btn-ghost btn-block" data-act="logout">로그아웃</button>' +
    "</div>"
  );
}

/* ══════════════ 발주서 (체크아웃) ══════════════ */
function ensureCo() {
  if (!ui.co) {
    var d = currentSlot();
    ui.co = {
      ymd: d.ymd, round: d.round,
      client: clone(currentClient()),
      memo: "",
      payMode: PAY.CREDIT,
      depositChecked: false
    };
  }
  if (!ui.co.payMode) ui.co.payMode = PAY.CREDIT;
  return ui.co;
}

function payOptionHTML(mode, title, sub, on, locked) {
  return '<button class="slot-opt pay-opt' + (locked ? " is-locked" : "") + '" data-act="paymode" data-mode="' + mode + '"' +
    (locked ? ' disabled aria-disabled="true"' : ' aria-pressed="' + on + '"') + ">" +
    '<span class="so-radio" aria-hidden="true"></span>' +
    '<span class="so-main" style="text-align:left"><b>' + esc(title) + (locked ? ' <span class="lock">🔒 잠김</span>' : "") +
    "</b><small>" + esc(sub) + "</small></span>" +
    "</button>";
}

function renderCheckout() {
  var co = ensureCo();
  var slot = findSlot(co.ymd, co.round);
  if (!slot || slot.phase !== "OPEN") {
    var d = currentSlot();
    co.ymd = d.ymd; co.round = d.round;
  }
  var lines = cartLines(co.ymd);
  var am = calcAmounts(lines);
  var acc = accountText();
  var gate = clientGate(state.currentClientId);
  var slots = slotList().filter(function (s) { return s.phase === "OPEN"; }).slice(0, 5);

  /* 규칙 3 — 10만 원 이상이면 외상 선택 불가 · 즉시결제 고정 (일반 등급한)
     약정 거래처(우수·VIP)는 10만 원 이상도 기한 안이면 외상으로 발주한다. */
  var clCo = currentClient();
  var deal = creditDaysOf(clCo) > 1;
  var forcedImmediate = !creditAllowed(clCo, am.total);
  if (forcedImmediate) co.payMode = PAY.IMMEDIATE;
  else if (co.payMode !== PAY.IMMEDIATE) co.payMode = PAY.CREDIT;
  if (co.payMode !== PAY.IMMEDIATE) co.depositChecked = false;
  var immediate = co.payMode === PAY.IMMEDIATE;

  var slotHTML = slots.map(function (s) {
    var on = s.ymd === co.ymd && s.round.key === co.round;
    return '<button class="slot-opt" data-act="slot" data-ymd="' + s.ymd + '" data-round="' + s.round.key + '" aria-pressed="' + on + '">' +
      '<span class="so-date">' + dayLabel(s.ymd) + "</span>" +
      '<span class="so-main"><b>' + s.round.label + " " + s.round.dispatch + "</b><small>" +
        s.round.cutoff + " 마감 · " + (s.confirmed ? "확정가" : "참고가(아침 7시 확정)") + "</small></span>" +
      '<span class="so-radio" aria-hidden="true"></span>' +
      "</button>";
  }).join("");

  var itemRows = lines.map(function (l) {
    return '<div class="sum-row"><span class="lb">' + esc(l.name) + " <span class=\"muted\">×" + l.qty + "</span></span><span>" + won(l.amount) + "원</span></div>";
  }).join("");

  var payCard =
    '<div class="co-card" id="payCard"><h3><span class="num">4</span>결제 방식</h3>' +
      (forcedImmediate
        ? '<div class="notice red" style="margin:0 0 10px" id="payLockNotice"><span class="ni">🔒</span><div><b>10만 원 이상 주문은 외상이 불가합니다.</b><br>즉시 결제(계좌이체 입금 확인)로만 접수됩니다.</div></div>'
        : (deal
          ? '<div class="notice green" style="margin:0 0 10px"><span class="ni">✓</span><div>약정에 따라 <b>외상(미수)</b>으로 접수할 수 있습니다. 기한이 지난 미수가 쌓이면 다음 발주가 막힙니다.</div></div>'
          : '<div class="notice green" style="margin:0 0 10px"><span class="ni">✓</span><div>5만 원~10만 원 미만은 <b>외상(하루치)</b> 또는 <b>즉시 결제</b>를 고를 수 있어요. <b>10만 원 이상은 즉시 결제만</b> 가능합니다.</div></div>')) +
      '<div class="slots">' +
        payOptionHTML(PAY.CREDIT, deal ? "외상 (약정 기한 내 정산)" : "외상 (하루치 · 다음 날 정산)",
          forcedImmediate ? "10만 원 이상은 선택할 수 없습니다" : (deal ? "기한이 지난 미수가 없으면 발주 가능" : "미수 잔액 0원 · 하루치까지"), co.payMode === PAY.CREDIT, forcedImmediate) +
        payOptionHTML(PAY.IMMEDIATE, "즉시 결제 (계좌이체)",
          "오늘 바로 입금 · 다음 발주에 영향 없음", immediate, false) +
      "</div>" +
      (immediate
        ? '<div class="deposit-box">' +
            '<div class="db-head">계좌이체 안내</div>' +
            '<div class="db-acc">' + esc(acc.text) + "</div>" +
            '<div class="tiny" style="margin-top:4px">' + won(am.total) + "원을 입금한 뒤 아래를 체크해 주세요. 사장님이 입금을 확인하면 완료 처리됩니다.</div>" +
            '<label class="pay-check"><input type="checkbox" data-act="deposit-check"' + (co.depositChecked ? " checked" : "") + "> 입금 완료(결제 확인 요청)</label>" +
            '<div class="pg-slot">카드·간편결제(PG) 결제위젯 자리 — 준비 중 (시안에서는 계좌이체로 접수)</div>' +
          "</div>"
        : (deal
          ? '<div class="pay-box" style="margin-top:10px"><b>약정 기한에 따라 외상으로 접수됩니다.</b> 기한이 지난 미수가 있으면 다음 발주가 막힙니다.</div>'
          : '<div class="pay-box" style="margin-top:10px"><b>외상은 하루치까지만 가능합니다.</b> 오늘 출고분은 다음 날 정산되고, 미수 잔액이 남아 있으면 다음 발주가 막힙니다.</div>')) +
    "</div>";

  /* 8. 마감 전 추가 발주 — 같은 날 같은 회차 기존 주문과 합배송이면 최소 주문 없이 접수 */
  var combineBase = combineOrderFor(clCo.id, co.ymd, co.round);
  var canSend = am.meetsMin || !!combineBase;
  var canPlace = canSend && !gate.blocked && (!immediate || co.depositChecked);
  var placeLabel = gate.blocked
    ? (gate.code === "BALANCE" ? "발주 불가 — 미수 " + won(gate.balance) + "원 입금 전" : "발주 불가 — 가입 승인 대기")
    : (!canSend ? "최소 주문 " + won(am.minOrder) + "원"
      : (immediate ? (co.depositChecked ? won(am.total) + "원 즉시결제로 접수" : "입금 완료 체크 후 접수 가능")
        : (combineBase && !am.meetsMin ? won(am.total) + "원 합배송으로 접수" : won(am.total) + "원 외상 발주 확정")));

  $("#coBody").innerHTML =
    gateBannerHTML(gate) +

    '<div class="co-card"><h3><span class="num">1</span>배달 회차</h3><div class="slots">' + slotHTML + "</div></div>" +

    '<div class="co-card"><h3><span class="num">2</span>거래처 정보 <span class="small" style="font-weight:500">· 전표에 그대로 찍힙니다</span></h3>' +
      '<div class="fields">' +
        '<div class="field"><label for="coName">상호</label><input id="coName" data-co="name" value="' + esc(co.client.name) + '" placeholder="예: 쪼끼쪼끼[단관택지]"></div>' +
        '<div class="field"><label for="coBiz">사업자등록번호</label><input id="coBiz" data-co="bizNo" inputmode="numeric" value="' + esc(co.client.bizNo) + '" placeholder="000-00-00000"></div>' +
        '<div class="field"><label for="coOwner">대표자 성명</label><input id="coOwner" data-co="owner" value="' + esc(co.client.owner) + '" placeholder="대표자 이름"></div>' +
        '<div class="field"><label for="coAddr">사업장 주소</label><input id="coAddr" data-co="addr" value="' + esc(co.client.addr) + '" placeholder="배달 받으실 주소"></div>' +
        '<div class="field"><label for="coPhone">담당자 연락처</label><input id="coPhone" data-co="phone" inputmode="tel" value="' + esc(co.client.phone) + '" placeholder="010-0000-0000"></div>' +
      "</div>" +
      '<div class="field" style="margin-top:9px"><label for="coMemo">요청사항</label><textarea id="coMemo" data-co="memo" placeholder="예: 로즈는 잎 큰 것으로, 대파는 굵은 것으로 주세요">' + esc(co.memo) + "</textarea></div>" +
    "</div>" +

    '<div class="co-card"><h3><span class="num">3</span>발주 내역 · 금액</h3>' +
      '<div class="sum">' + itemRows +
        '<div class="sum-row"><span class="lb">상품 합계</span><span>' + won(am.itemsAmount) + "원</span></div>" +
        '<div class="sum-row"><span class="lb">배송비 <span class="tiny muted">(' + esc(state.policy.area) + ")</span></span><span class=\"" + (am.shipFee ? "" : "free") + "\">" + (am.shipFee ? won(am.shipFee) + "원" : "무료") + "</span></div>" +
        '<div class="sum-row total"><span>합계</span><span class="amt">' + won(am.total) + "원</span></div>" +
      "</div>" +
      (combineBase ? '<div class="notice green" style="margin-top:10px" id="combineNotice"><span class="ni">🚚</span><div><b>기존 주문과 합배송</b> — 같은 날 ' + roundByKey(co.round).label + "에 이미 접수된 주문(" + esc(combineBase.no) + ")이 있습니다. 최소 주문 " + won(am.minOrder) + "원 없이 바로 접수되며, 한 번에 배달됩니다.</div></div>"
        : (am.meetsMin ? "" : '<div class="notice" style="margin-top:10px"><span class="ni">!</span><div><b>최소 주문 ' + won(am.minOrder) + "원</b> 미만입니다. <b>" + won(am.shortfall) + "원</b> 더 담아야 발주할 수 있어요.</div></div>")) +
      '<div class="tiny muted" style="margin-top:8px">' + (deal
        ? "이번 발주는 약정에 따라 <b>외상(미수)</b>으로 잡힐 수 있습니다."
        : "10만 원 이상 주문은 외상(미수)에 잡히지 않고 <b>즉시결제 · 입금확인 대기</b>로 구분됩니다.") + "</div>" +
    "</div>" +

    payCard +

    '<div class="co-card">' +
      '<button class="btn btn-primary btn-block" style="height:50px;font-size:16px" data-act="place"' + (canPlace ? "" : " disabled") + ">" +
        esc(placeLabel) + "</button>" +
      '<p class="small" style="margin-top:8px;text-align:center">' +
        (gate.blocked ? "미수 잔액을 정리하거나 가입 승인을 받은 뒤 발주할 수 있습니다."
          : (!canSend ? "5만 원 이상 주문부터 발주할 수 있습니다."
            : (immediate ? (co.depositChecked ? "입금 확인 요청으로 접수됩니다." : "입금 완료를 체크해야 접수됩니다.")
              : (isDayConfirmed(co.ymd) ? "확정 단가로 바로 접수됩니다." : "참고가로 접수되고, " + fmtShort(co.ymd) + " 아침 7시 단가 확정 후 금액이 확정됩니다.")))) +
      "</p>" +
    "</div>";
}

/* ══════════════ 주문현황 ══════════════ */
function renderOrders() {
  var cl = currentClient();
  $("#ordersClient").textContent = cl.name;
  var L = buildLedger(cl.id);
  var pending = state.orders.filter(function (o) { return o.clientId === cl.id && o.status === STATUS.PENDING; });
  var mine = ordersOf(cl.id).slice().sort(function (a, b) { return a.no < b.no ? 1 : -1; });
  var gate = clientGate(cl.id);

  $("#ordersSummary").innerHTML =
    gateBannerHTML(gate) +
    '<div class="stat-grid" style="margin-top:12px">' +
      '<div class="stat"><div class="k">현재 잔액(외상)</div><div class="v">' + won(L.balance) + "<small>원</small></div></div>" +
      '<div class="stat ' + (pending.length ? "warn" : "ok") + '"><div class="k">단가확정 대기</div><div class="v">' + pending.length + "<small>건</small></div></div>" +
    "</div>" +
    (immediatePendingOf(cl.id) ? '<div class="tiny" style="margin-top:6px;color:var(--blue)">즉시결제 입금확인 대기 <b>' + won(immediatePendingOf(cl.id)) + "원</b> · 미수 잔액에는 잡히지 않습니다.</div>" : "");

  var filters = [
    { key:"ALL", label:"전체" },
    { key:"PRICE_PENDING", label:"확정 대기" },
    { key:"READY", label:"출고 준비" },
    { key:"DISPATCHED", label:"배송중" },
    { key:"DELIVERED", label:"완료" },
    { key:"CANCELED", label:"취소" }
  ];
  $("#orderFilters").innerHTML = filters.map(function (f) {
    return '<button class="chip" data-act="order-filter" data-f="' + f.key + '" aria-pressed="' + (ui.orderFilter === f.key) + '">' + f.label + "</button>";
  }).join("");

  var list = mine.filter(function (o) { return ui.orderFilter === "ALL" || o.status === ui.orderFilter; });
  if (!list.length) {
    $("#orderList").innerHTML = '<div class="empty"><div class="ei">◇</div><b>아직 발주 내역이 없습니다</b><p>단가표에서 품목을 담아 첫 발주를 넣어 보세요.</p>' +
      '<button class="btn btn-primary" style="margin-top:14px" data-act="go" data-route="b2b">단가표 보러 가기</button></div>';
    return;
  }
  $("#orderList").innerHTML = list.map(function (o) {
    return orderCard(o, false, L);
  }).join("");
}

function orderCard(o, admin, ledger) {
  var cl = getClient(o.clientId);
  var canCancel = o.status !== STATUS.DELIVERED && o.status !== STATUS.DISPATCHED && o.status !== STATUS.CANCELED;
  var canStmt = o.status !== STATUS.CANCELED;
  var acts = "";
  if (canStmt) acts += '<button class="btn btn-sm" data-act="stmt-open" data-no="' + o.no + '">거래명세표</button>';
  if (!admin && canClaim(o)) acts += '<button class="btn btn-sm" data-act="claim-open" data-no="' + o.no + '">반품·클레임</button>';
  if (!admin && canCancel) acts += '<button class="btn btn-sm btn-ghost" data-act="cancel" data-no="' + o.no + '">발주 취소</button>';
  if (admin) {
    if (o.status === STATUS.PENDING) acts += '<span class="badge pending">아침 7시 확정 대기</span>';
    if (o.status === STATUS.READY) acts += '<button class="btn btn-sm btn-primary" data-act="advance" data-no="' + o.no + '">배송 시작</button>';
    if (o.status === STATUS.DISPATCHED) acts += '<button class="btn btn-sm btn-primary" data-act="advance" data-no="' + o.no + '">배송 완료</button>';
    if (canCancel) acts += '<button class="btn btn-sm btn-ghost" data-act="cancel" data-no="' + o.no + '">취소</button>';
    if (isImmediate(o) && o.deposit !== DEPOSIT.CONFIRMED) acts += '<button class="btn btn-sm" data-act="deposit-confirm" data-no="' + o.no + '">입금 확인</button>';
  }
  var st = ledger && ledger.stmts[o.no];
  return '<article class="ocard" data-order="' + o.no + '">' +
    '<div class="ocard-h">' +
      '<div class="grow">' +
        '<div class="no">' + o.no + (o.stmtNo ? " · 전표 " + o.stmtNo : "") + "</div>" +
        (admin ? '<div class="cli">' + esc(cl.name) + "</div>" : "") +
        '<div class="ocard-meta">' +
          "<span>" + fmtShort(o.ymd) + " " + roundByKey(o.round).label + " " + roundByKey(o.round).dispatch + "</span>" +
          "<span>품목 " + (o.itemsOut || o.items.reduce(function (s, i) { return s + i.qty; }, 0)) + "개</span>" +
          (admin ? "<span>" + esc(cl.phone) + "</span>" : "") +
        "</div>" +
      "</div>" +
      '<div class="badges">' + badgeOf(o) + payBadge(o) + claimBadgesHTML(o) +
        (o.combineWith ? '<span class="badge ok">합배송</span>' : "") +
        (Number(o.combined) > 0 ? '<span class="badge ok">합배송 ' + Number(o.combined) + "건 더</span>" : "") + "</div>" +
    "</div>" +
    (admin ? "" : '<div class="ocard-steps">' + stepsBarHTML(o) + "</div>") +
    '<div class="ocard-items">' + itemLine(o) + (o.memo ? '<div class="tiny" style="margin-top:4px">요청: ' + esc(o.memo) + "</div>" : "") +
      (Number(o.claimTotal) > 0 ? '<div class="tiny" style="margin-top:4px;color:var(--red)"><b>반품 차감 −' + won(o.claimTotal) + '원</b> (사장님 승인)</div>' : "") +
      (o.combineWith ? '<div class="tiny" style="margin-top:4px">🚚 기존 주문 ' + esc(o.combineWith) + "과 합배송</div>" : "") +
      (o.deliverMemo ? '<div class="tiny dv-memo" style="margin-top:4px"><b>납품</b> · ' + esc(o.deliverMemo) + "</div>" : "") + "</div>" +
    '<div class="ocard-foot">' +
      '<div><span class="tot">' + won(o.total) + "<small>원</small></span>" +
        (o.priceConfirmed ? "" : ' <span class="tiny" style="color:var(--amber)">참고가 기준 · 확정 후 변동</span>') +
      "</div>" +
      '<div class="acts">' + acts + "</div>" +
    "</div>" +
    (st && admin ? '<div class="tiny muted" style="margin-top:7px">전잔액 ' + won(st.prev) + " · 출고 " + won(st.out) + " · 입금 " + won(st.pay) + " · 잔액 " + won(st.bal) + "</div>" : "") +
    "</article>";
}

/* ══════════════ 거래명세표 탭 ══════════════ */
function renderStmtTab() {
  var cl = currentClient();
  $("#stmtClient").textContent = cl.name;
  var L = buildLedger(cl.id);
  var mine = ordersOf(cl.id).filter(function (o) { return o.status !== STATUS.CANCELED; })
    .sort(function (a, b) { return a.no < b.no ? 1 : -1; });

  $("#stmtBalance").innerHTML =
    '<div class="balance-card">' +
      "<h2>외상 잔액<span>" + fmtDotDow(todayYmd()) + " 기준</span></h2>" +
      '<div class="big">' + won(L.balance) + "<small>원</small></div>" +
      '<div class="bal-grid">' +
        "<div>기초 미수<b>" + won(L.base) + "</b></div>" +
        "<div>출고액 합계<b>" + won(L.totalOut) + "</b></div>" +
        "<div>입금액 합계<b>" + won(L.totalPaid) + "</b></div>" +
      "</div>" +
    "</div>";

  if ($("#stmtMonth")) $("#stmtMonth").innerHTML = monthCardHTML(cl.id, { ym:thisMonth() });

  $("#stmtCount").textContent = mine.length + "건";
  if (!mine.length) {
    $("#stmtList").innerHTML = '<div class="empty"><div class="ei">A4</div><b>발행된 전표가 없습니다</b><p>발주가 확정되면 거래명세표가 발행됩니다.</p></div>';
    return;
  }
  $("#stmtList").innerHTML = mine.map(function (o) {
    var st = L.stmts[o.no] || { bal:o.total };
    return '<button class="stmt-row" data-act="stmt-open" data-no="' + o.no + '" style="width:100%;text-align:left">' +
      '<span class="stmt-ico" aria-hidden="true">A4</span>' +
      '<span class="grow">' +
        '<span style="font-weight:800;font-size:13.5px;display:block">' + fmtDotDow(o.ymd) + " · " + roundByKey(o.round).label + " 배달</span>" +
        '<span class="sm">' + (o.stmtNo ? "일련번호 " + o.stmtNo + " · " : "") + itemLine(o) + "</span>" +
        '<span class="sm">출고 ' + won(o.total) + "원 · 잔액 " + won(st.bal) + "원</span>" +
      "</span>" +
      '<span class="amt">' + won(o.total) + '<small style="font-size:10px">원</small></span>' +
      "</button>";
  }).join("");
}

/* ══════════════ 사장님 관리 ══════════════ */
function renderAdmin() {
  $$(".adm-tab").forEach(function (b) {
    b.setAttribute("aria-selected", b.getAttribute("data-tab") === ui.admTab ? "true" : "false");
  });
  ["orders", "prices", "clients", "restock", "settings"].forEach(function (k) {
    var el = $("#adm" + k.charAt(0).toUpperCase() + k.slice(1));
    if (el) el.hidden = ui.admTab !== k;
  });
  var n = openAlerts().length;
  var badge = $("#alertBadge");
  badge.textContent = n;
  badge.hidden = n <= 0;
  var cb = $("#claimBadge"), cn = openClaims().length;
  if (cb) { cb.textContent = cn; cb.hidden = cn <= 0; }

  if (ui.admTab === "orders") renderAdminOrders();
  else if (ui.admTab === "prices") renderAdminPrices();
  else if (ui.admTab === "clients") renderAdminClients();
  else if (ui.admTab === "restock") renderAdminRestock();
  else renderAdminSettings();
}

function renderAdminOrders() {
  var t = todayYmd();
  var d = ui.admDate || t;
  ui.admDate = d;
  var list = state.orders.filter(function (o) { return o.ymd === d && o.status !== STATUS.CANCELED; });
  var amount = list.reduce(function (s, o) { return s + o.total; }, 0);
  var pending = list.filter(function (o) { return o.status === STATUS.PENDING; });
  var idle = idleClients(3);   /* 5. 최근 3일 이상 발주가 없는 단골 */

  var groups = state.rounds.map(function (r) {
    var g = list.filter(function (o) { return o.round === r.key; })
      .sort(function (a, b) { return a.no < b.no ? -1 : 1; });
    var sum = g.reduce(function (s, o) { return s + o.total; }, 0);
    var L = {};
    var cards = g.map(function (o) { return orderCard(o, true, buildLedger(o.clientId)); }).join("");
    return '<div class="board-group">' +
      '<div class="bg-head"><b>' + r.label + " 배달</b><span class=\"bg-time\">" + r.dispatch + " 출발 · " + r.cutoff + " 마감</span>" +
        '<span class="bg-cnt">' + g.length + "건 " + won(sum) + "원</span>" +
        (g.length ? '<button class="btn btn-xs" data-act="pick-open" data-ymd="' + d + '" data-round="' + r.key + '">🚚 피킹표</button>' : "") +
        (g.length ? '<button class="btn btn-xs" data-act="batch-round" data-ymd="' + d + '" data-round="' + r.key + '">A4 ' + g.length + '장 인쇄</button>' : "") +
      "</div>" +
      '<div class="bg-body">' + (g.length ? cards : '<div class="empty" style="padding:16px"><b>주문 없음</b></div>') + "</div>" +
      "</div>";
  }).join("");

  $("#admOrders").innerHTML =
    '<div class="panel-head" style="margin-bottom:10px">' +
      '<div class="datechips">' +
        [t, addDays(t, 1)].map(function (x) {
          return '<button class="dchip" data-act="adm-date" data-ymd="' + x + '" aria-pressed="' + (x === d) + '">' + dayLabel(x) + " " + fmtShort(x) + "</button>";
        }).join("") +
      "</div>" +
      '<div class="row" style="gap:6px;flex-wrap:wrap;align-items:center">' +
        '<span class="badge ' + (isDayConfirmed(d) ? "ok" : "pending") + '">' + (isDayConfirmed(d) ? "단가 확정됨" : "단가 미확정") + "</span>" +
        '<button class="btn btn-sm" data-act="pick-open" data-ymd="' + d + '" data-round="">🚚 상차 피킹표</button>' +
        '<button class="btn btn-sm btn-primary" data-act="batch-day" data-ymd="' + d + '"' + (list.length ? "" : " disabled") + '>A4 일괄 인쇄 (' + list.length + '건)</button>' +
      "</div>" +
    "</div>" +
    claimsPanelHTML() +
    idleBarHTML(idle) +
    '<div class="stat-grid">' +
      '<div class="stat"><div class="k">발주 건수</div><div class="v">' + list.length + "<small>건</small></div></div>" +
      '<div class="stat"><div class="k">출고 예정 금액</div><div class="v">' + won(amount) + "<small>원</small></div></div>" +
      '<div class="stat ' + (pending.length ? "warn" : "ok") + '"><div class="k">단가확정 대기</div><div class="v">' + pending.length + "<small>건</small></div></div>" +
      '<div class="stat"><div class="k">거래처</div><div class="v">' + new Set(list.map(function (o) { return o.clientId; })).size + "<small>곳</small></div></div>" +
    "</div>" +
    (pending.length ? '<div class="notice"><span class="ni">!</span><div><b>' + pending.length + "건이 참고가로 접수되어 있습니다.</b> 아침 7시에 단가를 확정하면 금액이 자동으로 다시 계산됩니다. <button class=\"btn btn-xs\" data-act=\"adm-tab\" data-tab=\"prices\" style=\"margin-left:4px\">단가 확정하러 가기 →</button></div></div>" : "") +
    groups;
}

function priceDraftFor(ymd) {
  if (!ui.priceDraft[ymd]) {
    var d = dayInfo(ymd), out = {};
    state.products.forEach(function (p) {
      out[p.id] = (d && d.confirmed && d.prices && d.prices[p.id] != null) ? Number(d.prices[p.id]) : Number(p.ref);
    });
    ui.priceDraft[ymd] = out;
  }
  return ui.priceDraft[ymd];
}

/* ── 품목 추가 폼 (사장님이 품목을 직접 늘린다) ────── */
function newProductFormHTML() {
  var f = ui.prodForm || {};
  var cat = CAT_KEYS.indexOf(f.cat) >= 0 ? f.cat : "veg";
  var unit = f.unitLabel || "1박스";
  return '<div class="settings-card" id="prodForm">' +
    '<h3>➕ 새 품목 추가</h3>' +
    '<div class="fields">' +
      '<div class="field"><label for="npBase">품목명</label><input id="npBase" data-np="base" value="' + esc(f.base || "") + '" placeholder="예: 깻잎 / 참외"></div>' +
      '<div class="field"><label for="npCat">분류</label><select id="npCat" data-np="cat">' +
        CATS.filter(function (c) { return c.key !== "all"; }).map(function (c) {
          return '<option value="' + c.key + '"' + (c.key === cat ? " selected" : "") + '>' + esc(c.label) + "</option>";
        }).join("") + "</select></div>" +
      '<div class="field"><label for="npGrade">등급 (선택)</label><select id="npGrade" data-np="grade">' +
        ["", "특", "상"].map(function (g) {
          return '<option value="' + g + '"' + ((f.grade || "") === g ? " selected" : "") + '>' + (g || "없음") + "</option>";
        }).join("") + "</select></div>" +
      '<div class="field"><label for="npUnit">단위</label><select id="npUnit" data-np="unitLabel">' +
        UNIT_OPTIONS.map(function (u) {
          return '<option value="' + u + '"' + (unit === u ? " selected" : "") + '>' + u + "</option>";
        }).join("") + "</select></div>" +
      '<div class="field"><label for="npPrice">오늘 단가 (원)</label><input id="npPrice" data-np="price" inputmode="numeric" value="' + esc(f.price || "") + '" placeholder="예: 2800"></div>' +
      '<div class="field"><label for="npStock">재고</label><input id="npStock" data-np="stock" inputmode="numeric" value="' + esc(f.stock || "") + '" placeholder="예: 20"></div>' +
    "</div>" +
    '<div class="row" style="margin-top:11px;gap:8px;flex-wrap:wrap">' +
      '<button class="btn btn-primary btn-sm" style="flex:0 0 auto" data-act="prod-add">품목 추가</button>' +
      '<button class="btn btn-ghost btn-sm" style="flex:0 0 auto" data-act="prod-form-close">취소</button>' +
      '<span class="tiny muted" style="flex:1 1 140px">추가한 품목은 손님 단가표에 바로 나옵니다.</span>' +
    "</div>" +
    "</div>";
}

/* ── 영수증 / 단가 일괄 입력 ───────────────────────── */
function bulkPanelHTML(ymd) {
  var f = ui.bulkFile;
  var res = ui.bulkResult;
  var resultHTML = "";
  if (res && res.ymd === ymd) {
    resultHTML =
      (res.applied.length
        ? '<div class="bulk-res"><div class="bulk-res-h"><b>✓ ' + res.applied.length + '개 품목에 적용</b>' +
            '<span class="tiny muted">아래 <b>단가 일괄 확정</b>을 누르면 손님 화면에 반영됩니다</span></div>' +
            res.applied.map(function (r) {
              return '<div class="bulk-line"><span class="bl-n">' + esc(r.name) + "</span>" +
                "<span class=\"bl-p\">" + won(r.price) + "원</span>" +
                "<span class=\"bl-raw\">‘" + esc(r.raw) + "’" + (r.candidates > 1 ? " · 후보 " + r.candidates + "개 중 1개" : "") + "</span></div>";
            }).join("") + "</div>"
        : "") +
      (res.unmatched.length
        ? '<div class="bulk-res warn"><div class="bulk-res-h"><b>? ' + res.unmatched.length + '줄은 없는 품목입니다</b>' +
            '<span class="tiny muted">새 품목으로 추가하면 단가가 함께 들어갑니다</span></div>' +
            res.unmatched.map(function (r, i) {
              return '<div class="bulk-line"><span class="bl-n">' + esc(r.name) + "</span>" +
                "<span class=\"bl-p\">" + won(r.price) + "원</span>" +
                '<button class="btn btn-xs" data-act="bulk-add" data-idx="' + i + '">＋ 새 품목으로 추가</button></div>';
            }).join("") + "</div>"
        : "") +
      (res.noPrice.length
        ? '<div class="bulk-res warn"><div class="bulk-res-h"><b>!' + " 가격을 못 읽은 줄 " + res.noPrice.length + "개</b>" +
            '<span class="tiny muted">‘품목 가격’ 순서로 한 줄에 하나씩 넣어 주세요</span></div>' +
            res.noPrice.map(function (r) {
              return '<div class="bulk-line"><span class="bl-n">' + esc(r.raw) + "</span></div>";
            }).join("") + "</div>"
        : "") +
      (!res.applied.length && !res.unmatched.length && !res.noPrice.length
        ? '<div class="notice" style="margin:0"><span class="ni">!</span><div>붙여넣은 줄이 없습니다. 예) <b>대파 2800</b> 처럼 한 줄에 하나씩 넣어 주세요.</div></div>'
        : "");
  }

  return '<div class="bulk-card" id="bulkPanel">' +
    "<h3>🧾 영수증 / 단가 일괄 입력</h3>" +
    '<p class="bulk-lead">영수증 사진을 올려 두고, <b>한 줄에 품목·가격</b>을 붙여넣은 뒤 <b>단가 일괄 적용</b>을 누르면 아래 확정가 칸이 한꺼번에 채워집니다.</p>' +
    '<div class="bulk-grid">' +
      '<div class="bulk-photo">' +
        '<label class="bulk-file-btn" for="bulkFile">📷 영수증 사진 첨부</label>' +
        '<input type="file" id="bulkFile" data-act="bulk-file" accept="image/*,application/pdf" class="bulk-file-input">' +
        '<div class="biz-file-box" id="bulkFileBox">' +
          (f && f.name ? '<div class="tiny"><b>' + esc(f.name) + "</b>" + (f.size ? " · " + Math.max(1, Math.round(f.size / 1024)) + "KB" : "") + "</div>" : "") +
          (f && f.dataUrl ? '<div class="biz-prev"><img src="' + f.dataUrl + '" alt="영수증 사진 미리보기"></div>' : "") +
          (f ? "" : "<span>사진은 확인용입니다 (단가는 아래 칸에 붙여넣기)</span>") +
        "</div>" +
      "</div>" +
      '<div class="bulk-text">' +
        '<label for="bulkText" class="bulk-label">단가 붙여넣기</label>' +
        '<textarea id="bulkText" data-act="bulk-text" rows="4" placeholder="' +
          esc("대파 2800\n양파 18500\n청양고추 특 32000") + '">' + esc(ui.bulkText || "") + "</textarea>" +
        '<div class="row" style="gap:6px;margin-top:7px;flex-wrap:wrap">' +
          '<button class="btn btn-primary btn-sm" data-act="bulk-apply" data-ymd="' + ymd + '">단가 일괄 적용</button>' +
          '<button class="btn btn-ghost btn-sm" data-act="bulk-clear">칸 비우기</button>' +
        "</div>" +
      "</div>" +
    "</div>" +
    resultHTML +
    '<div class="notice" style="margin:10px 0 0"><span class="ni">!</span><div>실제 거래처 폰까지 <b>실시간 동기화</b>하려면 서버 DB 연동이 필요합니다 <span class="muted">(현재는 같은 브라우저 테스트)</span>.</div></div>' +
    "</div>";
}

/* ── 매입가 · 예상 마진 (사장님만 · 손님 화면엔 없음) ── */
function marginBoxHTML(p, sellPrice) {
  var m = marginOf(p, sellPrice);
  if (!m.costKnown) return '<span class="mm-lb">예상 마진</span><b class="mm-v none">매입가를 넣으면 계산됩니다</b>';
  return '<span class="mm-lb">예상 마진</span>' +
    '<b class="mm-v' + (m.margin < 0 ? " neg" : (m.margin > 0 ? " pos" : "")) + '">' +
      (m.margin < 0 ? "−" : "+") + won(Math.abs(m.margin)) + "원 · " + (m.rate < 0 ? "−" : "") + Math.abs(m.rate) + "%</b>";
}
function updateMarginBox(p, row) {
  if (!p || !row) return;
  var box = row.querySelector('[data-margin="' + p.id + '"]');
  if (!box) return;
  var sellInp = row.querySelector('input[data-act="draft"]');
  var sell = sellInp ? Number(digits(sellInp.value)) : p.ref;
  box.innerHTML = marginBoxHTML(p, sell);
  box.className = "pm-margin" + (Number(p.cost) > 0 && sell - Number(p.cost) < 0 ? " neg" : "");
}

/* ── 품목 한 줄 — 가격·재고·품절·삭제 ──────────────── */
function productManageHTML(p, draft, fixed) {
  var d = draft[p.id] != null ? draft[p.id] : p.ref;
  var diff = Number(d) - Number(p.ref);
  var out = p.soldOut || p.stock <= 0;
  return '<div class="pm-row' + (out ? " out" : "") + '" data-pid="' + p.id + '">' +
    '<div class="pm-h">' +
      '<span class="pm-emoji" aria-hidden="true">' + p.emoji + "</span>" +
      '<div class="grow">' +
        '<div class="pm-nm">' + esc(p.base || p.name) +
          '<span class="p-badge' + (p.grade ? " has-grade" : "") + '">' +
            (p.grade ? "<b>" + esc(p.grade) + "</b> · " : "") + esc(unitLabelOf(p)) + "</span>" +
        "</div>" +
        '<div class="pm-meta">' + esc(catLabel(p.cat)) + " · 재고 " + p.stock +
          (p.soldOut ? ' · <b class="st-out">품절</b>' : "") +
          (diff ? ' · 참고가 대비 <b style="color:' + (diff > 0 ? "var(--red)" : "var(--blue)") + '">' +
            (diff > 0 ? "+" : "−") + won(Math.abs(diff)) + "</b>" : "") +
        "</div>" +
      "</div>" +
      '<button class="btn btn-xs btn-ghost pm-del" data-act="prod-delete" data-pid="' + p.id + '">삭제</button>' +
    "</div>" +
    '<div class="pm-f">' +
      '<label class="pm-fld"><span>참고가</span>' +
        '<input type="number" inputmode="numeric" data-act="ref" data-pid="' + p.id + '" value="' + p.ref + '" aria-label="' + esc(p.name) + ' 참고가"></label>' +
      '<label class="pm-fld"><span>확정가</span>' +
        '<input type="number" inputmode="numeric" data-act="draft" data-pid="' + p.id + '" value="' + d + '"' + (fixed ? " disabled" : "") + ' aria-label="' + esc(p.name) + ' 확정가"></label>' +
      '<label class="pm-fld"><span>재고</span>' +
        '<input type="number" inputmode="numeric" data-act="stock" data-pid="' + p.id + '" value="' + p.stock + '" aria-label="' + esc(p.name) + ' 재고"></label>' +
      '<button class="pm-out' + (p.soldOut ? " on" : "") + '" data-act="prod-soldout" data-pid="' + p.id + '">' +
        (p.soldOut ? "판매 재개" : "품절") + "</button>" +
    "</div>" +
    '<div class="pm-cost">' +
      '<label class="pm-fld"><span>매입가 (원)</span>' +
        '<input type="number" inputmode="numeric" data-act="cost" data-pid="' + p.id + '" value="' + (Number(p.cost) || 0) + '" aria-label="' + esc(p.name) + ' 매입가"></label>' +
      '<div class="pm-margin' + (Number(p.cost) > 0 && Number(d) - Number(p.cost) < 0 ? " neg" : "") + '" data-margin="' + p.id + '">' +
        marginBoxHTML(p, d) + "</div>" +
    "</div>" +
    (out ? '<div class="pm-sub-row"><span class="sub-lb">품절 대체품</span>' +
      '<b class="sub-now">' + esc(substituteOf(p) ? "손님 화면 추천: " + substituteOf(p).name : "추천할 품목 없음") + "</b>" +
      '<button class="btn btn-xs" data-act="sub-open" data-pid="' + p.id + '">대체품 지정</button></div>' : "") +
    "</div>";
}
/** 품절 품목의 대체품을 고르는 모달 — 자동 추천 또는 직접 지정 */
function openSubstitute(pid) {
  var p = findProduct(pid);
  if (!p) return;
  var auto = substituteOf(p);
  var rows = state.products.filter(function (x) { return x.id !== p.id; }).map(function (x) {
    var on = p.sub === x.id;
    var out = x.soldOut || x.stock <= 0;
    return '<button class="sub-opt' + (on ? " on" : "") + '" data-act="sub-set" data-pid="' + p.id + '" data-sub="' + x.id + '" aria-pressed="' + on + '">' +
      '<span class="so-b" aria-hidden="true">' + (on ? "✓" : "") + "</span>" +
      '<span class="grow"><b>' + esc(x.name) + '</b><small>' + (out ? "품절" : "재고 " + x.stock) + " · " + won(x.ref) + "원</small></span>" +
      "</button>";
  }).join("");
  openModal(
    '<div class="m-head"><h2 id="modalTitle">품절 대체품 · ' + esc(p.name) + '</h2><button class="icon-btn" data-act="modal-close" aria-label="닫기">✕</button></div>' +
    '<div class="m-body">' +
      '<div class="notice green"><span class="ni">🔄</span><div>손님 화면에서 이 품목이 품절이면 <b>대체 추천</b>과 <b>＋ 담기</b> 버튼이 뜹니다. 비워 두면 같은 품목·분류에서 자동으로 고릅니다.</div></div>' +
      '<button class="sub-opt' + (!p.sub ? " on" : "") + '" data-act="sub-set" data-pid="' + p.id + '" data-sub="" aria-pressed="' + (!p.sub) + '">' +
        '<span class="so-b" aria-hidden="true">' + (!p.sub ? "✓" : "") + "</span>" +
        '<span class="grow"><b>자동 추천</b><small>' + (auto ? "지금 추천: " + esc(auto.name) : "추천 품목 없음") + "</small></span></button>" +
      '<div class="sub-opts">' + rows + "</div>" +
    "</div>" +
    '<div class="m-foot"><button class="btn btn-primary" data-act="modal-close">닫기</button></div>'
  );
}

function renderAdminPrices() {
  var t = todayYmd();
  var ymd = ui.priceDate || addDays(t, 1);
  ui.priceDate = ymd;
  var draft = priceDraftFor(ymd);
  var fixed = isDayConfirmed(ymd);
  var pending = state.orders.filter(function (o) { return o.ymd === ymd && !o.priceConfirmed && o.status !== STATUS.CANCELED; });
  var pendSum = pending.reduce(function (s, o) { return s + o.total; }, 0);
  var outCount = state.products.filter(function (p) { return p.soldOut || p.stock <= 0; }).length;

  var rows = state.products.map(function (p) { return productManageHTML(p, draft, fixed); }).join("");

  $("#admPrices").innerHTML =
    '<div class="panel-head">' +
      '<div class="datechips">' +
        [t, addDays(t, 1), addDays(t, 2)].map(function (x) {
          return '<button class="dchip" data-act="price-date" data-ymd="' + x + '" aria-pressed="' + (x === ymd) + '">' + dayLabel(x) + " " + fmtShort(x) + "</button>";
        }).join("") +
      "</div>" +
      '<span class="badge ' + (fixed ? "ok" : "pending") + '">' + (fixed ? "확정 완료" : "확정 전") + "</span>" +
    "</div>" +

    bulkPanelHTML(ymd) +

    '<div class="panel-head" style="margin-top:2px" id="prodMgrHead">' +
      '<h2 style="font-size:15px">품목·단가 관리 <span class="badge">' + state.products.length + "종</span>" +
        (outCount ? ' <span class="badge pending">품절 ' + outCount + "</span>" : "") + "</h2>" +
      '<button class="btn btn-sm btn-primary" data-act="prod-form-open">＋ 새 품목 추가</button>' +
    "</div>" +

    (ui.prodForm ? newProductFormHTML() : "") +

    '<div class="pm-list">' + rows + "</div>" +

    '<div class="notice"><span class="ni">!</span><div><b>' + fmtDotDow(ymd) + " 아침 7시 단가 확정.</b> 참고가는 전일 단가이고, 확정가를 넣은 뒤 아래 버튼을 누르면 <b>이 날짜의 미확정 발주 " + pending.length + "건</b>이 새 단가로 다시 계산됩니다.</div></div>" +
    '<div class="price-summary"><span>미확정 발주 <b>' + pending.length + "건</b></span><span>현재 참고가 합계 <b>" + won(pendSum) + "원</b></span></div>" +
    (fixed
      ? '<div class="notice green"><span class="ni ok">✓</span><div><b>' + fmtDotDow(ymd) + " 단가는 확정되었습니다.</b> " + stampLabel((dayInfo(ymd) || {}).confirmedAt) + " 확정 · 단가를 다시 바꾸려면 아래 <b>확정 취소</b> 후 다시 확정하세요.</div></div>" +
        '<button class="btn btn-ghost btn-block" data-act="price-unconfirm" data-ymd="' + ymd + '">확정 취소 (다시 계산)</button>'
      : '<button class="btn btn-primary btn-block" style="height:50px;font-size:16px" data-act="price-confirm" data-ymd="' + ymd + '">아침 7시 단가 일괄 확정</button>') +
    (pending.length ? '<div class="card tight"><h3 style="font-size:13px;margin-bottom:8px">확정 대기 발주</h3>' +
      pending.map(function (o) {
        var cl = getClient(o.clientId);
        return '<div class="row between" style="padding:6px 0;border-bottom:1px solid var(--line)">' +
          '<div><b style="font-size:13px">' + esc(cl.name) + '</b><div class="tiny muted">' + o.no + " · " + roundByKey(o.round).label + "</div></div>" +
          '<div style="text-align:right"><b>' + won(o.total) + "원</b><div class=\"tiny muted\">참고가</div></div></div>";
      }).join("") + "</div>" : "");
}

function bizFileThumb(file) {
  if (file && file.dataUrl) {
    return '<img class="biz-thumb" src="' + file.dataUrl + '" alt="사업자등록증 사본 미리보기">';
  }
  return '<div class="biz-thumb ph" aria-hidden="true">📄</div>';
}
function bizFileMeta(file) {
  if (!file || !file.name) return "첨부 없음";
  var kb = file.size ? " · " + Math.max(1, Math.round(file.size / 1024)) + "KB" : "";
  return file.name + kb;
}

function renderAdminClients() {
  var q = (ui.clientQuery || "").trim();
  var idle = idleClients(3);
  var ym = ui.month || thisMonth();
  var pending = state.clients.filter(function (c) { return c.status === CLIENT.PENDING; });
  var list = state.clients.filter(function (c) {
    if (c.status !== CLIENT.APPROVED) return false;
    return !q || c.name.indexOf(q) >= 0 || (c.phone || "").indexOf(q) >= 0;
  });
  var approvedAll = state.clients.filter(function (c) { return c.status === CLIENT.APPROVED; });
  var totalDue = approvedAll.reduce(function (s, c) { return s + buildLedger(c.id).balance; }, 0);

  var approveHTML = pending.length ? (
    '<div class="approve-wrap">' +
      '<div class="row between" style="margin:2px 0 8px"><h2 style="font-size:15px">가입 승인 대기 <span class="badge pending">' + pending.length + "곳</span></h2>" +
        '<span class="tiny muted">확인 후 승인 (OK)</span></div>' +
      pending.map(function (c) {
        return '<div class="approve-card" data-cid="' + c.id + '">' +
          '<div class="ac-top">' +
            '<div><div class="cc-name">' + esc(c.name) + ' <span class="badge pending">' + esc(CLIENT_LABEL[c.status] || "승인 대기") + "</span></div>" +
            '<div class="cc-sub">' + esc(c.owner || "-") + " · " + esc(c.phone || "-") +
              (c.uptae || c.jongmok ? " · " + esc(c.uptae || "-") + "/" + esc(c.jongmok || "-") : "") + "</div></div>" +
          "</div>" +
          '<div class="ac-rows">' +
            "<div><span>사업자등록번호</span><b>" + esc(c.bizNo || "-") + "</b></div>" +
            "<div><span>배달 주소</span><b>" + esc(c.addr || "-") + "</b></div>" +
            "<div><span>신청</span><b>" + stampLabel(c.signupAt) + "</b></div>" +
          "</div>" +
          (c.bizFile
            ? '<div class="ac-file">' + bizFileThumb(c.bizFile) +
                '<div class="grow"><div class="tiny"><b>사업자등록증 사본</b></div><div class="tiny muted">' + esc(bizFileMeta(c.bizFile)) + "</div></div>" +
                '<button class="btn btn-sm" data-act="bizfile-view" data-cid="' + c.id + '">보기</button>' +
              "</div>"
            : '<div class="ac-file">' + '<div class="biz-thumb ph" aria-hidden="true">🙂</div>' +
                '<div class="grow"><div class="tiny"><b>사업자등록증 없음 · 간편 가입</b></div>' +
                '<div class="tiny muted">상호·담당자·전화·배달 주소만 받았습니다. 확인 후 승인하면 바로 발주할 수 있어요.</div></div>' +
              "</div>") +
          '<div class="acts" style="margin-top:10px">' +
            '<button class="btn btn-sm btn-primary" data-act="client-approve" data-cid="' + c.id + '">' +
              (c.bizFile ? "사업자등록증 확인 · 승인" : "승인 (OK)") + "</button>" +
            '<button class="btn btn-sm btn-ghost" data-act="client-reject" data-cid="' + c.id + '">반려</button>' +
          "</div>" +
        "</div>";
      }).join("") +
    "</div>"
  ) : "";

  $("#admClients").innerHTML =
    monthSettleCardHTML(ym) +
    idlePanelHTML(idle) +
    '<div class="stat-grid">' +
      '<div class="stat"><div class="k">거래처</div><div class="v">' + approvedAll.length + "<small>곳</small></div></div>" +
      '<div class="stat warn"><div class="k">미수금 합계</div><div class="v">' + won(totalDue) + "<small>원</small></div></div>" +
      '<div class="stat ' + (pending.length ? "warn" : "ok") + '"><div class="k">가입 승인 대기</div><div class="v">' + pending.length + "<small>곳</small></div></div>" +
    "</div>" +
    '<p class="tiny muted" style="margin-top:8px">거래처는 <b>사업자등록증 없이 간편 가입</b>할 수 있고, 사장님이 확인해 <b>승인 (OK)</b>을 누르면 그때부터 발주할 수 있습니다.<br>' +
    '<b>거래처 등급</b>으로 외상 기한을 정합니다 — <b>일반(1일) · 우수(7일) · VIP·호텔·식장(15일)</b>. 기한이 지난 미수가 있을 때만 발주가 막히고, 10만 원 이상 즉시결제는 일반 등급에만 적용됩니다. 등급은 <b>손님 화면에 보이지 않습니다</b>.<br>' +
    '손님 화면(index.html)에는 <b>이 거래처 목록이 보이지 않습니다</b>. 특정 가게로 손님 화면을 확인하려면 <b>손님 화면으로 보기</b>를 누르세요.</p>' +
    approveHTML +
    '<div class="field" style="margin-top:12px"><input id="clientSearch" data-act="client-search" value="' + esc(q) + '" placeholder="거래처 이름·연락처 검색"></div>' +
    (list.length ? list.map(function (c) {
      var s = clientSummary(c.id);
      var g = s.gate;
      return '<div class="client-card" data-cid="' + c.id + '">' +
        '<div class="cc-top"><div><div class="cc-name">' + esc(c.name) +
          ' <span class="badge tier">' + esc(s.tier.short) + '</span>' +
          (specialPriceCount(c.id) ? ' <span class="badge ok">특별단가 ' + specialPriceCount(c.id) + "</span>" : "") +
          '</div><div class="cc-sub">' + esc(c.owner || "-") + " · " + esc(c.phone || "-") + " · " + esc(c.memo || "") + "</div></div>" +
          '<span class="badge ' + (s.balance > 0 ? "pending" : "ok") + '">' + (s.balance > 0 ? "미수" : "완납") + "</span></div>" +
        '<div class="cc-money">' +
          "<div>기초 미수<b>" + won(s.base) + "</b></div>" +
          "<div>출고액<b>" + won(s.totalOut) + "</b></div>" +
          '<div class="due">잔액<b>' + won(s.balance) + "</b></div>" +
        "</div>" +
        '<div class="tier-sel"><label for="tier-' + c.id + '">거래처 등급 (손님 화면엔 안 보임)</label>' +
          '<select id="tier-' + c.id + '" data-act="client-tier" data-cid="' + c.id + '">' +
            TIERS.map(function (t) {
              return '<option value="' + t.key + '"' + (t.key === s.tier.key ? " selected" : "") + '>' + esc(t.short) + "</option>";
            }).join("") +
          "</select></div>" +
        '<div class="cc-gate ' + (g.blocked ? "warn" : "ok") + '">' +
          (g.blocked
            ? "🔒 " + esc(g.msg)
            : (s.balance > 0
              ? "✓ 발주 가능 · 미수 " + won(s.balance) + "원은 기한 안" + (s.nextDue ? " (" + fmtShort(s.nextDue) + "까지)" : "")
              : "✓ 발주 가능 (미수 잔액 0원)")) +
        "</div>" +
        (s.aging.overdue
          ? '<div class="tiny" style="margin-top:6px;color:var(--red)">연체 <b>' + won(s.aging.overdue) + "원</b> · 기한 안 " + won(s.aging.due) + "원</div>"
          : (s.aging.due ? '<div class="tiny" style="margin-top:6px;color:var(--muted)">기한 안 미수 <b>' + won(s.aging.due) + "원</b> · 연체 없음</div>" : "")) +
        (s.immediatePending ? '<div class="tiny" style="margin-top:6px;color:var(--blue)">즉시결제 입금확인 대기 <b>' + won(s.immediatePending) + "원</b></div>" : "") +
        '<div class="acts" style="margin-top:10px">' +
          (s.balance > 0 ? '<button class="btn btn-sm btn-primary" data-act="pay-full" data-cid="' + c.id + '">전액 입금</button>' : "") +
          '<button class="btn btn-sm" data-act="settle-copy" data-cid="' + c.id + '">📋 정산 안내 복사</button>' +
          '<button class="btn btn-sm" data-act="payment-open" data-cid="' + c.id + '">입금 기록</button>' +
          '<button class="btn btn-sm btn-ghost" data-act="special-open" data-cid="' + c.id + '">특별 단가' + (specialPriceCount(c.id) ? " " + specialPriceCount(c.id) : "") + '</button>' +
          '<button class="btn btn-sm btn-ghost" data-act="client-edit" data-cid="' + c.id + '">거래처 정보</button>' +
          '<button class="btn btn-sm btn-ghost" data-act="client-stmt" data-cid="' + c.id + '">전표 보기</button>' +
          '<button class="btn btn-sm btn-ghost" data-act="client-view" data-cid="' + c.id + '">손님 화면으로 보기</button>' +
        "</div>" +
        (s.pendingCount ? '<div class="tiny" style="margin-top:8px;color:var(--amber)">단가확정 대기 ' + s.pendingCount + "건 · " + won(s.pendingAmount) + "원</div>" : "") +
        "</div>";
    }).join("") : '<div class="empty"><div class="ei">◇</div><b>검색 결과가 없습니다</b></div>');
}

function renderAdminRestock() {
  var list = state.alerts.slice().sort(function (a, b) { return a.status === b.status ? 0 : (a.status === "WAIT" ? -1 : 1); });
  $("#admRestock").innerHTML =
    '<div class="panel-head"><h2>재입고 알림</h2><span class="small">대기 ' + openAlerts().length + "건</span></div>" +
    (list.length ? list.map(function (a) {
      return '<div class="alert-card">' +
        '<div class="al-top"><div><div class="al-items">' + esc(a.itemNames.join(", ")) + "</div>" +
          '<div class="al-sub">' + esc(a.clientName) + " · " + esc(a.phone) + " · " + stampLabel(a.createdAt) + "</div></div>" +
          '<span class="badge ' + (a.status === "WAIT" ? "pending" : "done") + '">' + (a.status === "WAIT" ? "대기" : "처리 완료") + "</span></div>" +
        (a.memo ? '<div class="tiny" style="margin-top:6px">' + esc(a.memo) + "</div>" : "") +
        (a.status === "WAIT" ? '<div class="acts" style="margin-top:9px"><button class="btn btn-sm btn-primary" data-act="alert-done" data-id="' + a.id + '">처리 완료</button></div>' : "") +
        "</div>";
    }).join("") : '<div class="empty"><div class="ei">!</div><b>재입고 알림이 없습니다</b></div>');
}

function renderAdminSettings() {
  var s = state.store, p = state.policy, acc = accountText();
  $("#admSettings").innerHTML =
    '<div class="settings-card">' +
      "<h3>🏢 사업자 정보 <span class=\"small\" style=\"font-weight:500\">— 거래명세표 공급자란</span></h3>" +
      '<div class="datechips" style="margin-bottom:10px">' +
        Object.keys(STORE_PRESETS).map(function (k) {
          return '<button class="dchip" data-act="preset" data-key="' + k + '">' + esc(STORE_PRESETS[k].label) + "</button>";
        }).join("") +
      "</div>" +
      '<div class="fields">' +
        '<div class="field"><label>상호(법인명)</label><input data-store="name" value="' + esc(s.name) + '"></div>' +
        '<div class="field"><label>성명(대표자)</label><input data-store="owner" value="' + esc(s.owner) + '"></div>' +
        '<div class="field"><label>사업자등록번호</label><input data-store="bizNo" inputmode="numeric" value="' + esc(s.bizNo) + '"></div>' +
        '<div class="field"><label>사업장 주소</label><input data-store="addr" value="' + esc(s.addr) + '"></div>' +
        '<div class="field"><label>업태</label><input data-store="uptae" value="' + esc(s.uptae) + '"></div>' +
        '<div class="field"><label>종목</label><input data-store="jongmok" value="' + esc(s.jongmok) + '"></div>' +
        '<div class="field"><label>과세 유형</label><input data-store="taxType" value="' + esc(s.taxType) + '"></div>' +
        '<div class="field"><label>매장 전화번호 (전표 상단)</label><input data-store="phone" value="' + esc(s.phone) + '"></div>' +
      "</div>" +
    "</div>" +

    '<div class="settings-card">' +
      "<h3>🏦 입금 계좌</h3>" +
      '<div class="fields">' +
        '<div class="field"><label>은행</label><input data-store="bank" value="' + esc(s.bank) + '" placeholder="예: 농협"></div>' +
        '<div class="field"><label>계좌번호</label><input data-store="account" inputmode="numeric" value="' + esc(s.account) + '" placeholder="예: 351-5306-3519-83"></div>' +
        '<div class="field"><label>예금주</label><input data-store="holder" value="' + esc(s.holder) + '" placeholder="예: 김영헌"></div>' +
      "</div>" +
      '<div class="notice" style="margin-top:10px"><span class="ni' + (acc.ok ? " ok" : "") + '">' + (acc.ok ? "✓" : "!") + "</span><div>전표 하단 표시: <b>" + esc(acc.text) + "</b></div></div>" +
      '<div class="settings-note">계좌를 입력하면 모든 거래명세표(공급받는자용·공급자용) 하단에 바로 반영됩니다.</div>' +
    "</div>" +

    '<div class="settings-card">' +
      "<h3>🚚 배달 정책</h3>" +
      '<div class="fields">' +
        '<div class="field"><label>최소 주문 금액 (원)</label><input data-policy="minOrder" inputmode="numeric" value="' + p.minOrder + '"></div>' +
        '<div class="field"><label>원주 시내 배송비 (원 · 0이면 무료)</label><input data-policy="shipFee" inputmode="numeric" value="' + p.shipFee + '"></div>' +
        '<div class="field"><label>배달 지역</label><input data-policy="area" value="' + esc(p.area) + '"></div>' +
      "</div>" +
      '<div class="settings-note">최소 주문 ' + won(p.minOrder) + "원 미만이면 발주 버튼이 잠깁니다. 배송비 0원이면 원주 시내권 무료배송입니다. 배달 회차는 1차 08:00 · 2차 11:00 · 3차 13:00~14:00 (각 30분 전 마감)으로 고정되어 있습니다.</div>" +
    "</div>" +

    '<button class="btn btn-primary btn-block" style="height:48px" data-act="settings-save">설정 저장</button>';
}

/* ══════════════ 1. 회차별 상차·피킹표 ══════════════ */
function openPickSheet(ymd, round) {
  ui.pick = { ymd: ymd || ui.admDate || todayYmd(), round: round || "" };
  renderPickModal();
}
function renderPickModal() {
  var r = ui.pick || { ymd: ui.admDate || todayYmd(), round: "" };
  var sheet = pickSheet(r.ymd, r.round);
  var tabs = [{ key:"", label:"전체" }].concat(state.rounds.map(function (x) { return { key:x.key, label:x.label }; }));
  var rows = sheet.rows.length ? sheet.rows.map(function (row) {
    var us = String(row.unit || "").replace(/^[0-9]+/, "") || "개";
    return '<div class="pk-row" data-pk="' + esc(row.pid) + '">' +
      '<div class="pk-nm">' + row.emoji + " <b>" + esc(row.base) + "</b>" +
        (row.grade ? " (" + esc(row.grade) + ")" : "") +
        (row.unit ? ' <span class="pk-u">' + esc(row.unit) + "</span>" : "") + "</div>" +
      '<div class="pk-q"><b>' + row.total + "</b><span>" + esc(us) + "</span></div>" +
      '<div class="pk-who">' + row.clients.map(function (c) { return esc(c.name) + " " + c.qty; }).join(" · ") + "</div>" +
    "</div>";
  }).join("") : '<div class="empty" style="padding:16px"><b>이 회차에 실을 주문이 없습니다</b></div>';
  openModal(
    '<div class="m-head"><h2 id="modalTitle">상차 피킹표</h2><button class="icon-btn" data-act="modal-close" aria-label="닫기">✕</button></div>' +
    '<div class="m-body">' +
      '<div class="datechips" style="margin-bottom:9px" id="pickTabs">' + tabs.map(function (t) {
        return '<button class="dchip" data-act="pick-tab" data-round="' + t.key + '" aria-pressed="' + (r.round === t.key) + '">' + esc(t.label) + "</button>";
      }).join("") + "</div>" +
      '<p class="small" style="margin-bottom:8px"><b>' + fmtDotDow(sheet.ymd) + " " + esc(sheet.label) + " 배달" +
        (sheet.dispatch ? " · " + esc(sheet.dispatch) + " 출발" : "") + "</b> · 거래처 " + sheet.clients.length +
        "곳 · " + sheet.rows.length + "품목 · 총 " + sheet.totalQty + "</p>" +
      '<div class="pk-list">' + rows + "</div>" +
      '<p class="tiny muted" style="margin-top:9px">품목별 총수량대로 먼저 모으고, 거래처별 수량대로 나눠 담으세요. A4로 인쇄해 들고 다닐 수 있습니다.</p>' +
    "</div>" +
    '<div class="m-foot"><button class="btn btn-ghost" data-act="modal-close">닫기</button>' +
      '<button class="btn btn-primary" data-act="pick-print" data-ymd="' + sheet.ymd + '" data-round="' + sheet.round + '">A4 인쇄</button></div>'
  );
}
function printPickSheet(ymd, round) {
  var sheet = pickSheet(ymd, round);
  if (!sheet.orderCount) { toast("인쇄할 주문이 없습니다."); return; }
  $("#printRoot").innerHTML = pickSheetHTML(sheet);
  window.print();
  closeModal();
  toast(fmtShort(ymd) + " " + sheet.label + " 상차 피킹표 — " + sheet.rows.length + "품목 · 총 " + sheet.totalQty + "개");
}

/* ══════════════ 3. 월말 정산 · CSV ══════════════ */
/** 손님 거래명세표 탭 — 내 이번 달 정산 (내 것만) */
function monthCardHTML(cid, opts) {
  opts = opts || {};
  var month = opts.ym || thisMonth();
  var st = monthStat(cid, month);
  return '<div class="month-card" id="monthCard">' +
    '<div class="mc-head"><b>이번 달 정산 <span>' + monthLabel(month) + '</span></b>' +
      '<button class="btn btn-xs" data-act="month-csv-client" data-cid="' + cid + '" data-ym="' + month + '">CSV 다운로드</button></div>' +
    '<div class="mc-nums">' +
      '<div><i>출고액</i><b>' + won(st.out) + '</b></div>' +
      '<div><i>반품차감</i><b class="minus">' + (st.claim > 0 ? "−" : "") + won(st.claim) + '</b></div>' +
      '<div><i>입금액</i><b>' + won(st.paid) + '</b></div>' +
      '<div class="bal"><i>잔액</i><b>' + won(st.balance) + '</b></div>' +
    '</div>' +
    '<div class="mc-foot">출고 ' + st.count + '건 · ' + monthLabel(month) + ' 기준 (미수 잔액은 그대로 유지)</div>' +
  '</div>';
}
/** 사장님 거래처·미수 탭 — 거래처별 월말 정산 + CSV + A4 인쇄 */
function monthSettleCardHTML(ym) {
  var month = ym || thisMonth();
  var rows = monthRows(month), T = monthTotals(month);
  var list = rows.length ? rows.map(function (r) {
    return '<div class="ms-line" data-ms="' + r.cid + '">' +
      '<div class="ms-nm"><b>' + esc(r.name) + '</b><span>출고 ' + r.count + '건</span></div>' +
      '<div class="ms-nums">' +
        '<span>출고 <b>' + won(r.out) + '</b></span>' +
        '<span>반품 <b class="minus">' + (r.claim > 0 ? "−" : "") + won(r.claim) + '</b></span>' +
        '<span>입금 <b>' + won(r.paid) + '</b></span>' +
        '<span class="bal">잔액 <b>' + won(r.balance) + '</b></span>' +
      '</div></div>';
  }).join("") : '<div class="tiny muted">이 달 출고 내역이 없습니다.</div>';
  return '<div class="month-card" id="monthSettle">' +
    '<div class="mc-head"><b>월말 정산 <span>' + monthLabel(month) + '</span></b>' +
      '<button class="btn btn-xs" data-act="month-csv" data-ym="' + month + '">CSV 다운로드</button>' +
      '<button class="btn btn-xs btn-ghost" data-act="month-print" data-ym="' + month + '">정산표 인쇄</button></div>' +
    '<div class="ms-total"><span>출고액 <b>' + won(T.out) + '</b></span><span>반품 <b>' + (T.claim > 0 ? "−" : "") + won(T.claim) + '</b></span>' +
      '<span>입금 <b>' + won(T.paid) + '</b></span><span>잔액 <b>' + won(T.balance) + '</b></span></div>' +
    '<div class="ms-list">' + list + '</div>' +
    '<p class="tiny muted" style="margin-top:8px">거래처별 이번 달 출고액 · 반품차감 · 입금액 · 잔액입니다. CSV는 엑셀에서 바로 열립니다.</p>' +
  '</div>';
}
function printMonthSettle(ym) {
  var month = ym || thisMonth();
  if (!monthRows(month).length) { toast("이 달 정산 내역이 없습니다."); return; }
  $("#printRoot").innerHTML = monthSheetHTML(month);
  window.print();
  toast(monthLabel(month) + " 월말 정산표를 인쇄합니다 (A4)");
}

/* ══════════════ 4. 정산 안내 복사 ══════════════ */
function openSettlementCopy(cid) {
  var cl = getClient(cid);
  var msg = settlementMessage(cid);
  var ok = copyText(msg);
  openModal(
    '<div class="m-head"><h2 id="modalTitle">정산 안내 복사</h2><button class="icon-btn" data-act="modal-close" aria-label="닫기">✕</button></div>' +
    '<div class="m-body">' +
      '<div class="notice green"><span class="ni">✓</span><div><b>' + (ok ? "클립보드에 복사했습니다." : "아래 문구를 길게 눌러 복사해 주세요.") +
        "</b> 카톡·문자에 그대로 붙여넣으면 됩니다.</div></div>" +
      '<div class="copy-box" id="copyBox">' + esc(msg) + "</div>" +
      '<p class="tiny muted" style="margin-top:9px">' + esc(cl.name) + " · 미수 잔액 <b>" + won(buildLedger(cid).balance) + "원</b>" +
        (digits(state.store.account) ? " · " + esc(state.store.bank + " " + state.store.account) : "") + "</p>" +
    "</div>" +
    '<div class="m-foot"><button class="btn btn-ghost" data-act="modal-close">닫기</button>' +
      '<button class="btn btn-primary" data-act="settle-copy-again" data-cid="' + cid + '">다시 복사</button></div>'
  );
  toast(ok ? "정산 안내 문구를 복사했습니다 — 카톡·문자에 붙여넣으세요."
           : "정산 안내 문구를 화면에 띄웠습니다 — 길게 눌러 복사하세요.");
}

/* ══════════════ 5. 단골 이탈(미발주) ══════════════ */
function idleBarHTML(idle) {
  if (!idle || !idle.length) return "";
  var names = idle.slice(0, 2).map(function (x) { return esc(x.client.name) + " " + x.days + "일"; }).join(" · ");
  return '<button class="idle-bar" data-act="idle-open">' +
    '<span class="ib-k">⚠️ 최근 미발주 <b>' + idle.length + "곳</b></span>" +
    '<span class="ib-nm">' + names + (idle.length > 2 ? " 외 " + (idle.length - 2) + "곳" : "") + "</span>" +
    '<span class="ib-go">보기 ›</span></button>';
}
function idlePanelHTML(idle) {
  if (!idle || !idle.length) return "";
  return '<div class="idle-panel" id="idlePanel">' +
    '<div class="row between" style="margin:0 0 7px"><b style="font-size:13.5px">⚠️ 최근 미발주 <span class="badge pending">' + idle.length + "곳</span></b>" +
      '<span class="tiny muted">3일 이상 발주 없음</span></div>' +
    idle.map(function (x) {
      return '<div class="idle-line"><div class="grow"><b>' + esc(x.client.name) + '</b>' +
        '<span class="tiny muted">마지막 발주 ' + fmtShort(x.last.ymd) + '&nbsp;·&nbsp;<b>' + x.days + '일 전</b></span></div>' +
        '<button class="btn btn-xs" data-act="settle-copy" data-cid="' + x.client.id + '">안내 복사</button></div>';
    }).join("") +
  '</div>';
}
function openIdleModal() {
  var idle = idleClients(3);
  openModal(
    '<div class="m-head"><h2 id="modalTitle">최근 미발주 거래처</h2><button class="icon-btn" data-act="modal-close" aria-label="닫기">✕</button></div>' +
    '<div class="m-body">' +
      '<p class="small" style="margin-bottom:9px"><b>3일 이상 발주가 없는 단골 ' + idle.length + "곳</b>입니다. 정산 안내를 보내며 한 번 연락해 보세요.</p>" +
      (idle.length ? idle.map(function (x) {
        return '<div class="idle-card"><div class="ic-top"><b>' + esc(x.client.name) + '</b>' +
          '<span class="badge pending">' + x.days + '일 전</span></div>' +
          '<div class="tiny muted" style="margin-top:3px">마지막 발주 ' + fmtShort(x.last.ymd) + " " + roundByKey(x.last.round).label +
            " · " + esc(x.phone || "연락처 없음") + " · 미수 " + won(x.balance) + "원</div>" +
          '<div class="acts" style="margin-top:8px"><button class="btn btn-xs" data-act="settle-copy" data-cid="' + x.client.id + '">📋 정산 안내 복사</button></div></div>';
      }).join("") : '<div class="empty" style="padding:20px"><b>미발주 거래처가 없습니다</b><p>모든 단골이 최근 3일 안에 발주했습니다.</p></div>') +
    "</div>" +
    '<div class="m-foot"><button class="btn btn-primary" data-act="modal-close">확인</button></div>'
  );
}

/* ══════════════ 6. 거래처별 특별 단가 ══════════════ */
function openSpecialPrices(cid) {
  var cl = getClient(cid);
  var t = todayYmd();
  var rows = state.products.map(function (p) {
    var sp = specialPriceOf(cid, p.id);
    return '<div class="sp-row" data-pid="' + p.id + '">' +
      '<div class="grow"><b>' + esc(p.name) + '</b>' +
        '<span class="tiny muted">기본 ' + won(priceOf(p, t)) + "원" + (sp ? " · 지금 특별 " + won(sp) + "원" : "") + "</span></div>" +
      '<input type="number" inputmode="numeric" data-sp="' + p.id + '" value="' + (sp || "") + '" placeholder="기본가" aria-label="' + esc(p.name) + ' 특별 단가"></div>';
  }).join("");
  openModal(
    '<div class="m-head"><h2 id="modalTitle">특별 단가 · ' + esc(cl.name) + '</h2><button class="icon-btn" data-act="modal-close" aria-label="닫기">✕</button></div>' +
    '<div class="m-body">' +
      '<div class="notice green"><span class="ni">🔒</span><div><b>이 거래처 화면에만 적용됩니다.</b><br>손님 화면에는 이 가격만 보이고, 다른 거래처·사장님 기본 단가표는 그대로입니다. 비우면 기본 단가로 돌아갑니다.</div></div>' +
      '<div class="sp-list">' + rows + "</div>" +
    "</div>" +
    '<div class="m-foot"><button class="btn btn-ghost" data-act="modal-close">취소</button>' +
      '<button class="btn btn-primary" data-act="special-save" data-cid="' + cid + '">특별 단가 저장</button></div>'
  );
}

/* ══════════════ 10. 배송 완료 메모 (납품 위치) ══════════════ */
function openDeliveredMemo(no) {
  var o = findOrder(no);
  if (!o) return;
  var cl = getClient(o.clientId);
  var quick = ["뒷문 냉장고 앞", "주방 입구", "1층 카운터", "경비실 맡김"];
  openModal(
    '<div class="m-head"><h2 id="modalTitle">배송 완료 처리</h2><button class="icon-btn" data-act="modal-close" aria-label="닫기">✕</button></div>' +
    '<div class="m-body">' +
      '<p class="small"><b>' + esc(cl.name) + "</b> · " + fmtShort(o.ymd) + " " + roundByKey(o.round).label + " · " + o.no + "</p>" +
      '<div class="cl-sec" style="margin-top:11px"><b>납품 위치 한 줄 메모</b>' +
        '<input id="dlvMemo" data-act="dlv-memo" placeholder="예: 뒷문 냉장고 앞" maxlength="80">' +
        '<div class="dlv-quick">' + quick.map(function (q) {
          return '<button class="chip" data-act="dlv-chip" data-text="' + esc(q) + '">' + esc(q) + "</button>";
        }).join("") + "</div>" +
        '<p class="tiny muted" style="margin-top:7px">거래처 <b>발주 내역</b>에도 같이 표시됩니다. 비워 두고 완료 처리해도 됩니다.</p>' +
      "</div>" +
    "</div>" +
    '<div class="m-foot"><button class="btn btn-ghost" data-act="advance-yes" data-mode="nomemo" data-no="' + o.no + '">메모 없이 완료</button>' +
      '<button class="btn btn-primary" data-act="advance-yes" data-no="' + o.no + '">완료 처리</button></div>'
  );
}

/* ══════════════ 반품·클레임 (손님 접수 · 사장님 승인) ══════════════ */
function claimDraftFor(orderNo) {
  if (!ui.claim || ui.claim.orderNo !== orderNo) {
    ui.claim = { orderNo:orderNo, items:[], reason:"", memo:"", photos:[] };
  }
  return ui.claim;
}
/** 손님 반품·클레임 접수 모달 — 품목 · 사유 · 증빙 사진 · 메모 */
function renderClaimModal() {
  var d = ui.claim;
  if (!d) return;
  var o = findOrder(d.orderNo);
  if (!o) { closeModal(); return; }
  var amount = claimAmountFor(o, d.items);
  var rows = (o.items || []).map(function (it) {
    var on = d.items.indexOf(it.pid) >= 0;
    return '<button class="cl-opt" data-act="claim-item" data-pid="' + it.pid + '" aria-pressed="' + on + '">' +
      '<span class="cb" aria-hidden="true">' + (on ? "✓" : "") + "</span>" +
      '<span class="grow"><b>' + esc(it.name) + '</b><small class="cl-sub">' + it.qty + "개 · " + won(it.amount) + "원</small></span>" +
      "</button>";
  }).join("");
  var reasons = CLAIM_REASONS.map(function (r) {
    return '<button class="cl-reason-btn" data-act="claim-reason" data-reason="' + esc(r) + '" aria-pressed="' + (d.reason === r) + '">' + esc(r) + "</button>";
  }).join("");
  var photos = d.photos.map(function (p, i) {
    return '<span class="cl-photo"><img src="' + p.dataUrl + '" alt="증빙 사진 ' + (i + 1) + '">' +
      '<button class="del" data-act="claim-photo-del" data-idx="' + i + '" aria-label="사진 빼기">✕</button></span>';
  }).join("");
  openModal(
    '<div class="m-head"><h2 id="modalTitle">반품·클레임 접수</h2><button class="icon-btn" data-act="claim-close" aria-label="닫기">✕</button></div>' +
    '<div class="m-body">' +
      '<p class="small" style="margin-bottom:2px"><b>' + fmtShort(o.ymd) + " " + roundByKey(o.round).label + " 발주</b> · " + o.no + "</p>" +
      '<div class="cl-sec"><b>1. 문제가 있는 품목</b><div class="cl-opts">' + rows + "</div></div>" +
      '<div class="cl-sec"><b>2. 사유</b><div class="cl-reasons">' + reasons + "</div></div>" +
      '<div class="cl-sec"><b>3. 증빙 사진 (1장 이상)</b>' +
        '<div class="cl-photos">' + photos + "</div>" +
        (d.photos.length >= CLAIM_PHOTOS_MAX
          ? '<p class="tiny muted" style="margin-top:6px">사진은 ' + CLAIM_PHOTOS_MAX + "장까지 올릴 수 있습니다.</p>"
          : '<label class="claim-photo-add" for="claimPhoto">📷 사진 찍기 · 앨범에서 고르기</label>') +
        '<input type="file" id="claimPhoto" data-act="claim-photo" accept="image/*" multiple class="bulk-file-input">' +
        '<p class="tiny muted" style="margin-top:6px">상한 제품·파손·수량 부족이 보이게 찍어 주세요.</p>' +
      "</div>" +
      '<div class="cl-sec"><b>4. 상세 메모 (자유롭게)</b>' +
        '<textarea id="claimMemo" data-act="claim-memo" rows="3" placeholder="예: 오이 절반이 물러서 못 썼습니다. 확인 부탁드려요.">' + esc(d.memo || "") + "</textarea>" +
      "</div>" +
      '<div class="notice" style="margin-top:12px"><span class="ni">✓</span><div>사장님이 확인하면 <b>승인</b> 또는 <b>반려</b>합니다. 승인되면 ' +
        (amount > 0 ? "고른 품목 금액 <b>" + won(amount) + "원</b>이" : "고른 품목 금액이") +
        " 이 발주 합계(미수)에서 차감됩니다.</div></div>" +
    "</div>" +
    '<div class="m-foot"><button class="btn btn-ghost" data-act="claim-close">그만두기</button>' +
      '<button class="btn btn-primary" data-act="claim-save">반품·클레임 접수</button></div>'
  );
}
/** 사진 크게 보기 (손님·사장님 공통) */
function openClaimPhoto(src, caption) {
  openModal(
    '<div class="m-head"><h2 id="modalTitle">증빙 사진</h2><button class="icon-btn" data-act="claim-photo-close" aria-label="닫기">✕</button></div>' +
    '<div class="m-body"><img class="biz-full" src="' + src + '" alt="증빙 사진 크게 보기">' +
      (caption ? '<p class="tiny muted" style="margin-top:8px">' + esc(caption) + "</p>" : "") + "</div>" +
    '<div class="m-foot"><button class="btn btn-primary" data-act="claim-photo-close">닫기</button></div>'
  );
}
/** 사장님 — 접수된 반품·클레임 카드 (사진 썸네일 · 승인/반려) */
function claimCardHTML(c) {
  var o = findOrder(c.orderNo);
  var cl = getClient(c.clientId);
  var items = (c.items || []).map(function (it) {
    return esc(it.name) + " " + it.qty + "개 · " + won(it.amount) + "원";
  }).join(" / ");
  var thumbs = (c.photos || []).map(function (p, i) {
    return '<button class="cl-thumb" data-act="claim-photo-open" data-id="' + c.id + '" data-idx="' + i + '" aria-label="증빙 사진 ' + (i + 1) + ' 크게 보기">' +
      '<img src="' + p.dataUrl + '" alt="증빙 사진 ' + (i + 1) + '"></button>';
  }).join("");
  return '<div class="claim-card ' + (c.status === CLAIM.OPEN ? "is-open" : "is-done") + '" data-claim="' + c.id + '">' +
    '<div class="cl-head"><div><div class="cl-name">' + esc(cl.name) + ' <span class="badge ' + (CLAIM_CLASS[c.status] || "done") + '">' + CLAIM_BADGE[c.status] + "</span></div>" +
      '<div class="tiny muted">' + (o ? fmtShort(o.ymd) + " " + roundByKey(o.round).label + " · " : "") + c.orderNo + " · 접수 " + stampLabel(c.createdAt) + "</div></div>" +
      '<div class="cl-amt">−' + won(c.amount) + '<small>원</small></div></div>' +
    '<div class="cl-items">' + items + '</div>' +
    '<div class="cl-meta"><span>사유 <b>' + esc(c.reason) + "</b></span>" + (c.memo ? "<span>" + esc(c.memo) + "</span>" : "") + "</div>" +
    (thumbs ? '<div class="cl-photos">' + thumbs + "</div>" : '<div class="tiny muted" style="margin-top:8px">증빙 사진 없음</div>') +
    (c.status === CLAIM.OPEN
      ? '<div class="acts" style="margin-top:10px">' +
          '<button class="btn btn-sm btn-primary" data-act="claim-approve" data-id="' + c.id + '">승인 (금액 차감)</button>' +
          '<button class="btn btn-sm btn-ghost" data-act="claim-reject" data-id="' + c.id + '">반려</button>' +
        "</div>"
      : '<div class="tiny muted" style="margin-top:8px">처리 완료 · ' + stampLabel(c.decidedAt) +
        (c.status === CLAIM.APPROVED ? " · 주문 합계에서 " + won(c.amount) + "원 차감" : " · 금액 변동 없음") + "</div>") +
    "</div>";
}
function claimsPanelHTML() {
  var list = (state.claims || []).slice().sort(function (a, b) {
    if (a.status !== b.status) return a.status === CLAIM.OPEN ? -1 : 1;
    return String(a.createdAt) < String(b.createdAt) ? 1 : -1;
  });
  if (!list.length) return "";
  var open = openClaims().length;
  return '<div class="claim-wrap" id="claimWrap">' +
    '<div class="row between" style="margin:0 0 8px;align-items:center;flex-wrap:wrap">' +
      '<h2 style="font-size:15px">반품·클레임 <span class="badge ' + (open ? "claim" : "done") + '">' + (open ? "접수 " + open + "건" : "모두 처리") + "</span></h2>" +
      '<span class="tiny muted">승인하면 그 품목 금액만큼 주문 합계·미수에서 차감</span>' +
    "</div>" +
    list.map(claimCardHTML).join("") +
    "</div>";
}

/* ══════════════ 거래명세표 (A4) ══════════════ */
function stmtCopy(order, kind) {
  var cl = getClient(order.clientId);
  var s = state.store;
  var L = buildLedger(cl.id);
  var st = L.stmts[order.no] || { prev:0, out:order.total, pay:0, bal:order.total };
  var acc = accountText();
  var rows = order.items.map(function (it) {
    return "<tr><td class=\"pname\">" + esc(it.name) + "  -" + (it.spec && it.spec !== "-" ? "  " + esc(it.spec) : "") + "</td>" +
      '<td class="c">' + it.qty + '</td><td class="n">' + won(it.price) + '</td><td class="n">' + won(it.amount) + "</td><td></td></tr>";
  }).join("");
  if (order.shipFee > 0) {
    rows += "<tr><td class=\"pname\">배송비  -  " + esc(state.policy.area) + "</td><td class=\"c\">1</td><td class=\"n\">" + won(order.shipFee) + "</td><td class=\"n\">" + won(order.shipFee) + "</td><td></td></tr>";
  }
  /* 사장님이 승인한 반품·클레임 — 품목 금액만큼 빼서 합계를 맞춘다 */
  var claimTotal = Number(order.claimTotal) || 0;
  if (claimTotal > 0) {
    rows += "<tr><td class=\"pname\">반품 차감  -  클레임 승인</td><td class=\"c\"></td><td class=\"n\"></td><td class=\"n\">−" + won(claimTotal) + "</td><td></td></tr>";
  }
  rows += "<tr class=\"yiheo\"><td>======이하여백======</td><td class=\"rest\"></td><td class=\"rest\"></td><td class=\"rest\"></td><td class=\"rest\"></td></tr>";
  var blanks = Math.max(0, 8 - order.items.length - (order.shipFee > 0 ? 1 : 0) - (claimTotal > 0 ? 1 : 0));
  for (var i = 0; i < blanks; i++) rows += '<tr class="blank"><td></td><td></td><td></td><td></td><td></td></tr>';
  var totalQty = order.items.reduce(function (a, it) { return a + it.qty; }, 0) + (order.shipFee > 0 ? 1 : 0);

  return '<div class="copy">' +
    '<div class="st-head">' +
      '<div class="st-title"><h1>거래명세표</h1><span class="kind">(' + (kind === "supplier" ? "공급자용" : "공급받는자용") + ")</span></div>" +
      '<div class="st-approve"><table class="ap-table"><colgroup><col style="width:5mm"><col style="width:10.5mm"><col style="width:10.5mm"></colgroup><tbody><tr><td class="ap-label" rowspan="2">확<br>인</td><td></td><td></td></tr><tr><td></td><td></td></tr></tbody></table></div>' +
    "</div>" +
    '<div class="st-meta"><span class="date">' + fmtDotDow(order.ymd) + '</span><span class="tel">' + esc(s.phone) + '</span>' +
      '<span class="paykind">' + (isImmediate(order) ? "즉시결제(입금확인 " + (order.deposit === DEPOSIT.CONFIRMED ? "완료" : "대기") + ")" :
        (creditDaysOf(cl) > 1 ? "외상(약정 정산)" : "외상(하루치 정산)")) + '</span>' +
      '<span class="serial">' + (order.stmtNo || "-") + "</span></div>" +
    '<div class="st-parties">' +
      '<table class="st-party supplier"><colgroup><col style="width:4.6mm"><col style="width:10.5mm"><col style="width:23mm"><col style="width:5.6mm"><col style="width:18.6mm"></colgroup><tbody>' +
        '<tr><td class="vlabel" rowspan="4"><span>공급자</span></td><td class="lb">등록<br>번호</td><td class="val" colspan="3">' + esc(s.bizNo) + "</td></tr>" +
        '<tr><td class="lb">상호<br>(법인명)</td><td class="val">' + esc(s.name) + '</td><td class="lb">성명</td><td class="val">' + esc(s.owner) + "</td></tr>" +
        '<tr><td class="lb">사업장<br>주소</td><td class="val addr" colspan="3">' + esc(s.addr) + "</td></tr>" +
        '<tr><td class="lb">업태</td><td class="val">' + esc(s.uptae) + '</td><td class="lb">종목</td><td class="val jm">' + esc(s.jongmok) + "</td></tr>" +
      "</tbody></table>" +
      '<table class="st-party buyer"><colgroup><col style="width:4.6mm"><col style="width:10mm"><col style="width:22mm"><col style="width:5.6mm"><col style="width:18.4mm"></colgroup><tbody>' +
        '<tr><td class="vlabel" rowspan="4"><span>공급받는자</span></td><td class="lb">등록<br>번호</td><td class="val" colspan="3">' + esc(cl.bizNo || "-") + "</td></tr>" +
        '<tr><td class="lb">상호<br>(법인명)</td><td class="val">' + esc(cl.name) + '</td><td class="lb">성명</td><td class="val">' + esc(cl.owner || "") + "</td></tr>" +
        '<tr><td class="lb">사업장<br>주소</td><td class="val addr" colspan="3">' + esc(cl.addr || "-") + "</td></tr>" +
        '<tr><td class="lb">업태</td><td class="val">' + esc(cl.uptae || "-") + '</td><td class="lb">종목</td><td class="val jm">' + esc(cl.jongmok || "-") + "</td></tr>" +
      "</tbody></table>" +
      '<table class="st-settle"><tbody>' +
        '<tr><td class="k">전잔액</td><td class="v">' + won(st.prev) + "</td></tr>" +
        '<tr><td class="k">출고액</td><td class="v">' + won(st.out) + "</td></tr>" +
        '<tr><td class="k">입금액</td><td class="v">' + won(st.pay) + "</td></tr>" +
        '<tr><td class="k">잔&nbsp;&nbsp;액</td><td class="v">' + won(st.bal) + "</td></tr>" +
        '<tr class="claim"><td colspan="2">아래 금액을 청구합니다.</td></tr>' +
        '<tr class="grand"><td class="k">합계<br>금액</td><td class="v">' + won(st.out) + "</td></tr>" +
      "</tbody></table>" +
    "</div>" +
    '<table class="st-items"><colgroup><col style="width:46%"><col style="width:9%"><col style="width:13%"><col style="width:15%"><col></colgroup>' +
      "<thead><tr><th>품목  -  규격</th><th>수량</th><th>단가</th><th>공급가액</th><th>세액</th></tr></thead>" +
      "<tbody>" + rows + "</tbody></table>" +
    '<table class="st-foot"><colgroup><col style="width:26mm"><col style="width:19mm"><col style="width:20mm"><col style="width:58mm"><col style="width:19mm"><col style="width:14mm"><col></colgroup>' +
      "<tbody><tr><td class=\"k\">총수량</td><td class=\"c\">" + totalQty + "</td><td class=\"k\">인수자</td><td></td>" +
      '<td class="c">' + totalQty + '</td><td class="k">소계</td><td>' + won(st.out) + "</td></tr></tbody></table>" +
    '<div class="st-account"><span>입금 계좌</span>' +
      (acc.ok ? '<span class="acc">' + esc(acc.text) + "</span>" : '<span class="ph">' + esc(acc.text) + "</span>") +
      '<span class="note">' + esc(s.taxType) + " · 문의 " + esc(s.phone) + "</span></div>" +
    "</div>";
}

function statementSheet(order) {
  return '<div class="sheet">' + stmtCopy(order, "buyer") + stmtCopy(order, "supplier") + "</div>";
}

var stmtFitTimer = null;
function fitStatement() {
  var box = $("#stmtScroll");
  if (!box) return;
  var sheet = box.querySelector(".sheet");
  var scaler = box.querySelector(".stmt-scaler");
  if (!sheet || !scaler) return;
  var w = box.clientWidth - 20;
  var sheetW = sheet.offsetWidth;
  if (!sheetW) return;
  var scale = Math.min(1, w / sheetW);
  scaler.style.transform = "scale(" + scale + ")";
  scaler.style.width = sheetW + "px";
  box.style.height = (sheet.offsetHeight * scale + 8) + "px";
}

function openStatement(orderNo) {
  var o = findOrder(orderNo);
  if (!o) return;
  openModal(
    '<div class="m-head"><h2 id="modalTitle">거래명세표</h2>' +
      '<button class="icon-btn" data-act="modal-close" aria-label="닫기">✕</button></div>' +
    '<div class="m-body">' +
      '<div class="stmt-scroll" id="stmtScroll"><div class="stmt-scaler">' + statementSheet(o) + "</div></div>" +
      /* 손님 화면 — 전표 보기만. 인쇄 버튼·인쇄 안내 없음 (인쇄는 사장님 화면에서만) */
      (IS_ADMIN ? '<p class="small" style="margin-top:10px">A4 1장에 <b>공급받는자용</b>과 <b>공급자용</b>이 절취선으로 나뉘어 함께 인쇄됩니다.</p>' : "") +
    "</div>" +
    '<div class="m-foot">' +
      '<button class="btn btn-ghost" data-act="modal-close">' + (IS_ADMIN ? "닫기" : "확인") + "</button>" +
      (IS_ADMIN ? '<button class="btn btn-primary" data-act="stmt-print" data-no="' + o.no + '">A4 인쇄</button>' : "") +
    "</div>"
  );
  setTimeout(fitStatement, 30);
  setTimeout(fitStatement, 260);
}

function printStatement(orderNo) {
  var o = findOrder(orderNo);
  if (!o) return;
  $("#printRoot").innerHTML = statementSheet(o);
  window.print();
  o.printedAt = nowIso();
  saveState();
  toast("A4 거래명세표를 인쇄합니다 (공급받는자용·공급자용)");
}

/* ── 회차·당일 A4 일괄 인쇄 ─────────────────────────── */
function batchOrders(ymd, round) {
  var idx = {};
  state.rounds.forEach(function (r, i) { idx[r.key] = i; });
  return state.orders.filter(function (o) {
    return o.ymd === ymd && o.status !== STATUS.CANCELED && (!round || o.round === round);
  }).sort(function (a, b) {
    var ra = idx[a.round] == null ? 9 : idx[a.round];
    var rb = idx[b.round] == null ? 9 : idx[b.round];
    if (ra !== rb) return ra - rb;
    return a.no < b.no ? -1 : 1;
  });
}

function openBatchPrint(ymd, round) {
  var list = batchOrders(ymd, round);
  if (!list.length) { toast("인쇄할 주문이 없습니다."); return; }
  var pend = list.filter(function (o) { return !o.priceConfirmed; }).length;
  var rows = list.map(function (o) {
    var cl = getClient(o.clientId);
    return '<div class="sum-row"><span class="lb">' + roundByKey(o.round).label + " · " + esc(cl.name) + "</span><span>" + won(o.total) + "원" +
      (o.priceConfirmed ? "" : ' <span class="tiny" style="color:var(--amber)">참고가</span>') + "</span></div>";
  }).join("");
  openModal(
    '<div class="m-head"><h2 id="modalTitle">A4 일괄 인쇄</h2><button class="icon-btn" data-act="modal-close" aria-label="닫기">✕</button></div>' +
    '<div class="m-body">' +
      '<p class="small" style="margin-bottom:8px"><b>' + fmtDotDow(ymd) + (round ? " " + roundByKey(round).label + " 배달" : " 전체") +
        "</b> · 주문 " + list.length + "건 · <b>A4 " + list.length + "장</b>을 한 번에 인쇄합니다. 주문마다 새 페이지로 나뉩니다.</p>" +
      '<div class="sum">' + rows + "</div>" +
      (pend ? '<div class="notice" style="margin-top:10px"><span class="ni">!</span><div><b>참고가 ' + pend + "건</b>이 포함되어 있습니다. 아침 7시 단가 확정 전이라 전표 금액은 확정 후 바뀔 수 있습니다.</div></div>" : "") +
      '<p class="small" style="margin-top:10px">매장 프린터가 연결된 PC에서 인쇄 대화상자가 열리면 <b>A4 · 세로</b>로 인쇄하세요.</p>' +
    "</div>" +
    '<div class="m-foot"><button class="btn btn-ghost" data-act="modal-close">닫기</button>' +
      '<button class="btn btn-primary" data-act="batch-print" data-ymd="' + ymd + '" data-round="' + (round || "") + '">A4 ' + list.length + "장 인쇄</button></div>"
  );
}

function printBatch(ymd, round) {
  var list = batchOrders(ymd, round);
  if (!list.length) { toast("인쇄할 주문이 없습니다."); return; }
  $("#printRoot").innerHTML = list.map(statementSheet).join("");
  window.print();
  list.forEach(function (o) { o.printedAt = nowIso(); });
  saveState();
  closeModal();
  toast("A4 거래명세표 " + list.length + "장을 인쇄합니다 (공급받는자용·공급자용)");
}

/* ══════════════ 공통 렌더 ══════════════ */
function render() {
  renderHeader();
  if (ui.route === "login") return;          /* 로그인 화면은 고정 마크업 그대로 */
  if (ui.route === "b2b") renderB2B();
  else if (ui.route === "checkout") renderCheckout();
  else if (ui.route === "orders") renderOrders();
  else if (ui.route === "stmt") renderStmtTab();
  else if (ui.route === "admin") renderAdmin();
  renderActionbar();
}

/* ═══════════════════════════════════════════════════════════
   이벤트 · 시작
   ═══════════════════════════════════════════════════════════ */

/* 모드별 화면 — 거래처용에는 사장님 관리 화면·경로 자체가 없다
   거래처(손님) 화면은 로그인 전까지 로그인 화면만 보인다. */
var VIEWS = IS_ADMIN
  ? { admin:"viewAdmin" }
  : { login:"viewLogin", b2b:"viewB2B", checkout:"viewCheckout", orders:"viewOrders", stmt:"viewStmt" };
var HOME_ROUTE = IS_ADMIN ? "admin" : (isLoggedIn() ? "b2b" : "login");

function setRoute(route, opts) {
  opts = opts || {};
  if (!IS_ADMIN) {
    if (!isLoggedIn()) route = "login";
    else if (route === "login") route = "b2b";
  }
  if (!VIEWS[route]) route = HOME_ROUTE;
  if (route === "checkout" && !cartCount()) route = HOME_ROUTE;
  ui.route = route;
  Object.keys(VIEWS).forEach(function (k) {
    var el = document.getElementById(VIEWS[k]);
    if (el) el.hidden = k !== route;
  });
  if (route === "checkout") {
    if (!ui.co) ui.co = null, ensureCo();
  }
  if (route === "admin" && !ui.admDate) ui.admDate = todayYmd();
  render();
  if (route !== "checkout" && !opts.keepScroll) window.scrollTo({ top:0, behavior:"instant" in window ? "instant" : "auto" });
}

function cartQty(pid, delta, abs) {
  var p = findProduct(pid);
  if (!p) return;
  var cur = Number(cart[pid]) || 0;
  var next = abs != null ? abs : cur + delta;
  next = Math.max(0, Math.round(Number(next) || 0));
  if (p.stock <= 0) next = 0;
  if (next > p.stock) {
    next = p.stock;
    toast(p.name + "은(는) 재고가 " + p.stock + "개 남았습니다.");
  }
  if (next <= 0) delete cart[pid];
  else cart[pid] = next;
  saveCart();
  renderHeader();
  if (ui.route === "b2b") {
    renderProdList();
    renderFavBox();
    renderActionbar();
  }
  if (ui.drawer) {
    if (cartCount() > 0) renderCartDrawer(); else closeDrawer();
  }
  if (ui.route === "checkout") { renderCheckout(); renderActionbar(); }
}

/* ── 거래처 선택 ────────────────────────────────────── */
/* ── 손님 로그인 · 로그아웃 ──────────────────────────── */
/* 손님 화면에는 거래처 목록이 없다. 상호명 + 전화번호가 맞아야 내 가게로 들어간다. */
function doLogin() {
  var nameEl = $("#lgName"), phoneEl = $("#lgPhone");
  var name = (nameEl ? nameEl.value : "").replace(/\s+/g, "");
  var phone = digits(phoneEl ? phoneEl.value : "");
  if (!name) { toast("상호명을 입력해 주세요."); if (nameEl) nameEl.focus(); return; }
  if (phone.length < 9) { toast("전화번호를 정확히 입력해 주세요."); if (phoneEl) phoneEl.focus(); return; }
  var hit = state.clients.filter(function (c) {
    var cn = String(c.name || "").replace(/\s+/g, "");
    return (cn === name || cn.indexOf(name) >= 0) && digits(c.phone) === phone;
  })[0];
  if (!hit) { toast("상호명과 전화번호가 맞는 거래처를 찾지 못했습니다."); return; }
  loginClient(hit);
  if (nameEl) nameEl.value = "";
  if (phoneEl) phoneEl.value = "";
  ui.slot = null; ui.listDate = null; ui.cat = "all"; ui.prodQuery = "";
  setRoute("b2b");
  if (hit.status === CLIENT.REJECTED) toast("가입이 반려된 거래처입니다. 사장님께 문의해 주세요.");
  else if (hit.status === CLIENT.PENDING) toast(hit.name + " · 가입 승인을 기다리는 중입니다.");
  else toast(hit.name + " 으로 로그인했습니다.");
}

function doLogout() {
  logoutClient();
  closeDrawer();
  closeModal();
  ui.cat = "all";
  ui.prodQuery = "";
  ui.slot = null;
  ui.listDate = null;
  setRoute("login");
  toast("로그아웃했습니다.");
}

/* ── 거래처 가입 (간편 가입 · 사업자등록증 없어도 됨 · 사장님 승인 후 이용) ── */
function openSignup() {
  ui.signupFile = null;
  openModal(
    '<div class="m-head"><h2 id="modalTitle">거래처 가입 (간편 가입)</h2><button class="icon-btn" data-act="modal-close" aria-label="닫기">✕</button></div>' +
    '<div class="m-body">' +
      '<div class="notice green" style="margin:0 0 10px"><span class="ni">✅</span><div><b>사업자등록증은 없어도 됩니다 · 사장님 확인 후 바로 이용 가능.</b><br>상호·담당자·전화번호·배달 주소만 넣으면 신청됩니다. 사장님이 <b>승인</b>하면 바로 발주할 수 있어요.</div></div>' +
      '<div class="fields">' +
        '<div class="field"><label for="suName">상호 <b style="color:var(--red)">*</b></label><input id="suName" placeholder="예: 원주손칼국수" autocomplete="organization"></div>' +
        '<div class="field"><label for="suOwner">대표자 · 담당자 <b style="color:var(--red)">*</b></label><input id="suOwner" placeholder="예: 장원주" autocomplete="name"></div>' +
        '<div class="field"><label for="suPhone">전화번호 <b style="color:var(--red)">*</b></label><input id="suPhone" data-act="su-phone" inputmode="tel" placeholder="010-0000-0000" autocomplete="tel"></div>' +
        '<div class="field"><label for="suAddr">배달 주소 (원주 시내) <b style="color:var(--red)">*</b></label><input id="suAddr" placeholder="예: 원주시 무실로 45, 1층" autocomplete="street-address"></div>' +
        '<div class="field"><label for="suBiz">사업자등록번호 (선택)</label><input id="suBiz" data-act="su-biz" inputmode="numeric" placeholder="000-00-00000"></div>' +
      "</div>" +
      '<div class="field" style="margin-top:11px"><label for="suFile">사업자등록증 사본 (선택 · 이미지/PDF)</label>' +
        '<input type="file" id="suFile" data-act="su-file" accept="image/*,application/pdf">' +
        '<div id="suFileBox" class="biz-file-box">사업자등록증이 있으면 올려 주세요. <b>없어도 가입됩니다.</b></div>' +
      "</div>" +
    "</div>" +
    '<div class="m-foot"><button class="btn btn-ghost" data-act="modal-close">취소</button>' +
      '<button class="btn btn-primary" data-act="signup-save">가입 신청</button></div>'
  );
}

function onSignupFile(input) {
  var box = $("#suFileBox");
  ui.signupFile = null;
  var f = input.files && input.files[0];
  if (!f) { if (box) box.innerHTML = "사업자등록증이 있으면 올려 주세요. <b>없어도 가입됩니다.</b>"; return; }
  var isImg = /^image\//.test(f.type || "");
  var isPdf = /pdf/i.test(f.type || "") || /\.pdf$/i.test(f.name);
  if (!isImg && !isPdf) {
    if (box) box.innerHTML = '<span class="err">이미지(JPG·PNG) 또는 PDF 파일만 첨부할 수 있습니다.</span>';
    input.value = "";
    return;
  }
  var kb = Math.max(1, Math.round((f.size || 0) / 1024));
  var meta = { name:f.name, type:f.type || (isPdf ? "application/pdf" : "image/jpeg"), size:f.size || 0, dataUrl:null };
  ui.signupFile = meta;
  if (box) {
    box.innerHTML = '<div class="tiny"><b>' + esc(f.name) + "</b> · " + kb + "KB</div>" +
      '<div class="biz-prev" id="suPrev">' + (isImg ? "미리보기 불러오는 중…" : "PDF 파일 — 미리보기 없이 파일명으로 저장됩니다.") + "</div>";
  }
  if (isImg) {
    var r = new FileReader();
    r.onload = function () {
      var url = String(r.result);
      meta.dataUrl = (f.size || 0) <= 600 * 1024 ? url : null;
      var prev = $("#suPrev");
      if (prev) {
        prev.innerHTML = '<img src="' + url + '" alt="사업자등록증 미리보기">' +
          (meta.dataUrl ? "" : '<div class="tiny muted">파일이 커서 미리보기만 표시하고 파일명·용량으로 저장합니다.</div>');
      }
    };
    r.readAsDataURL(f);
  }
}

/* ── 영수증 사진 (미리보기용) ─────────────────────── */
function onBulkFile(input) {
  var f = input.files && input.files[0];
  ui.bulkFile = null;
  if (!f) { renderAdminPrices(); return; }
  var isImg = /^image\//.test(f.type || "");
  var meta = { name:f.name, type:f.type || "", size:f.size || 0, dataUrl:null };
  ui.bulkFile = meta;
  renderAdminPrices();
  if (isImg) {
    var r = new FileReader();
    r.onload = function () {
      meta.dataUrl = (f.size || 0) <= 900 * 1024 ? String(r.result) : null;
      if (ui.route === "admin") renderAdminPrices();
    };
    r.readAsDataURL(f);
  }
}

function saveSignup() {
  var val = function (id) { var el = $("#" + id); return el ? el.value.trim() : ""; };
  var need = [
    ["suName", "상호"], ["suOwner", "대표자·담당자"],
    ["suPhone", "전화번호"], ["suAddr", "배달 주소"]
  ];
  for (var i = 0; i < need.length; i++) {
    if (!val(need[i][0])) {
      toast(need[i][1] + "을(를) 입력해 주세요.");
      var f = $("#" + need[i][0]); if (f) f.focus();
      return;
    }
  }
  if (digits(val("suPhone")).length < 9) { toast("전화번호를 정확히 입력해 주세요."); $("#suPhone").focus(); return; }
  if (val("suBiz") && digits(val("suBiz")).length !== 10) {
    toast("사업자등록번호는 10자리입니다. 비워 두어도 가입됩니다.");
    $("#suBiz").focus(); return;
  }
  if (val("suAddr").indexOf("원주") < 0) {
    toast("원주 시내만 배달합니다. 배달 주소에 '원주'를 포함해 주세요.");
    $("#suAddr").focus(); return;
  }
  var res = addSignupClient({
    name:val("suName"), bizNo:fmtBizNo(val("suBiz")), owner:val("suOwner"),
    uptae:"", jongmok:"", addr:val("suAddr"),
    phone:fmtPhone(val("suPhone")), manager:val("suOwner"), bizFile:ui.signupFile
  });
  if (!res.ok) { toast(res.msg || "가입 신청을 접수하지 못했습니다."); return; }
  loginClient(res.client);
  ui.signupFile = null;
  closeDrawer();
  closeModal();
  setRoute("b2b");
  toast(res.client.name + " 가입 신청이 접수되었습니다. 사장님이 확인해 승인하면 바로 발주할 수 있어요.");
}

function openBizFile(cid) {
  var c = getClient(cid);
  if (!c || !c.bizFile) { toast("첨부된 사업자등록증이 없습니다."); return; }
  var f = c.bizFile;
  openModal(
    '<div class="m-head"><h2 id="modalTitle">사업자등록증 사본</h2><button class="icon-btn" data-act="modal-close" aria-label="닫기">✕</button></div>' +
    '<div class="m-body">' +
      '<p class="small" style="margin-bottom:8px"><b>' + esc(c.name) + "</b> · 사업자등록번호 " + esc(c.bizNo || "-") + " · " + esc(c.owner || "-") + "</p>" +
      (f.dataUrl ? '<img class="biz-full" src="' + f.dataUrl + '" alt="사업자등록증 사본">' :
        '<div class="notice"><span class="ni">📄</span><div><b>' + esc(f.name) + "</b><br>시안에는 실제 파일이 저장되지 않아 미리보기가 없습니다. 실제 서비스에서는 이 자리에 사업자등록증 이미지·PDF가 표시됩니다.</div></div>") +
      '<p class="tiny muted" style="margin-top:10px">' + esc(bizFileMeta(f)) + "</p>" +
    "</div>" +
    '<div class="m-foot"><button class="btn btn-ghost" data-act="modal-close">닫기</button>' +
      (c.status === CLIENT.PENDING ? '<button class="btn btn-primary" data-act="client-approve" data-cid="' + c.id + '">사업자등록증 확인 · 승인</button>' : "") +
    "</div>"
  );
}

/* ── 입금 기록 ──────────────────────────────────────── */
function openPayment(cid) {
  var c = getClient(cid);
  openModal(
    '<div class="m-head"><h2 id="modalTitle">입금 기록</h2><button class="icon-btn" data-act="modal-close">✕</button></div>' +
    '<div class="m-body">' +
      '<p class="small" style="margin-bottom:10px"><b>' + esc(c.name) + "</b> · 현재 잔액 " + won(buildLedger(cid).balance) + "원</p>" +
      '<div class="fields">' +
        '<div class="field"><label>입금 날짜</label><input type="date" id="payYmd" value="' + todayYmd() + '"></div>' +
        '<div class="field"><label>입금액 (원)</label><input id="payAmt" inputmode="numeric" placeholder="예: 300000"></div>' +
        '<div class="field"><label>메모</label><input id="payMemo" placeholder="예: 11월분 일부 입금"></div>' +
      "</div>" +
    "</div>" +
    '<div class="m-foot"><button class="btn btn-ghost" data-act="modal-close">취소</button>' +
      '<button class="btn btn-primary" data-act="payment-save" data-cid="' + cid + '">입금 기록 저장</button></div>'
  );
}

/* ── 거래처 정보 수정 ───────────────────────────────── */
function openClientEdit(cid) {
  var c = getClient(cid);
  openModal(
    '<div class="m-head"><h2 id="modalTitle">거래처 정보</h2><button class="icon-btn" data-act="modal-close">✕</button></div>' +
    '<div class="m-body"><div class="fields">' +
      '<div class="field"><label>상호</label><input data-cl="name" value="' + esc(c.name) + '"></div>' +
      '<div class="field"><label>사업자등록번호</label><input data-cl="bizNo" inputmode="numeric" value="' + esc(c.bizNo) + '"></div>' +
      '<div class="field"><label>대표자</label><input data-cl="owner" value="' + esc(c.owner) + '"></div>' +
      '<div class="field"><label>사업장 주소</label><input data-cl="addr" value="' + esc(c.addr) + '"></div>' +
      '<div class="field"><label>업태 / 종목</label><input data-cl="uptae" value="' + esc(c.uptae) + '"></div>' +
      '<div class="field"><label>종목</label><input data-cl="jongmok" value="' + esc(c.jongmok) + '"></div>' +
      '<div class="field"><label>연락처</label><input data-cl="phone" inputmode="tel" value="' + esc(c.phone) + '"></div>' +
      '<div class="field"><label>기초 미수금 (원)</label><input data-cl="prevBalance" inputmode="numeric" value="' + (Number(c.prevBalance) || 0) + '"></div>' +
      '<div class="field"><label>메모</label><input data-cl="memo" value="' + esc(c.memo || "") + '"></div>' +
    "</div></div>" +
    '<div class="m-foot"><button class="btn btn-ghost" data-act="modal-close">취소</button>' +
      '<button class="btn btn-primary" data-act="client-save" data-cid="' + cid + '">저장</button></div>'
  );
}

/* ── 재입고 알림 ────────────────────────────────────── */
function openRestock(pid) {
  var p = findProduct(pid);
  var c = currentClient();
  openModal(
    '<div class="m-head"><h2 id="modalTitle">재입고 알림</h2><button class="icon-btn" data-act="modal-close">✕</button></div>' +
    '<div class="m-body">' +
      '<p class="small">' + esc(p.name) + "이(가) 품절입니다. 입고되면 연락드릴까요?</p>" +
      '<div class="fields" style="margin-top:10px">' +
        '<div class="field"><label>거래처</label><input value="' + esc(c.name) + '" disabled></div>' +
        '<div class="field"><label>연락처</label><input id="rsPhone" value="' + esc(c.phone) + '"></div>' +
        '<div class="field"><label>메모</label><input id="rsMemo" placeholder="예: 내일 오전까지 필요합니다"></div>' +
      "</div>" +
    "</div>" +
    '<div class="m-foot"><button class="btn btn-ghost" data-act="modal-close">취소</button>' +
      '<button class="btn btn-primary" data-act="restock-save" data-pid="' + pid + '">알림 신청</button></div>'
  );
}

/* ── 품목 관리 (추가·삭제) · 영수증 일괄 입력 ───────── */
function readProdForm() {
  var out = {};
  $$("#prodForm [data-np]").forEach(function (el) { out[el.getAttribute("data-np")] = el.value; });
  return out;
}
function openDeleteProduct(pid) {
  var p = findProduct(pid);
  if (!p) return;
  var used = state.orders.filter(function (o) {
    return o.status !== STATUS.CANCELED && (o.items || []).some(function (it) { return it.pid === pid; });
  }).length;
  openModal(
    '<div class="m-head"><h2 id="modalTitle">품목 삭제</h2><button class="icon-btn" data-act="modal-close" aria-label="닫기">✕</button></div>' +
    '<div class="m-body">' +
      '<p class="small">이 품목을 단가표에서 뺄까요? 손님 화면에서도 바로 사라집니다.</p>' +
      '<div class="ocard-items" style="margin-top:10px">' + p.emoji + " <b>" + esc(p.name) + "</b> · " +
        won(p.ref) + "원 · 재고 " + p.stock + "</div>" +
      (used ? '<div class="notice" style="margin-top:10px"><span class="ni">!</span><div>이 품목으로 받은 발주 <b>' + used + "건</b>이 있습니다. 지난 전표·주문 내역은 그대로 남습니다.</div></div>" : "") +
    "</div>" +
    '<div class="m-foot"><button class="btn btn-ghost" data-act="modal-close">그만두기</button>' +
      '<button class="btn btn-primary" style="background:var(--red);border-color:var(--red)" data-act="prod-delete-yes" data-pid="' + p.id + '">삭제</button></div>'
  );
}

/* ── 반품·클레임 증빙 사진 — 1000px 이하로 줄여 dataURL 로 저장 ── */
function readClaimPhoto(file, cb) {
  var r = new FileReader();
  r.onload = function () {
    var raw = String(r.result);
    var img = new Image();
    img.onload = function () {
      try {
        var max = 1000;
        var scale = Math.min(1, max / Math.max(img.width, img.height));
        var cv = document.createElement("canvas");
        cv.width = Math.max(1, Math.round(img.width * scale));
        cv.height = Math.max(1, Math.round(img.height * scale));
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        cb(cv.toDataURL("image/jpeg", 0.72));
      } catch (e) { cb(raw); }
    };
    img.onerror = function () { cb(raw); };
    img.src = raw;
  };
  r.onerror = function () { cb(null); };
  r.readAsDataURL(file);
}
function addClaimPhotos(input) {
  var d = ui.claim;
  if (!d) return;
  var files = Array.prototype.slice.call((input && input.files) || []);
  if (input) input.value = "";
  if (!files.length) return;
  var room = CLAIM_PHOTOS_MAX - d.photos.length;
  if (room <= 0) { toast("사진은 " + CLAIM_PHOTOS_MAX + "장까지 올릴 수 있습니다."); return; }
  files.slice(0, room).forEach(function (f) {
    if (!/^image\//.test(f.type || "")) { toast("사진(이미지) 파일만 올릴 수 있습니다."); return; }
    readClaimPhoto(f, function (dataUrl) {
      if (!dataUrl) return;
      d.photos.push({ name:f.name, dataUrl:dataUrl });
      if (ui.claim === d && ui.modal) renderClaimModal();
    });
  });
}

/* ── 발주 확정 ──────────────────────────────────────── */
function confirmPlacement() {
  var co = ui.co;
  var name = ($("#coName") || {}).value || co.client.name;
  var phone = ($("#coPhone") || {}).value || co.client.phone;
  if (!name.trim()) { toast("상호를 입력해 주세요."); return; }
  if (digits(phone).length < 9) { toast("담당자 연락처를 정확히 입력해 주세요."); return; }
  var lines = cartLines(co.ymd);
  if (!lines.length) { toast("담은 품목이 없습니다."); return; }
  var am = calcAmounts(lines);
  var combineBase = combineOrderFor(co.client.id, co.ymd, co.round);
  if (!am.meetsMin && !combineBase) { toast("최소 주문 " + won(am.minOrder) + "원부터 발주할 수 있어요. " + won(am.shortfall) + "원 더 담아 주세요."); return; }
  /* 규칙 1·2 — 승인 전 또는 미수 잔액이 있으면 확정 불가 */
  var gate = clientGate(co.client.id);
  if (gate.blocked) { toast(gate.msg); return; }
  /* 규칙 3 — 10만 원 이상은 즉시결제만 (일반 등급한) */
  var coClient = getClient(co.client.id);
  var forced = !creditAllowed(coClient, am.total);
  var payMode = forced ? PAY.IMMEDIATE : (co.payMode === PAY.IMMEDIATE ? PAY.IMMEDIATE : PAY.CREDIT);
  if (payMode === PAY.IMMEDIATE && !co.depositChecked) { toast("입금 완료(결제 확인 요청)에 체크해야 접수됩니다."); return; }
  var acc = accountText();
  openModal(
    '<div class="m-head"><h2 id="modalTitle">발주 확인</h2><button class="icon-btn" data-act="modal-close">✕</button></div>' +
    '<div class="m-body">' +
      '<div class="sum">' +
        '<div class="sum-row"><span class="lb">거래처</span><span>' + esc(name) + "</span></div>" +
        '<div class="sum-row"><span class="lb">배달</span><span>' + slotText(co.ymd, co.round) + "</span></div>" +
        '<div class="sum-row"><span class="lb">품목</span><span>' + am.kinds + "종 · " + am.qty + "개</span></div>" +
        '<div class="sum-row"><span class="lb">상품 합계</span><span>' + won(am.itemsAmount) + "원</span></div>" +
        '<div class="sum-row"><span class="lb">배송비</span><span>' + (am.shipFee ? won(am.shipFee) + "원" : "무료") + "</span></div>" +
        '<div class="sum-row total"><span>합계</span><span class="amt">' + won(am.total) + "원</span></div>" +
        '<div class="sum-row"><span class="lb">결제 방식</span><span><b>' + (payMode === PAY.IMMEDIATE ? "즉시 결제(계좌이체)" : (creditDaysOf(coClient) > 1 ? "외상(약정 기한 내 정산)" : "외상(하루치·다음 날 정산)")) + "</b></span></div>" +
        (combineBase ? '<div class="sum-row"><span class="lb">합배송</span><span>기존 주문 ' + esc(combineBase.no) + "과 함께 배달</span></div>" : "") +
      "</div>" +
      (payMode === PAY.IMMEDIATE
        ? '<div class="pay-box" style="margin-top:12px"><b>입금 확인 요청으로 접수됩니다.</b> ' + won(am.total) + "원을 <b>" + esc(acc.text) + "</b>로 입금하시고, 사장님이 입금을 확인하면 완료됩니다. 미수금(외상)에는 잡히지 않습니다.</div>"
        : (creditDaysOf(coClient) > 1
          ? '<div class="pay-box" style="margin-top:12px"><b>약정에 따라 외상(미수)으로 접수됩니다.</b> 기한이 지난 미수가 쌓이면 다음 발주가 막힙니다.</div>'
          : '<div class="pay-box" style="margin-top:12px"><b>외상(하루치)으로 접수됩니다.</b> 오늘 출고분은 다음 날 정산됩니다. 미수 잔액이 남아 있으면 다음 발주가 막힙니다.</div>')) +
      '<div class="notice" style="margin-top:12px"><span class="ni">' + (isDayConfirmed(co.ymd) ? "✓" : "🌅") + "</span><div>" +
        (isDayConfirmed(co.ymd)
          ? "확정 단가로 접수됩니다."
          : "<b>참고가로 접수됩니다.</b> " + fmtShort(co.ymd) + " 아침 7시에 단가가 확정되면 금액이 다시 계산되어 알려드립니다.") +
      "</div></div>" +
    "</div>" +
    '<div class="m-foot"><button class="btn btn-ghost" data-act="modal-close">그만두기</button>' +
      '<button class="btn btn-primary" data-act="place-confirm">' + (payMode === PAY.IMMEDIATE ? "즉시결제로 접수" : "발주 확정") + "</button></div>"
  );
}

function doPlace() {
  var co = ui.co;
  var cl = getClient(co.client.id);
  ["name", "bizNo", "owner", "addr", "phone"].forEach(function (k) {
    var el = $('[data-co="' + k + '"]');
    if (el) co.client[k] = el.value;
  });
  var memoEl = $('[data-co="memo"]');
  if (memoEl) co.memo = memoEl.value;
  var res = placeOrder({
    ymd:co.ymd, round:co.round, clientId:cl.id, memo:co.memo,
    payMode:co.payMode, depositClaimed:!!co.depositChecked
  });
  if (!res.ok) { toast(res.msg || "발주를 넣지 못했습니다."); closeModal(); renderCheckout(); return; }
  ["name", "bizNo", "owner", "addr", "phone"].forEach(function (k) {
    if (co.client[k] != null) cl[k] = co.client[k];
  });
  if (co.memo) cl.memo = co.memo;
  saveState();
  closeModal();
  ui.co = null;
  ui.orderFilter = "ALL";
  setRoute("orders");
  toast((res.order.payMode === PAY.IMMEDIATE ? "즉시 결제로 접수되었습니다 · " : "발주가 접수되었습니다 · ") + res.order.no);
}

/* ── 단가 확정 ──────────────────────────────────────── */
function doPriceConfirm(ymd) {
  var prices = {};
  var bad = null;
  $$('#admPrices input[data-act="draft"]').forEach(function (inp) {
    var pid = inp.getAttribute("data-pid");
    var v = Number(digits(inp.value));
    if (!(v > 0)) bad = inp;
    prices[pid] = v;
  });
  if (bad) { toast("확정가를 모두 입력해 주세요."); bad.focus(); return; }
  var res = confirmDayPrices(ymd, prices);
  ui.priceDraft[ymd] = prices;
  render();
  var changed = res.changed.map(function (c) {
    var diff = c.after - c.before;
    return "<div class=\"sum-row\"><span class=\"lb\">" + c.no + "</span><span>" + won(c.before) + " → <b>" + won(c.after) +
      "</b> (" + (diff > 0 ? "+" : "") + won(diff) + "원)</span></div>";
  }).join("");
  openModal(
    '<div class="m-head"><h2 id="modalTitle">단가 확정 완료</h2><button class="icon-btn" data-act="modal-close">✕</button></div>' +
    '<div class="m-body">' +
      '<div class="notice green"><span class="ni">✓</span><div><b>' + fmtDotDow(ymd) + " 단가를 확정했습니다.</b> 미확정 발주 " + res.count + "건의 금액을 새 단가로 다시 계산했습니다.</div></div>" +
      '<div class="sum" style="margin-top:12px">' + (changed || '<p class="small">금액이 바뀐 발주는 없습니다.</p>') + "</div>" +
    "</div>" +
    '<div class="m-foot"><button class="btn btn-primary" data-act="modal-close">확인</button></div>'
  );
}

function doPriceUnconfirm(ymd) {
  var d = state.days[ymd];
  if (!d || !d.confirmed) return;
  var affected = state.orders.filter(function (o) {
    return o.ymd === ymd && o.status !== STATUS.CANCELED && o.status !== STATUS.DISPATCHED && o.status !== STATUS.DELIVERED;
  });
  state.days[ymd] = { confirmed:false, confirmedAt:null, prices:null };
  affected.forEach(function (o) {
    o.items.forEach(function (it) {
      var p = findProduct(it.pid);
      if (!p) return;
      it.price = Number(p.ref) || 0;
      it.amount = it.price * it.qty;
    });
    o.itemsAmount = o.items.reduce(function (s, it) { return s + it.amount; }, 0);
    o.shipFee = feeFor(o.itemsAmount);
    o.total = Math.max(0, o.itemsAmount + o.shipFee - (Number(o.claimTotal) || 0));
    o.priceConfirmed = false;
    o.priceMode = "ref";
    o.status = STATUS.PENDING;
  });
  ui.priceDraft[ymd] = null;
  saveState();
  render();
  toast("확정을 취소했습니다. 발주 " + affected.length + "건이 참고가로 돌아갔습니다.");
}

/* ── 설정 저장 ──────────────────────────────────────── */
function saveSettings() {
  ["name", "owner", "bizNo", "addr", "uptae", "jongmok", "taxType", "phone", "bank", "account", "holder"].forEach(function (k) {
    var el = $('[data-store="' + k + '"]');
    if (el) state.store[k] = el.value.trim();
  });
  var minEl = $('[data-policy="minOrder"]');
  var feeEl = $('[data-policy="shipFee"]');
  var areaEl = $('[data-policy="area"]');
  if (minEl) state.policy.minOrder = Math.max(0, Number(digits(minEl.value)) || 0);
  if (feeEl) state.policy.shipFee = Math.max(0, Number(digits(feeEl.value)) || 0);
  if (areaEl) state.policy.area = areaEl.value.trim() || DEFAULT_POLICY.area;
  saveState();
  render();
  toast("설정을 저장했습니다. 거래명세표에 바로 반영됩니다.");
}

function applyPreset(key) {
  var p = STORE_PRESETS[key];
  if (!p) return;
  ["name", "branch", "owner", "bizNo", "addr", "uptae", "jongmok", "taxType", "phone"].forEach(function (k) {
    if (p[k] != null) state.store[k] = p[k];
  });
  saveState();
  render();
  toast(p.label + " 사업자 정보를 불러왔습니다. (아래 저장을 눌러 확정)");
}

/* ══════════════ 클릭 ══════════════ */
function onClick(e) {
  var el = e.target.closest ? e.target.closest("[data-act]") : null;
  if (!el) return;
  var act = el.getAttribute("data-act");
  var pid = el.getAttribute("data-pid");
  var no = el.getAttribute("data-no");

  switch (act) {
    case "go": setRoute(el.getAttribute("data-route")); break;
    case "adm-tab":
      ui.admTab = el.getAttribute("data-tab");
      if (ui.admTab === "prices" && !ui.priceDate) ui.priceDate = addDays(todayYmd(), 1);
      render();
      break;
    case "cart-open": renderCartDrawer(); break;
    case "drawer-close": case "cart-close": closeDrawer(); break;
    case "modal-close": ui.claim = null; closeModal(); break;
    case "scrim": closeDrawer(); closeModal(); break;

    /* 손님 로그인 — 내 가게 1곳만. 거래처 목록은 보이지 않는다. */
    case "login-open": closeDrawer(); setRoute("login"); break;
    case "login": doLogin(); break;
    case "my-open": renderMyAccount(); break;
    case "logout": doLogout(); break;

    /* 품목 검색 */
    case "prod-clear": {
      ui.prodQuery = "";
      var sInp = $("#prodSearch");
      if (sInp) { sInp.value = ""; try { sInp.focus(); } catch (e) {} }
      var clr = $(".ps-clear");
      if (clr) clr.hidden = true;
      renderListMeta(); renderCatChips(); renderProdList();
      break;
    }

    /* 규칙 1 — 사업자 전용 가입 */
    case "signup-open": closeDrawer(); openSignup(); break;
    case "signup-save": saveSignup(); break;
    case "bizfile-view": openBizFile(el.getAttribute("data-cid")); break;
    case "client-approve": {
      var cidA = el.getAttribute("data-cid");
      var cA = getClient(cidA);
      if (approveClient(cidA)) {
        closeModal();
        render();
        toast(cA.name + " 사업자등록증 확인 · 승인 완료. 이제 발주할 수 있습니다.");
      }
      break;
    }
    case "client-reject": {
      var cidR = el.getAttribute("data-cid");
      var cR = getClient(cidR);
      if (rejectClient(cidR)) { closeModal(); render(); toast(cR.name + " 가입을 반려했습니다."); }
      break;
    }

    /* 규칙 3 — 결제 방식 (10만 원 이상은 일반 등급만 즉시결제 고정) */
    case "paymode": {
      if (!ui.co) break;
      var mode = el.getAttribute("data-mode");
      var totalNow = calcAmounts(cartLines(ui.co.ymd)).total;
      if (mode === PAY.IMMEDIATE) {
        ui.co.payMode = PAY.IMMEDIATE;
      } else if (!creditAllowed(getClient(ui.co.client.id), totalNow)) {
        toast("10만 원 이상 주문은 외상이 불가합니다. 즉시 결제로 진행해 주세요.");
        break;
      } else {
        ui.co.payMode = PAY.CREDIT;
        ui.co.depositChecked = false;
      }
      renderCheckout();
      break;
    }

    /* 어제 주문 그대로 담기 — 직전 발주 품목·수량을 한 번에 */
    case "reorder": {
      var ro = applyReorder();
      if (!ro.ok) { toast(ro.msg); break; }
      renderHeader();
      renderProdList();
      renderActionbar();
      if (ui.drawer) renderCartDrawer();
      var msg = "지난 발주 " + ro.kinds + "품목(" + ro.qty + "개)을 바구니에 담았어요.";
      if (ro.skipped.length) msg += " 품절이라 뺀 품목: " + ro.skipped.join(", ") + ".";
      if (ro.capped.length) msg += " 재고만큼만 담았어요: " + ro.capped.join(", ") + ".";
      toast(msg);
      break;
    }

    case "cat": ui.cat = el.getAttribute("data-cat"); renderCatChips(); renderProdList(); break;
    case "list-date": {
      /* 날짜를 고르면 그 날짜의 열린 첫 회차부터 담는다 */
      var ymd = el.getAttribute("data-ymd");
      var opens = openRoundsFor(ymd);
      if (!opens.length) { toast(dayLabel(ymd) + " 배달은 이미 마감됐습니다."); break; }
      var keep = ui.slot && ui.slot.ymd === ymd && opens.filter(function (r) { return r.key === ui.slot.round; }).length;
      ui.slot = { ymd: ymd, round: keep ? ui.slot.round : opens[0].key };
      ui.listDate = ymd;
      ui.cat = "all";
      renderB2B();
      renderActionbar();
      break;
    }

    case "round": {
      var rk = el.getAttribute("data-round");
      var sl = currentSlot();
      var f = findSlot(sl.ymd, rk);
      if (!f || f.phase !== "OPEN") { toast(sl.ymd === todayYmd() ? "오늘 " + roundByKey(rk).label + " 배달은 마감됐습니다." : "마감된 배달입니다."); break; }
      ui.slot = { ymd: sl.ymd, round: rk };
      ui.listDate = sl.ymd;
      renderB2B();
      renderActionbar();
      if (ui.drawer) renderCartDrawer();
      break;
    }

    case "add": cartQty(pid, 1); break;
    case "qty": cartQty(pid, Number(el.getAttribute("data-d"))); break;

    case "checkout":
      if (!cartCount()) { toast("먼저 품목을 담아 주세요."); break; }
      var chkSlot = currentSlot();
      var amCheck = calcAmounts(cartLines(ui.listDate || chkSlot.ymd));
      /* 8. 같은 날 같은 회차 기존 주문이 있으면 최소 주문 없이 합배송 */
      var chkCombine = combineOrderFor(state.currentClientId, chkSlot.ymd, chkSlot.round);
      if (!amCheck.meetsMin && !chkCombine) { toast("최소 주문 " + won(amCheck.minOrder) + "원부터 발주할 수 있어요. " + won(amCheck.shortfall) + "원 더 담아 주세요."); break; }
      var gateCheck = clientGate(state.currentClientId);
      if (gateCheck.blocked) { toast(gateCheck.msg); break; }
      closeDrawer();
      ui.co = null;
      setRoute("checkout");
      break;
    case "co-back": setRoute("b2b"); break;
    case "slot":
      ui.co.ymd = el.getAttribute("data-ymd");
      ui.co.round = el.getAttribute("data-round");
      ui.slot = { ymd: ui.co.ymd, round: ui.co.round };
      ui.listDate = ui.co.ymd;
      renderCheckout();
      break;
    case "place": confirmPlacement(); break;
    case "place-confirm": doPlace(); break;

    case "order-filter": ui.orderFilter = el.getAttribute("data-f"); renderOrders(); break;
    case "cancel": openCancel(no); break;
    case "cancel-yes":
      if (cancelOrder(el.getAttribute("data-no"))) { closeModal(); render(); toast("발주를 취소했습니다."); }
      break;
    case "advance": {
      var advO = findOrder(no);
      if (!advO) break;
      /* 10. 배송 완료는 납품 위치 한 줄 메모를 받고 넘긴다 */
      if (advO.status === STATUS.DISPATCHED) { openDeliveredMemo(no); break; }
      if (advanceOrder(no)) { render(); toast(advO.status === STATUS.DISPATCHED ? "배달 출발로 바꿨습니다." : "주문 상태를 바꿨습니다."); }
      break;
    }
    case "advance-yes": {
      var dlvDone = el.getAttribute("data-mode") === "nomemo" ? "" : (($("#dlvMemo") || {}).value || "");
      var dlvO = completeDelivery(no, dlvDone);
      closeModal();
      render();
      if (dlvO) toast(getClient(dlvO.clientId).name + " 배송 완료" +
        (dlvO.deliverMemo ? " · 납품: " + dlvO.deliverMemo : "") + " — 거래처 발주 내역에도 표시됩니다.");
      break;
    }
    case "dlv-chip": {
      var dlvInp = $("#dlvMemo");
      if (dlvInp) { dlvInp.value = el.getAttribute("data-text") || ""; dlvInp.focus(); }
      break;
    }

    /* 1. 회차별 상차·피킹표 */
    case "pick-open": openPickSheet(el.getAttribute("data-ymd"), el.getAttribute("data-round")); break;
    case "pick-tab":
      ui.pick = { ymd: (ui.pick && ui.pick.ymd) || ui.admDate || todayYmd(), round: el.getAttribute("data-round") || "" };
      renderPickModal();
      break;
    case "pick-print": printPickSheet(el.getAttribute("data-ymd"), el.getAttribute("data-round")); break;

    /* 3. 월말 정산 · CSV */
    case "month-csv": {
      var ymC = el.getAttribute("data-ym") || thisMonth();
      var csvA = monthCsvAll(ymC);
      downloadCsv("hoonie-settlement-" + ymC + ".csv", csvA);
      toast(monthLabel(ymC) + " 거래처별 정산 CSV를 내려받았습니다 (" + (csvA.split("\r\n").length - 2) + "곳)");
      break;
    }
    case "month-csv-client": {
      var ymCC = el.getAttribute("data-ym") || thisMonth();
      var cidCC = el.getAttribute("data-cid") || state.currentClientId;
      downloadCsv("hoonie-my-settlement-" + ymCC + ".csv", monthCsvClient(cidCC, ymCC));
      toast(monthLabel(ymCC) + " 내 거래 내역 CSV를 내려받았습니다.");
      break;
    }
    case "month-print": printMonthSettle(el.getAttribute("data-ym")); break;

    /* 4. 정산 안내 복사 */
    case "settle-copy": openSettlementCopy(el.getAttribute("data-cid")); break;
    case "settle-copy-again": {
      var cidSc = el.getAttribute("data-cid");
      var oksc = copyText(settlementMessage(cidSc));
      toast(oksc ? "정산 안내 문구를 다시 복사했습니다." : "문구를 길게 눌러 복사해 주세요.");
      break;
    }

    /* 5. 단골 이탈 */
    case "idle-open": openIdleModal(); break;

    /* 9. 품절 대체품 — 사장님이 직접 지정 */
    case "sub-open": openSubstitute(pid); break;
    case "sub-set": {
      var subP = setSubstitute(el.getAttribute("data-pid"), el.getAttribute("data-sub") || "");
      closeModal();
      renderAdminPrices();
      if (subP) toast(subP.name + " 품절 대체품 — " + (subP.sub ? findProduct(subP.sub).name : "자동 추천") + "으로 정했습니다.");
      break;
    }

    /* 6. 거래처별 특별 단가 */
    case "special-open": openSpecialPrices(el.getAttribute("data-cid")); break;
    case "special-save": {
      var cidSp = el.getAttribute("data-cid");
      $$("#modalInner input[data-sp]").forEach(function (inp) {
        setSpecialPrice(cidSp, inp.getAttribute("data-sp"), inp.value);
      });
      closeModal();
      renderAdminClients();
      var spN = specialPriceCount(cidSp);
      toast(getClient(cidSp).name + " 특별 단가를 저장했습니다" +
        (spN ? " (" + spN + "품목 적용)" : " (모두 기본가로 돌아감)") + " — 이 거래처 화면에만 적용됩니다.");
      break;
    }

    /* 7. 즐겨찾기 */
    case "fav": {
      var fv = toggleFav(state.currentClientId, pid);
      if (!fv) break;
      renderFavBox();
      renderProdList();
      renderActionbar();
      if (ui.drawer) { if (cartCount() > 0) renderCartDrawer(); else closeDrawer(); }
      toast(fv.on ? fv.product.name + " ★ 즐겨찾기에 고정했습니다." : fv.product.name + " 즐겨찾기에서 뻗습니다.");
      break;
    }

    /* 반품·클레임 — 손님 접수 → 사장님 승인/반려 */
    case "claim-open": {
      var coO = findOrder(no);
      if (!coO) break;
      if (!canClaim(coO)) { toast("배송중·배송완료 주문만 반품·클레임을 낼 수 있습니다."); break; }
      ui.claim = { orderNo:no, items:[], reason:"", memo:"", photos:[] };
      renderClaimModal();
      break;
    }
    case "claim-close": ui.claim = null; closeModal(); break;
    case "claim-item": {
      var cid2 = el.getAttribute("data-pid");
      var cDraft = ui.claim;
      if (!cDraft) break;
      var at = cDraft.items.indexOf(cid2);
      if (at >= 0) cDraft.items.splice(at, 1); else cDraft.items.push(cid2);
      renderClaimModal();
      break;
    }
    case "claim-reason":
      if (!ui.claim) break;
      ui.claim.reason = el.getAttribute("data-reason");
      renderClaimModal();
      break;
    case "claim-photo-del":
      if (!ui.claim) break;
      ui.claim.photos.splice(Number(el.getAttribute("data-idx")), 1);
      renderClaimModal();
      break;
    case "claim-save": {
      var cres = addClaim(ui.claim);
      if (!cres.ok) { toast(cres.msg); break; }
      ui.claim = null;
      closeModal();
      render();
      toast("반품·클레임을 접수했습니다. 사장님이 확인해 \"승인/반려\"하면 알려 드릴게요.");
      break;
    }
    case "claim-photo-close": closeModal(); break;
    case "claim-photo-open": {
      var cOpen = findClaim(el.getAttribute("data-id"));
      var ix = Number(el.getAttribute("data-idx"));
      if (!cOpen || !cOpen.photos[ix]) break;
      openClaimPhoto(cOpen.photos[ix].dataUrl,
        getClient(cOpen.clientId).name + " · " + cOpen.orderNo + " · " + cOpen.reason);
      break;
    }
    case "claim-approve": {
      var okc = approveClaim(el.getAttribute("data-id"));
      if (!okc) { toast("이미 처리된 클레임입니다."); break; }
      render();
      toast(getClient(okc.order.clientId).name + " 반품 승인 — " + won(okc.amount) + "원 차감 (미수 " +
        won(buildLedger(okc.order.clientId).balance) + "원)");
      break;
    }
    case "claim-reject": {
      var no2 = rejectClaim(el.getAttribute("data-id"));
      if (!no2) { toast("이미 처리된 클레임입니다."); break; }
      render();
      toast(getClient(no2.claim.clientId).name + " 반품 클레임을 반려했습니다 (금액 변동 없음).");
      break;
    }

    case "stmt-open": openStatement(no); break;
    case "stmt-print": if (IS_ADMIN) printStatement(el.getAttribute("data-no")); break;
    case "batch-round": openBatchPrint(el.getAttribute("data-ymd"), el.getAttribute("data-round")); break;
    case "batch-day": openBatchPrint(el.getAttribute("data-ymd"), ""); break;
    case "batch-print": printBatch(el.getAttribute("data-ymd"), el.getAttribute("data-round")); break;

    /* 거래처 전환은 사장님 화면에서만 (손님 화면에는 목록이 없다) */
    case "client-view": {
      var cidV = el.getAttribute("data-cid");
      state.currentClientId = cidV;
      saveState();
      var w = window.open("index.html", "_blank");
      if (!w) location.href = "index.html";
      toast(getClient(cidV).name + " 거래처로 손님 화면을 열었습니다.");
      break;
    }

    case "restock": openRestock(pid); break;
    case "restock-save": {
      var ids = [pid];
      addAlert(state.currentClientId, ids);
      closeModal();
      render();
      toast("재입고 알림을 신청했습니다. 입고되면 연락드릴게요.");
      break;
    }

    case "adm-date": ui.admDate = el.getAttribute("data-ymd"); renderAdmin(); break;
    case "price-date":
      ui.priceDate = el.getAttribute("data-ymd");
      priceDraftFor(ui.priceDate);
      renderAdmin();
      break;
    case "price-confirm": doPriceConfirm(el.getAttribute("data-ymd")); break;
    case "price-unconfirm": doPriceUnconfirm(el.getAttribute("data-ymd")); break;

    /* 품목 추가 · 삭제 · 품절 · 영수증 일괄 입력 */
    case "prod-form-open":
      if (!ui.prodForm) ui.prodForm = { cat:"veg", unitLabel:"1박스", grade:"" };
      renderAdminPrices();
      var pf = $("#prodForm");
      if (pf) pf.scrollIntoView({ block:"center" });
      break;
    case "prod-form-close": ui.prodForm = null; renderAdminPrices(); break;
    case "prod-add": {
      var res = addProduct(readProdForm());
      if (!res.ok) { toast(res.msg); break; }
      ui.prodForm = null;
      if (ui.bulkText) applyBulkPrices(ui.bulkText, ui.priceDate);   /* 영수증 줄과 이름이 맞으면 그 단가도 */
      renderAdminPrices();
      toast(res.product.name + " 품목을 추가했습니다 · " + won(res.product.ref) + "원 · 재고 " + res.product.stock);
      break;
    }
    case "prod-delete": openDeleteProduct(el.getAttribute("data-pid")); break;
    case "prod-delete-yes": {
      if (state.products.length <= 1) {
        closeModal();
        toast("품목은 최소 1개는 남겨야 합니다.");
        break;
      }
      var gone = deleteProduct(el.getAttribute("data-pid"));
      closeModal();
      renderAdminPrices();
      if (gone) toast(gone.name + " 품목을 뺐습니다. 손님 단가표에서도 사라졌습니다.");
      break;
    }
    case "prod-soldout": {
      var ps = toggleSoldOut(el.getAttribute("data-pid"));
      renderAdminPrices();
      if (ps) toast(ps.name + (ps.soldOut ? " — 품절로 바꿨습니다." : " — 다시 판매합니다."));
      break;
    }
    case "bulk-apply": {
      var txt = ($("#bulkText") || {}).value;
      if (txt != null) ui.bulkText = txt;
      if (!String(ui.bulkText || "").trim()) { toast("붙여넣은 단가가 없습니다. 예) 대파 2800"); break; }
      var br = applyBulkPrices(ui.bulkText, el.getAttribute("data-ymd") || ui.priceDate);
      renderAdminPrices();
      toast(br.applied.length
        ? br.applied.length + "개 품목의 확정가를 채웠습니다." + (br.unmatched.length ? " 없는 품목 " + br.unmatched.length + "줄은 아래에서 추가할 수 있어요." : "")
        : "맞는 품목이 없습니다. 품목 이름을 확인하거나 새 품목으로 추가해 주세요.");
      break;
    }
    case "bulk-clear":
      ui.bulkText = ""; ui.bulkResult = null;
      renderAdminPrices();
      break;
    case "bulk-add": {
      var r = (ui.bulkResult && ui.bulkResult.unmatched[Number(el.getAttribute("data-idx"))]) || null;
      if (!r) break;
      ui.prodForm = { base:r.name, price:r.price, cat:guessCat(r.name).cat, unitLabel:"1박스", grade:"", stock:"" };
      renderAdminPrices();
      var nf = $("#prodForm");
      if (nf) nf.scrollIntoView({ block:"center" });
      toast("새 품목으로 추가할 내용을 확인하고 ‘품목 추가’를 눌러 주세요.");
      break;
    }

    case "payment-open": openPayment(el.getAttribute("data-cid")); break;
    case "pay-full": {
      var cidF = el.getAttribute("data-cid");
      var paid = addFullPayment(cidF);
      render();
      toast(paid ? getClient(cidF).name + " 미수 " + won(paid) + "원 전액 입금 처리 — 발주가 다시 열렸습니다." : "미수 잔액이 없습니다.");
      break;
    }
    case "deposit-confirm": {
      var noD = el.getAttribute("data-no");
      if (confirmDeposit(noD)) { render(); toast("입금 확인 완료로 표시했습니다. " + noD); }
      break;
    }
    case "payment-save": {
      var cid = el.getAttribute("data-cid");
      var amt = Number(digits(($("#payAmt") || {}).value));
      if (!(amt > 0)) { toast("입금액을 입력해 주세요."); break; }
      addPayment(cid, ($("#payYmd") || {}).value || todayYmd(), amt, ($("#payMemo") || {}).value || "");
      closeModal();
      renderAdminClients();
      toast(won(amt) + "원 입금을 기록했습니다.");
      break;
    }
    case "client-edit": openClientEdit(el.getAttribute("data-cid")); break;
    case "client-save": {
      var c2 = getClient(el.getAttribute("data-cid"));
      ["name", "bizNo", "owner", "addr", "uptae", "jongmok", "phone", "memo"].forEach(function (k) {
        var f = $('[data-cl="' + k + '"]');
        if (f) c2[k] = f.value.trim();
      });
      var pb = $('[data-cl="prevBalance"]');
      if (pb) c2.prevBalance = Number(digits(pb.value)) || 0;
      saveState();
      closeModal();
      renderAdminClients();
      toast("거래처 정보를 저장했습니다.");
      break;
    }
    case "client-stmt": {
      var cid2 = el.getAttribute("data-cid");
      var mine = ordersOf(cid2).filter(function (o) { return o.status !== STATUS.CANCELED; })
        .sort(function (a, b) { return a.no < b.no ? 1 : -1; });
      if (!mine.length) { toast("이 거래처의 전표가 아직 없습니다."); break; }
      openStatement(mine[0].no);
      break;
    }

    case "alert-done": {
      var a = state.alerts.filter(function (x) { return x.id === el.getAttribute("data-id"); })[0];
      if (a) { a.status = "DONE"; a.doneAt = nowIso(); saveState(); renderAdmin(); toast("처리 완료로 표시했습니다."); }
      break;
    }

    case "preset": applyPreset(el.getAttribute("data-key")); break;
    case "settings-save": saveSettings(); break;
  }
}

function openCancel(no) {
  var o = findOrder(no);
  if (!o) return;
  openModal(
    '<div class="m-head"><h2 id="modalTitle">발주 취소</h2><button class="icon-btn" data-act="modal-close">✕</button></div>' +
    '<div class="m-body"><p class="small">' + o.no + " · " + slotText(o.ymd, o.round) + " 배달 발주를 취소할까요?<br>담은 품목의 재고는 다시 채워집니다.</p>" +
      '<div class="ocard-items" style="margin-top:10px">' + itemLine(o) + " · <b>" + won(o.total) + "원</b></div></div>" +
    '<div class="m-foot"><button class="btn btn-ghost" data-act="modal-close">그만두기</button>' +
      '<button class="btn btn-primary" style="background:var(--red);border-color:var(--red)" data-act="cancel-yes" data-no="' + o.no + '">발주 취소</button></div>'
  );
}

/* ══════════════ 입력 ══════════════ */
function onInput(e) {
  var el = e.target;
  if (!el || !el.getAttribute) return;
  var act = el.getAttribute("data-act");

  if (el.hasAttribute("data-co")) {
    var k = el.getAttribute("data-co");
    if (ui.co) {
      if (k === "memo") ui.co.memo = el.value;
      else ui.co.client[k] = el.value;
    }
    return;
  }
  if (act === "claim-memo") { if (ui.claim) ui.claim.memo = el.value; return; }
  if (act === "su-biz") {
    var fmt = fmtBizNo(el.value);
    if (el.value !== fmt) el.value = fmt;
    return;
  }
  if (act === "lg-phone") {
    var fph = fmtPhone(el.value);
    if (el.value !== fph) el.value = fph;
    return;
  }
  if (act === "prod-search") {
    ui.prodQuery = el.value;
    if (el.value.trim() && ui.cat !== "all") ui.cat = "all";
    var clrBtn = $(".ps-clear");
    if (clrBtn) clrBtn.hidden = !el.value;
    renderListMeta();
    renderCatChips();
    renderProdList();
    return;
  }
  if (act === "draft") {
    var ymd = ui.priceDate;
    if (!ui.priceDraft[ymd]) priceDraftFor(ymd);
    ui.priceDraft[ymd][el.getAttribute("data-pid")] = Number(digits(el.value));
    el.setAttribute("data-dirty", "1");
    updateMarginBox(findProduct(el.getAttribute("data-pid")), el.closest(".pm-row"));
    return;
  }
  if (act === "cost") {
    var cp = findProduct(el.getAttribute("data-pid"));
    if (!cp) return;
    cp.cost = Math.max(0, Number(digits(el.value)) || 0);
    saveState();
    updateMarginBox(cp, el.closest(".pm-row"));
    return;
  }
  if (act === "dlv-memo") return;
  if (act === "bulk-text") { ui.bulkText = el.value; return; }
  if (el.hasAttribute("data-np")) {
    ui.prodForm = ui.prodForm || {};
    ui.prodForm[el.getAttribute("data-np")] = el.value;
    return;
  }
  if (act === "su-phone") {
    var sph = fmtPhone(el.value);
    if (el.value !== sph) el.value = sph;
    return;
  }
  if (act === "client-search") {
    ui.clientQuery = el.value;
    renderAdminClients();
    var f = $("#clientSearch");
    if (f) { f.focus(); var v = f.value; f.value = ""; f.value = v; }
    return;
  }
}

function onChange(e) {
  var el = e.target;
  if (!el || !el.getAttribute) return;
  var act = el.getAttribute("data-act");

  if (act === "qty-set") {
    var pid = el.getAttribute("data-pid");
    var v = Number(digits(el.value));
    cartQty(pid, 0, v);
    return;
  }
  if (act === "claim-photo") { addClaimPhotos(el); return; }
  if (act === "client-tier") {
    var tcl = setClientTier(el.getAttribute("data-cid"), el.value);
    renderAdminClients();
    if (tcl) toast(tcl.name + " 거래처 등급을 " + tierShort(tcl) + "로 바꿨습니다 · 손님 화면에는 표시되지 않습니다.");
    return;
  }
  if (act === "su-file") { onSignupFile(el); return; }
  if (act === "bulk-text") { ui.bulkText = el.value; return; }
  if (act === "deposit-check") {
    if (!ui.co) return;
    ui.co.depositChecked = !!el.checked;
    renderCheckout();
    return;
  }
  if (act === "ref") {
    var p = findProduct(el.getAttribute("data-pid"));
    if (!p) return;
    var nv = Number(digits(el.value));
    if (!(nv > 0)) { toast("참고가는 0보다 커야 합니다."); renderAdminPrices(); return; }
    setProductRef(p.id, nv);
    renderAdminPrices();
    toast(p.name + " 참고가를 " + won(nv) + "원으로 바꿨습니다 (손님 화면에도 반영).");
    return;
  }
  if (act === "stock") {
    var sp = setProductStock(el.getAttribute("data-pid"), el.value);
    if (!sp) return;
    renderAdminPrices();
    toast(sp.name + " 재고를 " + sp.stock + "개로 바꿨습니다." + (sp.stock === 0 ? " — 품절로 표시됩니다." : ""));
    return;
  }
  if (act === "bulk-file") { onBulkFile(el); return; }
  if (el.hasAttribute("data-store") && (el.getAttribute("data-store") === "bizNo")) {
    el.value = fmtBizNo(el.value);
    return;
  }
}

/* ══════════════ 시작 ══════════════ */
(function init() {
  document.addEventListener("click", onClick);
  document.addEventListener("input", onInput);
  document.addEventListener("change", onChange);
  $("#scrim").addEventListener("click", function () { closeDrawer(); closeModal(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeDrawer(); closeModal(); }
  });
  var rt = null;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(fitStatement, 120);
  });

  /* 푸터 사업자 정보 */
  var s = state.store;
  $("#footBiz").innerHTML =
    "<div><dt>상호</dt><dd>" + esc(s.name) + " (" + esc(s.branch) + ")</dd></div>" +
    "<div><dt>대표자</dt><dd>" + esc(s.owner) + "</dd></div>" +
    "<div><dt>사업자등록번호</dt><dd>" + esc(s.bizNo) + " (" + esc(s.taxType) + ")</dd></div>" +
    "<div><dt>사업장소재지</dt><dd>" + esc(s.addr) + "</dd></div>" +
    "<div><dt>전화</dt><dd>" + esc(s.phone) + "</dd></div>";
  $("#footMin").textContent = won(state.policy.minOrder);
  $("#footFee").textContent = Number(state.policy.shipFee) ? won(state.policy.shipFee) + "원 배송" : "무료배송";
  var fineMin = $("#fineMin"), fineFee = $("#fineFee");
  if (fineMin) fineMin.textContent = won(state.policy.minOrder);
  if (fineFee) fineFee.textContent = Number(state.policy.shipFee) ? won(state.policy.shipFee) + "원" : "무료";

  /* ── 손님/사장님 창 실시간 동기화 ──────────────────────
     두 화면은 같은 localStorage 를 쓴다. 사장님이 단가 확정 / 배송 시작 / 배송 완료를
     누르면 손님 화면이 저장값을 다시 읽어 4단계 진행 바와 단가·▲▼를 바로 따라간다. */
  function syncFromStorage() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { return; }
    if (!raw || raw === lastRaw) return;
    var ae = document.activeElement;
    if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;   /* 입력 중이면 다음 차례에 */
    lastRaw = raw;
    state = loadState();
    render();
  }
  window.addEventListener("storage", function (e) { if (!e.key || e.key === KEY) syncFromStorage(); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) syncFromStorage(); });
  /* 창을 다시 보면 바로 맞추고, 보고 있는 동안에도 1.2초마다 저장값을 확인한다 */
  setInterval(syncFromStorage, 1200);

  try { lastRaw = localStorage.getItem(KEY) || JSON.stringify(state); } catch (e) { lastRaw = ""; }

  /* 다른 기기의 거래처·사장님 화면과 공용 DB로 맞추기 (5초마다) */
  sbStart();

  ui.listDate = defaultSlot().ymd;
  setRoute(HOME_ROUTE);

  /* htmlpreview.github.io 로 볼 때는 상대 링크가 htmlpreview 루트를 가리켜 깨진다.
     주소에 실린 원본(blob …/admin.html)을 …/index.html 로 바꿔 절대 주소로 만든다. */
  if (IS_ADMIN && location.hostname === "htmlpreview.github.io") {
    var q = location.search.replace(/^\?/, "");
    if (/admin\.html/.test(q)) {
      var target = "https://htmlpreview.github.io/?" + q.replace(/admin\.html.*$/, "index.html");
      $$("a[href$='index.html']").forEach(function (a) { a.href = target; });
    }
  }

  /* 검증·디버그용 (화면에는 영향 없음) */
  window.__hoonie = {
    get state() { return state; },
    get cart() { return cart; },
    get ui() { return ui; },
    statementSheet: statementSheet,
    render: render,
    setRoute: setRoute,
    findOrder: findOrder,
    placeOrder: placeOrder,
    calcAmounts: calcAmounts,
    batchOrders: batchOrders,
    clientGate: clientGate,
    buildLedger: buildLedger,
    addFullPayment: addFullPayment,
    addPayment: addPayment,
    approveClient: approveClient,
    pendingClients: pendingClients,
    confirmDeposit: confirmDeposit,
    PAY: PAY,
    CLIENT: CLIENT,
    TIERS: TIERS,
    tierOf: tierOf,
    setClientTier: setClientTier,
    creditAging: creditAging,
    creditDaysOf: creditDaysOf,
    canClaim: canClaim,
    claimsOf: claimsOf,
    openClaims: openClaims,
    addClaim: addClaim,
    approveClaim: approveClaim,
    rejectClaim: rejectClaim,
    foundClaim: findClaim,
    /* v9 — 사장님 핵심 10기능 */
    pickSheet: pickSheet,
    pickSheetHTML: pickSheetHTML,
    marginOf: marginOf,
    monthStat: monthStat,
    monthCsvAll: monthCsvAll,
    monthCsvClient: monthCsvClient,
    monthLabel: monthLabel,
    monthSheetHTML: monthSheetHTML,
    settlementMessage: settlementMessage,
    copyText: copyText,
    idleClients: idleClients,
    priceForClient: priceForClient,
    specialPriceOf: specialPriceOf,
    specialPriceCount: specialPriceCount,
    setSpecialPrice: setSpecialPrice,
    favProducts: favProducts,
    isFav: isFav,
    toggleFav: toggleFav,
    combineOrderFor: combineOrderFor,
    substituteOf: substituteOf,
    setSubstitute: setSubstitute,
    completeDelivery: completeDelivery,
    daysBetween: daysBetween
  };
})();

})();
