import { apiFetch, showToast, toggleLoading } from "./main.js";

const form = document.getElementById("loginForm");
const roleCards = form?.querySelectorAll("label.card");
const passwordGroup = document.querySelector("[data-password-field]");

roleCards?.forEach((card) => {
  const radio = card.querySelector('input[type="radio"]');
  const updateState = () => {
    roleCards.forEach((c) => {
      const cRadio = c.querySelector('input[type="radio"]');
      c.classList.toggle("active", cRadio.checked);
    });
    if (passwordGroup) {
      const selectedRole = form.role.value;
      passwordGroup.style.display = selectedRole === "admin" ? "flex" : "none";
      passwordGroup.querySelector("input").required = selectedRole === "admin";
    }
  };
  card.addEventListener("click", () => {
    radio.checked = true;
    updateState();
  });
  radio.addEventListener("change", updateState);
});

if (passwordGroup) {
  passwordGroup.style.display = form.role.value === "admin" ? "flex" : "none";
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector('button[type="submit"]');
  toggleLoading(submitButton, true);

  try {
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const { redirectTo, message } = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    showToast({ title: "Welcome back", message, type: "success" });
    setTimeout(() => {
      window.location.href = redirectTo;
    }, 600);
  } catch (error) {
    showToast({
      title: "Sign in failed",
      message: error.message,
      type: "error",
    });
  } finally {
    toggleLoading(submitButton, false);
  }
});
