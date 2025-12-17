document.addEventListener("DOMContentLoaded", () => {

  // ===============================
  // 🔐 SESSÃO
  // ===============================
  let sessao = {};
  try {
    sessao = JSON.parse(localStorage.getItem("usuarioLogado")) || {};
  } catch (e) {
    sessao = {};
  }

  if (!sessao.id && !sessao.nome) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "index.html";
    return;
  }

  const usuario = sessao.nome;
  const senhaUsuario = sessao.senha;
  const idCaixa = parseInt(sessao.idCaixa || "0");

  // ===============================
  // 🔗 CAIXA
  // ===============================
  let saldoCaixa = parseFloat(localStorage.getItem("saldoCaixa") || "0");
  let caixaAberto = localStorage.getItem("caixaAberto") === "true";

  function atualizarSaldo() {
    const saldoSpan = document.getElementById("saldo-caixa");
    if (saldoSpan) {
      saldoSpan.textContent = saldoCaixa.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });
    }
    localStorage.setItem("saldoCaixa", saldoCaixa.toFixed(2));
  }

  atualizarSaldo();

  // ===============================
  // 📦 CLIENTES
  // ===============================
  let clientes = JSON.parse(localStorage.getItem("clientes") || "[]");

  const senhaAdmin = "admin";

  function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, "");
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    return resto === parseInt(cpf[10]);
  }

  function formatarCPF(cpf) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  function calcularDivida(cliente) {
    let total = 0;
    cliente.emprestimos?.forEach(emp => {
      emp.parcelas.forEach(p => {
        if (!p.pago) total += p.valor;
      });
    });
    cliente.divida = total;
    return total;
  }

  // ===============================
  // 🧾 RENDERIZAÇÃO
  // ===============================
  function renderizarClientes(filtro = "") {
    const tabela = document.getElementById("tabelaClientes");
    if (!tabela) return;

    tabela.innerHTML = "";

    clientes
      .filter(c =>
        c.caixaId === idCaixa &&
        (
          c.nome.toLowerCase().includes(filtro.toLowerCase()) ||
          c.cpf.includes(filtro.replace(/\D/g, ""))
        )
      )
      .forEach(c => {
        calcularDivida(c);
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${c.id}</td>
          <td>${c.nome}</td>
          <td>${formatarCPF(c.cpf)}</td>
          <td>R$ ${c.divida.toFixed(2)}</td>
          <td>
            <button class="btn btn-success btn-sm btn-novo" data-id="${c.id}">Novo</button>
            <button class="btn btn-primary btn-sm btn-editar" data-id="${c.id}">Editar</button>
            <button class="btn btn-danger btn-sm btn-excluir" data-id="${c.id}">Excluir</button>
            <button class="btn btn-info btn-sm btn-detalhes" data-id="${c.id}">Detalhes</button>
          </td>
          <td>${c.dataUltimaAlteracao || "—"}</td>
        `;
        tabela.appendChild(tr);
      });
  }

  renderizarClientes();

  // ===============================
  // ➕ ADICIONAR CLIENTE
  // ===============================
  const btnAdicionar = document.getElementById("btnAdicionarCliente");
  if (btnAdicionar) {
    btnAdicionar.addEventListener("click", () => {
      const nome = prompt("Nome do cliente:");
      if (!nome) return;

      const cpf = prompt("CPF (somente números):");
      if (!cpf || !validarCPF(cpf)) {
        alert("CPF inválido!");
        return;
      }

      if (clientes.some(c => c.cpf === cpf && c.caixaId === idCaixa)) {
        alert("Cliente já existe neste caixa!");
        return;
      }

      clientes.push({
        id: Date.now(),
        nome,
        cpf,
        caixaId: idCaixa,
        divida: 0,
        emprestimos: [],
        dataUltimaAlteracao: new Date().toLocaleString("pt-BR")
      });

      localStorage.setItem("clientes", JSON.stringify(clientes));
      renderizarClientes();
      alert("Cliente adicionado com sucesso!");
    });
  }

  // ===============================
// 🔁 EVENTOS DA TABELA (todos os botões)
// ===============================
document.getElementById("tabelaClientes")?.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = parseInt(btn.dataset.id);
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  // ❌ EXCLUIR
  if (btn.classList.contains("btn-excluir")) {
    const senha = prompt("Senha admin:");
    if (senha === senhaAdmin) {
      clientes = clientes.filter(c => c.id !== id);
      localStorage.setItem("clientes", JSON.stringify(clientes));
      renderizarClientes();
      alert("Cliente excluído!");
    } else {
      alert("Senha incorreta!");
    }
  }

  // ➕ NOVO EMPRÉSTIMO
  if (btn.classList.contains("btn-novo")) {
    const valor = prompt("Valor do empréstimo R$:");
    if (!valor || isNaN(valor)) return alert("Valor inválido!");
    const juros = prompt("Juros (%)") || "0";
    const parcelas = prompt("Número de parcelas") || "1";

    cliente.emprestimos = cliente.emprestimos || [];
    cliente.emprestimos.push({
      valor: parseFloat(valor),
      juros: parseFloat(juros),
      parcelas: Array.from({ length: parseInt(parcelas) }, (_, i) => ({
        numero: i + 1,
        valor: parseFloat(valor) / parseInt(parcelas),
        pago: false
      }))
    });

    cliente.dataUltimaAlteracao = new Date().toLocaleString("pt-BR");
    localStorage.setItem("clientes", JSON.stringify(clientes));
    renderizarClientes();
    alert("Empréstimo adicionado!");
  }

  // ✏️ EDITAR CLIENTE
  if (btn.classList.contains("btn-editar")) {
    const novoNome = prompt("Novo nome do cliente:", cliente.nome);
    if (!novoNome) return;

    const novoCPF = prompt("Novo CPF (somente números):", cliente.cpf);
    if (!novoCPF || !validarCPF(novoCPF)) return alert("CPF inválido!");

    cliente.nome = novoNome;
    cliente.cpf = novoCPF.replace(/\D/g, "");
    cliente.dataUltimaAlteracao = new Date().toLocaleString("pt-BR");

    localStorage.setItem("clientes", JSON.stringify(clientes));
    renderizarClientes();
    alert("Cliente atualizado!");
  }

  // 📋 DETALHES
  if (btn.classList.contains("btn-detalhes")) {
    let detalhes = `Nome: ${cliente.nome}\nCPF: ${formatarCPF(cliente.cpf)}\nDivida: R$ ${cliente.divida.toFixed(2)}\n\nEmpréstimos:\n`;
    if (cliente.emprestimos?.length) {
      cliente.emprestimos.forEach((emp, i) => {
        detalhes += `Empréstimo ${i + 1}: R$ ${emp.valor.toFixed(2)}, Juros: ${emp.juros}%, Parcelas: ${emp.parcelas.length}\n`;
      });
    } else {
      detalhes += "Nenhum empréstimo.";
    }
    alert(detalhes);
  }
});


  // ===============================
  // 🔍 PESQUISA
  // ===============================
  document.getElementById("pesquisa-cliente")?.addEventListener("input", e => {
    renderizarClientes(e.target.value);
  });

  // ===============================
  // 🔙 VOLTAR
  // ===============================
  document.getElementById("btnVoltar")?.addEventListener("click", () => {
    window.location.href = "painel.html";
  });

  // ===============================
  // 🚪 LOGOUT
  // ===============================
  document.getElementById("btnLogout")?.addEventListener("click", () => {
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("caixaAberto");
    window.location.href = "index.html";
  });

});

