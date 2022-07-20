
function toggleInfoBox(id) {
  const $li = document.getElementById(id);
  const classList = $li.classList;
  classList.contains("expanded") ? hideInfoBox($li) : showInfoBox($li, id);
}

function hideInfoBox($li) {
  $li.classList.remove("expanded");
  $li.removeChild($li.lastElementChild);
}

function showInfoBox($li, id) {
  const [_routePath, routeConfig] = findEntry(id);

  $li.classList.add("expanded");
  $li.appendChild(
    parseHTML(`
    <div class="info-box position-relative overflow=hidden">
      <div id="loader-${id.replace(/\=/g, "")}" class="backdrop d-none">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div class="route-config p-1">${fieldSet(routeConfig, routeConfig.id)}</div>
      <div class="actions justify-content-end p-2" style="display: ${routeConfig._isDefault ? 'none' : 'flex'}">
        <span role="button" class="px-2 pe-1 action-icon" title="reset" onclick="reset('${routeConfig.id}')"><i class="fas fa-undo"></i></span>
        <span role="button" class="px-2 pe-1 action-icon" title="edit" onclick="openModal(this)" data-type="update" data-id="${routeConfig.id}"><i class="fas fa-pen"></i></span>
        <span role="button" class="px-2 pe-1 action-icon" title="clone" onclick="openModal(this)" data-type="clone" data-id="${routeConfig.id}"><i class="fas fa-clone"></i></span>
        <span role="button" class="px-2 pe-1 action-icon" title="refresh" onclick="refresh('${routeConfig.id}')"><i class="fas fa-sync-alt"></i></span>
      </div>
    </div>`
    )
  );
}

async function reset(id) {
  // show info box loader
  const $infoBoxLoader = document.querySelector(`.info-box #loader-${id.replace(/\=/g, "")}`);
  $infoBoxLoader.classList.remove("d-none");
  $infoBoxLoader.classList.add("d-block");

  const restoredRoutes = await window.fetch(localhost + "/_reset/db/" + id).then((res) => res.json());

  const [routePath, routeConfig] = Object.entries(restoredRoutes)[0];
  resources[routePath] = routeConfig
  toggleInfoBox(id);
  toggleInfoBox(id);
  showToast(`${routePath} Restored Successfully`);
}

async function refresh(id) {
  // show info box loader
  const $infoBoxLoader = document.querySelector(`.info-box #loader-${id.replace(/\=/g, "")}`);
  $infoBoxLoader.classList.remove("d-none");
  $infoBoxLoader.classList.add("d-block");

  const refreshedRoute = await window.fetch(localhost + "/_db/" + id).then((res) => res.json());

  const [routePath, routeConfig] = Object.entries(refreshedRoute)[0];
  resources[routePath] = routeConfig;
  toggleInfoBox(id);
  toggleInfoBox(id);
  showToast(`${routePath} Refreshed Successfully`);
}

function fieldSet(obj, id) {
  return Object.entries(orderRouteConfig(obj)).map(([key, val]) => {
    if (key === "fetchData" && Object.keys(val || {}).length) {
      return `
      <div class="row px-3">
          <label class="key col col-form-label p-0">
            <button class="btn btn-white fw-semibold border-0 p-0 shadow-none" type="button" 
            data-bs-toggle="collapse" data-bs-target="#id-${id.replace(/\=/g, "")}_${key}" 
            aria-expanded="false" aria-controls="id-${id.replace(/\=/g, "")}_${key}">
              ${key} <i class="fa-solid fa-caret-right"></i>
            </button>   
          </label>
          <div class="val col-12 collapse ps-0" id="id-${id.replace(/\=/g, "")}_${key}">${fieldSet(val, id)}</div>
      </div>`
    } else {
      return getKeyVal(key, val, id);
    }
  }).join("")
}

// Todo: Need to optimize the code
function getKeyVal(key, val, id) {
  if ((!['mock', 'response'].includes(key) && !(val + '')?.length) || val === null || val === undefined || key === "_config") return '';

  if (!ObjectKeys.includes(key) && Array.isArray(val) && val.every(v => typeof v === "string")) {
    if (!['mock', 'response'].includes(key) && !val.length) return '';
    return `
      <div class="row px-3">
        <label class="key col col-form-label p-0">${key} :</label>
        <div class="val col d-flex flex-wrap align-items-center" style="grid-gap:.5rem">
        ${getBadges(val).join("")}
        </div>
      </div>`;
  } else if (typeof val === "object" || ObjectKeys.includes(key)) {
    if (!['mock', 'response'].includes(key) && !Object.keys(val).length) return ''
    if ((val + "").trim().match(/<img(.*)>$/)) {
      return `
      <div class="row px-3">
        <label class="key col col-form-label p-0">${key} :</label>
        <div class="val col">
          <div class="img">${val}</div>
        </div>
      </div>`;
    }
    return `
    <div class="row px-3">
      <label class="key col col-form-label p-0 w-100" style="max-width: 100%">
        <button class="btn btn-white fw-semibold border-0 p-0 shadow-none" type="button" 
        data-bs-toggle="collapse" data-bs-target="#id-${id.replace(/\=/g, "")}_${key}" 
        aria-expanded="false" aria-controls="id-${id.replace(/\=/g, "")}_${key}">
          ${key} <i class="fa-solid fa-caret-right"></i>
        </button>  
      </label>
      <div class="val col-12 collapse p-0 mt-2 position-relative" id="id-${id.replace(/\=/g, "")}_${key}">
        <span id="fetch-badge" style="top: -1.8rem; right: 1rem;" class="position-absolute badge bg-secondary ms-4">${typeof val === 'object' ? "JSON" : "STRING"}</span>
        <textarea class="form-control" rows="5">${typeof val === 'object' ? JSON.stringify(val, null, 2) : val}</textarea>
      </div>
    </div>`;
  } else if ((val + "").indexOf("<img") >= 0) {
    return `
    <div class="row px-3">
      <label class="key col col-form-label p-0">${key} :</label>
      <div class="val col">
        <div class="img">${val}</div>
      </div>
    </div>`;
  } else {
    if (!(val + "").trim().length) return '';
    return `
      <div class="row px-3">
        <label class="key col col-form-label p-0">${key} :</label>
        <div class="val col">${val}</div>
      </div>`;
  }
}

const ObjectKeys = ["fetch", "mock", "fetchData", "fetchError", "store", "_request", "stack", "response"];