'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Users, Plus, Filter, Search, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ContactDialog } from '@/components/contacts/contact-dialog'
import { ContactListView } from '@/components/contacts/contact-list-view'
import { Contact } from '@/types'
import { ContactCreateInput, ContactUpdateInput } from '@/lib/validations/contact'
import { toast } from '@/hooks/use-toast'

interface ContactsResponse {
  data: Contact[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

async function fetchContacts(params?: URLSearchParams): Promise<ContactsResponse> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const queryString = params ? `?${params.toString()}` : ''
  const response = await fetch(`/api/contacts${queryString}`, {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch contacts')
  }

  return response.json()
}

async function createContact(data: ContactCreateInput): Promise<Contact> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch('/api/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create contact')
  }

  return response.json()
}

async function updateContact(id: string, data: ContactUpdateInput): Promise<Contact> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`/api/contacts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update contact')
  }

  return response.json()
}

async function deleteContact(id: string): Promise<void> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`/api/contacts/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete contact')
  }
}

export default function ContactsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('limit', limit.toString())
  params.append('sortBy', 'firstName')
  params.append('sortOrder', 'asc')
  if (searchQuery) params.append('search', searchQuery)
  if (showFavoritesOnly) params.append('favorite', 'true')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['contacts', params.toString()],
    queryFn: () => fetchContacts(params),
  })

  const contacts = data?.data || []
  const totalContacts = data?.meta.total || 0
  const totalPages = data?.meta.totalPages || 1

  const favoriteContacts = contacts.filter(c => c.favorite).length

  const createMutation = useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
      toast({ title: 'Contact created successfully' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create contact', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContactUpdateInput }) => updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
      toast({ title: 'Contact updated successfully' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update contact', description: error.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
      toast({ title: 'Contact deleted' })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete contact', description: error.message, variant: 'destructive' })
    },
  })

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) => updateContact(id, { favorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['today'] })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update favorite', description: error.message, variant: 'destructive' })
    },
  })

  const handleContactDelete = useCallback((contactId: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      deleteMutation.mutate(contactId)
    }
  }, [deleteMutation])

  const handleAddContact = useCallback(() => {
    setEditingContact(null)
    setDialogOpen(true)
  }, [])

  const handleEdit = useCallback((contact: Contact) => {
    setEditingContact(contact)
    setDialogOpen(true)
  }, [])

  const handleDialogSubmit = useCallback(async (contactData: ContactCreateInput | ContactUpdateInput) => {
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data: contactData as ContactUpdateInput })
    } else {
      await createMutation.mutateAsync(contactData as ContactCreateInput)
    }
    setEditingContact(null)
    setDialogOpen(false)
  }, [editingContact, createMutation, updateMutation])

  const handleDuplicate = useCallback((contact: Contact) => {
    createMutation.mutate({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      title: contact.title,
      birthday: contact.birthday ? contact.birthday.toISOString() : undefined,
      address: contact.address,
      notes: contact.notes,
      avatarUrl: contact.avatarUrl,
      tags: [...contact.tags],
      favorite: false,
    } as ContactCreateInput)
  }, [createMutation])

  const handleToggleFavorite = useCallback((contactId: string, favorite: boolean) => {
    toggleFavoriteMutation.mutate({ id: contactId, favorite })
  }, [toggleFavoriteMutation])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse mt-1" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-6 w-3/4 bg-muted rounded mb-3" />
                <div className="h-4 w-full bg-muted rounded mb-2" />
                <div className="h-4 w-2/3 bg-muted rounded mb-2" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Failed to load contacts. Please try again.</p>
        <Button onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Contacts
          </h1>
          <p className="text-muted-foreground mt-1">
            {totalContacts} contact{totalContacts !== 1 ? 's' : ''} total
            {favoriteContacts > 0 && <span className="ml-2 text-sm text-amber-500">({favoriteContacts} favorite{favoriteContacts !== 1 ? 's' : ''})</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showFavoritesOnly ? 'default' : 'outline'}
                size="icon"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="h-10 w-10"
              >
                <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Show favorites only</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSearchQuery('')}>Clear Search</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setShowFavoritesOnly(false); setSearchQuery(''); }}>
                Reset All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleAddContact}>
            <Plus className="h-4 w-4 mr-2" />
            New Contact
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4" />
              Favorites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{favoriteContacts}</div>
            <p className="text-xs text-muted-foreground">Quick access contacts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              With Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contacts.filter(c => c.tags && c.tags.length > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Tagged contacts</p>
          </CardContent>
        </Card>
      </div>

      <ContactListView
        contacts={contacts}
        onEdit={handleEdit}
        onDelete={handleContactDelete}
        onDuplicate={handleDuplicate}
        onToggleFavorite={handleToggleFavorite}
        isLoading={isLoading}
        view={view}
        onViewChange={setView}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleDialogSubmit}
        initialData={editingContact
          ? {
              firstName: editingContact.firstName,
              lastName: editingContact.lastName || undefined,
              email: editingContact.email || undefined,
              phone: editingContact.phone || undefined,
              company: editingContact.company || undefined,
              title: editingContact.title || undefined,
              birthday: editingContact.birthday ? editingContact.birthday.toISOString() : undefined,
              address: editingContact.address || undefined,
              notes: editingContact.notes || undefined,
              avatarUrl: editingContact.avatarUrl || undefined,
              tags: editingContact.tags,
              favorite: editingContact.favorite,
            }
          : undefined}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}