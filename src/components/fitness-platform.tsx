"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import AuthForm, { SessionControl } from "@/components/auth-form";
import LiveBookings from "@/components/live-bookings";
import { authClient } from "@/lib/auth/client";

type Trainer = {
  id: string;
  name: string;
  title: string;
  location: string;
  specialty: string;
  price: number;
  rating: string;
  reviews: number;
  image: string;
  initials: string;
  bio: string;
  languages: string[];
};

type Program = {
  id: string;
  title: string;
  trainer: string;
  category: string;
  weeks: number;
  lessons: number;
  price: number;
  rating: string;
  image: string;
  level: string;
  description: string;
};

type CoachingCallRequest = {
  role: "client" | "trainer";
  coach: Trainer;
  clientName: string;
  clientImage: string;
  sessionTitle: string;
  scheduledTime: string;
};

type CoachDemoSession = {
  date: string;
  time: string;
  title: string;
  clientName: string;
  clientImage: string;
};

const trainers: Trainer[] = [
  {
    id: "arjun-mehta",
    name: "Arjun Mehta",
    title: "Strength & conditioning coach",
    location: "Mumbai, Maharashtra",
    specialty: "Strength",
    price: 1800,
    rating: "4.98",
    reviews: 126,
    image: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=900&q=85",
    initials: "AM",
    bio: "I help busy people build strength that carries into everyday life. No extremes, no shortcuts — just a plan that fits you.",
    languages: ["English", "Hindi", "Marathi"],
  },
  {
    id: "sana-kapoor",
    name: "Sana Kapoor",
    title: "Mobility & movement coach",
    location: "Bengaluru, Karnataka",
    specialty: "Mobility",
    price: 1500,
    rating: "4.96",
    reviews: 94,
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85",
    initials: "SK",
    bio: "Thoughtful strength and mobility for a body that feels as good as it performs.",
    languages: ["English", "Hindi", "Kannada"],
  },
  {
    id: "kabir-rao",
    name: "Kabir Rao",
    title: "Running & endurance coach",
    location: "Pune, Maharashtra",
    specialty: "Endurance",
    price: 1200,
    rating: "4.95",
    reviews: 83,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85",
    initials: "KR",
    bio: "From first 5K to a confident half-marathon, we build your engine one repeatable week at a time.",
    languages: ["English", "Hindi"],
  },
  {
    id: "maya-iyer",
    name: "Maya Iyer",
    title: "Nutrition & habit coach",
    location: "Chennai, Tamil Nadu",
    specialty: "Nutrition",
    price: 1600,
    rating: "4.99",
    reviews: 111,
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=85",
    initials: "MI",
    bio: "Sustainable food habits for more energy, better training, and a calmer relationship with nutrition.",
    languages: ["English", "Tamil", "Hindi"],
  },
];

const coachDemoSessions: CoachDemoSession[] = [
  { date: "TUE 19", time: "10:00 AM", title: "Movement assessment", clientName: "Priya Nair", clientImage: trainers[1].image },
  { date: "THU 21", time: "5:30 PM", title: "Strength coaching", clientName: "Riya Sharma", clientImage: trainers[3].image },
  { date: "SAT 23", time: "9:00 AM", title: "Weekly check-in", clientName: "Dev Kumar", clientImage: trainers[2].image },
];

const programs: Program[] = [
  {
    id: "strong-start",
    title: "The Strong Start",
    trainer: "Arjun Mehta",
    category: "Strength",
    weeks: 8,
    lessons: 24,
    price: 2499,
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1000&q=85",
    level: "Beginner friendly",
    description: "A considered, progressive strength plan for building confidence with the fundamentals.",
  },
  {
    id: "move-better",
    title: "Move Better, Every Day",
    trainer: "Sana Kapoor",
    category: "Mobility",
    weeks: 4,
    lessons: 16,
    price: 1799,
    rating: "5.0",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=85",
    level: "All levels",
    description: "Twenty minutes a day to move with more ease, control, and range.",
  },
  {
    id: "run-your-first-10k",
    title: "Run Your First 10K",
    trainer: "Kabir Rao",
    category: "Endurance",
    weeks: 10,
    lessons: 20,
    price: 1999,
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1000&q=85",
    level: "Beginner",
    description: "A steady, coach-built progression to your first 10K finish line.",
  },
  {
    id: "everyday-fuel",
    title: "Everyday Fuel",
    trainer: "Maya Iyer",
    category: "Nutrition",
    weeks: 6,
    lessons: 18,
    price: 2199,
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=85",
    level: "All levels",
    description: "Simple, flexible nutrition lessons built for real schedules and real life.",
  },
];

const categoryFilters = ["All", "Strength", "Mobility", "Endurance", "Nutrition"];
const completedLessonsByProgram: Record<string, number> = {
  "strong-start": 15,
  "move-better": 6,
  "run-your-first-10k": 4,
  "everyday-fuel": 0,
};
const lessonTitleSets: Record<string, string[]> = {
  "strong-start": [
    "Start with the foundations",
    "Build your weekly rhythm",
    "Form, focus & control",
    "Make progress your own",
    "The squat, step by step",
    "Find your training stance",
    "Strength through the middle",
    "A smarter way to progress",
  ],
  "move-better": [
    "Meet your body's range",
    "Build a daily mobility rhythm",
    "Hips that move with ease",
    "Open up your shoulders",
    "Control before range",
    "A reset for your whole body",
    "Move well under load",
    "Make the habit stick",
  ],
  "run-your-first-10k": [
    "Start with an easy pace",
    "Build your running rhythm",
    "Find your stride",
    "Run-walk, done right",
    "Your first longer effort",
    "Strength for the road",
    "Recover and come back",
    "Ready for the next distance",
  ],
  "everyday-fuel": [
    "Start with what you eat",
    "Build a balanced plate",
    "Fuel around your training",
    "Make hydration a habit",
    "Planning for busy days",
    "Keep good routines flexible",
  ],
};

type VideoLesson = {
  title: string;
  duration: number;
  week: number;
};

function getProgramLessons(program: Program): VideoLesson[] {
  const titles = lessonTitleSets[program.id] ?? lessonTitleSets["strong-start"];
  return Array.from({ length: program.lessons }, (_, index) => ({
    title: `${titles[index % titles.length]}${index >= titles.length ? ` · Round ${Math.floor(index / titles.length) + 1}` : ""}`,
    duration: 360 + ((index * 47 + 84) % 320),
    week: Math.min(program.weeks, Math.floor((index * program.weeks) / program.lessons) + 1),
  }));
}

function formatVideoTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function Icon({
  name,
  size = 18,
}: {
  name: "arrow" | "search" | "pin" | "star" | "play" | "clock" | "calendar" | "chat" | "heart" | "menu" | "close" | "check" | "plus" | "chevron" | "bell" | "grid" | "book" | "users" | "wallet" | "settings" | "filter" | "spark" | "video" | "mic" | "phone" | "share";
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  const paths: Record<typeof name, ReactNode> = {
    arrow: <><path d="M4 12h15" /><path d="m13 5 7 7-7 7" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" /></>,
    pin: <><path d="M19 10.1c0 5.2-7 11-7 11s-7-5.8-7-11a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.2" /></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    play: <path d="m9 6 10 6-10 6V6Z" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    chat: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-2 2v-6a7.5 7.5 0 1 1 17-3.5Z" /><path d="M8 11h8M8 14h5" /></>,
    heart: <path d="M20.8 8.8c0 5.2-8.8 10.1-8.8 10.1S3.2 14 3.2 8.8A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.4Z" />,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12Z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h7" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6" /></>,
    wallet: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 9h18M16 14h2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.2.9-1.2 2.1-1.4-.5a8 8 0 0 1-1.5.9l-.2 1.5h-2.5l-.3-1.5a8 8 0 0 1-1.6-.9l-1.4.5-1.2-2.1 1.2-.9a7 7 0 0 1 0-1.8l-1.2-.9 1.2-2.1 1.4.5a8 8 0 0 1 1.6-.9l.3-1.5h2.5l.2 1.5a8 8 0 0 1 1.5.9l1.4-.5 1.2 2.1-1.2.9a7 7 0 0 1-.1 1.8Z" /></>,
    filter: <><path d="M4 6h16M7 12h10M10 18h4" /><circle cx="8" cy="6" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" /></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></>,
    video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></>,
    mic: <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" /></>,
    phone: <path d="M7 3H4a1 1 0 0 0-1 1 17 17 0 0 0 17 17 1 1 0 0 0 1-1v-3l-5-2-2 2a13 13 0 0 1-5-5l2-2-2-5Z" />,
    share: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function Avatar({ trainer, size = "md" }: { trainer: Trainer; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={`avatar avatar-${size}`} style={{ backgroundImage: `url("${trainer.image}")` }} aria-label={trainer.name} role="img" />
  );
}

function Brand({ inverse = false }: { inverse?: boolean }) {
  return <Link className={`brand ${inverse ? "brand-inverse" : ""}`} href="/" aria-label="Forge home">FORGE<span>.</span></Link>;
}

function SectionTitle({ kicker, title, action, href = "/discover" }: { kicker: string; title: ReactNode; action?: string; href?: string }) {
  return (
    <div className="section-title">
      <div>
        <p className="eyebrow"><span />{kicker}</p>
        <h2>{title}</h2>
      </div>
      {action && <Link className="text-link" href={href}>{action}<Icon name="arrow" size={15} /></Link>}
    </div>
  );
}

function PublicHeader({ onSignIn }: { onSignIn: () => void }) {
  const pathname = usePathname();
  return (
    <header className="public-header">
      <Brand inverse />
      <nav className="public-nav" aria-label="Main navigation">
        <Link className={pathname === "/discover" ? "nav-active" : ""} href="/discover">Find a coach</Link>
        <Link className={pathname === "/programs" ? "nav-active" : ""} href="/programs">Programs</Link>
        <Link href="/#how-it-works">How it works</Link>
      </nav>
      <div className="header-actions">
        <SessionControl onSignIn={onSignIn} />
        <Link className="button button-red button-small" href="/discover">Get started <Icon name="arrow" size={14} /></Link>
      </div>
    </header>
  );
}

function CoachCard({ trainer, onMessage, isFavorite = false, onFavorite }: { trainer: Trainer; onMessage: () => void; isFavorite?: boolean; onFavorite?: () => void }) {
  return (
    <article className="coach-card">
      <Link href={`/trainers/${trainer.id}`} className="coach-photo" style={{ backgroundImage: `linear-gradient(180deg,transparent 58%,rgba(0,0,0,.62)),url("${trainer.image}")` }}>
        <span className="coach-specialty">{trainer.specialty}</span>
        <span className="verified-mark" title="Verified coach"><Icon name="check" size={12} /></span>
      </Link>
      {onFavorite && <button className={`coach-save ${isFavorite ? "coach-saved" : ""}`} onClick={onFavorite} aria-label={isFavorite ? `Unsave ${trainer.name}` : `Save ${trainer.name}`} aria-pressed={isFavorite}><Icon name="heart" size={16} /></button>}
      <div className="coach-card-body">
        <div className="coach-card-top">
          <div>
            <Link href={`/trainers/${trainer.id}`} className="coach-name">{trainer.name}</Link>
            <p>{trainer.title}</p>
          </div>
          <span className="coach-rating"><Icon name="star" size={13} /> {trainer.rating}</span>
        </div>
        <div className="coach-location"><Icon name="pin" size={13} /> {trainer.location}</div>
        <div className="coach-card-bottom">
          <span><b>₹{trainer.price.toLocaleString("en-IN")}</b> <small>/ session</small></span>
          <button className="icon-button" aria-label={`Message ${trainer.name}`} onClick={onMessage}><Icon name="chat" size={17} /></button>
        </div>
      </div>
    </article>
  );
}

function ProgramCard({ program }: { program: Program }) {
  return (
    <article className="program-card">
      <Link href={`/programs/${program.id}`} className="program-image" style={{ backgroundImage: `linear-gradient(180deg,rgba(8,8,8,.04),rgba(8,8,8,.5)),url("${program.image}")` }}>
        <span className="program-tag">{program.category}</span>
        <span className="program-duration">{program.weeks} WEEKS</span>
        <span className="program-play"><Icon name="play" size={15} /></span>
      </Link>
      <div className="program-body">
        <div className="program-meta"><span>{program.level}</span><span><Icon name="star" size={12} /> {program.rating}</span></div>
        <Link href={`/programs/${program.id}`} className="program-name">{program.title}</Link>
        <p>with {program.trainer}</p>
        <div className="program-card-bottom">
          <span className="program-lessons">{program.lessons} video lessons</span>
          <strong>₹{program.price.toLocaleString("en-IN")}</strong>
        </div>
      </div>
    </article>
  );
}

function Footer() {
  return (
    <footer className="public-footer">
      <div><Brand inverse /><p>Train with intention.<br />Become your own kind of strong.</p></div>
      <div className="footer-links"><Link href="/discover">Find a coach</Link><Link href="/programs">Programs</Link><Link href="/trainer/apply">For trainers</Link><Link href="/settings">Help & support</Link></div>
      <span className="footer-copy">© 2026 FORGE COACHING · MADE FOR THE LONG GAME</span>
    </footer>
  );
}

function Modal({ title, children, onClose, wide = false, className = "" }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean; className?: string }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`modal ${wide ? "modal-wide" : ""} ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        {children}
      </section>
    </div>
  );
}

function ProgramEditorModal({
  onClose,
  onSave,
  notify,
}: {
  onClose: () => void;
  onSave: () => void;
  notify: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Strength");
  const [price, setPrice] = useState("2499");
  const [weeks, setWeeks] = useState("8");
  const [description, setDescription] = useState("");
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await fetch("/api/trainer-programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: name,
          category,
          description,
          weeks: Number(weeks),
          lessons: videoFiles.length,
          price: Number(price),
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not save the draft.");
      notify("Program draft saved");
      onSave();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save the draft.");
    }
  }

  return (
    <Modal title="Create a program" onClose={onClose} wide className="program-editor-dialog">
      <div className="program-editor">
        <header className="program-editor-header">
          <div>
            <p className="eyebrow"><span /> COACH STUDIO <i>/</i> NEW PROGRAM</p>
            <h2>Build a plan<br />that <em>moves.</em></h2>
            <p>Set the essentials first. You can refine the details any time before publishing.</p>
          </div>
          <div className="program-editor-step"><span>WORKING MODE</span><b>Draft</b><small>Not visible to clients</small></div>
        </header>

        <form className="program-editor-form" onSubmit={handleSubmit}>
          <div className="program-editor-columns">
            <section className="program-editor-details">
              <div className="program-editor-section-title"><span>01</span><div><h3>Program details</h3><p>Help the right clients understand what they’ll get.</p></div></div>
              <label className="program-editor-field">Program name<input maxLength={60} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Stronger Foundations" /></label>
              <label className="program-editor-field">Short description<textarea maxLength={240} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What will clients learn or be able to do?" /><small>{description.length}/240 characters · optional for drafts</small></label>
              <div className="program-editor-fields-row">
                <label className="program-editor-field">Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option>Strength</option><option>Mobility</option><option>Endurance</option><option>Nutrition</option></select></label>
                <label className="program-editor-field">Duration<select value={weeks} onChange={(event) => setWeeks(event.target.value)}>{[2, 4, 6, 8, 10, 12].map((weekCount) => <option key={weekCount} value={weekCount}>{weekCount} weeks</option>)}</select></label>
              </div>
              <label className="program-editor-field program-price-field">Price<input type="number" min="0" step="1" value={price} onChange={(event) => setPrice(event.target.value)} /><span>₹ INR</span></label>
            </section>

            <aside className="program-editor-content">
              <div className="program-cover-preview" style={{ backgroundImage: `linear-gradient(180deg,rgba(8,8,8,.08),rgba(8,8,8,.88)),url("${programs[0].image}")` }}>
                <span>CLIENT PREVIEW</span>
                <div><small>{category.toUpperCase()} · {weeks} WEEKS</small><b>{name.trim() || "Your program title"}</b><i>by Arjun Mehta</i></div>
              </div>
              <div className="program-lesson-heading"><div><h3>Video lessons</h3><p>Add the sessions clients will follow.</p></div><span>{videoFiles.length} ADDED</span></div>
              <input
                ref={uploadInputRef}
                className="program-upload-input"
                type="file"
                accept="video/mp4,video/webm"
                multiple
                onChange={(event) => {
                  const selectedFiles = Array.from(event.target.files ?? []);
                  const acceptedFiles = selectedFiles.filter((file) => file.size <= 500 * 1024 * 1024);
                  if (acceptedFiles.length < selectedFiles.length) notify("Each video must be smaller than 500 MB.");
                  setVideoFiles((current) => [...current, ...acceptedFiles]);
                  event.target.value = "";
                }}
              />
              <button type="button" className="program-upload-trigger" onClick={() => uploadInputRef.current?.click()}>
                <span className="program-upload-icon"><Icon name="plus" size={17} /></span>
                <b>Add video lessons</b>
                <small>MP4 or WEBM · up to 500 MB each</small>
              </button>
              {videoFiles.length > 0 ? (
                <ul className="program-upload-list">
                  {videoFiles.map((file, index) => (
                    <li key={`${file.name}-${file.size}-${index}`}>
                      <Icon name="play" size={13} />
                      <span><b>{file.name}</b><small>{Math.max(1, Math.round(file.size / (1024 * 1024)))} MB · ready to add</small></span>
                      <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setVideoFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}><Icon name="close" size={13} /></button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="program-upload-note">No lessons added yet. You can save the draft and add videos later.</p>
              )}
              <p className="program-upload-disclaimer">Demo only — video files are not uploaded or saved.</p>
            </aside>
          </div>
          <footer className="program-editor-footer">
            <span><i /> Demo only · drafts aren’t saved or published.</span>
            <div><button type="button" className="program-editor-cancel" onClick={onClose}>CANCEL</button><button type="submit" className="button button-red">SAVE DRAFT <Icon name="arrow" size={14} /></button></div>
          </footer>
        </form>
      </div>
    </Modal>
  );
}

function VideoLessonPlayer({
  program,
  initialLessonIndex,
  preview,
  onClose,
}: {
  program: Program;
  initialLessonIndex: number;
  preview: boolean;
  onClose: () => void;
}) {
  const lessons = getProgramLessons(program);
  const completedLessons = preview ? 0 : completedLessonsByProgram[program.id] ?? 0;
  const [activeIndex, setActiveIndex] = useState(Math.min(initialLessonIndex, lessons.length - 1));
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const activeLessonRef = useRef<HTMLButtonElement>(null);
  const activeLesson = lessons[activeIndex];
  const trainer = trainers.find((item) => item.name === program.trainer) ?? trainers[0];

  useEffect(() => {
    activeLessonRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setTimeout(() => {
      const nextTime = Math.min(currentTime + 1, activeLesson.duration);
      setCurrentTime(nextTime);
      if (nextTime >= activeLesson.duration) setIsPlaying(false);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [activeLesson.duration, currentTime, isPlaying]);

  function selectLesson(index: number) {
    setActiveIndex(index);
    setCurrentTime(0);
    setIsPlaying(false);
  }

  function togglePlayback() {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (currentTime >= activeLesson.duration) setCurrentTime(0);
    setIsPlaying(true);
  }

  return (
    <Modal title={`${program.title} lesson player`} onClose={onClose} wide>
      <div className={`video-player-modal${preview ? " video-player-preview" : ""}`}>
        <header className="video-player-header">
          <div><span className="eyebrow"><span /> {preview ? "PROGRAM PREVIEW" : "YOUR LEARNING SPACE"}</span><b>{program.title}</b></div>
          <span className="video-player-course-count">{program.lessons} LESSONS · {program.weeks} WEEKS</span>
        </header>
        <div className="video-player-layout">
          <main className="video-player-main">
            <div className="video-stage" style={{ backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.22) 42%,rgba(0,0,0,.88)),url("${program.image}")` }}>
              <span className="video-stage-label">{preview ? "SAMPLE LESSON" : "DEMO PLAYER"}</span>
              <button className="video-stage-play" onClick={togglePlayback} aria-label={isPlaying ? "Pause lesson" : "Play lesson"}>
                {isPlaying ? <span className="video-pause-bars" aria-hidden="true"><i /><i /></span> : <Icon name="play" size={24} />}
              </button>
              {captionsEnabled && <span className="video-caption">Follow the movement at your own pace.</span>}
              <div className="video-controls">
                <button className="video-control-play" onClick={togglePlayback} aria-label={isPlaying ? "Pause lesson" : "Play lesson"}>
                  {isPlaying ? <span className="video-pause-bars" aria-hidden="true"><i /><i /></span> : <Icon name="play" size={15} />}
                </button>
                <span className="video-time">{formatVideoTime(currentTime)}</span>
                <input type="range" min="0" max={activeLesson.duration} value={currentTime} onChange={(event) => setCurrentTime(Number(event.target.value))} aria-label="Seek through lesson" />
                <span className="video-time">{formatVideoTime(activeLesson.duration)}</span>
                <button className={`video-control-text${muted ? " video-control-active" : ""}`} onClick={() => setMuted((value) => !value)} aria-label={muted ? "Unmute video" : "Mute video"}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
                <button className={`video-control-text${captionsEnabled ? " video-control-active" : ""}`} onClick={() => setCaptionsEnabled((value) => !value)} aria-label="Toggle captions" aria-pressed={captionsEnabled}>CC</button>
              </div>
            </div>
            <div className="video-lesson-details">
              <div className="video-lesson-meta"><span>WEEK {activeLesson.week}</span><span>LESSON {activeIndex + 1} OF {program.lessons}</span></div>
              <h2>{activeLesson.title}</h2>
              <p>Learn with {trainer.name}. Take your time, focus on good form, and come back to this lesson whenever you need a reset.</p>
              <div className="video-coach-line"><Avatar trainer={trainer} size="sm" /><span><b>{trainer.name}</b><small>{trainer.title}</small></span></div>
              <div className="video-lesson-navigation">
                <button onClick={() => selectLesson(activeIndex - 1)} disabled={activeIndex === 0}>← PREVIOUS</button>
                <button onClick={() => selectLesson(activeIndex + 1)} disabled={activeIndex === lessons.length - 1}>NEXT LESSON <Icon name="arrow" size={13} /></button>
              </div>
            </div>
          </main>
          <aside className="video-playlist">
            <div className="video-playlist-heading"><span>COURSE CONTENT</span><b>{completedLessons} / {program.lessons} DONE</b></div>
            <div className="video-playlist-progress"><span style={{ width: `${(completedLessons / program.lessons) * 100}%` }} /></div>
            <div className="video-playlist-list">
              {lessons.map((lesson, index) => (
                <button
                  type="button"
                  className={`video-playlist-item${activeIndex === index ? " video-playlist-item-active" : ""}`}
                  key={`${program.id}-${index}`}
                  onClick={() => selectLesson(index)}
                  aria-current={activeIndex === index ? "step" : undefined}
                  ref={activeIndex === index ? activeLessonRef : undefined}
                >
                  <span className="video-playlist-number">{index < completedLessons ? <Icon name="check" size={13} /> : `${index + 1}`}</span>
                  <span className="video-playlist-copy"><b>{lesson.title}</b><small>WEEK {lesson.week} · {formatVideoTime(lesson.duration)}</small></span>
                  {activeIndex === index && <Icon name="play" size={13} />}
                </button>
              ))}
            </div>
          </aside>
        </div>
        <p className="video-player-disclaimer">Demo preview — lesson video streaming is not connected yet.</p>
      </div>
    </Modal>
  );
}

