"use strict";

let resources = {};
let rewriters = {};
let localhost = "http://localhost:3000";
let totalRoutesCount = 0;
let filteredRoutesCount = 0;
const $container = document.getElementById("container");
const $resourcesContainer = document.getElementById("resources-container");
const $dataContainer = document.getElementById("data-container");
const $rewritersContainer = document.getElementById("rewriters-container");
const $resourceHeader = document.getElementById("resource-header");
const $resourcesList = document.getElementById("resources-list");
const $rewritersList = document.getElementById("rewriters-list");
const $resourcesCount = document.getElementById("resources-count");
const $search = document.getElementById("search");
const $iframeloader = document.getElementById("iframe-loader");
const $iframeData = document.getElementById("iframe-data");
const $download = document.getElementById("download");
const $routeModal = document.getElementById("routeModal");
const $modalTitle = document.getElementById("modal-title");
const $routeConfigForm = document.getElementById("route-config-form");
const $formError = document.getElementById("form-error");
const $toast = document.getElementById("toast");
let $routeBsModal;
let $bsToast;

try {
  $routeBsModal = new bootstrap.Modal($routeModal);
  $bsToast = new bootstrap.Toast($toast, {
    anumation: true,
    delay: 2000
  });
} catch {
  $routeBsModal = {};
  $bsToast = {};
}

function getBadges(badgeList) {
  return badgeList.map(badge => `<h6 class="m-0">
        <span class="badge bg-secondary">${badge}</span>
      </h6>`);
}

function parseHTML(html) {
  var t = document.createElement("template");
  t.innerHTML = html;
  return t.content;
}

function findEntry(_id) {
  const route = Object.entries(resources).find(([_key, val]) => val._id == _id);
  return route || [];
} // Allow tab space inside textarea


function allowTabSpaces($event, $textarea) {
  if ($event.key == 'Tab') {
    $event.preventDefault();
    var start = $textarea.selectionStart;
    var end = $textarea.selectionEnd; // set textarea value to: text before caret + tab + text after caret

    $textarea.value = $textarea.value.substring(0, start) + "\t" + $textarea.value.substring(end); // put caret at right position again

    $textarea.selectionStart = $textarea.selectionEnd = start + 1;
  }
}

;

function showToast(message) {
  var _$bsToast, _$bsToast$show;

  $toast.querySelector(".toast-body").textContent = message;
  (_$bsToast = $bsToast) === null || _$bsToast === void 0 ? void 0 : (_$bsToast$show = _$bsToast.show) === null || _$bsToast$show === void 0 ? void 0 : _$bsToast$show.call(_$bsToast);
}

function parseJson(data) {
  let parsedData;

  try {
    parsedData = JSON.parse(data) || undefined;
  } catch {
    parsedData = data.trim() || undefined;
  }

  return parsedData;
} // A function is used for dragging and moving


function dragElement(element) {
  var md; // remember mouse down info

  element.onmousedown = onMouseDown;

  function onMouseDown(e) {
    md = {
      e,
      offsetLeft: element.offsetLeft,
      offsetTop: element.offsetTop,
      resourcesContainerWidth: $resourcesContainer.offsetWidth,
      dataContainerWidth: $dataContainer.offsetWidth
    };
    $resourcesContainer.style.pointerEvents = "none";
    $dataContainer.style.pointerEvents = "none";
    document.onmousemove = onMouseMove;

    document.onmouseup = () => {
      $resourcesContainer.style.pointerEvents = "all";
      $dataContainer.style.pointerEvents = "all";
      document.onmousemove = document.onmouseup = null; // clears drag event
    };
  }

  function onMouseMove(e) {
    var delta = {
      x: e.clientX - md.e.clientX,
      y: e.clientY - md.e.clientY
    }; // Prevent negative-sized elements

    const deltaX = Math.min(Math.max(delta.x, -md.resourcesContainerWidth), md.dataContainerWidth);
    let resourcesContainerWidth = md.resourcesContainerWidth + deltaX;
    let dataContainerWidth = md.dataContainerWidth - deltaX;
    let minWidth = md.dataContainerWidth / 100 * 35;

    if (dataContainerWidth < minWidth) {
      $dataContainer.style.display = "none";
    } else {
      $dataContainer.style.display = "block";
    }

    delta.x = Math.min(Math.max(delta.x, -md.resourcesContainerWidth), md.dataContainerWidth);
    element.style.left = md.offsetLeft + delta.x + "px";
    $dataContainer.style.width = dataContainerWidth + "px";
  }
}

dragElement(document.getElementById("separator"));

function toggleInfoBox(_id) {
  const $li = document.getElementById(_id);
  const classList = $li.classList;
  classList.contains("expanded") ? hideInfoBox($li) : showInfoBox($li, _id);
}

