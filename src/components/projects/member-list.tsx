'use client'

import { useState } from 'react'
import { Trash2, UserPlus, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProjectMember, PROJECT_ROLE_OPTIONS } from '@/types'

interface MemberListProps {
  members: (ProjectMember & { user: { id: string; name: string | null; email: string | null; avatarUrl: string | null } })[]
  isLoading: boolean
  onAdd: (userId: string) => Promise<void>
  onRemove: (memberId: string) => void
  onUpdateRole: (memberId: string, role: 'OWNER' | 'MEMBER' | 'MANAGER') => void
  canManage: boolean
}

export function MemberList({
  members,
  isLoading,
  onAdd,
  onRemove,
  onUpdateRole,
  canManage,
}: MemberListProps) {
  const [userIdInput, setUserIdInput] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (userIdInput.trim()) {
      setAdding(true)
      try {
        await onAdd(userIdInput.trim())
        setUserIdInput('')
      } finally {
        setAdding(false)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members ({members.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {members.map((member) => {
          const initials = (member.user.name || member.user.email || '?')
            .charAt(0)
            .toUpperCase()

          return (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {member.user.name || 'Unknown'}
                  {member.role === 'OWNER' && (
                    <Crown className="inline h-4 w-4 ml-1 text-amber-500" />
                  )}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {member.user.email}
                </p>
              </div>

              {canManage && member.role !== 'OWNER' && (
                <Select
                  value={member.role}
                  onValueChange={(role) => onUpdateRole(member.id, role as 'OWNER' | 'MEMBER' | 'MANAGER')}
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {member.role !== 'OWNER' && (
                <Badge variant="outline" className="text-xs">
                  {member.role === 'MANAGER' ? 'Manager' : 'Member'}
                </Badge>
              )}

              {canManage && member.role !== 'OWNER' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onRemove(member.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )
        })}

        {members.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No members in this project yet.
          </p>
        )}

        {canManage && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Input
              placeholder="User ID to add"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !adding) handleAdd()
              }}
              className="flex-1"
            />
            <Button onClick={handleAdd} disabled={adding} size="sm">
              <UserPlus className="h-4 w-4 mr-1" />
              {adding ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
