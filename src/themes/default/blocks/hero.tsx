import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common';
import { Button } from '@/shared/components/ui/button';
import { Highlighter } from '@/shared/components/ui/highlighter';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

import { SocialAvatars } from './social-avatars';
import { WorkflowHeroGenerator } from './workflow-hero-generator';

export function Hero({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const highlightText = section.highlight_text ?? '';
  let texts = null;
  if (highlightText) {
    texts = section.title?.split(highlightText, 2);
  }
  const hasWorkflowGenerator = Boolean(section.workflow_generator);

  return (
    <section
      id={section.id}
      className={cn(
        hasWorkflowGenerator
          ? 'relative overflow-hidden pt-24 pb-12 md:pt-32 md:pb-16'
          : 'pt-24 pb-8 md:pt-36 md:pb-8',
        section.className,
        className
      )}
    >
      {hasWorkflowGenerator && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {(section.image_invert?.src || section.image?.src) && (
            <Image
              src={section.image_invert?.src || section.image?.src || ''}
              alt={section.image_invert?.alt || section.image?.alt || ''}
              className="object-cover opacity-[0.06] dark:opacity-[0.12]"
              fill
              priority
              sizes="100vw"
              quality={80}
              unoptimized={Boolean(
                section.image_invert?.src?.startsWith('http') ||
                  section.image?.src?.startsWith('http')
              )}
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--background)_0%,transparent_35%,var(--background)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--foreground)_8%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_8%,transparent)_1px,transparent_1px)] bg-size-[48px_48px] opacity-40" />
        </div>
      )}

      {section.announcement && (
        <Link
          href={section.announcement.url || ''}
          target={section.announcement.target || '_self'}
          className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto mb-8 flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-zinc-950/5 transition-colors duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
        >
          <span className="text-foreground text-sm">
            {section.announcement.title}
          </span>
          <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

          <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
            <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
              <span className="flex size-6">
                <ArrowRight className="m-auto size-3" />
              </span>
              <span className="flex size-6">
                <ArrowRight className="m-auto size-3" />
              </span>
            </div>
          </div>
        </Link>
      )}

      <div
        className={cn(
          'relative mx-auto max-w-full px-4 text-center',
          hasWorkflowGenerator ? 'md:max-w-6xl' : 'md:max-w-5xl'
        )}
      >
        <div className="mx-auto max-w-4xl">
          {texts && texts.length > 0 ? (
            <h1
              className={cn(
                'text-foreground text-4xl font-semibold text-balance sm:text-6xl',
                !hasWorkflowGenerator && 'sm:mt-12'
              )}
            >
              {texts[0]}
              <Highlighter action="underline" color="#FF9800">
                {highlightText}
              </Highlighter>
              {texts[1]}
            </h1>
          ) : (
            <h1
              className={cn(
                'text-foreground text-4xl font-semibold text-balance sm:text-6xl',
                !hasWorkflowGenerator && 'sm:mt-12'
              )}
            >
              {section.title}
            </h1>
          )}

          <p
            className="text-muted-foreground mt-6 mb-8 text-lg text-balance md:text-xl"
            dangerouslySetInnerHTML={{ __html: section.description ?? '' }}
          />

          {section.buttons && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {section.buttons.map((button, idx) => (
                <Button
                  asChild
                  size={button.size || 'default'}
                  variant={button.variant || 'default'}
                  className="px-4 text-sm"
                  key={idx}
                >
                  <Link
                    href={button.url ?? ''}
                    target={button.target ?? '_self'}
                  >
                    {button.icon && <SmartIcon name={button.icon as string} />}
                    <span>{button.title}</span>
                  </Link>
                </Button>
              ))}
            </div>
          )}

          {section.tip && (
            <p
              className="text-muted-foreground mt-5 block text-center text-sm"
              dangerouslySetInnerHTML={{ __html: section.tip ?? '' }}
            />
          )}

          {section.show_avatars && (
            <SocialAvatars tip={section.avatars_tip || ''} />
          )}
        </div>

        {hasWorkflowGenerator && (
          <WorkflowHeroGenerator config={section.workflow_generator} />
        )}
      </div>

      {!hasWorkflowGenerator &&
        (section.image?.src || section.image_invert?.src) && (
          <div className="border-foreground/10 relative mt-8 border-y sm:mt-16">
            <div className="relative z-10 mx-auto max-w-6xl border-x px-3">
              <div className="border-x">
                <div
                  aria-hidden
                  className="h-3 w-full bg-[repeating-linear-gradient(-45deg,var(--color-foreground),var(--color-foreground)_1px,transparent_1px,transparent_4px)] opacity-5"
                />
                {section.image_invert?.src && (
                  <Image
                    className="border-border/25 relative z-2 hidden w-full border dark:block"
                    src={section.image_invert.src}
                    alt={section.image_invert.alt || section.image?.alt || ''}
                    width={
                      section.image_invert.width || section.image?.width || 1200
                    }
                    height={
                      section.image_invert.height ||
                      section.image?.height ||
                      630
                    }
                    sizes="(max-width: 768px) 100vw, 1200px"
                    loading="lazy"
                    fetchPriority="high"
                    quality={75}
                    unoptimized={section.image_invert.src.startsWith('http')}
                  />
                )}
                {section.image?.src && (
                  <Image
                    className="border-border/25 relative z-2 block w-full border dark:hidden"
                    src={section.image.src}
                    alt={section.image.alt || section.image_invert?.alt || ''}
                    width={
                      section.image.width || section.image_invert?.width || 1200
                    }
                    height={
                      section.image.height ||
                      section.image_invert?.height ||
                      630
                    }
                    sizes="(max-width: 768px) 100vw, 1200px"
                    loading="lazy"
                    fetchPriority="high"
                    quality={75}
                    unoptimized={section.image.src.startsWith('http')}
                  />
                )}
              </div>
            </div>
          </div>
        )}

      {section.background_image?.src && (
        <div className="absolute inset-0 -z-10 hidden h-full w-full overflow-hidden md:block">
          <div className="from-background/80 via-background/80 to-background absolute inset-0 z-10 bg-gradient-to-b" />
          <Image
            src={section.background_image.src}
            alt={section.background_image.alt || ''}
            className="object-cover opacity-60 blur-[0px]"
            fill
            loading="lazy"
            sizes="(max-width: 768px) 0vw, 100vw"
            quality={70}
            unoptimized={section.background_image.src.startsWith('http')}
          />
        </div>
      )}
    </section>
  );
}
