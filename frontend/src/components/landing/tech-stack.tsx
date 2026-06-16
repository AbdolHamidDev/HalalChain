"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Globe,
  Code2,
  Server,
  Database,
  FileJson,
  Palette,
  Box,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/i18n/hooks";

interface Tech {
  icon: LucideIcon;
  name: string;
  category: string;
  gradient: string;
}

const technologies: Tech[] = [
  { icon: Globe, name: "Next.js", category: "Frontend Framework", gradient: "from-primary/20 via-primary/5 to-transparent" },
  { icon: Code2, name: "TypeScript", category: "Programming Language", gradient: "from-blue-500/20 via-blue-500/5 to-transparent" },
  { icon: Server, name: "Express", category: "Backend Framework", gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent" },
  { icon: Database, name: "Prisma", category: "ORM", gradient: "from-amber-500/20 via-amber-500/5 to-transparent" },
  { icon: FileJson, name: "PostgreSQL", category: "Database", gradient: "from-sky-500/20 via-sky-500/5 to-transparent" },
  { icon: Palette, name: "Tailwind CSS", category: "Styling", gradient: "from-cyan-500/20 via-cyan-500/5 to-transparent" },
  { icon: Box, name: "shadcn/ui", category: "Component Library", gradient: "from-violet-500/20 via-violet-500/5 to-transparent" },
];

export function TechStackSection() {
  const { t } = useTranslation();

  return (
    <section id="tech-stack" className="py-20 md:py-28">
      <div className="container-genesis">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-section mb-4">{t("landing.techStack.title")}</h2>
          <p className="text-body text-muted-foreground">
            {t("landing.techStack.subtitle")}
          </p>
        </div>

        {/* Tech Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {technologies.map((tech) => {
            const Icon = tech.icon;
            return (
              <Card
                key={tech.name}
                className="group relative overflow-hidden transition-all duration-300 lg:last:col-start-4"
              >
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${tech.gradient}`}
                />
                <CardContent className="relative p-6 flex flex-col items-center text-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all duration-300">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold">{tech.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{tech.category}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}