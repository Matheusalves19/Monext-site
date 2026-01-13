document.addEventListener("DOMContentLoaded", () => {

  // Mock de usuários válidos
  const usuariosValidos = [
    { nome: "admin", senha: "123456", rp: "000" },
    { nome: "matheus", senha: "senha123", rp: "001" },
  ];

  // Função de login
  function login() {
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!usuario || !senha) {
      alert("⚠️ Preencha todos os campos!");
      return;
    }

    if (senha.length < 6) {
      alert("⚠️ A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    const usuarioEncontrado = usuariosValidos.find(
      u => u.nome === usuario && u.senha === senha
    );

    if (usuarioEncontrado) {
      // Salva usuário, senha e RP no localStorage
      localStorage.setItem("usuarioLogado", usuarioEncontrado.nome);
      localStorage.setItem("senhaUsuario", usuarioEncontrado.senha);
      localStorage.setItem("rpUsuario", usuarioEncontrado.rp);

      // Redireciona para painel
      window.location.href = "painel.html";
    } else {
      alert("❌ Usuário ou senha incorretos!");
    }
  }

  // Associa o botão ao evento
  document.getElementById("btnLogin").addEventListener("click", login);
});
