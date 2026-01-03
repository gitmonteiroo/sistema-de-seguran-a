# Sistema de Checklists e Registro de Ocorrências – Segurança & Qualidade Industrial

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

Sistema completo para gerenciamento de checklists diários, não conformidades e ocorrências em ambiente industrial. Desenvolvido como MVP funcional, leve e pronto para uso em portfólio.

**Desenvolvido por:** [César Monteiro](https://www.linkedin.com/in/cesar-monteiro-030bb3170)

## 🎯 Problema

Na indústria, checklists e ocorrências ainda são registrados em papel, gerando:
- ❌ Falta de rastreabilidade
- ❌ Dificuldade de localizar registros antigos
- ❌ Falhas na comunicação entre turnos
- ❌ Risco à segurança operacional

## ✨ Solução

Sistema web **offline-first** (PWA) que permite:
- ✅ Preencher Checklists Diários (turnos 1, 2 e 3)
- ✅ Registrar Não Conformidades
- ✅ Registrar Ocorrências (acidente, incidente, quase-acidente)
- ✅ Supervisores acompanharem tudo em tempo real
- ✅ Funcionar offline e sincronizar quando voltar internet
- ✅ Gerar relatórios em PDF e Excel

## 🔧 Tecnologias

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Armazenamento:** IndexedDB (offline-first)
- **PWA:** Service Worker + Manifest
- **Relatórios:** jsPDF + SheetJS (xlsx)
- **Build:** Vite

## 📋 Funcionalidades

### 1. Sistema de Login
- Login simples com validação
- Usuários padrão:
  - **Supervisor:** admin@gmail.com / admin
  - **Operador:** operador@gmail.com / operador

### 2. Dashboard
- Total de checklists do dia
- Total de ocorrências
- Últimas não conformidades
- Navegação rápida para módulos

### 3. Checklists (Turnos 1, 2, 3)
- 10 itens de verificação de segurança
- Resposta Sim/Não para cada item
- Campo de observações
- Armazenamento offline
- Identificação por turno

### 4. Não Conformidades
- Tipos predefinidos (equipamento danificado, falta de EPI, etc.)
- Descrição detalhada
- Local/setor
- Turno
- Upload de foto (opcional)

### 5. Ocorrências
- Tipos: Acidente, Incidente, Quase-acidente
- Setor e descrição
- Possível causa
- Envolvidos
- Upload de foto (opcional)
- Data e hora automáticas

### 6. Supervisão (apenas Supervisores)
- Lista de checklists preenchidos
- Últimas ocorrências
- Últimas não conformidades
- Filtros por turno, setor, tipo e data
- Atualização em tempo real

### 7. Relatórios
- Filtros por tipo (Checklists, Não Conformidades, Ocorrências)
- Exportação para PDF
- Exportação para Excel
- Estatísticas resumidas

### 8. PWA - Funciona Offline
- Instalável em dispositivos móveis
- Service Worker para cache
- IndexedDB para dados offline
- Sincronização automática (quando implementar backend)

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Instalação

1. **Clone o repositório:**
```bash
git clone <seu-repositorio>
cd <nome-do-projeto>
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

4. **Acesse no navegador:**
```
http://localhost:8080
```

### Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão na pasta `dist/`.

### Instalar como PWA (Mobile/Desktop)

1. Acesse o sistema pelo navegador do celular ou desktop
2. Clique no menu do navegador
3. Selecione "Adicionar à Tela Inicial" ou "Instalar App"
4. O sistema funcionará como um aplicativo nativo

## 📱 Uso no Chão de Fábrica

O sistema foi projetado para ser usado em dispositivos móveis no chão de fábrica:

- **Botões grandes** para facilitar o toque
- **Interface limpa** e focada
- **Cores industriais** (azul profundo, cinza, branco)
- **Funciona offline** - preencha mesmo sem internet
- **Sincroniza automaticamente** quando a conexão voltar

## 👥 Credenciais de Teste

🔐 Credenciais de demonstração
Solicite acesso ou consulte o arquivo .env.example

### Supervisor
- **E-mail:** 
- **Senha:**
- **Acesso a:** Todos os módulos + Supervisão

### Operador
- **E-mail:** 
- **Senha:** 
- **Acesso a:** Checklists, Não Conformidades, Ocorrências, Relatórios

## 📊 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes shadcn/ui
│   ├── Layout.tsx      # Layout principal
│   └── ProtectedRoute.tsx
├── contexts/           # Contextos React
│   └── AuthContext.tsx # Gerenciamento de autenticação
├── lib/                # Bibliotecas e utilitários
│   ├── db.ts          # IndexedDB (offline storage)
│   └── utils.ts       # Funções auxiliares
├── pages/              # Páginas da aplicação
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Checklists.tsx
│   ├── NaoConformidades.tsx
│   ├── Ocorrencias.tsx
│   ├── Supervisao.tsx
│   └── Relatorios.tsx
├── App.tsx             # Configuração de rotas
├── index.css           # Estilos globais (design system)
└── main.tsx            # Entry point

public/
├── manifest.json       # Configuração PWA
├── sw.js              # Service Worker
├── icon-192.png       # Ícone PWA 192x192
└── icon-512.png       # Ícone PWA 512x512
```

## 🎨 Design System

O projeto utiliza um design system industrial com:

- **Primary:** Azul industrial profundo (#1e3a8a)
- **Secondary:** Cinza metálico
- **Accent:** Laranja de segurança (alertas)
- **Success:** Verde (conforme)
- **Destructive:** Vermelho (não conforme)

Todos os componentes seguem tokens semânticos definidos em `src/index.css` e `tailwind.config.ts`.

## 🔒 Segurança

- Autenticação local (para MVP)
- Proteção de rotas
- Supervisão restrita a usuários supervisor
- Validação de formulários

## 🚀 Próximos Passos (Melhorias Futuras)

- [ ] Integração com backend (Firebase/Supabase)
- [ ] Autenticação real (JWT)
- [ ] Notificações push
- [ ] Chat entre turnos
- [ ] Dashboard com gráficos
- [ ] Histórico completo com busca avançada
- [ ] Assinatura digital nos checklists
- [ ] Integração com câmera para fotos

## 📄 Licença

Este projeto é de código aberto para fins educacionais e de portfólio.

## 👨‍💻 Desenvolvedor

**César Monteiro**  
LinkedIn: [cesar-monteiro-030bb3170](https://www.linkedin.com/in/cesar-monteiro-030bb3170)

---

⭐ Se este projeto foi útil, considere dar uma estrela no repositório!
