function openModal($button) {
  formValues = {}
  hideFormError();
  $routeConfigForm.reset();

  const modalType = $button.getAttribute('data-type');
  const id = $button.getAttribute('data-id');
  setFormDataType('mock', '');
  setFormDataType('fetch', '');
  setFormDataType('store', '');

  modalType === "update" && updateRoute(id);
  modalType === "clone" && cloneRoute(id);
  modalType === "add" && addRoute();
  $routeBsModal?.show?.();
};

async function updateRoute(id) {
  const refreshedRoute = await window.fetch(localhost + "/_db/" + id).then((res) => res.json());
  const [routePath, routeConfig = {}] = Object.entries(refreshedRoute)?.[0] || [];

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

function addRoute() {
  $routeConfig.value = JSON.stringify({});
  $routeConfigForm.classList.remove("update-form");
  $routeConfigForm.classList.add("add-form");
  $modalTitle.textContent = "Add new Route";
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
    store,
    middlewares
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
  $routeConfigForm.middlewares.value = middlewares?.join(',') ?? '';

  setFormDataType('mock', typeof mock === 'object' ? 'JSON' : 'STRING');
  setFormDataType('fetch', typeof fetch === 'object' ? 'JSON' : 'STRING');
  setFormDataType('store', typeof store === 'object' ? 'JSON' : 'STRING');
}

async function updateRouteConfig(updatedRouteConfig) {
  const routePath = $routeConfigForm.routePath?.value?.trim();
  const id = updatedRouteConfig.id;

  resources = await window.fetch(localhost + "/_db/" + id, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatedRouteConfig)
  }).then((res) => res.json());

  createResourcesList(resources);
  $routeBsModal?.hide?.();
  showToast(`${routePath} Updated Successfully`);
}

async function addNewRoute(updatedRouteConfig) {
  const existingRouteConfig = JSON.parse($routeConfig.value);

  const routePath = $routeConfigForm.routePath?.value?.trim();
  const middlewares = $routeConfigForm.middlewares?.value?.split(',') || [];

  const _routeConfig = { ...existingRouteConfig, ...updatedRouteConfig, middlewares };
  delete _routeConfig.routePath;
  delete _routeConfig.id;

  if (!routePath?.trim()?.length) {
    const error = "Please Provide Route Path";
    showFormError(error);
    return false;
  }
  if (Object.keys(resources).find(resource => resource === routePath?.trim())) {
    const error = "Route Path already exist. Please Provide new Route Path";
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