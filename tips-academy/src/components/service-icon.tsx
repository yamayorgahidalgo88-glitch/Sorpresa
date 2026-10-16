import { Bot, Brain, Dice5, GraduationCap, Languages, Laptop, PiggyBank, Sun, User, Users, type LucideIcon } from "lucide-react"

const ICONS: Record<string, LucideIcon> = {
  users: Users,
  graduation: GraduationCap,
  brain: Brain,
  bot: Bot,
  sun: Sun,
  languages: Languages,
  user: User,
  dice: Dice5,
  laptop: Laptop,
  piggy: PiggyBank,
}

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Users
  return <Icon className={className} aria-hidden="true" strokeWidth={1.75} />
}
