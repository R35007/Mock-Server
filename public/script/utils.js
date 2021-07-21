function getBadges(badgeList) {
  return badgeList.map(
    (badge) =>
      `<h6 class="m-0">
        <span class="badge bg-secondary">${badge}</span>
      </h6>`
  );
}

function parseHTML(html) {
  var t = document.createElement("template");
  t.innerHTML = html;
  return t.content;
}

function findEntry(_id) {
  const route =  Object.entries(resources).find(([_key, val]) => val._id == _id);
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
  $bsToast.show();
}

function parseJson(data) {
  let parsedData;
  try {
    parsedData = JSON.parse(data) || undefined;
  } catch {
    parsedData = data.trim() || undefined;
  }
  return parsedData;
}