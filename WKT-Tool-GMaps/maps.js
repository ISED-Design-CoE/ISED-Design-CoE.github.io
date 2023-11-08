// TODOs:
// - Google's search (impossible with current key)
// - remove street view (may be dependent on url for website, or key)

let polygon;

let ignore_drawing = false;

let warnings = {
  medium: "<p>The area is between 75 km<sup>2</sup> and 165 km<sup>2</sup>. It can only be used with <b>medium power</b>.</sup></p>",
  low: "<p>The area is between 0 km<sup>2</sup> and 15 km<sup>2</sup>. It can only be used with <b>low power</b>.</sup></p>",
  large: "<p>The area is too large. Please reduce the size of the polygon to be less than 165km<sup>2</sup></p>",
  between: "<p>The area is between 15 km<sup>2</sup> and 75 km<sup>2</sup>. Please reduce or increase your area size beyond these limits.</p>",
  morethantwelve: "<p>The polygon drawn contains <b>more than twelve points</b>. Please redraw or remove points</p>"
}

let polygon_colour = {
  accepted: {
    fillColor: '#33cc33',
    fillOpacity: 0.65
  },
  notaccepted: {
    fillColor: '#760000',
    fillOpacity: 0.75
  }
}

function initMap() {

  // create map
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 63.272, lng: -100.581 },
    zoom: 4,
    scaleControl: true,
  });

  // create polygon drawing manager
  const drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: null,
    drawingControl: false,
    polygonOptions: {
      editable: true,
    },
    drawingControlOptions: {
      position: google.maps.ControlPosition.LEFT_TOP,
      drawingModes: [
        google.maps.drawing.OverlayType.POLYGON,

      ],
    },
  });

  drawingManager.setMap(map);

  // create the custom elements on the map
  var removeControlDiv = document.createElement('div');
  var removeControl = new RemoveControl(removeControlDiv);

  var drawactiveControlDiv = document.createElement('div');
  var drawactiveControl = new DrawActiveControl(drawactiveControlDiv);

  var drawControlDiv = document.createElement('div');
  var drawControl = new DrawControl(drawControlDiv);
  map.controls[google.maps.ControlPosition.LEFT_TOP].push(drawControlDiv);


  var areaControlDiv = document.createElement('div');
  var areaControl = new AreaControl(areaControlDiv);
  map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(areaControlDiv);


  // ON DRAW
  google.maps.event.addListener(drawingManager, "polygoncomplete", function (event) {

    polygon = event

    // If the user stops the draw mode, don't add the current polygon, remove it instead.
    if (ignore_drawing) {
      ignore_drawing = false;
      polygon.setMap(null);
      return;
    }

    // when the user clicks on a vertex, remove it if there are at least 3 other verticies.
    google.maps.event.addListener(polygon, 'click', function (mev) {
      if (mev.vertex != null) {
        if (polygon.getPath().getLength() > 3) {
          polygon.getPath().removeAt(mev.vertex);
          updateArea()
        }
      }
    });


    

    // remove the draw button and add the remove button. Set the drawingMode to edit 
    drawingManager.setOptions({
      drawingMode: null,
      drawingControl: false,
    });
    map.controls[google.maps.ControlPosition.LEFT_TOP].pop()
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(removeControlDiv);
    

    updateArea()
    onAddVertex()
    onMoveVertex()
  });


  // When a vertex gets added, change the area and WKT
  function onAddVertex() {
    google.maps.event.addListener(polygon.getPath(), "insert_at", function (index) {
      updateArea()

      // this code prevents the users from adding a 13th point. It is a somewhat inelegent solution

      // if (polygon.getPath().getLength() > 12) {
      //   polygon.getPath().removeAt(index)
      // }
    })
  };

  // When a vertex is moved, change the area and WKT
  function onMoveVertex() {
    google.maps.event.addListener(polygon.getPath(), "set_at", function (index) {
      updateArea()
    })
  };


  // Whenever this function is called, show the right alert and potentially show the WKT output
  function updateArea() {
    let area = (google.maps.geometry.spherical.computeArea(polygon.getPath()) / 1000000).toFixed(3)

    document.getElementById("area").innerHTML = "<b>Area size</b>: " + area + " km<sup>2</sup>"

    document.getElementById("size-alert").removeAttribute('hidden')

    if (polygon.getPath().getLength() > 12){
      document.getElementById("alert-text").innerHTML = warnings.morethantwelve
      document.getElementById("size-alert").classList = "alert alert-danger"
      document.getElementById("wkt-output").setAttribute("hidden", "true")
      polygon.setOptions(polygon_colour.notaccepted)
    } else if (area < 15) {
      document.getElementById("alert-text").innerHTML = warnings.low
      document.getElementById("size-alert").classList = "alert alert-info"
      document.getElementById("wkt-output").removeAttribute("hidden")
      polygon.setOptions(polygon.setOptions(polygon_colour.accepted))
    } else if (area >= 15 && area <= 75) {
      document.getElementById("alert-text").innerHTML = warnings.between
      document.getElementById("size-alert").classList = "alert alert-danger"
      document.getElementById("wkt-output").setAttribute("hidden", "true")
      polygon.setOptions(polygon.setOptions(polygon_colour.notaccepted))
    } else if (area < 165) {
      document.getElementById("alert-text").innerHTML = warnings.medium
      document.getElementById("size-alert").classList = "alert alert-info"
      document.getElementById("wkt-output").removeAttribute("hidden")
      polygon.setOptions(polygon.setOptions(polygon_colour.accepted))
    } else {
      document.getElementById("alert-text").innerHTML = warnings.large
      document.getElementById("size-alert").classList = "alert alert-danger"
      document.getElementById("wkt-output").setAttribute("hidden", "true")
      polygon.setOptions(polygon.setOptions(polygon_colour.notaccepted))
    }

    // WKT
    let wkt = "POLYGON(("
    for (const elem of polygon.getPath().getArray()) {
      wkt += elem.lng().toFixed(6) + " "
      wkt += elem.lat().toFixed(6) + ","
    }
    wkt = wkt.substring(0, wkt.length - 1)
    wkt += "))"
    document.getElementById("WKT").value = wkt;
  }

  // Delete polygon when the button is pressed

  function resetPolygon() {
    drawingManager.setOptions({ drawingMode: null })
    map.controls[google.maps.ControlPosition.LEFT_TOP].pop()
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(drawControlDiv);
    document.getElementById("wkt-output").setAttribute("hidden", 'true');
    document.getElementById("size-alert").setAttribute("hidden", "true");
    document.getElementById("area").innerHTML = "<b>Area size</b>:";
  }

  // MAP UI ELEMENTS

  // Draw is Active Button
  function DrawActiveControl(controlDiv) {
    var controlUI = document.createElement('div');
    controlUI.title = 'Remove polygon';
    controlUI.classList = 'draw-active-button'
    controlDiv.appendChild(controlUI);

    google.maps.event.addDomListener(controlUI, 'click', function () {
      ignore_drawing = true
      resetPolygon()
    });

  }

  // Remove Polygon Button
  function RemoveControl(controlDiv) {
    var controlUI = document.createElement('div');
    controlUI.title = 'Remove polygon';
    controlUI.classList = 'remove-button'
    
    controlDiv.appendChild(controlUI);

    google.maps.event.addDomListener(controlUI, 'click', function () {
      polygon.setMap(null);
      resetPolygon()
    });
  }

  // Draw Polygon Button
  function DrawControl(controlDiv) {
    var controlUI = document.createElement('div');
    controlUI.title = 'Draw polygon';
    controlUI.classList = 'draw-button'
    
    controlDiv.appendChild(controlUI);

    google.maps.event.addDomListener(controlUI, 'click', function () {
      drawingManager.setOptions({ drawingMode: google.maps.drawing.OverlayType.POLYGON })
      map.controls[google.maps.ControlPosition.LEFT_TOP].pop()
      map.controls[google.maps.ControlPosition.LEFT_TOP].push(drawactiveControlDiv);
    });

  }

  // Area Textbox
  function AreaControl(controlDiv) {
    var controlUI = document.createElement('div');
    controlUI.title = 'Area size';
    controlUI.classList='area-textbox'
    controlUI.id = "area"
    controlUI.innerHTML = '<b>Area size: </b>'

    controlDiv.appendChild(controlUI);

  }



}
window.initMap = initMap;


