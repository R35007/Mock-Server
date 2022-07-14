async function init() {
  try {
    resources = await window.fetch(localhost + "/_db").then((res) => res.json());
  } catch (err) {
    console.log(err);
  }

  try {
    rewriters = await window.fetch(localhost + "/_rewriters").then((res) => res.json());
  } catch (err) {
    console.log(err);
  }
  createResourcesList(resources);
  Object.entries(rewriters).length && createRewritersList(rewriters);
  showToast("Resources Loaded Successfully");
}

function createResourcesList(resources) {
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
  }).join("")
  $rewritersContainer.style.display = "block";
}

function setDefaultRoutes(resources) {
  const routesList = Object.keys(resources)

  if (!routesList.includes("/_db"))
    resources["/_db?_clean=true"] = {
      id: "default_1",
      description: "This route gives you the Db snapshot",
      _isDefault: true,
    }

  if (!routesList.includes("/_store"))
    resources["/_store"] = {
      id: "default_2",
      description: "This route gives you the store values",
      _isDefault: true,
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
        <button style="margin-top:-3.6rem" 
        class="btn btn-secondary box-shadow-none btn-sm" 
        onclick="resetAll('db')"> Reset Resources</button>
      </div>
    </li>
  `;
}

function ResourceItem(routePath, routeConfig) {
  return `
  <li id="${routeConfig.id}" class="nav-item w-100 mt-1 overflow-hidden" style="display: block">
    <div class="header d-flex align-items-center w-100" style="${routeConfig._isDefault ? 'filter:grayscale(0.6)' : 'filter:grayscale(0.1)'}">
      <span role="button" class="info-icon action-icon" onclick="toggleInfoBox('${routeConfig.id}')"><span class="icon">i</span></span>  
      <a class="nav-link py-2 pe-3 ps-0" onclick="setIframeData(this,'${routePath}')" type="button">
        <span class="route-path" style="word-break:break-all">${routePath}</span>
      </a>
    </div>
  </li>
`;
}

async function setIframeData($event, routePath) {
  try {
    clearActiveLink();
    $event.parentNode.classList.add("active");
    try {
      $iframeData.contentWindow.document.open();
      $iframeData.contentWindow.document.close();
    } catch { }
    $frameLoader.style.display = "grid";
    $dataContainer.style.display = "block";
    setIFrameSrc(routePath);
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

function setIFrameSrc(routePath) {
  if (routePath.startsWith("http")) {
    $resourceRedirect.href = routePath;
    $iframeUrl.value = routePath;
    $iframeData.src = routePath;
    $download.href = routePath;
  } else if (routePath?.trim().length) {
    // remove optional params> ex : /posts/:id? -> /posts/,  /posts/:id/comments -> /posts/1/comments
    let validRoutePath = routePath.split("/").map(r => r.indexOf(":") >= 0 ? r.indexOf("?") >= 0 ? "" : random(1, 100) : r).join("/");
    validRoutePath = validRoutePath.replace(/\/$/gi, "") // removing trailing slash. ex: /posts/ -> /posts

    const url = localhost + validRoutePath;

    $resourceRedirect.href = url;
    $iframeUrl.value = url;
    $iframeData.src = url;
    $download.href = url;
  } else {
    $resourceRedirect.href = localhost;
    $iframeUrl.value = localhost;
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
  if (type === 'db') {
    resources = await window.fetch(localhost + "/_reset/db").then(res => res.json());
    showToast("Routes Restored Successfully");
  } else {
    await window.fetch(localhost + "/_reset/store").then(res => res.json());
    showToast("Store Restored Successfully");
  }
  createResourcesList(resources);
}

init();
