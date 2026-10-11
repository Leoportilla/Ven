
/* Define o tema salvo antes do primeiro desenho da página: evita flash do tema padrão. */
(function(){try{var v=JSON.parse((window.AndroidDB&&AndroidDB.obter?AndroidDB.obter('ven_visual'):dbRaw.get('ven_visual'))||'{}');var t=v.theme==='dark'?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.dataset.accent=t==='dark'?'orange':'blue';}catch(e){document.documentElement.dataset.theme='light';document.documentElement.dataset.accent='blue';}})();

;

/* ===== alpha.2: armazenamento em SQLite (Android) com migração segura do localStorage ===== */
const dbRaw=(function(){
 const N=window.AndroidDB;
 const local={
  get:k=>localStorage.getItem(k),
  set:(k,v)=>{localStorage.setItem(k,v);return true},
  del:k=>localStorage.removeItem(k),
  tudo:()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}return o},
  substituir:o=>{localStorage.clear();Object.entries(o).forEach(([k,v])=>localStorage.setItem(k,v));return true},
  modo:'localStorage'
 };
 if(!N)return local;
 let cache;
 try{cache=JSON.parse(N.carregarTudo())}catch(e){return local}
 if(!cache||typeof cache!=='object')return local;
 const aviso=(m,t)=>setTimeout(()=>{try{notificar(m,t)}catch(e){}},900);
 // Migração única: copia o que existe no localStorage para o banco, confere e só então marca como migrado.
 if(!cache.__migrado){
  try{
   const todo=local.tudo();const antigo={};Object.keys(todo).forEach(k=>{if(k.startsWith('ven_'))antigo[k]=todo[k]});const chaves=Object.keys(antigo);
   if(chaves.length){
    try{const d=new Date(),p=n=>String(n).padStart(2,'0');
     N.salvarBackup('VEN_PRE_MIGRACAO_'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'_'+p(d.getHours())+p(d.getMinutes())+'.json',JSON.stringify({app:'VEN Vendas',format:1,createdAt:d.toISOString(),origin:'pre-migracao',storage:antigo}))}catch(e){}
    chaves.forEach(k=>{if(!N.gravar(k,antigo[k]))throw new Error('gravar '+k)});
    const conf=JSON.parse(N.carregarTudo());
    chaves.forEach(k=>{if(conf[k]!==antigo[k])throw new Error('conferir '+k)});
    cache=conf;
   }
   if(!N.gravar('__migrado',new Date().toISOString()))throw new Error('marca');
   cache.__migrado='1';
   if(chaves.length)aviso('Dados migrados para o banco SQLite ('+chaves.length+' grupos). Uma cópia foi salva em Downloads/VEN.','success');
  }catch(e){
   aviso('Não foi possível migrar para o banco. Usando o armazenamento antigo; seus dados estão preservados.','error');
   return local;
  }
 }
 return {
  get:k=>Object.prototype.hasOwnProperty.call(cache,k)?cache[k]:null,
  set:(k,v)=>{v=String(v);if(!N.gravar(k,v)){aviso('Falha ao gravar no banco. Verifique o espaço do aparelho.','error');return false}cache[k]=v;return true},
  del:k=>{N.apagar(k);delete cache[k]},
  tudo:()=>{const o={};Object.keys(cache).forEach(k=>{if(!k.startsWith('__'))o[k]=cache[k]});return o},
  substituir:o=>{if(!N.substituirTudo(JSON.stringify(o)))return false;return true},
  salvarBackup:(nome,json)=>N.salvarBackup(nome,json),
  modo:'sqlite'
 };
})();


function notificar(mensagem,tipo='success'){
  const host=document.getElementById('toast-host');
  if(!host)return;
  const item=document.createElement('div');
  item.className='ven-toast'+(tipo==='error'?' error':'');
  const ic=document.createElement('span');ic.className='toast-icon';ic.textContent=tipo==='error'?'!':'✓';
  const tx=document.createElement('div');tx.className='toast-text';tx.textContent=mensagem;
  const close=document.createElement('button');close.className='toast-close';close.type='button';close.textContent='×';close.setAttribute('aria-label','Fechar');close.onclick=()=>item.remove();
  item.append(ic,tx,close);host.appendChild(item);
  setTimeout(()=>{if(item.isConnected)item.remove()},tipo==='error'?5000:3200);
}
let confirmCallback=null;
function confirmar(titulo,mensagem,acao){
  confirmCallback=acao;
  document.getElementById('confirm-title').textContent=titulo;
  document.getElementById('confirm-message').textContent=mensagem;
  const perigo=/limpar|excluir|zerar|remover|apagar|deletar/i.test(titulo);
  document.getElementById('confirm-box').classList.toggle('danger',perigo);
  document.getElementById('confirm-icon').textContent=perigo?'!':'?';
  document.getElementById('confirm-ok').textContent=perigo?'Sim, continuar':'Confirmar';
  document.getElementById('confirm-overlay').style.display='flex';
}
function fecharConfirmacao(aceitou){
  document.getElementById('confirm-overlay').style.display='none';
  const cb=confirmCallback;confirmCallback=null;
  if(aceitou&&typeof cb==='function')cb();
}
document.getElementById('confirm-cancel').addEventListener('click',()=>fecharConfirmacao(false));
document.getElementById('confirm-ok').addEventListener('click',()=>fecharConfirmacao(true));
document.getElementById('confirm-overlay').addEventListener('click',e=>{if(e.target.id==='confirm-overlay')fecharConfirmacao(false)});

const EMPRESA_PADRAO = {nome:"", fantasia:"", cnpj:"", end:"", telefone:"", email:"", logo:""};
let EMPRESA = {...EMPRESA_PADRAO, ...(JSON.parse(dbRaw.get('ven_empresa')||'{}'))};
let VISUAL = storeSafeVisual();
function storeSafeVisual(){try{return JSON.parse(dbRaw.get('ven_visual')||'{"accent":"blue","theme":"light"}')}catch(e){return {accent:'blue',theme:'light'}}}
function aplicarVisual(){VISUAL.theme=VISUAL.theme==='dark'?'dark':'light';VISUAL.accent=VISUAL.theme==='light'?'blue':'orange';document.documentElement.dataset.accent=VISUAL.accent;document.documentElement.dataset.theme=VISUAL.theme;document.querySelectorAll('[data-theme-choice]').forEach(b=>b.classList.toggle('active',b.dataset.themeChoice===VISUAL.theme));try{dbRaw.set('ven_visual',JSON.stringify(VISUAL))}catch(e){}try{if(window.Android&&Android.setTema)Android.setTema(getComputedStyle(document.documentElement).getPropertyValue('--chrome').trim()||'#10151b')}catch(e){}}
function carregarEmpresa(){try{EMPRESA={...EMPRESA_PADRAO,...JSON.parse(dbRaw.get('ven_empresa')||'{}')}}catch(e){EMPRESA={...EMPRESA_PADRAO}}}


const $ = s => document.querySelector(s);
// Controles persistentes: preservam os listeners ao trocar e redesenhar as telas.
const persistentSearchRow = document.querySelector('.searchrow');
const persistentTabs = document.querySelector('.tabs');

