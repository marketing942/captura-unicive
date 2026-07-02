/* =========================================================
   UniCV Caruaru — Pré-venda
   Carrossel + Formulário → Google Sheets (Apps Script)
   + redirect automático para o WhatsApp
   ========================================================= */

/* ⚠️ CONFIGURE ANTES DE PUBLICAR ------------------------------------------
   1) SHEET_URL  → URL do Web App do Google Apps Script
      (no editor do Apps Script: Implantar → Nova implantação → App da Web,
       "Quem pode acessar: Qualquer pessoa"; copie a URL terminada em /exec)
   2) WHATSAPP_NUM → número de atendimento, só dígitos, com DDI 55
-------------------------------------------------------------------------- */
const SHEET_URL    = "https://script.google.com/macros/s/AKfycbxdFplWVSfhTjvyIA7HIWb645xRjGNhBVhTdTf5UMjo0lSpW_A_jCuys0qB4uImKXPQ/exec";
const WHATSAPP_NUM = "5581992640766";
const WHATSAPP_MSG = "Quero saber mais sobre o superior EAD!";
const REDIRECT_SEG = 3; // segundos antes de abrir o WhatsApp

/* O carrossel é HTML estático no index.html (carrega cedo, sem depender deste JS).
   PixelX: a captura do lead é feita automaticamente pelo Super Pixel via a classe
   "gbcbxsmvgqsjeajougck" no botão de envio (evento Contact). Os campos são lidos
   pelos atributos name/id (nome, email, telefone). Não requer código aqui. */

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
  return form.querySelector(`[name="${name}"]`).closest(".field");
}
function setError(name, msg) {
  fieldOf(name).classList.add("invalid");
  form.querySelector(`[data-error-for="${name}"]`).textContent = msg;
}
function clearError(name) {
  fieldOf(name).classList.remove("invalid");
  form.querySelector(`[data-error-for="${name}"]`).textContent = "";
}
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function validate() {
  let ok = true;
  ["nome", "email", "telefone", "escolaridade"].forEach(clearError);

  const nome = form.nome.value.trim();
  const email = form.email.value.trim();
  const tel = form.telefone.value.replace(/\D/g, "");
  const esc = form.escolaridade.value;

  if (nome.length < 3) { setError("nome", "Informe seu nome completo."); ok = false; }
  if (!isEmail(email)) { setError("email", "Informe um e-mail válido."); ok = false; }
  if (tel.length < 10) { setError("telefone", "Informe um telefone válido com DDD."); ok = false; }
  if (!esc) { setError("escolaridade", "Selecione a escolaridade."); ok = false; }

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

    const escSelect = form.escolaridade;
    const payload = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      telefone: form.telefone.value.trim(),
      // grava o texto legível ("Primeira graduação" / "Já tenho graduação...")
      escolaridade: escSelect.options[escSelect.selectedIndex].text,
    };

    try {
      await fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors", // Apps Script não envia cabeçalhos CORS; resposta é opaca
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Evento de conversão do Meta Pixel
      if (typeof fbq !== "undefined") {
        fbq("track", "Lead", { content_name: "Pre-venda UniCV Caruaru" });
      }

      // Estado de sucesso: oculta o formulário e mostra a confirmação
      form.querySelectorAll(".field, .note").forEach((el) => (el.style.display = "none"));
      btn.style.display = "none";
      success.hidden = false;
      success.scrollIntoView({ behavior: "smooth", block: "center" });

      const msg = encodeURIComponent(
  "Olá, acabei de me cadastrar!"
);

// Redireciona na mesma aba (sem popup)
window.location.href =
  `https://wa.me/${WHATSAPP_NUM}?text=${msg}`;
       
    } catch (err) {
      setError("telefone", "Erro ao enviar. Tente novamente.");
      btn.disabled = false;
      btn.textContent = "QUERO GARANTIR MINHA VAGA";
    }
  });
}
