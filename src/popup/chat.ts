const SUPABASE_URL = 'https://puagdyacwgqkebjdbbrz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LarSIrAtxsvXN4RLLicQyw_TJk8s92b';

interface ChatProduct {
  name: string;
  brand: string;
  price: string;
  grade: string;
  gradeColor: string;
  materials: string;
  sustainability: string[];
  url?: string;
}

interface ChatResponse {
  message: string;
  products: ChatProduct[];
}

const GRADE_COLOR_MAP: Record<string, string> = {
  A: '#16A34A',
  B: '#65A30D',
  C: '#EAB308',
  D: '#EA580C',
  F: '#DC2626',
};

let chatHistory: { role: 'user' | 'assistant'; content: string }[] = [];

export function initChat() {
  const input = document.getElementById('chat-input') as HTMLInputElement;
  const sendBtn = document.getElementById('chat-send') as HTMLButtonElement;
  const messages = document.getElementById('chat-messages') as HTMLDivElement;

  function send() {
    const text = input.value.trim();
    if (!text) return;

    appendMessage('user', text);
    input.value = '';
    sendBtn.disabled = true;

    chatHistory.push({ role: 'user', content: text });

    const typingEl = showTyping();

    callAI(text)
      .then((response) => {
        typingEl.remove();
        appendBotResponse(response);
        chatHistory.push({ role: 'assistant', content: response.message });
      })
      .catch((err) => {
        typingEl.remove();
        appendMessage('bot', `Sorry, something went wrong. Please try again.\n\n<em>${escapeHtml(err.message)}</em>`);
      })
      .finally(() => {
        sendBtn.disabled = false;
        input.focus();
      });
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  function appendMessage(role: 'user' | 'bot', html: string) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    bubble.innerHTML = `
      <div class="chat-avatar">${role === 'bot' ? '🌿' : '👤'}</div>
      <div class="chat-text">${html}</div>
    `;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  function appendBotResponse(response: ChatResponse) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble bot';

    let productsHtml = '';
    if (response.products.length > 0) {
      productsHtml = response.products.map((p) => `
        <div class="chat-product">
          <div class="chat-product-header">
            <div>
              <div class="chat-product-brand">${escapeHtml(p.brand)}</div>
              <div class="chat-product-name">${escapeHtml(p.name)}</div>
            </div>
            <div class="chat-product-grade" style="background: ${GRADE_COLOR_MAP[p.grade] || '#999'}">${escapeHtml(p.grade)}</div>
          </div>
          <div class="chat-product-details">
            <span>💰 ${escapeHtml(p.price)}</span>
            <span>🧵 ${escapeHtml(p.materials)}</span>
          </div>
          <div class="chat-product-tags">
            ${p.sustainability.map((s) => `<span class="chat-product-tag">${escapeHtml(s)}</span>`).join('')}
          </div>
          ${p.url ? `<a class="chat-product-link" href="${escapeHtml(p.url)}" target="_blank">View product →</a>` : ''}
        </div>
      `).join('');
    }

    bubble.innerHTML = `
      <div class="chat-avatar">🌿</div>
      <div class="chat-text">${response.message}${productsHtml}</div>
    `;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping(): HTMLElement {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble bot';
    bubble.innerHTML = `
      <div class="chat-avatar">🌿</div>
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  }
}

async function callAI(userMessage: string): Promise<ChatResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-stylist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      message: userMessage,
      history: chatHistory.slice(-10),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }

  return response.json();
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
