import styles from './page.module.css';

export default function Loading() {
	return (
		<main
			className={styles.page}
			aria-busy="true">
			<header>
				<h1>Articles</h1>
			</header>

			<div
				className={styles.filterSkeleton}
				aria-hidden="true">
				{Array.from({ length: 4 }, (_, index) => (
					<div
						key={index}
						className={styles.skeleton}
					/>
				))}
			</div>

			<p
				className={styles.loadingMessage}
				role="status">
				Loading articles…
			</p>
			<ul
				className={styles.articles}
				aria-hidden="true">
				{Array.from({ length: 3 }, (_, index) => (
					<li
						key={index}
						className={`${styles.article} ${styles.skeleton}`}
					/>
				))}
			</ul>
		</main>
	);
}
