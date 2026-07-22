'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, User, Mail, Phone, Building2, Briefcase, Calendar, MapPin, Tag, Image, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ContactCreateInput, ContactUpdateInput } from '@/lib/validations/contact'
import { cn } from '@/lib/utils'

interface ContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ContactCreateInput | ContactUpdateInput) => Promise<void>
  initialData?: ContactCreateInput
  isLoading?: boolean
}

export function ContactDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: ContactDialogProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [title, setTitle] = useState('')
  const [birthday, setBirthday] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [favorite, setFavorite] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.firstName || '')
      setLastName(initialData.lastName || '')
      setEmail(initialData.email || '')
      setPhone(initialData.phone || '')
      setCompany(initialData.company || '')
      setTitle(initialData.title || '')
      setBirthday(initialData.birthday ? initialData.birthday.split('T')[0] : '')
      setAddress(initialData.address || '')
      setNotes(initialData.notes || '')
      setAvatarUrl(initialData.avatarUrl || '')
      setTags(initialData.tags || [])
      setFavorite(initialData.favorite || false)
    } else {
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setCompany('')
      setTitle('')
      setBirthday('')
      setAddress('')
      setNotes('')
      setAvatarUrl('')
      setTags([])
      setFavorite(false)
    }
    setTagInput('')
  }, [initialData, open])

  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }, [tagInput, tags])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }, [tags])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }, [handleAddTag])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim()) return

    const data: ContactCreateInput | ContactUpdateInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      title: title.trim() || undefined,
      birthday: birthday || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
      tags,
      favorite,
    }

    await onSubmit(data)
  }, [firstName, lastName, email, phone, company, title, birthday, address, notes, avatarUrl, tags, favorite, onSubmit])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-4">
            <DialogTitle>{initialData ? 'Edit Contact' : 'New Contact'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Inc."
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Software Engineer"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="birthday"
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="avatarUrl"
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, City, State 12345"
                  className="pl-10 min-h-[80px] resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this contact..."
                className="min-h-[100px] resize-none"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add tag..."
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-muted"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 pt-2 border-t">
              <Label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={favorite}
                  onChange={(e) => setFavorite(e.target.checked)}
                  className="rounded border-input"
                />
                <Star className={cn('h-4 w-4', favorite && 'fill-yellow-500 text-yellow-500')} />
                <span className="text-sm">Add to Favorites</span>
              </Label>
            </div>
          </div>

          <DialogFooter className="border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !firstName.trim()}>
              {isLoading ? 'Saving...' : initialData ? 'Save Changes' : 'Create Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}