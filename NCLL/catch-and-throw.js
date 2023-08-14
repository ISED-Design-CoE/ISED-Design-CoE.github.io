const queryString = window.location.search
const urlParams = new URLSearchParams ( queryString )

for ( const [ key, value ] of urlParams ) {
    
  // Remove existing namespace prefix
    let fieldName = key.replace ( /^CAT_/, '' )

  // Add new namespace prefix
    fieldName = "CAT_" + fieldName

  // Create hidden input field (which will be thrown forward to the next screen because GET)
    let inputField = document.createElement ( "input" )
    inputField.setAttribute( "type", "hidden" )
    inputField.setAttribute( "name", fieldName )
    inputField.setAttribute( "value", value )

  // Append to form
    document .forms [0] .appendChild ( inputField )
}
