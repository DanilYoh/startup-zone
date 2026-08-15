import { LinkButton } from "@/components/link-button";
import { ArrowLeft } from "lucide-react";
import styles from "../startups-supabase.module.css";

export default function StartupNotFound() {
  return (
    <div className={styles.narrowContainer}>
      <section className={styles.notFoundPanel} aria-labelledby="not-found-heading">
        <div className={styles.notFoundContent}>
          <p className={styles.notFoundCode}>404 / Карточка недоступна</p>
          <h1 id="not-found-heading">Стартап не найден</h1>
          <p>
            Проект не существует или больше не опубликован в каталоге.
          </p>
          <LinkButton
            href="/startups"
            leftSection={<ArrowLeft size={16} aria-hidden="true" />}
          >
            Смотреть активные стартапы
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
