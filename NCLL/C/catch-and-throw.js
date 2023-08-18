function createHiddenField ( fieldName, fieldValue ) {
  let inputField = document.createElement ( "input" )
  inputField.setAttribute( "type", "hidden" )
  inputField.setAttribute( "name", fieldName )
  inputField.setAttribute( "value", fieldValue )

  // Append to form
  document .forms [0] .appendChild ( inputField )
  return inputField
}

const queryString = window.location.search
const urlParams = new URLSearchParams ( queryString )

for ( const [ key, value ] of urlParams ) {
    
  // Create hidden input field (which will be thrown forward to the next screen because GET)
  createHiddenField ( key, value )
}