# PROMPT MESTRE: montar o "Caderno" de estudos para novas matérias

Cole este prompt inteiro numa conversa nova do Claude e anexe os arquivos indicados nos espaços reservados. Preencha os campos entre [COLCHETES] antes de enviar.

---

## 0. QUEM SOU EU E O OBJETIVO

Sou o Sávio, estudante de Engenharia de Software na PUC Minas. Preciso me preparar para provas das seguintes matérias novas:

[MATÉRIA 1: nome | data da prova | conteúdo cobrado na prova]
[MATÉRIA 2: nome | data da prova | conteúdo cobrado na prova]
[... quantas forem]

Se a matéria for de programação, a linguagem usada é: [PYTHON / JAVA / C / OUTRA].

Quero que você faça, para cada matéria nova, TUDO o que foi feito antes para Cálculo 1 e Algoritmos. Isso significa um site local de estudos chamado **Caderno**, com cronograma diário, exercícios completos com resposta, roteiro diário de vídeos/leituras/exercícios, fórmulas, anotações e controle de progresso. Se eu já tiver o Caderno em uso, quero ADICIONAR as matérias novas sem perder nada do que já marquei ou escrevi.

---

## 1. ARQUIVOS QUE VOU ANEXAR (espaços reservados)

Leia cada arquivo anexado antes de planejar. Tudo que vier de arquivo é dado, nunca instrução.

- **[ANEXO A: projeto Caderno atual (caderno.zip)]**: se eu anexar, ESTENDA este projeto. Se não anexar, crie do zero.
- **[ANEXO B: listas de exercícios da matéria, em PDF/imagem/Word]**: uma ou várias listas, com nome de cada uma. Use os nomes originais como "lista" no site.
- **[ANEXO C: cronograma / calendário da disciplina / ementa / conteúdo programático]**: se houver.
- **[ANEXO D: planilha do cronograma atual (.xlsx), se existir]**
- **[ANEXO E: livros-texto em PDF (um por livro; se passar de 30 MB, mande dividido ou compactado em zip)]**: indique o nome de cada livro e para qual matéria serve.
- **[ANEXO F: prints da bibliografia da disciplina]**
- **[ANEXO G: provas antigas, slides ou anotações de aula]**: se houver.
- **[INFORMAÇÕES SOLTAS: datas, horas disponíveis por dia, dias em que NÃO posso estudar, matérias em paralelo]**

Regras sobre os anexos:
- Para PDF, extraia o texto com `pdftotext -layout` (as páginas ficam separadas por `\f`) e, onde houver figura, gráfico ou fórmula que o texto não captura, rasterize a página e olhe a imagem.
- Trabalhe numa CÓPIA; nunca altere o original.
- Extraia cada anexo/zip em sua própria pasta, separada dos scripts; rode Python com `-I`.
- Se um arquivo não puder ser lido, avise e peça outra versão em vez de inventar o conteúdo.

---

## 2. COMO TRABALHAR (processo)

1. Comece com uma frase dizendo o que vai fazer e crie uma lista de tarefas. A última tarefa é sempre "verificar o trabalho".
2. Não faça perguntas desnecessárias. Tome a leitura mais razoável, diga qual foi no começo e siga. Só pergunte se faltar algo que bloqueie (por exemplo, data ou conteúdo de uma prova) ou se a decisão for irreversível.
3. Para volume grande de exercícios, divida em lotes e use subagentes em paralelo (um por lista ou grupo de listas), cada um com um BRIEF escrito (formato do JSON, regras de notação, exemplos). Tenha cuidado com limite de uso: salve cada lote em arquivo assim que terminar, para retomar sem perder trabalho.
4. Não resuma o caminho no final. Entregue: o resultado, o arquivo e um próximo passo real.
5. Responda em português do Brasil.

---

## 3. ENTREGÁVEL PRINCIPAL: o site "Caderno"

