// look into google search
// remove feature 
// prevent multiple polygons
// 

function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 63.272, lng: -100.581 },
    zoom: 4,
  });
  const drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: true,
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

  removeControlDiv.index = 1;
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(removeControlDiv);

  google.maps.event.addListener(drawingManager, "polygoncomplete", function (polygon) {
    google.maps.event.addListener(polygon, 'click', function (mev) {
      if (mev.vertex != null) {
        polygon.getPath().removeAt(mev.vertex);
      }
    });

    let wkt = "POLYGON(("
    for (const elem of polygon.getPath().getArray()) {
      wkt += elem.lng() + " "
      wkt += elem.lat() + ","
    }
    wkt = wkt.substring(0, wkt.length - 1)
    wkt += "))"
    console.log(wkt)
    drawingManager.setOptions({
      drawingMode: null,
      drawingControl: false,
    });
  });

  function RemoveControl(controlDiv) {
    var controlUI = document.createElement('div');
    controlUI.title = 'Remove polygon';

    controlUI.style.backgroundImage = 'url(images/delete.svg)'
    controlUI.style.backgroundColor = 'white';
    controlUI.style.backgroundPosition = '40%';
    controlUI.style.width = '5em'
    controlUI.style.height = '5em'
    controlUI.style.backgroundSize = '100%'
    controlDiv.appendChild(controlUI);

    google.maps.event.addDomListener(controlUI, 'click', function () {
      console.log('remove poly')
    });

  }
}
window.initMap = initMap;


