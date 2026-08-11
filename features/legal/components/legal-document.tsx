"use client";

import type { PublicLegalConfig } from "@/features/legal/types";
import { Alert, Anchor, List, Paper, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";

type LegalDocumentProps = {
  config: PublicLegalConfig;
  kind: "privacy" | "consent";
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { dateStyle: "long" });

function EffectiveVersion({ config }: { config: PublicLegalConfig }) {
  return (
    <Text size="sm" c="dimmed">
      Версия: {config.documentVersion} · Действует с{" "}
      {dateFormatter.format(new Date(`${config.effectiveDate}T00:00:00Z`))}
    </Text>
  );
}

function OperatorDetails({ config }: { config: PublicLegalConfig }) {
  return (
    <Stack gap={4}>
      <Text><strong>Оператор:</strong> {config.operatorName}</Text>
      <Text><strong>Адрес:</strong> {config.operatorAddress}</Text>
      <Text>
        <strong>Контакт по вопросам персональных данных:</strong>{" "}
        <Anchor href={`mailto:${config.operatorEmail}`}>{config.operatorEmail}</Anchor>
      </Text>
    </Stack>
  );
}

function DocumentNotice({ config }: { config: PublicLegalConfig }) {
  if (config.mode === "approved") return null;

  return (
    <Alert
      color={config.mode === "blocked" ? "red" : "yellow"}
      title={config.mode === "blocked" ? "Документ ещё не опубликован" : "Черновик для разработки"}
      role={config.mode === "blocked" ? "alert" : "status"}
    >
      {config.mode === "blocked"
        ? "Production-регистрация заблокирована до заполнения реквизитов оператора, активации версии в базе данных и юридического утверждения документов."
        : "Этот текст предназначен только для локальной и тестовой среды. Перед запуском его должен проверить специалист по российскому праву, а реквизиты и обработчики — заменить на фактические."}
    </Alert>
  );
}

function PrivacyPolicy({ config }: { config: PublicLegalConfig }) {
  return (
    <Stack gap="xl">
      <section>
        <Title order={2} size="h3">1. Оператор и область действия</Title>
        <Text mt="sm">
          Настоящая политика описывает обработку персональных данных при использовании
          сайта и личного кабинета Startup Zone.
        </Text>
        <OperatorDetails config={config} />
      </section>

      <section>
        <Title order={2} size="h3">2. Данные и цели обработки</Title>
        <List mt="sm" spacing="xs">
          <List.Item>имя, электронная почта, роль и данные учётной записи — для регистрации и входа;</List.Item>
          <List.Item>
            сведения о приглашении, его сроке и использовании — для доступа к закрытой бете и
            предотвращения повторного использования;
          </List.Item>
          <List.Item>сведения профиля и профессиональные ссылки — для представления участника на площадке;</List.Item>
          <List.Item>данные стартапов и инвестиционных заявок — для работы маркетплейса и связи сторон;</List.Item>
          <List.Item>приватные контакты — для раскрытия другой стороне только после принятой заявки;</List.Item>
          <List.Item>технические записи безопасности — для защиты сервиса, расследования ошибок и предотвращения злоупотреблений.</List.Item>
        </List>
      </section>

      <section>
        <Title order={2} size="h3">3. Основания, способы и действия</Title>
        <Text mt="sm">
          Обработка выполняется на основании согласия, действий пользователя по заключению и
          исполнению соглашения с площадкой, а также иных оснований, предусмотренных законом.
          Оператор может собирать, записывать, систематизировать, хранить, уточнять, извлекать,
          использовать, предоставлять в предусмотренных продуктом случаях, блокировать и удалять
          данные с применением автоматизированных средств и без них.
        </Text>
      </section>

      <section>
        <Title order={2} size="h3">4. Обработчики и место хранения</Title>
        <Text mt="sm">
          Для работы сервиса оператор привлекает следующих обработчиков и поставщиков
          инфраструктуры:
        </Text>
        <List mt="sm" spacing="xs">
          {config.processors.map((processor) => <List.Item key={processor}>{processor}</List.Item>)}
        </List>
        <Text mt="sm">
          Базы данных production-среды должны находиться на территории Российской Федерации.
          Перед подключением нового обработчика оператор актуализирует документы и договорные условия.
        </Text>
      </section>

      <section>
        <Title order={2} size="h3">5. Сроки, права и отзыв согласия</Title>
        <Text mt="sm">
          Данные обрабатываются до достижения заявленных целей, удаления аккаунта или истечения
          обязательного срока хранения. Субъект вправе запросить сведения об обработке, исправление,
          блокирование или удаление данных. Копию данных можно скачать, а согласие — отозвать вместе
          с удалением аккаунта в разделе{" "}
          <Anchor component={Link} href="/dashboard/account">«Данные аккаунта»</Anchor>. Запрос также
          можно направить на{" "}<Anchor href={`mailto:${config.operatorEmail}`}>
            {config.operatorEmail}
          </Anchor>. Оператор отвечает в сроки и порядке, установленные законодательством Российской
          Федерации.
        </Text>
        <Text mt="sm">
          При самостоятельном удалении данные учётной записи и маркетплейса удаляются из рабочей
          базы сразу. Запись о согласии сохраняет только версию документа, время принятия и отзыва,
          а использованное приглашение — роль и технические отметки времени; email и идентификатор
          аккаунта из этих записей удаляются. Технические журналы и резервные копии могут хранить
          прежние данные не более 30 дней, после чего удаляются ротацией, если закон не требует
          иного срока.
        </Text>
      </section>

      <section>
        <Title order={2} size="h3">6. Защита и изменение политики</Title>
        <Text mt="sm">
          Оператор применяет организационные и технические меры защиты, ограничивает доступ по
          ролям и сохраняет историю значимых действий. Новая редакция публикуется с отдельным
          номером версии и датой начала действия.
        </Text>
      </section>
    </Stack>
  );
}

function PersonalDataConsent({ config }: { config: PublicLegalConfig }) {
  return (
    <Stack gap="xl">
      <section>
        <Title order={2} size="h3">Кому предоставляется согласие</Title>
        <OperatorDetails config={config} />
      </section>

      <section>
        <Title order={2} size="h3">Состав данных и цели</Title>
        <Text mt="sm">
          Пользователь свободно, своей волей и в своём интересе соглашается на обработку имени,
          электронной почты, выбранной роли, сведений о приглашении, сведений профиля,
          профессиональных ссылок, приватных контактов, опубликованных данных стартапа и сообщений
          в инвестиционных заявках. Цели: создание и защита учётной записи, контроль доступа к
          закрытой бете, предоставление функций маркетплейса, проверка прав доступа, связь между
          сторонами принятой заявки и поддержка пользователей.
        </Text>
      </section>

      <section>
        <Title order={2} size="h3">Действия, способы и порученная обработка</Title>
        <Text mt="sm">
          Согласие распространяется на сбор, запись, систематизацию, накопление, хранение,
          уточнение, извлечение, использование, предусмотренное интерфейсом предоставление,
          блокирование и удаление данных автоматизированным и смешанным способом. Обработка может
          быть поручена следующим поставщикам в объёме, необходимом для работы сервиса:
        </Text>
        <List mt="sm" spacing="xs">
          {config.processors.map((processor) => <List.Item key={processor}>{processor}</List.Item>)}
        </List>
      </section>

      <section>
        <Title order={2} size="h3">Срок и отзыв</Title>
        <Text mt="sm">
          Согласие действует до достижения целей обработки или его отзыва, если закон не допускает
          продолжение обработки по иному основанию. Поскольку без данных аккаунта сервис не может
          предоставлять функции маркетплейса, самостоятельный отзыв в разделе{" "}
          <Anchor component={Link} href="/dashboard/account">«Данные аккаунта»</Anchor> одновременно
          удаляет аккаунт. Отзыв также можно направить письмом на{" "}
          <Anchor href={`mailto:${config.operatorEmail}`}>{config.operatorEmail}</Anchor>. Отзыв не
          влияет на законность обработки, выполненной до его получения оператором.
        </Text>
      </section>

      <Alert color="blue" title="Как фиксируется согласие">
        При регистрации пользователь отмечает отдельный обязательный флажок. Startup Zone сохраняет
        идентификатор аккаунта, электронную почту, версию этого документа и серверное время принятия.
        Код приглашения хранится только в виде одностороннего SHA-256-хеша и после успешной регистрации
        помечается использованным. После отзыва идентификатор и email удаляются из обеих аудиторских
        записей, а к записи о согласии добавляется время отзыва.
      </Alert>
    </Stack>
  );
}

export function LegalDocument({ config, kind }: LegalDocumentProps) {
  const title = kind === "privacy"
    ? "Политика обработки персональных данных"
    : "Согласие на обработку персональных данных";

  return (
    <Paper withBorder radius="lg" p={{ base: "lg", sm: "xl" }}>
      <Stack gap="xl">
        <div>
          <Title order={1}>{title}</Title>
          {config.mode !== "blocked" && <EffectiveVersion config={config} />}
        </div>
        <DocumentNotice config={config} />
        {config.mode !== "blocked" && (
          kind === "privacy" ? <PrivacyPolicy config={config} /> : <PersonalDataConsent config={config} />
        )}
        <Text size="sm" c="dimmed">
          <Anchor component={Link} href={kind === "privacy" ? "/legal/consent" : "/legal/privacy"}>
            {kind === "privacy"
              ? "Открыть согласие на обработку персональных данных"
              : "Открыть политику обработки персональных данных"}
          </Anchor>
        </Text>
      </Stack>
    </Paper>
  );
}
