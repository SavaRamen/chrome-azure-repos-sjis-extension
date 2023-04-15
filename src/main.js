(() => {
  /* 機能：sjisのファイルをwindows-1252として復号化された文字列をsjisに変換 */
  const done_attr = "azure_repos_sjis";
  const done_style = "font-style:italic";
  const app_name = "azure repos sjis extension";
  console.log(`${app_name}:`);

  /* windows-1252からsjisへの変換オブジェクト */
  const w2s = {
    _s_decoder: new TextDecoder("shift-jis"),
    _w_decoder: new TextDecoder("windows-1252"),
    _w2s_hash: {},
    _make_w2s_hash(hx) {
      for (let lx = 0x0; lx < 0x100; lx++) {
        const array_uint8 = new Uint8Array([hx, lx]);
        const s_text = this._s_decoder.decode(array_uint8);
        const w_text = this._w_decoder.decode(array_uint8);
        this._w2s_hash[w_text] = s_text;
      }
    },
    init() {
      for (let hx = 0x81; hx < 0xa0; hx++) {
        this._make_w2s_hash(hx);
      }
      for (let hx = 0xe0; hx < 0xfd; hx++) {
        this._make_w2s_hash(hx);
      }
    },
    decode_text(w_text) {
      w_text = w_text || "";
      let s_text = "";
      for (let idx = 0; idx < w_text.length; idx++) {
        const char = w_text.substr(idx, 1);
        const text = w_text.substr(idx, 2);
        const sjis = this._w2s_hash[text];
        if (sjis) {
          s_text += sjis;
          idx++;
        } else {
          s_text += char;
        }
      }
      return s_text;
    },
  };
  w2s.init();

  /* ページの監視 */
  const observer = new MutationObserver((list, observer) => {
    /* files - contents / history / blame用 */
    let count_1 = 0;
    document.querySelectorAll(`.page-content .view-line span[class]:not([${done_attr}])`).forEach($element => {
      let w_text = $element.innerText;
      let s_text = w2s.decode_text($element.innerText);
      if (w_text != s_text) {
        $element.innerText = s_text;
        $element.setAttribute(done_attr, "");
        $element.style = done_style;
        count_1++;
      }
    });
    /* commits用 */
    let count_2 = 0;
    document.querySelectorAll(`.page-content .repos-line-content:not([${done_attr}])`).forEach($element => {
      let is_done = false;
      $element.childNodes.forEach($node => {
        if (!$node.tag && $node.data) {
          let w_text = $node.data;
          let s_text = w2s.decode_text(w_text);
          if (w_text != s_text) {
            $node.data = s_text;
            is_done = true;
          }
        } else if ($node.tagName === "SPAN" && !$node.class && !$node.ariaHidden) {
          is_done = true;
          let w_text = $node.innerText;
          let s_text = w2s.decode_text(w_text);
          if (w_text != s_text) {
            $node.innerText = s_text;
            is_done = true;
          }
        }
      });
      if (is_done) {
        $element.setAttribute(done_attr, "");
        $element.style = done_style;
        count_2++;
      }
    });
    // if (count_1 || count_2) console.log(`${app_name}:`, count_1, count_2);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
