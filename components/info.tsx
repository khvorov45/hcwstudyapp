import styles from './info.module.css'

export default function InfoMessage (props: {content: string}) {
  return <p className={styles.info}>{props.content}</p>
}
