/* =========================================================
   UniCV Caruaru — Pré-venda
   Formulário → Google Sheets → redirect WhatsApp
   ========================================================= */

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxdFplWVSfhTjvyIA7HIWb645xRjGNhBVhTdTf5UMjo0lSpW_A_jCuys0qB4uImKXPQ/exec?aba=UNICIVE";

const PIXELX_WHATSAPP_REDIRECT = "https://pxa.cppem.com.br/lt/unicive-whatsapp-redirect";
const WHATSAPP_MSG = "Quero saber mais sobre o superior EAD!";

/* ---------- Popup do formulário ---------- */
const formModal = document.getElementById("form-modal");
const openFormTriggers = document.querySelectorAll("#open-form-btn, .js-open-form");
const closeFormBtn = document.getElementById("close-form-btn");

// Redirect ativo — pode ser sobrescrito pelo gatilho (ex.: cards de curso → grupos)
let activeRedirect = PIXELX_WHATSAPP_REDIRECT;

async function openFormModal(trigger) {
  if (!formModal) return;
  activeRedirect =
    (trigger && trigger.dataset && trigger.dataset.redirect) || PIXELX_WHATSAPP_REDIRECT;
  formModal.hidden = false;
  document.body.classList.add("modal-open");

  // PixelX: carrega/aplica a máscara de telefone ao abrir o popup
  try {
    if (window.pixel_x_app && typeof window.pixel_x_app.mask_load === "function") {
      await window.pixel_x_app.mask_load();
    }
  } catch (err) {
    console.warn("[PixelX] mask_load falhou:", err);
  }
}

function closeFormModal() {
  if (!formModal) return;
  formModal.hidden = true;
  document.body.classList.remove("modal-open");
}

openFormTriggers.forEach((el) => {
  el.addEventListener("click", () => openFormModal(el));
  // Suporte a teclado para gatilhos que não são <button> (ex.: cards de curso)
  if (el.tagName !== "BUTTON") {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openFormModal(el);
      }
    });
  }
});
if (closeFormBtn) closeFormBtn.addEventListener("click", closeFormModal);

if (formModal) {
  formModal.addEventListener("click", (e) => {
    if (e.target === formModal) closeFormModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && formModal && !formModal.hidden) closeFormModal();
});

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

function validate() {
  let ok = true;

  ["name", "email", "phone", "escolaridade"].forEach(clearError);

  const nome = document.getElementById("lead_name").value.trim();
  const email = document.getElementById("lead_email").value.trim();
  const tel = document.getElementById("lead_phone").value.replace(/\D/g, "");
  const escolaridade = document.getElementById("escolaridade").value;

  if (nome.length < 3) {
    setError("name", "Informe seu nome completo.");
    ok = false;
  }

  if (!isEmail(email)) {
    setError("email", "Informe um e-mail válido.");
    ok = false;
  }

  if (tel.length < 10) {
    setError("phone", "Informe um telefone válido com DDD.");
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
  const btn = document.getElementById("BfDnaaTxKjfyDfufDkvR");
  const success = document.getElementById("form-success");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validate()) return;

    btn.disabled = true;
    btn.textContent = "ENVIANDO...";

    const escolaridadeSelect = document.getElementById("escolaridade");
    const nomeEl = document.getElementById("lead_name");
    const emailEl = document.getElementById("lead_email");
    const phoneEl = document.getElementById("lead_phone");

    // Telefone limpo em formato E.164 (5581987654321)
    const telLimpo = "55" + phoneEl.value.replace(/\D/g, "");

    const payload = {
      name: nomeEl.value.trim(),
      email: emailEl.value.trim(),
      phone: phoneEl.value.trim(),
      phone_e164: telLimpo,
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
        name: nomeEl.value.trim(),
        email: emailEl.value.trim(),
        phone: telLimpo
      });

      setTimeout(() => {
        window.location.href = `${activeRedirect}?${params.toString()}`;
      }, 700);

    } catch (err) {
      console.error("[Form] Erro ao enviar:", err);

      setError("phone", "Erro ao enviar. Tente novamente.");

      btn.disabled = false;
      btn.textContent = "QUERO GARANTIR MINHA VAGA";
    }
  });
}