function CoachingCallModal({
  request,
  onClose,
  notify,
}: {
  request: CoachingCallRequest;
  onClose: () => void;
  notify: (message: string) => void;
}) {
  const [inCall, setInCall] = useState(false);
  const [microphoneOn, setMicrophoneOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const isClient = request.role === "client";
  const remoteName = isClient ? request.coach.name : request.clientName;
  const remoteImage = isClient ? request.coach.image : request.clientImage;
  const localName = isClient ? request.clientName : request.coach.name;
  const localImage = isClient ? request.clientImage : request.coach.image;

  useEffect(() => {
    if (!inCall) return;
    const timer = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [inCall]);

  function endCall() {
    notify("Demo call ended. No video or audio was transmitted.");
    onClose();
  }

  return (
    <Modal title={`${request.sessionTitle} call`} onClose={onClose} wide className="call-modal-dialog">
      <div className={`coaching-call ${inCall ? "coaching-call-active" : "coaching-call-lobby"}`}>
        <header className="call-modal-header">
          <div><p className="eyebrow"><span /> 1:1 COACHING</p><h2>{request.sessionTitle}</h2></div>
          <span className="call-preview-badge">DEMO SESSION</span>
        </header>

        {inCall ? (
          <section className="call-active-view" aria-label="Demo coaching call">
            <div className="call-live-stage" style={{ backgroundImage: `linear-gradient(180deg,rgba(8,8,8,.08),rgba(8,8,8,.15) 48%,rgba(8,8,8,.86)),url("${remoteImage}")` }}>
              <span className="call-live-status"><i /> CALL UI PREVIEW</span>
              <div className="call-remote-label"><b>{remoteName}</b><small>1:1 session · {formatVideoTime(elapsedSeconds)}</small></div>
              <div className="call-local-tile" style={{ backgroundImage: `linear-gradient(0deg,rgba(0,0,0,.7),transparent 50%),url("${localImage}")` }}>
                {!cameraOn && <span className="call-camera-off">CAMERA OFF</span>}
                <b>{localName} (You)</b>
              </div>
            </div>
            <div className="call-active-toolbar">
              <div className="call-elapsed-time"><b>{formatVideoTime(elapsedSeconds)}</b><small>SESSION TIME</small></div>
              <div className="call-control-buttons">
                <button type="button" className={`call-control${microphoneOn ? "" : " call-control-off"}`} onClick={() => setMicrophoneOn((value) => !value)} aria-label={microphoneOn ? "Mute microphone" : "Unmute microphone"} aria-pressed={!microphoneOn}>
                  <Icon name="mic" size={18} /><span>{microphoneOn ? "MUTE" : "UNMUTE"}</span>
                </button>
                <button type="button" className={`call-control${cameraOn ? "" : " call-control-off"}`} onClick={() => setCameraOn((value) => !value)} aria-label={cameraOn ? "Turn camera off" : "Turn camera on"} aria-pressed={cameraOn}>
                  <Icon name="video" size={18} /><span>{cameraOn ? "CAMERA ON" : "CAMERA OFF"}</span>
                </button>
                <button type="button" className="call-control" onClick={() => notify("Screen sharing is a UI preview only.")} aria-label="Share screen">
                  <Icon name="share" size={18} /><span>SHARE</span>
                </button>
                <button type="button" className="call-control call-control-end" onClick={endCall} aria-label="End demo call">
                  <Icon name="phone" size={18} /><span>END CALL</span>
                </button>
              </div>
            </div>
            <p className="call-demo-disclaimer">Demo only — no live video, audio, or screen sharing is connected.</p>
          </section>
        ) : (
          <div className="call-lobby-layout">
            <div className="call-lobby-stage" style={{ backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.8)),url("${remoteImage}")` }}>
              <span className="call-lobby-status"><i /> READY WHEN YOU ARE</span>
              <div className="call-lobby-caption"><small>YOUR COACHING SESSION</small><h3>Show up as<br /><em>you are.</em></h3><span><b>{remoteName}</b><small>{isClient ? request.coach.title : "Your client"}</small></span></div>
              <div className="call-local-tile call-lobby-local" style={{ backgroundImage: `linear-gradient(0deg,rgba(0,0,0,.7),transparent 50%),url("${localImage}")` }}>
                {!cameraOn && <span className="call-camera-off">CAMERA OFF</span>}
                <b>{localName} (You)</b>
              </div>
            </div>
            <section className="call-lobby-panel">
              <p className="call-section-kicker">SESSION DETAILS</p>
              <h3>{isClient ? `Meet ${remoteName}.` : `Coaching ${remoteName}.`}</h3>
              <p className="call-lobby-intro">Take a moment to check your setup. You can turn your camera on or off at any time.</p>
              <div className="call-session-summary">
                <span><Icon name="calendar" size={16} /><b>{request.scheduledTime}</b></span>
                <span><Icon name="clock" size={16} /><b>50 minutes · Online</b></span>
                <span><Icon name="users" size={16} /><b>{localName} & {remoteName}</b></span>
              </div>
              <div className="call-device-toggles">
                <button type="button" className={microphoneOn ? "call-device-on" : ""} onClick={() => setMicrophoneOn((value) => !value)} aria-pressed={microphoneOn}><Icon name="mic" size={16} /><span>Microphone</span><b>{microphoneOn ? "ON" : "OFF"}</b></button>
                <button type="button" className={cameraOn ? "call-device-on" : ""} onClick={() => setCameraOn((value) => !value)} aria-pressed={cameraOn}><Icon name="video" size={16} /><span>Camera</span><b>{cameraOn ? "ON" : "OFF"}</b></button>
              </div>
              <button type="button" className="button button-red call-join-button" onClick={() => { setElapsedSeconds(0); setInCall(true); }}>
                {isClient ? "JOIN SESSION" : "START SESSION"} <Icon name="arrow" size={15} />
              </button>
              <p className="call-demo-disclaimer">Demo UI only — your camera and microphone won’t be accessed.</p>
            </section>
          </div>
        )}
      </div>
    </Modal>
  );
}

function AccountTypePicker({
  value,
  onChange,
}: {
  value: "client" | "trainer";
  onChange: (value: "client" | "trainer") => void;
}) {
  return (
    <div className="role-picker">
      <p className="role-picker-label">CONTINUE AS</p>
      <div className="role-picker-options" role="group" aria-label="Choose account type">
        <button type="button" className={value === "client" ? "role-option role-option-active" : "role-option"} aria-pressed={value === "client"} onClick={() => onChange("client")}>
          <span className="role-option-mark">C</span>
          <span><b>Client</b><small>Find your coach</small></span>
          <span className="role-option-check"><Icon name="check" size={12} /></span>
        </button>
        <button type="button" className={value === "trainer" ? "role-option role-option-active" : "role-option"} aria-pressed={value === "trainer"} onClick={() => onChange("trainer")}>
          <span className="role-option-mark">T</span>
          <span><b>Coach</b><small>Manage clients</small></span>
          <span className="role-option-check"><Icon name="check" size={12} /></span>
        </button>
      </div>
    </div>
  );
}

const conversations = [
  { name: "Arjun Mehta", message: "Let’s make this feel sustainable.", time: "2m", unread: 2, trainer: trainers[0] },
  { name: "Sana Kapoor", message: "Your mobility check-in is ready.", time: "1h", unread: 0, trainer: trainers[1] },
  { name: "Kabir Rao", message: "Great work on the weekend run!", time: "Yesterday", unread: 0, trainer: trainers[2] },
];

const initialMessages = [
  { sender: "Arjun Mehta", text: "Hey Riya! I saw your note about wanting to get stronger without living at the gym. That's very doable.", time: "10:14 AM" },
  { sender: "You", text: "That sounds exactly right. I have about 3 days a week to train.", time: "10:18 AM" },
  { sender: "Arjun Mehta", text: "Perfect. We can build around that. What does your current routine look like?", time: "10:20 AM" },
];

const initialMessagesByConversation: Record<number, typeof initialMessages> = {
  0: initialMessages,
  1: [
    { sender: "Sana Kapoor", text: "Your mobility check-in is ready. How did the shoulder flow feel this week?", time: "9:42 AM" },
    { sender: "You", text: "Much better. I was able to fit it in before work.", time: "9:48 AM" },
    { sender: "Sana Kapoor", text: "That’s great progress. I’ll share a short progression for next week.", time: "9:51 AM" },
  ],
  2: [
    { sender: "Kabir Rao", text: "Great work on the weekend run! Your pace stayed steady through the final kilometre.", time: "Yesterday" },
    { sender: "You", text: "Thanks! I was surprised I could hold it.", time: "Yesterday" },
    { sender: "Kabir Rao", text: "You’ve built a strong base. Let’s add a little distance next week.", time: "Yesterday" },
  ],
};

const firstAvailableBookingDate = new Date(2026, 10, 18);
const lastAvailableBookingDate = new Date(2027, 0, 13);

function formatBookingDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(date);
}

const appNavigation = [
  { label: "Overview", href: "/dashboard", icon: "grid" as const },
  { label: "My programs", href: "/my-learning", icon: "book" as const },
  { label: "Bookings", href: "/bookings", icon: "calendar" as const },
  { label: "Messages", href: "/messages", icon: "chat" as const },
];

const trainerNavigation = [
  { label: "Overview", href: "/trainer/dashboard", icon: "grid" as const },
  { label: "My programs", href: "/trainer/programs", icon: "book" as const },
  { label: "Clients", href: "/trainer/clients", icon: "users" as const },
  { label: "Availability", href: "/trainer/availability", icon: "calendar" as const },
  { label: "Earnings", href: "/trainer/earnings", icon: "wallet" as const },
  { label: "Messages", href: "/messages", icon: "chat" as const },
];

function DashboardShell({
  children,
  trainerMode,
  onNotifications,
}: {
  children: ReactNode;
  trainerMode?: boolean;
  onNotifications: () => void;
}) {
  const pathname = usePathname();
  const links = trainerMode ? trainerNavigation : appNavigation;
  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <Brand inverse />
        <div className="sidebar-switcher">
          <Avatar trainer={trainerMode ? trainers[0] : trainers[1]} size="sm" />
          <div><b>{trainerMode ? "Arjun Mehta" : "Riya Sharma"}</b><span>{trainerMode ? "Coach account" : "Client account"}</span></div>
          <Icon name="chevron" size={15} />
        </div>
        <p className="sidebar-label">YOUR SPACE</p>
        <nav className="app-nav" aria-label="Dashboard navigation">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className={pathname === item.href ? "app-nav-active" : ""}>
              <Icon name={item.icon} size={17} />{item.label}
              {item.label === "Messages" && <span className="nav-unread">2</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-grow" />
        {trainerMode && <Link className="sidebar-action" href="/admin"><Icon name="settings" size={16} /> Admin preview</Link>}
        <Link className="sidebar-action" href="/"><Icon name="arrow" size={16} /> Back to marketplace</Link>
        <SessionControl className="sidebar-action" showDashboard={false} />
        <Link href="/settings" className="sidebar-profile">
          <Avatar trainer={trainerMode ? trainers[0] : trainers[1]} size="sm" />
          <span><b>{trainerMode ? "Arjun Mehta" : "Riya Sharma"}</b><small>Account settings</small></span>
          <Icon name="settings" size={16} />
        </Link>
      </aside>
      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <div className="dashboard-breadcrumb"><span>FORGE</span><i>/</i> {trainerMode ? "Coach studio" : "My training"}</div>
          <div className="dashboard-top-actions">
            <button className="top-icon" aria-label="Notifications" onClick={onNotifications}><Icon name="bell" size={18} /><i /></button>
            <span className="dashboard-date">SATURDAY, NOV 14</span>
          </div>
        </div>
        {children}
      </main>
      <nav className="mobile-dock" aria-label="Mobile dashboard navigation">
        {links.slice(0, 5).map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? "dock-active" : ""}><Icon name={item.icon} size={19} /><small>{item.label}</small></Link>)}
      </nav>
    </div>
  );
}

export default function FitnessPlatform() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [dialog, setDialog] = useState<"signin" | "booking" | "purchase" | "program-editor" | null>(null);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("Any city");
  const [activeConversation, setActiveConversation] = useState(0);
  const [messageText, setMessageText] = useState("");
  const [messagesByConversation, setMessagesByConversation] = useState(initialMessagesByConversation);
  const [selectedSlot, setSelectedSlot] = useState("5:30 PM");
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 10, 19));
  const [maxPrice, setMaxPrice] = useState(5000);
  const [accountRole, setAccountRole] = useState<"client" | "trainer">("client");
  const [filterOpen, setFilterOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [approved, setApproved] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("Overview");
  const [calendarDay, setCalendarDay] = useState(19);
  const [bookingMonth, setBookingMonth] = useState(new Date(2026, 10, 1));
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [playerRequest, setPlayerRequest] = useState<{ programId: string; lessonIndex: number; preview: boolean } | null>(null);
  const [callRequest, setCallRequest] = useState<CoachingCallRequest | null>(null);

  const selectedTrainer = trainers.find((trainer) => pathname.includes(trainer.id)) ?? trainers[0];
  const selectedProgram = programs.find((program) => pathname.includes(program.id)) ?? programs[0];
  const filteredTrainers = useMemo(() => trainers.filter((trainer) => {
    const matchesText = `${trainer.name} ${trainer.title} ${trainer.location} ${trainer.specialty} ${trainer.languages.join(" ")}`.toLowerCase().includes(search.toLowerCase());
    const matchesCity = city === "Any city" || trainer.location.includes(city);
    const matchesCategory = category === "All" || trainer.specialty === category;
    return matchesText && matchesCity && matchesCategory && trainer.price <= maxPrice;
  }), [category, city, maxPrice, search]);
  const filteredPrograms = useMemo(() => programs.filter((program) =>
    (category === "All" || program.category === category) &&
    program.price <= maxPrice &&
    `${program.title} ${program.trainer} ${program.category}`.toLowerCase().includes(search.toLowerCase()),
  ), [category, maxPrice, search]);
  const bookingMonthYear = bookingMonth.getFullYear();
  const bookingMonthIndex = bookingMonth.getMonth();
  const bookingMonthOffset = (new Date(bookingMonthYear, bookingMonthIndex, 1).getDay() + 6) % 7;
  const bookingMonthDayCount = new Date(bookingMonthYear, bookingMonthIndex + 1, 0).getDate();
  const bookingCalendarCellCount = Math.ceil((bookingMonthOffset + bookingMonthDayCount) / 7) * 7;
  const bookingCalendarDates = Array.from({ length: bookingCalendarCellCount }, (_, index) => {
    const day = index - bookingMonthOffset + 1;
    return day > 0 && day <= bookingMonthDayCount ? new Date(bookingMonthYear, bookingMonthIndex, day) : null;
  });
  const canGoToPreviousBookingMonth =
    bookingMonthYear > firstAvailableBookingDate.getFullYear() ||
    (bookingMonthYear === firstAvailableBookingDate.getFullYear() && bookingMonthIndex > firstAvailableBookingDate.getMonth());
  const canGoToNextBookingMonth =
    bookingMonthYear < lastAvailableBookingDate.getFullYear() ||
    (bookingMonthYear === lastAvailableBookingDate.getFullYear() && bookingMonthIndex < lastAvailableBookingDate.getMonth());

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function toggleFavorite(id: string) {
    setFavoriteIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    notify(favoriteIds.includes(id) ? "Removed from your saved coaches" : "Coach saved for later");
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = messageText.trim();
    if (!text) return;
    setMessagesByConversation((current) => ({
      ...current,
      [activeConversation]: [...current[activeConversation], { sender: "You", text, time: "Now" }],
    }));
    setMessageText("");
  }

  async function confirmBooking() {
    const timeMatch = selectedSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) {
      notify("Choose a valid session time");
      return;
    }

    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const meridiem = timeMatch[3].toUpperCase();
    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;

    const startsAt = new Date(selectedDate);
    startsAt.setHours(hours, minutes, 0, 0);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainerSlug: selectedTrainer.id,
          startsAt: startsAt.toISOString(),
          durationMinutes: 50,
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Could not book this session.");
      }

      setDialog(null);
      notify(`Session booked for ${formatBookingDate(selectedDate)} at ${selectedSlot}.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not book this session.");
    }
  }

  function confirmPurchase() {
    setDialog(null);
    notify("Program added to your library");
  }

  function openLessonPlayer(programId: string, lessonIndex?: number, preview = false) {
    setPlayerRequest({
      programId,
      lessonIndex: lessonIndex ?? completedLessonsByProgram[programId] ?? 0,
      preview,
    });
  }

  function startCoachCall(session: CoachDemoSession) {
    setCallRequest({
      role: "trainer",
      coach: trainers[0],
      clientName: session.clientName,
      clientImage: session.clientImage,
      sessionTitle: session.title,
      scheduledTime: `${session.date} · ${session.time} IST`,
    });
  }

  function joinClientCall() {
    setCallRequest({
      role: "client",
      coach: trainers[0],
      clientName: "Riya Sharma",
      clientImage: trainers[1].image,
      sessionTitle: "1:1 Strength coaching",
      scheduledTime: "THURSDAY, NOV 21 · 5:30 PM IST",
    });
  }

  const isPublicProfile = pathname.startsWith("/trainers/");
  const isTrainerApplication = pathname === "/trainer/apply";
  const isTrainerMode = pathname.startsWith("/trainer/") && !isTrainerApplication;
  const isAdminMode = pathname.startsWith("/admin");
  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/my-learning") || pathname.startsWith("/bookings") || pathname.startsWith("/messages") || pathname.startsWith("/settings") || isTrainerMode || isAdminMode;
  const isProgramDetail = pathname.startsWith("/programs/") && pathname !== "/programs";
  const publicScreen = pathname === "/" || pathname === "/discover" || pathname === "/programs" || isPublicProfile || isProgramDetail || pathname === "/login" || isTrainerApplication;

  return (
    <>
      {publicScreen && <PublicHeader onSignIn={() => setDialog("signin")} />}
      {publicScreen && (
        <main className="public-main">
          {pathname === "/" && (
            <>
              <section className="hero">
                <div className="hero-grain" />
                <div className="hero-backdrop-name" aria-hidden="true">FORGE</div>
                <div className="hero-copy">
                  <p className="eyebrow"><span /> TRAINING, BUILT AROUND YOU</p>
                  <h1>STRONGER<br />BY <em>DESIGN.</em></h1>
                  <p className="hero-description">Find your coach. Find your rhythm.<br />Build a stronger life, one good session at a time.</p>
                  <div className="hero-actions">
                    <Link href="/discover" className="button button-red">FIND YOUR COACH <Icon name="arrow" size={16} /></Link>
                    <Link href="/programs" className="button button-quiet">EXPLORE PROGRAMS <Icon name="arrow" size={15} /></Link>
                  </div>
                </div>
                <div className="hero-athlete" role="img" aria-label="Athlete in a red training top against a red backdrop" />
                <div className="hero-stat hero-stat-one"><strong>1:1</strong><span>COACHING THAT<br />GETS PERSONAL</span></div>
                <div className="hero-stat hero-stat-two"><strong>4.9<span>/5</span></strong><span>FROM PEOPLE<br />WHO SHOWED UP</span></div>
                <div className="hero-index">01 <span>/</span> 04</div>
                <div className="hero-bottom-line"><span>YOUR NEXT CHAPTER STARTS HERE</span><span>SCROLL TO EXPLORE ↓</span></div>
              </section>

              <section className="trust-strip">
                <span>GOOD TRAINING ISN’T ONE-SIZE-FITS-ALL</span>
                <div><b>01</b> Vetted, independent coaches</div><div><b>02</b> Plans made for real life</div><div><b>03</b> Your pace, your progress</div>
              </section>

              <section className="public-section programs-section">
                <SectionTitle kicker="THE WORK, YOUR WAY" title={<>Programs built<br />to move you forward.</>} action="VIEW ALL PROGRAMS" href="/programs" />
                <p className="section-intro">Expert-led plans. Clear video lessons. Lifetime access. Pick a starting point and make it yours.</p>
                <div className="program-grid">
                  {programs.slice(0, 3).map((program) => <ProgramCard key={program.id} program={program} />)}
                </div>
              </section>

              <section className="coach-feature-section">
                <div className="coach-feature-photo" style={{ backgroundImage: `linear-gradient(90deg,rgba(10,10,10,.06),rgba(10,10,10,.08)),url("${trainers[0].image}")` }}>
                  <span className="photo-caption">COACHES WHO GET IT.</span>
                </div>
                <div className="coach-feature-copy">
                  <p className="eyebrow"><span /> YOUR PEOPLE ARE OUT THERE</p>
                  <h2>GOOD COACHING<br />CHANGES <em>EVERYTHING.</em></h2>
                  <p>Not louder. Not harder. Just the right person in your corner, helping you keep the promises you make to yourself.</p>
                  <Link href="/discover" className="button button-outline">MEET THE COACHES <Icon name="arrow" size={15} /></Link>
                  <div className="feature-mini-stats"><div><strong>120+</strong><span>INDEPENDENT COACHES</span></div><div><strong>4.9 / 5</strong><span>AVERAGE CLIENT RATING</span></div></div>
                </div>
              </section>

              <section className="public-section coaches-section">
                <SectionTitle kicker="PEOPLE IN YOUR CORNER" title={<>Meet your kind<br />of coach.</>} action="FIND YOUR COACH" href="/discover" />
                <div className="coach-grid">{trainers.slice(0, 3).map((trainer) => <CoachCard key={trainer.id} trainer={trainer} onMessage={() => setDialog("signin")} isFavorite={favoriteIds.includes(trainer.id)} onFavorite={() => toggleFavorite(trainer.id)} />)}</div>
              </section>

              <section className="how-section" id="how-it-works">
                <div className="how-heading"><p className="eyebrow"><span /> A SIMPLE WAY TO BEGIN</p><h2>YOUR NEXT REP<br />STARTS <em>HERE.</em></h2></div>
                <div className="how-steps">
                  <article><span>01</span><h3>Find your fit.</h3><p>Explore coaches who understand your goals, style, and real-life schedule.</p><Icon name="search" size={20} /></article>
                  <article><span>02</span><h3>Make a plan.</h3><p>Choose a personal session or a coach-built program you can follow anywhere.</p><Icon name="calendar" size={20} /></article>
                  <article><span>03</span><h3>Keep showing up.</h3><p>Learn, ask questions, and build progress that belongs to you.</p><Icon name="spark" size={20} /></article>
                </div>
              </section>

              <section className="closing-cta">
                <div><p className="eyebrow"><span /> NO PERFECT TIME REQUIRED</p><h2>START WHERE<br />YOU <em>ARE.</em></h2></div>
                <div><p>One honest first step can change the shape of your whole year.</p><Link className="button button-red" href="/discover">LET’S BEGIN <Icon name="arrow" size={15} /></Link></div>
                <span className="cta-number">04</span>
              </section>
              <Footer />
            </>
          )}

          {pathname === "/discover" && (
            <div className="catalog-page">
              <div className="catalog-hero"><p className="eyebrow"><span /> FIND YOUR PERSON</p><h1>MEET YOUR<br /><em>COACH.</em></h1><p>Good coaching starts with a good fit. Find someone who gets where you want to go.</p></div>
              <div className="catalog-toolbar">
                <label className="search-field"><Icon name="search" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search a goal, specialty, or coach" /></label>
                <label className="select-field"><Icon name="pin" size={16} /><select value={city} onChange={(event) => setCity(event.target.value)} aria-label="Filter by city"><option>Any city</option><option>Mumbai</option><option>Bengaluru</option><option>Pune</option><option>Chennai</option></select></label>
                <button className={`button button-filter ${filterOpen ? "filter-active" : ""}`} onClick={() => setFilterOpen((value) => !value)}><Icon name="filter" size={16} /> FILTERS <span>2</span></button>
              </div>
              {filterOpen && <div className="filter-panel"><div><span className="filter-label">SPECIALTY</span><div className="filter-pills">{categoryFilters.map((item) => <button key={item} className={category === item ? "chip-active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div></div><div className="price-filter"><span className="filter-label">MAX SESSION PRICE · ₹{maxPrice.toLocaleString("en-IN")}</span><div>₹500 <input type="range" min="500" max="5000" step="100" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} aria-label="Maximum session price" /> ₹5,000</div></div><button className="filter-reset" onClick={() => { setCategory("All"); setCity("Any city"); setSearch(""); setMaxPrice(5000); }}>RESET FILTERS</button></div>}
              <div className="result-bar"><span><b>{filteredTrainers.length} coaches</b> to get you going</span><label>Sort by <select aria-label="Sort trainers"><option>Recommended</option><option>Top rated</option><option>Price: low to high</option></select></label></div>
              <div className="coach-grid catalog-coach-grid">{filteredTrainers.map((trainer) => <CoachCard key={trainer.id} trainer={trainer} onMessage={() => setDialog("signin")} isFavorite={favoriteIds.includes(trainer.id)} onFavorite={() => toggleFavorite(trainer.id)} />)}</div>
              {filteredTrainers.length === 0 && <div className="empty-results"><Icon name="search" size={24} /><h3>No coaches found just yet.</h3><p>Try a different city or specialty.</p><button className="text-link" onClick={() => { setSearch(""); setCity("Any city"); setCategory("All"); }}>Clear filters <Icon name="arrow" size={15} /></button></div>}
              <div className="become-coach"><div><p className="eyebrow"><span /> FOR THE COACHES</p><h2>YOUR PEOPLE<br />ARE LOOKING.</h2><p>Bring your coaching to a place that believes in it.</p></div><Link href="/trainer/apply" className="button button-outline">BECOME A COACH <Icon name="arrow" size={15} /></Link></div>
              <Footer />
            </div>
          )}

          {pathname === "/programs" && (
            <div className="catalog-page">
              <div className="catalog-hero programs-catalog-hero"><p className="eyebrow"><span /> A PLAN THAT FITS YOUR LIFE</p><h1>PROGRAMS<br />FOR THE <em>LONG GAME.</em></h1><p>Coach-built plans, thoughtful video lessons, and space to make progress your own.</p></div>
              <div className="program-catalog-controls"><label className="search-field"><Icon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find your next plan" /></label><div className="filter-pills">{categoryFilters.map((item) => <button key={item} className={category === item ? "chip-active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="catalog-price-filter"><span>UP TO ₹{maxPrice.toLocaleString("en-IN")}</span><input type="range" min="500" max="5000" step="100" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} aria-label="Maximum program price" /></label></div>
              <div className="result-bar"><span><b>{filteredPrograms.length} programs</b> ready when you are</span><label>Sort by <select aria-label="Sort programs"><option>Featured</option><option>Most popular</option><option>Price: low to high</option></select></label></div>
              <div className="program-grid program-catalog-grid">{filteredPrograms.map((program) => <ProgramCard key={program.id} program={program} />)}</div>
              <div className="program-note"><Icon name="spark" size={22} /><p><b>One payment. Your program to keep.</b><br />Every program includes ongoing access to all lessons and future updates.</p></div>
              <Footer />
            </div>
          )}

          {isPublicProfile && (
            <div className="detail-page">
              <div className="profile-cover" style={{ backgroundImage: `linear-gradient(90deg,rgba(8,8,8,.9),rgba(8,8,8,.2)),url("${selectedTrainer.image}")` }} />
              <div className="profile-overview">
                <div className="profile-identity"><Avatar trainer={selectedTrainer} size="lg" /><div><span className="verified-label"><Icon name="check" size={12} /> VERIFIED COACH</span><h1>{selectedTrainer.name}</h1><p>{selectedTrainer.title}</p><div className="coach-location"><Icon name="pin" size={14} /> {selectedTrainer.location} <span>·</span> {selectedTrainer.languages.join(" · ")}</div></div></div>
                <div className="profile-actions"><button className="button button-outline" onClick={() => setDialog("signin")}><Icon name="chat" size={16} /> MESSAGE</button><button className="button button-red" onClick={() => setDialog("booking")}>BOOK A SESSION <Icon name="arrow" size={15} /></button></div>
              </div>
              <div className="profile-content"><div className="profile-main"><div className="detail-tabs">{["Overview", "Programs", "Reviews"].map((item) => <button className={activeTab === item ? "detail-tab-active" : ""} key={item} onClick={() => setActiveTab(item)}>{item}</button>)}</div>
                {activeTab === "Overview" && <><p className="profile-bio">{selectedTrainer.bio}</p><h2 className="detail-heading">HOW I COACH</h2><p className="detail-copy">A clear plan, honest conversations, and progress you can actually sustain. We start with what you have — your schedule, your experience, your goals — and build from there.</p><h2 className="detail-heading">A FEW THINGS I FOCUS ON</h2><div className="specialty-chips"><span>{selectedTrainer.specialty}</span><span>Habit building</span><span>Personal coaching</span></div></>}
                {activeTab === "Programs" && <div className="mini-program-grid">{programs.filter((program) => program.trainer === selectedTrainer.name).map((program) => <ProgramCard key={program.id} program={program} />)}</div>}
                {activeTab === "Reviews" && <div className="review-card"><span className="coach-rating"><Icon name="star" size={14} /> 5.0</span><p>“For the first time, training feels like something I can keep doing. Every session has a purpose, but never feels intimidating.”</p><small>RIYA S. · CLIENT FOR 4 MONTHS</small></div>}
                <h2 className="detail-heading">A LITTLE MORE ABOUT ME</h2><div className="about-row"><span>Languages</span><b>{selectedTrainer.languages.join(", ")}</b></div><div className="about-row"><span>Coaching online</span><b>Across India</b></div></div>
                <aside className="profile-booking-card"><p className="eyebrow"><span /> WORK WITH {selectedTrainer.name.split(" ")[0].toUpperCase()}</p><h3>A good place<br />to start.</h3><p>One-on-one online coaching, built around you.</p><div><span>SESSION</span><b>₹{selectedTrainer.price.toLocaleString("en-IN")} <small>/ 50 min</small></b></div><button className="button button-red button-full" onClick={() => setDialog("booking")}>CHECK AVAILABILITY <Icon name="arrow" size={15} /></button><button className="profile-message" onClick={() => setDialog("signin")}>Have a question? Message your coach <Icon name="arrow" size={13} /></button></aside></div>
              <section className="public-section profile-programs"><SectionTitle kicker="LEARN AT YOUR OWN PACE" title={<>Programs from<br />{selectedTrainer.name.split(" ")[0]}.</>} action="ALL PROGRAMS" href="/programs" /><div className="program-grid">{programs.filter((program) => program.trainer === selectedTrainer.name).length > 0 ? programs.filter((program) => program.trainer === selectedTrainer.name).map((program) => <ProgramCard key={program.id} program={program} />) : <p className="muted-copy">New programs are on the way. Send a message to ask about coaching.</p>}</div></section>
              <Footer />
            </div>
          )}

          {isProgramDetail && (
            <div className="detail-page program-detail-page">
              <div className="program-detail-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(8,8,8,.96),rgba(8,8,8,.64) 50%,rgba(8,8,8,.05)),url("${selectedProgram.image}")` }}>
                <div><p className="eyebrow"><span /> {selectedProgram.category.toUpperCase()} · {selectedProgram.weeks} WEEKS</p><h1>{selectedProgram.title.split(" ").slice(0, -1).join(" ")}<br /><em>{selectedProgram.title.split(" ").slice(-1)}</em></h1><p>{selectedProgram.description}</p><div className="program-coach-line"><Avatar trainer={trainers.find((trainer) => trainer.name === selectedProgram.trainer) ?? trainers[0]} size="sm" /><span>Created by <b>{selectedProgram.trainer}</b></span><span className="coach-rating"><Icon name="star" size={13} /> {selectedProgram.rating}</span></div><button className="button button-red" onClick={() => setDialog("purchase")}>GET THE PROGRAM · ₹{selectedProgram.price.toLocaleString("en-IN")} <Icon name="arrow" size={15} /></button></div>
              </div>
              <div className="program-detail-content"><div><p className="eyebrow"><span /> THE PLAN</p><h2>BUILD MOMENTUM.<br /><em>YOUR WAY.</em></h2><p className="detail-copy">{selectedProgram.description} Learn directly from {selectedProgram.trainer}, with practical sessions you can revisit whenever you need.</p><div className="lesson-list"><h3>WHAT’S INSIDE <span>{selectedProgram.lessons} LESSONS</span></h3>{getProgramLessons(selectedProgram).slice(0, 4).map((lesson, index) => <button className="program-preview-lesson" type="button" key={lesson.title} onClick={() => openLessonPlayer(selectedProgram.id, index, true)}><span className="lesson-number">0{index + 1}</span><b>{lesson.title}</b><small>{formatVideoTime(lesson.duration)}</small><Icon name="play" size={14} /></button>)}</div><p className="lesson-preview-hint">Preview a sample lesson. Full access includes all {selectedProgram.lessons} lessons.</p></div><aside className="program-buy-card"><span className="program-tag">{selectedProgram.category}</span><h3>{selectedProgram.title}</h3><div className="program-buy-price">₹{selectedProgram.price.toLocaleString("en-IN")} <small>one-time</small></div><ul><li><Icon name="check" size={15} /> {selectedProgram.lessons} on-demand video lessons</li><li><Icon name="check" size={15} /> Ongoing access, yours to revisit</li><li><Icon name="check" size={15} /> Learn on your own schedule</li></ul><button className="button button-red button-full" onClick={() => setDialog("purchase")}>GET INSTANT ACCESS <Icon name="arrow" size={15} /></button><p className="secure-note">SECURE CHECKOUT · INDIA</p></aside></div>
              <Footer />
            </div>
          )}

          {isTrainerApplication && <TrainerApplicationPage notify={notify} />}
          {pathname === "/login" && <div className="login-page"><p className="eyebrow"><span /> YOUR NEXT CHAPTER</p><h1>GOOD TO HAVE<br /><em>YOU HERE.</em></h1><p>Sign in or create an account to find your people and keep your progress moving.</p><AccountTypePicker value={accountRole} onChange={setAccountRole} /><AuthForm role={accountRole} onAuthenticated={(role, needsSetup) => router.push(role === "trainer" ? needsSetup ? "/trainer/apply" : "/trainer/dashboard" : "/dashboard")} /><small>By continuing, you agree to our Terms and Privacy Policy.</small></div>}
        </main>
      )}

      {isDashboard && (
        <DashboardShell trainerMode={isTrainerMode} onNotifications={() => setNotificationOpen((value) => !value)}>
          {pathname === "/dashboard" && <ClientDashboard onBook={() => setDialog("booking")} onProgram={openLessonPlayer} />}
          {pathname === "/my-learning" && <LearningPage onProgram={(id) => openLessonPlayer(id)} />}
          {pathname === "/bookings" && <BookingsPage onBook={() => setDialog("booking")} onCancel={() => notify("Cancellation request submitted in this preview")} onJoinCall={joinClientCall} />}
          {pathname === "/messages" && <MessagesPage active={activeConversation} setActive={setActiveConversation} messages={messagesByConversation[activeConversation]} text={messageText} setText={setMessageText} onSend={sendMessage} />}
          {pathname === "/settings" && <SettingsPage notify={notify} />}
          {pathname === "/trainer/dashboard" && <TrainerDashboard onCreate={() => setDialog("program-editor")} onStartSession={startCoachCall} />}
          {pathname === "/trainer/programs" && <TrainerPrograms onCreate={() => setDialog("program-editor")} />}
          {pathname === "/trainer/clients" && <TrainerClients />}
          {pathname === "/trainer/availability" && <AvailabilityPage day={calendarDay} setDay={setCalendarDay} notify={notify} />}
          {pathname === "/trainer/earnings" && <EarningsPage />}
          {isAdminMode && <AdminPage approved={approved} setApproved={setApproved} notify={notify} />}
        </DashboardShell>
      )}

      {playerRequest && <VideoLessonPlayer program={programs.find((program) => program.id === playerRequest.programId) ?? programs[0]} initialLessonIndex={playerRequest.lessonIndex} preview={playerRequest.preview} onClose={() => setPlayerRequest(null)} />}
      {callRequest && <CoachingCallModal request={callRequest} onClose={() => setCallRequest(null)} notify={notify} />}

      {dialog === "signin" && <Modal title="Sign in to Forge" onClose={() => setDialog(null)}><div className="auth-modal"><Brand inverse /><p className="eyebrow"><span /> YOUR TRAINING, YOUR TERMS</p><h2>LET’S GET<br /><em>STARTED.</em></h2><p>Sign in or create an account. Your next step is closer than you think.</p><AccountTypePicker value={accountRole} onChange={setAccountRole} /><AuthForm role={accountRole} onAuthenticated={(role, needsSetup) => { setDialog(null); router.push(role === "trainer" ? needsSetup ? "/trainer/apply" : "/trainer/dashboard" : "/dashboard"); }} /><small>By continuing, you agree to our Terms and Privacy Policy.</small></div></Modal>}
      {dialog === "booking" && (
        <Modal title="Book a coaching session" onClose={() => setDialog(null)} wide>
          <div className="booking-modal">
            <div className="booking-modal-intro">
              <p className="eyebrow"><span /> YOUR FIRST SESSION</p>
              <h2>LET’S FIND<br /><em>YOUR TIME.</em></h2>
              <p>Online coaching with {selectedTrainer.name}. Pick a date and a time that works for you.</p>
              <div className="booking-coach"><Avatar trainer={selectedTrainer} /><span><b>{selectedTrainer.name}</b><small>50 min · Online · ₹{selectedTrainer.price.toLocaleString("en-IN")}</small></span></div>
            </div>
            <div className="booking-picker">
              <div className="picker-heading">
                <button type="button" aria-label="Previous month" disabled={!canGoToPreviousBookingMonth} onClick={() => setBookingMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
                <b>{bookingMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()}</b>
                <button type="button" aria-label="Next month" disabled={!canGoToNextBookingMonth} onClick={() => setBookingMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
              </div>
              <div className="date-grid" aria-label="Choose a session date">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => (
                  <span className="date-day" aria-label={day} key={day}>{["M", "T", "W", "T", "F", "S", "S"][index]}</span>
                ))}
                {bookingCalendarDates.map((date, index) => date ? (
                  <button
                    type="button"
                    key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                    disabled={date < firstAvailableBookingDate || date > lastAvailableBookingDate}
                    className={selectedDate.getTime() === date.getTime() ? "date-selected" : ""}
                    aria-label={date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    aria-pressed={selectedDate.getTime() === date.getTime()}
                    onClick={() => setSelectedDate(date)}
                  >
                    {date.getDate()}
                  </button>
                ) : <span className="calendar-empty" aria-hidden="true" key={`empty-${index}`} />)}
              </div>
              <p className="slot-label">AVAILABLE TIMES · {formatBookingDate(selectedDate).toUpperCase()} · IST</p>
              <div className="slot-grid">
                {["10:00 AM", "12:30 PM", "3:00 PM", "5:30 PM"].map((slot) => (
                  <button type="button" key={slot} className={selectedSlot === slot ? "slot-selected" : ""} aria-pressed={selectedSlot === slot} onClick={() => setSelectedSlot(slot)}>{slot}</button>
                ))}
              </div>
              <button className="button button-red button-full" onClick={confirmBooking}>REQUEST SESSION <Icon name="arrow" size={15} /></button>
              <small className="booking-fineprint">Demo only — this preview doesn’t create a booking or process payment.</small>
            </div>
          </div>
        </Modal>
      )}
      {dialog === "purchase" && <Modal title="Get program access" onClose={() => setDialog(null)}><div className="purchase-modal"><p className="eyebrow"><span /> ONE PAYMENT. YOURS TO KEEP.</p><h2>READY TO<br /><em>GET STRONGER?</em></h2><div className="purchase-line" style={{ backgroundImage: `url("${selectedProgram.image}")` }} /><div className="purchase-row"><span>{selectedProgram.title}<small>{selectedProgram.weeks} weeks · {selectedProgram.lessons} video lessons</small></span><b>₹{selectedProgram.price.toLocaleString("en-IN")}</b></div><div className="purchase-row purchase-total"><span>Total today</span><b>₹{selectedProgram.price.toLocaleString("en-IN")}</b></div><button className="button button-red button-full" onClick={confirmPurchase}>CONTINUE TO SECURE CHECKOUT <Icon name="arrow" size={15} /></button><small>Demo only — no payment will be processed.</small></div></Modal>}
      {dialog === "program-editor" && <ProgramEditorModal onClose={() => setDialog(null)} onSave={() => { setDialog(null); notify("Draft saved in this preview"); }} notify={notify} />}
      {toast && <div className="toast-message"><Icon name="check" size={16} />{toast}</div>}
      {notificationOpen && <div className="notification-popover"><b>You’re all caught up</b><p>Your next session is on Thursday at 5:30 PM.</p><button onClick={() => setNotificationOpen(false)}>Got it</button></div>}
    </>
  );
}

function DashboardHeading({ kicker, title, subtitle, action }: { kicker: string; title: ReactNode; subtitle: string; action?: ReactNode }) {
  return <div className="dashboard-heading"><div><p className="eyebrow"><span />{kicker}</p><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

async function readApplicationResponse(
  response: Response,
  fallbackMessage: string,
): Promise<Record<string, unknown>> {
  const body = await response.text();
  let result: unknown;

  try {
    result = JSON.parse(body);
  } catch {
    throw new Error(`${fallbackMessage} (server returned HTTP ${response.status}).`);
  }

  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    throw new Error(`${fallbackMessage} (server returned an invalid response).`);
  }

  const payload = result as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string" ? payload.error : `${fallbackMessage} (HTTP ${response.status}).`,
    );
  }

  return payload;
}

function TrainerApplicationPage({ notify }: { notify: (message: string) => void }) {
  const router = useRouter();
  const [pageState, setPageState] = useState<"checking" | "signed-out" | "client-account" | "new" | "pending" | "error">("checking");
  const [pageMessage, setPageMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    fetch("/api/trainer-applications")
      .then(async (response) => {
        if (response.status === 401) {
          if (active) setPageState("signed-out");
          return;
        }

        const result = await readApplicationResponse(response, "Could not load your coach application.");
        if (result.profileRole !== null && result.profileRole !== "client" && result.profileRole !== "trainer") {
          throw new Error("The server returned an invalid account role.");
        }
        if (!Array.isArray(result.applications)) {
          throw new Error("The server returned an invalid coach application list.");
        }

        const latestApplication = result.applications[0];
        const latestStatus = typeof latestApplication === "object" && latestApplication !== null &&
          "status" in latestApplication && typeof latestApplication.status === "string"
          ? latestApplication.status
          : null;
        if (!active) return;
        if (result.profileRole === "client") {
          setPageState("client-account");
        } else if (latestStatus === "pending") {
          setPageState("pending");
        } else if (latestStatus === "approved") {
          router.replace("/trainer/dashboard");
        } else {
          setPageState("new");
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setPageState("error");
        setPageMessage(error instanceof Error ? error.message : "Could not load your coach application.");
      });

    return () => {
      active = false;
    };
  }, [refreshKey, router]);

  async function switchToCoachAccount() {
    setPageMessage("");
    try {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message);
      setPageState("signed-out");
    } catch (error) {
      setPageMessage(error instanceof Error ? error.message : "Could not switch accounts.");
    }
  }

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const data = Object.fromEntries(form.entries());
    setSubmitting(true);
    setPageMessage("");

    try {
      const response = await fetch("/api/trainer-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          city: data.city,
          specialty: data.specialty,
          languages: data.languages,
          approach: data.approach,
          badges: data.badges,
          sessionPrice: Number(data.sessionPrice),
        }),
      });
      const result = await readApplicationResponse(response, "Could not submit the application.");
      if (
        typeof result.application !== "object" || result.application === null ||
        !("status" in result.application) || result.application.status !== "pending"
      ) {
        throw new Error("The server returned an invalid application response.");
      }
      formElement.reset();
      setPageState("pending");
      notify("Coach application submitted for review");
    } catch (error) {
      setPageMessage(error instanceof Error ? error.message : "Could not submit the application.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="trainer-application-page">
      <div className="application-intro">
        <p className="eyebrow"><span /> A PLACE FOR YOUR KIND OF COACHING</p>
        <h1>YOUR WORK.<br />YOUR <em>PEOPLE.</em></h1>
        <p>Bring your coaching to a community that believes progress should feel personal. Tell us a little about how you coach.</p>
        <div className="application-points"><span><Icon name="check" size={15} /> Your own coach profile</span><span><Icon name="check" size={15} /> Programs you create and price</span><span><Icon name="check" size={15} /> Clients who choose your approach</span></div>
      </div>
      {pageState === "checking" && <div className="application-form" aria-live="polite">Checking your coach account…</div>}
      {pageState === "client-account" && (
        <section className="application-form application-status">
          <p className="eyebrow"><span /> CLIENT ACCOUNT ACTIVE</p>
          <h2>USE YOUR<br /><em>COACH LOGIN.</em></h2>
          <p>You’re signed in with a client account. To keep your coaching profile separate, switch accounts and sign in or create a coach account with its own credentials.</p>
          {pageMessage && <p className="application-feedback" role="alert">{pageMessage}</p>}
          <button className="button button-red button-full" onClick={switchToCoachAccount} type="button">SWITCH TO A COACH ACCOUNT <Icon name="arrow" size={15} /></button>
        </section>
      )}
      {pageState === "signed-out" && (
        <div className="application-form">
          <p className="eyebrow"><span /> YOUR COACH ACCOUNT</p>
          <h2>FIRST, LET’S<br /><em>GET YOU IN.</em></h2>
          <p className="application-help">Create or sign in to a dedicated coach account. Once you’re in, you can build your profile here.</p>
          <AuthForm
            role="trainer"
            onAuthenticated={(role, needsSetup) => {
              if (role === "trainer" && needsSetup) setRefreshKey((current) => current + 1);
              else if (role === "trainer") router.replace("/trainer/dashboard");
            }}
          />
        </div>
      )}
      {pageState === "pending" && (
        <section className="application-form application-status" role="status">
          <p className="eyebrow"><span /> APPLICATION RECEIVED</p>
          <h2>YOU’RE ON<br /><em>OUR RADAR.</em></h2>
          <p>Your coach profile is being reviewed. We’ll let you know when it’s ready to meet clients.</p>
        </section>
      )}
      {pageState === "error" && (
        <section className="application-form" role="alert">
          <p>{pageMessage}</p>
          <button className="button button-outline" onClick={() => setRefreshKey((current) => current + 1)} type="button">TRY AGAIN</button>
        </section>
      )}
      {pageState === "new" && (
        <form className="application-form" onSubmit={submitApplication}>
          <p className="eyebrow"><span /> COACH PROFILE · 01 / 01</p>
          <h2>LET’S GET TO<br /><em>KNOW YOU.</em></h2>
          <div className="editor-row"><label>Your name<input autoComplete="name" name="name" required placeholder="e.g. Arjun Mehta" /></label><label>City, state<input autoComplete="address-level2" name="city" required placeholder="e.g. Mumbai, Maharashtra" /></label></div>
          <label>Your expertise<select name="specialty" defaultValue="" required><option value="" disabled>Choose your main expertise</option><option>Strength & conditioning</option><option>Mobility & movement</option><option>Running & endurance</option><option>Nutrition & habits</option></select></label>
          <label>Languages you coach in<input name="languages" required placeholder="English, Hindi, ..." /></label>
          <label>Certifications & badges<input name="badges" placeholder="e.g. ACE-CPT, Precision Nutrition" /></label>
          <label>Charge per 50-minute session (₹)<input name="sessionPrice" type="number" min="1" max="100000" required defaultValue="1500" /></label>
          <label>Your coaching approach<textarea name="approach" required rows={4} placeholder="What can clients expect when they work with you?" /></label>
          {pageMessage && <p className="application-feedback" role="alert">{pageMessage}</p>}
          <label className="credential-confirm"><input type="checkbox" required /><span>I confirm my profile information is accurate and I’m ready to coach clients online.</span></label>
          <button className="button button-red button-full" disabled={submitting} type="submit">{submitting ? "SUBMITTING…" : "SUBMIT FOR REVIEW"} <Icon name="arrow" size={15} /></button>
          <small>Your profile goes public after our team reviews it.</small>
        </form>
      )}
    </div>
  );
}

function ClientDashboard({ onBook, onProgram }: { onBook: () => void; onProgram: (id: string) => void }) {
  return (
    <div className="dashboard-content">
      <DashboardHeading kicker="SATURDAY, NOV 14" title={<>Good morning, <em>Riya.</em></>} subtitle="A little progress adds up. Here’s your week at a glance." action={<button className="button button-red" onClick={onBook}><Icon name="plus" size={16} /> BOOK A SESSION</button>} />
      <div className="welcome-banner"><div><span>YOUR NEXT SESSION</span><h2>Let’s get stronger.</h2><p>with Arjun Mehta · Thursday, Nov 19 · 5:30 PM</p><Link href="/bookings">VIEW BOOKING <Icon name="arrow" size={14} /></Link></div><div className="banner-date"><b>19</b><span>NOV<br />THU</span></div><div className="banner-bg-word">SHOW UP</div></div>
      <div className="stat-grid"><div className="stat-card"><span>PROGRAMS IN PROGRESS</span><b>02</b><small>One good day at a time.</small></div><div className="stat-card"><span>SESSIONS THIS MONTH</span><b>03</b><small>↑ 1 more than last month</small></div><div className="stat-card"><span>YOUR STREAK</span><b>12 <i>DAYS</i></b><small>That’s worth celebrating.</small></div></div>
      <div className="dashboard-section-heading"><div><p className="eyebrow"><span /> PICK UP WHERE YOU LEFT OFF</p><h2>Your programs</h2></div><Link className="text-link" href="/my-learning">MY LIBRARY <Icon name="arrow" size={14} /></Link></div>
      <div className="learning-cards">
        {programs.slice(0, 2).map((program) => {
          const completed = completedLessonsByProgram[program.id] ?? 0;
          const currentWeek = Math.min(program.weeks, Math.floor((completed / program.lessons) * program.weeks) + 1);
          return (
            <article className="learning-card" key={program.id}>
              <div className="learning-cover" style={{ backgroundImage: `linear-gradient(180deg,transparent,rgba(0,0,0,.48)),url("${program.image}")` }}>
                <span>{program.category}</span><b>WEEK {currentWeek.toString().padStart(2, "0")}</b>
              </div>
              <div className="learning-body">
                <h3>{program.title}</h3><p>with {program.trainer}</p>
                <div className="learning-progress"><span><i style={{ width: `${(completed / program.lessons) * 100}%` }} /></span><small>{completed} of {program.lessons} lessons</small></div>
                <button type="button" onClick={() => onProgram(program.id)}>CONTINUE LEARNING <Icon name="arrow" size={13} /></button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="dashboard-bottom-grid"><section className="dashboard-panel"><div className="panel-heading"><h3>UP NEXT</h3><Link href="/bookings">ALL BOOKINGS <Icon name="arrow" size={13} /></Link></div><div className="up-next-row"><div className="date-block"><b>19</b><span>NOV</span></div><div><b>1:1 Strength coaching</b><small>Arjun Mehta · 5:30 PM · Online</small></div><span className="status-pill">CONFIRMED</span></div></section><section className="dashboard-panel quote-panel"><Icon name="spark" size={18} /><p>“The goal isn’t to be perfect. It’s to keep coming back.”</p><small>A NOTE FOR YOUR WEEK</small></section></div>
    </div>
  );
}

function LearningPage({ onProgram }: { onProgram: (id: string) => void }) {
  const [tab, setTab] = useState("In progress");
  return (
    <div className="dashboard-content">
      <DashboardHeading kicker="YOUR OWN PACE" title={<>Your <em>programs.</em></>} subtitle="Everything you’ve chosen to work on, all in one place." action={<Link className="button button-red" href="/programs">FIND A PROGRAM <Icon name="arrow" size={15} /></Link>} />
      <div className="content-tabs">{["In progress", "Saved", "Completed"].map((item) => <button className={tab === item ? "content-tab-active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}</div>
      {tab === "In progress" ? (
        <div className="learning-library">
          {programs.slice(0, 3).map((program) => {
            const completed = completedLessonsByProgram[program.id] ?? 0;
            const currentWeek = Math.min(program.weeks, Math.floor((completed / program.lessons) * program.weeks) + 1);
            return (
              <article className="library-card" key={program.id}>
                <button type="button" className="library-image" style={{ backgroundImage: `linear-gradient(180deg,transparent,rgba(0,0,0,.4)),url("${program.image}")` }} onClick={() => onProgram(program.id)} aria-label={`Play ${program.title}`}>
                  <span><Icon name="play" size={17} /></span><small>{program.weeks} WEEKS</small>
                </button>
                <div>
                  <span className="eyebrow"><span /> {program.category} · WEEK {currentWeek}</span>
                  <h3>{program.title}</h3><p>with {program.trainer}</p>
                  <div className="learning-progress"><span><i style={{ width: `${(completed / program.lessons) * 100}%` }} /></span><small>{completed} / {program.lessons} lessons</small></div>
                  <button type="button" className="text-link" onClick={() => onProgram(program.id)}>CONTINUE <Icon name="arrow" size={14} /></button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-panel"><Icon name="book" size={25} /><h3>{tab === "Saved" ? "A little space for later." : "Your next milestone is waiting."}</h3><p>{tab === "Saved" ? "Save a program from the library to find it here." : "Complete a program and your achievement will live here."}</p><Link href="/programs" className="button button-outline">EXPLORE PROGRAMS <Icon name="arrow" size={14} /></Link></div>
      )}
    </div>
  );
}

function BookingsPage({ onBook, onCancel, onJoinCall }: { onBook: () => void; onCancel: () => void; onJoinCall: () => void }) {
  const [manageStep, setManageStep] = useState<"options" | "confirm-cancel" | null>(null);

  function confirmCancellation() {
    setManageStep(null);
    onCancel();
  }

  return (
    <div className="dashboard-content">
      <DashboardHeading kicker="MAKE TIME FOR YOU" title={<>Your <em>bookings.</em></>} subtitle="Sessions, links, and a little more accountability." action={<button className="button button-red" onClick={onBook}><Icon name="plus" size={15} /> BOOK A SESSION</button>} />
      <LiveBookings />
      <div className="content-tabs"><button className="content-tab-active">Upcoming <span>1</span></button><button>Past sessions</button></div>
      <div className="booking-list">
        <article className="booking-card">
          <div className="booking-date-large"><span>THU</span><b>21</b><small>MAY 2026</small></div>
          <div className="booking-card-main">
            <span className="status-pill">CONFIRMED</span>
            <h3>1:1 Strength coaching</h3>
            <p>50 minutes · Online session</p>
            <div className="booking-coach"><Avatar trainer={trainers[0]} size="sm" /><span><b>Arjun Mehta</b><small>Strength & conditioning coach</small></span></div>
          </div>
          <div className="booking-card-side">
            <span>5:30 PM IST</span>
            <button className="button button-red" onClick={onJoinCall}><Icon name="video" size={14} /> JOIN SESSION</button>
            <button className="button button-outline" onClick={() => setManageStep("options")}>MANAGE BOOKING <Icon name="chevron" size={14} /></button>
            <small>Demo call · no live video</small>
          </div>
        </article>
        <div className="booking-policy"><Icon name="clock" size={17} /><span><b>Plans change. We get it.</b> Cancel or reschedule up to 24 hours before your session.</span><Link href="/settings">POLICY</Link></div>
      </div>
      <section className="past-bookings">
        <div className="panel-heading"><h3>PAST SESSIONS</h3><span>APRIL 2026</span></div>
        <div className="past-session-row"><span className="past-date">APR 30</span><span><b>Strength & form check-in</b><small>Arjun Mehta · 50 minutes</small></span><span className="status-done"><Icon name="check" size={13} /> COMPLETED</span><button onClick={onBook}>BOOK AGAIN <Icon name="arrow" size={13} /></button></div>
      </section>
      {manageStep === "options" && (
        <Modal title="Manage your booking" onClose={() => setManageStep(null)}>
          <div className="manage-booking-modal">
            <p className="eyebrow"><span /> BOOKING OPTIONS</p>
            <h2>YOUR SESSION.</h2>
            <div className="manage-booking-summary">
              <span className="status-pill">CONFIRMED</span>
              <b>1:1 Strength coaching</b>
              <span>Thursday, November 21 · 5:30 PM IST</span>
              <span>50 minutes · Online with Arjun Mehta</span>
            </div>
            <p className="manage-booking-note">Your booking is unchanged. Choose “Request cancellation” only if you want to send a cancellation request.</p>
            <div className="manage-booking-actions">
              <button className="button button-outline" onClick={() => setManageStep(null)}>KEEP BOOKING</button>
              <button className="button button-red" onClick={() => setManageStep("confirm-cancel")}>REQUEST CANCELLATION</button>
            </div>
          </div>
        </Modal>
      )}
      {manageStep === "confirm-cancel" && (
        <Modal title="Confirm cancellation request" onClose={() => setManageStep(null)}>
          <div className="manage-booking-modal">
            <p className="eyebrow"><span /> FINAL CHECK</p>
            <h2>REQUEST<br /><em>CANCELLATION?</em></h2>
            <p className="manage-booking-note">This will submit a request to cancel your 1:1 Strength coaching session with Arjun Mehta on Thursday, November 21 at 5:30 PM IST. You can still keep your booking instead.</p>
            <div className="manage-booking-actions">
              <button className="button button-outline" onClick={() => setManageStep("options")}>GO BACK</button>
              <button className="button button-red" onClick={confirmCancellation}>CONFIRM REQUEST</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MessagesPage({ active, setActive, messages, text, setText, onSend }: { active: number; setActive: (index: number) => void; messages: typeof initialMessages; text: string; setText: (value: string) => void; onSend: (event: FormEvent<HTMLFormElement>) => void }) {
  const [query, setQuery] = useState("");
  const conversation = conversations[active];
  const filteredConversations = conversations
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => `${item.name} ${item.message}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="dashboard-content message-page-content">
      <DashboardHeading kicker="A GOOD CONVERSATION GOES A LONG WAY" title={<>Your <em>messages.</em></>} subtitle="Talk goals, ask questions, and figure out your next step together." />
      <div className="messenger">
        <aside className="conversation-list" aria-label="Conversations">
          <label className="conversation-search">
            <Icon name="search" size={16} />
            <input type="search" aria-label="Search conversations" placeholder="Search conversations" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          {filteredConversations.map(({ item, index }) => (
            <button className={`conversation-item ${active === index ? "conversation-active" : ""}`} aria-pressed={active === index} onClick={() => setActive(index)} key={item.name}>
              <Avatar trainer={item.trainer} />
              <span><b>{item.name}</b><small>{item.message}</small></span>
              <i>{item.time}</i>
              {item.unread > 0 && <em>{item.unread}</em>}
            </button>
          ))}
          {filteredConversations.length === 0 && <p className="conversation-empty">No conversations found.</p>}
        </aside>
        <section className="chat-window" aria-label={`Conversation with ${conversation.name}`}>
          <header className="chat-header">
            <Avatar trainer={conversation.trainer} size="sm" />
            <div><b>{conversation.name}</b><small><i /> Usually replies in a few hours</small></div>
            <Link href={`/trainers/${conversation.trainer.id}`} aria-label="View coach profile"><Icon name="users" size={17} /></Link>
          </header>
          <div className="chat-context"><Icon name="spark" size={16} /><span>Getting to know {conversation.name.split(" ")[0]}? Ask about their approach, availability, or programs.</span></div>
          <div className="chat-messages" role="log" aria-label={`Messages with ${conversation.name}`} aria-live="polite">
            {messages.map((item, index) => (
              <div key={`${item.time}-${index}`} className={`chat-message ${item.sender === "You" ? "message-mine" : ""}`}>
                {item.sender !== "You" && <Avatar trainer={conversation.trainer} size="sm" />}
                <div><span>{item.text}</span><small>{item.time}</small></div>
              </div>
            ))}
          </div>
          <form className="chat-compose" onSubmit={onSend}>
            <input value={text} onChange={(event) => setText(event.target.value)} placeholder={`Message ${conversation.name.split(" ")[0]}...`} aria-label="Write a message" />
            <button type="submit" aria-label="Send message" disabled={!text.trim()}><Icon name="arrow" size={17} /></button>
            <small>Keep it kind. Keep it about coaching.</small>
          </form>
        </section>
      </div>
    </div>
  );
}

function SettingsPage({ notify }: { notify: (message: string) => void }) {
  const [settingsTab, setSettingsTab] = useState("Profile");
  return <div className="dashboard-content"><DashboardHeading kicker="THE DETAILS" title={<>Your <em>settings.</em></>} subtitle="Make this space feel a little more like yours." /><div className="settings-layout"><nav>{["Profile", "Notifications", "Privacy", "Payments"].map((item) => <button className={settingsTab === item ? "settings-active" : ""} onClick={() => setSettingsTab(item)} key={item}>{item}</button>)}</nav><section className="settings-panel"><h2>{settingsTab} details</h2><p>Manage your {settingsTab.toLowerCase()} preferences.</p>{settingsTab === "Profile" ? <><div className="setting-avatar"><Avatar trainer={trainers[1]} size="lg" /><button onClick={() => notify("Photo upload is a UI preview only")}>CHANGE PHOTO</button></div><div className="editor-row"><label>First name<input defaultValue="Riya" /></label><label>Last name<input defaultValue="Sharma" /></label></div><label>Email address<input defaultValue="riya.sharma@email.com" /></label><label>City<input defaultValue="Bengaluru, Karnataka" /></label></> : <div className="settings-toggles">{["Product updates", "Session reminders", "New messages", "Personalized recommendations"].map((item, index) => <label key={item}><span><b>{item}</b><small>Choose how Forge keeps you in the loop.</small></span><input type="checkbox" defaultChecked={index < 3} /></label>)}</div>}<button className="button button-red" onClick={() => notify(`${settingsTab} preferences saved`)}>SAVE CHANGES <Icon name="arrow" size={14} /></button></section></div></div>;
}

function TrainerDashboard({ onCreate, onStartSession }: { onCreate: () => void; onStartSession: (session: CoachDemoSession) => void }) {
  return (
    <div className="dashboard-content">
      <DashboardHeading kicker="MONDAY, MAY 18" title={<>Good morning, <em>Arjun.</em></>} subtitle="Your coaching, your craft. Here’s what’s happening this week." action={<button className="button button-red" onClick={onCreate}><Icon name="plus" size={15} /> NEW PROGRAM</button>} />
      <div className="coach-welcome-banner"><div><span>YOUR COACH STUDIO</span><h2>Keep doing the work<br />that changes things.</h2><p>4 clients are moving with you this week.</p></div><div className="coach-welcome-mark">F.</div></div>
      <div className="stat-grid trainer-stats">
        <div className="stat-card"><span>THIS MONTH’S EARNINGS</span><b>₹48,600</b><small className="positive">↑ 12% from last month</small></div>
        <div className="stat-card"><span>ACTIVE CLIENTS</span><b>18</b><small>4 have sessions this week</small></div>
        <div className="stat-card"><span>PROGRAM SALES</span><b>32</b><small>Across 3 published plans</small></div>
        <div className="stat-card"><span>YOUR RATING</span><b>4.98 <i>★</i></b><small>From 126 client reviews</small></div>
      </div>
      <div className="trainer-dashboard-grid">
        <section className="dashboard-panel">
          <div className="panel-heading"><h3>THIS WEEK</h3><Link href="/trainer/availability">AVAILABILITY <Icon name="arrow" size={13} /></Link></div>
          {coachDemoSessions.map((session) => (
            <div className="schedule-row" key={`${session.date}-${session.clientName}`}>
              <span className="schedule-date">{session.date}</span>
              <span className="schedule-time">{session.time}</span>
              <span><b>{session.title}</b><small>{session.clientName} · Online</small></span>
              <button className="schedule-start" type="button" onClick={() => onStartSession(session)} aria-label={`Start session with ${session.clientName}`}><Icon name="video" size={14} /><span>START</span></button>
            </div>
          ))}
        </section>
        <section className="dashboard-panel earnings-mini">
          <div className="panel-heading"><h3>YOUR EARNINGS</h3><Link href="/trainer/earnings">DETAILS <Icon name="arrow" size={13} /></Link></div>
          <div className="chart-total"><b>₹48,600</b><span>THIS MONTH <i>+12.4%</i></span></div>
          <div className="bar-chart" aria-label="Monthly earnings chart">{[34, 52, 44, 71, 57, 84, 66, 94, 62, 79, 58, 88].map((height, index) => <span key={index} style={{ height: `${height}%` }} className={index === 7 ? "bar-highlight" : ""} />)}</div>
          <div className="chart-labels"><span>WEEK 01</span><span>WEEK 02</span><span>WEEK 03</span><span>WEEK 04</span></div>
        </section>
      </div>
      <section className="dashboard-panel client-activity-panel">
        <div className="panel-heading"><h3>CLIENT MOMENTUM</h3><Link href="/trainer/clients">ALL CLIENTS <Icon name="arrow" size={13} /></Link></div>
        {trainers.slice(1, 4).map((trainer, index) => (
          <div className="client-activity-row" key={trainer.id}>
            <Avatar trainer={trainer} size="sm" />
            <span><b>{["Priya Nair", "Dev Kumar", "Sana Ali"][index]}</b><small>{["Strong Start · Week 4", "Run Your First 10K · Week 2", "Move Better · Week 1"][index]}</small></span>
            <div className="activity-progress"><i style={{ width: `${[72, 43, 24][index]}%` }} /></div>
            <small>{[72, 43, 24][index]}%</small>
            <span className="activity-status">ON TRACK</span>
          </div>
        ))}
      </section>
    </div>
  );
}

function TrainerPrograms({ onCreate }: { onCreate: () => void }) {
  return <div className="dashboard-content"><DashboardHeading kicker="YOUR KNOW-HOW, SHARED" title={<>Your <em>programs.</em></>} subtitle="Create thoughtful plans your clients can keep coming back to." action={<button className="button button-red" onClick={onCreate}><Icon name="plus" size={15} /> CREATE PROGRAM</button>} /><div className="trainer-program-stats"><div><span>PUBLISHED</span><b>03</b></div><div><span>PROGRAM SALES</span><b>86</b></div><div><span>AVG. RATING</span><b>4.9 <i>★</i></b></div></div><div className="trainer-program-grid">{programs.filter((item) => item.trainer === "Arjun Mehta").concat(programs.slice(1, 3)).map((program, index) => <article className="trainer-program-card" key={`${program.id}-${index}`}><div className="trainer-program-cover" style={{ backgroundImage: `linear-gradient(180deg,transparent,rgba(0,0,0,.58)),url("${program.image}")` }}><span className="status-pill">PUBLISHED</span><button aria-label="Program options">···</button><b>{program.category}</b></div><div><h3>{program.title}</h3><p>{program.weeks} weeks · {program.lessons} video lessons</p><div><span>{[42, 28, 16][index % 3]} SALES</span><b>₹{program.price.toLocaleString("en-IN")}</b></div></div></article>)}</div></div>;
}

function TrainerClients() {
  return <div className="dashboard-content"><DashboardHeading kicker="THE PEOPLE YOU COACH" title={<>Your <em>clients.</em></>} subtitle="A little context makes every check-in more meaningful." action={<label className="search-field client-search"><Icon name="search" size={16} /><input placeholder="Search clients" /></label>} /><div className="client-table"><div className="client-table-head"><span>CLIENT</span><span>PROGRAM / GOAL</span><span>LAST ACTIVE</span><span>PROGRESS</span><span>STATUS</span></div>{["Riya Sharma", "Priya Nair", "Dev Kumar", "Sana Ali", "Meera Shah"].map((name, index) => <div className="client-table-row" key={name}><span className="client-name-cell"><Avatar trainer={trainers[index % trainers.length]} size="sm" /><b>{name}</b></span><span>{["The Strong Start · W4", "The Strong Start · W6", "Run Your First 10K · W2", "Move Better · W1", "The Strong Start · W3"][index]}</span><span>{["Today", "2 hours ago", "Yesterday", "May 16", "May 15"][index]}</span><span><i className="table-progress"><b style={{ width: `${[62, 83, 43, 24, 51][index]}%` }} /></i> {[62, 83, 43, 24, 51][index]}%</span><span className="activity-status">{index === 3 ? "NEEDS CHECK-IN" : "ON TRACK"}</span></div>)}</div></div>;
}

function AvailabilityPage({ day, setDay, notify }: { day: number; setDay: (day: number) => void; notify: (message: string) => void }) {
  const [slots, setSlots] = useState(["10:00 AM", "12:30 PM", "5:30 PM"]);
  async function saveAvailability() {
    try {
      for (const slot of slots) {
        const match = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) continue;
        let hours = Number(match[1]);
        const minutes = Number(match[2]);
        if (match[3].toUpperCase() === "PM" && hours !== 12) hours += 12;
        if (match[3].toUpperCase() === "AM" && hours === 12) hours = 0;
        const startsAt = new Date(2026, 10, day, hours, minutes);
        const response = await fetch("/api/availability", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startsAt: startsAt.toISOString(), durationMinutes: 50 }),
        });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Could not save availability.");
      }
      notify("Availability saved");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save availability.");
    }
  }

  return <div className="dashboard-content"><DashboardHeading kicker="MAKE SPACE FOR YOUR WORK" title={<>Your <em>availability.</em></>} subtitle="Choose when clients can book time with you. Changes stay in your control." action={<button className="button button-red" onClick={saveAvailability}>SAVE AVAILABILITY <Icon name="check" size={15} /></button>} /><div className="availability-layout"><section className="dashboard-panel availability-calendar"><div className="picker-heading"><button onClick={() => notify("Previous month")}>‹</button><b>NOVEMBER 2026</b><button onClick={() => notify("Next month")}>›</button></div><div className="availability-grid">{["M", "T", "W", "T", "F", "S", "S"].map((label, index) => <span className="date-day" key={`${label}${index}`}>{label}</span>)}{Array.from({ length: 35 }, (_, index) => index < 6 ? null : <button className={`${day === index - 5 ? "date-selected" : ""} ${index % 5 === 0 ? "calendar-has-slot" : ""}`} key={index} onClick={() => setDay(index - 5)}>{index - 5}</button>)}</div><div className="calendar-legend"><span><i /> Available hours</span><span><i /> Session booked</span></div></section><section className="dashboard-panel slot-editor"><p className="eyebrow"><span /> {day} NOVEMBER</p><h2>Make room<br />for a good session.</h2><p>50-minute online coaching · IST</p><div className="availability-slots">{["9:00 AM", "10:00 AM", "12:30 PM", "3:00 PM", "5:30 PM", "7:00 PM"].map((slot) => <button className={slots.includes(slot) ? "slot-selected" : ""} key={slot} onClick={() => setSlots((current) => current.includes(slot) ? current.filter((item) => item !== slot) : [...current, slot])}>{slots.includes(slot) && <Icon name="check" size={13} />}{slot}</button>)}</div><button className="add-slot" onClick={() => notify("Custom slot picker is a UI preview only")}><Icon name="plus" size={15} /> ADD A CUSTOM SLOT</button><div className="booking-window-info"><Icon name="clock" size={16} /><span>Clients can book 12 hours ahead<br />and up to 60 days in advance.</span></div></section></div></div>;
}

function EarningsPage() {
  return <div className="dashboard-content"><DashboardHeading kicker="YOUR CRAFT, YOUR LIVELIHOOD" title={<>Your <em>earnings.</em></>} subtitle="A clear view of what you’ve earned and what’s on its way." action={<button className="button button-outline">MAY 2026 <Icon name="chevron" size={14} /></button>} /><div className="earnings-highlight"><div><span>NET EARNINGS · MAY 2026</span><b>₹48,600</b><small>After 10% platform commission</small></div><div className="earnings-chart">{[30, 55, 42, 74, 59, 92, 63, 81, 69, 100, 60, 85].map((value, index) => <i key={index} style={{ height: `${value}%` }} className={index === 9 ? "bar-highlight" : ""} />)}</div><div className="chart-labels"><span>MAY 01</span><span>MAY 10</span><span>MAY 20</span><span>MAY 31</span></div></div><div className="stat-grid"><div className="stat-card"><span>GROSS SALES</span><b>₹54,000</b><small>Before platform commission</small></div><div className="stat-card"><span>PLATFORM COMMISSION</span><b>₹5,400</b><small>10% of your sales</small></div><div className="stat-card"><span>UPCOMING PAYOUT</span><b>₹12,150</b><small>Expected May 22</small></div></div><section className="dashboard-panel transactions-panel"><div className="panel-heading"><h3>RECENT ACTIVITY</h3><button>DOWNLOAD STATEMENT <Icon name="arrow" size={13} /></button></div>{[["May 18", "1:1 coaching · Riya Sharma", "₹1,800", "Session · pending"], ["May 17", "The Strong Start · 3 sales", "₹6,747", "Program · weekly"], ["May 15", "1:1 coaching · Dev Kumar", "₹1,800", "Session · paid"], ["May 12", "The Strong Start · 2 sales", "₹4,498", "Program · weekly"]].map((row) => <div className="transaction-row" key={row[0]}><span>{row[0]}</span><b>{row[1]}</b><span>{row[2]}</span><small>{row[3]}</small></div>)}</section></div>;
}

function AdminPage({ approved, setApproved, notify }: { approved: string[]; setApproved: (value: string[]) => void; notify: (message: string) => void }) {
  const requests = [{ name: "Nikhil Verma", specialty: "Strength & conditioning", city: "Delhi, NCR", date: "May 17", image: trainers[2].image }, { name: "Aisha Fernandes", specialty: "Yoga & mobility", city: "Goa", date: "May 16", image: trainers[1].image }];
  return <div className="dashboard-content"><DashboardHeading kicker="MARKETPLACE OPERATIONS" title={<>The <em>control room.</em></>} subtitle="A small set of tools to keep the Forge community thoughtful and trusted." /><div className="stat-grid"><div className="stat-card"><span>ACTIVE COACHES</span><b>124</b><small>+8 this month</small></div><div className="stat-card"><span>CLIENTS</span><b>2,840</b><small>Across India</small></div><div className="stat-card"><span>PROGRAMS LIVE</span><b>86</b><small>3 awaiting review</small></div><div className="stat-card"><span>OPEN APPLICATIONS</span><b>{Math.max(0, 2 - approved.length)}</b><small>Coach applications</small></div></div><section className="dashboard-panel moderation-panel"><div className="panel-heading"><h3>COACH APPLICATIONS</h3><span>REVIEW BEFORE THEY GO LIVE</span></div>{requests.filter((request) => !approved.includes(request.name)).map((request) => <div className="application-row" key={request.name}><Avatar trainer={{ ...trainers[0], image: request.image }} /><span><b>{request.name}</b><small>{request.specialty} · {request.city}</small></span><span>Applied {request.date}</span><button className="button button-outline" onClick={() => notify(`${request.name}'s profile opened`)}>REVIEW PROFILE</button><button className="button button-red" onClick={() => { setApproved([...approved, request.name]); notify(`${request.name} approved for this preview`); }}>APPROVE</button></div>)}{approved.length === 2 && <div className="admin-approved-note"><Icon name="check" size={15} /> All pending coach applications have been reviewed.</div>}</section><div className="admin-bottom"><section className="dashboard-panel"><div className="panel-heading"><h3>CONTENT FLAGS</h3><button onClick={() => notify("No content needs attention")}>VIEW ALL <Icon name="arrow" size={13} /></button></div><div className="admin-empty">All clear. Nothing needs your attention right now.</div></section><section className="dashboard-panel"><div className="panel-heading"><h3>QUICK ACTIONS</h3></div><button className="admin-action" onClick={() => notify("User directory opened in this preview")}><Icon name="users" size={16} /> Manage users <Icon name="chevron" size={14} /></button><button className="admin-action" onClick={() => notify("Program moderation opened in this preview")}><Icon name="book" size={16} /> Review programs <Icon name="chevron" size={14} /></button></section></div></div>;
}
