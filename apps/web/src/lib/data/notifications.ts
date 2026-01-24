import { createClient } from '@/lib/supabase/server'

export interface Notification {
  id: string
  tenant_id: string
  alert_type: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  animal_id: string | null
  related_entity_type: string | null
  related_entity_id: string | null
  action_url: string | null
  is_read: boolean
  read_at: string | null
  is_dismissed: boolean
  dismissed_at: string | null
  created_at: string
  expires_at: string | null
}

export interface NotificationWithAnimal extends Notification {
  animal_ear_tag?: string
  animal_name?: string
}

export interface NotificationCounts {
  total: number
  unread: number
  critical: number
  warning: number
  info: number
}

/**
 * Get all notifications for the current tenant
 */
export async function getNotifications(limit: number = 50): Promise<NotificationWithAnimal[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select(
      `
      *,
      animals(ear_tag, name)
    `
    )
    .eq('tenant_id', '11111111-1111-1111-1111-111111111111')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return (data || []).map((notif: any) => ({
    ...notif,
    animal_ear_tag: notif.animals?.ear_tag,
    animal_name: notif.animals?.name,
  }))
}

/**
 * Get unread notifications
 */
export async function getUnreadNotifications(): Promise<NotificationWithAnimal[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select(
      `
      *,
      animals(ear_tag, name)
    `
    )
    .eq('tenant_id', '11111111-1111-1111-1111-111111111111')
    .eq('is_read', false)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching unread notifications:', error)
    return []
  }

  return (data || []).map((notif: any) => ({
    ...notif,
    animal_ear_tag: notif.animals?.ear_tag,
    animal_name: notif.animals?.name,
  }))
}

/**
 * Get notification counts
 */
export async function getNotificationCounts(): Promise<NotificationCounts> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select('severity, is_read')
    .eq('tenant_id', '11111111-1111-1111-1111-111111111111')
    .eq('is_dismissed', false)

  if (error) {
    console.error('Error fetching notification counts:', error)
    return { total: 0, unread: 0, critical: 0, warning: 0, info: 0 }
  }

  const counts = {
    total: data?.length || 0,
    unread: data?.filter((n) => !n.is_read).length || 0,
    critical: data?.filter((n) => n.severity === 'critical').length || 0,
    warning: data?.filter((n) => n.severity === 'warning').length || 0,
    info: data?.filter((n) => n.severity === 'info').length || 0,
  }

  return counts
}

/**
 * Get unread notification count (optimized)
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_unread_notification_count', {
    p_tenant_id: '11111111-1111-1111-1111-111111111111',
  })

  if (error) {
    console.error('Error fetching unread count:', error)
    return 0
  }

  return data || 0
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('mark_notification_read', {
    p_notification_id: notificationId,
  })

  if (error) {
    console.error('Error marking notification as read:', error)
    return false
  }

  return data || false
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('mark_all_notifications_read', {
    p_tenant_id: '11111111-1111-1111-1111-111111111111',
  })

  if (error) {
    console.error('Error marking all notifications as read:', error)
    return 0
  }

  return data || 0
}

/**
 * Dismiss notification
 */
export async function dismissNotification(notificationId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) {
    console.error('Error dismissing notification:', error)
    return false
  }

  return true
}

/**
 * Generate daily alerts for the tenant
 */
export async function generateDailyAlerts(): Promise<{
  calving_due: number
  preg_check_overdue: number
  high_scc: number
  total: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('generate_daily_alerts', {
    p_tenant_id: '11111111-1111-1111-1111-111111111111',
  })

  if (error) {
    console.error('Error generating daily alerts:', error)
    return { calving_due: 0, preg_check_overdue: 0, high_scc: 0, total: 0 }
  }

  return data || { calving_due: 0, preg_check_overdue: 0, high_scc: 0, total: 0 }
}

/**
 * Get notifications by type
 */
export async function getNotificationsByType(
  alertType: string,
  limit: number = 20
): Promise<NotificationWithAnimal[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select(
      `
      *,
      animals(ear_tag, name)
    `
    )
    .eq('tenant_id', '11111111-1111-1111-1111-111111111111')
    .eq('alert_type', alertType)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching notifications by type:', error)
    return []
  }

  return (data || []).map((notif: any) => ({
    ...notif,
    animal_ear_tag: notif.animals?.ear_tag,
    animal_name: notif.animals?.name,
  }))
}
