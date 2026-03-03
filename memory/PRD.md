# Nucleus - Product Requirements Document

## Original Problem Statement
Build Nucleus - a personal command center and second brain productivity app for students. Features include Dashboard, Habit Tracker (90-day grid), Daily Planner, Link Vault, Vocabulary Bank, Ideas Notepad, BQ Practice, and Calorie Tracker. Each module is a "room in a house" with distinct color palettes connected by gold accent (#C9A96E).

## User Personas
- **Primary**: University students who are learning, job hunting, capturing ideas, and building habits
- **Use Cases**: Track habits, plan daily tasks, save links, build vocabulary, capture ideas, practice behavioral questions, track calories

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (local/self-hosted)
- **Auth**: Emergent Google OAuth
- **AI**: Google Gemini 2.0 Flash via Emergent LLM Key (configurable via .env)

## What's Been Implemented - ALL PHASES COMPLETE

### Phase 1 - Complete (March 3, 2026)
- Dashboard - Greeting, daily intention, habit progress ring, stats
- Habit Tracker - 90-day grid, streak counter, freeze days, milestones
- Daily Planner - Pomodoro timer, Eisenhower Matrix, Brain Dump

### Phase 2 - Complete (March 3, 2026)
- Link Vault - 6 categories, 6 sources, status tracking, bulk archive
- Calorie Tracker - AI meal estimation, macro tracking, daily summary

### Phase 3 - Complete (March 3, 2026)
- Vocabulary Bank - 3 mastery levels, AI definitions, Word of the Day
- Ideas Notepad - Kanban pipeline, AI expansion, starred ideas

### Phase 4 - Complete (March 3, 2026)
- BQ Practice - STAR builder, 15 questions, AI feedback, Walk Mode
- Global Search (Cmd+K) - Cross-module search
- Weekly Review - AI-generated summary with stats
- Obsidian Export - Daily notes in markdown
- Full Data Export - JSON backup

### Design System
Each module has unique color palette:
- Dashboard: #FAF7F2 warm ivory
- Habit Tracker: #F4F6F1 sage white  
- Daily Planner: #F0EDE8 aged parchment
- Link Vault: #F2F4F8 cool blue-white
- Vocabulary: #FBF5ED candlelight ivory
- Ideas: #FAFAFA pure white
- BQ Practice: #1C1917 deep charcoal (DARK)
- Calorie Tracker: #F0FAF5 fresh mint

## Future Enhancements
- Obsidian auto-export at 10PM (scheduled job)
- AI Task Prioritization (auto Eisenhower sort)
- Browser extension for link capture
- PWA/mobile install support
