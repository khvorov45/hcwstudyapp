import Head from 'next/head'
import TablePage from '../../components/tablePage'
import Layout from '../../components/layout'
import { SubnavbarTables } from '../../components/navbar'
import { useRouter } from 'next/router'
import { useUser } from '../../lib/hooks'

/* eslint-disable react/prop-types, react/jsx-key */

export default function ParticipantTable () {
  const user = useUser()
  const router = useRouter()
  const { table } = router.query
  const thisTableConf = TABLECONF.filter(t => t.id === table)[0]

  return <Layout
    user={user}
    active="tables"
  >
    <Head>
      <title>{thisTableConf.label} - HCW flu study</title>
      <meta
        name="Description"
        content={`${thisTableConf.label} - HCW flu study`}
      />
    </Head>
    <SubnavbarTables
      user={user}
      active={table}
      tables={TABLECONF}
    />
    {
      TABLECONF.map(t => t.id).includes(table) && <TablePage
        user = {user}
        tableName = {table}
        variables = {getVariables(table)}
        hidden = {thisTableConf.hidden}
      />
    }
  </Layout>
}

// I need this here, otherwise the query will not be inserted into the
// router object quickly enough, and it will look like the link does not
// provide any credentials which will cause `useUser` to redirect to `getlink`
export async function getServerSideProps (_) { return { props: {} } }

const VARIABLES = {
  common: [
    { my: 'redcapRecordId', redcap: 'record_id', label: 'Record ID' },
    { my: 'pid', redcap: 'pid', label: 'PID' },
    { my: 'email', redcap: 'email', label: 'Email' },
    { my: 'mobile', redcap: 'mobile_number', label: 'Mobile' },
    { my: 'addBleed', redcap: '', label: 'Nested' },
    {
      my: 'accessGroup',
      redcap: 'redcap_data_access_group',
      label: 'Access Group'
    },
    { my: 'site', redcap: 'site_name', label: 'Site' },
    { my: 'withdrawn', redcap: 'withdrawn', label: 'Withdrawn' }
  ],
  baseline: [
    {
      my: 'dateScreening',
      redcap: 'date_screening',
      label: 'Date of Screening'
    },
    { my: 'gender', redcap: 'a1_gender', label: 'Gender' },
    { my: 'dob', redcap: 'a2_dob', label: 'Date of Birth' },
    { my: 'age', redcap: '', label: 'Age', filter: 'between' },
    { my: 'numSeasVac', redcap: 'num_seas_vac', label: 'Previous vaccinations' }
  ],
  'schedule-wide': [0, 7, 14, 280]
    .map(n => ({ my: `day${n}`, redcap: '', label: `Day ${n}` })),
  weeklysurvey: [
    { my: 'index', redcap: '', label: 'Week', filter: 'between' },
    {
      my: 'date',
      redcap: 'date_symptom_survey',
      label: 'Date',
      filter: 'betweenDates'
    },
    { my: 'ari', redcap: 'ari_definition', label: 'ARI' },
    { my: 'swabCollection', redcap: 'swab_collection', label: 'Swabbed' }
  ]
}

function getVariables (tableName) {
  if (VARIABLES[tableName]) return VARIABLES.common.concat(VARIABLES[tableName])
  return VARIABLES.common
}

const TABLECONF = [
  {
    id: 'contact',
    label: 'Contact',
    hidden: ['accessGroup', 'site', 'dateScreening', 'withdrawn']
  },
  {
    id: 'baseline',
    label: 'Baseline',
    hidden: [
      'dateScreening', 'email', 'mobile', 'redcapRecordId', 'accessGroup',
      'site', 'addBleed', 'withdrawn'
    ]
  },
  {
    id: 'schedule-wide',
    label: 'Schedule',
    hidden: [
      'email', 'mobile', 'redcapRecordId', 'accessGroup', 'site', 'addBleed',
      'withdrawn'
    ]
  },
  {
    id: 'weeklysurvey',
    label: 'Weekly survey',
    hidden: [
      'email', 'mobile', 'redcapRecordId', 'accessGroup', 'site', 'addBleed',
      'withdrawn'
    ]
  }
]
