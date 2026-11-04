// Opens a collapsed section when its link or the URL hash points to it.
(function(){function openHash(){var id=location.hash.slice(1);if(!id)return;var d=document.getElementById(id);if(d&&d.tagName==="DETAILS"){d.open=true;}}
window.addEventListener("hashchange",openHash);openHash();
document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener("click",function(){var d=document.getElementById(a.getAttribute("href").slice(1));if(d&&d.tagName==="DETAILS")d.open=true;});});})();
