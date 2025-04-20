# Meta Ads Dashboard

<p align="center">
  <img src="./assets/img/logo/logo-netsar-removebg-preview.png" alt="Netsar Logo" height="120">
</p>

<p align="center">
  <b>Plataforma avançada para análise e gerenciamento de campanhas Meta Ads</b>
</p>

<p align="center">
  <a href="#visão-geral">Visão Geral</a> •
  <a href="#funcionalidades">Funcionalidades</a> •
  <a href="#tecnologias">Tecnologias</a> •
  <a href="#arquitetura">Arquitetura</a> •
  <a href="#instalação">Instalação</a> •
  <a href="#demonstração">Demonstração</a> •
  <a href="#estrutura">Estrutura</a> •
  <a href="#acessibilidade">Acessibilidade</a> •
  <a href="#contribuição">Contribuição</a> •
  <a href="#licença">Licença</a>
</p>

## Visão Geral

O **Meta Ads Dashboard** é uma aplicação web single-page desenvolvida para profissionais de marketing digital, fornecendo ferramentas avançadas para análise, gerenciamento e otimização de campanhas publicitárias na plataforma Meta Ads (anteriormente Facebook Ads). O dashboard apresenta uma interface moderna e intuitiva inspirada no Meta Business Suite, com suporte completo para temas claro e escuro.

A plataforma permite visualização imediata de KPIs críticos, análises de desempenho com gráficos interativos, gerenciamento de campanhas e geração de relatórios personalizados exportáveis em PDF com análises por IA.

## Funcionalidades

### Dashboard Principal
- **KPIs em Tempo Real**: Visualização dos principais indicadores de performance
- **Gráficos Interativos**: Análises visuais com filtros temporais e interatividade completa
- **Modo Escuro/Claro**: Suporte nativo a tema escuro para todos os componentes da interface

### Gestão de Campanhas
- **Lista de Campanhas**: Visualização completa com status, datas e métricas principais
- **Ranking de Performance**: Visualização comparativa das campanhas por diferentes métricas
- **Sistema de Busca**: Filtro e pesquisa avançada por critérios múltiplos
- **Análise Visual**: Gráficos comparativos entre campanhas

### Gerador de Relatórios
- **Relatórios Personalizados**: Seleção flexível de métricas para análise
- **Exportação em PDF**: Geração de relatórios profissionais com branding
- **Análise por IA**: Integração opcional com análise inteligente dos dados
- **Atualização em Tempo Real**: Visualização dinâmica conforme seleção de métricas

### Recursos Avançados
- **Design Responsivo**: Adaptação perfeita para todos os dispositivos e tamanhos de tela
- **Notificações Contextuais**: Sistema de feedback visual para todas as ações
- **Sistema de Temas**: Implementação robusta de temas claro/escuro com transições suaves
- **Acessibilidade**: Conformidade com WCAG 2.1 para uso inclusivo

## Tecnologias

### Frontend
- **HTML5 & CSS3**: Estrutura semântica e estilização moderna com variáveis CSS
- **JavaScript ES6+**: Programação modular com classes e padrões de design
- **Chart.js**: Visualizações de dados responsivas e interativas
- **TailwindCSS**: Utilitários CSS para estilização consistente e responsiva
- **FontAwesome**: Ícones vetoriais para interface rica

### Exportação e Processamento
- **html2canvas**: Captura de elementos DOM para geração de imagens
- **jsPDF**: Criação de documentos PDF estruturados e personalizados

### Padrões e Metodologias
- **Arquitetura MVC**: Separação clara entre dados, lógica e apresentação
- **Class-based OOP**: Programação orientada a objetos com herança e encapsulamento
- **Event-driven Pattern**: Comunicação entre componentes via eventos personalizados

## Arquitetura

O Meta Ads Dashboard implementa uma arquitetura MVC (Model-View-Controller) rigorosa para garantir escalabilidade e manutenibilidade:

