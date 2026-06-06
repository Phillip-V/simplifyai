// SELECT ELEMENTS
const inputText = document.getElementById('input-text');
const charCount = document.getElementById('char-count');
const runBtn = document.getElementById('run-btn');
const btnText = document.getElementById('btn-text');
const spinner = document.getElementById('spinner');
const errorBox = document.getElementById('error-box');
const resultBox = document.getElementById('result-box');
const resultHeader = document.getElementById('result-header');
const copyBtn = document.getElementById('copy-btn');

let selectedLevel = 'normal';

// CHARACTER COUNT
inputText.addEventListener('input', () => {
  charCount.textContent = inputText.value.length + ' characters';
});

// LEVEL BUTTONS
document.querySelectorAll('.level-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedLevel = btn.dataset.level;
  });
});

// EXAMPLE CHIPS
document.querySelectorAll('.example-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    inputText.value = chip.textContent.trim();
    charCount.textContent = inputText.value.length + ' characters';
    inputText.focus();
    inputText.scrollIntoView({ behavior: 'smooth' });
  });
});

// COPY BUTTON
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(resultBox.textContent).then(() => {
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
  });
});

// EXPLAIN FUNCTION
runBtn.addEventListener('click', async () => {
  const text = inputText.value.trim();

  // Reset
  errorBox.style.display = 'none';
  resultBox.style.display = 'none';
  resultHeader.style.display = 'none';

  if (!text) {
    errorBox.textContent = 'Please paste some text first.';
    errorBox.style.display = 'block';
    return;
  }

  // Loading state
  runBtn.disabled = true;
  spinner.style.display = 'block';
  btnText.textContent = 'Explaining...';

  try {
    const response = await fetch('/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, level: selectedLevel })
    });

    const data = await response.json();

    if (data.error) {
      errorBox.textContent = data.error;
      errorBox.style.display = 'block';
    } else {
      resultBox.textContent = data.explanation;
      resultBox.style.display = 'block';
      resultHeader.style.display = 'flex';
      resultBox.scrollIntoView({ behavior: 'smooth' });
    }

  } catch (err) {
    errorBox.textContent = 'Something went wrong. Make sure the server is running and try again.';
    errorBox.style.display = 'block';
  }

  // Reset button
  runBtn.disabled = false;
  spinner.style.display = 'none';
  btnText.textContent = '✨ Explain This';
});