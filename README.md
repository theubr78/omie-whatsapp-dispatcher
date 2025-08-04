# OMIE - WhatsApp Dispatcher

Um painel moderno e profissional para disparo de mensagens via WhatsApp, integrado com n8n, Google Sheets e Evolution API.

## 🚀 Deploy Options

### Option 1: Netlify (Recommended)
1. Drag and drop the project folder to [netlify.com/drop](https://netlify.com/drop)
2. Or connect your GitHub repo at [netlify.com](https://netlify.com)

### Option 2: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel --prod`
3. Or connect GitHub repo at [vercel.com](https://vercel.com)

### Option 3: GitHub Pages
1. Push to GitHub repository
2. Go to Settings > Pages
3. Select "Deploy from a branch" > main branch

### Option 4: Railway (Same as your n8n)
1. Connect GitHub repo at [railway.app](https://railway.app)
2. Deploy as static site

## 📁 Project Structure

## 🚀 Funcionalidades

- ✅ Interface moderna com tema escuro
- ✅ Botão de disparo destacado e responsivo
- ✅ Modal de feedback com fechamento automático
- ✅ Integração via webhook n8n
- ✅ Design totalmente responsivo
- ✅ Recursos de acessibilidade (WCAG AA)
- ✅ Tratamento robusto de erros
- ✅ Comportamento "fire-and-forget"

## 📁 Estrutura do Projeto

```
whatsapp-dispatcher/
├── index.html              # Página principal
├── styles/
│   └── main.css            # Estilos CSS
├── scripts/
│   └── app.js              # Lógica JavaScript
├── assets/
│   └── icons/
│       └── whatsapp.svg    # Ícone do WhatsApp
└── README.md               # Este arquivo
```

## ⚙️ Configuração

### 1. Configurar URL do Webhook

Edite o arquivo `scripts/app.js` e altere a URL do webhook na configuração:

```javascript
const config = {
  // Altere esta URL para o seu endpoint n8n
  webhookUrl: 'https://seu-n8n-instance.com/webhook/whatsapp-dispatcher',
  // ... outras configurações
};
```

### 2. Configurar CORS no n8n

Certifique-se de que seu n8n está configurado para aceitar requisições CORS do domínio onde o painel está hospedado.

## 🧪 Como Testar

### Teste Local

1. Abra o arquivo `index.html` em um navegador moderno
2. Abra as ferramentas de desenvolvedor (F12)
3. Vá para a aba Console
4. Clique no botão "Disparar Mensagens"
5. Verifique os logs no console

### Teste de Funcionalidade

Execute no console do navegador:

```javascript
// Testar funcionalidade básica
WhatsAppDispatcher.testDispatch();

// Validar configuração
WhatsAppDispatcher.validateSetup();

// Verificar estado atual
console.log(WhatsAppDispatcher.uiState);
```

### Teste de Responsividade

1. Redimensione a janela do navegador
2. Use as ferramentas de desenvolvedor para simular diferentes dispositivos
3. Verifique se o layout se adapta corretamente

### Teste de Acessibilidade

1. Navegue usando apenas o teclado (Tab, Enter, Escape)
2. Teste com leitor de tela (se disponível)
3. Verifique contraste de cores
4. Valide ARIA labels

## 🔧 Personalização

### Cores

Edite as variáveis CSS em `styles/main.css`:

```css
:root {
  --accent-primary: #3b82f6;    /* Azul principal */
  --accent-secondary: #10b981;  /* Verde secundário */
  --accent-success: #22c55e;    /* Verde de sucesso */
}
```

### Timeouts e Durações

Edite a configuração em `scripts/app.js`:

```javascript
const config = {
  apiTimeout: 10000,        // Timeout da requisição (ms)
  feedbackDuration: 3000,   // Duração do modal (ms)
  debounceDelay: 1000       // Delay entre cliques (ms)
};
```

## 🐛 Solução de Problemas

### Webhook não configurado
- **Problema**: Modal mostra "Configuração necessária"
- **Solução**: Configure a `webhookUrl` no arquivo `scripts/app.js`

### Erro de CORS
- **Problema**: Requisição bloqueada pelo navegador
- **Solução**: Configure CORS no seu servidor n8n

### Modal não aparece
- **Problema**: JavaScript com erro
- **Solução**: Verifique o console do navegador para erros

### Layout quebrado
- **Problema**: CSS não carregou
- **Solução**: Verifique se o arquivo `styles/main.css` está acessível

## 📱 Compatibilidade

### Navegadores Suportados
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Dispositivos
- Desktop (1200px+)
- Tablet (768px - 1024px)
- Mobile (320px - 768px)

## 🔒 Segurança

- Validação de URL do webhook
- Sanitização de dados de entrada
- Tratamento seguro de erros
- Headers de segurança recomendados

## 📈 Performance

- CSS otimizado com custom properties
- JavaScript vanilla (sem frameworks)
- Ícones SVG otimizados
- Carregamento assíncrono

## 🎯 Próximos Passos

Para produção, considere:

1. Minificar CSS e JavaScript
2. Implementar Content Security Policy (CSP)
3. Adicionar service worker para cache
4. Configurar analytics/monitoramento
5. Implementar testes automatizados

## 📄 Licença

Este projeto é de código aberto. Use livremente para seus projetos.