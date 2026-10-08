# P0: tenant, persistencia e sessao local

Este documento descreve somente P0A/P0B/P0C do codigo atual. Password Reset, MFA, Google, agendamentos, servicos, disponibilidade, dashboard e billing ainda exigem fases proprias.

## Autoridade do tenant e RBAC

O NestJS valida o access JWT e preenche `req.auth.entity_id`, `identity_id`, `profile_id`, `roles` e `is_superuser`. Nos endpoints de Entity, Membership, EntityCustomer e Subscription que recebem `entity_id` no body, query ou path, o ID solicitado deve coincidir com `req.auth.entity_id`; divergencia recebe 403 antes de acessar o service. O helper de comparacao nao concede bypass generico a superuser. Rotas globais que ja usam `SuperUserGuard` continuam separadas. O Next.js BFF deve obter o contexto do token de acesso, sem tratar o ID enviado pelo browser como autoridade.

Os papeis do codigo sao `administrador`, `recepcionista`, `barbeiro` e `cliente`. Administrador gerencia membros da propria Entity. Recepcionista nao pode criar/promover administrador nem alterar um administrador existente. O DTO valida cada role do array. O update de Membership altera apenas `roles` e `status` do vinculo local; o update de EntityCustomer altera apenas `status` e `notes` do vinculo local. Esses updates nao alteram `Identity.status`, `Identity.mfa_required`, email ou Profile. O status da Entity so pode mudar pelo fluxo com `is_superuser`; administrador comum pode atualizar os demais campos da propria Entity mantendo o status atual.

## Contratos HTTP afetados

| Operacao                        | Autenticacao                            | Corpo/identificador relevante                                                           |
| ------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------- |
| `POST /auth/signin`             | publica                                 | email, password; retorna challenge e lista de entities                                  |
| `POST /auth/select-entity`      | `Authorization: Bearer <login_token>`   | `login_token` identico ao header e `entity_id`; retorna access/refresh ou MFA pendente  |
| `POST /auth/refreshtoken`       | `Authorization: Bearer <refresh_token>` | `refresh_token` identico ao header; retorna novos access/refresh                        |
| `POST /auth/logout`             | `Authorization: Bearer <access_token>`  | `refresh_token` da sessao da mesma Identity; retorna 200                                |
| `PUT /entity_membership/update` | access, administrador ou recepcionista  | `entity_id`, `identity_id`, `roles`, `status`; campos globais removidos                 |
| `PUT /entity_customer/update`   | access, administrador ou recepcionista  | `entity_id`, `email` para localizar, `status`, `notes` opcional; email nao e atualizado |

Os endpoints existentes de create/get/update em Entity, Membership, EntityCustomer e Subscription conservam os IDs solicitados em seus contratos, mas rejeitam `entity_id` de outra Entity. Um Bearer ausente ou malformado retorna 401. No logout o header e access e o body e refresh por contrato, por isso sao tipos diferentes; o backend exige que ambos pertençam a mesma Identity.

## Sessao local

`signin` emite challenge de 10 minutos. `select-entity` revalida Identity, Profile, status da Entity e vinculo ativo; Entity `pendente` continua aceita conforme o fluxo de signup atual. Para Identity sem MFA, emite access de 15 minutos e refresh de 7 dias. O refresh tem `sid` (ID unico da linha `RefreshToken`) e `jti` unico; o hash do token fica persistido. `refreshtoken` valida JWT, tipo, Identity ativa, Entity disponivel, vinculo ativo, hash, revogacao e expiracao. A rotacao troca o hash com `updateMany` condicional; o refresh anterior deixa de funcionar. `logout` revoga somente linha de sessao pertencente a Identity autenticada e pode receber um refresh antigo da mesma sessao apos rotacao. O access ja emitido continua valido ate expirar; o refresh revogado nao renova a sessao.

O schema Prisma nao mudou: `RefreshToken.id` armazena `sid`, e `jti` existe apenas no JWT. Nao ha migration nesta fase. Tokens refresh antigos sem `sid`/`jti` devem refazer login.

## Validacao

`npm run test:p0` executa os testes P0, inclusive repositorios Prisma contra PGlite em memoria. Esse teste cria tabelas apenas no processo do Jest, usa socket local temporario e nao le `DATABASE_URL`. `npm test` executa a suite completa. O PGlite no Jest requer `--experimental-vm-modules`, ja incorporado aos scripts de teste. Nenhuma migration e executada por esses testes.

Checkpoint final: `npm run test:p0` passou (9 suites, 46 testes), `npm test` passou (51 suites, 168 testes), `npm run build` e `git diff --check` passaram. O ESLint global permanece vermelho por divida anterior ao P0: 245 erros e 172 avisos no check sem `--fix`; 54 erros estao em arquivos tocados pelo P0, mas em trechos preexistentes, e 191 estao fora dos arquivos tocados. Os erros introduzidos nos testes e metodos novos do P0 foram corrigidos. O script `npm run lint` inclui `--fix`; para uma verificacao sem edicao, invoque ESLint diretamente sem essa opcao.
