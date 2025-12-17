import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Config Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAZ9w0WK_en0OAS0KP6z0055aU1oqnDdm8",
    authDomain: "monext-system.firebaseapp.com",
    projectId: "monext-system",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elementos
const btnLogin = document.getElementById("btnLogin");
const usuarioInput = document.getElementById("usuario");
const senhaInput = document.getElementById("senha");
const msgErro = document.getElementById("msgErro");

// Login
btnLogin.addEventListener("click", async () => {
    const nome = usuarioInput.value.trim();
    const senha = senhaInput.value.trim();

    if (!nome || !senha) {
        mostrarErro("Preencha nome e senha.");
        return;
    }

    try {
        const q = query(
            collection(db, "usuarios"),
            where("Nome", "==", nome),
            where("Senha", "==", senha)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const dados = doc.data();

            localStorage.setItem("usuarioLogado", JSON.stringify({
                id: doc.id,
                nome: dados.Nome,
                senha: dados.Senha,       // vem do Firestore
                rp: dados.RP || "—",       // 👈 Adicionado RP
                idCaixa: dados.idCaixa
            }));

            window.location.href = "painel.html";
        } else {
            mostrarErro("Nome ou senha inválidos.");
        }

    } catch (error) {
        console.error(error);
        mostrarErro("Erro ao conectar ao banco.");
    }
});

function mostrarErro(texto) {
    msgErro.style.display = "block";
    msgErro.innerText = texto;
}
