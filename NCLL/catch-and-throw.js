function createHiddenField ( fieldName, fieldValue ) {
  let inputField = document.createElement ( "input" )
  inputField.setAttribute( "type", "hidden" )
  inputField.setAttribute( "name", fieldName )
  inputField.setAttribute( "id", fieldName )
  inputField.setAttribute( "value", fieldValue )

  // Append to form
  document .forms [0] .appendChild ( inputField )
  return inputField
}

const queryString = window.location.search
const urlParams = new URLSearchParams ( queryString )


for ( const [ key, value ] of urlParams ) {

  previous_buttons = document.querySelectorAll("input[name="+key+"]");

  previous_buttons.forEach(button => {
    if (button != null) {
      if (button.value == value) {
        button.checked = true;
      }
    } 
  })
  
  previous_element = document.getElementById(key);
  if (previous_element != null) {
    previous_element.value= value;
  } else {
      // Create hidden input field (which will be thrown forward to the next screen because GET)
    if (document.querySelectorAll("input[name="+key+"]").length == 0) {
      createHiddenField ( key, value )
    }
}
  }

