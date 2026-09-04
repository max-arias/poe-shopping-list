import "./modulepreload-polyfill-B5Qt9EMX.js";
document.querySelectorAll(".panel-tools button").forEach((e) => {
  e.addEventListener("click", () => {
    const l = e.closest(".panel");
    l &&
      (e.textContent?.includes("Collapse")
        ? l.querySelectorAll(".list-entry").forEach((t) => {
            t.open = !1;
          })
        : l.querySelectorAll(".list-entry").forEach((t) => {
            t.open = !0;
          }));
  });
});
