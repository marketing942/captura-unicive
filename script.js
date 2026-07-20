/* =========================================================
   UniCV Caruaru — Pré-venda
   Formulário → Google Sheets + Pixel + PixelX redirect WhatsApp
   ========================================================= */

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxdFplWVSfhTjvyIA7HIWb645xRjGNhBVhTdTf5UMjo0lSpW_A_jCuys0qB4uImKXPQ/exec?aba=UNICIVE";

const PIXELX_WHATSAPP_REDIRECT = "https://pxa.cppem.com.br/lt/unicive-whatsapp-redirect";
const WHATSAPP_MSG = "Quero saber mais sobre o superior EAD!";

/* ---------- Popup do formulário ---------- */
const formModal = document.getElementById("form-modal");
const openFormBtn = document.getElementById("open-form-btn");
const closeFormBtn = document.getElementById("close-form-btn");

function openFormModal() {
  if (!formModal) return;
  formModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeFormModal() {
  if (!formModal) return;
  formModal.hidden = true;
  document.body.classList.remove("modal-open");
}

if (openFormBtn) openFormBtn.addEventListener("click", openFormModal);
if (closeFormBtn) closeFormBtn.addEventListener("click", closeFormModal);

if (formModal) {
  formModal.addEventListener("click", (e) => {
    if (e.target === formModal) closeFormModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && formModal && !formModal.hidden) closeFormModal();
});

/* ---------- Máscara: (00) 00000-0000 ---------- */
const telefoneInput = document.getElementById("telefone");

if (telefoneInput) {
  telefoneInput.addEventListener("input", () => {
    const v = telefoneInput.value.replace(/\D/g, "").slice(0, 11);
    let out = "";

    if (v.length > 0) out = "(" + v.slice(0, 2);
    if (v.length >= 2) out += ") ";
    if (v.length > 2) out += v.slice(2, 7);
    if (v.length > 7) out += "-" + v.slice(7, 11);

    telefoneInput.value = out;
  });
}

/* ---------- Validação ---------- */
const form = document.getElementById("lead-form");

function fieldOf(name) {
  const input = form?.querySelector(`[name="${name}"]`);
  return input ? input.closest(".field") : null;
}

function setError(name, msg) {
  const field = fieldOf(name);
  const errorEl = form?.querySelector(`[data-error-for="${name}"]`);

  if (field) field.classList.add("invalid");
  if (errorEl) errorEl.textContent = msg;
}

function clearError(name) {
  const field = fieldOf(name);
  const errorEl = form?.querySelector(`[data-error-for="${name}"]`);

  if (field) field.classList.remove("invalid");
  if (errorEl) errorEl.textContent = "";
}

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/* Checagem silenciosa (sem mexer na UI de erro), usada para só liberar
   a classe de conversão do PixelX quando o formulário estiver realmente válido. */
function isFormValid() {
  const nome = form.nome.value.trim();
  const email = form.email.value.trim();
  const tel = form.telefone.value.replace(/\D/g, "");
  const escolaridade = form.escolaridade.value;

  return nome.length >= 3 && isEmail(email) && tel.length >= 10 && !!escolaridade;
}

const PIXELX_CLASS = "gbcbxsmvgqsjeajougck";

function syncPixelClass() {
  const btn = document.getElementById("lead-submit");
  if (btn) btn.classList.toggle(PIXELX_CLASS, isFormValid());
}

if (form) {
  form.addEventListener("input", syncPixelClass);
  form.addEventListener("change", syncPixelClass);
  syncPixelClass();
}

function validate() {
  let ok = true;

  ["nome", "email", "telefone", "escolaridade"].forEach(clearError);

  const nome = form.nome.value.trim();
  const email = form.email.value.trim();
  const tel = form.telefone.value.replace(/\D/g, "");
  const escolaridade = form.escolaridade.value;

  if (nome.length < 3) {
    setError("nome", "Informe seu nome completo.");
    ok = false;
  }

  if (!isEmail(email)) {
    setError("email", "Informe um e-mail válido.");
    ok = false;
  }

  if (tel.length < 10) {
    setError("telefone", "Informe um telefone válido com DDD.");
    ok = false;
  }

  if (!escolaridade) {
    setError("escolaridade", "Selecione a escolaridade.");
    ok = false;
  }

  return ok;
}

/* ---------- Envio ---------- */
if (form) {
  const btn = document.getElementById("lead-submit");
  const success = document.getElementById("form-success");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validate()) return;

    btn.disabled = true;
    btn.textContent = "ENVIANDO...";

    const escolaridadeSelect = form.escolaridade;

    // Telefone limpo em formato E.164 (5581987654321)
    const telLimpo = "55" + form.telefone.value.replace(/\D/g, "");

    const payload = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      telefone: form.telefone.value.trim(),
      telefone_e164: telLimpo,
      escolaridade: escolaridadeSelect.options[escolaridadeSelect.selectedIndex].text,
      pagina_url: window.location.href,
      utm_source: new URLSearchParams(window.location.search).get("utm_source") || "",
      utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign") || ""
    };

    try {
      await fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload),
      });

      if (success) {
        form.querySelectorAll(".field, .note").forEach((el) => {
          el.style.display = "none";
        });

        btn.style.display = "none";
        success.hidden = false;
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      // Redirect com dados explícitos — não depende da captura automática do pixel
      const params = new URLSearchParams({
        text: WHATSAPP_MSG,
        name: form.nome.value.trim(),
        email: form.email.value.trim(),
        phone: telLimpo
      });

      setTimeout(() => {
        window.location.href = `${PIXELX_WHATSAPP_REDIRECT}?${params.toString()}`;
      }, 700);

    } catch (err) {
      console.error("[Form] Erro ao enviar:", err);

      setError("telefone", "Erro ao enviar. Tente novamente.");

      btn.disabled = false;
      btn.textContent = "QUERO GARANTIR MINHA VAGA";
    }
  });
}
