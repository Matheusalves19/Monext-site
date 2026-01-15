// =====================================================
// 🔐 Recupera e valida sessão (CORRETO)
// =====================================================
const sessao = JSON.parse(localStorage.getItem("usuarioLogado"));

if (
  !sessao ||
  !sessao.nome ||
  !sessao.senha ||
  !sessao.perfil
) {
  alert("Sessão expirada. Faça login novamente.");
  window.location.href = "index.html";
  throw new Error("Sessão inválida");
}

const usuario = sessao.nome;
const senhaUsuario = sessao.senha;
const perfilUsuario = sessao.perfil;

// idCaixa agora é OPCIONAL
const idCaixa = Number(sessao.idCaixa || 0);


// =====================================================
// 🔗 Integração com o caixa
// =====================================================
let saldoCaixa = parseFloat(localStorage.getItem("saldoCaixa") || "0");
let caixaAberto = localStorage.getItem("caixaAberto") === "true";

// =====================================================
// 📦 Dados
// =====================================================
let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
const senhaAdmin = "admin";

// =====================================================
// 🧾 Funções utilitárias
// =====================================================
function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;

  return resto === parseInt(cpf.charAt(10));
}

function formatarCPF(cpf) {
  return cpf.replace(/\D/g, "")
            .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function calcularDivida(cliente) {
  let total = 0;
  cliente.emprestimos?.forEach(emp =>
    emp.parcelas.forEach(p => {
      if (!p.pago) total += p.valor;
    })
  );
  cliente.divida = total;
  return total;
}

function atualizarSaldo() {
  localStorage.setItem("saldoCaixa", saldoCaixa.toFixed(2));
}

// =====================================================
// 📋 Renderizar clientes
// =====================================================
function renderizarClientes(filtro = "") {
  const tabela = document.getElementById("tabelaClientes");
  tabela.innerHTML = "";

  const filtrados = clientes.filter(c =>
    c.caixaId === idCaixa &&
    (
      c.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      c.id.toString().includes(filtro) ||
      c.cpf.includes(filtro.replace(/\D/g, ""))
    )
  );

  filtrados.forEach(c => {
    calcularDivida(c);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${c.nome}</td>
      <td>${formatarCPF(c.cpf)}</td>
      <td>R$ ${c.divida.toFixed(2)}</td>
      <td>
        <div class="d-flex gap-1">
          <button class="btn btn-success btn-sm btn-novo" data-id="${c.id}">Novo</button>
          <button class="btn btn-primary btn-sm btn-editar" data-id="${c.id}">Editar</button>
          <button class="btn btn-danger btn-sm btn-excluir" data-id="${c.id}">Excluir</button>
          <button class="btn btn-info btn-sm btn-detalhes" data-id="${c.id}">Detalhes</button>
        </div>
      </td>
      <td>${c.dataUltimaAlteracao || "—"}</td>
    `;
    tabela.appendChild(tr);
  });
}

// =====================================================
// 💰 Empréstimos
// =====================================================
function abrirModalEmprestimo(id) {
  document.getElementById("clienteIdEmprestimo").value = id;
  document.getElementById("parcelasEmprestimo").value = 1;
  document.getElementById("vencimento4-container").style.display = "none";
  new bootstrap.Modal(document.getElementById("modalEmprestimo")).show();
}

document.getElementById("btnSalvarEmprestimo").addEventListener("click", () => {
  const id = Number(document.getElementById("clienteIdEmprestimo").value);
  const valor = parseFloat(document.getElementById("valorEmprestimo").value);
  const juros = parseFloat(document.getElementById("jurosEmprestimo").value);
  const parcelas = Number(document.getElementById("parcelasEmprestimo").value);
  const senha = document.getElementById("senhaEmprestimo").value;

  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  if (senha !== senhaUsuario) return alert("Senha incorreta!");

  const total = valor + (valor * juros / 100);
  const valorParcela = parseFloat((total / parcelas).toFixed(2));

  const emprestimo = {
    id: Date.now(),
    valorOriginal: valor,
    juros,
    totalComJuros: total,
    parcelas: [],
    dataEmprestimo: new Date().toLocaleString("pt-BR")
  };

  for (let i = 0; i < parcelas; i++) {
    emprestimo.parcelas.push({
      numero: i + 1,
      valor: valorParcela,
      pago: false
    });
  }

  cliente.emprestimos = cliente.emprestimos || [];
  cliente.emprestimos.push(emprestimo);
  cliente.dataUltimaAlteracao = new Date().toLocaleString("pt-BR");

  saldoCaixa -= valor;
  atualizarSaldo();

  localStorage.setItem("clientes", JSON.stringify(clientes));
  renderizarClientes();

  bootstrap.Modal.getInstance(document.getElementById("modalEmprestimo")).hide();
});

// =====================================================
// 🔍 Pesquisa / Voltar
// =====================================================
document.getElementById("pesquisa-cliente")
  .addEventListener("input", e => renderizarClientes(e.target.value));

document.getElementById("btnVoltar")
  .addEventListener("click", () => window.location.href = "painel.html");

// =====================================================
// 🎯 Ações da tabela
// =====================================================
document.getElementById("tabelaClientes").addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = Number(btn.dataset.id);

  if (btn.classList.contains("btn-novo")) {
    abrirModalEmprestimo(id);
  }

  if (btn.classList.contains("btn-excluir")) {
    const senha = prompt("Senha do ADMIN:");
    if (senha === senhaAdmin) {
      clientes = clientes.filter(c => c.id !== id);
      localStorage.setItem("clientes", JSON.stringify(clientes));
      renderizarClientes();
    } else {
      alert("Senha incorreta!");
    }
  }
});

// =====================================================
// ▶ Inicialização
// =====================================================
renderizarClientes();
atualizarSaldo();

