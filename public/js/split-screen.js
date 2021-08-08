// A function is used for dragging and moving
function dragElement(element) {
  var md; // remember mouse down info
  element.onmousedown = onMouseDown;

  function onMouseDown(e) {
    md = {
      e,
      offsetLeft: element.offsetLeft,
      offsetTop: element.offsetTop,
      resourcesContainerWidth: $resourcesContainer.offsetWidth,
      dataContainerWidth: $dataContainer.offsetWidth,
    };

    $resourcesContainer.style.pointerEvents = "none";
    $dataContainer.style.pointerEvents = "none";
    document.onmousemove = onMouseMove;
    document.onmouseup = () => {
      $resourcesContainer.style.pointerEvents = "all";
      $dataContainer.style.pointerEvents = "all";
      document.onmousemove = document.onmouseup = null; // clears drag event
    }
  }

  function onMouseMove(e) {
    var delta = {
      x: e.clientX - md.e.clientX,
      y: e.clientY - md.e.clientY
    };

    // Prevent negative-sized elements
    const deltaX = Math.min(Math.max(delta.x, -md.resourcesContainerWidth), md.dataContainerWidth);
    let dataContainerWidth = md.dataContainerWidth - deltaX;
    let dataContainerMinWidth = (md.dataContainerWidth/100)*35;
    
    if(dataContainerWidth < dataContainerMinWidth) {
      $dataContainer.style.display = "none"
    }else{
      $dataContainer.style.display = "block"
    }

    delta.x = Math.min(Math.max(delta.x, -md.resourcesContainerWidth), md.dataContainerWidth);
    element.style.left = md.offsetLeft + delta.x + "px";
    $dataContainer.style.width = dataContainerWidth + "px";
  }
}


dragElement(document.getElementById("separator"));
