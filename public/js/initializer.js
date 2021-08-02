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
const $frameborder = document.getElementById("iframe-loader");
const $iframeData = document.getElementById("iframe-data");
const $download = document.getElementById("download");
const $routeModal = document.getElementById("routeModal");
const $modalTitle = document.getElementById("modal-title");
const $routeConfigForm = document.getElementById("route-config-form");
const $routeConfig = document.getElementById("routeConfig");
const $formError = document.getElementById("form-error");
const $toast = document.getElementById("toast");

let $routeBsModal;
let $bsToast;

try{
  $routeBsModal = new bootstrap.Modal($routeModal);
  $bsToast = new bootstrap.Toast($toast, { animation: true, delay: 2000 });
}catch{
  $routeBsModal = {};
  $bsToast = {};
}