function openModal($button) {
  formValues = {}
  hideFormError();
  $routeConfigForm.reset();

  const modalType = $button.getAttribute('data-type');
  const id = $button.getAttribute('data-id');
  setFormDataType('mock', '');
  setFormDataType('fetch', '');
  setFormDataType('store', '');
  setFormDataType('fetchData.response', '');

  modalType === "update" && updateRoute(id);
  modalType === "clone" && cloneRoute(id);
  modalType === "add" && addRoute();
  $routeBsModal?.show?.();
};

async function updateRoute(id) {
  const refreshedRoute = await request(localhost + "/_db/" + id);
  const [routePath, routeConfig = {}] = Object.entries(refreshedRoute)?.[0] || [];

  $routeConfig.value = JSON.stringify(routeConfig);
  $routeConfigForm.classList.add("update-form");
  $routeConfigForm.classList.remove("add-form");
  $modalTitle.textContent = routePath;

  setFormValues(routeConfig, routePath);
}

function addRoute() {
  $routeConfig.value = JSON.stringify({ routePath: $search.value });
  $routeConfigForm.routePath.value = $search.value || '';
  formValues.routePath = $search.value || '';
  $routeConfigForm.classList.remove("update-form");
  $routeConfigForm.classList.add("add-form");
  $modalTitle.textContent = "Add new Route";
}

async function cloneRoute(id) {
  const refreshedRoute = await request(localhost + "/_db/" + id);
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
    store,
    middlewares,
    fetchData = {}
  } = routeConfig;

  const fetchResp = fetchData.response;

  $routeConfigForm.id.value = id || '';
  $routeConfigForm.routePath.value = routePath || '';
  $routeConfigForm.statusCode.value = statusCode ?? '';
  $routeConfigForm.delay.value = delay ?? '';
  $routeConfigForm.fetchCount.value = fetchCount ?? '';
  $routeConfigForm.skipFetchError.checked = (skipFetchError + "") == 'true';
  $routeConfigForm.mockFirst.checked = (mockFirst + "") == 'true';
  $routeConfigForm.description.value = description ?? '';
  $routeConfigForm.middlewares.value = middlewares?.join(',') ?? '';

  $routeConfigForm.mock.value = typeof mock === 'object' ? JSON.stringify(mock, null, 8) : mock ?? '';
  $routeConfigForm.fetch.value = typeof fetch === 'object' ? JSON.stringify(fetch, null, 8) : fetch ?? '';
  $routeConfigForm.store.value = typeof store === 'object' ? JSON.stringify(store, null, 8) : store ?? '';
  $routeConfigForm["fetchData.response"].value = typeof fetchResp === 'object' ? JSON.stringify(fetchResp, null, 8) : fetchResp ?? '';

  setFormDataType('mock', typeof mock === 'object' ? 'JSON' : 'STRING');
  setFormDataType('fetch', typeof fetch === 'object' ? 'JSON' : 'STRING');
  setFormDataType('store', typeof store === 'object' ? 'JSON' : 'STRING');
  setFormDataType('fetchData.response', typeof fetchResp === 'object' ? 'JSON' : 'STRING');
}

async function updateRouteConfig(updatedRouteConfig) {
  const existingRouteConfig = parseJson($routeConfig.value) || {};

  const routePath = $routeConfigForm.routePath?.value?.trim();
  delete updatedRouteConfig.middlewares;

  const fetchData = {
    ...(existingRouteConfig.fetchData || {}),
    ...(updatedRouteConfig.fetchData || {})
  }

  const payload = {
    [routePath]: {
      ...updatedRouteConfig,
      ...(Object.keys(fetchData) ? { fetchData } : {})
    }
  };

  const response = await request(localhost + "/_db/", {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  Object.entries(response).forEach(([routePath, routeConfig]) => {
    resources[routePath] = routeConfig;
  })

  createResourcesList(resources);
  $routeBsModal?.hide?.();
  showToast(`${routePath} Updated Successfully`);
}

async function addNewRoute(updatedRouteConfig) {
  const existingRouteConfig = parseJson($routeConfig.value) || {};

  const routePath = $routeConfigForm.routePath?.value?.trim();
  const middlewares = $routeConfigForm.middlewares?.value?.split(',').filter(Boolean) || [];
  const fetchData = {
    ...(existingRouteConfig.fetchData || {}),
    ...(updatedRouteConfig.fetchData || {})
  }

  const routeConfig = {
    ...existingRouteConfig,
    ...updatedRouteConfig,
    ...(middlewares.length ? { middlewares } : {}),
    ...(Object.keys(fetchData) ? { fetchData } : {})
  };
  delete routeConfig.routePath;
  delete routeConfig.id;

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

  const payload = { [routePath]: routeConfig };

  const response = await request(localhost + "/_db", {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  Object.entries(response).forEach(([routePath, routeConfig]) => {
    resources[routePath] = routeConfig;
  })

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