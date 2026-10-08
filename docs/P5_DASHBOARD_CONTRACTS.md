# P5 — Dashboard e métricas operacionais

## Autoridade, tempo e dinheiro

Todas as consultas usam exclusivamente `req.auth.entity_id`, obtido de access token. Nenhuma rota aceita `entity_id` como seletor. O timezone IANA vem de `Entity.timezone`; se estiver ausente, a API responde 400. `date`, `from` e `to` são datas civis locais da Entity. Cada dia corresponde ao intervalo UTC semiaberto `[início local, início local do dia seguinte)`, incluindo dias de 23 ou 25 horas em transições de DST. O relógio do backend fornece somente o instante atual, usado para determinar o dia local e próximos atendimentos.

**Receita operacional dos atendimentos concluídos** soma `Appointment.price_snapshot` somente quando `status = concluido` e `completed_at` cai no intervalo. O cálculo é `DECIMAL` no banco; a resposta é string decimal com duas casas, por exemplo `"105.00"`. Não representa pagamentos, caixa, desconto, estorno ou contabilidade financeira. `Service.price` atual não entra na soma. Agendados e cancelados não produzem receita.

Contagens de agenda são atribuídas ao dia ou mês de `starts_at`, inclusive para atendimentos já concluídos ou cancelados. Por isso a contagem de `concluido` em um dia pode diferir do conjunto que produziu receita nesse dia: um atendimento marcado para ontem e concluído hoje conta na agenda de ontem, mas sua receita operacional é reconhecida hoje. A série segue a mesma regra.

`upcoming` do dia conta `agendado` com `starts_at >= agora` e anterior ao fim do dia local. O endpoint de próximos atendimentos lista `agendado` com `starts_at >= agora`, inclusive dias futuros, em ordem de `starts_at`, desempate por ID. Cancelados e concluídos ficam fora. `customer_name` pode ser `null` se Customer não tiver Profile.

## Métricas

| Campo                                                    | Definição                                                                                          |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `today.appointments_total`                               | Todos os appointments com início no dia local, qualquer um dos três status reais.                  |
| `today.scheduled`, `completed`, `cancelled`              | Status reais `agendado`, `concluido`, `cancelado` por `starts_at`.                                 |
| `today.upcoming`                                         | Agendados futuros com início ainda no dia local.                                                   |
| `today.revenue`                                          | Soma de snapshots concluídos por `completed_at` no dia local.                                      |
| `month.completed_appointments`, `cancelled_appointments` | Status por `starts_at` no mês civil local.                                                         |
| `month.revenue`                                          | Soma de snapshots concluídos por `completed_at` no mês civil local.                                |
| `customers.active`                                       | `EntityCustomer.status = ativo` na Entity. `inativo` e `bloqueado` ficam fora.                     |
| `professionals.active_barbers`                           | `EntityMembership.status = ativo` e array `roles` contém `barbeiro`. Outras roles podem coexistir. |
| `services.active`                                        | `Service.status = ativo` na Entity.                                                                |

Não há `new_this_month`: o produto ainda não assegura que `EntityCustomer.created_at` represente a primeira entrada do cliente naquela empresa em todos os fluxos históricos. `top-services` permanece planejado; a política de nomes após renomeações deve ser explicitada antes do contrato.

## Contratos HTTP

Todas as rotas requerem `Authorization: Bearer <access_token>`. Erros: 400 para data/range/limit inválido ou timezone ausente, 401 para autenticação, 403 para role/contexto sem autorização, 500 para falha inesperada sem expor erro Prisma. Entity da sessão ausente pode produzir 404.

