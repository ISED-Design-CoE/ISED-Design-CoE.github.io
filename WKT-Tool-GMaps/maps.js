// TODOs:
// - Google's search
// - Show Area X
//    - Show message based on area X
// - Fix button location
// - show scale X
// - remove street view
// errors when more than 13 points

let polygon;

let ignore_drawing = false;

let warnings = {
  medium: "<p>The area is between 75 km<sup>2</sup> and 165 km<sup>2</sup>. It can only be used with <b>medium power</b>.</sup></p>",
  low: "<p>The area is between 0 km<sup>2</sup> and 15 km<sup>2</sup>. It can only be used with <b>low power</b>.</sup></p>",
  large: "<p>The area is too large. Please reduce the size of the polygon to be less than 165km<sup>2</sup></p>",
  between: "<p>The area is between 15 km<sup>2</sup> and 75 km<sup>2</sup>. Please reduce or increase your area size beyond these limits.</p>",
  morethantwelve: "<p>The "
}

function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 63.272, lng: -100.581 },
    zoom: 4,
    scaleControl: true,
  });
  const drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: null,
    drawingControl: false,
    polygonOptions: {
      editable: true,
      fillColor: '#33cc33',
      fillOpacity: 0.65
    },
    drawingControlOptions: {
      position: google.maps.ControlPosition.LEFT_TOP,
      drawingModes: [
        google.maps.drawing.OverlayType.POLYGON,

      ],
    },
  });

  drawingManager.setMap(map);

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
    if (ignore_drawing) {
      ignore_drawing = false;
      polygon.setMap(null);
      return;
    }

    while (polygon.getPath().getLength() > 12) {
      polygon.getPath().pop();
    }

    google.maps.event.addListener(polygon, 'click', function (mev) {
      if (mev.vertex != null) {
        polygon.getPath().removeAt(mev.vertex);
      }
    });


    // WKT
    let wkt = "POLYGON(("
    for (const elem of polygon.getPath().getArray()) {
      wkt += elem.lng().toFixed(6) + " "
      wkt += elem.lat().toFixed(6) + ","
    }
    wkt = wkt.substring(0, wkt.length - 1)
    wkt += "))"
    console.log(wkt)


    drawingManager.setOptions({
      drawingMode: null,
      drawingControl: false,
    });
    map.controls[google.maps.ControlPosition.LEFT_TOP].pop()
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(removeControlDiv);
    document.getElementById("WKT").value = wkt;

    let area = (google.maps.geometry.spherical.computeArea(polygon.getPath()) / 1000000).toFixed(3)

    document.getElementById("area").innerHTML = "<b>Area size</b>: " + area + " km<sup>2</sup>"

    document.getElementById("size-alert").removeAttribute('hidden')
    if (area < 15) {
      document.getElementById("alert-text").innerHTML = warnings.low
      document.getElementById("size-alert").classList = "alert alert-info"
      document.getElementById("wkt-output").removeAttribute("hidden")
    } else if (area >= 15 && area <= 75) {
      document.getElementById("alert-text").innerHTML = warnings.between
      document.getElementById("size-alert").classList = "alert alert-danger"
      polygon.setOptions({
        fillColor: '#760000',
        fillOpacity: 0.65
      })
    } else if (area < 165) {
      document.getElementById("alert-text").innerHTML = warnings.medium
      document.getElementById("size-alert").classList = "alert alert-info"
      document.getElementById("wkt-output").removeAttribute("hidden")
    } else {
      document.getElementById("alert-text").innerHTML = warnings.large
      document.getElementById("size-alert").classList = "alert alert-danger"
      polygon.setOptions({
        fillColor: '#760000',
        fillOpacity: 0.65
      })
    }



    checkVertexAmount()
  });

  function checkVertexAmount() {
    google.maps.event.addListener(polygon.getPath(), "insert_at", function (index) {
      console.log('test')
      if (polygon.getPath().getLength() > 12) {
        polygon.getPath().removeAt(index)
      }
    })
  };



  // BUTTONS

  function DrawActiveControl(controlDiv) {
    var controlUI = document.createElement('div');
    controlUI.title = 'Remove polygon';

    controlUI.style.backgroundImage = 'url(images/draw.svg)'
    controlUI.style.backgroundColor = '#EBEBEB';
    controlUI.style.backgroundPosition = '50%';
    controlUI.style.width = '6em'
    controlUI.style.height = '6em'
    controlUI.style.backgroundSize = '80%'
    controlUI.style.backgroundRepeat = "no-repeat";
    controlUI.style.borderRadius = "2px";
    controlUI.style.border = "1px solid rgba(0,0,0,0.2)"
    controlUI.style.margin = "10px"
    controlUI.style.boxShadow = "rgba(0, 0, 0, 0.3) 0px 1px 4px -1px"
    controlDiv.appendChild(controlUI);

    google.maps.event.addDomListener(controlUI, 'click', function () {
      ignore_drawing = true
      drawingManager.setOptions({ drawingMode: null })
      map.controls[google.maps.ControlPosition.LEFT_TOP].pop()
      map.controls[google.maps.ControlPosition.LEFT_TOP].push(drawControlDiv);
      document.getElementById("wkt-output").setAttribute("hidden", 'true');
      

    });

  }

  function RemoveControl(controlDiv) {
    var controlUI = document.createElement('div');
    controlUI.title = 'Remove polygon';

    controlUI.style.backgroundImage = 'url(images/delete.svg)'
    controlUI.style.backgroundColor = 'white';
    controlUI.style.backgroundPosition = '40%';
    controlUI.style.width = '6em'
    controlUI.style.height = '6em'
    controlUI.style.backgroundSize = '95%'
    controlUI.style.backgroundRepeat = "no-repeat";
    controlUI.style.borderRadius = "2px";
    controlUI.style.border = "1px solid rgba(0,0,0,0.2)"
    controlUI.style.margin = "10px"
    controlUI.style.boxShadow = "rgba(0, 0, 0, 0.3) 0px 1px 4px -1px"
    controlDiv.appendChild(controlUI);

    google.maps.event.addDomListener(controlUI, 'click', function () {
      polygon.setMap(null);
      map.controls[google.maps.ControlPosition.LEFT_TOP].pop()
      map.controls[google.maps.ControlPosition.LEFT_TOP].push(drawControlDiv);
      document.getElementById("wkt-output").setAttribute("hidden", 'true');

    });

  }

  function DrawControl(controlDiv) {
    var controlUI = document.createElement('div');
    controlUI.title = 'Draw polygon';

    controlUI.style.backgroundImage = 'url(images/draw.svg)'
    controlUI.style.backgroundColor = 'white';
    controlUI.style.backgroundPosition = '50%';
    controlUI.style.width = '6em'
    controlUI.style.height = '6em'
    controlUI.style.backgroundSize = '80%'
    controlUI.style.backgroundRepeat = "no-repeat";
    controlUI.style.borderRadius = "2px";
    controlUI.style.border = "1px solid rgba(0,0,0,0.2)"
    controlUI.style.margin = "10px"
    controlUI.style.boxShadow = "rgba(0, 0, 0, 0.3) 0px 1px 4px -1px"
    controlUI.style.cursor = "pointer"
    controlDiv.appendChild(controlUI);

    google.maps.event.addDomListener(controlUI, 'click', function () {
      drawingManager.setOptions({ drawingMode: google.maps.drawing.OverlayType.POLYGON })
      map.controls[google.maps.ControlPosition.LEFT_TOP].pop()
      map.controls[google.maps.ControlPosition.LEFT_TOP].push(drawactiveControlDiv);
    });

  }

  // AREA

  function AreaControl(controlDiv) {
    var controlUI = document.createElement('div');
    controlUI.title = 'Area size';

    controlUI.style.backgroundColor = 'white';
    controlUI.style.borderRadius = "4px";
    controlUI.style.border = "2px solid rgba(0,0,0,0.2)"
    controlUI.style.margin = "10px"
    controlUI.style.padding = "8px"
    controlUI.id = "area"
    controlUI.innerHTML = '<b>Area size: </b>'

    controlDiv.appendChild(controlUI);

  }



}
window.initMap = initMap;


