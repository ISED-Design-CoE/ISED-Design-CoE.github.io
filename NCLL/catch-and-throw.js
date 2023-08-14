const queryString = window.location.search
const urlParams = new URLSearchParams ( queryString )

for ( var parmName of urlParams ) {
    console.log ( parmName, urlParams [ parmName ] )
    
  // Remove existing namespace prefix
    let fieldName = parmName.replace ( /^CAT_/, '' )

  // Add new namespace prefix
    fieldName = "CAT_" + fieldName

  // Create hidden input field (which will be thrown forward to the next screen because GET)
    let inputField = document.createElement ( "input" )
    inputField.setAttribute( "type", "hidden" )
    inputField.setAttribute( "name", fieldName )
    inputField.setAttribute( "value", urlParams [ parmName ] )

  // Append to form
    document .forms [0] .appendChild ( inputField )
}
