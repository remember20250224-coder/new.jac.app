const path = require("path");
const fs = require("fs/promises");
const express = require("express");
const session = require("express-session");
require("dotenv").config();

const app = express();

// ====== Config ======
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "dev_session_secret_change_me";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "changeme";

const DATA_DIR = path.join(__dirname, "data");
const RESULTS_PATH = path.join(DATA_DIR, "results.json");

// ====== QUEST content (from provided PDF) ======
const QUEST = {
  group1: {
    A: `我是個獨立、有主見、有自信的人。 我清楚知道自己想要甚麼，亦會付
諸行動去爭取想要的東西。我不喜歡投閒置散，所以我會訂立目標、設
法執行，而且我喜歡成功完成每件事情的感覺。與人相處時，我不一定
會與人有衝突或有明顯的競爭，但我會盡力堅持自己的想法，亦不會讓
人擺佈。基本上，我是個積極的人，我的生活哲學是：「工作時努力工
作，玩樂時盡情玩樂」。`,
    B: `我為人比較低調，給人安靜內斂的感覺。我不喜歡與人競爭或帶領別
人，亦不會主動表達自己的想法或堅持自己的意見。不過如果沒有人注
意我的努力，或不尊重我的想法，我會感覺失落； 但我選擇離群也不會
強烈主動爭取。生活中，我有時會設定一些目標，但我不覺得一家要徹
底完成，即使沒有達成，我仍然享受過中思考的過程，生活還是可以很
滿足。`,
    C: `我是個勤奮、認真、有毅力的人。我不喜歡失信於人，或是無法達成他
人期望的感覺，所以我一定會先盡力做完分內的事，才休息和考慮自己
的需要。我會盡量避免犯錯，錯誤會令我感到非常難受。我相信一分耕
耘 ，一分收穫，所以在爭取福利和報酬時，一定要先拿出表現給人看。
我期望別人讚賞我的盡責，但有時我的努力沒有被別人認可時，也會讓
我忍不住抱怨一下。`,
  },
  group2: {
    X: `我爲人積極樂觀，認爲凡事“船到橋頭自然直”，風雨過後就是晴天。
假若有難題產生時，我會先設法找一些輕鬆、快樂的事情，讓自己不
要糾結在問題上。雖然事情重要，但人情要先顧，我喜歡維持與他人
愉快相處的氣氛； 所以我不會讓人知道我內心的煩惱。`,
    Y: `我是個充滿強烈感情的人，亦不喜歡隱藏自己的感覺，無論是生氣、
難過和擔憂。我會表達自己主觀的感受和想法，因為瞭解雙方真實的
想法或感覺，才能對症下藥，找到解決方法。對我而言，信任是人際
關係重要的一環，而真誠就是建立信任感的方法； 所以我期望別人亦
坦誠溝通。`,
    Z: `我為人理性、客觀，遇到問題時，我會運用邏輯思考去分析評估解決
方案。我會避免感情用事，盡量不會讓情緒影響到真正重要的事情，
所以會保持冷靜，不將個人感受涉入人與人衝突的事件中。對我而
言，衝突的產生只是由於對事情的觀點不同，只要釐清事實，問題就
能解決。`,
  },
};

// ====== Mapping table (EXACT as provided) ======
const CODE_MAP = {
  AX: { typeNumber: 7, typeName: "熱心者", traits: ["生氣勃勃的", "一心多用的", "易衝動的"] },
  AY: { typeNumber: 8, typeName: "挑戰者", traits: ["有自信的", "果斷的", "專橫的"] },
  AZ: { typeNumber: 3, typeName: "成功者", traits: ["適應性強的", "雄心勃勃的", "注意形象的"] },
  BX: { typeNumber: 9, typeName: "調解者", traits: ["包容量大的", "使人恢復信心的", "安於現狀的"] },
  BY: { typeNumber: 4, typeName: "個人者", traits: ["有直覺力的", "有審美能力的", "只顧自己的"] },
  BZ: { typeNumber: 5, typeName: "調查者", traits: ["觀察敏銳的", "有創新精神的", "抽離的"] },
  CX: { typeNumber: 2, typeName: "助人者", traits: ["有關愛的", "慷慨大方的", "有佔有欲的"] },
  CY: { typeNumber: 6, typeName: "忠心者", traits: ["投入的", "有責任感的", "自我保護的"] },
  CZ: { typeNumber: 1, typeName: "改革者", traits: ["理性的", "有原則的", "有自制能力的"] },
};

// ====== Middleware ======
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ====== Helpers ======
async function ensureResultsFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(RESULTS_PATH);
  } catch {
    await fs.writeFile(RESULTS_PATH, "[]", "utf8");
  }
}

