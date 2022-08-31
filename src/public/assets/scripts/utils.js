function getBadges(badgeList) {
  return badgeList.map(
    (badge) =>
      `<h6 class="m-0">
        <span class="badge bg-secondary fw-normal">${badge}</span>
      </h6>`
  );
}

function parseHTML(html) {
  var t = document.createElement("template");
  t.innerHTML = html;
  return t.content;
}

function findEntry(id) {
  const route = Object.entries(resources).find(([_key, val]) => val.id == id);
  return route || [];
}

// Allow tab space inside textarea
function allowTabSpaces($event, $textarea) {
  if ($event.key == 'Tab') {
    $event.preventDefault();
    var start = $textarea.selectionStart;
    var end = $textarea.selectionEnd;

    // set textarea value to: text before caret + tab + text after caret
    $textarea.value = $textarea.value.substring(0, start) +
      "\t" + $textarea.value.substring(end);

    // put caret at right position again
    $textarea.selectionStart =
      $textarea.selectionEnd = start + 1;
  }
};

function showToast(message) {
  $toast.querySelector(".toast-body").textContent = message;
  $bsToast?.show?.();
}

function parseJson(data) {
  let parsedData;
  try {
    parsedData = JSON.parse(data || '');
  } catch {
    parsedData = data?.trim();
  }
  return parsedData;
}

function orderRouteConfig(routeConfig) {
  const clonedRouteConfig = JSON.parse(JSON.stringify(routeConfig));
  const order = [
    "id",
    "description",
    "middlewares",
    "statusCode",
    "delay",
    "fetchCount",
    "skipFetchError",
    "mock",
    "fetch",
    "fetchError",
    "store",
    "fetchData",
    "status",
    "message",
    "isImage",
    "isError",
    "headers",
    "stack",
    "response",
    "_request",
    "_isFile",
    "_extension",
  ]

  const routeConfigKeys = Object.keys(routeConfig);
  routeConfigKeys.forEach(key => delete routeConfig[key]); // clearing all values in routeConfig

  const orderedKeys = new Set([...order, ...routeConfigKeys]);
  orderedKeys.forEach(key => routeConfig[key] = clonedRouteConfig[key]);

  return routeConfig;
}

function random(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function setFormDataType(name, type) {
  document.getElementById(`${name}-badge`).innerHTML = type;
}

function togglePageLoader(showLoader) {
  if (showLoader) {
    $pageLoader.classList.add("d-block");
    $pageLoader.classList.remove("d-none");
  } else {
    $pageLoader.classList.add("d-none");
    $pageLoader.classList.remove("d-block");
  }
}

async function request(url, options) {
  togglePageLoader(true);
  const response = await window.fetch(url, options).then((res) => res.json());
  togglePageLoader(false);
  return response;
}

// Lodash implementation of _.set method
const set = (obj, path, value) => {
  if (Object(obj) !== obj) return obj; // When obj is not an object
  // If not yet an array, get the keys from the string-path
  if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || []; 
  path.slice(0,-1).reduce((a, c, i) => // Iterate all of them except the last one
       Object(a[c]) === a[c] // Does the key exist and is its value an object?
           // Yes: then follow that path
           ? a[c] 
           // No: create the key. Is the next key a potential array-index?
           : a[c] = Math.abs(path[i+1])>>0 === +path[i+1] 
                 ? [] // Yes: assign a new array object
                 : {}, // No: assign a new plain object
       obj)[path[path.length-1]] = value; // Finally assign the value to the last key
  return obj; // Return the top-level object to allow chaining
};
