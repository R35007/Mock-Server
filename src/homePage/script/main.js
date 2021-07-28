async function init() {
  localhost = window.location.href.slice(0, -1);
  resources = await window.fetch(localhost + "/routes").then((res) => res.json());
  rewriters = await window.fetch(localhost + "/rewriter").then((res) => res.json());
  createResourcesList(resources);
  Object.entries(rewriters).length && createRewritersList(rewriters);
  showToast("Resources Loaded Sucessfully");
}

function createResourcesList(resources) {
  setIFrameSrc(localhost);
  $search.value = "";

  // collects all expanded list to restore after refresh
  const expandedList = [];
  $resourcesList.querySelectorAll("li.expanded").forEach(li => expandedList.push(li.id));

  // removes all the resources list
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
    `
  })
  $rewritersContainer.style.display = "block";
}

function setDefaultRoutes(resources) {
  const routesList = Object.keys(resources)

  if (!routesList.includes("/routes"))
    resources["/routes"] = {
      description: "This route gives you the list of available routes with baseUrl. It also included Default Routes.",
      _isDefault: true,
      _id: "default_1"
    }

  if (!routesList.includes("/store"))
    resources["/store"] = {
      description: "This route gives you the store values",
      _isDefault: true,
      _id: "default_2"
    }
}

function ResourceList(resources) {
  totalRoutesCount = Object.keys(resources).length;
  setRoutesCount(totalRoutesCount);

  return `
    ${Object.entries(resources).map((routesEntry) => ResourceItem(...routesEntry)).join("")}
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
  const count = searchText?.length
    ? `${filteredRoutesCount} / ${totalRoutesCount}`
    : totalRoutesCount;
  $resourcesCount.innerHTML = count;
}

function showNoResource(show) {
  document.getElementById("no-resource").style.display = show
    ? "block"
    : "none";
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
