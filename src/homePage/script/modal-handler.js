function openModal($button) {
  hideFormError();
  $routeBsModal.show();
  const modalType = $button.getAttribute('data-type');
  const _id = $button.getAttribute('data-id');
  modalType === "update" ? updateRoute(_id) : addRoute(_id);
};

async function updateRoute(_id) {
  const refreshedRoute = await window.fetch(localhost + "/routes/" + _id).then((res) => res.json());
  const [routePath, routeConfig] = Object.entries(refreshedRoute)[0];

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
    _store
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
  $routeConfigForm._store.value = typeof _store === 'object' ? JSON.stringify(_store, null, 8) : _store ?? '';
}

function addRoute(_id) {
  $routeConfigForm.classList.remove("update-form");
  $routeConfigForm.classList.add("add-form");
  $routeConfigForm.reset();
  $modalTitle.textContent = "Add new Route";
}

$routeConfigForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  hideFormError();
  let error = '';

  const fetchValue = $routeConfigForm.fetch.value;
  const mockValue = $routeConfigForm.mock.value;
  const fetchDataValue = $routeConfigForm._fetchData.value;
  const fetchErrorValue = $routeConfigForm._fetchError.value;
  const storeValue = $routeConfigForm._store.value;


  const fetch = parseJson(fetchValue);
  const mock = parseJson(mockValue);
  const _fetchData = parseJson(fetchDataValue);
  const _fetchError = parseJson(fetchErrorValue);
  const _store = parseJson(storeValue);
  const _id = $routeConfigForm._id.value;
  const routePath = $routeConfigForm.routePath?.value?.trim();

  const routeConfig = {
    statusCode: parseInt($routeConfigForm.statusCode.value) || '',
    delay: parseInt($routeConfigForm.delay.value) || '',
    fetch: fetch || '',
    fetchCount: parseInt($routeConfigForm.fetchCount.value) ?? 1,
    skipFetchError: $routeConfigForm.skipFetchError.checked,
    mock: mock || '',
    middlewares: $routeConfigForm.middlewares?.value?.toLowerCase().split(",").filter(Boolean) || [],
    _fetchData: _fetchData || '',
    _fetchError: _fetchError || '',
    _store: _store || ''
  }

  if (!fetch) {
    delete routeConfig.fetchCount;
    delete routeConfig.skipFetchError;
  }

  // Validate If Creating New Route
  if(!_id){
    if (!routePath?.trim()?.length) {
      error += "Please Provide Route Path. <br/>";
    }
    if (Object.keys(resources).find(resource => resource === routePath?.trim())) {
      error += "Route Path already exist. Please Provide New Route Path. <br/>";
    }
    if (!routeConfig.mock && !routeConfig.fetch) {
      error += "Please Provide alteast one of Fetch or Mock data. <br/>";
    }
  }

  if (error) {
    showFormError(error);
    return false;
  }

  let request;
  if (_id) {
    // update Route
    delete routeConfig.middlewares;
    request = routeConfig;
  } else {
    // Create New Route
    if(!(routeConfig.delay+'').length) delete routeConfig.delay;
    if(!(routeConfig.statusCode+'').length) delete routeConfig.statusCode;
    if(!routeConfig.fetch.length) delete routeConfig.fetch;
    if(!routeConfig.mock.length) delete routeConfig.mock;
    delete routeConfig._fetchData;
    delete routeConfig._fetchError;
    delete routeConfig._store;
    request = { [routePath]: routeConfig };
  }

  console.log("Fetch request :", request);

  resources = await window.fetch(localhost + "/routes?_id=" + _id, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }).then((res) => res.json());

  createResourcesList(resources);
  $routeBsModal.hide();

  _id ? showToast(`${routeConfig.routePath} Updated Sucessfully`) : showToast(`Added Sucessfully`);
})

function hideFormError() {
  $formError.style.display = "none";
  $formError.textContent = '';
}

function showFormError(errorText) {
  $formError.style.display = "block";
  $formError.innerHTML = errorText;
  $routeModal.querySelector(".modal-body").scrollTop = 0;
}