// This script gets injected into any opened page
// whose URL matches the pattern defined in the manifest
// (see "content_script" key).

console.log("MirthEx active on this page.")

if (window.location.href == "https://online-go.com/play") {
  console.log('On Play page.');

  // TODO check state & disable buttons if necessary
}
