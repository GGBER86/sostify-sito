/* Sostify blog · core condiviso (nessuna dipendenza esterna) */
window.SostifyBlog = (function () {
  var LS_KEY = "sostify_articles_v1";
  var CACHE = null;

  // Carica gli articoli da articles.json (fonte del CMS). Fallback: seed incorporata.
  function ready(cb) {
    if (CACHE) { cb(CACHE); return; }
    try {
      fetch("assets/blog/articles.json", { cache: "no-store" })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (d) { CACHE = (d && d.articles) ? d.articles : (window.SOSTIFY_SEED || []); cb(CACHE); })
        .catch(function () { CACHE = (window.SOSTIFY_SEED || []); cb(CACHE); });
    } catch (e) { CACHE = (window.SOSTIFY_SEED || []); cb(CACHE); }
  }

  function getAll() {
    // localStorage (editor offline) > articles.json (CMS) > seed incorporata
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) { var arr = JSON.parse(raw); if (Array.isArray(arr)) return arr; }
    } catch (e) {}
    return CACHE || (window.SOSTIFY_SEED || []).slice();
  }
  function saveAll(list) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); return true; }
    catch (e) { return false; }
  }
  function resetToSeed() { try { localStorage.removeItem(LS_KEY); } catch (e) {} }

  function published(list) { return (list || getAll()).filter(function (a) { return a.published !== false; }); }
  function bySlug(slug) { return getAll().filter(function (a) { return a.slug === slug; })[0]; }

  function slugify(s) {
    return (s || "").toString().toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }
  function fmtDate(iso) {
    if (!iso) return "";
    var m = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.getDate() + " " + m[d.getMonth()] + " " + d.getFullYear();
  }
  function readingTime(body) {
    var words = (body || "").replace(/[#>*\-\[\]!()]/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }
  function esc(s) { return (s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  function inline(t) {
    t = esc(t);
    t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
    t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
    return t;
  }
  // Markdown leggero -> HTML
  function mdToHtml(md) {
    var lines = (md || "").replace(/\r/g, "").split("\n");
    var out = [], i = 0;
    function flushList(type, items) {
      out.push("<" + type + ">" + items.map(function (x) { return "<li>" + inline(x) + "</li>"; }).join("") + "</" + type + ">");
    }
    while (i < lines.length) {
      var ln = lines[i];
      if (/^\s*$/.test(ln)) { i++; continue; }
      var h = ln.match(/^(#{1,4})\s+(.*)$/);
      if (h) { var lvl = h[1].length + 1; out.push("<h" + lvl + ">" + inline(h[2]) + "</h" + lvl + ">"); i++; continue; }
      if (/^>\s?/.test(ln)) {
        var q = []; while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, "")); i++; }
        out.push("<blockquote>" + inline(q.join(" ")) + "</blockquote>"); continue;
      }
      if (/^\s*[-*]\s+/.test(ln)) {
        var it = []; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { it.push(lines[i].replace(/^\s*[-*]\s+/, "")); i++; }
        flushList("ul", it); continue;
      }
      if (/^\s*\d+\.\s+/.test(ln)) {
        var it2 = []; while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { it2.push(lines[i].replace(/^\s*\d+\.\s+/, "")); i++; }
        flushList("ol", it2); continue;
      }
      var para = [ln]; i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,4}\s|>|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) { para.push(lines[i]); i++; }
      out.push("<p>" + inline(para.join(" ")) + "</p>");
    }
    return out.join("\n");
  }

  function related(slug, cat, n) {
    var all = published().filter(function (a) { return a.slug !== slug; });
    var same = all.filter(function (a) { return a.category === cat; });
    var rest = all.filter(function (a) { return a.category !== cat; });
    return same.concat(rest).slice(0, n || 3);
  }

  function qs(name) {
    var m = new RegExp("[?&]" + name + "=([^&]*)").exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : null;
  }

  return { getAll, saveAll, resetToSeed, published, bySlug, slugify, fmtDate, readingTime, mdToHtml, related, qs, ready, LS_KEY };
})();
