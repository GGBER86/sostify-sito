/* Sostify · invio form via Netlify Forms (AJAX, resta sulla pagina) */
window.sostifySubmit = function (form, ev) {
  if (ev) ev.preventDefault();
  var data = new FormData(form);
  fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(data).toString()
  }).catch(function () { /* anteprima locale: ignora */ })
    .finally(function () {
      var m = form.querySelector('.msg');
      if (m) m.style.display = 'block';
      form.querySelectorAll('input,select,textarea,button').forEach(function (el) { el.disabled = true; });
      if (m && m.scrollIntoView) m.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  return false;
};
