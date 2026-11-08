const explore = document.querySelector('.workspace-more');
const compact = matchMedia('(max-width: 999px)');

function arrangeNavigation() {
  explore.open = !compact.matches;
}

arrangeNavigation();
compact.addEventListener('change', arrangeNavigation);
