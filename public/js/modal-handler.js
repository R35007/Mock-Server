function openModal($button) {
  hideFormError();
  $routeConfigForm.reset();
  const modalType = $button.getAttribute('data-type');
  const _id = $button.getAttribute('data-id');
  modalType === "update" ? updateRoute(_id) : addRoute(_id);
  $routeBsModal?.show?.();
};

async function updateRoute(_id) {
  const refreshedRoute = await window.fetch(localhost + "/_routes/" + _id).then((res) => res.json());
  const [routePath, routeConfig] = Object.entries(refreshedRoute)[0];

  $routeConfig.value = JSON.stringify(routeConfig);

  $routeConfigForm.classList.add("update-form");
  $routeConfigForm.classList.remove("add-form");
  $modalTitle.textContent = routePath;
  const {
    statusCode,
    delay,
    fetch,
    fetchCount,
    skipFetchError,
    mock,
    _fetchData,
    _fetchError,
    store
  } = routeConfig;

  $routeConfigForm._id.value = _id;
  $routeConfigForm.routePath.value = routePath;
  $routeConfigForm.statusCode.value = statusCode;
  $routeConfigForm.delay.value = delay;
  $routeConfigForm.fetch.value = typeof fetch === 'object' ? JSON.stringify(fetch, null, 8) : fetch ?? '';
  $routeConfigForm.fetchCount.value = fetchCount;
  $routeConfigForm.skipFetchError.checked = skipFetchError == true;
  $routeConfigForm.mock.value = typeof mock === 'object' ? JSON.stringify(mock, null, 8) : mock ?? '';
  $routeConfigForm._fetchData.value = typeof _fetchData === 'object' ? JSON.stringify(_fetchData, null, 8) : _fetchData ?? '';
  $routeConfigForm._fetchData.value = typeof _fetchData === 'object' ? JSON.stringify(_fetchData, null, 8) : _fetchData ?? '';
  $routeConfigForm._fetchError.value = typeof _fetchError === 'object' ? JSON.stringify(_fetchError, null, 8) : _fetchError ?? '';
  $routeConfigForm.store.value = typeof store === 'object' ? JSON.stringify(store, null, 8) : store ?? '';
}

function addRoute(_id) {
  $routeConfigForm.classList.remove("update-form");
  $routeConfigForm.classList.add("add-form");
  $modalTitle.textContent = "Add new Route";
}

$routeConfigForm.addEventListener("submit", function (e) {
  e.preventDefault();
  hideFormError();

  const fetch = parseJson($routeConfigForm.fetch.value);
  const mock = parseJson($routeConfigForm.mock.value);
  const _fetchData = parseJson($routeConfigForm._fetchData.value);
  const _fetchError = parseJson($routeConfigForm._fetchError.value);
  const store = parseJson($routeConfigForm.store.value);
  
  const routeConfig = {
    _id: $routeConfigForm._id.value?.trim(),
    routePath : $routeConfigForm.routePath?.value?.trim(),
    statusCode: parseInt($routeConfigForm.statusCode.value),
    delay: parseInt($routeConfigForm.delay.value),
    fetchCount: parseInt($routeConfigForm.fetchCount.value),
    skipFetchError: $routeConfigForm.skipFetchError.checked,
    middlewares: $routeConfigForm.middlewares?.value?.toLowerCase().split(",").filter(Boolean) || [],
    fetch,
    mock,
    store,
    _fetchData,
    _fetchError
  }
  routeConfig._id ? updateRouteConfig(routeConfig) : addNewRoute(routeConfig)
})

async function updateRouteConfig(routeConfig){
  const routePath = routeConfig.routePath;
  delete routeConfig.routePath;
  delete routeConfig.middlewares;
  const request = clean({...JSON.parse($routeConfig.value), ...routeConfig});

  if (!request.fetch) {
    delete request.fetchCount;
    delete request.skipFetchError;
  }

  console.log("Fetch request :", request);
  resources = await window.fetch(localhost + "/_routes/" + routeConfig._id, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }).then((res) => res.json());

  createResourcesList(resources);
  $routeBsModal?.hide?.();

  showToast(`${routePath} Updated Sucessfully`);
}

async function addNewRoute(routeConfig){
  const routePath = routeConfig.routePath;

  delete routeConfig._id;
  delete routeConfig.routePath;

  const _routeConfig = clean(routeConfig);

  if (!_routeConfig.fetch) {
    delete _routeConfig.fetchCount;
    delete _routeConfig.skipFetchError;
  }

  if (!routePath?.trim()?.length) {
    error += "Please Provide Route Path. <br/>";
  }
  if (Object.keys(resources).find(resource => resource === routePath?.trim())) {
    error += "Route Path already exist. Please Provide New Route Path. <br/>";
  }
  if (!_routeConfig.mock && !_routeConfig.fetch) {
    error += "Please Provide alteast one of Fetch or Mock data. <br/>";
  }
  if (error) {
    showFormError(error);
    return false;
  }

  const request = request = { [routePath]: _routeConfig };

  console.log("Add Fetch request :", request);

  resources = await window.fetch(localhost + "/_routes", {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }).then((res) => res.json());

  createResourcesList(resources);
  $routeBsModal?.hide?.();

  showToast(`${routePath} Added Sucessfully`);
}

function hideFormError() {
  $formError.style.display = "none";
  $formError.textContent = '';
}

function showFormError(errorText) {
  $formError.style.display = "block";
  $formError.innerHTML = errorText;
  $routeModal.querySelector(".modal-body").scrollTop = 0;
}