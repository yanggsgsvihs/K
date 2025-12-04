
let current = '0';
let previous = '';
let operation = null;
let justCalculated = false;


const currDisplay = document.getElementById('currDisplay');
const prevDisplay = document.getElementById('prevDisplay');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

function updateDisplay() {
  currDisplay.textContent = current || '0';
  prevDisplay.textContent = previous && operation
    ? `${previous} ${symbolFor(operation)}`
    : '';
}

function symbolFor(op) {
  return {
    add: '+',
    subtract: '−',
    multiply: '×',
    divide: '÷'
  }[op] || '';
}

function pushHistory(expr, result) {
  const item = { expr, result };
  const data = JSON.parse(localStorage.getItem('calcHistory') || '[]');
  data.unshift(item);
  const trimmed = data.slice(0, 12);
  localStorage.setItem('calcHistory', JSON.stringify(trimmed));
  renderHistory();
}

function renderHistory() {
  const data = JSON.parse(localStorage.getItem('calcHistory') || '[]');
  historyList.innerHTML = '';
  data.forEach(({ expr, result }, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="history__expr">${expr}</span>
      <span class="history__res">${result}</span>
    `;
    li.title = 'Clique para usar este resultado';
    li.addEventListener('click', () => {
      current = String(result);
      previous = '';
      operation = null;
      justCalculated = true;
      updateDisplay();
    });
    historyList.appendChild(li);
  });
}

function clearHistory() {
  localStorage.removeItem('calcHistory');
  renderHistory();
}


function appendNumber(n) {
  if (justCalculated) {
    current = '0';
    justCalculated = false;
  }
  if (current === '0') {
    current = n;
  } else {
    current += n;
  }
}

function appendDot() {
  if (justCalculated) {
    current = '0';
    justCalculated = false;
  }
  if (!current.includes('.')) current += '.';
}

function chooseOperation(op) {
  if (current === '' || current === '0' && previous) {
    operation = op; 
    updateDisplay();
    return;
  }
  if (previous) {
    compute();
  }
  previous = current;
  current = '0';
  operation = op;
}

function percent() {
  const n = Number(current);
  if (!Number.isFinite(n)) return;
  current = String(n / 100);
}

function sqrt() {
  const n = Number(current);
  if (n < 0) {
    current = 'Erro';
    return;
  }
  current = String(Math.sqrt(n));
  justCalculated = true;
}

function clearAll() {
  current = '0';
  previous = '';
  operation = null;
  justCalculated = false;
}

function deleteLast() {
  if (justCalculated) {
   
    current = '0';
    justCalculated = false;
    return;
  }
  current = current.length > 1 ? current.slice(0, -1) : '0';
}

function compute() {
  const a = Number(previous);
  const b = Number(current);
  if (!Number.isFinite(a) || !Number.isFinite(b) || !operation) return;

  let result;
  switch (operation) {
    case 'add': result = a + b; break;
    case 'subtract': result = a - b; break;
    case 'multiply': result = a * b; break;
    case 'divide':
      if (b === 0) {
        current = 'Erro';
        previous = '';
        operation = null;
        justCalculated = true;
        updateDisplay();
        return;
      }
      result = a / b;
      break;
    default: return;
  }
  const expr = `${previous} ${symbolFor(operation)} ${current} =`;
  current = String(result);
  previous = '';
  operation = null;
  justCalculated = true;

  
  pushHistory(expr, current);
}


document.querySelectorAll('[data-num]').forEach(btn =>
  btn.addEventListener('click', () => {
    appendNumber(btn.getAttribute('data-num'));
    updateDisplay();
  })
);

document.querySelectorAll('[data-op]').forEach(btn =>
  btn.addEventListener('click', () => {
    chooseOperation(btn.getAttribute('data-op'));
    updateDisplay();
  })
);

document.querySelectorAll('[data-action]').forEach(btn =>
  btn.addEventListener('click', () => {
    const act = btn.getAttribute('data-action');
    if (act === 'clear') clearAll();
    if (act === 'delete') deleteLast();
    if (act === 'percent') percent();
    if (act === 'sqrt') sqrt();
    if (act === 'equals') compute();
    updateDisplay();
  })
);

document.querySelector('[data-dot]')?.addEventListener('click', () => {
  appendDot();
  updateDisplay();
});


clearHistoryBtn?.addEventListener('click', clearHistory);
renderHistory();
updateDisplay();


window.addEventListener('keydown', (e) => {
  const key = e.key;

  if (/\d/.test(key)) {
    appendNumber(key);
    updateDisplay();
    return;
  }

  if (key === '.') {
    appendDot();
    updateDisplay();
    return;
  }

  if (key === '+' || key === '-' || key === '*' || key === '/') {
    const map = { '+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide' };
    chooseOperation(map[key]);
    updateDisplay();
    return;
  }

  if (key === 'Enter' || key === '=') {
    compute();
    updateDisplay();
    return;
  }

  if (key === 'Escape') {
    clearAll();
    updateDisplay();
    return;
  }

  if (key === 'Backspace') {
    deleteLast();
    updateDisplay();
    return;
  }

  if (key.toLowerCase() === 'p' || key === '%') {
    percent();
    updateDisplay();
    return;
  }

  if (key.toLowerCase() === 'r') {
    sqrt();
    updateDisplay();
    return;
  }
});
