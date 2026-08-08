<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Project

Startup Zone — безопасный MVP-маркетплейс для трех ролей:

- основатели публикуют стартапы и управляют откликами;
- специалисты находят проекты и подают заявки в команды;
- инвесторы находят подходящие стартапы и связываются с ними.

Реализовывать функции вертикальными срезами: реальная БД, доступный пользователю интерфейс, серверная валидация, авторизация, состояния ошибок и тесты. Не выдавать статические карточки, отдельные backend-функции или запланированные сценарии за готовый продукт.

Текущая основа включает публичный лендинг и каталог стартапов, Supabase Auth, защищенную часть приложения, публикацию стартапов, PostgreSQL-схему с RLS и тесты критических сценариев. Профили, заявки, модерация откликов и observability считать незавершенными, пока обратное не подтверждено актуальным кодом.

## Stack

- Frontend: Next.js 16 App Router, React 19, TypeScript, Mantine UI, Tailwind CSS.
- Server: React Server Components, Server Actions, Route Handlers.
- Auth и data access: Supabase SSR и Supabase JS.
- Database: Supabase PostgreSQL, migrations, constraints, triggers, indexes, RLS.
- Validation: Zod.
- Tests: Vitest, pgTAP / Supabase CLI, Playwright.
- CI: GitHub Actions.
- Runtime: Node.js 20.9+ и npm с `package-lock.json`.

## Commands

- Установка: `npm ci`
- Запуск: `npm run dev`
- Линтер: `npm run lint`
- Проверка типов: `npm run typecheck`
- Unit-тесты: `npm run test`
- Покрытие: `npm run test:coverage`
- RLS-тесты: `npm run test:rls`
- E2E-тесты: `npm run test:e2e`
- Основные проверки: `npm run check`
- Production-сборка: `npm run build`

`npm run check` запускает линтер, проверку типов и unit-тесты. RLS-тесты требуют локальный Supabase. E2E требуют локальное или явно тестовое окружение Supabase и `SUPABASE_SERVICE_ROLE_KEY`; production-ключи использовать нельзя.

## Rules

### Workflow

- Не работать напрямую в `main`. Использовать ветку `<short-task-name>`, если пользователь не указал другую.
- Перед изменениями проверять `git status`, текущую ветку и релевантную историю. Сохранять несвязанные пользовательские изменения.
- Делать небольшие логические коммиты с понятными сообщениями, предпочтительно Conventional Commits.
- Не удалять и не переименовывать файлы без явного разрешения. Не использовать `git clean`, `git reset --hard`, force-push и переписывание общей истории.
- Не выполнять несвязанные рефакторинги и не добавлять speculative infrastructure.

### Next.js и TypeScript

- Установленная версия Next.js — источник истины. Перед изменением routing, caching, Proxy, Server Actions или конфигурации читать релевантную документацию в `node_modules/next/dist/docs/`.
- По умолчанию использовать Server Components. Добавлять `"use client"` только для browser API, состояния, эффектов и обработчиков событий.
- Выполнять чтение в Server Components или server-only helpers, мутации — в Server Actions или Route Handlers.
- Не импортировать server-only код, включая `lib/supabase/server.ts`, в Client Components.
- Сохранять strict TypeScript без `any`, необоснованных cast, non-null assertions и подавления ошибок типов.
- Использовать алиас `@/` для импортов от корня. Код и документацию писать на английском, если задача явно не требует другого языка.

### Supabase, данные и безопасность

- PostgreSQL constraints и RLS — финальная граница авторизации; защита маршрута и скрытый UI являются дополнительными мерами.
- Для чувствительных операций проверять пользователя на сервере. Поля владельца получать из подтвержденной сессии, а не из пользовательского ввода.
- Любой недоверенный ввод валидировать Zod на серверной границе. Возвращать стабильные пользовательские ошибки без сырых сообщений БД или Auth.
- Использовать browser Supabase client только в Client Components, server client — только на сервере; создавать server client на каждый запрос.
- Ограничивать RLS по ролям, владельцам, разрешенным колонкам и переходам состояния. Покрывать положительные и отрицательные сценарии авторизации.
- Не изменять уже примененные миграции. Для изменений схемы добавлять новую миграцию и синхронизировать SQL, database types, Zod, domain constants, server logic, UI, тесты и документацию.
- Не обращаться к production Supabase и не изменять его без отдельного явного разрешения пользователя. Неопознанное окружение считать production.
- Не помещать в репозиторий `.env.local`, токены, service-role keys, credentials или приватные данные.
- Использовать только имена переменных из `.env.example`. Публичная демоверсия должна безопасно рендериться без Supabase env.
- Не добавлять production-зависимости без необходимости. При изменении зависимостей обновлять `package.json` и `package-lock.json` вместе.

### Product и UI

- Реализовывать минимальный завершенный пользовательский сценарий вместо нескольких частичных экранов.
- Обрабатывать loading, empty, success, validation, authorization, conflict и unexpected-error states.
- Не использовать hard-coded demo data там, где интерфейс заявляет пользовательские или сохраненные данные.
- Переиспользовать Mantine, тему и существующие паттерны. Проверять мобильный и desktop layout, light/dark themes, клавиатуру, focus и semantic HTML.
- Поддерживать README, UI-тексты, скриншоты и release notes в соответствии с реально реализованным поведением.

### Verification

- Documentation-only: проверить diff, Markdown, пути и ссылки.
- TypeScript, Server Components, Server Actions и общая логика: запустить `npm run check`.
- Routing, Proxy, зависимости, environment или Next.js config: запустить `npm run check` и `npm run build`.
- Auth, RLS или migrations: добавить целевые positive/negative tests, проверить на local/test Supabase, запустить `npm run check` и `npm run build`.
- Критический MVP-flow: добавить или обновить Playwright-тест, если тестовое окружение это позволяет.
- UI-изменения: дополнить автоматические проверки browser-проверкой затронутого flow.
- Если environment-dependent проверка недоступна, точно указать, что и почему осталось непроверенным.

## Done means

- Требование реализовано в отдельной ветке и пользовательский flow доступен от начала до конца.
- Данные читаются или сохраняются реально; validation, auth, authorization, integrity и failure states обработаны.
- SQL, RLS, database types, Zod, server logic и UI согласованы, если задача затрагивает данные.
- Добавлены или обновлены meaningful success и failure tests.
- Подходящие `check`, `build`, RLS, E2E и browser-проверки проходят без новых предупреждений либо ограничения явно задокументированы.
- Diff проверен: нет секретов, приватных данных, build/coverage output, случайных удалений и несвязанных изменений.
- Изменения записаны в один или несколько сфокусированных коммитов.
- Документация описывает фактическое состояние продукта и оставшиеся ограничения.
