# Setup Firebase para InFinance

## 1. Configuração no Firebase Console

### 1.1 Criar Projeto
1. Acesse [firebase.google.com](https://firebase.google.com)
2. Clique em **"Ir para console"**
3. Clique em **"Criar um projeto"**
4. Nome: `infinance` ou o que preferir
5. Desabilite Google Analytics (opcional)
6. Clique em **"Criar projeto"**

### 1.2 Adicionar Web App
1. No dashboard, clique no ícone **"<>"** (Web)
2. Nome do app: `infinance-web`
3. Clique em **"Registrar app"**
4. **COPIE as credenciais que aparecerem** (você precisará depois)

### 1.3 Habilitar Authentication (Email/Senha)
1. Menu lateral → **"Build"** → **"Authentication"**
2. Clique em **"Começar"**
3. Abas de métodos de login → Clique em **"Email/Senha"**
4. **Ative** o toggle "Email/Senha"
5. Clique em **"Salvar"**

### 1.4 Criar Firestore Database
1. Menu lateral → **"Build"** → **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. **Localização**: Escolha a mais próxima (ex: `us-east1` para Brasil)
4. **Modo de segurança**: **Modo de teste** (para desenvolvimento inicialmente)
5. Clique em **"Criar"**

**Regras de Segurança (Modo Teste)**:
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

### 1.5 Configurar Cloud Storage (para Backups)
1. Menu lateral → **"Build"** → **"Storage"**
2. Clique em **"Começar"**
3. **Localização**: Mesma do Firestore
4. **Modo de segurança**: **Modo de teste**
5. Clique em **"Criar"**

**Regras de Segurança**:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 2. Configurar Arquivo `.env.local`

1. Na raiz do projeto, crie um arquivo chamado `.env.local`
2. Copie o conteúdo do `.env.example`:
```bash
cp .env.example .env.local
```

3. Abra o `.env.local` e substitua os valores pelas suas credenciais do Firebase:

**Exemplo de credencial (do Firebase Console)**:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD1234567890abcdefghijklmnopqrstu",
  authDomain: "infinance-abc123.firebaseapp.com",
  projectId: "infinance-abc123",
  storageBucket: "infinance-abc123.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc1234567890def"
};
```

**Converta para o arquivo `.env.local`**:
```
VITE_FIREBASE_API_KEY=AIzaSyD1234567890abcdefghijklmnopqrstu
VITE_FIREBASE_AUTH_DOMAIN=infinance-abc123.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=infinance-abc123
VITE_FIREBASE_STORAGE_BUCKET=infinance-abc123.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc1234567890def
```

⚠️ **IMPORTANTE**: Nunca commite o `.env.local` no Git! Já está no `.gitignore`.

---

## 3. Estrutura de Dados no Firestore

O sistema criará automaticamente esta estrutura:

```
firestore/
└── users/
    └── {userId}/
        ├── profile/
        │   └── info (documento)
        │       ├── username (string)
        │       ├── email (string)
        │       └── createdAt (timestamp)
        │
        ├── transacoes/ (coleção)
        │   ├── {transacaoId}
        │   │   ├── id (string)
        │   │   ├── descricao (string)
        │   │   ├── valor (number)
        │   │   ├── tipo (string: "entrada", "gasto", "investimento")
        │   │   ├── categoryId (string)
        │   │   ├── investmentId (string, opcional)
        │   │   ├── date (string: YYYY-MM-DD)
        │   │   ├── isResgate (boolean)
        │   │   ├── createdAt (timestamp)
        │   │   └── updatedAt (timestamp)
        │
        ├── categorias/ (coleção)
        │   ├── {categoriaId}
        │   │   ├── id (string)
        │   │   ├── nome (string)
        │   │   ├── cor (string: hex color)
        │   │   └── createdAt (timestamp)
        │
        ├── investimentos/ (coleção)
        │   ├── {investimentoId}
        │   │   ├── id (string)
        │   │   ├── nome (string)
        │   │   ├── goalValue (number)
        │   │   ├── color (string: hex color)
        │   │   └── createdAt (timestamp)
        │
        └── backups/ (coleção - para backups JSON)
            ├── backup_YYYY-MM-DDTHH:mm:ss
            │   ├── transactions (array)
            │   ├── categories (array)
            │   ├── investments (array)
            │   ├── theme (string)
            │   └── createdAt (timestamp)
```

---

## 4. Regras de Segurança para Produção

Quando estiver pronto para produção, atualize as regras para restringir acesso:

### Firestore Rules (Produção)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      match /{document=**} {
        allow read, write: if request.auth.uid == userId;
      }
    }
  }
}
```

### Storage Rules (Produção)
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /backups/{userId}/{allPaths=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

## 5. Testar a Integração

1. **Instale as dependências**:
```bash
npm install
```

2. **Inicie o servidor de desenvolvimento**:
```bash
npm run dev
```

3. **Crie uma conta** na tela de login
4. **Adicione uma transação** e verifique se aparece no Firestore Console
5. **Faça logout** e faça login novamente - os dados devem carregar da nuvem

---

## 6. Recurso: Sincronização Local vs Nuvem

O sistema mantém **sempre** os dados no localStorage, e opcionalmente sincroniza com a nuvem:

- **Com Internet**: Sincroniza com Firebase (automático)
- **Sem Internet**: Usa dados locais (offline-first)
- **Ao voltar online**: Sincroniza alterações

**Visualizar modo de sincronização**:
- Menu → Vê um ícone ☁️ (nuvem) ou 💾 (disco) indicando o modo

---

## 7. Custo (Plano Gratuito - Spark Plan)

- ✅ **50,000 usuários/mês** em autenticação
- ✅ **50,000 leituras/dia** no Firestore
- ✅ **5 GB** de armazenamento
- ✅ **Sempre grátis** para um app pessoal

Você **só paga** se ultrapassar estes limites!

---

## 8. Troubleshooting

### Erro: "VITE_FIREBASE_API_KEY is not defined"
- ✅ Crie o arquivo `.env.local` na raiz
- ✅ Reinicie o servidor dev (`npm run dev`)

### Erro: "auth/configuration-not-found"
- ✅ Verifique se a Authentication está ativada no Firebase Console
- ✅ Verifique se o Email/Senha está ativado

### Dados não sincronizam
- ✅ Verifique se o Firestore está criado
- ✅ Verifique as regras de segurança
- ✅ Abra o Console do navegador (F12) para ver erros

### "Permission denied" ao salvar
- ✅ Verifique as regras de segurança do Firestore
- ✅ Certifique-se de estar logado (`request.auth.uid`)

---

## 9. Próximos Passos (Opcional)

Para tornar o app ainda mais robusto:
- [ ] Configurar backup automático diário
- [ ] Adicionar autenticação com Google
- [ ] Implementar sincronização em tempo real com `onSnapshot`
- [ ] Adicionar versionamento de dados
- [ ] Implementar exclusão de dados aos 30 dias de inatividade

---

**Pronto para usar!** 🚀
