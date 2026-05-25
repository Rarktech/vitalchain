'use client';

import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import ShareRecipientView from '@/components/share/ShareRecipientView';

export default function SharePage({ params }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const accessKey = searchParams.get('key') || '';

  return <ShareRecipientView shareKey={id} accessKey={accessKey} />;
}
