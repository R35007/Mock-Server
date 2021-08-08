function openModal($button) {
  hideFormError();
  $routeConfigForm.reset();
  const modalType = $button.getAttribute('data-type');
  const id = $button.getAttribute('data-id');
  modalType === "update" && updateRoute(id);
  modalType === "clone" && cloneRoute(id);
  modalType === "add" && addRoute(id);
  $routeBsModal?.show?.();
};

async function updateRoute(id) {
  const refreshedRoute = await window.fetch(localhost + "/_db/" + id).then((res) => res.json());
  const [routePath, routeConfig = {}] = Object.entries(refreshedRoute)?.[0] || [];

  $routeConfig.value = JSON.stringify(routeConfig);
  $routeConfigForm.classList.add("update-form");
  $routeConfigForm.classList.remove("add-form");
  $modalTitle.textContent = routePath;
  setFormValues(routeConfig, routePath);
}

async function cloneRoute(id) {
  const refreshedRoute = await window.fetch(localhost + "/_db/" + id).then((res) => res.json());
  const [routePath, routeConfig = {}] = Object.entries(refreshedRoute)?.[0] || [];
  delete routeConfig.id;

  $routeConfig.value = JSON.stringify(routeConfig);
  $routeConfigForm.classList.remove("update-form");
  $routeConfigForm.classList.add("add-form");
  $modalTitle.textContent = `Clone: ${routePath}`;

  setFormValues(routeConfig, routePath);
}

function setFormValues(routeConfig, routePath) {
  const {
    id,
    description,
    statusCode,
    delay,
    fetch,
    fetchCount,
    skipFetchError,
    mock,
    fetchData,
    fetchError,
    store,
    middlewares
  } = routeConfig;

  $routeConfigForm.id.value = id || '';
  $routeConfigForm.routePath.value = routePath || '';
  $routeConfigForm.statusCode.value = statusCode ?? '';
  $routeConfigForm.delay.value = delay ?? '';
  $routeConfigForm.fetch.value = typeof fetch === 'object' ? JSON.stringify(fetch, null, 8) : fetch ?? '';
  $routeConfigForm.fetchCount.value = fetchCount ?? '';
  $routeConfigForm.skipFetchError.checked = skipFetchError == true;
  $routeConfigForm.mock.value = typeof mock === 'object' ? JSON.stringify(mock, null, 8) : mock ?? '';
  $routeConfigForm.fetchData.value = typeof fetchData === 'object' ? JSON.stringify(fetchData, null, 8) : fetchData ?? '';
  $routeConfigForm.fetchData.value = typeof fetchData === 'object' ? JSON.stringify(fetchData, null, 8) : fetchData ?? '';
  $routeConfigForm.fetchError.value = typeof fetchError === 'object' ? JSON.stringify(fetchError, null, 8) : fetchError ?? '';
  $routeConfigForm.store.value = typeof store === 'object' ? JSON.stringify(store, null, 8) : store ?? '';
  $routeConfigForm.description.value = description ?? '';
  $routeConfigForm.middlewares.value = middlewares?.join(',') ?? '';
}

function addRoute(id) {
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
  const fetchData = parseJson($routeConfigForm.fetchData.value);
  const fetchError = parseJson($routeConfigForm.fetchError.value);
  const store = parseJson($routeConfigForm.store.value);
  const existingRouteConfig = JSON.parse($routeConfig.value);

  const updatedRouteConfig = {
    _config: true,
    id: $routeConfigForm.id.value?.trim(),
    description: $routeConfigForm.description.value?.trim(),
    routePath: $routeConfigForm.routePath?.value?.trim(),
    statusCode: parseInt($routeConfigForm.statusCode.value),
    delay: parseInt($routeConfigForm.delay.value),
    fetchCount: parseInt($routeConfigForm.fetchCount.value),
    skipFetchError: $routeConfigForm.skipFetchError.checked,
    middlewares: $routeConfigForm.middlewares?.value?.split(",").filter(Boolean) || [],
    fetch,
    mock,
    fetchData,
    fetchError,
    store
  }
  updatedRouteConfig.id ?
    updateRouteConfig(existingRouteConfig, updatedRouteConfig) :
    addNewRoute(existingRouteConfig, updatedRouteConfig)
})

async function updateRouteConfig(existingRouteConfig, updatedRouteConfig) {
  const routePath = updatedRouteConfig.routePath;
  delete updatedRouteConfig.routePath;

  const request = clean({ ...existingRouteConfig, ...updatedRouteConfig });

  if(!request.fetch){
    delete request.fetchCount;
    delete request.skipFetchError;
  }

  console.log("Update Fetch request :", request);
  resources = await window.fetch(localhost + "/_db/" + updatedRouteConfig.id, {
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

  const _routeConfig = clean({ ...existingRouteConfig, ...updatedRouteConfig });
  if(!_routeConfig.fetch){
    delete _routeConfig.fetchCount;
    delete _routeConfig.skipFetchError;
  }
  
  let error = '';
  if (!routePath?.trim()?.length) {
    error += "Please Provide Route Path. <br/>";
  }
  if (Object.keys(resources).find(resource => resource === routePath?.trim())) {
    error += "Route Path already exist. Please Provide New Route Path. <br/>";
  }
  if (error) {
    showFormError(error);
    return false;
  }

  const request = { [routePath]: _routeConfig };

  console.log("Add Fetch request :", request);
  resources = await window.fetch(localhost + "/_db", {
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