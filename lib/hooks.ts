import { User, accessAPI } from '../lib/util'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export function useUser (): User {
  const router = useRouter()
  const [user2, setUser]: [User, (u: User) => void] = useState({
    // undefined means unknown
    authorised: undefined,
    email: undefined,
    token: undefined,
    accessGroup: undefined
  })
  async function updateUser () {
    const splitpath = router.asPath.split('?')
    if (splitpath.length < 2) {
      setUser({
        // null means no credentials provided
        authorised: null,
        email: null,
        token: null,
        accessGroup: null
      })
      return
    }
    const query = new URLSearchParams(splitpath[1])
    setUser({
      authorised: await accessAPI(
        'authoriseuser', 'GET',
        { email: query.get('email'), token: query.get('token') }
      ),
      email: query.get('email'),
      token: query.get('token'),
      accessGroup: await accessAPI(
        'getuseraccessgroup', 'GET',
        { email: query.get('email'), token: query.get('token') }
      )
    })
  }
  useEffect(() => { updateUser() }, [router])
  useEffect(() => {
    if (user2.authorised === undefined) return
    if (user2.authorised === null) {
      router.push('/getlink')
    } else if (!user2.authorised) {
      router.push('/unauthorised')
    }
  }, [user2])
  return user2
}
