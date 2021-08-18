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
    mockFirst,
    skipFetchError,
    mock,
    fetchData,
    store,
    middlewareNames
  } = routeConfig;

  $routeConfigForm.id.value = id || '';
  $routeConfigForm.routePath.value = routePath || '';
  $routeConfigForm.statusCode.value = statusCode ?? '';
  $routeConfigForm.delay.value = delay ?? '';
  $routeConfigForm.fetch.value = typeof fetch === 'object' ? JSON.stringify(fetch, null, 8) : fetch ?? '';
  $routeConfigForm.fetchCount.value = fetchCount ?? '';
  $routeConfigForm.skipFetchError.checked = (skipFetchError + "") == 'true';
  $routeConfigForm.mockFirst.checked = (mockFirst + "") == 'true';
  $routeConfigForm.mock.value = typeof mock === 'object' ? JSON.stringify(mock, null, 8) : mock ?? '';
  $routeConfigForm.store.value = typeof store === 'object' ? JSON.stringify(store, null, 8) : store ?? '';
  $routeConfigForm.description.value = description ?? '';
  $routeConfigForm.middlewareNames.value = middlewareNames?.join(',') ?? '';

  // Setting Fetch Data value
  $routeConfigForm.status.value = fetchData?.status ?? '';
  $routeConfigForm.message.value = fetchData?.message ?? '';
  $routeConfigForm.isError.checked = (fetchData?.isError + "") == 'true';
  $routeConfigForm.response.value = typeof fetchData?.response === 'object' ? JSON.stringify(fetchData?.response || '', null, 8) : fetchData?.response ?? '';
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
  const response = parseJson($routeConfigForm.response.value);
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
    mockFirst: $routeConfigForm.mockFirst.checked,
    middlewareNames: $routeConfigForm.middlewareNames?.value?.split(",").filter(Boolean) || [],
    fetch,
    mock,
    fetchData: {
      ...(existingRouteConfig.fetchData || {}),
      status: parseInt($routeConfigForm.status.value),
      message: parseInt($routeConfigForm.message.value),
      isError: $routeConfigForm.isError.checked,
      response
    },
    store
  }
  updatedRouteConfig.id ?
    updateRouteConfig(existingRouteConfig, updatedRouteConfig) :
    addNewRoute(existingRouteConfig, updatedRouteConfig)
})

async function updateRouteConfig(existingRouteConfig, updatedRouteConfig) {
  const routePath = updatedRouteConfig.routePath;
  delete updatedRouteConfig.routePath;

  const request = { ...existingRouteConfig, ...updatedRouteConfig };
  cleanRequest(request);

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

  const _routeConfig = { ...existingRouteConfig, ...updatedRouteConfig };
  cleanRequest(_routeConfig)

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

function cleanRequest(request) {
  for (let key in request) {
    if (['fetchData', 'store'].includes(key)) cleanRequest(request[key]);
    ((!request[key] && request[key] != '0') || request[key] === false || (request[key] + "") === 'NaN' || key.startsWith('_')) && key !== "_config" && delete request[key];
  }
  if (!request.fetch) {
    delete request.fetchData;
    delete request.fetchCount;
    delete request.skipFetchError;
  }
  const fetchDataKeys = Object.keys(request.fetchData || {});
  if (fetchDataKeys.length === 1 && fetchDataKeys[0] === 'headers') {
    delete request.fetchData?.headers
  }
}