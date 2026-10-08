# P2 — Catálogo de serviços

## Estado e modelagem

**CONFIRMADO:** `Entity` possui muitos `Service`; cada `Service` possui exatamente um `entity_id` obrigatório com FK. Não existe serviço global. O registro contém `id`, `entity_id`, `name`, `description`, `price`, `duration_minutes`, `status`, `created_at` e `updated_at`. O schema usa `Decimal(10,2)` para preço, `Int` para duração e `ServiceStatus` com `ativo`/`inativo` na API. A FK usa `ON DELETE RESTRICT`: uma Entity com serviços não é removida em cascata.

**CONFIRMADO:** o preço no JSON é sempre string decimal com duas casas, como `"35.00"`. O body exige esse formato, de `"0.00"` a `"99999999.99"`; valores negativos, NaN, expoentes e mais de duas casas recebem 400. A duração é inteiro em minutos, entre 1 e 1440. Nome é obrigatório, recebe trim e tem no máximo 100 caracteres. Descrição é opcional, recebe trim, tem no máximo 500 caracteres e string vazia vira `null`.

**CONFIRMADO:** registros novos nascem `ativo`. O catálogo administrativo lista ativos e inativos. Para desativar ou reativar, use o mesmo update com `status: "inativo"` ou `status: "ativo"`. Nenhuma rota de hard delete foi criada. Os preços e durações representam os valores atuais; snapshots de Appointment são **PLANEJADO** para fase futura.

## Contratos HTTP

Todas as rotas exigem `Authorization: Bearer <access_token>`. O tenant vem exclusivamente de `req.auth.entity_id`. `id`, `entity_id` e timestamps não são aceitos no body; o `ValidationPipe` rejeita campos extras. Detail e update procuram o par `(id, entity_id)`; um ID pertencente a outro tenant retorna 404, sem revelar seu conteúdo. Não há paginação nem filtro de status nesta fase.

| Método e path              | Roles                                           | Body/params                                                                                                       | Resposta                     | Status esperados             |
| -------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------- | ---------------------------- |
| `GET /service/get_all`     | administrador, recepcionista, barbeiro, cliente | nenhum                                                                                                            | array de Service             | 200, 401, 403, 500           |
| `GET /service/get_one/:id` | mesmas                                          | `:id` UUID do Service                                                                                             | Service                      | 200, 400, 401, 403, 404, 500 |
| `POST /service/create`     | administrador                                   | `name`, `description?`, `price` string decimal, `duration_minutes` inteiro                                        | Service criado               | 201, 400, 401, 403, 500      |
| `PUT /service/update/:id`  | administrador                                   | `:id` UUID; body parcial com `name?`, `description?`, `price?`, `duration_minutes?`, `status?`; ao menos um campo | Service relido após gravação | 200, 400, 401, 403, 404, 500 |

Formato de cada Service:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "entity_id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Corte",
  "description": null,
  "price": "35.00",
  "duration_minutes": 45,
  "status": "ativo",
  "created_at": "2026-10-01T12:00:00.000Z",
  "updated_at": "2026-10-01T12:00:00.000Z"
}
```

**CONFIRMADO:** não há constraint de nome único e, portanto, nenhuma regra 409 para nomes iguais. `"Corte"` pode ser usado por Entities diferentes. **A CONFIRMAR:** se nomes repetidos dentro da mesma Entity devem ser proibidos e se a comparação deve ignorar maiúsculas/minúsculas.

**A CONFIRMAR:** writes foram limitados a administrador por menor privilégio. Leitura foi aberta aos quatro papéis autenticados do tenant para permitir futura exibição ao cliente; não existe acesso público ou cross-tenant.

## Migration e implantação

**CONFIRMADO:** `src/infra/database/prisma/migrations/20261001000000_service_catalog/migration.sql` evolui a tabela `Service` já criada em migration anterior. Prisma Client foi gerado localmente. A migration foi aplicada apenas em PGlite isolado nos testes; nenhum banco de desenvolvimento foi acessado.

**BLOQUEADO se houver linhas globais legadas:** a migration interrompe antes de alterar o schema quando a antiga tabela `Service` contém dados. Esses registros não têm proprietário e não podem receber `entity_id`, preço ou duração por inferência. Nesse caso, preparar uma migration de dados específica com mapeamento humano, ajustar a migration de schema conforme esse plano e aplicar em ambiente controlado. Em tabela vazia, a migration é aplicável como está. Nunca usar reset/truncate como solução automática.

## Escopo

**PLANEJADO:** Appointment poderá referenciar `service_id` e guardar snapshots do preço e da duração no momento da reserva. Availability, Appointment, agenda profissional, combos, descontos, comissão, imagens de serviço e billing não foram implementados no P2.
