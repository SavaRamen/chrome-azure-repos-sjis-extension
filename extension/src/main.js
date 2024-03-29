/* Azure ReposでSJISファイルを表示 */

/** アプリ名 */
const app_name = "azure repos sjis extension";
console.log(`${app_name}:`);

/** 変換済み属性 */
const done_attr = "azure-repos-sjis";

/** Windows 1252からSJISへの文字列の変換オブジェクト */
const w2s = {
  /** SJIS復号器 */
  _s_decoder: new TextDecoder("shift-jis"),
  /** Windows-1252復号器 */
  _w_decoder: new TextDecoder("windows-1252"),
  /** Windows-1252からSJISへの変換マップ */
  _w2s_map: {},
  /** 変換マップ作成
   *  SJISを一文字ずつWindows-1252に変換し、Windows-1252からSJISへの変換マップを作製
   */
  _make_w2s_map(hxmin, lxmin, hxmax, lxmax) {
    for (let hx = hxmin; hx <= hxmax; hx++) {
      for (let lx = lxmin; lx <= lxmax; lx++) {
        const array_uint8 = new Uint8Array(hx ? [hx, lx] : [lx]);
        const s_text = this._s_decoder.decode(array_uint8);
        const w_text = this._w_decoder.decode(array_uint8);
        if (s_text !== w_text) {
          this._w2s_map[w_text] = s_text;
        }
      }
    }
  },
  /** 変換オブジェクト初期化 */
  init() {
    /* 半角カナ文字領域 */
    this._make_w2s_map(0x00, 0xa1, 0x00, 0xdf);
    /* 全角文字領域 */
    this._make_w2s_map(0x81, 0x40, 0x9f, 0x7e);
    this._make_w2s_map(0x81, 0x80, 0x9f, 0xfc);
    this._make_w2s_map(0xe0, 0x40, 0xfc, 0x7e);
    this._make_w2s_map(0xe0, 0x80, 0xfc, 0xfc);
  },
  /** Windows-1252からSJISに文字列を復元 */
  decode_text(w_text) {
    w_text = w_text || "";
    let s_text = "";
    for (let idx = 0; idx < w_text.length; idx++) {
      /* 全角文字の場合 */
      if (idx < w_text.length - 1) {
        const w_char_2 = w_text.substr(idx, 2);
        const s_char_2 = this._w2s_map[w_char_2];
        if (s_char_2) {
          s_text += s_char_2;
          idx++;
          continue;
        }
      }
      /* 半角カナ文字の場合 */
      const w_char_1 = w_text.substr(idx, 1);
      const s_char_1 = this._w2s_map[w_char_1];
      if (s_char_1) {
        s_text += s_char_1;
        continue;
      }
      /* ASCII文字の場合 */
      s_text += w_char_1;
    }
    return s_text;
  },
  /** 要素からWindows-1252の文字列を取得 */
  get_text($element) {
    let w_text = $element.innerText;
    /* 全角文字が要素を超えて分断されている場合、次の要素が空白要素でなければ、末尾の文字と次の要素の先頭文字と組み合わせたものが変換マップにあるかを判定 */
    let w_next_1 = w_text[w_text.length - 1];
    let w_next_2 =
      !$element.nextSibling?.classList?.contains("mtkw") &&
      $element.nextSibling?.innerText?.[0];
    if (w_next_1 && w_next_2) {
      let w_next = w_next_1 + w_next_2;
      let s_next = this._w2s_map[w_next];
      if (s_next) {
        w_text += w_next_2;
        $element.nextSibling.innerText =
          $element.nextSibling.innerText.substring(1);
      }
    }
    return w_text;
  }
};
w2s.init();

