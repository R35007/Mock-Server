
// Load Iframe on entering a url in the iframe search box
function setIframeSource(code, value) {
  // Number 13 is the "Enter" key on the keyboard
  if (code === 13 || code === "Enter") {
    try {
      $iframeData.contentWindow.document.open();
      $iframeData.contentWindow.document.close();
    } catch { }
    $frameLoader.style.display = "grid";
    $iframeData.src = value;
  }
  $resourceRedirect.href = value
  $download.href = value;
}

$iframeUrl.addEventListener("keyup", function (event) {
  let code;
  if (event.key !== undefined) {
    code = event.key;
  } else if (event.keyIdentifier !== undefined) {
    code = event.keyIdentifier;
  } else if (event.keyCode !== undefined) {
    code = event.keyCode;
  }
  setIframeSource(code, event.target.value);
});

// Show Drop shadow on scroll
const scrollContainer = document.querySelector('#resources-container main');
scrollContainer.addEventListener('scroll', (e) => {
  const nav = scrollContainer.querySelector('nav');
  if (scrollContainer.scrollTop > 0) {
    nav.style.boxShadow = "0 8px 10px -11px #212121";
  } else {
    nav.style.boxShadow = "none";
  }
});

// Add listeners to Modal Form Controls
const modalTextControls = document.querySelectorAll('#route-config-form .form-control');
const modalSwitchControls = document.querySelectorAll('#route-config-form .form-check-input');

modalTextControls.forEach(formControl => {
  formControl.addEventListener('input', ({ target }) => {
    if (['mock', 'fetch', 'store'].includes(target.name)) {
      let type = 'JSON';
      try {
        formValues[target.name] = JSON.parse(target.value);
        type = 'JSON';
      } catch (err) {
        formValues[target.name] = target.value
        type = 'STRING';
      };
      setFormDataType(target.name, type);
    } else {
      formValues[target.name] = target.value;
    }
  });
})
modalSwitchControls.forEach(formControl => {
  formControl.addEventListener('click', ({ target }) => {
    formValues[target.name] = target.checked;
  });
})

// On Modal Submit Listener
$routeConfigForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const id = $routeConfigForm.id?.value?.trim();
  const updatedRouteConfig = { _config: true, ...formValues, id };
  updatedRouteConfig.id ? updateRouteConfig(updatedRouteConfig) : addNewRoute(updatedRouteConfig)
})