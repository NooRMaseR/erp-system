'use client';

import { Button } from '@/components/ui/button';
import { deleteAuthCookies } from '../actions';
import Link from 'next/link';

export default function LogoutButton() {
    return (
        <Link href="/" onClick={deleteAuthCookies}>
            <Button variant='destructive' className='cursor-pointer w-full'>نعم</Button>
        </Link>
    )
}
