const alert_text = "You've clicked a link that brings you out of the mockup.";

function add_alert() {
  document.querySelectorAll(".wrong-way").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault(); // Prevent default link navigation/scroll
      alert(alert_text); // Show the alert
    });
  });
}
