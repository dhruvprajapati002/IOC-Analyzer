'use client';

import React, { useState } from 'react';
import { X, Mail, MessageSquare, Send, Check, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { APP_COLORS, INPUT_STYLES } from '@/lib/colors';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/apiFetch';

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactModal({ open, onOpenChange }: ContactModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.username || '',
    email: '', // ✅ Empty by default - user must enter
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          username: user?.username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setFormData({
          name: user?.username || '',
          email: '',
          subject: '',
          message: '',
        });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.');
      console.error('Contact form error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl p-0 rounded-2xl border-2 overflow-hidden"
        style={{
          backgroundColor: `${APP_COLORS.background}f8`,
          borderColor: `${APP_COLORS.borderSoft}80`,
          boxShadow: `0 25px 80px rgba(0,0,0,0.85), 0 0 30px ${APP_COLORS.primary}20`,
        }}
      >
        {/* Header with Gradient */}
        <div
          className="relative px-6 py-5 border-b"
          style={{
            background: `linear-gradient(135deg, ${APP_COLORS.surfaceSoft}dd, ${APP_COLORS.surfaceAlt}cc)`,
            borderColor: `${APP_COLORS.borderSoft}80`,
          }}
        >
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: `radial-gradient(circle at top right, ${APP_COLORS.primary}15, transparent 70%)`,
            }}
          />
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl border-2 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${APP_COLORS.primary}30, ${APP_COLORS.accentCyan}20)`,
                  borderColor: `${APP_COLORS.primary}40`,
                }}
              >
                <MessageSquare className="h-6 w-6" style={{ color: APP_COLORS.primary }} />
              </div>
              <div>
                <DialogTitle
                  className="text-2xl font-black tracking-tight"
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  Contact Support
                </DialogTitle>
                <DialogDescription
                  className="text-sm font-medium mt-0.5"
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  We'll respond within 24 hours
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Form Content */}
        <div className="px-6 py-6">
          {success ? (
            <div
              className="flex flex-col items-center justify-center py-12 rounded-2xl border-2"
              style={{
                backgroundColor: `${APP_COLORS.success}15`,
                borderColor: `${APP_COLORS.success}40`,
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${APP_COLORS.success}40, ${APP_COLORS.success}20)`,
                  border: `2px solid ${APP_COLORS.success}60`,
                }}
              >
                <Check className="h-8 w-8" style={{ color: APP_COLORS.success }} />
              </div>
              <h3
                className="text-xl font-black mb-2"
                style={{ color: APP_COLORS.success }}
              >
                Message Sent Successfully!
              </h3>
              <p className="text-sm" style={{ color: APP_COLORS.textSecondary }}>
                We'll get back to you at {formData.email}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-black uppercase tracking-wider flex items-center gap-1"
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  Your Name
                  <span style={{ color: APP_COLORS.danger }}>*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`${INPUT_STYLES.base} h-11`}
                  style={{
                    backgroundColor: `${APP_COLORS.surfaceSoft}dd`,
                    borderColor: APP_COLORS.border,
                    color: APP_COLORS.textPrimary,
                  }}
                />
              </div>

              {/* Email Field - MANUAL ENTRY */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-black uppercase tracking-wider flex items-center gap-1"
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email Address
                  <span style={{ color: APP_COLORS.danger }}>*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={formData.email} // ✅ User must type their email
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`${INPUT_STYLES.base} h-11`}
                  style={{
                    backgroundColor: `${APP_COLORS.surfaceSoft}dd`,
                    borderColor: APP_COLORS.border,
                    color: APP_COLORS.textPrimary,
                  }}
                  autoComplete="email"
                />
                <p
                  className="text-xs font-medium"
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  We'll send our response to this email address
                </p>
              </div>

              {/* Subject Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="subject"
                  className="text-sm font-black uppercase tracking-wider flex items-center gap-1"
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  Subject
                  <span style={{ color: APP_COLORS.danger }}>*</span>
                </Label>
                <Input
                  id="subject"
                  type="text"
                  required
                  placeholder="What can we help you with?"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className={`${INPUT_STYLES.base} h-11`}
                  style={{
                    backgroundColor: `${APP_COLORS.surfaceSoft}dd`,
                    borderColor: APP_COLORS.border,
                    color: APP_COLORS.textPrimary,
                  }}
                />
              </div>

              {/* Message Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="message"
                  className="text-sm font-black uppercase tracking-wider flex items-center gap-1"
                  style={{ color: APP_COLORS.textPrimary }}
                >
                  Message
                  <span style={{ color: APP_COLORS.danger }}>*</span>
                </Label>
                <Textarea
                  id="message"
                  required
                  placeholder="Describe your issue or question in detail..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  className={`${INPUT_STYLES.base} resize-none`}
                  style={{
                    backgroundColor: `${APP_COLORS.surfaceSoft}dd`,
                    borderColor: APP_COLORS.border,
                    color: APP_COLORS.textPrimary,
                  }}
                  minLength={10}
                />
                <p
                  className="text-xs font-medium"
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  Minimum 10 characters
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="flex items-start gap-3 p-4 rounded-xl border"
                  style={{
                    backgroundColor: `${APP_COLORS.danger}15`,
                    borderColor: `${APP_COLORS.danger}40`,
                  }}
                >
                  <AlertCircle
                    className="h-5 w-5 flex-shrink-0 mt-0.5"
                    style={{ color: APP_COLORS.danger }}
                  />
                  <div className="text-sm font-medium" style={{ color: APP_COLORS.danger }}>
                    {error}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 h-11 rounded-xl font-black"
                  style={{
                    backgroundColor: `${APP_COLORS.surfaceSoft}e6`,
                    borderColor: APP_COLORS.border,
                    color: APP_COLORS.textSecondary,
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl font-black shadow-lg transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(135deg, ${APP_COLORS.primary}, ${APP_COLORS.accentCyan})`,
                    color: APP_COLORS.textPrimary,
                    boxShadow: `0 8px 20px ${APP_COLORS.primary}40`,
                  }}
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Info */}
        <div
          className="px-6 py-4 border-t"
          style={{
            backgroundColor: `${APP_COLORS.surfaceAlt}40`,
            borderColor: `${APP_COLORS.borderSoft}60`,
          }}
        >
          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2" style={{ color: APP_COLORS.textSecondary }}>
              <Mail className="h-3.5 w-3.5" />
              <span className="font-medium">info@cyberforensictech.com</span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: APP_COLORS.textSecondary }}>
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: APP_COLORS.success }}
              />
              <span className="font-medium">Avg response: 4 hours</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
