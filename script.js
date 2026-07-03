/* =========================================================
   UniCV Caruaru — Pré-venda
   Formulário → Google Sheets + redirect WhatsApp
   ========================================================= */

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxdFplWVSfhTjvyIA7HIWb645xRjGNhBVhTdTf5UMjo0lSpW_A_jCuys0qB4uImKXPQ/exec?aba=UNICIVE";
const WHATSAPP_NUM = "5581992640766";
const WHATSAPP_MSG = "Quero saber mais sobre o superior EAD!";

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

    const payload = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      telefone: form.telefone.value.trim(),
      escolaridade: escolaridadeSelect.options[escolaridadeSelect.selectedIndex].text,
      pagina_url: window.location.href,
      utm_source: new URLSearchParams(window.location.search).get("utm_source") || "",
      utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign") || ""
    };

    try {
      await fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (typeof fbq !== "undefined") {
        fbq("track", "Lead", {
          content_name: "Pre-venda UniCV Caruaru"
        });
      }

      if (success) {
        form.querySelectorAll(".field, .note").forEach((el) => {
          el.style.display = "none";
        });

        btn.style.display = "none";
        success.hidden = false;
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      const msg = encodeURIComponent(WHATSAPP_MSG);

      window.location.href = `https://wa.me/${WHATSAPP_NUM}?text=${msg}`;

    } catch (err) {
      setError("telefone", "Erro ao enviar. Tente novamente.");

      btn.disabled = false;
      btn.textContent = "QUERO GARANTIR MINHA VAGA";
    }
  });
}
