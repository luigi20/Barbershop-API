# P4 — Appointments

## Estado e modelo

**CONFIRMADO:** `Appointment` pertence à Entity e usa `customer_id`, `professional_profile_id` e `service_id`. FKs compostas ligam Customer a `EntityCustomer(customer_id, entity_id)`, profissional a `EntityMembership(entity_id, profile_id)` e Service a `(id, entity_id)`. O identificador do Customer é `Customer.id`, distinto de `Profile.id`.

**CONFIRMADO:** criação exige Customer vinculado e ativo, Membership ativa com role `barbeiro`, Service do tenant e ativo, além de timezone explícito na Entity. O backend copia `service_name_snapshot`, `price_snapshot` em `DECIMAL(10,2)` e `duration_minutes_snapshot`. Calcula `ends_at = starts_at + duração`. Alterações posteriores no catálogo não alteram esses campos. Reagendamento preserva os snapshots.

**CONFIRMADO:** estados: `agendado`, `cancelado`, `concluido`. Só `agendado` pode ir a `cancelado` ou `concluido`; reagendamento mantém `agendado`. Estados terminais não podem ser reagendados. Cancelamento repetido é idempotente e conserva motivo/data do primeiro cancelamento; conclusão repetida recebe 409.

## Tempo e disponibilidade

**CONFIRMADO:** `starts_at`, `ends_at`, `cancelled_at` e `completed_at` são `TIMESTAMPTZ(3)`; a API exige ISO 8601 com `Z` ou offset explícito e responde em UTC (`Z`). Reutiliza a validação de instantes P3. `date` do endpoint de disponibilidade é uma data **local da Entity** em `YYYY-MM-DD`; o backend usa `Entity.timezone` IANA para produzir instantes UTC. Não usa timezone do browser ou servidor.

**CONFIRMADO:** o cálculo percorre os períodos locais de jornada, gera inícios a cada `SLOT_INTERVAL_MINUTES` a partir do início de cada período, converte cada início local para instante UTC e conserva só os candidatos em que o Service inteiro cabe no expediente e na jornada, sem intersectar TimeBlock ou Appointment bloqueante. A verificação percorre os minutos civis do intervalo no timezone da Entity, inclusive transições de horário de verão. Intervalos são semiabertos `[start, end)`; horários adjacentes não conflitam. Appointments `agendado` e `concluido` bloqueiam, `cancelado` não bloqueia.

**A CONFIRMAR:** `slot_interval_minutes = 15` é o padrão V1, isolado em uma constante de domínio. Pode virar configuração futura da Entity.

**CONFIRMADO:** `GET /appointments/availability` é um snapshot informativo. Se outro usuário reservar um slot depois da leitura, `POST /appointments` revalida no banco e pode responder 409. A criação é a autoridade final.

## Concorrência

**CONFIRMADO no código:** criação e reagendamento usam transação Prisma `Serializable`. Antes de consultar overlap ou inserir, bloqueiam com `SELECT ... FOR UPDATE` a linha da `EntityMembership` do profissional. Reagendamento bloqueia a linha do próprio Appointment e, em troca de profissional, bloqueia as Memberships em ordem de `profile_id` para evitar ciclos entre reagendamentos. Overlap é `existing.starts_at < candidate.ends_at AND existing.ends_at > candidate.starts_at`, dentro da mesma transação. Falhas de serialização Prisma `P2034` e expiração de transação `P2028` são traduzidas para 409.

**CONFIRMADO nos testes:** duas operações simultâneas de criação para o mesmo profissional/intervalo resultaram em uma criação, um 409 e exatamente uma linha. A corrida reagendamento versus criação teve o mesmo resultado. O teste PGlite valida atomicidade e revalidação, mas sua fila serializa transações. O teste adicional em PostgreSQL 16 descartável confirmou, com duas conexões independentes, que a segunda espera o `FOR UPDATE`; repetiu as duas corridas e confirmou um sucesso, um 409 e somente um Appointment no intervalo em cada caso.

## Contratos HTTP e RBAC

