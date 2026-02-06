(function () {
  const form = document.querySelector("form[data-alloc-form]");
  if (!form) return;

  const labels = window.ALLOC_LABELS || [];
  const totalEl = document.querySelector("[data-total]");
  const hintEl = document.querySelector("[data-hint]");
  const submitBtn = document.querySelector("[data-submit]");

  function getInt(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const v = Number(el.value);
    return Number.isInteger(v) ? v : NaN;
  }

  function computeTotal() {
    let sum = 0;
    for (const k of labels) {
      const n = getInt(`score_${k}`);
      if (!Number.isInteger(n) || n < 0 || n > 100) return { ok: false, sum: NaN };
      sum += n;
    }
    return { ok: true, sum };
  }

  function render() {
    const { ok, sum } = computeTotal();
    if (totalEl) totalEl.textContent = ok ? String(sum) : "—";

    const valid = ok && sum === 100;
    if (hintEl) {
      hintEl.textContent = valid ? "✅ 總和正確，可以提交" : "⚠️ Total must be 100";
    }
    if (submitBtn) submitBtn.disabled = !valid;
  }

  // Bind input events
  for (const k of labels) {
    const el = document.getElementById(`score_${k}`);
    if (!el) continue;
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  }

  form.addEventListener("submit", (e) => {
    const { ok, sum } = computeTotal();
    if (!(ok && sum === 100)) {
      e.preventDefault();
      render();
      alert("三項分數總和必須等於 100，並且每項要是 0–100 的整數。");
    }
  });

  render();
})();