
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
  const hideActions = routeConfig?._default || routeConfig.directUse;
  window.routeConfig = routeConfig;

  $li.classList.add("expanded");
  $li.appendChild(
    parseHTML(`
    <div class="info-box position-relative overflow=hidden">
      <div id="loader-${id.replace(/\=/g, "")}" class="backdrop d-none">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div class="route-config p-1">${fieldSet(routeConfig, routeConfig)}</div>
      ${hideActions ? "" :
        `<div class="actions justify-content-end p-2" style="display: flex">
          <span role="button" class="px-2 pe-1 action-icon" title="reset" onclick="reset('${routeConfig.id}')"><i>Reset</i></span>
          <span role="button" class="px-2 pe-1 action-icon" title="edit" onclick="openModal(this)" data-type="update" data-id="${routeConfig.id}"><i>Edit</i></span>
          <span role="button" class="px-2 pe-1 action-icon" title="clone" onclick="openModal(this)" data-type="clone" data-id="${routeConfig.id}"><i>Clone</i></span>
          <span role="button" class="px-2 pe-1 action-icon" title="refresh" onclick="refresh('${routeConfig.id}')"><i>Refresh</i></span>
        </div>`
      }
    </div>`
    )
  );
}

async function reset(id) {
  // show info box loader
  const $infoBoxLoader = document.querySelector(`.info-box #loader-${id.replace(/\=/g, "")}`);
  $infoBoxLoader.classList.remove("d-none");
  $infoBoxLoader.classList.add("d-block");

  const restoredRoutes = await window.fetch(localhost + "/_reset/" + id).then((res) => res.json());

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

function fieldSet(obj, routeConfig) {
  const id = routeConfig.id
  return Object.entries(orderRouteConfig(obj)).map(([key, val]) => {
    if (key === "fetchData" && Object.keys(val || {}).length) {
      return `
      <div class="row px-3">
          <label class="key col col-form-label p-0">
            <button class="btn btn-white fw-semibold border-0 p-0 shadow-none" type="button" 
            data-bs-toggle="collapse" data-bs-target="#id-${id.replace(/\=/g, "")}_${key}" 
            aria-expanded="false" aria-controls="id-${id.replace(/\=/g, "")}_${key}">
              ${key} ▸
            </button>   
          </label>
          <div class="val col-12 collapse ps-0" id="id-${id.replace(/\=/g, "")}_${key}">${fieldSet(val, routeConfig)}</div>
      </div>`
    } else {
      return getKeyVal(key, val, routeConfig);
    }
  }).join("")
}

function getKeyVal(key, val, routeConfig) {
  const id = routeConfig.id;

  // Return if key is _default or _config
  if (key === "_default" || key === "_config") return '';

  // Return if val is empty
  if (typeof val === "undefined"
    || val === null
    || (typeof val === "string" && !val.trim().length)) return '';

  // Create a badges if the value is a array of string
  if (Array.isArray(val) && val.every(v => typeof v === "string")) {
    return `
      <div class="row px-3">
        <label class="key col col-form-label p-0">${key} :</label>
        <div class="val col d-flex flex-wrap align-items-center" style="grid-gap:.5rem">
        ${getBadges(val).join("")}
        </div>
      </div>`;
  }

  if (typeof val === "object" && !Array.isArray(val) && val.type === "Buffer" && routeConfig._request?.url) {
    return `
    <div class="row px-3">
      <label class="key col col-form-label p-0">${key} :</label>
      <div class="val col">
        <div class="img"><img src="${routeConfig._request.url}" /></div>
      </div>
    </div>`;
  }

  // Show values in Textarea if Key is one of Textarea field or the value is a array or object
  if (textAreaKeys.includes(key) || typeof val === "object") {
    return `
    <div class="row px-3">
      <label class="key col col-form-label p-0 w-100" style="max-width: 100%">
        <button class="btn btn-white fw-semibold border-0 p-0 shadow-none" type="button" 
        data-bs-toggle="collapse" data-bs-target="#id-${id.replace(/\=/g, "")}_${key}" 
        aria-expanded="false" aria-controls="id-${id.replace(/\=/g, "")}_${key}">
          ${key} ▸
        </button>  
      </label>
      <div class="val col-12 collapse p-0 mt-2 position-relative" id="id-${id.replace(/\=/g, "")}_${key}">
        <span style="top: -1.8rem; right: 1rem;" class="position-absolute badge bg-secondary ms-4">${typeof val === 'object' ? "JSON" : "STRING"}</span>
        <textarea class="form-control" rows="5">${typeof val === 'object' ? JSON.stringify(val, null, 2) : val}</textarea>
      </div>
    </div>`;
  }

  return `
    <div class="row px-3">
      <label class="key col col-form-label p-0">${key} :</label>
      <div class="val col">${val}</div>
    </div>`;
}

const textAreaKeys = ["fetch", "mock", "response", "store", "_request", "stack"];
