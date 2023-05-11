async function init() {
  $search.value = '';

  try {
    resources = await request(localhost + '/_db');
  } catch (err) {
    console.log(err);
  }

  try {
    rewriters = await request(localhost + '/_rewriters');
  } catch (err) {
    console.error(err);
  }
  createResourcesList(resources);
  Object.entries(rewriters).length && createRewritersList(rewriters);

  showToast('Resources Loaded Successfully');
}

function setHomePageRoutes(resources) {
  const routesList = Object.keys(resources);

  if (!routesList.includes('/_db'))
    resources['/_db'] = {
      id: window.btoa('/_db'),
      description: 'Get Db snapshot. Use ?_clean=true to get a refined clean Db.',
      _default: true,
    };

  if (!routesList.includes('/_routes'))
    resources['/_routes'] = {
      id: window.btoa('/_routes'),
      description: 'Get List of routes used.',
      _default: true,
    };

  if (!routesList.includes('/_store'))
    resources['/_store'] = {
      id: window.btoa('/_store'),
      description: 'Get Store values.',
      _default: true,
    };
}

function createResourcesList(resources) {
  // collects all expanded list to restore after refresh
  const expandedList = [];
  $resourcesList.querySelectorAll('li.expanded').forEach((li) => expandedList.push(li.id));

  // removes all the resources list
  while ($resourcesList.lastElementChild) {
    $resourcesList.removeChild($resourcesList.lastElementChild);
  }

  setHomePageRoutes(resources);
  $resourcesList.innerHTML = ResourceList(resources);

  expandedList.forEach(toggleInfoBox);

  filterRoutes();
}

function createRewritersList(rewriters) {
  $rewritersList.innerHTML = Object.entries(rewriters)
    .map(([key, val]) => {
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
    })
    .join('');
  $rewritersContainer.style.display = 'block';
}

function ResourceList(resources) {
  totalRoutesCount = Object.keys(resources).length;
  setRoutesCount(totalRoutesCount);

  return `
    ${Object.entries(resources)
      .map((routesEntry) => ResourceItem(...routesEntry))
      .join('')}
    <li id="no-resource" class="nav-item w-100 mt-2" style="display: none">
      <span class="p-2 px-3 d-block bg-light text-center">
        <span> No Resources Found</span>
      </span>
    </li>
    <li id="add-resource" role="button" class="nav-item w-100 mt-2 d-block" data-type="add" onclick="openModal(this)">
      <span class="nav-link p-2 px-3 me-3 text-center">
        <span> Click here To add new Resource </span>
      </span>
    </li>
    <li class="nav-item w-100 mt-2 d-block">
      <div class="d-flex align-items-center justify-content-end">
        <button style="margin-top:-3.6rem" 
        class="btn btn-secondary shadow-none btn-sm" 
        onclick="resetAll()"> Reset Resources</button>
      </div>
    </li>
  `;
}

function ResourceItem(routePath, routeConfig) {
  const isDefaultRoute = routeConfig._default;
  return `
  <li id="${routeConfig.id}" class="nav-item w-100 mt-1 overflow-hidden" style="display: block">
    <div class="header d-flex align-items-center w-100" style="${isDefaultRoute ? 'filter:grayscale(0.6)' : 'filter:grayscale(0.1)'}">
      <span role="button" class="info-icon action-icon" onclick="toggleInfoBox('${routeConfig.id}')"><span class="icon">i</span></span>  
      <a class="nav-link py-2 pe-3 ps-0" onclick="setIframeData(event, this,'${routePath}')" type="button">
        <span class="route-path" style="word-break:break-all">${routePath}</span>
      </a>
    </div>
  </li>
`;
}

function getUrl(routePath) {
  if (routePath.startsWith('http')) return routePath;

  if (!routePath?.trim().length) return localhost;

  // remove optional params> ex : /posts/:id? -> /posts/,  /posts/:id/comments -> /posts/1/comments
  let validRoutePath = routePath
    .split('/')
    .map((r) => (r.indexOf(':') >= 0 ? (r.indexOf('?') >= 0 ? '' : random(1, 100)) : r))
    .join('/');
  validRoutePath = validRoutePath.replace(/\/$/gi, ''); // removing trailing slash. ex: /posts/ -> /posts

  const url = localhost + validRoutePath;

  return url;
}

async function setIframeData($event, $this, routePath) {
  // If on ctrl+click or cmd+click then open the link in new tab
  if ($event.ctrlKey || $event.metaKey) {
    const url = getUrl(routePath);
    window.open(url, '_blank');
    return;
  }

  try {
    clearActiveLink();
    $this.parentNode.classList.add('active');
    try {
      $iframeData.contentWindow.document.open();
      $iframeData.contentWindow.document.close();
    } catch {}
    $frameLoader.style.display = 'grid';
    $dataContainer.style.display = 'block';
    setIFrameSrc(routePath);
  } catch (err) {
    console.error(err);
  }
}

function clearActiveLink() {
  const li = $resourcesList.querySelectorAll('li .header');
  for (let i = 0; i < li.length; i++) {
    li[i].classList.remove('active');
  }
}

function setIFrameSrc(routePath) {
  const url = getUrl(routePath);
  if (routePath?.trim().length) {
    $resourceRedirect.href = url;
    $iframeUrl.value = url;
    $iframeData.src = url;
    $download.href = url;
  } else {
    $resourceRedirect.href = url;
    $iframeUrl.value = url;
    $iframeData.src = '';
    $download.href = '';
  }
}

function filterRoutes() {
  let searchText, routePath, i, txtValue;
  searchText = $search.value.toUpperCase();
  routePath = $resourcesList.querySelectorAll('.route-path');
  filteredRoutesCount = 0;
  for (i = 0; i < routePath.length; i++) {
    txtValue = routePath[i].textContent || routePath[i].innerText;
    if (txtValue.toUpperCase().indexOf(searchText) > -1) {
      routePath[i].parentNode.parentNode.parentNode.style.display = 'block';
      filteredRoutesCount++;
    } else {
      routePath[i].parentNode.parentNode.parentNode.style.display = 'none';
    }
  }
  setRoutesCount(totalRoutesCount, filteredRoutesCount, searchText);
  showNoResource(!filteredRoutesCount);
}

function setRoutesCount(totalRoutesCount, filteredRoutesCount, searchText) {
  const count = searchText?.length ? `${filteredRoutesCount} / ${totalRoutesCount}` : totalRoutesCount;
  $resourcesCount.innerHTML = count;
}

function showNoResource(show) {
  document.getElementById('no-resource').style.display = show ? 'block' : 'none';
}

async function resetAll() {
  resources = await request(localhost + '/_reset');
  showToast('Routes Restored Successfully');
  createResourcesList(resources);
}

init();
