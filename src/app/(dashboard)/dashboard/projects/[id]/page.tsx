'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FolderKanban, ArrowLeft, Trash2, Users, ListTodo, Layers, Settings as SettingsIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { SectionList } from '@/components/projects/section-list'
import { MemberList } from '@/components/projects/member-list'
import { ProjectWithDetails, ProjectSection, ProjectMember } from '@/types'

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('sections')

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch project')
      return (await res.json()) as ProjectWithDetails
    },
  })

  const { data: sections } = useQuery({
    queryKey: ['project-sections', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${params.id}/sections`)
      if (!res.ok) throw new Error('Failed to fetch sections')
      const json = await res.json()
      return json.data as (ProjectSection & { _count: { tasks: number } })[]
    },
  })

  const { data: members } = useQuery({
    queryKey: ['project-members', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${params.id}/members`)
      if (!res.ok) throw new Error('Failed to fetch members')
      const json = await res.json()
      return json.data as (ProjectMember & { user: { id: string; name: string | null; email: string | null; avatarUrl: string | null } })[]
    },
  })

  const addSectionMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/projects/${params.id}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error('Failed to add section')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-sections', params.id] })
      toast({ title: 'Section added' })
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const res = await fetch(`/api/projects/${params.id}/sections/${sectionId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete section')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-sections', params.id] })
      toast({ title: 'Section deleted' })
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const updateSectionMutation = useMutation({
    mutationFn: async ({ sectionId, name, order }: { sectionId: string; name?: string; order?: number }) => {
      const body: Record<string, unknown> = {}
      if (name !== undefined) body.name = name
      if (order !== undefined) body.order = order
      const res = await fetch(`/api/projects/${params.id}/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to update section')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-sections', params.id] })
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/projects/${params.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: 'MEMBER' }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to add member')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', params.id] })
      queryClient.invalidateQueries({ queryKey: ['project', params.id] })
      toast({ title: 'Member added' })
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/projects/${params.id}/members/${memberId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to remove member')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', params.id] })
      queryClient.invalidateQueries({ queryKey: ['project', params.id] })
      toast({ title: 'Member removed' })
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: 'OWNER' | 'MEMBER' | 'MANAGER' }) => {
      const res = await fetch(`/api/projects/${params.id}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error('Failed to update role')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', params.id] })
    },
  })

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${params.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete project')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast({ title: 'Project deleted' })
      router.push('/dashboard/projects')
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const updateProjectMutation = useMutation({
    mutationFn: async (data: { name?: string; description?: string }) => {
      const res = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update project')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', params.id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast({ title: 'Project updated' })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Project not found</h2>
        <Link href="/dashboard/projects" className="mt-4">
          <Button variant="outline">Back to Projects</Button>
        </Link>
      </div>
    )
  }

  const isOwner = project.owner.id === project.members.find((m) => m.role === 'OWNER')?.user.id

  const handleReorder = (sectionId: string, direction: 'up' | 'down') => {
    const currentSections = sections ?? []
    const idx = currentSections.findIndex((s) => s.id === sectionId)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= currentSections.length) return
    const currentSection = currentSections[idx]
    const swapSection = currentSections[swapIdx]
    updateSectionMutation.mutate({ sectionId: currentSection.id, order: swapSection.order })
    updateSectionMutation.mutate({ sectionId: swapSection.id, order: currentSection.order })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </Button>
        </Link>
      </div>

      <Card>
        <div className="h-2 w-full rounded-t-lg" style={{ backgroundColor: project.color }} />
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl flex-shrink-0"
              style={{ backgroundColor: `${project.color}20`, color: project.color }}
            >
              {project.icon || <FolderKanban className="h-7 w-7" />}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              {project.description && (
                <p className="text-muted-foreground mt-1">{project.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant="secondary">
                  <ListTodo className="h-3 w-3 mr-1" />
                  {project._count.tasks} tasks
                </Badge>
                <Badge variant="secondary">
                  <Layers className="h-3 w-3 mr-1" />
                  {project._count.sections} sections
                </Badge>
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {project._count.members} members
                </Badge>
                {project.archived && <Badge variant="outline">Archived</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sections">
            <Layers className="h-4 w-4 mr-2" />
            Sections
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="settings">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="mt-4">
          <SectionList
            sections={sections ?? []}
            isLoading={false}
            onAdd={(name) => addSectionMutation.mutate(name)}
            onDelete={(id) => deleteSectionMutation.mutate(id)}
            onReorder={handleReorder}
          />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <MemberList
            members={members ?? []}
            isLoading={false}
            onAdd={async (userId) => addMemberMutation.mutateAsync(userId)}
            onRemove={(memberId) => removeMemberMutation.mutate(memberId)}
            onUpdateRole={(memberId, role) => updateMemberRoleMutation.mutate({ memberId, role })}
            canManage={isOwner}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Project Name</Label>
                <Input
                  id="edit-name"
                  defaultValue={project.name}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  defaultValue={project.description ?? ''}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={() => {
                  const data: Record<string, string> = {}
                  if (editName) data.name = editName
                  if (editDescription !== '') data.description = editDescription
                  updateProjectMutation.mutate(data)
                }}
                disabled={updateProjectMutation.isPending}
              >
                {updateProjectMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>

              <div className="border-t pt-4 mt-6">
                <h3 className="font-medium text-destructive mb-2">Danger Zone</h3>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this project? This cannot be undone.')) {
                      deleteProjectMutation.mutate()
                    }
                  }}
                  disabled={deleteProjectMutation.isPending || !isOwner}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </Button>
                {!isOwner && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Only the project owner can delete this project.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
