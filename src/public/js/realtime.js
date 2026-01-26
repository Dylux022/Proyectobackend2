const socket = io();

// Render simple
const list = document.getElementById('list');

function render(products){
  if (!Array.isArray(products) || !products.length) {
    list.innerHTML = '<p>No hay productos.</p>';
    return;
  }

  list.innerHTML = products.map(p => `
    <div class="card">
      <strong>${p.title}</strong> — $${p.price}
      <div><small>ID: ${p._id}</small></div>
      <div><small>Categoría: ${p.category ?? '-'}</small></div>
    </div>
  `).join('');
}

socket.on('products:update', render);
socket.on('products:error', msg => alert(msg));

// Form crear
const formAdd = document.getElementById('form-add');
formAdd.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(formAdd).entries());
  data.price = Number(data.price);
  data.stock = Number(data.stock);
  data.status = true;
  data.thumbnails = [];
  socket.emit('product:add', data);
  formAdd.reset();
});

// Form eliminar
const formDelete = document.getElementById('form-delete');
formDelete.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = new FormData(formDelete).get('id');
  socket.emit('product:delete', id);
  formDelete.reset();
});
