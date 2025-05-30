const alert_text = "You've clicked a link that brings you out of the mockup.";

function add_alert() {
  const breadcrumbItems = document.querySelectorAll(".breadcrumb li");

  for (let i = 0; i < Math.min(3, breadcrumbItems.length); i++) {
    breadcrumbItems[i].classList.add("wrong-way");
  }
  document.querySelectorAll(".wrong-way").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault(); // Prevent default link navigation/scroll
      alert(alert_text); // Show the alert
    });
  });
}
