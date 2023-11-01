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
      position: google.maps.ControlPosition.TOP_LEFT,
      drawingModes: [
        google.maps.drawing.OverlayType.POLYGON,

      ],
    },
  });

  drawingManager.setMap(map);

  google.maps.event.addListener(drawingManager, "polygoncomplete", function (polygon) {
    let wkt = "POLYGON(("
    for (const elem of polygon.getPath().getArray()) {
      wkt += elem.lng() + " "
      wkt += elem.lat() + ","
    }
    wkt = wkt.substring(0, wkt.length - 1)
    wkt += "))"
    console.log(wkt)
    // drawingManager.setOptions({
    //   drawingControl: false
    // });
  });

  var poly;

  var deleteNode = function(mev) {
    if (mev.vertex != null) {
      poly.getPath().removeAt(mev.vertex);
    }
  }

  google.maps.event.addListener(drawingManager, "polygoncomplete", function (polygon) {
    poly = polygon
    google.maps.event.addListener(polygon, 'rightclick', deleteNode);
    let wkt = "POLYGON(("
    for (const elem of polygon.getPath().getArray()) {
      wkt += elem.lng() + " "
      wkt += elem.lat() + ","
    }
    wkt = wkt.substring(0, wkt.length - 1)
    wkt += "))"
    console.log(wkt)

  });

  
 
}



window.initMap = initMap;
