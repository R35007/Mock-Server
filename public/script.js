let routes = {};
let routesEntries = [];
let config = {};
let localhost = "http://localhost:3000";
let baseUrl = "";

let totalRoutesCount = 0;
let filteredRoutesCount = 0;

const $resourceHeader = document.getElementById("resource-header");
const $resourcesList = document.getElementById("resources-list");
const $resourcesCount = document.getElementById("resources-count");
const $search = document.getElementById("search");
const $loader = document.getElementById("loader");
const $data = document.getElementById("data");

async function init() {
  localhost = window.location.href.replace(/\/home.*/gi, "");

  config = await window.fetch(localhost + "/config").then((res) => res.json());
  routes = await window.fetch(localhost + "/routes").then((res) => res.json());
  baseUrl = config.baseUrl;

  routesEntries = Object.entries(routes).map(([key, val]) => {
    return [config.baseUrl + key, val];
  });

  const defaultRoutesEntries = ["/routesList", "/routes", "/config", "/store"]
    .filter((dr) => !Object.keys(routesEntries).includes(dr))
    .map((dr) => [dr, { isDefault: true, methods: ["GET"] }]);

  routesEntries = [...routesEntries, ...defaultRoutesEntries];

  serResourceHeader(localhost + baseUrl);

  $resourcesList.innerHTML += ResourceList(routesEntries);
  showNoResurce(!routesEntries.length);
}

function ResourceList(routesEntries) {
  totalRoutesCount = routesEntries.length;
  setRoutesCount(totalRoutesCount);
  return `
    ${routesEntries.map((routesEntry) => ResourceItem(...routesEntry)).join("")}
    ${NoResource()}
  `;
}

function NoResource() {
  return `
  <li id="no-resource" class="nav-item align-items-center mx-4 mt-1" style="display: none">
    <span class="nav-link p-2 px-3 me-3 d-block bg-dark text-light text-center">
      <span> No Resources Found</span>
    </span>
  </li>`;
}

function ResourceItem(routePath, routeConfig) {
  return `
  <li class="nav-item align-items-center w-100 mt-1" style="display: flex">
    <a class="nav-link p-2 px-3 me-2 d-block ${routeConfig.isDefault ? 'default' : ''}" onclick="setData(this,'${
      localhost + routePath
    }')" type="button">
      <span style="word-break:break-all">${routePath}</span>
    </a>
    <div class="d-flex align-items-center justify-content-end methods" style="max-width: 210px;">
      ${MethodsBadge(routeConfig.methods).join("")}
    </div> 
  </li>
`;
}

function MethodsBadge(methods) {
  const validMethods = getValidMethods(methods);
  return validMethods.map(
    (method) =>
      `<h6 class="m-1">
      <span class="badge bg-secondary">${method.toUpperCase()}</span>
    </h6>`
  );
}

function setRoutesCount(totalRoutesCount, filteredRoutesCount, searchText) {
  const count = searchText?.length
    ? `${filteredRoutesCount} / ${totalRoutesCount}`
    : totalRoutesCount;
  $resourcesCount.innerHTML = count;
}

async function setData($event, url) {
  clearActiveLink();
  $event.classList.add("active");

  $loader.style.display = "grid";
  serResourceHeader(url);
  const dataText = await window.fetch(url).then((response) => response.text())
  .catch(err => err);
  
  let dataStr;
  try {
    dataStr = JSON.stringify(JSON.parse(dataText), null, 2);
  } catch (err) {
    dataStr = dataText;
  }
  
  $data.innerText = dataStr.trim();
  $loader.style.display = "none";
}

function clearActiveLink() {
  const a = $resourcesList.querySelectorAll("li a");
  for (let i = 0; i < a.length; i++) {
    a[i].classList.remove("active");
  }
}

function serResourceHeader(url) {
  $resourceHeader.href = url;
  $resourceHeader.children[1].innerHTML = url;
}

function filterRoutes() {
  let searchText, a, i, txtValue;
  searchText = $search.value.toUpperCase();
  a = $resourcesList.querySelectorAll("li a");
  filteredRoutesCount = 0;
  for (i = 0; i < a.length; i++) {
    txtValue = a[i].textContent || a[i].innerText;
    if (txtValue.toUpperCase().indexOf(searchText) > -1) {
      a[i].parentNode.style.display = "flex";
      filteredRoutesCount++;
    } else {
      a[i].parentNode.style.display = "none";
    }
  }
  setRoutesCount(totalRoutesCount, filteredRoutesCount, searchText);
  showNoResurce(!filteredRoutesCount);
}

function getValidMethods(methods = []) {
  let valid_methods = methods
    .filter((m) =>
      [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
        "HEAD",
        "ALL",
      ].includes(m.toUpperCase())
    )
    .filter((m) => m !== "ALL");
  return valid_methods;
}

function showNoResurce(show) {
  document.getElementById("no-resource").style.display = show ? "flex" : "none";
}

init();