const brl = n => (n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store = {
  get(k,d){try{const v=dbRaw.get(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{dbRaw.set(k,JSON.stringify(v))}catch(e){}}
};

function normalizaCampo(v){return norm(String(v||'')).replace(/[^a-z0-9]/g,'')}
function numeroBR(v){let x=String(v??'').trim().replace(/R\$/gi,'').replace(/\s/g,'');if(!x)return 0;if(x.includes(',')&&x.includes('.'))x=x.replace(/\./g,'').replace(',','.');else if(x.includes(','))x=x.replace(',','.');const n=Number(x);return Number.isFinite(n)?n:0}
function detectarSeparador(texto){const linha=(texto.replace(/^\uFEFF/,'').split(/\r?\n/).find(x=>x.trim())||'');const opts=['\t',';','|',','];return opts.sort((a,b)=>linha.split(b).length-linha.split(a).length)[0]}
function lerTabela(texto){
 texto=String(texto||'').replace(/^\uFEFF/,'').replace(/\0/g,'');
 const sep=detectarSeparador(texto), rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<texto.length;i++){
  const c=texto[i];
  if(c==='"'){
   if(quoted&&texto[i+1]==='"'){field+='"';i++}else quoted=!quoted;
  }else if(c===sep&&!quoted){row.push(field.trim());field=''}
  else if((c==='\n'||c==='\r')&&!quoted){
   if(c==='\r'&&texto[i+1]==='\n')i++;
   row.push(field.trim());field='';
   if(row.some(v=>v!==''))rows.push(row);
   row=[];
  }else field+=c;
 }
 if(field!==''||row.length){row.push(field.trim());if(row.some(v=>v!==''))rows.push(row)}
 if(rows.length<2)throw Error('O arquivo está vazio ou não tem linhas de dados.');
 return {headers:rows[0],rows:rows.slice(1),sep};
}
function indiceCab(headers,aliases){const h=headers.map(normalizaCampo);for(const alias of aliases){const ix=h.indexOf(normalizaCampo(alias));if(ix>=0)return ix}for(let i=0;i<h.length;i++)if(aliases.some(a=>h[i].includes(normalizaCampo(a))))return i;return -1}
function construirCatalogo(prodText,codText){
 const pt=lerTabela(prodText), ct=lerTabela(codText);
 const pi={key:indiceCab(pt.headers,['Chave','ChaveProduto','IdProduto','Id']),code:indiceCab(pt.headers,['Codigo','Código','CodProduto','CodigoProduto']),desc:indiceCab(pt.headers,['Descricao','Descrição','NomeProduto','Produto','Nome']),price:indiceCab(pt.headers,['Preco','Preço','ValorVenda','Valor','PrecoVenda']),stock:indiceCab(pt.headers,['Quantidade','Estoque','QuantidadeEstoque','Saldo','QtdEstoque']),loc:indiceCab(pt.headers,['Localizacao','Localização','Local','EnderecoEstoque']),disabled:indiceCab(pt.headers,['Desativar','Inativo','Desativado']),invalid:indiceCab(pt.headers,['Invalido','Inválido'])};
 const ci={key:indiceCab(ct.headers,['ChaveProduto','Chave','ProdutoChave','IdProduto']),bar:indiceCab(ct.headers,['CodigoBarras','CodigoDeBarras','CodBarras','EAN','GTIN','Codigo','Código','Cod'])};
 if(pi.desc<0||pi.price<0||(pi.key<0&&pi.code<0))throw Error('Não identifiquei as colunas necessárias em Produtos.TXT. Confira se o arquivo exportado tem cabeçalho com Chave/Codigo, Descricao e Preco.');
 if(ci.key<0||ci.bar<0)throw Error('Não identifiquei as colunas ChaveProduto e Codigo em Codigo.TXT.');
 const barras=new Map();ct.rows.forEach(r=>{const k=String(r[ci.key]||'').trim(),b=String(r[ci.bar]||'').trim();if(k&&b){if(!barras.has(k))barras.set(k,[]);if(!barras.get(k).includes(b))barras.get(k).push(b)}});
 const out=[];pt.rows.forEach((r,ix)=>{const key=String(pi.key>=0?r[pi.key]||'':r[pi.code]||'').trim();const code=String((pi.code>=0?r[pi.code]:'')||key).trim();const desc=String(r[pi.desc]||'').trim();if(!desc||desc==='.')return;const desativado=pi.disabled>=0&&['true','1','sim','yes'].includes(String(r[pi.disabled]||'').trim().toLowerCase());const invalido=pi.invalid>=0&&['true','1','sim','yes'].includes(String(r[pi.invalid]||'').trim().toLowerCase());if(desativado||invalido)return;const price=numeroBR(r[pi.price]);const stock=pi.stock>=0?numeroBR(r[pi.stock]):0;const loc=pi.loc>=0?String(r[pi.loc]||'').trim():'';const id=code;if(id=== ''||id===null)return;out.push({id,d:desc,p:price,q:stock,l:loc,b:barras.get(key)||[],s:norm(desc)+' '+code+' '+(barras.get(key)||[]).join(' '),key:String(key)});});
 if(!out.length)throw Error('Nenhum produto válido foi encontrado. Nenhum dado foi alterado.');
 return {products:out,productsRows:pt.rows.length,codesRows:ct.rows.length,barCount:out.reduce((a,p)=>a+p.b.length,0),date:new Date().toISOString()};
}
const catalogoSalvo=store.get('ven_catalogoImportado',null);
const bancoLimpoInicial=store.get('ven_catalogoLimpo',false)===true;
const ven_produtosManuaisIniciais=store.get('ven_produtosManuais',[]);
function normalizarProduto(p){return {...p,id:String(p.id),d:String(p.d||''),c:Number(p.c)||0,p:Number(p.p)||0,q:Number(p.q)||0,l:p.l||'',b:Array.isArray(p.b)?p.b:(p.b?[String(p.b)]:[]),img:p.img||'',manual:!!p.manual,key:p.key||String(p.id),s:(typeof p.s==='string'&&p.s)?p.s:norm((p.d||'')+' '+p.id+' '+(p.b||[]).join(' '))}}
// Catálogo inicia vazio em uma instalação nova. Produtos só entram por importação
// explícita dos arquivos TXT ou por cadastro manual. Em atualizações, preserva
// o catálogo que o usuário já salvou no aparelho.
let produtosImportados=(catalogoSalvo&&Array.isArray(catalogoSalvo.products)&&!bancoLimpoInicial?catalogoSalvo.products:[]).map(normalizarProduto);
let ven_produtosManuais=Array.isArray(ven_produtosManuaisIniciais)?ven_produtosManuaisIniciais.map(p=>normalizarProduto({...p,manual:true})):[];
let prods=[...produtosImportados,...ven_produtosManuais];
let byId = new Map(prods.map(p=>[String(p.id),p]));
function reconstruirProdutos(){prods=[...produtosImportados,...ven_produtosManuais].map(normalizarProduto);byId=new Map(prods.map(p=>[String(p.id),p]));store.set('ven_produtosManuais',ven_produtosManuais);}
function proximoCodigoManual(){let max=0;prods.forEach(p=>{const n=Number(p.id);if(Number.isFinite(n))max=Math.max(max,n)});return 'MAN-'+String(max+1).padStart(4,'0')}

let cart = store.get('ven_cart',[]).map(i=>({...i,id:String(i.id)})).filter(i=>byId.has(i.id)).map(i=>({...i,d:i.d||byId.get(i.id).d}));
let cfg = store.get('ven_cfg',{cli:'',desc:'',tipo:'%',obs:'Orçamento válido por 5 dias.'});
let view = 'home', limite = 50;
const navigationHistory=[];
function irParaView(destino, registrar=true){if(!destino)return;if(!(destino==='sales'&&salesKeepCustomer))salesCustomerId=null;salesKeepCustomer=false;if(destino===view){render();return}if(registrar)navigationHistory.push(view);view=destino;document.body.classList.remove('keyboard-open');render();window.scrollTo(0,0)}
let orcamentos = store.get('ven_orcamentosSalvos',[]);
let editingOrderNumber = null;
let savedOrderSearch = ''; let savedFilter='all'; 
let clientes = store.get('ven_clientes',[]);
let vendas = store.get('ven_vendas',[]);
let editingCustomerId = null;
let quoteForSale = null;
let salesCustomerId=null, salesKeepCustomer=false;
let salesFilterMode='all';
let salesFilterFrom='';
let salesFilterTo='';
function nomeItem(i){return i.d || (byId.get(i.id)||{}).d || ('Produto '+i.id)}
function salvarHistorico(){store.set('ven_orcamentosSalvos',orcamentos)}
function formatData(iso){try{return new Date(iso).toLocaleString('pt-BR')}catch(e){return iso||''}}
function totalSnapshot(o){
  const sub=o.itens.reduce((a,i)=>a+(Number(i.q)||0)*(Number(i.p)||0),0);
  const desc=Number(o.desc)||0;
  const d=o.tipo==='%'?sub*desc/100:desc;
  return {sub,d:Math.min(Math.max(d,0),sub),total:sub-Math.min(Math.max(d,0),sub)};
}
function abrirEscolhaGravacao(){
 if(!cart.length){notificar('Adicione produtos antes de gravar o pedido.','error');return}
 $('#order-save-overlay').style.display='flex';
}
function fecharEscolhaGravacao(){ $('#order-save-overlay').style.display='none'; }
function salvarOrcamento(destino='quote'){
 if(!cart.length){notificar('Adicione produtos antes de gravar o pedido.','error');return null}
 const t=totais();
 const snapshot={cli:cfg.cli||'',desc:cfg.desc||'',tipo:cfg.tipo||'%',obs:cfg.obs||'',itens:cart.map(i=>({id:i.id,d:nomeItem(i),q:Number(i.q)||0,p:Number(i.p)||0})),subtotal:t.sub,desconto:t.d,total:t.total,tipoRegistro:destino==='sale'?'venda_pendente':'orcamento'};
 let seq;
 if(editingOrderNumber!==null && orcamentos.some(x=>Number(x.numero)===Number(editingOrderNumber))){
   seq=Number(editingOrderNumber);
   orcamentos=orcamentos.map(o=>Number(o.numero)===seq?{...o,...snapshot,numero:seq,data:o.data||new Date().toISOString(),atualizado:new Date().toISOString()}:o);
   notificar('Pedido #'+String(seq).padStart(4,'0')+' atualizado.');
 }else{
   seq=Number(store.get('ven_ultimoNumeroOrcamento',0))+1;store.set('ven_ultimoNumeroOrcamento',seq);
   orcamentos.unshift({numero:seq,data:new Date().toISOString(),...snapshot});
   notificar('Pedido #'+String(seq).padStart(4,'0')+' salvo.');
 }
 editingOrderNumber=seq;salvarHistorico();view='saved';savedOrderSearch='';render();
 if(destino==='sale'){abrirFechamentoVenda(seq)}
 return seq;
}
function abrirOrcamentoSalvo(numero){
  const o=orcamentos.find(x=>Number(x.numero)===Number(numero));if(!o)return;
  editingOrderNumber=Number(o.numero);
  cart=o.itens.map(i=>({id:String(i.id),d:i.d,q:i.q,p:i.p}));
  cfg={cli:o.cli||'',desc:o.desc||'',tipo:o.tipo||'%',obs:o.obs||''};
  salvar();view='orc';render();notificar('Pedido #'+String(o.numero).padStart(4,'0')+' aberto para edição.');
}
function renderSalvos(){
 const term=norm(savedOrderSearch);
 const ehVenda=o=>String(o.tipoRegistro||'').startsWith('venda');
 const todos=orcamentos.slice().sort((a,b)=>Number(b.numero)-Number(a.numero));
 const nVenda=todos.filter(ehVenda).length, nOrc=todos.length-nVenda;
 const lista=todos.filter(o=>(savedFilter==='all'||(savedFilter==='sale'?ehVenda(o):!ehVenda(o)))&&(!term||norm([o.numero,o.cli,(o.tipoRegistro||''),...(o.itens||[]).map(i=>i.d)].join(' ')).includes(term)));
 const titulo='<section class="screen-head"><div class="screen-kicker">HISTÓRICO COMERCIAL</div><div class="screen-title-row"><div><h2 class="screen-title">Pedidos</h2><p class="screen-desc">'+nOrc+' orçamento(s) · '+nVenda+' venda(s)</p></div><span class="screen-count">'+todos.length+'</span></div></section>';
 const chip=(k,l,n)=>`<button type="button" class="pd-chip${savedFilter===k?' on':''}" data-saved-filter="${k}">${l}<b>${n}</b></button>`;
 let h=titulo+`<div class="pd-bar"><div class="pd-search"><input id="savedOrderSearch" type="search" placeholder="Buscar nº, cliente ou produto…" value="${esc(savedOrderSearch)}" autocomplete="off">${savedOrderSearch?'<button type="button" id="clearOrderSearch" aria-label="Limpar busca">×</button>':''}</div><button type="button" class="pd-new" id="newOrderFromList"><span style="font-size:18px;line-height:1">＋</span> Novo</button></div><div class="pd-chips">${chip('all','Todos',todos.length)}${chip('quote','Orçamentos',nOrc)}${chip('sale','Vendas',nVenda)}</div>`;
 const ligar=()=>{
  const input=$('#savedOrderSearch');if(input){input.addEventListener('input',()=>{savedOrderSearch=input.value;const pos=input.selectionStart;renderSalvos();const next=$('#savedOrderSearch');if(next){next.focus();next.setSelectionRange(pos,pos)}})}
  $('#clearOrderSearch')?.addEventListener('click',()=>{savedOrderSearch='';renderSalvos()});
  $('#newOrderFromList')?.addEventListener('click',()=>{editingOrderNumber=null;cart=[];cfg={cli:'',desc:'',tipo:'%',obs:'Orçamento válido por 5 dias.'};salvar();irParaView('orc')});
 };
 if(!todos.length){
   h+='<div class="empty">Nenhum pedido gravado ainda.<br>Toque em “Novo”, adicione os produtos e escolha “Gravar pedido”.</div>';
   $('#main').innerHTML=h;ligar();return;
 }
 if(!lista.length){h+='<div class="empty">Nenhum pedido encontrado.</div>';$('#main').innerHTML=h;ligar();return}
 const IC={pdf:'<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',wa:'<svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.6-5.4A8.4 8.4 0 1 1 21 11.5z"/></svg>',del:'<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>'};
 lista.forEach(o=>{
   const t=totalSnapshot(o), isSale=ehVenda(o), isClosed=(o.tipoRegistro||'')==='venda_fechada';
   const itemCount=(o.itens||[]).reduce((n,i)=>n+(Number(i.q)||0),0);
   h+=`<article class="oc"><div class="oc-top"><div class="oc-id"><b>#${String(o.numero).padStart(4,'0')}</b><span class="order-status ${isSale?'sale':''}">${isClosed?'Venda fechada':isSale?'Venda em andamento':'Orçamento'}</span></div><div class="oc-total">${brl(t.total)}</div></div><div class="oc-cli${o.cli?'':' vazio'}">${esc(o.cli||'Cliente não informado')}</div><div class="oc-meta">${esc(formatData(o.atualizado||o.data))} · ${(o.itens||[]).length} produto(s) · ${itemCount.toLocaleString('pt-BR')} un.</div><div class="oc-actions"><button class="btn pri${isClosed?' full':''}" data-open="${o.numero}">Editar pedido</button>${isClosed?'':`<button class="btn pri" data-convert-sale="${o.numero}">Fechar venda</button>`}</div><div class="oc-sub"><button type="button" data-hpdf="${o.numero}">${IC.pdf}PDF</button><button type="button" data-hwa="${o.numero}">${IC.wa}WhatsApp</button><button type="button" class="dng" data-hdel="${o.numero}">${IC.del}Excluir</button></div></article>`;
 });
 $('#main').innerHTML=h;ligar();
}


function salvarClientes(){store.set('ven_clientes',clientes)}
function salvarVendas(){store.set('ven_vendas',vendas);if(typeof sincronizarAvisos==='function')sincronizarAvisos()}
function proximoIdVenda(){return Number(store.get('ven_ultimoNumeroVenda',0))+1}
function whatsappClienteUrl(telefone){let n=String(telefone||'').replace(/\D/g,'');if(!n)return '';n=n.replace(/^0+/, '');if(n.startsWith('55'))n=n.slice(2);if(n.length<10||n.length>11)return '';return 'https://wa.me/55'+n;}
function renderClientes(){
 const titulo='<section class="screen-head"><div class="screen-kicker">Relacionamento</div><div class="screen-title-row"><div><h2 class="screen-title">Clientes</h2><p class="screen-desc">Cadastre clientes e consulte seu histórico de compras.</p></div><span class="screen-count">'+clientes.length+'</span></div></section>';
 if(!clientes.length){$('#main').innerHTML=titulo+'<div class="crm-actions"><button class="btn pri" id="newCustomer">＋ Cadastrar cliente</button></div><div class="empty">Nenhum cliente cadastrado.<br>Cadastre clientes para vinculá-los aos orçamentos e vendas.</div>';return}
 let h=titulo+'<div class="crm-actions"><button class="btn pri" id="newCustomer">＋ Cadastrar cliente</button><span class="crm-meta">'+clientes.length+' cliente(s)</span></div>';
 clientes.slice().sort((a,b)=>a.nome.localeCompare(b.nome)).forEach(c=>{const wa=whatsappClienteUrl(c.telefone);h+=`<div class="crm-card"><div class="crm-title">${esc(c.nome)}</div><div class="crm-meta">${c.doc?'CPF/CNPJ: '+esc(c.doc)+' · ':''}${c.telefone?esc(c.telefone):'Sem telefone'}${c.email?' · '+esc(c.email):''}</div>${c.address?`<div class="crm-meta">${esc(c.address)}</div>`:''}<div class="saved-actions"><button class="btn" data-edit-customer="${esc(c.id)}">Editar</button>${c.telefone?`<button class="btn pri" data-open-wa="${esc(c.id)}">WhatsApp ↗</button>`:''}<button class="btn" data-customer-history="${esc(c.id)}">Ver vendas</button><button class="btn dng" data-delete-customer="${esc(c.id)}">Excluir</button></div></div>`});
 $('#main').innerHTML=h;
}
function abrirCadastroCliente(id=null){editingCustomerId=id;const c=id?clientes.find(x=>String(x.id)===String(id)):null;$('#customerTitle').textContent=c?'Editar cliente':'Cadastrar cliente';$('#custName').value=c?.nome||'';$('#custDoc').value=c?.doc||'';$('#custPhone').value=c?.telefone||'';$('#custEmail').value=c?.email||'';$('#custAddress').value=c?.address||'';$('#custNotes').value=c?.notes||'';$('#customer-overlay').style.display='flex';}
function fecharCadastroCliente(){$('#customer-overlay').style.display='none';editingCustomerId=null}
function renderVendas(){
 const hoje=new Date(), isoHoje=isoLocal(hoje);
 const inicioMes=isoLocal(new Date(hoje.getFullYear(),hoje.getMonth(),1));
 let filtradas=vendas.slice();
 if(salesCustomerId!==null){
  const clienteHist=clientes.find(c=>String(c.id)===String(salesCustomerId));
  filtradas=filtradas.filter(v=>{
   const idVenda=v.clienteId??v.customerId??v.idCliente;
   if(idVenda!==undefined&&idVenda!==null&&String(idVenda)!=='') return String(idVenda)===String(salesCustomerId);
   const nomeVenda=String(v.clienteNome??v.cliente??v.customerName??'').trim().toLocaleLowerCase('pt-BR');
   return !!clienteHist&&nomeVenda===String(clienteHist.nome||'').trim().toLocaleLowerCase('pt-BR');
  });
 }
 if(salesFilterMode==='day') filtradas=filtradas.filter(v=>(v.data?isoLocal(new Date(v.data)):'')===isoHoje);
 else if(salesFilterMode==='month') filtradas=filtradas.filter(v=>(v.data?isoLocal(new Date(v.data)):'')>=inicioMes&&(v.data?isoLocal(new Date(v.data)):'')<=isoHoje);
 else {
  if(salesFilterFrom) filtradas=filtradas.filter(v=>(v.data?isoLocal(new Date(v.data)):'')>=salesFilterFrom);
  if(salesFilterTo) filtradas=filtradas.filter(v=>(v.data?isoLocal(new Date(v.data)):'')<=salesFilterTo);
 }
 const totalVendas=filtradas.reduce((a,v)=>a+(Number(v.total)||0),0);
 const itensComCusto=filtradas.flatMap(v=>(v.itens||[]).map(i=>({i,v})));
 const custoConhecido=itensComCusto.reduce((a,x)=>{const p=byId.get(String(x.i.id));const custo=Number(x.i.c??p?.c);return a+(Number.isFinite(custo)&&custo>0?(Number(x.i.q)||0)*custo:0)},0);
 const itensSemCusto=itensComCusto.filter(x=>{const p=byId.get(String(x.i.id));return !(Number(x.i.c??p?.c)>0)}).length;
 const lucroBrutoEstimado=totalVendas-custoConhecido;
 const totalRecebido=filtradas.reduce((a,v)=>a+(Number(v.recebido)||0),0);
 const pendentes=filtradas.reduce((a,v)=>a+Math.max(0,(Number(v.total)||0)-(Number(v.recebido)||0)),0);
 const personalizado=salesFilterMode==='custom'||(salesFilterMode==='all'&&(salesFilterFrom||salesFilterTo));
 const periodoTxt=salesFilterMode==='day'?'Hoje':salesFilterMode==='month'?'Este mês':personalizado?'Período personalizado':'Todo o período';
 const clienteSelecionado=salesCustomerId!==null?clientes.find(c=>String(c.id)===String(salesCustomerId)):null;
 const cab=`<section class="screen-head"><div class="screen-kicker">${clienteSelecionado?'HISTÓRICO DO CLIENTE':'RELATÓRIOS COMERCIAIS'}</div><div class="screen-title-row"><div><h2 class="screen-title">${clienteSelecionado?`Vendas de ${esc(clienteSelecionado.nome)}`:'Relatório de vendas'}</h2><p class="screen-desc">${periodoTxt} · ${filtradas.length} venda(s)</p></div><span class="screen-count">${filtradas.length}</span></div></section>`;
 const seg=`${clienteSelecionado?'<button type="button" class="rp-clear" id="clearCustomerHistory">← Ver todas as vendas</button>':''}<div class="rp-seg">${[['day','Hoje'],['month','Este mês'],['all','Tudo']].map(([k,l])=>`<button type="button" data-sales-period="${k}" class="${salesFilterMode===k&&!personalizado?'on':''}">${l}</button>`).join('')}</div>`;
 const custom=`<details class="rp-custom"${personalizado?' open':''}><summary>${personalizado?'Período personalizado ativo':'Escolher datas'}</summary><div class="rp-dates"><label>De<input id="salesFrom" type="date" value="${esc(salesFilterFrom)}"></label><label>Até<input id="salesTo" type="date" value="${esc(salesFilterTo)}"></label><button type="button" class="btn pri" id="applySalesDates">Aplicar período</button></div></details>`;
 const kpi=`<div class="rp-hero"><span>Total vendido</span><strong>${brl(totalVendas)}</strong><div class="rp-hero-row"><div><small>Recebido</small><b>${brl(totalRecebido)}</b></div><div><small>A receber</small><b class="${pendentes>0?'warn':''}">${brl(pendentes)}</b></div></div></div><div class="rp-kpis"><div><span>Vendas</span><strong>${filtradas.length.toLocaleString('pt-BR')}</strong></div><div><span>Ticket médio</span><strong>${brl(filtradas.length?totalVendas/filtradas.length:0)}</strong></div><div><span>Lucro bruto${itensSemCusto?' (parcial)':''}</span><strong>${brl(lucroBrutoEstimado)}</strong></div></div>${itensSemCusto?`<p class="rp-note">Custo ausente em ${itensSemCusto} item(ns); o lucro está incompleto.</p>`:'<p class="rp-note">Lucro calculado com os custos cadastrados.</p>'}`;
const MESES=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
 const M=resumoMeta();const metas=store.get('ven_metasVendas',{});
 const nivelDe=(total,m)=>m>0?(total>=m?'gold':total>=m*.5?'silver':'bronze'):'none';
 const retro=MESES.map((nome,i)=>{const k='ven_metaVendas_'+hoje.getFullYear()+'-'+String(i+1).padStart(2,'0');const m=Number(metas[k])||0;const total=vendas.filter(v=>{const d=new Date(v.data);return d.getFullYear()===hoje.getFullYear()&&d.getMonth()===i}).reduce((a,v)=>a+(Number(v.total)||0),0);const nv=nivelDe(total,m);return `<div class="rp-m"><b>${nome}</b>${brl(total)}<span class="rp-m-medal">${medalHtml(nv)}${m>0?{gold:'Ouro',silver:'Prata',bronze:'Bronze'}[nv]:'sem meta'}</span></div>`}).join('');
 const metaPainel=`<section class="rp-card"><div class="rp-card-head"><div class="rp-card-t">${medalHtml(M.nivel)}<div><b>Meta de ${esc(M.mesNome)}</b><small>${M.meta>0?'Medalha de '+M.nome:'Sem meta definida'}</small></div></div><span class="rp-perc">${M.meta>0?M.perc+'%':''}</span></div><div class="rp-bar"><i style="width:${M.perc}%"></i></div><div class="rp-meta-line">${M.meta>0?`<b>${brl(M.total)}</b> de ${brl(M.meta)} · ${M.msg}`:'Defina uma meta para acompanhar o progresso do mês.'}</div><details class="rp-more"><summary>${M.meta>0?'Alterar meta':'Definir meta'}</summary><div class="rp-dates"><label>Meta em R$<input id="salesGoalInput" type="number" min="0" step="100" value="${M.meta||''}" placeholder="Ex.: 50000"></label><button class="btn pri" id="saveSalesGoal" type="button">Salvar</button></div></details><details class="rp-more"><summary>Retrospectiva anual</summary><div class="rp-months">${retro}</div></details></section>`;
 let h=cab+seg+custom+kpi+metaPainel+`<button type="button" class="btn" data-open-agenda style="width:100%;margin:0 0 14px">📅 Agenda de vendas e vencimentos</button><div class="rp-sec">Vendas<small>mais recentes primeiro</small></div>`;
 if(!filtradas.length){h+='<div class="empty">Nenhuma venda encontrada neste período.<br>Finalize um pedido como venda ou selecione outra data.</div>';$('#main').innerHTML=h;return}
 filtradas.sort((a,b)=>new Date(b.data)-new Date(a.data)).forEach(v=>{
  const status=v.status==='paid'?'<span class="status-pill">Paga</span>':v.status==='partial'?'<span class="status-pill partial">Parcial</span>':'<span class="status-pill pending">Pendente</span>';
  const saldo=Math.max(0,(Number(v.total)||0)-(Number(v.recebido)||0));
  h+=`<article class="rp-sale crm-card"><div class="rp-sale-top"><div><b>Venda #${String(v.numero).padStart(4,'0')}</b><small>${esc(formatData(v.data))}</small><small>${esc(v.clienteNome||'Sem cliente')}</small></div><div class="rp-sale-r"><strong>${brl(v.total)}</strong>${status}</div></div><div class="rp-sale-meta"><span>Pedido #${String(v.orcamentoNumero).padStart(4,'0')}</span><span>${esc(v.pagamento||'Não informado')}</span><span>Recebido <b>${brl(v.recebido||0)}</b></span><span>Saldo <b>${brl(saldo)}</b></span>${v.vencimento?`<span>Vence ${esc(new Date(v.vencimento+'T12:00:00').toLocaleDateString('pt-BR'))}</span>`:''}</div><div class="oc-actions"><button class="btn" data-sale-receipt="${v.numero}">Recibo</button>${v.status!=='paid'?`<button class="btn pri" data-sale-paid="${v.numero}">Marcar paga</button>`:'<span></span>'}<button class="btn" data-sale-detail="${v.numero}">Detalhes</button></div></article>`;
 });
 $('#main').innerHTML=h;
}
function abrirFechamentoVenda(numero){const o=orcamentos.find(x=>Number(x.numero)===Number(numero));if(!o){notificar('Orçamento salvo não encontrado.','error');return}quoteForSale=o;$('#saleQuoteLabel').textContent='Orçamento #'+String(o.numero).padStart(4,'0');$('#saleTotalLabel').textContent='Total: '+brl(totalSnapshot(o).total);$('#saleCustomer').innerHTML='<option value="">Sem cliente cadastrado</option>'+clientes.map(c=>`<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join('');const match=clientes.find(c=>c.nome===o.cli);$('#saleCustomer').value=match?String(match.id):'';$('#salePayment').value='PIX';$('#saleStatus').value='pending';$('#saleDate').value=new Date().toISOString().slice(0,10);$('#saleDue').value='';$('#saleReceived').value='0';$('#saleTerms').value='';$('#saleNotes').value='';$('#sale-overlay').style.display='flex'}
function fecharVendaModal(){$('#sale-overlay').style.display='none';quoteForSale=null}
function confirmarFechamentoVenda(){if(!quoteForSale)return;const total=totalSnapshot(quoteForSale).total;let recebido=Math.max(0,Number($('#saleReceived').value)||0);if(recebido>total){notificar('O valor recebido não pode ser maior que o total da venda.','error');return}let status=$('#saleStatus').value;if(status==='paid')recebido=total;if(status==='partial'&&(recebido<=0||recebido>=total)){notificar('Para pagamento parcial, informe um valor recebido maior que zero e menor que o total.','error');return}if(status==='pending'&&recebido>0)status=recebido>=total?'paid':'partial';if(status==='paid')recebido=total;const cliente=clientes.find(c=>String(c.id)===$('#saleCustomer').value);const n=proximoIdVenda();store.set('ven_ultimoNumeroVenda',n);const v={numero:n,orcamentoNumero:quoteForSale.numero,data:($('#saleDate').value?new Date($('#saleDate').value+'T12:00:00').toISOString():new Date().toISOString()),vencimento:$('#saleDue').value||'',clienteId:cliente?cliente.id:'',clienteNome:cliente?cliente.nome:(quoteForSale.cli||''),clienteSnapshot:cliente?{...cliente}:null,pagamento:$('#salePayment').value,status,recebido,total,termos:$('#saleTerms').value.trim(),observacoes:$('#saleNotes').value.trim(),itens:quoteForSale.itens.map(i=>({...i})),empresaSnapshot:{...EMPRESA}};vendas.unshift(v);salvarVendas();orcamentos=orcamentos.map(o=>Number(o.numero)===Number(quoteForSale.numero)?{...o,tipoRegistro:'venda_fechada',vendaNumero:n,atualizado:new Date().toISOString()}:o);salvarHistorico();fecharVendaModal();view='sales';render();notificar('Venda #'+String(n).padStart(4,'0')+' registrada.');}
function imprimirReciboVenda(numero){const v=vendas.find(x=>Number(x.numero)===Number(numero));if(!v)return;const e=v.empresaSnapshot||EMPRESA;const linhas=(v.itens||[]).map(i=>`<tr><td>${esc(i.d)}</td><td class="r">${Number(i.q)||0}</td><td class="r">${brl(i.p)}</td><td class="r">${brl((Number(i.q)||0)*(Number(i.p)||0))}</td></tr>`).join('');const saldo=Math.max(0,(Number(v.total)||0)-(Number(v.recebido)||0));$('#imp').innerHTML=`${e.logo?'<img src="'+esc(e.logo)+'" style="max-width:110px;max-height:60px;object-fit:contain"><br>':''}<h2>${esc(e.fantasia||e.nome||'Empresa')}</h2><div>${e.cnpj?'CPF/CNPJ '+esc(e.cnpj)+' · ':''}${esc(e.end||'')}${e.telefone?' · '+esc(e.telefone):''}</div><h2 style="margin-top:20px">RECIBO / COMPROVANTE COMERCIAL Nº ${String(v.numero).padStart(4,'0')}</h2><p>Data: ${esc(formatData(v.data))}</p><p>Recebemos de: <b>${esc(v.clienteNome||'Cliente não informado')}</b></p><p>Referente à venda dos produtos abaixo, originada do orçamento nº ${String(v.orcamentoNumero).padStart(4,'0')}.</p><table><thead><tr><th>Produto</th><th class="r">Qtd.</th><th class="r">Unitário</th><th class="r">Total</th></tr></thead><tbody>${linhas}</tbody></table><div class="sum"><b>Total da venda: ${brl(v.total)}</b><br>Forma de pagamento: ${esc(v.pagamento)}<br>Recebido: ${brl(v.recebido)}<br>Saldo pendente: ${brl(saldo)}${v.vencimento?'<br>Vencimento: '+new Date(v.vencimento+'T12:00:00').toLocaleDateString('pt-BR'):''}</div>${v.observacoes?'<p>Observações: '+esc(v.observacoes)+'</p>':''}<p style="margin-top:28px">Documento comercial de controle. Não substitui nota fiscal.</p>`;if(window.Android&&Android.printHtml){const css='body{font:14px/1.4 sans-serif;color:#000;background:#fff;margin:16px}h2{color:#e56a00}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border-bottom:1px solid #bbb;padding:6px 4px;text-align:left}.r{text-align:right}.sum{margin-top:14px;text-align:right}';Android.printHtml('<!doctype html><html><head><meta name="viewport" content="width=device-width"><style>'+css+'</style></head><body>'+$('#imp').innerHTML+'</body></html>')}else window.print();}
document.getElementById('customer-overlay').addEventListener('click',e=>{if(e.target.id==='customer-overlay')fecharCadastroCliente()});
$('#cancelCustomer').addEventListener('click',fecharCadastroCliente);
$('#saveCustomer').addEventListener('click',()=>{const nome=$('#custName').value.trim();if(!nome){notificar('Informe o nome do cliente.','error');$('#custName').focus();return}const obj={id:editingCustomerId||('CLI-'+Date.now()),nome,doc:$('#custDoc').value.trim(),telefone:$('#custPhone').value.trim(),email:$('#custEmail').value.trim(),address:$('#custAddress').value.trim(),notes:$('#custNotes').value.trim(),atualizado:new Date().toISOString()};if(editingCustomerId)clientes=clientes.map(c=>String(c.id)===String(editingCustomerId)?obj:c);else clientes.push(obj);salvarClientes();fecharCadastroCliente();renderClientes();notificar('Cliente salvo.');});
document.addEventListener('click',e=>{if(e.target.closest('#saveSalesGoal')){const val=Math.max(0,Number(document.getElementById('salesGoalInput')?.value)||0);const d=new Date();const k='ven_metaVendas_'+d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');const ms=store.get('ven_metasVendas',{});ms[k]=val;store.set('ven_metasVendas',ms);renderVendas();notificar('Meta mensal salva.');return}const wab=e.target.closest('[data-open-wa]');if(wab){const c=clientes.find(x=>String(x.id)===String(wab.dataset.openWa));if(c&&c.telefone){const url=whatsappClienteUrl(c.telefone);if(url){const numero=url.replace(/^https:\/\/wa\.me\//,'');if(window.Android&&Android.abrirWhatsAppContato)Android.abrirWhatsAppContato(numero);else window.open(url,'_blank');}else notificar('Informe um celular com DDD no cadastro do cliente.','error')}return}if(e.target.closest('#newCustomer')){abrirCadastroCliente();return}const edit=e.target.closest('[data-edit-customer]');if(edit){abrirCadastroCliente(edit.dataset.editCustomer);return}const del=e.target.closest('[data-delete-customer]');if(del){const id=del.dataset.deleteCustomer;confirmar('Excluir cliente?','O cadastro será removido. Vendas e orçamentos já registrados manterão os dados históricos.',()=>{clientes=clientes.filter(c=>String(c.id)!==String(id));salvarClientes();renderClientes();notificar('Cliente removido.');});return}const hist=e.target.closest('[data-customer-history]');if(hist){salesCustomerId=String(hist.dataset.customerHistory);salesFilterMode='all';salesFilterFrom='';salesFilterTo='';salesKeepCustomer=true;irParaView('sales');return}const conv=e.target.closest('[data-convert-sale]');if(conv){abrirFechamentoVenda(Number(conv.dataset.convertSale));return}const rec=e.target.closest('[data-sale-receipt]');if(rec){imprimirReciboVenda(Number(rec.dataset.saleReceipt));return}const paid=e.target.closest('[data-sale-paid]');if(paid){const v=vendas.find(x=>Number(x.numero)===Number(paid.dataset.salePaid));if(v){v.status='paid';v.recebido=v.total;v.pagoEm=new Date().toISOString();salvarVendas();renderVendas();notificar('Venda marcada como paga.')}return}const det=e.target.closest('[data-sale-detail]');if(det){const v=vendas.find(x=>Number(x.numero)===Number(det.dataset.saleDetail));if(v)notificar('Venda #'+String(v.numero).padStart(4,'0')+' · '+v.clienteNome+' · '+brl(v.total)+' · '+v.pagamento+' · '+(v.status==='paid'?'Paga':v.status==='partial'?'Parcial':'Pendente'));return}});
$('#cancelSale').addEventListener('click',fecharVendaModal);$('#confirmSale').addEventListener('click',confirmarFechamentoVenda);document.getElementById('sale-overlay').addEventListener('click',e=>{if(e.target.id==='sale-overlay')fecharVendaModal()});

carregarEmpresa(); aplicarVisual();

function salvar(){store.set('ven_cart',cart);store.set('ven_cfg',cfg)}
function totais(){
  const sub = cart.reduce((a,i)=>a+i.q*i.p,0);
  let d = parseFloat(String(cfg.desc).replace(',','.'))||0;
  d = cfg.tipo==='%' ? sub*d/100 : d;
  d = Math.min(Math.max(d,0),sub);
  return {sub,d,total:sub-d};
}
function atualizaBarra(){
  $('#cnt').textContent = cart.length;
  $('#barTot').textContent = brl(totais().total);
}

function buscar(){
  const t = norm($('#q').value).split(/\s+/).filter(Boolean);
  let r = t.length ? prods.filter(p=>t.every(x=>p.s.includes(x))) : prods;
  if(t.length) r = r.slice().sort((a,b)=>(a.s.indexOf(t[0])-b.s.indexOf(t[0]))||a.d.localeCompare(b.d));
  else r = r.slice().sort((a,b)=>a.d.localeCompare(b.d));
  return r;
}

function renderProdutos(){
  const r = buscar();
  let h = `<section class="screen-head"><div class="screen-kicker">Catálogo da loja</div><div class="screen-title-row"><div><h2 class="screen-title">Produtos</h2><p class="screen-desc">Consulte, pesquise e gerencie os produtos do seu catálogo.</p></div><span class="screen-count">${prods.length.toLocaleString('pt-BR')}</span></div></section><div class="screen-tools"><span class="screen-tools-label">${r.length.toLocaleString('pt-BR')} resultado(s)${$('#q').value.trim()?' para “'+esc($('#q').value.trim())+'”':''}</span><span class="screen-tools-label">Catálogo de produtos</span></div>`;
  r.slice(0,limite).forEach(p=>{
    const est = p.q>0 ? `Estoque: ${p.q}` : '<span class="sem">Sem estoque</span>';
    const img=p.img?`<img class="product-thumb" src="${esc(p.img)}" alt="" loading="lazy" onerror="this.style.display='none'">`:'';
    h += `<div class="item">${img}<div class="info"><div class="nm">${esc(p.d)}</div>
      <div class="meta">Cód. ${esc(p.id)}${p.b&&p.b.length?' · Barras: '+esc(p.b.join(', ')):''} · ${est}${p.l?' · '+esc(p.l):''}</div><div class="product-admin-actions"><button class="btn" data-edit-product="${esc(p.id)}">Editar produto</button></div></div>
      <div><div class="pr">${brl(p.p)}</div></div></div>`;
  });
  if(!r.length) {
    if(prods.length===0 && !$('#q').value.trim()) {
      h += '<div class="empty catalog-empty-state"><div style="font-size:30px;margin-bottom:10px;color:var(--pri)">＋</div><strong style="display:block;color:var(--tx);font-size:17px;margin-bottom:6px">Seu catálogo está vazio</strong><div style="margin-bottom:16px">Comece cadastrando seu primeiro produto ou importe seu banco de dados para carregar os produtos e códigos de barras.</div><button type="button" class="btn pri" id="startFirstProduct">＋ Cadastrar primeiro produto</button><div style="font-size:12px;margin-top:12px">Para importar vários itens, abra o menu ☰ e escolha <b>Importar banco de dados</b>.</div></div>';
    } else {
      h += '<div class="empty">Nenhum produto encontrado.<br>Confira a busca ou limpe o texto pesquisado.</div>';
    }
  }
  if(r.length>limite) h += `<button class="more" id="mais">Mostrar mais (${r.length-limite} restantes)</button>`;
  $('#main').innerHTML = h;
  const title=$('#main .screen-head'); if(title && persistentSearchRow) title.insertAdjacentElement('afterend',persistentSearchRow);
}

function renderOrc(){
  const termo=norm($('#quoteProductSearch')?.value||'');
  const produtosParaOrc=prods.filter(p=>!termo||p.s.includes(termo)).slice(0,30);
  let h=`<section class="screen-head"><div class="screen-kicker">PEDIDOS</div><div class="screen-title-row"><div><h2 class="screen-title">${editingOrderNumber!==null?'Editar pedido #'+String(editingOrderNumber).padStart(4,'0'):'Novo pedido'}</h2><p class="screen-desc">Adicione produtos, revise quantidades e escolha como registrar o pedido.</p></div><span class="screen-count">${cart.length}</span></div></section>
  <section class="quote-product-picker"><label class="screen-tools-label" for="quoteProductSearch">Adicionar produtos ao orçamento</label><div class="quote-search-row"><input id="quoteProductSearch" type="search" placeholder="Buscar produto por nome, código ou barras…" value="${esc($('#quoteProductSearch')?.value||'')}" autocomplete="off"><button type="button" id="quoteScan" class="quote-scan-btn" aria-label="Ler código de barras" title="Ler código de barras">▦</button></div>
  <div class="quote-product-results">${produtosParaOrc.length?produtosParaOrc.map(p=>`<div class="quote-pick-row"><div class="info"><div class="nm">${esc(p.d)}</div><div class="meta">Cód. ${esc(p.id)}${p.b&&p.b.length?' · Barras: '+esc(p.b.join(', ')):''}</div></div><strong class="pr">${brl(p.p)}</strong><button type="button" class="add" data-add="${esc(p.id)}" aria-label="Adicionar ${esc(p.d)}">+</button></div>`).join(''):(prods.length?'Nenhum produto corresponde à busca.':'Seu catálogo está vazio. Cadastre ou importe produtos pelo menu para começar.')}</div></section>`;
  if(!cart.length){ h+='<div class="empty">Seu orçamento está vazio.<br>Pesquise um produto acima e toque em <b>+</b> para adicioná-lo.</div>'; $('#main').innerHTML=h; const t0=$('#main .screen-head'); if(t0 && persistentTabs) t0.insertAdjacentElement('afterend',persistentTabs); return; }
  h+=`<div class="screen-tools"><span class="screen-tools-label">${cart.reduce((a,i)=>a+(Number(i.q)||0),0).toLocaleString('pt-BR')} unidade(s) no orçamento</span><span class="screen-tools-label">${cart.length} item(ns)</span></div>`;
  cart.forEach((i,ix)=>{
    h += `<div class="quote-line-card"><div class="quote-line-top"><div class="nm">${esc(nomeItem(i))}</div><button class="quote-remove" data-del="${ix}" aria-label="Remover item">×</button></div>
      <div class="qline"><button data-m="${ix}" aria-label="Diminuir quantidade">−</button><input type="number" inputmode="decimal" min="0" step="any" value="${i.q}" data-q="${ix}" aria-label="Quantidade">
        <button data-p="${ix}" aria-label="Aumentar quantidade">+</button><span class="meta">×</span><input class="pu" type="number" inputmode="decimal" min="0" step="0.01" value="${i.p}" data-pu="${ix}" aria-label="Preço unitário"><span class="tot">${brl(i.q*i.p)}</span></div></div>`;
  });
  const t=totais();
  h += `<div class="form"><label>Cliente<input id="cli" value="${esc(cfg.cli)}" placeholder="Nome do cliente"><small style="color:var(--mut)">Digite um nome ou selecione um cliente cadastrado.</small></label>
    <label>Desconto<div style="display:flex;gap:8px"><input id="desc" type="number" inputmode="decimal" min="0" step="any" value="${esc(cfg.desc)}" style="flex:1"><select id="tipo"><option value="%"${cfg.tipo==='%'?' selected':''}>%</option><option value="R$"${cfg.tipo==='R$'?' selected':''}>R$</option></select></div></label>
    <label>Observações<textarea id="obs" rows="2" placeholder="Prazo, condições ou observações">${esc(cfg.obs)}</textarea></label></div>
  <div class="form"><div class="row"><span>Subtotal</span><span id="rSub">${brl(t.sub)}</span></div><div class="row"><span>Desconto</span><span id="rDesc">− ${brl(t.d)}</span></div></div>
  <div class="quote-total-strip"><div><span>Total do orçamento</span><strong id="rTot">${brl(t.total)}</strong></div><div class="quote-total-icon">R$</div></div>
  <div class="acts"><button class="btn pri" id="saveQuote">${editingOrderNumber!==null?'Salvar alterações':'Gravar pedido'}</button><button class="btn" id="wa">Enviar no WhatsApp</button><button class="btn" id="pdf">Imprimir / PDF</button><button class="btn dng wide" id="limpa">Limpar orçamento</button></div>`;
  $('#main').innerHTML=h;
  const title=$('#main .screen-head'); if(title && persistentTabs) title.insertAdjacentElement('afterend',persistentTabs);
}

const HM_ICONS={"file": "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><path d=\"M14 2v6h6M16 13H8M16 17H8M10 9H8\"/>", "clip": "<path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\"/><rect x=\"8\" y=\"2\" width=\"8\" height=\"4\" rx=\"1\"/><path d=\"M9 12h6M9 16h6\"/>", "users": "<path d=\"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75\"/>", "box": "<path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\"/><path d=\"M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12M16.5 9.4 7.5 4.21\"/>", "plus": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 8v8M8 12h8\"/>", "chart": "<path d=\"M12 20V10M18 20V4M6 20v-4\"/>", "gear": "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z\"/>", "home": "<path d=\"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/><path d=\"M9 22V12h6v10\"/>", "dots": "<circle cx=\"5\" cy=\"12\" r=\"1.2\"/><circle cx=\"12\" cy=\"12\" r=\"1.2\"/><circle cx=\"19\" cy=\"12\" r=\"1.2\"/>"};
const hmIcon=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${HM_ICONS[n]}</svg>`;

// Resumo da meta do mês atual (usado na Home e no Relatório): vendas do mês corrente x meta salva.
function resumoMeta(){
 const hoje=new Date();const ano=hoje.getFullYear(),mes=hoje.getMonth();
 const total=vendas.filter(v=>{const d=new Date(v.data);return d.getFullYear()===ano&&d.getMonth()===mes}).reduce((a,v)=>a+(Number(v.total)||0),0);
 const metas=store.get('ven_metasVendas',{});const meta=Number(metas['ven_metaVendas_'+ano+'-'+String(mes+1).padStart(2,'0')])||0;
 const perc=meta>0?Math.min(100,Math.round(total/meta*100)):0;
 const nivel=meta>0?(total>=meta?'gold':total>=meta*.5?'silver':'bronze'):'none';
 const nome={gold:'Ouro',silver:'Prata',bronze:'Bronze',none:'Sem meta'}[nivel];
 const msg=meta>0?(total>=meta?'Meta alcançada! Parabéns!':total>=meta*.75?'Quase lá!':total>=meta*.5?'Bom ritmo, continue.':'Faltam '+brl(meta-total)+'.'):'';
 return {total,meta,perc,nivel,nome,msg,mesNome:hoje.toLocaleDateString('pt-BR',{month:'long'})};
}
const medalSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.2 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.5 6.8 19.2l1-5.8-4.2-4.1 5.8-.8z"/></svg>';
const medalHtml=(nivel)=>`<span class="medal ${nivel}">${medalSvg}</span>`;
function renderHome(){
 const M=resumoMeta();
 const hora=new Date().getHours();
 const saudacao=hora<12?'Bom dia':(hora<18?'Boa tarde':'Boa noite');
 const pedidosAbertos=orcamentos.filter(o=>!String(o.tipoRegistro||'').startsWith('venda_fechada') && !String(o.tipoRegistro||'').startsWith('venda_paga'));
 const atalhos=[
  ['orc','file','Novo pedido','orange'],
  ['saved','clip','Pedidos','blue'],
  ['customers','users','Clientes','purple'],
  ['prod','box','Produtos','orange'],
  ['newproduct','plus','Cadastrar produto','blue'],
  ['reports','chart','Relatório','green'],
 ];
 $('#main').innerHTML=`<section class="hm">
  <div class="hm-top">
   <button type="button" class="hm-menu-btn" id="hm-menu-btn" aria-label="Abrir menu" title="Menu"><span></span><span></span><span></span></button>
   <svg class="hm-wave" viewBox="0 0 220 90" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="hmw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--hm-wave1)"/><stop offset="1" stop-color="var(--hm-wave2)"/></linearGradient></defs><path d="M220 6C196 14 160 46 104 70 70 84 34 90 0 90H220Z" fill="url(#hmw)"/></svg>
   
   <div class="hm-hello"><span class="hm-greet">${saudacao},</span><h2>Seja bem-vindo!</h2><p>O que deseja fazer hoje?</p></div>
  </div>
  <button type="button" class="hm-open-orders" data-home-action="saved"><span><span class="ho-label">ACOMPANHAMENTO COMERCIAL</span><strong>Pedidos em aberto</strong><span class="ho-label" style="margin:4px 0 0">Toque para consultar, editar ou fechar como venda</span></span><span class="ho-count">${pedidosAbertos.length}</span></button><button type="button" class="hm-meta" data-home-action="reports" aria-label="Meta do mês"><span class="hm-meta-ic">${medalHtml(M.nivel)}</span><span class="hm-meta-tx"><span class="ho-label">META DE ${esc(M.mesNome.toUpperCase())}</span><strong>${M.meta>0?'Medalha de '+M.nome:'Defina a meta do mês'}</strong>${M.meta>0?`<span class="hm-meta-bar"><i style="width:${M.perc}%"></i></span><span class="ho-label hm-meta-sub">${brl(M.total)} de ${brl(M.meta)} · ${M.perc}%</span>`:'<span class="ho-label hm-meta-sub">Toque para definir e acompanhar suas vendas</span>'}</span></button><div class="hm-grid">${atalhos.map(([acao,ic,titulo,cor])=>`<button type="button" class="hm-tile" data-home-action="${acao}" ${acao==='orc'?'id="homeNewOrder"':''}><span class="hm-ic ${cor}">${hmIcon(ic)}</span><strong>${titulo}</strong></button>`).join('')}</div>
  <div class="hm-foot">Pedidos, produtos e vendas em um só lugar</div>
 </section>`;
}

(function(){const m={home:'home',prod:'box',saved:'clip',orc:'file',sales:'chart',customers:'users'};document.querySelectorAll('#home-nav [data-home-nav]').forEach(b=>{const ic=b.querySelector('.hn-icon');if(ic&&m[b.dataset.homeNav])ic.innerHTML=hmIcon(m[b.dataset.homeNav])})})();
function iniciarNovoPedido(){
 if(editingOrderNumber!==null){editingOrderNumber=null;cart=[];cfg={cli:'',desc:'',tipo:'%',obs:'Orçamento válido por 5 dias.'};salvar()}
 view='orc';document.body.classList.remove('keyboard-open');render();window.scrollTo(0,0);
}
function navegarHome(destino){
 if(destino==='orc'){iniciarNovoPedido();return}
 if(destino==='newproduct'){abrirCadastroProduto();return}
 if(destino==='reports'){irParaView('sales');return}
 irParaView(destino);
}
function render(){
  // IMPORTANTE: retire os controles persistentes de #main antes de reconstruir a tela.
  // Assim, trocar entre Produtos, Orçamento, Salvos, Clientes e Vendas não os destrói
  // nem deixa referências antigas desconectadas do documento.
  const stableHeader=document.querySelector('header');
  if(stableHeader && persistentSearchRow && persistentSearchRow.parentElement!==stableHeader){
    stableHeader.appendChild(persistentSearchRow);
  }
  if(stableHeader && persistentTabs && persistentTabs.parentElement!==stableHeader){
    stableHeader.appendChild(persistentTabs);
  }
  const home=view==='home';
  document.body.classList.toggle('home-mode',home);
  document.body.classList.toggle('quote-mode',view==='orc');
  document.body.classList.toggle('prod-mode',view==='prod');
  document.body.classList.toggle('saved-mode',view==='saved');
  document.body.classList.toggle('prod-search-active',view==='prod' && !!($('#q')?.value||'').trim());
  $('#t1').classList.toggle('on',view==='prod');
  $('#t2').classList.toggle('on',view==='orc');
  $('#t3').classList.toggle('on',view==='saved');
  $('#q').style.display = view==='prod' ? '' : 'none';
  if(persistentSearchRow) persistentSearchRow.style.display=view==='prod'?'':'none';
  if(persistentTabs) persistentTabs.style.display='none';
  $('#bar').style.display = (home||view==='customers'||view==='sales'||view==='agenda'||view==='prod'||view==='orc') ? 'none' : 'flex';
  if(home)renderHome();else if(view==='prod')renderProdutos();else if(view==='orc')renderOrc();else if(view==='saved')renderSalvos();else if(view==='customers')renderClientes();else if(view==='sales')renderVendas();else if(view==='agenda')renderAgenda();
  document.querySelectorAll('[data-home-nav]').forEach(b=>b.classList.toggle('active',b.dataset.homeNav===view));
  atualizaBarra();
}
function texto(){
  const t=totais(); let s=`*${EMPRESA.nome}*\nCNPJ ${EMPRESA.cnpj}\n${EMPRESA.end}\n\n`;
  if(cfg.cli) s+=`Cliente: ${cfg.cli}\n`;
  s+=`Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
  cart.forEach(i=>{const p=byId.get(i.id); s+=`${i.q}x ${nomeItem(i)}\n   ${brl(i.p)} = ${brl(i.q*i.p)}\n`;});
  s+=`\nSubtotal: ${brl(t.sub)}\n`;
  if(t.d>0) s+=`Desconto: − ${brl(t.d)}\n`;
  s+=`*Total: ${brl(t.total)}*`;
  if(cfg.obs) s+=`\n\n${cfg.obs}`;
  return s;
}
function imprimir(){
  const t=totais();
  let rows=cart.map(i=>{const p=byId.get(i.id);const im=p&&p.img?'<img src="'+esc(p.img)+'" style="width:54px;height:44px;object-fit:contain">':'';return `<tr><td>${im}</td><td>${p?esc(p.id):esc(i.id)}</td><td>${esc(nomeItem(i))}</td><td class="r">${i.q}</td><td class="r">${brl(i.p)}</td><td class="r">${brl(i.q*i.p)}</td></tr>`}).join('');
  $('#imp').innerHTML=`${EMPRESA.logo?'<img src="'+EMPRESA.logo+'" style="max-width:110px;max-height:60px;object-fit:contain"><br>':''}<h2>${esc(EMPRESA.fantasia||EMPRESA.nome)}</h2><div>${EMPRESA.cnpj?'CNPJ/CPF '+esc(EMPRESA.cnpj)+' · ':''}${esc(EMPRESA.end||'')}${EMPRESA.telefone?' · '+esc(EMPRESA.telefone):''}${EMPRESA.email?' · '+esc(EMPRESA.email):''}</div><div style="margin-top:6px"><b>Orçamento</b> · ${new Date().toLocaleDateString('pt-BR')}${cfg.cli?' · Cliente: '+esc(cfg.cli):''}</div>
  <table><thead><tr><th>Foto</th><th>Cód.</th><th>Produto</th><th class="r">Qtd</th><th class="r">Unit.</th><th class="r">Total</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="sum">Subtotal: ${brl(t.sub)}<br>${t.d>0?'Desconto: − '+brl(t.d)+'<br>':''}<b style="font-size:18px">Total: ${brl(t.total)}</b></div>
  ${cfg.obs?'<p>'+esc(cfg.obs)+'</p>':''}`;
  if(window.Android && Android.printHtml){
    const css='body{font:14px/1.4 sans-serif;color:#000;background:#fff;margin:16px}h2{color:#e56a00;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border-bottom:1px solid #bbb;padding:6px 4px;text-align:left}th{border-bottom:2px solid #e56a00}.r{text-align:right}.sum{margin-top:12px;text-align:right}';
    Android.printHtml('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>'+css+'</style></head><body>'+$('#imp').innerHTML+'</body></html>');
  } else if(window.Android && Android.printQuote){ Android.printQuote(); } else { window.print(); }
}

function recalc(){
  salvar(); atualizaBarra();
  const t=totais();
  if($('#rSub')){$('#rSub').textContent=brl(t.sub);$('#rDesc').textContent='− '+brl(t.d);$('#rTot').textContent=brl(t.total)}
}

document.addEventListener('click',e=>{
  const sf=e.target.closest('[data-saved-filter]');
  if(sf){savedFilter=sf.dataset.savedFilter;renderSalvos();return}
  if(e.target.closest('#clearCustomerHistory')){salesCustomerId=null;renderVendas();return} const period=e.target.closest('[data-sales-period]');
  if(period){salesFilterMode=period.dataset.salesPeriod;salesFilterFrom='';salesFilterTo='';renderVendas();return}
  if(e.target.id==='applySalesDates'){
    salesFilterFrom=$('#salesFrom')?.value||'';salesFilterTo=$('#salesTo')?.value||'';
    if(salesFilterFrom&&salesFilterTo&&salesFilterFrom>salesFilterTo){notificar('A data inicial deve ser anterior à data final.','error');return}
    salesFilterMode='custom';renderVendas();return;
  }
  const a=e.target.closest('[data-add]');
  if(a){vibrar(18);const id=String(a.dataset.add);const ex=cart.find(i=>String(i.id)===id);
    if(ex)ex.q++;else cart.push({id,d:byId.get(id).d,q:1,p:byId.get(id).p});
    salvar();atualizaBarra();if(view==='orc'){renderOrc();return}a.textContent='✓';setTimeout(()=>a.textContent='+',500);return}
  const d=e.target.closest('[data-del]');if(d){cart.splice(+d.dataset.del,1);salvar();render();return}
  const m=e.target.closest('[data-m]');if(m){const i=cart[+m.dataset.m];i.q=Math.max(1,i.q-1);salvar();render();return}
  const p=e.target.closest('[data-p]');if(p){cart[+p.dataset.p].q++;salvar();render();return}
  if(e.target.id==='mais'){limite+=50;renderProdutos();return}
  if(e.target.id==='saveQuote'){abrirEscolhaGravacao();return}
  if(e.target.id==='saveAsQuote'){fecharEscolhaGravacao();salvarOrcamento('quote');return}
  if(e.target.id==='saveAsSale'){fecharEscolhaGravacao();salvarOrcamento('sale');return}
  if(e.target.id==='cancelOrderSave'){fecharEscolhaGravacao();return}
  const op=e.target.closest('[data-open]');if(op){abrirOrcamentoSalvo(Number(op.dataset.open));return}
  const hp=e.target.closest('[data-hpdf]');if(hp){abrirOrcamentoSalvo(Number(hp.dataset.hpdf));setTimeout(()=>imprimir(),80);return}
  const hw=e.target.closest('[data-hwa]');if(hw){abrirOrcamentoSalvo(Number(hw.dataset.hwa));setTimeout(()=>{if(window.Android&&Android.enviarWhatsApp)Android.enviarWhatsApp(texto());else window.open('https://wa.me/?text='+encodeURIComponent(texto()),'_blank')},80);return}
  const hd=e.target.closest('[data-hdel]');if(hd){const num=Number(hd.dataset.hdel);confirmar('Excluir orçamento salvo?','O orçamento #'+String(num).padStart(4,'0')+' será removido do histórico.',()=>{orcamentos=orcamentos.filter(o=>o.numero!==num);salvarHistorico();render();notificar('Orçamento removido do histórico.')});return}
  if(e.target.id==='wa'){if(window.Android && Android.enviarWhatsApp){Android.enviarWhatsApp(texto())}else{window.open('https://wa.me/?text='+encodeURIComponent(texto()),'_blank')}return}
  if(e.target.id==='pdf'){imprimir();return}
  if(e.target.id==='limpa'){confirmar('Limpar orçamento?','Esta ação irá remover todos os itens do orçamento.',()=>{cart=[];cfg.cli='';cfg.desc='';cfg.obs='';salvar();render();notificar('Orçamento limpo.')});return}
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.dataset.q!==undefined){cart[+t.dataset.q].q=parseFloat(t.value)||0;recalc();updLine(t)}
  else if(t.dataset.pu!==undefined){cart[+t.dataset.pu].p=parseFloat(t.value)||0;recalc();updLine(t)}
  else if(t.id==='cli'){cfg.cli=t.value;salvar()}
  else if(t.id==='desc'){cfg.desc=t.value;recalc()}
  else if(t.id==='tipo'){cfg.tipo=t.value;recalc()}
  else if(t.id==='obs'){cfg.obs=t.value;salvar()}
  else if(t.id==='q'){
    limite=50;
    const valor=t.value, inicio=t.selectionStart, fim=t.selectionEnd;
    renderProdutos();
    const buscaAtual=$('#q');
    if(buscaAtual){
      // A busca fica em um contêiner persistente que muda de posição entre telas.
      // Reafirmar foco e seleção após atualizar a lista evita perder cada tecla no WebView Android.
      if(buscaAtual.value!==valor)buscaAtual.value=valor;
      try{buscaAtual.focus({preventScroll:true});buscAtualSelection(buscaAtual,inicio,fim)}catch(err){try{buscaAtual.focus();buscaAtual.setSelectionRange(inicio,fim)}catch(_) {}}
    }
  }
  else if(t.id==='quoteProductSearch'){const pos=t.selectionStart;renderOrc();const next=$('#quoteProductSearch');if(next){next.focus();next.setSelectionRange(pos,pos)}}
});
function buscAtualSelection(el,inicio,fim){
  if(!el)return;
  try{if(typeof inicio==='number'&&typeof fim==='number')el.setSelectionRange(inicio,fim)}catch(e){}
}
function updLine(inp){
  const ln=inp.closest('.qline'); const ix=+(inp.dataset.q??inp.dataset.pu);
  ln.querySelector('.tot').textContent=brl(cart[ix].q*cart[ix].p);
}
$('#t1').onclick=()=>irParaView('prod');
$('#t2').onclick=()=>irParaView('orc');
$('#t3').onclick=()=>irParaView('saved');
$('#ver').onclick=()=>irParaView('orc');
let destinoLeitor='prod';
function abrirLeitor(destino){destinoLeitor=destino||'prod';if(window.Android&&Android.scanBarcode){Android.scanBarcode()}else{notificar('O leitor precisa ser aberto pela versão instalada do aplicativo Android.','error')}}
$('#scan').onclick=()=>abrirLeitor('prod');
document.addEventListener('click',e=>{if(e.target.closest('#quoteScan'))abrirLeitor('orc')});
function barcodeLido(codigo){
  codigo=String(codigo||'').trim();
  if(!codigo)return;
  const destino=destinoLeitor;destinoLeitor='prod';
  const prod=prods.find(p=>(p.b||[]).some(b=>String(b).trim()===codigo));
  if(destino==='orc'){
    if(prod){const existente=cart.find(i=>String(i.id)===String(prod.id));if(existente)existente.q++;else cart.push({id:prod.id,d:prod.d,q:1,p:prod.p});salvar();view='orc';render();notificar('Adicionado ao pedido: '+prod.d);}
    else{view='orc';render();const busca=$('#quoteProductSearch');if(busca){busca.value=codigo;renderOrc()}notificar('Código de barras não encontrado no catálogo: '+codigo,'error')}
    return;
  }
  if(prod){const existente=cart.find(i=>String(i.id)===String(prod.id));if(existente)existente.q++;else cart.push({id:prod.id,d:prod.d,q:1,p:prod.p});salvar();view='prod';$('#q').value=codigo;render();notificar('Adicionado ao orçamento: '+prod.d);}
  else{view='prod';$('#q').value=codigo;render();notificar('Código de barras não encontrado no cadastro: '+codigo,'error');}
}

// Menu principal e importação assistida do catálogo TXT
const drawerBackdrop=$('#drawerBackdrop'), importOverlay=$('#import-overlay');
const settingsOverlay=document.getElementById('settings-overlay');
function fecharSettings(){document.body.classList.remove('settings-overlay-open');settingsOverlay.style.display='none';document.getElementById('visual-box').style.display='none';document.getElementById('company-box').style.display='none';document.getElementById('about-box').style.display='none'}
function abrirVisual(){fecharMenu();document.body.classList.add('settings-overlay-open');document.getElementById('visual-box').style.display='block';document.getElementById('company-box').style.display='none';document.getElementById('about-box').style.display='none';settingsOverlay.style.display='flex';aplicarVisual()}
function preencherEmpresaForm(){carregarEmpresa();document.getElementById('companyName').value=EMPRESA.nome||'';document.getElementById('companyTrade').value=EMPRESA.fantasia||'';document.getElementById('companyTax').value=EMPRESA.cnpj||'';document.getElementById('companyAddress').value=EMPRESA.end||'';document.getElementById('companyPhone').value=EMPRESA.telefone||'';document.getElementById('companyEmail').value=EMPRESA.email||'';const p=document.getElementById('companyLogoPreview');if(EMPRESA.logo){p.src=EMPRESA.logo;p.style.display='block'}else{p.removeAttribute('src');p.style.display='none'}document.getElementById('companyLogoFile').value=''}
function abrirEmpresa(){fecharMenu();document.body.classList.add('settings-overlay-open');document.getElementById('visual-box').style.display='none';document.getElementById('company-box').style.display='block';document.getElementById('about-box').style.display='none';preencherEmpresaForm();settingsOverlay.style.display='flex'}
function abrirSobre(){fecharMenu();document.body.classList.add('settings-overlay-open');document.getElementById('visual-box').style.display='none';document.getElementById('company-box').style.display='none';document.getElementById('about-box').style.display='block';settingsOverlay.style.display='flex'}
document.getElementById('openVisual').addEventListener('click',abrirVisual);document.getElementById('openCompany').addEventListener('click',abrirEmpresa);document.getElementById('openAbout').addEventListener('click',abrirSobre);document.getElementById('closeAbout').addEventListener('click',fecharSettings);
document.getElementById('closeVisual').addEventListener('click',fecharSettings);document.getElementById('cancelCompany').addEventListener('click',fecharSettings);
settingsOverlay.addEventListener('click',e=>{if(e.target===settingsOverlay)fecharSettings()});
document.querySelectorAll('[data-theme-choice]').forEach(b=>b.addEventListener('click',()=>{VISUAL.theme=b.dataset.themeChoice;aplicarVisual()}));
document.getElementById('companyLogoFile').addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;if(f.size>900000){notificar('Escolha um logotipo com menos de 900 KB.','error');e.target.value='';return}if(!/^image\/(png|jpeg|webp)$/.test(f.type)){notificar('Use uma imagem PNG, JPG ou WebP.','error');e.target.value='';return}const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(f)});const p=document.getElementById('companyLogoPreview');p.src=data;p.style.display='block';p.dataset.pendingLogo=data});
document.getElementById('removeCompanyLogo').addEventListener('click',()=>{document.getElementById('companyLogoPreview').removeAttribute('src');document.getElementById('companyLogoPreview').style.display='none';document.getElementById('companyLogoPreview').dataset.pendingLogo='';document.getElementById('companyLogoFile').value=''});
document.getElementById('saveCompany').addEventListener('click',()=>{const preview=document.getElementById('companyLogoPreview');const previous=EMPRESA.logo||'';EMPRESA={nome:document.getElementById('companyName').value.trim()||EMPRESA_PADRAO.nome,fantasia:document.getElementById('companyTrade').value.trim(),cnpj:document.getElementById('companyTax').value.trim(),end:document.getElementById('companyAddress').value.trim(),telefone:document.getElementById('companyPhone').value.trim(),email:document.getElementById('companyEmail').value.trim(),logo:preview.dataset.pendingLogo!==undefined?preview.dataset.pendingLogo:(preview.getAttribute('src')||previous)};try{if(!dbRaw.set('ven_empresa',JSON.stringify(EMPRESA)))throw new Error('db')}catch(e){notificar('Não foi possível salvar. A imagem pode ser muito grande.','error');return}fecharSettings();notificar('Dados da empresa salvos neste celular.')});
function abrirMenu(){fecharSettings();drawerBackdrop.style.display='block';document.body.classList.add('settings-menu-open')}
function fecharMenu(){drawerBackdrop.style.display='none';document.body.classList.remove('settings-menu-open')}
function abrirImportacao(){fecharMenu();$('#import-status').textContent='';$('#productsFile').value='';$('#codesFile').value='';importOverlay.style.display='flex'}
function fecharImportacao(){importOverlay.style.display='none'}
$('#menuClose').addEventListener('click',fecharMenu);
drawerBackdrop.addEventListener('click',e=>{if(e.target===drawerBackdrop)fecharMenu()});
$('#cancelImport').addEventListener('click',fecharImportacao);

function baixarBackupVen(){
 try{
  const dados={app:'VEN Vendas',format:1,createdAt:new Date().toISOString(),origin:dbRaw.modo,storage:{}};
  const tudo=dbRaw.tudo();Object.keys(tudo).forEach(k=>{if(k.startsWith('ven_'))dados.storage[k]=tudo[k]});
  const d=new Date(),stamp=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')+'_'+String(d.getHours()).padStart(2,'0')+String(d.getMinutes()).padStart(2,'0');
  const nome='VEN_BACKUP_'+stamp+'.json',json=JSON.stringify(dados,null,2);
  if(dbRaw.salvarBackup){
   const onde=dbRaw.salvarBackup(nome,json);
   if(!onde)throw new Error('sem destino');
   fecharMenu();notificar('Backup salvo em '+onde+'. Guarde uma cópia fora do celular.','success');return;
  }
  const blob=new Blob([json],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=nome;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  fecharMenu();notificar('Backup exportado. Guarde o arquivo em um local seguro.','success');
 }catch(e){notificar('Não foi possível exportar o backup. Verifique o espaço disponível.','error')}
}
$('#exportBackup').addEventListener('click',baixarBackupVen);
$('#importBackup').addEventListener('click',()=>{$('#backupFile').click()});
$('#backupFile').addEventListener('change',async e=>{
 const file=e.target.files&&e.target.files[0];if(!file)return;
 try{
  const data=JSON.parse(await file.text());
  if(!data||!['VEN Vendas','IAGER Vendas'].includes(data.app)||data.format!==1||!data.storage||typeof data.storage!=='object')throw new Error('invalid');
  confirmar('Restaurar cópia de segurança?', 'Os dados atuais deste navegador serão substituídos pelos dados do arquivo selecionado. Faça primeiro um backup atual se quiser preservar o que está aqui.',()=>{
   try{
    const migrarChaveLegada = k => ({visualIager:'ven_visual',empresaIager:'ven_empresa',clientesIager:'ven_clientes',vendasIager:'ven_vendas',iagerMetasVendas:'ven_metasVendas',catalogoImportado:'ven_catalogoImportado',catalogoLimpo:'ven_catalogoLimpo',produtosManuais:'ven_produtosManuais',cart:'ven_cart',cfg:'ven_cfg',orcamentosSalvos:'ven_orcamentosSalvos',ultimoNumeroOrcamento:'ven_ultimoNumeroOrcamento',ultimoNumeroVenda:'ven_ultimoNumeroVenda'})[k] || k.replace(/^iagerMetaVendas_/,'ven_metaVendas_');
    const novo={};Object.entries(data.storage).forEach(([k,v])=>{if(typeof v==='string'&&!k.startsWith('__')){novo[migrarChaveLegada(k)]=v}});
    if(!dbRaw.substituir(novo))throw new Error('restore');
    notificar('Backup restaurado. O aplicativo será recarregado.','success');
    setTimeout(()=>location.reload(),500);
   }catch(err){notificar('Não foi possível restaurar: o armazenamento pode estar cheio.','error')}
  });
 }catch(err){notificar('Arquivo inválido ou incompatível com o VEN.','error')}
 finally{e.target.value=''}
});

$('#backupInfo').addEventListener('click',()=>{fecharMenu();notificar('Orçamentos e catálogo importado ficam neste celular. Faça cópia de segurança antes de limpar os dados ou desinstalar o app.','error')});
importOverlay.addEventListener('click',e=>{if(e.target===importOverlay)fecharImportacao()});
drawerBackdrop.querySelectorAll('[data-menu]').forEach(b=>b.addEventListener('click',()=>{fecharMenu();irParaView(b.dataset.menu==='saved'?'saved':'orc')}));
async function lerArquivo(input){const f=input.files&&input.files[0];if(!f)throw Error('Selecione os dois arquivos TXT.');const bytes=await f.arrayBuffer();try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch(e){return new TextDecoder('windows-1252').decode(bytes)}}
function aplicarCatalogoImportado(novo){
 // Persiste os dados e reconstrói os índices antes de atualizar a tela.
 store.set('ven_catalogoImportado',novo);store.set('ven_catalogoLimpo',false);
 produtosImportados=novo.products.map(p=>normalizarProduto({...p,c:0,img:'',manual:false}));
 reconstruirProdutos();
 // Mantém o carrinho e os orçamentos históricos. Força a tela a ser redesenhada
 // depois que o overlay fecha, evitando a tela aparentemente vazia até navegar de volta.
 cart=cart.map(i=>({...i,id:String(i.id),d:i.d||((byId.get(String(i.id))||{}).d)||''}));salvar();
 fecharImportacao();view='prod';$('#q').value='';
 document.body.classList.remove('home-mode');
 render();window.scrollTo(0,0);
 requestAnimationFrame(()=>{
   render();window.scrollTo(0,0);
   notificar('Catálogo atualizado: '+produtosImportados.length+' importados e '+ven_produtosManuais.length+' produtos manuais.','success');
 });
}
$('#runImport').addEventListener('click',async()=>{
 const btn=$('#runImport');btn.disabled=true;btn.textContent='Lendo arquivos…';$('#import-status').textContent='';
 try{
  if(!$('#productsFile').files?.length||!$('#codesFile').files?.length)throw new Error('Selecione os dois arquivos: Produtos.TXT e Codigo.TXT antes de importar.');
  const prodText=await lerArquivo($('#productsFile'));const codText=await lerArquivo($('#codesFile'));
  const novo=construirCatalogo(prodText,codText);
  confirmar('Conferir catálogo antes de importar',`Produtos lidos: ${novo.productsRows}
Produtos válidos: ${novo.products.length}
Linhas de códigos lidas: ${novo.codesRows}
Códigos de barras vinculados: ${novo.barCount}

Deseja instalar este catálogo neste celular? Os orçamentos salvos serão mantidos.`,()=>aplicarCatalogoImportado(novo));
 }catch(err){$('#import-status').textContent=err&&err.message?err.message:'Falha ao ler os arquivos. O catálogo atual foi mantido.';notificar('Não foi possível importar os arquivos. Confira o formato TXT.','error')}
 finally{btn.disabled=false;btn.textContent='Importar catálogo'}
});
// Cadastro manual de produtos, limpeza segura do catálogo e imagens
const productOverlay=document.getElementById('product-overlay');
let editingProductId=null, pendingProductImage='';
function abrirCadastroProduto(id=null){
 fecharMenu();editingProductId=id;pendingProductImage='';
 const p=id?prods.find(x=>String(x.id)===String(id)):null;
 $('#productTitle').textContent=p?'Editar produto':'Cadastrar produto';
 $('#prodName').value=p?.d||'';$('#prodCode').value=p?.manual?p.id:(p?.id||'');$('#prodBarcode').value=(p?.b||[]).join(', ');
 $('#prodCost').value=Number(p?.c)||0;$('#prodPrice').value=Number(p?.p)||0;$('#prodStock').value=Number(p?.q)||0;$('#prodLocation').value=p?.l||'';$('#prodImageUrl').value=p?.img&&!p.img.startsWith('data:')?p.img:'';
 const preview=$('#productImagePreview');const img=p?.img||'';if(img){preview.src=img;preview.style.display='block';pendingProductImage=img}else{preview.removeAttribute('src');preview.style.display='none'}
 $('#prodImageFile').value='';productOverlay.style.display='flex';
}
function fecharCadastroProduto(){productOverlay.style.display='none';editingProductId=null;pendingProductImage=''}
document.addEventListener('click',e=>{if(e.target.closest('#startFirstProduct'))abrirCadastroProduto()});
$('#cancelProduct').addEventListener('click',fecharCadastroProduto);
productOverlay.addEventListener('click',e=>{if(e.target===productOverlay)fecharCadastroProduto()});
document.addEventListener('click',e=>{const ed=e.target.closest('[data-edit-product]');if(ed)abrirCadastroProduto(ed.dataset.editProduct)});
$('#prodImageUrl').addEventListener('input',()=>{const url=$('#prodImageUrl').value.trim();pendingProductImage=url;if(url){$('#productImagePreview').src=url;$('#productImagePreview').style.display='block'}else if(!$('#prodImageFile').files.length){$('#productImagePreview').removeAttribute('src');$('#productImagePreview').style.display='none'}});
$('#prodImageFile').addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;if(!/^image\/(png|jpeg|webp)$/.test(f.type)){notificar('Escolha uma imagem PNG, JPG ou WebP.','error');e.target.value='';return}try{const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(f)});const im=new Image();im.onload=()=>{const scale=Math.min(1,600/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));c.getContext('2d').drawImage(im,0,0,c.width,c.height);pendingProductImage=c.toDataURL('image/jpeg',0.78);$('#productImagePreview').src=pendingProductImage;$('#productImagePreview').style.display='block';$('#prodImageUrl').value='';};im.onerror=()=>{pendingProductImage=data;$('#productImagePreview').src=data;$('#productImagePreview').style.display='block'};im.src=data}catch(err){notificar('Não foi possível ler a imagem.','error')}});
$('#removeProductImage').addEventListener('click',()=>{pendingProductImage='';$('#prodImageUrl').value='';$('#prodImageFile').value='';$('#productImagePreview').removeAttribute('src');$('#productImagePreview').style.display='none'});
$('#saveProduct').addEventListener('click',()=>{
 const name=$('#prodName').value.trim();if(!name){notificar('Informe o nome do produto.','error');$('#prodName').focus();return}
 const bar=$('#prodBarcode').value.split(/[;,\s]+/).map(x=>x.trim()).filter(Boolean);
 let id;
 if(editingProductId!==null){id=String(editingProductId)}else{id=$('#prodCode').value.trim()||proximoCodigoManual();if(byId.has(id)){notificar('Já existe um produto com esse código. Informe outro código interno.','error');return}}
 const existing=prods.find(p=>String(p.id)===id);const isManual=existing?!!existing.manual:true;
 const img=$('#prodImageUrl').value.trim()||pendingProductImage||'';
 const product=normalizarProduto({id,d:name,c:Math.max(0,Number($('#prodCost').value)||0),p:Math.max(0,Number($('#prodPrice').value)||0),q:Number($('#prodStock').value)||0,l:$('#prodLocation').value.trim(),b:bar,img,manual:isManual,key:id});
 if(existing&&existing.manual){ven_produtosManuais=ven_produtosManuais.filter(x=>String(x.id)!==id);ven_produtosManuais.push(product)}else if(existing){produtosImportados=produtosImportados.map(x=>String(x.id)===id?{...x,...product,manual:false}:x);const cat=store.get('ven_catalogoImportado',null);if(cat&&Array.isArray(cat.products)){cat.products=produtosImportados;store.set('ven_catalogoImportado',cat)}}else ven_produtosManuais.push(product);
 reconstruirProdutos();salvar();fecharCadastroProduto();view='prod';render();notificar(existing?'Produto atualizado.':'Produto cadastrado.');
});
$('#clearCatalog').addEventListener('click',()=>{fecharMenu();confirmar('Limpar banco de produtos?','Serão apagados os produtos importados e os cadastrados manualmente deste celular. Os orçamentos salvos serão mantidos. Esta ação não pode ser desfeita.',()=>{store.set('ven_catalogoImportado',null);store.set('ven_produtosManuais',[]);store.set('ven_catalogoLimpo',true);produtosImportados=[];ven_produtosManuais=[];reconstruirProdutos();cart=[];salvar();view='prod';$('#q').value='';render();notificar('Banco de produtos limpo. Os orçamentos salvos foram mantidos.','success')})});
$('#resetAppData').addEventListener('click',()=>{fecharMenu();confirmar('Zerar todos os dados comerciais?', `Esta ação apagará definitivamente:
• catálogo importado e produtos cadastrados
• clientes
• orçamentos salvos
• vendas, pagamentos e vencimentos
• orçamento em andamento e numerações

O nome, CNPJ, endereço, logotipo e aparência do aplicativo serão mantidos. Faça uma cópia de segurança antes de continuar.`,()=>{
 store.set('ven_catalogoImportado',null);store.set('ven_catalogoLimpo',true);store.set('ven_produtosManuais',[]);
 store.set('ven_cart',[]);store.set('ven_cfg',{cli:'',desc:'',tipo:'%',obs:'Orçamento válido por 5 dias.'});
 store.set('ven_orcamentosSalvos',[]);store.set('ven_clientes',[]);store.set('ven_vendas',[]);
 store.set('ven_ultimoNumeroOrcamento',0);store.set('ven_ultimoNumeroVenda',0);
 produtosImportados=[];ven_produtosManuais=[];cart=[];cfg={cli:'',desc:'',tipo:'%',obs:'Orçamento válido por 5 dias.'};orcamentos=[];clientes=[];vendas=[];editingCustomerId=null;quoteForSale=null;
 reconstruirProdutos();salvar();view='home';limite=50;$('#q').value='';render();scrollTo(0,0);notificar('Aplicativo zerado. Produtos, clientes, orçamentos e vendas foram removidos. Dados da empresa e aparência foram mantidos.','success');
})});

document.addEventListener('click',e=>{
 const homeNew=e.target.closest('#homeNewOrder');
 if(homeNew){e.preventDefault();e.stopImmediatePropagation();iniciarNovoPedido();return}
 if(e.target.closest('[data-ag-open-sales]')){irParaView('sales');return}
 if(e.target.closest('[data-open-agenda]')){irParaView('agenda');return}
 const action=e.target.closest('[data-home-action]');
 if(action){if(document.activeElement && document.activeElement.matches('input,textarea'))document.activeElement.blur();document.body.classList.remove('keyboard-open');navegarHome(action.dataset.homeAction);return}
 if(e.target.closest('#hm-menu-btn')){if(document.body.classList.contains('settings-menu-open'))fecharMenu();else abrirMenu();return}
 const nav=e.target.closest('[data-home-nav]');
 if(nav){if(document.activeElement && document.activeElement.matches('input,textarea'))document.activeElement.blur();document.body.classList.remove('keyboard-open');fecharMenu();fecharSettings();navegarHome(nav.dataset.homeNav)}
});


// Oculta apenas a navegação inferior quando o teclado virtual reduz a área visível.
const keyboardViewport=window.visualViewport;
let keyboardBaseHeight=keyboardViewport?keyboardViewport.height:window.innerHeight;
function atualizarTecladoVirtual(){
 const altura=keyboardViewport?keyboardViewport.height:window.innerHeight;
 const campoAtivo=!!document.activeElement?.matches('input,textarea');
 if(!campoAtivo)keyboardBaseHeight=altura;
 const zoomado=!!keyboardViewport&&Math.abs((keyboardViewport.scale||1)-1)>.01;
 const ativo=campoAtivo && !zoomado && !!keyboardViewport && keyboardBaseHeight-altura>120;
 if(campoAtivo&&!ativo)keyboardBaseHeight=altura;
 document.body.classList.toggle('keyboard-nav-hidden',ativo);
}
['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t,e=>e.preventDefault()));
document.addEventListener('touchmove',e=>{if(e.touches&&e.touches.length>1)e.preventDefault()},{passive:false});
document.addEventListener('input',e=>{if(e.target.matches('#q'))document.body.classList.toggle('prod-search-active',!!e.target.value.trim())});
document.addEventListener('focusin',e=>{if(e.target.matches('input,textarea'))setTimeout(atualizarTecladoVirtual,120)});
document.addEventListener('focusout',()=>setTimeout(atualizarTecladoVirtual,180));
if(keyboardViewport)keyboardViewport.addEventListener('resize',atualizarTecladoVirtual);
window.addEventListener('resize',atualizarTecladoVirtual);
document.addEventListener('visibilitychange',atualizarTecladoVirtual);

render();


// Navegacao do botao Voltar do Android. Mantida dentro do script principal.
/* ===== Seletores no estilo do app =====
   Substituem a lista (select), o calendário (input date) e as sugestões (datalist) nativos do Android,
   que abriam sempre brancos. Aqui tudo segue o tema claro/escuro. */
let pkEl=null;
function fecharPicker(){if(!pkEl)return;const el=pkEl;pkEl=null;el.classList.remove('on');setTimeout(()=>el.remove(),180)}
function abrirSheet(titulo,corpo,ligar){
 fecharPicker();
 const el=document.createElement('div');el.className='pk-backdrop';
 el.innerHTML='<div class="pk-sheet" role="dialog" aria-modal="true" aria-label="'+esc(titulo)+'"><div class="pk-grip"></div><div class="pk-title">'+esc(titulo)+'</div>'+corpo+'</div>';
 el.addEventListener('click',e=>{if(e.target===el)fecharPicker()});
 document.body.appendChild(el);pkEl=el;ligar(el.querySelector('.pk-sheet'));
 requestAnimationFrame(()=>el.classList.add('on'));
}
function rotuloCampo(ctl){const l=ctl.closest('label');if(l){const t=[...l.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());if(t)return t.textContent.trim()}return ctl.getAttribute('aria-label')||'Selecionar'}
const PK_ROTULOS={tipo:{'%':'Percentual (%)','R$':'Valor em reais (R$)'}};
function dispararMudanca(ctl){ctl.dispatchEvent(new Event('input',{bubbles:true}));ctl.dispatchEvent(new Event('change',{bubbles:true}))}
function abrirSelect(sel){
 const extra=PK_ROTULOS[sel.id]||{};
 const corpo='<div class="pk-list">'+[...sel.options].map((o,i)=>'<button type="button" class="pk-opt'+(o.selected?' on':'')+'" data-i="'+i+'"><span>'+esc(extra[o.value]||o.textContent)+'</span><i class="pk-check"></i></button>').join('')+'</div>';
 abrirSheet(rotuloCampo(sel),corpo,sheet=>sheet.addEventListener('click',e=>{const b=e.target.closest('.pk-opt');if(!b)return;sel.selectedIndex=Number(b.dataset.i);dispararMudanca(sel);fecharPicker()}));
}
function abrirData(inp){
 const iso=(y,m,d)=>y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
 const agora=new Date(),hojeISO=iso(agora.getFullYear(),agora.getMonth(),agora.getDate());
 let base=inp.value?new Date(inp.value+'T12:00:00'):agora;if(isNaN(base))base=agora;
 let ano=base.getFullYear(),mes=base.getMonth();
 abrirSheet(rotuloCampo(inp),'<div class="pk-cal"></div><div class="pk-foot"><button type="button" data-a="clear">Limpar</button><button type="button" data-a="today" class="pri">Hoje</button></div>',sheet=>{
  const cal=sheet.querySelector('.pk-cal');
  const desenhar=()=>{
   const primeiro=new Date(ano,mes,1).getDay(),dias=new Date(ano,mes+1,0).getDate();
   const nome=new Date(ano,mes,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
   let g='';for(let i=0;i<primeiro;i++)g+='<i></i>';
   for(let d=1;d<=dias;d++){const v=iso(ano,mes,d);g+='<button type="button" data-d="'+v+'" class="'+(v===hojeISO?'today ':'')+(v===inp.value?'sel':'')+'">'+d+'</button>'}
   cal.innerHTML='<div class="pk-cal-head"><button type="button" data-nav="-1" aria-label="Mês anterior">‹</button><b>'+esc(nome)+'</b><button type="button" data-nav="1" aria-label="Próximo mês">›</button></div><div class="pk-dow"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div><div class="pk-days">'+g+'</div>';
  };
  desenhar();
  sheet.addEventListener('click',e=>{
   const nav=e.target.closest('[data-nav]');if(nav){mes+=Number(nav.dataset.nav);if(mes<0){mes=11;ano--}if(mes>11){mes=0;ano++}desenhar();return}
   const dia=e.target.closest('[data-d]');const acao=e.target.closest('[data-a]');
   if(dia)inp.value=dia.dataset.d;else if(acao)inp.value=acao.dataset.a==='today'?hojeISO:'';else return;
   dispararMudanca(inp);fecharPicker();
  });
 });
}
// Os campos nativos ficam sem toque (pointer-events:none no CSS); o toque é reconhecido pela posição do campo.
document.addEventListener('click',e=>{
 if(!e.isTrusted||e.target.closest('.pk-backdrop'))return;
 for(const ctl of document.querySelectorAll('select,input[type="date"]')){
  const raiz=ctl.parentElement;if(!raiz||!raiz.contains(e.target))continue;
  const r=ctl.getBoundingClientRect();
  if(r.width&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){
   e.preventDefault();if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
   if(ctl.tagName==='SELECT')abrirSelect(ctl);else abrirData(ctl);return;
  }
 }
},true);
// Sugestões de cliente no pedido (no lugar do datalist nativo)
(function(){
 let box=null;const fechar=()=>{if(box){box.remove();box=null}};
 function mostrar(inp){
  fechar();if(document.activeElement!==inp)return;
  const q=norm(inp.value);
  const lista=clientes.filter(c=>c.nome&&norm(c.nome).includes(q)&&norm(c.nome)!==q).slice(0,6);
  if(!lista.length)return;
  box=document.createElement('div');box.className='sg-list';
  box.innerHTML=lista.map(c=>'<button type="button" class="sg-opt" data-n="'+esc(c.nome)+'"><b>'+esc(c.nome)+'</b>'+(c.telefone?'<small>'+esc(c.telefone)+'</small>':'')+'</button>').join('');
  box.addEventListener('pointerdown',e=>{const b=e.target.closest('.sg-opt');if(!b)return;e.preventDefault();inp.value=b.dataset.n;inp.dispatchEvent(new Event('input',{bubbles:true}));fechar();inp.blur()});
  document.body.appendChild(box);
  const r=inp.getBoundingClientRect(),h=box.offsetHeight,abaixo=r.bottom+4+h<=innerHeight*.62;
  box.style.left=r.left+'px';box.style.width=r.width+'px';box.style.top=(abaixo?r.bottom+4:Math.max(8,r.top-4-h))+'px';
 }
 document.addEventListener('focusin',e=>{if(e.target.id==='cli')mostrar(e.target)});
 document.addEventListener('input',e=>{if(e.target.id==='cli')mostrar(e.target)});
 document.addEventListener('focusout',e=>{if(e.target.id==='cli')setTimeout(fechar,150)});
 window.addEventListener('scroll',fechar,true);
})();

/* ===== v1.54: vibração, agenda de pendências e avisos de vencimento ===== */
function vibrar(ms){try{if(window.Android&&Android.vibrar)Android.vibrar(ms||18);else if(navigator.vibrate)navigator.vibrate(ms||18)}catch(e){}}
function isoLocal(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function saldoVenda(v){return Math.max(0,Math.round(((Number(v.total)||0)-(Number(v.recebido)||0))*100)/100)}
function pendencias(){
 const hoje=isoLocal(new Date());
 const lista=vendas.filter(v=>v.status!=='paid'&&saldoVenda(v)>0).map(v=>{
  const venc=v.vencimento||'';
  const dias=venc?Math.round((new Date(venc+'T12:00:00')-new Date(hoje+'T12:00:00'))/86400000):null;
  return {v,venc,dias,saldo:saldoVenda(v),grupo:dias===null?'sem':dias<0?'vencida':dias===0?'hoje':'prox'};
 });
 const ord=(a,b)=>(a.venc||'9999').localeCompare(b.venc||'9999')||a.v.numero-b.v.numero;
 return {todas:lista.sort(ord),vencidas:lista.filter(x=>x.grupo==='vencida').sort(ord),hoje:lista.filter(x=>x.grupo==='hoje'),prox:lista.filter(x=>x.grupo==='prox').sort(ord),sem:lista.filter(x=>x.grupo==='sem')};
}
function textoPrazo(x){if(x.dias===null)return 'Sem vencimento';const d=new Date(x.venc+'T12:00:00').toLocaleDateString('pt-BR');if(x.dias<0)return 'Venceu '+d+' · '+Math.abs(x.dias)+(Math.abs(x.dias)===1?' dia':' dias')+' de atraso';if(x.dias===0)return 'Vence hoje · '+d;if(x.dias===1)return 'Vence amanhã · '+d;return 'Vence '+d+' · em '+x.dias+' dias'}
function renderAgenda(){
 const P=pendencias();const totalAberto=P.todas.reduce((a,x)=>a+x.saldo,0);const totalVenc=P.vencidas.reduce((a,x)=>a+x.saldo,0);
 let h=`<section class="screen-head"><div class="screen-kicker">COBRANÇAS</div><div class="screen-title-row"><div><h2 class="screen-title">Agenda de vendas</h2><p class="screen-desc">Vendas pendentes por data de vencimento.</p></div><span class="screen-count">${P.todas.length}</span></div></section>`;
 if(!P.todas.length){$('#main').innerHTML=h+`<div class="ag-sum"><div><small>A receber</small><b>${brl(0)}</b></div><div><small>Vencido</small><b>${brl(0)}</b></div></div><div class="empty">Nenhuma venda pendente.<br>Tudo recebido por aqui.</div><button type="button" class="btn pri" data-ag-open-sales style="width:100%;margin-top:12px">Consultar histórico de vendas</button>`;return}
 h+=`<div class="ag-sum"><div><small>A receber</small><b>${brl(totalAberto)}</b></div><div class="${P.vencidas.length?'bad':''}"><small>Vencido</small><b>${brl(totalVenc)}</b></div></div>`;
 const grupos=[['vencida','Vencidas','bad',P.vencidas],['hoje','Vencem hoje','warn',P.hoje],['prox','Próximas','',P.prox],['sem','Sem vencimento','',P.sem]];
 grupos.forEach(([k,t,cls,arr])=>{if(!arr.length)return;h+=`<div class="rp-sec ag-sec ${cls}">${t}<small>${arr.length}</small></div>`;
  arr.forEach(x=>{const v=x.v;const tel=(v.clienteSnapshot&&v.clienteSnapshot.telefone)||(clientes.find(c=>String(c.id)===String(v.clienteId))||{}).telefone||'';
   h+=`<article class="crm-card ag-card ${cls}"><div class="ag-top"><div><b>${esc(v.clienteNome||'Sem cliente')}</b><small>Venda #${String(v.numero).padStart(4,'0')} · ${esc(v.pagamento||'')}</small><small class="ag-prazo">${esc(textoPrazo(x))}</small></div><div class="ag-val"><strong>${brl(x.saldo)}</strong>${(Number(v.recebido)||0)>0?`<small>de ${brl(v.total)}</small>`:''}</div></div><div class="oc-actions"><button class="btn" data-ag-cobrar="${v.numero}"${tel?'':' disabled'}>Cobrar</button><button class="btn pri" data-ag-receber="${v.numero}">Receber</button><button class="btn" data-sale-receipt="${v.numero}">Recibo</button></div></article>`})});
 $('#main').innerHTML=h;
}
function abrirReceber(numero){
 const v=vendas.find(x=>Number(x.numero)===Number(numero));if(!v)return;const s=saldoVenda(v);
 abrirSheet('Receber · Venda #'+String(v.numero).padStart(4,'0'),`<div class="ag-sheet"><p>${esc(v.clienteNome||'Sem cliente')} · saldo <b>${brl(s)}</b></p><label>Valor recebido agora<input id="agValor" type="number" inputmode="decimal" step="0.01" min="0" value="${s.toFixed(2)}"></label><div class="ag-sheet-actions"><button type="button" class="btn" id="agTudo">Receber tudo</button><button type="button" class="btn pri" id="agOk">Confirmar</button></div></div>`,sh=>{
  const aplicar=val=>{val=Math.round((Number(val)||0)*100)/100;if(val<=0){notificar('Informe um valor maior que zero.','error');return}if(val>s+0.001){notificar('O valor é maior que o saldo da venda.','error');return}
   v.recebido=Math.round(((Number(v.recebido)||0)+val)*100)/100;v.pagamentos=(v.pagamentos||[]).concat([{data:new Date().toISOString(),valor:val}]);
   if(saldoVenda(v)<=0){v.status='paid';v.recebido=v.total;v.pagoEm=new Date().toISOString()}else v.status='partial';
   salvarVendas();fecharPicker();vibrar(30);if(view==='agenda')renderAgenda();else render();notificar(v.status==='paid'?'Venda quitada.':'Recebimento registrado.')};
  sh.querySelector('#agOk').onclick=()=>aplicar(sh.querySelector('#agValor').value);
  sh.querySelector('#agTudo').onclick=()=>aplicar(s);
 });
}
function cobrarVenda(numero){
 const v=vendas.find(x=>Number(x.numero)===Number(numero));if(!v)return;
 const tel=(v.clienteSnapshot&&v.clienteSnapshot.telefone)||(clientes.find(c=>String(c.id)===String(v.clienteId))||{}).telefone||'';
 const url=whatsappClienteUrl(tel);if(!url){notificar('Cliente sem telefone válido.','error');return}
 const x=pendencias().todas.find(p=>p.v===v);
 const msg='Olá, '+(v.clienteNome||'')+'! Tudo bem? Aqui é da '+(EMPRESA.fantasia||EMPRESA.nome||'VEN')+'. Passando para lembrar do saldo de '+brl(saldoVenda(v))+' da venda #'+String(v.numero).padStart(4,'0')+(v.vencimento?(x&&x.dias<0?', vencido em ':', com vencimento em ')+new Date(v.vencimento+'T12:00:00').toLocaleDateString('pt-BR'):'')+'. Qualquer dúvida estou à disposição.';
 const link=url+'?text='+encodeURIComponent(msg);
 if(window.Android)location.href=link;else window.open(link,'_blank');
}
let ultimoAviso='';
function sincronizarAvisos(){
 try{const P=pendencias();
  const itens=P.todas.filter(x=>x.venc).map(x=>{const d=new Date(x.venc+'T09:00:00');d.setDate(d.getDate()+1);return {id:x.v.numero,quando:d.getTime(),titulo:'Venda vencida · '+(x.v.clienteNome||'Sem cliente'),texto:'Saldo de '+brl(x.saldo)+' (venda #'+String(x.v.numero).padStart(4,'0')+') venceu em '+new Date(x.venc+'T12:00:00').toLocaleDateString('pt-BR')+'.'}});
  const json=JSON.stringify(itens);if(json===ultimoAviso)return;ultimoAviso=json;
  if(window.Android&&Android.agendarAvisos)Android.agendarAvisos(json);
 }catch(e){}
}
function avisarVencidasAoAbrir(){const P=pendencias();const n=P.vencidas.length;if(n){const t=P.vencidas.reduce((a,x)=>a+x.saldo,0);notificar(n+(n===1?' venda vencida':' vendas vencidas')+' · '+brl(t)+' a receber','error')}}
document.addEventListener('click',e=>{
 const r=e.target.closest('[data-ag-receber]');if(r){abrirReceber(r.dataset.agReceber);return}
 const c=e.target.closest('[data-ag-cobrar]');if(c&&!c.disabled){cobrarVenda(c.dataset.agCobrar);return}
});
function destinoNativo(){try{if(window.Android&&Android.destinoInicial){const d=Android.destinoInicial();if(d==='agenda'){irParaView('agenda',false)}}}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden){destinoNativo();sincronizarAvisos()}});
setTimeout(()=>{sincronizarAvisos();destinoNativo();if(view==='home')avisarVencidasAoAbrir()},1200);
let backSairAte=0;
function handleAndroidBack(){
  if(pkEl){fecharPicker();return true}
  const visivel = el => { if(!el) return false; const st=getComputedStyle(el); return st.display!=='none' && st.visibility!=='hidden' && st.opacity!=='0'; };
  // 1) Janelas abertas: fecha a mais "de cima" primeiro.
  const confirmOverlay=document.getElementById('confirm-overlay');
  if(visivel(confirmOverlay)){
    const cancel=document.getElementById('confirm-cancel');
    if(cancel){cancel.click();}else{confirmOverlay.style.display='none';}
    return true;
  }
  const orderSaveOverlay=document.getElementById('order-save-overlay');
  if(visivel(orderSaveOverlay)){fecharEscolhaGravacao();return true;}
  const fechadores=[
    ['sale-overlay',()=>fecharVendaModal()],
    ['customer-overlay',()=>fecharCadastroCliente()],
    ['product-overlay',()=>fecharCadastroProduto()],
    ['import-overlay',()=>fecharImportacao()],
    ['settings-overlay',()=>fecharSettings()],
    ['drawerBackdrop',()=>fecharMenu()]
  ];
  for(const [id,fechar] of fechadores){
    const el=document.getElementById(id);
    if(visivel(el)){ try{fechar()}catch(e){el.style.display='none'} return true; }
  }
  // 2) Teclado de busca aberto.
  if(document.body.classList.contains('keyboard-nav-hidden')){
    document.body.classList.remove('keyboard-nav-hidden');
    if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
    return true;
  }
  // 3) Tela interna: volta para a anterior (ignora entradas repetidas do histórico) ou para a Home.
  if(view!=='home'){
    let destino='home';
    while(navigationHistory.length){const d=navigationHistory.pop(); if(d!==view){destino=d;break}}
    irParaView(destino,false);
    return true;
  }
  // 4) Home: só sai com dois toques seguidos (evita fechar sem querer).
  navigationHistory.length=0;
  if(Date.now()<backSairAte) return false;
  backSairAte=Date.now()+2500;
  notificar('Toque em Voltar de novo para sair do app.');
  return true;
}
