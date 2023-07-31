$( function() {
  "use strict"

  // Fix Chrome bug with step navigation
  $( ".gc-navseq>li button" ).addClass( "chromehack" )
  $( ".gc-navseq>li>a" ).addClass( "chromehack" )

  // Set up step navigation accordion
  var groups = [
    "step-1-01",
    "step-2-01 step-2-02",
    "step-3-01 step-3-02 step-3-03 step-3-04 step-3-05 step-3-06 step-3-07 step-3-08 step-3-09 step-3-10 step-3-11 step-3-12 step-3-13",
    "step-4-01 step-4-02",
    "step-5-01 step-5-02 step-5-03",
    "step-6-01",
    "step-7-01"
  ]
  var numGroups = 7

  $( ".group button" ).each( function() {
    // Locate the space-separated list for aria-controls
    let groupNum = $( this ).attr( "data-controls" )
                            .split( "-" )[1]
    let group = groups[ groupNum - 1 ]

    // Apply ARIA
    $( this ).attr( "aria-expanded", "true" )
             .attr( "aria-controls", group )

    // Set up listeners
    let steps = group.split(" ")
    $( this ).click( function() {
      if( $( this ).hasClass( "open" ) ) {
        $( this ).removeClass( "open" )
                 .attr( "aria-expanded", "false" )
        $( steps ).each( function() {
          $( "#"+this ).hide()
        })
        if ( groupNum == numGroups ) {
          $( this ).closest( ".group" )
                   .addClass( "hide-border" )
        }
      } else {
        $( this ).addClass( "open" )
                 .attr( "aria-expanded", "true" )
        $( steps ).each( function() {
          $( "#"+this ).show()
        })
        if ( groupNum == numGroups ) {
          $( this ).closest( ".group" )
                   .removeClass( "hide-border" )
        }
      }
    })
  })

  $( ".accordion-icon" ).removeClass( "hidden" )

})