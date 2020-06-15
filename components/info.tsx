import styles from './info.module.css'

export default function InfoMessage (props: {content: string}) {
  return <div className={styles.info}>{props.content}</div>
}
