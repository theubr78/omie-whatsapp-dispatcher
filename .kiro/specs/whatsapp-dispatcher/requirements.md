# Requirements Document

## Introduction

Este projeto consiste em um site simples, moderno e responsivo que funciona como um painel para disparo de mensagens via WhatsApp. O sistema integra com n8n, Google Sheets e Evolution API para automatizar o envio de mensagens em massa. O foco principal é fornecer uma interface limpa e intuitiva com um botão de disparo centralizado e feedback visual imediato.

## Requirements

### Requirement 1

**User Story:** Como usuário do sistema, eu quero ter um botão destacado para disparar mensagens, para que eu possa iniciar o processo de envio automático de mensagens WhatsApp de forma simples e intuitiva.

#### Acceptance Criteria

1. WHEN o usuário acessa a página THEN o sistema SHALL exibir um botão "Disparar Mensagens" claramente visível no centro da tela ou painel lateral
2. WHEN o usuário clica no botão de disparo THEN o sistema SHALL enviar uma requisição HTTP POST para o webhook do n8n
3. WHEN a requisição é enviada THEN o sistema SHALL exibir um modal ou alerta com a mensagem "Disparo iniciado com sucesso!"
4. WHEN o botão é clicado THEN o sistema SHALL utilizar fetch() com método POST para fazer a requisição

### Requirement 2

**User Story:** Como desenvolvedor/administrador do sistema, eu quero poder configurar facilmente a URL do webhook, para que eu possa alterar o endpoint sem modificar múltiplos arquivos.

#### Acceptance Criteria

1. WHEN o desenvolvedor precisa alterar a URL do webhook THEN o sistema SHALL permitir a edição através de uma variável ou configuração no topo do script
2. WHEN a URL é configurada THEN o sistema SHALL utilizar essa URL para todas as requisições de disparo

### Requirement 3

**User Story:** Como usuário do sistema, eu quero uma interface moderna e responsiva com tema escuro, para que eu tenha uma experiência visual agradável em diferentes dispositivos.

#### Acceptance Criteria

1. WHEN o usuário acessa o site THEN o sistema SHALL exibir um layout com tema escuro
2. WHEN o usuário acessa o site THEN o sistema SHALL utilizar cores primárias em tons de azul ou verde
3. WHEN o usuário acessa o site em diferentes dispositivos THEN o sistema SHALL manter a responsividade e usabilidade
4. WHEN possível THEN o sistema SHALL incluir ícones modernos para melhorar a experiência visual

### Requirement 4

**User Story:** Como usuário do sistema, eu quero ver informações claras sobre a funcionalidade da página, para que eu entenda o propósito e como utilizar o sistema.

#### Acceptance Criteria

1. WHEN o usuário acessa a página THEN o sistema SHALL exibir o título "Disparador de Mensagens WhatsApp"
2. WHEN o usuário visualiza a página THEN o sistema SHALL mostrar um texto explicativo: "Clique no botão abaixo para iniciar o disparo automático de mensagens."
3. WHEN o usuário visualiza a página THEN o sistema SHALL exibir no rodapé: "Powered by n8n + Google Sheets + Evolution API"

### Requirement 5

**User Story:** Como usuário do sistema, eu quero feedback visual imediato ao clicar no botão, para que eu saiba que a ação foi executada mesmo sem aguardar resposta do backend.

#### Acceptance Criteria

1. WHEN o usuário clica no botão de disparo THEN o sistema SHALL exibir feedback visual imediato
2. WHEN o feedback é exibido THEN o sistema SHALL não aguardar resposta do webhook para mostrar a confirmação
3. WHEN possível THEN o sistema SHALL simular o comportamento mesmo sem backend funcional para testes

### Requirement 6

**User Story:** Como desenvolvedor, eu quero utilizar tecnologias web padrão e simples, para que o projeto seja fácil de manter e implementar.

#### Acceptance Criteria

1. WHEN o projeto é desenvolvido THEN o sistema SHALL utilizar HTML + CSS para estrutura e estilização
2. WHEN possível THEN o sistema SHALL utilizar Tailwind CSS ou estilização simples e limpa
3. WHEN funcionalidades JavaScript são necessárias THEN o sistema SHALL utilizar JavaScript puro sem frameworks
4. WHEN o projeto é estruturado THEN o sistema SHALL ser uma Single Page Application (SPA)