// HARDCODED OPENAI API KEY
const OPENAI_API_KEY = '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';

const audioFileInput = document.getElementById('audioFileInput');
const statusText = document.getElementById('statusText');
const outputText = document.getElementById('outputText');

const copyBtn = document.getElementById('copyBtn');
const translateBtn = document.getElementById('translateBtn');
const showOriginalBtn = document.getElementById('showOriginalBtn');

const sourceLangSelect = document.getElementById('sourceLangSelect');
const targetLangSelect = document.getElementById('targetLangSelect');

let originalSpeechText = '';

// Check API key configuration
function checkApiKey() {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
    alert('Please replace "YOUR_OPENAI_API_KEY_HERE" in script.js with your actual OpenAI API key!');
    return false;
  }
  return true;
}

// 1. Upload Audio File and Send to Whisper
audioFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!checkApiKey()) return;

  if (!file.type.startsWith('audio/')) {
    alert('Please upload a valid audio file.');
    return;
  }

  statusText.textContent = `Transcribing "${file.name}"...`;
  await transcribeWithWhisper(file);
});

// 2. Transcribe Audio using OpenAI Whisper API
async function transcribeWithWhisper(audioFile) {
  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('model', 'whisper-1');
  formData.append('language', sourceLangSelect.value);

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      originalSpeechText = data.text;
      outputText.value = originalSpeechText;
      statusText.textContent = 'Transcription complete!';
      showOriginalBtn.style.display = 'none';
    } else {
      statusText.textContent = `Transcription failed: ${data.error?.message || 'Error'}`;
    }
  } catch (error) {
    console.error('Whisper API Error:', error);
    statusText.textContent = 'Failed to connect to OpenAI API.';
  }
}

// 3. Translate Text using OpenAI GPT
translateBtn.addEventListener('click', async () => {
  if (!checkApiKey()) return;

  const textToTranslate = outputText.value.trim();
  if (!textToTranslate) {
    alert('Please upload an audio file first or enter text!');
    return;
  }

  if (!originalSpeechText) {
    originalSpeechText = textToTranslate;
  }

  const targetLang = targetLangSelect.value;
  statusText.textContent = `Translating to ${targetLang}...`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Translate the following text directly into ${targetLang}. Return only the translation.`
          },
          {
            role: 'user',
            content: textToTranslate
          }
        ]
      })
    });

    const data = await response.json();

    if (response.ok) {
      outputText.value = data.choices[0].message.content.trim();
      statusText.textContent = 'Translation complete!';
      showOriginalBtn.style.display = 'inline-block';
    } else {
      statusText.textContent = `Translation failed: ${data.error?.message || 'Error'}`;
    }
  } catch (error) {
    console.error('Translation Error:', error);
    statusText.textContent = 'Error connecting to translation API.';
  }
});

// Revert to original text
showOriginalBtn.addEventListener('click', () => {
  if (originalSpeechText) {
    outputText.value = originalSpeechText;
    showOriginalBtn.style.display = 'none';
    statusText.textContent = 'Original text restored.';
  }
});

// Copy button
copyBtn.addEventListener('click', () => {
  if (outputText.value.trim() !== '') {
    navigator.clipboard.writeText(outputText.value);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => (copyBtn.textContent = 'Copy Text'), 2000);
  }
});
