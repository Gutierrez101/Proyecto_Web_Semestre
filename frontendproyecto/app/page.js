import { redirect } from 'next/navigation';

export default function Home() {
  // Cuando alguien entra a `/`, lo mandamos a `/login`
  redirect('/login');
  return null;
}