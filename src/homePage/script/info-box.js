
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
  $li.appendChild(
    parseHTML(`
    <div class="info-box position-relative overflow=hidden">
      <div class="actions justify-content-end p-2 position-absolute" style="display: ${routeConfig._isDefault ? 'none' : 'flex'}">
        <button type="button" class="btn btn-outline-primary box-shadow-none btn-sm" onclick="reset('${routeConfig._id}')">Reset</button>
        <button type="button" class="btn btn-outline-primary box-shadow-none btn-sm mx-2" onclick="openModal(this)" data-type="update" data-id="${routeConfig._id}">Edit</button>
        <button type="button" class="btn btn-outline-primary box-shadow-none btn-sm" onclick="refresh('${routeConfig._id}')">Refresh</button>
      </div>
      <div class="route-config">${Object.entries(routeConfig).map(([key, val]) => getKeyVal(routeConfig._id, key, val)).join("")}</div>
    </div>`)
  );
}

async function reset(_id) {
  const resetedRoutes = await window.fetch(localhost + "/reset/route/" + _id).then((res) => res.json());
  const [routePath, routeConfig] = Object.entries(resetedRoutes)[0];
  resources[routePath] = routeConfig
  toggleInfoBox(_id);
  toggleInfoBox(_id);
  showToast(`${routePath} Resetted Sucessfully`);
}

async function refresh(_id) {
  const refreshedRoute = await window.fetch(localhost + "/routes/" + _id).then((res) => res.json());
  const [routePath, routeConfig] = Object.entries(refreshedRoute)[0];
  resources[routePath] = routeConfig;
  toggleInfoBox(_id);
  toggleInfoBox(_id);
  showToast(`${routePath} Refreshed Sucessfully`);
}

function getKeyVal(id, key, val) {
  if (!(val + '')?.length || val === null || val === undefined) return '';

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