function hideInfoBox($li) {
  $li.classList.remove("expanded");
  $li.removeChild($li.lastElementChild);
}

function showInfoBox($li, _id) {
  const [routePath, routeConfig] = findEntry(_id);
  $li.classList.add("expanded");
  $li.appendChild(parseHTML(`
    <div class="info-box position-relative overflow=hidden">
      <div class="actions justify-content-end p-2 position-absolute" style="display: ${routeConfig._isDefault ? 'none' : 'flex'}">
        <button type="button" class="btn btn-outline-primary box-shadow-none btn-sm" onclick="reset('${routeConfig._id}')">Reset</button>
        <button type="button" class="btn btn-outline-primary box-shadow-none btn-sm mx-2" onclick="openModal(this)" data-type="update" data-id="${routeConfig._id}">Edit</button>
        <button type="button" class="btn btn-outline-primary box-shadow-none btn-sm" onclick="refresh('${routeConfig._id}')">Refresh</button>
      </div>
      <div class="route-config">${Object.entries(routeConfig).map(([key, val]) => getKeyVal(routeConfig._id, key, val)).join("")}</div>
    </div>`));
}

async function reset(_id) {
  const resetedRoutes = await window.fetch(localhost + "/reset/route/" + _id).then(res => res.json());
  const [routePath, routeConfig] = Object.entries(resetedRoutes)[0];
  resources[routePath] = routeConfig;
  toggleInfoBox(_id);
  toggleInfoBox(_id);
  showToast(`${routePath} Resetted Sucessfully`);
}

async function refresh(_id) {
  const refreshedRoute = await window.fetch(localhost + "/routes/" + _id).then(res => res.json());
  const [routePath, routeConfig] = Object.entries(refreshedRoute)[0];
  resources[routePath] = routeConfig;
  toggleInfoBox(_id);
  toggleInfoBox(_id);
  showToast(`${routePath} Refreshed Sucessfully`);
}

function getKeyVal(id, key, val) {
  var _ref;

  if (!((_ref = val + '') !== null && _ref !== void 0 && _ref.length) || val === null || val === undefined) return '';

  if (!["fetch", "mock", "_fetchData", "_fetchError", "_store", "_request"].includes(key) && Array.isArray(val) && val.every(v => typeof v === "string")) {
    return `
      <div class="row px-3">
        <label for="inputEmail3" class="key col col-form-label p-0">${key} :</label>
        <div class="val col d-flex flex-wrap align-items-center" style="grid-gap:.5rem">
        ${getBadges(val).join("")}
        </div>
      </div>`;
  } else if (typeof val === "object" || ["fetch", "mock", "_fetchData", "_fetchError", "_store", "_request"].includes(key)) {
    return `
    <div class="row px-3">
      <label for="inputEmail3" class="key col col-form-label p-0 mb-2 w-100" style="max-width: 100%">
        <a class="nav-link p-0" data-bs-toggle="collapse" href="#${id}_${key}" 
        role="button" aria-expanded="false" aria-controls="${id}_${key}">${key} :</a>
      </label>
      <div class="val col-12 collapse" id="${id}_${key}">
        <pre class="form-control">${JSON.stringify(val, null, 2)}</pre>
      </div>
    </div>`;
  } else {
    return `
      <div class="row px-3">
        <label for="inputEmail3" class="key col col-form-label p-0">${key} :</label>
        <div class="val col">${val}</div>
      </div>`;
  }
}

function openModal($button) {
  var _$routeBsModal, _$routeBsModal$show;

  hideFormError();
  (_$routeBsModal = $routeBsModal) === null || _$routeBsModal === void 0 ? void 0 : (_$routeBsModal$show = _$routeBsModal.show) === null || _$routeBsModal$show === void 0 ? void 0 : _$routeBsModal$show.call(_$routeBsModal);
  const modalType = $button.getAttribute('data-type');

  const _id = $button.getAttribute('data-id');

  modalType === "update" ? updateRoute(_id) : addRoute(_id);
}

;

