"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Info, AlertCircle, CheckCheck, Bell } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { NotificationWithAnimal } from "@/lib/data/notifications"

interface NotificationListProps {
  onMarkAllRead?: () => void
}

export function NotificationList({ onMarkAllRead }: NotificationListProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationWithAnimal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('notifications')
        .select(
          `
          *,
          animals(ear_tag, name)
        `
        )
        .eq('tenant_id', '11111111-1111-1111-1111-111111111111')
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      const mapped = (data || []).map((notif: any) => ({
        ...notif,
        animal_ear_tag: notif.animals?.ear_tag,
        animal_name: notif.animals?.name,
      }))

      setNotifications(mapped)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const supabase = createClient()
      await supabase.rpc('mark_all_notifications_read', {
        p_tenant_id: '11111111-1111-1111-1111-111111111111',
      })

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )

      onMarkAllRead?.()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleNotificationClick = async (notification: NotificationWithAnimal) => {
    // Mark as read if unread
    if (!notification.is_read) {
      try {
        const supabase = createClient()
        await supabase.rpc('mark_notification_read', {
          p_notification_id: notification.id,
        })

        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        )
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }

    // Navigate to action URL
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 hover:bg-red-100'
      case 'warning':
        return 'bg-amber-50 border-amber-200 hover:bg-amber-100'
      default:
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            className="h-8 text-xs"
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="text-sm">Loading notifications...</div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Bell className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">No notifications</p>
        </div>
      ) : (
        <div className="flex-1 max-h-[400px] overflow-y-auto">
          <div className="p-2">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left p-3 rounded-lg border mb-2 transition-colors ${
                  notification.is_read ? 'bg-white hover:bg-gray-50' : getSeverityColor(notification.severity)
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getSeverityIcon(notification.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm leading-tight">{notification.title}</p>
                      {!notification.is_read && (
                        <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-600 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => router.push('/notifications')}
          >
            View all notifications
          </Button>
        </div>
      )}
    </div>
  )
}
