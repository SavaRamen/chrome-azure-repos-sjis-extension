(() => {
  /* Azure ReposでSJISファイルを表示 */
  const done_attr = "azure_repos_sjis";
  const app_name = "azure repos sjis extension";
  console.log(`${app_name}:`);

  /* Windows 1252からSJISへの文字列の変換 */
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

  /* ページ書き換え処理 */
  const repos = {
    rewrite() {
      /* files - contents / history / blame用 */
      let count_files = 0;
      document.querySelectorAll(`.page-content .view-line span[class]:not([${done_attr}])`).forEach($element => {
        let w_text = $element.innerText;
        let s_text = w2s.decode_text($element.innerText);
        if (w_text != s_text) {
          $element.innerText = s_text;
          $element.setAttribute(done_attr, "");
          count_files++;
        }
      });
      /* commits用 */
      let count_commits = 0;
      document.querySelectorAll(`.page-content .repos-line-content:not([${done_attr}])`).forEach($element => {
        $element.childNodes.forEach($node => {
          if (!$node.tag && $node.data) {
            let w_text = $node.data;
            let s_text = w2s.decode_text(w_text);
            if (w_text != s_text) {
              $node.data = s_text;
              $element.setAttribute(done_attr, "");
              count_commits++;
            }
          } else if ($node.tagName === "SPAN" && !$node.class && !$node.ariaHidden) {
            is_done = true;
            let w_text = $node.innerText;
            let s_text = w2s.decode_text(w_text);
            if (w_text != s_text) {
              $node.innerText = s_text;
              $element.setAttribute(done_attr, "");
              count_commits++;
            }
          }
        });
      });
    },
  };

  /* ページ変更監視処理 */
  const observer = new MutationObserver((list, observer) => {
    repos.rewrite();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
