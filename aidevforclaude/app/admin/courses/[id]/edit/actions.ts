'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── Course ──────────────────────────────────────────────

export async function updateCourse(formData: FormData) {
  const id = formData.get('courseId') as string
  const supabase = await createClient()
  await supabase
    .from('courses')
    .update({
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || null,
      thumbnail_url: (formData.get('thumbnail_url') as string) || null,
      is_published: formData.get('is_published') === 'true',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  revalidatePath(`/admin/courses/${id}/edit`)
}

export async function deleteCourse(formData: FormData) {
  const id = formData.get('courseId') as string
  const supabase = await createClient()

  // videos → sections → courses の順で削除
  const { data: sections } = await supabase
    .from('sections')
    .select('id')
    .eq('course_id', id)

  if (sections && sections.length > 0) {
    const sectionIds = sections.map((s) => s.id)
    await supabase.from('videos').delete().in('section_id', sectionIds)
    await supabase.from('sections').delete().eq('course_id', id)
  }

  await supabase.from('courses').delete().eq('id', id)
  redirect('/admin')
}

// ── Section ──────────────────────────────────────────────

export async function addSection(formData: FormData) {
  const courseId = formData.get('courseId') as string
  const supabase = await createClient()

  const { data: last } = await supabase
    .from('sections')
    .select('order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  await supabase.from('sections').insert({
    course_id: courseId,
    title: formData.get('title') as string,
    order_index: (last?.order_index ?? -1) + 1,
  })
  revalidatePath(`/admin/courses/${courseId}/edit`)
}

export async function updateSection(formData: FormData) {
  const courseId = formData.get('courseId') as string
  const sectionId = formData.get('sectionId') as string
  const supabase = await createClient()

  await supabase
    .from('sections')
    .update({ title: formData.get('title') as string })
    .eq('id', sectionId)
  redirect(`/admin/courses/${courseId}/edit`)
}

export async function deleteSection(formData: FormData) {
  const courseId = formData.get('courseId') as string
  const sectionId = formData.get('sectionId') as string
  const supabase = await createClient()

  await supabase.from('videos').delete().eq('section_id', sectionId)
  await supabase.from('sections').delete().eq('id', sectionId)
  revalidatePath(`/admin/courses/${courseId}/edit`)
}

export async function moveSection(formData: FormData) {
  const courseId = formData.get('courseId') as string
  const sectionId = formData.get('sectionId') as string
  const direction = formData.get('direction') as 'up' | 'down'
  const currentIndex = parseInt(formData.get('currentIndex') as string)
  const supabase = await createClient()

  const { data: target } = await supabase
    .from('sections')
    .select('id, order_index')
    .eq('course_id', courseId)
    .filter('order_index', direction === 'up' ? 'lt' : 'gt', currentIndex)
    .order('order_index', { ascending: direction !== 'up' })
    .limit(1)
    .maybeSingle()

  if (target) {
    await supabase.from('sections').update({ order_index: target.order_index }).eq('id', sectionId)
    await supabase.from('sections').update({ order_index: currentIndex }).eq('id', target.id)
  }
  revalidatePath(`/admin/courses/${courseId}/edit`)
}

// ── Video ──────────────────────────────────────────────

export async function addVideo(formData: FormData) {
  const courseId = formData.get('courseId') as string
  const sectionId = formData.get('sectionId') as string
  const supabase = await createClient()

  const { data: last } = await supabase
    .from('videos')
    .select('order_index')
    .eq('section_id', sectionId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  await supabase.from('videos').insert({
    section_id: sectionId,
    title: formData.get('title') as string,
    youtube_video_id: formData.get('youtube_video_id') as string,
    description: (formData.get('description') as string) || null,
    is_free: formData.get('is_free') === 'true',
    is_published: formData.get('is_published') === 'true',
    order_index: (last?.order_index ?? -1) + 1,
  })
  revalidatePath(`/admin/courses/${courseId}/edit`)
}

export async function updateVideo(formData: FormData) {
  const courseId = formData.get('courseId') as string
  const videoId = formData.get('videoId') as string
  const supabase = await createClient()

  await supabase
    .from('videos')
    .update({
      title: formData.get('title') as string,
      youtube_video_id: formData.get('youtube_video_id') as string,
      description: (formData.get('description') as string) || null,
      is_free: formData.get('is_free') === 'true',
      is_published: formData.get('is_published') === 'true',
    })
    .eq('id', videoId)
  redirect(`/admin/courses/${courseId}/edit`)
}

export async function deleteVideo(formData: FormData) {
  const courseId = formData.get('courseId') as string
  const videoId = formData.get('videoId') as string
  const supabase = await createClient()

  await supabase.from('user_progress').delete().eq('video_id', videoId)
  await supabase.from('videos').delete().eq('id', videoId)
  revalidatePath(`/admin/courses/${courseId}/edit`)
}

export async function moveVideo(formData: FormData) {
  const courseId = formData.get('courseId') as string
  const videoId = formData.get('videoId') as string
  const sectionId = formData.get('sectionId') as string
  const direction = formData.get('direction') as 'up' | 'down'
  const currentIndex = parseInt(formData.get('currentIndex') as string)
  const supabase = await createClient()

  const { data: target } = await supabase
    .from('videos')
    .select('id, order_index')
    .eq('section_id', sectionId)
    .filter('order_index', direction === 'up' ? 'lt' : 'gt', currentIndex)
    .order('order_index', { ascending: direction !== 'up' })
    .limit(1)
    .maybeSingle()

  if (target) {
    await supabase.from('videos').update({ order_index: target.order_index }).eq('id', videoId)
    await supabase.from('videos').update({ order_index: currentIndex }).eq('id', target.id)
  }
  revalidatePath(`/admin/courses/${courseId}/edit`)
}
