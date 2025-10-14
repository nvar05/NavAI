// generate.js — client-side UI logic
// 1) Generate button shows loading shimmer then a placeholder image (no secret keys).
// 2) FAQ accordion: click question to toggle answer with smooth slide.
// 3) Defensive selectors: will warn in console if your HTML IDs/classes differ. 

// ---------- helpers ----------
function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }
function slideToggle(el, duration=250){
  if (!el) return;
  if (getComputedStyle(el).display === 'none') {
    el.style.removeProperty('display');
    let display = getComputedStyle(el).display;
    if (display === 'none') display = 'block';
    el.style.display = display;
    let height = el.offsetHeight;
    el.style.overflow = 'hidden';
    el.style.height = 0;
    el.style.transition = `height ${duration}ms ease`;
    requestAnimationFrame(()=> el.style.height = height + 'px');
    setTimeout(()=> { el.style.removeProperty('height'); el.style.removeProperty('overflow'); el.style.removeProperty('transition'); }, duration);
  } else {
    let height = el.offsetHeight;
    el.style.overflow = 'hidden';
    el.style.height = height + 'px';
    el.style.transition = `height ${duration}ms ease`;
    requestAnimationFrame(()=> el.style.height = 0);
    setTimeout(()=> { el.style.display = 'none'; el.style.removeProperty('height'); el.style.removeProperty('overflow'); el.style.removeProperty('transition'); }, duration);
  }
}

// ---------- Generate UI ----------
document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = qs('#generateBtn') || qs('.generate .cta') || qs('.cta');
  const promptBox = qs('#prompt-box') || qs('#promptInput') || qs('textarea#prompt-box');
  const outputArea = qs('.output-area') || qs('#output-area') || (() => {
    // If no output area exists, create one under the generate section
    const gen = qs('.generate') || qs('#generate');
    if (!gen) return null;
    const wrapper = document.createElement('div'); wrapper.className = 'output-area';
    wrapper.innerHTML = `<p class="placeholder-text">Your generated image will appear here</p><img id="output-image" alt="Generated image" style="display:none;max-width:100%;border-radius:8px;">`;
    gen.appendChild(wrapper);
    return wrapper;
  })();

  const placeholderText = outputArea ? outputArea.querySelector('.placeholder-text') : null;
  const outputImage = outputArea ? outputArea.querySelector('#output-image') : null;

  if (!generateBtn) console.warn('generateBtn not found — make sure your Generate button has id="generateBtn" or class "cta" inside .generate.');
  if (!promptBox) console.warn('prompt-box not found — make sure you have <textarea id="prompt-box"> or input with id="prompt-box".');
  if (!outputArea) console.warn('output-area not found and could not be created. Add an element with class "output-area".');

  // Loading shimmer class: ensures CSS handles the effect (if missing below includes CSS snippet)
  function setLoading(on){
    if (!outputArea) return;
    if (on) { outputArea.classList.add('loading'); if (placeholderText) placeholderText.textContent = 'Generating...'; }
    else { outputArea.classList.remove('loading'); if (placeholderText) placeholderText.textContent = ''; }
  }

  generateBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    const prompt = (promptBox && promptBox.value) ? promptBox.value.trim() : '';
    if (!prompt) { alert('Please type a prompt first.'); return; }

    // UI show loading
    if (placeholderText) { placeholderText.textContent = 'Generating...'; placeholderText.style.opacity = '1'; }
    if (outputImage) outputImage.style.display = 'none';
    setLoading(true);

    // simulate network/model delay
    await new Promise(r => setTimeout(r, 1400));

    // placeholder image (client-side demo). Replace this logic later with your server call.
    const sample = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/1024/640`;
    if (outputImage) {
      outputImage.src = sample;
      outputImage.style.display = 'block';
      outputImage.alt = prompt;
    } else if (outputArea) {
      // fallback: create img
      const img = document.createElement('img'); img.src = sample; img.alt = prompt;
      img.style.maxWidth = '100%'; img.style.borderRadius = '8px';
      outputArea.innerHTML = ''; outputArea.appendChild(img);
    }
    setLoading(false);
  });

  // ---------- FAQ accordion ----------
  // expects markup: elements with class .faq-item each containing .faq-q (question) and .faq-a (answer)
  qsa('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q') || item.querySelector('h3') || item.querySelector('button');
    const a = item.querySelector('.faq-a') || item.querySelector('p') || item.querySelector('.answer');
    if (!q || !a) return; // skip malformed
    // initial hide
    if (getComputedStyle(a).display !== 'none') a.style.display = 'none';

    q.style.cursor = 'pointer';
    q.addEventListener('click', () => {
      // close other open ones (optional; comment out if multiple open allowed)
      qsa('.faq-item').forEach(other => {
        if (other !== item) {
          const oa = other.querySelector('.faq-a') || other.querySelector('p') || other.querySelector('.answer');
          if (oa && getComputedStyle(oa).display !== 'none') slideToggle(oa, 220);
        }
      });
      slideToggle(a, 220);
    });
  });
});
