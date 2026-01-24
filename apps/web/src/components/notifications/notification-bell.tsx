"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationList } from "./notification-list"
import { createClient } from "@/lib/supabase/client"

interface NotificationBellProps {
  initialCount?: number
}

export function NotificationBell({ initialCount = 0 }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(initialCount)
  const [isOpen, setIsOpen] = useState(false)

  // Fetch unread count on mount and when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      fetchUnreadCount()
    }
  }, [isOpen])

  const fetchUnreadCount = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_unread_notification_count', {
        p_tenant_id: '11111111-1111-1111-1111-111111111111',
      })

      if (!error && data !== null) {
        setUnreadCount(data)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const handleMarkAllRead = () => {
    setUnreadCount(0)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <NotificationList onMarkAllRead={handleMarkAllRead} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
