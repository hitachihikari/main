(() => {
  "use strict";

  const BOOK_CATEGORIES = {
    OT: [
      {
        label: "律法（モーセ五書）",
        books: [
          ["創世記", "創世記"],
          ["出エジプト記", "出エジプト記"],
          ["レビ記", "レビ記"],
          ["民数記", "民数記"],
          ["申命記", "申命記"],
        ],
      },
      {
        label: "歴史書",
        books: [
          ["ヨシュア記", "ヨシュア記"],
          ["士師記", "士師記"],
          ["ルツ記", "ルツ記"],
          ["1サムエル記", "1サムエル記"],
          ["2サムエル記", "2サムエル記"],
          ["1列王記", "1列王記"],
          ["2列王記", "2列王記"],
          ["1歴代誌", "1歴代誌"],
          ["2歴代誌", "2歴代誌"],
          ["エズラ記", "エズラ記"],
          ["ネヘミヤ記", "ネヘミヤ記"],
          ["エステル記", "エステル記"],
        ],
      },
      {
        label: "詩歌・知恵文学",
        books: [
          ["ヨブ記", "ヨブ記"],
          ["詩篇", "詩篇"],
          ["箴言", "箴言"],
          ["伝道者の書", "伝道者の書"],
          ["雅歌", "雅歌"],
        ],
      },
      {
        label: "大預言書",
        books: [
          ["イザヤ書", "イザヤ書"],
          ["エレミヤ書", "エレミヤ書"],
          ["哀歌", "哀歌"],
          ["エゼキエル書", "エゼキエル書"],
          ["ダニエル書", "ダニエル書"],
        ],
      },
      {
        label: "小預言書",
        books: [
          ["ホセア書", "ホセア書"],
          ["ヨエル書", "ヨエル書"],
          ["アモス書", "アモス書"],
          ["オバデヤ書", "オバデヤ書"],
          ["ヨナ書", "ヨナ書"],
          ["ミカ書", "ミカ書"],
          ["ナホム書", "ナホム書"],
          ["ハバクク書", "ハバクク書"],
          ["ゼパニヤ書", "ゼパニヤ書"],
          ["ハガイ書", "ハガイ書"],
          ["ゼカリヤ書", "ゼカリヤ書"],
          ["マラキ書", "マラキ書"],
        ],
      },
    ],
    NT: [
      {
        label: "福音書・歴史書",
        books: [
          ["マタイの福音書", "マタイ"],
          ["マルコの福音書", "マルコ"],
          ["ルカの福音書", "ルカ"],
          ["ヨハネの福音書", "ヨハネ"],
          ["使徒の働き", "使徒の働き"],
        ],
      },
      {
        label: "パウロ書簡",
        books: [
          ["ローマ人への手紙", "ローマ"],
          ["1コリント人への手紙", "1コリント"],
          ["2コリント人への手紙", "2コリント"],
          ["ガラテヤ人への手紙", "ガラテヤ"],
          ["エペソ人への手紙", "エペソ"],
          ["ピリピ人への手紙", "ピリピ"],
          ["コロサイ人への手紙", "コロサイ"],
          ["1テサロニケ人への手紙", "1テサロニケ"],
          ["2テサロニケ人への手紙", "2テサロニケ"],
          ["1テモテへの手紙", "1テモテ"],
          ["2テモテへの手紙", "2テモテ"],
          ["テトスへの手紙", "テトス"],
          ["ピレモンへの手紙", "ピレモン"],
        ],
      },
      {
        label: "公同書簡・黙示録",
        books: [
          ["ヘブル人への手紙", "ヘブル"],
          ["ヤコブの手紙", "ヤコブ"],
          ["1ペテロの手紙", "1ペテロ"],
          ["2ペテロの手紙", "2ペテロ"],
          ["1ヨハネの手紙", "1ヨハネ"],
          ["2ヨハネの手紙", "2ヨハネ"],
          ["3ヨハネの手紙", "3ヨハネ"],
          ["ユダの手紙", "ユダ"],
          ["ヨハネの黙示録", "ヨハネの黙示録"],
        ],
      },
    ],
  };

  function decodeBibleData() {
    if (window.BIBLE_DATA) return window.BIBLE_DATA;
    if (!window.BIBLE_ENC || !window.BIBLE_K) return {};
    const keyBin = atob(window.BIBLE_K);
    const keyLen = keyBin.length;
    const keyBytes = new Uint8Array(keyLen);
    for (let i = 0; i < keyLen; i++) {
      keyBytes[i] = keyBin.charCodeAt(i);
    }

    const encBin = atob(window.BIBLE_ENC);
    const len = encBin.length;
    const outBytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      outBytes[i] = encBin.charCodeAt(i) ^ keyBytes[i & 4095];
    }

    const jsonText = new TextDecoder("utf-16le").decode(outBytes);
    window.BIBLE_ENC = null;
    return JSON.parse(jsonText);
  }

  const bibleData = decodeBibleData();

  // 状態管理
  let currentTestament = "OT";
  let selectedBook = null;
  let selectedChapter = null;
  let firstVerse = null;
  let lastVerse = null;
  let awaitingEndVerse = false;
  let isPreviewExpanded = false;
  let copyFormat = "header"; // "header" | "per_verse"
  let keptPassages = []; // [{ book, chapter, firstVerse, lastVerse }]
  let toastTimer = null;

  // DOM要素
  const fmtPerVerseBtn = document.getElementById("fmtPerVerse");
  const fmtHeaderBtn = document.getElementById("fmtHeader");
  const navBook = document.getElementById("navBook");
  const navChapter = document.getElementById("navChapter");
  const navVerse = document.getElementById("navVerse");
  const copyCard = document.getElementById("copyCard");
  const copyBadge = document.getElementById("copyBadge");
  const btnKeepPassage = document.getElementById("btnKeepPassage");
  const btnClearAll = document.getElementById("btnClearAll");
  const btnManualCopy = document.getElementById("btnManualCopy");
  const keptListEl = document.getElementById("keptList");
  const previewBox = document.getElementById("previewBox");
  const btnToggleExpand = document.getElementById("btnToggleExpand");

  const stepBook = document.getElementById("stepBook");
  const stepChapter = document.getElementById("stepChapter");
  const stepVerse = document.getElementById("stepVerse");

  const tabOT = document.getElementById("tabOT");
  const tabNT = document.getElementById("tabNT");
  const bookGridContainer = document.getElementById("bookGridContainer");

  const backToBook = document.getElementById("backToBook");
  const chapterStepTitle = document.getElementById("chapterStepTitle");
  const chapterGrid = document.getElementById("chapterGrid");

  const backToChapter = document.getElementById("backToChapter");
  const verseStepTitle = document.getElementById("verseStepTitle");
  const verseGrid = document.getElementById("verseGrid");
  const verseTextList = document.getElementById("verseTextList");
  const toastEl = document.getElementById("toast");

  function getReferenceLabel(p) {
    const vPart = p.firstVerse === p.lastVerse ? `${p.firstVerse}` : `${p.firstVerse}-${p.lastVerse}`;
    return `${p.book} ${p.chapter}:${vPart}`;
  }

  function formatSinglePassage(p) {
    const bookObj = bibleData[p.book] || {};
    const chapObj = bookObj[String(p.chapter)] || {};
    const lines = [];
    if (copyFormat === "header") {
      lines.push(getReferenceLabel(p));
      for (let v = p.firstVerse; v <= p.lastVerse; v++) {
        const text = chapObj[String(v)];
        if (text !== undefined) {
          lines.push(p.firstVerse === p.lastVerse ? text : `${v} ${text}`);
        }
      }
      return lines.join("\n");
    } else {
      for (let v = p.firstVerse; v <= p.lastVerse; v++) {
        const text = chapObj[String(v)];
        if (text !== undefined) {
          lines.push(`${p.book} ${p.chapter}:${v} ${text}`);
        }
      }
      return lines.join("\n");
    }
  }

  function getActivePassages() {
    const list = [...keptPassages];
    if (selectedBook && selectedChapter && firstVerse !== null && lastVerse !== null) {
      list.push({
        book: selectedBook,
        chapter: selectedChapter,
        firstVerse,
        lastVerse,
      });
    }
    return list;
  }

  function buildFullOutputText() {
    const list = getActivePassages();
    return list.map(formatSinglePassage).join("\n\n");
  }

  function copyTextSynchronously(text) {
    if (!text) return false;
    let copied = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
      copied = true;
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      document.execCommand("copy");
      document.body.removeChild(ta);
      copied = true;
    } catch (_) {}
    return copied;
  }

  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.hidden = false;
    toastTimer = setTimeout(() => {
      toastEl.hidden = true;
    }, 2200);
  }

  function setPreviewExpanded(expanded) {
    isPreviewExpanded = Boolean(expanded);
    previewBox.classList.toggle("expanded", isPreviewExpanded);
    if (isPreviewExpanded) {
      btnToggleExpand.textContent = "▲ 閉じて節を選び直す";
    } else {
      btnToggleExpand.textContent = awaitingEndVerse
        ? "▼ 画面いっぱいに広げる（1節のみ表示）"
        : "▼ 画面いっぱいに広げる";
    }
  }

  function syncPreviewAndCopy(triggerToast = true) {
    const passages = getActivePassages();
    renderKeptTags();

    if (passages.length === 0) {
      copyCard.classList.remove("copied");
      copyBadge.textContent = "節をタップすると自動コピーされます";
      previewBox.textContent = "ここに選択した聖書のことばが表示されます（選択と同時にクリップボードへコピーされます）";
      previewBox.classList.add("empty");
      setPreviewExpanded(false);
      btnToggleExpand.hidden = true;
      btnKeepPassage.disabled = true;
      btnManualCopy.disabled = true;
      btnClearAll.hidden = true;
      return;
    }

    const fullText = buildFullOutputText();
    copyTextSynchronously(fullText);

    copyCard.classList.add("copied");
    const lastPassage = passages[passages.length - 1];
    const refSummary =
      passages.length === 1
        ? getReferenceLabel(lastPassage)
        : `${passages.map(getReferenceLabel).join("、")} (${passages.length}箇所)`;

    copyBadge.textContent = `✓ コピー済み：${refSummary}`;
    previewBox.textContent = fullText;
    previewBox.classList.remove("empty");
    btnToggleExpand.hidden = false;
    setPreviewExpanded(isPreviewExpanded);

    const hasCurrentSelection = selectedBook && selectedChapter && firstVerse !== null;
    btnKeepPassage.disabled = !hasCurrentSelection;
    btnManualCopy.disabled = false;
    btnClearAll.hidden = false;

    if (triggerToast) {
      showToast(`📋 ${refSummary} をコピーしました`);
    }
  }

  function renderKeptTags() {
    if (keptPassages.length === 0) {
      keptListEl.hidden = true;
      keptListEl.innerHTML = "";
      return;
    }
    keptListEl.hidden = false;
    keptListEl.innerHTML = "";
    keptPassages.forEach((p, idx) => {
      const tag = document.createElement("span");
      tag.className = "kept-tag";
      tag.textContent = getReferenceLabel(p);
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.textContent = "×";
      delBtn.title = "削除";
      delBtn.addEventListener("click", () => {
        keptPassages.splice(idx, 1);
        syncPreviewAndCopy(true);
      });
      tag.appendChild(delBtn);
      keptListEl.appendChild(tag);
    });
  }

  function updateBreadcrumbs(activeStep) {
    navBook.textContent = selectedBook ? selectedBook : "1. 書";
    navChapter.textContent = selectedChapter ? `${selectedChapter}章` : "2. 章";
    if (firstVerse !== null && lastVerse !== null) {
      navVerse.textContent = firstVerse === lastVerse ? `${firstVerse}節` : `${firstVerse}-${lastVerse}節`;
    } else {
      navVerse.textContent = "3. 節";
    }

    navChapter.disabled = !selectedBook;
    navVerse.disabled = !(selectedBook && selectedChapter);

    navBook.className = "crumb" + (activeStep === "book" ? " active" : selectedBook ? " selected" : "");
    navChapter.className = "crumb" + (activeStep === "chapter" ? " active" : selectedChapter ? " selected" : "");
    navVerse.className = "crumb" + (activeStep === "verse" ? " active" : firstVerse !== null ? " selected" : "");
  }

  function showStep(step) {
    stepBook.hidden = step !== "book";
    stepChapter.hidden = step !== "chapter";
    stepVerse.hidden = step !== "verse";
    setPreviewExpanded(false);
    updateBreadcrumbs(step);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function renderBooks() {
    bookGridContainer.innerHTML = "";
    const categories = BOOK_CATEGORIES[currentTestament];
    categories.forEach((cat) => {
      const block = document.createElement("div");
      block.className = "category-block";
      const title = document.createElement("h2");
      title.className = "category-title";
      title.textContent = cat.label;
      block.appendChild(title);

      const grid = document.createElement("div");
      grid.className = "book-grid";
      cat.books.forEach(([fullName, displayName]) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "book-btn" + (selectedBook === fullName ? " selected" : "");
        btn.textContent = displayName;
        btn.addEventListener("click", () => selectBook(fullName));
        grid.appendChild(btn);
      });
      block.appendChild(grid);
      bookGridContainer.appendChild(block);
    });
  }

  function selectBook(bookName) {
    selectedBook = bookName;
    selectedChapter = null;
    firstVerse = null;
    lastVerse = null;
    awaitingEndVerse = false;

    const bookObj = bibleData[bookName] || {};
    const chapters = Object.keys(bookObj)
      .map(Number)
      .sort((a, b) => a - b);

    if (chapters.length === 1) {
      selectChapter(chapters[0]);
      return;
    }

    chapterStepTitle.textContent = `${bookName}`;
    chapterGrid.innerHTML = "";
    chapters.forEach((ch) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "num-btn";
      btn.textContent = String(ch);
      btn.addEventListener("click", () => selectChapter(ch));
      chapterGrid.appendChild(btn);
    });
    showStep("chapter");
  }

  function selectChapter(chapterNum) {
    selectedChapter = chapterNum;
    firstVerse = null;
    lastVerse = null;
    awaitingEndVerse = false;

    renderVerses();
    showStep("verse");
  }

  function renderVerses() {
    const bookObj = bibleData[selectedBook] || {};
    const chapObj = bookObj[String(selectedChapter)] || {};
    const verses = Object.keys(chapObj)
      .map(Number)
      .sort((a, b) => a - b);

    verseStepTitle.textContent = `${selectedBook} ${selectedChapter}章`;
    verseGrid.innerHTML = "";
    verseTextList.innerHTML = "";

    verses.forEach((v) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "num-btn";
      btn.dataset.verse = String(v);
      btn.textContent = String(v);
      btn.addEventListener("click", () => onVerseTap(v));
      verseGrid.appendChild(btn);

      const row = document.createElement("button");
      row.type = "button";
      row.className = "verse-row";
      row.dataset.verse = String(v);
      const numSpan = document.createElement("span");
      numSpan.className = "verse-num-label";
      numSpan.textContent = `${v}`;
      const bodySpan = document.createElement("span");
      bodySpan.className = "verse-body-label";
      bodySpan.textContent = chapObj[String(v)];
      row.appendChild(numSpan);
      row.appendChild(bodySpan);
      row.addEventListener("click", () => onVerseTap(v));
      verseTextList.appendChild(row);
    });

    updateVerseHighlight();
  }

  function onVerseTap(v) {
    if (firstVerse === null || !awaitingEndVerse) {
      firstVerse = v;
      lastVerse = v;
      awaitingEndVerse = true;
      isPreviewExpanded = false;
    } else {
      if (v === firstVerse) {
        awaitingEndVerse = false;
      } else if (v > firstVerse) {
        lastVerse = v;
        awaitingEndVerse = false;
      } else {
        lastVerse = firstVerse;
        firstVerse = v;
        awaitingEndVerse = false;
      }
      isPreviewExpanded = true;
    }

    updateBreadcrumbs("verse");
    updateVerseHighlight();
    syncPreviewAndCopy(true);
    if (isPreviewExpanded) {
      previewBox.scrollTop = 0;
    }
  }

  function updateVerseHighlight() {
    const inRange = (v) => firstVerse !== null && lastVerse !== null && v >= firstVerse && v <= lastVerse;
    const isEdge = (v) => firstVerse !== null && (v === firstVerse || v === lastVerse);

    verseGrid.querySelectorAll(".num-btn").forEach((btn) => {
      const v = Number(btn.dataset.verse);
      btn.classList.toggle("in-range", inRange(v));
      btn.classList.toggle("range-edge", isEdge(v));
    });

    verseTextList.querySelectorAll(".verse-row").forEach((row) => {
      const v = Number(row.dataset.verse);
      row.classList.toggle("in-range", inRange(v));
      row.classList.toggle("range-edge", isEdge(v));
    });
  }

  // 画面遷移イベント
  tabOT.addEventListener("click", () => {
    currentTestament = "OT";
    tabOT.classList.add("active");
    tabNT.classList.remove("active");
    renderBooks();
  });

  tabNT.addEventListener("click", () => {
    currentTestament = "NT";
    tabNT.classList.add("active");
    tabOT.classList.remove("active");
    renderBooks();
  });

  navBook.addEventListener("click", () => {
    renderBooks();
    showStep("book");
  });

  navChapter.addEventListener("click", () => {
    if (selectedBook) selectBook(selectedBook);
  });

  navVerse.addEventListener("click", () => {
    if (selectedBook && selectedChapter) showStep("verse");
  });

  backToBook.addEventListener("click", () => {
    renderBooks();
    showStep("book");
  });

  backToChapter.addEventListener("click", () => {
    if (!selectedBook) return;
    const chapters = Object.keys(bibleData[selectedBook] || {});
    if (chapters.length <= 1) {
      renderBooks();
      showStep("book");
    } else {
      selectBook(selectedBook);
    }
  });

  btnKeepPassage.addEventListener("click", () => {
    if (selectedBook && selectedChapter && firstVerse !== null && lastVerse !== null) {
      keptPassages.push({
        book: selectedBook,
        chapter: selectedChapter,
        firstVerse,
        lastVerse,
      });
      selectedBook = null;
      selectedChapter = null;
      firstVerse = null;
      lastVerse = null;
      awaitingEndVerse = false;
      renderBooks();
      showStep("book");
      syncPreviewAndCopy(false);
      showToast("＋ 箇所をキープしました。続けて次の箇所を選べます");
    }
  });

  btnClearAll.addEventListener("click", () => {
    keptPassages = [];
    firstVerse = null;
    lastVerse = null;
    awaitingEndVerse = false;
    updateVerseHighlight();
    updateBreadcrumbs(!stepVerse.hidden ? "verse" : !stepChapter.hidden ? "chapter" : "book");
    syncPreviewAndCopy(false);
    showToast("選択をクリアしました");
  });

  btnManualCopy.addEventListener("click", () => {
    syncPreviewAndCopy(true);
  });

  btnToggleExpand.addEventListener("click", () => {
    setPreviewExpanded(!isPreviewExpanded);
  });

  fmtPerVerseBtn.addEventListener("click", () => {
    copyFormat = "per_verse";
    fmtPerVerseBtn.classList.add("active");
    fmtHeaderBtn.classList.remove("active");
    if (getActivePassages().length > 0) syncPreviewAndCopy(true);
  });

  fmtHeaderBtn.addEventListener("click", () => {
    copyFormat = "header";
    fmtHeaderBtn.classList.add("active");
    fmtPerVerseBtn.classList.remove("active");
    if (getActivePassages().length > 0) syncPreviewAndCopy(true);
  });

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }

  renderBooks();
  showStep("book");
})();