async function updateRoute(_id) {
  const refreshedRoute = await window.fetch(localhost + "/routes/" + _id).then(res => res.json());
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
  var _$routeConfigForm$rou, _$routeConfigForm$rou2, _$routeConfigForm$mid, _$routeConfigForm$mid2, _$routeBsModal2, _$routeBsModal2$hide;

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
  const routePath = (_$routeConfigForm$rou = $routeConfigForm.routePath) === null || _$routeConfigForm$rou === void 0 ? void 0 : (_$routeConfigForm$rou2 = _$routeConfigForm$rou.value) === null || _$routeConfigForm$rou2 === void 0 ? void 0 : _$routeConfigForm$rou2.trim();
  const routeConfig = {
    statusCode: parseInt($routeConfigForm.statusCode.value) || '',
    delay: parseInt($routeConfigForm.delay.value) || '',
    fetchCount: parseInt($routeConfigForm.fetchCount.value) || '',
    fetch: fetch || '',
    mock: mock || '',
    skipFetchError: $routeConfigForm.skipFetchError.checked,
    middlewares: ((_$routeConfigForm$mid = $routeConfigForm.middlewares) === null || _$routeConfigForm$mid === void 0 ? void 0 : (_$routeConfigForm$mid2 = _$routeConfigForm$mid.value) === null || _$routeConfigForm$mid2 === void 0 ? void 0 : _$routeConfigForm$mid2.toLowerCase().split(",").filter(Boolean)) || [],
    _fetchData: _fetchData || '',
    _fetchError: _fetchError || '',
    _store: _store || ''
  };

  if (!fetch) {
    delete routeConfig.fetchCount;
    delete routeConfig.skipFetchError;
  } // Validate If Creating New Route


  if (!_id) {
    var _routePath$trim;

    if (!(routePath !== null && routePath !== void 0 && (_routePath$trim = routePath.trim()) !== null && _routePath$trim !== void 0 && _routePath$trim.length)) {
      error += "Please Provide Route Path. <br/>";
    }

    if (Object.keys(resources).find(resource => resource === (routePath === null || routePath === void 0 ? void 0 : routePath.trim()))) {
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
    if (typeof routeConfig.delay !== 'number') delete routeConfig.delay;
    if (typeof routeConfig.statusCode !== 'number') delete routeConfig.statusCode;
    if (typeof routeConfig.fetchCount !== 'number') delete routeConfig.fetchCount;
    if (!routeConfig.fetch) delete routeConfig.fetch;
    if (!routeConfig.mock) delete routeConfig.mock;
    delete routeConfig._fetchData;
    delete routeConfig._fetchError;
    delete routeConfig._store;
    request = {
      [routePath]: routeConfig
    };
  }

  console.log("Fetch request :", request);
  resources = await window.fetch(localhost + "/routes?_id=" + _id, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }).then(res => res.json());
  createResourcesList(resources);
  (_$routeBsModal2 = $routeBsModal) === null || _$routeBsModal2 === void 0 ? void 0 : (_$routeBsModal2$hide = _$routeBsModal2.hide) === null || _$routeBsModal2$hide === void 0 ? void 0 : _$routeBsModal2$hide.call(_$routeBsModal2);
  _id ? showToast(`${routeConfig.routePath} Updated Sucessfully`) : showToast(`Added Sucessfully`);
});

function hideFormError() {
  $formError.style.display = "none";
  $formError.textContent = '';
}

function showFormError(errorText) {
  $formError.style.display = "block";
  $formError.innerHTML = errorText;
  $routeModal.querySelector(".modal-body").scrollTop = 0;
}

async function init() {
  localhost = window.location.href.slice(0, -1);
  resources = await window.fetch(localhost + "/routes").then(res => res.json());
  rewriters = await window.fetch(localhost + "/rewriter").then(res => res.json());
  createResourcesList(resources);
  Object.entries(rewriters).length && createRewritersList(rewriters);
  showToast("Resources Loaded Sucessfully");
}

function createResourcesList(resources) {
  setIFrameSrc(localhost);
  $search.value = ""; // collects all expanded list to restore after refresh

  const expandedList = [];
  $resourcesList.querySelectorAll("li.expanded").forEach(li => expandedList.push(li.id)); // removes all the resources list

  while ($resourcesList.lastElementChild) {
    $resourcesList.removeChild($resourcesList.lastElementChild);
  }

  setDefaultRoutes(resources);
  $resourcesList.innerHTML = ResourceList(resources);
  expandedList.forEach(toggleInfoBox);
}

function createRewritersList(rewriters) {
  $rewritersList.innerHTML = Object.entries(rewriters).map(([key, val]) => {
    return `
    <li class="nav-item w-100 mt-1 overflow-hidden d-block">
      <div class="header d-flex align-items-center w-100" style='filter:grayscale(0.6)'">
        <a class="nav-link py-2 px-4">
          <span class="route-path" style="word-break:break-all">${key}</span>
          <code class="px-2">⇢</code>
          <span class="route-path" style="word-break:break-all">${val}</span>
        </a>
      </div>
    </li>
    `;
  });
  $rewritersContainer.style.display = "block";
}