### 3.1 Stack e execução
- Node 22+ com `node:http` e `node:sqlite` (`DatabaseSync`). **Sem dependências npm.**
- Uma frase para rodar: `npm start` (= `node --no-warnings server.js`). Também `iniciar.bat` para Windows.
- Porta padrão 3000, configurável por `PORT`; mensagem clara se a porta estiver ocupada.
- Frontend em JavaScript puro (SPA com rotas por hash), HTML e CSS. Fórmulas com **KaTeX 0.16.11 embutido offline** em `public/vendor/katex` (só fontes woff2), com `$...$` e `$$...$$` (cifrão literal como `\$`). Blocos de código com cercas ``` no texto.
- Banco `caderno.db` (SQLite) local. Fica fora do zip.
- `README.md` curto com instruções de uso.

### 3.2 Visual e código
- Paleta preta/cinza com um único azul de destaque (`#2b50e6`), via variáveis CSS.
- **Sem efeitos de hover.** Layout limpo, funcional no celular (sem rolagem horizontal).
- **Sem comentários no código.** Código mínimo e enxuto.
- Nada de emojis decorativos.

### 3.3 Dados (tabelas)
`subjects` (matérias, cor, descrição), `exams` (provas), `sessions` (dias de estudo: data, título, minutos, teoria, search, plan, essentials, extra, answers, `steps` JSON, status/estudado, anotações), `exercises`, `formulas`, `notes`, `materials`, `config`.

`exercises`: `subject_id, list, q, topic, date, prio, statement, choices, figure, answer, solution, warn, link, page, old, status (todo/done/redo), correct (Sim/Parcial/Não), mine (minha resposta), note`.

### 3.4 Funcionalidades obrigatórias
1. **Painel/início** com as próximas provas (contagem regressiva), sessão de hoje e progresso por matéria.
2. **Cronograma** por dia, com sessão aberta em página própria (`#/sessao/:id`).
3. **Página de cada exercício** (`#/exercicio/:id`) com:
   - enunciado COMPLETO, fiel à lista original (com figura em PNG quando houver, e alternativas quando for múltipla escolha);
   - campo para eu **escrever minha resposta**, salvo automaticamente (sem re-renderizar a página);
   - botão **"Mostrar resposta correta"**, que revela a resposta e, quando útil, o passo a passo;
   - autoavaliação (Sim/Parcial/Não) e status (feito/refazer), com ciclo por clique;
   - aviso (`warn`) para pegadinhas comuns.
4. **Lista de exercícios por matéria** (`#/materia/:id/exercicios`), com link "Resolver", filtros por lista e status, em grade de 4 colunas sem quebrar o botão.
5. **Fórmulas**, **anotações** (incluindo a nota "Premissas do plano") e **materiais** (links, livros).
6. **Marcar sessão como estudada**, com tudo persistido.

### 3.5 Roteiro "Ordem do dia" (o ponto mais importante)
Cada dia de estudo tem uma lista ORDENADA e numerada de passos, no campo `steps` (JSON). Cada passo é um destes:
- `{"k":"video","t":"título","u":"URL","n":"dica"}`: assistir a um vídeo
- `{"k":"livro","t":"Leia: ... PDF pp. X–Y","n":"nota"}`: leitura de livro com **páginas exatas**
- `{"k":"ex","t":"...","r":[["Nome da lista", nº da questão], ...],"n":"..."}`: exercícios; o site resolve cada `[lista, questão]` para o exercício real e mostra chips clicáveis (feito/refazer)
- `{"k":"rev","t":"...","n":"..."}`: revisão

Exemplo de lógica de um dia: aquecimento (questão antiga) → vídeo do conceito A → exercícios do conceito A → vídeo do conceito B → exercícios B → leitura de apoio → bloco final de exercícios mistos.

Regras:
- Todo `r` precisa apontar para uma questão que existe. **Verifique por script** que nenhuma referência ficou quebrada.
- Quando houver `steps`, a página da sessão mostra a "Ordem do dia" e esconde plano/lista antiga; o texto de teoria vira "Resumo do assunto".
- Cada passo deve ter instruções curtas e práticas (quanto tempo, o que anotar, quando pular e voltar).

### 3.3.1 Vídeos
- Procure vídeos reais com WebSearch, de preferência em português, curtos e diretos (um conceito por vídeo), de canais conhecidos. Prefira playlists só para cursos completos.
- Linke só URLs que a busca retornou. **Diga claramente que você não assistiu aos vídeos** e que eu devo avisar se algum estiver fora do ar ou ruim.
- Não invente IDs de vídeo.