/** ビューワオブジェクト */
const viewer = {
  /** 書き換え処理 */
  rewrite() {
    /** files(contents, history, blame)用
     * 全行を列挙してWindows-1252からSJISへの変換を行う、すでに変換済みは除く
     */
    document
      .querySelectorAll(`.page-content .view-line:not([${done_attr}]`)
      .forEach(($line) => {
        $line.querySelectorAll(`span[class]`).forEach(($span) => {
          let w_text = w2s.get_text($span);
          if ($span.classList.contains("mtkw")) {
            /**
             * 右クリックメニューの[User Preferences]-[Show and diff white space]がチェックされている場合、
             * 空白ではなく"·"(=0xb7)になっているので、クラス名"mtkw"で判定して空白に戻す。
             * この処理が必要なのはfilesメニューの場合だけ。
             * commits,pushesメニューでは[User preferences]が無い。
             */
            w_text = w_text.replace(/·/g, "+");
          }
          const s_text = w2s.decode_text(w_text);
          if (w_text != s_text) {
            $span.innerText = s_text;
            $line.setAttribute(done_attr, "");
            $line.style.fontWeight = "bold";
          }
        });
      });

    /** files(preview)用
     * iframe要素を探して一括してWindows-1252からSJISへの変換を行う、すでに変換済みは除く
     */
    document
      .querySelectorAll(`iframe:not([${done_attr}]`)
      .forEach(($iframe) => {
        const w_text = $iframe.srcdoc;
        const s_text = w2s.decode_text(w_text);
        if (w_text != s_text) {
          $iframe.setAttribute("srcdoc", s_text);
          $iframe.setAttribute(done_attr, "");
          $iframe.style.fontWeight = "bold";
        }
      });

    /** PullRequest Overview用
     * 全行を列挙してWindows-1252からSJISへの変換を行う、すでに変換済みは除く
     */
    document
      .querySelectorAll(
        `.padding-right-8.repos-line-content`
      ).forEach(($line) => {
        let w_text = w2s.get_text($line);
        const s_text = w2s.decode_text(w_text);
        if (w_text != s_text) {
          $line.innerText = s_text;
          $line.innerText = $line.innerText.replace(/^Plus /, '+')
          $line.innerText = $line.innerText.replace(/^Minus /, '-')
          $line.innerText = $line.innerText.replace('\n', '')
          $line.setAttribute(done_attr, "");
          $line.style.fontWeight = "bold";
        }
      });

    /** Files Contents Preview用(プレーンテキスト)
      * 全行を列挙してWindows-1252からSJISへの変換を行う、すでに変換済みは除く
      */
    document
      .querySelectorAll(
        `.markdown-content.markdown-editor-preview.flex-grow.markdown-preview-container.scroll-hidden p a a`
      ).forEach(($line) => {
        let w_text = w2s.get_text($line);
        const s_text = w2s.decode_text(w_text);
        if (w_text != s_text) {
          $line.innerText = s_text;
          $line.setAttribute(done_attr, "");
          $line.style.fontWeight = "bold";
        }
      });

    /** Files Contents Preview用(プレーンテキスト)
      * 全行を列挙してWindows-1252からSJISへの変換を行う、すでに変換済みは除く
      */
    document
      .querySelectorAll(
        `.markdown-content.markdown-editor-preview.flex-grow.markdown-preview-container.scroll-hidden p a`
      ).forEach(($line) => {
        let w_text = w2s.get_text($line);
        const s_text = w2s.decode_text(w_text);
        if (w_text != s_text) {
          $line.innerText = s_text;
          $line.setAttribute(done_attr, "");
          $line.style.fontWeight = "bold";
        }
      });

    /** Files Contents Preview用(プレーンテキスト)
      * 全行を列挙してWindows-1252からSJISへの変換を行う、すでに変換済みは除く
      */
    document
      .querySelectorAll(
        `.markdown-content.markdown-editor-preview.flex-grow.markdown-preview-container.scroll-hidden p code`
      ).forEach(($line) => {
        let w_text = w2s.get_text($line);
        const s_text = w2s.decode_text(w_text);
        if (w_text != s_text) {
          $line.innerText = s_text;
          $line.setAttribute(done_attr, "");
          $line.style.fontWeight = "bold";
        }
      });

    /** Files Contents Preview用(コードブロック)
      * 全行を列挙してWindows-1252からSJISへの変換を行う、すでに変換済みは除く
      */
    document
      .querySelectorAll(
        `.markdown-content.markdown-editor-preview.flex-grow.markdown-preview-container.scroll-hidden pre`
      ).forEach(($line) => {
        let w_text = w2s.get_text($line);
        const s_text = w2s.decode_text(w_text);
        if (w_text != s_text) {
          $line.innerText = s_text;
          $line.setAttribute(done_attr, "");
          $line.style.fontWeight = "bold";
        }
      });


    /** Files Contents Preview用(プレーンテキスト)
     * 全行を列挙してWindows-1252からSJISへの変換を行う、すでに変換済みは除く
     */
    // document
    //   .querySelectorAll(
    //     `.markdown-content.markdown-editor-preview.flex-grow.markdown-preview-container.scroll-hidden:not(.hljs)`
    //   ).forEach(($line) => {


    //     console.log($line.innerText);

    //     let w_array = $line.innerText.split('\n');
    //     let s_array = [];
    //     for ($i = 0; $i < w_array.length; $i++) {
    //       if (w_array[$i].match(/\[+[\d\D]+\]+\(+[\d\D]+\)/g)) {
    //         console.log(w_array[$i])
    //         let w_text = w_array[$i];
    //         const s_text = w2s.decode_text(w_text);
    //         if (w_text != s_text) {
    //           s_array.push(s_text);
    //           // $line.innerText=$line.innerText.replace(/^Plus / ,'+')
    //           // $line.innerText=$line.innerText.replace(/^Minus / ,'-')
    //           // $line.innerText=$line.innerText.replace('\n' ,'')
    //           // $line.setAttribute(done_attr, "");
    //           // $line.style.fontWeight = "bold";
    //         }
    //       }

    //     }
    //     if(s_array.length>0){
    //       $line.innerText = ""
    //       $line.innerHTML = '<p>'+s_array.join('\n')+'</p>';
    //       $line.setAttribute(done_attr, "");
    //       $line.style.fontWeight = "bold";
    //       // console.log(s_array.join('\n'));

    //     }
    //   });


    // /** Files Contents Preview用（コードブロック）
    //  * 全行を列挙してWindows-1252からSJISへの変換を行う、すでに変換済みは除く
    //  */
    // document
    //   .querySelectorAll(
    //     `.markdown-content.markdown-editor-preview.flex-grow.markdown-preview-container.scroll-hidden.`
    //   ).forEach(($line) => {
    //     let w_text = w2s.get_text($line);
    //     const s_text = w2s.decode_text(w_text);
    //     if (w_text != s_text) {
    //       $line.innerText = s_text;
    //       $line.setAttribute(done_attr, "");
    //       $line.style.fontWeight = "bold";
    //     }
    //   });

    /** commits, pushes用
     * 全行を列挙してWindows-1252からSJISへの変換を行う、すでに変換済みは除く
     */
    document
      .querySelectorAll(
        `.repos-changes-viewer .repos-line-content:not([${done_attr}])`
      )
      .forEach(($line) => {
        $line.childNodes.forEach(($node) => {
          if (!$node.tag && $node.data) {
            /* ノードがテキストの場合 */
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
            /* ノードが<SPAN>の場合 */
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

    /** wiki用
     * iframe要素を探して再帰的にWindows-1252からSJISへの変換を行う、すでに変換済みは除く
     * 一括して行わないのは要素が
     */
    function modify_element($element) {
      let done = false;
      if ($element.data) {
        const w_text = $element.data;
        const s_text = w2s.decode_text(w_text);
        if (w_text != s_text) {
          $element.data = s_text;
          done = true;
        }
      }
      if ($element.childNodes) {
        $element.childNodes.forEach(($node, index) => {
          if (typeof $node == "string") {
            const w_text = $node;
            const s_text = w2s.decode_text(w_text);
            if (w_text != s_text) {
              $element[index] = s_text;
              done = true;
            }
          } else {
            if (modify_element($node)) done = true;
          }
        });
      }
      return done;
    }
    document
      .querySelectorAll(`.wiki-view-container > div:not([${done_attr}])`)
      .forEach($div => {
        if (modify_element($div)) {
          // $div.setAttribute(done_attr, "");
          $div.style.fontWeight = "bold";
        }
      });

    /* 変換済み属性がある場合は文字単位の差分表示は間違っているため削除 */
    let is_done_attr = document.querySelectorAll(`[${done_attr}]`).length != 0;
    if (is_done_attr) {
      /* files(contents, history, blame)用 */
      document.querySelectorAll(".view-overlays").forEach(($element) => {
        $element
          .querySelectorAll(".char-insert, .char-delete")
          .forEach(($element) => {
            $element.remove();
          });
      });
      /* commits, pushes用 */
      document
        .querySelectorAll(".repos-summary-diff-blocks")
        .forEach(($element) => {
          $element
            .querySelectorAll(".added-content, .removed-content")
            .forEach(($element) => {
              $element.className = "";
            });
        });
    }
  }
};

/* ページ変更監視処理 */
const observer = new MutationObserver((list, observer) => {
  viewer.rewrite();
});
observer.observe(document.body, { childList: true, subtree: true });