function setDefaultRoutes(resources) {
  const routesList = Object.keys(resources);
  if (!routesList.includes("/routes")) resources["/routes"] = {
    description: "This route gives you the list of available routes with baseUrl. It also included Default Routes.",
    _isDefault: true,
    _id: "default_1"
  };
  if (!routesList.includes("/store")) resources["/store"] = {
    description: "This route gives you the store values",
    _isDefault: true,
    _id: "default_2"
  };
}

function ResourceList(resources) {
  totalRoutesCount = Object.keys(resources).length;
  setRoutesCount(totalRoutesCount);
  return `
    ${Object.entries(resources).map(routesEntry => ResourceItem(...routesEntry)).join("")}
    <li id="no-resource" class="nav-item w-100 mt-2" style="display: none">
      <span class="nav-link p-2 px-3 d-block bg-dark text-light text-center">
        <span> No Resources Found</span>
      </span>
    </li>
    <li id="add-resource" role="button" class="nav-item w-100 mt-2 d-block" data-type="add" onclick="openModal(this)">
      <span class="nav-link p-2 px-3 me-3 text-primary text-center">
        <span role="button" class="action-icon"><i class="fas fa-plus-circle"></i></span>
        <span> Click here To add new Resource </span>
      </span>
    </li>
    <li class="nav-item w-100 mt-2 d-block">
      <div class="d-flex align-items-center justify-content-end">
        <button class="btn btn-secondary box-shadow-none btn-sm" onclick="resetAll('route')"> Reset Routes</button>
        <button class="btn btn-secondary ms-3 box-shadow-none btn-sm" onclick="resetAll('store')">Reset Store</button>
      </div>
    </li>
  `;
}

function ResourceItem(routePath, routeConfig) {
  return `
  <li id="${routeConfig._id}" class="nav-item w-100 mt-1 overflow-hidden" style="display: block">
    <div class="header d-flex align-items-center w-100" style="${routeConfig._isDefault ? 'filter:grayscale(0.6)' : 'filter:grayscale(0.1)'}">
      <span role="button" class="info-icon action-icon" onclick="toggleInfoBox('${routeConfig._id}')"><span class="icon">i</span></span>  
      <a class="nav-link py-2 pe-3 ps-0" onclick="setIframeData(this,'${localhost + routePath}')" type="button">
        <span class="route-path" style="word-break:break-all">${routePath}</span>
      </a>
    </div>
  </li>
`;
}

async function setIframeData($event, url) {
  try {
    clearActiveLink();
    $event.parentNode.classList.add("active");
    $iframeData.contentWindow.document.open();
    $iframeData.contentWindow.document.close();
    $iframeloader.style.display = "grid";
    $dataContainer.style.display = "block";
    setIFrameSrc(url);
  } catch (err) {
    console.error(err);
  }
}

function clearActiveLink() {
  const li = $resourcesList.querySelectorAll("li .header");

  for (let i = 0; i < li.length; i++) {
    li[i].classList.remove("active");
  }
}

function setIFrameSrc(url) {
  $resourceHeader.href = url;
  $resourceHeader.children[1].innerHTML = url;

  if (url !== localhost) {
    $iframeData.src = url;
    $download.href = url;
  } else {
    $iframeData.src = '';
    $download.href = '';
  }
}

function filterRoutes() {
  let searchText, routePath, i, txtValue;
  searchText = $search.value.toUpperCase();
  routePath = $resourcesList.querySelectorAll(".route-path");
  filteredRoutesCount = 0;

  for (i = 0; i < routePath.length; i++) {
    txtValue = routePath[i].textContent || routePath[i].innerText;

    if (txtValue.toUpperCase().indexOf(searchText) > -1) {
      routePath[i].parentNode.parentNode.parentNode.style.display = "block";
      filteredRoutesCount++;
    } else {
      routePath[i].parentNode.parentNode.parentNode.style.display = "none";
    }
  }

  setRoutesCount(totalRoutesCount, filteredRoutesCount, searchText);
  showNoResource(!filteredRoutesCount);
}

function setRoutesCount(totalRoutesCount, filteredRoutesCount, searchText) {
  const count = searchText !== null && searchText !== void 0 && searchText.length ? `${filteredRoutesCount} / ${totalRoutesCount}` : totalRoutesCount;
  $resourcesCount.innerHTML = count;
}

function showNoResource(show) {
  document.getElementById("no-resource").style.display = show ? "block" : "none";
}

async function resetAll(type) {
  if (type === 'route') {
    resources = await window.fetch(localhost + "/reset/route").then(res => res.json());
    showToast("Routes Resetted Sucessfully");
  } else {
    await window.fetch(localhost + "/reset/store").then(res => res.json());
    showToast("Store Resetted Sucessfully");
  }

  createResourcesList(resources);
}

init();