Todas as rotas exigem access token. O tenant é `req.auth.entity_id`, nunca um `entity_id` do body. Administrador e recepcionista podem ler e operar appointments do próprio tenant. Barbeiro pode consultar apenas os próprios appointments e disponibilidade do próprio `profile_id`; não possui writes administrativos. Cliente não acessa estas rotas. O backend também aplica o filtro de barbeiro além do guard de roles.

| Método e path                      | Entrada                                                                                                                               | Resposta                                                                                           | Status principais            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------- |
| `GET /appointments/availability`   | `date=YYYY-MM-DD`, `professional_profile_id`, `service_id`                                                                            | `date`, `timezone`, IDs, `duration_minutes`, `slot_interval_minutes`, `slots[{starts_at,ends_at}]` | 200, 400, 401, 403, 404      |
| `GET /appointments`                | `from` e `to` ISO com offset, intervalo positivo de até 31 dias; filtros opcionais `professional_profile_id`, `customer_id`, `status` | Array ordenado por `starts_at`                                                                     | 200, 400, 401, 403           |
| `GET /appointments/:id`            | ID UUID                                                                                                                               | Appointment                                                                                        | 200, 400, 401, 403, 404      |
| `POST /appointments`               | `customer_id`, `professional_profile_id`, `service_id`, `starts_at`, `notes?`                                                         | Appointment criado                                                                                 | 201, 400, 401, 403, 404, 409 |
| `PUT /appointments/:id/reschedule` | `starts_at`, `professional_profile_id?`                                                                                               | Appointment atualizado                                                                             | 200, 400, 401, 403, 404, 409 |
| `PUT /appointments/:id/cancel`     | `reason?`                                                                                                                             | Appointment cancelado                                                                              | 200, 400, 401, 403, 404, 409 |
| `PUT /appointments/:id/complete`   | corpo vazio                                                                                                                           | Appointment concluído                                                                              | 200, 400, 401, 403, 404, 409 |

`POST` não aceita `entity_id`, `ends_at`, preço, duração, nome do Service ou status. `notes` tem máximo de 1000 caracteres; `reason` de cancelamento, 500. A resposta inclui IDs, nomes atuais de Customer e profissional quando há Profile, nome/preço/duração do snapshot, instantes ISO, status, notas, motivo/datas de cancelamento/conclusão e timestamps. `price` é string decimal com duas casas. A listagem carrega nomes em consultas por lote, sem N+1 e sem expor objetos Prisma.

400 cobre payload e regras inválidas, como timestamp sem offset, Customer inativo, profissional sem role/status ou Service inativo. 401 cobre autenticação; 403, autorização; 404, recurso não encontrado no tenant; 409, horário ocupado, fora da agenda, estado terminal ou conflito de transação. Erros Prisma inesperados não são retornados como payload ao cliente.

## Migration, testes e escopo

**CONFIRMADO:** `20261006000000_p4_appointments` depende das migrations P2 e P3. Adiciona índice composto de Service e tabela Appointment com FKs compostas, checks e índices por Entity/data, profissional/data e Customer/data. A migration foi aplicada somente em PGlite isolado nos testes; nenhuma migration foi executada em banco de desenvolvimento.

**CONFIRMADO:** o teste PostgreSQL usa um container `postgres:16-alpine` com armazenamento temporário em memória, porta restrita a `127.0.0.1:55432`, banco `p4_test` e um schema aleatório por execução. Ele só é habilitado quando `P4_DISPOSABLE_POSTGRES_TEST=1` e `P4_POSTGRES_TEST_DATABASE_URL` estão definidos; nunca lê `DATABASE_URL`. O Docker Desktop foi iniciado para a validação; nenhum banco de desenvolvimento foi acessado. O teste padrão continua executável sem Docker, com a suíte PostgreSQL ignorada quando a flag ou a URL de teste não é definida.

Para executar localmente contra um PostgreSQL descartável, configure `P4_POSTGRES_TEST_DATABASE_URL` com a URL desse banco e `P4_DISPOSABLE_POSTGRES_TEST=1` no ambiente do terminal; depois execute `npm test -- src/infra/database/p4-postgres-concurrency.spec.ts`. Não registre a URL nem as credenciais no repositório.

**PLANEJADO fora de P4:** self-booking de cliente, frontend, Dashboard, pagamentos, notificações, recorrência, múltiplos serviços, no-show e confirmação automática.
