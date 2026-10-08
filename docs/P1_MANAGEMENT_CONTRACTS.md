# P1: contratos de gestao

## Estado

**CONFIRMADO:** todas as rotas abaixo usam `Authorization: Bearer <access_token>`. O backend obtem o tenant de `req.auth.entity_id`. Quando um `entity_id` legado e enviado em body, query ou path, divergencia recebe 403. Erros de validacao recebem 400, sessao ausente/invalida 401, falta de role ou tenant divergente 403, recurso ausente 404, vinculo duplicado 409 e erro inesperado 500. `AppError` e traduzido para HTTP nessas rotas de gestao.

**CONFIRMADO:** email pertence a `Identity`; `Profile` guarda nome, telefone, foto e nascimento. `Customer.id` e estavel; `EntityCustomer` guarda apenas vinculo, notas e status locais. `EntityMembership` usa a chave composta `(entity_id, profile_id)`, sem ID artificial. Status local nunca altera `Identity.status` ou MFA.

## Profile

| Metodo e path              | Roles                                           | Entrada                                                                                                             | Resposta 200                                                                                                          | Erros              |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `GET /me_profile`          | administrador, recepcionista, barbeiro, cliente | Nenhuma                                                                                                             | `id`, `identity_id`, `name`, `email` da Identity, `photo`, `phone`, `birth_date`, `roles`, `created_at`, `updated_at` | 401, 403, 404      |
| `PUT /auth/change_profile` | mesmas                                          | Body parcial: `name`, `phone`, `photo_url`, `birth_date` ISO 8601; ao menos um campo; `null` limpa campos anulaveis | Profile relido apos update, incluindo email da Identity e roles do token                                              | 400, 401, 403, 404 |

**CONFIRMADO:** este PUT tem semantica parcial explicita. `profile_id` e obtido da sessao. Email e credenciais nao sao editados aqui.

## Entity atual

| Metodo e path         | Roles                                           | Entrada                                                                                                                                                                                               | Resposta                                                                                                                                            | Erros                   |
| --------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `GET /entity/current` | administrador, recepcionista, barbeiro, cliente | Nenhuma                                                                                                                                                                                               | Entity atual, `id`, `name`, `type`, `status`, `document`, `email`, `phone`, `photo`, campos de Address quando presentes, `created_at`, `updated_at` | 401, 403, 404           |
| `PUT /entity/current` | administrador                                   | Body completo: `name`, `type`, `zip_code`, `street`, `number`, `neighborhood`, `city`, `state`, `country`; `document`, `email`, `phone`, `photo`, `complement` anulaveis/opcionais; `status` opcional | Entity atualizada, mesmo formato do GET                                                                                                             | 400, 401, 403, 404, 500 |

**CONFIRMADO:** `GET /entity/get_one/:id` e `PUT /entity/update/:id` continuam disponiveis para compatibilidade e exigem que `:id` coincida com a sessao. Administrador comum nao muda `status`; o service preserva status se omitido. O endereco e geocodificado no update existente.

**A CONFIRMAR:** signup cria Entity `pendente`; nao existe fluxo de aprovacao de produto nesta fase. O comportamento P0 de aceitar `pendente` na sessao foi preservado.

## Members / equipe

| Metodo e path                                   | Roles                        | Entrada                                                                                                                             | Resposta                                                                                                                                                  | Erros                        |
| ----------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `GET /entity_membership/get_all`                | administrador, recepcionista | Nenhuma                                                                                                                             | Array de `entity_id`, `profile_id`, `identity_id`, `profile_name`, `email`, `phone`, `photo`, `birth_date`, `roles`, `status`, `created_at`, `updated_at` | 401, 403, 404                |
| `GET /entity_membership/get_one?profile_id=...` | mesmas                       | `profile_id` da listagem                                                                                                            | Mesmo item                                                                                                                                                | 400, 401, 403, 404           |
| `POST /entity_membership/create`                | mesmas                       | `email`, `password`, `name`, `phone`, `photo` opcional, `birth_date` ISO 8601, `mfa_required`, `roles`; `entity_id` legado opcional | Item criado, HTTP 201                                                                                                                                     | 400, 401, 403, 404, 409, 500 |
| `PUT /entity_membership/update`                 | mesmas                       | `profile_id` da listagem, `roles`, `status`; `entity_id` e `identity_id` legados opcionais                                          | Item local atualizado, HTTP 200                                                                                                                           | 400, 401, 403, 404, 500      |

