'use client'

import { Mail, Phone, Building2, Briefcase, Calendar, Star, MapPin, Edit, Trash2, Copy, MoreVertical } from 'lucide-react'
import { Contact } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface ContactCardProps {
  contact: Contact
  onEdit: (contact: Contact) => void
  onDelete: (contactId: string) => void
  onDuplicate: (contact: Contact) => void
  onToggleFavorite: (contactId: string, favorite: boolean) => void
}

export function ContactCard({
  contact,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
}: ContactCardProps) {
  const initials = `${contact.firstName.charAt(0)}${contact.lastName?.charAt(0) || ''}`.toUpperCase()

  return (
    <Card className="group relative overflow-hidden transition-colors hover:bg-accent/30">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm" data-testid="contact-menu-trigger">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onSelect={() => onEdit(contact)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onDuplicate(contact)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onToggleFavorite(contact.id, !contact.favorite)}
                  className="flex items-center gap-2"
                >
                  <Star className={`h-4 w-4 ${contact.favorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  {contact.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => onDelete(contact.id)}
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent>More options</TooltipContent>
        </Tooltip>
      </div>

      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            {contact.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={contact.avatarUrl}
                alt={`${contact.firstName} ${contact.lastName || ''}`}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-medium text-primary">
                  {initials}
                </span>
              </div>
            )}
            {contact.favorite && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="absolute -top-1 -right-1">
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Favorite</TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <h3 className="font-semibold text-lg truncate">
                {contact.firstName} {contact.lastName || ''}
              </h3>
              {contact.company && (
                <Badge variant="secondary" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  {contact.company}
                </Badge>
              )}
            </div>

            {contact.title && (
              <p className="text-sm text-muted-foreground mt-1">
                <Briefcase className="h-3.5 w-3.5 inline mr-1" />
                {contact.title}
              </p>
            )}

            <div className="mt-3 space-y-1.5 text-sm">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{contact.email}</span>
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>{contact.phone}</span>
                </a>
              )}
              {contact.address && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{contact.address}</span>
                </p>
              )}
              {contact.birthday && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Birthday: {new Date(contact.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </span>
                </p>
              )}
            </div>

            {contact.tags && contact.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {contact.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
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

            {contact.notes && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                {contact.notes}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}