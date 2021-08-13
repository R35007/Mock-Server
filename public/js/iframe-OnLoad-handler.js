function onIframeLoadHandler($event) {
  try {
    document.getElementById("iframe-loader").style.display = "none";
    let $iframeDocument = $event.contentWindow.document;
    if ($iframeDocument) {
      $iframeDocument.body.style.color = "#dcdcdc";
      $iframeDocument.body.style.margin = "0";
      $iframeDocument.body.style.fontFamily = "calibri";

      $iframeDocument.body.style.fontSize = urlParams?.get("_dataFontSize") ?? "1.1rem";
      $iframeDocument.body.style.lineHeight = urlParams?.get("_dataLineHeight") ?? "1.4";
      $iframeDocument.body.style.padding = urlParams?.get("_dataPadding") ?? "1.3rem";

      const pre = $iframeDocument.body.getElementsByTagName("pre");
      if (pre && pre[0]) {
        pre[0].style.margin = "0";
        pre[0].style.fontFamily = "calibri";
      }
    }
  } catch (error) {
    console.warn(error);
  }
}