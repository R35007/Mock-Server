let availableRoutesCount = 0;
let filteredRoutesCount = 0;

function filterRoutes() {
  let input, filter, ul, li, a, i, txtValue;
  input = document.getElementById("search");
  filter = input.value.toUpperCase();
  ul = document.getElementById("resources-list");
  li = ul.getElementsByTagName("li");
  filteredRoutesCount = 0;
  for (i = 0; i < li.length; i++) {
    a = li[i].getElementsByTagName("a")[0];
    txtValue = a.textContent || a.innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "block";
      isEmpty = false;
      filteredRoutesCount++;
    } else {
      li[i].style.display = "none";
    }
  }
  setRoutesCount(availableRoutesCount, filteredRoutesCount);
  if (filteredRoutesCount) {
    FoundResources();
  } else {
    NoResources();
  }
}

function setIframe(e, route) {
  const li = document.querySelectorAll("ul#resources-list li");
  for (let i = 0; i < li.length; i++) {
    li[i].classList.remove("active");
  }

  e.parentNode.className = "active";
  document.getElementById("loader").style.display = "block";
  document.getElementById("resource-iframe").src = route;
}

function ResourceItem(name) {
  return `
  <li>
    <a onclick="setIframe(this,'${name}')">${name}</a>
  </li>
`;
}

function ResourceList(routesList) {
  const defaultRoutes = ["/routes", "/globals", "/routesList"].filter(
    (r) => routesList.indexOf(r) < 0
  );
  document.getElementById("resource-iframe").src = routesList[0];

  const availableRoutes = [...routesList, ...defaultRoutes];
  availableRoutesCount = availableRoutes.length;
  filteredRoutesCount = availableRoutes.length;
  setRoutesCount(availableRoutesCount, filteredRoutesCount);
  return `
  <ul id="resources-list">
    ${availableRoutes.map((name) => ResourceItem(name)).join("")}
  </ul>
`;
}

function NoResources() {
  document.getElementById("resources-list").style.display = "none";
  document.getElementById("iframe-wrapper").style.display = "none";
  document.getElementById("noresources").style.display = "block";
  return "";
}

function FoundResources() {
  document.getElementById("resources-list").style.display = "block";
  document.getElementById("iframe-wrapper").style.display = "block";
  document.getElementById("noresources").style.display = "none";
  return "";
}

function setRoutesCount(availableRoutesCount, filteredRoutesCount) {
  const countsString =
    availableRoutesCount === filteredRoutesCount
      ? availableRoutesCount
      : `${filteredRoutesCount} / ${availableRoutesCount}`;

  document.getElementById("routes-count").innerHTML = countsString;
}

function ResourcesBlock(routesList) {
  return routesList.length ? ResourceList(routesList) : NoResources();
}

window
  .fetch("routesList")
  .then((response) => response.json())
  .then(
    (routesList) =>
      (document.getElementById("resources-list").innerHTML += ResourcesBlock(
        routesList
      ))
  );
