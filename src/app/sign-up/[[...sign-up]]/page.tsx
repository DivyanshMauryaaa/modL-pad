import { SignUp } from '@clerk/nextjs'

export default function Sign_up() {
  return <center><SignUp fallbackRedirectUrl={'/'} /></center>
}