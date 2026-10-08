# P3 — Working hours e availability

## Estado e política de tempo

**CONFIRMADO:** `Entity.timezone` guarda um identificador IANA validado por `Intl.DateTimeFormat` no backend. É anulável para Entities legadas; a migration não atribui um fuso por inferência. `GET /availability/timezone` mostra `null` até o administrador configurar um valor por `PUT /availability/timezone`. Escritas de horários ou bloqueios exigem timezone configurado. A troca posterior do timezone preserva os instantes UTC dos bloqueios e passa a interpretar os horários semanais no novo fuso; o administrador deve revisar a agenda antes dessa troca.

**CONFIRMADO:** regras semanais usam o horário civil local da Entity. `weekday` é 0=domingo, 1=segunda, ..., 6=sábado. A API recebe/devolve `HH:mm` de 00:00 a 23:59 como início e de 00:00 a 24:00 como fim; `24:00` só é fim exclusivo do dia. O banco armazena inteiros de 0 a 1440, sem `Date` artificial. Períodos são semiabertos `[start_time, end_time)`, podem ser adjacentes e não podem se sobrepor. Períodos que cruzam meia-noite devem ser divididos em dois weekdays, por exemplo 22:00–24:00 e 00:00–02:00.

**CONFIRMADO:** `ProfessionalTimeBlock.starts_at` e `ends_at` são `TIMESTAMPTZ(3)`. A API exige ISO 8601 com `Z` ou offset explícito e responde em UTC (`Z`). O backend interpreta o offset e normaliza o instante; não usa o timezone do browser nem do servidor. O cliente deve usar o timezone da Entity para apresentar ou escolher datas locais. A API não aceita datetimes locais sem offset, que podem ser ambíguos em transições de horário de verão.

## Modelo e regras

**CONFIRMADO:** `EntityBusinessHour` pertence à Entity. `ProfessionalWorkingHour` e `ProfessionalTimeBlock` usam `entity_id + profile_id`, com FK para `EntityMembership`. A Membership deve estar `ativo` e conter role `barbeiro` para criar jornada ou bloqueios. O administrador pode ler e limpar (`periods: []`) uma jornada antiga após a perda dessa role. Administrador e recepcionista não são profissionais por presunção. Os IDs de períodos idênticos permanecem estáveis em PUT repetido; períodos removidos são apagados e novos recebem UUIDs. Bloqueio conserva ID em update e usa hard delete na remoção.

**CONFIRMADO:** jornada profissional deve estar integralmente coberta pela união dos intervalos do expediente da Entity no mesmo weekday. PUT do expediente rejeita redução que deixaria jornada existente fora dele. Bloqueios podem cobrir qualquer instante real e não precisam caber na jornada; bloqueios sobrepostos do mesmo profissional são rejeitados. A disponibilidade conceitual futura é a interseção do expediente e da jornada, menos bloqueios, appointments e demais regras P4.

**CONFIRMADO:** substituições em lote e mudanças de bloqueio usam transação Prisma `Serializable` e bloqueiam a linha da Entity com `SELECT ... FOR UPDATE` antes de validar e gravar. Isso serializa alterações das três camadas feitas por estas rotas. As FKs e checks da migration garantem tenant, weekday e ordem básica dos períodos no banco; a validação de sobreposição e contenção ocorre no service transacional. Requisições que falham não deixam alterações parciais.

## Contratos HTTP

Todas as rotas requerem `Authorization: Bearer <access_token>` e role `administrador`; o tenant vem exclusivamente de `req.auth.entity_id`. `profileId` e `id` no path são UUIDs. Body extra é rejeitado pelo `ValidationPipe` global. Respostas usam `entity_id` e `profile_id` apenas como dados, nunca como autoridade de entrada.

| Método e path                                                       | Entrada                                                   | Resposta                                          | Status                       |
| ------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------- | ---------------------------- |
| `GET /availability/timezone`                                        | nenhuma                                                   | `{ "timezone": string \| null }`                  | 200, 401, 403, 404           |
| `PUT /availability/timezone`                                        | `{ "timezone": "America/Sao_Paulo" }`                     | `{ "timezone": "America/Sao_Paulo" }`             | 200, 400, 401, 403, 404      |
| `GET /availability/business-hours`                                  | nenhuma                                                   | `{ "periods": HourPeriod[] }`                     | 200, 401, 403, 404           |
| `PUT /availability/business-hours`                                  | `{ "periods": PeriodInput[] }`                            | `{ "periods": HourPeriod[] }`                     | 200, 400, 401, 403, 404, 409 |
| `GET /availability/professionals/:profileId/hours`                  | nenhuma                                                   | `{ "profile_id": UUID, "periods": HourPeriod[] }` | 200, 400, 401, 403, 404      |
| `PUT /availability/professionals/:profileId/hours`                  | `{ "periods": PeriodInput[] }`                            | mesmo formato do GET                              | 200, 400, 401, 403, 404, 409 |
| `GET /availability/professionals/:profileId/blocks?from=...&to=...` | `from`, `to` ISO com offset; filtro por interseção        | `TimeBlock[]`                                     | 200, 400, 401, 403, 404      |
| `POST /availability/professionals/:profileId/blocks`                | `{ "starts_at": ISO, "ends_at": ISO, "reason"?: string }` | `TimeBlock`                                       | 201, 400, 401, 403, 404, 409 |
| `PUT /availability/professionals/:profileId/blocks/:id`             | corpo completo como POST                                  | `TimeBlock`, mesmo ID                             | 200, 400, 401, 403, 404, 409 |
| `DELETE /availability/professionals/:profileId/blocks/:id`          | nenhuma                                                   | `{ "id": UUID }`                                  | 200, 400, 401, 403, 404      |

`PeriodInput` é `{ "weekday": 1, "start_time": "09:00", "end_time": "12:00" }`. `HourPeriod` adiciona `id`, `entity_id`, `profile_id` quando profissional, `created_at` e `updated_at`. `TimeBlock` contém `id`, `entity_id`, `profile_id`, `starts_at`, `ends_at`, `reason`, `created_at`, `updated_at`. `PUT` de horas substitui toda a coleção e aceita `[]` para fechá-la; ele preserva os IDs dos períodos que permanecem iguais.

400 cobre formato inválido, timezone ausente, início >= fim, membro sem role/status adequado e jornada fora do expediente. 401 cobre autenticação; 403 cobre falta de role/contexto; 404 cobre Entity, profissional ou bloqueio ausente no tenant; 409 cobre intervalos sobrepostos ou redução do expediente que deixaria jornada fora. Erros inesperados recebem 500 sem expor detalhes Prisma.

## Migration e escopo

**CONFIRMADO:** `20261005000000_p3_availability` adiciona timezone nullable e as três tabelas. O Prisma Client foi gerado localmente. Testes aplicam a migration somente em PGlite isolado; nenhuma migration foi executada no banco de desenvolvimento. A aplicação em ambiente real requer a migration P2 já aplicada e revisão operacional dos dados existentes.

**A CONFIRMAR:** se barbeiros poderão editar a própria jornada e os próprios bloqueios. Até decisão do produto, apenas administrador gerencia. Também falta definir uma política operacional para troca de timezone após haver configurações e appointments.

**PLANEJADO:** P4 calculará slots usando as regras P3, duração de Service e appointments reais. **BLOQUEADO nesta fase:** endpoint de slots, Appointment, booking e double booking, pois ignorar appointments daria uma disponibilidade enganosa.