- **Models**: Encapsulam dados e lógica de negócios, como `Report`, `Campaign` e `KPI`
- **Views**: Renderizam a interface e gerenciam interações do usuário, como `DashboardView` e `ReportView`
- **Controllers**: Coordenam a aplicação e conectam Models e Views, como `CampaignController` e `ReportController`
- **Services**: Fornecem funcionalidades específicas como `ApiService` e `PdfService`

O sistema utiliza o padrão Observer para comunicação entre componentes, permitindo atualizações em tempo real da interface quando os dados mudam.

## Instalação

### Requisitos
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Servidor web local (opcional para desenvolvimento)

### Processo de Instalação
1. Clone o repositório:
   ```bash 
   git clone https://github.com/netsar/meta-ads-dashboard.git
   ```

2. Navegue até o diretório:
   ```bash
   cd meta-ads-dashboard
   ```

3. Para desenvolvimento local, inicie um servidor web:
   ```bash
   # Usando Python (exemplo)
   python -m http.server 8000
   
   # Usando Node.js com http-server
   npx http-server
   ```

4. Acesse a aplicação em seu navegador:
   ```
   http://localhost:8000
   ```

## Demonstração

O Dashboard oferece uma experiência visual rica com diferentes modos de visualização (claro/escuro) e uma interface intuitiva para análise de dados.

### Recursos Visuais
- Painéis de KPIs com indicadores de desempenho
- Gráficos interativos com opções de filtragem
- Tabelas responsivas com ordenação dinâmica
- Sistema de ranking visual para campanhas

## Estrutura

```
meta-ads-dashboard/
├── assets/                  # Recursos estáticos
│   ├── img/                 # Imagens e ícones
│   └── fonts/               # Fontes (se não estiver usando CDN)
├── js/                      # Código JavaScript
│   ├── api/                 # Comunicação com API
│   ├── controllers/         # Controladores MVC
│   ├── models/              # Modelos de dados
│   ├── services/            # Serviços reutilizáveis
│   ├── utils/               # Funções utilitárias
│   ├── views/               # Visualizações e componentes
│   └── app.js               # Ponto de entrada da aplicação
├── index.html               # Página principal
└── styles.css               # Estilos CSS globais
```

### Componentes Principais

| Componente | Descrição |
|------------|-----------|
| NavigationController | Gerencia navegação entre seções e responsividade |
| DashboardController | Controla visualizações e dados do dashboard principal |
| CampaignController | Gerencia lista e ranking de campanhas |
| ReportController | Controla geração de relatórios personalizados |
| ThemeController | Gerencia temas claro/escuro e preferências do usuário |
| PdfService | Serviço de geração de PDFs profissionais |
| ApiService | Comunicação com API e tratamento de dados |

## Acessibilidade

O Meta Ads Dashboard foi desenvolvido seguindo as diretrizes WCAG 2.1 nível AA, garantindo que a plataforma seja acessível para usuários com diferentes necessidades:

- **Contraste**: Relações de contraste em conformidade com WCAG AA
- **Navegação por Teclado**: Suporte completo para navegação sem mouse
- **Screen Readers**: Marcação ARIA para compatibilidade com leitores de tela
- **Modo Escuro**: Opção para reduzir fadiga visual em ambientes de trabalho diversos
- **Tipografia Responsiva**: Textos legíveis em todos os dispositivos

## Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do repositório
2. Crie uma branch para sua feature: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

### Padrões de Código

- Seguimos padrões ESLint adaptados do Airbnb
- Indentação de 4 espaços
- Nomes de classes em PascalCase
- Nomes de funções e variáveis em camelCase
- Comentários JSDoc para todas as funções e classes

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).

## Contato & Suporte

Para questões, suporte ou feedback, entre em contato através de:

- **Email**: contato@netsar.com.br
- **Website**: [www.netsar.com.br](https://www.netsar.com.br)
- **GitHub Issues**: Para reportar bugs ou solicitar funcionalidades

---

<p align="center">
  Desenvolvido por <a href="https://www.netsar.com.br">Netsar</a> &copy; 2023-2024
</p> 