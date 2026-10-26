// 「乗降車場所について」（場所の種類＝駐車場／路上／その他 と、その分岐の入力）。PC版・スマホ版で共通。
// 使い方: <div id="placeKind"></div> を置き、PlaceKind.mount('placeKind', onChange) を呼ぶ。
// 路上を選んだときだけ、ページ側が #pkStreetSlot に入れた「バスの向き」を出す。
// 今の指定内容は PlaceKind.value()。選んでいない分岐の入力は含めない（画面に残っていても使わない）。
(function () {
  const KINDS = [['parking', '駐車場'], ['street', '路上'], ['other', 'その他']];
  const RESERVE = [['reserved', '予約済み'], ['unreserved', '未予約'], ['not_needed', '予約不要'], ['unknown', '不明']];
  const FEE = [['paid', '有料'], ['free', '無料'], ['unknown', '不明']];
  const CSS = `
  .pk { border:1px solid #cfd4da; border-radius:12px; padding:12px 14px; display:flex; flex-direction:column; gap:10px; background:#fff; }
  .pk h3 { margin:0; font-size:16px; font-weight:700; padding-left:10px; border-left:4px solid #1D9E75; line-height:1.3; }
  .pk .pk-label { font-size:13px; color:#3b4148; margin-bottom:4px; }
  .pk .pk-opts { display:grid; gap:6px 10px; }
  .pk .pk-opts.c3 { grid-template-columns:repeat(3, minmax(0,1fr)); }
  .pk .pk-opts.c2 { grid-template-columns:repeat(2, minmax(0,1fr)); }
  .pk label.pk-opt { display:flex; align-items:center; gap:8px; padding:6px 4px; font-size:15px; cursor:pointer; border-radius:8px; line-height:1.3; }
  .pk label.pk-opt input { width:22px; height:22px; margin:0; padding:0; border:0; flex:0 0 auto; accent-color:#1D9E75; }
  .pk label.pk-opt span { white-space:normal; word-break:keep-all; overflow-wrap:anywhere; }
  .pk label.pk-opt:has(input:checked) { color:#0F6E56; font-weight:600; }
  .pk .pk-branch { background:#e9f7f1; border-radius:10px; padding:10px 12px; display:flex; flex-direction:column; gap:8px; }
  .pk .pk-hint { font-size:12px; color:#6b7280; }
  .pk textarea { font:inherit; font-size:16px; padding:10px 12px; border:1px solid #cfd4da; border-radius:10px; width:100%; box-sizing:border-box; background:#fff; }
  .pk .pk-none { font-size:12px; color:#8a5a00; background:#fdf3e1; border-radius:8px; padding:6px 10px; }`;

  const radios = (name, list, cls) =>
    `<div class="pk-opts ${cls}" role="radiogroup">` +
    list.map(([v, t]) => `<label class="pk-opt"><input type="radio" name="${name}" value="${v}"><span>${t}</span></label>`).join('') +
    `</div>`;

  let root = null, changed = () => {};

  function pick(name) {
    const el = root.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  }
  function labelOf(list, v) { const f = list.find(x => x[0] === v); return f ? f[1] : null; }

  function sync() {
    const kind = pick('pk_kind');
    root.querySelector('#pkParking').style.display = kind === 'parking' ? 'flex' : 'none';
    root.querySelector('#pkOther').style.display = kind === 'other' ? 'flex' : 'none';
    root.querySelector('#pkStreet').style.display = kind === 'street' ? 'flex' : 'none';
    root.querySelector('#pkNone').style.display = kind ? 'none' : 'block';
    changed();
  }

  function value() {
    const kind = pick('pk_kind');
    if (!kind) return { kind: null };
    if (kind === 'parking') return { kind, reservation: pick('pk_reserve'), fee: pick('pk_fee') };
    if (kind === 'other') return { kind, description: root.querySelector('#pkOtherText').value.trim() };
    return { kind };
  }

  // バス会社向けの文面などに使う1行
  function text() {
    const v = value();
    if (!v.kind) return '場所の種類：未選択';
    if (v.kind === 'parking') {
      return `場所の種類：駐車場（予約：${labelOf(RESERVE, v.reservation) || '未選択'}／料金：${labelOf(FEE, v.fee) || '未選択'}）`;
    }
    if (v.kind === 'other') return `場所の種類：その他（${v.description || '説明なし'}）`;
    return '場所の種類：路上';
  }

  function reset() {
    root.querySelectorAll('input[type=radio]').forEach(r => { r.checked = false; });
    root.querySelector('#pkOtherText').value = '';
    sync();
  }

  function mount(id, onChange) {
    if (!document.getElementById('pk-style')) {
      const st = document.createElement('style'); st.id = 'pk-style'; st.textContent = CSS; document.head.appendChild(st);
    }
    root = document.getElementById(id);
    changed = onChange || (() => {});
    root.className = 'pk';
    root.innerHTML = `
      <h3>乗降車場所について</h3>
      <div>
        <div class="pk-label">場所の種類</div>
        ${radios('pk_kind', KINDS, 'c3')}
      </div>
      <div class="pk-none" id="pkNone">まだ選ばれていません（駐車場・路上・その他から1つ選んでください）</div>
      <div class="pk-branch" id="pkParking" style="display:none">
        <div>
          <div class="pk-label">駐車場の予約</div>
          ${radios('pk_reserve', RESERVE, 'c2')}
        </div>
        <div>
          <div class="pk-label">駐車料金</div>
          ${radios('pk_fee', FEE, 'c3')}
        </div>
        <div class="pk-hint">わかる範囲でご入力ください。</div>
      </div>
      <div class="pk-branch" id="pkStreet" style="display:none"><div id="pkStreetSlot"></div></div>
      <div class="pk-branch" id="pkOther" style="display:none">
        <div class="pk-label">場所の説明</div>
        <textarea id="pkOtherText" rows="3" placeholder="例：〇〇ビル裏の荷さばきスペース。入口は△△通り側"></textarea>
      </div>
      <div class="pk-hint">駐車場：予約・料金を入力／路上：バスの向きを選ぶ<br>その他：内容を自由入力</div>`;
    root.addEventListener('change', sync);
    root.querySelector('#pkOtherText').addEventListener('input', () => changed());
    sync();
  }

  window.PlaceKind = { mount, value, text, reset };
})();
