$( function() {
  "use strict"

  // Figure out how wide the window needs to be to fit the widest list(s) of terms
  let maxElSize = 0
  $( ".term-list" ).each( function() {
    maxElSize = Math.max( maxElSize, this.scrollWidth )
  })
  // Now we know maxElSize

  function reAssignClasses() {
    let windowSize = $( window ).width()

    if ( maxElSize > windowSize ) {
      $( ".term-list" ).each( function() {
        $( this ).addClass( "can-ca-form" )
        $( this ).removeClass( "capsules" )
      })
    } else {
      $( ".term-list" ).each( function() {
        $( this ).addClass( "capsules" )
        $( this ).removeClass( "can-ca-form" )
      })
    }
  }

  // Call the function immediately
  reAssignClasses()

// Call the function on window resize
// Use setTimeout to "debounce" window resizing
  let resizeTimer

  $( window ).resize( function() {
    clearTimeout( resizeTimer );
    resizeTimer = setTimeout( function() {
      reAssignClasses()
    }, 250);
  })

})