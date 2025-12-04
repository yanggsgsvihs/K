const baseInput = document.getElementById('baseNumber');
    const startInput = document.getElementById('rangeStart');
    const endInput = document.getElementById('rangeEnd');
    const resultEl = document.getElementById('tabuadaResult');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');

    function clamp(n, min, max) {
      return Math.min(Math.max(n, min), max);
    }

    function generateTable() {
      const base = Number(baseInput.value);
      let start = Number(startInput.value);
      let end = Number(endInput.value);

      if (!Number.isFinite(base)) {
        resultEl.innerHTML = '<p class="msg">Insira um número base válido.</p>';
        return;
      }

      start = clamp(start, -1000, 1000);
      end = clamp(end, -1000, 1000);

      const step = start <= end ? 1 : -1;
      const items = [];
      for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
        items.push(`<li><code>${base} × ${i} = ${base * i}</code></li>`);
      }
      resultEl.innerHTML = `<ul class="tabuada__list">${items.join('')}</ul>`;
    }

    function copyToClipboard() {
      const text = resultEl.textContent.trim();
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = 'Copiado!';
        setTimeout(() => (copyBtn.textContent = 'Copiar'), 1200);
      });
    }

    function clearAll() {
      baseInput.value = '';
      startInput.value = 1;
      endInput.value = 10;
      resultEl.innerHTML = '';
    }

    generateBtn.addEventListener('click', generateTable);
    copyBtn.addEventListener('click', copyToClipboard);
    clearBtn.addEventListener('click', clearAll);


    [baseInput, startInput, endInput].forEach(el =>
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter') generateTable();
      })
    );