async function readResults() {
  await ensureResultsFile();
  const raw = await fs.readFile(RESULTS_PATH, "utf8");
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function appendResult(record) {
  const all = await readResults();
  all.push(record);
  await fs.writeFile(RESULTS_PATH, JSON.stringify(all, null, 2), "utf8");
}

function requireIntake(req, res, next) {
  if (!req.session.intake) return res.redirect("/intake");
  next();
}

function requireGroup1(req, res, next) {
  if (!req.session.group1) return res.redirect("/test/1");
  next();
}

function requireGroup2(req, res, next) {
  if (!req.session.group2) return res.redirect("/test/2");
  next();
}

function requireAdminToken(req, res, next) {
  const token = req.query.token;
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(403).send("Forbidden: invalid token");
  }
  next();
}

function toInt0to100(v) {
  const n = Number(v);
  if (!Number.isInteger(n)) return null;
  if (n < 0 || n > 100) return null;
  return n;
}

function validateAllocation(scoresObj, labels) {
  // labels: ["A","B","C"] etc.
  const out = {};
  let sum = 0;

  for (const k of labels) {
    const n = toInt0to100(scoresObj[k]);
    if (n === null) return { ok: false, error: "分數必須為 0–100 的整數。" };
    out[k] = n;
    sum += n;
  }
  if (sum !== 100) return { ok: false, error: "三項分數總和必須等於 100。" };

  return { ok: true, data: out };
}

function pickHighestWithTieBreak(scores, order) {
  // order defines tie-break priority (earlier wins)
  let bestKey = order[0];
  let bestVal = scores[bestKey];

  for (const k of order) {
    const v = scores[k];
    if (v > bestVal) {
      bestVal = v;
      bestKey = k;
    }
    // ties: do nothing because earlier (already chosen) wins
  }
  return bestKey;
}

