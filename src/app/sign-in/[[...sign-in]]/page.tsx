import { SignIn } from '@clerk/nextjs'

export default function Sign_in() {
  return <center><SignIn fallbackRedirectUrl={'/'} /></center>
}