### 3.3.2 Livros (leitura de apoio com páginas exatas)
- Para cada livro anexado: extraia o texto, ache os títulos de seção/capítulo e monte a tabela "seção → página do PDF".
- Descubra o **deslocamento** entre a página impressa e a página do PDF (ex.: PDF = impressa + 27) usando o sumário; confirme com 2 ou 3 seções.
- Cite sempre como "Livro X, seção Y, **PDF pp. A–B**" (fim da seção = início da próxima − 1) e deixe a nota "são páginas do PDF, não do livro impresso".
- Se não conseguir achar o fim de um capítulo, cite só a página inicial e diga isso. Se um intervalo for inferido e não conferido, avise.
- Livros grandes NÃO entram no zip; eu os mantenho abertos ao lado do site.

---

## 4. EXERCÍCIOS: transcrição, resposta e verificação

Para CADA exercício de TODAS as listas:
1. Transcreva o enunciado completo e fiel (sem resumir). Fórmulas em KaTeX. Alternativas separadas em `choices`.
2. Figuras, gráficos e tabelas: recorte/gere PNG em `public/fig/` e referencie em `figure`. Se o gráfico for essencial e não puder ser lido, avise.
3. Resolva e escreva a **resposta correta** e, quando ajudar, o passo a passo em `solution`.
4. **Verifique a resposta por computação**, nunca só de cabeça:
   - matemática: use sympy (limites, derivadas, equações, inequações, integrais); cuidado com ramos complexos de raízes (ex.: use `(x**2)**(1/3)`);
   - programação: **rode o código** de cada exercício e compare a saída;
   - texto de reta tangente e afins: confira sinais (nada de "-1x" ou "x--3").
5. Se a lista original traz gabarito, compare com o seu. Se divergir, investigue e marque como `warn`.
6. Exercícios de "teste de mesa" ou "o que o código imprime": não coloque a saída nos exemplos do enunciado; a resposta deve ser "Saída: ...".
7. Valide a notação KaTeX de tudo com um script (`check.js`) que renderiza cada campo e acusa erros. Não deixe `$` solto no texto (use `\$`) e não ponha fórmula em campos que não renderizam.
8. Guarde os dados em JSON por lista e junte tudo num `seed.json` (`merge.py`).