| Método e path               | Roles                        | Query                                                                    | Resposta 200                                                                                                                                                                                                                                                |
| --------------------------- | ---------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /dashboard/operations` | administrador, recepcionista | nenhuma                                                                  | `{ timezone, date, today: { appointments_total, scheduled, completed, cancelled, upcoming } }`                                                                                                                                                              |
| `GET /dashboard/summary`    | administrador                | nenhuma                                                                  | `{ timezone, date, today: { appointments_total, scheduled, completed, cancelled, upcoming, revenue }, month: { completed_appointments, cancelled_appointments, revenue }, customers: { active }, professionals: { active_barbers }, services: { active } }` |
| `GET /dashboard/upcoming`   | administrador, recepcionista | `limit` opcional, padrão 5, inteiro de 1 a 20                            | `{ timezone, appointments: UpcomingAppointment[] }`                                                                                                                                                                                                         |
| `GET /dashboard/timeseries` | administrador                | `from` e `to` obrigatórios, `YYYY-MM-DD`, inclusivos, 1 a 90 dias locais | `{ timezone, from, to, points: DayPoint[] }`                                                                                                                                                                                                                |

`UpcomingAppointment` contém `appointment_id`, `customer_id`, `customer_name`, `professional_profile_id`, `professional_name`, `service_id`, `service_name_snapshot`, `starts_at`, `ends_at`, `status`, `price_snapshot`. Os timestamps são ISO UTC com `Z`; `price_snapshot` é string decimal. Não há dados de Identity ou tokens. A recepcionista vê o preço de cada atendimento porque P4 já fornece preço por atendimento nas rotas operacionais, mas não recebe somatórios de receita global.

`DayPoint` contém `date`, `appointments`, `scheduled`, `completed`, `cancelled`, `revenue`. O intervalo inclui os dois extremos e emite dias sem dados com contagens zero e `"0.00"`. Contagens agrupam o dia local de `starts_at`; receita agrupa o dia local de `completed_at`.

## RBAC e consultas

Administrador pode consultar todas as quatro rotas. Recepcionista acessa apenas `operations` e `upcoming`. Barbeiro e cliente não acessam dashboard administrativo, mesmo se tiverem appointments. Não há bypass de superuser. O guard de access token, o guard de roles e a checagem de contexto de tenant seguem P0/P4.

Contagens usam `count`/`groupBy` do Prisma; receita usa `_sum` Decimal no banco. A série envia ao PostgreSQL uma tabela de até 90 datas locais e seus limites UTC calculados pelos helpers P3/P4, agrupando em duas consultas com `GROUP BY`; não carrega todos os appointments em memória. Os nomes de próximos atendimentos são carregados em lote, com no máximo 20 linhas de Appointment e duas consultas de nomes, sem N+1. Nenhum cache foi introduzido.

O índice P4 `(entity_id, starts_at)` cobre as contagens e a série por agenda. P5 adiciona `(entity_id, completed_at)` para as consultas de receita por instante de conclusão. A migration adiciona só o índice e não altera dados nem regras funcionais anteriores. A ordem de migrations é P2 → P3 → P4 → P5. As consultas agrupadas usam SQL PostgreSQL (`VALUES`, `FILTER`) e foram exercitadas em PGlite isolado. PGlite não aplicou corretamente `AT TIME ZONE 'America/Belem'` no teste de borda; por isso a série usa os mesmos limites UTC locais já calculados pela aplicação, também adequados ao PostgreSQL. Nenhum banco de desenvolvimento é usado pelos testes.

## Validação P5

Os testes PGlite incluem appointments reais em dois tenants, receita e série separadas, um instante UTC que pertence ao dia civil anterior em `America/Belem`, vínculos e serviços ativos/inativos, ordenação cronológica e por ID em empate, limites 5/20, estados excluídos de próximos atendimentos, ausência de timezone, range de 90 dias e transição DST de 23 horas. A inspeção do repository confirmou que `upcoming` executa uma consulta limitada para Appointment e no máximo duas consultas em lote para nomes; não consulta Customer, Professional ou Service por linha. A suíte P5 passou com 5 testes. P0, P1, P2, P3, P4, suíte completa, build, Prisma validate, ESLint P5 sem `--fix` e `git diff --check` passaram. A suíte PostgreSQL de concorrência P4 permanece opcional e foi ignorada sem sua flag.

**A CONFIRMAR:** eventual acesso da recepcionista a somatórios globais de receita; política de nomes para ranking histórico de serviços; timezone de Entities legadas ainda não configuradas. Até decisão explícita, aplica-se menor privilégio e não se atribui timezone por inferência.
