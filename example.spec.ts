import { test, expect } from '@playwright/test';

test('aceitar pedidos automaticamente', async ({ page }) => {
  // Constantes de configuração
  const CREDENCIAIS = {
    email: 'BOY.AR.LOGISTICA.58@gmil.com',
    senha: '15052002',
    tipo: 'Motoboy'
  };
  const URL_LOGIN = 'http://www.arlogistica.net/#!/login';
  // Sem locais ignorados
  
  // Login no sistema
  await realizarLogin();
  
  // Verificar e aceitar pedidos continuamente por 2 minutos
  const tempoInicio = Date.now();
  const tempoLimite = 240000; // 4 minutos
  
  while (Date.now() - tempoInicio < tempoLimite) {
    await aceitarPedido();
    await page.waitForTimeout(500); // Verificar a cada 0.5 segundos
  }
  
  console.log('Monitoramento finalizado após 4 minutos');
  
  /**
   * Realiza o login no sistema
   */
  async function realizarLogin() {
    try {
      // Acessar página de login
      await page.goto(URL_LOGIN, { waitUntil: 'domcontentloaded' });
      
      // Preencher credenciais
      await page.fill('input[type="text"], input[type="email"]', CREDENCIAIS.email);
      await page.fill('input[type="password"]', CREDENCIAIS.senha);
      await page.selectOption('select#tipoUsuario', { label: CREDENCIAIS.tipo });
      
      // Clicar no botão de login
      await page.waitForTimeout(500);
      await page.click('button.btn.btn-primary.btn-block');
      
      // Aguardar navegação
      await Promise.race([
        page.waitForNavigation(),
        page.waitForTimeout(20000)
      ]);
      
      await page.screenshot({ path: 'login-sucesso.png' });
      console.log('Login realizado com sucesso');
    } catch (erro) {
      console.error('Erro durante o login:', erro);
    }
  }
  
  /**
   * Verifica e aceita pedidos disponíveis
   */
  async function aceitarPedido() {
    try {
      // Seletores principais
      const seletorPedido = 'div.card.shadow.h-100.py-2.border-left-danger';
      
      // Verificar se existe pedido disponível
      const pedidoExiste = await page.$(seletorPedido);
      if (!pedidoExiste) {
        return false;
      }
      
      // Sem verificação de locais a ignorar
      
      // Abrir menu dropdown
      await page.click(`${seletorPedido} a.dropdown-toggle`);
      await page.waitForTimeout(200);
      
      // Clicar em "Assumir"
      await page.click(`${seletorPedido} a.dropdown-item:has-text("Assumir")`);
      console.log('Clicou em "Assumir" com sucesso');
      
      // Aguardar carregamento do código
      await page.waitForTimeout(220);
      
      // Capturar código de confirmação
      const codigo = await page.$eval('h2.text-muted.ng-binding', 
        (elemento) => elemento.textContent?.trim() || '');
      
      if (codigo) {
        // Digitar cada número do código
        for (const digito of codigo) {
          if (/[0-9]/.test(digito)) {
            if (digito === '0') {
              await page.click('.row .col-4.offset-4 .btn');
            } else {
              const seletorNumero = {
                '1': '.row:nth-child(1) .col-4:nth-child(1) .btn',
                '2': '.row:nth-child(1) .col-4:nth-child(2) .btn',
                '3': '.row:nth-child(1) .col-4:nth-child(3) .btn',
                '4': '.row:nth-child(2) .col-4:nth-child(1) .btn',
                '5': '.row:nth-child(2) .col-4:nth-child(2) .btn',
                '6': '.row:nth-child(2) .col-4:nth-child(3) .btn',
                '7': '.row:nth-child(3) .col-4:nth-child(1) .btn',
                '8': '.row:nth-child(3) .col-4:nth-child(2) .btn',
                '9': '.row:nth-child(3) .col-4:nth-child(3) .btn'
              };
              await page.click(seletorNumero[digito]);
            }
            await page.waitForTimeout(50); // Pausa entre cliques
          }
        }
      }
      
      // Confirmar aceitação do pedido
      await page.click('button.btn.btn-success.rounded-pill[ng-click="modalSubmit()"]');
      
      // Registrar pedido aceito
      await page.screenshot({ path: `pedido-aceito-${Date.now()}.png` });
      console.log('Pedido aceito com sucesso!');
      
      return true;
    } catch (erro) {
      console.error('Erro ao aceitar pedido:', erro);
      return false;
    }
  }
});