function escapeCsv(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function makeCsv(records) {
  const headers = [
    "timestampISO",
    "nickname",
    "class_group",
    "email",
    "consent",
    "group1_A",
    "group1_B",
    "group1_C",
    "group2_X",
    "group2_Y",
    "group2_Z",
    "code",
    "typeNumber",
    "typeName",
    "traits",
  ];

  const lines = [headers.join(",")];

  for (const r of records) {
    const row = [
      r.timestampISO,
      r.nickname,
      r.class_group || "",
      r.email || "",
      r.consent ? "true" : "false",
      r.group1?.A ?? "",
      r.group1?.B ?? "",
      r.group1?.C ?? "",
      r.group2?.X ?? "",
      r.group2?.Y ?? "",
      r.group2?.Z ?? "",
      r.code,
      r.typeNumber,
      r.typeName,
      (r.traits || []).join(" / "),
    ].map(escapeCsv);

    lines.push(row.join(","));
  }

  // UTF-8 BOM for Excel
  return "\uFEFF" + lines.join("\n");
}

// ====== Routes ======

// 1) Landing
app.get("/", (req, res) => {
  res.render("landing", {
    title: "QUEST 九型人格快速測試",
  });
});

// 2) Intake
app.get("/intake", (req, res) => {
  res.render("intake", {
    title: "填寫資料",
    step: "步驟 1/3",
    error: null,
    values: req.session.intake || { nickname: "", class_group: "", email: "", consent: false },
  });
});

app.post("/intake", (req, res) => {
  const nickname = (req.body.nickname || "").trim();
  const class_group = (req.body.class_group || "").trim();
  const email = (req.body.email || "").trim();
  const consent = req.body.consent === "on";

  if (!nickname) {
    return res.status(400).render("intake", {
      title: "填寫資料",
      step: "步驟 1/3",
      error: "請填寫「暱稱」。",
      values: { nickname, class_group, email, consent },
    });
  }
  if (!consent) {
    return res.status(400).render("intake", {
      title: "填寫資料",
      step: "步驟 1/3",
      error: "請勾選同意聲明後才可開始測試。",
      values: { nickname, class_group, email, consent },
    });
  }

  // reset any previous run
  req.session.intake = { nickname, class_group, email, consent: true };
  req.session.group1 = null;
  req.session.group2 = null;
  req.session.savedResult = false;

  return res.redirect("/test/1");
});

// 3) Test group 1
app.get("/test/1", requireIntake, (req, res) => {
  res.render("test", {
    title: "第一組",
    step: "步驟 2/3",
    groupLabel: "第一組",
    labels: ["A", "B", "C"],
    statements: QUEST.group1,
    actionUrl: "/test/1",
    values: req.session.group1 || { A: 0, B: 0, C: 0 },
    error: null,
  });
});

app.post("/test/1", requireIntake, (req, res) => {
  const check = validateAllocation(req.body, ["A", "B", "C"]);
  if (!check.ok) {
    return res.status(400).render("test", {
      title: "第一組",
      step: "步驟 2/3",
      groupLabel: "第一組",
      labels: ["A", "B", "C"],
      statements: QUEST.group1,
      actionUrl: "/test/1",
      values: { A: req.body.A, B: req.body.B, C: req.body.C },
      error: check.error,
    });
  }

  req.session.group1 = check.data;
  return res.redirect("/test/2");
});

// 4) Test group 2
app.get("/test/2", requireIntake, requireGroup1, (req, res) => {
  res.render("test", {
    title: "第二組",
    step: "步驟 2/3",
    groupLabel: "第二組",
    labels: ["X", "Y", "Z"],
    statements: QUEST.group2,
    actionUrl: "/test/2",
    values: req.session.group2 || { X: 0, Y: 0, Z: 0 },
    error: null,
  });
});

app.post("/test/2", requireIntake, requireGroup1, (req, res) => {
  const check = validateAllocation(req.body, ["X", "Y", "Z"]);
  if (!check.ok) {
    return res.status(400).render("test", {
      title: "第二組",
      step: "步驟 2/3",
      groupLabel: "第二組",
      labels: ["X", "Y", "Z"],
      statements: QUEST.group2,
      actionUrl: "/test/2",
      values: { X: req.body.X, Y: req.body.Y, Z: req.body.Z },
      error: check.error,
    });
  }

  req.session.group2 = check.data;
  return res.redirect("/result");
});

// 5) Result
app.get("/result", requireIntake, requireGroup1, requireGroup2, async (req, res) => {
  const g1 = req.session.group1;
  const g2 = req.session.group2;

  const chosen1 = pickHighestWithTieBreak(g1, ["A", "B", "C"]); // tie-break A > B > C
  const chosen2 = pickHighestWithTieBreak(g2, ["X", "Y", "Z"]); // tie-break X > Y > Z
  const code = `${chosen1}${chosen2}`;

  const mapped = CODE_MAP[code];
  // In theory always exists due to 3x3 combinations
  const typeNumber = mapped?.typeNumber ?? null;
  const typeName = mapped?.typeName ?? "（未找到對應類型）";
  const traits = mapped?.traits ?? [];

  // Save record once per session
  if (!req.session.savedResult) {
    const intake = req.session.intake;

    const record = {
      timestampISO: new Date().toISOString(),
      nickname: intake.nickname,
      class_group: intake.class_group || "",
      email: intake.email || "",
      consent: true,
      group1: { A: g1.A, B: g1.B, C: g1.C },
      group2: { X: g2.X, Y: g2.Y, Z: g2.Z },
      code,
      typeNumber,
      typeName,
      traits,
    };

    try {
      await appendResult(record);
      req.session.savedResult = true;
    } catch (e) {
      // Don't block showing result if save fails; show warning instead
      console.error("Failed to save result:", e);
      req.session.saveWarning = "（提示：本次結果未能成功儲存到本機檔案。）";
    }
  }

  res.render("result", {
    title: "測試結果",
    step: "步驟 3/3",
    intake: req.session.intake,
    group1: g1,
    group2: g2,
    chosen1,
    chosen2,
    code,
    typeNumber,
    typeName,
    traits,
    saveWarning: req.session.saveWarning || null,
  });
});

// Optional reset
app.get("/reset", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// 6) Admin
app.get("/admin/results", requireAdminToken, async (req, res) => {
  const records = await readResults();
  res.render("admin_results", {
    title: "Admin - Results",
    token: req.query.token,
    records,
  });
});

app.get("/admin/export.csv", requireAdminToken, async (req, res) => {
  const records = await readResults();
  const csv = makeCsv(records);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="quest_results.csv"`);
  res.send(csv);
});

// ====== Init (works for local + Vercel serverless) ======
const initPromise = ensureResultsFile().catch((err) => {
  // On serverless, the filesystem may be read-only or non-persistent.
  // We log the error so you can diagnose, but we don't crash the function.
  console.error("Init results file failed:", err);
});

// ====== Start (local dev only) ======
if (require.main === module) {
  initPromise
    .then(() => {
      app.listen(PORT, () => {
        console.log(`QUEST app running at http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to init results file:", err);
      process.exit(1);
    });
}

// ====== Export for Vercel ======

const path = require("path");

// SPA fallback for React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


module.exports = app;

    });
  })
  .catch((err) => {
    console.error("Failed to init results file:", err);
    process.exit(1);
  });