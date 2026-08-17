# GOATVISION

## Sistema Interativo de Futebol por Visão Computacional

O **GOATVISION** é um projeto de visão computacional que transforma movimentos corporais reais em uma experiência de futebol virtual interativa.

Utilizando a câmera do computador, inteligência artificial e o modelo **MoveNet**, o sistema identifica a posição do corpo do jogador em tempo real, acompanha o movimento do joelho direito e interpreta esse movimento como um chute.

A proposta é unir **inteligência artificial, visão computacional, interação humano-computador e gamificação** em uma experiência simples, imersiva e acessível.

---

## Sobre o projeto

O jogador não utiliza teclado, mouse ou controle tradicional para realizar o chute.

A interação acontece através do próprio corpo:

1. O jogador entra no campo de visão da câmera.
2. O sistema identifica sua pose corporal.
3. O joelho direito é monitorado em tempo real.
4. O jogador levanta o joelho para carregar a potência.
5. Ao abaixar o joelho rapidamente, o sistema identifica o chute.
6. A potência do movimento influencia o comportamento da bola.
7. O sistema calcula se a bola atingiu a zona-alvo.
8. Em caso de acerto, um gol é registrado.

O projeto utiliza o movimento corporal como principal interface de controle.

---

## Objetivos

### Objetivo geral

Desenvolver uma experiência interativa de futebol utilizando visão computacional para interpretar movimentos corporais humanos em tempo real.

### Objetivos específicos

* Utilizar inteligência artificial para identificação de poses humanas.
* Detectar movimentos corporais através de uma câmera convencional.
* Interpretar o movimento do joelho como comando de interação.
* Criar um sistema de carregamento de potência para o chute.
* Desenvolver uma representação virtual de um gol de futebol.
* Criar uma mecânica de pontuação baseada na precisão do chute.
* Desenvolver uma experiência sem necessidade de controles físicos tradicionais.
* Explorar aplicações práticas de visão computacional e inteligência artificial.

---

## Tecnologias utilizadas

* **HTML5**
* **CSS3**
* **JavaScript**
* **TensorFlow.js**
* **MoveNet**
* **Pose Detection**
* **Web Camera API**
* **Canvas API**

O TensorFlow.js é utilizado como base para execução do modelo de inteligência artificial diretamente no navegador.

O **MoveNet** realiza a estimativa da pose corporal e fornece pontos-chave do corpo, permitindo que o sistema acompanhe articulações como quadril, joelho e tornozelo.

---

## Visão computacional

O núcleo do GOATVISION é baseado na estimativa de pose.

O modelo identifica diversos pontos do corpo humano e fornece suas respectivas posições e níveis de confiança.

Para a mecânica principal do projeto, são utilizados especialmente:

* `right_hip`
* `right_knee`
* `right_ankle`

O sistema utiliza principalmente o **joelho direito** para determinar o movimento do chute.

O código verifica a confiança dos pontos detectados antes de utilizar os dados para evitar que movimentos sejam interpretados incorretamente quando a pose não estiver suficientemente visível.

---

## Mecânica do chute

O chute possui duas etapas principais.

### 1. Carregamento

Quando o sistema identifica que o joelho direito subiu acima de determinado limite, o carregamento do chute é iniciado.

A barra de potência começa a aumentar enquanto o jogador permanece nessa fase.

### 2. Chute

Quando o sistema identifica uma descida rápida do joelho, após um tempo mínimo de carregamento, o chute é disparado.

A potência é calculada com base no tempo de carregamento.

De forma simplificada:

```text
Joelho sobe
     ↓
Carregamento iniciado
     ↓
Potência aumenta
     ↓
Joelho desce rapidamente
     ↓
Chute detectado
     ↓
Potência calculada
     ↓
Bola disparada
```

---

## Sistema de alvo

O gol virtual é dividido em quatro zonas:

```text
┌─────────────────────────────┐
│       │                     │
│  ALTO │      ALTO           │
│       │                     │
├───────┼─────────────────────┤
│       │                     │
│ BAIXO │      BAIXO          │
│       │                     │
└─────────────────────────────┘
```

As quatro regiões são:

* Canto esquerdo superior
* Canto direito superior
* Canto esquerdo inferior
* Canto direito inferior

A cada tentativa, uma zona é selecionada aleatoriamente como alvo.

O jogador deve posicionar seu corpo e realizar o chute buscando acertar a região destacada.

---

## Sistema de pontuação

O GOATVISION possui dois indicadores principais:

### Gols

Quantidade de chutes que atingiram a zona-alvo.

### Tentativas

Quantidade total de chutes realizados.

Exemplo:

```text
GOLS
5

TENTATIVAS
8
```

Isso permite acompanhar o desempenho do jogador durante a partida.

