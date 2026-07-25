'use client'

import { Tag, Star, Mail, Phone, MapPin, Calendar, Building2, Briefcase, MoreVertical, Edit, Trash2, Copy, LayoutGrid, List, Search, Filter } from 'lucide-react'
import { useState } from 'react'
import { Contact } from '@/types'
import { ContactCard } from '@/components/contacts/contact-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface ContactListViewProps {
  contacts: Contact[]
  onEdit: (contact: Contact) => void
  onDelete: (contactId: string) => void
  onDuplicate: (contact: Contact) => void
  onToggleFavorite: (contactId: string, favorite: boolean) => void
  isLoading?: boolean
  view: 'grid' | 'list'
  onViewChange: (view: 'grid' | 'list') => void
}

export function ContactListView({
  contacts,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  isLoading,
  view,
  onViewChange,
}: ContactListViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const filteredContacts = contacts.filter((contact) => {
    if (showFavoritesOnly && !contact.favorite) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const nameMatch = `${contact.firstName} ${contact.lastName || ''}`.toLowerCase().includes(query)
      const emailMatch = contact.email?.toLowerCase().includes(query)
      const companyMatch = contact.company?.toLowerCase().includes(query)
      const phoneMatch = contact.phone?.includes(query)
      const tagMatch = contact.tags?.some((tag) => tag.toLowerCase().includes(query))
      if (!nameMatch && !emailMatch && !companyMatch && !phoneMatch && !tagMatch) return false
    }
    return true
  })

  const favoriteContacts = filteredContacts.filter((c) => c.favorite)
  const otherContacts = filteredContacts.filter((c) => !c.favorite)

  const sortedContacts = [...favoriteContacts, ...otherContacts].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1
    if (!a.favorite && b.favorite) return 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(6)].map((_, i) => (
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
    )
  }

  if (sortedContacts.length === 0) {
    return (
      <div className="text-center py-12 col-span-full">
        <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">No contacts found</h3>
        <p className="text-muted-foreground mt-2">
          {searchQuery || showFavoritesOnly
            ? 'Try adjusting your filters or search query.'
            : 'Create your first contact to get started.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showFavoritesOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="gap-1"
              >
                <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                Favorites
              </Button>
            </TooltipTrigger>
            <TooltipContent>Show favorites only</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}>
                {showFavoritesOnly ? '✓ ' : ''}Favorites only
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSearchQuery('')}>
                Clear search
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setShowFavoritesOnly(false); setSearchQuery(''); }}>
                Reset all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => onViewChange?.('grid')}
                className="h-10 w-10"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Grid View</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={view === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => onViewChange?.('list')}
                className="h-10 w-10"
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>List View</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedContacts.map((contact) => (
            <Card
              key={contact.id}
              className={cn(contact.favorite && 'ring-2 ring-amber-400/50')}
            >
              <CardContent className="py-3">
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
{contact.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={contact.avatarUrl}
                        alt={`${contact.firstName} ${contact.lastName || ''}`}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-medium text-primary">
                          {contact.firstName.charAt(0)}{contact.lastName?.charAt(0) || ''}
                        </span>
                      </div>
                    )}
                    {contact.favorite && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="absolute -top-1 -right-1">
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Favorite</TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-baseline gap-2 flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">
                          {contact.firstName} {contact.lastName || ''}
                        </h3>
                        {contact.company && (
                          <Badge variant="secondary" className="text-xs">
                            <Building2 className="h-3 w-3 mr-1" />
                            {contact.company}
                          </Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="contact-menu-trigger">
                            <span className="sr-only">More options</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => onEdit(contact)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate(contact)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onToggleFavorite(contact.id, !contact.favorite)}
                            className={contact.favorite ? 'text-yellow-600' : ''}
                          >
                            <Star className={`h-4 w-4 mr-2 ${contact.favorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                            {contact.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onDelete(contact.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {contact.title && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        <Briefcase className="h-3.5 w-3.5 inline mr-1" />
                        {contact.title}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[200px]">{contact.email}</span>
                        </a>
                      )}
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{contact.phone}</span>
                        </a>
                      )}
                      {contact.address && (
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="h-3.5 w-3.5" />
                          {contact.address}
                        </span>
                      )}
                      {contact.birthday && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(contact.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>

                    {contact.tags && contact.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {contact.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="h-2.5 w-2.5 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {contact.tags.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{contact.tags.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground mt-2">
                      Updated {new Date(contact.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}