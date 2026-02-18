# 🔧 Guia de Troubleshooting - InFinance

## ❌ Erro: `auth/api-key-not-valid`

Este erro significa que a **API Key do Firebase é inválida ou foi revogada**.

### ✅ Soluções:

<!-- Modo Demo removido: a aplicação agora requer autenticação via Firebase. -->

#### **Opção 2: Verificar o Projeto Firebase (Recomendado)**

**Passo 1: Acessar o Firebase Console**
1. Vá para: https://console.firebase.google.com
2. Faça login com sua conta Google

**Passo 2: Verificar se o Projeto Existe**
- Procure por um projeto chamado **"infinance-web"**
- Se **NÃO EXISTS**, você precisa:
  - ✅ Criar um novo projeto
  - ✅ Configurar Authentication
  - ✅ Copiar as novas credenciais

**Passo 3: Se o Projeto Existe, Verificar as Credenciais**
1. Clique no nome do projeto
2. Clique no ícone **"<>"** (Web)
3. Copie o objeto `firebaseConfig` 
4. Converta para variáveis de ambiente:

```javascript
// Do Firebase Console você verá algo como:
const firebaseConfig = {
  apiKey: "AIzaSy...",  ← COPIE ESTE
  authDomain: "infinance-web.firebaseapp.com",  ← E ESTE
  projectId: "infinance-web",  ← E ESTE
  storageBucket: "infinance-web.appspot.com",  ← E ESTE
  messagingSenderId: "455454487168",  ← E ESTE
  appId: "1:455454487168:web:b9a..."  ← E ESTE
};
```

**Passo 4: Atualizar o `.env.local`**
```bash
# Abra c:\Users\jpaur\Documents\GitHub\infinance\.env.local
# E substitua TODOS os valores:

VITE_FIREBASE_API_KEY=AIzaSy...  # ← Nova API Key
VITE_FIREBASE_AUTH_DOMAIN=infinance-web.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=infinance-web
VITE_FIREBASE_STORAGE_BUCKET=infinance-web.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=455454487168
VITE_FIREBASE_APP_ID=1:455454487168:web:b9a...
```

**Passo 5: Reiniciar o Servidor**
```bash
npm run dev
```

---

## ❌ Erro: `auth/configuration-not-found`

**Causa:** Authentication não está ativada no Firebase Console

**Solução:**
1. Vá para: https://console.firebase.google.com
2. Clique no seu projeto
3. Menu → **Build** → **Authentication**
4. Clique em **"Get Started"** ou **"Começar"**
5. Abra a aba **"Email/Password"**
6. **Ative** o toggle
7. Clique em **"Save"**

---

## ❌ Erro: `auth/network-request-failed`

**Causa:** Problema de conexão com Firebase

**Soluções:**
- ✅ Verifique sua conexão com internet
- ✅ Verifique se o Firebase está acessível (tente: https://www.google.com)
- ✅ Limpe o cache do navegador (Ctrl+Shift+Delete)
- ✅ Reinicie o servidor dev (Ctrl+C e `npm run dev`)
- ✅ Reinicie o navegador

---

## ❌ Erro: `Permission denied` ao Salvar Dados

**Causa:** Regras de segurança do Firestore estão restritivas

**Solução:**
1. Acesse: https://console.firebase.google.com
2. Projeto → **Build** → **Firestore Database**
3. Clique na aba **"Rules"**
4. **Modo Teste** (temporário, para debug):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
5. Clique em **"Publish"**

⚠️ **IMPORTANTE:** Isso permite que QUALQUER pessoa logada escreva dados. Use apenas para teste!

---

## 📊 Como Saber se Firebase Está Funcionando?

### Verificar na Tela de Login
1. Abra o navegador (F12)
2. Vá para a aba **Console**
3. Procure por uma mensagem verde: `✅ Firebase Auth inicializado com sucesso`

Se ver:
- ✅ Verde = Firebase OK
- ❌ Vermelho = Erro no Firebase

### Verificar no Console do Navegador
```javascript
// Console do navegador (F12)
import { auth } from './services/authService.ts'
console.log(auth)  // Se vir um objeto, está funcionando
```

---

## 🛠️ Criar Novo Projeto Firebase do Zero

Se o projeto foi deletado, siga este passo a passo:

### Passo 1: Criar Projeto
1. Vá para: https://firebase.google.com/console
2. Clique em **"Criar um projeto"**
3. Nome: `infinance-web`
4. Desabilite Google Analytics (opcional)
5. Clique em **"Criar projeto"**

### Passo 2: Adicionar App Web
1. Clique no ícone **"<>"** (Web)
2. Nome: `infinance-web`
3. **COPIE AS CREDENCIAIS** que aparecerem
4. Clique em **"Copy"** do arquivo `.env` (se fornecido)

### Passo 3: Ativar Authentication
1. Menu → **Build** → **Authentication**
2. **"Get Started"**
3. Abra **"Email/Password"**
4. Ative o toggle
5. Salve

### Passo 4: Criar Firestore Database
1. Menu → **Build** → **Firestore Database**
2. **"Create database"**
3. Localização: Selecione a mais próxima
4. Modo: **Test mode** (para começo)
5. **"Create"**

### Passo 5: Atualizar `.env.local`
```bash
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=infinance-web.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=infinance-web
VITE_FIREBASE_STORAGE_BUCKET=infinance-web.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Passo 6: Reiniciar
```bash
npm run dev
```

---

## 🔍 Debug: Verificar Arquivo `.env.local`

```bash
# Verificar se o arquivo existe
cat c:\Users\jpaur\Documents\GitHub\infinance\.env.local

# Deve mostrar:
# VITE_FIREBASE_API_KEY=AIzaSy...
# VITE_FIREBASE_AUTH_DOMAIN=infinance-web.firebaseapp.com
# etc...
```

⚠️ **NUNCA** commite este arquivo!

---

<!-- Modo Demo removido: para uso sem Firebase, importe/exporte backups locais manualmente. -->

## 📞 Ainda Não Resolveu?

1. Abra o **Console do Navegador** (F12)
2. Procure por mensagens de erro em **vermelho**
3. **Copie a mensagem de erro** completa
4. Vá para: https://console.firebase.google.com
5. Verifique se o projeto ainda existe
6. Se não encontrar, **crie um novo** seguindo os passos acima
