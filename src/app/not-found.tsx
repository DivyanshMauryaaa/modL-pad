import { Button } from '@/components/ui/button';
import Link from 'next/link'

const NotFound = () => {
  return (
    <div className='justify-center flex flex-col items-center m-auto'>
      <p className='text-[190px] font-bold'>404</p>
      <p className='text-lg'>Sorry, there are no easter eggs in our app</p>
      <br />
      <Link href={'/'}>
        <Button>Take me Home</Button>
      </Link>
    </div>
  )
}

export default NotFound;