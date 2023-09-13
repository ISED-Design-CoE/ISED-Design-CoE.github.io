var currentStatus = []

function filterTable() {
	status_set = new Set(currentStatus)
	const rows = document.querySelectorAll('.data_row');
	rows.forEach(row => {
		if (currentStatus.length == 0) {
			row.removeAttribute('hidden')
		} else {
			match = false;
			row.className.split(' ').forEach(row_status => {
				if (status_set.has(row_status)){
					row.removeAttribute('hidden')
					match = true
				}
				
			})
			if (!match) {
				row.setAttribute('hidden','hidden')
			}
		}
	})
}

$( document ).on( "wb-ready.wb", function( event ) {
	const urlParams = new URLSearchParams (window.location.search)
	const filter = urlParams.get("filter");
	if (filter != null) {
		currentStatus.push(filter)
		filterTable()
		console.log(filter+"_checkbox")
		console.log(document.getElementById(filter+"_checkbox"))
		document.getElementById(filter+"_checkbox").setAttribute('checked','checked')
	}
});


function toggleStatus(status) {
	if (currentStatus.indexOf(status) === -1 ) {
		currentStatus.push(status)
	} else {
		currentStatus.splice(currentStatus.indexOf(status),1)
	}
	console.log(currentStatus)
}