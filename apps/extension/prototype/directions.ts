import "./directions.css";

document.querySelectorAll<HTMLButtonElement>(".panel-tools button").forEach((button) => {
  button.addEventListener("click", () => {
    const panel = button.closest(".panel");
    if (!panel) return;
    if (button.textContent?.includes("Collapse")) {
      panel.querySelectorAll<HTMLDetailsElement>(".list-entry").forEach((entry) => {
        entry.open = false;
      });
    } else {
      panel.querySelectorAll<HTMLDetailsElement>(".list-entry").forEach((entry) => {
        entry.open = true;
      });
    }
  });
});