**CONFIRMADO:** roles de equipe sao `administrador`, `recepcionista`, `barbeiro`; `cliente` nao pode ser atribuido a Membership. Recepcionista nao cria/promove nem edita administrador existente. Desativacao usa `status: inativo`, sem DELETE fisico. O update comum altera somente `roles` e `status` locais. Alteracao de Profile global usa a rota do proprio titular; email/MFA/Identity ficam fora da gestao de equipe.

**A CONFIRMAR:** criar pessoa nova ainda exige senha inicial valida pelas regras do Auth. Para Identity/Profile existentes, a senha informada nao substitui a senha atual. Convites nao fazem parte do P1.

## Customers

| Metodo e path                                  | Roles                        | Entrada                                                                                                                    | Resposta                                                                                                                                                                | Erros                        |
| ---------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `GET /entity_customer/get_all`                 | administrador, recepcionista | Nenhuma                                                                                                                    | Array de `customer_id`, `profile_id` quando existe, `entity_id`, `profile_name`, `email`, `phone`, `photo`, `birth_date`, `notes`, `status`, `created_at`, `updated_at` | 401, 403, 404                |
| `GET /entity_customer/get_one?customer_id=...` | mesmas                       | `customer_id` da listagem                                                                                                  | Mesmo item                                                                                                                                                              | 400, 401, 403, 404           |
| `POST /entity_customer/create`                 | mesmas                       | `email`, `password`, `name`, `phone`, `photo`, `birth_date` ISO 8601, `mfa_required`, `notes`; `entity_id` legado opcional | Vinculo criado com `customer_id` estavel, HTTP 201                                                                                                                      | 400, 401, 403, 404, 409, 500 |
| `PUT /entity_customer/update`                  | mesmas                       | `customer_id`, `status`, `notes` opcional; `entity_id` legado opcional                                                     | Vinculo local atualizado, HTTP 200                                                                                                                                      | 400, 401, 403, 404, 500      |

**CONFIRMADO:** create cobre Identity nova, Identity/Profile existente sem Customer e Customer existente sem vinculo nessa Entity. Reutiliza IDs globais, cria apenas o que falta e usa transacao para as gravacoes. Vinculo duplicado retorna 409. Update usa `customer_id`, nao email. Desativacao usa `status: inativo`, sem DELETE. Email, Identity global e Profile global nao sao alterados por esse update.

**CONFIRMADO:** o schema admite `Customer.profile_id` nulo, mas nao ha fluxo de criacao administrativa sem Profile. Leituras exibem `profile_id` e dados de Profile como `null` quando esse caso existe; nenhum Profile ficticio e gerado. O `profile_id` legado no detail permanece apenas para compatibilidade, com lookup correto via Customer.

**A CONFIRMAR:** create de pessoa nova ainda exige senha inicial, como no P0. Para Identity/Profile existentes ela nao altera a senha. Uma estrategia de convite ou cadastro de cliente sem senha requer decisao de produto futura.

## Validacao

**CONFIRMADO:** os testes P0 usam Prisma/PGlite isolado; nenhum teste P1 acessa o banco de desenvolvimento. Esta fase nao altera `schema.prisma` e nao adiciona migration. Password Reset, MFA, Google, Services, Availability, Appointments, Dashboard e Billing permanecem fora do P1.

**CONFIRMADO no checkpoint final:** `npm run test:p0` passou (9 suites, 46 testes), `npm test` passou (53 suites, 179 testes) e `npm run build` passou. O ESLint sem `--fix` nos 41 arquivos P1 tocados aponta somente 4 erros e 6 avisos preexistentes; nenhuma regra nova foi violada. `npm run lint` executa `--fix` e nao foi usado para esta verificacao.
