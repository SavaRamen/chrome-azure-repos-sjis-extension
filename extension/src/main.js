// Azure ReposでSJISファイルを表示
const done_attr = "azure-repos-sjis";
const app_name = "azure repos sjis extension";
console.log(`${app_name}:`);

// Windows 1252からSJISへの文字列の変換処理
const w2s = {
  _s_decoder: new TextDecoder("shift-jis"),
  _w_decoder: new TextDecoder("windows-1252"),
  _w2s_hash: {},
  _make_w2s_hash(hxmin, lxmin, hxmax, lxmax) {
    for (let hx = hxmin; hx <= hxmax; hx++) {
      for (let lx = lxmin; lx <= lxmax; lx++) {
        const array_uint8 = new Uint8Array(hx ? [hx, lx] : [lx]);
        const s_text = this._s_decoder.decode(array_uint8);
        const w_text = this._w_decoder.decode(array_uint8);
        if (s_text !== w_text) {
          this._w2s_hash[w_text] = s_text;
        }
      }
    }
  },
  // 初期化
  init() {
    // 半角カナ文字
    this._make_w2s_hash(0x00, 0xa1, 0x00, 0xdf);
    // 全角文字
    this._make_w2s_hash(0x81, 0x40, 0x9f, 0x7e);
    this._make_w2s_hash(0x81, 0x80, 0x9f, 0xfc);
    this._make_w2s_hash(0xe0, 0x40, 0xfc, 0x7e);
    this._make_w2s_hash(0xe0, 0x80, 0xfc, 0xfc);
  },
  // 文字列復元
  decode_text(w_text) {
    w_text = w_text || "";
    let s_text = "";
    for (let idx = 0; idx < w_text.length; idx++) {
      // 全角文字の場合
      const w_char_2 = w_text.substr(idx, 2);
      const s_char_2 = this._w2s_hash[w_char_2];
      if (s_char_2) {
        s_text += s_char_2;
        idx++;
        continue;
      }

      // 半角カナ文字の場合
      const w_char_1 = w_text.substr(idx, 1);
      const s_char_1 = this._w2s_hash[w_char_1];
      if (s_char_1) {
        console.log("---", w_char_1, s_char_1);
        s_text += s_char_1;
        continue;
      }

      // ASCII文字の場合
      s_text += w_char_1;
    }
    return s_text;
  },
  // 文字列取得
  get_text($element) {
    let w_text = $element.innerText;
    let w_next_1 = w_text[w_text.length - 1];
    let w_next_2 = $element.nextSibling?.innerText?.[0];
    let w_next = w_next_1 + w_next_2;
    let s_next = this._w2s_hash[w_next];
    if (s_next) {
      w_text += w_next_2;
      $element.nextSibling.innerText =
        $element.nextSibling.innerText.substring(1);
    }
    return w_text;
  }
};
w2s.init();

// ページ書き換え処理
const repos = {
  
  rewrite() {
    // files(contents, history, blame)用
    document
      .querySelectorAll(`.page-content .view-line:not([${done_attr}]`)
      .forEach(($line) => {
        $line.querySelectorAll(`span[class]`).forEach(($span) => {
          const w_text = w2s.get_text($span);
          const s_text = w2s.decode_text($span.innerText);
          if (w_text != s_text) {
            $span.innerText = s_text;
            $line.setAttribute(done_attr, "");
            $line.style.fontWeight = "bold";
          }
        });
      });

    // commits, pushes用
    document
      .querySelectorAll(
        `.repos-changes-viewer .repos-line-content:not([${done_attr}])`
      )
      .forEach(($line) => {
        $line.childNodes.forEach(($node) => {
          if (!$node.tag && $node.data) {
            const w_text = $node.data;
            const s_text = w2s.decode_text(w_text);
            if (w_text != s_text) {
              $node.data = s_text;
              $line.setAttribute(done_attr, "");
              $line.style.fontWeight = "bold";
            }
          } else if (
            $node.tagName === "SPAN" &&
            $node.className != "screen-reader-only" &&
            !$node.ariaHidden
          ) {
            const w_text = w2s.get_text($node);
            const s_text = w2s.decode_text(w_text);
            if (w_text != s_text) {
              $node.innerText = s_text;
              $line.setAttribute(done_attr, "");
              $line.style.fontWeight = "bold";
            }
          }
        });
      });
    // windows-1252の誤復号のため文字単位の差分表示は意味がないため削除
    let is_done_attr = document.querySelectorAll(`[${done_attr}]`).length != 0;
    if (is_done_attr) {
      document.querySelectorAll(".view-overlays").forEach(($element) => {
        $element
          .querySelectorAll(".char-insert, .char-delete")
          .forEach(($element) => {
            $element.remove();
          });
      });
    }
  }
};

// ページ変更監視処理
const observer = new MutationObserver((list, observer) => {
  repos.rewrite();
});
observer.observe(document.body, { childList: true, subtree: true });
