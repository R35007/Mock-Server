function openModal($button) {
  hideFormError();
  $routeConfigForm.reset();
  const modalType = $button.getAttribute('data-type');
  const _id = $button.getAttribute('data-id');
  modalType === "update" && updateRoute(_id);
  modalType === "clone" && cloneRoute(_id);
  modalType === "add" && addRoute(_id);
  $routeBsModal?.show?.();
};

async function updateRoute(_id) {
  const refreshedRoute = await window.fetch(localhost + "/_routes/" + _id).then((res) => res.json());
  const [routePath, routeConfig = {}] = Object.entries(refreshedRoute)?.[0] || [];

  $routeConfig.value = JSON.stringify(routeConfig);
  $routeConfigForm.classList.add("update-form");
  $routeConfigForm.classList.remove("add-form");
  $modalTitle.textContent = routePath;
  setFormValues(routeConfig, routePath);
}

async function cloneRoute(_id) {
  const refreshedRoute = await window.fetch(localhost + "/_routes/" + _id).then((res) => res.json());
  const [routePath, routeConfig = {}] = Object.entries(refreshedRoute)?.[0] || [];
  delete routeConfig._id;

  $routeConfig.value = JSON.stringify(routeConfig);
  $routeConfigForm.classList.remove("update-form");
  $routeConfigForm.classList.add("add-form");
  $modalTitle.textContent = `Clone: ${routePath}`;

  setFormValues(routeConfig, routePath);
}

function setFormValues(routeConfig, routePath) {
  const {
    _id,
    description,
    statusCode,
    delay,
    fetch,
    fetchCount,
    skipFetchError,
    mock,
    _fetchData,
    _fetchError,
    _store,
    middlewares
  } = routeConfig;

  $routeConfigForm._id.value = _id || '';
  $routeConfigForm.routePath.value = routePath || '';
  $routeConfigForm.statusCode.value = statusCode ?? '';
  $routeConfigForm.delay.value = delay ?? '';
  $routeConfigForm.fetch.value = typeof fetch === 'object' ? JSON.stringify(fetch, null, 8) : fetch ?? '';
  $routeConfigForm.fetchCount.value = fetchCount ?? '';
  $routeConfigForm.skipFetchError.checked = skipFetchError == true;
  $routeConfigForm.mock.value = typeof mock === 'object' ? JSON.stringify(mock, null, 8) : mock ?? '';
  $routeConfigForm._fetchData.value = typeof _fetchData === 'object' ? JSON.stringify(_fetchData, null, 8) : _fetchData ?? '';
  $routeConfigForm._fetchData.value = typeof _fetchData === 'object' ? JSON.stringify(_fetchData, null, 8) : _fetchData ?? '';
  $routeConfigForm._fetchError.value = typeof _fetchError === 'object' ? JSON.stringify(_fetchError, null, 8) : _fetchError ?? '';
  $routeConfigForm._store.value = typeof _store === 'object' ? JSON.stringify(_store, null, 8) : _store ?? '';
  $routeConfigForm.description.value = description ?? '';
  $routeConfigForm.middlewares.value = middlewares?.join(',') ?? '';
}

function addRoute(_id) {
  $routeConfig.value = JSON.stringify({});
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
  const _store = parseJson($routeConfigForm._store.value);
  const existingRouteConfig = JSON.parse($routeConfig.value);

  const updatedRouteConfig = {
    _id: $routeConfigForm._id.value?.trim(),
    description: $routeConfigForm.description.value?.trim(),
    routePath: $routeConfigForm.routePath?.value?.trim(),
    statusCode: parseInt($routeConfigForm.statusCode.value),
    delay: parseInt($routeConfigForm.delay.value),
    fetchCount: parseInt($routeConfigForm.fetchCount.value),
    skipFetchError: $routeConfigForm.skipFetchError.checked,
    middlewares: $routeConfigForm.middlewares?.value?.split(",").filter(Boolean) || [],
    fetch,
    mock,
    _fetchData,
    _fetchError,
    _store
  }
  updatedRouteConfig._id ?
    updateRouteConfig(existingRouteConfig, updatedRouteConfig) :
    addNewRoute(existingRouteConfig, updatedRouteConfig)
})

async function updateRouteConfig(existingRouteConfig, updatedRouteConfig) {
  const routePath = updatedRouteConfig.routePath;
  delete updatedRouteConfig.routePath;

  const request = clean({ ...existingRouteConfig, ...updatedRouteConfig });

  let error = '';
  if (!request.mock && !request.fetch) {
    error += "Please Provide minimum one of Fetch or Mock data. <br/>";
  }
  if (error) {
    showFormError(error);
    return false;
  }

  console.log("Update Fetch request :", request);
  resources = await window.fetch(localhost + "/_routes/" + updatedRouteConfig._id, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }).then((res) => res.json());

  createResourcesList(resources);
  $routeBsModal?.hide?.();

  showToast(`${routePath} Updated Successfully`);
}

async function addNewRoute(existingRouteConfig, updatedRouteConfig) {
  const routePath = updatedRouteConfig.routePath;
  delete updatedRouteConfig.routePath;

  const _routeConfig = clean({ ...existingRouteConfig, ...updatedRouteConfig })
  
  let error = '';
  if (!routePath?.trim()?.length) {
    error += "Please Provide Route Path. <br/>";
  }
  if (Object.keys(resources).find(resource => resource === routePath?.trim())) {
    error += "Route Path already exist. Please Provide New Route Path. <br/>";
  }
  if (!_routeConfig.mock && !_routeConfig.fetch) {
    error += "Please Provide minimum one of Fetch or Mock data. <br/>";
  }
  if (error) {
    showFormError(error);
    return false;
  }

  const request = { [routePath]: _routeConfig };

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

  showToast(`${routePath} Added Successfully`);
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