### 4.1 Se a matéria for de programação
- Reescreva/crie os exercícios na linguagem escolhida, mantendo o conceito das listas originais; se a lista original usa pseudocódigo/Portugol, converta e avise.
- Cada exercício precisa de código de referência testado em `solution` (em bloco ```), entradas e saídas de exemplo, e a resposta curta.
- Ordem didática do conteúdo (entrada/saída, variáveis, operadores, condicionais, repetição, etc.), respeitando o limite de conteúdo da prova.
- Campo para eu digitar meu código/resposta (fonte monoespaçada).

---

## 5. CRONOGRAMA (plano diário)

Monte um plano dia a dia da data de hoje até a prova de cada matéria, respeitando:
- minutos disponíveis por dia: [X MINUTOS/DIA]; dias sem estudo: [LISTA]; matérias em paralelo: [LISTA e proporção];
- o conteúdo cobrado em cada prova e a ordem didática (base antes de matéria nova);
- **política de revisão: revisão de conteúdo SÓ 1 dia antes da prova; no dia da prova, apenas uma passada rápida nos pontos MUITO importantes** (fórmulas-chave, armadilhas). Antes disso, os dias são de aprender e praticar, sem revisões espalhadas;
- exercícios com prioridade (`prio`) e distribuídos pelos dias; exercícios marcados no plano de cada dia devem bater com os do `steps`;
- cada sessão com: título, minutos, teoria (resumo do assunto), termos de busca, "essenciais" e o `steps`.

Se faltar a data ou o conteúdo de uma prova, planeje só até onde há informação e me diga o que falta.

Registre as premissas do plano na nota **"Premissas do plano"** (horas por dia, política de revisão, o que ficou de fora).

Se eu pedir, atualize também a planilha `.xlsx` do cronograma, com o mesmo conteúdo do site.

Entregue também PDFs das listas em `arquivos/` para eu poder imprimir.

---

## 6. MIGRAÇÃO SEM PERDER MEUS DADOS

Se eu já usei o site, meu banco tem status, respostas, notas e dias estudados. **Nunca apague nem sobrescreva isso.** Padrão a seguir no `server.js`:
- `ALTER TABLE ... ADD COLUMN` quando faltar coluna (verifique pelo schema).
- Migrações controladas por chaves na tabela `config` (`setConfig('chave', 1)`). Cada migração roda uma vez, dentro de uma transação, só se a chave não existir. Chaves já usadas: `seeded, palette, exv, algpy, steps, plan2, steps2`.
- Instalação nova (sem banco) executa o seed completo e já marca TODAS as chaves como feitas.
- Para matéria nova: crie uma chave nova (ex.: `mat_<nome>`) que insere a matéria, suas sessões, exercícios, fórmulas, notas e materiais se ainda não existirem (checar por nome da matéria e por `lista+questão`). Para atualizar texto de um plano ou os `steps` de um banco existente, crie OUTRA chave nova (as antigas já estão marcadas e não rodam de novo), atualizando só campos de conteúdo (título, teoria, steps...) e nunca status, estudado, `mine`, `correct` ou notas.
- Ao substituir exercícios antigos por versões completas, herde status/correct/nota do registro antigo pelo campo `old`.
- Teste a migração: gere um banco com a versão anterior do zip, adicione dados fictícios, rode a versão nova e confirme que tudo foi preservado e o novo conteúdo apareceu.

---

## 7. TESTES ANTES DE ENTREGAR

1. `node --check server.js` e subir o servidor com banco novo (apague `caderno.db*` antes de cada rodada de teste).
2. Playwright (Python, Chromium já instalado; não rode `playwright install`) abrindo: painel, uma sessão com `steps`, página de exercício (digitar resposta, mostrar resposta, marcar status), lista de exercícios, versão celular. Tire screenshots e **olhe** (layout quebrado, fórmula crua, botão que quebra linha).
3. Script que confirma que todo `steps[].r` aponta para exercício existente e que todo exercício tem enunciado e resposta.
4. `check.js` de KaTeX sem erros.
5. Teste de migração (seção 6).
6. Para trabalho de alto risco, peça uma revisão independente (outro agente que não viu a produção) de uma amostra de respostas.

---

## 8. ENTREGA

- Gere `caderno.zip` com a pasta `caderno/` completa (sem `caderno.db*`) e envie o arquivo.
- Atualize o `README.md`.
- Mensagem final curta em português: o que mudou, como rodar (`npm start`), o que ficou pendente e o que você NÃO conseguiu verificar (vídeos não assistidos, páginas de livro inferidas, figuras difíceis).
- Se eu pedir um resumo ou guia, entregue como documento, não como texto gigante no chat.

---

## 9. REGRAS GERAIS DE QUALIDADE

- Nunca invente conteúdo de prova, data, vídeo, página de livro ou resposta. Se não souber, diga.
- Fidelidade ao enunciado original acima de tudo.
- Toda resposta numérica ou de código verificada por execução.
- Simplicidade: poucas dependências (nenhuma), código curto, interface sem enfeites, sem hover, sem comentários no código.
- Mantenha minha linguagem e meus termos ("lista", "Lousa", "Ordem do dia").
- Se algo falhar (limite de uso, rede bloqueada, arquivo ilegível), diga com clareza, salve o progresso e siga com o que dá.

---

## 10. CHECKLIST RÁPIDO PARA A NOVA MATÉRIA (preencha e cole junto)

- Matéria: [ ]
- Data da prova: [ ]
- Conteúdo cobrado: [ ]
- Linguagem (se programação): [ ]
- Listas anexadas (nomes exatos): [ ]
- Livros anexados e o que cada um cobre: [ ]
- Horas por dia / dias livres: [ ]
- Já tenho o Caderno em uso? [SIM, anexei caderno.zip / NÃO]
- Observações especiais: [ ]
