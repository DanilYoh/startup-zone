import { AuthButton } from "@/components/auth-button";
import { LinkButton } from "@/components/link-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Skeleton } from "@mantine/core";
import {
  ArrowRight,
  Building2,
  Check,
  Compass,
  Landmark,
  LockKeyhole,
  Radar,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import styles from "./home-supabase.module.css";

const founderFields = [
  "Личность и профессиональный заголовок",
  "Опыт основателя и знание отрасли",
  "Стартап, прогресс и сумма раунда",
  "Город и проверяемые профессиональные ссылки",
] as const;

const investorFields = [
  "Личность, фонд или инвестиционная организация",
  "Понятная инвестиционная стратегия",
  "Предпочтительные стадии стартапов",
  "Диапазон чека и проверяемые ссылки",
] as const;

const workflow = [
  {
    number: "01",
    title: "Основатель публикует главное",
    description:
      "Структурированная карточка показывает продукт, стадию, рынок, прогресс и цель раунда в сопоставимом виде.",
  },
  {
    number: "02",
    title: "Инвестор оценивает соответствие",
    description:
      "Фильтры и профиль инвестора помогают понять взаимный интерес до начала разговора.",
  },
  {
    number: "03",
    title: "Обе стороны принимают решение",
    description:
      "Заявка сохраняется, основатель принимает или отклоняет её, а контакты открываются только после принятия.",
  },
] as const;

function Brand() {
  return (
    <Link href="/" className={styles.brand} aria-label="Главная Startup Zone">
      <span className={styles.brandMark}>SZ</span>
      <span>Startup Zone</span>
    </Link>
  );
}

function ProfileFields({ fields }: { fields: readonly string[] }) {
  return (
    <ul className={styles.profileFields}>
      {fields.map((field) => (
        <li key={field}>
          <Check size={15} aria-hidden="true" />
          <span>{field}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <div className={styles.home}>
      <a href="#main-content" className={styles.skipLink}>Перейти к содержанию</a>

      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Основная навигация">
          <Brand />
          <div className={styles.desktopNav}>
            <a href="#roles">Для кого</a>
            <a href="#workflow">Как это работает</a>
            <Link href="/startups">Стартапы</Link>
            <a href="#trust">Безопасность</a>
          </div>
          <div className={styles.navActions}>
            <ThemeSwitcher />
            <Suspense fallback={<Skeleton height={36} width={124} radius="xl" />}>
              <AuthButton />
            </Suspense>
          </div>
        </nav>
      </header>

      <main id="main-content">
        <section className={styles.hero}>
          <div className={styles.heroNoise} aria-hidden="true" />
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <div className={styles.eyebrow}>
                <Sparkles size={15} aria-hidden="true" />
                Площадка для основателей и инвесторов
              </div>
              <h1>
                Сильные основатели встречают <span>подходящих инвесторов.</span>
              </h1>
              <p className={styles.heroDescription}>
                Startup Zone заменяет хаотичный нетворкинг понятными профилями, структурированными
                карточками стартапов и прямым путём к предметному инвестиционному разговору.
              </p>
              <div className={styles.heroActions}>
                <LinkButton
                  href="/startups"
                  size="lg"
                  rightSection={<ArrowRight size={17} aria-hidden="true" />}
                >
                  Смотреть стартапы
                </LinkButton>
                <LinkButton
                  href="/auth/sign-up"
                  size="lg"
                  variant="outline"
                  className={styles.darkSurfaceOutline}
                >
                  Создать профиль
                </LinkButton>
              </div>
              <p className={styles.heroNote}>
                <LockKeyhole size={14} aria-hidden="true" />
                Регистрация по приглашению. Контакты открываются только после принятия заявки.
              </p>
              <div className={styles.proofRow} aria-label="Возможности продукта">
                <div><strong>02</strong><span>ролевых профиля</span></div>
                <div><strong>01</strong><span>заявка до обмена контактами</span></div>
                <div><strong>RLS</strong><span>защита на уровне данных</span></div>
              </div>
            </div>

            <div className={styles.signalBoard} aria-label="Соответствие профилей основателя и инвестора">
              <div className={styles.signalToolbar} aria-hidden="true">
                <span><i /> Пространство сделки</span>
                <span>Сопоставление · 03</span>
              </div>
              <div className={styles.signalCanvas}>
                <div className={`${styles.signalCard} ${styles.founderSignal}`}>
                  <div className={styles.signalHeader}>
                    <span className={styles.signalIcon}><Building2 size={20} aria-hidden="true" /></span>
                    <span className={styles.signalStatus}>Публикация</span>
                  </div>
                  <p className={styles.signalKicker}>Сигнал основателя</p>
                  <h2>Покажите возможность ясно.</h2>
                  <div className={styles.signalLines}>
                    <span style={{ "--line-width": "92%" } as React.CSSProperties} />
                    <span style={{ "--line-width": "68%" } as React.CSSProperties} />
                    <span style={{ "--line-width": "81%" } as React.CSSProperties} />
                  </div>
                  <div className={styles.signalTags}><span>Стадия</span><span>Прогресс</span><span>Раунд</span></div>
                </div>

                <div className={styles.matchRail} aria-hidden="true">
                  <span />
                  <div><Radar size={18} /></div>
                  <span />
                </div>

                <div className={`${styles.signalCard} ${styles.investorSignal}`}>
                  <div className={styles.signalHeader}>
                    <span className={styles.signalIcon}><Landmark size={20} aria-hidden="true" /></span>
                    <span className={styles.signalStatus}>Оценка</span>
                  </div>
                  <p className={styles.signalKicker}>Интерес инвестора</p>
                  <h2>Инвестируйте в то, во что верите.</h2>
                  <div className={styles.fitGrid}>
                    <div><span>Стратегия</span><strong>Совпадает</strong></div>
                    <div><span>Стадия</span><strong>Seed</strong></div>
                    <div><span>Чек</span><strong>Подходит</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="roles" className={styles.rolesSection}>
          <div className={styles.sectionHeading}>
            <p className={styles.sectionKicker}>Одна площадка — две продуманные роли</p>
            <h2>Профиль должен помогать другой стороне принять решение.</h2>
            <p>
              Универсальные профили создают шум. Startup Zone собирает только сведения, которые
              подтверждают компетентность и помогают оценить взаимное соответствие.
            </p>
          </div>

          <div className={styles.roleGrid}>
            <article className={`${styles.roleCard} ${styles.founderCard}`}>
              <div className={styles.roleCardTop}>
                <span className={styles.roleNumber}>01</span>
                <Building2 size={30} aria-hidden="true" />
              </div>
              <p className={styles.roleType}>Профиль основателя</p>
              <h3>Компетентность человека. Факты о стартапе.</h3>
              <p className={styles.roleDescription}>
                Профиль основателя остаётся кратким: продукт, рынок, стадия, ссылки и параметры
                раунда находятся в карточке стартапа.
              </p>
              <ProfileFields fields={founderFields} />
              <LinkButton href="/auth/sign-up" variant="subtle" px={0} rightSection={<ArrowRight size={15} />}>
                Стать основателем
              </LinkButton>
            </article>

            <article className={`${styles.roleCard} ${styles.investorCard}`}>
              <div className={styles.roleCardTop}>
                <span className={styles.roleNumber}>02</span>
                <Landmark size={30} aria-hidden="true" />
              </div>
              <p className={styles.roleType}>Профиль инвестора</p>
              <h3>Открытая стратегия, чтобы основатели тоже могли оценить соответствие.</h3>
              <p className={styles.roleDescription}>
                Профиль инвестора показывает направления, стадии и диапазон чека вместо общей
                биографии без критериев.
              </p>
              <ProfileFields fields={investorFields} />
              <LinkButton href="/auth/sign-up" variant="subtle" px={0} rightSection={<ArrowRight size={15} />}>
                Стать инвестором
              </LinkButton>
            </article>
          </div>
        </section>

        <section id="workflow" className={styles.workflowSection}>
          <div className={styles.workflowInner}>
            <div className={styles.workflowIntro}>
              <p className={styles.sectionKicker}>От сигнала к разговору</p>
              <h2>Меньше просмотра. Больше релевантности.</h2>
              <p>
                Каждый шаг работает на реальных сохранённых данных — это не набор декоративных
                демонстрационных карточек.
              </p>
              <LinkButton href="/startups" variant="outline">Открыть каталог</LinkButton>
            </div>
            <div className={styles.workflowList}>
              {workflow.map((step) => (
                <article key={step.number} className={styles.workflowStep}>
                  <span>{step.number}</span>
                  <div><h3>{step.title}</h3><p>{step.description}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="trust" className={styles.trustSection}>
          <div className={styles.trustCard}>
            <div>
              <p className={styles.sectionKicker}>Безопасность — часть продукта</p>
              <h2>Быстрый интерфейс. Строгая защита данных.</h2>
              <p>
                Публичный каталог формируется на сервере ограниченными запросами. Чувствительные
                действия проверяют личность, а права независимо контролируются PostgreSQL и RLS.
              </p>
            </div>
            <div className={styles.trustGrid}>
              <div><Compass size={22} /><strong>Точный поиск</strong><span>Название, стадия, ниша и ограниченная пагинация.</span></div>
              <div><LockKeyhole size={22} /><strong>Доступ по ролям</strong><span>Владение и полномочия проверяются дважды.</span></div>
              <div><Sparkles size={22} /><strong>Честные состояния</strong><span>Загрузка, пустые данные, ошибки и реальное сохранение.</span></div>
            </div>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div>
            <p className={styles.sectionKicker}>Когда соответствие действительно есть</p>
            <h2>Создайте профиль, с которого начинается предметный разговор.</h2>
          </div>
          <div className={styles.finalActions}>
            <LinkButton href="/auth/sign-up" size="lg" rightSection={<ArrowRight size={17} />}>Создать профиль</LinkButton>
            <LinkButton href="/startups" size="lg" variant="subtle">Каталог стартапов</LinkButton>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Brand />
          <p>Площадка для осознанных решений основателей и инвесторов.</p>
          <div className={styles.footerLinks}>
            <Link href="/startups">Каталог стартапов</Link>
            <Link href="/legal/privacy">Политика обработки данных</Link>
            <Link href="/legal/consent">Согласие на обработку данных</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