---

## Sistema de precisão

A precisão do chute está relacionada à potência carregada.

O sistema calcula um nível de precisão a partir da potência e adiciona uma variação ao destino final da bola.

Dessa forma, cada chute apresenta uma pequena variação, tornando a experiência menos previsível.

A ideia é evitar que simplesmente executar o movimento seja suficiente para garantir um gol.

---

## Animação da bola

Após o chute, a bola é animada através do `Canvas`.

A trajetória considera:

* posição inicial;
* posição final;
* potência;
* duração do movimento;
* suavização da animação;
* deslocamento vertical;
* resultado do chute.

A bola também possui um efeito visual próprio, incluindo brilho e representação de um pentágono central.

---

## Interface

O projeto possui duas telas principais.

### Tela inicial

Apresenta:

* nome do GOATVISION;
* temática de futebol;
* descrição do projeto;
* instruções de interação;
* botão para iniciar a experiência.

### Tela de jogo

Apresenta:

* transmissão da câmera;
* esqueleto corporal detectado;
* gol virtual;
* zona-alvo;
* barra de potência;
* quantidade de gols;
* quantidade de tentativas;
* mensagens de orientação;
* efeitos visuais de gol.

---

## Estrutura do projeto

O projeto foi organizado separando a estrutura, o estilo visual e a lógica de programação:

```text
GOATVISION/
│
├── index.html
├── style.css
└── script.js
```

### `index.html`

Responsável pela estrutura da aplicação.

Contém:

* tela inicial;
* elementos do jogo;
* vídeo da câmera;
* canvas;
* HUD;
* barra de potência;
* mensagens;
* efeitos visuais.

### `style.css`

Responsável pela aparência da aplicação.

Contém:

* layout;
* cores;
* tipografia;
* botões;
* HUD;
* animações;
* barra de potência;
* tela de carregamento;
* efeitos visuais.

### `script.js`

Responsável pela lógica do sistema.

Contém:

* acesso à câmera;
* inicialização do MoveNet;
* detecção de pose;
* processamento do movimento;
* detecção do chute;
* cálculo de potência;
* criação das zonas do gol;
* animação da bola;
* detecção de gol;
* pontuação;
* efeitos visuais.

---

## Como executar

Como o projeto utiliza acesso à câmera, é recomendado executá-lo através de um servidor local.

### 1. Clone ou baixe o projeto

```bash
git clone SEU_REPOSITORIO
```

### 2. Entre na pasta

```bash
cd GOATVISION
```

### 3. Execute um servidor local

Com Python:

```bash
python -m http.server 8000
```

### 4. Abra no navegador

Acesse:

```text
http://localhost:8000
```

### 5. Permita o acesso à câmera

Ao iniciar o jogo, o navegador solicitará autorização para utilizar a câmera.

Após permitir, o modelo MoveNet será carregado e o jogo estará pronto.

---

## Requisitos

Para executar o projeto, é necessário:

* computador com câmera;
* navegador moderno;
* conexão com a internet para carregar as bibliotecas utilizadas via CDN;
* ambiente que permita acesso à câmera;
* iluminação suficiente para que o corpo seja detectado corretamente.

---

## Fluxo do sistema

```text
                INÍCIO
                   │
                   ▼
             Acessar câmera
                   │
                   ▼
           Carregar MoveNet
                   │
                   ▼
          Detectar pose humana
                   │
                   ▼
         Identificar joelho direito
                   │
                   ▼
          Joelho levantou?
              │          │
             NÃO        SIM
              │          │
              │          ▼
              │      Carregar chute
              │          │
              │          ▼
              │    Joelho desceu?
              │          │
              │         SIM
              │          │
              └──────────┤
                         ▼
                  Calcular potência
                         │
                         ▼
                   Disparar bola
                         │
                         ▼
                 Verificar zona
                         │
              ┌──────────┴──────────┐
              │                     │
             GOL                   ERRO
              │                     │
              ▼                     ▼
          +1 ponto             Nova tentativa
              │                     │
              └──────────┬──────────┘
                         ▼
                   Novo alvo
                         │
                         ▼
                       JOGO
```

## Diferencial

O principal diferencial do GOATVISION é transformar **movimentos corporais reais em comandos dentro de uma experiência virtual**, sem depender de controles tradicionais.

O projeto combina:

**Inteligência Artificial + Visão Computacional + Futebol + Interação Humana + Gamificação**

em uma única aplicação.

---


## Autor

**GOATVISION**

Projeto desenvolvido com foco em **visão computacional, inteligência artificial, programação e interação humano-computador**.

### Contato

- **Instagram:** [@fabricio_kanashii] (https://instagram.com/fabricio_kanashii)
- **WhatsApp:** (85) 99295-4741

--
