const queryString = window.location.search
const urlParams = new URLSearchParams ( queryString )

for ( const [ key, value ] of urlParams ) {
    
  // Create hidden input field (which will be thrown forward to the next screen because GET)
    let inputField = document.createElement ( "input" )
    inputField.setAttribute( "type", "hidden" )
    inputField.setAttribute( "name", key )
    inputField.setAttribute( "value", value )

  // Append to form
    document .forms [0] .appendChild ( inputField )
}