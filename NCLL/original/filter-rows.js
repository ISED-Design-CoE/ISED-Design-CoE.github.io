const urlParams = new URLSearchParams (window.location.search)
const filter = urlParams.get("filter");
if (filter != null) {
	console.log(filter);
	const rows = document.querySelectorAll('.data_row');
	rows.forEach(row => {
	if (!row.classList.contains(filter)) {
		row.style.display = "none";
	}
				})
			}