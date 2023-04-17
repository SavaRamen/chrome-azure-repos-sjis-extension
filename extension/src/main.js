// Azure ReposでSJISファイルを表示
const done_attr = "azure_repos_sjis";
const app_name = "azure repos sjis extension";
console.log(`${app_name}:`);

// Windows 1252からSJISへの文字列の変換
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
  // 文字列復元
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
  // 文字列取得
  get_text($element) {
    let w_text = $element.innerText;
    // 二文字目の"[", "]"で区切られてしまう問題への対処
    let w_next = $element.nextSibling?.innerText;
    if (w_next?.match(/^[\[\]]/)) {
      w_text += w_next;
      $element.nextElementSibling.remove();
    }
    return w_text;
  }
};
w2s.init();

// ページ書き換え処理
const repos = {
  rewrite() {

    // files(contents, history, blame)用
    let count_files = 0;
    document.querySelectorAll(`.page-content .view-line span[class]:not([${done_attr}])`).forEach($element => {
      const w_text = w2s.get_text($element);
      const s_text = w2s.decode_text($element.innerText);
      if (w_text != s_text) {
        $element.innerText = s_text;
        $element.setAttribute(done_attr, "");
        count_files++;
      }
    });

    // commits, pushes用
    let count_commits = 0;
    document.querySelectorAll(`.repos-changes-viewer .repos-line-content:not([${done_attr}])`).forEach($element => {
      $element.childNodes.forEach($node => {
        if (!$node.tag && $node.data) {
          const w_text = $node.data;
          const s_text = w2s.decode_text(w_text);
          if (w_text != s_text) {
            $node.data = s_text;
            $element.setAttribute(done_attr, "");
            count_commits++;
          }
        } else if ($node.tagName === "SPAN" && $node.className != "screen-reader-only" && !$node.ariaHidden) {
          const w_text = w2s.get_text($node);
          const s_text = w2s.decode_text(w_text);
          if (w_text != s_text) {
            $node.innerText = s_text;
            $element.setAttribute(done_attr, "");
            count_commits++;
          }
        }
      });
    });
    // windows-1252の誤復号のため文字単位の差分表示は意味がないため削除
    document.querySelectorAll(".view-overlays").forEach($element => {
      $element.querySelectorAll(".char-insert, .char-delete").forEach($element => {
        $element.remove();
      });
    });
  },
};

// ページ変更監視処理
const observer = new MutationObserver((list, observer) => {
  repos.rewrite();
});
observer.observe(document.body, { childList: true, subtree: true });
