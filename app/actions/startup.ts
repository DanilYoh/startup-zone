'use server'

import { createClient } from '@/lib/supabase/server'
import { startupSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createStartup(formData: FormData) {
  const supabase = await createClient()

  // Проверяем авторизацию
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Валидация
  const validated = startupSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    one_pager: formData.get('one_pager'),
    description: formData.get('description'),
    stage: formData.get('stage'),
    niche: JSON.parse(formData.get('niche') as string || '[]'),
    funding_ask: formData.get('funding_ask') ? Number(formData.get('funding_ask')) : undefined,
    equity_offered: formData.get('equity_offered') ? Number(formData.get('equity_offered')) : undefined,
    deck_url: formData.get('deck_url'),
    website_url: formData.get('website_url'),
  })

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors }
  }

  const { data, error } = await supabase
    .from('startups')
    .insert({
      founder_id: user.id,
      ...validated.data,
    })
    .select()
    .single()

  if (error) {
    return { error: { message: error.message } }
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}