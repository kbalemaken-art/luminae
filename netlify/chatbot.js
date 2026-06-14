/* ═══════════════════════════════════════════════════════════
   LUMINAE — chatbot.js
   Luna, conseillère beauté IA · Intégration Anthropic API
   À placer à la racine du projet (même dossier que index.html)
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     1. BASE DE CONNAISSANCE + PERSONNALITÉ
  ────────────────────────────────────────────────────────── */
  const SYSTEM_PROMPT = `Tu es Luna, la conseillère beauté virtuelle de Luminae — une maison de cosmétiques naturels premium fondée à Lyon en 2019.

TON RÔLE : conseiller avec chaleur, expertise et sincérité. Tes réponses sont concises (3-4 phrases max), jamais cliniques. Tu parles comme une amie experte en beauté, pas comme un chatbot. Tu peux utiliser des emojis sobrement (1 max par message).

RÈGLE ABSOLUE : tu bases tes réponses exclusivement sur les informations Luminae ci-dessous. Si la question sort de ce périmètre, réponds : "Ce n'est pas dans mon domaine d'expertise — pour toute autre question, notre équipe vous attend à bonjour@luminae.fr 💌"

════ LUMINAE — QUI SOMMES-NOUS ════
Fondée en 2019 à Lyon par Sophie Arnaud (biochimiste, 12 ans de recherche en dermatologie végétale) et Marc Lefèvre (entrepreneur, ex-L'Oréal). Après 3 ans de R&D et 200+ formulations testées, le lancement a lieu en 2022. Aujourd'hui : 8 soins iconiques, 12 000 clientes, laboratoire certifié Ecocert à Lyon.

Valeurs fondatrices :
• Naturalité — 95%+ d'ingrédients d'origine naturelle par formule
• Efficacité prouvée — tests cliniques sur panel humain avant commercialisation
• Responsabilité — emballages recyclables, recharges disponibles, bilan carbone compensé

Certifications : EVE VEGAN · PETA Cruelty-Free · Ecocert · Fabriqué en France
Contact : bonjour@luminae.fr · Lyon, France

Équipe :
• Sophie Arnaud — Co-fondatrice & Directrice R&D (biochimiste)
• Marc Lefèvre — Co-fondateur & CEO
• Chloé Martineau — Responsable Formulation (pharmacienne)

════ NOS SOINS ════
1. Sérum Éclat Vitamine C — 58 € ★ Best-seller
   15% vitamine C stable · illumine · unifie · protège le teint au quotidien
2. Crème Hydratante 48h — 42 € ✦ Nouveau
   Acide hyaluronique tri-moléculaire · hydratation intense et durable
3. Huile Précieuse Nuit — 67 € ♡ Coup de cœur
   Complexe de 7 huiles rares · régénère et nourrit en profondeur pendant le sommeil
4. Starter Kit Découverte — 89 € ◇ Offre spéciale
   Sérum + Crème + Huile Nuit en formats voyage — idéal pour débuter

Routine idéale (synergie gamme) :
Matin → Nettoyant · Sérum Vitamine C · Crème Hydratante · SPF 50
Soir  → Nettoyant · Huile Précieuse Nuit · Crème Hydratante

════ FAQ ════

[PRODUITS]
Q: Vegan et cruelty-free ?
R: Oui, certifiés EVE VEGAN et PETA. Aucun ingrédient d'origine animale, aucun test sur les animaux à aucune étape.

Q: Convient aux peaux sensibles ?
R: Oui. Nos formules sont testées dermatologiquement, sans parfum synthétique, alcool dénaturé ni perturbateurs endocriniens. En cas de doute, testez sur le pli du coude 48h.

Q: Durée de vie après ouverture ?
R: Symbole PAO sur chaque emballage : 6M (6 mois) pour les sérums, 12M pour les crèmes. Conserver à l'abri de la chaleur et de la lumière.

Q: Puis-je combiner plusieurs produits ?
R: Absolument, la gamme est pensée en synergie. La routine idéale : Nettoyant → Sérum → Crème Hydratante → SPF le matin.

[LIVRAISON]
Q: Délais et frais de livraison ?
R: Standard (3-5 jours ouvrés) offerte dès 60 €, sinon 4,90 €. Express 24h à 9,90 €. Zones : France métro, Belgique, Suisse, Luxembourg.

Q: Comment suivre ma commande ?
R: Un email avec lien de suivi est envoyé dès l'expédition. Consultez aussi votre espace client > "Mes commandes".

Q: Modifier ou annuler une commande ?
R: Possible dans les 2h suivant la validation en contactant notre service client. Au-delà, la préparation est lancée.

[RETOURS]
Q: Politique de retour ?
R: 30 jours après réception pour tout produit non ouvert, dans son emballage d'origine. Retour gratuit via étiquette prépayée. Produits ouverts non repris (sauf défaut avéré).

Q: Délai de remboursement ?
R: 5 à 7 jours ouvrés après réception et validation du retour, sur le moyen de paiement d'origine.

[PAIEMENT]
Q: Modes de paiement acceptés ?
R: CB (Visa, Mastercard, Amex), PayPal, Apple Pay, Google Pay. Paiement 3x sans frais dès 80 € via Alma.

Q: Données bancaires sécurisées ?
R: Oui. Luminae ne stocke aucune donnée bancaire. Paiements via Stripe, certifié PCI-DSS niveau 1.`;

  /* ──────────────────────────────────────────────────────────
     2. SUGGESTIONS RAPIDES
  ────────────────────────────────────────────────────────── */
  const CHIPS = [
    { icon: '✨', label: 'Quelle routine pour ma peau ?' },
    { icon: '📦', label: 'Délais de livraison ?' },
    { icon: '🌿', label: 'Formules peaux sensibles ?' },
    { icon: '↩️', label: 'Comment retourner un produit ?' },
  ];

  /* ──────────────────────────────────────────────────────────
     3. STATE
  ────────────────────────────────────────────────────────── */
  let history  = [];
  let busy     = false;
  let chipsOut = false;

  /* ──────────────────────────────────────────────────────────
     4. STYLES (injectés dynamiquement — palette Luminae)
  ────────────────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('luna-css')) return;
    const s = document.createElement('style');
    s.id = 'luna-css';
    s.textContent = `
      /* ── Animations ── */
      @keyframes lunaIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      @keyframes lunaDot { 0%,60%,100%{transform:translateY(0);opacity:.45} 30%{transform:translateY(-5px);opacity:1} }

      /* ── Scroll ── */
      #chatbot-messages::-webkit-scrollbar { width: 4px; }
      #chatbot-messages::-webkit-scrollbar-track { background: transparent; }
      #chatbot-messages::-webkit-scrollbar-thumb { background: rgba(200,169,126,.25); border-radius: 4px; }

      /* ── Bot row ── */
      .luna-row {
        display: flex; gap: 8px; align-items: flex-end;
        animation: lunaIn .26s ease;
      }
      .luna-col { display: flex; flex-direction: column; gap: 3px; }

      /* ── Bot avatar ── */
      .luna-av {
        width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
        background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%);
        display: flex; align-items: center; justify-content: center;
        font-size: 12px;
        box-shadow: 0 2px 8px rgba(200,169,126,.3);
      }

      /* ── Bot bubble ── */
      .luna-bubble {
        background: var(--brand-light);
        color: var(--neutral-900);
        border: 1px solid rgba(200,169,126,.22);
        border-radius: 14px 14px 14px 3px;
        padding: 10px 14px;
        font-family: var(--font-body);
        font-size: .875rem;
        line-height: 1.65;
        max-width: 80%;
        word-break: break-word;
        white-space: pre-wrap;
      }

      /* ── Typing ── */
      .luna-dots {
        display: flex; gap: 5px; align-items: center;
        padding: 13px 16px;
      }
      .luna-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--brand-dark);
        animation: lunaDot 1.1s ease-in-out infinite;
      }
      .luna-dot:nth-child(2) { animation-delay:.16s; }
      .luna-dot:nth-child(3) { animation-delay:.32s; }

      /* ── Timestamp ── */
      .luna-ts {
        font-size: .68rem;
        color: var(--neutral-600);
        opacity: .6;
        padding-left: 34px;
        font-family: var(--font-body);
      }
      .luna-ts-right {
        font-size: .68rem;
        color: var(--neutral-600);
        opacity: .6;
        text-align: right;
        font-family: var(--font-body);
      }

      /* ── User bubble ── */
      .luna-user-col {
        display: flex; flex-direction: column;
        align-items: flex-end; gap: 3px;
        animation: lunaIn .22s ease;
      }
      .luna-user-bubble {
        align-self: flex-end;
        background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%);
        color: #fff;
        border-radius: 14px 14px 3px 14px;
        padding: 10px 14px;
        font-family: var(--font-body);
        font-size: .875rem;
        max-width: 80%;
        line-height: 1.55;
        word-break: break-word;
        box-shadow: 0 3px 12px rgba(200,169,126,.32);
      }

      /* ── Quick chips ── */
      .luna-chips {
        margin-top: 14px;
        display: flex; flex-direction: column; gap: 6px;
        width: 100%;
      }
      .luna-chip {
        display: flex; align-items: center; gap: 8px;
        background: var(--white);
        color: var(--neutral-900);
        border: 1.5px solid rgba(200,169,126,.3);
        border-radius: 22px;
        padding: 8px 14px;
        font-family: var(--font-body);
        font-size: .82rem;
        font-weight: 500;
        cursor: pointer;
        text-align: left;
        transition: background 160ms ease, border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
        line-height: 1.3;
      }
      .luna-chip:hover {
        background: var(--brand-light);
        border-color: var(--brand);
        transform: translateX(4px);
        box-shadow: 0 2px 10px rgba(200,169,126,.2);
      }
      .luna-chip-icon { font-size: .9rem; flex-shrink: 0; }

      /* ── Input enhancement ── */
      #chatbot-input:focus {
        border-color: var(--brand) !important;
        background: var(--white) !important;
        box-shadow: 0 0 0 3px rgba(200,169,126,.14) !important;
      }
      #chatbot-send { transition: background 160ms ease, transform 160ms ease, opacity 160ms ease !important; }
      #chatbot-send:not([disabled]):hover { background: var(--brand-dark) !important; transform: scale(1.06); }
      #chatbot-send[disabled] { opacity: .45 !important; cursor: not-allowed !important; }
    `;
    document.head.appendChild(s);
  }

  /* ──────────────────────────────────────────────────────────
     5. DOM HELPERS
  ────────────────────────────────────────────────────────── */
  const scrollBot = el => { el.scrollTop = el.scrollHeight; };
  const ts = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  function removeChips(container) {
    const c = container.querySelector('.luna-chips');
    if (c) c.remove();
  }

  /* User bubble */
  function appendUser(container, text) {
    removeChips(container);
    const col = document.createElement('div');
    col.className = 'luna-user-col';

    const bub = document.createElement('div');
    bub.className = 'luna-user-bubble';
    bub.textContent = text;

    const time = document.createElement('div');
    time.className = 'luna-ts-right';
    time.textContent = 'Vous · ' + ts();

    col.appendChild(bub);
    col.appendChild(time);
    container.appendChild(col);
    scrollBot(container);
  }

  /* Bot bubble */
  function appendBot(container, text) {
    const col = document.createElement('div');
    col.className = 'luna-col';

    const row = document.createElement('div');
    row.className = 'luna-row';

    const av = document.createElement('div');
    av.className = 'luna-av';
    av.setAttribute('aria-hidden', 'true');
    av.textContent = '✨';

    const bub = document.createElement('div');
    bub.className = 'luna-bubble';
    bub.textContent = text;

    const time = document.createElement('div');
    time.className = 'luna-ts';
    time.textContent = 'Luna · ' + ts();

    row.appendChild(av);
    row.appendChild(bub);
    col.appendChild(row);
    col.appendChild(time);
    container.appendChild(col);
    scrollBot(container);
  }

  /* Typing indicator */
  function showTyping(container) {
    const col = document.createElement('div');
    col.className = 'luna-col';
    col.id = 'luna-typing';

    const row = document.createElement('div');
    row.className = 'luna-row';

    const av = document.createElement('div');
    av.className = 'luna-av';
    av.setAttribute('aria-hidden', 'true');
    av.textContent = '✨';

    const bub = document.createElement('div');
    bub.className = 'luna-bubble luna-dots';

    for (let i = 0; i < 3; i++) {
      const d = document.createElement('span');
      d.className = 'luna-dot';
      bub.appendChild(d);
    }

    row.appendChild(av);
    row.appendChild(bub);
    col.appendChild(row);
    container.appendChild(col);
    scrollBot(container);
  }

  function removeTyping() {
    const el = document.getElementById('luna-typing');
    if (el) el.remove();
  }

  /* Quick chips */
  function renderChips(container, sendFn) {
    if (chipsOut) return;
    chipsOut = true;

    const wrap = document.createElement('div');
    wrap.className = 'luna-chips';

    CHIPS.forEach(({ icon, label }) => {
      const btn = document.createElement('button');
      btn.className = 'luna-chip';
      btn.setAttribute('type', 'button');

      const ico = document.createElement('span');
      ico.className = 'luna-chip-icon';
      ico.setAttribute('aria-hidden', 'true');
      ico.textContent = icon;

      const txt = document.createElement('span');
      txt.textContent = label;

      btn.appendChild(ico);
      btn.appendChild(txt);
      btn.addEventListener('click', () => {
        wrap.remove();
        sendFn(label);
      });
      wrap.appendChild(btn);
    });

    const welcome = container.querySelector('.chat-welcome');
    if (welcome) welcome.appendChild(wrap);
    else container.appendChild(wrap);
  }

  /* ──────────────────────────────────────────────────────────
     6. CONFIGURATION ENVIRONNEMENT
     ▸ LOCAL  → MODE = 'local'  + ta clé API ci-dessous
     ▸ NETLIFY → MODE = 'netlify' + supprimer la clé (variable d'env côté serveur)
  ────────────────────────────────────────────────────────── */
  const CONFIG = {
    MODE: 'local',                       // ← changer en 'netlify' au déploiement
    API_KEY: 'sk-ant-VOTRE-CLE-ICI',     // ← coller ta clé Anthropic ici (local uniquement)
    NETLIFY_ENDPOINT: '/.netlify/functions/chat',
    ANTHROPIC_ENDPOINT: 'https://api.anthropic.com/v1/messages',
    MODEL: 'claude-sonnet-4-20250514',
    MAX_TOKENS: 1000,
  };

  /* ──────────────────────────────────────────────────────────
     7. API CALL
  ────────────────────────────────────────────────────────── */
  async function callAPI(container, userText, inputEl, sendBtn) {
    if (busy) return;
    busy = true;
    if (sendBtn) sendBtn.disabled = true;

    history.push({ role: 'user', content: userText });
    showTyping(container);

    try {
      let res;

      if (CONFIG.MODE === 'netlify') {
        /* ── Mode Netlify : appel à la fonction serverless ── */
        res = await fetch(CONFIG.NETLIFY_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history, system: SYSTEM_PROMPT })
        });
      } else {
        /* ── Mode local : appel direct à l'API Anthropic ── */
        res = await fetch(CONFIG.ANTHROPIC_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CONFIG.API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: CONFIG.MODEL,
            max_tokens: CONFIG.MAX_TOKENS,
            system: SYSTEM_PROMPT,
            messages: history
          })
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `Erreur ${res.status}`);

      const reply = data.content?.find(b => b.type === 'text')?.text
        || 'Je n\'ai pas pu formuler une réponse. Notre équipe reste joignable à bonjour@luminae.fr 💌';

      history.push({ role: 'assistant', content: reply });
      removeTyping();
      appendBot(container, reply);

    } catch (err) {
      console.error('[Luna]', err);
      removeTyping();
      appendBot(container, 'Une erreur s\'est produite. Veuillez réessayer ou écrire à bonjour@luminae.fr 💌');
    } finally {
      busy = false;
      if (sendBtn) sendBtn.disabled = false;
      if (inputEl)  { inputEl.focus(); updateSendState(inputEl, sendBtn); }
    }
  }

  /* ──────────────────────────────────────────────────────────
     7. SEND BUTTON STATE
  ────────────────────────────────────────────────────────── */
  function updateSendState(input, btn) {
    if (!btn) return;
    btn.disabled = !input.value.trim();
  }

  /* ──────────────────────────────────────────────────────────
     8. INIT
  ────────────────────────────────────────────────────────── */
  function init() {
    const container = document.getElementById('chatbot-messages');
    const sendBtn   = document.getElementById('chatbot-send');
    const input     = document.getElementById('chatbot-input');

    if (!container || !sendBtn || !input) return;

    /* Inject CSS */
    injectStyles();

    /* Clone elements to strip old inline-script listeners */
    const newSend  = sendBtn.cloneNode(true);
    const newInput = input.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSend, sendBtn);
    input.parentNode.replaceChild(newInput, input);

    /* Initial send button state */
    newSend.disabled = true;

    /* Core send function */
    function doSend(text) {
      const msg = (text || newInput.value).trim();
      if (!msg || busy) return;
      removeChips(container);
      appendUser(container, msg);
      newInput.value = '';
      updateSendState(newInput, newSend);
      callAPI(container, msg, newInput, newSend);
    }

    /* Event listeners */
    newSend.addEventListener('click', () => doSend());
    newInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
    });
    newInput.addEventListener('input', () => updateSendState(newInput, newSend));

    /* Render quick chips */
    renderChips(container, doSend);

    /* FAQ page — "Parler à Luna" CTA already wired in faq.html inline script */
  }

  /* ── Run after full parse (defer guarantees DOM ready) ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
