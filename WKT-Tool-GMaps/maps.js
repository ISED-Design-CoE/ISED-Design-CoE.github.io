// TODOs:
// - Google's search
// - Show Area
//    - Show message based on area
// - Fix button location
// - show scale
// - remove street view

function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 63.272, lng: -100.581 },
    zoom: 4,
  });
  const drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: null,
    drawingControl: false,
    polygonOptions: {
      editable: true,
      fillColor: '#bf00ff',
      fillOpacity: 0.65
    },
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        google.maps.drawing.OverlayType.POLYGON,

      ],
    },
  });

  drawingManager.setMap(map);

  var removeControlDiv = document.createElement('div');
  var removeControl = new RemoveControl(removeControlDiv);

  var drawControlDiv = document.createElement('div');
  var drawControl = new DrawControl(drawControlDiv);
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(drawControlDiv);

  var areaControlDiv = document.createElement('div');
  var areaControl = new AreaControl(areaControlDiv);
  map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(areaControlDiv);


  var poly;

  // ON DRAW

  google.maps.event.addListener(drawingManager, "polygoncomplete", function (polygon) {
    poly = polygon
    google.maps.event.addListener(polygon, 'click', function (mev) {
      if (mev.vertex != null) {
        polygon.getPath().removeAt(mev.vertex);
      }
    });

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
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(removeControlDiv);
    document.getElementById("WKT").value = wkt;
    document.getElementById ( "wkt-output" ).removeAttribute("hidden");

    document.getElementById("area").innerHTML = "<b>Area Size</b>: "+ ((google.maps.geometry.spherical.computeArea(polygon.getPath())/1000000).toFixed(3)) + " km<sup>2</sup>"
  });





// BUTTONS

  function RemoveControl(controlDiv) {
    var controlUI = document.createElement('div');
    controlUI.title = 'Remove polygon';

    controlUI.style.backgroundImage = 'url(images/delete.svg)'
    controlUI.style.backgroundColor = 'white';
    controlUI.style.backgroundPosition = '40%';
    controlUI.style.width = '6em'
    controlUI.style.height = '6em'
    controlUI.style.backgroundSize = '95%'
    controlUI.style.backgroundRepeat= "no-repeat";
    controlUI.style.borderRadius= "2px";
    controlUI.style.border= "3px solid rgba(0,0,0,0.2)"
    controlUI.style.margin = "10px"
    controlDiv.appendChild(controlUI);

    google.maps.event.addDomListener(controlUI, 'click', function () {
      poly.setMap(null);
      map.controls[google.maps.ControlPosition.TOP_CENTER].pop()
      map.controls[google.maps.ControlPosition.TOP_CENTER].push(drawControlDiv);
      document.getElementById ( "wkt-output" ).setAttribute("hidden",'true');

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
    controlUI.style.backgroundRepeat= "no-repeat";
    controlUI.style.borderRadius= "2px";
    controlUI.style.border= "3px solid rgba(0,0,0,0.2)"
    controlUI.style.margin = "10px"
    controlUI.style.boxShadow = "0 0 0 2pt black;"
    controlDiv.appendChild(controlUI);

    google.maps.event.addDomListener(controlUI, 'click', function () {
      drawingManager.setOptions({drawingMode:google.maps.drawing.OverlayType.POLYGON})
      map.controls[google.maps.ControlPosition.TOP_CENTER].pop()
    });

  }

  // AREA

  function AreaControl(controlDiv) {
    var controlUI = document.createElement('div');
    controlUI.title = 'Area size';

    controlUI.style.backgroundColor = 'white';
    controlUI.style.borderRadius= "4px";
    controlUI.style.border= "2px solid rgba(0,0,0,0.2)"
    controlUI.style.margin = "10px"
    controlUI.style.padding = "8px"
    controlUI.id = "area"
    controlUI.innerHTML = '<b>Area Size: </b>'

    controlDiv.appendChild(controlUI);

  }



}
window.initMap = initMap;


