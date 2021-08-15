$iframeUrl.addEventListener("keyup", function(event) {
  
  let code;
  if (event.key !== undefined) {
    code = event.key;
  } else if (event.keyIdentifier !== undefined) {
    code = event.keyIdentifier;
  } else if (event.keyCode !== undefined) {
    code = event.keyCode;
  }
  onKeyUp(code, event.target.value);
  
});

function onKeyUp(code, value){
  // Number 13 is the "Enter" key on the keyboard
  if(code === 13 || code === "Enter"){
    try{
      $iframeData.contentWindow.document.open();
      $iframeData.contentWindow.document.close();
    }catch{}
    $frameloader.style.display = "grid";
    $iframeData.src = value;
  }
  $resourceRedirect.href = value
  $download.href = value;
}