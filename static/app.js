
// Mini‑ERP estático — localStorage
(function () {
  const STORAGE_KEY = 'miniERP_DB_v1';
  const APP = {};
  window.APP = APP;

  const initialData = {
    nextId: { category:4, subcategory:6, region:4, country:5, provider:1, comment:1, tender:1, tenderProvider:1 },
    categories: [
      {id:1, name:"Construcción"},
      {id:2, name:"Tecnología"},
      {id:3, name:"Servicios"},
    ],
    subcategories: [
      {id:1, category_id:1, name:"Materiales"},
      {id:2, category_id:1, name:"Maquinaria"},
      {id:3, category_id:2, name:"Software"},
      {id:4, category_id:2, name:"Hardware"},
      {id:5, category_id:3, name:"Consultoría"},
    ],
    regions: [
      {id:1, name:"América del Sur"},
      {id:2, name:"América del Norte"},
      {id:3, name:"Europa"},
    ],
    countries: [
      {id:1, region_id:1, name:"Chile"},
      {id:2, region_id:1, name:"Argentina"},
      {id:3, region_id:2, name:"Estados Unidos"},
      {id:4, region_id:3, name:"España"},
    ],
    providers: [],
    comments: [],
    tenders: [],
    tenderProviders: [],
  };

  function loadDB(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw){ localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData)); return structuredClone(initialData); }
      const parsed = JSON.parse(raw);
      if(!parsed.nextId){ parsed.nextId = structuredClone(initialData.nextId); }
      return parsed;
    }catch(e){
      console.error("Error loading DB, resetting.", e);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      return structuredClone(initialData);
    }
  }
  function saveDB(db){ localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }
  function resetDB(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData)); }
  APP.resetDB = resetDB; APP.load = loadDB; APP.save = saveDB;

  function fmtDate(d){ try{ return new Date(d).toLocaleDateString('es-CL'); } catch{ return d || '-'; } }
  function getById(arr, id){ return arr.find(x=>x.id===id); }
  function catName(db, id){ return getById(db.categories, id)?.name || '-'; }
  function subName(db, id){ return getById(db.subcategories, id)?.name || '-'; }
  function regName(db, id){ return getById(db.regions, id)?.name || '-'; }
  function countryName(db, id){ return getById(db.countries, id)?.name || '-'; }
  APP.lookup = { catName, subName, regName, countryName, fmtDate };

  APP.initIndexPage = function(){
    const db = loadDB();
    const elProv = document.getElementById('statProviders');
    const elTender = document.getElementById('statTenders');
    const elAssigned = document.getElementById('statAssigned');
    if(elProv) elProv.textContent = db.providers.length;
    if(elTender) elTender.textContent = db.tenders.length;
    if(elAssigned) elAssigned.textContent = db.tenderProviders.length;
  };

  APP.initProvidersPage = function(){
    const db = loadDB();

    const form = document.getElementById('providerForm');
    const selCat = document.getElementById('providerCategory');
    const selSub = document.getElementById('providerSubcategory');
    const selReg = document.getElementById('providerRegion');
    const selCtry = document.getElementById('providerCountry');
    const phone = document.getElementById('providerPhone');
    const name = document.getElementById('providerName');

    function fillCatSelects(){
      selCat.innerHTML = '<option value="">Seleccionar...</option>';
      db.categories.forEach(c=> selCat.innerHTML += `<option value="${c.id}">${c.name}</option>`);
    }
    function fillSubByCat(){
      const id = parseInt(selCat.value);
      selSub.innerHTML = '<option value="">Seleccionar...</option>';
      if(id){ db.subcategories.filter(s=>s.category_id===id).forEach(s=> selSub.innerHTML += `<option value="${s.id}">${s.name}</option>`); }
    }
    function fillRegSelects(){
      selReg.innerHTML = '<option value="">Seleccionar...</option>';
      db.regions.forEach(r=> selReg.innerHTML += `<option value="${r.id}">${r.name}</option>`);
    }
    function fillCountryByRegion(){
      const id = parseInt(selReg.value);
      selCtry.innerHTML = '<option value="">Seleccionar...</option>';
      if(id){ db.countries.filter(c=>c.region_id===id).forEach(c=> selCtry.innerHTML += `<option value="${c.id}">${c.name}</option>`); }
    }

    selCat.addEventListener('change', fillSubByCat);
    selReg.addEventListener('change', fillCountryByRegion);

    fillCatSelects(); fillRegSelects();

    form.addEventListener('submit', function(e){
      e.preventDefault();
      const provider = {
        id: db.nextId.provider++,
        name: name.value.trim(),
        category_id: parseInt(selCat.value),
        subcategory_id: parseInt(selSub.value),
        country_id: parseInt(selCtry.value),
        phone_number: phone.value.trim(),
        created_at: new Date().toISOString(),
      };
      if(!provider.name || !provider.category_id || !provider.subcategory_id || !provider.country_id || !provider.phone_number){
        return alert('Completa todos los campos obligatorios.');
      }
      db.providers.push(provider); saveDB(db);
      renderProviders();
      form.reset(); selSub.innerHTML = '<option value="">Seleccionar...</option>'; selCtry.innerHTML = '<option value="">Seleccionar...</option>';
      alert('Proveedor agregado exitosamente');
    });

    function renderProviders(){
      const tbody = document.getElementById('providersBody');
      tbody.innerHTML = '';
      db.providers.forEach(p=>{
        tbody.innerHTML += `
          <tr>
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td><span class="badge badge-info">${catName(db, p.category_id)}</span></td>
            <td><span class="badge badge-success">${subName(db, p.subcategory_id)}</span></td>
            <td>${countryName(db, p.country_id)}</td>
            <td>${p.phone_number}</td>
            <td class="actions">
              <button class="btn btn-primary" data-action="comments" data-id="${p.id}">💬</button>
              <button class="btn btn-danger" data-action="delete" data-id="${p.id}">🗑️</button>
            </td>
          </tr>`;
      });
    }
    renderProviders();

    const search = document.getElementById('providerSearch');
    search.addEventListener('keyup', function(){
      const rows = document.querySelectorAll('#providersBody tr');
      const q = search.value.toLowerCase();
      rows.forEach(r => r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none');
    });

    document.getElementById('providersTable').addEventListener('click', function(e){
      const btn = e.target.closest('button'); if(!btn) return;
      const id = parseInt(btn.getAttribute('data-id'));
      const action = btn.getAttribute('data-action');
      if(action==='delete'){
        if(confirm('¿Eliminar proveedor?')){
          db.providers = db.providers.filter(x=>x.id!==id);
          db.comments = db.comments.filter(c=>c.provider_id!==id);
          db.tenderProviders = db.tenderProviders.filter(tp=>tp.provider_id!==id);
          saveDB(db); renderProviders();
        }
      }else if(action==='comments'){
        showComments(id);
      }
    });

    const modal = document.getElementById('commentsModal');
    const modalBody = document.getElementById('commentsModalBody');
    function showComments(providerId){
      const p = db.providers.find(x=>x.id===providerId);
      const comments = db.comments.filter(c=>c.provider_id===providerId);
      let html = `<h4>${p?.name||'Proveedor'}</h4>
        <div class="form-group" style="margin-top:8px;">
          <textarea id="newComment" placeholder="Agregar comentario..."></textarea>
          <button class="btn btn-primary" id="btnAddComment" style="margin-top:10px;">Agregar Comentario</button>
        </div>
        <div style="margin-top:16px;">`;
      comments.forEach(c=>{
        const date = new Date(c.created_at).toLocaleString('es-CL');
        html += `<div class="card" style="border-left-color:#0c5460;">
          <p>${c.comment}</p>
          <p class="small">📅 ${date}</p>
        </div>`;
      });
      html += `</div>`;
      modalBody.innerHTML = html;
      modal.classList.add('active');

      document.getElementById('btnAddComment').onclick = function(){
        const txt = document.getElementById('newComment').value.trim();
        if(!txt) return;
        db.comments.push({ id: db.nextId.comment++, provider_id: providerId, comment: txt, created_at: new Date().toISOString() });
        saveDB(db);
        showComments(providerId);
      };
    }
    document.getElementById('closeComments').addEventListener('click', ()=> modal.classList.remove('active'));
    window.addEventListener('click', (ev)=>{ if(ev.target.classList?.contains('modal')) modal.classList.remove('active'); });
  };

  APP.initTendersPage = function(){
    const db = loadDB();

    const form = document.getElementById('tenderForm');
    const name = document.getElementById('tenderName');
    const start = document.getElementById('tenderStartDate');
    const end = document.getElementById('tenderEndDate');
    const desc = document.getElementById('tenderDescription');

    form.addEventListener('submit', function(e){
      e.preventDefault();
      const tender = {
        id: db.nextId.tender++,
        name: name.value.trim(),
        description: (desc.value||'').trim(),
        start_date: start.value,
        end_date: end.value,
      };
      if(!tender.name || !tender.start_date || !tender.end_date){
        return alert('Completa los campos obligatorios.');
      }
      db.tenders.push(tender);
      saveDB(db);
      renderTenders();
      form.reset();
      alert('Licitación creada exitosamente');
    });

    function renderTenders(){
      const tbody = document.getElementById('tendersBody');
      tbody.innerHTML = '';
      db.tenders.forEach(t=>{
        const providerCount = db.tenderProviders.filter(tp=>tp.tender_id===t.id).length;
        tbody.innerHTML += `
          <tr>
            <td>${t.id}</td>
            <td>${t.name}</td>
            <td>${t.description || '-'}</td>
            <td>${fmtDate(t.start_date)}</td>
            <td>${fmtDate(t.end_date)}</td>
            <td><span class="badge badge-info">${providerCount} proveedor(es)</span></td>
            <td class="actions">
              <button class="btn btn-primary" data-action="assign" data-id="${t.id}">➕ Proveedores</button>
              <button class="btn btn-danger" data-action="delete" data-id="${t.id}">🗑️</button>
            </td>
          </tr>`;
      });
    }
    renderTenders();

    const search = document.getElementById('tenderSearch');
    search.addEventListener('keyup', function(){
      const rows = document.querySelectorAll('#tendersBody tr');
      const q = search.value.toLowerCase();
      rows.forEach(r => r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none');
    });

    document.getElementById('tendersTable').addEventListener('click', function(e){
      const btn = e.target.closest('button'); if(!btn) return;
      const id = parseInt(btn.getAttribute('data-id'));
      const action = btn.getAttribute('data-action');
      if(action==='delete'){
        if(confirm('¿Eliminar licitación?')){
          db.tenders = db.tenders.filter(x=>x.id!==id);
          db.tenderProviders = db.tenderProviders.filter(tp=>tp.tender_id!==id);
          saveDB(db);
          renderTenders();
        }
      }else if(action==='assign'){
        showAssignModal(id);
      }
    });

    const modal = document.getElementById('assignModal');
    const modalBody = document.getElementById('assignModalBody');
    const closeAssign = document.getElementById('closeAssign');
    closeAssign.addEventListener('click', ()=> modal.classList.remove('active'));
    window.addEventListener('click', (ev)=>{ if(ev.target.classList?.contains('modal')) modal.classList.remove('active'); });

    function showAssignModal(tenderId){
      const tender = db.tenders.find(t=>t.id===tenderId);
      const assigned = db.tenderProviders.filter(tp=>tp.tender_id===tenderId).map(x=>x.provider_id);
      let html = `<h4>${tender?.name || 'Licitación'}</h4><div class="provider-list">`;
      if(db.providers.length===0){
        html += `<div class="card">Aún no hay proveedores. Crea algunos en <a href="./providers.html">Proveedores</a>.</div>`;
      }
      db.providers.forEach(p=>{
        const isAssigned = assigned.includes(p.id);
        const cat = catName(db, p.category_id);
        html += `<div class="provider-item">
          <div>
            <strong>${p.name}</strong><br><span class="small">${cat}</span>
          </div>
          <button class="btn ${isAssigned ? 'btn-danger':'btn-primary'}" data-action="toggle" data-pid="${p.id}" data-tid="${tenderId}">
            ${isAssigned ? '❌ Quitar' : '✅ Asignar'}
          </button>
        </div>`;
      });
      html += `</div>`;
      modalBody.innerHTML = html;
      modal.classList.add('active');
    }

    document.getElementById('assignModal').addEventListener('click', function(e){
      const btn = e.target.closest('button'); if(!btn) return;
      if(btn.getAttribute('data-action')!=='toggle') return;
      const providerId = parseInt(btn.getAttribute('data-pid'));
      const tenderId = parseInt(btn.getAttribute('data-tid'));
      const idx = db.tenderProviders.findIndex(tp=>tp.tender_id===tenderId && tp.provider_id===providerId);
      if(idx>=0){ db.tenderProviders.splice(idx,1); }
      else{ db.tenderProviders.push({ id: db.nextId.tenderProvider++, tender_id: tenderId, provider_id: providerId }); }
      saveDB(db);
      showAssignModal(tenderId);
    });
  };

  APP.initSettingsPage = function(){
    const db = loadDB();
    const newCategory = document.getElementById('newCategory');
    const btnAddCategory = document.getElementById('btnAddCategory');
    const catForSub = document.getElementById('categoryForSubcategory');
    const newSub = document.getElementById('newSubcategory');
    const btnAddSub = document.getElementById('btnAddSubcategory');

    const newRegion = document.getElementById('newRegion');
    const btnAddRegion = document.getElementById('btnAddRegion');
    const regForCountry = document.getElementById('regionForCountry');
    const newCountry = document.getElementById('newCountry');
    const btnAddCountry = document.getElementById('btnAddCountry');

    const btnReset = document.getElementById('btnResetDB');

    function fillCat(){
      catForSub.innerHTML = '<option value="">Seleccionar...</option>';
      db.categories.forEach(c=> catForSub.innerHTML += `<option value="${c.id}">${c.name}</option>`);
      renderCatList(); renderSubList();
    }
    function fillReg(){
      regForCountry.innerHTML = '<option value="">Seleccionar...</option>';
      db.regions.forEach(r=> regForCountry.innerHTML += `<option value="${r.id}">${r.name}</option>`);
      renderRegList(); renderCountryList();
    }
    function renderCatList(){
      const ul = document.getElementById('catList'); ul.innerHTML='';
      db.categories.forEach(c=>{ ul.innerHTML += `<li>${c.name}</li>`; });
    }
    function renderSubList(){
      const ul = document.getElementById('subList'); ul.innerHTML='';
      db.subcategories.forEach(s=>{ ul.innerHTML += `<li>${s.name} <span class="small">(${catName(db, s.category_id)})</span></li>`; });
    }
    function renderRegList(){
      const ul = document.getElementById('regList'); ul.innerHTML='';
      db.regions.forEach(r=>{ ul.innerHTML += `<li>${r.name}</li>`; });
    }
    function renderCountryList(){
      const ul = document.getElementById('countryList'); ul.innerHTML='';
      db.countries.forEach(c=>{ ul.innerHTML += `<li>${c.name} <span class="small">(${regName(db, c.region_id)})</span></li>`; });
    }

    btnAddCategory.addEventListener('click', function(){
      const name = newCategory.value.trim(); if(!name) return;
      db.categories.push({ id: db.nextId.category++, name });
      saveDB(db); newCategory.value=''; fillCat(); alert('Categoría agregada');
    });
    btnAddSub.addEventListener('click', function(){
      const catId = parseInt(catForSub.value); const name = newSub.value.trim();
      if(!catId || !name) return alert('Selecciona categoría y escribe un nombre.');
      db.subcategories.push({ id: db.nextId.subcategory++, category_id: catId, name });
      saveDB(db); newSub.value=''; renderSubList(); alert('Subcategoría agregada');
    });
    btnAddRegion.addEventListener('click', function(){
      const name = newRegion.value.trim(); if(!name) return;
      db.regions.push({ id: db.nextId.region++, name });
      saveDB(db); newRegion.value=''; fillReg(); alert('Región agregada');
    });
    btnAddCountry.addEventListener('click', function(){
      const rid = parseInt(regForCountry.value); const name = newCountry.value.trim();
      if(!rid || !name) return alert('Selecciona región y escribe un país.');
      db.countries.push({ id: db.nextId.country++, region_id: rid, name });
      saveDB(db); newCountry.value=''; renderCountryList(); alert('País agregado');
    });

    btnReset.addEventListener('click', function(){
      if(confirm('Esto restablecerá los datos de ejemplo y borrará tus cambios. ¿Continuar?')){
        resetDB(); alert('Datos reiniciados.');
        location.reload();
      }
    });

    fillCat(); fillReg();
  };

})();