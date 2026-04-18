'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Search, Menu } from 'lucide-react';
// import { ShareAnalysisButton } from './ShareAnalysisButton';
import { APP_COLORS, BUTTON_STYLES, INPUT_STYLES, CARD_STYLES } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';

const formSchema = z.object({
  iocs: z.string().min(1, 'At least one IOC is required'),
});

type FormData = z.infer<typeof formSchema>;

interface ThreatSearchFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
  validateIOCs?: (iocs: string, searchType: string) => any;
  currentIOC?: string;
  showShareButton?: boolean;
  onMenuClick?: () => void;
}

export function ThreatSearchForm({ 
  onSubmit, 
  isSubmitting, 
  currentIOC, 
  showShareButton = false,
  onMenuClick
}: ThreatSearchFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      iocs: '',
    },
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Ctrl+K / Cmd+K keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSubmitting) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <Card 
      className={`${CARD_STYLES.base} transition-all duration-300 hover:shadow-lg`}
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
        borderColor: APP_COLORS.border,
      }}
    >
      <CardContent className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              {onMenuClick && (
                <Button
                  type="button"
                  onClick={onMenuClick}
                  className="lg:hidden h-11 w-11 p-0 rounded-xl hover:scale-105 transition-all flex-shrink-0"
                  style={{
                    backgroundColor: `${APP_COLORS.primary}15`,
                    color: APP_COLORS.primary,
                  }}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}

              {/* Search Input */}
              <div className="flex-1 relative">
                <FormField
                  control={form.control}
                  name="iocs"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            ref={inputRef}
                            placeholder="Search IOCs (IP, Domain, Hash, URL)..."
                            className={`${INPUT_STYLES.base} ${TYPOGRAPHY.body.md} pl-11 h-11 border-2 transition-all`}
                            style={{
                              backgroundColor: APP_COLORS.backgroundSoft,
                              borderColor: APP_COLORS.border,
                              color: APP_COLORS.textPrimary,
                            }}
                            disabled={isSubmitting}
                            onKeyDown={handleKeyDown}
                          />
                          
                          {/* Search Icon */}
                          <Search 
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none" 
                            style={{ color: APP_COLORS.textSecondary }} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage 
                        className={`${TYPOGRAPHY.caption.md} mt-1.5`}
                        style={{ color: APP_COLORS.danger }}
                      />
                    </FormItem>
                  )}
                />
              </div>

              {/* Search Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className={`h-11 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ${TYPOGRAPHY.body.sm} ${TYPOGRAPHY.fontWeight.bold}`}
                style={{
                  backgroundColor: isSubmitting ? APP_COLORS.surfaceMuted : APP_COLORS.primary,
                  color: APP_COLORS.textPrimary,
                }}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: `${APP_COLORS.textPrimary}80`, borderTopColor: 'transparent' }}
                    />
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <span>Analyze</span>
                  </div>
                )}
              </Button>

              
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
