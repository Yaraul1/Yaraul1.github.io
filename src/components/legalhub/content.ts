export type Workflow = "signing" | "certification";
export const workflowLabel = { signing: "Подписание", certification: "Заверение" };
export const stages = (workflow: Workflow) => [
  {
    title: "Файл принят",
    detail: "API сохраняет исходник в MinIO и создаёт задачу в очереди PostgreSQL.",
    layer: "API → очередь",
    code: 0
  },
  {
    title: "Подготовка PDF",
    detail:
      "Worker забирает задачу. Office-файлы конвертируются в PDF, готовый PDF используется для дальнейшей обработки.",
    layer: "Worker → PDF",
    code: 1
  },
  {
    title: workflow === "signing" ? "Поиск места подписи" : "Выбор штампа",
    detail:
      workflow === "signing"
        ? "Страницы передаются в Dify. Наблюдения сопоставляются с доступными организациями, подписантами и шаблонами."
        : "Используется выбранный шаблон «Копия верна». Поиск мест через Dify для этого сценария не нужен.",
    layer: workflow === "signing" ? "Dify → resolver" : "Шаблон → правила",
    code: workflow === "signing" ? 2 : 3
  },
  {
    title: "Штамп и результат",
    detail:
      "Штамп накладывается на документ. Готовый PDF сохраняется в MinIO, worker обновляет статус файла.",
    layer: "PDF → MinIO",
    code: 4
  }
];
export const codeSamples = [
  {
    label: "Загрузка",
    path: "frontend · features/doc-processing/api/batches.ts",
    language: "TypeScript",
    explanation:
      "Фронтенд отправляет параметры и файлы одним multipart-запросом. Next.js BFF проксирует его в FastAPI. В реальном интерфейсе TanStack Query опрашивает активные обработки каждые 3 секунды.",
    code: `export function createBatch(payload: CreateBatchPayload) {
  const formData = new FormData()
  formData.append("body", JSON.stringify(payload.body))

  for (const file of payload.files) {
    formData.append("files", file)
  }

  return fetchJson<BatchCreateResponse>(BATCHES_BASE_PATH, {
    method: "POST",
    body: formData,
  })
}`
  },
  {
    label: "Оркестрация",
    path: "backend · services/doc_processing/processing/orchestrator.py",
    language: "Python",
    explanation:
      "Один оркестратор получает исходник, выбирает обработчик по workflow_type и сохраняет результат. Подписание и заверение остаются отдельными сценариями.",
    code: `source_content = await minio.download_object(
    object_key=task.file.source_object_key
)

handler = get_workflow_handler(workflow_type)
processed_content = await handler(
    source_content, task, settings_assets_minio
)

await minio.upload_object(
    object_key=result_object_key,
    content=processed_content,
    content_type=RESULT_CONTENT_TYPE,
)`
  },
  {
    label: "Dify / AI",
    path: "backend · processing/handlers/signing/handler.py",
    language: "Python",
    explanation:
      "Dify возвращает наблюдения по страницам. Resolver сопоставляет их с кандидатами из справочников. Если целей нет, обработка завершается ошибкой, а не размещает штамп наугад.",
    code: `page_observations = await run_signing_workflow_request(
    task=task,
    rendered_pages=rendered_pages,
    candidates=candidates,
)
targets = resolve_signing_targets(
    observations=page_observations,
    candidates=candidates,
    task=task,
)
if not targets:
    raise ValueError(
        "AI returned no signing targets for this document."
    )`
  },
  {
    label: "Заверение",
    path: "backend · processing/handlers/certification.py",
    language: "Python",
    explanation:
      "Для заверения берётся выбранное изображение штампа. PDF проходит без конвертации, остальные поддерживаемые форматы сначала преобразуются. Затем отметка наносится по правилам заверения.",
    code: `mark_object_key = resolve_mark_asset(task)
source_ext = _extract_extension(task.file.name)
mark_bytes = await minio.download_object(
    object_key=mark_object_key
)
if source_ext == "pdf":
    pdf_bytes = content
else:
    pdf_bytes = await asyncio.to_thread(
        convert_to_pdf, content, source_ext
    )

return await asyncio.to_thread(
    apply_mark_to_rendered_pages, pdf_bytes, mark_bytes,
)`
  },
  {
    label: "Готово / ошибка",
    path: "backend · workers/doc_processing/runner.py",
    language: "Python",
    explanation:
      "Worker отмечает успешный файл в транзакции и пересчитывает состояние пакета. Исключения обрабатываются отдельной веткой с mark_batch_file_error. Например, отсутствие целей AI показывается пользователю как «Не найден шаблон подписи».",
    code: `async with db.transaction() as session:
    updated = await mark_batch_file_done(
        session,
        batch_file_id=task.file.id,
        result_object_key=result_object_key,
    )
    if updated:
        await finalize_completed_batches(
            session, batch_ids=[task.batch.id]
        )`
  }
];
