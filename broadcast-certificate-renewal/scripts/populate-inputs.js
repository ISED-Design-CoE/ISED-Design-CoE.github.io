function populate_input(record_id) {
  console.log(window.location.pathname)
  fetch("/broadcast-certificate-renewal/data/data.json")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch filtered_output.json");
      return res.json();
    })
    .then((data) => {
      console.log(data);
      record = data[record_id];

      for (const [key, value] of Object.entries(record)) {
        if (document.getElementById(key) != null) {
          document.getElementById(key).innerHTML = value;
        }
        if (document.getElementsByName(key)[0] != null) {
          document.getElementsByName(key)[0].value = value;
        }
      }
      if (document.getElementById("contact-info") != null) {
        document.getElementById("contact-info").removeAttribute("hidden");
      }
    });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("record-form") != null) {
    document
      .getElementById("record-form")
      .addEventListener("submit", function (event) {
        event.preventDefault(); // Stop the page from reloading
        const formData = new FormData(this); // 'this' refers to the form element
        console.log(document.getElementsByName("record")[0].value);
        populate_input(document.getElementsByName("record")[0].value);
        if (document.getElementById("main-form") != null) {
          document.getElementById("main-form").setAttribute("hidden", true);
        }
      });
  }

  if (document.getElementById("select-record") != null) {
    console.log("test!");
    document
      .getElementById("select-record")
      .addEventListener("gcdsChange", (event) => {
        console.log("changed??");
        document.getElementById("contact-info").setAttribute("hidden", true);
        document.getElementById("main-form").setAttribute("hidden", true);
      });
  }
});
